import { TEXT_EFFECT_IDS, escapeHtml, parseTwineChoices } from "../../shared/text-effects.js";

export interface PropTemplateDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  sampleTag: string;
}

export const PROP_TEMPLATES_CATALOG: PropTemplateDef[] = [
  {
    id: "phone",
    name: "Smartphone / SMS",
    icon: "📱",
    description: "Modern dark-mode mobile messenger bubble with sender tag and timestamp.",
    sampleTag: '<prop:phone from="Maya" time="23:14">Hey, are you awake? We need to talk about what happened.</prop:phone>',
  },
  {
    id: "doc",
    name: "Letter / Dossier",
    icon: "📜",
    description: "Parchment document with title header, wax seal stamp, and aged typography.",
    sampleTag: '<prop:doc title="Guild Contract" seal="SEALED">The undersigned party agrees to non-disclosure under penalty of forfeit.</prop:doc>',
  },
  {
    id: "tv",
    name: "TV / Broadcast",
    icon: "📺",
    description: "Retro CRT television monitor with live scanlines and lower-third ticker.",
    sampleTag: '<prop:tv station="K-NEWS 7" ticker="District 4 Substation Offline">Breaking: Severe temporal fluctuations detected in upper district.</prop:tv>',
  },
  {
    id: "notice",
    name: "Corkboard Pin Note",
    icon: "📌",
    description: "Tilted corkboard paper slip with pushpin and author citation.",
    sampleTag: '<prop:notice pin="red" author="Innkeeper">Tavern cellar is strictly off-limits until the exterminator arrives.</prop:notice>',
  },
  {
    id: "poster",
    name: "Wanted / Poster",
    icon: "🤠",
    description: "Distressed bounty or warning poster with bold headline and reward badge.",
    sampleTag: '<prop:poster title="WANTED FOR REBELLION" reward="10,000 Credits">Identity unknown. Approach with extreme caution.</prop:poster>',
  },
  {
    id: "terminal",
    name: "Hacker Console",
    icon: "💻",
    description: "Green phosphor CRT terminal window with prompt header and mono code body.",
    sampleTag: '<prop:terminal user="guest@subnet" path="/sec/archive">Bypassing encryption layer 3... Decrypting payload [OK].</prop:terminal>',
  },
  {
    id: "banner",
    name: "RPG Quest Banner",
    icon: "⚡",
    description: "Visual novel / JRPG event notification banner (quest, danger, loot, status).",
    sampleTag: '<prop:banner type="quest" title="Quest Updated">Investigate the abandoned warehouse on 5th Street.</prop:banner>',
  },
  {
    id: "thought",
    name: "Inner Thought",
    icon: "💭",
    description: "Ethereal translucent thought bubble with glowing accent for internal monologue.",
    sampleTag: '<prop:thought who="Alice">Something feels wrong here. She is deliberately hiding her hands.</prop:thought>',
  },
];

function parsePropAttrs(rawAttrStr: string): Record<string, string> {
  const unescaped = rawAttrStr
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z0-9_-]+)=["']([^"']*)["']|([a-zA-Z0-9_-]+)=([^"'\s>]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(unescaped)) !== null) {
    const key = (m[1] || m[3] || "").toLowerCase();
    const val = m[2] !== undefined ? m[2] : m[4] || "";
    attrs[key] = val;
  }
  return attrs;
}

