import yaml from "js-yaml";
import type { LedgerData, ActorDossier, PlaceNode, BPlot, Opportunity, JournalEntry } from "../shared/types.js";

const ALL_DETAILS_RE = /<details\b[^>]*>[\s\S]*?<\/details>/gi;
const DETAILS_BLOCK_EXTRACT_RE = /<details\b[^>]*>([\s\S]*?)<\/details>/gi;
const YAML_BLOCK_RE = /```(?:yaml|yml|json)?\s*([\s\S]*?)```/gi;
const THINK_TAGS_RE = /<think\b[^>]*>[\s\S]*?<\/think>/gi;
const DIRECTOR_JSON_RE = /\{[\s\S]*?"director_note"[\s\S]*?\}\s*/gi;
const PLAYER_TRACKING_RE = /\n*(?:Loadout|Attire|Body):[\s\S]*$/i;
const TOON_COMMENT_RE = /<!--\s*toon\b[\s\S]*?-->/gi;
const TOON_BRACKET_RE = /\[toon\b[\s\S]*?\]/gi;

const UNCLOSED_DETAILS_RE = /<details\b[^>]*>[\s\S]*$/gi;

/**
 * Extracts and cleans the narrative prose from the raw assistant message.
 */
export function extractProse(rawContent: string): string {
  let cleaned = (rawContent || "")
    .replace(THINK_TAGS_RE, "")
    .replace(ALL_DETAILS_RE, "")
    .replace(UNCLOSED_DETAILS_RE, "")
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
 * Extracts raw YAML from any details block (State, Ledger, Status, or untagged details).
 */
export function extractLedgerRaw(rawContent: string): string | null {
  if (!rawContent) return null;

  // 1. Try closed details blocks, prioritizing the ledger/state block
  const closedMatches: string[] = [];
  let m: RegExpExecArray | null;
  DETAILS_BLOCK_EXTRACT_RE.lastIndex = 0;
  while ((m = DETAILS_BLOCK_EXTRACT_RE.exec(rawContent)) !== null) {
    if (m[1]) closedMatches.push(m[1]);
  }

  for (const block of closedMatches) {
    if (
      block.includes("actors:") ||
      block.includes('"actors"') ||
      block.includes("scene:") ||
      block.includes('"scene"') ||
      block.includes("clock:") ||
      block.includes('"clock"') ||
      block.includes("passions:") ||
      block.includes("combat:") ||
      block.includes("relations:") ||
      block.includes("world:") ||
      block.includes("places:") ||
      block.includes("alethea:") ||
      block.includes("```yaml") ||
      block.includes("```yml") ||
      block.includes("```json")
    ) {
      return block.replace(/<summary[^>]*>[\s\S]*?<\/summary>/i, "").trim();
    }
  }

  // 2. If no specific keywords matched but closed details exist
  if (closedMatches.length > 0) {
    const candidate = closedMatches[closedMatches.length - 1]!;
    if (!candidate.includes("director_note")) {
      return candidate.replace(/<summary[^>]*>[\s\S]*?<\/summary>/i, "").trim();
    }
  }

  // 3. Fallback for truncated/unclosed details
  const openMatch = rawContent.match(/<details\b[^>]*>([\s\S]*)$/i);
  if (openMatch && openMatch[1]) {
    return openMatch[1].replace(/<summary[^>]*>[\s\S]*?<\/summary>/i, "").trim();
  }

  // 4. Standalone code fence (```yaml or ```json) outside details
  const fenceMatch = rawContent.match(/```(?:yaml|yml|json)?\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    const inner = fenceMatch[1].trim();
    if (inner.includes("scene") || inner.includes("actors") || inner.includes("clock") || inner.includes("ledger")) {
      return inner;
    }
  }

  // 5. Standalone JSON root object
  const trimmed = rawContent.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}") && (trimmed.includes('"scene"') || trimmed.includes('"actors"') || trimmed.includes('"clock"') || trimmed.includes('"ledger"'))) {
    return trimmed;
  }

  return null;
}

export const extractDetailsRaw = extractLedgerRaw;

export function normalizeJournalEntry(entry: any, fallbackId: string = "EVT-1"): JournalEntry {
  if (!entry || typeof entry !== "object") {
    return { id: fallbackId, mutations: [] };
  }

  // Normalize mutations from mutations array or fallback to effects
  let mutations: string[] = [];
  if (Array.isArray(entry.mutations) && entry.mutations.length > 0) {
    mutations = entry.mutations.map((m: any) => String(m));
  } else if (entry.effects) {
    if (typeof entry.effects === "object" && !Array.isArray(entry.effects)) {
      for (const [actorKey, eff] of Object.entries(entry.effects)) {
        if (eff) {
          const actorName = actorKey.replace(/^@/, "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
          mutations.push(`${actorName}: ${String(eff)}`);
        }
      }
    } else if (Array.isArray(entry.effects)) {
      mutations = entry.effects.map((e: any) => String(e));
    } else if (typeof entry.effects === "string" && entry.effects.trim()) {
      mutations = [entry.effects.trim()];
    }
  }

  // Normalize action fallback (if action is empty, fall back to cause or sensory)
  let action = entry.action ? String(entry.action) : "";
  if (!action && entry.cause) {
    action = Array.isArray(entry.cause) ? entry.cause.join("; ") : String(entry.cause);
  } else if (!action && entry.sensory) {
    action = String(entry.sensory);
  }

  return {
    ...entry,
    id: entry.id ? String(entry.id) : fallbackId,
    action,
    mutations,
  };
}

/**
 * Parses the raw Ledger details content into a structured LedgerData object.
 */
export function parseLedgerYaml(rawLedgerText: string): Partial<LedgerData> {
  let combined: Record<string, unknown> = {};

  const trimmed = (rawLedgerText || "").trim();
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        combined = parsed;
      }
    } catch {}
  }

  // Check for markdown code blocks (```yaml ... ``` or ```json ... ```)
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
    // Check if chunk is raw JSON
    const tr = chunk.trim();
    if (tr.startsWith("{") && tr.endsWith("}")) {
      try {
        const parsedJson = JSON.parse(tr);
        if (parsedJson && typeof parsedJson === "object") {
          Object.assign(target, parsedJson);
          return;
        }
      } catch {}
    }

    // Pre-sanitize known formatting quirks
    let sanitizedChunk = chunk
      .replace(/^(\s*[a-zA-Z0-9_-]+):\s*\([^)]*\)/gm, "$1:") // strip parenthetical annotations
      .replace(/^(\s*knowledge):(?!\s)/gm, "$1: ")          // fix unspaced colons
      .replace(/\{([A-Z,\s]{10,})\}/g, "{}");               // sanitize valueless flow maps

    try {
      const parsed = yaml.load(sanitizedChunk);
      if (parsed && typeof parsed === "object") {
        Object.assign(target, parsed);
        return;
      }
    } catch {}

    // Sub-block chunk recovery: parse each root section or actor independently
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
  } else if (Object.keys(combined).length === 0) {
    // If no explicit code fence, clean out headers (## ...) and attempt recovery parse
    const stripped = rawLedgerText
      .split(/\r?\n/)
      .filter((line) => !line.trim().startsWith("#"))
      .join("\n");
    parseYamlChunkWithRecovery(stripped, combined);
  }

  // Flatten nested root wrapper envelopes if present (ledger, state, turn_state, world_state, data, sim)
  for (const envKey of ["ledger", "state", "turn_state", "world_state", "data", "sim"]) {
    if (combined[envKey] && typeof combined[envKey] === "object" && !Array.isArray(combined[envKey])) {
      combined = { ...(combined[envKey] as Record<string, unknown>), ...combined };
    }
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

  // Player Template String Extraction
  const loadoutMatch = rawLedgerText.match(/Loadout:\s*L:\[(.*?)\]\s*R:\[(.*?)\]\s*│\s*Pkt:\[(.*?)\]\s*│\s*Bnk:\[(.*?)\]\s*│\s*Carried:\[(.*?)\]/i);
  if (loadoutMatch) {
    if (!actors["user"]) actors["user"] = { id: "user" };
    if (!actors["user"].inventory) actors["user"].inventory = {};
    actors["user"].inventory.in_hand = { L: loadoutMatch[1], R: loadoutMatch[2] };
    actors["user"].inventory.carried = loadoutMatch[5] ? loadoutMatch[5].split(",").map(s => s.trim()) : [];
  }
  const attireMatch = rawLedgerText.match(/Attire:\s*Top:\[(.*?)\]\s*Bot:\[(.*?)\]\s*UW:\[(.*?)\]\/\[(.*?)\]\s*Shoes:\[(.*?)\]\s*Cond:\[(.*?)\]/i);
  if (attireMatch) {
    if (!actors["user"]) actors["user"] = { id: "user" };
    actors["user"].outfit = {
      top: attireMatch[1],
      bottom: attireMatch[2],
      underwear_top: attireMatch[3],
      underwear_bottom: attireMatch[4],
      shoes: attireMatch[5],
      state: attireMatch[6]
    };
  }

  // Intelligent multi-format normalization:
  // Support custom characters/npcs/cast root keys
  const extraActors = (combined.characters || combined.npcs || combined.cast) as Record<string, unknown> | undefined;
  if (extraActors && typeof extraActors === "object" && !Array.isArray(extraActors)) {
    for (const [aKey, aVal] of Object.entries(extraActors)) {
      if (aVal && typeof aVal === "object" && !Array.isArray(aVal)) {
        actors[aKey] = { id: aKey, ...(aVal as ActorDossier) };
      }
    }
  }

  // Normalize custom stats/attributes into actor stats dictionary
  for (const [key, val] of Object.entries(actors)) {
    const anyVal = val as any;
    if (anyVal["Relationship Network"]?.stats) {
      anyVal.stats = { ...(anyVal.stats || {}), ...anyVal["Relationship Network"].stats };
    } else if (anyVal.relationship_network?.stats) {
      anyVal.stats = { ...(anyVal.stats || {}), ...anyVal.relationship_network.stats };
    }
    // Pull attributes, vitals, parameters, or custom_stats into stats
    const extraStats = anyVal.attributes || anyVal.vitals || anyVal.parameters || anyVal.custom_stats;
    if (extraStats && typeof extraStats === "object" && !Array.isArray(extraStats)) {
      anyVal.stats = { ...(anyVal.stats || {}), ...extraStats };
    }
  }

  const result: Partial<LedgerData> = {
    world: combined.world as Record<string, unknown> | undefined,
    clock: (combined.clock || (combined.time || combined.location ? { t: String(combined.time || ""), location: String(combined.location || "") } : undefined)) as LedgerData["clock"] | undefined,
    scene: combined.scene as LedgerData["scene"] | undefined,
    places: combined.places as Record<string, PlaceNode> | undefined,
    roster: Array.isArray(combined.roster) ? (combined.roster as LedgerData["roster"]) : undefined,
    actors,
    bplots: Array.isArray(combined.bplots) ? (combined.bplots as BPlot[]) : undefined,
    opportunities: Array.isArray(combined.opportunities) ? (combined.opportunities as Opportunity[]) : undefined,
    journal: Array.isArray(combined.journal)
      ? combined.journal.map((e: any, idx: number) => normalizeJournalEntry(e, `EVT-${idx + 1}`))
      : undefined,
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
    journal: [],
  };

  const existingJournal = (base.journal || []).map((e, idx) => normalizeJournalEntry(e, `EVT-${idx + 1}`));
  const newJournal = (delta.journal || []).map((e, idx) => normalizeJournalEntry(e, `EVT-${idx + 1}`));
  const journalMap = new Map<string, JournalEntry>();
  existingJournal.forEach(e => journalMap.set(e.id, e));
  newJournal.forEach(e => journalMap.set(e.id, e));
  merged.journal = Array.from(journalMap.values());

  if (delta.actors) {
    for (const [actorId, actorDelta] of Object.entries(delta.actors)) {
      const baseActor = base.actors?.[actorId] || {};

      // Deep merge relations per target
      const mergedRelations = { ...(baseActor.relations || {}) };
      if (actorDelta.relations) {
        for (const [tgt, rData] of Object.entries(actorDelta.relations)) {
          mergedRelations[tgt] = {
            ...(baseActor.relations?.[tgt] || {}),
            ...(rData as any)
          };
        }
      }

      merged.actors![actorId] = {
        ...baseActor,
        ...actorDelta,
        appearance: { ...(baseActor.appearance || {}), ...(actorDelta.appearance || {}) },
        money: { ...(baseActor.money || {}), ...(actorDelta.money || {}) },
        passions: { ...(baseActor.passions || {}), ...(actorDelta.passions || {}) },
        combat: { ...(baseActor.combat || {}), ...(actorDelta.combat || {}) },
        life_model: { ...(baseActor.life_model || {}), ...(actorDelta.life_model || {}) },
        profile: { ...(baseActor.profile || {}), ...(actorDelta.profile || {}) },
        agency: { ...(baseActor.agency || {}), ...(actorDelta.agency || {}) },
        knowledge: { ...(baseActor.knowledge || {}), ...(actorDelta.knowledge || {}) },
        stats: { ...(baseActor.stats || {}), ...(actorDelta.stats || {}) },
        wounds: { ...(baseActor.wounds || {}), ...(actorDelta.wounds || {}) },
        outfit: {
          ...baseActor.outfit,
          ...actorDelta.outfit,
          accessories: actorDelta.outfit?.accessories || baseActor.outfit?.accessories || [],
          scent: actorDelta.outfit?.scent !== undefined ? actorDelta.outfit.scent : baseActor.outfit?.scent,
          residue: actorDelta.outfit?.residue !== undefined ? actorDelta.outfit.residue : (baseActor.outfit?.residue || []),
          integrity: actorDelta.outfit?.integrity !== undefined ? actorDelta.outfit.integrity : (baseActor.outfit?.integrity ?? 100)
        },
        inventory: {
          ...baseActor.inventory,
          ...actorDelta.inventory,
          in_hand: { ...baseActor.inventory?.in_hand, ...actorDelta.inventory?.in_hand },
          carried: actorDelta.inventory?.carried || baseActor.inventory?.carried || [],
          room: actorDelta.inventory?.room || baseActor.inventory?.room || []
        },
        relations: mergedRelations,
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

