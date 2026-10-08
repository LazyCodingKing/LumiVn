import yaml from "js-yaml";
import type { LedgerData, ActorDossier, PlaceNode, BPlot, Opportunity, JournalEntry } from "../shared/types.js";

const LEDGER_DETAILS_RE = /<details[^>]*>\s*<summary[^>]*>.*?Ledger.*?<\/summary>([\s\S]*?)<\/details>/i;
const YAML_BLOCK_RE = /```(?:yaml|yml)?\s*([\s\S]*?)```/gi;
const THINK_TAGS_RE = /<think\b[^>]*>[\s\S]*?<\/think>/gi;
const SCENE_LOGIC_RE = /<details[^>]*>\s*<summary[^>]*>.*?Scene Logic.*?<\/summary>[\s\S]*?<\/details>/gi;
const DIRECTOR_DETAILS_RE = /<details[^>]*>\s*<summary[^>]*>.*?Director.*?<\/summary>[\s\S]*?<\/details>/gi;
const DIRECTOR_JSON_RE = /\{[\s\S]*?"director_note"[\s\S]*?\}\s*/gi;
const PLAYER_TRACKING_RE = /\n*(?:Loadout|Attire|Body):[\s\S]*$/i;
const TOON_COMMENT_RE = /<!--\s*toon\b[\s\S]*?-->/gi;
const TOON_BRACKET_RE = /\[toon\b[\s\S]*?\]/gi;

/**
 * Extracts and cleans the narrative prose from the raw assistant message.
 */
export function extractProse(rawContent: string): string {
  let cleaned = (rawContent || "")
    .replace(THINK_TAGS_RE, "")
    .replace(SCENE_LOGIC_RE, "")
    .replace(DIRECTOR_DETAILS_RE, "")
    .replace(LEDGER_DETAILS_RE, "")
    .replace(DIRECTOR_JSON_RE, "")
    .replace(TOON_COMMENT_RE, "")
    .replace(TOON_BRACKET_RE, "")
    .replace(PLAYER_TRACKING_RE, "")
    .trim();

  return cleaned;
}

/**
 * Splits prose into clean paragraphs for the VN typewriter.
 */
