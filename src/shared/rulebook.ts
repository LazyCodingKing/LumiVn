import type { CustomStatDefinition } from "./types.js";
import {
  DEFAULT_STAT_RULES,
  DEFAULT_LEDGER_PROMPT,
  DEFAULT_RPG_PROMPT,
  DEFAULT_DIRECTOR_SYSTEM_PROMPT,
} from "../backend/default-rules.js";

export interface ParsedRulebook {
  directorSystem: string;
  statRules: string;
  rpgPrompt: string;
  ledgerPrompt: string;
  customStats: CustomStatDefinition[];
}

/**
 * Builds a standardized, unified markdown rulebook combining all 4 simulation domains.
 */
export function buildUnifiedRulebook(parts?: {
  director?: string;
  stats?: string;
  rpg?: string;
  ledger?: string;
  customStats?: CustomStatDefinition[];
}): string {
  const director = (parts?.director !== undefined ? parts.director : DEFAULT_DIRECTOR_SYSTEM_PROMPT).trim();
  const stats = (parts?.stats !== undefined ? parts.stats : DEFAULT_STAT_RULES).trim();
  const rpg = (parts?.rpg !== undefined ? parts.rpg : DEFAULT_RPG_PROMPT).trim();
  const ledger = (parts?.ledger !== undefined ? parts.ledger : DEFAULT_LEDGER_PROMPT).trim();
  const customStats = parts?.customStats || [];

  const customStatsBlock = customStats.length > 0
    ? `\n\n### 🛠️ Custom Stats & Vitals\n` +
      customStats.map((c) => `- ${c.name}: default=${c.defaultValue ?? 100} | max=${c.max ?? 100} | cat=${c.category ?? "custom"}`).join("\n")
    : "";

  return `# 📖 UNIFIED SIMULATION RULEBOOK

## 🎬 1. Director Directives
${director}

## 📊 2. Stat Rules & Vitals Matrix
${stats}${customStatsBlock}

## ⚔️ 3. RPG Skills & Progression Rules
${rpg}

## 📜 4. State Ledger Output Schema
${ledger}
`;
}

export const DEFAULT_UNIFIED_RULEBOOK = buildUnifiedRulebook();

/**
 * Intelligently parses user-pasted rulebooks across diverse formats:
 * - Markdown section headers (# Director, ## Stat Rules, ## RPG, ## Ledger)
 * - Bracketed tags ([DIRECTOR], [STATS], [RPG], [LEDGER])
 * - XML tags (<stat_rules>, <details><summary>State</summary>)
 * - Raw JSON or YAML dictionaries
 * - Custom stat bullet points
 */