export function renderPropCard(type: string, attrs: Record<string, string>, content: string): string {
  const normType = (type || "custom").toLowerCase();
  switch (normType) {
    case "phone":
    case "sms":
    case "message": {
      const from = attrs.from || attrs.sender || "Incoming Message";
      const time = attrs.time ? `<span class="vn-prop-phone-time">${attrs.time}</span>` : "";
      return `<div class="vn-prop-card vn-prop-phone"><div class="vn-prop-phone-header"><span class="vn-prop-phone-from">📱 ${from}</span>${time}</div><div class="vn-prop-phone-body">${content}</div></div>`;
    }
    case "doc":
    case "document":
    case "letter":
    case "dossier": {
      const title = attrs.title || attrs.heading || "Official Document";
      const seal = attrs.seal ? `<span class="vn-prop-seal">${attrs.seal}</span>` : "";
      return `<div class="vn-prop-card vn-prop-doc"><div class="vn-prop-doc-header"><span class="vn-prop-doc-title">📜 ${title}</span>${seal}</div><div class="vn-prop-doc-body">${content}</div></div>`;
    }
    case "tv":
    case "broadcast":
    case "news": {
      const station = attrs.station || attrs.channel || "BROADCAST";
      const ticker = attrs.ticker ? `<div class="vn-prop-tv-ticker"><span class="vn-ticker-text">${attrs.ticker}</span></div>` : "";
      return `<div class="vn-prop-card vn-prop-tv"><div class="vn-prop-tv-scanlines"></div><div class="vn-prop-tv-header"><span class="vn-prop-tv-badge">● LIVE</span><span class="vn-prop-tv-station">${station}</span></div><div class="vn-prop-tv-body">${content}</div>${ticker}</div>`;
    }
    case "notice":
    case "note":
    case "memo": {
      const author = attrs.author || attrs.by ? `<span class="vn-prop-notice-author">— ${attrs.author || attrs.by}</span>` : "";
      return `<div class="vn-prop-card vn-prop-notice"><div class="vn-prop-pin">📌</div><div class="vn-prop-notice-body">${content}</div>${author}</div>`;
    }
    case "poster":
    case "wanted":
    case "bounty": {
      const title = attrs.title || "NOTICE";
      const reward = attrs.reward ? `<div class="vn-prop-poster-reward">BOUNTY: ${attrs.reward}</div>` : "";
      return `<div class="vn-prop-card vn-prop-poster"><div class="vn-prop-poster-title">★ ${title} ★</div><div class="vn-prop-poster-body">${content}</div>${reward}</div>`;
    }
    case "terminal":
    case "console": {
      const user = attrs.user || "guest@subnet";
      const path = attrs.path ? `:${attrs.path}` : ":~";
      return `<div class="vn-prop-card vn-prop-terminal"><div class="vn-prop-term-bar">● ● ● [${user}${path}]</div><div class="vn-prop-term-body"><span class="vn-term-prompt">&gt; </span>${content}</div></div>`;
    }
    case "banner":
    case "alert":
    case "quest":
    case "status": {
      const title = attrs.title || "STATUS UPDATE";
      const bType = attrs.type || normType;
      return `<div class="vn-prop-card vn-prop-banner vn-banner-${bType}"><div class="vn-prop-banner-header">⚡ ${title}</div><div class="vn-prop-banner-body">${content}</div></div>`;
    }
    case "thought":
    case "whisper":
    case "internal": {
      const who = attrs.who ? `<span class="vn-prop-thought-who">${attrs.who}:</span> ` : "";
      return `<div class="vn-prop-card vn-prop-thought"><div class="vn-prop-thought-body">💭 <i>${who}${content}</i></div></div>`;
    }
    default: {
      const title = attrs.title || normType.toUpperCase();
      return `<div class="vn-prop-card vn-prop-custom vn-prop-${normType}"><div class="vn-prop-custom-header">📦 ${title}</div><div class="vn-prop-custom-body">${content}</div></div>`;
    }
  }
}

