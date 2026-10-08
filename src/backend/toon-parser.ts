import type { LedgerData, SceneState, ActorDossier, ActorPassions } from "../shared/types.js";
import { resolveDominantEmotion, resolveOutfitName } from "./asset-resolver.js";

const TOON_COMMENT_RE = /<!--\s*toon\b([\s\S]*?)-->/i;
const TOON_FENCE_RE = /```(?:toon)?\s*([\s\S]*?)```/i;
const TOON_BRACKET_RE = /\[toon\b([\s\S]*?)\]/i;

/**
 * Maps simple mood names to passions values for compatibility with LedgerData.
 */
export function moodToPassions(mood: string): ActorPassions {
  const clean = (mood || "").toLowerCase().trim();
  switch (clean) {
    case "blush":
    case "horny":
    case "lust":
      return { arousal: 70 };
    case "angry":
    case "rage":
    case "mad":
      return { anger: 60 };
    case "scared":
    case "fear":
    case "shock":
      return { fear: 60 };
    case "smile":
    case "joy":
    case "happy":
    case "laugh":
      return { joy: 60 };
    case "sad":
    case "cry":
    case "sorrow":
      return { sadness: 60 };
    case "suspicious":
    case "doubt":
    case "glare":
      return { suspicion: 60 };
    default:
      return { arousal: 0, anger: 0, fear: 0, joy: 0, sadness: 0, suspicion: 0 };
  }
}

/**
 * Encodes current LedgerData state into compact TOON tabular notation.
 */
export function encodeToonState(ledger: LedgerData | null): string {
  if (!ledger) return "scene: place:default\nactors[0]{id,mood,slot,outfit}:";

  const lines: string[] = [];

  // Scene line
  const place = ledger.scene?.place || "default";
  const time = ledger.clock?.t || ledger.scene?.time || "";
  lines.push(`scene: place:${place}${time ? ` time:${time}` : ""}`);

  // Tabular actors header and rows
  const actorEntries = Object.entries(ledger.actors || {});
  const count = actorEntries.length;
  lines.push(`actors[${count}]{id,mood,slot,outfit}:`);

  for (const [id, actor] of actorEntries) {
    const mood = resolveDominantEmotion(actor.passions);
    const slot = (actor as any).slot || (id === "user" ? "left" : "center");
    const outfit = resolveOutfitName(actor);
    lines.push(` ${id},${mood},${slot},${outfit}`);
  }

  return lines.join("\n");
}

/**
 * Extracts raw TOON delta string from assistant message content.
 */
export function extractToonRaw(content: string): string | null {
  if (!content) return null;

  const commentMatch = TOON_COMMENT_RE.exec(content);
  if (commentMatch && commentMatch[1]) return commentMatch[1].trim();

  const bracketMatch = TOON_BRACKET_RE.exec(content);
  if (bracketMatch && bracketMatch[1]) return bracketMatch[1].trim();

  const fenceMatch = TOON_FENCE_RE.exec(content);
  if (fenceMatch && fenceMatch[1] && /actors\[|scene:/i.test(fenceMatch[1])) {
    return fenceMatch[1].trim();
  }

  return null;
}

/**
 * Parses a TOON formatted string into a partial LedgerData delta.
 */
export function parseToonDelta(toonText: string): Partial<LedgerData> | null {
  if (!toonText || !toonText.trim()) return null;

  const lines = toonText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));

  if (lines.length === 0) return null;

  const result: Partial<LedgerData> = {};
  let currentTable: {
    name: string;
    columns: string[];
  } | null = null;

  for (const line of lines) {
    // 1. Table Header: name[N]{col1,col2,...}:
    const tableHeaderMatch = /^([A-Za-z0-9_]+)\[\d*\]\{([^}]+)\}:?$/.exec(line);
    if (tableHeaderMatch) {
      const tableName = tableHeaderMatch[1]!.toLowerCase();
      const columns = tableHeaderMatch[2]!.split(",").map((c) => c.trim().toLowerCase());
      currentTable = { name: tableName, columns };
      continue;
    }

    // 2. Tabular Row: val1,val2,val3...
    if (currentTable && currentTable.name === "actors" && line.includes(",")) {
      const values = line.split(",").map((v) => v.trim());
      const rowData: Record<string, string> = {};
      currentTable.columns.forEach((col, idx) => {
        rowData[col] = values[idx] || "";
      });

      const actorId = rowData.id || rowData.actor || rowData.name;
      if (actorId) {
        if (!result.actors) result.actors = {};
        const passions = rowData.mood ? moodToPassions(rowData.mood) : undefined;
        const actorDelta: Partial<ActorDossier> = {};

        if (passions) actorDelta.passions = passions;
        if (rowData.outfit) {
          actorDelta.outfit = { state: rowData.outfit, top: rowData.outfit };
        }
        if (rowData.slot) {
          (actorDelta as any).slot = rowData.slot;
        }

        result.actors[actorId] = actorDelta as ActorDossier;
      }
      continue;
    }

    // 3. Single-line Key-Value or sub-properties: scene: place:kitchen time:D1 14:00
    if (/^scene\s*:/i.test(line)) {
      currentTable = null;
      if (!result.scene) result.scene = {};
      const rest = line.replace(/^scene\s*:\s*/i, "").trim();
      const tokens = rest.split(/\s+/);
      for (const token of tokens) {
        const colonIdx = token.indexOf(":");
        if (colonIdx > 0) {
          const k = token.slice(0, colonIdx).toLowerCase();
          const v = token.slice(colonIdx + 1).trim();
          if (k === "place") result.scene.place = v;
          if (k === "time") result.scene.time = v;
          if (k === "weather") result.scene.weather = v;
        } else if (!result.scene.place && token) {
          result.scene.place = token;
        }
      }
      continue;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Returns a tight, self-contained prompt instruction for LLM visual guidance.
 */
export function getToonPromptInstruction(currentLedger: LedgerData | null): string {
  const stateSummary = encodeToonState(currentLedger);
  return `[LumiVN Stage Context]
${stateSummary}

[Visual Novel Directive]
Write the reply as standard narrative prose with natural dialogue.
If the scene location, character expression, or position changes, append an ultra-compact tag at the very end of your reply:
<!--toon
scene: place:<place_id>
actors[N]{id,mood,slot}:
 <actor_id>,<mood>,<slot>
-->
(Valid moods: neutral, smile, blush, angry, sad, scared, suspicious. Slots: left, center, right.)`;
}