export function parseUnifiedRulebook(raw: string): ParsedRulebook {
  const text = (raw || "").trim();
  if (!text) {
    return {
      directorSystem: DEFAULT_DIRECTOR_SETTINGS.systemPrompt,
      statRules: DEFAULT_STAT_RULES,
      rpgPrompt: DEFAULT_RPG_PROMPT,
      ledgerPrompt: DEFAULT_LEDGER_PROMPT,
      customStats: [],
    };
  }

  // 1. Try JSON parsing
  if ((text.startsWith("{") && text.endsWith("}")) || (text.startsWith("[") && text.endsWith("]"))) {
    try {
      const obj = JSON.parse(text);
      if (obj && typeof obj === "object" && !Array.isArray(obj)) {
        return {
          directorSystem: obj.director || obj.directorSystem || obj.systemPrompt || DEFAULT_DIRECTOR_SETTINGS.systemPrompt,
          statRules: obj.stats || obj.statRules || DEFAULT_STAT_RULES,
          rpgPrompt: obj.rpg || obj.rpgPrompt || obj.skills || DEFAULT_RPG_PROMPT,
          ledgerPrompt: obj.ledger || obj.ledgerPrompt || obj.schema || DEFAULT_LEDGER_PROMPT,
          customStats: Array.isArray(obj.customStats) ? obj.customStats : [],
        };
      }
    } catch {}
  }

  let directorSystem = "";
  let statRules = "";
  let rpgPrompt = "";
  let ledgerPrompt = "";
  const customStats: CustomStatDefinition[] = [];

  // 2. Bracket tag matches: [DIRECTOR] ... [/DIRECTOR]
  const tagDirector = text.match(/\[DIRECTOR\]([\s\S]*?)\[\/DIRECTOR\]/i);
  if (tagDirector) directorSystem = tagDirector[1]!.trim();

  const tagStats = text.match(/\[STATS?\]([\s\S]*?)\[\/STATS?\]/i);
  if (tagStats) statRules = tagStats[1]!.trim();

  const tagRpg = text.match(/\[RPG\]([\s\S]*?)\[\/RPG\]/i);
  if (tagRpg) rpgPrompt = tagRpg[1]!.trim();

  const tagLedger = text.match(/\[LEDGER\]([\s\S]*?)\[\/LEDGER\]/i);
  if (tagLedger) ledgerPrompt = tagLedger[1]!.trim();

  // 3. Markdown section matches
  // Split by markdown headers ## ... or # ...
  const sectionHeaderRegex = /(?:^|\n)(#{1,3}\s+[^\n]+)/g;
  const sections: Array<{ title: string; body: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let currentTitle = "Header";

  while ((match = sectionHeaderRegex.exec(text)) !== null) {
    const chunk = text.slice(lastIndex, match.index).trim();
    if (chunk || lastIndex > 0) {
      sections.push({ title: currentTitle, body: chunk });
    }
    currentTitle = match[1]!.replace(/^#{1,3}\s+/, "").trim();
    lastIndex = match.index + match[0].length;
  }
  const lastChunk = text.slice(lastIndex).trim();
  if (lastChunk) {
    sections.push({ title: currentTitle, body: lastChunk });
  }

  for (const sec of sections) {
    const t = sec.title.toLowerCase();
    if (/director|world\s*rules|directive/i.test(t)) {
      if (!directorSystem) directorSystem = sec.body;
    } else if (/stat\s*rule|vitals?\s*matrix|psychological|21-stat/i.test(t)) {
      if (!statRules) statRules = sec.body;
    } else if (/rpg|skill|progression|combat\s*rules/i.test(t)) {
      if (!rpgPrompt) rpgPrompt = sec.body;
    } else if (/ledger|state\s*output|schema/i.test(t)) {
      if (!ledgerPrompt) ledgerPrompt = sec.body;
    } else if (/custom\s*stats?/i.test(t)) {
      // Parse custom stats lines
      const lines = sec.body.split("\n");
      for (const line of lines) {
        const m = line.match(/^[-*]?\s*([A-Za-z0-9_]+)\s*[:=]\s*(?:default=)?([0-9]+)?(?:\s*\|\s*max=([0-9]+))?(?:\s*\|\s*cat=([A-Za-z0-9_]+))?/i);
        if (m) {
          customStats.push({
            name: m[1]!,
            defaultValue: m[2] ? parseInt(m[2], 10) : 100,
            max: m[3] ? parseInt(m[3], 10) : 100,
            category: m[4] || "custom",
          });
        }
      }
    }
  }

  // 4. Standalone embedded tag fallbacks if headers did not catch them
  if (!statRules && text.includes("<stat_rules>")) {
    const sr = text.match(/<stat_rules>[\s\S]*?<\/stat_rules>/i);
    if (sr) statRules = sr[0];
  }
  if (!rpgPrompt && (text.includes("【Tree:") || text.includes("RPG & SKILLS"))) {
    const rpgMatch = text.match(/(?:RPG & SKILLS[\s\S]*?|【Tree:[\s\S]*)$/i);
    if (rpgMatch) rpgPrompt = rpgMatch[0];
  }
  if (!ledgerPrompt && text.includes("<details><summary>State</summary>")) {
    const lMatch = text.match(/<details><summary>State<\/summary>[\s\S]*?<\/details>/i);
    if (lMatch) ledgerPrompt = lMatch[0];
  }

  // 5. If still completely missing, preserve intelligent defaults so the engine never breaks
  return {
    directorSystem: directorSystem || DEFAULT_DIRECTOR_SYSTEM_PROMPT,
    statRules: statRules || DEFAULT_STAT_RULES,
    rpgPrompt: rpgPrompt || DEFAULT_RPG_PROMPT,
    ledgerPrompt: ledgerPrompt || DEFAULT_LEDGER_PROMPT,
    customStats,
  };
}