export function formatDialogueHtml(rawText: string): { html: string; hasInlineChoices: boolean } {
  // 1. Process Twine-style [[Label|Action]] or <choice action="...">
  const { cleanText, choices } = parseTwineChoices(rawText);

  // 2. Escape raw prose safely
  let formatted = escapeHtml(cleanText);

  // Unescape the button elements created by parseTwineChoices without double-escaping
  formatted = formatted.replace(
    /&lt;button class=&quot;vn-inline-choice&quot; data-action=&quot;([\s\S]*?)&quot;&gt;([\s\S]*?)&lt;\/button&gt;/g,
    (_m, act, lbl) => {
      const cleanAct = act.replace(/&amp;/g, "&").replace(/&quot;/g, '"');
      const cleanLbl = lbl.replace(/&amp;/g, "&");
      return `<button class="vn-inline-choice" data-action="${cleanAct}">${cleanLbl}</button>`;
    }
  );

  // 3. Process Shorthand Prop Tags: <prop:TAG attr="val">content</prop:TAG>
  formatted = formatted.replace(
    /&lt;prop:([a-zA-Z0-9_-]+)([\s\S]*?)&gt;([\s\S]*?)&lt;\/prop:\1&gt;/gi,
    (_m, tag, rawAttrs, content) => {
      const attrs = parsePropAttrs(rawAttrs);
      return renderPropCard(tag, attrs, content);
    }
  );

  // 4. Process Generic Prop Tags: <prop type="TAG" attr="val">content</prop>
  formatted = formatted.replace(
    /&lt;prop\s+([\s\S]*?)&gt;([\s\S]*?)&lt;\/prop&gt;/gi,
    (_m, rawAttrs, content) => {
      const attrs = parsePropAttrs(rawAttrs);
      const type = attrs.type || "custom";
      return renderPropCard(type, attrs, content);
    }
  );

  for (const tag of TEXT_EFFECT_IDS) {
    const openRe = new RegExp(`&lt;${tag}&gt;`, "gi");
    const closeRe = new RegExp(`&lt;\\/${tag}&gt;`, "gi");
    formatted = formatted
      .replace(openRe, `<span data-vn-text-fx="${tag}">`)
      .replace(closeRe, `</span>`);
  }

  return { html: formatted, hasInlineChoices: choices.length > 0 };
}

