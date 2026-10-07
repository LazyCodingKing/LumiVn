export interface DialogueBeat {
  speaker: string;
  text: string;
  rawText: string;
  expression?: string;
  action?: string;
  sfx?: string;
}

const COMMON_NON_NAMES = new Set([
  "then", "and", "but", "so", "as", "when", "while", "after", "before",
  "suddenly", "however", "meanwhile", "later", "soon", "slowly", "quietly",
  "the", "a", "an", "she", "he", "it", "they", "we", "i", "you"
]);

/**
 * Extracts and strips inline card asset references like `<img cmd="blush">`,
 * `<img="blush">`, `<pimg="blush">`, `{{img::blush}}`, `[expression: blush]`,
 * `[action: fight]`, and `[sfx: punch]`.
 */
export function extractInlineAssets(text: string): {
  cleanText: string;
  expression?: string;
  action?: string;
  sfx?: string;
} {
  let cleanText = text;
  let expression: string | undefined;
  let action: string | undefined;
  let sfx: string | undefined;

  // 1. <img cmd="..." / <pimg cmd="..." / <img="..." / <pimg="..." / <img src="..."
  cleanText = cleanText.replace(/<(?:p?img)\s+[^>]*?cmd=["'“”]([^"'“”]+)["'“”][^>]*>/gi, (_m, val) => {
    expression = val.trim().toLowerCase();
    return "";
  });

  cleanText = cleanText.replace(/<(?:p?img)=["'“”]([^"'“”]+)["'“”]\s*\/?>/gi, (_m, val) => {
    expression = val.trim().toLowerCase();
    return "";
  });

  cleanText = cleanText.replace(/<(?:p?img)\s+[^>]*?src=["'“”]([^"'“”]+)["'“”][^>]*>/gi, (_m, val) => {
    if (!expression) expression = val.trim().toLowerCase();
    return "";
  });

  // 2. {{img::...}}
  cleanText = cleanText.replace(/\{\{\s*img\s*::\s*([^\}]+)\s*\}\}/gi, (_m, val) => {
    expression = val.trim().toLowerCase();
    return "";
  });

  // 3. Bracket tags: [expression: ...], [pose: ...], [action: ...], [sfx: ...]
  cleanText = cleanText.replace(/\[(?:expression|pose|emotion)\s*:\s*([^\]]+)\]/gi, (_m, val) => {
    expression = val.trim().toLowerCase();
    return "";
  });

  cleanText = cleanText.replace(/\[action\s*:\s*([^\]]+)\]/gi, (_m, val) => {
    action = val.trim().toLowerCase();
    return "";
  });

  cleanText = cleanText.replace(/\[sfx\s*:\s*([^\]]+)\]/gi, (_m, val) => {
    sfx = val.trim().toLowerCase();
    return "";
  });

  return {
    cleanText: cleanText.trim(),
    expression,
    action,
    sfx,
  };
}

/**
 * Detects the speaking entity of a text snippet using multi-pattern dialogue heuristics.
 */
