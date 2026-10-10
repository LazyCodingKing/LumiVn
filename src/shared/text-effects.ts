export const TEXT_EFFECT_IDS = [
  "shake",
  "tremble",
  "wave",
  "bounce",
  "rainbow",
  "glow",
  "pulse",
  "glitch",
  "whisper",
  "shout",
  "fade",
] as const;

export type TextEffectId = (typeof TEXT_EFFECT_IDS)[number];

export function isTextEffectId(tag: string): tag is TextEffectId {
  return (TEXT_EFFECT_IDS as readonly string[]).includes(tag.toLowerCase());
}

export function stripTextEffectTags(text: string): string {
  if (!text) return "";
  const tagPattern = new RegExp(`</?(?:${TEXT_EFFECT_IDS.join("|")})\\b[^>]*>`, "gi");
  return text.replace(tagPattern, "");
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface TwineChoice {
  text: string;
  action: string;
}

/**
 * Extracts Twine-style [[Label|Action]] or [[Action]] choices,
 * as well as <choice action="...">Label</choice> tags in exact reading order.
 */
export function parseTwineChoices(text: string): { cleanText: string; choices: TwineChoice[] } {
  const choices: TwineChoice[] = [];
  const combinedRe = /(?:<choice\s+action=["']([^"']+)["']>([\s\S]*?)<\/choice>|\[\[([^\]|]+)(?:\|([^\]]+))?\]\])/gi;

  const cleanText = text.replace(combinedRe, (match, choiceAction, choiceLabel, twineP1, twineP2) => {
    if (choiceAction !== undefined) {
      const act = choiceAction.trim();
      const lbl = choiceLabel.trim() || act;
      choices.push({ text: lbl, action: act });
      return `<button class="vn-inline-choice" data-action="${escapeHtml(act)}">${escapeHtml(lbl)}</button>`;
    } else {
      const lbl = twineP1.trim();
      const act = (twineP2 !== undefined ? twineP2 : twineP1).trim();
      choices.push({ text: lbl, action: act });
      return `<button class="vn-inline-choice" data-action="${escapeHtml(act)}">${escapeHtml(lbl)}</button>`;
    }
  });

  return { cleanText, choices };
}