export const TEXT_EFFECTS_CSS = `
@keyframes vn-shake {
  0%, 100% { transform: translate(0, 0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(2px, -2px); }
  60% { transform: translate(-2px, -2px); }
  80% { transform: translate(2px, 2px); }
}

@keyframes vn-tremble {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(1px, -1px); }
}

@keyframes vn-wave {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes vn-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes vn-rainbow {
  0% { color: #ff5555; }
  25% { color: #ffb86c; }
  50% { color: #50fa7b; }
  75% { color: #8be9fd; }
  100% { color: #bd93f9; }
}

@keyframes vn-glow {
  0%, 100% { text-shadow: 0 0 4px #8be9fd, 0 0 10px #8be9fd; }
  50% { text-shadow: 0 0 12px #ff79c6, 0 0 20px #ff79c6; }
}

@keyframes vn-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

@keyframes vn-glitch {
  0% { transform: translate(0); text-shadow: none; }
  20% { transform: translate(-2px, 1px); text-shadow: 2px 0 #ff0055, -2px 0 #00ffff; }
  40% { transform: translate(2px, -1px); text-shadow: -2px 0 #ff0055, 2px 0 #00ffff; }
  60% { transform: translate(0); text-shadow: none; }
  80% { transform: translate(1px, 2px); text-shadow: 2px 0 #ff0055; }
  100% { transform: translate(0); text-shadow: none; }
}

@keyframes vn-fade {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

[data-vn-text-fx="shake"] { display: inline-block; animation: vn-shake 0.15s infinite; }
[data-vn-text-fx="tremble"] { display: inline-block; animation: vn-tremble 0.2s infinite ease-in-out; }
[data-vn-text-fx="wave"] { display: inline-block; animation: vn-wave 1.2s infinite ease-in-out; }
[data-vn-text-fx="bounce"] { display: inline-block; animation: vn-bounce 0.6s infinite ease-in-out; }
[data-vn-text-fx="rainbow"] { animation: vn-rainbow 3s linear infinite; }
[data-vn-text-fx="glow"] { animation: vn-glow 2s infinite ease-in-out; }
[data-vn-text-fx="pulse"] { display: inline-block; animation: vn-pulse 1s infinite ease-in-out; }
[data-vn-text-fx="glitch"] { display: inline-block; animation: vn-glitch 0.3s infinite steps(2); }
[data-vn-text-fx="whisper"] { font-size: 0.85em; opacity: 0.75; font-style: italic; }
[data-vn-text-fx="shout"] { font-size: 1.25em; font-weight: 800; display: inline-block; animation: vn-shake 0.1s infinite; color: #ff5555; }
[data-vn-text-fx="fade"] { animation: vn-fade 2s infinite ease-in-out; }

.vn-inline-choice {
  display: inline-block;
  margin: 0 4px;
  padding: 2px 10px;
  background: rgba(99, 102, 241, 0.25);
  border: 1px solid rgba(129, 140, 248, 0.6);
  border-radius: 4px;
  color: #c7d2fe;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.9em;
  transition: all 0.15s ease;
}
.vn-inline-choice:hover {
  background: rgba(99, 102, 241, 0.5);
  border-color: #818cf8;
  color: #ffffff;
  transform: translateY(-1px);
}

/* =========================================================================
   Roleplay Props & Game Cards (HTML/CSS Widgets)
   ========================================================================= */
.vn-prop-card {
  margin: 10px 0;
  border-radius: 8px;
  box-sizing: border-box;
  overflow: hidden;
  font-family: inherit;
  font-size: 0.95em;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.vn-prop-card:hover {
  transform: translateY(-1px);
}

/* 1. Phone / SMS */
.vn-prop-phone {
  background: #090d16;
  border: 1px solid #38bdf8;
  box-shadow: 0 4px 16px rgba(56, 189, 248, 0.18);
  border-radius: 12px;
  padding: 10px 14px;
}
.vn-prop-phone-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  color: #38bdf8;
  border-bottom: 1px solid rgba(56, 189, 248, 0.25);
  padding-bottom: 5px;
  margin-bottom: 8px;
}
.vn-prop-phone-time {
  font-size: 10px;
  color: #64748b;
  font-weight: 500;
}
.vn-prop-phone-body {
  color: #f1f5f9;
  line-height: 1.5;
}

/* 2. Document / Letter */
.vn-prop-doc {
  background: linear-gradient(145deg, #1e2029, #171821);
  border: 1px solid #ca8a04;
  box-shadow: 0 4px 18px rgba(202, 138, 4, 0.15);
  border-radius: 6px;
  padding: 14px 16px;
  font-family: "Georgia", serif;
}
.vn-prop-doc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(202, 138, 4, 0.3);
  padding-bottom: 6px;
  margin-bottom: 10px;
}
.vn-prop-doc-title {
  color: #fde047;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 12px;
}
.vn-prop-seal {
  border: 1px solid #ef4444;
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  padding: 2px 8px;
  font-size: 9px;
  font-weight: 800;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.vn-prop-doc-body {
  color: #fef08a;
  line-height: 1.6;
  font-size: 0.95em;
}

/* 3. TV / Broadcast */
.vn-prop-tv {
  background: #020617;
  border: 2px solid #6366f1;
  border-radius: 8px;
  padding: 12px 14px;
  position: relative;
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.25);
  color: #c7d2fe;
}
.vn-prop-tv-scanlines {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  background: repeating-linear-gradient(0deg, rgba(0,0,0,0.18), rgba(0,0,0,0.18) 1px, transparent 1px, transparent 2px);
  border-radius: 6px;
}
.vn-prop-tv-header {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #334155;
  padding-bottom: 6px;
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 700;
}
.vn-prop-tv-badge {
  background: #ef4444;
  color: #fff;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 9px;
  animation: vn-pulse 1s infinite;
}
.vn-prop-tv-station {
  color: #a5b4fc;
}
.vn-prop-tv-body {
  line-height: 1.5;
  position: relative;
  z-index: 1;
}
.vn-prop-tv-ticker {
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px dashed #475569;
  font-size: 10px;
  color: #f59e0b;
  font-family: monospace;
  font-weight: 600;
}

/* 4. Notice / Sticky Pin */
.vn-prop-notice {
  background: #2a2518;
  border: 1px solid #eab308;
  border-radius: 4px;
  padding: 14px 16px;
  position: relative;
  box-shadow: 2px 4px 12px rgba(0,0,0,0.4);
  transform: rotate(-0.5deg);
}
.vn-prop-pin {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;
}
.vn-prop-notice-body {
  color: #fef9c3;
  line-height: 1.5;
}
.vn-prop-notice-author {
  display: block;
  text-align: right;
  margin-top: 8px;
  font-size: 11px;
  color: #fef08a;
  font-style: italic;
}

/* 5. Poster / Wanted */
.vn-prop-poster {
  background: #1c1917;
  border: 2px solid #78716c;
  border-radius: 4px;
  padding: 14px;
  text-align: center;
  box-shadow: 0 4px 14px rgba(0,0,0,0.5);
}
.vn-prop-poster-title {
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 2px;
  color: #facc15;
  margin-bottom: 8px;
  text-transform: uppercase;
}
.vn-prop-poster-body {
  color: #e7e5e4;
  line-height: 1.5;
  font-size: 0.95em;
}
.vn-prop-poster-reward {
  margin-top: 10px;
  border-top: 1px solid #78716c;
  padding-top: 6px;
  font-weight: 800;
  color: #ef4444;
  font-size: 11px;
  letter-spacing: 1px;
}

/* 6. Terminal / Console */
.vn-prop-terminal {
  background: #000;
  border: 1px solid #22c55e;
  border-radius: 6px;
  padding: 10px 14px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  box-shadow: 0 0 14px rgba(34, 197, 94, 0.2);
}
.vn-prop-term-bar {
  font-size: 10px;
  color: #16a34a;
  border-bottom: 1px solid #14532d;
  padding-bottom: 4px;
  margin-bottom: 8px;
}
.vn-term-prompt {
  color: #22c55e;
  font-weight: 800;
}
.vn-prop-term-body {
  color: #4ade80;
  font-size: 0.9em;
  line-height: 1.5;
}

/* 7. Banner / RPG Quest */
.vn-prop-banner {
  background: linear-gradient(90deg, #1e1b4b, #312e81);
  border-left: 4px solid #a855f7;
  border-radius: 4px;
  padding: 8px 14px;
}
.vn-prop-banner.vn-banner-quest {
  border-left-color: #f59e0b;
  background: linear-gradient(90deg, #451a03, #292524);
}
.vn-prop-banner.vn-banner-danger {
  border-left-color: #ef4444;
  background: linear-gradient(90deg, #450a0a, #1f2937);
}
.vn-prop-banner.vn-banner-success {
  border-left-color: #10b981;
  background: linear-gradient(90deg, #064e3b, #1e293b);
}
.vn-prop-banner-header {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  color: #c084fc;
  letter-spacing: 0.5px;
}
.vn-prop-banner.vn-banner-quest .vn-prop-banner-header { color: #fbbf24; }
.vn-prop-banner.vn-banner-danger .vn-prop-banner-header { color: #f87171; }
.vn-prop-banner.vn-banner-success .vn-prop-banner-header { color: #34d399; }
.vn-prop-banner-body {
  color: #f1f5f9;
  margin-top: 4px;
  font-size: 0.95em;
  line-height: 1.4;
}

/* 8. Inner Thought */
.vn-prop-thought {
  background: rgba(88, 28, 135, 0.2);
  border-left: 3px solid #c084fc;
  border-radius: 4px;
  padding: 8px 12px;
  color: #e9d5ff;
}
.vn-prop-thought-body {
  line-height: 1.5;
}
.vn-prop-thought-who {
  font-weight: 700;
  color: #d8b4fe;
}

/* Custom / Generic fallback */
.vn-prop-custom {
  background: #0f172a;
  border: 1px solid #475569;
  border-radius: 6px;
  padding: 10px 12px;
  color: #e2e8f0;
}
.vn-prop-custom-header {
  font-size: 11px;
  font-weight: 700;
  color: #38bdf8;
  margin-bottom: 6px;
}
`;