export function extractParagraphs(prose: string): string[] {
  return (prose || "")
    .split(/\r?\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/**
 * Determines the active speaker name and text from a paragraph.
 */
export function detectSpeaker(paragraph: string, defaultSpeaker = "Narrator"): { speaker: string; text: string } {
  // Pattern 1: **Name**: "..." or **Name:** "..."
  const boldPrefix = paragraph.match(/^\*\*([A-Za-z0-9_\-\s]+?)\*\*[:\s]+([\s\S]*)$/);
  if (boldPrefix) {
    return { speaker: boldPrefix[1]!.replace(/:$/, "").trim(), text: boldPrefix[2]!.trim() };
  }

  // Pattern 2: Name: "..."
  const colonPrefix = paragraph.match(/^([A-Z][a-zA-Z0-9_\s]{1,24}):\s+([\s\S]*)$/);
  if (colonPrefix) {
    return { speaker: colonPrefix[1]!.trim(), text: colonPrefix[2]!.trim() };
  }

  // Pattern 3: Name followed by narrative action leading to quoted dialogue: Name glanced... "..."
  const actionDialogue = paragraph.match(/^([A-Z][a-zA-Z0-9_]{1,20})\b[^"“]*?["“]([\s\S]*?)["”]/);
  if (actionDialogue) {
    return { speaker: actionDialogue[1]!.trim(), text: paragraph };
  }

  // Pattern 4: Dialogue quotes with speech tag, e.g. "..." Name said.
  const speechTag = paragraph.match(/["”]\s*([A-Z][a-zA-Z0-9_]{1,20})\s+(?:said|whispered|asked|replied|shouted|murmured)/i);
  if (speechTag) {
    return { speaker: speechTag[1]!.trim(), text: paragraph };
  }

  return { speaker: defaultSpeaker, text: paragraph };
}

/**
 * Extracts raw YAML from the My World Ledger block.
 */
export function extractLedgerRaw(rawContent: string): string | null {
  const match = LEDGER_DETAILS_RE.exec(rawContent);
  if (!match) return null;
  return match[1] || "";
}

/**
 * Parses the raw Ledger details content into a structured LedgerData object.
 */
export function parseLedgerYaml(rawLedgerText: string): Partial<LedgerData> {
  let combined: Record<string, unknown> = {};

  // Check for markdown code blocks (```yaml ... ```)
  const codeBlocks: string[] = [];
  let blockMatch: RegExpExecArray | null;
  YAML_BLOCK_RE.lastIndex = 0;
  while ((blockMatch = YAML_BLOCK_RE.exec(rawLedgerText)) !== null) {
    if (blockMatch[1]?.trim()) {
      codeBlocks.push(blockMatch[1].trim());
    }
  }

  function parseYamlChunkWithRecovery(chunk: string, target: Record<string, unknown>): void {
    if (!chunk.trim()) return;
    try {
      const parsed = yaml.load(chunk);
      if (parsed && typeof parsed === "object") {
        Object.assign(target, parsed);
        return;
      }
    } catch {}

    // 1. Sanitization attempt for unescaped quotes inside flow mappings
    try {
      const sanitized = chunk.split("\n").map((line) => {
        const flowMatch = line.match(/^(\s*[a-zA-Z0-9_-]+:\s*\{)(.*)(\}\s*)$/);
        if (flowMatch) {
          const prefix = flowMatch[1];
          const body = flowMatch[2];
          const suffix = flowMatch[3];
          const cleanedBody = body.replace(/([a-zA-Z0-9_-]+:\s*)"([\s\S]*?)"(?=\s*(?:,|\}))/g, (_m, k, val) => {
            return k + "\"" + val.replace(/"/g, "\\\"") + "\"";
          });
          return prefix + cleanedBody + suffix;
        }
        return line;
      }).join("\n");
      const parsed = yaml.load(sanitized);
      if (parsed && typeof parsed === "object") {
        Object.assign(target, parsed);
        return;
      }
    } catch {}

    // 2. Sub-block chunk recovery: parse each root section or actor independently
    const subBlocks = chunk.split(/^(?=[a-zA-Z0-9_-]+:)/m);
    for (const sub of subBlocks) {
      if (!sub.trim()) continue;
      try {
        const parsedSub = yaml.load(sub);
        if (parsedSub && typeof parsedSub === "object") {
          Object.assign(target, parsedSub);
          continue;
        }
      } catch {}

      // Strip problematic nested line (like tells:) and retry sub-block
      const cleanedSub = sub.replace(/^\s*(?:tells|wounds|trauma):\s*\{.*$/gm, "");
      try {
        const parsedSub = yaml.load(cleanedSub);
        if (parsedSub && typeof parsedSub === "object") {
          Object.assign(target, parsedSub);
        }
      } catch {}
    }
  }

  if (codeBlocks.length > 0) {
    for (const block of codeBlocks) {
      parseYamlChunkWithRecovery(block, combined);
    }
  } else {
    // If no explicit code fence, clean out headers (## ...) and attempt recovery parse
    const stripped = rawLedgerText
      .split(/\r?\n/)
      .filter((line) => !line.trim().startsWith("#"))
      .join("\n");
    parseYamlChunkWithRecovery(stripped, combined);
  }

  // Flatten nested "ledger" key if present
  if (combined.ledger && typeof combined.ledger === "object" && !Array.isArray(combined.ledger)) {
    combined = { ...(combined.ledger as Record<string, unknown>), ...combined };
  }

  // Normalize actor dossiers:
  // In My World 1.79, actors may appear as top-level keys in the YAML document,
  // or under 'actors', or 'user' + NPC ids.
  const actors: Record<string, ActorDossier> = {};
  const standardRootKeys = new Set([
    "world",
    "clock",
    "places",
    "travel",
    "roster",
    "scene",
    "fronts",
    "journal",
    "bplots",
    "opportunities",
    "init",
    "ledger",
  ]);

  for (const [key, val] of Object.entries(combined)) {
    if (!standardRootKeys.has(key) && val && typeof val === "object" && !Array.isArray(val)) {
      const obj = val as Record<string, unknown>;
      // If it looks like an actor dossier (has outfit, passions, relations, inventory, or appearance)
      if (obj.outfit || obj.passions || obj.relations || obj.inventory || obj.appearance || key === "user") {
        actors[key] = { id: key, ...(obj as ActorDossier) };
      }
    }
  }

  if (combined.actors && typeof combined.actors === "object" && !Array.isArray(combined.actors)) {
    Object.assign(actors, combined.actors);
  }

  const result: Partial<LedgerData> = {
    world: combined.world as Record<string, unknown> | undefined,
    clock: combined.clock as LedgerData["clock"] | undefined,
    scene: combined.scene as LedgerData["scene"] | undefined,
    places: combined.places as Record<string, PlaceNode> | undefined,
    roster: Array.isArray(combined.roster) ? (combined.roster as LedgerData["roster"]) : undefined,
    actors,
    bplots: Array.isArray(combined.bplots) ? (combined.bplots as BPlot[]) : undefined,
    opportunities: Array.isArray(combined.opportunities) ? (combined.opportunities as Opportunity[]) : undefined,
    journal: Array.isArray(combined.journal) ? (combined.journal as JournalEntry[]) : undefined,
  };

  return result;
}

/**
 * Deep merges cumulative ledger states across turns.
 */
export function deepMergeLedger(base: LedgerData | null, delta: Partial<LedgerData>): LedgerData {
  if (!base) {
    return {
      world: delta.world || {},
      clock: delta.clock || {},
      scene: delta.scene || {},
      places: delta.places || {},
      roster: delta.roster || [],
      actors: delta.actors || {},
      bplots: delta.bplots || [],
      opportunities: delta.opportunities || [],
      journal: delta.journal || [],
    };
  }

  const merged: LedgerData = {
    world: {
      ...base.world,
      ...delta.world,
      ...(base.world?.investigations || delta.world?.investigations
        ? {
            investigations: {
              ...(base.world?.investigations || {}),
              ...(delta.world?.investigations || {}),
            },
          }
        : {}),
    },
    clock: { ...base.clock, ...delta.clock },
    scene: { ...base.scene, ...delta.scene },
    places: { ...base.places, ...delta.places },
    roster: delta.roster && delta.roster.length > 0 ? delta.roster : base.roster || [],
    actors: { ...base.actors },
    bplots: delta.bplots && delta.bplots.length > 0 ? delta.bplots : base.bplots || [],
    opportunities: delta.opportunities && delta.opportunities.length > 0 ? delta.opportunities : base.opportunities || [],
    journal: [...(base.journal || []), ...(delta.journal || [])],
  };

  if (delta.actors) {
    for (const [actorId, actorDelta] of Object.entries(delta.actors)) {
      const baseActor = base.actors?.[actorId] || {};
      merged.actors![actorId] = {
        ...baseActor,
        ...actorDelta,
        appearance: { ...baseActor.appearance, ...actorDelta.appearance },
        money: { ...baseActor.money, ...actorDelta.money },
        passions: { ...baseActor.passions, ...actorDelta.passions },
        outfit: {
          ...baseActor.outfit,
          ...actorDelta.outfit,
          accessories: actorDelta.outfit?.accessories || baseActor.outfit?.accessories || [],
          scent: actorDelta.outfit?.scent !== undefined ? actorDelta.outfit.scent : baseActor.outfit?.scent,
          residue: actorDelta.outfit?.residue !== undefined ? actorDelta.outfit.residue : (baseActor.outfit?.residue || []),
          integrity: actorDelta.outfit?.integrity !== undefined ? actorDelta.outfit.integrity : (baseActor.outfit?.integrity ?? 100),
        },
        inventory: {
          ...baseActor.inventory,
          ...actorDelta.inventory,
          in_hand: { ...baseActor.inventory?.in_hand, ...actorDelta.inventory?.in_hand },
          carried: actorDelta.inventory?.carried || baseActor.inventory?.carried || [],
          room: actorDelta.inventory?.room || baseActor.inventory?.room || [],
        },
        relations: { ...baseActor.relations, ...actorDelta.relations },
      };
    }
  }

  return merged;
}

/**
 * Infers emotion and active speaker deltas directly from pure narrative prose
 * when no structured tags (TOON or Ledger) are emitted by the model.
 */
export function inferProseEmotionDelta(
  prose: string,
  defaultActor = "char"
): Partial<LedgerData> | null {
  if (!prose || !prose.trim()) return null;

  const paragraphs = extractParagraphs(prose);
  if (paragraphs.length === 0) return null;

  // Determine active speaker from latest dialogue or paragraph
  let targetSpeaker = defaultActor;
  for (let i = paragraphs.length - 1; i >= 0; i--) {
    const detected = detectSpeaker(paragraphs[i]!, defaultActor);
    if (detected.speaker && detected.speaker !== "Narrator") {
      targetSpeaker = detected.speaker.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      break;
    }
  }

  const lowerProse = prose.toLowerCase();
  let inferredEmotion: string | null = null;

  if (/\b(blush\w*|fluster\w*|flush\w*|shy\w*|embarrass\w*|heat rises)\b/i.test(lowerProse)) {
    inferredEmotion = "blush";
  } else if (/\b(smile\w*|laugh\w*|giggle\w*|grin\w*|chuckle\w*|warmly)\b/i.test(lowerProse)) {
    inferredEmotion = "smile";
  } else if (/\b(angr\w*|shout\w*|frown\w*|glar\w*|growl\w*|scowl\w*|snarl\w*|fum\w*)\b/i.test(lowerProse)) {
    inferredEmotion = "angry";
  } else if (/\b(scar\w*|fear\w*|trembl\w*|shiver\w*|gasp\w*|wide-eyed|shriek\w*)\b/i.test(lowerProse)) {
    inferredEmotion = "scared";
  } else if (/\b(sad\w*|cr\w*|sob\w*|weep\w*|tear\w*|falter\w*|mourn\w*|sniffl\w*)\b/i.test(lowerProse)) {
    inferredEmotion = "sad";
  } else if (/\b(suspicio\w*|doubt\w*|squint\w*|narrowed eyes)\b/i.test(lowerProse)) {
    inferredEmotion = "suspicious";
  }

  if (!inferredEmotion) return null;

  const passions: Record<string, number> = {
    blush: { arousal: 60 },
    smile: { joy: 60 },
    angry: { anger: 60 },
    scared: { fear: 60 },
    sad: { sadness: 60 },
    suspicious: { suspicion: 60 },
  }[inferredEmotion] || {};

  return {
    actors: {
      [targetSpeaker]: {
        passions,
      } as ActorDossier,
    },
  };
}