function identifySpeaker(
  text: string,
  fallbackSpeaker: string,
  knownActors: string[] = []
): { speaker: string; cleanBody: string } {
  const trimmed = text.trim();

  // 1. Explicit Markdown Prefix: **Name**: "..." or **Name:** "..."
  const boldMatch = trimmed.match(/^\*\*([A-Za-z0-9_\-\s]+?)\*\*[:\s]+([\s\S]*)$/);
  if (boldMatch) {
    const rawName = boldMatch[1]!.replace(/:$/, "").trim();
    return { speaker: rawName, cleanBody: boldMatch[2]!.trim() };
  }

  // 2. Colon prefix: Name: "..."
  const colonMatch = trimmed.match(/^([A-Z][a-zA-Z0-9_\s]{1,24}):\s+([\s\S]*)$/);
  if (colonMatch) {
    return { speaker: colonMatch[1]!.trim(), cleanBody: colonMatch[2]!.trim() };
  }

  // Check if text has dialogue quotes
  const hasQuotes = /["“][\s\S]*?["”]/.test(trimmed);

  if (!hasQuotes) {
    // Pure narrative text without quotes belongs to Narrator
    return { speaker: "Narrator", cleanBody: trimmed };
  }

  // 3. Known Actor priority matching before/after quotes
  if (knownActors.length > 0) {
    for (const actor of knownActors) {
      if (!actor || actor.toLowerCase() === "user" || actor.toLowerCase() === "narrator") continue;
      const escaped = actor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const actorRegex = new RegExp(`\\b${escaped}\\b`, "i");
      if (actorRegex.test(trimmed)) {
        return { speaker: actor, cleanBody: trimmed };
      }
    }
  }

  // 4. Inverted Speech Tag: "..." said/whispered/asked/replied/murmured Name
  const invertedTagMatch = trimmed.match(/["”][^"”\n]*?\b(?:said|whispered|asked|replied|shouted|murmured|muttered|called|snapped|gasped|yelled|laughed|sighed)\s+([A-Z][a-zA-Z0-9_]{1,20})/i);
  if (invertedTagMatch && !COMMON_NON_NAMES.has(invertedTagMatch[1]!.toLowerCase())) {
    return { speaker: invertedTagMatch[1]!.trim(), cleanBody: trimmed };
  }

  // 5. Standard Speech Tag: "..." Name said/whispered/asked/replied
  const standardTagMatch = trimmed.match(/["”][^"”\n]*?\b([A-Z][a-zA-Z0-9_]{1,20})\s+(?:said|whispered|asked|replied|shouted|murmured|muttered|called|snapped|gasped|yelled|laughed|sighed)\b/i);
  if (standardTagMatch && !COMMON_NON_NAMES.has(standardTagMatch[1]!.toLowerCase())) {
    return { speaker: standardTagMatch[1]!.trim(), cleanBody: trimmed };
  }

  // 6. Introductory Action: Name frowned / glanced / stepped... "..."
  const introMatch = trimmed.match(/(?:^|[.!?]\s+)([A-Z][a-zA-Z0-9_]{1,20})\b[^"“\n]*?["“]/);
  if (introMatch && !COMMON_NON_NAMES.has(introMatch[1]!.toLowerCase())) {
    return { speaker: introMatch[1]!.trim(), cleanBody: trimmed };
  }

  // 7. If quotes exist and fallback speaker is a valid character
  if (fallbackSpeaker && fallbackSpeaker !== "Narrator") {
    return { speaker: fallbackSpeaker, cleanBody: trimmed };
  }

  return { speaker: "Narrator", cleanBody: trimmed };
}

export function splitParagraphIntoBeats(
  paragraphs: string[],
  defaultSpeaker = "Narrator",
  knownActors: string[] = []
): DialogueBeat[] {
  const beats: DialogueBeat[] = [];

  for (const para of paragraphs) {
    const raw = para.trim();
    if (!raw) continue;

    // First, extract any inline asset tags (<img cmd="...">, etc.)
    const { cleanText, expression, action, sfx } = extractInlineAssets(raw);
    if (!cleanText) continue;

    // Check if the paragraph has multiple dialogue blocks with distinct speakers
    // Example: Mila frowned. "Wait!" Then Donald yelled, "Go now!"
    const multiSpeakerQuotes = [...cleanText.matchAll(/(?:^|[.!?]\s+)?([A-Z][a-zA-Z0-9_]{1,20}\b[^"“\n]*?["“][\s\S]*?["”][^"“\n]*)/g)];

    if (multiSpeakerQuotes.length > 1) {
      for (const m of multiSpeakerQuotes) {
        const chunk = m[1]?.trim() || "";
        if (!chunk) continue;
        const { speaker, cleanBody } = identifySpeaker(chunk, defaultSpeaker, knownActors);
        beats.push({
          speaker,
          text: cleanBody,
          rawText: chunk,
          expression,
          action,
          sfx,
        });
      }
      continue;
    }

    const { speaker, cleanBody } = identifySpeaker(cleanText, defaultSpeaker, knownActors);

    beats.push({
      speaker,
      text: cleanBody,
      rawText: raw,
      expression,
      action,
      sfx,
    });
  }

  return beats.length > 0 ? beats : [{ speaker: defaultSpeaker, text: "...", rawText: "..." }];
}
