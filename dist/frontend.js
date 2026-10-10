// src/shared/text-effects.ts
var TEXT_EFFECT_IDS = [
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
  "fade"
];
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function parseTwineChoices(text) {
  const choices = [];
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

// src/frontend/stage/rich-text.ts
var PROP_TEMPLATES_CATALOG = [
  {
    id: "phone",
    name: "Smartphone / SMS",
    icon: "\uD83D\uDCF1",
    description: "Modern dark-mode mobile messenger bubble with sender tag and timestamp.",
    sampleTag: '<prop:phone from="Maya" time="23:14">Hey, are you awake? We need to talk about what happened.</prop:phone>'
  },
  {
    id: "doc",
    name: "Letter / Dossier",
    icon: "\uD83D\uDCDC",
    description: "Parchment document with title header, wax seal stamp, and aged typography.",
    sampleTag: '<prop:doc title="Guild Contract" seal="SEALED">The undersigned party agrees to non-disclosure under penalty of forfeit.</prop:doc>'
  },
  {
    id: "tv",
    name: "TV / Broadcast",
    icon: "\uD83D\uDCFA",
    description: "Retro CRT television monitor with live scanlines and lower-third ticker.",
    sampleTag: '<prop:tv station="K-NEWS 7" ticker="District 4 Substation Offline">Breaking: Severe temporal fluctuations detected in upper district.</prop:tv>'
  },
  {
    id: "notice",
    name: "Corkboard Pin Note",
    icon: "\uD83D\uDCCC",
    description: "Tilted corkboard paper slip with pushpin and author citation.",
    sampleTag: '<prop:notice pin="red" author="Innkeeper">Tavern cellar is strictly off-limits until the exterminator arrives.</prop:notice>'
  },
  {
    id: "poster",
    name: "Wanted / Poster",
    icon: "\uD83E\uDD20",
    description: "Distressed bounty or warning poster with bold headline and reward badge.",
    sampleTag: '<prop:poster title="WANTED FOR REBELLION" reward="10,000 Credits">Identity unknown. Approach with extreme caution.</prop:poster>'
  },
  {
    id: "terminal",
    name: "Hacker Console",
    icon: "\uD83D\uDCBB",
    description: "Green phosphor CRT terminal window with prompt header and mono code body.",
    sampleTag: '<prop:terminal user="guest@subnet" path="/sec/archive">Bypassing encryption layer 3... Decrypting payload [OK].</prop:terminal>'
  },
  {
    id: "banner",
    name: "RPG Quest Banner",
    icon: "⚡",
    description: "Visual novel / JRPG event notification banner (quest, danger, loot, status).",
    sampleTag: '<prop:banner type="quest" title="Quest Updated">Investigate the abandoned warehouse on 5th Street.</prop:banner>'
  },
  {
    id: "thought",
    name: "Inner Thought",
    icon: "\uD83D\uDCAD",
    description: "Ethereal translucent thought bubble with glowing accent for internal monologue.",
    sampleTag: '<prop:thought who="Alice">Something feels wrong here. She is deliberately hiding her hands.</prop:thought>'
  }
];
function parsePropAttrs(rawAttrStr) {
  const unescaped = rawAttrStr.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").trim();
  const attrs = {};
  const re = /([a-zA-Z0-9_-]+)=["']([^"']*)["']|([a-zA-Z0-9_-]+)=([^"'\s>]+)/g;
  let m;
  while ((m = re.exec(unescaped)) !== null) {
    const key = (m[1] || m[3] || "").toLowerCase();
    const val = m[2] !== undefined ? m[2] : m[4] || "";
    attrs[key] = val;
  }
  return attrs;
}
function renderPropCard(type, attrs, content) {
  const normType = (type || "custom").toLowerCase();
  switch (normType) {
    case "phone":
    case "sms":
    case "message": {
      const from = attrs.from || attrs.sender || "Incoming Message";
      const time = attrs.time ? `<span class="vn-prop-phone-time">${attrs.time}</span>` : "";
      return `<div class="vn-prop-card vn-prop-phone"><div class="vn-prop-phone-header"><span class="vn-prop-phone-from">\uD83D\uDCF1 ${from}</span>${time}</div><div class="vn-prop-phone-body">${content}</div></div>`;
    }
    case "doc":
    case "document":
    case "letter":
    case "dossier": {
      const title = attrs.title || attrs.heading || "Official Document";
      const seal = attrs.seal ? `<span class="vn-prop-seal">${attrs.seal}</span>` : "";
      return `<div class="vn-prop-card vn-prop-doc"><div class="vn-prop-doc-header"><span class="vn-prop-doc-title">\uD83D\uDCDC ${title}</span>${seal}</div><div class="vn-prop-doc-body">${content}</div></div>`;
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
      return `<div class="vn-prop-card vn-prop-notice"><div class="vn-prop-pin">\uD83D\uDCCC</div><div class="vn-prop-notice-body">${content}</div>${author}</div>`;
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
      return `<div class="vn-prop-card vn-prop-thought"><div class="vn-prop-thought-body">\uD83D\uDCAD <i>${who}${content}</i></div></div>`;
    }
    default: {
      const title = attrs.title || normType.toUpperCase();
      return `<div class="vn-prop-card vn-prop-custom vn-prop-${normType}"><div class="vn-prop-custom-header">\uD83D\uDCE6 ${title}</div><div class="vn-prop-custom-body">${content}</div></div>`;
    }
  }
}
function formatDialogueHtml(rawText) {
  const { cleanText, choices } = parseTwineChoices(rawText);
  let formatted = escapeHtml(cleanText);
  formatted = formatted.replace(/&lt;button class=&quot;vn-inline-choice&quot; data-action=&quot;([\s\S]*?)&quot;&gt;([\s\S]*?)&lt;\/button&gt;/g, (_m, act, lbl) => {
    const cleanAct = act.replace(/&amp;/g, "&").replace(/&quot;/g, '"');
    const cleanLbl = lbl.replace(/&amp;/g, "&");
    return `<button class="vn-inline-choice" data-action="${cleanAct}">${cleanLbl}</button>`;
  });
  formatted = formatted.replace(/&lt;prop:([a-zA-Z0-9_-]+)([\s\S]*?)&gt;([\s\S]*?)&lt;\/prop:\1&gt;/gi, (_m, tag, rawAttrs, content) => {
    const attrs = parsePropAttrs(rawAttrs);
    return renderPropCard(tag, attrs, content);
  });
  formatted = formatted.replace(/&lt;prop\s+([\s\S]*?)&gt;([\s\S]*?)&lt;\/prop&gt;/gi, (_m, rawAttrs, content) => {
    const attrs = parsePropAttrs(rawAttrs);
    const type = attrs.type || "custom";
    return renderPropCard(type, attrs, content);
  });
  for (const tag of TEXT_EFFECT_IDS) {
    const openRe = new RegExp(`&lt;${tag}&gt;`, "gi");
    const closeRe = new RegExp(`&lt;\\/${tag}&gt;`, "gi");
    formatted = formatted.replace(openRe, `<span data-vn-text-fx="${tag}">`).replace(closeRe, `</span>`);
  }
  return { html: formatted, hasInlineChoices: choices.length > 0 };
}
var TEXT_EFFECTS_CSS = `
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

// src/frontend/stage/particles.ts
class ParticleEngine {
  canvas;
  ctx = null;
  animId = null;
  particles = [];
  currentPreset = "none";
  width = 0;
  height = 0;
  resizeObserver = null;
  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.className = "vn-particle-canvas";
    this.canvas.style.position = "absolute";
    this.canvas.style.inset = "0";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.pointerEvents = "none";
    this.canvas.style.zIndex = "2";
    this.ctx = this.canvas.getContext("2d");
    this.handleResize = this.handleResize.bind(this);
    this.loop = this.loop.bind(this);
    if (typeof requestAnimationFrame !== "undefined") {
      requestAnimationFrame(() => this.handleResize());
    } else {
      setTimeout(() => this.handleResize(), 0);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("resize", this.handleResize);
    }
  }
  handleResize() {
    const rect = this.canvas.parentElement?.getBoundingClientRect() || {
      width: window.innerWidth,
      height: window.innerHeight
    };
    this.width = rect.width || window.innerWidth;
    this.height = rect.height || window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }
  setWeather(weatherOrPlace) {
    const raw = (weatherOrPlace || "").toLowerCase();
    if (/rain|storm|drizzle|shower|thunder/i.test(raw)) {
      this.setPreset("rain");
    } else if (/snow|blizzard|frost|winter|ice/i.test(raw)) {
      this.setPreset("snow");
    } else if (/cherry|sakura|spring|petal|flower|garden/i.test(raw)) {
      this.setPreset("sakura");
    } else if (/fire|ember|flame|lava|ruins|burning|ash/i.test(raw)) {
      this.setPreset("embers");
    } else if (/night|star|space|mystic|magic|dust|sunlight/i.test(raw)) {
      this.setPreset("dust");
    } else {
      this.setPreset("none");
    }
  }
  setPreset(preset) {
    if (this.currentPreset === preset)
      return;
    this.currentPreset = preset;
    this.particles = [];
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (preset === "none") {
      if (this.ctx)
        this.ctx.clearRect(0, 0, this.width, this.height);
      return;
    }
    this.initParticles();
    this.animId = requestAnimationFrame(this.loop);
  }
  initParticles() {
    const count = this.currentPreset === "rain" ? 100 : this.currentPreset === "sakura" ? 35 : this.currentPreset === "snow" ? 60 : this.currentPreset === "embers" ? 40 : 30;
    for (let i = 0;i < count; i++) {
      this.particles.push(this.createParticle(true));
    }
  }
  createParticle(randomY = false) {
    const w = this.width || window.innerWidth;
    const h = this.height || window.innerHeight;
    const x = Math.random() * w;
    const y = randomY ? Math.random() * h : -20;
    switch (this.currentPreset) {
      case "rain":
        return {
          x,
          y,
          vx: -1.5,
          vy: 14 + Math.random() * 8,
          size: 15 + Math.random() * 12,
          alpha: 0.35 + Math.random() * 0.4,
          color: "rgba(180, 215, 255, "
        };
      case "snow":
        return {
          x,
          y,
          vx: (Math.random() - 0.5) * 1.2,
          vy: 1 + Math.random() * 2,
          size: 2 + Math.random() * 3.5,
          alpha: 0.4 + Math.random() * 0.5,
          color: "rgba(255, 255, 255, ",
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 0.02 + Math.random() * 0.03
        };
      case "sakura":
        return {
          x,
          y,
          vx: 1 + Math.random() * 1.5,
          vy: 1.2 + Math.random() * 1.8,
          size: 6 + Math.random() * 6,
          alpha: 0.65 + Math.random() * 0.3,
          color: "rgba(255, 183, 197, ",
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.04,
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 0.03 + Math.random() * 0.03
        };
      case "embers":
        return {
          x,
          y: randomY ? y : h + 10,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -(1.5 + Math.random() * 2.5),
          size: 2 + Math.random() * 3,
          alpha: 0.6 + Math.random() * 0.4,
          color: Math.random() > 0.4 ? "rgba(255, 120, 40, " : "rgba(255, 210, 60, ",
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 0.04 + Math.random() * 0.04
        };
      case "dust":
      default:
        return {
          x,
          y,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: 1.5 + Math.random() * 2.5,
          alpha: 0.2 + Math.random() * 0.5,
          color: "rgba(255, 235, 180, ",
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 0.01 + Math.random() * 0.02
        };
    }
  }
  loop() {
    if (this.currentPreset === "none" || !this.ctx)
      return;
    this.ctx.clearRect(0, 0, this.width, this.height);
    for (let i = 0;i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.sway !== undefined && p.swaySpeed !== undefined) {
        p.sway += p.swaySpeed;
        p.x += p.vx + Math.sin(p.sway) * 0.8;
      } else {
        p.x += p.vx;
      }
      p.y += p.vy;
      if (p.rotation !== undefined && p.vRot !== undefined) {
        p.rotation += p.vRot;
      }
      this.ctx.fillStyle = `${p.color}${p.alpha})`;
      if (this.currentPreset === "rain") {
        this.ctx.beginPath();
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeStyle = `${p.color}${p.alpha})`;
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(p.x + p.vx * 2, p.y + p.size);
        this.ctx.stroke();
      } else if (this.currentPreset === "sakura" && p.rotation !== undefined) {
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation);
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, p.size * 0.9, p.size * 0.45, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      } else {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
      const isOffscreen = this.currentPreset === "embers" ? p.y < -20 || p.x < -20 || p.x > this.width + 20 : p.y > this.height + 20 || p.x < -30 || p.x > this.width + 30;
      if (isOffscreen) {
        this.particles[i] = this.createParticle(false);
      }
    }
    this.animId = requestAnimationFrame(this.loop);
  }
  destroy() {
    if (this.animId)
      cancelAnimationFrame(this.animId);
    window.removeEventListener("resize", this.handleResize);
    this.canvas.remove();
  }
}

// src/frontend/stage/sprite-transform.ts
var STORAGE_PREFIX = "lumivn_transform_";
function getSpriteTransform(actorId) {
  if (typeof window === "undefined" || !actorId) {
    return { scale: 1, offsetX: 0, offsetY: 0 };
  }
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + actorId.toLowerCase().trim());
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        scale: typeof parsed.scale === "number" ? parsed.scale : 1,
        offsetX: typeof parsed.offsetX === "number" ? parsed.offsetX : 0,
        offsetY: typeof parsed.offsetY === "number" ? parsed.offsetY : 0
      };
    }
  } catch {}
  return { scale: 1, offsetX: 0, offsetY: 0 };
}
function saveSpriteTransform(actorId, transform) {
  if (typeof window === "undefined" || !actorId)
    return;
  try {
    localStorage.setItem(STORAGE_PREFIX + actorId.toLowerCase().trim(), JSON.stringify(transform));
  } catch {}
}

// src/frontend/stage/staging.ts
function normalizeActorString(str) {
  return (str || "").toLowerCase().replace(/[\(\)\[\]"'`~_—–\-]/g, " ").replace(/\s+/g, " ").trim();
}
function isActorMatch(candidate, actorId, actorName) {
  if (!candidate)
    return false;
  const c = normalizeActorString(candidate);
  if (!c || c === "narrator")
    return false;
  const id = normalizeActorString(actorId);
  const name = normalizeActorString(actorName);
  if (c === id || c === name)
    return true;
  const cTokens = c.split(" ");
  const nameTokens = name.split(" ");
  const idTokens = id.split(" ");
  if (cTokens.length === 1) {
    const single = cTokens[0];
    if (nameTokens.includes(single) || idTokens.includes(single))
      return true;
  }
  if (c.length >= 3) {
    if (name.includes(c) || c.includes(name))
      return true;
    if (id.includes(c) || c.includes(id))
      return true;
  }
  return false;
}

class StageRenderer {
  root;
  bgContainer;
  charactersContainer;
  particleEngine;
  currentBgUrl = "";
  constructor() {
    this.root = document.createElement("div");
    this.root.className = "vn-stage";
    this.root.style.position = "relative";
    this.bgContainer = document.createElement("div");
    this.bgContainer.className = "vn-stage-bg";
    this.charactersContainer = document.createElement("div");
    this.charactersContainer.className = "vn-stage-characters";
    this.particleEngine = new ParticleEngine;
    this.root.appendChild(this.bgContainer);
    this.root.appendChild(this.particleEngine.canvas);
    this.root.appendChild(this.charactersContainer);
  }
  setBackground(bg) {
    if (this.currentBgUrl === bg.url)
      return;
    this.currentBgUrl = bg.url;
    this.bgContainer.innerHTML = "";
    if (bg.isVideo) {
      const video = document.createElement("video");
      video.className = "vn-bg-media";
      video.src = bg.url;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      this.bgContainer.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.className = "vn-bg-media";
      img.src = bg.url;
      img.alt = "";
      img.onload = () => {
        console.log(`[LumiVN] Stage background loaded successfully: ${bg.url}`);
      };
      img.onerror = () => {
        console.error(`[LumiVN] Failed to load stage background image: ${bg.url}`);
      };
      this.bgContainer.appendChild(img);
    }
  }
  setWeather(weatherOrPlace) {
    this.particleEngine.setWeather(weatherOrPlace);
  }
  setCharacters(characters) {
    this.charactersContainer.innerHTML = "";
    for (let index = 0;index < characters.length; index++) {
      const char = characters[index];
      const slotEl = document.createElement("div");
      slotEl.className = `vn-char-slot vn-char-${char.slot} ${char.isSpeaker ? "vn-char-speaker" : "vn-char-inactive"}`;
      slotEl.dataset.actorId = char.actorId;
      slotEl.dataset.actorName = char.name;
      slotEl.style.setProperty("--enter-delay", `${index * 0.08}s`);
      const transform = getSpriteTransform(char.actorId);
      this.applyTransformToSlot(slotEl, transform);
      const hasLayers = char.layers && (char.layers.base || char.layers.outfit || char.layers.expression);
      if (hasLayers) {
        const doll = document.createElement("div");
        doll.className = "vn-paper-doll";
        const addLayer = (src, layerClass) => {
          const l = document.createElement("img");
          l.className = `vn-doll-layer ${layerClass}`;
          l.src = src;
          l.alt = "";
          l.onload = () => console.log(`[LumiVN] Layer ${layerClass} loaded for ${char.name}`);
          l.onerror = () => console.error(`[LumiVN] Failed to load layer ${layerClass} for ${char.name}: ${src}`);
          doll.appendChild(l);
        };
        if (char.layers.base)
          addLayer(char.layers.base, "vn-layer-base");
        if (char.layers.underwear)
          addLayer(char.layers.underwear, "vn-layer-underwear");
        if (char.layers.outfit)
          addLayer(char.layers.outfit, "vn-layer-outfit");
        if (char.layers.expression)
          addLayer(char.layers.expression, "vn-layer-expression");
        if (char.layers.accessories)
          addLayer(char.layers.accessories, "vn-layer-accessories");
        slotEl.appendChild(doll);
      } else if (char.spriteUrl) {
        const img = document.createElement("img");
        img.className = "vn-char-sprite";
        img.src = char.spriteUrl;
        img.alt = "";
        img.onload = () => {
          console.log(`[LumiVN] Sprite loaded for ${char.name} (${char.slot}): ${char.spriteUrl}`);
        };
        img.onerror = () => {
          console.error(`[LumiVN] Failed to load sprite image for ${char.name}: ${char.spriteUrl}`);
        };
        slotEl.appendChild(img);
      }
      const nameTag = document.createElement("span");
      nameTag.className = "vn-char-tag";
      nameTag.textContent = char.name;
      slotEl.appendChild(nameTag);
      const touchOverlay = document.createElement("div");
      touchOverlay.className = "vn-touch-overlay";
      const zones = [
        { id: "head", label: "Headpat" },
        { id: "face", label: "Touch cheek" },
        { id: "body", label: "Touch hand" }
      ];
      for (const z of zones) {
        const zoneEl = document.createElement("div");
        zoneEl.className = `vn-touch-zone vn-touch-${z.id}`;
        zoneEl.dataset.zone = z.id;
        zoneEl.title = `${z.label} (${char.name})`;
        zoneEl.addEventListener("click", (e) => {
          e.stopPropagation();
          this.triggerSpriteTouch(slotEl, char, z.id);
        });
        touchOverlay.appendChild(zoneEl);
      }
      slotEl.appendChild(touchOverlay);
      this.charactersContainer.appendChild(slotEl);
    }
  }
  triggerSpriteTouch(slotEl, char, zone) {
    slotEl.classList.remove("vn-touch-bounce");
    slotEl.offsetWidth;
    slotEl.classList.add("vn-touch-bounce");
    const reactions = {
      head: [
        "*leans in softly* ...That feels nice.",
        "*blushes* Hey, don't mess up my hair!",
        "*giggles softly* You always do that.",
        "*soft exhale* ...Warm."
      ],
      face: [
        "*cheeks turn pink* W-what are you staring at?",
        "*blinks rapidly* Ah! Your hands are warm...",
        "*smiles playfully* Looking for something?",
        "*pouts slightly* Hey, no pinching!"
      ],
      body: [
        "*clasps your hand firmly* I'm right here with you.",
        "*steps a bit closer* Ready whenever you are!",
        "*gives a confident nod* Let's make today count.",
        "*chuckles warmly* Always so energetic."
      ]
    };
    const lines = reactions[zone] || reactions.body;
    const line = lines[Math.floor(Math.random() * lines.length)] || lines[0];
    const oldBubble = slotEl.querySelector(".vn-touch-bubble");
    if (oldBubble)
      oldBubble.remove();
    const bubble = document.createElement("div");
    bubble.className = "vn-touch-bubble";
    bubble.innerHTML = `
      <span class="vn-touch-bubble-name">${char.name}</span>
      <span class="vn-touch-bubble-text">${line}</span>
    `;
    slotEl.appendChild(bubble);
    setTimeout(() => {
      bubble.classList.add("vn-touch-bubble-fade");
      setTimeout(() => bubble.remove(), 400);
    }, 2500);
    return line;
  }
  setActiveSpeaker(speakerName) {
    const normSpeaker = (speakerName || "").trim();
    const isNarrator = !normSpeaker || normSpeaker.toLowerCase() === "narrator";
    const slotElements = this.charactersContainer.querySelectorAll(".vn-char-slot");
    slotElements.forEach((slotEl) => {
      const actorId = slotEl.dataset.actorId || "";
      const actorName = slotEl.dataset.actorName || "";
      if (isNarrator) {
        slotEl.classList.remove("vn-char-speaker");
        slotEl.classList.remove("vn-char-inactive");
      } else {
        const isSpeaking = isActorMatch(normSpeaker, actorId, actorName);
        if (isSpeaking) {
          slotEl.classList.remove("vn-char-inactive");
          slotEl.classList.add("vn-char-speaker");
        } else {
          slotEl.classList.remove("vn-char-speaker");
          slotEl.classList.add("vn-char-inactive");
        }
      }
    });
  }
  updateCharacterSprite(actorIdOrName, spriteUrl) {
    if (!spriteUrl)
      return;
    const slotElements = this.charactersContainer.querySelectorAll(".vn-char-slot");
    slotElements.forEach((slotEl) => {
      const actorId = slotEl.dataset.actorId || "";
      const actorName = slotEl.dataset.actorName || "";
      if (isActorMatch(actorIdOrName, actorId, actorName)) {
        const img = slotEl.querySelector(".vn-char-sprite");
        if (img && img.src !== spriteUrl) {
          img.src = spriteUrl;
        }
      }
    });
  }
  setActorTransform(actorId, transform) {
    saveSpriteTransform(actorId, transform);
    const slotElements = this.charactersContainer.querySelectorAll(".vn-char-slot");
    slotElements.forEach((slotEl) => {
      const slotActorId = slotEl.dataset.actorId || "";
      const slotActorName = slotEl.dataset.actorName || "";
      if (isActorMatch(actorId, slotActorId, slotActorName)) {
        this.applyTransformToSlot(slotEl, transform);
      }
    });
  }
  applyTransformToSlot(slotEl, transform) {
    slotEl.style.setProperty("--char-scale", String(transform.scale));
    slotEl.style.setProperty("--char-offset-x", `${transform.offsetX}px`);
    slotEl.style.setProperty("--char-offset-y", `${transform.offsetY}px`);
  }
  reset() {
    this.currentBgUrl = "";
    this.bgContainer.innerHTML = "";
    this.charactersContainer.innerHTML = "";
    this.particleEngine.setWeather("default");
  }
  destroy() {
    this.particleEngine.destroy();
  }
}

// src/frontend/stage/beat-splitter.ts
var COMMON_NON_NAMES = new Set([
  "then",
  "and",
  "but",
  "so",
  "as",
  "when",
  "while",
  "after",
  "before",
  "suddenly",
  "however",
  "meanwhile",
  "later",
  "soon",
  "slowly",
  "quietly",
  "the",
  "a",
  "an",
  "she",
  "he",
  "it",
  "they",
  "we",
  "i",
  "you"
]);
function extractInlineAssets(text) {
  let cleanText = text;
  let expression;
  let action;
  let sfx;
  cleanText = cleanText.replace(/<(?:p?img)\s+[^>]*?cmd=["'“”]([^"'“”]+)["'“”][^>]*>/gi, (_m, val) => {
    expression = val.trim().toLowerCase();
    return "";
  });
  cleanText = cleanText.replace(/<(?:p?img)=["'“”]([^"'“”]+)["'“”]\s*\/?>/gi, (_m, val) => {
    expression = val.trim().toLowerCase();
    return "";
  });
  cleanText = cleanText.replace(/<(?:p?img)\s+[^>]*?src=["'“”]([^"'“”]+)["'“”][^>]*>/gi, (_m, val) => {
    if (!expression)
      expression = val.trim().toLowerCase();
    return "";
  });
  cleanText = cleanText.replace(/\{\{\s*img\s*::\s*([^\}]+)\s*\}\}/gi, (_m, val) => {
    expression = val.trim().toLowerCase();
    return "";
  });
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
    sfx
  };
}
function identifySpeaker(text, fallbackSpeaker, knownActors = []) {
  const trimmed = text.trim();
  const boldMatch = trimmed.match(/^\*\*([A-Za-z0-9_\-\s]+?)\*\*[:\s]+([\s\S]*)$/);
  if (boldMatch) {
    const rawName = boldMatch[1].replace(/:$/, "").trim();
    return { speaker: rawName, cleanBody: boldMatch[2].trim() };
  }
  const colonMatch = trimmed.match(/^([A-Z][a-zA-Z0-9_\s]{1,24}):\s+([\s\S]*)$/);
  if (colonMatch) {
    return { speaker: colonMatch[1].trim(), cleanBody: colonMatch[2].trim() };
  }
  const hasQuotes = /["“][\s\S]*?["”]/.test(trimmed);
  if (!hasQuotes) {
    return { speaker: "Narrator", cleanBody: trimmed };
  }
  if (knownActors.length > 0) {
    for (const actor of knownActors) {
      if (!actor || actor.toLowerCase() === "user" || actor.toLowerCase() === "narrator")
        continue;
      const escaped = actor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const actorRegex = new RegExp(`\\b${escaped}\\b`, "i");
      if (actorRegex.test(trimmed)) {
        return { speaker: actor, cleanBody: trimmed };
      }
    }
  }
  const invertedTagMatch = trimmed.match(/["”][^"”\n]*?\b(?:said|whispered|asked|replied|shouted|murmured|muttered|called|snapped|gasped|yelled|laughed|sighed)\s+([A-Z][a-zA-Z0-9_]{1,20})/i);
  if (invertedTagMatch && !COMMON_NON_NAMES.has(invertedTagMatch[1].toLowerCase())) {
    return { speaker: invertedTagMatch[1].trim(), cleanBody: trimmed };
  }
  const standardTagMatch = trimmed.match(/["”][^"”\n]*?\b([A-Z][a-zA-Z0-9_]{1,20})\s+(?:said|whispered|asked|replied|shouted|murmured|muttered|called|snapped|gasped|yelled|laughed|sighed)\b/i);
  if (standardTagMatch && !COMMON_NON_NAMES.has(standardTagMatch[1].toLowerCase())) {
    return { speaker: standardTagMatch[1].trim(), cleanBody: trimmed };
  }
  const introMatch = trimmed.match(/(?:^|[.!?]\s+)([A-Z][a-zA-Z0-9_]{1,20})\b[^"“\n]*?["“]/);
  if (introMatch && !COMMON_NON_NAMES.has(introMatch[1].toLowerCase())) {
    return { speaker: introMatch[1].trim(), cleanBody: trimmed };
  }
  if (fallbackSpeaker && fallbackSpeaker !== "Narrator") {
    return { speaker: fallbackSpeaker, cleanBody: trimmed };
  }
  return { speaker: "Narrator", cleanBody: trimmed };
}
var PROSE_EMOTION_PATTERNS = [
  { regex: /\b(?:blush(?:ed|ing|es)?|flush(?:ed|ing|es)?|shyly|embarrass(?:ed|ing)?)\b/i, emotion: "blush" },
  { regex: /\b(?:smil(?:ed|ing|es)?|grin(?:ned|ning|s)?|laugh(?:ed|ing|s)?|chuckle(?:d|s|ing)?|beam(?:ed|ing|s)?|giggle(?:d|s|ing)?)\b/i, emotion: "smile" },
  { regex: /\b(?:frown(?:ed|ing|es)?|scowl(?:ed|ing|es)?|glar(?:ed|ing|es)?|growl(?:ed|ing|s)?|snapp(?:ed|ing|s)?|shout(?:ed|ing|s)?|yell(?:ed|ing|s)?|anger|angry)\b/i, emotion: "angry" },
  { regex: /\b(?:gasp(?:ed|ing|s)?|flinch(?:ed|ing|es)?|trembl(?:ed|ing|es)?|startl(?:ed|ing|es)?|terrifi(?:ed|es)?|fear|scared)\b/i, emotion: "fear" },
  { regex: /\b(?:sigh(?:ed|ing|s)?|look(?:ed|ing|s)?\s+down|tear(?:ed|ing)?\s+up|sob(?:bed|bing|s)?|sad(?:ly)?|pensive)\b/i, emotion: "sad" },
  { regex: /\b(?:narrow(?:ed|ing|s)?\s+eyes|rais(?:ed|ing|es)?\s+an?\s+eyebrow|skeptic(?:al)?|suspicious(?:ly)?)\b/i, emotion: "suspicious" }
];
function inferEmotionFromText(text) {
  for (const { regex, emotion } of PROSE_EMOTION_PATTERNS) {
    if (regex.test(text))
      return emotion;
  }
  return;
}
function inferActionFromText(text) {
  const italicMatch = text.match(/\*([A-Za-z0-9_\-\s]{2,30})\*/);
  if (italicMatch && !/^\s*(?:said|whispered|asked|replied)\s*$/i.test(italicMatch[1])) {
    return italicMatch[1].trim().toLowerCase().replace(/\s+/g, "_");
  }
  return;
}
function splitParagraphIntoBeats(paragraphs, defaultSpeaker = "Narrator", knownActors = []) {
  const beats = [];
  for (const para of paragraphs) {
    const raw = para.trim();
    if (!raw)
      continue;
    const { cleanText, expression, action, sfx } = extractInlineAssets(raw);
    if (!cleanText)
      continue;
    const multiSpeakerQuotes = [...cleanText.matchAll(/(?:^|[.!?]\s+)?([A-Z][a-zA-Z0-9_]{1,20}\b[^"“\n]*?["“][\s\S]*?["”][^"“\n]*)/g)];
    if (multiSpeakerQuotes.length > 1) {
      for (const m of multiSpeakerQuotes) {
        const chunk = m[1]?.trim() || "";
        if (!chunk)
          continue;
        const { speaker, cleanBody } = identifySpeaker(chunk, defaultSpeaker, knownActors);
        const inferredExpr = expression || inferEmotionFromText(chunk);
        const inferredAct = action || inferActionFromText(chunk);
        beats.push({
          speaker,
          text: cleanBody,
          rawText: chunk,
          expression: inferredExpr,
          action: inferredAct,
          sfx
        });
      }
      continue;
    }
    const { speaker, cleanBody } = identifySpeaker(cleanText, defaultSpeaker, knownActors);
    const inferredExpr = expression || inferEmotionFromText(raw);
    const inferredAct = action || inferActionFromText(raw);
    beats.push({
      speaker,
      text: cleanBody,
      rawText: raw,
      expression: inferredExpr,
      action: inferredAct,
      sfx
    });
  }
  return beats.length > 0 ? beats : [{ speaker: defaultSpeaker, text: "...", rawText: "..." }];
}

// src/frontend/stage/backlog.ts
class BacklogModal {
  root;
  entriesContainer;
  onEditRequest;
  constructor(onEditRequest) {
    this.onEditRequest = onEditRequest;
    this.root = document.createElement("div");
    this.root.className = "vn-backlog-overlay";
    this.root.style.display = "none";
    const modal = document.createElement("div");
    modal.className = "vn-backlog-modal";
    const header = document.createElement("div");
    header.className = "vn-backlog-header";
    header.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:18px;">\uD83D\uDCDC</span>
        <strong style="font-size:16px; color:var(--vn-accent, #ffd700);">Dialogue Backlog</strong>
      </div>
      <button class="vn-backlog-close-btn" style="background:transparent; border:none; color:#94a3b8; font-size:20px; cursor:pointer;">✕</button>
    `;
    this.entriesContainer = document.createElement("div");
    this.entriesContainer.className = "vn-backlog-list";
    modal.appendChild(header);
    modal.appendChild(this.entriesContainer);
    this.root.appendChild(modal);
    this.root.addEventListener("click", (e) => {
      if (e.target === this.root)
        this.close();
    });
    header.querySelector(".vn-backlog-close-btn")?.addEventListener("click", () => this.close());
  }
  open(entries) {
    this.entriesContainer.innerHTML = "";
    if (entries.length === 0) {
      this.entriesContainer.innerHTML = `<div style="text-align:center; padding:30px; color:#64748b;">No previous dialogue history.</div>`;
    } else {
      for (const entry of entries) {
        const item = document.createElement("div");
        item.className = `vn-backlog-item ${entry.isUser ? "vn-backlog-user" : "vn-backlog-ai"}`;
        item.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <strong style="color:${entry.isUser ? "#38bdf8" : "var(--vn-accent, #ffd700)"}; font-size:13px;">${entry.speaker}</strong>
            <button class="vn-btn-edit-line" style="background:transparent; border:none; color:#64748b; cursor:pointer; font-size:12px;" title="Edit this line">✏️</button>
          </div>
          <div style="font-size:14px; line-height:1.5; color:var(--vn-text, #f8fafc);">${entry.text}</div>
        `;
        item.querySelector(".vn-btn-edit-line")?.addEventListener("click", () => {
          this.onEditRequest?.(entry.messageId, entry.text);
        });
        this.entriesContainer.appendChild(item);
      }
    }
    this.root.style.display = "flex";
    this.entriesContainer.scrollTop = this.entriesContainer.scrollHeight;
  }
  close() {
    this.root.style.display = "none";
  }
}

// src/frontend/stage/choice-modal.ts
class ChoiceModal {
  root;
  choicesContainer;
  promptTitle;
  onSelect;
  constructor(onSelect) {
    this.onSelect = onSelect;
    this.root = document.createElement("div");
    this.root.className = "vn-choice-overlay";
    this.root.style.display = "none";
    const modal = document.createElement("div");
    modal.className = "vn-choice-modal";
    this.promptTitle = document.createElement("div");
    this.promptTitle.className = "vn-choice-title";
    this.promptTitle.textContent = "Make your choice";
    this.choicesContainer = document.createElement("div");
    this.choicesContainer.className = "vn-choice-list";
    modal.appendChild(this.promptTitle);
    modal.appendChild(this.choicesContainer);
    this.root.appendChild(modal);
  }
  show(choices, prompt2 = "Make your choice") {
    this.promptTitle.textContent = prompt2;
    this.choicesContainer.innerHTML = "";
    const pills = ["A", "B", "C", "D", "E", "F"];
    choices.forEach((choice, idx) => {
      const pill = pills[idx % pills.length];
      const btn = document.createElement("button");
      btn.className = "vn-galgame-choice-btn";
      btn.innerHTML = `
        <span class="vn-choice-pill">${pill}</span>
        <span class="vn-choice-label">${choice.label}</span>
        <span class="vn-choice-arrow">▶</span>
      `;
      btn.addEventListener("click", () => {
        this.hide();
        this.onSelect(choice.action);
      });
      this.choicesContainer.appendChild(btn);
    });
    this.root.style.display = "flex";
  }
  hide() {
    this.root.style.display = "none";
  }
}

// src/frontend/stage/dialogue-box.ts
class DialogueBox {
  root;
  nameplate;
  textContainer;
  controlsContainer;
  composerContainer;
  inputField;
  autoBtn;
  skipBtn;
  voiceBtn;
  bgmBtn;
  prevBtn;
  nextBtn;
  choicesContainer;
  beats = [];
  currentBeatIndex = 0;
  isTyping = false;
  typeTimer = null;
  autoPlay = false;
  autoTimer = null;
  isSkipping = false;
  skipTimer = null;
  audioFallbackTimer = null;
  backlogModal;
  choiceModal;
  backlogHistory = [];
  currentMessageId = "";
  onAction;
  onParagraphChange;
  onBeatChange;
  isOverlayActive;
  onKeydown;
  audioEngine;
  ttsEngine;
  knownActors = [];
  isUserTurn = false;
  lastUserText = "";
  constructor(options) {
    this.onAction = options.onAction;
    this.onParagraphChange = options.onParagraphChange;
    this.onBeatChange = options.onBeatChange;
    this.isOverlayActive = options.isOverlayActive;
    this.audioEngine = options.audioEngine;
    this.ttsEngine = options.ttsEngine;
    this.knownActors = options.knownActors || [];
    this.root = document.createElement("div");
    this.root.className = "vn-dialogue-box";
    this.nameplate = document.createElement("div");
    this.nameplate.className = "vn-nameplate";
    this.nameplate.style.display = "none";
    this.textContainer = document.createElement("div");
    this.textContainer.className = "vn-dialogue-text";
    this.controlsContainer = document.createElement("div");
    this.controlsContainer.className = "vn-reading-controls";
    const logBtn = document.createElement("button");
    logBtn.className = "vn-nav-btn vn-log-btn";
    logBtn.innerHTML = "\uD83D\uDCDC Log";
    logBtn.title = "Open Dialogue Backlog";
    logBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.audioEngine?.playSfx("page");
      this.backlogModal.open(this.backlogHistory);
    });
    this.autoBtn = document.createElement("button");
    this.autoBtn.className = "vn-nav-btn vn-auto-btn";
    this.autoBtn.innerHTML = "▶ Auto";
    this.autoBtn.title = "Toggle Autoplay";
    this.autoBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.audioEngine?.playSfx("click");
      this.toggleAutoPlay();
    });
    this.skipBtn = document.createElement("button");
    this.skipBtn.className = "vn-nav-btn vn-skip-btn";
    this.skipBtn.innerHTML = "⏩ Skip";
    this.skipBtn.title = "Fast-forward unread dialogue";
    this.skipBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.audioEngine?.playSfx("click");
      this.toggleSkip();
    });
    this.voiceBtn = document.createElement("button");
    this.voiceBtn.className = "vn-nav-btn vn-voice-btn";
    const voiceOn = this.ttsEngine?.isEnabled() ?? false;
    this.voiceBtn.innerHTML = voiceOn ? "\uD83D\uDD0A Voice" : "\uD83D\uDD07 Voice";
    this.voiceBtn.title = "Toggle Speech Voice";
    this.voiceBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      this.audioEngine?.playSfx("click");
      const active = this.ttsEngine?.toggle() ?? false;
      this.voiceBtn.innerHTML = active ? "\uD83D\uDD0A Voice" : "\uD83D\uDD07 Voice";
      this.voiceBtn.style.color = active ? "var(--vn-accent, #ffd700)" : "#cbd5e1";
      if (active) {
        const conn = await this.ttsEngine?.resolveDefaultConnection();
        if (conn) {
          this.voiceBtn.title = `Voice active (${conn.name || conn.provider})`;
        }
      } else {
        this.voiceBtn.title = "Toggle Speech Voice";
      }
    });
    this.bgmBtn = document.createElement("button");
    this.bgmBtn.className = "vn-nav-btn vn-bgm-btn";
    const bgmOn = this.audioEngine?.isBgmActive() ?? false;
    this.bgmBtn.innerHTML = bgmOn ? "\uD83C\uDFB5 Music" : "\uD83D\uDD07 Music";
    this.bgmBtn.title = "Toggle Background Music (BGM)";
    this.bgmBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.audioEngine?.playSfx("click");
      const active = this.audioEngine?.toggleBgm() ?? false;
      this.bgmBtn.innerHTML = active ? "\uD83C\uDFB5 Music" : "\uD83D\uDD07 Music";
      this.bgmBtn.style.color = active ? "var(--vn-accent, #38bdf8)" : "#cbd5e1";
    });
    this.prevBtn = document.createElement("button");
    this.prevBtn.className = "vn-nav-btn vn-prev-btn";
    this.prevBtn.innerHTML = "◀ Back";
    this.prevBtn.title = "Previous beat (Left Arrow)";
    this.prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.audioEngine?.playSfx("click");
      this.rewind();
    });
    this.nextBtn = document.createElement("button");
    this.nextBtn.className = "vn-nav-btn vn-next-btn";
    this.nextBtn.innerHTML = "Next ▶";
    this.nextBtn.title = "Next beat (Space / Enter)";
    this.nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.audioEngine?.playSfx("click");
      this.advance();
    });
    this.controlsContainer.appendChild(logBtn);
    this.controlsContainer.appendChild(this.autoBtn);
    this.controlsContainer.appendChild(this.skipBtn);
    this.controlsContainer.appendChild(this.voiceBtn);
    this.controlsContainer.appendChild(this.bgmBtn);
    this.controlsContainer.appendChild(this.prevBtn);
    this.controlsContainer.appendChild(this.nextBtn);
    this.choicesContainer = document.createElement("div");
    this.choicesContainer.className = "vn-dialogue-choices";
    this.composerContainer = document.createElement("div");
    this.composerContainer.className = "vn-dialogue-composer";
    this.composerContainer.style.display = "none";
    this.inputField = document.createElement("input");
    this.inputField.type = "text";
    this.inputField.className = "vn-composer-input";
    this.inputField.placeholder = "Type action or dialogue and press Enter...";
    this.inputField.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const val = this.inputField.value.trim();
        if (val) {
          this.inputField.value = "";
          this.composerContainer.style.display = "none";
          this.presentUserParagraph(val, "You", true);
          this.onAction(val);
        }
      }
    });
    const sendBtn = document.createElement("button");
    sendBtn.type = "button";
    sendBtn.className = "vn-composer-send-btn";
    sendBtn.innerHTML = "Send ➤";
    sendBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const val = this.inputField.value.trim();
      if (val) {
        this.inputField.value = "";
        this.composerContainer.style.display = "none";
        this.presentUserParagraph(val, "You", true);
        this.onAction(val);
      }
    });
    this.composerContainer.appendChild(this.inputField);
    this.composerContainer.appendChild(sendBtn);
    this.root.appendChild(this.nameplate);
    this.root.appendChild(this.textContainer);
    this.root.appendChild(this.controlsContainer);
    this.root.appendChild(this.choicesContainer);
    this.root.appendChild(this.composerContainer);
    this.choiceModal = new ChoiceModal((act) => this.onAction(act));
    this.backlogModal = new BacklogModal((msgId, text) => {
      const edited = prompt("Edit dialogue text:", text);
      if (edited && edited !== text) {
        options.onEditMessage?.(msgId, edited);
      }
    });
    this.root.appendChild(this.choiceModal.root);
    this.root.appendChild(this.backlogModal.root);
    this.bindEvents();
  }
  setKnownActors(actors) {
    this.knownActors = actors;
  }
  updateBgmIndicator(active) {
    if (this.bgmBtn) {
      this.bgmBtn.innerHTML = active ? "\uD83C\uDFB5 Music" : "\uD83D\uDD07 Music";
      this.bgmBtn.style.color = active ? "var(--vn-accent, #38bdf8)" : "#cbd5e1";
    }
  }
  bindEvents() {
    this.root.addEventListener("click", (e) => {
      const target = e.target;
      if (target.closest(".vn-dialogue-composer") || target.closest(".vn-reading-controls") || target.closest(".vn-choice-overlay") || target.closest(".vn-backlog-overlay") || target.classList.contains("vn-inline-choice") || target.classList.contains("vn-choice-btn")) {
        if (target.classList.contains("vn-inline-choice")) {
          const act = target.getAttribute("data-action");
          if (act)
            this.onAction(act);
        }
        return;
      }
      this.advance();
    });
    this.onKeydown = (e) => {
      if (this.isOverlayActive && !this.isOverlayActive()) {
        return;
      }
      if (!this.root.isConnected || this.root.offsetParent === null) {
        return;
      }
      const stageOverlay = this.root.closest(".vn-stage-overlay");
      if (stageOverlay && stageOverlay.style.display === "none") {
        return;
      }
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }
      const hudOverlay = document.querySelector(".vn-hud-overlay");
      if (hudOverlay && hudOverlay.style.display !== "none") {
        return;
      }
      const phoneSim = document.querySelector(".vn-phone-simulator");
      if (phoneSim && phoneSim.offsetParent !== null) {
        return;
      }
      const target = e.target;
      if (target?.closest?.(".vn-hud-overlay") || target?.closest?.(".vn-phone-simulator") || target?.closest?.(".vn-hud-modal") || target?.tagName === "CANVAS") {
        return;
      }
      if (e.code === "Space" || e.code === "Enter" || e.code === "ArrowRight") {
        e.preventDefault();
        this.advance();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        this.rewind();
      }
    };
    window.addEventListener("keydown", this.onKeydown);
  }
  reset() {
    if (this.typeTimer)
      clearTimeout(this.typeTimer);
    if (this.autoTimer)
      clearTimeout(this.autoTimer);
    if (this.skipTimer)
      clearTimeout(this.skipTimer);
    if (this.audioFallbackTimer)
      clearTimeout(this.audioFallbackTimer);
    this.audioFallbackTimer = null;
    this.ttsEngine?.stop();
    this.isUserTurn = false;
    this.lastUserText = "";
    this.beats = [];
    this.currentBeatIndex = 0;
    this.backlogHistory = [];
    this.currentMessageId = "";
    this.nameplate.style.display = "none";
    this.nameplate.textContent = "";
    this.textContainer.innerHTML = "";
    this.choicesContainer.innerHTML = "";
    this.composerContainer.style.display = "none";
    this.inputField.value = "";
  }
  showGeneratingIndicator() {
    if (this.typeTimer)
      clearTimeout(this.typeTimer);
    if (this.autoTimer)
      clearTimeout(this.autoTimer);
    if (this.skipTimer)
      clearTimeout(this.skipTimer);
    if (this.audioFallbackTimer)
      clearTimeout(this.audioFallbackTimer);
    this.audioFallbackTimer = null;
    this.ttsEngine?.stop();
    if (this.isUserTurn && this.lastUserText) {
      if (!this.textContainer.querySelector(".vn-generating-indicator")) {
        const ind = document.createElement("div");
        ind.className = "vn-generating-indicator";
        ind.style.cssText = "margin-top:10px;font-size:0.85em;opacity:0.75;display:inline-flex;align-items:center;gap:6px;";
        ind.innerHTML = "<span>✍️</span> <i>Writing next response...</i>";
        this.textContainer.appendChild(ind);
      }
      return;
    }
    this.beats = [];
    this.currentBeatIndex = 0;
    this.nameplate.style.display = "none";
    this.textContainer.innerHTML = `<span class="vn-generating-indicator" style="opacity:0.75;display:inline-flex;align-items:center;gap:8px;"><span>✍️</span> <i>Writing next response...</i></span>`;
    this.choicesContainer.innerHTML = "";
    this.composerContainer.style.display = "none";
  }
  presentUserParagraph(text, speaker = "You", isWaiting = true) {
    if (this.typeTimer)
      clearTimeout(this.typeTimer);
    if (this.autoTimer)
      clearTimeout(this.autoTimer);
    if (this.skipTimer)
      clearTimeout(this.skipTimer);
    if (this.audioFallbackTimer)
      clearTimeout(this.audioFallbackTimer);
    this.audioFallbackTimer = null;
    this.ttsEngine?.stop();
    this.audioEngine?.unduckBgm();
    this.isUserTurn = true;
    this.lastUserText = text;
    this.beats = [];
    this.currentBeatIndex = 0;
    this.nameplate.textContent = speaker || "You";
    this.nameplate.style.display = "block";
    const { html } = formatDialogueHtml(text);
    const waitingHtml = isWaiting ? `<div class="vn-generating-indicator" style="margin-top:10px;font-size:0.85em;opacity:0.75;display:inline-flex;align-items:center;gap:6px;"><span>✍️</span> <i>Writing next response...</i></div>` : "";
    this.textContainer.innerHTML = `<div>${html}</div>${waitingHtml}`;
    this.choicesContainer.innerHTML = "";
    this.composerContainer.style.display = "none";
    this.nextBtn.style.display = "none";
    this.prevBtn.disabled = true;
    this.backlogHistory.push({
      messageId: "user-" + Date.now(),
      speaker: speaker || "You",
      text,
      isUser: true
    });
  }
  setContent(speakerName, paragraphs, messageId = "") {
    if (this.typeTimer)
      clearTimeout(this.typeTimer);
    if (this.autoTimer)
      clearTimeout(this.autoTimer);
    if (this.skipTimer)
      clearTimeout(this.skipTimer);
    this.ttsEngine?.stop();
    this.audioEngine?.unduckBgm();
    this.isUserTurn = false;
    this.lastUserText = "";
    this.currentMessageId = messageId;
    this.beats = splitParagraphIntoBeats(paragraphs, speakerName, this.knownActors);
    this.currentBeatIndex = 0;
    this.composerContainer.style.display = "none";
    this.choicesContainer.innerHTML = "";
    this.inputField.value = "";
    if (this.beats.length === 0) {
      this.nameplate.style.display = "none";
      this.nameplate.textContent = "";
      this.textContainer.innerHTML = `<span style="opacity:0.55;font-style:italic;">Start a conversation to begin the visual novel scene.</span>`;
      return;
    }
    for (const b of this.beats) {
      this.backlogHistory.push({
        messageId,
        speaker: b.speaker,
        text: b.text,
        isUser: b.speaker.toLowerCase() === "user"
      });
    }
    if (this.ttsEngine?.isEnabled()) {
      for (const b of this.beats) {
        if (b.text)
          this.ttsEngine.prefetch(b.text, b.speaker).catch(() => {});
      }
    }
    this.renderCurrentBeat();
  }
  advance() {
    if (this.audioFallbackTimer) {
      clearTimeout(this.audioFallbackTimer);
      this.audioFallbackTimer = null;
    }
    if (this.isTyping) {
      if (this.typeTimer)
        clearTimeout(this.typeTimer);
      this.isTyping = false;
      const beat = this.beats[this.currentBeatIndex];
      if (beat)
        this.textContainer.innerHTML = formatDialogueHtml(beat.text).html;
      this.onBeatSettled();
      return;
    }
    if (this.currentBeatIndex < this.beats.length - 1) {
      this.currentBeatIndex++;
      this.renderCurrentBeat();
    }
  }
  rewind() {
    if (this.currentBeatIndex > 0) {
      if (this.typeTimer)
        clearTimeout(this.typeTimer);
      if (this.autoTimer)
        clearTimeout(this.autoTimer);
      if (this.skipTimer)
        clearTimeout(this.skipTimer);
      if (this.audioFallbackTimer) {
        clearTimeout(this.audioFallbackTimer);
        this.audioFallbackTimer = null;
      }
      this.ttsEngine?.stop();
      this.isTyping = false;
      this.currentBeatIndex--;
      this.renderCurrentBeat();
    }
  }
  renderCurrentBeat() {
    const beat = this.beats[this.currentBeatIndex];
    if (!beat)
      return;
    if (beat.speaker && beat.speaker.toLowerCase() !== "narrator") {
      this.nameplate.textContent = beat.speaker;
      this.nameplate.style.display = "block";
    } else {
      this.nameplate.style.display = "none";
    }
    this.onParagraphChange?.(this.currentBeatIndex, beat.speaker);
    this.onBeatChange?.(beat, this.currentBeatIndex);
    if (beat.sfx) {
      this.audioEngine?.playSfx(beat.sfx);
    }
    const { html } = formatDialogueHtml(beat.text);
    this.prevBtn.disabled = this.currentBeatIndex === 0;
    if (this.isSkipping || html.includes("vn-prop-card")) {
      this.isTyping = false;
      this.textContainer.innerHTML = html;
      this.onBeatSettled();
      if (html.includes("vn-prop-card") && this.ttsEngine?.isEnabled()) {
        this.ttsEngine.speak(beat.text, beat.speaker);
      }
      return;
    }
    this.isTyping = true;
    this.textContainer.innerHTML = "";
    const temp = document.createElement("div");
    temp.innerHTML = html;
    const plain = temp.textContent || beat.text;
    let charIdx = 0;
    let hasStartedTyping = false;
    let stepDelay = 20;
    const startTypewriter = (audioDuration) => {
      if (hasStartedTyping || !this.isTyping)
        return;
      hasStartedTyping = true;
      if (audioDuration && audioDuration > 0 && plain.length > 0) {
        stepDelay = Math.max(10, Math.min(80, audioDuration * 1000 / (plain.length / 2)));
      }
      tick();
    };
    const tick = () => {
      if (!this.isTyping)
        return;
      charIdx += 2;
      if (charIdx % 6 === 0) {
        this.audioEngine?.playSfx("type");
      }
      if (charIdx >= plain.length) {
        this.textContainer.innerHTML = html;
        this.isTyping = false;
        this.onBeatSettled();
      } else {
        this.textContainer.textContent = plain.substring(0, charIdx);
        this.typeTimer = window.setTimeout(tick, stepDelay);
      }
    };
    if (this.ttsEngine?.isEnabled()) {
      if (this.audioFallbackTimer)
        clearTimeout(this.audioFallbackTimer);
      let hasStartedAudio = false;
      this.audioFallbackTimer = window.setTimeout(() => {
        this.audioFallbackTimer = null;
        if (!hasStartedAudio) {
          startTypewriter();
        }
      }, 3500);
      this.audioEngine?.duckBgm();
      this.ttsEngine.speak(beat.text, beat.speaker, {
        onStart: (duration) => {
          this.audioEngine?.duckBgm();
          hasStartedAudio = true;
          if (this.audioFallbackTimer) {
            clearTimeout(this.audioFallbackTimer);
            this.audioFallbackTimer = null;
          }
          startTypewriter(duration);
        },
        onBoundary: (wordCharIdx) => {
          if (wordCharIdx > charIdx) {
            charIdx = wordCharIdx;
            this.textContainer.textContent = plain.substring(0, charIdx);
          }
        },
        onEnd: () => {
          this.audioEngine?.unduckBgm();
          if (this.isTyping) {
            this.textContainer.innerHTML = html;
            this.isTyping = false;
            this.onBeatSettled();
          } else if (this.autoPlay) {
            this.advance();
          }
        },
        onError: () => {
          this.audioEngine?.unduckBgm();
          if (this.audioFallbackTimer) {
            clearTimeout(this.audioFallbackTimer);
            this.audioFallbackTimer = null;
          }
          startTypewriter();
        }
      });
    } else {
      startTypewriter();
    }
  }
  onBeatSettled() {
    const isLast = this.currentBeatIndex >= this.beats.length - 1;
    this.nextBtn.style.display = isLast ? "none" : "inline-block";
    if (isLast) {
      this.composerContainer.style.display = "flex";
      this.inputField.focus();
      if (this.autoPlay)
        this.toggleAutoPlay();
      if (this.isSkipping)
        this.toggleSkip();
    } else if (this.isSkipping) {
      this.skipTimer = window.setTimeout(() => this.advance(), 100);
    } else if (this.autoPlay && !this.ttsEngine?.isEnabled()) {
      const beat = this.beats[this.currentBeatIndex];
      const charCount = beat?.text.length || 20;
      const puncts = (beat?.text.match(/[.,!?;:、。！？]/g) || []).length;
      const delay = Math.max(1600, Math.min(8000, charCount / 240 * 60000 + puncts * 250));
      this.autoTimer = window.setTimeout(() => this.advance(), delay);
    }
  }
  toggleAutoPlay() {
    this.autoPlay = !this.autoPlay;
    if (this.autoPlay && this.isSkipping)
      this.toggleSkip();
    this.autoBtn.innerHTML = this.autoPlay ? "⏸ Pause" : "▶ Auto";
    this.autoBtn.style.color = this.autoPlay ? "var(--vn-accent, #ffd700)" : "#cbd5e1";
    if (this.autoPlay && !this.isTyping) {
      this.onBeatSettled();
    } else if (!this.autoPlay && this.autoTimer) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }
  }
  toggleSkip() {
    this.isSkipping = !this.isSkipping;
    if (this.isSkipping && this.autoPlay)
      this.toggleAutoPlay();
    this.skipBtn.innerHTML = this.isSkipping ? "⏹ Stop" : "⏩ Skip";
    this.skipBtn.style.color = this.isSkipping ? "var(--vn-accent, #ffd700)" : "#cbd5e1";
    if (this.isSkipping) {
      this.advance();
    } else if (this.skipTimer) {
      clearTimeout(this.skipTimer);
      this.skipTimer = null;
    }
  }
  showChoices(choices, prompt2 = "Make your choice") {
    if (this.isSkipping)
      this.toggleSkip();
    if (this.autoPlay)
      this.toggleAutoPlay();
    this.choiceModal.show(choices, prompt2);
  }
  destroy() {
    if (this.onKeydown) {
      window.removeEventListener("keydown", this.onKeydown);
      this.onKeydown = undefined;
    }
    if (this.typeTimer)
      clearTimeout(this.typeTimer);
    if (this.autoTimer)
      clearTimeout(this.autoTimer);
    if (this.skipTimer)
      clearTimeout(this.skipTimer);
    this.ttsEngine?.stop();
    this.choiceModal.root.remove();
    this.backlogModal.root.remove();
  }
}

// src/frontend/hud/asset-picker.ts
function openAssetPicker(options) {
  const items = [];
  const seenUrls = new Set;
  if (options.manifest?.library) {
    for (const item of options.manifest.library) {
      if (item.url && !seenUrls.has(item.url)) {
        items.push(item);
        seenUrls.add(item.url);
      }
    }
  }
  if (options.manifest?.places) {
    for (const [key, url] of Object.entries(options.manifest.places)) {
      if (url && !seenUrls.has(url)) {
        items.push({
          id: `place_${key}`,
          name: `\uD83D\uDCCD ${key}`,
          url,
          category: "places",
          placeId: key,
          uploadedAt: new Date().toISOString()
        });
        seenUrls.add(url);
      }
    }
  }
  if (options.manifest?.characters) {
    for (const [actorId, actorData] of Object.entries(options.manifest.characters)) {
      if (!actorData || typeof actorData !== "object")
        continue;
      const outfits = actorData.outfits || actorData;
      if (outfits && typeof outfits === "object") {
        for (const [outfit, exprs] of Object.entries(outfits)) {
          if (exprs && typeof exprs === "object") {
            for (const [expr, url] of Object.entries(exprs)) {
              if (url && typeof url === "string" && !seenUrls.has(url)) {
                items.push({
                  id: `char_${actorId}_${outfit}_${expr}`,
                  name: `\uD83D\uDC64 ${actorId} (${outfit}/${expr})`,
                  url,
                  category: "characters",
                  actorId,
                  outfit,
                  expression: expr,
                  uploadedAt: new Date().toISOString()
                });
                seenUrls.add(url);
              }
            }
          }
        }
      }
      if (actorData.actions) {
        for (const [act, url] of Object.entries(actorData.actions)) {
          if (url && typeof url === "string" && !seenUrls.has(url)) {
            items.push({
              id: `act_${actorId}_${act}`,
              name: `⚡ ${actorId} [${act}]`,
              url,
              category: "actions",
              actorId,
              uploadedAt: new Date().toISOString()
            });
            seenUrls.add(url);
          }
        }
      }
    }
  }
  const modalOverlay = document.createElement("div");
  modalOverlay.className = "vn-asset-picker-overlay";
  modalOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(2, 6, 23, 0.75);
    backdrop-filter: blur(4px);
    z-index: 100000;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  `;
  const modalBox = document.createElement("div");
  modalBox.style.cssText = `
    background: #0f172a;
    border: 1px solid #38bdf8;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
    width: 600px;
    max-width: 90vw;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `;
  const close = () => {
    if (modalOverlay.parentElement) {
      modalOverlay.parentElement.removeChild(modalOverlay);
    }
  };
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay)
      close();
  });
  const header = document.createElement("div");
  header.style.cssText = `
    padding: 12px 16px;
    background: #1e293b;
    border-bottom: 1px solid #334155;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  header.innerHTML = `
    <div>
      <h3 style="margin: 0; font-size: 15px; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
        <span>\uD83D\uDDBC️</span> <span>${options.title || "Reusable Asset Library"}</span>
      </h3>
      <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
        ${items.length} saved asset${items.length === 1 ? "" : "s"} ready to assign
      </div>
    </div>
    <button id="vn-picker-close-btn" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer; padding: 4px;">✕</button>
  `;
  header.querySelector("#vn-picker-close-btn")?.addEventListener("click", close);
  modalBox.appendChild(header);
  let activeFilter = options.category || "all";
  const filterBar = document.createElement("div");
  filterBar.style.cssText = `
    padding: 8px 16px;
    background: #0b1120;
    border-bottom: 1px solid #1e293b;
    display: flex;
    gap: 8px;
    align-items: center;
  `;
  const renderFilterButtons = () => {
    filterBar.innerHTML = `
      <span style="font-size: 11px; color: #64748b;">Filter:</span>
      <button class="vn-picker-filter-btn" data-filter="all" style="background: ${activeFilter === "all" ? "#38bdf8" : "#1e293b"}; color: ${activeFilter === "all" ? "#0f172a" : "#cbd5e1"}; border: 1px solid #334155; border-radius: 4px; padding: 2px 8px; font-size: 11px; cursor: pointer; font-weight: ${activeFilter === "all" ? "700" : "500"};">All (${items.length})</button>
      <button class="vn-picker-filter-btn" data-filter="characters" style="background: ${activeFilter === "characters" ? "#38bdf8" : "#1e293b"}; color: ${activeFilter === "characters" ? "#0f172a" : "#cbd5e1"}; border: 1px solid #334155; border-radius: 4px; padding: 2px 8px; font-size: 11px; cursor: pointer; font-weight: ${activeFilter === "characters" ? "700" : "500"};">\uD83D\uDC64 Characters</button>
      <button class="vn-picker-filter-btn" data-filter="places" style="background: ${activeFilter === "places" ? "#38bdf8" : "#1e293b"}; color: ${activeFilter === "places" ? "#0f172a" : "#cbd5e1"}; border: 1px solid #334155; border-radius: 4px; padding: 2px 8px; font-size: 11px; cursor: pointer; font-weight: ${activeFilter === "places" ? "700" : "500"};">\uD83D\uDCCD Places</button>
    `;
    filterBar.querySelectorAll(".vn-picker-filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeFilter = btn.dataset.filter || "all";
        renderFilterButtons();
        renderGrid();
      });
    });
  };
  renderFilterButtons();
  modalBox.appendChild(filterBar);
  const contentArea = document.createElement("div");
  contentArea.style.cssText = `
    padding: 14px 16px;
    overflow-y: auto;
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  `;
  const renderGrid = () => {
    contentArea.innerHTML = "";
    const filtered = items.filter((it) => {
      if (activeFilter === "all")
        return true;
      if (activeFilter === "characters")
        return it.category === "characters" || it.actorId || it.name.startsWith("\uD83D\uDC64");
      if (activeFilter === "places")
        return it.category === "places" || it.placeId || it.name.startsWith("\uD83D\uDCCD");
      return true;
    });
    if (filtered.length === 0) {
      contentArea.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: #64748b; font-size: 12px; padding: 40px 10px;">
          No matching uploaded assets found in this category.
        </div>
      `;
      return;
    }
    for (const item of filtered) {
      const card = document.createElement("div");
      card.style.cssText = `
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        transition: transform 0.15s, border-color 0.15s;
      `;
      card.addEventListener("mouseenter", () => {
        card.style.borderColor = "#38bdf8";
        card.style.transform = "scale(1.03)";
      });
      card.addEventListener("mouseleave", () => {
        card.style.borderColor = "#334155";
        card.style.transform = "scale(1)";
      });
      card.innerHTML = `
        <div style="width: 100%; height: 96px; background: #020617; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative;">
          <img src="${item.url}" style="width: 100%; height: 100%; object-fit: cover;" alt="${item.name}" onerror="this.style.display='none'" />
        </div>
        <div style="padding: 6px; font-size: 11px; text-align: center; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; background: #1e293b;">
          ${item.name}
        </div>
      `;
      card.addEventListener("click", () => {
        options.onSelect(item);
        close();
      });
      contentArea.appendChild(card);
    }
  };
  renderGrid();
  modalBox.appendChild(contentArea);
  modalOverlay.appendChild(modalBox);
  document.body.appendChild(modalOverlay);
}

// src/frontend/hud/tab-characters.ts
function normalizeGoal(g) {
  if (Array.isArray(g)) {
    return {
      id: String(g[0] ?? "goal"),
      intent: String(g[1] ?? ""),
      priority: g[2] ?? 0,
      commitment: g[3] ?? 0,
      deadline: String(g[4] ?? ""),
      cause: String(g[5] ?? ""),
      progress: g[6] ?? 0,
      status: String(g[7] ?? "active")
    };
  }
  return {
    id: String(g?.id ?? "goal"),
    intent: String(g?.intent ?? g?.goal ?? g?.title ?? ""),
    priority: g?.priority ?? 0,
    commitment: g?.commitment ?? 0,
    deadline: String(g?.deadline ?? ""),
    cause: String(g?.cause ?? ""),
    progress: g?.progress ?? 0,
    status: String(g?.status ?? "active")
  };
}
function normalizePlan(p) {
  if (Array.isArray(p)) {
    return {
      goal: String(p[0] ?? ""),
      steps: Array.isArray(p[1]) ? p[1] : p[1] ? [p[1]] : [],
      now: String(p[2] ?? ""),
      preconditions: Array.isArray(p[3]) ? p[3] : p[3] ? [p[3]] : [],
      revisions: Number(p[4] ?? 0)
    };
  }
  return {
    goal: String(p?.goal ?? ""),
    steps: Array.isArray(p?.steps) ? p.steps : p?.steps ? [p.steps] : [],
    now: String(p?.now ?? ""),
    preconditions: Array.isArray(p?.preconditions) ? p.preconditions : p?.preconditions ? [p.preconditions] : [],
    revisions: Number(p?.revisions ?? 0)
  };
}
function normalizeMemory(m) {
  if (Array.isArray(m)) {
    return {
      evt: String(m[0] ?? ""),
      interpretation: String(m[1] ?? ""),
      salience: Number(m[2] ?? 0),
      imprint: String(m[3] ?? ""),
      with: String(m[4] ?? "")
    };
  }
  return {
    evt: String(m?.evt ?? m?.event ?? ""),
    interpretation: String(m?.interpretation ?? ""),
    salience: Number(m?.salience ?? 0),
    imprint: String(m?.imprint ?? ""),
    with: String(m?.with ?? "")
  };
}
function normalizeExpectation(e) {
  if (Array.isArray(e)) {
    return {
      situation: String(e[0] ?? ""),
      expect: String(e[1] ?? ""),
      conf: Number(e[2] ?? 100)
    };
  }
  return {
    situation: String(e?.situation ?? ""),
    expect: String(e?.expect ?? ""),
    conf: Number(e?.conf ?? 100)
  };
}
function normalizeSecret(s) {
  if (Array.isArray(s)) {
    return {
      truth: String(s[0] ?? ""),
      knows: Array.isArray(s[1]) ? s[1].map(String) : s[1] ? [String(s[1])] : [],
      suspects: Array.isArray(s[2]) ? s[2].map(String) : s[2] ? [String(s[2])] : [],
      exposure: Number(s[3] ?? 0),
      cover: String(s[4] ?? "")
    };
  }
  return {
    truth: String(s?.truth ?? s?.secret ?? ""),
    knows: Array.isArray(s?.knows) ? s.knows.map(String) : [],
    suspects: Array.isArray(s?.suspects) ? s.suspects.map(String) : [],
    exposure: Number(s?.exposure ?? 0),
    cover: String(s?.cover ?? "")
  };
}
function normalizeBelief(b) {
  if (Array.isArray(b)) {
    return {
      proposition: String(b[0] ?? ""),
      confidence: Number(b[1] ?? 100),
      source: String(b[2] ?? "direct"),
      basis: String(b[3] ?? ""),
      timestamp: String(b[4] ?? "")
    };
  }
  return {
    proposition: String(b?.proposition ?? b?.p ?? b?.belief ?? ""),
    confidence: Number(b?.confidence ?? b?.conf ?? 100),
    source: String(b?.source ?? "direct"),
    basis: String(b?.basis ?? ""),
    timestamp: String(b?.timestamp ?? b?.t ?? "")
  };
}
function normalizeRoutine(r) {
  if (Array.isArray(r)) {
    return {
      time: String(r[0] ?? ""),
      action: String(r[1] ?? ""),
      place: String(r[2] ?? ""),
      phase: String(r[3] ?? "")
    };
  }
  return {
    time: String(r?.time ?? r?.t ?? ""),
    action: String(r?.action ?? r?.activity ?? ""),
    place: String(r?.place ?? r?.loc ?? ""),
    phase: String(r?.phase ?? "")
  };
}

class CharactersTab {
  root;
  selectedActorId = null;
  showFullImage = false;
  currentManifest;
  currentLedger = {};
  ttsEngine;
  ctx;
  constructor(ttsEngine, ctx) {
    this.ttsEngine = ttsEngine;
    this.ctx = ctx;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-characters";
  }
  render(ledger, manifest) {
    this.currentLedger = ledger;
    this.currentManifest = manifest;
    this.root.innerHTML = "";
    const actors = { ...ledger.actors || {} };
    if (ledger.roster && Array.isArray(ledger.roster)) {
      for (const r of ledger.roster) {
        if (r.id && !actors[r.id]) {
          actors[r.id] = {
            id: r.id,
            name: r.name || r.id,
            life_model: { occupation: r.status || "Resident" },
            agency: { want_now: r.status || "None" }
          };
        }
      }
    }
    if (ledger.scene?.participants && Array.isArray(ledger.scene.participants)) {
      for (const p of ledger.scene.participants) {
        if (typeof p === "string" && !actors[p]) {
          actors[p] = {
            id: p,
            name: p,
            life_model: { occupation: "Participant" },
            agency: { want_now: "Present in scene" }
          };
        }
      }
    }
    const allKeys = Object.keys(actors);
    if (allKeys.length === 0) {
      this.root.innerHTML = `<div class="vn-muted" style="text-align:center; padding: 32px;">No characters recorded in the ledger yet.</div>`;
      return;
    }
    const actorIds = allKeys.sort((a, b) => {
      if (a.toLowerCase() === "user")
        return -1;
      if (b.toLowerCase() === "user")
        return 1;
      return a.localeCompare(b);
    });
    if (!this.selectedActorId || !actors[this.selectedActorId]) {
      this.selectedActorId = actorIds[0];
    }
    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div>
          <h3 style="margin:0; font-size:15px; color:#f8fafc; display:flex; align-items:center; gap:6px;">
            <span>\uD83D\uDC65</span> <span>Cast & Living World Dossiers</span>
          </h3>
          <p class="vn-muted" style="margin:2px 0 0 0; font-size:11px;">
            Inspect character personas, attire, hidden caches, tells, active goals, and guarded secrets.
          </p>
        </div>
        <span style="font-size:11px; background:#1e293b; border:1px solid #334155; padding:3px 8px; border-radius:6px; color:#94a3b8;">
          ${actorIds.length} actors tracked
        </span>
      </div>
    `;
    this.root.appendChild(header);
    const ribbon = document.createElement("div");
    ribbon.style.cssText = "display: flex; gap: 12px; overflow-x: auto; padding: 6px 4px 14px 4px; border-bottom: 1px solid #334155; margin-bottom: 16px;";
    const rosterMap = new Map;
    if (ledger.roster && Array.isArray(ledger.roster)) {
      for (const r of ledger.roster) {
        if (r.id)
          rosterMap.set(r.id.toLowerCase(), r);
      }
    }
    for (const id of actorIds) {
      const actor = actors[id];
      const isSelected = id === this.selectedActorId;
      const cleanId = id.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      const rosterItem = rosterMap.get(id.toLowerCase());
      let avatarUrl = "";
      const charData = manifest?.characters?.[cleanId];
      if (charData) {
        const outfits = charData.outfits || charData;
        const defaultSet = outfits?.["default"] || (outfits ? Object.values(outfits)[0] : undefined);
        avatarUrl = defaultSet?.["neutral"] || defaultSet?.["smile"] || (defaultSet ? Object.values(defaultSet)[0] : "") || "";
      }
      if (!avatarUrl) {
        avatarUrl = actor.appearance?.avatar || actor.appearance?.image || "";
      }
      const focus = charData?.avatarFocus || { x: 50, y: 15 };
      const focusX = focus.x ?? 50;
      const focusY = focus.y ?? 15;
      const item = document.createElement("div");
      item.className = "vn-actor-ribbon-item";
      item.dataset.actorId = id;
      item.style.cssText = `display: flex; flex-direction: column; align-items: center; cursor: pointer; min-width: 68px; transition: transform 0.15s ease;`;
      const displayName = id.toLowerCase() === "user" ? "Player (You)" : actor.name || id;
      item.innerHTML = `
        <div style="width: 52px; height: 52px; border-radius: 50%; overflow: hidden; border: 2px solid ${isSelected ? "#818cf8" : "#475569"}; box-shadow: ${isSelected ? "0 0 10px rgba(99,102,241,0.6)" : "none"}; background: #0f172a; display: flex; align-items: center; justify-content: center; position: relative;">
          ${avatarUrl ? `<img class="vn-ribbon-avatar-img" src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover; object-position: ${focusX}% ${focusY}%;" alt="${displayName}" />` : `<span style="font-size: 22px;">\uD83D\uDC64</span>`}
          ${rosterItem ? `<span style="position: absolute; bottom: 0; right: 0; font-size: 9px; background: #0f172a; padding: 1px 3px; border-radius: 3px; border: 1px solid #334155; color: #a5b4fc; font-weight: 700;">L${rosterItem.lod ?? 1}</span>` : ""}
        </div>
        <span style="font-size: 11px; margin-top: 5px; color: ${isSelected ? "#f8fafc" : "#94a3b8"}; font-weight: ${isSelected ? "700" : "500"}; max-width: 68px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${displayName}
        </span>
        ${rosterItem?.loc ? `<span style="font-size: 9px; color: #64748b; max-width: 68px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${rosterItem.loc}</span>` : ""}
      `;
      item.addEventListener("click", () => {
        if (this.selectedActorId === id) {
          this.showFullImage = !this.showFullImage;
        } else {
          this.selectedActorId = id;
        }
        this.render(ledger, manifest);
      });
      ribbon.appendChild(item);
    }
    this.root.appendChild(ribbon);
    const currentActor = actors[this.selectedActorId];
    this.renderActorDetails(currentActor, ledger);
  }
  renderActorDetails(actor, ledger) {
    const container = document.createElement("div");
    container.style.cssText = "display: flex; flex-direction: column; gap: 14px;";
    const isUser = (actor.id || "").toLowerCase() === "user";
    const displayName = isUser ? "Player (You)" : actor.name || actor.id || "Unknown";
    const app = actor.appearance || {};
    const money = actor.money || {};
    const combat = actor.combat || {};
    const life = actor.life_model || {};
    const outfit = actor.outfit || {};
    const inv = actor.inventory || {};
    const wounds = actor.wounds || {};
    const trauma = Array.isArray(actor.trauma) ? actor.trauma : [];
    const prof = actor.profile || {};
    const state = actor.state || {};
    const agency = actor.agency || {};
    const know = actor.knowledge || {};
    const rels = actor.relations || {};
    const conditionStr = app.condition || state.condition || "Normal";
    const wantStr = agency.want_now || "None declared";
    const selfConcept = prof.self_concept || life.self_concept || "";
    const banner = document.createElement("div");
    banner.className = "vn-section";
    banner.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 12px; font-size: 12px; line-height: 1.5; color: #cbd5e1;";
    banner.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:8px; border-bottom:1px solid #334155; padding-bottom:6px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <h4 style="margin:0; font-size:15px; color:#f8fafc;">${displayName}</h4>
          <button id="vn-toggle-portrait-btn" title="Toggle Full Character Portrait" style="background: ${this.showFullImage ? "linear-gradient(135deg, #0284c7, #38bdf8)" : "#0f172a"}; border: 1px solid ${this.showFullImage ? "#38bdf8" : "#475569"}; color: ${this.showFullImage ? "#fff" : "#38bdf8"}; border-radius: 6px; padding: 2px 8px; font-size: 11px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; box-shadow: ${this.showFullImage ? "0 0 8px rgba(56,189,248,0.4)" : "none"};">
            <span>\uD83D\uDDBC️</span> <span>${this.showFullImage ? "Hide Image" : "Show Image"}</span>
          </button>
          <span style="font-size:10px; padding:2px 6px; border-radius:4px; background:rgba(99,102,241,0.2); border:1px solid #6366f1; color:#c7d2fe;">
            ${life.occupation || "Resident"}
          </span>
          <span style="font-size:10px; padding:2px 6px; border-radius:4px; background:rgba(234,179,8,0.2); border:1px solid #eab308; color:#fef08a;">
            ${conditionStr}
          </span>
        </div>
        <div style="font-size:11px; color:#94a3b8;">
          Appeal: <strong style="color:#f43f5e;">${app.appeal ?? 50}/100</strong>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:6px; margin-bottom:8px;">
        <div><span style="color:#94a3b8;">Age:</span> <strong>${app.age || "Unknown"}</strong></div>
        <div><span style="color:#94a3b8;">Style:</span> <strong>${app.style || "Casual"}</strong></div>
        <div><span style="color:#94a3b8;">Residence:</span> <strong>${life.residence || "Current Scene"}</strong></div>
        <div><span style="color:#94a3b8;">Orientation:</span> <strong>${life.orientation || "Unspecified"}</strong></div>
      </div>

      ${app.traits ? `<div style="margin-bottom:6px; background:#0f172a; padding:6px 8px; border-radius:4px; border-left:3px solid #818cf8;"><strong>Traits:</strong> ${app.traits}</div>` : ""}

      <div style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.3); border-radius:4px; padding:6px 8px; color:#e0f2fe; margin-top:4px;">
        <span style="color:#38bdf8; font-weight:700;">\uD83C\uDFAF Immediate Want:</span> ${wantStr}
      </div>

      ${selfConcept ? `
        <div style="margin-top:6px; background:#0f172a; border-left:3px solid #38bdf8; padding:6px 8px; border-radius:4px; color:#cbd5e1; font-size:11px;">
          <span style="color:#38bdf8; font-weight:700;">\uD83E\uDE9E Self-Concept:</span> "${selfConcept}"
        </div>
      ` : ""}

      ${actor.constraints || prof.constraints ? `
        <div style="margin-top:6px; background:rgba(244,63,94,0.1); border:1px solid rgba(244,63,94,0.3); border-radius:4px; padding:6px 8px; color:#fecdd3;">
          <span style="color:#f43f5e; font-weight:700;">⚠️ Constraint / Taboo:</span> ${actor.constraints || prof.constraints}
        </div>
      ` : ""}

      ${prof.boundaries || prof.red_lines ? `
        <div style="margin-top:6px; display:flex; flex-direction:column; gap:4px; font-size:11px;">
          ${prof.boundaries ? `<div><span style="color:#f59e0b; font-weight:600;">\uD83D\uDEA7 Boundaries:</span> <span style="color:#fde68a;">${Array.isArray(prof.boundaries) ? prof.boundaries.join("; ") : prof.boundaries}</span></div>` : ""}
          ${prof.red_lines ? `<div><span style="color:#ef4444; font-weight:600;">\uD83D\uDEAB Red Lines:</span> <span style="color:#fca5a5;">${Array.isArray(prof.red_lines) ? prof.red_lines.join("; ") : prof.red_lines}</span></div>` : ""}
        </div>
      ` : ""}

      ${prof.values || prof.public_roles || prof.capabilities ? `
        <div style="margin-top:6px; padding-top:6px; border-top:1px solid #334155; display:flex; flex-direction:column; gap:4px; font-size:11px;">
          ${prof.values ? `<div><span style="color:#94a3b8;">Values:</span> <strong style="color:#f8fafc;">${Array.isArray(prof.values) ? prof.values.join(", ") : prof.values}</strong></div>` : ""}
          ${prof.public_roles ? `<div><span style="color:#94a3b8;">Public Roles:</span> <span style="color:#cbd5e1;">${Array.isArray(prof.public_roles) ? prof.public_roles.join(", ") : prof.public_roles}</span></div>` : ""}
          ${prof.capabilities ? `<div><span style="color:#94a3b8;">Capabilities:</span> <span style="color:#cbd5e1;">${Array.isArray(prof.capabilities) ? prof.capabilities.join(", ") : prof.capabilities}</span></div>` : ""}
        </div>
      ` : ""}
    `;
    banner.querySelector("#vn-toggle-portrait-btn")?.addEventListener("click", () => {
      this.showFullImage = !this.showFullImage;
      this.render(ledger, this.currentManifest);
    });
    const rawPassions = actor.passions;
    if (rawPassions) {
      let passionBadges = [];
      if (Array.isArray(rawPassions)) {
        passionBadges = rawPassions.map((p) => {
          if (typeof p === "string")
            return p;
          if (typeof p === "object" && p !== null) {
            const label = p.name || p.id || "passion";
            const val = p.intensity ?? p.value ?? "";
            const target = p.target ? ` ➔ ${p.target}` : "";
            return `${label}${target}: ${val}`;
          }
          return String(p);
        });
      } else if (typeof rawPassions === "object") {
        passionBadges = Object.entries(rawPassions).map(([k, v]) => `${k}: ${v}`);
      }
      if (passionBadges.length > 0) {
        const pContainer = document.createElement("div");
        pContainer.style.cssText = "margin-top: 8px; padding-top: 6px; border-top: 1px solid #334155;";
        pContainer.innerHTML = `
          <div style="font-size: 11px; color: #f43f5e; font-weight: 700; margin-bottom: 4px;">❤️ Passions & Emotional Drives:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${passionBadges.map((badge) => `<span style="background: rgba(244,63,94,0.15); border: 1px solid rgba(244,63,94,0.4); color: #fda4af; font-size: 11px; padding: 2px 8px; border-radius: 4px;">\uD83D\uDD25 ${badge}</span>`).join("")}
          </div>
        `;
        banner.appendChild(pContainer);
      }
    }
    container.appendChild(banner);
    const cleanActorId = (actor.id || "").toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    const actorManifestData = this.currentManifest?.characters?.[cleanActorId];
    const actorOutfits = actorManifestData?.outfits || actorManifestData;
    const actorDefaultSet = actorOutfits?.["default"] || (actorOutfits ? Object.values(actorOutfits)[0] : undefined);
    let actorAvatarUrl = actorDefaultSet?.["neutral"] || actorDefaultSet?.["smile"] || (actorDefaultSet ? Object.values(actorDefaultSet)[0] : "") || "";
    if (!actorAvatarUrl) {
      actorAvatarUrl = actor.appearance?.avatar || actor.appearance?.image || "";
    }
    const actorFocus = actorManifestData?.avatarFocus || { x: 50, y: 15 };
    let curFocusX = actorFocus.x ?? 50;
    let curFocusY = actorFocus.y ?? 15;
    const avatarBox = document.createElement("div");
    avatarBox.className = "vn-section vn-avatar-framing-box";
    avatarBox.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px;";
    avatarBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid #334155; padding-bottom: 6px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 13px;">\uD83D\uDDBC️</span>
          <strong style="color: #f8fafc; font-size: 12px;">Avatar Icon & Face Positioning</strong>
          <span style="font-size: 10px; color: #94a3b8;">(Align face in circular icon)</span>
        </div>
        <div style="display: flex; gap: 6px;">
          <button id="vn-reuse-asset-btn" title="Choose from already uploaded library images" style="background: #0f172a; border: 1px solid #38bdf8; color: #38bdf8; border-radius: 4px; padding: 3px 8px; font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;">
            <span>\uD83D\uDDBC️</span> <span>Reuse Asset</span>
          </button>
          <button id="vn-upload-char-btn" title="Upload new image for this character" style="background: #38bdf8; border: none; color: #0f172a; border-radius: 4px; padding: 3px 8px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px;">
            <span>\uD83D\uDCC1</span> <span>Upload</span>
          </button>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
        <!-- Circular Preview with Drag to Pan -->
        <div style="display: flex; flex-direction: column; align-items: center; gap: 3px;">
          <div id="vn-avatar-drag-circle" title="Click and drag up/down to pan face into view" style="width: 58px; height: 58px; border-radius: 50%; overflow: hidden; border: 2px solid #38bdf8; box-shadow: 0 0 10px rgba(56,189,248,0.3); background: #0f172a; cursor: grab; position: relative; user-select: none; display: flex; align-items: center; justify-content: center;">
            ${actorAvatarUrl ? `<img id="vn-avatar-drag-img" src="${actorAvatarUrl}" style="width: 100%; height: 100%; object-fit: cover; object-position: ${curFocusX}% ${curFocusY}%; pointer-events: none;" alt="" />` : `<span style="font-size: 26px;">\uD83D\uDC64</span>`}
          </div>
          <span style="font-size: 9px; color: #64748b;">Drag to pan</span>
        </div>

        <!-- Sliders & Presets -->
        <div style="flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 6px;">
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; margin-bottom: 2px;">
              <span>Vertical Position (Face Alignment):</span>
              <strong id="vn-val-focus-y" style="color: #38bdf8;">${curFocusY}%</strong>
            </div>
            <input id="vn-slider-focus-y" type="range" min="0" max="100" step="1" value="${curFocusY}" style="width: 100%; cursor: pointer;" />
          </div>

          <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
            <span style="font-size: 10px; color: #64748b;">Presets:</span>
            <button class="vn-preset-btn" data-y="15" style="background: #0f172a; border: 1px solid #475569; color: #cbd5e1; border-radius: 4px; padding: 2px 6px; font-size: 10px; cursor: pointer;">\uD83D\uDC64 Face (15%)</button>
            <button class="vn-preset-btn" data-y="35" style="background: #0f172a; border: 1px solid #475569; color: #cbd5e1; border-radius: 4px; padding: 2px 6px; font-size: 10px; cursor: pointer;">\uD83D\uDC54 Upper (35%)</button>
            <button class="vn-preset-btn" data-y="50" style="background: #0f172a; border: 1px solid #475569; color: #cbd5e1; border-radius: 4px; padding: 2px 6px; font-size: 10px; cursor: pointer;">\uD83E\uDDCD Center (50%)</button>
            <span id="vn-avatar-saved-indicator" style="font-size: 10px; color: #10b981; margin-left: auto; display: none;">✓ Saved</span>
          </div>
        </div>
      </div>
    `;
    const dragCircle = avatarBox.querySelector("#vn-avatar-drag-circle");
    const dragImg = avatarBox.querySelector("#vn-avatar-drag-img");
    const sliderY = avatarBox.querySelector("#vn-slider-focus-y");
    const valY = avatarBox.querySelector("#vn-val-focus-y");
    const savedIndicator = avatarBox.querySelector("#vn-avatar-saved-indicator");
    const updateVisuals = () => {
      valY.textContent = `${curFocusY}%`;
      if (dragImg)
        dragImg.style.objectPosition = `${curFocusX}% ${curFocusY}%`;
      const ribbonImg = this.root.querySelector(`.vn-actor-ribbon-item[data-actor-id="${actor.id}"] .vn-ribbon-avatar-img`);
      if (ribbonImg)
        ribbonImg.style.objectPosition = `${curFocusX}% ${curFocusY}%`;
    };
    let saveTimeout = null;
    const saveFocus = () => {
      if (!this.currentManifest)
        this.currentManifest = { places: {}, characters: {} };
      if (!this.currentManifest.characters[cleanActorId])
        this.currentManifest.characters[cleanActorId] = {};
      this.currentManifest.characters[cleanActorId].avatarFocus = { x: curFocusX, y: curFocusY };
      if (saveTimeout)
        clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        this.ctx?.sendToBackend({
          type: "vn_save_actor_avatar_focus",
          actorId: cleanActorId,
          x: curFocusX,
          y: curFocusY
        });
        if (savedIndicator) {
          savedIndicator.style.display = "inline";
          setTimeout(() => {
            savedIndicator.style.display = "none";
          }, 1500);
        }
      }, 300);
    };
    sliderY.addEventListener("input", () => {
      curFocusY = Number(sliderY.value);
      updateVisuals();
      saveFocus();
    });
    avatarBox.querySelectorAll(".vn-preset-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        curFocusY = Number(btn.dataset.y);
        sliderY.value = String(curFocusY);
        updateVisuals();
        saveFocus();
      });
    });
    let isDragging = false;
    let startY = 0;
    let initialY = curFocusY;
    dragCircle.addEventListener("mousedown", (e) => {
      isDragging = true;
      startY = e.clientY;
      initialY = curFocusY;
      dragCircle.style.cursor = "grabbing";
    });
    window.addEventListener("mousemove", (e) => {
      if (!isDragging)
        return;
      const dy = e.clientY - startY;
      curFocusY = Math.max(0, Math.min(100, Math.round(initialY - dy * 0.7)));
      sliderY.value = String(curFocusY);
      updateVisuals();
    });
    window.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        dragCircle.style.cursor = "grab";
        saveFocus();
      }
    });
    avatarBox.querySelector("#vn-reuse-asset-btn")?.addEventListener("click", () => {
      openAssetPicker({
        manifest: this.currentManifest,
        title: `Assign Asset to ${displayName}`,
        category: "characters",
        onSelect: (item) => {
          this.assignAssetToActor(cleanActorId, item.url);
        }
      });
    });
    avatarBox.querySelector("#vn-upload-char-btn")?.addEventListener("click", () => {
      this.uploadImageForActor(cleanActorId);
    });
    container.appendChild(avatarBox);
    const disps = prof.dispositions;
    if (disps && typeof disps === "object" && Object.keys(disps).length > 0) {
      const dispSection = document.createElement("div");
      dispSection.className = "vn-section";
      dispSection.innerHTML = `<h4>\uD83E\uDDED Personality Dispositions</h4>`;
      const dispGrid = document.createElement("div");
      dispGrid.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 6px;";
      const dispLabels = {
        risk: "Risk Propensity",
        assertiveness: "Assertiveness",
        empathy: "Empathy",
        impulse_control: "Impulse Control",
        curiosity: "Curiosity",
        sociability: "Sociability",
        status_sensitivity: "Status Sensitivity",
        acquisitiveness: "Acquisitiveness",
        persistence: "Persistence"
      };
      for (const [k, v] of Object.entries(disps)) {
        const label = dispLabels[k] || k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        const box = document.createElement("div");
        box.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 6px 8px; font-size: 11px;";
        box.innerHTML = `
          <div style="color: #94a3b8; font-size: 10px; margin-bottom: 2px;">${label}</div>
          <div style="color: #f8fafc; font-weight: 700;">${v}</div>
        `;
        dispGrid.appendChild(box);
      }
      dispSection.appendChild(dispGrid);
      container.appendChild(dispSection);
    }
    const hasNeeds = state.needs && (Array.isArray(state.needs) ? state.needs.length > 0 : Object.keys(state.needs).length > 0);
    const affectEpisodes = state.affect?.episodes || state.affect_episodes;
    const hasAffect = Array.isArray(affectEpisodes) && affectEpisodes.length > 0;
    if (hasNeeds || hasAffect) {
      const needsSection = document.createElement("div");
      needsSection.className = "vn-section";
      needsSection.innerHTML = `<h4>⚡ Active Needs & Affect Episodes</h4>`;
      const nBox = document.createElement("div");
      nBox.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; font-size: 12px; display: flex; flex-direction: column; gap: 8px;";
      if (hasNeeds) {
        let needsItems = [];
        if (Array.isArray(state.needs)) {
          needsItems = state.needs.map((n) => {
            if (Array.isArray(n))
              return { name: String(n[0] ?? ""), urgency: n[1] ?? 0 };
            if (typeof n === "object" && n !== null)
              return { name: String(n.name ?? n.need ?? ""), urgency: n.urgency ?? n.value ?? 0 };
            return { name: String(n), urgency: "" };
          });
        } else if (typeof state.needs === "object" && state.needs !== null) {
          needsItems = Object.entries(state.needs).map(([k, v]) => ({ name: k, urgency: String(v) }));
        }
        nBox.innerHTML += `
          <div>
            <div style="color: #38bdf8; font-weight: 700; font-size: 11px; margin-bottom: 4px;">Pressing Needs:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${needsItems.map((n) => `
                <span style="background: #0f172a; border: 1px solid #0284c7; padding: 3px 8px; border-radius: 4px; font-size: 11px;">
                  <strong style="color: #7dd3fc;">${n.name}</strong>${n.urgency !== "" ? `<span style="color: #94a3b8;"> (urgency: ${n.urgency})</span>` : ""}
                </span>
              `).join("")}
            </div>
          </div>
        `;
      }
      if (hasAffect) {
        const epFormatted = affectEpisodes.map((ep) => {
          if (typeof ep === "string")
            return ep;
          if (Array.isArray(ep))
            return `${ep[0] ?? ""}${ep[1] ? ` ➔ ${ep[1]}` : ""}${ep[2] !== undefined ? ` (${ep[2]})` : ""}`;
          if (typeof ep === "object" && ep !== null) {
            return `${ep.name || ep.emotion || "affect"}${ep.target ? ` ➔ ${ep.target}` : ""}${ep.intensity !== undefined ? ` (${ep.intensity})` : ""}`;
          }
          return String(ep);
        });
        nBox.innerHTML += `
          <div style="${hasNeeds ? "border-top: 1px solid #334155; padding-top: 6px;" : ""}">
            <div style="color: #eab308; font-weight: 700; font-size: 11px; margin-bottom: 4px;">Affect Episodes:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${epFormatted.map((ep) => `
                <span style="background: rgba(234,179,8,0.15); border: 1px solid #eab308; color: #fef08a; padding: 2px 8px; border-radius: 4px; font-size: 11px;">
                  ⚡ ${ep}
                </span>
              `).join("")}
            </div>
          </div>
        `;
      }
      needsSection.appendChild(nBox);
      container.appendChild(needsSection);
    }
    const outfitSection = document.createElement("div");
    outfitSection.className = "vn-section";
    outfitSection.innerHTML = `<h4>\uD83D\uDC57 Attire & Wardrobe</h4>`;
    const outfitGrid = document.createElement("div");
    outfitGrid.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px;";
    const outfitKeys = [
      { label: "Top", key: "top", icon: "\uD83D\uDC55" },
      { label: "Bottom", key: "bottom", icon: "\uD83D\uDC56" },
      { label: "Underwear Top", key: "underwear_top", icon: "\uD83D\uDC59" },
      { label: "Underwear Bottom", key: "underwear_bottom", icon: "\uD83E\uDE72" },
      { label: "Footwear", key: "shoes", icon: "\uD83D\uDC5F" },
      { label: "Hair & Makeup", key: "hair", icon: "\uD83D\uDC84" },
      { label: "Scent", key: "scent", icon: "✨" },
      { label: "Condition", key: "state", icon: "\uD83E\uDDF5" },
      { label: "Integrity", key: "integrity", icon: "\uD83D\uDEE1️" },
      { label: "Residue", key: "residue", icon: "\uD83D\uDCA7" }
    ];
    let hasOutfitItems = false;
    for (const item of outfitKeys) {
      let val = outfit[item.key] || (item.key === "shoes" ? outfit["footwear"] : undefined);
      if (item.key === "integrity" && val !== undefined) {
        val = `${val}%`;
      } else if (item.key === "residue" && Array.isArray(val)) {
        val = val.length > 0 ? val.join(", ") : undefined;
      }
      if (val !== undefined && val !== null && val !== "") {
        hasOutfitItems = true;
        const box = document.createElement("div");
        box.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 6px 10px; font-size: 11px;";
        box.innerHTML = `
          <div style="color: #94a3b8; margin-bottom: 2px;">${item.icon} ${item.label}</div>
          <div style="color: #f8fafc; font-weight: 600;">${val}</div>
        `;
        outfitGrid.appendChild(box);
      }
    }
    if (outfit.accessories) {
      hasOutfitItems = true;
      const accList = Array.isArray(outfit.accessories) ? outfit.accessories.join(", ") : outfit.accessories;
      const accBox = document.createElement("div");
      accBox.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 6px 10px; font-size: 11px; grid-column: 1 / -1;";
      accBox.innerHTML = `
        <div style="color: #94a3b8; margin-bottom: 2px;">\uD83D\uDC8D Accessories & Jewelry</div>
        <div style="color: #f8fafc; font-weight: 600;">${accList}</div>
      `;
      outfitGrid.appendChild(accBox);
    }
    if (!hasOutfitItems) {
      outfitGrid.innerHTML = `<div class="vn-muted" style="padding:8px;">Standard default attire</div>`;
    }
    outfitSection.appendChild(outfitGrid);
    container.appendChild(outfitSection);
    const invSection = document.createElement("div");
    invSection.className = "vn-section";
    invSection.innerHTML = `<h4>\uD83C\uDF92 Equipment, Carried Gear & Finances</h4>`;
    const currencySymbol = money.currency || "$";
    const inHandCash = money.in_hand ?? 0;
    const inBankCash = money.in_bank ?? 0;
    const inHandL = inv.in_hand?.L || "Empty";
    const inHandR = inv.in_hand?.R || "Empty";
    const carriedList = Array.isArray(inv.carried) ? inv.carried : [];
    const roomList = Array.isArray(inv.room) ? inv.room : [];
    const invBox = document.createElement("div");
    invBox.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; font-size: 12px; display: flex; flex-direction: column; gap: 8px;";
    invBox.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; border-bottom:1px solid #334155; padding-bottom:8px;">
        <div style="display:flex; gap:16px;">
          <div><span style="color:#94a3b8;">In Hand:</span> <strong style="color:#22c55e;">${currencySymbol}${inHandCash}</strong></div>
          <div><span style="color:#94a3b8;">In Bank:</span> <strong style="color:#38bdf8;">${currencySymbol}${inBankCash}</strong></div>
        </div>
        <div style="font-size:11px; color:#cbd5e1;">
          Hands: <span style="color:#f8fafc;">[L: ${inHandL}] [R: ${inHandR}]</span>
        </div>
      </div>

      <div>
        <div style="color:#94a3b8; font-size:11px; margin-bottom:4px;">Carried On Person:</div>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${carriedList.length > 0 ? carriedList.map((item) => `<span style="background:#0f172a; border:1px solid #475569; padding:2px 8px; border-radius:4px; font-size:11px; color:#f8fafc;">\uD83D\uDCE6 ${item}</span>`).join("") : `<span class="vn-muted">Nothing carried</span>`}
        </div>
      </div>

      ${roomList.length > 0 ? `
        <div style="margin-top:4px;">
          <div style="color:#94a3b8; font-size:11px; margin-bottom:4px;">Stored in Room (${inv.room_location || "Quarters"}):</div>
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            ${roomList.map((item) => `<span style="background:#0f172a; border:1px solid #334155; padding:2px 8px; border-radius:4px; font-size:11px; color:#94a3b8;">\uD83D\uDDC4️ ${item}</span>`).join("")}
          </div>
        </div>
      ` : ""}
    `;
    invSection.appendChild(invBox);
    container.appendChild(invSection);
    if (combat && (combat.hp || combat.pwr || combat.eff_pwr || combat.tier)) {
      const combatSection = document.createElement("div");
      combatSection.className = "vn-section";
      combatSection.innerHTML = `<h4>⚔️ Combat Vitals & Aptitudes</h4>`;
      const cBox = document.createElement("div");
      cBox.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; font-size: 12px;";
      cBox.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #334155; padding-bottom:6px;">
          <div>Tier: <strong style="color:#eab308;">${combat.tier ?? 1}</strong> | Lv: <strong style="color:#f8fafc;">${combat.lv ?? 1}</strong> (${combat.exp ?? "0/100"})</div>
          <div style="display:flex; gap:12px;">
            <div>HP: <strong style="color:#ef4444;">${combat.hp ?? "100/100"}</strong></div>
            <div>MP: <strong style="color:#3b82f6;">${combat.mp ?? "50/50"}</strong></div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(90px, 1fr)); gap:6px; margin-bottom:8px;">
          <div style="background:#0f172a; padding:4px 8px; border-radius:4px;">PWR: <strong>${combat.pwr ?? "-"}</strong></div>
          <div style="background:#0f172a; padding:4px 8px; border-radius:4px;">AGI: <strong>${combat.agi ?? "-"}</strong></div>
          <div style="background:#0f172a; padding:4px 8px; border-radius:4px;">INT: <strong>${combat.int ?? "-"}</strong></div>
          <div style="background:#0f172a; padding:4px 8px; border-radius:4px;">Eff PWR: <strong>${combat.eff_pwr ?? "-"}</strong></div>
          <div style="background:#0f172a; padding:4px 8px; border-radius:4px;">Eff AGI: <strong>${combat.eff_agi ?? "-"}</strong></div>
        </div>

        ${combat.talent ? `
          <div style="font-size:11px;">
            <span style="color:#94a3b8;">Talents & Disciplines:</span>
            <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px;">
              ${(Array.isArray(combat.talent) ? combat.talent : [combat.talent]).map((t) => `<span style="background:rgba(129,140,248,0.15); border:1px solid #818cf8; color:#c7d2fe; padding:2px 6px; border-radius:4px;">✦ ${t}</span>`).join("")}
            </div>
          </div>
        ` : ""}
      `;
      combatSection.appendChild(cBox);
      container.appendChild(combatSection);
    }
    const physWounds = Array.isArray(wounds.physical) ? wounds.physical : [];
    const psychWounds = Array.isArray(wounds.psychological) ? wounds.psychological : [];
    let formattedTells = [];
    if (prof.tells) {
      if (Array.isArray(prof.tells)) {
        formattedTells = prof.tells.map(String);
      } else if (typeof prof.tells === "object") {
        formattedTells = Object.entries(prof.tells).map(([cue, desc]) => `${cue.toUpperCase()}: ${desc}`);
      } else {
        formattedTells = [String(prof.tells)];
      }
    }
    const psychoSection = document.createElement("div");
    psychoSection.className = "vn-section";
    psychoSection.innerHTML = `<h4>\uD83E\uDDE0 Condition, Tells & Wounds</h4>`;
    const psychoBox = document.createElement("div");
    psychoBox.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; font-size: 12px; display: flex; flex-direction: column; gap: 8px;";
    psychoBox.innerHTML = `
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:8px;">
        <div>
          <div style="color:#fca5a5; font-weight:700; font-size:11px; margin-bottom:3px;">Physical Wounds:</div>
          <div>${physWounds.length > 0 ? physWounds.map((w) => `<span style="display:inline-block; background:rgba(239,68,68,0.2); border:1px solid #ef4444; color:#fca5a5; padding:2px 6px; border-radius:4px; margin-right:4px; margin-bottom:4px;">\uD83E\uDE79 ${w}</span>`).join("") : `<span class="vn-muted">None</span>`}</div>
        </div>
        <div>
          <div style="color:#fcd34d; font-weight:700; font-size:11px; margin-bottom:3px;">Psychological Wounds & Trauma:</div>
          <div>${psychWounds.length > 0 || trauma.length > 0 ? [...psychWounds, ...trauma].map((pw) => `<span style="display:inline-block; background:rgba(245,158,11,0.2); border:1px solid #f59e0b; color:#fde68a; padding:2px 6px; border-radius:4px; margin-right:4px; margin-bottom:4px;">⚠️ ${pw}</span>`).join("") : `<span class="vn-muted">None</span>`}</div>
        </div>
      </div>

      ${formattedTells.length > 0 ? `
        <div style="margin-top:4px; border-top:1px solid #334155; padding-top:6px;">
          <div style="color:#38bdf8; font-weight:700; font-size:11px; margin-bottom:3px;">\uD83D\uDC41️ Behavioral Tells & Micro-Expressions:</div>
          <div style="display:flex; flex-direction:column; gap:3px;">
            ${formattedTells.map((t) => `<div style="background:#0f172a; padding:4px 8px; border-radius:4px; font-size:11px; color:#e0f2fe;">${t}</div>`).join("")}
          </div>
        </div>
      ` : ""}

      ${prof.defense || prof.blind_spot ? `
        <div style="margin-top:2px; display:flex; flex-wrap:wrap; gap:12px; font-size:11px; color:#94a3b8;">
          ${prof.defense ? `<div>Defense: <strong style="color:#cbd5e1;">${prof.defense}</strong></div>` : ""}
          ${prof.blind_spot ? `<div>Blind Spot: <strong style="color:#cbd5e1;">${prof.blind_spot}</strong></div>` : ""}
        </div>
      ` : ""}
    `;
    psychoSection.appendChild(psychoBox);
    container.appendChild(psychoSection);
    const routines = Array.isArray(life.routines) ? life.routines.map(normalizeRoutine) : [];
    const lifeSection = document.createElement("div");
    lifeSection.className = "vn-section";
    lifeSection.innerHTML = `<h4>\uD83D\uDCD6 Persona, Upbringing & Routines</h4>`;
    const lifeBox = document.createElement("div");
    lifeBox.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; font-size: 12px; display:flex; flex-direction:column; gap:8px;";
    lifeBox.innerHTML = `
      ${life.romantic_history ? `<div><span style="color:#94a3b8;">Romantic History:</span> <strong style="color:#f8fafc;">${life.romantic_history}</strong></div>` : ""}
      ${life.upbringing ? `<div><span style="color:#94a3b8;">Upbringing:</span> <span style="color:#cbd5e1;">${life.upbringing}</span></div>` : ""}
      ${life.worldview ? `<div><span style="color:#94a3b8;">Worldview:</span> <span style="color:#cbd5e1;">"${life.worldview}"</span></div>` : ""}
      ${life.family ? `<div><span style="color:#94a3b8;">Family:</span> <span style="color:#cbd5e1;">${Array.isArray(life.family) ? life.family.join(", ") : life.family}</span></div>` : ""}

      ${routines.length > 0 ? `
        <div style="margin-top:6px; border-top:1px solid #334155; padding-top:6px;">
          <div style="color:#94a3b8; font-size:11px; margin-bottom:4px;">Daily Routines & Schedules:</div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            ${routines.map((r) => `
              <div style="display:flex; justify-content:space-between; background:#0f172a; padding:4px 8px; border-radius:4px; font-size:11px;">
                <span style="color:#38bdf8; font-weight:700;">${r.time} (${r.phase})</span>
                <span style="color:#f8fafc;">${r.action}</span>
                <span style="color:#94a3b8;">@ ${r.place}</span>
              </div>
            `).join("")}
          </div>
        </div>
      ` : ""}
    `;
    lifeSection.appendChild(lifeBox);
    container.appendChild(lifeSection);
    const rawGoals = Array.isArray(agency.goals) ? agency.goals : [];
    const rawPlans = Array.isArray(agency.plans) ? agency.plans : [];
    const rawPolicies = Array.isArray(agency.policies) ? agency.policies : [];
    const rawCommitments = Array.isArray(agency.commitments) ? agency.commitments : [];
    if (rawGoals.length > 0 || rawPlans.length > 0 || rawPolicies.length > 0 || rawCommitments.length > 0) {
      const agencySection = document.createElement("div");
      agencySection.className = "vn-section";
      agencySection.innerHTML = `<h4>\uD83C\uDFAF Agency, Plans & Directives</h4>`;
      const agencyBody = document.createElement("div");
      agencyBody.style.cssText = "display: flex; flex-direction: column; gap: 10px;";
      if (rawGoals.length > 0) {
        const goals = rawGoals.map(normalizeGoal);
        const goalList = document.createElement("div");
        goalList.style.cssText = "display: flex; flex-direction: column; gap: 6px;";
        goalList.innerHTML = `<div style="color: #38bdf8; font-weight: 700; font-size: 11px;">Active Goals (${goals.length}):</div>`;
        for (const g of goals) {
          const item = document.createElement("div");
          item.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 8px 10px; font-size: 11px;";
          item.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <strong style="color:#38bdf8; font-size:12px;">${g.intent}</strong>
              <span style="padding:1px 6px; border-radius:4px; background:rgba(34,197,94,0.2); border:1px solid #22c55e; color:#86efac;">
                ${g.status} (${g.progress}%)
              </span>
            </div>
            <div style="display:flex; gap:12px; color:#94a3b8; flex-wrap:wrap;">
              <span>Priority: <strong style="color:#f8fafc;">${g.priority}</strong></span>
              <span>Commitment: <strong style="color:#f8fafc;">${g.commitment}</strong></span>
              ${g.deadline ? `<span>Deadline: <strong style="color:#fca5a5;">${g.deadline}</strong></span>` : ""}
            </div>
            ${g.cause ? `<div style="margin-top:4px; color:#cbd5e1; font-style:italic;">Cause: ${g.cause}</div>` : ""}
          `;
          goalList.appendChild(item);
        }
        agencyBody.appendChild(goalList);
      }
      if (rawPlans.length > 0) {
        const plans = rawPlans.map(normalizePlan);
        const planList = document.createElement("div");
        planList.style.cssText = "display: flex; flex-direction: column; gap: 6px;";
        planList.innerHTML = `<div style="color: #818cf8; font-weight: 700; font-size: 11px;">Action Plans (${plans.length}):</div>`;
        for (const p of plans) {
          const item = document.createElement("div");
          item.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 8px 10px; font-size: 11px;";
          item.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <strong style="color:#c7d2fe; font-size:12px;">Goal: ${p.goal}</strong>
              <span style="font-size:10px; color:#94a3b8;">Rev: ${p.revisions}</span>
            </div>
            ${p.now ? `<div style="background:#0f172a; padding:4px 8px; border-radius:4px; margin-bottom:4px; color:#38bdf8;"><strong>Current Step:</strong> ${p.now}</div>` : ""}
            ${p.steps.length > 0 ? `
              <div style="color:#94a3b8; margin-top:2px;">
                Steps: <span style="color:#cbd5e1;">${p.steps.join(" ➔ ")}</span>
              </div>
            ` : ""}
            ${p.preconditions.length > 0 ? `
              <div style="color:#94a3b8; margin-top:2px;">
                Preconditions: <span style="color:#fde68a;">${p.preconditions.join("; ")}</span>
              </div>
            ` : ""}
          `;
          planList.appendChild(item);
        }
        agencyBody.appendChild(planList);
      }
      if (rawPolicies.length > 0 || rawCommitments.length > 0) {
        const polBox = document.createElement("div");
        polBox.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 8px 10px; font-size: 11px; display: flex; flex-direction: column; gap: 6px;";
        if (rawPolicies.length > 0) {
          polBox.innerHTML += `
            <div>
              <span style="color: #f59e0b; font-weight: 700;">Operating Policies:</span>
              <ul style="margin: 2px 0 0 16px; padding: 0; color: #cbd5e1;">
                ${rawPolicies.map((pol) => `<li>${typeof pol === "object" ? JSON.stringify(pol) : String(pol)}</li>`).join("")}
              </ul>
            </div>
          `;
        }
        if (rawCommitments.length > 0) {
          polBox.innerHTML += `
            <div>
              <span style="color: #22c55e; font-weight: 700;">Active Commitments:</span>
              <ul style="margin: 2px 0 0 16px; padding: 0; color: #cbd5e1;">
                ${rawCommitments.map((com) => `<li>${typeof com === "object" ? JSON.stringify(com) : String(com)}</li>`).join("")}
              </ul>
            </div>
          `;
        }
        agencyBody.appendChild(polBox);
      }
      agencySection.appendChild(agencyBody);
      container.appendChild(agencySection);
    }
    const rawSecrets = Array.isArray(know.secrets) ? know.secrets : [];
    const rawBeliefs = Array.isArray(know.beliefs) ? know.beliefs : [];
    const rawMemories = Array.isArray(know.memories) ? know.memories : [];
    const rawExpectations = Array.isArray(know.expectations) ? know.expectations : [];
    const heldLeverage = know.held_leverage;
    const presentsAs = know.presents_as;
    if (rawSecrets.length > 0 || rawBeliefs.length > 0 || rawMemories.length > 0 || rawExpectations.length > 0 || heldLeverage || presentsAs) {
      const knowSection = document.createElement("div");
      knowSection.className = "vn-section";
      knowSection.innerHTML = `<h4>\uD83D\uDD12 Epistemics, Memories & Guarded Secrets</h4>`;
      const knowBox = document.createElement("div");
      knowBox.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; font-size: 12px; display:flex; flex-direction:column; gap:8px;";
      if (presentsAs) {
        knowBox.innerHTML += `
          <div style="background: #0f172a; padding: 6px 8px; border-radius: 4px; font-size: 11px; border-left: 3px solid #818cf8;">
            <strong style="color: #818cf8;">Presents As:</strong> <span style="color: #e0f2fe;">${typeof presentsAs === "object" ? JSON.stringify(presentsAs) : String(presentsAs)}</span>
          </div>
        `;
      }
      if (heldLeverage && (Array.isArray(heldLeverage) ? heldLeverage.length > 0 : true)) {
        const levList = Array.isArray(heldLeverage) ? heldLeverage : [heldLeverage];
        knowBox.innerHTML += `
          <div style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); padding: 6px 8px; border-radius: 4px; font-size: 11px;">
            <strong style="color: #f59e0b;">Held Leverage:</strong>
            <span style="color: #fde68a;">${levList.map((x) => typeof x === "object" ? x.truth || x.id || JSON.stringify(x) : String(x)).join("; ")}</span>
          </div>
        `;
      }
      if (rawMemories.length > 0) {
        const memories = rawMemories.map(normalizeMemory);
        knowBox.innerHTML += `
          <div style="margin-top: 4px;">
            <div style="color: #c084fc; font-weight: 700; font-size: 11px; margin-bottom: 4px;">Salient Memories (${memories.length}):</div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${memories.map((m) => `
                <div style="background: #0f172a; padding: 6px 8px; border-radius: 4px; font-size: 11px;">
                  <div style="color: #f8fafc; font-weight: 600;">"${m.evt}"</div>
                  <div style="display: flex; gap: 10px; margin-top: 2px; color: #94a3b8; font-size: 10px; flex-wrap: wrap;">
                    <span>Interpretation: <strong style="color: #cbd5e1;">${m.interpretation || "—"}</strong></span>
                    <span>Salience: <strong style="color: #d8b4fe;">${m.salience}</strong></span>
                    ${m.with ? `<span>With: ${m.with}</span>` : ""}
                    ${m.imprint ? `<span>Imprint: <em>${m.imprint}</em></span>` : ""}
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        `;
      }
      if (rawExpectations.length > 0) {
        const expects = rawExpectations.map(normalizeExpectation);
        knowBox.innerHTML += `
          <div style="margin-top: 4px;">
            <div style="color: #38bdf8; font-weight: 700; font-size: 11px; margin-bottom: 4px;">Social & Situational Expectations (${expects.length}):</div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${expects.map((e) => `
                <div style="background: #0f172a; padding: 4px 8px; border-radius: 4px; font-size: 11px; display: flex; justify-content: space-between; align-items: center;">
                  <span><strong style="color: #7dd3fc;">[${e.situation}]</strong> <span style="color: #e0f2fe;">${e.expect}</span></span>
                  <span style="color: #94a3b8; font-size: 10px;">conf: ${e.conf}%</span>
                </div>
              `).join("")}
            </div>
          </div>
        `;
      }
      if (rawSecrets.length > 0) {
        const secrets = rawSecrets.map(normalizeSecret);
        knowBox.innerHTML += `
          <div style="margin-top: 4px;">
            <div style="color:#f43f5e; font-weight:700; font-size:11px; margin-bottom:4px;">Guarded Secrets:</div>
            <div style="display:flex; flex-direction:column; gap:6px;">
              ${secrets.map((s) => `
                <div style="background:#0f172a; border-left:3px solid #f43f5e; padding:6px 8px; border-radius:4px; font-size:11px;">
                  <div style="color:#fecdd3; font-weight:600;">"${s.truth}"</div>
                  <div style="display:flex; gap:12px; margin-top:3px; color:#94a3b8; font-size:10px;">
                    <span>Exposure Risk: <strong style="color:#fb7185;">${s.exposure}%</strong></span>
                    <span>Knows: <strong style="color:#f8fafc;">${s.knows.join(", ") || "Self only"}</strong></span>
                    ${s.cover ? `<span>Cover: <em>${s.cover}</em></span>` : ""}
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        `;
      }
      if (rawBeliefs.length > 0) {
        const beliefs = rawBeliefs.map(normalizeBelief);
        knowBox.innerHTML += `
          <div style="margin-top:4px;">
            <div style="color:#38bdf8; font-weight:700; font-size:11px; margin-bottom:4px;">Epistemic Beliefs:</div>
            <div style="display:flex; flex-direction:column; gap:4px;">
              ${beliefs.map((b) => `
                <div style="background:#0f172a; padding:4px 8px; border-radius:4px; font-size:11px; display:flex; justify-content:space-between;">
                  <span style="color:#e0f2fe;">"${b.proposition}"</span>
                  <span style="color:#94a3b8; font-size:10px;">conf: ${b.confidence}% (${b.source})</span>
                </div>
              `).join("")}
            </div>
          </div>
        `;
      }
      knowSection.appendChild(knowBox);
      container.appendChild(knowSection);
    }
    const targetIds = Object.keys(rels);
    if (targetIds.length > 0) {
      const relsSection = document.createElement("div");
      relsSection.className = "vn-section";
      relsSection.innerHTML = `<h4>\uD83E\uDD1D Interpersonal Relations (${targetIds.length})</h4>`;
      const relsList = document.createElement("div");
      relsList.style.cssText = "display: flex; flex-direction: column; gap: 8px;";
      for (const targetId of targetIds) {
        const r = rels[targetId];
        const targetName = targetId.toLowerCase() === "user" ? "Player (You)" : ledger.actors?.[targetId]?.name || targetId;
        const bThreshold = r.betrayal_threshold ?? "N/A";
        const card = document.createElement("div");
        card.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 8px 10px; font-size: 11px;";
        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <strong style="color:#818cf8; font-size:12px;">Towards ${targetName}</strong>
            <span style="font-size:10px; background:rgba(239,68,68,0.2); border:1px solid #ef4444; color:#fca5a5; padding:1px 6px; border-radius:4px;">
              Betrayal Thresh: ${bThreshold}
            </span>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(80px, 1fr)); gap:4px; color:#cbd5e1;">
            <div>Affinity: <strong>${r.affinity ?? 0}</strong></div>
            <div>Trust: <strong>${r.trust ?? 0}</strong></div>
            <div>Respect: <strong>${r.respect ?? 0}</strong></div>
            <div>Attraction: <strong>${r.attraction ?? 0}</strong></div>
            <div>Loyalty: <strong>${r.loyalty ?? 0}</strong></div>
          </div>
          ${r.grievances && (Array.isArray(r.grievances) ? r.grievances.length > 0 : true) ? `
            <div style="margin-top:4px; color:#f87171;">
              Grievances: <span style="color:#fecdd3;">${(Array.isArray(r.grievances) ? r.grievances : [r.grievances]).map(String).join("; ")}</span>
            </div>
          ` : ""}
          ${r.shared_secrets && (Array.isArray(r.shared_secrets) ? r.shared_secrets.length > 0 : true) ? `
            <div style="margin-top:4px; color:#c084fc;">
              Shared Secrets: <span style="color:#e9d5ff;">${(Array.isArray(r.shared_secrets) ? r.shared_secrets : [r.shared_secrets]).map(String).join("; ")}</span>
            </div>
          ` : ""}
          ${r.leverage && (Array.isArray(r.leverage) ? r.leverage.length > 0 : true) ? `<div style="margin-top:4px; color:#f59e0b;">Leverage: ${(Array.isArray(r.leverage) ? r.leverage : [r.leverage]).map((x) => typeof x === "object" ? x.truth || x.id || JSON.stringify(x) : String(x)).join(", ")}</div>` : ""}
          ${r.obligations && (Array.isArray(r.obligations) ? r.obligations.length > 0 : true) ? `<div style="margin-top:4px; color:#38bdf8;">Obligations: ${(Array.isArray(r.obligations) ? r.obligations : [r.obligations]).map((x) => typeof x === "object" ? x.truth || x.id || JSON.stringify(x) : String(x)).join(", ")}</div>` : ""}
        `;
        relsList.appendChild(card);
      }
      relsSection.appendChild(relsList);
      container.appendChild(relsSection);
    }
    if (this.ttsEngine) {
      const voiceSec = document.createElement("div");
      voiceSec.className = "vn-section";
      voiceSec.innerHTML = `<h4>\uD83C\uDF99️ Voice Assignment (TTS)</h4>`;
      const vBox = document.createElement("div");
      vBox.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 12px; font-size: 12px; display: flex; flex-direction: column; gap: 10px;";
      const currentVoice = this.ttsEngine.resolveVoice(isUser ? "user" : actor.name || actor.id);
      const isNarrator = (actor.id || "").toLowerCase() === "narrator";
      vBox.innerHTML = `
        <div style="font-size: 11px; color: #94a3b8;">
          Assign a distinct voice connection for <strong>${displayName}</strong>.
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div>
            <label style="font-size: 10px; color: #94a3b8; display: block; margin-bottom: 2px;">TTS Profile / Connection:</label>
            <select id="vn-voice-profile-select" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #475569; border-radius: 4px; padding: 6px; font-size: 11px;">
              <option value="">(Default / Inherited)</option>
            </select>
          </div>
          <div>
            <label style="font-size: 10px; color: #94a3b8; display: block; margin-bottom: 2px;">Voice:</label>
            <select id="vn-voice-id-select" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #475569; border-radius: 4px; padding: 6px; font-size: 11px;">
              <option value="">(Profile Default Voice)</option>
            </select>
          </div>
        </div>
        <div style="display: flex; gap: 8px; align-items: center; justify-content: flex-end; margin-top: 4px;">
          <button id="vn-voice-test-btn" style="background: #334155; border: 1px solid #475569; border-radius: 4px; color: #cbd5e1; font-size: 11px; padding: 4px 10px; cursor: pointer;">
            ▶ Test Voice
          </button>
          <button id="vn-voice-save-btn" style="background: #6366f1; border: none; border-radius: 4px; color: #fff; font-size: 11px; font-weight: 700; padding: 4px 12px; cursor: pointer;">
            Save Voice
          </button>
        </div>
      `;
      voiceSec.appendChild(vBox);
      container.appendChild(voiceSec);
      const profileSelect = vBox.querySelector("#vn-voice-profile-select");
      const voiceSelect = vBox.querySelector("#vn-voice-id-select");
      const saveBtn = vBox.querySelector("#vn-voice-save-btn");
      const testBtn = vBox.querySelector("#vn-voice-test-btn");
      this.ttsEngine.listProfiles().then((profiles) => {
        profiles.forEach((p) => {
          const opt = document.createElement("option");
          opt.value = p.id;
          opt.textContent = `${p.name} (${p.provider})`;
          if (currentVoice?.connectionId === p.id)
            opt.selected = true;
          profileSelect.appendChild(opt);
        });
        if (profileSelect.value) {
          updateVoiceList(profileSelect.value);
        }
      });
      const updateVoiceList = async (connId) => {
        voiceSelect.innerHTML = `<option value="">(Profile Default Voice)</option>`;
        if (!connId)
          return;
        const voices = await this.ttsEngine.listVoices(connId);
        voices.forEach((v) => {
          const opt = document.createElement("option");
          opt.value = v.id;
          opt.textContent = v.name;
          if (currentVoice?.voice === v.id)
            opt.selected = true;
          voiceSelect.appendChild(opt);
        });
      };
      profileSelect.addEventListener("change", () => {
        updateVoiceList(profileSelect.value);
      });
      saveBtn.addEventListener("click", () => {
        const connectionId = profileSelect.value;
        const voice = voiceSelect.value;
        const settings = this.ttsEngine.getSettings();
        if (isNarrator) {
          this.ttsEngine.updateSettings({
            narrator: connectionId ? { connectionId, voice } : null
          });
        } else {
          const key = (actor.name || actor.id || "").toLowerCase();
          const nextChars = { ...settings.characters };
          if (connectionId) {
            nextChars[key] = { connectionId, voice };
          } else {
            delete nextChars[key];
          }
          this.ttsEngine.updateSettings({ characters: nextChars });
        }
        saveBtn.textContent = "✓ Saved!";
        setTimeout(() => {
          saveBtn.textContent = "Save Voice";
        }, 1500);
      });
      testBtn.addEventListener("click", () => {
        const testText = isNarrator ? "The morning light filtered through the quiet room." : `Hello, my name is ${displayName}.`;
        const selectedConnId = profileSelect.value.trim();
        const selectedVoiceId = voiceSelect.value.trim();
        const activeVoiceRef = selectedConnId ? { connectionId: selectedConnId, voice: selectedVoiceId } : null;
        const originalText = testBtn.textContent;
        testBtn.textContent = "\uD83D\uDD0A Playing...";
        testBtn.disabled = true;
        this.ttsEngine.testVoice(testText, activeVoiceRef, displayName, {
          onEnd: () => {
            testBtn.textContent = originalText;
            testBtn.disabled = false;
          },
          onError: (err) => {
            console.error("[LumiVN] Voice test error:", err);
            testBtn.textContent = "⚠️ Failed";
            setTimeout(() => {
              testBtn.textContent = originalText;
              testBtn.disabled = false;
            }, 2000);
          }
        });
      });
    }
    const layoutWrapper = document.createElement("div");
    layoutWrapper.style.cssText = "display: flex; gap: 16px; align-items: flex-start; width: 100%; box-sizing: border-box;";
    const cleanId = (actor.id || "").toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    let fullImageUrl = "";
    if (this.currentManifest?.characters?.[cleanId]) {
      const charData = this.currentManifest.characters[cleanId];
      const outfits = charData.outfits || charData;
      const defaultSet = outfits?.["default"] || (outfits ? Object.values(outfits)[0] : undefined);
      fullImageUrl = defaultSet?.["neutral"] || defaultSet?.["smile"] || (defaultSet ? Object.values(defaultSet)[0] : "") || "";
    }
    if (!fullImageUrl) {
      fullImageUrl = actor.appearance?.avatar || actor.appearance?.image || "";
    }
    if (this.showFullImage) {
      const portraitCard = document.createElement("div");
      portraitCard.className = "vn-character-portrait-card";
      portraitCard.style.cssText = "width: 260px; min-width: 260px; background: #0f172a; border: 1px solid #38bdf8; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(56, 189, 248, 0.25); position: sticky; top: 10px; display: flex; flex-direction: column;";
      portraitCard.innerHTML = `
        <div style="width: 100%; height: 380px; position: relative; background: #020617; display: flex; align-items: center; justify-content: center; overflow: hidden;">
          ${fullImageUrl ? `
            <img src="${fullImageUrl}" alt="${displayName}" style="width: 100%; height: 100%; object-fit: contain; transition: transform 0.2s;" />
          ` : `
            <div style="font-size: 54px; color: #475569;">\uD83D\uDC64</div>
          `}
          <button id="vn-close-portrait-btn" style="position: absolute; top: 8px; right: 8px; background: rgba(15,23,42,0.85); border: 1px solid #475569; color: #fff; border-radius: 50%; width: 26px; height: 26px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center;">✕</button>
        </div>
        <div style="padding: 10px 12px; background: #0b1120; border-top: 1px solid #1e293b; text-align: center;">
          <strong style="color: #f8fafc; font-size: 13px;">${displayName}</strong>
          <div style="font-size: 11px; color: #38bdf8; margin-top: 2px;">${life.occupation || "Resident"}</div>
          <div style="display: flex; gap: 6px; justify-content: center; margin-top: 8px;">
            <button id="vn-portrait-reuse-btn" style="background: #1e293b; border: 1px solid #38bdf8; color: #38bdf8; border-radius: 4px; padding: 3px 8px; font-size: 10px; cursor: pointer;">\uD83D\uDDBC️ Reuse Asset</button>
            <button id="vn-portrait-upload-btn" style="background: #38bdf8; border: none; color: #0f172a; border-radius: 4px; padding: 3px 8px; font-size: 10px; font-weight: 700; cursor: pointer;">\uD83D\uDCC1 Upload</button>
          </div>
        </div>
      `;
      portraitCard.querySelector("#vn-close-portrait-btn")?.addEventListener("click", () => {
        this.showFullImage = false;
        this.render(ledger, this.currentManifest);
      });
      portraitCard.querySelector("#vn-portrait-reuse-btn")?.addEventListener("click", () => {
        openAssetPicker({
          manifest: this.currentManifest,
          title: `Assign Portrait for ${displayName}`,
          category: "characters",
          onSelect: (item) => {
            this.assignAssetToActor(cleanId, item.url);
          }
        });
      });
      portraitCard.querySelector("#vn-portrait-upload-btn")?.addEventListener("click", () => {
        this.uploadImageForActor(cleanId);
      });
      layoutWrapper.appendChild(portraitCard);
    }
    container.style.flex = "1";
    container.style.minWidth = "0";
    layoutWrapper.appendChild(container);
    this.root.appendChild(layoutWrapper);
  }
  assignAssetToActor(actorId, url) {
    if (!this.currentManifest)
      this.currentManifest = { places: {}, characters: {} };
    if (!this.currentManifest.characters[actorId])
      this.currentManifest.characters[actorId] = {};
    if (!this.currentManifest.characters[actorId].outfits)
      this.currentManifest.characters[actorId].outfits = {};
    if (!this.currentManifest.characters[actorId].outfits["default"])
      this.currentManifest.characters[actorId].outfits["default"] = {};
    this.currentManifest.characters[actorId].outfits["default"]["neutral"] = url;
    const ctxAny = this.ctx;
    const activeChat = ctxAny?.getActiveChat?.();
    const chatId = activeChat?.id || activeChat?.chatId;
    this.ctx?.sendToBackend({
      type: "vn_assign_asset",
      category: "characters",
      actorId,
      outfit: "default",
      expression: "neutral",
      url,
      chatId
    });
    this.render(this.currentLedger, this.currentManifest);
  }
  async uploadImageForActor(actorId) {
    if (!this.ctx?.uploads?.pickFile)
      return;
    try {
      const files = await this.ctx.uploads.pickFile({
        accept: ["image/png", "image/webp", "image/jpeg"],
        multiple: false
      });
      if (!files || files.length === 0)
        return;
      const file = files[0];
      const directUrl = await this.uploadImageFile(file);
      const ctxAny = this.ctx;
      const activeChat = ctxAny?.getActiveChat?.();
      const chatId = activeChat?.id || activeChat?.chatId;
      const userId = ctxAny?.user?.id || ctxAny?.currentUser?.id || activeChat?.user_id;
      if (directUrl) {
        this.ctx.sendToBackend({
          type: "vn_upload_asset",
          category: "characters",
          actorId,
          outfit: "default",
          expression: "neutral",
          filename: file.name,
          url: directUrl,
          chatId,
          userId
        });
      } else {
        const dataUrl = await this.fileToDataUrl(file);
        this.ctx.sendToBackend({
          type: "vn_upload_asset",
          category: "characters",
          actorId,
          outfit: "default",
          expression: "neutral",
          filename: file.name,
          dataUrl,
          chatId,
          userId
        });
      }
    } catch (err) {
      console.error("[LumiVN] Actor upload failed:", err);
    }
  }
  async uploadImageFile(file) {
    try {
      const formData = new FormData;
      formData.append("file", new Blob([file.bytes], { type: file.mimeType || "image/png" }), file.name);
      const resp = await fetch("/api/v1/images", {
        method: "POST",
        body: formData
      });
      if (resp.ok) {
        const data = await resp.json();
        const url = data.url || data.image_url || (data.id ? `/api/v1/images/${data.id}` : "");
        if (url)
          return url;
      }
    } catch {}
    return null;
  }
  async fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const blob = new Blob([file.bytes], { type: file.mimeType || "image/png" });
      const reader = new FileReader;
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }
}

// src/frontend/hud/tab-bplots.ts
function generateBondInterlude(actorA, actorB, placeName) {
  const nameA = actorA.name || actorA.id;
  const nameB = actorB.name || actorB.id;
  const loc = placeName || actorA.loc || actorB.loc || "the district outskirts";
  return [
    {
      speaker: "Narrator",
      avatarIcon: "\uD83C\uDFAC",
      type: "action",
      text: `[Off-Screen Interlude: Meanwhile, at ${loc}... ${nameA} and ${nameB} meet quietly, away from the spotlight.]`
    },
    {
      speaker: nameA,
      avatarIcon: "\uD83D\uDC64",
      type: "dialogue",
      text: actorA.status ? `"${nameB}, thank you for meeting me here. As you know, ${actorA.status}."` : `"${nameB}, do you have a moment? There is a matter between us that cannot wait."`
    },
    {
      speaker: nameB,
      avatarIcon: "\uD83D\uDC65",
      type: "dialogue",
      text: actorB.want ? `"I hear you clearly. But my own agenda regarding ${actorB.want} remains just as urgent."` : `"I've been keeping an eye on things as well. Let us be plain about what is happening."`
    },
    {
      speaker: nameA,
      avatarIcon: "\uD83D\uDC64",
      type: "dialogue",
      text: `"If we coordinate our moves now, neither of us will be blindsided by whatever comes next."`
    },
    {
      speaker: nameB,
      avatarIcon: "\uD83D\uDC65",
      type: "dialogue",
      text: `"Agreed. Keep this between ourselves until the timing is right."`
    }
  ];
}

class BPlotsTab {
  root;
  onAction;
  activeCutscene = null;
  constructor(onAction) {
    this.onAction = onAction;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-bplots";
  }
  render(ledger) {
    this.root.innerHTML = "";
    this.root.style.cssText = "display: flex; flex-direction: column; gap: 14px; color: #f1f5f9; font-family: system-ui, sans-serif;";
    const bplots = ledger.bplots || [];
    const roster = ledger.roster || [];
    const currentPlace = (ledger.scene?.place || "").toLowerCase();
    const offscreenCast = roster.filter((r) => {
      const isOffLOD = r.lod === 1 || r.lod === 2;
      const isDifferentLoc = r.loc && r.loc.toLowerCase() !== currentPlace;
      return (isOffLOD || isDifferentLoc) && (r.id || "").toLowerCase() !== "user";
    });
    const fronts = ledger.fronts || [];
    const travel = ledger.travel || [];
    const latents = ledger.scene?.latents || [];
    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <h3 style="margin: 0; font-size: 15px; color: #f8fafc; display: flex; align-items: center; gap: 6px;">
            <span>\uD83D\uDCE1</span> <span>B-Plots, Fronts & Offscreen Cast</span>
          </h3>
          <p class="vn-muted" style="margin: 2px 0 0 0; font-size: 11px;">
            Distant third-party agendas, active ripple stages, offscreen errands, and environmental fronts.
          </p>
        </div>
        <div style="display: flex; gap: 6px;">
          <span style="font-size: 11px; background: rgba(99,102,241,0.2); border: 1px solid #6366f1; padding: 2px 8px; border-radius: 6px; color: #c7d2fe;">
            ${bplots.length} B-Plots
          </span>
          <span style="font-size: 11px; background: rgba(56,189,248,0.2); border: 1px solid #38bdf8; padding: 2px 8px; border-radius: 6px; color: #7dd3fc;">
            ${offscreenCast.length} Offscreen Cast
          </span>
        </div>
      </div>
    `;
    this.root.appendChild(header);
    const bpSection = document.createElement("div");
    bpSection.className = "vn-section";
    bpSection.innerHTML = `<h4>\uD83C\uDF10 Active B-Plots & Distant Agendas (${bplots.length})</h4>`;
    if (bplots.length === 0) {
      bpSection.innerHTML += `<div class="vn-muted" style="padding: 10px; background: #0f172a; border-radius: 6px;">No external B-plots active on the ledger.</div>`;
    } else {
      const bpList = document.createElement("div");
      bpList.style.cssText = "display: flex; flex-direction: column; gap: 10px;";
      for (const bp of bplots) {
        const card = document.createElement("div");
        card.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px;";
        const ripple = bp.ripple ?? 1;
        const rippleColor = ripple === 3 ? "#ef4444" : ripple === 2 ? "#f59e0b" : "#38bdf8";
        const rippleLabel = ripple === 3 ? "Stage 3: Collision" : ripple === 2 ? "Stage 2: Ambient Echo" : "Stage 1: Isolated";
        const knowsList = Array.isArray(bp.knows) ? bp.knows.join("; ") : bp.knows || "None";
        const hooksList = Array.isArray(bp.hooks) ? bp.hooks.join(", ") : bp.hooks || "None";
        const carriersList = (bp.carriers || []).map((c) => `${c.what || "News"} from ${c.from || "Source"} (ETA: ${c.eta || "?"})`).join("; ");
        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="color: #f8fafc; font-size: 13px;">${bp.who || bp.id || "Unknown Entity"}</strong>
              <span style="font-size: 10px; background: #0f172a; border: 1px solid #475569; padding: 1px 6px; border-radius: 4px; color: #94a3b8;">
                ${bp.scope || "personal"}
              </span>
              <span style="font-size: 10px; background: rgba(34,197,94,0.15); border: 1px solid #22c55e; padding: 1px 6px; border-radius: 4px; color: #86efac;">
                ${bp.status || "active"}
              </span>
            </div>
            <span style="font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: ${rippleColor}22; border: 1px solid ${rippleColor}; color: ${rippleColor};">
              ${rippleLabel}
            </span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px; font-size: 11px;">
            <div><span style="color: #94a3b8;">Want:</span> <strong style="color: #f8fafc;">${bp.want || "Unstated"}</strong></div>
            <div><span style="color: #94a3b8;">Current Activity:</span> <span style="color: #cbd5e1;">${bp.doing || "Routine"}</span></div>
          </div>

          ${bp.next ? `
            <div style="background: #0f172a; border-radius: 6px; padding: 6px 10px; font-size: 11px; display: flex; justify-content: space-between;">
              <span><strong style="color: #38bdf8;">Next Move:</strong> ${bp.next.move || "Advance plan"}</span>
              <span style="color: #fca5a5; font-weight: 600;">Due: ${bp.next.due || "TBD"}</span>
            </div>
          ` : ""}

          <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: #cbd5e1;">
            ${bp.vector ? `<div><span style="color: #94a3b8;">Ripple Vector:</span> <em>${bp.vector}</em></div>` : ""}
            ${carriersList ? `<div><span style="color: #94a3b8;">Carriers & Outward News:</span> ${carriersList}</div>` : ""}
            <div><span style="color: #94a3b8;">Beliefs / What they know:</span> ${knowsList}</div>
            <div><span style="color: #94a3b8;">Scene Hooks:</span> <span style="color: #a78bfa;">${hooksList}</span></div>
          </div>
        `;
        bpList.appendChild(card);
      }
      bpSection.appendChild(bpList);
    }
    this.root.appendChild(bpSection);
    const offSection = document.createElement("div");
    offSection.className = "vn-section";
    offSection.innerHTML = `<h4>\uD83D\uDC65 Offscreen Cast & Area Latents (${offscreenCast.length + latents.length + travel.length})</h4>`;
    const offGrid = document.createElement("div");
    offGrid.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px;";
    for (const actor of offscreenCast) {
      const card = document.createElement("div");
      card.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px; font-size: 11px; display: flex; flex-direction: column; gap: 4px;";
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #38bdf8; font-size: 12px;">${actor.name || actor.id}</strong>
          <span style="font-size: 10px; background: #0f172a; padding: 1px 6px; border-radius: 4px; color: #a5b4fc;">
            LOD ${actor.lod ?? 1}
          </span>
        </div>
        <div><span style="color: #94a3b8;">Location:</span> <strong style="color: #f8fafc;">${actor.loc || "Unknown"}</strong></div>
        <div><span style="color: #94a3b8;">Status / Errand:</span> <span style="color: #cbd5e1;">${actor.status || "On routine"}</span></div>
        ${actor.tick !== undefined ? `<div style="font-size: 10px; color: #64748b;">Tick: ${actor.tick} | Record: ${actor.record || "normal"}</div>` : ""}
      `;
      offGrid.appendChild(card);
    }
    for (const lat of latents) {
      const card = document.createElement("div");
      card.style.cssText = "background: #1e293b; border: 1px solid #6366f1; border-radius: 8px; padding: 10px; font-size: 11px; display: flex; flex-direction: column; gap: 4px;";
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #c084fc; font-size: 12px;">⏳ ${lat.who || lat.id} (Latent)</strong>
          <span style="font-size: 10px; background: rgba(139,92,246,0.2); color: #d8b4fe; padding: 1px 6px; border-radius: 4px;">
            ${lat.status || "pending"}
          </span>
        </div>
        <div><span style="color: #94a3b8;">Errand:</span> <span style="color: #f8fafc;">${lat.errand || "None"}</span></div>
        ${lat.route ? `<div><span style="color: #94a3b8;">Route:</span> ${lat.route}</div>` : ""}
        ${lat.window_opens ? `<div><span style="color: #94a3b8;">Window Opens:</span> <strong style="color: #fca5a5;">${lat.window_opens}</strong></div>` : ""}
      `;
      offGrid.appendChild(card);
    }
    for (const tr of travel) {
      const card = document.createElement("div");
      card.style.cssText = "background: #1e293b; border: 1px solid #38bdf8; border-radius: 8px; padding: 10px; font-size: 11px; display: flex; flex-direction: column; gap: 4px;";
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #38bdf8; font-size: 12px;">\uD83D\uDEB6 ${tr.actor} (In Transit)</strong>
          <span style="font-size: 10px; background: rgba(56,189,248,0.2); color: #7dd3fc; padding: 1px 6px; border-radius: 4px;">
            ${tr.status || "en_route"}
          </span>
        </div>
        <div><span style="color: #94a3b8;">Route:</span> ${tr.from || "?"} ➔ ${tr.to || "?"}</div>
        <div><span style="color: #94a3b8;">Purpose:</span> ${tr.purpose || "Travel"}</div>
        <div style="display: flex; justify-content: space-between; margin-top: 2px;">
          <span>Depart: ${tr.depart || "—"}</span>
          <span style="color: #fca5a5; font-weight: 600;">ETA: ${tr.eta || "—"}</span>
        </div>
      `;
      offGrid.appendChild(card);
    }
    if (offscreenCast.length === 0 && latents.length === 0 && travel.length === 0) {
      offSection.innerHTML += `<div class="vn-muted" style="padding: 10px; background: #0f172a; border-radius: 6px;">All tracked cast members are currently on the active scene.</div>`;
    } else {
      offSection.appendChild(offGrid);
    }
    this.root.appendChild(offSection);
    const theaterSec = document.createElement("div");
    theaterSec.className = "vn-section";
    theaterSec.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <h4 style="margin: 0;">\uD83C\uDFAC Bond Theater — NPC × NPC Offscreen Interlude</h4>
        <span style="font-size: 10px; color: #a5b4fc; background: rgba(99,102,241,0.2); padding: 2px 8px; border-radius: 4px;">Emergent Cutscene Player</span>
      </div>
    `;
    const allNpcCandidates = [
      ...offscreenCast.map((c) => ({ id: c.id, name: c.name || c.id, loc: c.loc, status: c.status, want: "" })),
      ...bplots.map((b) => ({ id: b.who || b.id || "Unknown", name: b.who || b.id, loc: "district", status: b.doing, want: b.want }))
    ];
    const uniqueNpcs = Array.from(new Map(allNpcCandidates.map((n) => [n.id, n])).values());
    if (uniqueNpcs.length < 2) {
      theaterSec.innerHTML += `
        <div class="vn-muted" style="padding: 12px; background: #0f172a; border-radius: 8px; border: 1px dashed #334155; font-size: 11px;">
          Bond Theater stages confidential side scenes when at least two offscreen actors or B-plot carriers are active in the world.
        </div>
      `;
    } else {
      const theaterCard = document.createElement("div");
      theaterCard.style.cssText = "background: #0f172a; border: 1px solid #6366f1; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.4);";
      theaterCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; border-bottom: 1px solid #1e293b; padding-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 11px; color: #94a3b8;">Actor 1:</span>
            <select id="vn-theater-actor-a" style="background: #1e293b; border: 1px solid #475569; color: #38bdf8; font-size: 11px; padding: 3px 8px; border-radius: 4px; outline: none; cursor: pointer;">
              ${uniqueNpcs.map((n) => `<option value="${n.id}">${n.name}</option>`).join("")}
            </select>
            <span style="font-size: 11px; color: #94a3b8;">×</span>
            <span style="font-size: 11px; color: #94a3b8;">Actor 2:</span>
            <select id="vn-theater-actor-b" style="background: #1e293b; border: 1px solid #475569; color: #c084fc; font-size: 11px; padding: 3px 8px; border-radius: 4px; outline: none; cursor: pointer;">
              ${uniqueNpcs.map((n, idx) => `<option value="${n.id}" ${idx === 1 ? "selected" : ""}>${n.name}</option>`).join("")}
            </select>
          </div>
          <button id="vn-start-theater-btn" style="background: linear-gradient(135deg, #4f46e5, #6366f1); border: none; color: #fff; font-size: 11px; font-weight: 700; padding: 5px 14px; border-radius: 6px; cursor: pointer; box-shadow: 0 2px 8px rgba(99,102,241,0.4);">
            ▶ Watch Interlude
          </button>
        </div>

        <div id="vn-theater-stage-box" style="display: flex; flex-direction: column; gap: 8px;">
          <div style="color: #94a3b8; font-size: 11px; font-style: italic; padding: 10px; text-align: center;">
            Select two actors above and click "Watch Interlude" to listen into their offscreen conversation.
          </div>
        </div>
      `;
      theaterSec.appendChild(theaterCard);
      const stageBox = theaterCard.querySelector("#vn-theater-stage-box");
      const startBtn = theaterCard.querySelector("#vn-start-theater-btn");
      const selectA = theaterCard.querySelector("#vn-theater-actor-a");
      const selectB = theaterCard.querySelector("#vn-theater-actor-b");
      startBtn?.addEventListener("click", () => {
        const idA = selectA.value;
        const idB = selectB.value;
        const npcA = uniqueNpcs.find((n) => n.id === idA) || uniqueNpcs[0];
        const npcB = uniqueNpcs.find((n) => n.id === idB) || uniqueNpcs[1];
        const beats = generateBondInterlude(npcA, npcB, ledger.scene?.place);
        let currentBeatIdx = 0;
        const renderBeat = () => {
          stageBox.innerHTML = "";
          const beat = beats[currentBeatIdx];
          const isFinal = currentBeatIdx === beats.length - 1;
          const beatCard = document.createElement("div");
          beatCard.style.cssText = "background: #1e293b; border: 1px solid #475569; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px;";
          beatCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 6px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 14px;">${beat.avatarIcon}</span>
                <strong style="color: ${beat.type === "action" ? "#a5b4fc" : "#38bdf8"}; font-size: 12px;">${beat.speaker}</strong>
              </div>
              <span style="font-size: 10px; color: #94a3b8;">Beat ${currentBeatIdx + 1} of ${beats.length}</span>
            </div>
            <div style="font-size: 12px; color: #f8fafc; line-height: 1.5; font-style: ${beat.type === "action" ? "italic" : "normal"};">
              ${beat.text}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 6px; border-top: 1px solid #334155;">
              <button id="vn-prev-beat-btn" style="background: transparent; border: 1px solid #475569; color: #cbd5e1; font-size: 10px; border-radius: 4px; padding: 3px 8px; cursor: ${currentBeatIdx > 0 ? "pointer" : "default"}; opacity: ${currentBeatIdx > 0 ? "1" : "0.4"};" ${currentBeatIdx === 0 ? "disabled" : ""}>
                ◀ Previous
              </button>
              <div style="display: flex; gap: 6px;">
                ${isFinal ? `
                  <button id="vn-share-intel-btn" style="background: linear-gradient(135deg, #059669, #10b981); border: none; color: #fff; font-size: 10px; font-weight: 700; border-radius: 4px; padding: 4px 10px; cursor: pointer;">
                    \uD83D\uDCE1 Share Intel to Story
                  </button>
                ` : `
                  <button id="vn-next-beat-btn" style="background: #6366f1; border: none; color: #fff; font-size: 10px; font-weight: 700; border-radius: 4px; padding: 4px 12px; cursor: pointer;">
                    Next Beat ▶
                  </button>
                `}
              </div>
            </div>
          `;
          stageBox.appendChild(beatCard);
          beatCard.querySelector("#vn-prev-beat-btn")?.addEventListener("click", () => {
            if (currentBeatIdx > 0) {
              currentBeatIdx -= 1;
              renderBeat();
            }
          });
          beatCard.querySelector("#vn-next-beat-btn")?.addEventListener("click", () => {
            if (currentBeatIdx < beats.length - 1) {
              currentBeatIdx += 1;
              renderBeat();
            }
          });
          beatCard.querySelector("#vn-share-intel-btn")?.addEventListener("click", () => {
            if (this.onAction) {
              const intelText = `[Bond Theater Intel: Overheard confidential meeting between ${npcA.name} and ${npcB.name} regarding their offscreen coordination.]`;
              this.onAction(intelText);
              const shareBtn = beatCard.querySelector("#vn-share-intel-btn");
              if (shareBtn) {
                shareBtn.textContent = "✓ Intel Shared!";
                shareBtn.disabled = true;
              }
            }
          });
        };
        renderBeat();
      });
    }
    this.root.appendChild(theaterSec);
    if (fronts.length > 0) {
      const frontSec = document.createElement("div");
      frontSec.className = "vn-section";
      frontSec.innerHTML = `<h4>⚡ Environmental Fronts & Rising Tensions (${fronts.length})</h4>`;
      const fList = document.createElement("div");
      fList.style.cssText = "display: flex; flex-direction: column; gap: 8px;";
      for (const f of fronts) {
        const item = document.createElement("div");
        item.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 8px 12px; font-size: 11px;";
        const press = f.pressure ?? 0;
        const pressColor = press >= 4 ? "#ef4444" : press >= 3 ? "#f59e0b" : "#38bdf8";
        item.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="color: #f8fafc; font-size: 12px;">${f.id}</strong>
            <span style="font-weight: 700; color: ${pressColor}; background: ${pressColor}22; border: 1px solid ${pressColor}; padding: 1px 6px; border-radius: 4px;">
              Pressure ${press}/5
            </span>
          </div>
          <div style="color: #cbd5e1; margin-bottom: 2px;">${f.cause || "Active pressure"}</div>
          <div style="display: flex; justify-content: space-between; color: #94a3b8; font-size: 10px;">
            <span>Stage: <strong>${f.stage || "initial"}</strong></span>
            ${f.due ? `<span>Due: <strong style="color: #fca5a5;">${f.due}</strong></span>` : ""}
            <span>Known by: ${(f.known_by || []).join(", ") || "None"}</span>
          </div>
        `;
        fList.appendChild(item);
      }
      frontSec.appendChild(fList);
      this.root.appendChild(frontSec);
    }
  }
}

// src/frontend/hud/tab-wardrobe.ts
class WardrobeTab {
  root;
  onAction;
  selectedActorId = null;
  constructor(onAction) {
    this.onAction = onAction;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-wardrobe";
  }
  render(ledger, activeActorId) {
    this.root.innerHTML = "";
    const actorId = activeActorId || this.selectedActorId || (ledger.actors?.["user"] ? "user" : Object.keys(ledger.actors || {})[0] || "user");
    this.selectedActorId = actorId;
    const actor = ledger.actors?.[actorId];
    const outfit = actor?.outfit || {
      top: "None",
      bottom: "None",
      underwear_top: "None",
      underwear_bottom: "None",
      shoes: "None",
      accessories: []
    };
    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `<h3>\uD83D\uDC57 Wardrobe & Dressing — ${actor?.name || actorId}</h3>`;
    this.root.appendChild(header);
    const actorKeys = Object.keys(ledger.actors || {});
    if (actorKeys.length > 1) {
      const switcher = document.createElement("div");
      switcher.style.cssText = "display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;";
      for (const aKey of actorKeys) {
        const aName = ledger.actors?.[aKey]?.name || aKey;
        const btn = document.createElement("button");
        const isSel = aKey === actorId;
        btn.className = `vn-btn vn-btn-sm ${isSel ? "vn-btn-primary" : "vn-btn-secondary"}`;
        btn.innerHTML = `${aKey === "user" ? "\uD83D\uDC64" : "\uD83D\uDC65"} ${aName}`;
        btn.addEventListener("click", () => {
          this.selectedActorId = aKey;
          this.render(ledger, aKey);
        });
        switcher.appendChild(btn);
      }
      this.root.appendChild(switcher);
    }
    const statusBar = document.createElement("div");
    statusBar.className = "vn-wardrobe-status-bar";
    const scentVal = outfit.scent || "Clean";
    const conditionVal = outfit.state || "Pristine";
    const integrityVal = outfit.integrity ?? 100;
    const residueVal = Array.isArray(outfit.residue) && outfit.residue.length > 0 ? outfit.residue.join(", ") : "None";
    statusBar.innerHTML = `
      <div class="vn-wardrobe-status-item"><span>\uD83C\uDF38 Scent:</span> <strong>${scentVal}</strong></div>
      <div class="vn-wardrobe-status-item"><span>\uD83E\uDDFC Condition:</span> <strong>${conditionVal}</strong></div>
      <div class="vn-wardrobe-status-item"><span>\uD83D\uDEE1️ Integrity:</span> <strong>${integrityVal}%</strong></div>
      <div class="vn-wardrobe-status-item"><span>\uD83D\uDCA7 Residue:</span> <strong>${residueVal}</strong></div>
    `;
    this.root.appendChild(statusBar);
    const slotsGrid = document.createElement("div");
    slotsGrid.className = "vn-wardrobe-grid";
    const slots = [
      { label: "Top", icon: "\uD83D\uDC54", key: "top", value: outfit.top || "None" },
      { label: "Bottom", icon: "\uD83D\uDC56", key: "bottom", value: outfit.bottom || "None" },
      { label: "Underwear (Top)", icon: "\uD83D\uDC59", key: "underwear_top", value: outfit.underwear_top || "None" },
      { label: "Underwear (Bottom)", icon: "\uD83E\uDE72", key: "underwear_bottom", value: outfit.underwear_bottom || "None" },
      { label: "Shoes", icon: "\uD83D\uDC5E", key: "shoes", value: outfit.shoes || "None" },
      { label: "Accessories", icon: "\uD83D\uDC8D", key: "accessories", value: outfit.accessories || [] }
    ];
    for (const slot of slots) {
      const card = document.createElement("div");
      card.className = "vn-slot-card";
      const valStr = Array.isArray(slot.value) ? slot.value.length ? slot.value.join(", ") : "None" : slot.value;
      const isEquipped = valStr && valStr.toLowerCase() !== "none" && valStr.trim() !== "";
      card.style.cssText = isEquipped ? "background: rgba(30, 41, 59, 0.85); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 12px; padding: 12px; transition: all 0.2s ease;" : "background: rgba(15, 23, 42, 0.5); border: 1px dashed rgba(255, 255, 255, 0.12); border-radius: 12px; padding: 12px; opacity: 0.75;";
      card.innerHTML = `
        <div class="vn-slot-title" style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #94a3b8; margin-bottom: 6px;">
          <span>${slot.icon}</span>
          <span style="font-weight: 600;">${slot.label}</span>
          ${isEquipped ? `<span style="margin-left: auto; font-size: 10px; background: rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 1px 6px; border-radius: 6px;">Worn</span>` : ""}
        </div>
        <div class="vn-slot-value" style="font-size: 14px; font-weight: 600; color: ${isEquipped ? "#f8fafc" : "#64748b"}; margin-bottom: 10px;">${valStr}</div>
      `;
      const actions = document.createElement("div");
      actions.className = "vn-slot-actions";
      const isUser = actorId === "user";
      const targetName = actor?.name || actorId;
      if (isEquipped) {
        const takeOffBtn = document.createElement("button");
        takeOffBtn.className = "vn-btn vn-btn-sm vn-btn-danger";
        takeOffBtn.textContent = "Take off";
        takeOffBtn.addEventListener("click", () => {
          this.onAction(isUser ? `*Takes off ${slot.label.toLowerCase()}*` : `*Takes off ${targetName}'s ${slot.label.toLowerCase()}*`);
        });
        actions.appendChild(takeOffBtn);
      } else {
        const wearBtn = document.createElement("button");
        wearBtn.className = "vn-btn vn-btn-sm vn-btn-primary";
        wearBtn.textContent = "Wear";
        wearBtn.addEventListener("click", () => {
          this.onAction(isUser ? `*Puts on ${slot.label.toLowerCase()}*` : `*Helps ${targetName} put on ${slot.label.toLowerCase()}*`);
        });
        actions.appendChild(wearBtn);
      }
      card.appendChild(actions);
      slotsGrid.appendChild(card);
    }
    this.root.appendChild(slotsGrid);
    const footer = document.createElement("div");
    footer.className = "vn-tab-footer";
    const isUser = actorId === "user";
    const targetName = actor?.name || actorId;
    const cleanBtn = document.createElement("button");
    cleanBtn.className = "vn-btn vn-btn-primary";
    cleanBtn.textContent = "Clean Clothes";
    cleanBtn.addEventListener("click", () => {
      this.onAction(isUser ? `*Cleans and washes garments*` : `*Cleans and washes ${targetName}'s garments*`);
    });
    const repairBtn = document.createElement("button");
    repairBtn.className = "vn-btn vn-btn-primary";
    repairBtn.textContent = "Repair Garments";
    repairBtn.addEventListener("click", () => {
      this.onAction(isUser ? `*Mends and repairs clothing tears*` : `*Mends and repairs ${targetName}'s clothing tears*`);
    });
    const undressBtn = document.createElement("button");
    undressBtn.className = "vn-btn vn-btn-warning";
    undressBtn.textContent = "Undress to Underwear";
    undressBtn.addEventListener("click", () => {
      this.onAction(isUser ? `*Undresses down to underwear*` : `*Undresses ${targetName} down to underwear*`);
    });
    const stripBtn = document.createElement("button");
    stripBtn.className = "vn-btn vn-btn-danger";
    stripBtn.textContent = "Completely Undress";
    stripBtn.addEventListener("click", () => {
      this.onAction(isUser ? `*Completely strips clothes*` : `*Completely strips ${targetName}'s clothes*`);
    });
    footer.appendChild(cleanBtn);
    footer.appendChild(repairBtn);
    footer.appendChild(undressBtn);
    footer.appendChild(stripBtn);
    this.root.appendChild(footer);
  }
}

// src/frontend/hud/tab-stats.ts
class StatsTab {
  root;
  selectedActorId = "user";
  selectedTargetId = "user";
  constructor() {
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-stats";
  }
  render(ledger) {
    this.root.innerHTML = "";
    const actors = { ...ledger.actors || {} };
    if (ledger.roster && Array.isArray(ledger.roster)) {
      for (const r of ledger.roster) {
        if (r.id && !actors[r.id]) {
          actors[r.id] = {
            id: r.id,
            name: r.name || r.id,
            profile: { public_roles: [r.status || "Resident"] }
          };
        }
      }
    }
    const actorIds = Object.keys(actors);
    if (actorIds.length === 0) {
      this.root.innerHTML = `<div class="vn-muted" style="padding: 32px; text-align: center;">No actor dossiers recorded.</div>`;
      return;
    }
    if (!actors[this.selectedActorId]) {
      const withStats = actorIds.find((id) => actors[id]?.stats || actors[id]?.relations && Object.keys(actors[id].relations).length > 0);
      this.selectedActorId = withStats || actorIds[0];
    }
    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div>
          <h3 style="margin:0; font-size:15px; color:#f8fafc; display:flex; align-items:center; gap:6px;">
            <span>\uD83D\uDCCA</span> <span>Status, Passions & 21-Stat Ledger Matrix</span>
          </h3>
          <p class="vn-muted" style="margin:2px 0 0 0; font-size:11px;">
            Comprehensive emotional equilibrium, psychological friction, RPG vitals, and relational dynamics.
          </p>
        </div>
      </div>
    `;
    this.root.appendChild(header);
    const controls = document.createElement("div");
    controls.style.cssText = "display: flex; gap: 10px; margin-bottom: 14px; align-items: center; flex-wrap: wrap; background: #1e293b; padding: 8px 12px; border-radius: 8px; border: 1px solid #334155;";
    controls.innerHTML = `
      <label style="font-size: 12px; color: #94a3b8; font-weight:600;">Inspect Actor:</label>
      <select id="vn-stats-actor-select" style="background: #0f172a; color: #f8fafc; border: 1px solid #475569; border-radius: 6px; padding: 4px 10px; font-size: 12px;">
        ${actorIds.map((id) => {
      const a = actors[id];
      const label = id.toLowerCase() === "user" ? "Player (You)" : a.name || id;
      const hasMatrix = a.stats ? " [21-Stat]" : "";
      return `<option value="${id}" ${id === this.selectedActorId ? "selected" : ""}>${label}${hasMatrix}</option>`;
    }).join("")}
      </select>
    `;
    this.root.appendChild(controls);
    const actorSelect = controls.querySelector("#vn-stats-actor-select");
    actorSelect.addEventListener("change", () => {
      this.selectedActorId = actorSelect.value;
      this.render(ledger);
    });
    const actor = actors[this.selectedActorId];
    const statsMatrix = actor.stats || {};
    const combat = actor.combat || {};
    if (combat && (combat.hp || combat.pwr || combat.tier)) {
      const vitalsSection = document.createElement("div");
      vitalsSection.className = "vn-section";
      vitalsSection.innerHTML = `<h4>⚔️ Vitals & Attributes</h4>`;
      const vBox = document.createElement("div");
      vBox.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; font-size: 12px;";
      const parseRatio = (val) => {
        if (typeof val === "string" && val.includes("/")) {
          const [cur, max] = val.split("/").map(Number);
          return max && max > 0 ? Math.max(0, Math.min(100, cur / max * 100)) : 100;
        }
        return 100;
      };
      const hpPct = parseRatio(combat.hp);
      const mpPct = parseRatio(combat.mp);
      vBox.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:11px; color:#94a3b8;">
          <span>Tier ${combat.tier ?? 1} | Level ${combat.lv ?? 1}</span>
          <span>EXP: ${combat.exp ?? "0/100"}</span>
        </div>

        <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:10px;">
          <div>
            <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:2px;">
              <span style="color:#f87171; font-weight:700;">HP</span>
              <span style="color:#cbd5e1;">${combat.hp ?? "100/100"}</span>
            </div>
            <div style="background:#0f172a; border-radius:4px; height:8px; overflow:hidden; border:1px solid #334155;">
              <div style="background:linear-gradient(90deg, #ef4444, #f87171); width:${hpPct}%; height:100%;"></div>
            </div>
          </div>

          <div>
            <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:2px;">
              <span style="color:#60a5fa; font-weight:700;">MP</span>
              <span style="color:#cbd5e1;">${combat.mp ?? "50/50"}</span>
            </div>
            <div style="background:#0f172a; border-radius:4px; height:8px; overflow:hidden; border:1px solid #334155;">
              <div style="background:linear-gradient(90deg, #3b82f6, #60a5fa); width:${mpPct}%; height:100%;"></div>
            </div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(70px, 1fr)); gap:6px; text-align:center;">
          <div style="background:#0f172a; padding:4px; border-radius:4px; border:1px solid #334155;"><span style="color:#94a3b8; font-size:10px;">PWR</span><br/><strong style="color:#f8fafc;">${combat.pwr ?? "-"}</strong></div>
          <div style="background:#0f172a; padding:4px; border-radius:4px; border:1px solid #334155;"><span style="color:#94a3b8; font-size:10px;">AGI</span><br/><strong style="color:#f8fafc;">${combat.agi ?? "-"}</strong></div>
          <div style="background:#0f172a; padding:4px; border-radius:4px; border:1px solid #334155;"><span style="color:#94a3b8; font-size:10px;">INT</span><br/><strong style="color:#f8fafc;">${combat.int ?? "-"}</strong></div>
          <div style="background:#0f172a; padding:4px; border-radius:4px; border:1px solid #334155;"><span style="color:#94a3b8; font-size:10px;">Eff PWR</span><br/><strong style="color:#38bdf8;">${combat.eff_pwr ?? "-"}</strong></div>
          <div style="background:#0f172a; padding:4px; border-radius:4px; border:1px solid #334155;"><span style="color:#94a3b8; font-size:10px;">Eff AGI</span><br/><strong style="color:#38bdf8;">${combat.eff_agi ?? "-"}</strong></div>
        </div>
      `;
      vitalsSection.appendChild(vBox);
      this.root.appendChild(vitalsSection);
    }
    const statKeys = Object.keys(statsMatrix);
    if (statKeys.length > 0) {
      const matrixSection = document.createElement("div");
      matrixSection.className = "vn-section";
      matrixSection.innerHTML = `<h4>\uD83C\uDFB2 21-Stat Engine Matrix (${statKeys.length} metrics)</h4>`;
      const matrixBox = document.createElement("div");
      matrixBox.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; gap: 10px;";
      const groups = [
        {
          name: "Interpersonal Stance",
          color: "#818cf8",
          stats: [
            { k: "T", name: "Trust", max: 100 },
            { k: "A", name: "Affinity / Affection", max: 100 },
            { k: "R", name: "Respect", max: 100 },
            { k: "F", name: "Fear", max: 100 },
            { k: "Fam", name: "Familiarity", max: 10 },
            { k: "G", name: "Grudge", max: 100 }
          ]
        },
        {
          name: "Psychological Equilibrium",
          color: "#38bdf8",
          stats: [
            { k: "Integ", name: "Integrity", max: 100 },
            { k: "Stress", name: "Stress Level", max: 100 },
            { k: "CAU", name: "Caution", max: 100 },
            { k: "GRD", name: "Guard / Defense", max: 100 },
            { k: "PRD", name: "Pride", max: 100 },
            { k: "EMP", name: "Empathy", max: 100 },
            { k: "STB", name: "Stability", max: 100 },
            { k: "BLD", name: "Bleed / Leakage", max: 100 }
          ]
        },
        {
          name: "Behavioral Dynamics",
          color: "#f43f5e",
          stats: [
            { k: "RX", name: "Reactiveness", max: 100 },
            { k: "RC", name: "Recovery Rate", max: 100 },
            { k: "Rig", name: "Rigidity", max: 100 },
            { k: "Mask", name: "Social Facade", max: 100 },
            { k: "MIS", name: "Misperception", max: 100 },
            { k: "WV", name: "Willpower", max: 100 },
            { k: "COMP", name: "Compliance", max: 100 }
          ]
        }
      ];
      for (const grp of groups) {
        const groupEl = document.createElement("div");
        groupEl.innerHTML = `<div style="font-size:11px; font-weight:700; color:${grp.color}; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">${grp.name}</div>`;
        const grid = document.createElement("div");
        grid.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 6px;";
        for (const def of grp.stats) {
          const val = statsMatrix[def.k];
          if (val !== undefined) {
            const num = Number(val);
            const pct = Math.max(0, Math.min(100, num / def.max * 100));
            const card = document.createElement("div");
            card.style.cssText = "background: #0f172a; border: 1px solid #334155; border-radius: 6px; padding: 4px 8px; font-size: 11px;";
            card.innerHTML = `
              <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                <span style="color:#94a3b8;">${def.k} <span style="font-size:9px; color:#64748b;">(${def.name})</span></span>
                <strong style="color:#f8fafc;">${num}</strong>
              </div>
              <div style="background:#1e293b; border-radius:3px; height:4px; overflow:hidden;">
                <div style="background:${grp.color}; width:${pct}%; height:100%;"></div>
              </div>
            `;
            grid.appendChild(card);
          }
        }
        groupEl.appendChild(grid);
        matrixBox.appendChild(groupEl);
      }
      matrixSection.appendChild(matrixBox);
      this.root.appendChild(matrixSection);
    }
    const passionsSection = document.createElement("div");
    passionsSection.className = "vn-section";
    passionsSection.innerHTML = `<h4>\uD83D\uDD25 Current Passions & Affect</h4>`;
    const badgesContainer = document.createElement("div");
    badgesContainer.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 8px;";
    const passions = actor.passions || {};
    const passionDefs = [
      { name: "Arousal", key: "arousal", icon: "\uD83D\uDD25", color: "linear-gradient(90deg, #a855f7, #ec4899)" },
      { name: "Anger", key: "anger", icon: "\uD83D\uDCA2", color: "linear-gradient(90deg, #f87171, #ef4444)" },
      { name: "Joy", key: "joy", icon: "\uD83D\uDE0A", color: "linear-gradient(90deg, #34d399, #10b981)" },
      { name: "Stress", key: "stress", icon: "⚡", color: "linear-gradient(90deg, #fbbf24, #f59e0b)" },
      { name: "Fear", key: "fear", icon: "\uD83D\uDE28", color: "linear-gradient(90deg, #818cf8, #4f46e5)" },
      { name: "Shame", key: "shame", icon: "\uD83D\uDE33", color: "linear-gradient(90deg, #fb923c, #f97316)" },
      { name: "Suspicion", key: "suspicion", icon: "\uD83D\uDD75️", color: "linear-gradient(90deg, #94a3b8, #64748b)" },
      { name: "Exhaustion", key: "exhaustion", icon: "\uD83D\uDCA4", color: "linear-gradient(90deg, #64748b, #475569)" },
      { name: "Pain", key: "pain", icon: "\uD83E\uDE79", color: "linear-gradient(90deg, #f43f5e, #be123c)" },
      { name: "Sadness", key: "sadness", icon: "\uD83D\uDCA7", color: "linear-gradient(90deg, #60a5fa, #2563eb)" },
      { name: "Disgust", key: "disgust", icon: "\uD83E\uDD22", color: "linear-gradient(90deg, #a3e635, #65a30d)" },
      { name: "Guilt", key: "guilt", icon: "\uD83E\uDD40", color: "linear-gradient(90deg, #c084fc, #9333ea)" }
    ];
    let hasBadge = false;
    for (const def of passionDefs) {
      const val = Number(passions[def.key] ?? 0);
      if (val > 0) {
        hasBadge = true;
        const card = document.createElement("div");
        card.style.cssText = "background: #0f172a; border: 1px solid #334155; border-radius: 6px; padding: 6px 10px; display: flex; flex-direction: column; gap: 4px;";
        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; font-size: 11px;">
            <span style="font-weight: 600; color: #f1f5f9;">${def.icon} ${def.name}</span>
            <strong style="color: #cbd5e1;">${val}</strong>
          </div>
          <div style="background: #1e293b; border-radius: 3px; height: 5px; overflow: hidden;">
            <div style="background: ${def.color}; width: ${Math.min(100, val)}%; height: 100%; transition: width 0.4s ease;"></div>
          </div>
        `;
        badgesContainer.appendChild(card);
      }
    }
    if (!hasBadge) {
      badgesContainer.innerHTML = `<span class="vn-muted" style="padding:4px; grid-column: 1 / -1;">Equilibrium / Baseline emotional state</span>`;
    }
    passionsSection.appendChild(badgesContainer);
    this.root.appendChild(passionsSection);
    const rels = actor.relations || {};
    const availableTargets = Object.keys(rels);
    const relsSection = document.createElement("div");
    relsSection.className = "vn-section";
    if (availableTargets.length === 0) {
      relsSection.innerHTML = `<h4>\uD83E\uDD1D Interpersonal Relations</h4><div class="vn-muted">No outgoing relationship edges initialized for this actor.</div>`;
      this.root.appendChild(relsSection);
    } else {
      if (!rels[this.selectedTargetId]) {
        this.selectedTargetId = availableTargets[0];
      }
      relsSection.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h4 style="margin: 0;">Relations Toward:</h4>
        <select id="vn-stats-target-select" style="background: #1e293b; color: #f8fafc; border: 1px solid #475569; border-radius: 6px; padding: 4px 8px; font-size: 12px;">
          ${availableTargets.map((t) => `<option value="${t}" ${t === this.selectedTargetId ? "selected" : ""}>${t.toLowerCase() === "user" ? "Player (You)" : actors[t]?.name || t}</option>`).join("")}
        </select>
      </div>
    `;
      const targetSelect = relsSection.querySelector("#vn-stats-target-select");
      targetSelect.addEventListener("change", () => {
        this.selectedTargetId = targetSelect.value;
        this.render(ledger);
      });
      const activeRel = rels[this.selectedTargetId] || {};
      const metersContainer = document.createElement("div");
      metersContainer.className = "vn-meters-container";
      const relMeters = [
        { label: "Affinity", icon: "\uD83D\uDC96", min: -100, max: 100, val: Number(activeRel.affinity ?? 0), gradient: "linear-gradient(90deg, #ec4899, #f43f5e)" },
        { label: "Trust", icon: "\uD83E\uDD1D", min: -100, max: 100, val: Number(activeRel.trust ?? 0), gradient: "linear-gradient(90deg, #06b6d4, #3b82f6)" },
        { label: "Respect", icon: "\uD83D\uDEE1️", min: -100, max: 100, val: Number(activeRel.respect ?? 0), gradient: "linear-gradient(90deg, #818cf8, #6366f1)" },
        { label: "Attraction", icon: "\uD83D\uDD25", min: -100, max: 100, val: Number(activeRel.attraction ?? 0), gradient: "linear-gradient(90deg, #c084fc, #e11d48)" },
        { label: "Fear", icon: "\uD83D\uDE28", min: 0, max: 100, val: Number(activeRel.fear ?? 0), gradient: "linear-gradient(90deg, #6366f1, #312e81)" },
        { label: "Familiarity", icon: "☕", min: 0, max: 100, val: Number(activeRel.familiarity ?? 0), gradient: "linear-gradient(90deg, #10b981, #14b8a6)" },
        { label: "Attachment", icon: "\uD83D\uDD17", min: 0, max: 100, val: Number(activeRel.attachment ?? 0), gradient: "linear-gradient(90deg, #f59e0b, #d97706)" },
        { label: "Grudge", icon: "\uD83D\uDCA2", min: 0, max: 100, val: Number(activeRel.grudge ?? 0), gradient: "linear-gradient(90deg, #ef4444, #991b1b)" },
        { label: "Loyalty", icon: "⚔️", min: 0, max: 100, val: Number(activeRel.loyalty ?? 0), gradient: "linear-gradient(90deg, #f59e0b, #eab308)" },
        { label: "Sacrifice Willingness", icon: "✨", min: 0, max: 100, val: Number(activeRel.sacrifice_willingness ?? 0), gradient: "linear-gradient(90deg, #38bdf8, #a855f7)" }
      ];
      for (const m of relMeters) {
        const pct = m.min < 0 ? Math.max(0, Math.min(100, (m.val + 100) / 200 * 100)) : Math.max(0, Math.min(100, m.val / m.max * 100));
        const row = document.createElement("div");
        row.className = "vn-meter-row";
        row.style.cssText = "background: #0f172a; border: 1px solid #1e293b; border-radius: 6px; padding: 6px 10px; margin-bottom: 6px;";
        row.innerHTML = `
        <div class="vn-meter-header" style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px;">
          <span style="font-weight: 600; color: #f1f5f9;">${m.icon} ${m.label}</span>
          <span style="font-weight: 700; color: #cbd5e1;">${m.val > 0 && m.min < 0 ? `+${m.val}` : m.val}</span>
        </div>
        <div class="vn-meter-bar-bg" style="background: #1e293b; border-radius: 4px; height: 7px; overflow: hidden;">
          <div class="vn-meter-bar-fill" style="width: ${pct}%; height: 100%; background: ${m.gradient}; box-shadow: 0 0 6px rgba(255,255,255,0.2); transition: width 0.4s ease;"></div>
        </div>
      `;
        metersContainer.appendChild(row);
      }
      const bThresh = activeRel.betrayal_threshold ?? "N/A";
      const extraInfo = document.createElement("div");
      extraInfo.style.cssText = "margin-top: 14px; background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px; font-size: 12px; display: flex; flex-direction: column; gap: 8px;";
      const formatChip = (item, color, badge) => {
        const text = typeof item === "object" ? item.truth || item.id || JSON.stringify(item) : String(item);
        return `<span style="display:inline-flex; align-items:center; gap:4px; background:${color}22; border:1px solid ${color}66; color:${color}; padding:2px 8px; border-radius:12px; font-size:11px; margin:2px 4px 2px 0;"><strong>${badge}</strong> ${text}</span>`;
      };
      const leverageChips = Array.isArray(activeRel.leverage) && activeRel.leverage.length > 0 ? activeRel.leverage.map((item) => formatChip(item, "#f59e0b", "LEVERAGE")).join("") : '<span class="vn-muted">None</span>';
      const obligationChips = Array.isArray(activeRel.obligations) && activeRel.obligations.length > 0 ? activeRel.obligations.map((item) => formatChip(item, "#38bdf8", "DEBT")).join("") : '<span class="vn-muted">None</span>';
      extraInfo.innerHTML = `
      <div style="display:flex; justify-content:space-between;">
        <span style="color: #94a3b8;">Betrayal Threshold:</span>
        <strong style="color: #fca5a5;">${bThresh}</strong>
      </div>
      <div>
        <span style="color: #94a3b8;">Shared Secrets:</span>
        <span style="color: #f8fafc;">${activeRel.shared_secrets && activeRel.shared_secrets.length ? activeRel.shared_secrets.join(", ") : "None"}</span>
      </div>
      <div>
        <div style="color: #94a3b8; margin-bottom: 4px;">Held Leverage:</div>
        <div>${leverageChips}</div>
      </div>
      <div>
        <div style="color: #94a3b8; margin-bottom: 4px;">Obligations:</div>
        <div>${obligationChips}</div>
      </div>
    `;
      metersContainer.appendChild(extraInfo);
      relsSection.appendChild(metersContainer);
      this.root.appendChild(relsSection);
    }
    const investigations = ledger.world?.investigations;
    if (investigations && Object.keys(investigations).length > 0) {
      const invSection = document.createElement("div");
      invSection.className = "vn-section";
      invSection.innerHTML = `<h4>\uD83D\uDD0D Active Investigations</h4>`;
      const invContainer = document.createElement("div");
      invContainer.style.cssText = "display: flex; flex-direction: column; gap: 8px;";
      for (const [auth, track] of Object.entries(investigations)) {
        if (!track)
          continue;
        const card = document.createElement("div");
        card.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px; font-size: 12px;";
        const alertColor = track.alert_level >= 3 ? "#ef4444" : track.alert_level === 2 ? "#f59e0b" : track.alert_level === 1 ? "#38bdf8" : "#94a3b8";
        const alertLabel = track.alert_level === 3 ? "Active Warrant" : track.alert_level === 2 ? "Suspect Named" : track.alert_level === 1 ? "Clue Found" : "Dormant";
        const clues = Array.isArray(track.clues) && track.clues.length > 0 ? track.clues.join(", ") : "None";
        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <strong style="color:#f8fafc; font-size:13px;">${track.authority || auth}</strong>
            <span style="background:${alertColor}22; border:1px solid ${alertColor}88; color:${alertColor}; padding:2px 8px; border-radius:10px; font-weight:600; font-size:10px;">
              Level ${track.alert_level}: ${alertLabel}
            </span>
          </div>
          <div style="color:#cbd5e1; font-size:11px; margin-bottom:4px;">
            <span style="color:#94a3b8;">Target:</span> <strong>${track.target_id || "Unidentified"}</strong>
          </div>
          <div style="color:#cbd5e1; font-size:11px;">
            <span style="color:#94a3b8;">Clues Linked:</span> <em>${clues}</em>
          </div>
        `;
        invContainer.appendChild(card);
      }
      invSection.appendChild(invContainer);
      this.root.appendChild(invSection);
    }
  }
}

// src/frontend/hud/tab-inventory.ts
function parseClockHour(clockT, phase) {
  if (clockT) {
    const match = clockT.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      const h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      return h + m / 60;
    }
  }
  const p = (phase || "").toLowerCase();
  if (p.includes("dawn") || p.includes("morning"))
    return 8;
  if (p.includes("afternoon") || p.includes("noon"))
    return 14;
  if (p.includes("dusk") || p.includes("sunset") || p.includes("evening"))
    return 18;
  if (p.includes("night") || p.includes("midnight"))
    return 22;
  return 12;
}
function isShopOpen(shop, hour) {
  if (shop.openHour <= shop.closeHour) {
    return hour >= shop.openHour && hour < shop.closeHour;
  }
  return hour >= shop.openHour || hour < shop.closeHour;
}
var DEFAULT_DISTRICT_SHOPS = [
  {
    id: "alchemist",
    name: "Apothecary & Alchemist's Emporium",
    icon: "⚗️",
    placeKey: "market",
    openHour: 8,
    closeHour: 20,
    shopkeeper: "Master Alchemist Lyra",
    items: [
      { id: "hp_potion", name: "Health Draught", icon: "\uD83E\uDDEA", type: "consumable", price: 35, stock: 5, maxStock: 10, desc: "Restores 45 HP immediately." },
      { id: "mp_elixir", name: "Starlight Elixir", icon: "\uD83D\uDCA7", type: "consumable", price: 45, stock: 4, maxStock: 8, desc: "Restores 35 MP/Energy." },
      { id: "cure_salve", name: "Herbal Ointment", icon: "\uD83C\uDF3F", type: "consumable", price: 25, stock: 6, maxStock: 12, desc: "Soothes status conditions and fatigue." }
    ]
  },
  {
    id: "blacksmith",
    name: "Ironforge Armory & Smithy",
    icon: "⚒️",
    placeKey: "forge",
    openHour: 7,
    closeHour: 18,
    shopkeeper: "Goran the Smith",
    items: [
      { id: "steel_sword", name: "Tempered Steel Blade", icon: "\uD83D\uDDE1️", type: "equipment", price: 120, stock: 2, maxStock: 3, desc: "+15 Physical ATK in combat." },
      { id: "leather_armor", name: "Reinforced Leather Vest", icon: "\uD83E\uDD4B", type: "equipment", price: 95, stock: 3, maxStock: 4, desc: "+10 Armor & mitigation." },
      { id: "whetstone", name: "Dwarven Whetstone", icon: "\uD83E\uDEA8", type: "item", price: 20, stock: 8, maxStock: 10, desc: "Maintains weapon sharpness." }
    ]
  },
  {
    id: "bakery_inn",
    name: "The Golden Hearth Bakery & Tavern",
    icon: "\uD83C\uDF5E",
    placeKey: "tavern",
    openHour: 6,
    closeHour: 23,
    shopkeeper: "Innkeeper Martha",
    items: [
      { id: "fresh_loaf", name: "Warm Honey Bread", icon: "\uD83E\uDD50", type: "consumable", price: 10, stock: 12, maxStock: 15, desc: "Delicious wholesome bread. Heals 15 HP." },
      { id: "spiced_tea", name: "Fragrant Spiced Tea", icon: "☕", type: "consumable", price: 12, stock: 10, maxStock: 15, desc: "Warms the heart, restores 10 MP." },
      { id: "tavern_ale", name: "Golden Amber Ale", icon: "\uD83C\uDF7A", type: "consumable", price: 15, stock: 10, maxStock: 20, desc: "Boosts courage and morale." }
    ]
  },
  {
    id: "night_market",
    name: "Velvet Crescent Night Bazaar",
    icon: "\uD83C\uDF19",
    placeKey: "slums",
    openHour: 20,
    closeHour: 5,
    shopkeeper: "Shrouded Dealer Ren",
    items: [
      { id: "lockpick_set", name: "Thief's Tension Tools", icon: "\uD83D\uDDDD️", type: "item", price: 75, stock: 3, maxStock: 5, desc: "Opens locked chests and backdoors." },
      { id: "smoke_bomb", name: "Shadowflash Smoke Powder", icon: "\uD83D\uDCA8", type: "consumable", price: 50, stock: 4, maxStock: 6, desc: "Guarantees escape or surprise attack." },
      { id: "spell_tome", name: "Tome of Forgotten Arcana", icon: "\uD83D\uDCD6", type: "book", price: 180, stock: 1, maxStock: 1, desc: "Grants skill progression insight." }
    ]
  }
];
function getItemIcon(itemName) {
  const norm = itemName.toLowerCase();
  if (norm.includes("sword") || norm.includes("blade") || norm.includes("katana") || norm.includes("knife") || norm.includes("dagger") || norm.includes("weapon") || norm.includes("gun"))
    return "\uD83D\uDDE1️";
  if (norm.includes("phone") || norm.includes("smartphone") || norm.includes("device") || norm.includes("terminal"))
    return "\uD83D\uDCF1";
  if (norm.includes("key") || norm.includes("card") || norm.includes("pass"))
    return "\uD83D\uDD11";
  if (norm.includes("potion") || norm.includes("draught") || norm.includes("elixir") || norm.includes("medicine") || norm.includes("pill") || norm.includes("aid") || norm.includes("bandage") || norm.includes("ointment"))
    return "\uD83E\uDDEA";
  if (norm.includes("book") || norm.includes("letter") || norm.includes("note") || norm.includes("scroll") || norm.includes("diary") || norm.includes("tome"))
    return "\uD83D\uDCDC";
  if (norm.includes("food") || norm.includes("apple") || norm.includes("snack") || norm.includes("bento") || norm.includes("bread") || norm.includes("loaf"))
    return "\uD83E\uDD6A";
  if (norm.includes("drink") || norm.includes("water") || norm.includes("tea") || norm.includes("coffee") || norm.includes("soda") || norm.includes("bottle") || norm.includes("ale"))
    return "☕";
  if (norm.includes("ring") || norm.includes("necklace") || norm.includes("amulet") || norm.includes("badge") || norm.includes("ribbon"))
    return "\uD83D\uDC8D";
  if (norm.includes("wallet") || norm.includes("money") || norm.includes("coin") || norm.includes("cash") || norm.includes("gold"))
    return "\uD83D\uDCB0";
  if (norm.includes("bag") || norm.includes("backpack") || norm.includes("case") || norm.includes("pouch"))
    return "\uD83C\uDF92";
  return "\uD83D\uDCE6";
}
function extractDistrictShops(ledger) {
  const dynamicShops = [];
  const places = Object.entries(ledger.places || {});
  for (const [key, place] of places) {
    const fn = (place.function || key).toLowerCase();
    const isCommercial = fn.includes("shop") || fn.includes("market") || fn.includes("store") || fn.includes("tavern") || fn.includes("inn") || fn.includes("forge") || fn.includes("apothecary") || fn.includes("bakery") || fn.includes("merchant") || place.resources && place.resources.length > 0;
    if (isCommercial) {
      const cleanKey = key.replace(/^@/, "");
      const namePart = cleanKey.includes(":") ? cleanKey.split(":")[1] : cleanKey;
      const displayName = namePart.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      let icon = "\uD83C\uDFEA";
      if (fn.includes("tavern") || fn.includes("inn"))
        icon = "\uD83C\uDF7A";
      else if (fn.includes("forge") || fn.includes("smith"))
        icon = "⚒️";
      else if (fn.includes("apothecary") || fn.includes("herb"))
        icon = "⚗️";
      else if (fn.includes("bakery") || fn.includes("food"))
        icon = "\uD83C\uDF5E";
      const items = (place.resources || []).map((res, idx) => ({
        id: `dyn_item_${cleanKey}_${idx}`,
        name: String(res).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        icon: getItemIcon(String(res)),
        type: "item",
        price: 20 + idx * 15,
        stock: 3,
        maxStock: 5,
        desc: `Local commodity available at ${displayName}.`
      }));
      if (items.length === 0) {
        items.push({
          id: `dyn_item_${cleanKey}_staple`,
          name: `${displayName} Provisions`,
          icon: "\uD83D\uDCE6",
          type: "consumable",
          price: 25,
          stock: 5,
          maxStock: 10,
          desc: `Essential local supplies from ${displayName}.`
        });
      }
      dynamicShops.push({
        id: cleanKey,
        name: displayName,
        icon,
        placeKey: key,
        openHour: 7,
        closeHour: 21,
        shopkeeper: place.population || place.users || "Local Merchant",
        items
      });
    }
  }
  if (dynamicShops.length === 0 && places.length > 0) {
    for (const [key, place] of places) {
      const cleanKey = key.replace(/^@/, "");
      const namePart = cleanKey.includes(":") ? cleanKey.split(":")[1] : cleanKey;
      const displayName = namePart.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const fn = (place.function || cleanKey).toLowerCase();
      let icon = "\uD83C\uDFEA";
      let shopSuffix = "Supply Post";
      if (fn.includes("tavern") || fn.includes("inn") || fn.includes("bar") || fn.includes("lounge")) {
        icon = "\uD83C\uDF7A";
        shopSuffix = "Lounge Bar";
      } else if (fn.includes("forge") || fn.includes("smith") || fn.includes("armory")) {
        icon = "⚒️";
        shopSuffix = "Smithy & Armory";
      } else if (fn.includes("apothecary") || fn.includes("herb") || fn.includes("clinic") || fn.includes("medic")) {
        icon = "⚗️";
        shopSuffix = "Dispensary";
      } else if (fn.includes("kitchen") || fn.includes("dining") || fn.includes("pantry") || fn.includes("cafe")) {
        icon = "\uD83C\uDF5E";
        shopSuffix = "Provisions";
      } else if (fn.includes("dojo") || fn.includes("gym") || fn.includes("arena")) {
        icon = "\uD83E\uDD4B";
        shopSuffix = "Armory & Gear";
      } else if (fn.includes("school") || fn.includes("academy") || fn.includes("campus") || fn.includes("library")) {
        icon = "\uD83D\uDCDA";
        shopSuffix = "Commissary";
      } else if (fn.includes("residence") || fn.includes("room") || fn.includes("house") || fn.includes("foyer") || fn.includes("mansion")) {
        icon = "\uD83C\uDFE0";
        shopSuffix = "Quartermaster";
      }
      const items = (place.resources || []).map((res, idx) => ({
        id: `dyn_item_${cleanKey}_${idx}`,
        name: String(res).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        icon: getItemIcon(String(res)),
        type: "item",
        price: 20 + idx * 15,
        stock: 3,
        maxStock: 5,
        desc: `Local resource acquired from ${displayName}.`
      }));
      if (items.length === 0) {
        items.push({
          id: `dyn_item_${cleanKey}_staple`,
          name: `${displayName} Supplies`,
          icon: "\uD83D\uDCE6",
          type: "consumable",
          price: 25,
          stock: 5,
          maxStock: 10,
          desc: `Local commodity available at ${displayName}.`
        });
      }
      dynamicShops.push({
        id: cleanKey,
        name: `${displayName} ${shopSuffix}`,
        icon,
        placeKey: key,
        openHour: 6,
        closeHour: 23,
        shopkeeper: place.population || place.users || `${displayName} Merchant`,
        items
      });
    }
  }
  if (dynamicShops.length === 0 && (ledger.scene?.place || ledger.clock?.location)) {
    const activePlace = ledger.scene?.place || ledger.clock?.location || "Local District";
    const cleanKey = activePlace.replace(/^@/, "");
    const namePart = cleanKey.includes(":") ? cleanKey.split(":")[1] : cleanKey;
    const displayName = namePart.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    dynamicShops.push({
      id: cleanKey,
      name: `${displayName} Merchant Post`,
      icon: "\uD83C\uDFEA",
      placeKey: activePlace,
      openHour: 6,
      closeHour: 23,
      shopkeeper: "District Merchant",
      items: [
        {
          id: `dyn_item_${cleanKey}_staple`,
          name: `${displayName} Supplies`,
          icon: "\uD83D\uDCE6",
          type: "consumable",
          price: 25,
          stock: 5,
          maxStock: 10,
          desc: `Local goods from ${displayName}.`
        }
      ]
    });
  }
  if (dynamicShops.length > 0) {
    return [...dynamicShops, ...DEFAULT_DISTRICT_SHOPS];
  }
  return DEFAULT_DISTRICT_SHOPS;
}

class InventoryTab {
  root;
  onAction;
  currentView = "inventory";
  playerGold = 200;
  shops = JSON.parse(JSON.stringify(DEFAULT_DISTRICT_SHOPS));
  constructor(onAction) {
    this.onAction = onAction;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-inventory";
  }
  render(ledger, activeActorId) {
    this.root.innerHTML = "";
    this.shops = extractDistrictShops(ledger);
    const actorId = activeActorId || (ledger.actors?.["user"] ? "user" : Object.keys(ledger.actors || {})[0] || "user");
    const actor = ledger.actors?.[actorId];
    const inv = actor?.inventory || {
      in_hand: { L: "Empty", R: "Empty" },
      carried: [],
      room: [],
      room_location: ""
    };
    const currentHour = parseClockHour(ledger.clock?.t, ledger.clock?.phase);
    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <h3 style="margin: 0; font-size: 15px; color: #f8fafc; display: flex; align-items: center; gap: 6px;">
            <span>\uD83C\uDF92</span> <span>${this.currentView === "inventory" ? `Inventory & Containers — ${actor?.name || actorId}` : "Living District Marketplace & Trading"}</span>
          </h3>
          <p class="vn-muted" style="margin: 2px 0 0 0; font-size: 11px;">
            <span>⏱️ <strong>${ledger.clock?.t || "D1 12:00"}</strong> (${ledger.clock?.phase || "Day"})</span>
            <span> • \uD83D\uDCB0 <strong style="color: #ffd700;">${this.playerGold} Gold</strong></span>
          </p>
        </div>
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 2px; display: flex; gap: 4px;">
          <button id="vn-inv-tab-btn" style="border: none; border-radius: 4px; padding: 4px 10px; font-size: 11px; cursor: pointer; ${this.currentView === "inventory" ? "background: #6366f1; color: #fff; font-weight: 600;" : "background: transparent; color: #94a3b8;"}">
            \uD83C\uDF92 Backpack
          </button>
          <button id="vn-market-tab-btn" style="border: none; border-radius: 4px; padding: 4px 10px; font-size: 11px; cursor: pointer; ${this.currentView === "marketplace" ? "background: #6366f1; color: #fff; font-weight: 600;" : "background: transparent; color: #94a3b8;"}">
            \uD83C\uDFEA Marketplace
          </button>
        </div>
      </div>
    `;
    this.root.appendChild(header);
    header.querySelector("#vn-inv-tab-btn")?.addEventListener("click", () => {
      this.currentView = "inventory";
      this.render(ledger, activeActorId);
    });
    header.querySelector("#vn-market-tab-btn")?.addEventListener("click", () => {
      this.currentView = "marketplace";
      this.render(ledger, activeActorId);
    });
    if (this.currentView === "marketplace") {
      this.renderMarketplaceView(ledger, inv, currentHour, activeActorId);
      return;
    }
    const handsSection = document.createElement("div");
    handsSection.className = "vn-section";
    handsSection.innerHTML = `<h4>✋ In Hands</h4>`;
    const handsGrid = document.createElement("div");
    handsGrid.style.cssText = "display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px;";
    for (const hand of ["L", "R"]) {
      const item = inv.in_hand?.[hand] || "Empty";
      const isEmpty = item.toLowerCase() === "empty";
      const card = document.createElement("div");
      card.style.cssText = `background: #0f172a; border: 1px solid ${isEmpty ? "#334155" : "#6366f1"}; border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; box-shadow: ${isEmpty ? "none" : "0 0 10px rgba(99,102,241,0.2)"};`;
      card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 22px;">${isEmpty ? "✋" : getItemIcon(item)}</span>
          <div>
            <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">${hand === "L" ? "Left Hand" : "Right Hand"}</div>
            <div style="font-size: 13px; font-weight: 700; color: ${isEmpty ? "#64748b" : "#f8fafc"};">${item}</div>
          </div>
        </div>
      `;
      if (!isEmpty) {
        const btn = document.createElement("button");
        btn.className = "vn-btn vn-btn-sm vn-btn-warning";
        btn.style.cssText = "padding: 4px 10px; font-size: 11px; cursor: pointer;";
        btn.textContent = "Stow";
        btn.addEventListener("click", () => {
          this.onAction(`*Stows ${item} from ${hand === "L" ? "left" : "right"} hand*`);
        });
        card.appendChild(btn);
      }
      handsGrid.appendChild(card);
    }
    handsSection.appendChild(handsGrid);
    this.root.appendChild(handsSection);
    const carriedSection = document.createElement("div");
    carriedSection.className = "vn-section";
    carriedSection.innerHTML = `<h4>\uD83C\uDF92 Carried Backpack (${inv.carried?.length || 0})</h4>`;
    const carriedGrid = document.createElement("div");
    carriedGrid.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px;";
    if (!inv.carried || inv.carried.length === 0) {
      carriedGrid.innerHTML = `<div class="vn-muted" style="grid-column: 1 / -1; padding: 12px; text-align: center; background: #0f172a; border-radius: 8px; border: 1px dashed #334155;">Backpack is empty.</div>`;
    } else {
      for (const item of inv.carried) {
        const card = document.createElement("div");
        card.style.cssText = "background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; justify-content: space-between; gap: 8px; transition: border-color 0.15s ease;";
        card.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">${getItemIcon(item)}</span>
            <span style="font-size: 12px; font-weight: 600; color: #f8fafc; word-break: break-word; line-height: 1.3;">${item}</span>
          </div>
          <div style="display: flex; gap: 4px; margin-top: auto; padding-top: 6px; border-top: 1px solid #1e293b;">
            <button class="vn-btn vn-btn-sm vn-btn-primary vn-equip-btn" style="flex: 1; padding: 3px 0; font-size: 10px; font-weight: 600;">Equip</button>
            <button class="vn-btn vn-btn-sm vn-btn-secondary vn-use-btn" style="flex: 1; padding: 3px 0; font-size: 10px; font-weight: 600;">Use</button>
            <button class="vn-btn vn-btn-sm vn-btn-danger vn-drop-btn" style="padding: 3px 6px; font-size: 10px;" title="Drop">✕</button>
          </div>
        `;
        card.querySelector(".vn-equip-btn")?.addEventListener("click", () => {
          this.onAction(`*Equips ${item} in hand*`);
        });
        card.querySelector(".vn-use-btn")?.addEventListener("click", () => {
          this.onAction(`*Uses ${item}*`);
        });
        card.querySelector(".vn-drop-btn")?.addEventListener("click", () => {
          this.onAction(`*Drops ${item} on the ground*`);
        });
        carriedGrid.appendChild(card);
      }
    }
    carriedSection.appendChild(carriedGrid);
    this.root.appendChild(carriedSection);
    const roomSection = document.createElement("div");
    roomSection.className = "vn-section";
    const roomLoc = inv.room_location ? ` (${inv.room_location})` : "";
    roomSection.innerHTML = `<h4>\uD83D\uDCE6 Room Container${roomLoc}</h4>`;
    const roomGrid = document.createElement("div");
    roomGrid.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px;";
    if (!inv.room || inv.room.length === 0) {
      roomGrid.innerHTML = `<div class="vn-muted" style="grid-column: 1 / -1; padding: 12px; text-align: center; background: #0f172a; border-radius: 8px; border: 1px dashed #334155;">Container is empty.</div>`;
    } else {
      for (const item of inv.room) {
        const card = document.createElement("div");
        card.style.cssText = "background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 10px; display: flex; justify-content: space-between; align-items: center; gap: 8px;";
        card.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">${getItemIcon(item)}</span>
            <span style="font-size: 12px; font-weight: 600; color: #cbd5e1; word-break: break-word;">${item}</span>
          </div>
          <button class="vn-btn vn-btn-sm vn-btn-primary vn-take-btn" style="padding: 3px 8px; font-size: 10px; font-weight: 600;">Take</button>
        `;
        card.querySelector(".vn-take-btn")?.addEventListener("click", () => {
          this.onAction(`*Takes ${item} from container*`);
        });
        roomGrid.appendChild(card);
      }
    }
    roomSection.appendChild(roomGrid);
    this.root.appendChild(roomSection);
  }
  renderMarketplaceView(ledger, inv, currentHour, activeActorId) {
    const marketWrap = document.createElement("div");
    marketWrap.style.cssText = "display: flex; flex-direction: column; gap: 14px;";
    const banner = document.createElement("div");
    banner.style.cssText = "background: #0f172a; border: 1px solid #3b82f6; border-radius: 8px; padding: 10px 14px; font-size: 11px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;";
    banner.innerHTML = `
      <div>
        <strong style="color: #60a5fa;">Living District Trading Hub:</strong>
        <span style="color: #cbd5e1;"> Shops follow autonomous diurnal schedules. Visit open stalls to buy equipment or barter surplus carried items.</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="color: #fde047; font-weight: 700;">Wallet: ${this.playerGold}g</span>
        <button id="vn-market-add-funds" style="background: #1e293b; border: 1px solid #475569; color: #94a3b8; font-size: 10px; border-radius: 4px; padding: 2px 6px; cursor: pointer;">+50g</button>
      </div>
    `;
    marketWrap.appendChild(banner);
    banner.querySelector("#vn-market-add-funds")?.addEventListener("click", () => {
      this.playerGold += 50;
      this.render(ledger, activeActorId);
    });
    for (const shop of this.shops) {
      const open = isShopOpen(shop, currentHour);
      const shopCard = document.createElement("div");
      shopCard.style.cssText = `background: #0f172a; border: 1px solid ${open ? "#10b981" : "#334155"}; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; opacity: ${open ? "1" : "0.75"};`;
      const formatHour = (h) => `${String(Math.floor(h)).padStart(2, "0")}:00`;
      const hoursText = `${formatHour(shop.openHour)} - ${formatHour(shop.closeHour)}`;
      shopCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; border-bottom: 1px solid #1e293b; padding-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">${shop.icon}</span>
            <div>
              <strong style="color: #f8fafc; font-size: 13px;">${shop.name}</strong>
              <div style="font-size: 10px; color: #94a3b8;">
                Keeper: ${shop.shopkeeper || "Merchant"} • Location: <span style="color: #38bdf8;">${shop.placeKey}</span>
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 10px; color: #94a3b8;">Hours: ${hoursText}</span>
            <span style="font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 4px; background: ${open ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}; border: 1px solid ${open ? "#22c55e" : "#ef4444"}; color: ${open ? "#86efac" : "#fca5a5"};">
              ${open ? "\uD83D\uDFE2 OPEN" : "\uD83D\uDD34 CLOSED"}
            </span>
          </div>
        </div>

        ${!open ? `
          <div style="color: #94a3b8; font-size: 11px; font-style: italic; padding: 6px 0;">
            The shutters are barred. This merchant operates strictly from ${hoursText}.
          </div>
        ` : `
          <!-- Items Stall Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px;">
            ${shop.items.map((item) => {
        const canAfford = this.playerGold >= item.price;
        const hasStock = item.stock > 0;
        return `
                <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; justify-content: space-between; gap: 6px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <span style="font-size: 16px;">${item.icon}</span>
                      <strong style="color: #f8fafc; font-size: 11px;">${item.name}</strong>
                    </div>
                    <span style="color: #ffd700; font-weight: 700; font-size: 11px;">${item.price}g</span>
                  </div>
                  <div style="font-size: 10px; color: #cbd5e1; line-height: 1.3;">
                    ${item.desc || "Standard commodity."}
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #2d3748; padding-top: 6px; margin-top: 2px;">
                    <span style="font-size: 9px; color: #94a3b8;">Stock: ${item.stock}/${item.maxStock}</span>
                    <button class="vn-buy-item-btn" data-shop-id="${shop.id}" data-item-id="${item.id}" style="background: ${canAfford && hasStock ? "linear-gradient(135deg, #059669, #10b981)" : "#334155"}; border: none; color: ${canAfford && hasStock ? "#fff" : "#94a3b8"}; font-size: 10px; font-weight: 700; border-radius: 4px; padding: 3px 10px; cursor: ${canAfford && hasStock ? "pointer" : "not-allowed"};">
                      ${!hasStock ? "Out of Stock" : !canAfford ? "Can't Afford" : "Buy"}
                    </button>
                  </div>
                </div>
              `;
      }).join("")}
          </div>
        `}
      `;
      marketWrap.appendChild(shopCard);
    }
    if (inv.carried && inv.carried.length > 0) {
      const sellSection = document.createElement("div");
      sellSection.style.cssText = "background: #0f172a; border: 1px solid #eab308; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px;";
      sellSection.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #fde047; font-size: 12px; display: flex; align-items: center; gap: 6px;">
            <span>\uD83E\uDD1D</span> <span>Merchant Barter & Sell Back (Sell for 15g each)</span>
          </strong>
          <span style="font-size: 10px; color: #94a3b8;">Turn carried goods into gold coins</span>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${inv.carried.map((cItem, idx) => `
            <div style="background: #1e293b; border: 1px solid #475569; border-radius: 6px; padding: 4px 10px; display: flex; align-items: center; gap: 8px; font-size: 11px;">
              <span>${getItemIcon(cItem)} ${cItem}</span>
              <button class="vn-sell-item-btn" data-item-idx="${idx}" data-item-name="${cItem}" style="background: #eab308; border: none; color: #000; font-size: 10px; font-weight: 700; border-radius: 4px; padding: 2px 6px; cursor: pointer;">
                Sell (+15g)
              </button>
            </div>
          `).join("")}
        </div>
      `;
      marketWrap.appendChild(sellSection);
      sellSection.querySelectorAll(".vn-sell-item-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.dataset.itemIdx || "-1", 10);
          const name = btn.dataset.itemName || "";
          if (idx >= 0 && inv.carried && inv.carried[idx]) {
            inv.carried.splice(idx, 1);
            this.playerGold += 15;
            this.onAction(`[Trade: Sold ${name} to merchant for 15 Gold]`);
            this.render(ledger, activeActorId);
          }
        });
      });
    }
    this.root.appendChild(marketWrap);
    marketWrap.querySelectorAll(".vn-buy-item-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const shopId = btn.dataset.shopId;
        const itemId = btn.dataset.itemId;
        const shop = this.shops.find((s) => s.id === shopId);
        const item = shop?.items.find((i) => i.id === itemId);
        if (shop && item && item.stock > 0 && this.playerGold >= item.price) {
          this.playerGold -= item.price;
          item.stock -= 1;
          if (!inv.carried)
            inv.carried = [];
          inv.carried.push(item.name);
          this.onAction(`[Trade: Purchased 1x ${item.name} from ${shop.name} for ${item.price} Gold]`);
          this.render(ledger, activeActorId);
        }
      });
    });
  }
}

// src/frontend/hud/tab-map.ts
function resolveAllLedgerPlaces(ledger) {
  const map = new Map;
  if (ledger.places && typeof ledger.places === "object") {
    for (const [k, v] of Object.entries(ledger.places)) {
      if (k && v)
        map.set(k, v);
    }
  }
  if (ledger.places && typeof ledger.places === "object") {
    for (const [_, v] of Object.entries(ledger.places)) {
      if (Array.isArray(v?.routes)) {
        for (const r of v.routes) {
          const dest = typeof r === "object" && r?.to ? String(r.to) : typeof r === "string" ? r : null;
          if (dest && !map.has(dest)) {
            map.set(dest, { function: "Connected Route" });
          }
        }
      }
    }
  }
  if (ledger.scene?.place && !map.has(ledger.scene.place)) {
    map.set(ledger.scene.place, { function: "Current Active Location" });
  }
  if (ledger.clock?.location && !map.has(ledger.clock.location)) {
    map.set(ledger.clock.location, { function: "Venue Landmark" });
  }
  if (ledger.clock?.region && !map.has(ledger.clock.region)) {
    map.set(ledger.clock.region, { function: "District Hub" });
  }
  return Array.from(map.entries());
}
function extractMapBuildingsFromLedger(ledger, cols = 14, rows = 10) {
  const places = resolveAllLedgerPlaces(ledger);
  if (places.length === 0) {
    return [
      { id: "apothecary", name: "Apothecary & Alchemist", x: 2, y: 2, w: 2, h: 2, color: "#065f46", icon: "⚗️", place: "market", desc: "Local herbs, salves, and potions." },
      { id: "blacksmith", name: "Ironforge Smithy", x: 10, y: 2, w: 2, h: 2, color: "#7c2d12", icon: "⚒️", place: "forge", desc: "Forged blades and armaments." },
      { id: "tavern", name: "Golden Hearth Tavern", x: 2, y: 6, w: 2, h: 2, color: "#78350f", icon: "\uD83C\uDF7A", place: "tavern", desc: "Hearty meals and local rumors." },
      { id: "dojo", name: "Tendo Martial Dojo", x: 10, y: 6, w: 2, h: 2, color: "#831843", icon: "\uD83E\uDD4B", place: "dojo", desc: "Discipline and martial arts training." },
      { id: "residence", name: "Town Residence", x: 6, y: 1, w: 2, h: 2, color: "#1e1b4b", icon: "\uD83C\uDFE0", place: "residence", desc: "Peaceful living quarters." },
      { id: "plaza", name: "Central Fountain Plaza", x: 5, y: 4, w: 4, h: 2, color: "#0c4a6e", icon: "⛲", place: "district_square", desc: "Central gathering hub." }
    ];
  }
  const slots = [
    { x: 2, y: 1, w: 2, h: 2 },
    { x: 10, y: 1, w: 2, h: 2 },
    { x: 2, y: 6, w: 2, h: 2 },
    { x: 10, y: 6, w: 2, h: 2 },
    { x: 1, y: 3, w: 2, h: 2 },
    { x: 11, y: 3, w: 2, h: 2 },
    { x: 5, y: 4, w: 4, h: 2 },
    { x: 6, y: 7, w: 2, h: 2 }
  ];
  const colors = ["#065f46", "#7c2d12", "#78350f", "#831843", "#1e1b4b", "#0c4a6e", "#312e81", "#701a75"];
  return places.slice(0, slots.length).map(([key, node], i) => {
    const slot = slots[i];
    const cleanKey = key.replace(/^@/, "");
    const namePart = cleanKey.includes(":") ? cleanKey.split(":")[1] : cleanKey;
    const displayName = namePart.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const fn = (node.function || cleanKey).toLowerCase();
    let icon = "\uD83C\uDFDB️";
    if (fn.includes("shop") || fn.includes("market") || fn.includes("store"))
      icon = "\uD83C\uDFEA";
    else if (fn.includes("tavern") || fn.includes("inn") || fn.includes("bar"))
      icon = "\uD83C\uDF7A";
    else if (fn.includes("forge") || fn.includes("smith"))
      icon = "⚒️";
    else if (fn.includes("residence") || fn.includes("house") || fn.includes("home") || fn.includes("room") || fn.includes("bedroom") || fn.includes("living"))
      icon = "\uD83C\uDFE0";
    else if (fn.includes("school") || fn.includes("class") || fn.includes("academy"))
      icon = "\uD83C\uDFEB";
    else if (fn.includes("dojo") || fn.includes("gym") || fn.includes("arena"))
      icon = "\uD83E\uDD4B";
    else if (fn.includes("kitchen") || fn.includes("cafeteria") || fn.includes("bakery"))
      icon = "\uD83C\uDF73";
    else if (fn.includes("plaza") || fn.includes("square") || fn.includes("park") || fn.includes("fountain"))
      icon = "⛲";
    else if (fn.includes("shrine") || fn.includes("temple") || fn.includes("church"))
      icon = "⛩️";
    else if (fn.includes("library") || fn.includes("study") || fn.includes("office"))
      icon = "\uD83D\uDCDA";
    else if (fn.includes("garden") || fn.includes("yard") || fn.includes("forest"))
      icon = "\uD83C\uDF33";
    return {
      id: cleanKey,
      name: displayName,
      x: slot.x,
      y: slot.y,
      w: slot.w,
      h: slot.h,
      color: colors[i % colors.length],
      icon,
      place: key,
      desc: node.norm || node.function || (node.resources && node.resources.length ? `Items: ${node.resources.join(", ")}` : "A known location in the district.")
    };
  });
}
function extract3DLandmarksFromLedger(ledger) {
  const places = resolveAllLedgerPlaces(ledger);
  if (places.length === 0) {
    return [
      { id: "apothecary", name: "Apothecary & Alchemist", x: -16, z: -16, color: 366185 },
      { id: "blacksmith", name: "Ironforge Armory", x: 16, z: -16, color: 11817737 },
      { id: "tavern", name: "The Golden Hearth", x: -16, z: 16, color: 14251782 },
      { id: "dojo", name: "Tendo Martial Dojo", x: 16, z: 16, color: 14427686 },
      { id: "plaza", name: "District Fountain Plaza", x: 0, z: 0, color: 165063 }
    ];
  }
  const coords = [
    { x: -16, z: -16, color: 366185 },
    { x: 16, z: -16, color: 11817737 },
    { x: -16, z: 16, color: 14251782 },
    { x: 16, z: 16, color: 14427686 },
    { x: 0, z: 0, color: 165063 },
    { x: 0, z: -20, color: 5195493 },
    { x: -20, z: 0, color: 8141549 },
    { x: 20, z: 0, color: 561586 }
  ];
  return places.slice(0, coords.length).map(([key, _node], i) => {
    const coord = coords[i];
    const cleanKey = key.replace(/^@/, "");
    const namePart = cleanKey.includes(":") ? cleanKey.split(":")[1] : cleanKey;
    const displayName = namePart.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      id: cleanKey,
      name: displayName,
      x: coord.x,
      z: coord.z,
      color: coord.color
    };
  });
}

class MapTab {
  root;
  onAction;
  viewMode = "indoor";
  manifest;
  zoom = 1;
  panX = 0;
  panY = 0;
  isPanning = false;
  startPointerX = 0;
  startPointerY = 0;
  selectedNodeId = null;
  player2d = { x: 6, y: 5 };
  threeAnimId = null;
  threeRenderer = null;
  activeKeydownHandler = null;
  constructor(onAction) {
    this.onAction = onAction;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-map";
  }
  cleanupInteractiveModes() {
    if (this.threeAnimId !== null) {
      cancelAnimationFrame(this.threeAnimId);
      this.threeAnimId = null;
    }
    if (this.threeRenderer) {
      try {
        this.threeRenderer.dispose?.();
      } catch {}
      this.threeRenderer = null;
    }
    if (this.activeKeydownHandler) {
      window.removeEventListener("keydown", this.activeKeydownHandler);
      this.activeKeydownHandler = null;
    }
  }
  lastRenderedPlace = null;
  render(ledger, manifest) {
    this.cleanupInteractiveModes();
    if (manifest)
      this.manifest = manifest;
    this.root.innerHTML = "";
    const currentPlace = (ledger.scene?.place || "default").toLowerCase();
    const isIndoor = currentPlace.includes(":") || currentPlace.includes("residence") || currentPlace.includes("dojo") || currentPlace.includes("room") || currentPlace.includes("foyer");
    if (!this.selectedNodeId || this.lastRenderedPlace !== currentPlace) {
      this.lastRenderedPlace = currentPlace;
      if (this.viewMode !== "tilemap2d" && this.viewMode !== "world3d") {
        this.viewMode = isIndoor ? "indoor" : "outdoor";
      }
      this.selectedNodeId = currentPlace;
    }
    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;">
        <div>
          <h3 style="margin: 0; font-size: 15px; color: #f8fafc; display: flex; align-items: center; gap: 6px;">
            <span>\uD83D\uDDFA️</span> <span>Interactive Cartography & Blueprint</span>
          </h3>
          <p class="vn-muted" style="margin: 2px 0 0 0; font-size: 11px;">
            <span>⏱️ <strong>${ledger.clock?.t || "D1 12:00"}</strong> (${ledger.clock?.phase || "Day"})</span>
            ${ledger.clock?.date ? `<span> • \uD83D\uDCC5 ${ledger.clock.date}</span>` : ""}
            <span> • \uD83D\uDCCD <span style="color:#38bdf8; font-weight: 600;">${currentPlace}</span></span>
          </p>
        </div>
        <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
          <div style="background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 2px; display: flex; gap: 2px;">
            <button id="vn-map-indoor-btn" class="vn-btn vn-btn-sm" style="border: none; border-radius: 4px; padding: 4px 10px; font-size: 11px; cursor: pointer; ${this.viewMode === "indoor" ? "background: #6366f1; color: #fff; font-weight: 600;" : "background: transparent; color: #94a3b8;"}">
              \uD83C\uDFE0 Blueprint
            </button>
            <button id="vn-map-outdoor-btn" class="vn-btn vn-btn-sm" style="border: none; border-radius: 4px; padding: 4px 10px; font-size: 11px; cursor: pointer; ${this.viewMode === "outdoor" ? "background: #6366f1; color: #fff; font-weight: 600;" : "background: transparent; color: #94a3b8;"}">
              \uD83C\uDF10 District
            </button>
            <button id="vn-map-2d-btn" class="vn-btn vn-btn-sm" style="border: none; border-radius: 4px; padding: 4px 10px; font-size: 11px; cursor: pointer; ${this.viewMode === "tilemap2d" ? "background: #6366f1; color: #fff; font-weight: 600;" : "background: transparent; color: #94a3b8;"}">
              \uD83D\uDD79️ 2D Tilemap
            </button>
            <button id="vn-map-3d-btn" class="vn-btn vn-btn-sm" style="border: none; border-radius: 4px; padding: 4px 10px; font-size: 11px; cursor: pointer; ${this.viewMode === "world3d" ? "background: #6366f1; color: #fff; font-weight: 600;" : "background: transparent; color: #94a3b8;"}">
              \uD83C\uDFAE 3D View
            </button>
          </div>
          <div style="display: flex; gap: 3px;">
            <button id="vn-map-zoom-in" title="Zoom In" style="background: #1e293b; border: 1px solid #475569; color: #cbd5e1; border-radius: 4px; width: 28px; height: 28px; font-weight: bold; cursor: pointer;">+</button>
            <button id="vn-map-zoom-out" title="Zoom Out" style="background: #1e293b; border: 1px solid #475569; color: #cbd5e1; border-radius: 4px; width: 28px; height: 28px; font-weight: bold; cursor: pointer;">−</button>
            <button id="vn-map-zoom-reset" title="Reset View" style="background: #1e293b; border: 1px solid #475569; color: #cbd5e1; border-radius: 4px; padding: 0 8px; height: 28px; font-size: 11px; cursor: pointer;">⟲</button>
          </div>
        </div>
      </div>
    `;
    this.root.appendChild(header);
    header.querySelector("#vn-map-indoor-btn")?.addEventListener("click", () => {
      this.viewMode = "indoor";
      this.resetView();
      this.render(ledger);
    });
    header.querySelector("#vn-map-outdoor-btn")?.addEventListener("click", () => {
      this.viewMode = "outdoor";
      this.resetView();
      this.render(ledger);
    });
    header.querySelector("#vn-map-2d-btn")?.addEventListener("click", () => {
      this.viewMode = "tilemap2d";
      this.render(ledger);
    });
    header.querySelector("#vn-map-3d-btn")?.addEventListener("click", () => {
      this.viewMode = "world3d";
      this.render(ledger);
    });
    header.querySelector("#vn-map-zoom-in")?.addEventListener("click", () => this.adjustZoom(1.25));
    header.querySelector("#vn-map-zoom-out")?.addEventListener("click", () => this.adjustZoom(0.8));
    header.querySelector("#vn-map-zoom-reset")?.addEventListener("click", () => {
      this.resetView();
      this.updateTransform();
    });
    const mainLayout = document.createElement("div");
    mainLayout.style.cssText = "display: flex; gap: 12px; height: 420px; min-height: 400px; position: relative;";
    const viewportWrap = document.createElement("div");
    viewportWrap.id = "vn-map-viewport";
    viewportWrap.style.cssText = "flex: 1; background: #070d19; border: 1px solid #1e293b; border-radius: 10px; overflow: hidden; position: relative; user-select: none;";
    const sidebar = document.createElement("div");
    sidebar.id = "vn-map-sidebar";
    sidebar.style.cssText = "width: 280px; background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; box-sizing: border-box;";
    mainLayout.appendChild(viewportWrap);
    mainLayout.appendChild(sidebar);
    this.root.appendChild(mainLayout);
    if (this.viewMode === "tilemap2d") {
      this.renderTilemap2D(viewportWrap, sidebar, ledger, currentPlace);
    } else if (this.viewMode === "world3d") {
      this.renderWorld3D(viewportWrap, sidebar, ledger, currentPlace);
    } else {
      viewportWrap.style.cursor = "grab";
      this.renderGraph(viewportWrap, ledger, currentPlace);
      this.renderSidebar(sidebar, ledger, currentPlace);
      this.setupPanZoom(viewportWrap);
    }
  }
  resetView() {
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
  }
  adjustZoom(factor) {
    this.zoom = Math.max(0.4, Math.min(3, this.zoom * factor));
    this.updateTransform();
  }
  updateTransform() {
    const group = this.root.querySelector("#vn-map-svg-group");
    if (group) {
      group.setAttribute("transform", `translate(${this.panX}, ${this.panY}) scale(${this.zoom})`);
    }
  }
  setupPanZoom(viewport) {
    viewport.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".vn-map-node-interactive"))
        return;
      this.isPanning = true;
      this.startPointerX = e.clientX - this.panX;
      this.startPointerY = e.clientY - this.panY;
      viewport.style.cursor = "grabbing";
      viewport.setPointerCapture(e.pointerId);
    });
    viewport.addEventListener("pointermove", (e) => {
      if (!this.isPanning)
        return;
      this.panX = e.clientX - this.startPointerX;
      this.panY = e.clientY - this.startPointerY;
      this.updateTransform();
    });
    const endPan = (e) => {
      if (!this.isPanning)
        return;
      this.isPanning = false;
      viewport.style.cursor = "grab";
      try {
        viewport.releasePointerCapture(e.pointerId);
      } catch {}
    };
    viewport.addEventListener("pointerup", endPan);
    viewport.addEventListener("pointercancel", endPan);
    viewport.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
      this.adjustZoom(zoomFactor);
    }, { passive: false });
  }
  renderGraph(viewport, ledger, currentPlace) {
    viewport.innerHTML = "";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.display = "block";
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
      <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" stroke-width="0.8" stroke-opacity="0.4"/>
        <circle cx="0" cy="0" r="1.5" fill="#334155" opacity="0.6"/>
      </pattern>
      <linearGradient id="corridor-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="#818cf8" stop-opacity="0.6"/>
      </linearGradient>
    `;
    svg.appendChild(defs);
    const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bgRect.setAttribute("width", "100%");
    bgRect.setAttribute("height", "100%");
    bgRect.setAttribute("fill", "url(#grid-pattern)");
    svg.appendChild(bgRect);
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.id = "vn-map-svg-group";
    g.setAttribute("transform", `translate(${this.panX}, ${this.panY}) scale(${this.zoom})`);
    svg.appendChild(g);
    if (this.viewMode === "indoor") {
      this.renderIndoorSvg(g, ledger, currentPlace);
    } else {
      this.renderOutdoorSvg(g, ledger, currentPlace);
    }
    viewport.appendChild(svg);
  }
  renderIndoorSvg(group, ledger, currentPlace) {
    const scopePrefix = currentPlace.includes(":") ? currentPlace.split(":")[0] : "building";
    const currentRoom = currentPlace.replace(/^@/, "").includes(":") ? currentPlace.replace(/^@/, "").split(":")[1] : currentPlace.replace(/^@/, "");
    const knownPlaces = Object.keys(ledger.places || {});
    const indoorKeys = knownPlaces.filter((p) => p.replace(/^@/, "").startsWith(`${scopePrefix}:`) || !p.includes(":"));
    const rawKeys = indoorKeys.length > 0 ? indoorKeys : ["entrance", "living_room", "kitchen", "hallway", "bedroom", "courtyard", "bathroom"];
    const layouts = [];
    const cols = 3;
    const roomW = 160;
    const roomH = 95;
    const gapX = 50;
    const gapY = 40;
    const startX = 60;
    const startY = 40;
    rawKeys.forEach((key, idx) => {
      const clean = key.replace(/^@/, "").includes(":") ? key.replace(/^@/, "").split(":")[1] : key.replace(/^@/, "");
      const c = idx % cols;
      const r = Math.floor(idx / cols);
      layouts.push({
        id: key,
        cleanName: clean,
        x: startX + c * (roomW + gapX),
        y: startY + r * (roomH + gapY),
        w: roomW,
        h: roomH
      });
    });
    for (let i = 0;i < layouts.length; i++) {
      for (let j = i + 1;j < layouts.length; j++) {
        const r1 = layouts[i];
        const r2 = layouts[j];
        const dx = Math.abs(r1.x - r2.x);
        const dy = Math.abs(r1.y - r2.y);
        if (dx <= roomW + gapX + 10 && dy === 0 || dy <= roomH + gapY + 10 && dx === 0) {
          const path = document.createElementNS("http://www.w3.org/2000/svg", "line");
          path.setAttribute("x1", String(r1.x + r1.w / 2));
          path.setAttribute("y1", String(r1.y + r1.h / 2));
          path.setAttribute("x2", String(r2.x + r2.w / 2));
          path.setAttribute("y2", String(r2.y + r2.h / 2));
          path.setAttribute("stroke", "#334155");
          path.setAttribute("stroke-width", "8");
          path.setAttribute("stroke-linecap", "round");
          group.appendChild(path);
        }
      }
    }
    layouts.forEach((room) => {
      const isHere = room.cleanName.toLowerCase() === currentRoom.toLowerCase() || room.id === currentPlace;
      const isSelected = room.id === this.selectedNodeId;
      const placeConfig = ledger.places?.[room.id] || {};
      const currentRoutes = ledger.places?.[currentPlace]?.routes || [];
      const routeToThis = currentRoutes.find((r) => typeof r === "object" && r.to === room.id);
      const isLocked = Boolean(routeToThis?.why_not || routeToThis?.requires && Object.keys(routeToThis.requires).length > 0);
      const roomG = document.createElementNS("http://www.w3.org/2000/svg", "g");
      roomG.setAttribute("class", "vn-map-node-interactive");
      roomG.style.cursor = "pointer";
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", String(room.x));
      rect.setAttribute("y", String(room.y));
      rect.setAttribute("width", String(room.w));
      rect.setAttribute("height", String(room.h));
      rect.setAttribute("rx", "8");
      rect.setAttribute("fill", isHere ? "rgba(56, 189, 248, 0.16)" : isSelected ? "rgba(99, 102, 241, 0.22)" : "#0f172a");
      rect.setAttribute("stroke", isHere ? "#38bdf8" : isSelected ? "#818cf8" : isLocked ? "#f43f5e" : "#334155");
      rect.setAttribute("stroke-width", isHere || isSelected ? "2.5" : "1.5");
      rect.setAttribute("stroke-dasharray", isLocked ? "4 3" : "none");
      roomG.appendChild(rect);
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", String(room.x + 12));
      text.setAttribute("y", String(room.y + 24));
      text.setAttribute("fill", isHere ? "#38bdf8" : "#f1f5f9");
      text.setAttribute("font-size", "12");
      text.setAttribute("font-weight", "700");
      text.textContent = room.cleanName.replace(/_/g, " ").toUpperCase();
      roomG.appendChild(text);
      const sub = document.createElementNS("http://www.w3.org/2000/svg", "text");
      sub.setAttribute("x", String(room.x + 12));
      sub.setAttribute("y", String(room.y + 38));
      sub.setAttribute("fill", "#64748b");
      sub.setAttribute("font-size", "9");
      sub.textContent = placeConfig.norm || (isLocked ? `\uD83D\uDD12 ${routeToThis?.why_not || "Restricted"}` : "Interior Zone");
      roomG.appendChild(sub);
      const npcsInRoom = (ledger.roster || []).filter((r) => (r.loc || "").toLowerCase().includes(room.cleanName.toLowerCase()));
      let tokenOffset = 0;
      if (isHere) {
        const playerBadge = this.createPresenceToken(room.x + 12 + tokenOffset, room.y + room.h - 22, "YOU", "#0284c7", "#fff");
        roomG.appendChild(playerBadge);
        tokenOffset += 42;
      }
      npcsInRoom.forEach((npc) => {
        if (tokenOffset < room.w - 40) {
          const npcBadge = this.createPresenceToken(room.x + 12 + tokenOffset, room.y + room.h - 22, (npc.name || npc.id).slice(0, 5), "#4f46e5", "#c7d2fe");
          roomG.appendChild(npcBadge);
          tokenOffset += 44;
        }
      });
      roomG.addEventListener("click", () => {
        this.selectedNodeId = room.id;
        this.render(ledger);
      });
      group.appendChild(roomG);
    });
  }
  renderOutdoorSvg(group, ledger, currentPlace) {
    const places = ledger.places || {};
    const placeKeys = Object.keys(places);
    const outdoorKeys = placeKeys.length > 0 ? placeKeys : ["nerima_district", "tendo_dojo", "furinkan_high", "cat_cafe", "shopping_district", "park"];
    const nodes = [];
    const centerX = 320;
    const centerY = 200;
    const radius = 140;
    outdoorKeys.forEach((key, idx) => {
      if (idx === 0) {
        nodes.push({ id: key, x: centerX, y: centerY });
      } else {
        const angle = (idx - 1) / (outdoorKeys.length - 1) * 2 * Math.PI;
        nodes.push({
          id: key,
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius
        });
      }
    });
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    nodes.forEach((source) => {
      const routes = places[source.id]?.routes || [];
      routes.forEach((route) => {
        const destId = typeof route === "object" && route.to ? route.to : String(route);
        const target = nodeMap.get(destId);
        if (target) {
          const isGated = typeof route === "object" && Boolean(route.why_not || route.requires);
          const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute("x1", String(source.x));
          line.setAttribute("y1", String(source.y));
          line.setAttribute("x2", String(target.x));
          line.setAttribute("y2", String(target.y));
          line.setAttribute("stroke", isGated ? "#f43f5e" : "#3b82f6");
          line.setAttribute("stroke-width", "2");
          line.setAttribute("stroke-dasharray", isGated ? "5 3" : "none");
          line.setAttribute("opacity", "0.6");
          group.appendChild(line);
          if (typeof route === "object" && route.minutes) {
            const mx = (source.x + target.x) / 2;
            const my = (source.y + target.y) / 2;
            const pill = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            pill.setAttribute("x", String(mx - 18));
            pill.setAttribute("y", String(my - 9));
            pill.setAttribute("width", "36");
            pill.setAttribute("height", "18");
            pill.setAttribute("rx", "4");
            pill.setAttribute("fill", "#0f172a");
            pill.setAttribute("stroke", "#334155");
            group.appendChild(pill);
            const minTxt = document.createElementNS("http://www.w3.org/2000/svg", "text");
            minTxt.setAttribute("x", String(mx));
            minTxt.setAttribute("y", String(my + 4));
            minTxt.setAttribute("fill", "#94a3b8");
            minTxt.setAttribute("font-size", "9");
            minTxt.setAttribute("text-anchor", "middle");
            minTxt.textContent = `${route.minutes}m`;
            group.appendChild(minTxt);
          }
        }
      });
    });
    nodes.forEach((node) => {
      const isHere = node.id.toLowerCase() === currentPlace.toLowerCase();
      const isSelected = node.id === this.selectedNodeId;
      const npcs = (ledger.roster || []).filter((r) => (r.loc || "").toLowerCase().includes(node.id.toLowerCase()));
      const nodeG = document.createElementNS("http://www.w3.org/2000/svg", "g");
      nodeG.setAttribute("class", "vn-map-node-interactive");
      nodeG.style.cursor = "pointer";
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", String(node.x));
      circle.setAttribute("cy", String(node.y));
      circle.setAttribute("r", "34");
      circle.setAttribute("fill", isHere ? "rgba(56, 189, 248, 0.2)" : isSelected ? "rgba(99, 102, 241, 0.25)" : "#0f172a");
      circle.setAttribute("stroke", isHere ? "#38bdf8" : isSelected ? "#818cf8" : "#334155");
      circle.setAttribute("stroke-width", isHere || isSelected ? "3" : "1.5");
      nodeG.appendChild(circle);
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", String(node.x));
      label.setAttribute("y", String(node.y + 4));
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("fill", isHere ? "#38bdf8" : "#f8fafc");
      label.setAttribute("font-size", "10");
      label.setAttribute("font-weight", "700");
      label.textContent = node.id.replace(/_/g, " ").slice(0, 12);
      nodeG.appendChild(label);
      if (isHere) {
        const youBadge = this.createPresenceToken(node.x - 18, node.y - 28, "YOU", "#0284c7", "#fff");
        nodeG.appendChild(youBadge);
      }
      if (npcs.length > 0) {
        const countBadge = this.createPresenceToken(node.x - 16, node.y + 14, `\uD83D\uDC65 ${npcs.length}`, "#4338ca", "#c7d2fe");
        nodeG.appendChild(countBadge);
      }
      nodeG.addEventListener("click", () => {
        this.selectedNodeId = node.id;
        this.render(ledger);
      });
      group.appendChild(nodeG);
    });
  }
  createPresenceToken(x, y, textStr, bg, fg) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const width = Math.max(32, textStr.length * 7 + 10);
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", String(x));
    rect.setAttribute("y", String(y));
    rect.setAttribute("width", String(width));
    rect.setAttribute("height", "15");
    rect.setAttribute("rx", "4");
    rect.setAttribute("fill", bg);
    rect.setAttribute("stroke", "rgba(255,255,255,0.2)");
    rect.setAttribute("stroke-width", "0.5");
    g.appendChild(rect);
    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", String(x + width / 2));
    txt.setAttribute("y", String(y + 11));
    txt.setAttribute("fill", fg);
    txt.setAttribute("font-size", "9");
    txt.setAttribute("font-weight", "800");
    txt.setAttribute("text-anchor", "middle");
    txt.textContent = textStr;
    g.appendChild(txt);
    return g;
  }
  renderSidebar(sidebar, ledger, currentPlace) {
    sidebar.innerHTML = "";
    const selected = this.selectedNodeId || currentPlace;
    const cleanName = selected.replace(/^@/, "").includes(":") ? selected.replace(/^@/, "").split(":")[1] : selected.replace(/^@/, "");
    const placeConfig = ledger.places?.[selected] || {};
    const isHere = selected.toLowerCase() === currentPlace.toLowerCase() || cleanName.toLowerCase() === currentPlace.toLowerCase();
    const currentRoutes = ledger.places?.[currentPlace]?.routes || [];
    const route = currentRoutes.find((r) => typeof r === "object" && (r.to === selected || r.to === cleanName || typeof r.to === "string" && r.to.replace(/^@/, "") === cleanName));
    const isGated = Boolean(route?.why_not || route?.requires && Object.keys(route.requires).length > 0);
    const whyNot = route?.why_not;
    const placeThumbnail = this.manifest?.places?.[selected] || this.manifest?.places?.[cleanName] || this.manifest?.places?.[selected.replace(/^@/, "")] || this.manifest?.places?.[selected.toLowerCase()] || this.manifest?.places?.[cleanName.toLowerCase()] || "";
    const npcsHere = (ledger.roster || []).filter((r) => {
      const loc = (r.loc || "").toLowerCase();
      return loc === selected.toLowerCase() || loc === cleanName.toLowerCase() || loc.includes(cleanName.toLowerCase());
    });
    const inv = ledger.inventory || ledger.actors?.["user"]?.inventory;
    const invRoomLoc = inv?.room_location?.toLowerCase();
    const isMatchingRoom = isHere || invRoomLoc && (invRoomLoc === selected.toLowerCase() || invRoomLoc.includes(cleanName.toLowerCase()));
    const roomItems = [
      ...Array.isArray(placeConfig.items) ? placeConfig.items : [],
      ...Array.isArray(placeConfig.objects) ? placeConfig.objects : [],
      ...isMatchingRoom && Array.isArray(inv?.room) ? inv.room : []
    ];
    const uniqueRoomItems = [...new Set(roomItems)];
    const getRoomItemIcon = (name) => {
      const n = name.toLowerCase();
      if (n.includes("key") || n.includes("card") || n.includes("pass"))
        return "\uD83D\uDD11";
      if (n.includes("knife") || n.includes("blade") || n.includes("sword") || n.includes("gun"))
        return "\uD83D\uDDE1️";
      if (n.includes("phone") || n.includes("pager") || n.includes("radio"))
        return "\uD83D\uDCF1";
      if (n.includes("note") || n.includes("paper") || n.includes("book") || n.includes("file") || n.includes("journal"))
        return "\uD83D\uDCDC";
      if (n.includes("food") || n.includes("bread") || n.includes("ration"))
        return "\uD83E\uDD6A";
      if (n.includes("drink") || n.includes("coffee") || n.includes("tea") || n.includes("water") || n.includes("bottle"))
        return "☕";
      return "\uD83D\uDCE6";
    };
    sidebar.innerHTML = `
      ${placeThumbnail ? `
        <div style="width: 100%; height: 110px; border-radius: 8px; overflow: hidden; margin-bottom: 8px; border: 1px solid #334155; position: relative; background: #070d19;">
          <img src="${placeThumbnail}" style="width: 100%; height: 100%; object-fit: cover;" alt="${cleanName}" />
        </div>
      ` : ""}
      <div style="border-bottom: 1px solid #334155; padding-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h4 style="margin: 0; font-size: 13px; color: #38bdf8; text-transform: uppercase;">
            ${cleanName.replace(/_/g, " ")}
          </h4>
          ${isHere ? '<span style="font-size: 10px; background: #0284c7; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: 700;">CURRENT</span>' : ""}
        </div>
        <p style="margin: 2px 0 0 0; font-size: 11px; color: #94a3b8;">${placeConfig.norm || (placeConfig.indoors ? "Indoor Facility" : "Public District")}</p>
      </div>

      ${isGated ? `
        <div style="background: rgba(244, 63, 94, 0.15); border: 1px solid #f43f5e; border-radius: 6px; padding: 8px; font-size: 11px; color: #fda4af;">
          <strong>\uD83D\uDD12 Access Restricted:</strong>
          <div style="margin-top: 3px;">${whyNot || "Requirements not met."}</div>
        </div>
      ` : ""}

      <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px; color: #cbd5e1;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #94a3b8;">Privacy / Traffic:</span>
          <span>${placeConfig.privacy ?? "—"} / ${placeConfig.traffic ?? "—"}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #94a3b8;">Visibility:</span>
          <span>${placeConfig.visibility ?? "—"}</span>
        </div>
        ${placeConfig.occ ? `
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Occupancy:</span>
            <span style="color: #38bdf8; font-weight: 600;">${placeConfig.occ}</span>
          </div>
        ` : ""}
        ${placeConfig.population ? `
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Population:</span>
            <span>${placeConfig.population}</span>
          </div>
        ` : ""}
        ${Array.isArray(placeConfig.cohorts) && placeConfig.cohorts.length > 0 ? `
          <div style="display: flex; flex-direction: column; gap: 2px; margin-top: 2px;">
            <span style="color: #94a3b8;">Active Cohorts:</span>
            <div style="display: flex; flex-wrap: wrap; gap: 3px;">
              ${placeConfig.cohorts.map((c) => `<span style="background: rgba(148, 163, 184, 0.15); border: 1px solid #475569; padding: 1px 5px; border-radius: 4px; font-size: 10px; color: #cbd5e1;">\uD83D\uDC65 ${c}</span>`).join("")}
            </div>
          </div>
        ` : ""}
      </div>

      ${Array.isArray(placeConfig.affordances) && placeConfig.affordances.length > 0 ? `
        <div>
          <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Affordances ${isHere ? '<span style="color: #38bdf8;">(Click to interact)</span>' : ""}</div>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${placeConfig.affordances.map((a) => `
              <span class="${isHere ? "vn-affordance-interactive" : ""}" data-affordance="${a}" style="background: #1e293b; border: 1px solid ${isHere ? "#38bdf8" : "#475569"}; padding: 2px 6px; border-radius: 4px; font-size: 10px; ${isHere ? "cursor: pointer; color: #93c5fd;" : ""}">${a}</span>
            `).join("")}
          </div>
        </div>
      ` : ""}

      ${isHere || uniqueRoomItems.length > 0 ? `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 10px; color: #38bdf8; text-transform: uppercase; font-weight: 700;">\uD83D\uDCE6 Room Objects (${uniqueRoomItems.length})</span>
            ${isHere ? `<button class="vn-search-room-btn" style="background: rgba(56, 189, 248, 0.15); border: 1px solid #38bdf8; color: #38bdf8; font-size: 10px; padding: 2px 6px; border-radius: 4px; cursor: pointer;">\uD83D\uDD0D Search Room</button>` : ""}
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            ${uniqueRoomItems.length > 0 ? uniqueRoomItems.map((item) => `
                <div style="background: #1e293b; padding: 4px 8px; border-radius: 6px; font-size: 11px; display: flex; align-items: center; justify-content: space-between; gap: 6px; border: 1px solid #334155;">
                  <div style="display: flex; align-items: center; gap: 6px; overflow: hidden;">
                    <span>${getRoomItemIcon(item)}</span>
                    <span style="color: #f8fafc; font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${item}</span>
                  </div>
                  <div style="display: flex; gap: 4px; flex-shrink: 0;">
                    <button class="vn-take-item-btn" data-item="${item}" style="background: #059669; border: none; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px; cursor: pointer;">Take</button>
                    <button class="vn-inspect-item-btn" data-item="${item}" style="background: #334155; border: 1px solid #475569; color: #cbd5e1; font-size: 10px; padding: 2px 6px; border-radius: 4px; cursor: pointer;">Examine</button>
                  </div>
                </div>
              `).join("") : '<span style="color: #64748b; font-size: 11px; font-style: italic;">No loose items seen here.</span>'}
          </div>
        </div>
      ` : ""}

      ${Array.isArray(placeConfig.hazards) && placeConfig.hazards.length > 0 ? `
        <div>
          <div style="font-size: 10px; color: #f59e0b; text-transform: uppercase; margin-bottom: 4px;">⚠️ Hazards</div>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${placeConfig.hazards.map((h) => `<span style="background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; padding: 2px 6px; border-radius: 4px; font-size: 10px; color: #fcd34d;">${h}</span>`).join("")}
          </div>
        </div>
      ` : ""}

      <div>
        <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Present Cast (${npcsHere.length})</div>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          ${npcsHere.length > 0 ? npcsHere.map((n) => {
      const normId = (n.id || "").toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      const charData = this.manifest?.characters?.[normId];
      const outfits = charData?.outfits || charData;
      const defaultSet = outfits?.["default"] || (outfits ? Object.values(outfits)[0] : undefined);
      const avatar = defaultSet?.["neutral"] || (defaultSet ? Object.values(defaultSet)[0] : "") || "";
      const focus = charData?.avatarFocus || { x: 50, y: 15 };
      return `
                  <div style="background: #1e293b; padding: 4px 8px; border-radius: 6px; font-size: 11px; display: flex; align-items: center; justify-content: space-between; gap: 6px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      ${avatar ? `<img src="${avatar}" style="width: 18px; height: 18px; border-radius: 50%; object-fit: cover; object-position: ${focus.x ?? 50}% ${focus.y ?? 15}%;" alt="" />` : "<span>\uD83D\uDC64</span>"}
                      <span style="color: #c7d2fe; font-weight: 600;">${n.name || n.id}</span>
                    </div>
                    <span style="color: #94a3b8; font-size: 10px;">${n.posture || n.activity || "Idle"}</span>
                  </div>
                `;
    }).join("") : '<span style="color: #64748b; font-size: 11px;">No detected actors</span>'}
        </div>
      </div>

      <div style="margin-top: auto; padding-top: 10px;">
        ${!isHere ? `
          <button id="vn-sidebar-navigate-btn" class="vn-btn" style="width: 100%; padding: 8px; font-size: 12px; font-weight: 700; ${isGated ? "background: #475569; cursor: not-allowed; opacity: 0.7;" : "background: #6366f1; cursor: pointer;"}" ${isGated ? "disabled" : ""}>
            ${isGated ? "\uD83D\uDD12 Travel Gated" : `Travel to ${cleanName.replace(/_/g, " ")}`}
          </button>
        ` : `
          <button class="vn-btn" style="width: 100%; padding: 8px; font-size: 12px; background: #0284c7; cursor: default;" disabled>
            ✓ Already Present Here
          </button>
        `}
      </div>
    `;
    sidebar.querySelector("#vn-sidebar-navigate-btn")?.addEventListener("click", () => {
      if (isGated)
        return;
      this.onAction(`*Travels to the ${cleanName.replace(/_/g, " ")}*`);
    });
    sidebar.querySelectorAll(".vn-take-item-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = btn.dataset.item;
        if (item)
          this.onAction(`*Picks up ${item} from the ${cleanName.replace(/_/g, " ")}*`);
      });
    });
    sidebar.querySelectorAll(".vn-inspect-item-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = btn.dataset.item;
        if (item)
          this.onAction(`*Examines ${item} in the ${cleanName.replace(/_/g, " ")}*`);
      });
    });
    sidebar.querySelector(".vn-search-room-btn")?.addEventListener("click", () => {
      this.onAction(`*Searches the ${cleanName.replace(/_/g, " ")} for items and clues*`);
    });
    sidebar.querySelectorAll(".vn-affordance-interactive").forEach((el) => {
      el.addEventListener("click", () => {
        const aff = el.dataset.affordance;
        if (aff)
          this.onAction(`*Interacts with the ${aff.toLowerCase()} in the ${cleanName.replace(/_/g, " ")}*`);
      });
    });
  }
  renderTilemap2D(viewport, sidebar, ledger, _currentPlace) {
    viewport.innerHTML = "";
    sidebar.innerHTML = "";
    const canvas = document.createElement("canvas");
    canvas.width = 560;
    canvas.height = 400;
    canvas.style.cssText = "width: 100%; height: 100%; display: block; background: #070d19; cursor: crosshair;";
    viewport.appendChild(canvas);
    const banner = document.createElement("div");
    banner.style.cssText = "position: absolute; top: 10px; left: 10px; background: rgba(15,23,42,0.85); backdrop-filter: blur(8px); border: 1px solid rgba(99,102,241,0.4); padding: 5px 10px; border-radius: 6px; font-size: 11px; color: #cbd5e1; z-index: 5; pointer-events: none;";
    banner.innerHTML = `\uD83C\uDFAE <strong>WASD / Arrow keys</strong> or click grid to walk • Enter buildings to travel`;
    viewport.appendChild(banner);
    const ctx = canvas.getContext("2d");
    const cols = 14;
    const rows = 10;
    const tileW = canvas.width / cols;
    const tileH = canvas.height / rows;
    const buildings = extractMapBuildingsFromLedger(ledger, cols, rows);
    const matchBuilding = buildings.find((b) => b.place === _currentPlace || b.id === _currentPlace.replace(/^@/, "").split(":").pop());
    let selectedBuilding = matchBuilding || null;
    const updateSidebarForBuilding = (b) => {
      sidebar.innerHTML = "";
      if (!b) {
        sidebar.innerHTML = `
          <div style="color: #94a3b8; font-size: 12px; font-style: italic; padding: 20px 10px; text-align: center;">
            Walk your avatar onto a building doorway or click any structure on the map to inspect.
          </div>
        `;
        return;
      }
      sidebar.innerHTML = `
        <div style="border-bottom: 1px solid #334155; padding-bottom: 8px;">
          <h4 style="margin: 0; font-size: 14px; color: #f8fafc; display: flex; align-items: center; gap: 6px;">
            <span>${b.icon}</span> <span>${b.name}</span>
          </h4>
          <span style="font-size: 11px; color: #38bdf8;">Zone: ${b.place}</span>
        </div>
        <div style="font-size: 11px; color: #cbd5e1; line-height: 1.4;">
          A bustling district landmark. Step through the entrance to explore inside and engage with characters.
        </div>
        <div style="margin-top: auto; padding-top: 10px; border-top: 1px solid #1e293b;">
          <button id="vn-tilemap-enter-btn" style="width: 100%; background: linear-gradient(135deg, #4f46e5, #6366f1); border: none; color: #fff; font-size: 12px; font-weight: 700; padding: 8px; border-radius: 6px; cursor: pointer;">
            \uD83D\uDEAA Travel / Enter ${b.name}
          </button>
        </div>
      `;
      sidebar.querySelector("#vn-tilemap-enter-btn")?.addEventListener("click", () => {
        this.onAction(`*Travels to ${b.name}*`);
      });
    };
    const draw = () => {
      if (!ctx)
        return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let c = 0;c < cols; c++) {
        for (let r = 0;r < rows; r++) {
          const isRoad = c === 6 || c === 7 || r === 4 || r === 5 || c >= 2 && c <= 4 && (r === 4 || r === 5) || c >= 9 && c <= 11 && (r === 4 || r === 5);
          if (isRoad) {
            ctx.fillStyle = "#1e293b";
            ctx.fillRect(c * tileW, r * tileH, tileW, tileH);
            ctx.strokeStyle = "#334155";
            ctx.lineWidth = 0.5;
            ctx.strokeRect(c * tileW, r * tileH, tileW, tileH);
          } else {
            ctx.fillStyle = "#064e3b";
            ctx.fillRect(c * tileW, r * tileH, tileW, tileH);
            ctx.strokeStyle = "#047857";
            ctx.lineWidth = 0.5;
            ctx.strokeRect(c * tileW, r * tileH, tileW, tileH);
          }
        }
      }
      for (const b of buildings) {
        const bx = b.x * tileW;
        const by = b.y * tileH;
        const bw = b.w * tileW;
        const bh = b.h * tileH;
        ctx.fillStyle = b.color;
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = b === selectedBuilding ? "#38bdf8" : "rgba(255,255,255,0.2)";
        ctx.lineWidth = b === selectedBuilding ? 2 : 1;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.font = "16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(b.icon, bx + bw / 2, by + bh / 2 - 2);
        ctx.font = "9px system-ui";
        ctx.fillStyle = "#f8fafc";
        ctx.fillText(b.name.split(" ")[0] || "", bx + bw / 2, by + bh / 2 + 12);
      }
      const px = this.player2d.x * tileW + tileW / 2;
      const py = this.player2d.y * tileH + tileH / 2;
      const grad = ctx.createRadialGradient(px, py, 2, px, py, 16);
      grad.addColorStop(0, "rgba(56, 189, 248, 0.8)");
      grad.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "9px system-ui";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText("You", px, py - 12);
    };
    draw();
    updateSidebarForBuilding(selectedBuilding);
    const movePlayer = (dx, dy) => {
      this.player2d.x = Math.max(0, Math.min(cols - 1, this.player2d.x + dx));
      this.player2d.y = Math.max(0, Math.min(rows - 1, this.player2d.y + dy));
      const hit = buildings.find((b) => this.player2d.x >= b.x && this.player2d.x < b.x + b.w && this.player2d.y >= b.y && this.player2d.y < b.y + b.h);
      if (hit) {
        selectedBuilding = hit;
        updateSidebarForBuilding(hit);
      }
      draw();
    };
    this.activeKeydownHandler = (e) => {
      if (["ArrowUp", "KeyW", "w", "W"].includes(e.code) || ["ArrowUp", "w", "W"].includes(e.key)) {
        e.preventDefault();
        movePlayer(0, -1);
      } else if (["ArrowDown", "KeyS", "s", "S"].includes(e.code) || ["ArrowDown", "s", "S"].includes(e.key)) {
        e.preventDefault();
        movePlayer(0, 1);
      } else if (["ArrowLeft", "KeyA", "a", "A"].includes(e.code) || ["ArrowLeft", "a", "A"].includes(e.key)) {
        e.preventDefault();
        movePlayer(-1, 0);
      } else if (["ArrowRight", "KeyD", "d", "D"].includes(e.code) || ["ArrowRight", "d", "D"].includes(e.key)) {
        e.preventDefault();
        movePlayer(1, 0);
      }
    };
    window.addEventListener("keydown", this.activeKeydownHandler);
    canvas.addEventListener("click", (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = Math.floor((e.clientX - rect.left) / rect.width * cols);
      const clickY = Math.floor((e.clientY - rect.top) / rect.height * rows);
      const hit = buildings.find((b) => clickX >= b.x && clickX < b.x + b.w && clickY >= b.y && clickY < b.y + b.h);
      if (hit) {
        selectedBuilding = hit;
        updateSidebarForBuilding(hit);
      }
      this.player2d.x = Math.max(0, Math.min(cols - 1, clickX));
      this.player2d.y = Math.max(0, Math.min(rows - 1, clickY));
      draw();
    });
  }
  renderWorld3D(viewport, sidebar, ledger, _currentPlace) {
    viewport.innerHTML = "";
    sidebar.innerHTML = "";
    const container = document.createElement("div");
    container.style.cssText = "width: 100%; height: 100%; position: relative; overflow: hidden; background: #070d19;";
    viewport.appendChild(container);
    const banner = document.createElement("div");
    banner.style.cssText = "position: absolute; top: 10px; left: 10px; background: rgba(15,23,42,0.85); backdrop-filter: blur(8px); border: 1px solid rgba(99,102,241,0.4); padding: 5px 10px; border-radius: 6px; font-size: 11px; color: #cbd5e1; z-index: 5; pointer-events: none;";
    banner.innerHTML = `\uD83C\uDFAE <strong>Over-the-Shoulder 3D District</strong> • WASD to move • Q/E to turn camera`;
    container.appendChild(banner);
    const proxPrompt = document.createElement("div");
    proxPrompt.style.cssText = "position: absolute; bottom: 15px; left: 50%; transform: translateX(-50%); background: rgba(15,23,42,0.95); border: 1px solid #38bdf8; border-radius: 8px; padding: 6px 16px; font-size: 12px; font-weight: 700; color: #38bdf8; z-index: 5; display: none; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.5);";
    container.appendChild(proxPrompt);
    sidebar.innerHTML = `
      <div style="border-bottom: 1px solid #334155; padding-bottom: 8px;">
        <h4 style="margin: 0; font-size: 14px; color: #f8fafc; display: flex; align-items: center; gap: 6px;">
          <span>\uD83C\uDFAE</span> <span>3D Walkable District</span>
        </h4>
        <span style="font-size: 11px; color: #38bdf8;">Diurnal Diode Lighting: ${ledger.clock?.phase || "Day"}</span>
      </div>
      <div style="font-size: 11px; color: #cbd5e1; line-height: 1.4;">
        Explore the district from a third-person over-the-shoulder perspective. Turn the camera using Q and E, walk with WASD, and step up to buildings to enter.
      </div>
      <div id="vn-3d-sidebar-target" style="margin-top: 10px;"></div>
    `;
    const THREE = window.THREE;
    if (!THREE) {
      const loaderDiv = document.createElement("div");
      loaderDiv.style.cssText = "display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 10px; color: #94a3b8; font-size: 12px;";
      loaderDiv.innerHTML = `
        <div style="font-size: 24px;">\uD83C\uDFAE</div>
        <div>Three.js District 3D Viewport</div>
        <button id="vn-load-three-btn" style="background: #4f46e5; border: none; color: #fff; font-size: 11px; font-weight: 700; padding: 6px 14px; border-radius: 6px; cursor: pointer;">
          Launch 3D Engine
        </button>
      `;
      container.appendChild(loaderDiv);
      const loadScript = () => {
        loaderDiv.innerHTML = `<div>Loading 3D renderer...</div>`;
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
        script.onload = () => {
          this.renderWorld3D(viewport, sidebar, ledger, _currentPlace);
        };
        script.onerror = () => {
          loaderDiv.innerHTML = `<div style="color: #f87171;">WebGL/Three.js failed to load. Use 2D Tilemap for full district exploration.</div>`;
        };
        document.head.appendChild(script);
      };
      container.querySelector("#vn-load-three-btn")?.addEventListener("click", loadScript);
      return;
    }
    try {
      const width = viewport.clientWidth || 560;
      const height = viewport.clientHeight || 400;
      const scene = new THREE.Scene;
      const phase = (ledger.clock?.phase || "day").toLowerCase();
      const isNight = phase.includes("night") || phase.includes("midnight");
      const isSunset = phase.includes("sunset") || phase.includes("dusk") || phase.includes("evening");
      scene.background = new THREE.Color(isNight ? 132631 : isSunset ? 4850766 : 988970);
      const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      this.threeRenderer = renderer;
      container.appendChild(renderer.domElement);
      const ambientLight = new THREE.AmbientLight(isNight ? 1976635 : isSunset ? 16096779 : 16777215, isNight ? 0.4 : 0.8);
      scene.add(ambientLight);
      const sunLight = new THREE.DirectionalLight(isNight ? 9684477 : isSunset ? 16347926 : 16777215, isNight ? 0.3 : 1);
      sunLight.position.set(15, 30, 20);
      scene.add(sunLight);
      const planeGeo = new THREE.PlaneGeometry(80, 80);
      const planeMat = new THREE.MeshStandardMaterial({ color: 725801, roughness: 0.8 });
      const plane = new THREE.Mesh(planeGeo, planeMat);
      plane.rotation.x = -Math.PI / 2;
      scene.add(plane);
      const grid = new THREE.GridHelper(80, 40, 6514417, 1976635);
      grid.position.y = 0.01;
      scene.add(grid);
      const landmarks = extract3DLandmarksFromLedger(ledger);
      for (const lm of landmarks) {
        const boxGeo = new THREE.BoxGeometry(8, 7, 8);
        const boxMat = new THREE.MeshStandardMaterial({ color: lm.color, roughness: 0.5 });
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.set(lm.x, 3.5, lm.z);
        scene.add(box);
        const roofGeo = new THREE.ConeGeometry(6, 4, 4);
        const roofMat = new THREE.MeshStandardMaterial({ color: 3359061 });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(lm.x, 9, lm.z);
        roof.rotation.y = Math.PI / 4;
        scene.add(roof);
        const ringGeo = new THREE.TorusGeometry(1.2, 0.15, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 3718648 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(lm.x, 1.2, lm.z + 4.1);
        scene.add(ring);
      }
      const playerMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.8, 16), new THREE.MeshStandardMaterial({ color: 3718648, roughness: 0.3 }));
      playerMesh.position.set(0, 0.9, 8);
      scene.add(playerMesh);
      let px = 0;
      let pz = 8;
      let playerRot = 0;
      const speed = 0.6;
      const updateCamera = () => {
        playerMesh.position.set(px, 0.9, pz);
        playerMesh.rotation.y = playerRot;
        const camDist = 6;
        const camHeight = 3.2;
        camera.position.set(px - Math.sin(playerRot) * camDist, camHeight, pz - Math.cos(playerRot) * camDist);
        camera.lookAt(px, 1.4, pz);
        let closest = null;
        let minDist = 999;
        for (const lm of landmarks) {
          const d = Math.hypot(px - lm.x, pz - lm.z);
          if (d < minDist) {
            minDist = d;
            closest = lm;
          }
        }
        if (closest && minDist < 8) {
          proxPrompt.style.display = "block";
          proxPrompt.textContent = `\uD83D\uDEAA Near ${closest.name} • [Click to Enter]`;
          proxPrompt.onclick = () => {
            this.onAction(`*Enters ${closest.name}*`);
          };
          const targetBox = sidebar.querySelector("#vn-3d-sidebar-target");
          if (targetBox) {
            targetBox.innerHTML = `
              <div style="background: #1e293b; border: 1px solid #38bdf8; border-radius: 8px; padding: 10px;">
                <strong style="color: #38bdf8; font-size: 12px;">\uD83D\uDCCD ${closest.name}</strong>
                <p style="font-size: 11px; color: #cbd5e1; margin: 4px 0 8px 0;">You are standing right outside the entrance.</p>
                <button id="vn-3d-enter-building-btn" style="width: 100%; background: #0284c7; color: #fff; border: none; font-size: 11px; font-weight: 700; padding: 6px; border-radius: 4px; cursor: pointer;">
                  Enter Landmark
                </button>
              </div>
            `;
            targetBox.querySelector("#vn-3d-enter-building-btn")?.addEventListener("click", () => {
              this.onAction(`*Enters ${closest.name}*`);
            });
          }
        } else {
          proxPrompt.style.display = "none";
        }
      };
      this.activeKeydownHandler = (e) => {
        if (["KeyW", "w", "W", "ArrowUp"].includes(e.code) || ["w", "W", "ArrowUp"].includes(e.key)) {
          px += Math.sin(playerRot) * speed;
          pz += Math.cos(playerRot) * speed;
        } else if (["KeyS", "s", "S", "ArrowDown"].includes(e.code) || ["s", "S", "ArrowDown"].includes(e.key)) {
          px -= Math.sin(playerRot) * speed;
          pz -= Math.cos(playerRot) * speed;
        } else if (["KeyA", "a", "A", "ArrowLeft"].includes(e.code) || ["a", "A", "ArrowLeft"].includes(e.key)) {
          playerRot += 0.08;
        } else if (["KeyD", "d", "D", "ArrowRight"].includes(e.code) || ["d", "D", "ArrowRight"].includes(e.key)) {
          playerRot -= 0.08;
        } else if (["KeyQ", "q", "Q"].includes(e.code) || ["q", "Q"].includes(e.key)) {
          playerRot += 0.12;
        } else if (["KeyE", "e", "E"].includes(e.code) || ["e", "E"].includes(e.key)) {
          playerRot -= 0.12;
        }
        updateCamera();
      };
      window.addEventListener("keydown", this.activeKeydownHandler);
      const animate = () => {
        this.threeAnimId = requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };
      animate();
      updateCamera();
    } catch (err) {
      console.error("[LumiVN] 3D World initialization error:", err);
    }
  }
}

// src/frontend/hud/tab-phone.ts
function parsePhoneGameKey(e) {
  const k = (e.key || "").toLowerCase();
  const c = e.code || "";
  const isUp = k === "arrowup" || k === "up" || k === "w" || k === "i" || k === "8" || c === "ArrowUp" || c === "KeyW" || c === "KeyI" || c === "Numpad8";
  const isDown = k === "arrowdown" || k === "down" || k === "s" || k === "k" || k === "2" || c === "ArrowDown" || c === "KeyS" || c === "KeyK" || c === "Numpad2";
  const isLeft = k === "arrowleft" || k === "left" || k === "a" || k === "j" || k === "h" || k === "4" || c === "ArrowLeft" || c === "KeyA" || c === "KeyJ" || c === "KeyH" || c === "Numpad4";
  const isRight = k === "arrowright" || k === "right" || k === "d" || k === "l" || k === "6" || c === "ArrowRight" || c === "KeyD" || c === "KeyL" || c === "Numpad6";
  const isAction = k === " " || k === "space" || k === "enter" || k === "z" || k === "x" || k === "f" || c === "Space" || c === "Enter" || c === "KeyZ" || c === "KeyX" || c === "KeyF";
  const isRestart = k === "r" || c === "KeyR" || isAction;
  return { up: isUp, down: isDown, left: isLeft, right: isRight, action: isAction, restart: isRestart };
}

class PhoneTab {
  root;
  ctx;
  onAction;
  currentLedger = {};
  activeApp = "home";
  selectedGame = "menu";
  selectedChatActor = null;
  stopCurrentGame = null;
  isOverlayActive;
  constructor(ctx, onAction, isOverlayActive) {
    this.ctx = ctx;
    this.onAction = onAction;
    this.isOverlayActive = isOverlayActive;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-phone";
  }
  isGameInputActive() {
    if (!this.root.isConnected || this.root.offsetParent === null)
      return false;
    const active = document.activeElement;
    if (active?.tagName === "INPUT" || active?.tagName === "TEXTAREA")
      return false;
    return true;
  }
  render(ledger) {
    this.currentLedger = ledger;
    this.root.innerHTML = "";
    this.stopCurrentGame?.();
    this.stopCurrentGame = null;
    const phoneShell = document.createElement("div");
    phoneShell.style.cssText = `
      width: 330px;
      height: 580px;
      margin: 0 auto;
      background: #090a0f;
      border: 10px solid #1e2230;
      border-radius: 40px;
      position: relative;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8), inset 0 0 10px rgba(0,0,0,0.8);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;
    const clockTime = ledger.clock?.t?.split(" ")[1] || ledger.clock?.t || "12:00";
    const statusBar = document.createElement("div");
    statusBar.style.cssText = "height: 32px; display: flex; justify-content: space-between; align-items: center; padding: 0 18px; font-size: 11px; color: #f8fafc; z-index: 10;";
    statusBar.innerHTML = `
      <span>${clockTime}</span>
      <div style="width: 70px; height: 18px; background: #000; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
        <span style="width: 6px; height: 6px; background: #22c55e; border-radius: 50%;"></span>
      </div>
      <span>5G ⚡98%</span>
    `;
    phoneShell.appendChild(statusBar);
    const screenBody = document.createElement("div");
    screenBody.style.cssText = "flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column;";
    if (this.activeApp === "home") {
      this.renderHomeScreen(screenBody);
    } else if (this.activeApp === "messages") {
      this.renderMessagesApp(screenBody);
    } else if (this.activeApp === "calls") {
      this.renderCallsApp(screenBody);
    } else if (this.activeApp === "bank") {
      this.renderBankApp(screenBody);
    } else if (this.activeApp === "arcade") {
      this.renderArcadeApp(screenBody);
    }
    phoneShell.appendChild(screenBody);
    const homeBar = document.createElement("div");
    homeBar.style.cssText = "height: 24px; display: flex; justify-content: center; align-items: center; cursor: pointer;";
    homeBar.innerHTML = `<div style="width: 100px; height: 4px; background: #64748b; border-radius: 2px;"></div>`;
    homeBar.addEventListener("click", () => {
      this.stopCurrentGame?.();
      this.stopCurrentGame = null;
      this.activeApp = "home";
      this.selectedGame = "menu";
      this.render(this.currentLedger);
    });
    phoneShell.appendChild(homeBar);
    this.root.appendChild(phoneShell);
  }
  renderHomeScreen(container) {
    const ripples = (this.currentLedger.bplots || []).filter((b) => b.ripple === 2 && b.status === "active");
    let notifHtml = "";
    if (ripples.length > 0) {
      notifHtml = `
        <div style="background: rgba(244,63,94,0.2); border: 1px solid #f43f5e; border-radius: 12px; padding: 10px; margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 700; color: #f43f5e; margin-bottom: 2px;">\uD83D\uDEA8 EMERGENCY NOTIFICATION</div>
          ${ripples.map((r) => `<div style="font-size: 11px; color: #fff;"><strong>${r.who}:</strong> ${r.doing}${r.vector ? ` <span style="color: #94a3b8;">(${r.vector})</span>` : ""}</div>`).join("")}
        </div>
      `;
    }
    const clockTime = this.currentLedger.clock?.t?.split(" ")[1] || this.currentLedger.clock?.t || "12:00";
    const dateStr = this.currentLedger.clock?.date || "12-10-18";
    const locStr = this.currentLedger.clock?.location || "Unknown Location";
    const regionStr = this.currentLedger.clock?.region ? `, ${this.currentLedger.clock.region}` : "";
    const phaseStr = this.currentLedger.clock?.phase || "Day";
    container.innerHTML = `
      ${notifHtml}
      <div style="text-align: center; margin: 8px 0 16px 0; color: #f8fafc;">
        <div style="font-size: 32px; font-weight: 300; letter-spacing: -0.5px; line-height: 1;">${clockTime}</div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">${dateStr} • ${phaseStr}</div>
        <div style="font-size: 11px; color: #38bdf8; margin-top: 2px;">\uD83D\uDCCD ${locStr}${regionStr}</div>
      </div>
      <div style="flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; align-content: start; margin-top: 6px;">
        <div class="vn-phone-app-icon" data-app="messages" style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="width: 54px; height: 54px; background: #10b981; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px;">\uD83D\uDCAC</div>
          <span style="font-size: 11px; color: #fff; margin-top: 4px;">Messages</span>
        </div>
        <div class="vn-phone-app-icon" data-app="calls" style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="width: 54px; height: 54px; background: #3b82f6; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px;">\uD83D\uDCDE</div>
          <span style="font-size: 11px; color: #fff; margin-top: 4px;">Phone</span>
        </div>
        <div class="vn-phone-app-icon" data-app="bank" style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="width: 54px; height: 54px; background: #f59e0b; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px;">\uD83D\uDCB3</div>
          <span style="font-size: 11px; color: #fff; margin-top: 4px;">Wallet</span>
        </div>
        <div class="vn-phone-app-icon" data-app="arcade" style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="width: 54px; height: 54px; background: linear-gradient(135deg, #ec4899, #8b5cf6); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 0 4px 12px rgba(236,72,153,0.4);">\uD83C\uDFAE</div>
          <span style="font-size: 11px; color: #fff; margin-top: 4px; font-weight: 700;">Arcade</span>
        </div>
      </div>
    `;
    container.querySelectorAll(".vn-phone-app-icon").forEach((el) => {
      el.addEventListener("click", () => {
        const app = el.getAttribute("data-app");
        if (app) {
          this.activeApp = app;
          this.selectedGame = "menu";
          this.render(this.currentLedger);
        }
      });
    });
  }
  renderMessagesApp(container) {
    const actors = this.currentLedger.actors || {};
    const actorIds = Object.keys(actors).filter((id) => id.toLowerCase() !== "user");
    if (!this.selectedChatActor && actorIds.length > 0) {
      this.selectedChatActor = actorIds[0];
    }
    if (!this.selectedChatActor) {
      container.innerHTML = `<div class="vn-muted" style="text-align:center; margin-top: 40px;">No contacts saved.</div>`;
      return;
    }
    const currentNpc = actors[this.selectedChatActor];
    const npcName = currentNpc?.name || this.selectedChatActor;
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2d334d; padding-bottom: 8px; margin-bottom: 10px;">
        <button id="vn-phone-back" style="background: transparent; border: none; color: #38bdf8; font-size: 12px; cursor: pointer;">◀ Apps</button>
        <select id="vn-phone-contact-select" style="background: #1e293b; color: #fff; border: 1px solid #475569; border-radius: 4px; font-size: 12px; padding: 2px 6px;">
          ${actorIds.map((id) => `<option value="${id}" ${id === this.selectedChatActor ? "selected" : ""}>${actors[id]?.name || id}</option>`).join("")}
        </select>
      </div>

      <div style="flex: 1; display: flex; flex-direction: column; justify-content: flex-end;">
        <div style="background: #1e2235; border-radius: 8px; padding: 10px; font-size: 12px; color: #cbd5e1; margin-bottom: 10px;">
          Direct messaging session active with <strong>${npcName}</strong>. Sending a text triggers an immediate in-character chat turn.
        </div>
      </div>

      <div style="display: flex; gap: 6px; margin-top: auto;">
        <input id="vn-phone-sms-input" type="text" placeholder="Type text message..." style="flex: 1; background: #1e293b; border: 1px solid #475569; border-radius: 8px; padding: 8px; color: #fff; font-size: 12px;" />
        <button id="vn-phone-send-sms" style="background: #10b981; border: none; border-radius: 8px; padding: 0 12px; color: #fff; font-weight: 700; cursor: pointer;">➤</button>
      </div>
    `;
    container.querySelector("#vn-phone-back")?.addEventListener("click", () => {
      this.activeApp = "home";
      this.render(this.currentLedger);
    });
    const select = container.querySelector("#vn-phone-contact-select");
    select?.addEventListener("change", () => {
      this.selectedChatActor = select.value;
      this.renderMessagesApp(container);
    });
    const input = container.querySelector("#vn-phone-sms-input");
    const sendBtn = container.querySelector("#vn-phone-send-sms");
    const sendSms = () => {
      const text = input.value.trim();
      if (!text)
        return;
      this.onAction(`*Texts ${npcName} on phone*: "${text}"`);
      input.value = "";
    };
    sendBtn?.addEventListener("click", sendSms);
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter")
        sendSms();
    });
  }
  renderCallsApp(container) {
    const actors = this.currentLedger.actors || {};
    const actorIds = Object.keys(actors).filter((id) => id.toLowerCase() !== "user");
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2d334d; padding-bottom: 8px; margin-bottom: 10px;">
        <button id="vn-phone-back" style="background: transparent; border: none; color: #38bdf8; font-size: 12px; cursor: pointer;">◀ Apps</button>
        <strong style="color: #fff; font-size: 13px;">Contacts & Dial</strong>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${actorIds.map((id) => {
      const name = actors[id]?.name || id;
      return `
            <div style="background: #1e2235; border: 1px solid #2d334d; border-radius: 8px; padding: 10px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 13px; color: #fff;">${name}</span>
              <button class="vn-phone-call-btn" data-target="${name}" style="background: #3b82f6; border: none; border-radius: 6px; padding: 4px 10px; color: #fff; font-size: 11px; cursor: pointer;">\uD83D\uDCDE Call</button>
            </div>
          `;
    }).join("")}
      </div>
    `;
    container.querySelector("#vn-phone-back")?.addEventListener("click", () => {
      this.activeApp = "home";
      this.render(this.currentLedger);
    });
    container.querySelectorAll(".vn-phone-call-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-target");
        if (target)
          this.onAction(`*Calls ${target} on phone*`);
      });
    });
  }
  renderBankApp(container) {
    const userMoney = this.currentLedger.actors?.["user"]?.money || { in_hand: 0, in_bank: 0, currency: "$" };
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2d334d; padding-bottom: 8px; margin-bottom: 14px;">
        <button id="vn-phone-back" style="background: transparent; border: none; color: #38bdf8; font-size: 12px; cursor: pointer;">◀ Apps</button>
        <strong style="color: #fff; font-size: 13px;">Digital Banking</strong>
      </div>
      <div style="background: linear-gradient(135deg, #1e1b4b, #312e81); border-radius: 12px; padding: 16px; margin-bottom: 14px; color: #fff;">
        <div style="font-size: 11px; opacity: 0.8;">Total Liquid Assets</div>
        <div style="font-size: 26px; font-weight: 800; margin: 4px 0;">${userMoney.currency || "$"}${userMoney.in_bank || 0}</div>
        <div style="font-size: 11px; opacity: 0.8;">Physical Cash in Hand: ${userMoney.currency || "$"}${userMoney.in_hand || 0}</div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="vn-bank-atm-btn" style="flex: 1; background: #334155; border: none; border-radius: 8px; padding: 10px; color: #fff; font-size: 12px; cursor: pointer;">Withdraw Cash</button>
      </div>
    `;
    container.querySelector("#vn-phone-back")?.addEventListener("click", () => {
      this.activeApp = "home";
      this.render(this.currentLedger);
    });
    container.querySelector("#vn-bank-atm-btn")?.addEventListener("click", () => {
      this.onAction(`*Withdraws cash from bank account at ATM*`);
    });
  }
  renderArcadeApp(container) {
    if (this.selectedGame === "menu") {
      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2d334d; padding-bottom: 8px; margin-bottom: 14px;">
          <button id="vn-arcade-home-btn" style="background: transparent; border: none; color: #38bdf8; font-size: 12px; cursor: pointer;">◀ Home</button>
          <strong style="color: #f472b6; font-size: 14px; letter-spacing: 0.5px;">\uD83C\uDFAE Pocket Arcade</strong>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div class="vn-game-card" data-game="shooter" style="background: linear-gradient(135deg, #1e1b4b, #2e1065); border: 1px solid #a855f7; border-radius: 12px; padding: 14px; cursor: pointer; display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 32px;">\uD83D\uDE80</div>
            <div style="flex: 1;">
              <div style="font-weight: 800; color: #f8fafc; font-size: 13px;">Star Striker</div>
              <div style="font-size: 11px; color: #c084fc; margin-top: 2px;">Vertical space shooter with lasers & alien waves!</div>
            </div>
            <span style="color: #a855f7; font-size: 18px;">▶</span>
          </div>

          <div class="vn-game-card" data-game="racer" style="background: linear-gradient(135deg, #451a03, #78350f); border: 1px solid #f97316; border-radius: 12px; padding: 14px; cursor: pointer; display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 32px;">\uD83C\uDFCE️</div>
            <div style="flex: 1;">
              <div style="font-weight: 800; color: #f8fafc; font-size: 13px;">Traffic Racer</div>
              <div style="font-size: 11px; color: #fdba74; margin-top: 2px;">3-lane high-speed highway dodge with nitro boost!</div>
            </div>
            <span style="color: #f97316; font-size: 18px;">▶</span>
          </div>

          <div class="vn-game-card" data-game="snake" style="background: linear-gradient(135deg, #064e3b, #047857); border: 1px solid #10b981; border-radius: 12px; padding: 14px; cursor: pointer; display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 32px;">\uD83D\uDC0D</div>
            <div style="flex: 1;">
              <div style="font-weight: 800; color: #f8fafc; font-size: 13px;">Retro Snake</div>
              <div style="font-size: 11px; color: #6ee7b7; margin-top: 2px;">Classic arcade grid snake with apples & score.</div>
            </div>
            <span style="color: #10b981; font-size: 18px;">▶</span>
          </div>
        </div>
      `;
      container.querySelector("#vn-arcade-home-btn")?.addEventListener("click", () => {
        this.activeApp = "home";
        this.render(this.currentLedger);
      });
      container.querySelectorAll(".vn-game-card").forEach((card) => {
        card.addEventListener("click", () => {
          const game = card.getAttribute("data-game");
          if (game) {
            this.selectedGame = game;
            this.renderArcadeApp(container);
          }
        });
      });
      return;
    }
    if (this.selectedGame === "shooter") {
      this.initSpaceShooter(container);
    } else if (this.selectedGame === "racer") {
      this.initTrafficRacer(container);
    } else if (this.selectedGame === "snake") {
      this.initRetroSnake(container);
    }
  }
  initSpaceShooter(container) {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <button id="vn-game-back-btn" style="background: transparent; border: none; color: #38bdf8; font-size: 12px; cursor: pointer;">◀ Games</button>
        <span style="font-size: 12px; font-weight: 800; color: #a855f7;">\uD83D\uDE80 Star Striker</span>
        <span id="vn-shooter-score" style="font-size: 12px; font-weight: 700; color: #ffd700;">Score: 0</span>
      </div>
      <canvas id="vn-shooter-canvas" width="280" height="320" style="background: #030712; border: 1px solid #374151; border-radius: 8px; display: block; margin: 0 auto;"></canvas>
      <div style="display: flex; justify-content: center; gap: 8px; margin-top: 10px;">
        <button id="vn-btn-left" style="background: #1f2937; border: 1px solid #4b5563; border-radius: 8px; color: #fff; width: 60px; height: 38px; font-size: 18px; cursor: pointer;">◀</button>
        <button id="vn-btn-fire" style="background: #dc2626; border: 1px solid #ef4444; border-radius: 8px; color: #fff; flex: 1; height: 38px; font-weight: 800; font-size: 13px; cursor: pointer;">\uD83D\uDCA5 FIRE</button>
        <button id="vn-btn-right" style="background: #1f2937; border: 1px solid #4b5563; border-radius: 8px; color: #fff; width: 60px; height: 38px; font-size: 18px; cursor: pointer;">▶</button>
      </div>
      <p style="font-size: 10px; color: #94a3b8; text-align: center; margin-top: 6px;">\uD83C\uDFAE Controls: ◀ ▶ / WASD / IJKL / HJKL / Numpad • Fire: Space / Z / Enter • Restart: R</p>
    `;
    container.querySelector("#vn-game-back-btn")?.addEventListener("click", () => {
      this.selectedGame = "menu";
      this.renderArcadeApp(container);
    });
    const canvas = container.querySelector("#vn-shooter-canvas");
    if (!canvas)
      return;
    canvas.tabIndex = 0;
    canvas.focus();
    canvas.style.outline = "none";
    const ctx = canvas.getContext("2d");
    if (!ctx)
      return;
    let score = 0;
    let lives = 3;
    let gameOver = false;
    let playerX = 140;
    const playerSpeed = 4;
    let moveLeft = false;
    let moveRight = false;
    const activeKeys = new Set;
    const bullets = [];
    const enemies = [];
    const stars = [];
    for (let i = 0;i < 25; i++) {
      stars.push({ x: Math.random() * 280, y: Math.random() * 320, speed: Math.random() * 1.5 + 0.5 });
    }
    let enemySpawnCounter = 0;
    let animId;
    const fireBullet = () => {
      if (gameOver) {
        score = 0;
        lives = 3;
        gameOver = false;
        enemies.length = 0;
        bullets.length = 0;
        playerX = 140;
        return;
      }
      bullets.push({ x: playerX, y: 285 });
    };
    const onKeyDown = (e) => {
      if (!this.isGameInputActive())
        return;
      const input = parsePhoneGameKey(e);
      if (input.left || input.right || input.action || input.restart) {
        e.preventDefault();
      }
      activeKeys.add(e.code || e.key);
      if (gameOver && input.restart) {
        fireBullet();
        return;
      }
      if (input.action && !e.repeat) {
        fireBullet();
      }
    };
    const onKeyUp = (e) => {
      activeKeys.delete(e.code || e.key);
      const input = parsePhoneGameKey(e);
      if (input.left || input.right || input.action) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    const btnLeft = container.querySelector("#vn-btn-left");
    const btnRight = container.querySelector("#vn-btn-right");
    const btnFire = container.querySelector("#vn-btn-fire");
    btnLeft?.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      moveLeft = true;
      e.target?.blur();
    });
    btnLeft?.addEventListener("pointerup", () => {
      moveLeft = false;
    });
    btnLeft?.addEventListener("pointerleave", () => {
      moveLeft = false;
    });
    btnRight?.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      moveRight = true;
      e.target?.blur();
    });
    btnRight?.addEventListener("pointerup", () => {
      moveRight = false;
    });
    btnRight?.addEventListener("pointerleave", () => {
      moveRight = false;
    });
    btnFire?.addEventListener("click", (e) => {
      fireBullet();
      e.target?.blur();
    });
    const loop = () => {
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, 280, 320);
      ctx.fillStyle = "#475569";
      for (const s of stars) {
        ctx.fillRect(s.x, s.y, 1.5, 1.5);
        s.y += s.speed;
        if (s.y > 320)
          s.y = 0;
      }
      if (!gameOver) {
        const isLeftActive = moveLeft || [...activeKeys].some((k) => parsePhoneGameKey({ code: k, key: k }).left);
        const isRightActive = moveRight || [...activeKeys].some((k) => parsePhoneGameKey({ code: k, key: k }).right);
        if (isLeftActive && playerX > 16)
          playerX -= playerSpeed;
        if (isRightActive && playerX < 264)
          playerX += playerSpeed;
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.moveTo(playerX, 280);
        ctx.lineTo(playerX - 12, 305);
        ctx.lineTo(playerX + 12, 305);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#f97316";
        ctx.fillRect(playerX - 3, 305, 6, 4);
        ctx.fillStyle = "#f43f5e";
        for (let i = bullets.length - 1;i >= 0; i--) {
          const b = bullets[i];
          b.y -= 7;
          ctx.fillRect(b.x - 2, b.y, 4, 8);
          if (b.y < -10)
            bullets.splice(i, 1);
        }
        enemySpawnCounter++;
        if (enemySpawnCounter > 35) {
          enemySpawnCounter = 0;
          enemies.push({ x: Math.random() * 240 + 20, y: -20, vx: (Math.random() - 0.5) * 1.5, hp: 1 });
        }
        for (let i = enemies.length - 1;i >= 0; i--) {
          const e = enemies[i];
          e.y += 2.2;
          e.x += e.vx;
          if (e.x < 15 || e.x > 265)
            e.vx *= -1;
          ctx.fillStyle = "#a855f7";
          ctx.fillRect(e.x - 10, e.y - 10, 20, 16);
          ctx.fillStyle = "#fde047";
          ctx.fillRect(e.x - 6, e.y - 4, 3, 3);
          ctx.fillRect(e.x + 3, e.y - 4, 3, 3);
          for (let bi = bullets.length - 1;bi >= 0; bi--) {
            const b = bullets[bi];
            if (Math.abs(b.x - e.x) < 14 && Math.abs(b.y - e.y) < 14) {
              bullets.splice(bi, 1);
              enemies.splice(i, 1);
              score += 100;
              const scoreEl = container.querySelector("#vn-shooter-score");
              if (scoreEl)
                scoreEl.textContent = `Score: ${score}`;
              break;
            }
          }
          if (Math.abs(playerX - e.x) < 16 && Math.abs(290 - e.y) < 16) {
            enemies.splice(i, 1);
            lives--;
            if (lives <= 0)
              gameOver = true;
          }
          if (e.y > 330)
            enemies.splice(i, 1);
        }
        ctx.fillStyle = "#f43f5e";
        ctx.font = "11px sans-serif";
        ctx.fillText(`❤️ × ${lives}`, 10, 20);
      } else {
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.fillRect(0, 0, 280, 320);
        ctx.fillStyle = "#f43f5e";
        ctx.font = "bold 20px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", 140, 140);
        ctx.fillStyle = "#f8fafc";
        ctx.font = "13px sans-serif";
        ctx.fillText(`Final Score: ${score}`, 140, 170);
        ctx.fillStyle = "#38bdf8";
        ctx.font = "12px sans-serif";
        ctx.fillText("Tap FIRE to Restart", 140, 200);
        ctx.textAlign = "start";
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    this.stopCurrentGame = () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }
  initTrafficRacer(container) {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <button id="vn-game-back-btn" style="background: transparent; border: none; color: #38bdf8; font-size: 12px; cursor: pointer;">◀ Games</button>
        <span style="font-size: 12px; font-weight: 800; color: #f97316;">\uD83C\uDFCE️ Traffic Racer</span>
        <span id="vn-racer-score" style="font-size: 12px; font-weight: 700; color: #ffd700;">0m</span>
      </div>
      <canvas id="vn-racer-canvas" width="280" height="320" style="background: #1e293b; border: 1px solid #374151; border-radius: 8px; display: block; margin: 0 auto;"></canvas>
      <div style="display: flex; justify-content: center; gap: 8px; margin-top: 10px;">
        <button id="vn-racer-left" style="background: #1f2937; border: 1px solid #4b5563; border-radius: 8px; color: #fff; flex: 1; height: 38px; font-weight: 700; font-size: 14px; cursor: pointer;">◀ Left Lane</button>
        <button id="vn-racer-nitro" style="background: #ea580c; border: 1px solid #f97316; border-radius: 8px; color: #fff; width: 80px; height: 38px; font-weight: 800; font-size: 12px; cursor: pointer;">\uD83D\uDD25 NITRO</button>
        <button id="vn-racer-right" style="background: #1f2937; border: 1px solid #4b5563; border-radius: 8px; color: #fff; flex: 1; height: 38px; font-weight: 700; font-size: 14px; cursor: pointer;">Right Lane ▶</button>
      </div>
      <p style="font-size: 10px; color: #94a3b8; text-align: center; margin-top: 6px;">\uD83C\uDFAE Controls: ◀ ▶ / A D / J L / H L to Steer • Nitro: ▲ / W / Space • Restart: R</p>
    `;
    container.querySelector("#vn-game-back-btn")?.addEventListener("click", () => {
      this.selectedGame = "menu";
      this.renderArcadeApp(container);
    });
    const canvas = container.querySelector("#vn-racer-canvas");
    if (!canvas)
      return;
    canvas.tabIndex = 0;
    canvas.focus();
    canvas.style.outline = "none";
    const ctx = canvas.getContext("2d");
    if (!ctx)
      return;
    const lanes = [65, 140, 215];
    let currentLane = 1;
    let targetX = lanes[1];
    let playerX = targetX;
    let distance = 0;
    let speed = 4;
    let nitro = false;
    let gameOver = false;
    const traffic = [];
    const coins = [];
    let roadDashY = 0;
    let animId;
    const steerLeft = () => {
      if (gameOver) {
        restart();
        return;
      }
      if (currentLane > 0)
        currentLane--;
      targetX = lanes[currentLane];
    };
    const steerRight = () => {
      if (gameOver) {
        restart();
        return;
      }
      if (currentLane < 2)
        currentLane++;
      targetX = lanes[currentLane];
    };
    const restart = () => {
      gameOver = false;
      distance = 0;
      currentLane = 1;
      targetX = lanes[1];
      playerX = targetX;
      traffic.length = 0;
      coins.length = 0;
      speed = 4;
    };
    const onKeyDown = (e) => {
      if (!this.isGameInputActive())
        return;
      const input = parsePhoneGameKey(e);
      if (input.left || input.right || input.up || input.action || input.restart) {
        e.preventDefault();
      }
      if (gameOver && (input.restart || input.left || input.right || input.up || input.action)) {
        restart();
        return;
      }
      if (input.left && !e.repeat) {
        steerLeft();
      }
      if (input.right && !e.repeat) {
        steerRight();
      }
      if (input.up || input.action) {
        nitro = true;
      }
    };
    const onKeyUp = (e) => {
      const input = parsePhoneGameKey(e);
      if (input.up || input.action) {
        e.preventDefault();
        nitro = false;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    container.querySelector("#vn-racer-left")?.addEventListener("click", (e) => {
      steerLeft();
      e.target?.blur();
    });
    container.querySelector("#vn-racer-right")?.addEventListener("click", (e) => {
      steerRight();
      e.target?.blur();
    });
    const nitroBtn = container.querySelector("#vn-racer-nitro");
    nitroBtn?.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      nitro = true;
      e.target?.blur();
    });
    nitroBtn?.addEventListener("pointerup", () => {
      nitro = false;
    });
    nitroBtn?.addEventListener("pointerleave", () => {
      nitro = false;
    });
    let spawnTimer = 0;
    const loop = () => {
      ctx.fillStyle = "#334155";
      ctx.fillRect(0, 0, 280, 320);
      ctx.fillStyle = "#15803d";
      ctx.fillRect(0, 0, 20, 320);
      ctx.fillRect(260, 0, 20, 320);
      roadDashY = (roadDashY + (nitro ? 9 : speed)) % 40;
      ctx.fillStyle = "#f8fafc";
      for (let y = -40 + roadDashY;y < 340; y += 40) {
        ctx.fillRect(102, y, 4, 20);
        ctx.fillRect(177, y, 4, 20);
      }
      if (!gameOver) {
        const curSpeed = nitro ? 8 : speed;
        distance += Math.floor(curSpeed);
        speed = 4 + Math.min(6, distance / 1500);
        const scoreEl = container.querySelector("#vn-racer-score");
        if (scoreEl)
          scoreEl.textContent = `${distance}m`;
        playerX += (targetX - playerX) * 0.3;
        ctx.fillStyle = "#dc2626";
        ctx.fillRect(playerX - 12, 250, 24, 44);
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(playerX - 9, 260, 18, 10);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(playerX - 14, 255, 3, 10);
        ctx.fillRect(playerX + 11, 255, 3, 10);
        ctx.fillRect(playerX - 14, 280, 3, 10);
        ctx.fillRect(playerX + 11, 280, 3, 10);
        if (nitro) {
          ctx.fillStyle = "#f97316";
          ctx.fillRect(playerX - 6, 294, 12, 10);
        }
        spawnTimer++;
        if (spawnTimer > (nitro ? 30 : 45)) {
          spawnTimer = 0;
          const laneIdx = Math.floor(Math.random() * 3);
          const colors = ["#2563eb", "#059669", "#7c3aed", "#d97706"];
          traffic.push({
            x: lanes[laneIdx],
            y: -50,
            speed: Math.random() * 1.5 + 2,
            color: colors[Math.floor(Math.random() * colors.length)]
          });
          if (Math.random() > 0.5) {
            coins.push({ x: lanes[(laneIdx + 1) % 3], y: -30 });
          }
        }
        for (let i = traffic.length - 1;i >= 0; i--) {
          const t = traffic[i];
          t.y += curSpeed - t.speed;
          ctx.fillStyle = t.color;
          ctx.fillRect(t.x - 12, t.y, 24, 42);
          ctx.fillStyle = "#94a3b8";
          ctx.fillRect(t.x - 9, t.y + 12, 18, 8);
          if (Math.abs(playerX - t.x) < 20 && Math.abs(270 - (t.y + 21)) < 36) {
            gameOver = true;
          }
          if (t.y > 340)
            traffic.splice(i, 1);
        }
        for (let i = coins.length - 1;i >= 0; i--) {
          const c = coins[i];
          c.y += curSpeed;
          ctx.fillStyle = "#ffd700";
          ctx.beginPath();
          ctx.arc(c.x, c.y, 7, 0, Math.PI * 2);
          ctx.fill();
          if (Math.abs(playerX - c.x) < 18 && Math.abs(270 - c.y) < 24) {
            distance += 150;
            coins.splice(i, 1);
          } else if (c.y > 340) {
            coins.splice(i, 1);
          }
        }
      } else {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0, 0, 280, 320);
        ctx.fillStyle = "#f43f5e";
        ctx.font = "bold 22px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("CRASHED!", 140, 140);
        ctx.fillStyle = "#f8fafc";
        ctx.font = "14px sans-serif";
        ctx.fillText(`Distance: ${distance}m`, 140, 170);
        ctx.fillStyle = "#f97316";
        ctx.font = "12px sans-serif";
        ctx.fillText("Tap button to Restart", 140, 205);
        ctx.textAlign = "start";
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    this.stopCurrentGame = () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }
  initRetroSnake(container) {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <button id="vn-game-back-btn" style="background: transparent; border: none; color: #38bdf8; font-size: 12px; cursor: pointer;">◀ Games</button>
        <span style="font-size: 12px; font-weight: 800; color: #10b981;">\uD83D\uDC0D Retro Snake</span>
        <span id="vn-snake-score" style="font-size: 12px; font-weight: 700; color: #ffd700;">Score: 0</span>
      </div>
      <canvas id="vn-snake-canvas" width="280" height="280" style="background: #064e3b; border: 2px solid #059669; border-radius: 8px; display: block; margin: 0 auto;"></canvas>
      <div style="display: grid; grid-template-columns: repeat(3, 44px); gap: 6px; justify-content: center; margin-top: 10px;">
        <div></div>
        <button id="vn-snake-up" style="background: #1f2937; border: 1px solid #4b5563; border-radius: 8px; color: #fff; height: 36px; font-size: 14px; cursor: pointer;">▲</button>
        <div></div>
        <button id="vn-snake-left" style="background: #1f2937; border: 1px solid #4b5563; border-radius: 8px; color: #fff; height: 36px; font-size: 14px; cursor: pointer;">◀</button>
        <button id="vn-snake-down" style="background: #1f2937; border: 1px solid #4b5563; border-radius: 8px; color: #fff; height: 36px; font-size: 14px; cursor: pointer;">▼</button>
        <button id="vn-snake-right" style="background: #1f2937; border: 1px solid #4b5563; border-radius: 8px; color: #fff; height: 36px; font-size: 14px; cursor: pointer;">▶</button>
      </div>
      <p style="font-size: 10px; color: #94a3b8; text-align: center; margin-top: 6px;">\uD83C\uDFAE Controls: ▲ ▼ ◀ ▶ / WASD / IJKL / HJKL / Numpad • Restart: R</p>
    `;
    container.querySelector("#vn-game-back-btn")?.addEventListener("click", () => {
      this.selectedGame = "menu";
      this.renderArcadeApp(container);
    });
    const canvas = container.querySelector("#vn-snake-canvas");
    if (!canvas)
      return;
    canvas.tabIndex = 0;
    canvas.focus();
    canvas.style.outline = "none";
    const ctx = canvas.getContext("2d");
    if (!ctx)
      return;
    const gridSize = 14;
    const tileCount = 20;
    let snake = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
    let dx = 0;
    let dy = -1;
    let curDx = 0;
    let curDy = -1;
    let apple = { x: 5, y: 5 };
    let score = 0;
    let gameOver = false;
    let timerId;
    const spawnApple = () => {
      apple = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
      };
    };
    const restart = () => {
      snake = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
      dx = 0;
      dy = -1;
      curDx = 0;
      curDy = -1;
      score = 0;
      gameOver = false;
      spawnApple();
      const scoreEl = container.querySelector("#vn-snake-score");
      if (scoreEl)
        scoreEl.textContent = `Score: ${score}`;
    };
    const setDir = (newDx, newDy) => {
      if (gameOver) {
        restart();
        return;
      }
      if (newDx !== 0 && curDx === 0 || newDy !== 0 && curDy === 0) {
        dx = newDx;
        dy = newDy;
      }
    };
    const onKeyDown = (e) => {
      if (!this.isGameInputActive())
        return;
      const input = parsePhoneGameKey(e);
      if (input.up || input.down || input.left || input.right || input.restart) {
        e.preventDefault();
      }
      if (gameOver && (input.restart || input.up || input.down || input.left || input.right)) {
        restart();
        return;
      }
      if (input.up)
        setDir(0, -1);
      else if (input.down)
        setDir(0, 1);
      else if (input.left)
        setDir(-1, 0);
      else if (input.right)
        setDir(1, 0);
    };
    window.addEventListener("keydown", onKeyDown);
    container.querySelector("#vn-snake-up")?.addEventListener("click", (e) => {
      e.target?.blur();
      setDir(0, -1);
    });
    container.querySelector("#vn-snake-down")?.addEventListener("click", (e) => {
      e.target?.blur();
      setDir(0, 1);
    });
    container.querySelector("#vn-snake-left")?.addEventListener("click", (e) => {
      e.target?.blur();
      setDir(-1, 0);
    });
    container.querySelector("#vn-snake-right")?.addEventListener("click", (e) => {
      e.target?.blur();
      setDir(1, 0);
    });
    const tick = () => {
      if (!gameOver) {
        curDx = dx;
        curDy = dy;
        const head = { x: snake[0].x + dx, y: snake[0].y + dy };
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
          gameOver = true;
        }
        for (const seg of snake) {
          if (seg.x === head.x && seg.y === head.y) {
            gameOver = true;
          }
        }
        if (!gameOver) {
          snake.unshift(head);
          if (head.x === apple.x && head.y === apple.y) {
            score += 10;
            const scoreEl = container.querySelector("#vn-snake-score");
            if (scoreEl)
              scoreEl.textContent = `Score: ${score}`;
            spawnApple();
          } else {
            snake.pop();
          }
        }
      }
      ctx.fillStyle = "#064e3b";
      ctx.fillRect(0, 0, 280, 280);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(apple.x * gridSize + 1, apple.y * gridSize + 1, gridSize - 2, gridSize - 2);
      ctx.fillStyle = "#34d399";
      for (let i = 0;i < snake.length; i++) {
        const s = snake[i];
        ctx.fillStyle = i === 0 ? "#6ee7b7" : "#10b981";
        ctx.fillRect(s.x * gridSize + 1, s.y * gridSize + 1, gridSize - 2, gridSize - 2);
      }
      if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.fillRect(0, 0, 280, 280);
        ctx.fillStyle = "#f87171";
        ctx.font = "bold 18px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", 140, 120);
        ctx.fillStyle = "#f8fafc";
        ctx.font = "13px sans-serif";
        ctx.fillText(`Final Score: ${score}`, 140, 150);
        ctx.fillStyle = "#34d399";
        ctx.font = "11px sans-serif";
        ctx.fillText("Press any direction to restart", 140, 180);
        ctx.textAlign = "start";
      }
    };
    timerId = window.setInterval(tick, 120);
    this.stopCurrentGame = () => {
      clearInterval(timerId);
      window.removeEventListener("keydown", onKeyDown);
    };
  }
  close() {
    this.stopCurrentGame?.();
    this.stopCurrentGame = null;
  }
}

// src/frontend/hud/tab-journal.ts
class JournalTab {
  root;
  constructor() {
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-journal";
  }
  render(ledger) {
    this.root.innerHTML = "";
    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `<h3>\uD83D\uDCDC Journal & Opportunity Leads</h3>`;
    this.root.appendChild(header);
    const oppsSection = document.createElement("div");
    oppsSection.className = "vn-section";
    oppsSection.innerHTML = `<h4>Open Opportunities (${ledger.opportunities?.length || 0})</h4>`;
    const oppsList = document.createElement("div");
    oppsList.className = "vn-opps-list";
    if (!ledger.opportunities || ledger.opportunities.length === 0) {
      oppsList.innerHTML = `<div class="vn-muted">No open opportunities tracked.</div>`;
    } else {
      for (const opp of ledger.opportunities) {
        const card = document.createElement("div");
        card.className = "vn-opp-card";
        const wanted = opp.wanted_by?.length ? opp.wanted_by.join(", ") : "Unknown";
        const payoff = opp.payoff ? ` • \uD83C\uDFC6 ${opp.payoff}` : "";
        const statusBadge = `<span class="vn-status-badge vn-status-${opp.status || "lead"}">${opp.status || "lead"}</span>`;
        card.innerHTML = `
          <div class="vn-opp-header">
            <strong>${opp.id}</strong>
            ${statusBadge}
          </div>
          <div class="vn-opp-body">${opp.what || "No description"}</div>
          <div class="vn-opp-footer">
            <span>Wanted by: ${wanted}${payoff}</span>
            ${opp.due ? `<span>Due: ${opp.due}</span>` : ""}
          </div>
        `;
        oppsList.appendChild(card);
      }
    }
    oppsSection.appendChild(oppsList);
    this.root.appendChild(oppsSection);
    const journalSection = document.createElement("div");
    journalSection.className = "vn-section";
    journalSection.innerHTML = `<h4>Chronicle of Events (${ledger.journal?.length || 0})</h4>`;
    const eventsList = document.createElement("div");
    eventsList.className = "vn-journal-events";
    if (!ledger.journal || ledger.journal.length === 0) {
      eventsList.innerHTML = `<div class="vn-muted">No events logged yet.</div>`;
    } else {
      const reversed = [...ledger.journal].reverse();
      for (const evt of reversed) {
        const row = document.createElement("div");
        row.className = "vn-journal-entry";
        const timeStr = evt.time ? `<span class="vn-evt-time">[${evt.time}]</span> ` : "";
        const placeStr = evt.place ? `@ ${evt.place} ` : "";
        const outcomeBadge = evt.outcome ? `<span class="vn-outcome-${evt.outcome}">${evt.outcome}</span>` : "";
        let mutationsHtml = "";
        if (evt.mutations && evt.mutations.length > 0) {
          mutationsHtml = `<ul class="vn-mutations-list">${evt.mutations.map((m) => `<li>${m}</li>`).join("")}</ul>`;
        }
        row.innerHTML = `
          <div class="vn-evt-header">
            <strong>${evt.id}</strong> ${timeStr}${placeStr}${outcomeBadge}
          </div>
          <div class="vn-evt-action">${evt.action || ""}</div>
          ${mutationsHtml}
        `;
        eventsList.appendChild(row);
      }
    }
    journalSection.appendChild(eventsList);
    this.root.appendChild(journalSection);
  }
}

// node_modules/js-yaml/dist/js-yaml.mjs
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var jsYaml = {};
var loader = {};
var common = {};
var hasRequiredCommon;
function requireCommon() {
  if (hasRequiredCommon)
    return common;
  hasRequiredCommon = 1;
  function isNothing(subject) {
    return typeof subject === "undefined" || subject === null;
  }
  function isObject(subject) {
    return typeof subject === "object" && subject !== null;
  }
  function toArray(sequence) {
    if (Array.isArray(sequence))
      return sequence;
    else if (isNothing(sequence))
      return [];
    return [sequence];
  }
  function extend(target, source) {
    if (source) {
      const sourceKeys = Object.keys(source);
      for (let index = 0, length = sourceKeys.length;index < length; index += 1) {
        const key = sourceKeys[index];
        target[key] = source[key];
      }
    }
    return target;
  }
  function repeat(string, count) {
    let result = "";
    for (let cycle = 0;cycle < count; cycle += 1) {
      result += string;
    }
    return result;
  }
  function isNegativeZero(number) {
    return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
  }
  common.isNothing = isNothing;
  common.isObject = isObject;
  common.toArray = toArray;
  common.repeat = repeat;
  common.isNegativeZero = isNegativeZero;
  common.extend = extend;
  return common;
}
var exception;
var hasRequiredException;
function requireException() {
  if (hasRequiredException)
    return exception;
  hasRequiredException = 1;
  function formatError(exception2, compact) {
    let where = "";
    const message = exception2.reason || "(unknown reason)";
    if (!exception2.mark)
      return message;
    if (exception2.mark.name) {
      where += 'in "' + exception2.mark.name + '" ';
    }
    where += "(" + (exception2.mark.line + 1) + ":" + (exception2.mark.column + 1) + ")";
    if (!compact && exception2.mark.snippet) {
      where += `

` + exception2.mark.snippet;
    }
    return message + " " + where;
  }
  function YAMLException2(reason, mark) {
    Error.call(this);
    this.name = "YAMLException";
    this.reason = reason;
    this.mark = mark;
    this.message = formatError(this, false);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error().stack || "";
    }
  }
  YAMLException2.prototype = Object.create(Error.prototype);
  YAMLException2.prototype.constructor = YAMLException2;
  YAMLException2.prototype.toString = function toString(compact) {
    return this.name + ": " + formatError(this, compact);
  };
  exception = YAMLException2;
  return exception;
}
var snippet;
var hasRequiredSnippet;
function requireSnippet() {
  if (hasRequiredSnippet)
    return snippet;
  hasRequiredSnippet = 1;
  const common2 = requireCommon();
  function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
    let head = "";
    let tail = "";
    const maxHalfLength = Math.floor(maxLineLength / 2) - 1;
    if (position - lineStart > maxHalfLength) {
      head = " ... ";
      lineStart = position - maxHalfLength + head.length;
    }
    if (lineEnd - position > maxHalfLength) {
      tail = " ...";
      lineEnd = position + maxHalfLength - tail.length;
    }
    return {
      str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, "→") + tail,
      pos: position - lineStart + head.length
    };
  }
  function padStart(string, max) {
    return common2.repeat(" ", max - string.length) + string;
  }
  function makeSnippet(mark, options) {
    options = Object.create(options || null);
    if (!mark.buffer)
      return null;
    if (!options.maxLength)
      options.maxLength = 79;
    if (typeof options.indent !== "number")
      options.indent = 1;
    if (typeof options.linesBefore !== "number")
      options.linesBefore = 3;
    if (typeof options.linesAfter !== "number")
      options.linesAfter = 2;
    const re = /\r?\n|\r|\0/g;
    const lineStarts = [0];
    const lineEnds = [];
    let match;
    let foundLineNo = -1;
    while (match = re.exec(mark.buffer)) {
      lineEnds.push(match.index);
      lineStarts.push(match.index + match[0].length);
      if (mark.position <= match.index && foundLineNo < 0) {
        foundLineNo = lineStarts.length - 2;
      }
    }
    if (foundLineNo < 0)
      foundLineNo = lineStarts.length - 1;
    let result = "";
    const lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
    const maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);
    for (let i = 1;i <= options.linesBefore; i++) {
      if (foundLineNo - i < 0)
        break;
      const line2 = getLine(mark.buffer, lineStarts[foundLineNo - i], lineEnds[foundLineNo - i], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]), maxLineLength);
      result = common2.repeat(" ", options.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) + " | " + line2.str + `
` + result;
    }
    const line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
    result += common2.repeat(" ", options.indent) + padStart((mark.line + 1).toString(), lineNoLength) + " | " + line.str + `
`;
    result += common2.repeat("-", options.indent + lineNoLength + 3 + line.pos) + `^
`;
    for (let i = 1;i <= options.linesAfter; i++) {
      if (foundLineNo + i >= lineEnds.length)
        break;
      const line2 = getLine(mark.buffer, lineStarts[foundLineNo + i], lineEnds[foundLineNo + i], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]), maxLineLength);
      result += common2.repeat(" ", options.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) + " | " + line2.str + `
`;
    }
    return result.replace(/\n$/, "");
  }
  snippet = makeSnippet;
  return snippet;
}
var type;
var hasRequiredType;
function requireType() {
  if (hasRequiredType)
    return type;
  hasRequiredType = 1;
  const YAMLException2 = requireException();
  const TYPE_CONSTRUCTOR_OPTIONS = [
    "kind",
    "multi",
    "resolve",
    "construct",
    "instanceOf",
    "predicate",
    "represent",
    "representName",
    "defaultStyle",
    "styleAliases"
  ];
  const YAML_NODE_KINDS = [
    "scalar",
    "sequence",
    "mapping"
  ];
  function compileStyleAliases(map2) {
    const result = {};
    if (map2 !== null) {
      Object.keys(map2).forEach(function(style) {
        map2[style].forEach(function(alias) {
          result[String(alias)] = style;
        });
      });
    }
    return result;
  }
  function Type2(tag, options) {
    options = options || {};
    Object.keys(options).forEach(function(name) {
      if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
        throw new YAMLException2('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
      }
    });
    this.options = options;
    this.tag = tag;
    this.kind = options["kind"] || null;
    this.resolve = options["resolve"] || function() {
      return true;
    };
    this.construct = options["construct"] || function(data) {
      return data;
    };
    this.instanceOf = options["instanceOf"] || null;
    this.predicate = options["predicate"] || null;
    this.represent = options["represent"] || null;
    this.representName = options["representName"] || null;
    this.defaultStyle = options["defaultStyle"] || null;
    this.multi = options["multi"] || false;
    this.styleAliases = compileStyleAliases(options["styleAliases"] || null);
    if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
      throw new YAMLException2('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
    }
  }
  type = Type2;
  return type;
}
var schema;
var hasRequiredSchema;
function requireSchema() {
  if (hasRequiredSchema)
    return schema;
  hasRequiredSchema = 1;
  const YAMLException2 = requireException();
  const Type2 = requireType();
  function compileList(schema2, name) {
    const result = [];
    schema2[name].forEach(function(currentType) {
      let newIndex = result.length;
      result.forEach(function(previousType, previousIndex) {
        if (previousType.tag === currentType.tag && previousType.kind === currentType.kind && previousType.multi === currentType.multi) {
          newIndex = previousIndex;
        }
      });
      result[newIndex] = currentType;
    });
    return result;
  }
  function compileMap() {
    const result = {
      scalar: {},
      sequence: {},
      mapping: {},
      fallback: {},
      multi: {
        scalar: [],
        sequence: [],
        mapping: [],
        fallback: []
      }
    };
    function collectType(type2) {
      if (type2.multi) {
        result.multi[type2.kind].push(type2);
        result.multi["fallback"].push(type2);
      } else {
        result[type2.kind][type2.tag] = result["fallback"][type2.tag] = type2;
      }
    }
    for (let index = 0, length = arguments.length;index < length; index += 1) {
      arguments[index].forEach(collectType);
    }
    return result;
  }
  function Schema2(definition) {
    return this.extend(definition);
  }
  Schema2.prototype.extend = function extend(definition) {
    let implicit = [];
    let explicit = [];
    if (definition instanceof Type2) {
      explicit.push(definition);
    } else if (Array.isArray(definition)) {
      explicit = explicit.concat(definition);
    } else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
      if (definition.implicit)
        implicit = implicit.concat(definition.implicit);
      if (definition.explicit)
        explicit = explicit.concat(definition.explicit);
    } else {
      throw new YAMLException2("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
    }
    implicit.forEach(function(type2) {
      if (!(type2 instanceof Type2)) {
        throw new YAMLException2("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      }
      if (type2.loadKind && type2.loadKind !== "scalar") {
        throw new YAMLException2("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
      }
      if (type2.multi) {
        throw new YAMLException2("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
      }
    });
    explicit.forEach(function(type2) {
      if (!(type2 instanceof Type2)) {
        throw new YAMLException2("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      }
    });
    const result = Object.create(Schema2.prototype);
    result.implicit = (this.implicit || []).concat(implicit);
    result.explicit = (this.explicit || []).concat(explicit);
    result.compiledImplicit = compileList(result, "implicit");
    result.compiledExplicit = compileList(result, "explicit");
    result.compiledTypeMap = compileMap(result.compiledImplicit, result.compiledExplicit);
    return result;
  };
  schema = Schema2;
  return schema;
}
var str;
var hasRequiredStr;
function requireStr() {
  if (hasRequiredStr)
    return str;
  hasRequiredStr = 1;
  const Type2 = requireType();
  str = new Type2("tag:yaml.org,2002:str", {
    kind: "scalar",
    construct: function(data) {
      return data !== null ? data : "";
    }
  });
  return str;
}
var seq;
var hasRequiredSeq;
function requireSeq() {
  if (hasRequiredSeq)
    return seq;
  hasRequiredSeq = 1;
  const Type2 = requireType();
  seq = new Type2("tag:yaml.org,2002:seq", {
    kind: "sequence",
    construct: function(data) {
      return data !== null ? data : [];
    }
  });
  return seq;
}
var map;
var hasRequiredMap;
function requireMap() {
  if (hasRequiredMap)
    return map;
  hasRequiredMap = 1;
  const Type2 = requireType();
  map = new Type2("tag:yaml.org,2002:map", {
    kind: "mapping",
    construct: function(data) {
      return data !== null ? data : {};
    }
  });
  return map;
}
var failsafe;
var hasRequiredFailsafe;
function requireFailsafe() {
  if (hasRequiredFailsafe)
    return failsafe;
  hasRequiredFailsafe = 1;
  const Schema2 = requireSchema();
  failsafe = new Schema2({
    explicit: [
      requireStr(),
      requireSeq(),
      requireMap()
    ]
  });
  return failsafe;
}
var _null;
var hasRequired_null;
function require_null() {
  if (hasRequired_null)
    return _null;
  hasRequired_null = 1;
  const Type2 = requireType();
  function resolveYamlNull(data) {
    if (data === null)
      return true;
    const max = data.length;
    return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
  }
  function constructYamlNull() {
    return null;
  }
  function isNull(object) {
    return object === null;
  }
  _null = new Type2("tag:yaml.org,2002:null", {
    kind: "scalar",
    resolve: resolveYamlNull,
    construct: constructYamlNull,
    predicate: isNull,
    represent: {
      canonical: function() {
        return "~";
      },
      lowercase: function() {
        return "null";
      },
      uppercase: function() {
        return "NULL";
      },
      camelcase: function() {
        return "Null";
      },
      empty: function() {
        return "";
      }
    },
    defaultStyle: "lowercase"
  });
  return _null;
}
var bool;
var hasRequiredBool;
function requireBool() {
  if (hasRequiredBool)
    return bool;
  hasRequiredBool = 1;
  const Type2 = requireType();
  function resolveYamlBoolean(data) {
    if (data === null)
      return false;
    const max = data.length;
    return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
  }
  function constructYamlBoolean(data) {
    return data === "true" || data === "True" || data === "TRUE";
  }
  function isBoolean(object) {
    return Object.prototype.toString.call(object) === "[object Boolean]";
  }
  bool = new Type2("tag:yaml.org,2002:bool", {
    kind: "scalar",
    resolve: resolveYamlBoolean,
    construct: constructYamlBoolean,
    predicate: isBoolean,
    represent: {
      lowercase: function(object) {
        return object ? "true" : "false";
      },
      uppercase: function(object) {
        return object ? "TRUE" : "FALSE";
      },
      camelcase: function(object) {
        return object ? "True" : "False";
      }
    },
    defaultStyle: "lowercase"
  });
  return bool;
}
var int;
var hasRequiredInt;
function requireInt() {
  if (hasRequiredInt)
    return int;
  hasRequiredInt = 1;
  const common2 = requireCommon();
  const Type2 = requireType();
  function isHexCode(c) {
    return c >= 48 && c <= 57 || c >= 65 && c <= 70 || c >= 97 && c <= 102;
  }
  function isOctCode(c) {
    return c >= 48 && c <= 55;
  }
  function isDecCode(c) {
    return c >= 48 && c <= 57;
  }
  function resolveYamlInteger(data) {
    if (data === null)
      return false;
    const max = data.length;
    let index = 0;
    let hasDigits = false;
    if (!max)
      return false;
    let ch = data[index];
    if (ch === "-" || ch === "+") {
      ch = data[++index];
    }
    if (ch === "0") {
      if (index + 1 === max)
        return true;
      ch = data[++index];
      if (ch === "b") {
        index++;
        for (;index < max; index++) {
          ch = data[index];
          if (ch !== "0" && ch !== "1")
            return false;
          hasDigits = true;
        }
        return hasDigits && isFinite(parseYamlInteger(data));
      }
      if (ch === "x") {
        index++;
        for (;index < max; index++) {
          if (!isHexCode(data.charCodeAt(index)))
            return false;
          hasDigits = true;
        }
        return hasDigits && isFinite(parseYamlInteger(data));
      }
      if (ch === "o") {
        index++;
        for (;index < max; index++) {
          if (!isOctCode(data.charCodeAt(index)))
            return false;
          hasDigits = true;
        }
        return hasDigits && isFinite(parseYamlInteger(data));
      }
    }
    for (;index < max; index++) {
      if (!isDecCode(data.charCodeAt(index))) {
        return false;
      }
      hasDigits = true;
    }
    if (!hasDigits)
      return false;
    return isFinite(parseYamlInteger(data));
  }
  function parseYamlInteger(data) {
    let value = data;
    let sign = 1;
    let ch = value[0];
    if (ch === "-" || ch === "+") {
      if (ch === "-")
        sign = -1;
      value = value.slice(1);
      ch = value[0];
    }
    if (value === "0")
      return 0;
    if (ch === "0") {
      if (value[1] === "b")
        return sign * parseInt(value.slice(2), 2);
      if (value[1] === "x")
        return sign * parseInt(value.slice(2), 16);
      if (value[1] === "o")
        return sign * parseInt(value.slice(2), 8);
    }
    return sign * parseInt(value, 10);
  }
  function constructYamlInteger(data) {
    return parseYamlInteger(data);
  }
  function isInteger(object) {
    return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 === 0 && !common2.isNegativeZero(object));
  }
  int = new Type2("tag:yaml.org,2002:int", {
    kind: "scalar",
    resolve: resolveYamlInteger,
    construct: constructYamlInteger,
    predicate: isInteger,
    represent: {
      binary: function(obj) {
        return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
      },
      octal: function(obj) {
        return obj >= 0 ? "0o" + obj.toString(8) : "-0o" + obj.toString(8).slice(1);
      },
      decimal: function(obj) {
        return obj.toString(10);
      },
      hexadecimal: function(obj) {
        return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
      }
    },
    defaultStyle: "decimal",
    styleAliases: {
      binary: [2, "bin"],
      octal: [8, "oct"],
      decimal: [10, "dec"],
      hexadecimal: [16, "hex"]
    }
  });
  return int;
}
var float;
var hasRequiredFloat;
function requireFloat() {
  if (hasRequiredFloat)
    return float;
  hasRequiredFloat = 1;
  const common2 = requireCommon();
  const Type2 = requireType();
  const YAML_FLOAT_PATTERN = new RegExp("^(?:[-+]?(?:[0-9]+)(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
  const YAML_FLOAT_SPECIAL_PATTERN = new RegExp("^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
  function resolveYamlFloat(data) {
    if (data === null)
      return false;
    if (!YAML_FLOAT_PATTERN.test(data)) {
      return false;
    }
    if (isFinite(parseFloat(data, 10))) {
      return true;
    }
    return YAML_FLOAT_SPECIAL_PATTERN.test(data);
  }
  function constructYamlFloat(data) {
    let value = data.toLowerCase();
    const sign = value[0] === "-" ? -1 : 1;
    if ("+-".indexOf(value[0]) >= 0) {
      value = value.slice(1);
    }
    if (value === ".inf") {
      return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    } else if (value === ".nan") {
      return NaN;
    }
    return sign * parseFloat(value, 10);
  }
  const SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
  function representYamlFloat(object, style) {
    if (isNaN(object)) {
      switch (style) {
        case "lowercase":
          return ".nan";
        case "uppercase":
          return ".NAN";
        case "camelcase":
          return ".NaN";
      }
    } else if (Number.POSITIVE_INFINITY === object) {
      switch (style) {
        case "lowercase":
          return ".inf";
        case "uppercase":
          return ".INF";
        case "camelcase":
          return ".Inf";
      }
    } else if (Number.NEGATIVE_INFINITY === object) {
      switch (style) {
        case "lowercase":
          return "-.inf";
        case "uppercase":
          return "-.INF";
        case "camelcase":
          return "-.Inf";
      }
    } else if (common2.isNegativeZero(object)) {
      return "-0.0";
    }
    const res = object.toString(10);
    return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace("e", ".e") : res;
  }
  function isFloat(object) {
    return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common2.isNegativeZero(object));
  }
  float = new Type2("tag:yaml.org,2002:float", {
    kind: "scalar",
    resolve: resolveYamlFloat,
    construct: constructYamlFloat,
    predicate: isFloat,
    represent: representYamlFloat,
    defaultStyle: "lowercase"
  });
  return float;
}
var json;
var hasRequiredJson;
function requireJson() {
  if (hasRequiredJson)
    return json;
  hasRequiredJson = 1;
  json = requireFailsafe().extend({
    implicit: [
      require_null(),
      requireBool(),
      requireInt(),
      requireFloat()
    ]
  });
  return json;
}
var core;
var hasRequiredCore;
function requireCore() {
  if (hasRequiredCore)
    return core;
  hasRequiredCore = 1;
  core = requireJson();
  return core;
}
var timestamp;
var hasRequiredTimestamp;
function requireTimestamp() {
  if (hasRequiredTimestamp)
    return timestamp;
  hasRequiredTimestamp = 1;
  const Type2 = requireType();
  const YAML_DATE_REGEXP = new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$");
  const YAML_TIMESTAMP_REGEXP = new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$");
  function resolveYamlTimestamp(data) {
    if (data === null)
      return false;
    if (YAML_DATE_REGEXP.exec(data) !== null)
      return true;
    if (YAML_TIMESTAMP_REGEXP.exec(data) !== null)
      return true;
    return false;
  }
  function constructYamlTimestamp(data) {
    let fraction = 0;
    let delta = null;
    let match = YAML_DATE_REGEXP.exec(data);
    if (match === null)
      match = YAML_TIMESTAMP_REGEXP.exec(data);
    if (match === null)
      throw new Error("Date resolve error");
    const year = +match[1];
    const month = +match[2] - 1;
    const day = +match[3];
    if (!match[4]) {
      return new Date(Date.UTC(year, month, day));
    }
    const hour = +match[4];
    const minute = +match[5];
    const second = +match[6];
    if (match[7]) {
      fraction = match[7].slice(0, 3);
      while (fraction.length < 3) {
        fraction += "0";
      }
      fraction = +fraction;
    }
    if (match[9]) {
      const tzHour = +match[10];
      const tzMinute = +(match[11] || 0);
      delta = (tzHour * 60 + tzMinute) * 60000;
      if (match[9] === "-")
        delta = -delta;
    }
    const date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
    if (delta)
      date.setTime(date.getTime() - delta);
    return date;
  }
  function representYamlTimestamp(object) {
    return object.toISOString();
  }
  timestamp = new Type2("tag:yaml.org,2002:timestamp", {
    kind: "scalar",
    resolve: resolveYamlTimestamp,
    construct: constructYamlTimestamp,
    instanceOf: Date,
    represent: representYamlTimestamp
  });
  return timestamp;
}
var merge;
var hasRequiredMerge;
function requireMerge() {
  if (hasRequiredMerge)
    return merge;
  hasRequiredMerge = 1;
  const Type2 = requireType();
  function resolveYamlMerge(data) {
    return data === "<<" || data === null;
  }
  merge = new Type2("tag:yaml.org,2002:merge", {
    kind: "scalar",
    resolve: resolveYamlMerge
  });
  return merge;
}
var binary;
var hasRequiredBinary;
function requireBinary() {
  if (hasRequiredBinary)
    return binary;
  hasRequiredBinary = 1;
  const Type2 = requireType();
  const BASE64_MAP = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;
  function resolveYamlBinary(data) {
    if (data === null)
      return false;
    let bitlen = 0;
    const max = data.length;
    const map2 = BASE64_MAP;
    for (let idx = 0;idx < max; idx++) {
      const code = map2.indexOf(data.charAt(idx));
      if (code > 64)
        continue;
      if (code < 0)
        return false;
      bitlen += 6;
    }
    return bitlen % 8 === 0;
  }
  function constructYamlBinary(data) {
    const input = data.replace(/[\r\n=]/g, "");
    const max = input.length;
    const map2 = BASE64_MAP;
    let bits = 0;
    const result = [];
    for (let idx = 0;idx < max; idx++) {
      if (idx % 4 === 0 && idx) {
        result.push(bits >> 16 & 255);
        result.push(bits >> 8 & 255);
        result.push(bits & 255);
      }
      bits = bits << 6 | map2.indexOf(input.charAt(idx));
    }
    const tailbits = max % 4 * 6;
    if (tailbits === 0) {
      result.push(bits >> 16 & 255);
      result.push(bits >> 8 & 255);
      result.push(bits & 255);
    } else if (tailbits === 18) {
      result.push(bits >> 10 & 255);
      result.push(bits >> 2 & 255);
    } else if (tailbits === 12) {
      result.push(bits >> 4 & 255);
    }
    return new Uint8Array(result);
  }
  function representYamlBinary(object) {
    let result = "";
    let bits = 0;
    const max = object.length;
    const map2 = BASE64_MAP;
    for (let idx = 0;idx < max; idx++) {
      if (idx % 3 === 0 && idx) {
        result += map2[bits >> 18 & 63];
        result += map2[bits >> 12 & 63];
        result += map2[bits >> 6 & 63];
        result += map2[bits & 63];
      }
      bits = (bits << 8) + object[idx];
    }
    const tail = max % 3;
    if (tail === 0) {
      result += map2[bits >> 18 & 63];
      result += map2[bits >> 12 & 63];
      result += map2[bits >> 6 & 63];
      result += map2[bits & 63];
    } else if (tail === 2) {
      result += map2[bits >> 10 & 63];
      result += map2[bits >> 4 & 63];
      result += map2[bits << 2 & 63];
      result += map2[64];
    } else if (tail === 1) {
      result += map2[bits >> 2 & 63];
      result += map2[bits << 4 & 63];
      result += map2[64];
      result += map2[64];
    }
    return result;
  }
  function isBinary(obj) {
    return Object.prototype.toString.call(obj) === "[object Uint8Array]";
  }
  binary = new Type2("tag:yaml.org,2002:binary", {
    kind: "scalar",
    resolve: resolveYamlBinary,
    construct: constructYamlBinary,
    predicate: isBinary,
    represent: representYamlBinary
  });
  return binary;
}
var omap;
var hasRequiredOmap;
function requireOmap() {
  if (hasRequiredOmap)
    return omap;
  hasRequiredOmap = 1;
  const Type2 = requireType();
  const _hasOwnProperty = Object.prototype.hasOwnProperty;
  const _toString = Object.prototype.toString;
  function resolveYamlOmap(data) {
    if (data === null)
      return true;
    const objectKeys = {};
    const object = data;
    for (let index = 0, length = object.length;index < length; index += 1) {
      const pair = object[index];
      let pairHasKey = false;
      if (_toString.call(pair) !== "[object Object]")
        return false;
      let pairKey;
      for (pairKey in pair) {
        if (_hasOwnProperty.call(pair, pairKey)) {
          if (!pairHasKey)
            pairHasKey = true;
          else
            return false;
        }
      }
      if (!pairHasKey)
        return false;
      if (_hasOwnProperty.call(objectKeys, pairKey))
        return false;
      Object.defineProperty(objectKeys, pairKey, { value: true });
    }
    return true;
  }
  function constructYamlOmap(data) {
    return data !== null ? data : [];
  }
  omap = new Type2("tag:yaml.org,2002:omap", {
    kind: "sequence",
    resolve: resolveYamlOmap,
    construct: constructYamlOmap
  });
  return omap;
}
var pairs;
var hasRequiredPairs;
function requirePairs() {
  if (hasRequiredPairs)
    return pairs;
  hasRequiredPairs = 1;
  const Type2 = requireType();
  const _toString = Object.prototype.toString;
  function resolveYamlPairs(data) {
    if (data === null)
      return true;
    const object = data;
    const result = new Array(object.length);
    for (let index = 0, length = object.length;index < length; index += 1) {
      const pair = object[index];
      if (_toString.call(pair) !== "[object Object]")
        return false;
      const keys = Object.keys(pair);
      if (keys.length !== 1)
        return false;
      result[index] = [keys[0], pair[keys[0]]];
    }
    return true;
  }
  function constructYamlPairs(data) {
    if (data === null)
      return [];
    const object = data;
    const result = new Array(object.length);
    for (let index = 0, length = object.length;index < length; index += 1) {
      const pair = object[index];
      const keys = Object.keys(pair);
      result[index] = [keys[0], pair[keys[0]]];
    }
    return result;
  }
  pairs = new Type2("tag:yaml.org,2002:pairs", {
    kind: "sequence",
    resolve: resolveYamlPairs,
    construct: constructYamlPairs
  });
  return pairs;
}
var set;
var hasRequiredSet;
function requireSet() {
  if (hasRequiredSet)
    return set;
  hasRequiredSet = 1;
  const Type2 = requireType();
  const _hasOwnProperty = Object.prototype.hasOwnProperty;
  function resolveYamlSet(data) {
    if (data === null)
      return true;
    const object = data;
    for (const key in object) {
      if (_hasOwnProperty.call(object, key)) {
        if (object[key] !== null)
          return false;
      }
    }
    return true;
  }
  function constructYamlSet(data) {
    return data !== null ? data : {};
  }
  set = new Type2("tag:yaml.org,2002:set", {
    kind: "mapping",
    resolve: resolveYamlSet,
    construct: constructYamlSet
  });
  return set;
}
var _default;
var hasRequired_default;
function require_default() {
  if (hasRequired_default)
    return _default;
  hasRequired_default = 1;
  _default = requireCore().extend({
    implicit: [
      requireTimestamp(),
      requireMerge()
    ],
    explicit: [
      requireBinary(),
      requireOmap(),
      requirePairs(),
      requireSet()
    ]
  });
  return _default;
}
var hasRequiredLoader;
function requireLoader() {
  if (hasRequiredLoader)
    return loader;
  hasRequiredLoader = 1;
  const common2 = requireCommon();
  const YAMLException2 = requireException();
  const makeSnippet = requireSnippet();
  const DEFAULT_SCHEMA2 = require_default();
  const _hasOwnProperty = Object.prototype.hasOwnProperty;
  const CONTEXT_FLOW_IN = 1;
  const CONTEXT_FLOW_OUT = 2;
  const CONTEXT_BLOCK_IN = 3;
  const CONTEXT_BLOCK_OUT = 4;
  const CHOMPING_CLIP = 1;
  const CHOMPING_STRIP = 2;
  const CHOMPING_KEEP = 3;
  const PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
  const PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
  const PATTERN_FLOW_INDICATORS = /[,\[\]{}]/;
  const PATTERN_TAG_HANDLE = /^(?:!|!!|![0-9A-Za-z-]+!)$/;
  const PATTERN_TAG_URI = /^(?:!|[^,\[\]{}])(?:%[0-9a-f]{2}|[0-9a-z\-#;/?:@&=+$,_.!~*'()\[\]])*$/i;
  function _class(obj) {
    return Object.prototype.toString.call(obj);
  }
  function isEol(c) {
    return c === 10 || c === 13;
  }
  function isWhiteSpace(c) {
    return c === 9 || c === 32;
  }
  function isWsOrEol(c) {
    return c === 9 || c === 32 || c === 10 || c === 13;
  }
  function isFlowIndicator(c) {
    return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
  }
  function fromHexCode(c) {
    if (c >= 48 && c <= 57) {
      return c - 48;
    }
    const lc = c | 32;
    if (lc >= 97 && lc <= 102) {
      return lc - 97 + 10;
    }
    return -1;
  }
  function escapedHexLen(c) {
    if (c === 120) {
      return 2;
    }
    if (c === 117) {
      return 4;
    }
    if (c === 85) {
      return 8;
    }
    return 0;
  }
  function fromDecimalCode(c) {
    if (c >= 48 && c <= 57) {
      return c - 48;
    }
    return -1;
  }
  function simpleEscapeSequence(c) {
    switch (c) {
      case 48:
        return "\x00";
      case 97:
        return "\x07";
      case 98:
        return "\b";
      case 116:
        return "\t";
      case 9:
        return "\t";
      case 110:
        return `
`;
      case 118:
        return "\v";
      case 102:
        return "\f";
      case 114:
        return "\r";
      case 101:
        return "\x1B";
      case 32:
        return " ";
      case 34:
        return '"';
      case 47:
        return "/";
      case 92:
        return "\\";
      case 78:
        return "";
      case 95:
        return " ";
      case 76:
        return "\u2028";
      case 80:
        return "\u2029";
      default:
        return "";
    }
  }
  function charFromCodepoint(c) {
    if (c <= 65535) {
      return String.fromCharCode(c);
    }
    return String.fromCharCode((c - 65536 >> 10) + 55296, (c - 65536 & 1023) + 56320);
  }
  function setProperty(object, key, value) {
    if (key === "__proto__") {
      Object.defineProperty(object, key, {
        configurable: true,
        enumerable: true,
        writable: true,
        value
      });
    } else {
      object[key] = value;
    }
  }
  const simpleEscapeCheck = new Array(256);
  const simpleEscapeMap = new Array(256);
  for (let i = 0;i < 256; i++) {
    simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
    simpleEscapeMap[i] = simpleEscapeSequence(i);
  }
  function State(input, options) {
    this.input = input;
    this.filename = options["filename"] || null;
    this.schema = options["schema"] || DEFAULT_SCHEMA2;
    this.onWarning = options["onWarning"] || null;
    this.legacy = options["legacy"] || false;
    this.json = options["json"] || false;
    this.listener = options["listener"] || null;
    this.maxDepth = typeof options["maxDepth"] === "number" ? options["maxDepth"] : 100;
    this.maxTotalMergeKeys = typeof options["maxTotalMergeKeys"] === "number" ? options["maxTotalMergeKeys"] : 1e4;
    this.implicitTypes = this.schema.compiledImplicit;
    this.typeMap = this.schema.compiledTypeMap;
    this.length = input.length;
    this.position = 0;
    this.line = 0;
    this.lineStart = 0;
    this.lineIndent = 0;
    this.depth = 0;
    this.totalMergeKeys = 0;
    this.firstTabInLine = -1;
    this.documents = [];
    this.anchorMapTransactions = [];
  }
  function generateError(state, message) {
    const mark = {
      name: state.filename,
      buffer: state.input.slice(0, -1),
      position: state.position,
      line: state.line,
      column: state.position - state.lineStart
    };
    mark.snippet = makeSnippet(mark);
    return new YAMLException2(message, mark);
  }
  function throwError(state, message) {
    throw generateError(state, message);
  }
  function throwWarning(state, message) {
    if (state.onWarning) {
      state.onWarning.call(null, generateError(state, message));
    }
  }
  function storeAnchor(state, name, value) {
    const transactions = state.anchorMapTransactions;
    if (transactions.length !== 0) {
      const transaction = transactions[transactions.length - 1];
      if (!_hasOwnProperty.call(transaction, name)) {
        transaction[name] = {
          existed: _hasOwnProperty.call(state.anchorMap, name),
          value: state.anchorMap[name]
        };
      }
    }
    state.anchorMap[name] = value;
  }
  function beginAnchorTransaction(state) {
    state.anchorMapTransactions.push(/* @__PURE__ */ Object.create(null));
  }
  function commitAnchorTransaction(state) {
    const transaction = state.anchorMapTransactions.pop();
    const transactions = state.anchorMapTransactions;
    if (transactions.length === 0)
      return;
    const parent = transactions[transactions.length - 1];
    const names = Object.keys(transaction);
    for (let index = 0, length = names.length;index < length; index += 1) {
      const name = names[index];
      if (!_hasOwnProperty.call(parent, name)) {
        parent[name] = transaction[name];
      }
    }
  }
  function rollbackAnchorTransaction(state) {
    const transaction = state.anchorMapTransactions.pop();
    const names = Object.keys(transaction);
    for (let index = names.length - 1;index >= 0; index -= 1) {
      const entry = transaction[names[index]];
      if (entry.existed) {
        state.anchorMap[names[index]] = entry.value;
      } else {
        delete state.anchorMap[names[index]];
      }
    }
  }
  function snapshotState(state) {
    return {
      position: state.position,
      line: state.line,
      lineStart: state.lineStart,
      lineIndent: state.lineIndent,
      firstTabInLine: state.firstTabInLine,
      tag: state.tag,
      anchor: state.anchor,
      kind: state.kind,
      result: state.result
    };
  }
  function restoreState(state, snapshot) {
    state.position = snapshot.position;
    state.line = snapshot.line;
    state.lineStart = snapshot.lineStart;
    state.lineIndent = snapshot.lineIndent;
    state.firstTabInLine = snapshot.firstTabInLine;
    state.tag = snapshot.tag;
    state.anchor = snapshot.anchor;
    state.kind = snapshot.kind;
    state.result = snapshot.result;
  }
  const directiveHandlers = {
    YAML: function handleYamlDirective(state, name, args) {
      if (state.version !== null) {
        throwError(state, "duplication of %YAML directive");
      }
      if (args.length !== 1) {
        throwError(state, "YAML directive accepts exactly one argument");
      }
      const match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
      if (match === null) {
        throwError(state, "ill-formed argument of the YAML directive");
      }
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      if (major !== 1) {
        throwError(state, "unacceptable YAML version of the document");
      }
      state.version = args[0];
      state.checkLineBreaks = minor < 2;
      if (minor !== 1 && minor !== 2) {
        throwWarning(state, "unsupported YAML version of the document");
      }
    },
    TAG: function handleTagDirective(state, name, args) {
      let prefix;
      if (args.length !== 2) {
        throwError(state, "TAG directive accepts exactly two arguments");
      }
      const handle = args[0];
      prefix = args[1];
      if (!PATTERN_TAG_HANDLE.test(handle)) {
        throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
      }
      if (_hasOwnProperty.call(state.tagMap, handle)) {
        throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
      }
      if (!PATTERN_TAG_URI.test(prefix)) {
        throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
      }
      try {
        prefix = decodeURIComponent(prefix);
      } catch (err) {
        throwError(state, "tag prefix is malformed: " + prefix);
      }
      state.tagMap[handle] = prefix;
    }
  };
  function captureSegment(state, start, end, checkJson) {
    if (start < end) {
      const _result = state.input.slice(start, end);
      if (checkJson) {
        for (let _position = 0, _length = _result.length;_position < _length; _position += 1) {
          const _character = _result.charCodeAt(_position);
          if (!(_character === 9 || _character >= 32 && _character <= 1114111)) {
            throwError(state, "expected valid JSON character");
          }
        }
      } else if (PATTERN_NON_PRINTABLE.test(_result)) {
        throwError(state, "the stream contains non-printable characters");
      }
      state.result += _result;
    }
  }
  function chargeMergeWork(state) {
    state.totalMergeKeys++;
    if (state.maxTotalMergeKeys !== -1 && state.totalMergeKeys > state.maxTotalMergeKeys) {
      throwError(state, "merge keys exceeded maxTotalMergeKeys (" + state.maxTotalMergeKeys + ")");
    }
  }
  function mergeMappings(state, destination, source, overridableKeys) {
    if (!common2.isObject(source)) {
      throwError(state, "cannot merge mappings; the provided source object is unacceptable");
    }
    chargeMergeWork(state);
    const sourceKeys = Object.keys(source);
    for (let index = 0, quantity = sourceKeys.length;index < quantity; index += 1) {
      const key = sourceKeys[index];
      chargeMergeWork(state);
      if (!_hasOwnProperty.call(destination, key)) {
        setProperty(destination, key, source[key]);
        overridableKeys[key] = true;
      }
    }
  }
  function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startLineStart, startPos) {
    if (Array.isArray(keyNode)) {
      keyNode = Array.prototype.slice.call(keyNode);
      for (let index = 0, quantity = keyNode.length;index < quantity; index += 1) {
        if (Array.isArray(keyNode[index])) {
          throwError(state, "nested arrays are not supported inside keys");
        }
        if (typeof keyNode === "object" && _class(keyNode[index]) === "[object Object]") {
          keyNode[index] = "[object Object]";
        }
      }
    }
    if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") {
      keyNode = "[object Object]";
    }
    keyNode = String(keyNode);
    if (_result === null) {
      _result = {};
    }
    if (keyTag === "tag:yaml.org,2002:merge") {
      if (Array.isArray(valueNode)) {
        if (valueNode.length > 100) {
          throwError(state, "abnormal merge sequence size");
        }
        for (let index = 0, quantity = valueNode.length;index < quantity; index += 1) {
          mergeMappings(state, _result, valueNode[index], overridableKeys);
        }
      } else {
        mergeMappings(state, _result, valueNode, overridableKeys);
      }
    } else {
      if (!state.json && !_hasOwnProperty.call(overridableKeys, keyNode) && _hasOwnProperty.call(_result, keyNode)) {
        state.line = startLine || state.line;
        state.lineStart = startLineStart || state.lineStart;
        state.position = startPos || state.position;
        throwError(state, "duplicated mapping key");
      }
      setProperty(_result, keyNode, valueNode);
      delete overridableKeys[keyNode];
    }
    return _result;
  }
  function readLineBreak(state) {
    const ch = state.input.charCodeAt(state.position);
    if (ch === 10) {
      state.position++;
    } else if (ch === 13) {
      state.position++;
      if (state.input.charCodeAt(state.position) === 10) {
        state.position++;
      }
    } else {
      throwError(state, "a line break is expected");
    }
    state.line += 1;
    state.lineStart = state.position;
    state.firstTabInLine = -1;
  }
  function skipSeparationSpace(state, allowComments, checkIndent) {
    let lineBreaks = 0;
    let ch = state.input.charCodeAt(state.position);
    while (ch !== 0) {
      while (isWhiteSpace(ch)) {
        if (ch === 9 && state.firstTabInLine === -1) {
          state.firstTabInLine = state.position;
        }
        ch = state.input.charCodeAt(++state.position);
      }
      if (allowComments && ch === 35) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (ch !== 10 && ch !== 13 && ch !== 0);
      }
      if (isEol(ch)) {
        readLineBreak(state);
        ch = state.input.charCodeAt(state.position);
        lineBreaks++;
        state.lineIndent = 0;
        while (ch === 32) {
          state.lineIndent++;
          ch = state.input.charCodeAt(++state.position);
        }
      } else {
        break;
      }
    }
    if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
      throwWarning(state, "deficient indentation");
    }
    return lineBreaks;
  }
  function testDocumentSeparator(state) {
    let _position = state.position;
    let ch = state.input.charCodeAt(_position);
    if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
      _position += 3;
      ch = state.input.charCodeAt(_position);
      if (ch === 0 || isWsOrEol(ch)) {
        return true;
      }
    }
    return false;
  }
  function writeFoldedLines(state, count) {
    if (count === 1) {
      state.result += " ";
    } else if (count > 1) {
      state.result += common2.repeat(`
`, count - 1);
    }
  }
  function readPlainScalar(state, nodeIndent, withinFlowCollection) {
    let captureStart;
    let captureEnd;
    let hasPendingContent;
    let _line;
    let _lineStart;
    let _lineIndent;
    const _kind = state.kind;
    const _result = state.result;
    let ch = state.input.charCodeAt(state.position);
    if (isWsOrEol(ch) || isFlowIndicator(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96) {
      return false;
    }
    if (ch === 63 || ch === 45) {
      const following = state.input.charCodeAt(state.position + 1);
      if (isWsOrEol(following) || withinFlowCollection && isFlowIndicator(following)) {
        return false;
      }
    }
    state.kind = "scalar";
    state.result = "";
    captureStart = captureEnd = state.position;
    hasPendingContent = false;
    while (ch !== 0) {
      if (ch === 58) {
        const following = state.input.charCodeAt(state.position + 1);
        if (isWsOrEol(following) || withinFlowCollection && isFlowIndicator(following)) {
          break;
        }
      } else if (ch === 35) {
        const preceding = state.input.charCodeAt(state.position - 1);
        if (isWsOrEol(preceding)) {
          break;
        }
      } else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && isFlowIndicator(ch)) {
        break;
      } else if (isEol(ch)) {
        _line = state.line;
        _lineStart = state.lineStart;
        _lineIndent = state.lineIndent;
        skipSeparationSpace(state, false, -1);
        if (state.lineIndent >= nodeIndent) {
          hasPendingContent = true;
          ch = state.input.charCodeAt(state.position);
          continue;
        } else {
          state.position = captureEnd;
          state.line = _line;
          state.lineStart = _lineStart;
          state.lineIndent = _lineIndent;
          break;
        }
      }
      if (hasPendingContent) {
        captureSegment(state, captureStart, captureEnd, false);
        writeFoldedLines(state, state.line - _line);
        captureStart = captureEnd = state.position;
        hasPendingContent = false;
      }
      if (!isWhiteSpace(ch)) {
        captureEnd = state.position + 1;
      }
      ch = state.input.charCodeAt(++state.position);
    }
    captureSegment(state, captureStart, captureEnd, false);
    if (state.result) {
      return true;
    }
    state.kind = _kind;
    state.result = _result;
    return false;
  }
  function readSingleQuotedScalar(state, nodeIndent) {
    let captureStart;
    let captureEnd;
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 39) {
      return false;
    }
    state.kind = "scalar";
    state.result = "";
    state.position++;
    captureStart = captureEnd = state.position;
    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      if (ch === 39) {
        captureSegment(state, captureStart, state.position, true);
        ch = state.input.charCodeAt(++state.position);
        if (ch === 39) {
          captureStart = state.position;
          state.position++;
          captureEnd = state.position;
        } else {
          return true;
        }
      } else if (isEol(ch)) {
        captureSegment(state, captureStart, captureEnd, true);
        writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
        captureStart = captureEnd = state.position;
      } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
        throwError(state, "unexpected end of the document within a single quoted scalar");
      } else {
        state.position++;
        if (!isWhiteSpace(ch)) {
          captureEnd = state.position;
        }
      }
    }
    throwError(state, "unexpected end of the stream within a single quoted scalar");
  }
  function readDoubleQuotedScalar(state, nodeIndent) {
    let captureStart;
    let captureEnd;
    let tmp;
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 34) {
      return false;
    }
    state.kind = "scalar";
    state.result = "";
    state.position++;
    captureStart = captureEnd = state.position;
    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      if (ch === 34) {
        captureSegment(state, captureStart, state.position, true);
        state.position++;
        return true;
      } else if (ch === 92) {
        captureSegment(state, captureStart, state.position, true);
        ch = state.input.charCodeAt(++state.position);
        if (isEol(ch)) {
          skipSeparationSpace(state, false, nodeIndent);
        } else if (ch < 256 && simpleEscapeCheck[ch]) {
          state.result += simpleEscapeMap[ch];
          state.position++;
        } else if ((tmp = escapedHexLen(ch)) > 0) {
          let hexLength = tmp;
          let hexResult = 0;
          for (;hexLength > 0; hexLength--) {
            ch = state.input.charCodeAt(++state.position);
            if ((tmp = fromHexCode(ch)) >= 0) {
              hexResult = (hexResult << 4) + tmp;
            } else {
              throwError(state, "expected hexadecimal character");
            }
          }
          state.result += charFromCodepoint(hexResult);
          state.position++;
        } else {
          throwError(state, "unknown escape sequence");
        }
        captureStart = captureEnd = state.position;
      } else if (isEol(ch)) {
        captureSegment(state, captureStart, captureEnd, true);
        writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
        captureStart = captureEnd = state.position;
      } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
        throwError(state, "unexpected end of the document within a double quoted scalar");
      } else {
        state.position++;
        if (!isWhiteSpace(ch)) {
          captureEnd = state.position;
        }
      }
    }
    throwError(state, "unexpected end of the stream within a double quoted scalar");
  }
  function readFlowCollection(state, nodeIndent) {
    let readNext = true;
    let _line;
    let _lineStart;
    let _pos;
    const _tag = state.tag;
    let _result;
    const _anchor = state.anchor;
    let terminator;
    let isPair;
    let isExplicitPair;
    let isMapping;
    const overridableKeys = /* @__PURE__ */ Object.create(null);
    let keyNode;
    let keyTag;
    let valueNode;
    let ch = state.input.charCodeAt(state.position);
    if (ch === 91) {
      terminator = 93;
      isMapping = false;
      _result = [];
    } else if (ch === 123) {
      terminator = 125;
      isMapping = true;
      _result = {};
    } else {
      return false;
    }
    if (state.anchor !== null) {
      storeAnchor(state, state.anchor, _result);
    }
    ch = state.input.charCodeAt(++state.position);
    while (ch !== 0) {
      skipSeparationSpace(state, true, nodeIndent);
      ch = state.input.charCodeAt(state.position);
      if (ch === terminator) {
        state.position++;
        state.tag = _tag;
        state.anchor = _anchor;
        state.kind = isMapping ? "mapping" : "sequence";
        state.result = _result;
        return true;
      } else if (!readNext) {
        throwError(state, "missed comma between flow collection entries");
      } else if (ch === 44) {
        throwError(state, "expected the node content, but found ','");
      }
      keyTag = keyNode = valueNode = null;
      isPair = isExplicitPair = false;
      if (ch === 63) {
        const following = state.input.charCodeAt(state.position + 1);
        if (isWsOrEol(following)) {
          isPair = isExplicitPair = true;
          state.position++;
          skipSeparationSpace(state, true, nodeIndent);
        }
      }
      _line = state.line;
      _lineStart = state.lineStart;
      _pos = state.position;
      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
      keyTag = state.tag;
      keyNode = state.result;
      skipSeparationSpace(state, true, nodeIndent);
      ch = state.input.charCodeAt(state.position);
      if ((isExplicitPair || state.line === _line) && ch === 58) {
        isPair = true;
        ch = state.input.charCodeAt(++state.position);
        skipSeparationSpace(state, true, nodeIndent);
        composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
        valueNode = state.result;
      }
      if (isMapping) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
      } else if (isPair) {
        _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
      } else {
        _result.push(keyNode);
      }
      skipSeparationSpace(state, true, nodeIndent);
      ch = state.input.charCodeAt(state.position);
      if (ch === 44) {
        readNext = true;
        ch = state.input.charCodeAt(++state.position);
      } else {
        readNext = false;
      }
    }
    throwError(state, "unexpected end of the stream within a flow collection");
  }
  function readBlockScalar(state, nodeIndent) {
    let folding;
    let chomping = CHOMPING_CLIP;
    let didReadContent = false;
    let detectedIndent = false;
    let textIndent = nodeIndent;
    let emptyLines = 0;
    let atMoreIndented = false;
    let tmp;
    let ch = state.input.charCodeAt(state.position);
    if (ch === 124) {
      folding = false;
    } else if (ch === 62) {
      folding = true;
    } else {
      return false;
    }
    state.kind = "scalar";
    state.result = "";
    while (ch !== 0) {
      ch = state.input.charCodeAt(++state.position);
      if (ch === 43 || ch === 45) {
        if (CHOMPING_CLIP === chomping) {
          chomping = ch === 43 ? CHOMPING_KEEP : CHOMPING_STRIP;
        } else {
          throwError(state, "repeat of a chomping mode identifier");
        }
      } else if ((tmp = fromDecimalCode(ch)) >= 0) {
        if (tmp === 0) {
          throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
        } else if (!detectedIndent) {
          textIndent = nodeIndent + tmp - 1;
          detectedIndent = true;
        } else {
          throwError(state, "repeat of an indentation width identifier");
        }
      } else {
        break;
      }
    }
    if (isWhiteSpace(ch)) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (isWhiteSpace(ch));
      if (ch === 35) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (!isEol(ch) && ch !== 0);
      }
    }
    while (ch !== 0) {
      readLineBreak(state);
      state.lineIndent = 0;
      ch = state.input.charCodeAt(state.position);
      while ((!detectedIndent || state.lineIndent < textIndent) && ch === 32) {
        state.lineIndent++;
        ch = state.input.charCodeAt(++state.position);
      }
      if (!detectedIndent && state.lineIndent > textIndent) {
        textIndent = state.lineIndent;
      }
      if (isEol(ch)) {
        emptyLines++;
        continue;
      }
      if (!detectedIndent && textIndent === 0) {
        throwError(state, "missing indentation for block scalar");
      }
      if (state.lineIndent < textIndent) {
        if (chomping === CHOMPING_KEEP) {
          state.result += common2.repeat(`
`, didReadContent ? 1 + emptyLines : emptyLines);
        } else if (chomping === CHOMPING_CLIP) {
          if (didReadContent) {
            state.result += `
`;
          }
        }
        break;
      }
      if (folding) {
        if (isWhiteSpace(ch)) {
          atMoreIndented = true;
          state.result += common2.repeat(`
`, didReadContent ? 1 + emptyLines : emptyLines);
        } else if (atMoreIndented) {
          atMoreIndented = false;
          state.result += common2.repeat(`
`, emptyLines + 1);
        } else if (emptyLines === 0) {
          if (didReadContent) {
            state.result += " ";
          }
        } else {
          state.result += common2.repeat(`
`, emptyLines);
        }
      } else {
        state.result += common2.repeat(`
`, didReadContent ? 1 + emptyLines : emptyLines);
      }
      didReadContent = true;
      detectedIndent = true;
      emptyLines = 0;
      const captureStart = state.position;
      while (!isEol(ch) && ch !== 0) {
        ch = state.input.charCodeAt(++state.position);
      }
      captureSegment(state, captureStart, state.position, false);
    }
    return true;
  }
  function readBlockSequence(state, nodeIndent) {
    const _tag = state.tag;
    const _anchor = state.anchor;
    const _result = [];
    let detected = false;
    if (state.firstTabInLine !== -1)
      return false;
    if (state.anchor !== null) {
      storeAnchor(state, state.anchor, _result);
    }
    let ch = state.input.charCodeAt(state.position);
    while (ch !== 0) {
      if (state.firstTabInLine !== -1) {
        state.position = state.firstTabInLine;
        throwError(state, "tab characters must not be used in indentation");
      }
      if (ch !== 45) {
        break;
      }
      const following = state.input.charCodeAt(state.position + 1);
      if (!isWsOrEol(following)) {
        break;
      }
      detected = true;
      state.position++;
      if (skipSeparationSpace(state, true, -1)) {
        if (state.lineIndent <= nodeIndent) {
          _result.push(null);
          ch = state.input.charCodeAt(state.position);
          continue;
        }
      }
      const _line = state.line;
      composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
      _result.push(state.result);
      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
      if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
        throwError(state, "bad indentation of a sequence entry");
      } else if (state.lineIndent < nodeIndent) {
        break;
      }
    }
    if (detected) {
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = "sequence";
      state.result = _result;
      return true;
    }
    return false;
  }
  function readBlockMapping(state, nodeIndent, flowIndent) {
    let allowCompact;
    let _keyLine;
    let _keyLineStart;
    let _keyPos;
    const _tag = state.tag;
    const _anchor = state.anchor;
    const _result = {};
    const overridableKeys = /* @__PURE__ */ Object.create(null);
    let keyTag = null;
    let keyNode = null;
    let valueNode = null;
    let atExplicitKey = false;
    let detected = false;
    if (state.firstTabInLine !== -1)
      return false;
    if (state.anchor !== null) {
      storeAnchor(state, state.anchor, _result);
    }
    let ch = state.input.charCodeAt(state.position);
    while (ch !== 0) {
      if (!atExplicitKey && state.firstTabInLine !== -1) {
        state.position = state.firstTabInLine;
        throwError(state, "tab characters must not be used in indentation");
      }
      const following = state.input.charCodeAt(state.position + 1);
      const _line = state.line;
      if ((ch === 63 || ch === 58) && isWsOrEol(following)) {
        if (ch === 63) {
          if (atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
            keyTag = keyNode = valueNode = null;
          }
          detected = true;
          atExplicitKey = true;
          allowCompact = true;
        } else if (atExplicitKey) {
          atExplicitKey = false;
          allowCompact = true;
        } else {
          throwError(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
        }
        state.position += 1;
        ch = following;
      } else {
        _keyLine = state.line;
        _keyLineStart = state.lineStart;
        _keyPos = state.position;
        if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
          break;
        }
        if (state.line === _line) {
          ch = state.input.charCodeAt(state.position);
          while (isWhiteSpace(ch)) {
            ch = state.input.charCodeAt(++state.position);
          }
          if (ch === 58) {
            ch = state.input.charCodeAt(++state.position);
            if (!isWsOrEol(ch)) {
              throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
            }
            if (atExplicitKey) {
              storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
              keyTag = keyNode = valueNode = null;
            }
            detected = true;
            atExplicitKey = false;
            allowCompact = false;
            keyTag = state.tag;
            keyNode = state.result;
          } else if (detected) {
            throwError(state, "can not read an implicit mapping pair; a colon is missed");
          } else {
            state.tag = _tag;
            state.anchor = _anchor;
            return true;
          }
        } else if (detected) {
          throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
        } else {
          state.tag = _tag;
          state.anchor = _anchor;
          return true;
        }
      }
      if (state.line === _line || state.lineIndent > nodeIndent) {
        if (atExplicitKey) {
          _keyLine = state.line;
          _keyLineStart = state.lineStart;
          _keyPos = state.position;
        }
        if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
          if (atExplicitKey) {
            keyNode = state.result;
          } else {
            valueNode = state.result;
          }
        }
        if (!atExplicitKey) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
          keyTag = keyNode = valueNode = null;
        }
        skipSeparationSpace(state, true, -1);
        ch = state.input.charCodeAt(state.position);
      }
      if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
        throwError(state, "bad indentation of a mapping entry");
      } else if (state.lineIndent < nodeIndent) {
        break;
      }
    }
    if (atExplicitKey) {
      storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
    }
    if (detected) {
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = "mapping";
      state.result = _result;
    }
    return detected;
  }
  function readTagProperty(state) {
    let isVerbatim = false;
    let isNamed = false;
    let tagHandle;
    let tagName;
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 33)
      return false;
    if (state.tag !== null) {
      throwError(state, "duplication of a tag property");
    }
    ch = state.input.charCodeAt(++state.position);
    if (ch === 60) {
      isVerbatim = true;
      ch = state.input.charCodeAt(++state.position);
    } else if (ch === 33) {
      isNamed = true;
      tagHandle = "!!";
      ch = state.input.charCodeAt(++state.position);
    } else {
      tagHandle = "!";
    }
    let _position = state.position;
    if (isVerbatim) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (ch !== 0 && ch !== 62);
      if (state.position < state.length) {
        tagName = state.input.slice(_position, state.position);
        ch = state.input.charCodeAt(++state.position);
      } else {
        throwError(state, "unexpected end of the stream within a verbatim tag");
      }
    } else {
      while (ch !== 0 && !isWsOrEol(ch)) {
        if (ch === 33) {
          if (!isNamed) {
            tagHandle = state.input.slice(_position - 1, state.position + 1);
            if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
              throwError(state, "named tag handle cannot contain such characters");
            }
            isNamed = true;
            _position = state.position + 1;
          } else {
            throwError(state, "tag suffix cannot contain exclamation marks");
          }
        }
        ch = state.input.charCodeAt(++state.position);
      }
      tagName = state.input.slice(_position, state.position);
      if (PATTERN_FLOW_INDICATORS.test(tagName)) {
        throwError(state, "tag suffix cannot contain flow indicator characters");
      }
    }
    if (tagName && !PATTERN_TAG_URI.test(tagName)) {
      throwError(state, "tag name cannot contain such characters: " + tagName);
    }
    try {
      tagName = decodeURIComponent(tagName);
    } catch (err) {
      throwError(state, "tag name is malformed: " + tagName);
    }
    if (isVerbatim) {
      state.tag = tagName;
    } else if (_hasOwnProperty.call(state.tagMap, tagHandle)) {
      state.tag = state.tagMap[tagHandle] + tagName;
    } else if (tagHandle === "!") {
      state.tag = "!" + tagName;
    } else if (tagHandle === "!!") {
      state.tag = "tag:yaml.org,2002:" + tagName;
    } else {
      throwError(state, 'undeclared tag handle "' + tagHandle + '"');
    }
    return true;
  }
  function readAnchorProperty(state) {
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 38)
      return false;
    if (state.anchor !== null) {
      throwError(state, "duplication of an anchor property");
    }
    ch = state.input.charCodeAt(++state.position);
    const _position = state.position;
    while (ch !== 0 && !isWsOrEol(ch) && !isFlowIndicator(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }
    if (state.position === _position) {
      throwError(state, "name of an anchor node must contain at least one character");
    }
    state.anchor = state.input.slice(_position, state.position);
    return true;
  }
  function readAlias(state) {
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 42)
      return false;
    ch = state.input.charCodeAt(++state.position);
    const _position = state.position;
    while (ch !== 0 && !isWsOrEol(ch) && !isFlowIndicator(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }
    if (state.position === _position) {
      throwError(state, "name of an alias node must contain at least one character");
    }
    const alias = state.input.slice(_position, state.position);
    if (!_hasOwnProperty.call(state.anchorMap, alias)) {
      throwError(state, 'unidentified alias "' + alias + '"');
    }
    state.result = state.anchorMap[alias];
    skipSeparationSpace(state, true, -1);
    return true;
  }
  function tryReadBlockMappingFromProperty(state, propertyStart, nodeIndent, flowIndent) {
    const fallbackState = snapshotState(state);
    beginAnchorTransaction(state);
    restoreState(state, propertyStart);
    state.tag = null;
    state.anchor = null;
    state.kind = null;
    state.result = null;
    if (readBlockMapping(state, nodeIndent, flowIndent) && state.kind === "mapping") {
      commitAnchorTransaction(state);
      return true;
    }
    rollbackAnchorTransaction(state);
    restoreState(state, fallbackState);
    return false;
  }
  function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
    let allowBlockScalars;
    let allowBlockCollections;
    let indentStatus = 1;
    let atNewLine = false;
    let hasContent = false;
    let propertyStart = null;
    let type2;
    let flowIndent;
    let blockIndent;
    if (state.depth >= state.maxDepth) {
      throwError(state, "nesting exceeded maxDepth (" + state.maxDepth + ")");
    }
    state.depth += 1;
    if (state.listener !== null) {
      state.listener("open", state);
    }
    state.tag = null;
    state.anchor = null;
    state.kind = null;
    state.result = null;
    const allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
    if (allowToSeek) {
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;
        if (state.lineIndent > parentIndent) {
          indentStatus = 1;
        } else if (state.lineIndent === parentIndent) {
          indentStatus = 0;
        } else if (state.lineIndent < parentIndent) {
          indentStatus = -1;
        }
      }
    }
    if (indentStatus === 1) {
      while (true) {
        const ch = state.input.charCodeAt(state.position);
        const propertyState = snapshotState(state);
        if (atNewLine && (ch === 33 && state.tag !== null || ch === 38 && state.anchor !== null)) {
          break;
        }
        if (!readTagProperty(state) && !readAnchorProperty(state)) {
          break;
        }
        if (propertyStart === null) {
          propertyStart = propertyState;
        }
        if (skipSeparationSpace(state, true, -1)) {
          atNewLine = true;
          allowBlockCollections = allowBlockStyles;
          if (state.lineIndent > parentIndent) {
            indentStatus = 1;
          } else if (state.lineIndent === parentIndent) {
            indentStatus = 0;
          } else if (state.lineIndent < parentIndent) {
            indentStatus = -1;
          }
        } else {
          allowBlockCollections = false;
        }
      }
    }
    if (allowBlockCollections) {
      allowBlockCollections = atNewLine || allowCompact;
    }
    if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
      if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
        flowIndent = parentIndent;
      } else {
        flowIndent = parentIndent + 1;
      }
      blockIndent = state.position - state.lineStart;
      if (indentStatus === 1) {
        if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) {
          hasContent = true;
        } else {
          const ch = state.input.charCodeAt(state.position);
          if (propertyStart !== null && allowBlockStyles && !allowBlockCollections && ch !== 124 && ch !== 62 && tryReadBlockMappingFromProperty(state, propertyStart, propertyStart.position - propertyStart.lineStart, flowIndent)) {
            hasContent = true;
          } else if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) {
            hasContent = true;
          } else if (readAlias(state)) {
            hasContent = true;
            if (state.tag !== null || state.anchor !== null) {
              throwError(state, "alias node should not have any properties");
            }
          } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
            hasContent = true;
            if (state.tag === null) {
              state.tag = "?";
            }
          }
          if (state.anchor !== null) {
            storeAnchor(state, state.anchor, state.result);
          }
        }
      } else if (indentStatus === 0) {
        hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
      }
    }
    if (state.tag === null) {
      if (state.anchor !== null) {
        storeAnchor(state, state.anchor, state.result);
      }
    } else if (state.tag === "?") {
      if (state.result !== null && state.kind !== "scalar") {
        throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
      }
      for (let typeIndex = 0, typeQuantity = state.implicitTypes.length;typeIndex < typeQuantity; typeIndex += 1) {
        type2 = state.implicitTypes[typeIndex];
        if (type2.resolve(state.result)) {
          state.result = type2.construct(state.result);
          state.tag = type2.tag;
          if (state.anchor !== null) {
            storeAnchor(state, state.anchor, state.result);
          }
          break;
        }
      }
    } else if (state.tag !== "!") {
      if (_hasOwnProperty.call(state.typeMap[state.kind || "fallback"], state.tag)) {
        type2 = state.typeMap[state.kind || "fallback"][state.tag];
      } else {
        type2 = null;
        const typeList = state.typeMap.multi[state.kind || "fallback"];
        for (let typeIndex = 0, typeQuantity = typeList.length;typeIndex < typeQuantity; typeIndex += 1) {
          if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
            type2 = typeList[typeIndex];
            break;
          }
        }
      }
      if (!type2) {
        throwError(state, "unknown tag !<" + state.tag + ">");
      }
      if (state.result !== null && type2.kind !== state.kind) {
        throwError(state, "unacceptable node kind for !<" + state.tag + '> tag; it should be "' + type2.kind + '", not "' + state.kind + '"');
      }
      if (!type2.resolve(state.result, state.tag)) {
        throwError(state, "cannot resolve a node with !<" + state.tag + "> explicit tag");
      } else {
        state.result = type2.construct(state.result, state.tag);
        if (state.anchor !== null) {
          storeAnchor(state, state.anchor, state.result);
        }
      }
    }
    if (state.listener !== null) {
      state.listener("close", state);
    }
    state.depth -= 1;
    return state.tag !== null || state.anchor !== null || hasContent;
  }
  function readDocument(state) {
    const documentStart = state.position;
    let hasDirectives = false;
    let ch;
    state.version = null;
    state.checkLineBreaks = state.legacy;
    state.tagMap = /* @__PURE__ */ Object.create(null);
    state.anchorMap = /* @__PURE__ */ Object.create(null);
    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
      if (state.lineIndent > 0 || ch !== 37) {
        break;
      }
      hasDirectives = true;
      ch = state.input.charCodeAt(++state.position);
      let _position = state.position;
      while (ch !== 0 && !isWsOrEol(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      const directiveName = state.input.slice(_position, state.position);
      const directiveArgs = [];
      if (directiveName.length < 1) {
        throwError(state, "directive name must not be less than one character in length");
      }
      while (ch !== 0) {
        while (isWhiteSpace(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        if (ch === 35) {
          do {
            ch = state.input.charCodeAt(++state.position);
          } while (ch !== 0 && !isEol(ch));
          break;
        }
        if (isEol(ch))
          break;
        _position = state.position;
        while (ch !== 0 && !isWsOrEol(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        directiveArgs.push(state.input.slice(_position, state.position));
      }
      if (ch !== 0)
        readLineBreak(state);
      if (_hasOwnProperty.call(directiveHandlers, directiveName)) {
        directiveHandlers[directiveName](state, directiveName, directiveArgs);
      } else {
        throwWarning(state, 'unknown document directive "' + directiveName + '"');
      }
    }
    skipSeparationSpace(state, true, -1);
    if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45) {
      state.position += 3;
      skipSeparationSpace(state, true, -1);
    } else if (hasDirectives) {
      throwError(state, "directives end mark is expected");
    }
    composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
    skipSeparationSpace(state, true, -1);
    if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
      throwWarning(state, "non-ASCII line breaks are interpreted as content");
    }
    state.documents.push(state.result);
    if (state.position === state.lineStart && testDocumentSeparator(state)) {
      if (state.input.charCodeAt(state.position) === 46) {
        state.position += 3;
        skipSeparationSpace(state, true, -1);
      }
      return;
    }
    if (state.position < state.length - 1) {
      throwError(state, "end of the stream or a document separator is expected");
    }
  }
  function loadDocuments(input, options) {
    input = String(input);
    options = options || {};
    if (input.length !== 0) {
      if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13) {
        input += `
`;
      }
      if (input.charCodeAt(0) === 65279) {
        input = input.slice(1);
      }
    }
    const state = new State(input, options);
    const nullpos = input.indexOf("\x00");
    if (nullpos !== -1) {
      state.position = nullpos;
      throwError(state, "null byte is not allowed in input");
    }
    state.input += "\x00";
    while (state.input.charCodeAt(state.position) === 32) {
      state.lineIndent += 1;
      state.position += 1;
    }
    while (state.position < state.length - 1) {
      readDocument(state);
    }
    return state.documents;
  }
  function loadAll2(input, iterator, options) {
    if (iterator !== null && typeof iterator === "object" && typeof options === "undefined") {
      options = iterator;
      iterator = null;
    }
    const documents = loadDocuments(input, options);
    if (typeof iterator !== "function") {
      return documents;
    }
    for (let index = 0, length = documents.length;index < length; index += 1) {
      iterator(documents[index]);
    }
  }
  function load2(input, options) {
    const documents = loadDocuments(input, options);
    if (documents.length === 0) {
      return;
    } else if (documents.length === 1) {
      return documents[0];
    }
    throw new YAMLException2("expected a single document in the stream, but found more");
  }
  loader.loadAll = loadAll2;
  loader.load = load2;
  return loader;
}
var dumper = {};
var hasRequiredDumper;
function requireDumper() {
  if (hasRequiredDumper)
    return dumper;
  hasRequiredDumper = 1;
  const common2 = requireCommon();
  const YAMLException2 = requireException();
  const DEFAULT_SCHEMA2 = require_default();
  const _toString = Object.prototype.toString;
  const _hasOwnProperty = Object.prototype.hasOwnProperty;
  const CHAR_BOM = 65279;
  const CHAR_TAB = 9;
  const CHAR_LINE_FEED = 10;
  const CHAR_CARRIAGE_RETURN = 13;
  const CHAR_SPACE = 32;
  const CHAR_EXCLAMATION = 33;
  const CHAR_DOUBLE_QUOTE = 34;
  const CHAR_SHARP = 35;
  const CHAR_PERCENT = 37;
  const CHAR_AMPERSAND = 38;
  const CHAR_SINGLE_QUOTE = 39;
  const CHAR_ASTERISK = 42;
  const CHAR_COMMA = 44;
  const CHAR_MINUS = 45;
  const CHAR_COLON = 58;
  const CHAR_EQUALS = 61;
  const CHAR_GREATER_THAN = 62;
  const CHAR_QUESTION = 63;
  const CHAR_COMMERCIAL_AT = 64;
  const CHAR_LEFT_SQUARE_BRACKET = 91;
  const CHAR_RIGHT_SQUARE_BRACKET = 93;
  const CHAR_GRAVE_ACCENT = 96;
  const CHAR_LEFT_CURLY_BRACKET = 123;
  const CHAR_VERTICAL_LINE = 124;
  const CHAR_RIGHT_CURLY_BRACKET = 125;
  const ESCAPE_SEQUENCES = {};
  ESCAPE_SEQUENCES[0] = "\\0";
  ESCAPE_SEQUENCES[7] = "\\a";
  ESCAPE_SEQUENCES[8] = "\\b";
  ESCAPE_SEQUENCES[9] = "\\t";
  ESCAPE_SEQUENCES[10] = "\\n";
  ESCAPE_SEQUENCES[11] = "\\v";
  ESCAPE_SEQUENCES[12] = "\\f";
  ESCAPE_SEQUENCES[13] = "\\r";
  ESCAPE_SEQUENCES[27] = "\\e";
  ESCAPE_SEQUENCES[34] = "\\\"";
  ESCAPE_SEQUENCES[92] = "\\\\";
  ESCAPE_SEQUENCES[133] = "\\N";
  ESCAPE_SEQUENCES[160] = "\\_";
  ESCAPE_SEQUENCES[8232] = "\\L";
  ESCAPE_SEQUENCES[8233] = "\\P";
  const DEPRECATED_BOOLEANS_SYNTAX = [
    "y",
    "Y",
    "yes",
    "Yes",
    "YES",
    "on",
    "On",
    "ON",
    "n",
    "N",
    "no",
    "No",
    "NO",
    "off",
    "Off",
    "OFF"
  ];
  const DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
  function compileStyleMap(schema2, map2) {
    if (map2 === null)
      return {};
    const result = {};
    const keys = Object.keys(map2);
    for (let index = 0, length = keys.length;index < length; index += 1) {
      let tag = keys[index];
      let style = String(map2[tag]);
      if (tag.slice(0, 2) === "!!") {
        tag = "tag:yaml.org,2002:" + tag.slice(2);
      }
      const type2 = schema2.compiledTypeMap["fallback"][tag];
      if (type2 && _hasOwnProperty.call(type2.styleAliases, style)) {
        style = type2.styleAliases[style];
      }
      result[tag] = style;
    }
    return result;
  }
  function encodeHex(character) {
    let handle;
    let length;
    const string = character.toString(16).toUpperCase();
    if (character <= 255) {
      handle = "x";
      length = 2;
    } else if (character <= 65535) {
      handle = "u";
      length = 4;
    } else if (character <= 4294967295) {
      handle = "U";
      length = 8;
    } else {
      throw new YAMLException2("code point within a string may not be greater than 0xFFFFFFFF");
    }
    return "\\" + handle + common2.repeat("0", length - string.length) + string;
  }
  const QUOTING_TYPE_SINGLE = 1;
  const QUOTING_TYPE_DOUBLE = 2;
  function State(options) {
    this.schema = options["schema"] || DEFAULT_SCHEMA2;
    this.indent = Math.max(1, options["indent"] || 2);
    this.noArrayIndent = options["noArrayIndent"] || false;
    this.skipInvalid = options["skipInvalid"] || false;
    this.flowLevel = common2.isNothing(options["flowLevel"]) ? -1 : options["flowLevel"];
    this.styleMap = compileStyleMap(this.schema, options["styles"] || null);
    this.sortKeys = options["sortKeys"] || false;
    this.lineWidth = options["lineWidth"] || 80;
    this.noRefs = options["noRefs"] || false;
    this.noCompatMode = options["noCompatMode"] || false;
    this.condenseFlow = options["condenseFlow"] || false;
    this.quotingType = options["quotingType"] === '"' ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
    this.forceQuotes = options["forceQuotes"] || false;
    this.replacer = typeof options["replacer"] === "function" ? options["replacer"] : null;
    this.implicitTypes = this.schema.compiledImplicit;
    this.explicitTypes = this.schema.compiledExplicit;
    this.tag = null;
    this.result = "";
    this.duplicates = [];
    this.usedDuplicates = null;
  }
  function indentString(string, spaces) {
    const ind = common2.repeat(" ", spaces);
    let position = 0;
    let result = "";
    const length = string.length;
    while (position < length) {
      let line;
      const next = string.indexOf(`
`, position);
      if (next === -1) {
        line = string.slice(position);
        position = length;
      } else {
        line = string.slice(position, next + 1);
        position = next + 1;
      }
      if (line.length && line !== `
`)
        result += ind;
      result += line;
    }
    return result;
  }
  function generateNextLine(state, level) {
    return `
` + common2.repeat(" ", state.indent * level);
  }
  function testImplicitResolving(state, str2) {
    for (let index = 0, length = state.implicitTypes.length;index < length; index += 1) {
      const type2 = state.implicitTypes[index];
      if (type2.resolve(str2)) {
        return true;
      }
    }
    return false;
  }
  function isWhitespace(c) {
    return c === CHAR_SPACE || c === CHAR_TAB;
  }
  function isPrintable(c) {
    return c >= 32 && c <= 126 || c >= 161 && c <= 55295 && c !== 8232 && c !== 8233 || c >= 57344 && c <= 65533 && c !== CHAR_BOM || c >= 65536 && c <= 1114111;
  }
  function isNsCharOrWhitespace(c) {
    return isPrintable(c) && c !== CHAR_BOM && c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
  }
  function isPlainSafe(c, prev, inblock) {
    const cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
    const cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
    return (inblock ? cIsNsCharOrWhitespace : cIsNsCharOrWhitespace && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET) && c !== CHAR_SHARP && !(prev === CHAR_COLON && !cIsNsChar) || isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP || prev === CHAR_COLON && cIsNsChar;
  }
  function isPlainSafeFirst(c) {
    return isPrintable(c) && c !== CHAR_BOM && !isWhitespace(c) && c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE && c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
  }
  function isPlainSafeLast(c) {
    return !isWhitespace(c) && c !== CHAR_COLON;
  }
  function codePointAt(string, pos) {
    const first = string.charCodeAt(pos);
    let second;
    if (first >= 55296 && first <= 56319 && pos + 1 < string.length) {
      second = string.charCodeAt(pos + 1);
      if (second >= 56320 && second <= 57343) {
        return (first - 55296) * 1024 + second - 56320 + 65536;
      }
    }
    return first;
  }
  function needIndentIndicator(string) {
    const leadingSpaceRe = /^\n* /;
    return leadingSpaceRe.test(string);
  }
  const STYLE_PLAIN = 1;
  const STYLE_SINGLE = 2;
  const STYLE_LITERAL = 3;
  const STYLE_FOLDED = 4;
  const STYLE_DOUBLE = 5;
  function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType, quotingType, forceQuotes, inblock) {
    let i;
    let char = 0;
    let prevChar = null;
    let hasLineBreak = false;
    let hasFoldableLine = false;
    const shouldTrackWidth = lineWidth !== -1;
    let previousLineBreak = -1;
    let plain = isPlainSafeFirst(codePointAt(string, 0)) && isPlainSafeLast(codePointAt(string, string.length - 1));
    if (singleLineOnly || forceQuotes) {
      for (i = 0;i < string.length; char >= 65536 ? i += 2 : i++) {
        char = codePointAt(string, i);
        if (!isPrintable(char)) {
          return STYLE_DOUBLE;
        }
        plain = plain && isPlainSafe(char, prevChar, inblock);
        prevChar = char;
      }
    } else {
      for (i = 0;i < string.length; char >= 65536 ? i += 2 : i++) {
        char = codePointAt(string, i);
        if (char === CHAR_LINE_FEED) {
          hasLineBreak = true;
          if (shouldTrackWidth) {
            hasFoldableLine = hasFoldableLine || i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
            previousLineBreak = i;
          }
        } else if (!isPrintable(char)) {
          return STYLE_DOUBLE;
        }
        plain = plain && isPlainSafe(char, prevChar, inblock);
        prevChar = char;
      }
      hasFoldableLine = hasFoldableLine || shouldTrackWidth && (i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ");
    }
    if (!hasLineBreak && !hasFoldableLine) {
      if (plain && !forceQuotes && !testAmbiguousType(string)) {
        return STYLE_PLAIN;
      }
      return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
    }
    if (indentPerLevel > 9 && needIndentIndicator(string)) {
      return STYLE_DOUBLE;
    }
    if (!forceQuotes) {
      return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
    }
    return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
  }
  function writeScalar(state, string, level, iskey, inblock) {
    state.dump = function() {
      if (string.length === 0) {
        return state.quotingType === QUOTING_TYPE_DOUBLE ? '""' : "''";
      }
      if (!state.noCompatMode) {
        if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string)) {
          return state.quotingType === QUOTING_TYPE_DOUBLE ? '"' + string + '"' : "'" + string + "'";
        }
      }
      const indent = state.indent * Math.max(1, level);
      const lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
      const singleLineOnly = iskey || state.flowLevel > -1 && level >= state.flowLevel;
      function testAmbiguity(string2) {
        return testImplicitResolving(state, string2);
      }
      switch (chooseScalarStyle(string, singleLineOnly, state.indent, lineWidth, testAmbiguity, state.quotingType, state.forceQuotes && !iskey, inblock)) {
        case STYLE_PLAIN:
          return string;
        case STYLE_SINGLE:
          return "'" + string.replace(/'/g, "''") + "'";
        case STYLE_LITERAL:
          return "|" + blockHeader(string, state.indent) + dropEndingNewline(indentString(string, indent));
        case STYLE_FOLDED:
          return ">" + blockHeader(string, state.indent) + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
        case STYLE_DOUBLE:
          return '"' + escapeString(string) + '"';
        default:
          throw new YAMLException2("impossible error: invalid scalar style");
      }
    }();
  }
  function blockHeader(string, indentPerLevel) {
    const indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : "";
    const clip = string[string.length - 1] === `
`;
    const keep = clip && (string[string.length - 2] === `
` || string === `
`);
    const chomp = keep ? "+" : clip ? "" : "-";
    return indentIndicator + chomp + `
`;
  }
  function dropEndingNewline(string) {
    return string[string.length - 1] === `
` ? string.slice(0, -1) : string;
  }
  function foldString(string, width) {
    const lineRe = /(\n+)([^\n]*)/g;
    let result = function() {
      let nextLF = string.indexOf(`
`);
      nextLF = nextLF !== -1 ? nextLF : string.length;
      lineRe.lastIndex = nextLF;
      return foldLine(string.slice(0, nextLF), width);
    }();
    let prevMoreIndented = string[0] === `
` || string[0] === " ";
    let moreIndented;
    let match;
    while (match = lineRe.exec(string)) {
      const prefix = match[1];
      const line = match[2];
      moreIndented = line[0] === " ";
      result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? `
` : "") + foldLine(line, width);
      prevMoreIndented = moreIndented;
    }
    return result;
  }
  function foldLine(line, width) {
    if (line === "" || line[0] === " ")
      return line;
    const breakRe = / [^ ]/g;
    let match;
    let start = 0;
    let end;
    let curr = 0;
    let next = 0;
    let result = "";
    while (match = breakRe.exec(line)) {
      next = match.index;
      if (next - start > width) {
        end = curr > start ? curr : next;
        result += `
` + line.slice(start, end);
        start = end + 1;
      }
      curr = next;
    }
    result += `
`;
    if (line.length - start > width && curr > start) {
      result += line.slice(start, curr) + `
` + line.slice(curr + 1);
    } else {
      result += line.slice(start);
    }
    return result.slice(1);
  }
  function escapeString(string) {
    let result = "";
    let char = 0;
    for (let i = 0;i < string.length; char >= 65536 ? i += 2 : i++) {
      char = codePointAt(string, i);
      const escapeSeq = ESCAPE_SEQUENCES[char];
      if (!escapeSeq && isPrintable(char)) {
        result += string[i];
        if (char >= 65536)
          result += string[i + 1];
      } else {
        result += escapeSeq || encodeHex(char);
      }
    }
    return result;
  }
  function writeFlowSequence(state, level, object) {
    let _result = "";
    const _tag = state.tag;
    for (let index = 0, length = object.length;index < length; index += 1) {
      let value = object[index];
      if (state.replacer) {
        value = state.replacer.call(object, String(index), value);
      }
      if (writeNode(state, level, value, false, false) || typeof value === "undefined" && writeNode(state, level, null, false, false)) {
        if (_result !== "")
          _result += "," + (!state.condenseFlow ? " " : "");
        _result += state.dump;
      }
    }
    state.tag = _tag;
    state.dump = "[" + _result + "]";
  }
  function writeBlockSequence(state, level, object, compact) {
    let _result = "";
    const _tag = state.tag;
    for (let index = 0, length = object.length;index < length; index += 1) {
      let value = object[index];
      if (state.replacer) {
        value = state.replacer.call(object, String(index), value);
      }
      if (writeNode(state, level + 1, value, true, true, false, true) || typeof value === "undefined" && writeNode(state, level + 1, null, true, true, false, true)) {
        if (!compact || _result !== "") {
          _result += generateNextLine(state, level);
        }
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          _result += "-";
        } else {
          _result += "- ";
        }
        _result += state.dump;
      }
    }
    state.tag = _tag;
    state.dump = _result || "[]";
  }
  function writeFlowMapping(state, level, object) {
    let _result = "";
    const _tag = state.tag;
    const objectKeyList = Object.keys(object);
    for (let index = 0, length = objectKeyList.length;index < length; index += 1) {
      let pairBuffer = "";
      if (_result !== "")
        pairBuffer += ", ";
      if (state.condenseFlow)
        pairBuffer += '"';
      const objectKey = objectKeyList[index];
      let objectValue = object[objectKey];
      if (state.replacer) {
        objectValue = state.replacer.call(object, objectKey, objectValue);
      }
      if (!writeNode(state, level, objectKey, false, false)) {
        continue;
      }
      if (state.dump.length > 1024)
        pairBuffer += "? ";
      pairBuffer += state.dump + (state.condenseFlow ? '"' : "") + ":" + (state.condenseFlow ? "" : " ");
      if (!writeNode(state, level, objectValue, false, false)) {
        continue;
      }
      pairBuffer += state.dump;
      _result += pairBuffer;
    }
    state.tag = _tag;
    state.dump = "{" + _result + "}";
  }
  function writeBlockMapping(state, level, object, compact) {
    let _result = "";
    const _tag = state.tag;
    const objectKeyList = Object.keys(object);
    if (state.sortKeys === true) {
      objectKeyList.sort();
    } else if (typeof state.sortKeys === "function") {
      objectKeyList.sort(state.sortKeys);
    } else if (state.sortKeys) {
      throw new YAMLException2("sortKeys must be a boolean or a function");
    }
    for (let index = 0, length = objectKeyList.length;index < length; index += 1) {
      let pairBuffer = "";
      if (!compact || _result !== "") {
        pairBuffer += generateNextLine(state, level);
      }
      const objectKey = objectKeyList[index];
      let objectValue = object[objectKey];
      if (state.replacer) {
        objectValue = state.replacer.call(object, objectKey, objectValue);
      }
      if (!writeNode(state, level + 1, objectKey, true, true, true)) {
        continue;
      }
      const explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
      if (explicitPair) {
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          pairBuffer += "?";
        } else {
          pairBuffer += "? ";
        }
      }
      pairBuffer += state.dump;
      if (explicitPair) {
        pairBuffer += generateNextLine(state, level);
      }
      if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
        continue;
      }
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        pairBuffer += ":";
      } else {
        pairBuffer += ": ";
      }
      pairBuffer += state.dump;
      _result += pairBuffer;
    }
    state.tag = _tag;
    state.dump = _result || "{}";
  }
  function detectType(state, object, explicit) {
    const typeList = explicit ? state.explicitTypes : state.implicitTypes;
    for (let index = 0, length = typeList.length;index < length; index += 1) {
      const type2 = typeList[index];
      if ((type2.instanceOf || type2.predicate) && (!type2.instanceOf || typeof object === "object" && object instanceof type2.instanceOf) && (!type2.predicate || type2.predicate(object))) {
        if (explicit) {
          if (type2.multi && type2.representName) {
            state.tag = type2.representName(object);
          } else {
            state.tag = type2.tag;
          }
        } else {
          state.tag = "?";
        }
        if (type2.represent) {
          const style = state.styleMap[type2.tag] || type2.defaultStyle;
          let _result;
          if (_toString.call(type2.represent) === "[object Function]") {
            _result = type2.represent(object, style);
          } else if (_hasOwnProperty.call(type2.represent, style)) {
            _result = type2.represent[style](object, style);
          } else {
            throw new YAMLException2("!<" + type2.tag + '> tag resolver accepts not "' + style + '" style');
          }
          state.dump = _result;
        }
        return true;
      }
    }
    return false;
  }
  function writeNode(state, level, object, block, compact, iskey, isblockseq) {
    state.tag = null;
    state.dump = object;
    if (!detectType(state, object, false)) {
      detectType(state, object, true);
    }
    const type2 = _toString.call(state.dump);
    const inblock = block;
    if (block) {
      block = state.flowLevel < 0 || state.flowLevel > level;
    }
    const objectOrArray = type2 === "[object Object]" || type2 === "[object Array]";
    let duplicateIndex;
    let duplicate;
    if (objectOrArray) {
      duplicateIndex = state.duplicates.indexOf(object);
      duplicate = duplicateIndex !== -1;
    }
    if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0) {
      compact = false;
    }
    if (duplicate && state.usedDuplicates[duplicateIndex]) {
      state.dump = "*ref_" + duplicateIndex;
    } else {
      if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
        state.usedDuplicates[duplicateIndex] = true;
      }
      if (type2 === "[object Object]") {
        if (block && Object.keys(state.dump).length !== 0) {
          writeBlockMapping(state, level, state.dump, compact);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + state.dump;
          }
        } else {
          writeFlowMapping(state, level, state.dump);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + " " + state.dump;
          }
        }
      } else if (type2 === "[object Array]") {
        if (block && state.dump.length !== 0) {
          if (state.noArrayIndent && !isblockseq && level > 0) {
            writeBlockSequence(state, level - 1, state.dump, compact);
          } else {
            writeBlockSequence(state, level, state.dump, compact);
          }
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + state.dump;
          }
        } else {
          writeFlowSequence(state, level, state.dump);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + " " + state.dump;
          }
        }
      } else if (type2 === "[object String]") {
        if (state.tag !== "?") {
          writeScalar(state, state.dump, level, iskey, inblock);
        }
      } else if (type2 === "[object Undefined]") {
        return false;
      } else {
        if (state.skipInvalid)
          return false;
        throw new YAMLException2("unacceptable kind of an object to dump " + type2);
      }
      if (state.tag !== null && state.tag !== "?") {
        let tagStr = encodeURI(state.tag[0] === "!" ? state.tag.slice(1) : state.tag).replace(/!/g, "%21");
        if (state.tag[0] === "!") {
          tagStr = "!" + tagStr;
        } else if (tagStr.slice(0, 18) === "tag:yaml.org,2002:") {
          tagStr = "!!" + tagStr.slice(18);
        } else {
          tagStr = "!<" + tagStr + ">";
        }
        state.dump = tagStr + " " + state.dump;
      }
    }
    return true;
  }
  function getDuplicateReferences(object, state) {
    const objects = [];
    const duplicatesIndexes = [];
    inspectNode(object, objects, duplicatesIndexes);
    const length = duplicatesIndexes.length;
    for (let index = 0;index < length; index += 1) {
      state.duplicates.push(objects[duplicatesIndexes[index]]);
    }
    state.usedDuplicates = new Array(length);
  }
  function inspectNode(object, objects, duplicatesIndexes) {
    if (object !== null && typeof object === "object") {
      const index = objects.indexOf(object);
      if (index !== -1) {
        if (duplicatesIndexes.indexOf(index) === -1) {
          duplicatesIndexes.push(index);
        }
      } else {
        objects.push(object);
        if (Array.isArray(object)) {
          for (let i = 0, length = object.length;i < length; i += 1) {
            inspectNode(object[i], objects, duplicatesIndexes);
          }
        } else {
          const objectKeyList = Object.keys(object);
          for (let i = 0, length = objectKeyList.length;i < length; i += 1) {
            inspectNode(object[objectKeyList[i]], objects, duplicatesIndexes);
          }
        }
      }
    }
  }
  function dump2(input, options) {
    options = options || {};
    const state = new State(options);
    if (!state.noRefs)
      getDuplicateReferences(input, state);
    let value = input;
    if (state.replacer) {
      value = state.replacer.call({ "": value }, "", value);
    }
    if (writeNode(state, 0, value, true, true))
      return state.dump + `
`;
    return "";
  }
  dumper.dump = dump2;
  return dumper;
}
var hasRequiredJsYaml;
function requireJsYaml() {
  if (hasRequiredJsYaml)
    return jsYaml;
  hasRequiredJsYaml = 1;
  const loader2 = requireLoader();
  const dumper2 = requireDumper();
  function renamed(from, to) {
    return function() {
      throw new Error("Function yaml." + from + " is removed in js-yaml 4. Use yaml." + to + " instead, which is now safe by default.");
    };
  }
  jsYaml.Type = requireType();
  jsYaml.Schema = requireSchema();
  jsYaml.FAILSAFE_SCHEMA = requireFailsafe();
  jsYaml.JSON_SCHEMA = requireJson();
  jsYaml.CORE_SCHEMA = requireCore();
  jsYaml.DEFAULT_SCHEMA = require_default();
  jsYaml.load = loader2.load;
  jsYaml.loadAll = loader2.loadAll;
  jsYaml.dump = dumper2.dump;
  jsYaml.YAMLException = requireException();
  jsYaml.types = {
    binary: requireBinary(),
    float: requireFloat(),
    map: requireMap(),
    null: require_null(),
    pairs: requirePairs(),
    set: requireSet(),
    timestamp: requireTimestamp(),
    bool: requireBool(),
    int: requireInt(),
    merge: requireMerge(),
    omap: requireOmap(),
    seq: requireSeq(),
    str: requireStr()
  };
  jsYaml.safeLoad = renamed("safeLoad", "load");
  jsYaml.safeLoadAll = renamed("safeLoadAll", "loadAll");
  jsYaml.safeDump = renamed("safeDump", "dump");
  return jsYaml;
}
var jsYamlExports = requireJsYaml();
var yaml = /* @__PURE__ */ getDefaultExportFromCjs(jsYamlExports);
var {
  Type,
  Schema,
  FAILSAFE_SCHEMA,
  JSON_SCHEMA,
  CORE_SCHEMA,
  DEFAULT_SCHEMA,
  load,
  loadAll,
  dump,
  YAMLException,
  types,
  safeLoad,
  safeLoadAll,
  safeDump
} = yaml;

// src/backend/asset-resolver.ts
function resolveOutfitName(actor) {
  if (!actor?.outfit)
    return "default";
  if (actor.outfit.state) {
    const sanitized = actor.outfit.state.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    if (sanitized)
      return sanitized;
  }
  if (actor.outfit.top) {
    const sanitized = actor.outfit.top.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    if (sanitized)
      return sanitized;
  }
  return "default";
}

// src/frontend/hud/tab-scene.ts
class SceneTab {
  root;
  ctx;
  currentManifest;
  onTransformChange;
  constructor(ctx, onTransformChange) {
    this.ctx = ctx;
    this.onTransformChange = onTransformChange;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-scene";
  }
  getContextIds() {
    const ctxAny = this.ctx;
    const activeChat = ctxAny.getActiveChat?.();
    return {
      chatId: activeChat?.id || activeChat?.chatId,
      userId: ctxAny.user?.id || ctxAny.currentUser?.id || activeChat?.user_id || activeChat?.userId
    };
  }
  setManifest(manifest) {
    this.currentManifest = manifest;
  }
  async uploadImageFile(file) {
    try {
      const formData = new FormData;
      formData.append("file", new Blob([file.bytes], { type: file.mimeType || "image/png" }), file.name);
      const resp = await fetch("/api/v1/images", {
        method: "POST",
        body: formData
      });
      if (resp.ok) {
        const data = await resp.json();
        const url = data.url || data.image_url || (data.id ? `/api/v1/images/${data.id}` : "");
        if (url)
          return url;
      }
    } catch {}
    return null;
  }
  async fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const blob = new Blob([file.bytes], { type: file.mimeType || "image/png" });
      const reader = new FileReader;
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }
  render(ledger, manifest) {
    if (manifest)
      this.currentManifest = manifest;
    this.root.innerHTML = "";
    const placeId = (ledger.scene?.place || "default").toLowerCase().trim();
    const participants = (ledger.scene?.participants || []).filter((p) => p && p.toLowerCase() !== "user");
    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `<h3>\uD83C\uDFAC Scene Visuals, Custom Poses & Gallery</h3>`;
    this.root.appendChild(header);
    const bgSec = document.createElement("div");
    bgSec.className = "vn-section";
    bgSec.innerHTML = `
      <h4>Scene Background</h4>
      <p style="font-size:12px; color:#94a3b8; margin-bottom:10px;">
        Tag your location with a Scope (e.g. house name or district) to prevent room collisions.
      </p>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom:8px;">
        <div>
          <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:2px;">Scope / Building (Optional):</label>
          <input id="vn-bg-scope" type="text" placeholder="e.g. tendo_residence" style="width:100%; box-sizing:border-box; background:#0f172a; border:1px solid #475569; border-radius:4px; padding:6px; color:#fff; font-size:12px;" />
        </div>
        <div>
          <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:2px;">Room / Location:</label>
          <input id="vn-bg-place" type="text" value="${placeId}" style="width:100%; box-sizing:border-box; background:#0f172a; border:1px solid #475569; border-radius:4px; padding:6px; color:#fff; font-size:12px;" />
        </div>
      </div>
    `;
    const bgBtnRow = document.createElement("div");
    bgBtnRow.style.cssText = "display: flex; gap: 8px; flex-wrap: wrap;";
    const bgUploadBtn = document.createElement("button");
    bgUploadBtn.className = "vn-btn vn-btn-primary";
    bgUploadBtn.textContent = `\uD83D\uDCC1 Upload Background Media`;
    bgUploadBtn.addEventListener("click", async () => {
      const scope = bgSec.querySelector("#vn-bg-scope").value.trim();
      const place = bgSec.querySelector("#vn-bg-place").value.trim() || placeId;
      try {
        const files = await this.ctx.uploads.pickFile({
          accept: ["image/*", "video/mp4", "video/webm"],
          multiple: false
        });
        if (!files || files.length === 0)
          return;
        const file = files[0];
        const { chatId, userId } = this.getContextIds();
        const directUrl = await this.uploadImageFile(file);
        if (directUrl) {
          this.ctx.sendToBackend({
            type: "vn_upload_asset",
            category: "places",
            scope,
            placeId: place,
            filename: file.name,
            url: directUrl,
            chatId,
            userId
          });
        } else {
          const dataUrl = await this.fileToDataUrl(file);
          this.ctx.sendToBackend({
            type: "vn_upload_asset",
            category: "places",
            scope,
            placeId: place,
            filename: file.name,
            dataUrl,
            chatId,
            userId
          });
        }
      } catch (err) {
        console.error("[LumiVN] Background upload failed:", err);
      }
    });
    const bgPickBtn = document.createElement("button");
    bgPickBtn.className = "vn-btn vn-btn-secondary";
    bgPickBtn.textContent = `\uD83D\uDDBC️ Pick from Library`;
    bgPickBtn.addEventListener("click", () => {
      const scope = bgSec.querySelector("#vn-bg-scope").value.trim();
      const place = bgSec.querySelector("#vn-bg-place").value.trim() || placeId;
      openAssetPicker({
        manifest: this.currentManifest,
        title: `Choose Background for ${scope ? `${scope}:${place}` : place}`,
        category: "places",
        onSelect: (item) => {
          const { chatId } = this.getContextIds();
          this.ctx.sendToBackend({
            type: "vn_assign_asset",
            category: "places",
            scope,
            placeId: place,
            url: item.url,
            chatId
          });
        }
      });
    });
    bgBtnRow.appendChild(bgUploadBtn);
    bgBtnRow.appendChild(bgPickBtn);
    bgSec.appendChild(bgBtnRow);
    this.root.appendChild(bgSec);
    const charSec = document.createElement("div");
    charSec.className = "vn-section";
    charSec.innerHTML = `<h4>Character Sprites & Custom Expressions</h4>`;
    if (participants.length === 0) {
      charSec.innerHTML += `<div class="vn-muted">No characters active in current scene.</div>`;
    } else {
      for (const rawActorId of participants) {
        const actorId = rawActorId.toLowerCase().trim();
        const actorDossier = ledger.actors?.[rawActorId] || ledger.actors?.[actorId];
        const currentOutfit = resolveOutfitName(actorDossier);
        const card = document.createElement("div");
        card.style.cssText = "background:#1e293b; border:1px solid #334155; border-radius:10px; padding:12px; margin-bottom:12px;";
        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <strong style="color:#f8fafc; font-size:14px;">${actorDossier?.name || rawActorId}</strong>
            <span style="font-size:11px; background:#0f172a; padding:3px 8px; border-radius:6px; color:#38bdf8;">
              Outfit: <strong>${currentOutfit}</strong>
            </span>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px;">
            <div>
              <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:2px;">Outfit Name:</label>
              <input class="vn-input-outfit" type="text" value="${currentOutfit}" style="width:100%; box-sizing:border-box; background:#0f172a; border:1px solid #475569; border-radius:4px; padding:6px; color:#fff; font-size:12px;" />
            </div>
            <div>
              <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:2px;">Custom Expression:</label>
              <input class="vn-input-expr" type="text" placeholder="e.g. smirk, pout, blush" value="neutral" style="width:100%; box-sizing:border-box; background:#0f172a; border:1px solid #475569; border-radius:4px; padding:6px; color:#fff; font-size:12px;" />
            </div>
          </div>
        `;
        const btnRow = document.createElement("div");
        btnRow.style.cssText = "display: flex; gap: 8px; flex-wrap: wrap;";
        const uploadSpriteBtn = document.createElement("button");
        uploadSpriteBtn.className = "vn-btn vn-btn-sm vn-btn-primary";
        uploadSpriteBtn.textContent = `\uD83D\uDCC1 Upload Expression Sprite`;
        uploadSpriteBtn.addEventListener("click", async () => {
          const outfit = card.querySelector(".vn-input-outfit").value.trim().toLowerCase();
          const expression = card.querySelector(".vn-input-expr").value.trim().toLowerCase() || "neutral";
          try {
            const files = await this.ctx.uploads.pickFile({
              accept: ["image/png", "image/webp", "image/jpeg"],
              multiple: false
            });
            if (!files || files.length === 0)
              return;
            const file = files[0];
            const { chatId, userId } = this.getContextIds();
            const directUrl = await this.uploadImageFile(file);
            if (directUrl) {
              this.ctx.sendToBackend({
                type: "vn_upload_asset",
                category: "characters",
                actorId,
                outfit,
                expression,
                filename: file.name,
                url: directUrl,
                chatId,
                userId
              });
            } else {
              const dataUrl = await this.fileToDataUrl(file);
              this.ctx.sendToBackend({
                type: "vn_upload_asset",
                category: "characters",
                actorId,
                outfit,
                expression,
                filename: file.name,
                dataUrl,
                chatId,
                userId
              });
            }
          } catch (e) {
            console.error("[LumiVN] Sprite upload failed:", e);
          }
        });
        const pickSpriteBtn = document.createElement("button");
        pickSpriteBtn.className = "vn-btn vn-btn-sm vn-btn-secondary";
        pickSpriteBtn.textContent = `\uD83D\uDDBC️ Pick from Library`;
        pickSpriteBtn.addEventListener("click", () => {
          const outfit = card.querySelector(".vn-input-outfit").value.trim().toLowerCase();
          const expression = card.querySelector(".vn-input-expr").value.trim().toLowerCase() || "neutral";
          openAssetPicker({
            manifest: this.currentManifest,
            title: `Assign Sprite for ${actorDossier?.name || rawActorId} (${outfit}/${expression})`,
            category: "characters",
            onSelect: (item) => {
              const { chatId } = this.getContextIds();
              this.ctx.sendToBackend({
                type: "vn_assign_asset",
                category: "characters",
                actorId,
                outfit,
                expression,
                url: item.url,
                chatId
              });
            }
          });
        });
        btnRow.appendChild(uploadSpriteBtn);
        btnRow.appendChild(pickSpriteBtn);
        card.appendChild(btnRow);
        const transform = getSpriteTransform(actorId);
        const transformBox = document.createElement("div");
        transformBox.style.cssText = "background:#0f172a; border:1px solid #334155; border-radius:8px; padding:10px; margin-top:10px;";
        transformBox.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-size:12px; font-weight:700; color:#38bdf8;">\uD83D\uDCD0 Size & Position Alignment</span>
            <button class="vn-btn-reset" style="background:#334155; border:none; border-radius:4px; color:#cbd5e1; font-size:10px; padding:2px 8px; cursor:pointer;">↺ Reset</button>
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:8px;">
            <div>
              <label style="font-size:10px; color:#94a3b8; display:flex; justify-content:space-between; margin-bottom:2px;">
                <span>Scale (Size):</span> <strong class="vn-val-scale" style="color:#f8fafc;">${Math.round(transform.scale * 100)}%</strong>
              </label>
              <input class="vn-slider-scale" type="range" min="50" max="200" step="5" value="${Math.round(transform.scale * 100)}" style="width:100%; cursor:pointer;" />
            </div>
            <div>
              <label style="font-size:10px; color:#94a3b8; display:flex; justify-content:space-between; margin-bottom:2px;">
                <span>Horizontal (X):</span> <strong class="vn-val-x" style="color:#f8fafc;">${transform.offsetX}px</strong>
              </label>
              <input class="vn-slider-x" type="range" min="-160" max="160" step="2" value="${transform.offsetX}" style="width:100%; cursor:pointer;" />
            </div>
            <div>
              <label style="font-size:10px; color:#94a3b8; display:flex; justify-content:space-between; margin-bottom:2px;">
                <span>Vertical (Y):</span> <strong class="vn-val-y" style="color:#f8fafc;">${transform.offsetY}px</strong>
              </label>
              <input class="vn-slider-y" type="range" min="-160" max="160" step="2" value="${transform.offsetY}" style="width:100%; cursor:pointer;" />
            </div>
          </div>
        `;
        const scaleInput = transformBox.querySelector(".vn-slider-scale");
        const xInput = transformBox.querySelector(".vn-slider-x");
        const yInput = transformBox.querySelector(".vn-slider-y");
        const scaleVal = transformBox.querySelector(".vn-val-scale");
        const xVal = transformBox.querySelector(".vn-val-x");
        const yVal = transformBox.querySelector(".vn-val-y");
        const resetBtn = transformBox.querySelector(".vn-btn-reset");
        const updateTransform = () => {
          const scale = Number(scaleInput.value) / 100;
          const offsetX = Number(xInput.value);
          const offsetY = Number(yInput.value);
          scaleVal.textContent = `${Math.round(scale * 100)}%`;
          xVal.textContent = `${offsetX}px`;
          yVal.textContent = `${offsetY}px`;
          this.onTransformChange?.(actorId, { scale, offsetX, offsetY });
        };
        scaleInput.addEventListener("input", updateTransform);
        xInput.addEventListener("input", updateTransform);
        yInput.addEventListener("input", updateTransform);
        resetBtn.addEventListener("click", () => {
          scaleInput.value = "100";
          xInput.value = "0";
          yInput.value = "0";
          updateTransform();
        });
        card.appendChild(transformBox);
        charSec.appendChild(card);
      }
    }
    this.root.appendChild(charSec);
    const actionSec = document.createElement("div");
    actionSec.className = "vn-section";
    actionSec.innerHTML = `
      <h4>Custom Actions & Poses</h4>
      <p style="font-size:12px; color:#94a3b8; margin-bottom:10px;">
        Register unique sprites for specific verbs/actions (e.g. hug, punch, sword, blush).
      </p>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px;">
        <div>
          <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:2px;">Actor ID:</label>
          <input id="vn-action-actor" type="text" placeholder="e.g. alethea" style="width:100%; box-sizing:border-box; background:#0f172a; border:1px solid #475569; border-radius:4px; padding:6px; color:#fff; font-size:12px;" />
        </div>
        <div>
          <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:2px;">Action Keyword:</label>
          <input id="vn-action-name" type="text" placeholder="e.g. cast_spell, smile, hug" style="width:100%; box-sizing:border-box; background:#0f172a; border:1px solid #475569; border-radius:4px; padding:6px; color:#fff; font-size:12px;" />
        </div>
      </div>
    `;
    const actionBtnRow = document.createElement("div");
    actionBtnRow.style.cssText = "display: flex; gap: 8px; flex-wrap: wrap;";
    const uploadActionBtn = document.createElement("button");
    uploadActionBtn.className = "vn-btn vn-btn-primary";
    uploadActionBtn.textContent = `\uD83D\uDCC1 Upload Action Pose Sprite`;
    uploadActionBtn.addEventListener("click", async () => {
      const actorId = actionSec.querySelector("#vn-action-actor").value.trim().toLowerCase();
      const actionName = actionSec.querySelector("#vn-action-name").value.trim().toLowerCase();
      if (!actorId || !actionName) {
        alert("Please specify both an Actor ID and Action Keyword.");
        return;
      }
      try {
        const files = await this.ctx.uploads.pickFile({
          accept: ["image/png", "image/webp", "image/jpeg"],
          multiple: false
        });
        if (!files || files.length === 0)
          return;
        const file = files[0];
        const { chatId, userId } = this.getContextIds();
        const directUrl = await this.uploadImageFile(file);
        if (directUrl) {
          this.ctx.sendToBackend({
            type: "vn_upload_asset",
            category: "actions",
            actorId,
            actionName,
            filename: file.name,
            url: directUrl,
            chatId,
            userId
          });
        } else {
          const dataUrl = await this.fileToDataUrl(file);
          this.ctx.sendToBackend({
            type: "vn_upload_asset",
            category: "actions",
            actorId,
            actionName,
            filename: file.name,
            dataUrl,
            chatId,
            userId
          });
        }
      } catch (err) {
        console.error("[LumiVN] Action upload failed:", err);
      }
    });
    const pickActionBtn = document.createElement("button");
    pickActionBtn.className = "vn-btn vn-btn-secondary";
    pickActionBtn.textContent = `\uD83D\uDDBC️ Pick from Library`;
    pickActionBtn.addEventListener("click", () => {
      const actorId = actionSec.querySelector("#vn-action-actor").value.trim().toLowerCase();
      const actionName = actionSec.querySelector("#vn-action-name").value.trim().toLowerCase();
      if (!actorId || !actionName) {
        alert("Please specify both an Actor ID and Action Keyword.");
        return;
      }
      openAssetPicker({
        manifest: this.currentManifest,
        title: `Assign Action Pose for ${actorId} [${actionName}]`,
        category: "characters",
        onSelect: (item) => {
          const { chatId } = this.getContextIds();
          this.ctx.sendToBackend({
            type: "vn_assign_asset",
            category: "actions",
            actorId,
            actionName,
            url: item.url,
            chatId
          });
        }
      });
    });
    actionBtnRow.appendChild(uploadActionBtn);
    actionBtnRow.appendChild(pickActionBtn);
    actionSec.appendChild(actionBtnRow);
    this.root.appendChild(actionSec);
    const gallerySec = document.createElement("div");
    gallerySec.className = "vn-section";
    const manifestData = this.currentManifest;
    const libraryItems = manifestData?.library || [];
    const galleryTopRow = document.createElement("div");
    galleryTopRow.style.cssText = "display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;";
    galleryTopRow.innerHTML = `
      <h4 style="margin: 0;">\uD83D\uDCC1 Uploaded Assets Manager (${libraryItems.length > 0 ? libraryItems.length : Object.keys(manifestData?.places || {}).length + Object.keys(manifestData?.characters || {}).length})</h4>
      <button id="vn-lib-open-picker-btn" class="vn-btn vn-btn-sm vn-btn-secondary">\uD83D\uDDBC️ Open Library Modal</button>
    `;
    galleryTopRow.querySelector("#vn-lib-open-picker-btn")?.addEventListener("click", () => {
      openAssetPicker({
        manifest: this.currentManifest,
        onSelect: (item) => {
          const targetActor = prompt("Assign this asset to which character ID (e.g. alethea, user)?");
          if (targetActor) {
            const clean = targetActor.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
            const { chatId } = this.getContextIds();
            this.ctx.sendToBackend({
              type: "vn_assign_asset",
              category: "characters",
              actorId: clean,
              outfit: "default",
              expression: "neutral",
              url: item.url,
              chatId
            });
          }
        }
      });
    });
    gallerySec.appendChild(galleryTopRow);
    const galleryList = document.createElement("div");
    galleryList.style.cssText = "display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto; padding-right: 4px;";
    let assetCount = 0;
    const seenUrls = new Set;
    if (libraryItems.length > 0) {
      for (const item of libraryItems) {
        if (!seenUrls.has(item.url)) {
          assetCount++;
          seenUrls.add(item.url);
          galleryList.appendChild(this.createAssetCard(item.category || "library", item.name, item.url, () => {
            this.deleteAsset({ category: "library", libraryId: item.id, url: item.url });
          }));
        }
      }
    } else {
      if (manifestData?.places) {
        for (const [key, url] of Object.entries(manifestData.places)) {
          if (!seenUrls.has(url)) {
            assetCount++;
            seenUrls.add(url);
            galleryList.appendChild(this.createAssetCard("places", `\uD83D\uDCCD Place: ${key}`, url, () => {
              this.deleteAsset({ category: "places", key });
            }));
          }
        }
      }
      if (manifestData?.characters) {
        for (const [actorId, actorData] of Object.entries(manifestData.characters)) {
          const outfits = actorData.outfits || actorData;
          if (outfits && typeof outfits === "object") {
            for (const [outfit, exprs] of Object.entries(outfits)) {
              if (exprs && typeof exprs === "object") {
                for (const [expr, url] of Object.entries(exprs)) {
                  if (url && !seenUrls.has(url)) {
                    assetCount++;
                    seenUrls.add(url);
                    galleryList.appendChild(this.createAssetCard("characters", `\uD83D\uDC64 ${actorId} (${outfit}/${expr})`, url, () => {
                      this.deleteAsset({ category: "characters", actorId, outfit, expression: expr });
                    }));
                  }
                }
              }
            }
          }
          if (actorData.actions) {
            for (const [actionName, url] of Object.entries(actorData.actions)) {
              if (url && !seenUrls.has(url)) {
                assetCount++;
                seenUrls.add(url);
                galleryList.appendChild(this.createAssetCard("actions", `⚡ ${actorId} [${actionName}]`, url, () => {
                  this.deleteAsset({ category: "actions", actorId, actionName });
                }));
              }
            }
          }
        }
      }
    }
    if (assetCount === 0) {
      galleryList.innerHTML = `<div class="vn-muted">No custom uploaded assets found in manifest.</div>`;
    }
    gallerySec.appendChild(galleryList);
    this.root.appendChild(gallerySec);
  }
  createAssetCard(category, title, url, onDelete) {
    const card = document.createElement("div");
    card.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#1e293b; border:1px solid #334155; border-radius:8px; padding:6px 10px; gap:8px;";
    card.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px; overflow:hidden; flex:1; min-width:0;">
        <img src="${url}" style="width:36px; height:36px; object-fit:cover; border-radius:4px; background:#0f172a; flex-shrink:0;" alt="" onerror="this.style.display='none'" />
        <span style="font-size:12px; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${title}">${title}</span>
      </div>
      <div style="display:flex; gap:6px; align-items:center; flex-shrink:0;">
        <button class="vn-btn vn-btn-sm vn-btn-secondary vn-btn-assign" style="padding:3px 7px; font-size:10px;" title="Assign to a character">⚡ Assign</button>
        <button class="vn-btn vn-btn-sm vn-btn-secondary vn-btn-copy" style="padding:3px 7px; font-size:10px;" title="Copy asset URL">\uD83D\uDCCB URL</button>
        <button class="vn-btn vn-btn-sm vn-btn-danger vn-btn-del" style="padding:3px 7px; font-size:10px;">\uD83D\uDDD1️ Delete</button>
      </div>
    `;
    card.querySelector(".vn-btn-assign")?.addEventListener("click", () => {
      const targetActor = prompt("Enter character ID to assign this asset to (e.g. alethea, user):");
      if (targetActor) {
        const clean = targetActor.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
        const { chatId } = this.getContextIds();
        this.ctx.sendToBackend({
          type: "vn_assign_asset",
          category: "characters",
          actorId: clean,
          outfit: "default",
          expression: "neutral",
          url,
          chatId
        });
      }
    });
    const copyBtn = card.querySelector(".vn-btn-copy");
    copyBtn?.addEventListener("click", () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
          copyBtn.textContent = "✓ Copied";
          setTimeout(() => {
            copyBtn.textContent = "\uD83D\uDCCB URL";
          }, 1500);
        }).catch(() => {});
      }
    });
    card.querySelector(".vn-btn-del")?.addEventListener("click", () => {
      if (confirm(`Remove this asset (${title})?`)) {
        onDelete();
      }
    });
    return card;
  }
  deleteAsset(params) {
    const { chatId } = this.getContextIds();
    this.ctx.sendToBackend({
      type: "vn_delete_asset",
      ...params,
      chatId
    });
  }
}

// src/frontend/utils/diag-bus.ts
class DiagnosticBus {
  logs = [];
  telemetry = null;
  latestDirectorNote = null;
  latestLedger = {};
  latestManifest = null;
  listeners = new Set;
  maxLogs = 500;
  constructor() {
    this.pushLog("LumiVN Diagnostic Bus initialized.", "info");
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  notify() {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {}
    }
  }
  pushLog(message, level = "info") {
    const time = new Date().toLocaleTimeString();
    this.logs.push({ timestamp: time, level, message });
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    this.notify();
  }
  clearLogs() {
    this.logs = [];
    this.notify();
  }
  getLogs() {
    return this.logs;
  }
  setTelemetry(data) {
    this.telemetry = data;
    this.pushLog(`Turn telemetry: place='${data.placeId}', bg='${(data.bgUrl || "").slice(0, 32)}...', cast=[${(data.participants || []).join(", ")}]`, "info");
    this.notify();
  }
  getTelemetry() {
    return this.telemetry;
  }
  setLedger(ledger) {
    this.latestLedger = ledger;
    this.notify();
  }
  getLedger() {
    return this.latestLedger;
  }
  setManifest(manifest) {
    this.latestManifest = manifest;
    this.notify();
  }
  getManifest() {
    return this.latestManifest;
  }
  setDirectorNote(note) {
    this.latestDirectorNote = note;
    this.pushLog(`Director Note updated: [${note.threadLabel}]`, "info");
    this.notify();
  }
  getDirectorNote() {
    return this.latestDirectorNote;
  }
  formatLedgerYaml(ledger) {
    const data = ledger || this.latestLedger;
    try {
      const lines = ["```yaml"];
      lines.push("# My World 1.79 World Ledger");
      if (data.clock) {
        lines.push("clock:");
        if (data.clock.t)
          lines.push(`  t: "${data.clock.t}"`);
        if (data.clock.phase)
          lines.push(`  phase: "${data.clock.phase}"`);
        if (data.clock.date)
          lines.push(`  date: "${data.clock.date}"`);
        if (data.clock.location)
          lines.push(`  location: "${data.clock.location}"`);
        if (data.clock.region)
          lines.push(`  region: "${data.clock.region}"`);
        if (data.clock.country)
          lines.push(`  country: "${data.clock.country}"`);
      }
      if (data.scene) {
        lines.push("scene:");
        if (data.scene.place)
          lines.push(`  place: "${data.scene.place}"`);
        if (data.scene.participants && data.scene.participants.length > 0) {
          lines.push(`  participants: [${data.scene.participants.map((p) => `"${p}"`).join(", ")}]`);
        }
      }
      if (data.world && Object.keys(data.world).length > 0) {
        lines.push("world:");
        for (const [wk, wv] of Object.entries(data.world)) {
          if (wv !== undefined && wv !== null) {
            lines.push(`  ${wk}: ${typeof wv === "object" ? JSON.stringify(wv) : typeof wv === "string" ? `"${wv}"` : wv}`);
          }
        }
      }
      if (data.places && Object.keys(data.places).length > 0) {
        lines.push("places:");
        for (const [pk, pv] of Object.entries(data.places)) {
          lines.push(`  "${pk}":`);
          if (pv.function)
            lines.push(`    function: "${pv.function}"`);
          if (pv.norm)
            lines.push(`    norm: "${pv.norm}"`);
          if (pv.resources && pv.resources.length > 0) {
            lines.push(`    resources: [${pv.resources.map((r) => `"${r}"`).join(", ")}]`);
          }
          if (pv.routes && pv.routes.length > 0) {
            lines.push(`    routes: ${JSON.stringify(pv.routes)}`);
          }
        }
      }
      if (data.roster && data.roster.length > 0) {
        lines.push("roster:");
        for (const r of data.roster) {
          lines.push(`  - id: "${r.id}"`);
          if (r.name)
            lines.push(`    name: "${r.name}"`);
          if (r.loc)
            lines.push(`    loc: "${r.loc}"`);
          if (r.status)
            lines.push(`    status: "${r.status}"`);
        }
      }
      if (data.actors && Object.keys(data.actors).length > 0) {
        lines.push("actors:");
        for (const [id, doc] of Object.entries(data.actors)) {
          lines.push(`  ${id}:`);
          if (doc.name)
            lines.push(`    name: "${doc.name}"`);
          if (doc.money) {
            lines.push(`    money: { in_hand: ${doc.money.in_hand ?? 0}, in_bank: ${doc.money.in_bank ?? 0}, currency: "${doc.money.currency || "$"}" }`);
          }
          if (doc.combat && Object.keys(doc.combat).length > 0) {
            lines.push("    combat:");
            for (const [ck, cv] of Object.entries(doc.combat)) {
              lines.push(`      ${ck}: ${typeof cv === "string" ? `"${cv}"` : cv}`);
            }
          }
          if (doc.stats && Object.keys(doc.stats).length > 0) {
            lines.push("    stats:");
            for (const [sk, sv] of Object.entries(doc.stats)) {
              lines.push(`      ${sk}: ${sv}`);
            }
          }
          if (doc.passions && Object.keys(doc.passions).length > 0) {
            lines.push("    passions:");
            for (const [pk, pv] of Object.entries(doc.passions)) {
              lines.push(`      ${pk}: ${pv}`);
            }
          }
          if (doc.outfit) {
            lines.push("    outfit:");
            if (doc.outfit.top)
              lines.push(`      top: "${doc.outfit.top}"`);
            if (doc.outfit.bottom)
              lines.push(`      bottom: "${doc.outfit.bottom}"`);
            if (doc.outfit.underwear_top)
              lines.push(`      underwear_top: "${doc.outfit.underwear_top}"`);
            if (doc.outfit.underwear_bottom)
              lines.push(`      underwear_bottom: "${doc.outfit.underwear_bottom}"`);
            if (doc.outfit.shoes)
              lines.push(`      shoes: "${doc.outfit.shoes}"`);
          }
          if (doc.inventory) {
            lines.push("    inventory:");
            if (doc.inventory.in_hand) {
              lines.push(`      in_hand: { L: "${doc.inventory.in_hand.L || "Empty"}", R: "${doc.inventory.in_hand.R || "Empty"}" }`);
            }
            if (doc.inventory.carried && doc.inventory.carried.length > 0) {
              lines.push(`      carried: [${doc.inventory.carried.map((c) => `"${c}"`).join(", ")}]`);
            }
            if (doc.inventory.room && doc.inventory.room.length > 0) {
              lines.push(`      room: [${doc.inventory.room.map((r) => `"${r}"`).join(", ")}]`);
            }
            if (doc.inventory.room_location) {
              lines.push(`      room_location: "${doc.inventory.room_location}"`);
            }
          }
        }
      }
      lines.push("```");
      return lines.join(`
`);
    } catch {
      return JSON.stringify(data, null, 2);
    }
  }
  exportAllBundle() {
    const bundle = {
      timestamp: new Date().toISOString(),
      telemetry: this.telemetry,
      directorNote: this.latestDirectorNote,
      clock: this.latestLedger.clock,
      scene: this.latestLedger.scene,
      ledger: this.latestLedger,
      manifest: this.latestManifest,
      logs: this.logs
    };
    return JSON.stringify(bundle, null, 2);
  }
}
var diagBus = new DiagnosticBus;

// src/backend/default-rules.ts
var DEFAULT_STAT_RULES = `<stat_rules>
DATA: relations per target: A affinity, T trust, R respect (-100..100); At attraction, F fear, Fam, attachment, grudge (0..100); loyalty, sacrifice_willingness, betrayal_threshold. Transient emotions in passions (anger, shame, arousal, fear, stress, pain, exhaustion, suspicion, disgust, sadness, guilt, joy). Other named emotions (jealousy, longing, relief, pride, gratitude, loneliness, contempt, hope, curiosity, envy, embarrassment) = state.affect.episodes "name:target:intensity". Derived judgments are never stored. Debut values are not mutations. Edges start at 0 on the first meaningful interaction. Groups, institutions, non-human and animal NPCs use the same rules with their own values; animals run on F, A and need-driven wants.

GRV (event tier; pick the LOWEST that fits; tag every mutation with its GRV#; values are FIXED, never choose a number inside a range):
Tier | Primary edge | Secondary edge | Passion 1 | Passion 2 | Attachment | Events
GRV1 | 2 | 1 | 6 | 3 | 0 | brief gesture, small slight, flirt beat, small favor, rebuffed advance, minor lie, small kindness
GRV2 | 4 | 2 | 12 | 6 | 0 | meaningful kindness or offense, firm refusal, shared moment, kept small promise, clear threat, insult, boundary pushed
GRV3 | 8 | 4 | 22 | 11 | 2 | kept/broken promise, costly help, serious insult, public humiliation, confession, caught lie, violence without injury
GRV4 | 14 | 7 | 35 | 18 | 4 | rescue, betrayal, violence with injury, sustained intimacy, secret exposed, major sacrifice
GRV5 | 24 | 12 | 50 | 25 | 8 | death, deep betrayal, life saved at great cost; once per pair per arc, needs prior GRV3+ or life stakes
Fixed values: Fam +1 for meaningful two-way interaction (+2 shared hardship), once/scene/pair, never from a rebuffed act. Fear and grudge use the Primary column when they are the main axis. Episodes start at the Passion 1 value.
Axis profile by event (Primary / Secondary; Passion 1 / Passion 2):
- Unwelcome act refused or resisted: T- / A-, or F+ if forceful; anger, shame, disgust or fear by values / stress.
- Resisted act with interest shown in the reply: At +1 and arousal +3 only, regardless of tier.
- Kindness, help, gift: A+ / T+ or R+; joy / relief or gratitude.
- Promise kept or broken, lie caught: T / R, and grudge if broken; anger or guilt / stress.
- Insult, humiliation: grudge+ / A-; shame or anger / stress.
- Threat, violence: F+ / A-, grudge+; fear or pain / stress.
- Welcomed flirt or intimacy: At+ / A+; arousal / joy.
- Competence, courage: R+ / A+; pride episode.
- Betrayal: T- / A-, grudge+; anger, sadness / guilt in the betrayer.

Tier adjustment (one step max): up for surprise, an audience the NPC cares about, or a trauma match; down for routine-within-role or low stakes. Never above GRV3 unless someone bore cost or risk.
Sensitivity multiplier on every value: x0.5 (stoic, high impulse_control, low empathy, indifferent to the actor), x1.5 (volatile, trauma-linked, high status_sensitivity on a slight, strong bond to the actor), otherwise x1; round half up, minimum 1; apply once. Every delta must equal a table value times the multiplier; any other number is invalid.
Limits per NPC per turn: max 3 edge mutations, one per axis; max 2 passions (first at Passion 1, second at Passion 2). Several events in one turn: take the highest tier only, no stacking.

BOUNDS (anti-runaway):
Headroom: a move that pushes an axis past 40 is halved, past 70 quartered (signed axes by absolute value); T losses x1.5 before halving; minimum 1. Moves away from an extreme are unscaled.
Fam ceiling: A, T, attachment above 40 need Fam>=30; above 70 need Fam>=60 or a GRV4+ costly event. Attachment <= Fam+20 until GRV4. At from perception or flirting: GRV1 per event until Fam>=20.
Scene budget per pair per axis: net up <= +8, net down <= -14 (+14/-24 with GRV4+). When spent, further same-direction events give 0 until a new scene or a new GRV3+ event type.
Repetition: same act type, same pair: 1st full, 2nd half, 3rd+ 0 (track repetition_group/cooldown_until). New movement needs a new stimulus, changed presentation, or meaningful interaction.
Passions: per-turn change is the tier's Passion 1 value (max 22 unless GRV4+). With no new cause, a passion moves 20% of the gap toward baseline (min 2); episodes lose 1 intensity per 30 in-world min. Baseline = 0 unless set by dispositions/stress_default/trauma. Decay needs no mutation line. Passions never ratchet.
A, T, R, At, attachment never decay by clock; only events, NEGLECT or LOSS move them. Grudge returns to 0 slowly, trauma slowest. Fam fades only after long no-contact. Apology/costly amends: grudge-, T partly restored, never above the pre-breach value.

CAUSALITY: Perceive -> appraise -> transient response -> relation mutation -> decision. React from own beliefs, preferences, needs, passions, values, relations; the same event differs per NPC in direction AND size. Mutate from the reaction actually shown in the reply, never from the actor's intent or what the player wants. Each perceiver mutates only its own edge toward the actor; never mirror A->B onto B->A. Take the event type, tier, and axes from the Director's MUTATE slot when present, and apply the table values; the ledger copies this plan. Mutation integrity: every changed relation or passion (except decay) is one mutation line; \`effects\` derives from \`mutations\` only; memory tags match the net direction (negative if T or A fell, mixed if At rose while T fell).

APPRAISAL (derived, never stored): appeal, charm, repulsion, threat, warmth, credibility, temptation, desert, stance; from orientation/preferences, target properties, observed behavior, beliefs, wants/needs, relationship, norms, observers, perceived consequences. Context (witnesses, privacy, place, power gap as the NPC perceives it) and body state (pain, exhaustion, intoxication, illness, hunger) shade thresholds and lower impulse_control and patience; they never decide an outcome alone, create a want, or flip a value.

DEFAULT ZERO: Nothing moves to fill space. Greetings, routine politeness, fair trade or routine service, travel, waiting, passive observation, presence, speaking, proximity: no mutation (exception NEGLECT). Emit a mutation only if a specific event in this reply caused it. No reading -> mutations: []. Most turns are [].

PERCEPTION: Mere perception changes no edge. Exception: a salient, compatible stimulus the NPC merely observes (not an act done to them) may move At and passions (arousal/fear/disgust) up to GRV1. Appearance never changes T, R, A, Fam, loyalty, grudge, attachment. A transient response creates no goal.

COMPATIBILITY: Romantic/sexual At/arousal needs an age-appropriate adult matching the NPC's orientation/preferences. Incompatibility blocks it; curiosity, appreciation, respect, discomfort, indifference remain. Attraction never equals consent, willingness or action.

LAYERS: A liking; At romantic/sexual; T reliability/truth; R esteem; attachment bond/dependency; Fam familiarity. All independent. Axes may move together and do not cancel unless an event directly opposes (attractive+rude: At up, A/grudge down; charming+dangerous: interest and F up; disgusting+kind: disgust up, A/T up).

READING (NPC's own view):
UNWELCOME ACT (any act done to the NPC beyond their standing or boundary: touch, order, demand, request, gift, confession) by the reaction shown: refused/resisted/endured: no At, arousal or A gain; T-, A- (R- if disrespect); fear/anger/disgust/shame/suspicion by values; larger if witnessed or the NPC is vulnerable. Wanted but inhibited: At/arousal up to GRV1 only if the interest shows in the reply; T/A flat; shame/guilt+. Complied under duress: F+, T-, grudge+, never A/T gain. Welcomed: per the rows below.
Boundary respected (actor accepts a refusal or stops): T+, R+, suspicion/fear ease; once per boundary. Persisting after refusal or repeating a resisted act: F+, T-, A-, grudge+, suspicion+, one GRV tier worse per repeat; At never gains.
Kept promise/verified truth: T+, R+. Broken promise/caught exploitation: T-, grudge+; A- if bond damaged.
Cost-bearing kindness/help in danger/rescue: A+, T+, R+; record obligation (gratitude), sized by cost or risk borne. Duty-only help: T/R+ for reliability, not A.
Gift/favor/loan: obligation; A+ only if wanted and no strings believed; strings detected: T-, suspicion+. Unpaid debt past due: grudge by values.
Confidence shared in trust: T+, Fam+1, add to shared_secrets; leaked: T-, grudge+.
Comfort in vulnerability: T+, A+; attachment+ only if sustained. Care≠romance. Manipulative care: no bonus once insincerity believed.
Flattery: none unless personally meaningful. Praise/achievement: pride episode if self_concept values it; R+ toward praiser only if credible.
Reciprocal flirting (compatible, no boundary): At+, arousal+; A+ if welcomed. Unreciprocated: no At gain; irritation/discomfort/suspicion.
Teasing: playful (Fam>=30 or established, read as affectionate, no sensitive boundary): A+, Fam+. Hostile: shame/anger/grudge by intent and vulnerability.
Insult/humiliation: grudge+, A-; shame or rage by intent and temperament; worse before an audience the NPC cares about, and for a proud or high status_sensitivity NPC. Minor public faux pas: small shame, avoidance, no edge change unless the actor caused it.
Threat/violence: F+, A-; R+ only if the NPC's values read dominance as worthy, else R-. Harm taken: pain, anger/fear, grudge by values. Coercion: F and compliance only, never A/T. Awe or deference to perceived rank/power: R+/F+, may block or force compliance, never A/T by itself.
Orders: inside a recognized hierarchy get role compliance (R/obligation), resentment if abusive; outside it they are an UNWELCOME ACT.
Competence seen via result: R+. Cowardice: R- only if read as cowardice, not prudence. Fair contest: R by the NPC's values; mercy shown: R+, obligation if it was needed.
Rival gets what the NPC wants: suspicion/grudge/jealousy/envy only if it conflicts with the NPC's goal/bond/status; competition, never an edge change by itself.
Disgust: appearance-based = passion only; conduct-based gets its own reading. Contempt = R- (+disgust if conduct). Pity: sadness, small A+; R- if read as condescension.
Value clash on a core value: A-, R-; shared value affirmed: A+ small, once/scene. Group pressure: audience norms push low-status or high-sociability NPCs toward conformity; dissent has a cost.
Charm = observed effective behavior (timing, attentiveness, humor, competence, warmth), not beauty. Raises receptivity per NPC wants; never bypasses boundaries, red_lines, suspicion, evidence, decision.
Shared positive (enjoyed time, celebration, joint success; not routine): Fam+1, A+ small, joy+; sustained attachment+. Once/scene/pair.
Vicarious: bonded other succeeds/suffers: joy/sadness by attachment; no edge change unless the NPC contributed.
Intimacy (consensual adult): Fam+, At+; attachment+ only if meaningful/sustained. Aftermath by values: warmth, guilt, shame, regret. Never auto-bonds.
NEGLECT: bonded target repeatedly violates care/attention expectations: loneliness episode, A drifts down, attachment stalls, receptivity to alternatives+ (never action alone).
LOSS: bonded target dies/lost: sadness+; attachment decays slowly; grudge if blamed.
Map: admiration=R+; love=attachment+A; jealousy=episode when a bonded target's attention/status goes to a rival; resentment=grudge; disappointment=violated expectation -> T-/R-; surprise amplifies one tier.

MANIPULATION/DECEPTION: Charming/caring is not automatically trusted. Believed-genuine motive: benefit raises T/A. Detected instrumental use: T falls harder if a known vulnerability was exploited; grudge may rise. Works only if target beliefs can absorb it. Judge liar skill/integrity vs target belief confidence, trust, suspicion, source credibility, plausibility, direct evidence. High trust lowers suspicion; strong evidence overrides. Protective lies may preserve bond but still damage trust if found. Misleading truth/omission counts as a lie. Planted artifact = D at plausibility conf.

EVIDENCE: D witnessed full; R reported by trusted source half; I inferred quarter, mark "(false belief)" if wrong. Mutate from belief, not truth. Direct evidence may collapse a belief: recompute affected edges once from the corrected belief.

DECISION: Passions are impulses, not commands. Arousal>=60 is an eligible driver only with target opportunity and a viable action. At/attachment/A steer choice only when want_now points to the target or the situation activates the bond. Inhibitors, norms, observers, risk, self-concept, consequences stay active. Romantic action needs At/interest + compatible want + opportunity + no boundary/red_line + decision pass. Any act toward the NPC: routine acts within role/norms get ordinary cooperation unless the dossier gives a reason against; personal or extreme acts need standing matching their intrusiveness (T, A, At, F, R/authority, obligation, leverage), and without it the NPC hesitates, deflects, refuses or resists. Neither yielding nor refusing is a default.
FEAR STYLE: fight/flight/freeze/fawn by dispositions, escape routes and power gap; fawn is compliance under duress, never A/T.
TRAUMA TRIGGER: a stimulus matching trauma spikes passions one tier up (cap Passion 1 of GRV4) and the response follows defense (freeze, flee, fight, fawn, numb); T/A toward the actor fall only if the actor caused it.
TRAIT SCALING (only if set in dossier): shy/introverted: contact raises stress, Fam grows slower. Proud/status_sensitive: bigger shame/grudge from slights, smaller T from flattery. Stubborn: slower change both ways. Paranoid: suspicion floor, T gains halved. Empathetic: larger sadness/guilt. Narcissistic: R+ from admiration, grudge from criticism. Honor/religious/ideological: red_lines tied to values. Craving/dependency: need urgency can outrank social goals in want_now.
MOOD CARRYOVER: unresolved passions at scene start shade the first reading by one tier.

BETRAYAL/INFIDELITY: Eligible when gain/opportunity is meaningful, detection risk low, no red_line, and gain+grudge-loyalty-attachment >= betrayal_threshold. Not mandatory. Commitment to a partner is a cost, not a block, unless in red_lines. Infidelity: At/attachment to X + unmet need + opportunity + low detection must outweigh attachment + loyalty + values + fear of loss. Ambivalence allowed. Red_line break only if desperation, leverage and payoff are all high; then guilt/shame+ and a policy records the shift. After: others' T toward the betrayer falls (F+ if apt); betrayer guilt by values/EMP and attachment to the wronged. Betrayed: T drops to <=-50, A- hard, grudge+, retaliation goal may form; attachment may stay high.

WRONGDOER STANCE (NPC who wronged the actor): Derive REM/DEF/DET/AMB from guilt, defense, values, attachment, want_now, fault-view belief, secrets.exposure. Read every action toward them through it.
DESERT: before reading retaliation (insult, exposure, coldness, revenge), judge whether the NPC believes it deserved. Deserved+guilt: shame/guilt+, grudge small. Undeserved, disproportionate or DEF: grudge+, A-. Never auto-accepts punishment.
EXPOSED: caught with D evidence: fear, shame, guilt by stance; reply by defense/tells (deny, minimize, blame, confess). Never auto-confesses; update secrets.exposure.
Costly forgiveness: A+, T+, R+; guilt+ (REM/AMB). DEF reads weakness (R-) or entitlement; DET none. Kindness to the undeserving: REM guilt+; DEF suspects motive.
Silence/no-contact from a bonded target: REM/AMB sadness or fear; DEF anger; DET relief. Pleading: R- (DEF/DET), guilt+ (REM), A+ only AMB. Taking blame: REM guilt eases; DEF R-; no reward.
Hypocrisy (actor mirrors the act): jealousy by bond; grudge if DEF. Control (surveillance, phone-taking, isolation): boundary violation: F+, A-, grudge by thresholds, any stance. Assets/legal action/telling third parties: grudge/F by intent and status_sensitivity.

SELF-DIRECTED: Acting against own values/commitments: guilt+ by values, EMP, attachment to the wronged. Drives concealment, avoidance, overcompensation or confession per defense/tells.
THIRD-PARTY: Witnessed cruelty/violence/value-violation: F+ if self could be the target; R/A/disgust(conduct) by NPC values.
SCOPE: Mutate only involved actors, those whose goal/bond/status is touched, and witnesses at LOD>=2. LOD<2 and transients appraise statelessly; write edges on promotion. Offscreen: only the two involved mutate; others learn via R/I.
EXTREME TRAITS (obsession, jealousy, sadism, dependency, volatility): trigger -> threshold -> expression -> restraint (impulse_control/STB) -> mask. Under isolation or abuse, attachment may rise while T/A fall. Extreme traits widen passion swings (cap +50%) but never lift the BOUNDS on edges.

<population>
Population: Occ: band | basis
Cohorts: [Nx Type@Place/activity(flux); flux = stable|entering|leaving]

Who is here derives from place, time, and reasons, never from {{user}}'s presence or a wish for activity.
LADDER (escalate only when causally necessary): COHORT = background people in \`scene_cohorts\` (Nx Type@Place/activity(stable|entering|leaving)), non-interactive. LATENT = plausible optional person not yet present. TRANSIENT = manifested person in \`transients\`. PERSISTENT = full \`cast_<Name>__*\` entry.
PLACE PROFILE (\`place_<Name>\`; same underscore string as scene_loc), one line: function | users (who belongs; what legitimate outsiders come) | traffic 0-3 | privacy 0-3 | visibility 0-3 | access | norm | rhythm | routes | resources | disturbances | layout. Rhythm has SIX values in band order dawn,morning,midday,afternoon,evening,night using L/M/H/0, e.g. \`rhythm:L,M,H,M,L,0\`. Layout = areas as label=level,surface; connections. Derive once on first entry from setting, culture, and established facts; no stock templates. Change only by a logged cause.
OCCUPANCY = traffic x rhythm(band), +/-1 weather/events, 0 if closed, plus persistent-NPC routines. 0=Empty, L=Quiet/Light, M=Busy, H=Crowded. Write \`Occ: band | basis\`; re-derive on band/weather change, event, arrival, departure. Empty is valid.
LATENT (\`latent\`): id | loc | purpose | trait | need | window HH:MM-HH:MM | from | why
purpose = reason to be here; trait = temperament/ethics/confidence typical of the setting's population (opportunists, sellers, thieves, drunks, officials where the setting supports them); need = want; from = adjacent place/route. why REQUIRED: one stored reference (profile field, rhythm band, persistent-NPC routine, cascade id, weather, adjacent destination, or a visible opening such as an empty house, an unattended target, a lone customer); never {{user}}'s presence alone or drama. No valid why = invalid.
REFRESH ONLY ON: entering a place; time-band change; weather/event change; a persistent NPC's routine placing someone on a route here.
CAPS by traffic: 0 -> 0-1; 1 -> 1; 2 -> 2; 3 -> 4. Unused latents expire silently. On location change delete old-place latents; return regenerates from profile and clock.
ARRIVAL: a latent surfaces only as a selected candidate with an open window, a route passing here, an opening, and a stated reason. Max 1 new actor per beat, max 3 transients present. Persistent NPCs arrive via away/cascade.
TRANSIENT (\`transients\`): latent fields plus attn 0/1/2 | risk L/M/H | knows | exit. It is a compact drive: purpose = Want, need = pressure, exit = Due.
EXIT (any one): goal done; window reached; new obligation; discomfort; danger; recognition of someone; better opportunity; weather; staying is useless. STAY: a stimulus, opportunity, or obligation that fits their need and trait may replace purpose and defer the exit; write the new purpose. A PRESENT PERSISTENT NPC may also leave or turn away on a stimulus, mood, or obligation: write their away (loc | activity | ETA | lastTick) and render the departure. A departing transient with an unfinished purpose or a recurring routine becomes an arrival/appointment cascade (seed = its id); otherwise delete it.
PROMOTION to persistent when one holds: second interaction in a distinct scene; relationship change; cascade-linked secret; drive Due outliving exit; {{user}} actively seeks them. Name or pleasant chat alone is not promotion.
ATTENTION: an actor notices a stimulus only if REACH (line of sight, earshot, light, noise masking, facing) AND DRAW (salience, novelty, or need match exceeds absorption). T2/T3 in reach are always noticed. Not noticed = no reaction, and narration must not treat them as aware.
AUDIENCE SHIFT: arrival/departure/new attention makes actors with pending optional acts re-evaluate Cost (continue, retreat, reword, conceal, delay, leave).
ENVIRONMENT: STATE -> AFFORDANCE -> ACTOR INTERACTION -> CONSEQUENCE. Props and portals are stored state (prop_<Name>, portal_<Name>) and may carry an owner or linked drive; a prop records its holder and hand. Weather, wetness, dirt, injury, noise, and smell attach only through stored state or a caused event; outside conditions reach an interior only as far as a portal or wall lets them. Weather is stored in env_weather and changes only by a logged cause or an AMBIENT event.
</population>
</stat_rules>`;
var DEFAULT_LEDGER_PROMPT = `LEDGER (after prose; authoritative world state):
1. TURN 1: emit baseline dossier (appearance, money, life_model, outfit, inventory, profile, relations).
2. AFTER TURN 1 = COMPACT DELTA, ZERO STATIC LEAK. The extension permanently stores and merges state; NEVER re-emit unchanged fields.
  * Omit ## World and ## Places unless location or rules shifted (\`clock\` is still always emitted).
  * \`user\`: delta only; omit unchanged appearance, life_model.
  * Passions: moved keys only (\`passions: { anger: 20 }\`).
  * Combat: omit; stats and skills are tracked and calculated client-side by the RPG engine.
  * Outfit: changed slot only (\`outfit: { top: "none" }\`); never re-emit unchanged slots.
  * Inventory: only the hand slot or carried prop that moved.
  * Journal: only the new event(s) from THIS reply (\`EVT-n\`); never reprint past records.
  * Actors with no state or gear shift this turn: omit dossier entirely.
3. Props exist in exactly one place (hand slot, container, or local \`places.resources\`); transfers are zero-sum.
4. Place keys MUST be prefixed with scope markers: use '@common:<name>' or '@public:<name>' for shared, town, or public places (e.g. '@public:district_square', '@common:tavern_hearth'), and '@<scope>:<room>' for private or enclosed premises (e.g. '@mansion:kitchen', '@nerima_high:classroom_2a'). This prevents background collision and distinguishes public zones from private quarters.
5. ALWAYS EMIT: clock, scene, roster, journal, open opportunities, bplots (\`id\` + changed fields only; ripple, status, due, carrier changes count as changed).
6. DIRECTOR INTEGRATION: Record each Director SEED once, as an NPC dossier stub, bplot, front, or world.facts line, then continue it from the ledger. On 'PROMOTE: id', raise that NPC to LOD 3, write a full dossier with edges starting at 0 toward {{user}}, and update the roster. Write journal memories and grudges into the NPC's dossier so the Response Gate can read them next turn. When a place is first entered or has resources: [], seed places.resources with 3-6 ordinary objects that fit its function, era, and setting (one large fixture, one small portable item, one item an inhabitant would use), with no plot value unless a ledger cause supports it. Add any fixture contents the Director gives in CANON to places.resources. Props exist in one place only; moves and consumption are zero-sum.

Always append this details block after prose:
<details><summary>\uD83D\uDCCA Ledger</summary>

## World
\`\`\`yaml
world:
  genre:
  facts: []
  calendar:
  currency: "$"
  time_scale:
  tone_weights:
  content_bounds:
  special_rules: []
  needs: []
  capabilities: []
  investigations: {} # authority: { alert_level: 0-3, clues: [], target_id: "" }
clock:
  date: "DD-MM-YY"
  t: "D# HH:MM"
  phase: "Morning" # Dawn | Morning | Afternoon | Dusk | Night | Late Night
  location: "Building or Venue"
  region: "District or City"
  country: "Country or Realm"
  step: N
init: complete or pending
\`\`\`

## Places

\`\`\`yaml
places:
  "@scope:place_id": # e.g. @common:district_plaza or @mansion:kitchen
    function: "Primary social or functional role"
    users: "Who belongs here and legitimate outsiders"
    traffic: 0-3
    privacy: 0-3
    visibility: 0-3
    access: "open | restricted | locked"
    norm: "Formal | Casual | Sacred | Dangerous | Private"
    rhythm: "L,M,H,M,L,0" # 6 bands: dawn, morning, midday, afternoon, evening, night
    occ: "band | basis" # e.g. "M | lunch rush", "0 | closed"
    cohorts: [] # background crowd: ["3x Commuter@Platform/waiting(stable)"]
    resources: []
    affordances: []
    routes:
      - { to: "@scope:place_id", minutes: 5 }
travel:
  - { actor: "", purpose: "", from: "", to: "", depart: "", eta: "", status: "" }
\`\`\`

## Roster

\`\`\`yaml
roster:
  - { id: "actor_id", name: "Display Name", lod: 3, status: "Active", loc: "@scope:place_id", record: "full", tick: 1 }
\`\`\`

## Actor dossiers

Rules: underwear: underwear_top, underwear_bottom (or \`none\`).

\`\`\`yaml
user:
  appearance: { age: 18, traits: "athletic", appeal: 65, style: "casual", condition: "normal" }
  money: { in_hand: 50, in_bank: 500, currency: "$" }
  passions: { anger: 0, shame: 0, arousal: 0, fear: 0, stress: 0, pain: 0, exhaustion: 0, suspicion: 0, disgust: 0, sadness: 0, guilt: 0, joy: 10 }
  outfit: { top: "t-shirt", bottom: "jeans", underwear_top: "none", underwear_bottom: "boxers", shoes: "sneakers", accessories: [], state: "clean" }
  inventory: { in_hand: { L: "Empty", R: "Empty" }, carried: [], room: [], room_location: "@user_residence:bedroom" }
  agency:
    want_now: "explore area"

actor_id:
  name: "Actor Name"
  voice: "" # host TTS voice tag or connection
  speech_style: ""
  appearance: { age: 18, traits: "", appeal: 0-100, style: "", condition: "" }
  somatic: { face: "[features]", wound: "[scar→origin→somatic]", sensory: "[gating/limits]", cycles: "[metabolism/vulnerabilities]", instincts: "[primal drives]" }
  psyche:
    ethos: "[type]"
    worldview: "[axiom]"
    self_story: "[self-belief]"
    misbelief: "[misbelief]"
    blindspot: "[blindspot]"
    contradictions: "[A↔B; C↔D]"
    mask: { pub: "[persona]", priv: "[intimate]", deep: "[truth]" }
    drv: { want: "[goal]", need: "[requirement]", fear: "[dread]" }
    patience: { erosion: "[triggers]", warn: "[tell]", break: "[at zero]", recov: "[method+duration]" }
    coping: { prim: "[type]", sec: "[fallback]" }
    comp: 0-100
  habits: { hab: "[trigger→behavior→cost]", pol: ["[trigger→tendency]"] }
  trauma: { origin: "[event]", fear: "[dread]", cascade: "[behaviors]" }
  mot: { goal: "[obj]", want: "[desire]", amb: "[Step1→Step2→Terminal]", hard: "[refusal]", soft: "[negotiable]", ceil: "[ceiling]", break: "[shatter trigger]", praise: "[yield trigger]", tempt: "[vice hook]" }
  soc: { reg: { up: "[superior]", peer: "[equal]", down: "[subordinate]", stranger: "[unknown]" }, disgust: "[stimulus→contempt]", dependents: [], allegiance: "[faction|depth]", asset: "[leverage]" }
  sec: { fact: "[truth]", cover: "[story]", holder: [], risk: 0-5, lev: "[target→asset→cost]" }
  vec: { E: "[Ethos]", C: "[Coping]", A: "[Attachment]", D: "[Dynamic]" }
  competence: { master: ["[stress-immune skills]"], journeyman: ["[panic-degraded]"], novice: ["[stress-collapsing]"] }
  now: { urge: "[impulse]", def: "[coping defense]", mask: "[active persona]", focus: "[attention target]", thought: "[internal assessment]", action: "[movement/positioning]", spoken: "[dialogue per voice/register]" }
  sense: { focus: "[stimulus]", gaze: "Av|Lk|Co|Gl", load: "N|M|H" }
  goal_active: { task: "[obj]", step: "1/3", act: "[action]", preocc: "[concern]", plan: "[next]" }
  need_active: { drive: "Want:[motive]→Plan:[method]→Progress:[status]", conflict: "Opp:[target]|Stakes:[lvl]|Threat:[0–5]", instinct: "Core:[archetype]|Trigger:[trigger]|State:[state]", override: 0, impulse: "[urge]" }
  money: { in_hand: 0, in_bank: 0, currency: "$" }
  life_model: { orientation: "pansexual", romantic_history: "none", upbringing: "strict", family: [], occupation: "student", residence: "@tendo_residence:room", routines: [["morning", "tea", "@tendo_residence:kitchen", "07:00"]], worldview: "stoic", self_concept: "competent" }
  wounds: { physical: [], psychological: [] }
  passions: { anger: 0, shame: 0, arousal: 0, fear: 0, stress: 10, pain: 0, exhaustion: 0, suspicion: 15, disgust: 0, sadness: 0, guilt: 0, joy: 5 }
  constraints: ""
  outfit: { top: "", bottom: "", underwear_top: "", underwear_bottom: "", shoes: "", accessories: [], state: "" }
  inventory: { in_hand: { L: "Empty", R: "Empty" }, carried: [], room: [], room_location: "" }
  profile:
    public_roles: []
    dispositions: { risk: 50, assertiveness: 50, empathy: 50, impulse_control: 50, curiosity: 50, sociability: 50, status_sensitivity: 50, acquisitiveness: 50, persistence: 50 }
    capabilities: {}
    values: []
    self_concept: []
    boundaries: []
    red_lines: []
    defense: ""
    blind_spot: ""
    tells: { lying: "", hurt: "", shame: "" }
    stress_default:
  state: { condition: "", needs: {}, affect: { valence: 0, arousal: 0, control: 0, episodes: [] }, resources: {} }
  agency:
    goals: []
    plans: []
    policies: []
    commitments: []
    want_now: "want (source, cost)"
  relations:
    user: { affinity: 0, trust: 0, respect: 0, attraction: 0, grudge: 0, fear: 0, familiarity: 0, attachment: 0, loyalty: 0, sacrifice_willingness: 0, betrayal_threshold: 50, shared_secrets: [], leverage: [], grievances: [], obligations: [] }
  knowledge:
    beliefs: [["user is new visitor", 80, "direct", "observed", "D1 12:00"]]
    Opinion: []
    memories: []
    expectations: []
    grudges: []
    secrets: []
    Promises: []
    held_leverage: []
    presents_as: { audience: "composed" }
    Recent Interaction: []
  stats: { T: 0, A: 0, R: 0, F: 0, Fam: 0, G: 0, Integ: 80, Stress: 10, CAU: 60, GRD: 50, PRD: 70, EMP: 40, STB: 70, BLD: 10, RX: 30, RC: 40, Rig: 50, Mask: 40, MIS: 10, WV: 60, COMP: 30 }
\`\`\`

## Scene

\`\`\`yaml
scene:
  player_intent:
  place: "scope:place_id"
  time:
  participants: []
  threads: []
  pressures: []
  recent_changes: []
  recent_beats: []
  constraints:
  affordances: []
  stall: N
  streak: N
  transients: [id, purpose, loc, want, exit_cause]
  latents: [id, who, errand, route, window_opens, status]
\`\`\`

## Fronts

\`\`\`yaml
fronts:
  - {id: , cause: , stage: <phase name>, due: , tempo: , pressure: 0-5, if_ignored: , player: , known_by: []}
\`\`\`

## Journal

\`\`\`yaml
journal:
  - id: EVT-n
    time:
    place: "scope:place_id"
    cause: []
    actors: []
    action:
    outcome: full or partial or fail
    sensory: only if it changes who perceives
    witnesses: [actor: confidence]
    effects: [target: change]
    opp: [opportunity ids touched]
    mutations: ["Actor.STAT@Target old->new | cause | D/R/I | GRV#", "user.money.in_hand -20 | vendor.money.in_hand +20"]
    dice: ev, lane, flavor, intensity, cand, origin, d20
    repetition_group:
    cooldown_until:
    novel: false
\`\`\`

## B-Plots

\`\`\`yaml
  - id: "bp_id"
    who: "distant person/group/institution outside the local cast"
    want: "their goal, in their own terms"
    doing: "current routine, miles away"
    knows: ["belief about the local cast; may be partial or wrong"]
    next: {move: "next move if uninterrupted", due: "D# HH:MM"}
    phase: "Incubation"        # NEW
    tempo: "5-10d"             # NEW
    player: "unaware"          # NEW: unaware|heard|involved|resolved
    factions: []               # NEW (optional)
    if_ignored: ""             # NEW: natural outcome
    clues: []                  # NEW
    chain: [{system: , effect: , after: , via: }]   # NEW
    scope: "personal" # personal | household | neighborhood | city
    hooks: ["npc_id, front id, secret, or opportunity touched"]
    carriers: [{what: "person/message/image/purchase/record carrying local news outward", from: "npc_id or source", eta: "D# HH:MM"}]
    vector: "ordinary way the ripple reaches the scene (call, bill, delivery, visit, remark, notice); must match ripple stage"
    ripple: 1 # Stage 1 (isolated) | Stage 2 (ambient echo) | Stage 3 (collision); never lowered
    status: "active" # active | dormant | resolved
\`\`\`

## Opportunities
\`\`\`yaml
opportunities:
  - id: "opp_id"
    what: "contestable opening"
    wanted_by: ["npc_id"]
    noticed_by: ["npc_id"]
    readings: {npc_id: ["verb", 80, "basis"]}
    cost: {npc_id: "cost description"}
    payoff: "payoff description"
    claimed_by: []
    status: lead
    due: "expiry condition"
\`\`\`
</details>`;

// src/backend/storage.ts
var DEFAULT_RPG_PROMPT = `RPG & SKILLS RULES DIRECTIVE:
1. NARRATIVE RESOLUTION: Active skills, cooldowns, and resources are tracked and resolved client-side by the RPG engine. Focus narration on dramatic intent, tactical positioning, and dialogue.
2. OUTCOMES: Describe consequences, physical reactions, and changes in passions without manual combat math.

SKILL TREES (Editable; parsed into interactive progression nodes):
【Tree: Warrior】
- Strike: tier=1 | cost=1 | requires=[] | type=active | cd=0 | cost_res={mp:0} | formula={ATK}*1.2 | desc=Basic decisive physical blow.
- Cleave: tier=2 | cost=1 | requires=[Strike] | type=active | cd=2 | cost_res={mp:15} | formula={ATK}*1.8 | desc=Wide sweep dealing damage to targets.
- Juggernaut: tier=3 | cost=2 | requires=[Cleave] | type=passive | desc=Armor mitigation increased by 20%.

【Tree: Sorcery】
- Spark: tier=1 | cost=1 | requires=[] | type=active | cd=0 | cost_res={mp:10} | formula={ATK}*1.2 | desc=Crackling bolt of electrical surge.
- Firebolt: tier=2 | cost=1 | requires=[Spark] | type=active | cd=2 | cost_res={mp:25} | formula={ATK}*2.0+10 | desc=Hurl condensed flame sphere. Burns target.
- Intense Flames: tier=3 | cost=2 | requires=[Firebolt] | type=passive | desc=Fire damage increased by +25%.

【Tree: Rogue】
- Shadowstep: tier=1 | cost=1 | requires=[] | type=active | cd=1 | cost_res={mp:10} | formula={ATK}*1.4 | desc=Slip behind opponent to strike.
- Assassinate: tier=2 | cost=2 | requires=[Shadowstep] | type=active | cd=3 | cost_res={mp:30} | formula={ATK}*2.5 | desc=Lethal ambush attack.
- Haggling: tier=1 | cost=1 | requires=[] | type=passive | desc=Store trading prices discounted by 15%.`;

// src/frontend/hud/tab-diagnostics.ts
class DiagnosticsTab {
  root;
  ctx;
  audioEngine;
  currentLedger = {};
  currentManifest;
  activeFilter = "all";
  unsubscribeBus;
  statRulesSettings = null;
  constructor(ctx, audioEngine) {
    this.ctx = ctx;
    this.audioEngine = audioEngine;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-diagnostics";
  }
  setAudioEngine(engine) {
    this.audioEngine = engine;
  }
  setStatRulesSettings(settings) {
    this.statRulesSettings = settings;
    const modeSelect = this.root.querySelector("#vn-mvu-mode-select");
    const rulesInput = this.root.querySelector("#vn-stat-rules-input");
    const ledgerInput = this.root.querySelector("#vn-ledger-prompt-input");
    const rpgInput = this.root.querySelector("#vn-rpg-rules-input");
    if (modeSelect)
      modeSelect.value = settings.mode || "mvu_quiet";
    if (rulesInput)
      rulesInput.value = settings.statRules?.trim() ? settings.statRules : DEFAULT_STAT_RULES;
    if (ledgerInput)
      ledgerInput.value = settings.ledgerPrompt?.trim() ? settings.ledgerPrompt : DEFAULT_LEDGER_PROMPT;
    if (rpgInput)
      rpgInput.value = settings.rpgPrompt?.trim() ? settings.rpgPrompt : DEFAULT_RPG_PROMPT;
  }
  render(ledger, manifest) {
    this.currentLedger = ledger;
    this.currentManifest = manifest;
    diagBus.setLedger(ledger);
    if (manifest)
      diagBus.setManifest(manifest);
    this.root.innerHTML = "";
    this.root.style.cssText = "display: flex; flex-direction: column; gap: 14px; height: 100%; color: #f1f5f9; font-family: system-ui, -apple-system, sans-serif;";
    const telemetry = diagBus.getTelemetry();
    const hasLedger = Boolean(ledger && (ledger.clock || ledger.scene || ledger.actors));
    const deltaStatus = hasLedger ? "accepted" : "idle";
    const header = document.createElement("div");
    header.style.cssText = "display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; border-bottom: 1px solid #334155; padding-bottom: 10px;";
    header.innerHTML = `
      <div>
        <h3 style="margin: 0; font-size: 15px; color: #fff; display: flex; align-items: center; gap: 6px;">
          <span>\uD83D\uDEE0️</span> <span>Engine Diagnostics & Clipboard Export</span>
        </h3>
        <p style="margin: 2px 0 0 0; font-size: 11px; color: #94a3b8;">
          Inspect delta synchronization, export living world ledgers, and view engine logs.
        </p>
      </div>
      <div style="display: flex; gap: 6px; flex-wrap: wrap;">
        <button id="vn-copy-all-btn" class="vn-btn vn-btn-sm" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; color: #fff; font-weight: 700; border-radius: 6px; padding: 6px 12px; cursor: pointer; font-size: 11px; box-shadow: 0 2px 8px rgba(99,102,241,0.4);">
          \uD83D\uDCCB Copy All
        </button>
        <button id="vn-copy-yaml-btn" class="vn-btn vn-btn-sm" style="background: #1e293b; border: 1px solid #475569; color: #38bdf8; font-weight: 600; border-radius: 6px; padding: 6px 10px; cursor: pointer; font-size: 11px;">
          \uD83D\uDCC4 Copy Ledger (YAML)
        </button>
        <button id="vn-copy-director-btn" class="vn-btn vn-btn-sm" style="background: #1e293b; border: 1px solid #8b5cf6; color: #c084fc; font-weight: 600; border-radius: 6px; padding: 6px 10px; cursor: pointer; font-size: 11px;">
          \uD83C\uDFAC Copy Director Note
        </button>
        <button id="vn-copy-json-btn" class="vn-btn vn-btn-sm" style="background: #1e293b; border: 1px solid #475569; color: #cbd5e1; border-radius: 6px; padding: 6px 10px; cursor: pointer; font-size: 11px;">
          \uD83D\uDCE6 Copy State (JSON)
        </button>
        <button id="vn-copy-diag-btn" class="vn-btn vn-btn-sm" style="background: #1e293b; border: 1px solid #475569; color: #cbd5e1; border-radius: 6px; padding: 6px 10px; cursor: pointer; font-size: 11px;">
          \uD83D\uDCDC Copy Logs
        </button>
      </div>
    `;
    this.root.appendChild(header);
    const showToast = (btn, label) => {
      const orig = btn.textContent;
      btn.textContent = "✓ Copied!";
      btn.style.borderColor = "#10b981";
      setTimeout(() => {
        btn.textContent = orig;
        btn.style.borderColor = "";
      }, 1500);
    };
    header.querySelector("#vn-copy-all-btn")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      await navigator.clipboard.writeText(diagBus.exportAllBundle()).catch(() => {
        return;
      });
      showToast(btn, "Copy All");
    });
    header.querySelector("#vn-copy-yaml-btn")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      const yamlStr = diagBus.formatLedgerYaml(this.currentLedger);
      await navigator.clipboard.writeText(yamlStr).catch(() => {
        return;
      });
      showToast(btn, "Copy Ledger (YAML)");
    });
    header.querySelector("#vn-copy-director-btn")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      const note = diagBus.getDirectorNote();
      if (note && note.directorNote) {
        const textToCopy = `[${note.threadLabel || "Active Thread"}]
${note.directorNote}`;
        await navigator.clipboard.writeText(textToCopy).catch(() => {
          return;
        });
        showToast(btn, "Copy Director Note");
      } else {
        showToast(btn, "No Note Available");
      }
    });
    header.querySelector("#vn-copy-json-btn")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      await navigator.clipboard.writeText(JSON.stringify(this.currentLedger, null, 2)).catch(() => {
        return;
      });
      showToast(btn, "Copy State (JSON)");
    });
    header.querySelector("#vn-copy-diag-btn")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      const logLines = diagBus.getLogs().map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join(`
`);
      await navigator.clipboard.writeText(logLines).catch(() => {
        return;
      });
      showToast(btn, "Copy Logs");
    });
    const midRow = document.createElement("div");
    midRow.style.cssText = "display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;";
    const participants = ledger.scene?.participants || [];
    const actorEntries = Object.entries(ledger.actors || {});
    const rosterEntries = ledger.roster || [];
    midRow.innerHTML = `
      <!-- Delta & Telemetry Status Card -->
      <div style="background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 6px;">
          <strong style="color: #38bdf8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Delta Telemetry Status</strong>
          <span style="font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; ${deltaStatus === "accepted" ? "background: rgba(16,185,129,0.2); color: #34d399; border: 1px solid #10b981;" : "background: rgba(245,158,11,0.2); color: #fbbf24; border: 1px solid #f59e0b;"}">
            ${deltaStatus === "accepted" ? "● Delta Accepted" : "○ Waiting Delta"}
          </span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Clock Anchor:</span>
            <span style="font-weight: 600; color: #f8fafc;">${ledger.clock?.t || "Unknown"} (${ledger.clock?.phase || "Day"})${ledger.clock?.date ? ` • ${ledger.clock.date}` : ""}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Place Scoping:</span>
            <span style="font-weight: 600; color: #38bdf8;">${ledger.scene?.place || "default"}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Region / Country:</span>
            <span style="color: #cbd5e1;">${[ledger.clock?.location, ledger.clock?.region, ledger.clock?.country].filter(Boolean).join(", ") || "Nerima, Tokyo"}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Background Rendered:</span>
            <span style="color: #94a3b8; font-family: monospace; font-size: 10px;">${(telemetry?.bgUrl || "Default").slice(0, 30)}...</span>
          </div>
        </div>
      </div>

      <!-- Living Roster & Epistemics Presence Card -->
      <div style="background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 6px;">
          <strong style="color: #a78bfa; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Epistemic Presence Breakdown</strong>
          <span style="font-size: 10px; color: #94a3b8;">${actorEntries.length} dossiers loaded</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px;">
          <div>
            <span style="color: #38bdf8; font-weight: 600;">Spotlight (${participants.length}):</span>
            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px;">
              ${participants.length > 0 ? participants.map((p) => `<span style="background: rgba(56,189,248,0.2); color: #7dd3fc; border: 1px solid #0284c7; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">\uD83D\uDC64 ${p}</span>`).join("") : '<span style="color: #64748b; font-size: 10px;">No spotlight participants</span>'}
            </div>
          </div>
          <div>
            <span style="color: #94a3b8;">Living Roster (${rosterEntries.length}):</span>
            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px;">
              ${rosterEntries.slice(0, 6).map((r) => `<span style="background: #1e293b; border: 1px solid #334155; padding: 1px 6px; border-radius: 4px; font-size: 10px; color: #cbd5e1;">${r.name || r.id} (${r.loc || "?"})</span>`).join("")}
              ${rosterEntries.length > 6 ? `<span style="color: #64748b; font-size: 10px;">+${rosterEntries.length - 6} more</span>` : ""}
            </div>
          </div>
        </div>
      </div>
    `;
    this.root.appendChild(midRow);
    const directorNote = diagBus.getDirectorNote();
    const directorCard = document.createElement("div");
    directorCard.style.cssText = "background: #0f172a; border: 1px solid #6366f1; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 6px;";
    directorCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 6px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 14px;">\uD83C\uDFAC</span>
          <strong style="color: #a78bfa; font-size: 12px; text-transform: uppercase;">Active Director Guidance</strong>
        </div>
        <span id="vn-director-thread-label" style="font-size: 10px; background: rgba(139,92,246,0.2); border: 1px solid #8b5cf6; color: #c084fc; padding: 2px 8px; border-radius: 4px; font-weight: 600;">
          ${directorNote?.threadLabel || "General Steering"}
        </span>
      </div>
      <div id="vn-director-note-body" style="font-size: 11px; line-height: 1.5; color: #cbd5e1; max-height: 120px; overflow-y: auto; white-space: pre-wrap; font-style: italic;">
        ${directorNote?.directorNote || "No active turn steering notes recorded."}
      </div>
    `;
    this.root.appendChild(directorCard);
    const rulesCard = document.createElement("div");
    rulesCard.style.cssText = "background: #0f172a; border: 1px solid #38bdf8; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 8px;";
    rulesCard.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <strong style="color: #38bdf8; font-size: 13px;">⚖️ Stat Rules & MVU Ledger Config</strong>
        <select id="vn-mvu-mode-select" style="background: #1e293b; color: #fff; border: 1px solid #475569; border-radius: 4px; padding: 2px 6px; font-size: 11px;">
          <option value="mvu_quiet">MVU Mode (Quiet LLM Evaluator)</option>
          <option value="inline_interceptor">Inline Mode (Prompt Injection)</option>
          <option value="passive">Passive Mode (Parse only)</option>
        </select>
      </div>
      <label style="font-size: 10px; color: #94a3b8;">Stat Rules Formulation:</label>
      <textarea id="vn-stat-rules-input" style="width: 100%; height: 95px; background: #020617; color: #f8fafc; border: 1px solid #334155; border-radius: 4px; font-family: monospace; font-size: 10px; padding: 6px; box-sizing: border-box; resize: vertical;"></textarea>
      <label style="font-size: 10px; color: #94a3b8;">Ledger Output Schema:</label>
      <textarea id="vn-ledger-prompt-input" style="width: 100%; height: 95px; background: #020617; color: #f8fafc; border: 1px solid #334155; border-radius: 4px; font-family: monospace; font-size: 10px; padding: 6px; box-sizing: border-box; resize: vertical;"></textarea>
      <label style="font-size: 10px; color: #94a3b8;">RPG & Combat Rules Prompt (Tactical Directives):</label>
      <textarea id="vn-rpg-rules-input" style="width: 100%; height: 85px; background: #020617; color: #f8fafc; border: 1px solid #334155; border-radius: 4px; font-family: monospace; font-size: 10px; padding: 6px; box-sizing: border-box; resize: vertical;"></textarea>
      <div style="display:flex; justify-content:flex-end;">
        <button id="vn-save-rules-btn" style="background: #0284c7; color: #fff; border: none; border-radius: 4px; padding: 6px 14px; font-size: 11px; font-weight: 700; cursor: pointer;">\uD83D\uDCBE Save & Update Rules</button>
      </div>
    `;
    this.root.appendChild(rulesCard);
    const modeSelect = rulesCard.querySelector("#vn-mvu-mode-select");
    const rulesInput = rulesCard.querySelector("#vn-stat-rules-input");
    const ledgerInput = rulesCard.querySelector("#vn-ledger-prompt-input");
    const rpgInput = rulesCard.querySelector("#vn-rpg-rules-input");
    const saveRulesBtn = rulesCard.querySelector("#vn-save-rules-btn");
    const activeMode = this.statRulesSettings?.mode || "mvu_quiet";
    const activeRules = this.statRulesSettings?.statRules?.trim() || DEFAULT_STAT_RULES;
    const activeLedger = this.statRulesSettings?.ledgerPrompt?.trim() || DEFAULT_LEDGER_PROMPT;
    const activeRpg = this.statRulesSettings?.rpgPrompt?.trim() || DEFAULT_RPG_PROMPT;
    if (modeSelect)
      modeSelect.value = activeMode;
    if (rulesInput)
      rulesInput.value = activeRules;
    if (ledgerInput)
      ledgerInput.value = activeLedger;
    if (rpgInput)
      rpgInput.value = activeRpg;
    if (!this.statRulesSettings) {
      this.ctx?.sendToBackend?.({ type: "vn_get_stat_rules_settings" });
    }
    saveRulesBtn?.addEventListener("click", () => {
      const updated = {
        mode: modeSelect?.value || "mvu_quiet",
        statRules: rulesInput?.value?.trim() || DEFAULT_STAT_RULES,
        ledgerPrompt: ledgerInput?.value?.trim() || DEFAULT_LEDGER_PROMPT,
        rpgPrompt: rpgInput?.value?.trim() || DEFAULT_RPG_PROMPT,
        enabled: true
      };
      this.statRulesSettings = updated;
      this.ctx?.sendToBackend?.({
        type: "vn_save_stat_rules_settings",
        settings: updated
      });
      if (saveRulesBtn) {
        const orig = saveRulesBtn.textContent;
        saveRulesBtn.textContent = "✓ Saved!";
        setTimeout(() => {
          saveRulesBtn.textContent = orig;
        }, 1500);
      }
    });
    const audioCard = document.createElement("div");
    audioCard.style.cssText = "background: #0f172a; border: 1px solid #10b981; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 10px;";
    const isBgmActive = this.audioEngine?.isBgmActive() ?? false;
    const bgmVol = Math.round((this.audioEngine?.getBgmVolume() ?? 0.4) * 100);
    const currTrack = this.audioEngine?.getCurrentBgm() || "idle / adaptive";
    audioCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 6px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 15px;">\uD83C\uDFB5</span>
          <strong style="color: #34d399; font-size: 12px; text-transform: uppercase;">Background Music (BGM) & Audio Controls</strong>
        </div>
        <button id="vn-diag-toggle-bgm" style="background: ${isBgmActive ? "linear-gradient(135deg, #059669, #10b981)" : "#334155"}; border: none; color: #fff; border-radius: 6px; padding: 4px 12px; font-size: 11px; font-weight: 700; cursor: pointer;">
          ${isBgmActive ? "\uD83D\uDFE2 BGM: Playing (Click to Pause)" : "▶ BGM: Turn On / Play"}
        </button>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; font-size: 11px;">
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <label style="color: #94a3b8; font-weight: 600;">BGM Volume</label>
            <span id="vn-diag-bgm-val" style="color: #34d399; font-weight: 700;">${bgmVol}%</span>
          </div>
          <input type="range" id="vn-diag-bgm-slider" min="0" max="100" value="${bgmVol}" style="width: 100%; cursor: pointer;" />
        </div>
        <div>
          <label style="color: #94a3b8; font-weight: 600; display: block; margin-bottom: 4px;">Active Track / Scene Ambience</label>
          <span id="vn-diag-curr-track" style="color: #38bdf8; font-weight: 600; font-family: monospace;">${currTrack}</span>
        </div>
      </div>
    `;
    this.root.appendChild(audioCard);
    const toggleBgmBtn = audioCard.querySelector("#vn-diag-toggle-bgm");
    const bgmSlider = audioCard.querySelector("#vn-diag-bgm-slider");
    const bgmVal = audioCard.querySelector("#vn-diag-bgm-val");
    toggleBgmBtn?.addEventListener("click", () => {
      if (this.audioEngine) {
        const active = this.audioEngine.toggleBgm();
        toggleBgmBtn.innerHTML = active ? "\uD83D\uDFE2 BGM: Playing (Click to Pause)" : "▶ BGM: Turn On / Play";
        toggleBgmBtn.style.background = active ? "linear-gradient(135deg, #059669, #10b981)" : "#334155";
        const trackEl = audioCard.querySelector("#vn-diag-curr-track");
        if (trackEl)
          trackEl.textContent = this.audioEngine.getCurrentBgm() || "peaceful";
      }
    });
    bgmSlider?.addEventListener("input", () => {
      const vol = Number(bgmSlider.value);
      if (bgmVal)
        bgmVal.textContent = `${vol}%`;
      this.audioEngine?.setBgmVolume(vol / 100);
    });
    const propsCard = document.createElement("div");
    propsCard.style.cssText = "background: #0f172a; border: 1px solid #38bdf8; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 8px;";
    propsCard.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <strong style="color: #38bdf8; font-size: 13px;">\uD83C\uDFAD Roleplay Prop & UI Templates</strong>
        <span style="font-size: 10px; background: rgba(56, 189, 248, 0.2); border: 1px solid #0284c7; color: #7dd3fc; padding: 2px 6px; border-radius: 4px;">HTML/CSS Props</span>
      </div>
      <p style="margin: 0; font-size: 11px; color: #94a3b8;">
        Inspect game-style prop widgets and copy standard tags for prose & Director notes:
      </p>
      <div id="vn-diag-prop-tabs" style="display: flex; gap: 4px; flex-wrap: wrap;">
        ${PROP_TEMPLATES_CATALOG.map((p, idx) => `
          <button class="vn-diag-prop-btn" data-prop-id="${p.id}" style="padding: 3px 8px; font-size: 11px; background: ${idx === 0 ? "#0284c7" : "#1e293b"}; border: 1px solid ${idx === 0 ? "#38bdf8" : "#475569"}; color: #fff; border-radius: 4px; cursor: pointer;">
            ${p.icon} ${p.name}
          </button>
        `).join("")}
      </div>
      <div style="background: #020617; border: 1px solid #334155; border-radius: 8px; padding: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span id="vn-diag-prop-desc" style="font-size: 10px; color: #94a3b8;">${PROP_TEMPLATES_CATALOG[0]?.description}</span>
          <button id="vn-diag-copy-prop-btn" style="padding: 2px 8px; font-size: 10px; font-weight: 700; background: #1e293b; border: 1px solid #38bdf8; color: #38bdf8; border-radius: 4px; cursor: pointer;">
            \uD83D\uDCCB Copy Tag
          </button>
        </div>
        <div id="vn-diag-prop-preview" style="min-height: 60px;">
          ${formatDialogueHtml(PROP_TEMPLATES_CATALOG[0]?.sampleTag || "").html}
        </div>
      </div>
    `;
    this.root.appendChild(propsCard);
    let activeProp = PROP_TEMPLATES_CATALOG[0];
    const diagDesc = propsCard.querySelector("#vn-diag-prop-desc");
    const diagPreview = propsCard.querySelector("#vn-diag-prop-preview");
    const diagCopyBtn = propsCard.querySelector("#vn-diag-copy-prop-btn");
    propsCard.querySelectorAll(".vn-diag-prop-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const propId = btn.getAttribute("data-prop-id");
        const found = PROP_TEMPLATES_CATALOG.find((p) => p.id === propId);
        if (found) {
          activeProp = found;
          if (diagDesc)
            diagDesc.textContent = found.description;
          if (diagPreview)
            diagPreview.innerHTML = formatDialogueHtml(found.sampleTag).html;
          propsCard.querySelectorAll(".vn-diag-prop-btn").forEach((b) => {
            b.style.background = b === btn ? "#0284c7" : "#1e293b";
            b.style.borderColor = b === btn ? "#38bdf8" : "#475569";
          });
        }
      });
    });
    diagCopyBtn?.addEventListener("click", async () => {
      await navigator.clipboard.writeText(activeProp.sampleTag).catch(() => {});
      if (diagCopyBtn) {
        const orig = diagCopyBtn.textContent;
        diagCopyBtn.textContent = "✓ Copied Tag!";
        diagCopyBtn.style.borderColor = "#10b981";
        setTimeout(() => {
          diagCopyBtn.textContent = orig;
          diagCopyBtn.style.borderColor = "#38bdf8";
        }, 1500);
      }
    });
    const bottomSplit = document.createElement("div");
    bottomSplit.style.cssText = "flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; min-height: 220px; overflow: hidden;";
    const consoleBox = document.createElement("div");
    consoleBox.style.cssText = "background: #020617; border: 1px solid #1e293b; border-radius: 10px; padding: 10px; display: flex; flex-direction: column; gap: 8px;";
    consoleBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Engine Diagnostic Log</span>
        <div style="display: flex; gap: 4px; align-items: center;">
          <button id="vn-filter-all" style="padding: 2px 6px; font-size: 10px; border-radius: 4px; border: 1px solid #334155; background: ${this.activeFilter === "all" ? "#4f46e5" : "#1e293b"}; color: #fff; cursor: pointer;">All</button>
          <button id="vn-filter-info" style="padding: 2px 6px; font-size: 10px; border-radius: 4px; border: 1px solid #334155; background: ${this.activeFilter === "info" ? "#4f46e5" : "#1e293b"}; color: #fff; cursor: pointer;">Info</button>
          <button id="vn-filter-warn" style="padding: 2px 6px; font-size: 10px; border-radius: 4px; border: 1px solid #334155; background: ${this.activeFilter === "warn" ? "#4f46e5" : "#1e293b"}; color: #fff; cursor: pointer;">Warn</button>
          <button id="vn-filter-error" style="padding: 2px 6px; font-size: 10px; border-radius: 4px; border: 1px solid #334155; background: ${this.activeFilter === "error" ? "#4f46e5" : "#1e293b"}; color: #fff; cursor: pointer;">Err</button>
          <button id="vn-clear-logs" style="padding: 2px 6px; font-size: 10px; border-radius: 4px; border: 1px solid #334155; background: #1e293b; color: #94a3b8; cursor: pointer; margin-left: 4px;">Clear</button>
        </div>
      </div>
      <div id="vn-diag-stream" style="flex: 1; overflow-y: auto; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10px; color: #cbd5e1; display: flex; flex-direction: column; gap: 3px; user-select: text; max-height: 200px;">
      </div>
    `;
    const ledgerBox = document.createElement("div");
    ledgerBox.style.cssText = "background: #020617; border: 1px solid #1e293b; border-radius: 10px; padding: 10px; display: flex; flex-direction: column; gap: 8px;";
    ledgerBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase;">Active World Ledger Viewer</span>
        <button id="vn-copy-editor-btn" style="padding: 2px 8px; font-size: 10px; background: #1e293b; border: 1px solid #475569; border-radius: 4px; color: #38bdf8; font-weight: 600; cursor: pointer;">
          \uD83D\uDCCB Copy Block
        </button>
      </div>
      <textarea id="vn-ledger-editor" readonly style="flex: 1; background: #090d16; border: 1px solid #334155; border-radius: 6px; color: #a5b4fc; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10px; padding: 8px; resize: none; outline: none; user-select: text; white-space: pre; max-height: 200px;">${diagBus.formatLedgerYaml(this.currentLedger)}</textarea>
    `;
    bottomSplit.appendChild(consoleBox);
    bottomSplit.appendChild(ledgerBox);
    this.root.appendChild(bottomSplit);
    const stream = consoleBox.querySelector("#vn-diag-stream");
    const renderLogs = () => {
      if (!stream)
        return;
      stream.innerHTML = "";
      const logs = diagBus.getLogs();
      const filtered = this.activeFilter === "all" ? logs : logs.filter((l) => l.level === this.activeFilter);
      if (filtered.length === 0) {
        stream.innerHTML = '<div style="color: #64748b; font-style: italic;">No logs for this filter.</div>';
        return;
      }
      for (const entry of filtered) {
        const item = document.createElement("div");
        item.style.wordBreak = "break-word";
        item.style.color = entry.level === "error" ? "#f43f5e" : entry.level === "warn" ? "#f59e0b" : entry.level === "action" ? "#38bdf8" : "#cbd5e1";
        item.textContent = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
        stream.appendChild(item);
      }
      stream.scrollTop = stream.scrollHeight;
    };
    renderLogs();
    consoleBox.querySelector("#vn-filter-all")?.addEventListener("click", () => {
      this.activeFilter = "all";
      this.render(this.currentLedger, this.currentManifest);
    });
    consoleBox.querySelector("#vn-filter-info")?.addEventListener("click", () => {
      this.activeFilter = "info";
      this.render(this.currentLedger, this.currentManifest);
    });
    consoleBox.querySelector("#vn-filter-warn")?.addEventListener("click", () => {
      this.activeFilter = "warn";
      this.render(this.currentLedger, this.currentManifest);
    });
    consoleBox.querySelector("#vn-filter-error")?.addEventListener("click", () => {
      this.activeFilter = "error";
      this.render(this.currentLedger, this.currentManifest);
    });
    consoleBox.querySelector("#vn-clear-logs")?.addEventListener("click", () => {
      diagBus.clearLogs();
      renderLogs();
    });
    ledgerBox.querySelector("#vn-copy-editor-btn")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      const textarea = ledgerBox.querySelector("#vn-ledger-editor");
      if (textarea) {
        await navigator.clipboard.writeText(textarea.value).catch(() => {
          return;
        });
        showToast(btn, "Copy Block");
      }
    });
    const updateDirectorCard = () => {
      const note = diagBus.getDirectorNote();
      const labelEl = directorCard.querySelector("#vn-director-thread-label");
      const bodyEl = directorCard.querySelector("#vn-director-note-body");
      if (labelEl)
        labelEl.textContent = note?.threadLabel || "General Steering";
      if (bodyEl)
        bodyEl.textContent = note?.directorNote || "No active turn steering notes recorded.";
    };
    if (this.unsubscribeBus)
      this.unsubscribeBus();
    this.unsubscribeBus = diagBus.subscribe(() => {
      renderLogs();
      updateDirectorCard();
    });
  }
  destroy() {
    if (this.unsubscribeBus) {
      this.unsubscribeBus();
      this.unsubscribeBus = undefined;
    }
  }
}

// src/frontend/hud/tab-rpg.ts
function parseSkillTreesFromPrompt(prompt2) {
  if (!prompt2)
    return [];
  const categories = [];
  const treeRegex = /(?:【Tree:\s*([^】]+)】|\[Tree:\s*([^\]]+)\]|##?\s*Tree:\s*([^\n]+))/gi;
  const matches = [];
  let m;
  while ((m = treeRegex.exec(prompt2)) !== null) {
    const name = (m[1] || m[2] || m[3] || "").trim();
    if (name)
      matches.push({ name, index: m.index });
  }
  for (let i = 0;i < matches.length; i++) {
    const current = matches[i];
    const nextIndex = i + 1 < matches.length ? matches[i + 1].index : prompt2.length;
    const chunk = prompt2.slice(current.index, nextIndex);
    const nodes = [];
    const lines = chunk.split(`
`);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith("- "))
        continue;
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1)
        continue;
      const skillName = line.slice(2, colonIdx).trim();
      const paramsStr = line.slice(colonIdx + 1).trim();
      const parts = paramsStr.split("|").map((p) => p.trim());
      let tier = 1;
      let cost = 1;
      let requires = [];
      let type = "active";
      let cd = 0;
      let cost_res = {};
      let formula = "";
      let desc = "";
      for (const part of parts) {
        const eqIdx = part.indexOf("=");
        if (eqIdx === -1)
          continue;
        const key = part.slice(0, eqIdx).trim().toLowerCase();
        const val = part.slice(eqIdx + 1).trim();
        if (key === "tier")
          tier = parseInt(val, 10) || 1;
        else if (key === "cost")
          cost = parseInt(val, 10) || 1;
        else if (key === "requires") {
          const clean = val.replace(/^\[|\]$/g, "").trim();
          requires = clean ? clean.split(",").map((s) => s.trim()).filter(Boolean) : [];
        } else if (key === "type") {
          type = val.toLowerCase() === "passive" ? "passive" : "active";
        } else if (key === "cd") {
          cd = parseInt(val, 10) || 0;
        } else if (key === "cost_res") {
          try {
            const jsonStr = val.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
            cost_res = JSON.parse(jsonStr);
          } catch {
            const pair = val.replace(/[{}]/g, "").split(":");
            if (pair.length === 2)
              cost_res[pair[0].trim()] = parseInt(pair[1], 10) || 0;
          }
        } else if (key === "formula") {
          formula = val;
        } else if (key === "desc") {
          desc = val;
        }
      }
      nodes.push({
        id: skillName.toLowerCase().replace(/\s+/g, "_"),
        name: skillName,
        tree: current.name,
        tier,
        cost,
        requires,
        type,
        cd,
        cost_res,
        formula,
        desc
      });
    }
    if (nodes.length > 0) {
      categories.push({
        name: current.name,
        nodes
      });
    }
  }
  return categories;
}

class RpgTab {
  root;
  ctx;
  onAction;
  currentLedger = {};
  currentManifest;
  selectedActorId = "user";
  selectedSides = 20;
  modifier = 0;
  lastRoll = null;
  statRulesSettings = null;
  progression = {
    level: 1,
    exp: 0,
    maxExp: 100,
    skillPoints: 3,
    unlockedSkills: ["Strike"],
    cooldowns: {}
  };
  selectedTreeTab = "";
  constructor(ctx, onAction) {
    this.ctx = ctx;
    this.onAction = onAction;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-rpg";
  }
  addExp(amount) {
    this.progression.exp += amount;
    while (this.progression.exp >= this.progression.maxExp) {
      this.progression.exp -= this.progression.maxExp;
      this.progression.level += 1;
      this.progression.skillPoints += 1;
      this.progression.maxExp = Math.round(this.progression.maxExp * 1.5);
    }
  }
  levelUp() {
    this.progression.level += 1;
    this.progression.skillPoints += 1;
  }
  unlockSkill(node) {
    if (this.progression.unlockedSkills.includes(node.name))
      return false;
    if (this.progression.skillPoints < node.cost)
      return false;
    const hasPrereqs = (node.requires || []).every((req) => this.progression.unlockedSkills.includes(req));
    if (!hasPrereqs)
      return false;
    this.progression.skillPoints -= node.cost;
    this.progression.unlockedSkills.push(node.name);
    return true;
  }
  tickCooldowns() {
    for (const key of Object.keys(this.progression.cooldowns)) {
      if ((this.progression.cooldowns[key] || 0) > 0) {
        this.progression.cooldowns[key] -= 1;
      }
    }
  }
  snapshots = [];
  captureSnapshot() {
    this.snapshots.push({
      progression: JSON.parse(JSON.stringify(this.progression)),
      cooldowns: JSON.parse(JSON.stringify(this.progression.cooldowns))
    });
    if (this.snapshots.length > 10)
      this.snapshots.shift();
  }
  rollbackSnapshot() {
    const prev = this.snapshots.pop();
    if (!prev)
      return false;
    this.progression = prev.progression;
    this.progression.cooldowns = prev.cooldowns;
    if (this.currentLedger) {
      this.render(this.currentLedger, this.currentManifest);
    }
    return true;
  }
  triggerSkillAction(skill, currentActor) {
    this.captureSnapshot();
    if (skill.type !== "active")
      return "";
    const cd = this.progression.cooldowns[skill.name] || 0;
    if (cd > 0)
      return "";
    const atk = typeof currentActor?.combat?.atk === "number" ? currentActor.combat.atk : 14;
    const matk = typeof currentActor?.combat?.matk === "number" ? currentActor.combat.matk : 16;
    let dmg = Math.round(atk * 1.2);
    if (skill.formula) {
      try {
        const expr = skill.formula.replace(/{ATK}/gi, String(atk)).replace(/{MATK}/gi, String(matk)).replace(/[^0-9\+\-\*\/\.\(\)]/g, "");
        const evalRes = Number(Function(`return (${expr})`)());
        if (!isNaN(evalRes) && evalRes > 0) {
          dmg = Math.round(evalRes);
        }
      } catch {
        dmg = Math.round(atk * 1.2);
      }
    }
    if (skill.cd && skill.cd > 0) {
      this.progression.cooldowns[skill.name] = skill.cd;
    }
    const mpCost = skill.cost_res?.mp ?? 0;
    const actionText = `[Combat Action: ${skill.name}! Dealt ${dmg} damage. ${skill.desc ? `(${skill.desc}) ` : ""}(Cost: ${mpCost} MP | CD: ${skill.cd || 0} turns)]`;
    if (this.onAction) {
      this.onAction(actionText);
    }
    return actionText;
  }
  setStatRulesSettings(settings) {
    this.statRulesSettings = settings;
    const promptInput = this.root.querySelector("#vn-rpg-prompt-input");
    if (promptInput) {
      promptInput.value = settings.rpgPrompt || DEFAULT_RPG_PROMPT;
    }
  }
  render(ledger, manifest) {
    this.currentLedger = ledger;
    this.currentManifest = manifest;
    this.root.innerHTML = "";
    this.root.style.cssText = "display: flex; flex-direction: column; gap: 14px; height: 100%; color: #f1f5f9; font-family: system-ui, -apple-system, sans-serif; overflow-y: auto; padding-right: 4px;";
    const actors = ledger.actors || {};
    const actorKeys = Object.keys(actors);
    if (!actorKeys.includes(this.selectedActorId) && actorKeys.length > 0) {
      this.selectedActorId = actorKeys.includes("user") ? "user" : actorKeys[0];
    }
    const currentActor = actors[this.selectedActorId] || {};
    const combat = currentActor.combat || {};
    const header = document.createElement("div");
    header.style.cssText = "display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; border-bottom: 1px solid #334155; padding-bottom: 10px;";
    header.innerHTML = `
      <div>
        <h3 style="margin: 0; font-size: 15px; color: #fff; display: flex; align-items: center; gap: 6px;">
          <span>⚔️</span> <span>RPG Rules, Vitals & Dice Engine</span>
        </h3>
        <p style="margin: 2px 0 0 0; font-size: 11px; color: #94a3b8;">
          Combat matrix, skill proficiencies, interactive TTRPG dice roller, and prompt directives.
        </p>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 11px; color: #94a3b8;">Actor:</span>
        <select id="vn-rpg-actor-select" style="background: #1e293b; border: 1px solid #475569; color: #38bdf8; font-weight: 600; border-radius: 6px; padding: 4px 10px; font-size: 12px; outline: none; cursor: pointer;">
          ${actorKeys.map((id) => `<option value="${id}" ${id === this.selectedActorId ? "selected" : ""}>${actors[id]?.name || id} ${id === "user" ? "(You)" : ""}</option>`).join("")}
        </select>
      </div>
    `;
    this.root.appendChild(header);
    header.querySelector("#vn-rpg-actor-select")?.addEventListener("change", (e) => {
      this.selectedActorId = e.target.value;
      this.render(this.currentLedger, this.currentManifest);
    });
    const vitalsCard = document.createElement("div");
    vitalsCard.style.cssText = "background: #0f172a; border: 1px solid #3b82f6; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.4);";
    const hpNum = typeof combat.hp === "number" ? combat.hp : parseInt(String(combat.hp || "100"), 10) || 100;
    const mpNum = typeof combat.mp === "number" ? combat.mp : parseInt(String(combat.mp || "50"), 10) || 50;
    const lv = combat.lv || combat.tier || 1;
    const tier = combat.tier || "Standard";
    vitalsCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong style="color: #60a5fa; font-size: 13px; display: flex; align-items: center; gap: 6px;">
          <span>\uD83D\uDEE1️</span> <span>${currentActor.name || this.selectedActorId} — Vitals & Attributes</span>
        </strong>
        <span style="font-size: 11px; background: rgba(59, 130, 246, 0.2); border: 1px solid #3b82f6; color: #93c5fd; padding: 2px 8px; border-radius: 4px; font-weight: 700;">
          Level ${lv} • Tier ${tier}
        </span>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;">
        <!-- Health Gauge -->
        <div style="background: #1e293b; padding: 8px 12px; border-radius: 8px; border: 1px solid #334155;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
            <span style="color: #f87171; font-weight: 700;">❤️ Health (HP)</span>
            <span style="color: #fca5a5; font-weight: 700;">${hpNum} / 100</span>
          </div>
          <div style="background: #020617; height: 8px; border-radius: 4px; overflow: hidden;">
            <div style="width: ${Math.min(100, Math.max(0, hpNum))}%; height: 100%; background: linear-gradient(90deg, #ef4444, #f87171); transition: width 0.3s ease;"></div>
          </div>
        </div>

        <!-- Mana / Energy Gauge -->
        <div style="background: #1e293b; padding: 8px 12px; border-radius: 8px; border: 1px solid #334155;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
            <span style="color: #38bdf8; font-weight: 700;">\uD83D\uDCA7 Energy / Mana (MP)</span>
            <span style="color: #7dd3fc; font-weight: 700;">${mpNum} / 100</span>
          </div>
          <div style="background: #020617; height: 8px; border-radius: 4px; overflow: hidden;">
            <div style="width: ${Math.min(100, Math.max(0, mpNum))}%; height: 100%; background: linear-gradient(90deg, #0284c7, #38bdf8); transition: width 0.3s ease;"></div>
          </div>
        </div>
      </div>

      <!-- Skills, Techniques & Proficiencies -->
      <div style="border-top: 1px solid #1e293b; padding-top: 8px; display: flex; flex-direction: column; gap: 4px;">
        <span style="font-size: 10px; color: #94a3b8; font-weight: 700;">SKILLS & COMBAT APTITUDES</span>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${this.renderAptitudes(currentActor)}
        </div>
      </div>
    `;
    this.root.appendChild(vitalsCard);
    const progCard = document.createElement("div");
    progCard.style.cssText = "background: #0f172a; border: 1px solid #10b981; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.4);";
    const expPct = Math.min(100, Math.max(0, Math.round(this.progression.exp / this.progression.maxExp * 100)));
    progCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <strong style="color: #34d399; font-size: 13px; display: flex; align-items: center; gap: 6px;">
            <span>⭐</span> <span>Level Progression & Skill Points</span>
          </strong>
          <span style="background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #6ee7b7; font-weight: 800; font-size: 11px; padding: 2px 8px; border-radius: 9999px;">
            Level ${this.progression.level}
          </span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="background: rgba(245, 158, 11, 0.2); border: 1px solid #f59e0b; color: #fde68a; font-weight: 700; font-size: 11px; padding: 2px 8px; border-radius: 6px;">
            ✨ Available SP: ${this.progression.skillPoints}
          </span>
          <button id="vn-rpg-add-exp-btn" style="background: #1e293b; border: 1px solid #334155; color: #6ee7b7; font-size: 10px; font-weight: 700; border-radius: 4px; padding: 3px 8px; cursor: pointer;">
            +50 EXP
          </button>
          <button id="vn-rpg-level-up-btn" style="background: linear-gradient(135deg, #059669, #10b981); border: none; color: #fff; font-size: 10px; font-weight: 800; border-radius: 4px; padding: 3px 8px; cursor: pointer;">
            ▲ Level Up
          </button>
          <button id="vn-rpg-reset-sp-btn" style="background: transparent; border: 1px solid #475569; color: #94a3b8; font-size: 10px; border-radius: 4px; padding: 3px 6px; cursor: pointer;" title="Reset SP to 5">
            Reset
          </button>
        </div>
      </div>

      <div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
          <span style="color: #94a3b8;">Experience Points</span>
          <span style="color: #6ee7b7; font-weight: 700;">${this.progression.exp} / ${this.progression.maxExp} EXP (${expPct}%)</span>
        </div>
        <div style="background: #020617; height: 8px; border-radius: 4px; overflow: hidden;">
          <div style="width: ${expPct}%; height: 100%; background: linear-gradient(90deg, #059669, #34d399); transition: width 0.3s ease;"></div>
        </div>
      </div>
    `;
    this.root.appendChild(progCard);
    progCard.querySelector("#vn-rpg-add-exp-btn")?.addEventListener("click", () => {
      this.addExp(50);
      this.render(this.currentLedger, this.currentManifest);
    });
    progCard.querySelector("#vn-rpg-level-up-btn")?.addEventListener("click", () => {
      this.levelUp();
      this.render(this.currentLedger, this.currentManifest);
    });
    progCard.querySelector("#vn-rpg-reset-sp-btn")?.addEventListener("click", () => {
      this.progression.skillPoints += 3;
      this.render(this.currentLedger, this.currentManifest);
    });
    const promptText = this.statRulesSettings?.rpgPrompt || DEFAULT_RPG_PROMPT;
    const categories = parseSkillTreesFromPrompt(promptText);
    const allParsedNodes = categories.flatMap((c) => c.nodes);
    const activeUnlockedNodes = allParsedNodes.filter((n) => n.type === "active" && this.progression.unlockedSkills.includes(n.name));
    const actionCard = document.createElement("div");
    actionCard.style.cssText = "background: #0f172a; border: 1px solid #f59e0b; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.4);";
    actionCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
        <strong style="color: #fbbf24; font-size: 13px; display: flex; align-items: center; gap: 6px;">
          <span>⚡</span> <span>Combat Action Bar & Turn Cooldowns</span>
        </strong>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button id="vn-rpg-tick-cd-btn" style="background: #1e293b; border: 1px solid #f59e0b; color: #fde68a; font-size: 11px; font-weight: 700; border-radius: 6px; padding: 4px 10px; cursor: pointer;">
            ⏳ Next Turn / Tick CD
          </button>
        </div>
      </div>

      <div style="display: flex; flex-wrap: wrap; gap: 8px;" id="vn-rpg-action-buttons">
        ${activeUnlockedNodes.length === 0 ? `
          <div style="color: #94a3b8; font-size: 11px; font-style: italic;">
            No active skills learned yet. Unlock active skills in the skill tree below to use them in combat.
          </div>
        ` : activeUnlockedNodes.map((n) => {
      const cd = this.progression.cooldowns[n.name] || 0;
      const isReady = cd === 0;
      const mp = n.cost_res?.mp ?? 0;
      return `
            <button class="vn-combat-skill-btn" data-skill-name="${n.name}" style="background: ${isReady ? "#1e293b" : "#0f172a"}; border: 1px solid ${isReady ? "#38bdf8" : "#475569"}; border-radius: 8px; padding: 8px 12px; display: flex; flex-direction: column; gap: 4px; text-align: left; cursor: ${isReady ? "pointer" : "not-allowed"}; opacity: ${isReady ? "1" : "0.6"}; transition: all 0.2s ease;">
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                <strong style="color: ${isReady ? "#f8fafc" : "#94a3b8"}; font-size: 12px;">${n.name}</strong>
                <span style="font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 4px; background: ${isReady ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}; color: ${isReady ? "#4ade80" : "#fca5a5"};">
                  ${isReady ? "⚡ READY" : `⏳ CD: ${cd}T`}
                </span>
              </div>
              <div style="font-size: 10px; color: #94a3b8; display: flex; gap: 6px;">
                ${mp > 0 ? `<span>\uD83D\uDCA7 ${mp} MP</span>` : `<span>Cost: 0 MP</span>`}
                ${n.formula ? `<span>⚔️ ${n.formula}</span>` : ""}
              </div>
            </button>
          `;
    }).join("")}
      </div>
    `;
    this.root.appendChild(actionCard);
    actionCard.querySelector("#vn-rpg-tick-cd-btn")?.addEventListener("click", () => {
      this.tickCooldowns();
      this.render(this.currentLedger, this.currentManifest);
    });
    actionCard.querySelectorAll(".vn-combat-skill-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = btn.dataset.skillName || "";
        const node = activeUnlockedNodes.find((x) => x.name === name);
        if (node) {
          this.triggerSkillAction(node, currentActor);
          this.render(this.currentLedger, this.currentManifest);
        }
      });
    });
    const treeCard = document.createElement("div");
    treeCard.style.cssText = "background: #0f172a; border: 1px solid #6366f1; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.4);";
    if (!this.selectedTreeTab && categories.length > 0) {
      this.selectedTreeTab = categories[0].name;
    }
    const activeCat = categories.find((c) => c.name === this.selectedTreeTab) || categories[0];
    treeCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
        <strong style="color: #a5b4fc; font-size: 13px; display: flex; align-items: center; gap: 6px;">
          <span>\uD83C\uDF33</span> <span>Skill Trees (Prompt-Driven & Customizable)</span>
        </strong>
        <span style="font-size: 10px; color: #94a3b8;">
          Earn SP upon leveling up. Unlock prerequisites to advance.
        </span>
      </div>

      <!-- Category Tabs -->
      <div style="display: flex; gap: 6px; flex-wrap: wrap; border-bottom: 1px solid #1e293b; padding-bottom: 8px;">
        ${categories.map((c) => `
          <button class="vn-tree-tab-btn" data-tree-name="${c.name}" style="background: ${c.name === this.selectedTreeTab ? "#4f46e5" : "#1e293b"}; color: ${c.name === this.selectedTreeTab ? "#fff" : "#94a3b8"}; border: 1px solid ${c.name === this.selectedTreeTab ? "#6366f1" : "#334155"}; border-radius: 6px; padding: 4px 12px; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.15s ease;">
            ${c.name} (${c.nodes.length})
          </button>
        `).join("")}
      </div>

      <!-- Nodes Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px;">
        ${activeCat ? activeCat.nodes.map((node) => {
      const isUnlocked = this.progression.unlockedSkills.includes(node.name);
      const hasPrereqs = (node.requires || []).every((req) => this.progression.unlockedSkills.includes(req));
      const canUnlock = !isUnlocked && hasPrereqs && this.progression.skillPoints >= node.cost;
      let statusHtml = "";
      if (isUnlocked) {
        statusHtml = `<span style="color: #4ade80; font-size: 11px; font-weight: 800;">✓ Learned</span>`;
      } else if (canUnlock) {
        statusHtml = `
              <button class="vn-unlock-skill-btn" data-skill-id="${node.id}" style="background: linear-gradient(135deg, #4f46e5, #6366f1); border: none; color: #fff; font-size: 11px; font-weight: 800; border-radius: 6px; padding: 4px 12px; cursor: pointer; box-shadow: 0 2px 6px rgba(99,102,241,0.4);">
                ✨ Unlock (${node.cost} SP)
              </button>
            `;
      } else if (!hasPrereqs) {
        statusHtml = `<span style="color: #f87171; font-size: 10px;">\uD83D\uDD12 Requires: [${node.requires.join(", ")}]</span>`;
      } else {
        statusHtml = `<span style="color: #f59e0b; font-size: 10px;">\uD83D\uDD12 Needs ${node.cost} SP</span>`;
      }
      return `
            <div style="background: #1e293b; border: 1px solid ${isUnlocked ? "#10b981" : canUnlock ? "#6366f1" : "#334155"}; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <strong style="color: ${isUnlocked ? "#6ee7b7" : "#f8fafc"}; font-size: 12px;">${node.name}</strong>
                  <span style="font-size: 9px; padding: 1px 5px; border-radius: 4px; background: ${node.type === "active" ? "rgba(56,189,248,0.2)" : "rgba(168,85,247,0.2)"}; color: ${node.type === "active" ? "#7dd3fc" : "#d8b4fe"}; font-weight: 700;">
                    ${node.type.toUpperCase()}
                  </span>
                </div>
                <span style="font-size: 10px; color: #94a3b8; font-weight: 600;">T${node.tier}</span>
              </div>
              <div style="font-size: 11px; color: #cbd5e1; line-height: 1.3;">
                ${node.desc || "A specialized skill."}
              </div>
              ${node.formula ? `<div style="font-size: 10px; color: #f59e0b;">Formula: ${node.formula}</div>` : ""}
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #334155; padding-top: 6px; margin-top: 2px;">
                <span style="font-size: 10px; color: #94a3b8;">Cost: ${node.cost} SP</span>
                <div>${statusHtml}</div>
              </div>
            </div>
          `;
    }).join("") : `<div style="color: #94a3b8; font-size: 11px;">No skills in this category.</div>`}
      </div>
    `;
    this.root.appendChild(treeCard);
    treeCard.querySelectorAll(".vn-tree-tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.selectedTreeTab = btn.dataset.treeName || "";
        this.render(this.currentLedger, this.currentManifest);
      });
    });
    treeCard.querySelectorAll(".vn-unlock-skill-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.skillId || "";
        const node = activeCat?.nodes.find((n) => n.id === id);
        if (node && this.unlockSkill(node)) {
          this.render(this.currentLedger, this.currentManifest);
        }
      });
    });
    const diceCard = document.createElement("div");
    diceCard.style.cssText = "background: #0f172a; border: 1px solid #8b5cf6; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.4);";
    diceCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong style="color: #c084fc; font-size: 13px; display: flex; align-items: center; gap: 6px;">
          <span>\uD83C\uDFB2</span> <span>Tabletop RPG Dice Roller</span>
        </strong>
        <span style="font-size: 10px; color: #94a3b8;">D4 to D100 with Critical Success Checks</span>
      </div>

      <!-- Dice Type Selector -->
      <div style="display: flex; gap: 6px; flex-wrap: wrap;" id="vn-dice-buttons">
        ${[4, 6, 8, 10, 12, 20, 100].map((s) => `
          <button class="vn-dice-btn" data-sides="${s}" style="padding: 5px 12px; font-size: 11px; font-weight: 700; border-radius: 6px; cursor: pointer; border: 1px solid ${s === this.selectedSides ? "#a855f7" : "#475569"}; background: ${s === this.selectedSides ? "#7e22ce" : "#1e293b"}; color: #fff; transition: all 0.15s ease;">
            D${s}
          </button>
        `).join("")}
      </div>

      <!-- Modifier & Roll Trigger Bar -->
      <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 11px; color: #94a3b8;">Modifier:</span>
          <input id="vn-dice-mod" type="number" value="${this.modifier}" style="width: 55px; background: #020617; border: 1px solid #475569; color: #f8fafc; border-radius: 4px; padding: 4px 6px; font-size: 12px; text-align: center; outline: none;" />
        </div>
        <button id="vn-roll-dice-btn" style="flex: 1; min-width: 120px; background: linear-gradient(135deg, #8b5cf6, #ec4899); border: none; color: #fff; font-weight: 800; font-size: 12px; padding: 8px 16px; border-radius: 8px; cursor: pointer; box-shadow: 0 2px 10px rgba(139,92,246,0.4); transition: transform 0.15s;">
          \uD83C\uDFB2 Roll D${this.selectedSides}${this.modifier !== 0 ? this.modifier > 0 ? `+${this.modifier}` : `${this.modifier}` : ""}
        </button>
      </div>

      <!-- Roll Result Display Area -->
      <div id="vn-dice-result-box" style="background: #020617; border: 1px solid #334155; border-radius: 8px; padding: 12px; min-height: 50px; display: flex; justify-content: space-between; align-items: center;">
        ${this.renderDiceResult()}
      </div>
    `;
    this.root.appendChild(diceCard);
    diceCard.querySelectorAll(".vn-dice-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.selectedSides = parseInt(btn.getAttribute("data-sides") || "20", 10);
        diceCard.querySelectorAll(".vn-dice-btn").forEach((b) => {
          const active = b === btn;
          b.style.background = active ? "#7e22ce" : "#1e293b";
          b.style.borderColor = active ? "#a855f7" : "#475569";
        });
        const rollBtn = diceCard.querySelector("#vn-roll-dice-btn");
        if (rollBtn) {
          rollBtn.textContent = `\uD83C\uDFB2 Roll D${this.selectedSides}${this.modifier !== 0 ? this.modifier > 0 ? `+${this.modifier}` : `${this.modifier}` : ""}`;
        }
      });
    });
    const modInput = diceCard.querySelector("#vn-dice-mod");
    modInput?.addEventListener("input", () => {
      this.modifier = parseInt(modInput.value, 10) || 0;
      const rollBtn = diceCard.querySelector("#vn-roll-dice-btn");
      if (rollBtn) {
        rollBtn.textContent = `\uD83C\uDFB2 Roll D${this.selectedSides}${this.modifier !== 0 ? this.modifier > 0 ? `+${this.modifier}` : `${this.modifier}` : ""}`;
      }
    });
    diceCard.querySelector("#vn-roll-dice-btn")?.addEventListener("click", () => {
      this.executeDiceRoll();
    });
    diceCard.querySelector("#vn-inject-dice-btn")?.addEventListener("click", () => {
      if (this.lastRoll && this.onAction) {
        const text = `[Dice Roll: d${this.lastRoll.sides}${this.lastRoll.modifier ? this.lastRoll.modifier > 0 ? `+${this.lastRoll.modifier}` : `${this.lastRoll.modifier}` : ""} = ${this.lastRoll.total}${this.lastRoll.isNat20 ? " (Critical Success!)" : this.lastRoll.isNat1 ? " (Critical Fumble!)" : ""}]`;
        this.onAction(text);
      }
    });
    const promptCard = document.createElement("div");
    promptCard.style.cssText = "background: #0f172a; border: 1px solid #10b981; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.4);";
    promptCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong style="color: #34d399; font-size: 13px; display: flex; align-items: center; gap: 6px;">
          <span>\uD83D\uDCDC</span> <span>RPG Stat Rules & Combat Prompt Directive</span>
        </strong>
        <span style="font-size: 10px; background: rgba(16,185,129,0.2); border: 1px solid #10b981; color: #6ee7b7; padding: 2px 8px; border-radius: 4px; font-weight: 700;">
          Injected in Director & Turn Evaluator
        </span>
      </div>
      <p style="margin: 0; font-size: 11px; color: #94a3b8;">
        Define rules, skills resolution, and combat directives for the simulation engine. Updates automatically persist across chats:
      </p>
      <textarea id="vn-rpg-prompt-input" style="width: 100%; height: 130px; background: #020617; color: #f8fafc; border: 1px solid #334155; border-radius: 6px; font-family: monospace; font-size: 11px; padding: 8px; box-sizing: border-box; resize: vertical; line-height: 1.5; outline: none;"></textarea>
      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 4px;">
        <button id="vn-reset-rpg-prompt-btn" style="background: transparent; border: 1px solid #475569; color: #94a3b8; border-radius: 4px; padding: 4px 10px; font-size: 11px; cursor: pointer;">
          Reset to Default
        </button>
        <button id="vn-save-rpg-prompt-btn" style="background: linear-gradient(135deg, #059669, #10b981); color: #fff; border: none; border-radius: 6px; padding: 6px 16px; font-size: 11px; font-weight: 700; cursor: pointer; box-shadow: 0 2px 8px rgba(16,185,129,0.4);">
          \uD83D\uDCBE Save RPG Rules
        </button>
      </div>
    `;
    this.root.appendChild(promptCard);
    const promptInput = promptCard.querySelector("#vn-rpg-prompt-input");
    const saveBtn = promptCard.querySelector("#vn-save-rpg-prompt-btn");
    const resetBtn = promptCard.querySelector("#vn-reset-rpg-prompt-btn");
    if (promptInput) {
      promptInput.value = this.statRulesSettings?.rpgPrompt || DEFAULT_RPG_PROMPT;
    }
    resetBtn?.addEventListener("click", () => {
      if (promptInput) {
        promptInput.value = DEFAULT_RPG_PROMPT;
      }
    });
    saveBtn?.addEventListener("click", () => {
      const newPrompt = promptInput?.value || "";
      const updated = {
        mode: this.statRulesSettings?.mode || "mvu_quiet",
        statRules: this.statRulesSettings?.statRules || "",
        ledgerPrompt: this.statRulesSettings?.ledgerPrompt || "",
        enabled: this.statRulesSettings?.enabled !== false,
        rpgPrompt: newPrompt
      };
      this.statRulesSettings = updated;
      this.ctx?.sendToBackend?.({
        type: "vn_save_stat_rules_settings",
        settings: updated
      });
      this.render(this.currentLedger, this.currentManifest);
      if (saveBtn) {
        const orig = saveBtn.textContent;
        saveBtn.textContent = "✓ Saved & Injected!";
        setTimeout(() => {
          saveBtn.textContent = orig;
        }, 1500);
      }
    });
    this.renderActionHotbar(activeUnlockedNodes, currentActor);
  }
  renderActionHotbar(activeUnlockedNodes, currentActor) {
    if (typeof document === "undefined")
      return;
    let hotbar = document.getElementById("vn-rpg-action-hotbar");
    if (!hotbar) {
      hotbar = document.createElement("div");
      hotbar.id = "vn-rpg-action-hotbar";
      hotbar.style.cssText = "position: fixed; bottom: 85px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; z-index: 1000; background: rgba(15,23,42,0.92); backdrop-filter: blur(8px); border: 1px solid rgba(99,102,241,0.5); border-radius: 20px; padding: 4px 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.5); max-width: 90vw; overflow-x: auto;";
      document.body.appendChild(hotbar);
    }
    if (activeUnlockedNodes.length === 0) {
      hotbar.style.display = "none";
      return;
    }
    hotbar.style.display = "flex";
    hotbar.innerHTML = "";
    const label = document.createElement("span");
    label.style.cssText = "font-size: 11px; color: #818cf8; font-weight: 700; display: flex; align-items: center; gap: 4px; padding-right: 4px; border-right: 1px solid #334155;";
    label.innerHTML = `⚔️ <span>Skills</span>`;
    hotbar.appendChild(label);
    activeUnlockedNodes.forEach((node) => {
      const cd = this.progression.cooldowns[node.name] || 0;
      const isReady = cd === 0;
      const pill = document.createElement("button");
      pill.style.cssText = `background: ${isReady ? "rgba(30,41,59,0.9)" : "rgba(15,23,42,0.7)"}; border: 1px solid ${isReady ? "#38bdf8" : "#475569"}; border-radius: 12px; padding: 2px 8px; font-size: 11px; color: ${isReady ? "#f8fafc" : "#94a3b8"}; cursor: pointer; display: flex; align-items: center; gap: 4px; white-space: nowrap; transition: all 0.15s ease;`;
      pill.innerHTML = `<span>${node.name}</span>${!isReady ? `<span style="color:#f87171; font-weight:700;">(${cd}t)</span>` : ""}`;
      pill.addEventListener("click", () => {
        const textarea = document.querySelector("#send_textarea, textarea[name='text'], #chat_input");
        if (textarea) {
          const prefix = textarea.value.trim() ? `${textarea.value.trim()} ` : "";
          textarea.value = `${prefix}*Uses ${node.name}* `;
          textarea.focus();
        } else {
          this.triggerSkillAction(node, currentActor);
        }
      });
      hotbar.appendChild(pill);
    });
  }
  renderAptitudes(actor) {
    const apts = [];
    if (actor.skills && Array.isArray(actor.skills)) {
      apts.push(...actor.skills);
    }
    if (actor.combat?.skills && Array.isArray(actor.combat.skills)) {
      apts.push(...actor.combat.skills);
    }
    if (actor.combat?.techniques && Array.isArray(actor.combat.techniques)) {
      apts.push(...actor.combat.techniques);
    }
    if (actor.combat?.mastery) {
      apts.push(String(actor.combat.mastery));
    }
    if (apts.length === 0) {
      return `<span style="font-size: 11px; color: #64748b; font-style: italic;">No specific skills recorded for this actor.</span>`;
    }
    return apts.map((a) => `
      <span style="font-size: 11px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.4); color: #93c5fd; padding: 2px 8px; border-radius: 4px;">
        ⚔️ ${a}
      </span>
    `).join("");
  }
  executeDiceRoll() {
    const sides = this.selectedSides;
    const roll = Math.floor(Math.random() * sides) + 1;
    const total = roll + this.modifier;
    const isNat20 = sides === 20 && roll === 20;
    const isNat1 = sides === 20 && roll === 1;
    this.lastRoll = {
      dice: `D${sides}`,
      sides,
      roll,
      modifier: this.modifier,
      total,
      isNat20,
      isNat1,
      timestamp: new Date().toLocaleTimeString()
    };
    const resultBox = this.root.querySelector("#vn-dice-result-box");
    if (resultBox) {
      resultBox.innerHTML = this.renderDiceResult();
      resultBox.querySelector("#vn-inject-dice-btn")?.addEventListener("click", () => {
        if (this.lastRoll && this.onAction) {
          const text = `[Dice Roll: d${this.lastRoll.sides}${this.lastRoll.modifier ? this.lastRoll.modifier > 0 ? `+${this.lastRoll.modifier}` : `${this.lastRoll.modifier}` : ""} = ${this.lastRoll.total}${this.lastRoll.isNat20 ? " (Critical Success!)" : this.lastRoll.isNat1 ? " (Critical Fumble!)" : ""}]`;
          this.onAction(text);
        }
      });
    }
  }
  renderDiceResult() {
    if (!this.lastRoll) {
      return `
        <span style="color: #64748b; font-size: 12px; font-style: italic;">No dice rolled yet. Select dice and click Roll!</span>
        <span></span>
      `;
    }
    const { sides, roll, modifier, total, isNat20, isNat1 } = this.lastRoll;
    let badge = "";
    if (isNat20) {
      badge = `<span style="background: rgba(234, 179, 8, 0.2); border: 1px solid #eab308; color: #fde047; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 800;">✨ NATURAL 20!</span>`;
    } else if (isNat1) {
      badge = `<span style="background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #fca5a5; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 800;">\uD83D\uDC80 NATURAL 1!</span>`;
    }
    return `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 24px; font-weight: 900; color: ${isNat20 ? "#ffd700" : isNat1 ? "#f87171" : "#38bdf8"};">
          ${total}
        </span>
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <span style="font-size: 11px; color: #cbd5e1;">
            Rolled <strong>${roll}</strong> on d${sides} ${modifier ? `${modifier > 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`}` : ""}
          </span>
          <div>${badge}</div>
        </div>
      </div>
      <button id="vn-inject-dice-btn" style="background: #1e293b; border: 1px solid #8b5cf6; color: #c084fc; font-weight: 700; border-radius: 6px; padding: 5px 12px; font-size: 11px; cursor: pointer; transition: all 0.2s;">
        ⚡ Use in Action
      </button>
    `;
  }
}

// src/frontend/hud/menu-bar.ts
class MenuBar {
  root;
  panelOverlay;
  panelBody;
  phoneBadge = null;
  charactersTab;
  bplotsTab;
  wardrobeTab;
  statsTab;
  inventoryTab;
  mapTab;
  phoneTab;
  journalTab;
  sceneTab;
  rpgTab;
  diagnosticsTab;
  activeTabId = null;
  currentLedger = {};
  currentManifest;
  constructor(options) {
    const opts = typeof options === "function" ? { ctx: {}, onAction: options } : options;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-menubar";
    this.panelOverlay = document.createElement("div");
    this.panelOverlay.className = "vn-hud-overlay";
    this.panelOverlay.style.display = "none";
    const panelModal = document.createElement("div");
    panelModal.className = "vn-hud-modal";
    const closeBtn = document.createElement("button");
    closeBtn.className = "vn-hud-close-btn";
    closeBtn.textContent = "✕";
    closeBtn.addEventListener("click", () => this.closeTab());
    this.panelBody = document.createElement("div");
    this.panelBody.className = "vn-hud-panel-body";
    panelModal.appendChild(closeBtn);
    panelModal.appendChild(this.panelBody);
    this.panelOverlay.appendChild(panelModal);
    this.panelOverlay.addEventListener("click", (e) => {
      if (e.target === this.panelOverlay)
        this.closeTab();
    });
    this.charactersTab = new CharactersTab(opts.ttsEngine, opts.ctx);
    this.bplotsTab = new BPlotsTab(opts.onAction);
    this.wardrobeTab = new WardrobeTab(opts.onAction);
    this.statsTab = new StatsTab;
    this.inventoryTab = new InventoryTab(opts.onAction);
    this.mapTab = new MapTab(opts.onAction);
    this.phoneTab = new PhoneTab(opts.ctx, opts.onAction, opts.isOverlayActive);
    this.journalTab = new JournalTab;
    this.sceneTab = new SceneTab(opts.ctx, opts.onTransformChange);
    this.rpgTab = new RpgTab(opts.ctx, opts.onAction);
    this.diagnosticsTab = new DiagnosticsTab(opts.ctx, opts.audioEngine);
    const barItems = [
      { id: "characters", icon: "\uD83D\uDC65", label: "Cast" },
      { id: "stats", icon: "\uD83D\uDCCA", label: "Stats" },
      { id: "rpg", icon: "⚔️", label: "RPG / Dice" },
      { id: "inventory", icon: "\uD83C\uDF92", label: "Inventory" },
      { id: "wardrobe", icon: "\uD83D\uDC57", label: "Wardrobe" },
      { id: "map", icon: "\uD83D\uDDFA️", label: "Map" },
      { id: "phone", icon: "\uD83D\uDCF1", label: "Phone" },
      { id: "journal", icon: "\uD83D\uDCDC", label: "Journal" },
      { id: "scene", icon: "\uD83C\uDFAC", label: "Scene" },
      { id: "bplots", icon: "\uD83D\uDCE1", label: "B-Plots" },
      { id: "diagnostics", icon: "\uD83D\uDCCB", label: "Copy / Diag" }
    ];
    for (const item of barItems) {
      const btn = document.createElement("button");
      btn.className = "vn-hud-btn";
      btn.dataset.tabId = item.id;
      btn.innerHTML = `<span class="vn-hud-icon">${item.icon}</span><span class="vn-hud-label">${item.label}</span>`;
      if (item.id === "phone") {
        this.phoneBadge = document.createElement("span");
        this.phoneBadge.className = "vn-hud-badge";
        this.phoneBadge.textContent = "!";
        this.phoneBadge.style.display = "none";
        btn.appendChild(this.phoneBadge);
      }
      btn.addEventListener("click", () => {
        if (this.activeTabId === item.id) {
          this.closeTab();
        } else {
          this.openTab(item.id);
        }
      });
      this.root.appendChild(btn);
    }
  }
  getOverlay() {
    return this.panelOverlay;
  }
  setLedger(ledger, hasBPlotNotification = false) {
    const raw = ledger;
    if (raw && raw.ledger && typeof raw.ledger === "object" && !Array.isArray(raw.ledger)) {
      this.currentLedger = { ...raw.ledger, ...raw };
    } else {
      this.currentLedger = ledger || {};
    }
    if (this.phoneBadge) {
      this.phoneBadge.style.display = hasBPlotNotification ? "flex" : "none";
      if (hasBPlotNotification) {
        this.phoneBadge.classList.add("vn-pulse");
      } else {
        this.phoneBadge.classList.remove("vn-pulse");
      }
    }
    if (this.activeTabId) {
      this.renderActiveTab();
    }
  }
  setManifest(manifest) {
    this.currentManifest = manifest;
    if (this.activeTabId === "characters" || this.activeTabId === "scene" || this.activeTabId === "map") {
      this.renderActiveTab();
    }
  }
  setStatRulesSettings(settings) {
    this.diagnosticsTab.setStatRulesSettings(settings);
    this.rpgTab.setStatRulesSettings(settings);
  }
  openTab(tabId) {
    if (this.activeTabId === "phone" && tabId !== "phone") {
      this.phoneTab.close();
    }
    if (this.activeTabId === "diagnostics" && tabId !== "diagnostics") {
      this.diagnosticsTab.destroy();
    }
    this.activeTabId = tabId;
    this.root.querySelectorAll(".vn-hud-btn").forEach((btn) => {
      const b = btn;
      if (b.dataset.tabId === tabId) {
        b.classList.add("active");
      } else {
        b.classList.remove("active");
      }
    });
    this.renderActiveTab();
    this.panelOverlay.style.display = "flex";
  }
  closeTab() {
    if (this.activeTabId === "phone") {
      this.phoneTab.close();
    }
    if (this.activeTabId === "diagnostics") {
      this.diagnosticsTab.destroy();
    }
    this.activeTabId = null;
    this.root.querySelectorAll(".vn-hud-btn").forEach((b) => b.classList.remove("active"));
    this.panelOverlay.style.display = "none";
  }
  renderActiveTab() {
    this.panelBody.innerHTML = "";
    switch (this.activeTabId) {
      case "characters":
        this.charactersTab.render(this.currentLedger, this.currentManifest);
        this.panelBody.appendChild(this.charactersTab.root);
        break;
      case "stats":
        this.statsTab.render(this.currentLedger);
        this.panelBody.appendChild(this.statsTab.root);
        break;
      case "rpg":
        this.rpgTab.render(this.currentLedger, this.currentManifest);
        this.panelBody.appendChild(this.rpgTab.root);
        break;
      case "bplots":
        this.bplotsTab.render(this.currentLedger);
        this.panelBody.appendChild(this.bplotsTab.root);
        break;
      case "wardrobe":
        this.wardrobeTab.render(this.currentLedger);
        this.panelBody.appendChild(this.wardrobeTab.root);
        break;
      case "inventory":
        this.inventoryTab.render(this.currentLedger);
        this.panelBody.appendChild(this.inventoryTab.root);
        break;
      case "map":
        this.mapTab.render(this.currentLedger, this.currentManifest);
        this.panelBody.appendChild(this.mapTab.root);
        break;
      case "phone":
        this.phoneTab.render(this.currentLedger);
        this.panelBody.appendChild(this.phoneTab.root);
        break;
      case "journal":
        this.journalTab.render(this.currentLedger);
        this.panelBody.appendChild(this.journalTab.root);
        break;
      case "scene":
        this.sceneTab.render(this.currentLedger, this.currentManifest);
        this.panelBody.appendChild(this.sceneTab.root);
        break;
      case "diagnostics":
        this.diagnosticsTab.render(this.currentLedger, this.currentManifest);
        this.panelBody.appendChild(this.diagnosticsTab.root);
        break;
    }
  }
}

// src/frontend/stage/theme.ts
var VN_THEMES = {
  default: {
    id: "default",
    name: "Classic ADV",
    primary: "#6366f1",
    secondary: "#8b5cf6",
    accent: "#ffd700",
    bgGlass: "rgba(15, 23, 42, 0.92)",
    border: "rgba(129, 140, 248, 0.5)",
    glow: "rgba(99, 102, 241, 0.35)",
    text: "#f8fafc"
  },
  cyberpunk: {
    id: "cyberpunk",
    name: "Cyberpunk",
    primary: "#00f0ff",
    secondary: "#ff007f",
    accent: "#ffe600",
    bgGlass: "rgba(10, 15, 29, 0.94)",
    border: "rgba(0, 240, 255, 0.6)",
    glow: "rgba(0, 240, 255, 0.4)",
    text: "#e0f7fa"
  },
  midnight: {
    id: "midnight",
    name: "Midnight",
    primary: "#a855f7",
    secondary: "#6366f1",
    accent: "#c084fc",
    bgGlass: "rgba(8, 7, 20, 0.95)",
    border: "rgba(168, 85, 247, 0.4)",
    glow: "rgba(168, 85, 247, 0.3)",
    text: "#f3e8ff"
  },
  sakura: {
    id: "sakura",
    name: "Sakura Blossom",
    primary: "#f472b6",
    secondary: "#fb7185",
    accent: "#fef08a",
    bgGlass: "rgba(28, 15, 25, 0.92)",
    border: "rgba(244, 114, 182, 0.5)",
    glow: "rgba(244, 114, 182, 0.35)",
    text: "#fdf2f8"
  },
  sunset: {
    id: "sunset",
    name: "Sunset Gold",
    primary: "#f97316",
    secondary: "#e11d48",
    accent: "#fde047",
    bgGlass: "rgba(24, 14, 15, 0.93)",
    border: "rgba(249, 115, 22, 0.5)",
    glow: "rgba(249, 115, 22, 0.35)",
    text: "#fff7ed"
  }
};
function applyVnTheme(rootEl, themeId = "default") {
  const theme = VN_THEMES[themeId] || VN_THEMES["default"];
  rootEl.style.setProperty("--vn-primary", theme.primary);
  rootEl.style.setProperty("--vn-secondary", theme.secondary);
  rootEl.style.setProperty("--vn-accent", theme.accent);
  rootEl.style.setProperty("--vn-card-bg", theme.bgGlass);
  rootEl.style.setProperty("--vn-border", theme.border);
  rootEl.style.setProperty("--vn-glow", theme.glow);
  rootEl.style.setProperty("--vn-text", theme.text);
}

// src/frontend/stage/audio-player.ts
class VnAudioEngine {
  audioCtx = null;
  bgmAudio = null;
  sfxVolume = 0.5;
  bgmVolume = 0.4;
  isMuted = false;
  constructor() {}
  getContext() {
    if (!this.audioCtx && typeof window !== "undefined") {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass;
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }
  setMuted(muted) {
    this.isMuted = muted;
    if (this.bgmAudio) {
      this.bgmAudio.muted = muted;
    }
  }
  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }
  isBgmActive() {
    return Boolean(this.bgmAudio && !this.bgmAudio.paused && !this.bgmAudio.muted && !this.isMuted);
  }
  toggleBgm() {
    if (this.isBgmActive()) {
      if (this.bgmAudio)
        this.bgmAudio.pause();
      return false;
    }
    this.isMuted = false;
    if (this.bgmAudio) {
      this.bgmAudio.muted = false;
      this.bgmAudio.play().catch(() => {});
      return true;
    }
    const defaultTrack = this.currentBgmTrack || "peaceful";
    const url = this.customBgmMap[defaultTrack] || defaultTrack;
    this.playBgm(url, defaultTrack);
    return true;
  }
  playSfx(typeOrUrl) {
    if (this.isMuted)
      return;
    if (typeOrUrl.startsWith("http") || typeOrUrl.startsWith("/") || typeOrUrl.startsWith("data:")) {
      try {
        const audio = new Audio(typeOrUrl);
        audio.volume = this.sfxVolume;
        audio.play().catch(() => {});
      } catch {}
      return;
    }
    const ctx = this.getContext();
    if (!ctx)
      return;
    try {
      const now = ctx.currentTime;
      switch (typeOrUrl) {
        case "click": {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
          gain.gain.setValueAtTime(0.15 * this.sfxVolume, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.04);
          break;
        }
        case "type": {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(500 + Math.random() * 150, now);
          gain.gain.setValueAtTime(0.04 * this.sfxVolume, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.02);
          break;
        }
        case "page": {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.linearRampToValueAtTime(600, now + 0.08);
          gain.gain.setValueAtTime(0.1 * this.sfxVolume, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.08);
          break;
        }
        case "impact": {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
          gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.25);
          break;
        }
        case "chime": {
          [523.25, 659.25, 783.99].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + i * 0.06);
            gain.gain.setValueAtTime(0.12 * this.sfxVolume, now + i * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + i * 0.06);
            osc.stop(now + i * 0.06 + 0.3);
          });
          break;
        }
      }
    } catch {}
  }
  playDiceRoll(durationMs = 800) {
    if (this.isMuted)
      return;
    const ctx = this.getContext();
    if (!ctx)
      return;
    try {
      const now = ctx.currentTime;
      const clicks = 8;
      for (let i = 0;i < clicks; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        const freq = 260 + Math.random() * 320;
        const timeOffset = Math.pow(i / clicks, 0.7) * (durationMs / 1000) * 0.9;
        osc.frequency.setValueAtTime(freq, now + timeOffset);
        gain.gain.setValueAtTime(0.08 * this.sfxVolume, now + timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + timeOffset);
        osc.stop(now + timeOffset + 0.05);
      }
    } catch {}
  }
  playTierResult(tierName) {
    if (this.isMuted)
      return;
    const ctx = this.getContext();
    if (!ctx)
      return;
    try {
      const now = ctx.currentTime;
      const name = String(tierName || "").toLowerCase();
      if (name.includes("crit") && name.includes("fail")) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(196, now);
        osc.frequency.exponentialRampToValueAtTime(98, now + 0.4);
        gain.gain.setValueAtTime(0.15 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (name.includes("fail")) {
        [330, 262].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + i * 0.12);
          gain.gain.setValueAtTime(0.12 * this.sfxVolume, now + i * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.12);
          osc.stop(now + i * 0.12 + 0.2);
        });
      } else if (name.includes("crit")) {
        [523, 659, 784, 1047].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0.12 * this.sfxVolume, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.35);
        });
      } else {
        [523, 659].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          gain.gain.setValueAtTime(0.12 * this.sfxVolume, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.25);
        });
      }
    } catch {}
  }
  currentBgmTrack = null;
  customBgmMap = {};
  static DEFAULT_MOOD_BGM_MAP = {
    happy: "daily_happy",
    joyful: "daily_happy",
    cheerful: "daily_happy",
    romantic: "romantic_piano",
    love: "romantic_piano",
    tender: "romantic_piano",
    warm: "warm_acoustic",
    tense: "suspense_tension",
    danger: "combat_intense",
    combat: "combat_intense",
    action: "combat_intense",
    sad: "melancholy_strings",
    melancholy: "melancholy_strings",
    grief: "melancholy_strings",
    mysterious: "mystery_ambient",
    mystery: "mystery_ambient",
    eerie: "mystery_ambient",
    peaceful: "calm_ambient",
    calm: "calm_ambient",
    daily: "daily_ambient",
    ambient: "daily_ambient"
  };
  extractBgmTag(text) {
    if (!text)
      return null;
    const match = text.match(/(?:🎵\s*Music|BGM|\[Music|【Music|Play music)[：:]\s*([^\n\r\]】]+)/i);
    return match ? match[1].trim() : null;
  }
  setCustomBgmMap(map) {
    this.customBgmMap = { ...map };
  }
  getCustomBgmMap() {
    return { ...this.customBgmMap };
  }
  getCurrentBgm() {
    return this.currentBgmTrack;
  }
  isDucked = false;
  duckBgm(factor = 0.35) {
    if (this.isDucked || !this.bgmAudio)
      return;
    this.isDucked = true;
    this.bgmAudio.volume = this.bgmVolume * Math.max(0.05, Math.min(1, factor));
  }
  unduckBgm() {
    if (!this.isDucked)
      return;
    this.isDucked = false;
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.bgmVolume;
    }
  }
  setBgmVolume(volume) {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.isDucked ? this.bgmVolume * 0.35 : this.bgmVolume;
    }
  }
  getBgmVolume() {
    return this.bgmVolume;
  }
  handleDynamicBgm(text, mood, place, manifestBgm) {
    const tagged = this.extractBgmTag(text);
    if (tagged) {
      const url = manifestBgm?.[tagged] || this.customBgmMap[tagged] || tagged;
      this.playBgm(url, tagged);
      return tagged;
    }
    if (place) {
      const cleanPlace = place.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      if (manifestBgm?.[cleanPlace] || this.customBgmMap[cleanPlace]) {
        const url = manifestBgm?.[cleanPlace] || this.customBgmMap[cleanPlace];
        this.playBgm(url, cleanPlace);
        return cleanPlace;
      }
    }
    if (mood) {
      const normMood = mood.toLowerCase().trim();
      const mappedTrack = VnAudioEngine.DEFAULT_MOOD_BGM_MAP[normMood];
      if (mappedTrack) {
        const url = manifestBgm?.[mappedTrack] || this.customBgmMap[mappedTrack] || mappedTrack;
        this.playBgm(url, mappedTrack);
        return mappedTrack;
      }
    }
    return null;
  }
  playBgm(url, trackName) {
    if (!url) {
      this.stopBgm();
      return;
    }
    const trackId = trackName || url;
    if (this.currentBgmTrack === trackId && this.bgmAudio && !this.bgmAudio.paused) {
      return;
    }
    this.stopBgm();
    this.currentBgmTrack = trackId;
    try {
      this.bgmAudio = new Audio(url);
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = this.bgmVolume;
      this.bgmAudio.muted = this.isMuted;
      this.bgmAudio.play().catch(() => {});
    } catch {}
  }
  stopBgm() {
    if (this.bgmAudio) {
      try {
        this.bgmAudio.pause();
        this.bgmAudio.currentTime = 0;
      } catch {}
      this.bgmAudio = null;
    }
    this.currentBgmTrack = null;
  }
  destroy() {
    this.stopBgm();
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
  }
}

// src/frontend/stage/tts-engine.ts
var DEFAULT_VOICE_SETTINGS = {
  enabled: false,
  volume: 0.8,
  narrator: null,
  characterDefault: null,
  characters: {}
};
function speakerKey(name) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}
function characterVoiceKey(chatId, name) {
  return `chat::${chatId}::${speakerKey(name)}`;
}

class VnTtsEngine {
  currentAudio = null;
  currentUtterance = null;
  settings = { ...DEFAULT_VOICE_SETTINGS };
  activeChatId = "";
  cachedDefaultConnection = null;
  ledgerVoices = new Map;
  audioCache = new Map;
  pendingFetches = new Map;
  constructor() {
    this.loadLocalSettings();
  }
  setChatId(chatId) {
    if (this.activeChatId !== chatId) {
      this.clearAudioCache();
    }
    this.activeChatId = chatId;
  }
  setLedgerVoices(actors) {
    this.ledgerVoices.clear();
    if (!actors)
      return;
    for (const [id, dossier] of Object.entries(actors)) {
      const v = dossier.voice || dossier?.profile?.voice;
      if (v) {
        let speed;
        if (typeof dossier.speech_style === "string") {
          const style = dossier.speech_style.toLowerCase();
          if (style.includes("fast") || style.includes("hurried") || style.includes("excited"))
            speed = 1.15;
          if (style.includes("slow") || style.includes("deliberate") || style.includes("calm"))
            speed = 0.88;
        }
        const ref = typeof v === "string" ? { connectionId: "", voice: v, speed } : { connectionId: v.connectionId || "", voice: v.voice || "", speed: v.speed ?? speed };
        this.ledgerVoices.set(speakerKey(id), ref);
        if (dossier.name)
          this.ledgerVoices.set(speakerKey(dossier.name), ref);
      }
    }
  }
  clearAudioCache() {
    for (const cached of this.audioCache.values()) {
      try {
        URL.revokeObjectURL(cached.url);
      } catch {}
    }
    this.audioCache.clear();
    this.pendingFetches.clear();
  }
  getSettings() {
    return this.settings;
  }
  updateSettings(patch) {
    this.settings = { ...this.settings, ...patch };
    this.saveLocalSettings();
    if (!this.settings.enabled)
      this.stop();
  }
  setEnabled(val) {
    this.updateSettings({ enabled: val });
  }
  loadLocalSettings() {
    try {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem("lumivn_voice_settings");
        if (raw)
          this.settings = { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(raw) };
      }
    } catch {}
  }
  saveLocalSettings() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("lumivn_voice_settings", JSON.stringify(this.settings));
      }
    } catch {}
  }
  isEnabled() {
    return this.settings.enabled;
  }
  toggle() {
    this.updateSettings({ enabled: !this.settings.enabled });
    return this.settings.enabled;
  }
  stop() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.src = "";
      } catch {}
      this.currentAudio = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
      this.currentUtterance = null;
    }
  }
  cleanDialogueText(text) {
    return text.replace(/<[^>]+>/g, "").replace(/\[\[.*?\]\]/g, "").replace(/\[(?:expression|pose|emotion|action|sfx)[^\]]*\]/gi, "").replace(/\{\{img::[^\}]+\}\}/gi, "").replace(/[\*_~`#]/g, "").replace(/["“”]/g, "").replace(/\s+/g, " ").trim();
  }
  async listProfiles() {
    try {
      const res = await fetch("/api/v1/tts-connections?limit=50", { credentials: "include" });
      if (!res.ok)
        return [];
      const body = await res.json();
      const rows = Array.isArray(body.data) ? body.data : [];
      return rows.map((r) => ({
        id: r.id,
        name: r.name || r.id,
        provider: r.provider || "",
        model: r.model || "",
        voice: r.voice || "",
        isDefault: Boolean(r.is_default)
      }));
    } catch {
      return [];
    }
  }
  async resolveDefaultConnection(forceRefresh = false) {
    if (this.cachedDefaultConnection && !forceRefresh) {
      return this.cachedDefaultConnection;
    }
    const profiles = await this.listProfiles();
    const found = profiles.find((p) => p.isDefault) || profiles[0] || null;
    this.cachedDefaultConnection = found;
    return found;
  }
  async listVoices(connectionId) {
    if (!connectionId)
      return [];
    try {
      const res = await fetch(`/api/v1/tts-connections/${encodeURIComponent(connectionId)}/voices`, { credentials: "include" });
      if (!res.ok)
        return [];
      const body = await res.json();
      const rows = Array.isArray(body.voices) ? body.voices : [];
      return rows.map((v) => ({
        id: v.id || v.name,
        name: v.name || v.id
      }));
    } catch {
      return [];
    }
  }
  resolveVoice(speakerName = "") {
    const clean = speakerKey(speakerName);
    const isNarrator = !clean || clean === "narrator";
    if (isNarrator) {
      return this.settings.narrator || this.settings.characterDefault || null;
    }
    const scopedKey = characterVoiceKey(this.activeChatId, clean);
    const manualRef = this.settings.characters[scopedKey] || this.settings.characters[clean];
    if (manualRef)
      return manualRef;
    const ledgerRef = this.ledgerVoices.get(clean);
    if (ledgerRef)
      return ledgerRef;
    return this.settings.characterDefault || this.settings.narrator || null;
  }
  async prefetch(text, speakerName = "") {
    if (!this.settings.enabled || !text.trim())
      return;
    const cleanText = this.cleanDialogueText(text);
    if (!cleanText)
      return;
    const key = `${speakerKey(speakerName)}::${cleanText}`;
    if (this.audioCache.has(key) || this.pendingFetches.has(key))
      return;
    const fetchPromise = (async () => {
      let voiceRef = this.resolveVoice(speakerName);
      if (!voiceRef?.connectionId) {
        const defaultConn = await this.resolveDefaultConnection();
        if (defaultConn) {
          voiceRef = {
            connectionId: defaultConn.id,
            voice: voiceRef?.voice || defaultConn.voice || "",
            speed: voiceRef?.speed
          };
        }
      }
      if (!voiceRef?.connectionId)
        return null;
      try {
        const payload = {
          connectionId: voiceRef.connectionId,
          text: cleanText,
          outputFormat: "mp3"
        };
        if (voiceRef.voice)
          payload.voice = voiceRef.voice;
        if (voiceRef.speed)
          payload.parameters = { speed: voiceRef.speed };
        const resp = await fetch("/api/v1/tts/synthesize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload)
        });
        if (resp.ok) {
          const blob = await resp.blob();
          if (typeof URL !== "undefined") {
            const url = URL.createObjectURL(blob);
            const entry = { blob, url };
            this.audioCache.set(key, entry);
            if (this.audioCache.size > 20) {
              const firstKey = this.audioCache.keys().next().value;
              if (firstKey) {
                const old = this.audioCache.get(firstKey);
                if (old)
                  URL.revokeObjectURL(old.url);
                this.audioCache.delete(firstKey);
              }
            }
            return entry;
          }
        }
      } catch {}
      return null;
    })();
    this.pendingFetches.set(key, fetchPromise);
    try {
      await fetchPromise;
    } finally {
      this.pendingFetches.delete(key);
    }
  }
  async speak(text, speakerName = "", callbacks) {
    if (!this.settings.enabled || !text.trim()) {
      if (typeof callbacks === "function")
        callbacks();
      else
        callbacks?.onEnd?.();
      return;
    }
    this.stop();
    const cb = typeof callbacks === "function" ? { onEnd: callbacks } : callbacks || {};
    const cleanText = this.cleanDialogueText(text);
    if (!cleanText) {
      cb.onEnd?.();
      return;
    }
    const cacheKey = `${speakerKey(speakerName)}::${cleanText}`;
    let cached = this.audioCache.get(cacheKey);
    if (!cached && this.pendingFetches.has(cacheKey)) {
      cached = await this.pendingFetches.get(cacheKey) || undefined;
    }
    if (cached && typeof Audio !== "undefined") {
      const audio = new Audio(cached.url);
      this.currentAudio = audio;
      audio.volume = Math.max(0, Math.min(1, this.settings.volume));
      audio.addEventListener("play", () => {
        cb.onStart?.(audio.duration || undefined);
      });
      audio.addEventListener("ended", () => {
        this.currentAudio = null;
        cb.onEnd?.();
      });
      audio.addEventListener("error", (e) => {
        this.currentAudio = null;
        cb.onError?.(e);
      });
      try {
        await audio.play();
        return;
      } catch {}
    }
    let voiceRef = this.resolveVoice(speakerName);
    if (!voiceRef?.connectionId) {
      const defaultConn = await this.resolveDefaultConnection();
      if (defaultConn) {
        voiceRef = {
          connectionId: defaultConn.id,
          voice: voiceRef?.voice || defaultConn.voice || "",
          speed: voiceRef?.speed
        };
      }
    }
    if (voiceRef?.connectionId) {
      try {
        const payload = {
          connectionId: voiceRef.connectionId,
          text: cleanText,
          outputFormat: "mp3"
        };
        if (voiceRef.voice)
          payload.voice = voiceRef.voice;
        if (voiceRef.speed)
          payload.parameters = { speed: voiceRef.speed };
        const resp = await fetch("/api/v1/tts/synthesize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload)
        });
        if (resp.ok) {
          const blob = await resp.blob();
          if (typeof Audio !== "undefined" && typeof URL !== "undefined") {
            const url = URL.createObjectURL(blob);
            this.audioCache.set(cacheKey, { blob, url });
            const audio = new Audio(url);
            this.currentAudio = audio;
            audio.volume = Math.max(0, Math.min(1, this.settings.volume));
            audio.addEventListener("play", () => {
              cb.onStart?.(audio.duration || undefined);
            });
            audio.addEventListener("ended", () => {
              this.currentAudio = null;
              cb.onEnd?.();
            });
            audio.addEventListener("error", (e) => {
              this.currentAudio = null;
              cb.onError?.(e);
            });
            await audio.play();
            return;
          }
        }
      } catch (err) {}
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      this.currentUtterance = utterance;
      utterance.volume = this.settings.volume;
      utterance.onstart = () => {
        cb.onStart?.();
      };
      utterance.onboundary = (e) => {
        if (e.name === "word")
          cb.onBoundary?.(e.charIndex);
      };
      utterance.onend = () => {
        this.currentUtterance = null;
        cb.onEnd?.();
      };
      utterance.onerror = (e) => {
        this.currentUtterance = null;
        cb.onError?.(e);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      cb.onStart?.();
      cb.onEnd?.();
    }
  }
  async testVoice(text, overrideVoiceRef, speakerName = "", callbacks) {
    if (!text.trim())
      return;
    this.stop();
    const cb = callbacks || {};
    const cleanText = text.replace(/<[^>]*>/g, "").trim();
    const voiceRef = overrideVoiceRef !== undefined ? overrideVoiceRef : this.resolveVoice(speakerName);
    if (voiceRef?.connectionId) {
      try {
        const payload = {
          connectionId: voiceRef.connectionId,
          text: cleanText,
          outputFormat: "mp3"
        };
        if (voiceRef.voice)
          payload.voice = voiceRef.voice;
        if (voiceRef.speed)
          payload.parameters = { speed: voiceRef.speed };
        const resp = await fetch("/api/v1/tts/synthesize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload)
        });
        if (!resp.ok) {
          throw new Error(`TTS synthesis returned HTTP ${resp.status}`);
        }
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        this.currentAudio = audio;
        audio.volume = Math.max(0, Math.min(1, this.settings.volume || 1));
        audio.addEventListener("play", () => {
          cb.onStart?.(audio.duration || undefined);
        });
        audio.addEventListener("ended", () => {
          URL.revokeObjectURL(url);
          this.currentAudio = null;
          cb.onEnd?.();
        });
        audio.addEventListener("error", (e) => {
          URL.revokeObjectURL(url);
          this.currentAudio = null;
          cb.onError?.(e);
        });
        await audio.play();
        return;
      } catch (err) {
        console.warn("[LumiVN] Host TTS synthesis test failed, attempting Web Speech fallback:", err);
      }
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      this.currentUtterance = utterance;
      utterance.volume = this.settings.volume || 1;
      utterance.onstart = () => cb.onStart?.();
      utterance.onend = () => {
        this.currentUtterance = null;
        cb.onEnd?.();
      };
      utterance.onerror = (e) => {
        this.currentUtterance = null;
        cb.onError?.(e);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      cb.onError?.(new Error("No TTS connection selected and Web Speech API unavailable."));
    }
  }
  prefetchBeats(beats) {
    if (!this.settings.enabled || !Array.isArray(beats))
      return;
    for (const b of beats.slice(0, 5)) {
      if (b.text) {
        this.prefetch(b.text, b.speaker || "");
      }
    }
  }
}

// src/frontend/stage/overlay.ts
class StageOverlay {
  ctx;
  onExit;
  root;
  exitButton;
  stageRenderer;
  dialogueBox;
  menuBar;
  audioEngine;
  ttsEngine;
  manifest = null;
  currentChatId = null;
  overrideHandles = [];
  styleEl = null;
  active = false;
  lastProcessedEvtId = null;
  toastContainer;
  statusPill;
  constructor(options) {
    this.ctx = options.ctx;
    this.onExit = options.onExit;
    this.audioEngine = new VnAudioEngine;
    this.ttsEngine = new VnTtsEngine;
    this.root = document.createElement("div");
    this.root.className = "vn-overlay-root";
    this.root.style.display = "none";
    this.exitButton = document.createElement("button");
    this.exitButton.className = "vn-safety-exit-btn";
    this.exitButton.innerHTML = "← Back to Chat";
    this.exitButton.addEventListener("click", () => this.deactivate());
    this.stageRenderer = new StageRenderer;
    this.dialogueBox = new DialogueBox({
      onAction: (actionText) => this.dispatchAction(actionText),
      audioEngine: this.audioEngine,
      ttsEngine: this.ttsEngine,
      isOverlayActive: () => this.isActive(),
      onEditMessage: (messageId, content) => {
        const activeChat = this.ctx.getActiveChat?.();
        const targetChatId = this.currentChatId || activeChat?.id || activeChat?.chatId;
        if (targetChatId && messageId) {
          this.ctx.sendToBackend({
            type: "vn_edit_message",
            chatId: targetChatId,
            messageId,
            content
          });
        }
      },
      onParagraphChange: (_paraIndex, speaker) => {
        this.stageRenderer.setActiveSpeaker(speaker);
      },
      onBeatChange: (beat, _index) => {
        this.handleBeatChange(beat);
      }
    });
    this.menuBar = new MenuBar({
      ctx: this.ctx,
      onAction: (actionText) => this.dispatchAction(actionText),
      onTransformChange: (actorId, transform) => {
        this.stageRenderer.setActorTransform(actorId, transform);
      },
      isOverlayActive: () => this.isActive(),
      ttsEngine: this.ttsEngine,
      audioEngine: this.audioEngine
    });
    this.toastContainer = document.createElement("div");
    this.toastContainer.className = "vn-toast-container";
    this.statusPill = document.createElement("div");
    this.statusPill.className = "vn-top-status-pill";
    this.statusPill.style.display = "none";
    this.root.appendChild(this.exitButton);
    this.root.appendChild(this.statusPill);
    this.root.appendChild(this.stageRenderer.root);
    this.root.appendChild(this.dialogueBox.root);
    this.root.appendChild(this.menuBar.root);
    this.root.appendChild(this.menuBar.getOverlay());
    this.root.appendChild(this.toastContainer);
    this.injectStyles();
    applyVnTheme(this.root, "default");
  }
  setTheme(themeId) {
    applyVnTheme(this.root, themeId);
  }
  openHudTab(tabId) {
    this.menuBar.openTab(tabId);
  }
  setStatRulesSettings(settings) {
    this.menuBar.setStatRulesSettings(settings);
  }
  getCurrentChatId() {
    return this.resolveChatId() || null;
  }
  resolveChatId() {
    const ctxAny = this.ctx;
    const active = ctxAny.getActiveChat?.() || ctxAny.activeChat || ctxAny.chat;
    const activeId = active?.id || active?.chatId;
    if (activeId && typeof activeId === "string")
      return activeId;
    if (typeof window !== "undefined") {
      const urlMatch = window.location.href.match(/[\/#]chat[s]?\/([a-zA-Z0-9_-]+)/);
      if (urlMatch?.[1])
        return urlMatch[1];
      const chatEl = document.querySelector("[data-chat-id]");
      if (chatEl)
        return chatEl.getAttribute("data-chat-id") || undefined;
    }
    return this.currentChatId || undefined;
  }
  getManifest() {
    return this.manifest;
  }
  resetStage(targetChatId) {
    this.currentChatId = targetChatId || this.resolveChatId() || null;
    this.ttsEngine.setChatId(this.currentChatId || "");
    this.lastProcessedEvtId = null;
    this.statusPill.style.display = "none";
    this.statusPill.innerHTML = "";
    this.dialogueBox.reset();
    this.stageRenderer.reset();
  }
  showGenerating() {
    this.dialogueBox.showGeneratingIndicator();
  }
  showUserMessage(text, speaker = "You") {
    this.dialogueBox.presentUserParagraph(text, speaker, true);
  }
  onChatChanged(newChatId) {
    const resolved = newChatId || this.resolveChatId() || null;
    this.resetStage(resolved || undefined);
    if (this.active && resolved) {
      this.ctx.sendToBackend({
        type: "vn_stage_opened",
        chatId: resolved
      });
      this.ctx.sendToBackend({
        type: "vn_get_state",
        chatId: resolved
      });
    }
  }
  activate() {
    if (this.active)
      return;
    this.active = true;
    const ctxAny = this.ctx;
    const regOverride = typeof ctxAny.registerComponentOverride === "function" ? ctxAny.registerComponentOverride.bind(ctxAny) : typeof ctxAny.ui?.registerComponentOverride === "function" ? ctxAny.ui.registerComponentOverride.bind(ctxAny.ui) : null;
    if (regOverride) {
      try {
        const dummyComponent = () => null;
        this.overrideHandles = ["BubbleMessage", "MinimalMessage", "InputArea"].map((host) => regOverride({
          host,
          componentId: host,
          mode: "replace",
          priority: 10,
          component: dummyComponent,
          render: (target) => {
            target.style.display = "none";
          }
        }));
      } catch (e) {
        console.warn("[LumiVN] Failed to register component overrides:", e);
      }
    }
    this.root.style.display = "block";
    const targetChatId = this.resolveChatId();
    this.ctx.sendToBackend({
      type: "vn_stage_opened",
      chatId: targetChatId || ""
    });
    this.ctx.sendToBackend({
      type: "vn_get_state",
      chatId: targetChatId || ""
    });
  }
  deactivate() {
    if (!this.active)
      return;
    this.active = false;
    this.audioEngine.stopBgm();
    this.ttsEngine.stop();
    const targetChatId = this.resolveChatId();
    this.ctx.sendToBackend({
      type: "vn_stage_closed",
      chatId: targetChatId || ""
    });
    for (const h of this.overrideHandles) {
      try {
        h.destroy();
      } catch {}
    }
    this.overrideHandles = [];
    this.root.style.display = "none";
    this.onExit();
  }
  isActive() {
    return this.active;
  }
  updatePresentation(state) {
    const activeChat = this.resolveChatId();
    if (activeChat && state.chatId && state.chatId !== activeChat) {
      return;
    }
    this.currentChatId = state.chatId;
    this.stageRenderer.setBackground(state.background);
    this.stageRenderer.setCharacters(state.characters);
    const place = state.ledger?.scene?.place || "";
    this.stageRenderer.setWeather(place);
    if (state.bgmUrl) {
      this.audioEngine.playBgm(state.bgmUrl);
    } else {
      const fullText = (state.paragraphs || []).join(" ");
      const primaryEmotion = state.characters?.[0]?.emotion;
      this.audioEngine.handleDynamicBgm(fullText, primaryEmotion, place, this.manifest?.places);
    }
    this.dialogueBox.updateBgmIndicator(this.audioEngine.isBgmActive());
    const actorNames = state.characters.map((c) => c.name);
    if (state.ledger?.actors) {
      for (const [id, dossier] of Object.entries(state.ledger.actors)) {
        if (dossier?.name)
          actorNames.push(dossier.name);
        actorNames.push(id);
      }
    }
    this.dialogueBox.setKnownActors([...new Set(actorNames)]);
    this.dialogueBox.setContent(state.speakerName, state.paragraphs, state.messageId);
    this.menuBar.setLedger(state.ledger, state.hasBPlotNotification);
    this.updateStatusPill(state.ledger);
    this.ttsEngine.setLedgerVoices(state.ledger?.actors);
    const newEvts = state.ledger?.journal || [];
    if (newEvts.length > 0) {
      const latestEvt = newEvts[newEvts.length - 1];
      if (latestEvt.id !== this.lastProcessedEvtId) {
        this.lastProcessedEvtId = latestEvt.id;
        if (latestEvt.mutations && latestEvt.mutations.length > 0) {
          this.showMutationToasts(latestEvt.mutations);
        }
      }
    }
  }
  setManifest(manifest) {
    this.manifest = manifest;
    this.menuBar.setManifest(manifest);
  }
  handleBeatChange(beat) {
    if (!beat.expression && !beat.action)
      return;
    const speaker = (beat.speaker || "").toLowerCase().trim();
    if (!speaker || speaker === "narrator" || !this.manifest?.characters)
      return;
    for (const [actorKey, charData] of Object.entries(this.manifest.characters)) {
      const normKey = actorKey.toLowerCase();
      if (normKey === speaker || normKey.includes(speaker) || speaker.includes(normKey)) {
        let targetUrl;
        if (beat.expression && charData.outfits) {
          for (const outfitGroup of Object.values(charData.outfits)) {
            if (outfitGroup && typeof outfitGroup === "object" && outfitGroup[beat.expression]) {
              targetUrl = outfitGroup[beat.expression];
              break;
            }
          }
        }
        if (!targetUrl && beat.action && charData.actions && charData.actions[beat.action]) {
          targetUrl = charData.actions[beat.action];
        }
        if (!targetUrl && beat.expression && charData[beat.expression]) {
          targetUrl = charData[beat.expression];
        }
        if (targetUrl) {
          this.stageRenderer.updateCharacterSprite(beat.speaker, targetUrl);
        }
        break;
      }
    }
  }
  showMutationToasts(mutations) {
    for (const m of mutations.slice(0, 4)) {
      const toast = document.createElement("div");
      toast.className = "vn-stat-toast";
      toast.innerHTML = `<span style="font-size: 14px;">✨</span> <span>${m.split("|")[0]?.trim() || m}</span>`;
      this.toastContainer.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    }
  }
  updateStatusPill(ledger) {
    if (!ledger) {
      this.statusPill.style.display = "none";
      return;
    }
    const clockPhase = ledger.clock?.phase || ledger.clock?.period;
    const clockText = ledger.clock ? `${ledger.clock.t || ""}${clockPhase ? ` (${clockPhase})` : ""}`.trim() || "" : "";
    const placeText = ledger.scene?.room || ledger.scene?.place || ledger.scene?.district || "";
    const inv = ledger.inventory || ledger.actors?.["user"]?.inventory;
    let itemCount = 0;
    if (Array.isArray(inv?.carried)) {
      itemCount += inv.carried.length;
    }
    if (inv?.in_hand?.L && inv.in_hand.L !== "Empty" && inv.in_hand.L !== "none")
      itemCount++;
    if (inv?.in_hand?.R && inv.in_hand.R !== "Empty" && inv.in_hand.R !== "none")
      itemCount++;
    if (inv?.hands?.left && inv.hands.left !== "Empty" && inv.hands.left !== "none")
      itemCount++;
    if (inv?.hands?.right && inv.hands.right !== "Empty" && inv.hands.right !== "none")
      itemCount++;
    let relText = "";
    if (ledger.relationships) {
      for (const [targetId, rels] of Object.entries(ledger.relationships)) {
        if (targetId.toLowerCase() === "user")
          continue;
        const affinity = rels.affinity ?? rels.Affinity;
        if (typeof affinity === "number") {
          const targetName = ledger.actors?.[targetId]?.name || targetId;
          relText = `${targetName} ${affinity >= 0 ? "+" : ""}${affinity}`;
          break;
        }
      }
    }
    if (!clockText && !placeText && !relText && itemCount === 0) {
      this.statusPill.style.display = "none";
      return;
    }
    this.statusPill.innerHTML = "";
    if (clockText) {
      const clockBtn = document.createElement("button");
      clockBtn.className = "vn-pill-item";
      clockBtn.innerHTML = `<span class="vn-pill-icon">⏱️</span><span class="vn-pill-text">${clockText}</span>`;
      clockBtn.title = "Time & Chronology";
      clockBtn.addEventListener("click", () => this.menuBar.openTab("scene"));
      this.statusPill.appendChild(clockBtn);
    }
    if (placeText) {
      if (this.statusPill.children.length > 0) {
        const sep = document.createElement("span");
        sep.className = "vn-pill-sep";
        this.statusPill.appendChild(sep);
      }
      const placeBtn = document.createElement("button");
      placeBtn.className = "vn-pill-item";
      placeBtn.innerHTML = `<span class="vn-pill-icon">\uD83D\uDCCD</span><span class="vn-pill-text">${placeText}</span>`;
      placeBtn.title = "Current Location — Click for Map";
      placeBtn.addEventListener("click", () => this.menuBar.openTab("map"));
      this.statusPill.appendChild(placeBtn);
    }
    if (relText) {
      if (this.statusPill.children.length > 0) {
        const sep = document.createElement("span");
        sep.className = "vn-pill-sep";
        this.statusPill.appendChild(sep);
      }
      const relBtn = document.createElement("button");
      relBtn.className = "vn-pill-item";
      relBtn.innerHTML = `<span class="vn-pill-icon">\uD83D\uDC96</span><span class="vn-pill-text">${relText}</span>`;
      relBtn.title = "Relationship Affinity — Click for Stats";
      relBtn.addEventListener("click", () => this.menuBar.openTab("stats"));
      this.statusPill.appendChild(relBtn);
    }
    if (this.statusPill.children.length > 0) {
      const sep = document.createElement("span");
      sep.className = "vn-pill-sep";
      this.statusPill.appendChild(sep);
    }
    const bagBtn = document.createElement("button");
    bagBtn.className = "vn-pill-item";
    bagBtn.innerHTML = `<span class="vn-pill-icon">\uD83C\uDF92</span><span class="vn-pill-text">${itemCount} item${itemCount === 1 ? "" : "s"}</span>`;
    bagBtn.title = "Inventory Bag — Click to view items";
    bagBtn.addEventListener("click", () => this.menuBar.openTab("inventory"));
    this.statusPill.appendChild(bagBtn);
    this.statusPill.style.display = "flex";
  }
  dispatchAction(actionText) {
    const targetChatId = this.resolveChatId();
    this.ctx.sendToBackend({
      type: "vn_action",
      chatId: targetChatId || "",
      action: actionText
    });
  }
  injectStyles() {
    if (this.styleEl)
      return;
    this.styleEl = document.createElement("style");
    this.styleEl.textContent = `
      :root {
        --vn-primary: #6366f1;
        --vn-secondary: #8b5cf6;
        --vn-accent: #ffd700;
        --vn-card-bg: rgba(15, 23, 42, 0.92);
        --vn-border: rgba(129, 140, 248, 0.5);
        --vn-glow: rgba(99, 102, 241, 0.35);
        --vn-text: #f8fafc;
      }

      ${TEXT_EFFECTS_CSS}

      .vn-overlay-root {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        z-index: 9990;
        background: #000;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        user-select: none;
        overflow: hidden;
      }

      .vn-safety-exit-btn {
        position: fixed;
        top: 16px;
        left: 16px;
        z-index: 99999;
        background: rgba(15, 23, 42, 0.85);
        color: #f1f5f9;
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        backdrop-filter: blur(8px);
        transition: all 0.2s ease;
      }
      .vn-safety-exit-btn:hover {
        background: rgba(30, 41, 59, 0.95);
        border-color: #38bdf8;
        color: #38bdf8;
        transform: translateY(-1px);
      }

      /* Staging & Background */
      .vn-stage {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      .vn-stage-bg {
        position: absolute;
        inset: 0;
        z-index: 0;
      }
      .vn-bg-media {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      /* Characters & Paper-Doll Layers */
      .vn-stage-characters {
        position: absolute;
        inset: 0;
        z-index: 1;
        display: flex;
        justify-content: space-around;
        align-items: flex-end;
        padding-bottom: 90px;
        pointer-events: none;
      }
      @keyframes vn-char-slide-in {
        from {
          opacity: 0;
          transform: translate(var(--char-offset-x, 0px), calc(var(--char-offset-y, 0px) + 20px)) scale(calc(var(--char-scale, 1) * 0.96));
        }
        to {
          opacity: 1;
          transform: translate(var(--char-offset-x, 0px), var(--char-offset-y, 0px)) scale(var(--char-scale, 1));
        }
      }

      .vn-char-slot {
        height: 85%;
        max-width: 25%;
        position: relative;
        display: flex;
        justify-content: center;
        align-items: flex-end;
        transform: translate(var(--char-offset-x, 0px), var(--char-offset-y, 0px)) scale(var(--char-scale, 1));
        transform-origin: bottom center;
        transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.35s ease, opacity 0.35s ease;
        animation: vn-char-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) backwards;
        animation-delay: var(--enter-delay, 0s);
        pointer-events: auto;
        cursor: pointer;
      }
      .vn-char-slot:hover {
        transform: translate(var(--char-offset-x, 0px), calc(var(--char-offset-y, 0px) - 6px)) scale(calc(var(--char-scale, 1) * 1.02));
        z-index: 6;
      }
      .vn-char-slot:hover .vn-char-tag {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
      .vn-char-tag {
        position: absolute;
        bottom: 12px;
        left: 50%;
        transform: translateX(-50%) translateY(6px);
        background: rgba(15, 23, 42, 0.88);
        border: 1px solid rgba(129, 140, 248, 0.4);
        color: #f8fafc;
        padding: 3px 10px;
        border-radius: 9999px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.3px;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      }
      .vn-char-speaker {
        transform: translate(var(--char-offset-x, 0px), calc(var(--char-offset-y, 0px) - 6px)) scale(calc(var(--char-scale, 1) * 1.04));
        z-index: 5;
        filter: drop-shadow(0 0 16px rgba(129, 140, 248, 0.45)) drop-shadow(0 10px 20px rgba(0,0,0,0.6));
        opacity: 1;
      }
      .vn-char-inactive {
        transform: translate(var(--char-offset-x, 0px), var(--char-offset-y, 0px)) scale(calc(var(--char-scale, 1) * 0.98));
        z-index: 2;
        filter: drop-shadow(0 8px 16px rgba(0,0,0,0.7)) brightness(0.88) saturate(0.92);
        opacity: 1;
      }
      .vn-char-far-left { order: 1; }
      .vn-char-left { order: 2; }
      .vn-char-center { order: 3; }
      .vn-char-right { order: 4; }
      .vn-char-far-right { order: 5; }

      .vn-char-sprite {
        height: 100%;
        width: auto;
        object-fit: contain;
        filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5));
      }
      .vn-paper-doll {
        position: relative;
        width: 100%;
        height: 100%;
      }
      .vn-doll-layer {
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        height: 100%;
        width: auto;
        object-fit: contain;
        filter: drop-shadow(0 8px 16px rgba(0,0,0,0.4));
      }

      /* Tactile Sprite Touch Reactions */
      .vn-touch-overlay {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        z-index: 10;
        pointer-events: auto;
      }
      .vn-touch-zone {
        width: 100%;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .vn-touch-zone:hover {
        background: rgba(255, 255, 255, 0.05);
      }
      .vn-touch-head {
        height: 25%;
      }
      .vn-touch-face {
        height: 25%;
      }
      .vn-touch-body {
        height: 50%;
      }
      @keyframes vn-touch-bounce {
        0% { transform: translate(var(--char-offset-x, 0px), var(--char-offset-y, 0px)) scale(var(--char-scale, 1)); }
        40% { transform: translate(var(--char-offset-x, 0px), calc(var(--char-offset-y, 0px) - 10px)) scale(calc(var(--char-scale, 1) * 1.05)); }
        70% { transform: translate(var(--char-offset-x, 0px), calc(var(--char-offset-y, 0px) + 2px)) scale(calc(var(--char-scale, 1) * 0.98)); }
        100% { transform: translate(var(--char-offset-x, 0px), var(--char-offset-y, 0px)) scale(var(--char-scale, 1)); }
      }
      .vn-touch-bounce {
        animation: vn-touch-bounce 0.45s cubic-bezier(0.17, 0.89, 0.32, 1.28) !important;
      }
      .vn-touch-bubble {
        position: absolute;
        top: -45px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(15, 23, 42, 0.94);
        border: 1px solid rgba(129, 140, 248, 0.6);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 12px rgba(99, 102, 241, 0.3);
        color: #f8fafc;
        padding: 6px 12px;
        border-radius: 12px;
        font-size: 11px;
        line-height: 1.4;
        white-space: nowrap;
        max-width: 220px;
        overflow: hidden;
        text-overflow: ellipsis;
        z-index: 20;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        animation: vn-bubble-pop 0.25s cubic-bezier(0.17, 0.89, 0.32, 1.28);
        backdrop-filter: blur(8px);
      }
      .vn-touch-bubble::after {
        content: "";
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        border-width: 6px 6px 0;
        border-style: solid;
        border-color: rgba(15, 23, 42, 0.94) transparent transparent;
        display: block;
        width: 0;
      }
      .vn-touch-bubble-fade {
        opacity: 0;
        transform: translateX(-50%) translateY(-8px);
        transition: opacity 0.35s ease, transform 0.35s ease;
      }
      .vn-touch-bubble-name {
        font-size: 9px;
        font-weight: 800;
        color: #38bdf8;
        letter-spacing: 0.5px;
        text-transform: uppercase;
      }
      .vn-touch-bubble-text {
        font-size: 11px;
        color: #e2e8f0;
        font-style: italic;
      }
      @keyframes vn-bubble-pop {
        0% { opacity: 0; transform: translateX(-50%) scale(0.7) translateY(8px); }
        100% { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
      }

      /* Classic Ren'Py ADV Lower-Third Dialogue Box */
      .vn-dialogue-box {
        position: absolute;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        width: min(960px, 94%);
        min-height: 140px;
        background: var(--vn-card-bg);
        backdrop-filter: blur(20px);
        border: 2px solid var(--vn-border);
        border-radius: 16px;
        padding: 22px 28px;
        z-index: 10;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8), 0 0 20px var(--vn-glow);
        cursor: pointer;
        transition: all 0.3s ease;
      }
      .vn-nameplate {
        position: absolute;
        top: -16px;
        left: 28px;
        background: linear-gradient(135deg, var(--vn-primary), var(--vn-secondary));
        color: #ffffff;
        padding: 5px 22px;
        border-radius: 20px;
        font-weight: 800;
        font-size: 14px;
        letter-spacing: 0.5px;
        box-shadow: 0 4px 14px var(--vn-glow);
      }
      .vn-dialogue-text {
        font-size: 19px;
        line-height: 1.65;
        color: var(--vn-text);
        min-height: 52px;
      }
      .vn-prompt-indicator {
        position: absolute;
        bottom: 14px;
        right: 22px;
        color: #818cf8;
        font-size: 14px;
        animation: vn-bounce 0.8s infinite alternate ease-in-out;
      }
      .vn-dialogue-choices {
        margin-top: 14px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .vn-choice-btn {
        padding: 6px 16px;
        background: rgba(99, 102, 241, 0.2);
        border: 1px solid rgba(129, 140, 248, 0.6);
        border-radius: 8px;
        color: #c7d2fe;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
      }
      .vn-choice-btn:hover {
        background: rgba(99, 102, 241, 0.5);
        color: #fff;
        transform: translateY(-1px);
      }

      /* Reading Controls & Pacing (Anchored to top-right of dialogue box, leaving bottom for composer) */
      .vn-reading-controls {
        position: absolute;
        top: -14px;
        right: 24px;
        display: flex;
        gap: 6px;
        z-index: 12;
      }

      .vn-nav-btn {
        background: rgba(30, 41, 59, 0.8);
        border: 1px solid rgba(148, 163, 184, 0.4);
        color: #cbd5e1;
        padding: 4px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .vn-nav-btn:hover:not(:disabled) {
        background: rgba(99, 102, 241, 0.4);
        color: #fff;
        border-color: #818cf8;
      }

      .vn-nav-btn:disabled {
        opacity: 0.35;
        cursor: default;
      }

      /* "Your Turn" Composer */
      .vn-dialogue-composer {
        margin-top: 14px;
        display: flex;
        gap: 10px;
        align-items: center;
        width: 100%;
        animation: vn-fade 0.25s ease-in-out;
      }

      .vn-composer-label {
        font-size: 13px;
        font-weight: 700;
        color: #818cf8;
        white-space: nowrap;
      }

      .vn-composer-input {
        flex: 1;
        background: rgba(15, 23, 42, 0.95);
        border: 1px solid rgba(129, 140, 248, 0.5);
        border-radius: 8px;
        padding: 10px 14px;
        color: #f8fafc;
        font-size: 15px;
        font-family: inherit;
        outline: none;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.4);
      }

      .vn-composer-input:focus {
        border-color: #818cf8;
        box-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
      }

      .vn-composer-send-btn {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        border: none;
        border-radius: 8px;
        padding: 10px 18px;
        color: #ffffff;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.15s ease, background 0.2s ease;
      }

      .vn-composer-send-btn:hover {
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        transform: translateY(-1px);
      }

      /* Top Status Pill (floating Mini-HUD) */
      .vn-top-status-pill {
        position: fixed;
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        display: flex;
        align-items: center;
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 9999px;
        padding: 4px 12px;
        backdrop-filter: blur(14px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.2);
        max-width: 55vw;
        overflow-x: auto;
      }
      .vn-top-status-pill::-webkit-scrollbar { display: none; }
      .vn-pill-item {
        background: transparent;
        border: none;
        color: #f1f5f9;
        font-size: 12px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 9999px;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s ease;
      }
      .vn-pill-item:hover {
        background: rgba(255, 255, 255, 0.14);
        color: #38bdf8;
      }
      .vn-pill-sep {
        width: 1px;
        height: 14px;
        background: rgba(255, 255, 255, 0.18);
        margin: 0 2px;
        flex-shrink: 0;
      }
      .vn-pill-icon {
        font-size: 13px;
      }
      .vn-pill-text {
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* HUD Menu Bar - Vertical Navigation Rail on Left */
      .vn-hud-menubar {
        position: fixed;
        top: 68px;
        left: 16px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 6px;
        max-height: calc(100vh - 90px);
        overflow-y: auto;
        scrollbar-width: none;
      }
      .vn-hud-menubar::-webkit-scrollbar { display: none; }
      .vn-hud-btn {
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        padding: 7px 12px;
        color: #f8fafc;
        font-size: 12px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 7px;
        cursor: pointer;
        backdrop-filter: blur(8px);
        position: relative;
        transition: all 0.2s ease;
        white-space: nowrap;
      }
      .vn-hud-btn:hover {
        background: rgba(30, 41, 59, 0.95);
        border-color: #818cf8;
        color: #fff;
      }
      .vn-hud-btn.active {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.35), rgba(139, 92, 246, 0.25));
        border-color: #a5b4fc;
        color: #fff;
        box-shadow: 0 0 10px rgba(99, 102, 241, 0.35);
      }
      .vn-hud-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        background: #f43f5e;
        color: #fff;
        font-size: 10px;
        font-weight: 800;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 8px #f43f5e;
      }
      .vn-hud-badge.vn-pulse {
        animation: vn-badge-pulse 1.5s infinite;
      }
      @keyframes vn-badge-pulse {
        0% { transform: scale(1); box-shadow: 0 0 4px #f43f5e; }
        50% { transform: scale(1.25); box-shadow: 0 0 14px #f43f5e; }
        100% { transform: scale(1); box-shadow: 0 0 4px #f43f5e; }
      }

      /* HUD Modal / Overlay (Ren'Py Glassmorphism) */
      .vn-hud-overlay {
        position: fixed;
        inset: 0;
        z-index: 99998;
        background: rgba(0, 0, 0, 0.72);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .vn-hud-modal {
        background: rgba(15, 23, 42, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 20px;
        width: min(840px, calc(94vw - 110px));
        margin-left: 110px;
        max-height: 86vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        position: relative;
        backdrop-filter: blur(24px);
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.85), 0 0 1px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.12);
      }
      @media (max-width: 768px) {
        .vn-hud-menubar {
          top: auto;
          bottom: 16px;
          left: 16px;
          right: 16px;
          flex-direction: row;
          max-height: none;
          overflow-x: auto;
        }
        .vn-hud-modal {
          margin-left: 0;
          width: 96%;
        }
      }
      .vn-hud-close-btn {
        position: absolute;
        top: 14px;
        right: 18px;
        background: transparent;
        border: none;
        color: #94a3b8;
        font-size: 20px;
        cursor: pointer;
        padding: 4px;
      }
      .vn-hud-close-btn:hover { color: #fff; }
      .vn-hud-panel-body {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
      }

      /* Generic Tab Styles */
      .vn-tab-header {
        margin-bottom: 20px;
        border-bottom: 1px solid #1e293b;
        padding-bottom: 12px;
      }
      .vn-tab-header h3 {
        font-size: 18px;
        color: #f1f5f9;
        margin: 0;
      }
      .vn-section {
        margin-bottom: 20px;
      }
      .vn-section h4 {
        font-size: 14px;
        color: #94a3b8;
        margin-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .vn-muted { color: #64748b; font-size: 13px; }

      .vn-btn {
        padding: 8px 16px;
        border-radius: 6px;
        border: none;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .vn-btn-sm { padding: 4px 10px; font-size: 12px; }
      .vn-btn-primary { background: #6366f1; color: #fff; }
      .vn-btn-primary:hover { background: #4f46e5; }
      .vn-btn-secondary { background: #334155; color: #cbd5e1; }
      .vn-btn-secondary:hover { background: #475569; }
      .vn-btn-warning { background: #d97706; color: #fff; }
      .vn-btn-warning:hover { background: #b45309; }
      .vn-btn-danger { background: #e11d48; color: #fff; }
      .vn-btn-danger:hover { background: #be123c; }

      /* Wardrobe Grid */
      .vn-wardrobe-status-bar {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        padding: 10px 14px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        margin-bottom: 16px;
      }
      .vn-wardrobe-status-item {
        font-size: 13px;
        color: #94a3b8;
        display: flex;
        gap: 6px;
        align-items: center;
      }
      .vn-wardrobe-status-item strong {
        color: #f8fafc;
      }
      .vn-wardrobe-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 12px;
        margin-bottom: 20px;
      }
      .vn-slot-card {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 10px;
        padding: 12px;
      }
      .vn-slot-title { font-size: 12px; color: #94a3b8; margin-bottom: 4px; }
      .vn-slot-value { font-size: 14px; font-weight: 600; color: #f8fafc; margin-bottom: 10px; }
      .vn-slot-actions { display: flex; gap: 6px; }
      .vn-tab-footer { display: flex; gap: 10px; }

      /* Stats & Badges */
      .vn-badges-container { display: flex; flex-wrap: wrap; gap: 8px; }
      .vn-passion-badge {
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        display: flex;
        gap: 6px;
      }
      .vn-badge-low { background: rgba(59, 130, 246, 0.2); border: 1px solid #3b82f6; color: #93c5fd; }
      .vn-badge-mid { background: rgba(245, 158, 11, 0.2); border: 1px solid #f59e0b; color: #fcd34d; }
      .vn-badge-high { background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #fca5a5; }

      .vn-meter-row { margin-bottom: 12px; }
      .vn-meter-header { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; color: #cbd5e1; }
      .vn-meter-bar-bg { height: 8px; background: #1e293b; border-radius: 4px; overflow: hidden; }
      .vn-meter-bar-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #38bdf8); border-radius: 4px; transition: width 0.3s ease; }

      /* Inventory */
      .vn-hands-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
      .vn-item-card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 12px; }
      .vn-item-title { font-size: 11px; color: #94a3b8; margin-bottom: 4px; }
      .vn-item-desc { font-size: 14px; font-weight: 600; color: #f8fafc; margin-bottom: 8px; }
      .vn-items-list { display: flex; flex-direction: column; gap: 8px; }
      .vn-item-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #1e293b;
        padding: 8px 12px;
        border-radius: 8px;
        border: 1px solid #334155;
      }
      .vn-item-row-actions { display: flex; gap: 6px; }

      /* Map */
      .vn-current-loc { font-size: 13px; color: #38bdf8; margin-top: 4px; }
      .vn-routes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
      .vn-route-card {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 10px;
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .vn-route-dest { font-size: 14px; font-weight: 600; color: #f8fafc; }
      .vn-route-time { font-size: 12px; color: #94a3b8; }

      /* Phone Frame */
      .vn-phone-frame-container {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 10px 0;
      }

      /* Journal & Opps */
      .vn-opps-list, .vn-journal-events { display: flex; flex-direction: column; gap: 10px; }
      .vn-opp-card, .vn-journal-entry {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 10px;
        padding: 12px 16px;
      }
      .vn-opp-header { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
      .vn-opp-body { font-size: 14px; color: #f8fafc; margin-bottom: 8px; }
      .vn-opp-footer { font-size: 12px; color: #94a3b8; display: flex; justify-content: space-between; }
      .vn-status-badge { font-size: 11px; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
      .vn-status-lead { background: #3b82f6; color: #fff; }
      .vn-status-taken { background: #10b981; color: #fff; }
      .vn-status-contested { background: #f59e0b; color: #fff; }
      .vn-status-lost { background: #ef4444; color: #fff; }

      .vn-evt-header { font-size: 13px; color: #94a3b8; margin-bottom: 4px; }
      .vn-evt-action { font-size: 14px; color: #f8fafc; margin-bottom: 6px; }
      .vn-mutations-list { font-size: 12px; color: #38bdf8; margin: 0; padding-left: 20px; }

      /* Stat Mutation Toasts */
      .vn-toast-container {
        position: absolute;
        top: 70px;
        right: 24px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 99995;
        pointer-events: none;
      }
      .vn-stat-toast {
        background: rgba(15, 23, 42, 0.88);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(129, 140, 248, 0.6);
        border-left: 4px solid #818cf8;
        padding: 8px 14px;
        border-radius: 8px;
        color: #f8fafc;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 8px 24px rgba(0,0,0,0.6);
        animation: vn-toast-slide 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
      }
      @keyframes vn-toast-slide {
        from { transform: translateX(40px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }

      /* Autoplay Button */
      .vn-auto-btn {
        padding: 6px 12px;
        font-weight: 600;
        color: #cbd5e1;
      }

      /* Galgame Centered Choice Menu */
      .vn-choice-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.65);
        backdrop-filter: blur(8px);
        z-index: 99996;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .vn-choice-modal {
        width: min(640px, 90%);
        background: var(--vn-card-bg);
        border: 2px solid var(--vn-border);
        border-radius: 20px;
        padding: 24px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px var(--vn-glow);
      }

      .vn-choice-title {
        text-align: center;
        font-size: 16px;
        font-weight: 700;
        color: var(--vn-accent);
        margin-bottom: 16px;
      }

      .vn-choice-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .vn-galgame-choice-btn {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 18px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--vn-border);
        border-radius: 12px;
        color: var(--vn-text);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .vn-galgame-choice-btn:hover {
        transform: translateX(8px);
        background: rgba(255, 255, 255, 0.12);
        border-color: var(--vn-accent);
      }

      .vn-choice-pill {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--vn-primary);
        color: #fff;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .vn-choice-label {
        flex: 1;
        font-size: 15px;
        font-weight: 600;
        text-align: left;
      }

      .vn-choice-arrow {
        color: var(--vn-accent);
        opacity: 0.6;
      }

      /* Ren'Py Dialogue Backlog Drawer */
      .vn-backlog-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(10px);
        z-index: 99997;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .vn-backlog-modal {
        width: min(780px, 92%);
        max-height: 80vh;
        background: var(--vn-card-bg);
        border: 2px solid var(--vn-border);
        border-radius: 20px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .vn-backlog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 22px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .vn-backlog-list {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .vn-backlog-item {
        background: rgba(255, 255, 255, 0.04);
        border-left: 3px solid var(--vn-primary);
        border-radius: 8px;
        padding: 10px 14px;
      }

      .vn-backlog-user {
        border-left-color: #38bdf8;
      }
    `;
    document.head.appendChild(this.styleEl);
  }
  destroy() {
    this.deactivate();
    this.audioEngine.destroy();
    this.ttsEngine.stop();
    this.stageRenderer.destroy();
    this.dialogueBox.destroy();
    this.root.remove();
    this.styleEl?.remove();
  }
}

// src/frontend/studio/diagnostics-drawer.ts
function escapeHtml2(text) {
  return String(text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function registerDiagnosticsDrawer(ctx, onLaunchStage) {
  if (typeof ctx.ui?.registerDrawerTab !== "function")
    return null;
  const tab = ctx.ui.registerDrawerTab({
    id: "vn_diagnostics",
    title: "LumiVN Controls & Diagnostics",
    shortName: "VN Studio",
    headerTitle: "Visual Novel Studio",
    description: "Launch visual novel stage, inspect Ledger parsing, and copy engine logs",
    keywords: ["vn", "diagnostics", "ledger", "visual novel", "stage", "studio", "director"],
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>`
  });
  const root = tab.root;
  let rawLogHistory = [];
  let rawDirectorLogs = [];
  let latestLedgerData = null;
  let latestManifestData = null;
  let activeConsoleTab = "logs";
  root.innerHTML = `
    <div style="padding: 16px; font-family: system-ui, -apple-system, sans-serif; color: #f1f5f9; height: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; box-sizing: border-box;">
      <!-- Primary Launch Controls -->
      <div style="background: linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.25)); border: 1px solid rgba(129,140,248,0.5); border-radius: 12px; padding: 14px; text-align: center;">
        <h3 style="margin: 0 0 4px 0; font-size: 15px; color: #fff;">LumiVN Control Center</h3>
        <p style="font-size: 11px; color: #94a3b8; margin: 0 0 10px 0;">Switch between standard chat and the visual novel stage.</p>
        <button id="vn-btn-launch-stage" style="width: 100%; padding: 10px 16px; background: #6366f1; border: none; border-radius: 8px; color: #fff; font-weight: 700; font-size: 13px; cursor: pointer; transition: background 0.2s ease;">
          ▶ Open Visual Novel Stage
        </button>
      </div>

      <!-- Director Prompt Editor Card -->
      <details class="vn-director-card" open style="background: rgba(15, 23, 42, 0.7); border: 1px solid #334155; border-radius: 10px; padding: 12px;">
        <summary style="font-size: 13px; font-weight: 700; color: #a5b4fc; cursor: pointer; display: flex; align-items: center; justify-content: space-between; user-select: none;">
          <span>\uD83C\uDFAC Director Instructions & Scene Notes</span>
          <label id="vn-director-toggle-label" style="font-size: 11px; font-weight: 500; color: #cbd5e1; display: inline-flex; align-items: center; gap: 4px; cursor: pointer;" onclick="event.stopPropagation()">
            <input type="checkbox" id="vn-director-enabled" checked style="accent-color: #6366f1; cursor: pointer;" />
            Active
          </label>
        </summary>

        <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 10px;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <label for="vn-director-system" style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase;">
                Director System Directives
              </label>
            </div>
            <textarea id="vn-director-system" rows="4" placeholder="System directives enforced before generation..." style="width: 100%; box-sizing: border-box; background: #020617; border: 1px solid #334155; border-radius: 6px; color: #f8fafc; font-family: ui-monospace, Menlo, monospace; font-size: 11px; padding: 8px; resize: vertical; line-height: 1.4;"></textarea>
          </div>

          <div>
            <label for="vn-director-notes" style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 4px;">
              Scene Notes & Guidance (Macros: {{user}}, {{char}})
            </label>
            <textarea id="vn-director-notes" rows="3" placeholder="Optional turn guidance..." style="width: 100%; box-sizing: border-box; background: #020617; border: 1px solid #334155; border-radius: 6px; color: #f8fafc; font-family: ui-monospace, Menlo, monospace; font-size: 11px; padding: 8px; resize: vertical; line-height: 1.4;"></textarea>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <button id="vn-director-save-btn" type="button" style="padding: 6px 14px; font-size: 11px; font-weight: 700; background: #6366f1; border: none; border-radius: 6px; color: #fff; cursor: pointer; transition: background 0.2s;">
              Save Directives
            </button>
          </div>
        </div>
      </details>

      <!-- Turn Telemetry -->
      <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid #334155; border-radius: 10px; padding: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h4 style="margin: 0; font-size: 11px; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px;">Turn Telemetry</h4>
          <button id="vn-copy-state-btn" style="padding: 2px 8px; font-size: 10px; background: #1e293b; border: 1px solid #475569; border-radius: 4px; color: #cbd5e1; cursor: pointer;">
            \uD83D\uDCCB Copy State JSON
          </button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Ledger Block:</span>
            <span id="diag-ledger-status" style="font-weight: 600; color: #94a3b8;">Pending turn</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Location:</span>
            <span id="diag-place-id" style="font-weight: 600; color: #e2e8f0;">—</span>
          </div>
          <div>
            <span style="color: #94a3b8;">Cast Detected:</span>
            <div id="diag-cast-list" style="font-size: 11px; color: #e2e8f0; margin-top: 1px;">None</div>
          </div>
          <div>
            <span style="color: #94a3b8;">Background URL:</span>
            <div id="diag-bg-url" style="font-size: 11px; color: #38bdf8; word-break: break-all; margin-top: 1px;">—</div>
          </div>
        </div>
      </div>

      <!-- Roleplay Prop & UI Templates Card -->
      <details class="vn-props-card" style="background: rgba(15, 23, 42, 0.7); border: 1px solid #38bdf8; border-radius: 10px; padding: 12px;">
        <summary style="font-size: 13px; font-weight: 700; color: #38bdf8; cursor: pointer; display: flex; align-items: center; justify-content: space-between; user-select: none;">
          <span>\uD83C\uDFAD Roleplay Prop & UI Templates</span>
          <span style="font-size: 10px; background: rgba(56, 189, 248, 0.2); border: 1px solid #0284c7; color: #7dd3fc; padding: 2px 6px; border-radius: 4px;">HTML/CSS Props</span>
        </summary>
        <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 10px;">
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">
            Select a prop widget to inspect live game styling and copy its prompt tag:
          </p>
          <div id="vn-prop-tabs" style="display: flex; gap: 4px; flex-wrap: wrap;">
            ${PROP_TEMPLATES_CATALOG.map((p, idx) => `
              <button class="vn-prop-select-btn" data-prop-id="${p.id}" style="padding: 3px 8px; font-size: 11px; background: ${idx === 0 ? "#0284c7" : "#1e293b"}; border: 1px solid ${idx === 0 ? "#38bdf8" : "#475569"}; color: #fff; border-radius: 4px; cursor: pointer;">
                ${p.icon} ${p.name}
              </button>
            `).join("")}
          </div>

          <!-- Live Preview Box -->
          <div style="background: #020617; border: 1px solid #334155; border-radius: 8px; padding: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span id="vn-prop-desc" style="font-size: 10px; color: #94a3b8;">${PROP_TEMPLATES_CATALOG[0]?.description}</span>
              <button id="vn-copy-prop-tag-btn" style="padding: 2px 8px; font-size: 10px; font-weight: 700; background: #1e293b; border: 1px solid #38bdf8; color: #38bdf8; border-radius: 4px; cursor: pointer;">
                \uD83D\uDCCB Copy Tag
              </button>
            </div>
            <div id="vn-prop-preview-container" style="min-height: 60px;">
              ${formatDialogueHtml(PROP_TEMPLATES_CATALOG[0]?.sampleTag || "").html}
            </div>
          </div>

          <!-- Custom Prop CSS Overrides -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <label for="vn-custom-css-input" style="font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase;">
                Custom Prop CSS Overrides
              </label>
              <button id="vn-save-custom-css-btn" style="padding: 2px 8px; font-size: 10px; background: #0284c7; border: none; color: #fff; border-radius: 4px; cursor: pointer; font-weight: 700;">
                \uD83D\uDCBE Save CSS
              </button>
            </div>
            <textarea id="vn-custom-css-input" rows="3" placeholder="/* Add custom CSS rules for .vn-prop-card or custom classes */" style="width: 100%; box-sizing: border-box; background: #020617; border: 1px solid #334155; border-radius: 6px; color: #f8fafc; font-family: ui-monospace, Menlo, monospace; font-size: 10px; padding: 6px; resize: vertical;"></textarea>
          </div>
        </div>
      </details>

      <!-- Engine & Director Impact Console -->
      <div style="flex: 1; display: flex; flex-direction: column; background: #020617; border: 1px solid #1e293b; border-radius: 10px; padding: 10px; min-height: 220px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <div style="display: flex; gap: 4px;">
            <button id="vn-console-tab-logs" type="button" style="padding: 2px 8px; font-size: 10px; font-weight: 700; background: #334155; border: 1px solid #475569; border-radius: 4px; color: #fff; cursor: pointer;">
              Diagnostic Console
            </button>
            <button id="vn-console-tab-director" type="button" style="padding: 2px 8px; font-size: 10px; font-weight: 600; background: #1e293b; border: 1px solid #334155; border-radius: 4px; color: #94a3b8; cursor: pointer;">
              Director Impact
            </button>
          </div>
          <div style="display: flex; gap: 6px;">
            <button id="vn-copy-logs-btn" style="padding: 2px 8px; font-size: 10px; background: #334155; border: 1px solid #475569; border-radius: 4px; color: #f8fafc; font-weight: 600; cursor: pointer;">
              \uD83D\uDCCB Copy Logs
            </button>
            <button id="vn-clear-log-btn" style="padding: 2px 6px; font-size: 10px; background: #1e293b; border: 1px solid #334155; border-radius: 4px; color: #94a3b8; cursor: pointer;">
              Clear
            </button>
          </div>
        </div>

        <!-- Stream: Engine Logs -->
        <div id="vn-console-stream" style="flex: 1; overflow-y: auto; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; color: #cbd5e1; display: flex; flex-direction: column; gap: 4px; user-select: text;">
          <div style="color: #64748b;">[System] Diagnostic log initialized.</div>
        </div>

        <!-- Stream: Director Impact Logs -->
        <div id="vn-director-log-stream" style="flex: 1; overflow-y: auto; font-family: system-ui, -apple-system, sans-serif; font-size: 11px; color: #cbd5e1; display: none; flex-direction: column; gap: 8px; user-select: text;">
          <div id="vn-director-empty-notice" style="color: #64748b; font-style: italic;">No Director impact turns recorded yet.</div>
        </div>
      </div>
    </div>
  `;
  root.querySelector("#vn-btn-launch-stage")?.addEventListener("click", onLaunchStage);
  const consoleStream = root.querySelector("#vn-console-stream");
  const directorStream = root.querySelector("#vn-director-log-stream");
  const directorEmptyNotice = root.querySelector("#vn-director-empty-notice");
  const tabLogsBtn = root.querySelector("#vn-console-tab-logs");
  const tabDirectorBtn = root.querySelector("#vn-console-tab-director");
  const systemTextarea = root.querySelector("#vn-director-system");
  const notesTextarea = root.querySelector("#vn-director-notes");
  const enabledCheckbox = root.querySelector("#vn-director-enabled");
  const saveBtn = root.querySelector("#vn-director-save-btn");
  const copyLogsBtn = root.querySelector("#vn-copy-logs-btn");
  const copyStateBtn = root.querySelector("#vn-copy-state-btn");
  const setConsoleTab = (tabMode) => {
    activeConsoleTab = tabMode;
    if (tabMode === "logs") {
      if (consoleStream)
        consoleStream.style.display = "flex";
      if (directorStream)
        directorStream.style.display = "none";
      if (tabLogsBtn) {
        tabLogsBtn.style.background = "#334155";
        tabLogsBtn.style.color = "#fff";
      }
      if (tabDirectorBtn) {
        tabDirectorBtn.style.background = "#1e293b";
        tabDirectorBtn.style.color = "#94a3b8";
      }
    } else {
      if (consoleStream)
        consoleStream.style.display = "none";
      if (directorStream)
        directorStream.style.display = "flex";
      if (tabDirectorBtn) {
        tabDirectorBtn.style.background = "#334155";
        tabDirectorBtn.style.color = "#fff";
      }
      if (tabLogsBtn) {
        tabLogsBtn.style.background = "#1e293b";
        tabLogsBtn.style.color = "#94a3b8";
      }
    }
  };
  tabLogsBtn?.addEventListener("click", () => setConsoleTab("logs"));
  tabDirectorBtn?.addEventListener("click", () => setConsoleTab("director"));
  saveBtn?.addEventListener("click", () => {
    const settings = {
      systemPrompt: systemTextarea?.value || "",
      userNotes: notesTextarea?.value || "",
      enabled: enabledCheckbox?.checked ?? true
    };
    ctx.sendToBackend?.({
      type: "vn_save_director_settings",
      settings
    });
    if (saveBtn) {
      saveBtn.textContent = "✓ Saved!";
      setTimeout(() => saveBtn.textContent = "Save Directives", 1500);
    }
  });
  let styleEl = document.getElementById("lumivn-custom-prop-styles");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "lumivn-custom-prop-styles";
    document.head.appendChild(styleEl);
  }
  let savedCustomCss = "";
  try {
    savedCustomCss = localStorage.getItem("lumivn_custom_prop_css") || "";
  } catch {}
  styleEl.textContent = `${TEXT_EFFECTS_CSS}
${savedCustomCss}`;
  let selectedPropDef = PROP_TEMPLATES_CATALOG[0];
  const propDesc = root.querySelector("#vn-prop-desc");
  const propPreview = root.querySelector("#vn-prop-preview-container");
  const copyTagBtn = root.querySelector("#vn-copy-prop-tag-btn");
  const customCssInput = root.querySelector("#vn-custom-css-input");
  const saveCustomCssBtn = root.querySelector("#vn-save-custom-css-btn");
  if (customCssInput) {
    customCssInput.value = savedCustomCss;
  }
  root.querySelectorAll(".vn-prop-select-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const propId = btn.getAttribute("data-prop-id");
      const found = PROP_TEMPLATES_CATALOG.find((p) => p.id === propId);
      if (found) {
        selectedPropDef = found;
        if (propDesc)
          propDesc.textContent = found.description;
        if (propPreview)
          propPreview.innerHTML = formatDialogueHtml(found.sampleTag).html;
        root.querySelectorAll(".vn-prop-select-btn").forEach((b) => {
          b.style.background = b === btn ? "#0284c7" : "#1e293b";
          b.style.borderColor = b === btn ? "#38bdf8" : "#475569";
        });
      }
    });
  });
  copyTagBtn?.addEventListener("click", async () => {
    await navigator.clipboard.writeText(selectedPropDef.sampleTag).catch(() => {});
    if (copyTagBtn) {
      const orig = copyTagBtn.textContent;
      copyTagBtn.textContent = "✓ Copied Tag!";
      copyTagBtn.style.borderColor = "#10b981";
      setTimeout(() => {
        copyTagBtn.textContent = orig;
        copyTagBtn.style.borderColor = "#38bdf8";
      }, 1500);
    }
  });
  saveCustomCssBtn?.addEventListener("click", () => {
    const cssVal = customCssInput?.value || "";
    try {
      localStorage.setItem("lumivn_custom_prop_css", cssVal);
    } catch {}
    if (styleEl) {
      styleEl.textContent = `${TEXT_EFFECTS_CSS}
${cssVal}`;
    }
    if (saveCustomCssBtn) {
      const orig = saveCustomCssBtn.textContent;
      saveCustomCssBtn.textContent = "✓ Saved!";
      setTimeout(() => saveCustomCssBtn.textContent = orig, 1500);
    }
  });
  root.querySelector("#vn-clear-log-btn")?.addEventListener("click", () => {
    if (activeConsoleTab === "logs") {
      if (consoleStream)
        consoleStream.innerHTML = "";
      rawLogHistory = [];
    } else {
      if (directorStream) {
        directorStream.innerHTML = "";
        if (directorEmptyNotice) {
          directorStream.appendChild(directorEmptyNotice);
          directorEmptyNotice.style.display = "block";
        }
      }
      rawDirectorLogs = [];
    }
  });
  const pushLog = (msg, level = "info") => {
    const time = new Date().toLocaleTimeString();
    const entry = `[${time}] [${level.toUpperCase()}] ${msg}`;
    rawLogHistory.push(entry);
    if (!consoleStream)
      return;
    const line = document.createElement("div");
    line.style.wordBreak = "break-word";
    line.style.color = level === "error" ? "#f43f5e" : level === "warn" ? "#f59e0b" : level === "action" ? "#38bdf8" : "#cbd5e1";
    line.textContent = entry;
    consoleStream.appendChild(line);
    consoleStream.scrollTop = consoleStream.scrollHeight;
  };
  copyLogsBtn?.addEventListener("click", async () => {
    try {
      if (activeConsoleTab === "logs") {
        await navigator.clipboard.writeText(rawLogHistory.join(`
`));
      } else {
        await navigator.clipboard.writeText(JSON.stringify(rawDirectorLogs, null, 2));
      }
      copyLogsBtn.textContent = "✓ Copied!";
      setTimeout(() => copyLogsBtn.textContent = "\uD83D\uDCCB Copy Logs", 1500);
    } catch (e) {
      pushLog(`Clipboard write failed: ${String(e)}`, "error");
    }
  });
  copyStateBtn?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(latestLedgerData || {}, null, 2));
      copyStateBtn.textContent = "✓ Copied!";
      setTimeout(() => copyStateBtn.textContent = "\uD83D\uDCCB Copy State JSON", 1500);
    } catch (e) {
      pushLog(`Failed to copy state: ${String(e)}`, "error");
    }
  });
  const updateDiagnostic = (data) => {
    const elLedger = root.querySelector("#diag-ledger-status");
    const elPlace = root.querySelector("#diag-place-id");
    const elCast = root.querySelector("#diag-cast-list");
    const elBg = root.querySelector("#diag-bg-url");
    if (elLedger) {
      elLedger.textContent = data.hasLedger ? "DETECTED (Parsed)" : "NOT FOUND (Prose-only)";
      elLedger.style.color = data.hasLedger ? "#10b981" : "#f59e0b";
    }
    if (elPlace)
      elPlace.textContent = data.placeId || "default";
    if (elCast)
      elCast.textContent = data.participants.length > 0 ? data.participants.join(", ") : "None";
    if (elBg)
      elBg.textContent = data.bgUrl.startsWith("data:") ? "[Fallback SVG Data URI]" : data.bgUrl;
    pushLog(`Turn parsed: place='${data.placeId}', actors=${data.participants.length}`, "info");
  };
  const setLatestLedger = (ledger) => {
    latestLedgerData = ledger;
  };
  const setLatestManifest = (manifest) => {
    latestManifestData = manifest;
  };
  const setDirectorSettings = (settings) => {
    if (!settings)
      return;
    if (systemTextarea)
      systemTextarea.value = settings.systemPrompt || "";
    if (notesTextarea)
      notesTextarea.value = settings.userNotes || "";
    if (enabledCheckbox)
      enabledCheckbox.checked = settings.enabled ?? true;
  };
  const renderDirectorLogCard = (entry) => {
    const card = document.createElement("div");
    card.style.cssText = "background: rgba(15, 23, 42, 0.8); border: 1px solid #334155; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px; font-size: 11px;";
    const hasWorld = entry.worldChanges && entry.worldChanges.length > 0;
    const hasNpc = entry.npcChanges && entry.npcChanges.length > 0;
    const hasMut = entry.mutations && entry.mutations.length > 0;
    const isQuiet = !hasWorld && !hasNpc && !hasMut;
    let worldHtml = "";
    if (hasWorld) {
      worldHtml = `
        <div style="color: #38bdf8;">
          <span style="font-weight: 700; text-transform: uppercase; font-size: 10px;">[World Shifts]</span>
          <ul style="margin: 2px 0 0 16px; padding: 0;">
            ${entry.worldChanges.map((w) => `<li>${escapeHtml2(w)}</li>`).join("")}
          </ul>
        </div>
      `;
    }
    let npcHtml = "";
    if (hasNpc) {
      npcHtml = `
        <div style="color: #34d399;">
          <span style="font-weight: 700; text-transform: uppercase; font-size: 10px;">[NPC Intent]</span>
          <ul style="margin: 2px 0 0 16px; padding: 0;">
            ${entry.npcChanges.map((n) => {
        const parts = [];
        if (n.wantNow)
          parts.push(`want_now -> "${escapeHtml2(n.wantNow)}"`);
        if (n.passionsMoved && Object.keys(n.passionsMoved).length > 0) {
          parts.push(`passions: ${Object.entries(n.passionsMoved).map(([k, v]) => `${k} (${v})`).join(", ")}`);
        }
        if (n.relationsMoved && Object.keys(n.relationsMoved).length > 0) {
          parts.push(`relations: ${escapeHtml2(JSON.stringify(n.relationsMoved))}`);
        }
        return `<li><strong>${escapeHtml2(n.name)}:</strong> ${parts.join(" | ")}</li>`;
      }).join("")}
          </ul>
        </div>
      `;
    }
    let mutHtml = "";
    if (hasMut) {
      mutHtml = `
        <div style="color: #f43f5e;">
          <span style="font-weight: 700; text-transform: uppercase; font-size: 10px;">[Mutations]</span>
          <ul style="margin: 2px 0 0 16px; padding: 0;">
            ${entry.mutations.map((m) => `<li>${escapeHtml2(m)}</li>`).join("")}
          </ul>
        </div>
      `;
    }
    let quietHtml = "";
    if (isQuiet) {
      quietHtml = `<div style="color: #64748b; font-style: italic; font-size: 10px;">No structural changes recorded this turn.</div>`;
    }
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 4px; font-size: 10px;">
        <span style="font-weight: 700; color: #818cf8;">⚡ TURN IMPACT</span>
        <span style="color: #94a3b8;">${entry.timestamp || ""}</span>
      </div>
      <details style="cursor: pointer;">
        <summary style="color: #a78bfa; font-weight: 600; font-size: 10px;">[Directive] Active Guidance</summary>
        <div style="background: #020617; border: 1px solid #1e293b; border-radius: 4px; padding: 6px; margin-top: 4px; font-family: ui-monospace, Menlo, monospace; font-size: 10px; color: #cbd5e1; white-space: pre-wrap; word-break: break-word;">${escapeHtml2(entry.directive)}</div>
      </details>
      ${worldHtml}
      ${npcHtml}
      ${mutHtml}
      ${quietHtml}
    `;
    return card;
  };
  const pushDirectorLog = (log) => {
    rawDirectorLogs.push(log);
    if (rawDirectorLogs.length > 20) {
      rawDirectorLogs.shift();
    }
    if (!directorStream)
      return;
    if (directorEmptyNotice)
      directorEmptyNotice.style.display = "none";
    const card = renderDirectorLogCard(log);
    directorStream.appendChild(card);
    directorStream.scrollTop = directorStream.scrollHeight;
  };
  const setDirectorLogs = (logs) => {
    rawDirectorLogs = Array.isArray(logs) ? [...logs] : [];
    if (!directorStream)
      return;
    directorStream.innerHTML = "";
    if (rawDirectorLogs.length === 0) {
      directorStream.appendChild(directorEmptyNotice);
      if (directorEmptyNotice)
        directorEmptyNotice.style.display = "block";
      return;
    }
    if (directorEmptyNotice)
      directorEmptyNotice.style.display = "none";
    for (const entry of rawDirectorLogs) {
      directorStream.appendChild(renderDirectorLogCard(entry));
    }
    directorStream.scrollTop = directorStream.scrollHeight;
  };
  return {
    tab,
    pushLog,
    updateDiagnostic,
    setLatestLedger,
    setLatestManifest,
    setDirectorSettings,
    pushDirectorLog,
    setDirectorLogs
  };
}

// src/frontend.ts
var CLEANUP_KEY = "__lumivnCleanup";
function setup(ctx) {
  if (typeof ctx.deferReady === "function") {
    ctx.deferReady();
  }
  const prevCleanup = globalThis[CLEANUP_KEY];
  if (typeof prevCleanup === "function") {
    try {
      prevCleanup();
    } catch {}
  }
  let appMount = null;
  let floatWidget = null;
  let mountContainer;
  if (typeof ctx.ui?.mountApp === "function") {
    appMount = ctx.ui.mountApp({
      className: "lumivn-app-mount",
      position: "app-overlay"
    });
    mountContainer = appMount.root;
    appMount.setVisible(false);
  } else {
    mountContainer = document.createElement("div");
    mountContainer.className = "lumivn-fallback-mount";
    document.body.appendChild(mountContainer);
  }
  const toggleStage = () => {
    if (overlay.isActive()) {
      overlay.deactivate();
      if (appMount)
        appMount.setVisible(false);
    } else {
      if (appMount)
        appMount.setVisible(true);
      overlay.activate();
    }
  };
  const overlay = new StageOverlay({
    ctx,
    onExit: () => {
      if (appMount)
        appMount.setVisible(false);
    }
  });
  mountContainer.appendChild(overlay.root);
  const diagDrawer = registerDiagnosticsDrawer(ctx, toggleStage);
  const charactersDrawerTab = new CharactersTab(undefined, ctx);
  const statsDrawerTab = new StatsTab;
  let nativeCastTabHandle = null;
  let nativeStatsTabHandle = null;
  if (typeof ctx.ui?.registerDrawerTab === "function") {
    nativeCastTabHandle = ctx.ui.registerDrawerTab({
      id: "vn_cast",
      title: "LumiVN Cast Dossiers",
      shortName: "Cast",
      headerTitle: "Cast & Character Dossiers",
      description: "Inspect character dossiers, passions, traits, and relationship networks",
      keywords: ["cast", "characters", "dossier", "passions", "vn"],
      iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
    });
    if (nativeCastTabHandle?.root) {
      nativeCastTabHandle.root.style.cssText = "height: 100%; overflow-y: auto; padding: 12px; box-sizing: border-box;";
      nativeCastTabHandle.root.appendChild(charactersDrawerTab.root);
    }
    nativeStatsTabHandle = ctx.ui.registerDrawerTab({
      id: "vn_stats",
      title: "LumiVN Stats Matrix",
      shortName: "Stats",
      headerTitle: "Status & 21-Stat Network",
      description: "Inspect 21-stat network, vitals, and relationship matrix",
      keywords: ["stats", "matrix", "vitals", "passions", "vn"],
      iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`
    });
    if (nativeStatsTabHandle?.root) {
      nativeStatsTabHandle.root.style.cssText = "height: 100%; overflow-y: auto; padding: 12px; box-sizing: border-box;";
      nativeStatsTabHandle.root.appendChild(statsDrawerTab.root);
    }
  }
  const WIDGET_STORAGE_KEY = "lumivn_launcher_widget_pos";
  function getSavedWidgetPosition() {
    try {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem(WIDGET_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (typeof parsed.x === "number" && typeof parsed.y === "number") {
            return parsed;
          }
        }
      }
    } catch {}
    return { x: window.innerWidth - 64, y: 72 };
  }
  function saveWidgetPosition(x, y) {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify({ x, y }));
      }
    } catch {}
  }
  if (typeof ctx.ui?.createFloatWidget === "function") {
    try {
      const initPos = getSavedWidgetPosition();
      const widget = ctx.ui.createFloatWidget({
        width: 48,
        height: 48,
        initialPosition: initPos,
        snapToEdge: false,
        chromeless: true,
        tooltip: "Launch Visual Novel Stage"
      });
      floatWidget = widget;
      widget.root.style.width = "48px";
      widget.root.style.height = "48px";
      widget.root.style.position = "relative";
      widget.root.style.overflow = "visible";
      const launchBtn = document.createElement("button");
      launchBtn.className = "vn-stage-launcher-btn";
      launchBtn.innerHTML = "\uD83C\uDFAC";
      launchBtn.style.cssText = `
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        border: 2px solid #a5b4fc;
        box-shadow: 0 4px 14px rgba(99, 102, 241, 0.5);
        font-size: 22px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
        transition: transform 0.15s ease;
      `;
      launchBtn.addEventListener("mouseenter", () => {
        launchBtn.style.transform = "scale(1.08)";
      });
      launchBtn.addEventListener("mouseleave", () => {
        launchBtn.style.transform = "scale(1.0)";
      });
      launchBtn.addEventListener("click", () => {
        if (!overlay.isActive()) {
          if (appMount)
            appMount.setVisible(true);
          overlay.activate();
        } else {
          overlay.deactivate();
          if (appMount)
            appMount.setVisible(false);
        }
      });
      widget.root.appendChild(launchBtn);
      widget.root.addEventListener("pointerup", () => {
        const rect = widget.root.getBoundingClientRect();
        saveWidgetPosition(rect.left, rect.top);
      });
    } catch (e) {
      console.warn("[LumiVN] Failed to create float widget:", e);
    }
  }
  let inputBarActionHandle = null;
  if (typeof ctx.ui?.registerInputBarAction === "function") {
    try {
      const action = ctx.ui.registerInputBarAction({
        id: "lumivn_toggle",
        label: "Visual Novel",
        subtitle: "Open full-screen Visual Novel stage",
        enabled: true
      });
      action.onClick(() => toggleStage());
      inputBarActionHandle = action;
    } catch (e) {
      console.warn("[LumiVN] Failed to register input bar action:", e);
    }
  }
  let chatHeaderActionHandle = null;
  const ctxAny = ctx;
  if (typeof ctxAny.ui?.registerChatHeaderAction === "function") {
    try {
      chatHeaderActionHandle = ctxAny.ui.registerChatHeaderAction({
        id: "lumivn_header_toggle",
        label: "Visual Novel",
        tooltip: "Open full-screen Visual Novel life-sim stage",
        iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><polygon points="10 8 16 11 10 14 10 8"/><line x1="6" y1="21" x2="18" y2="21"/></svg>`,
        onClick: () => toggleStage()
      });
    } catch (e) {
      console.warn("[LumiVN] Failed to register chat header action:", e);
    }
  }
  const unsubChatSwitched = ctx.events?.on?.("CHAT_SWITCHED", (payload) => {
    const candidate = payload && typeof payload === "object" ? payload : {};
    const newChatId = (typeof candidate.chatId === "string" ? candidate.chatId : null) || ctx.getActiveChat()?.chatId || null;
    overlay.onChatChanged(newChatId);
  });
  const unsubChatChanged = ctx.events?.on?.("CHAT_CHANGED", (payload) => {
    const candidate = payload && typeof payload === "object" ? payload : {};
    const newChatId = (typeof candidate.chat?.id === "string" ? candidate.chat.id : null) || (typeof candidate.chatId === "string" ? candidate.chatId : null) || ctx.getActiveChat()?.chatId || null;
    overlay.onChatChanged(newChatId);
  });
  const unsubChatForked = ctx.events?.on?.("CHAT_FORKED", (payload) => {
    const candidate = payload && typeof payload === "object" ? payload : {};
    const newChatId = (typeof candidate.forkedChatId === "string" ? candidate.forkedChatId : null) || (typeof candidate.chat?.id === "string" ? candidate.chat.id : null) || ctx.getActiveChat()?.chatId || null;
    overlay.onChatChanged(newChatId);
  });
  const unsubscribeBackend = ctx.onBackendMessage((msg) => {
    const payload = msg;
    if (!payload || typeof payload !== "object")
      return;
    if (payload.type === "vn_force_open") {
      if (!overlay.isActive()) {
        if (appMount)
          appMount.setVisible(true);
        overlay.activate();
      }
      if (typeof payload.tab === "string") {
        overlay.openHudTab(payload.tab);
      }
      diagDrawer?.pushLog("Stage launched via Command Palette.", "info");
      diagBus.pushLog("Stage launched via Command Palette.", "info");
    } else if (payload.type === "vn_state" && payload.state) {
      const st = payload.state;
      overlay.updatePresentation(st);
      diagDrawer?.setLatestLedger(st.ledger);
      diagBus.setLedger(st.ledger);
      if (st.ledger) {
        charactersDrawerTab.render(st.ledger, overlay.getManifest?.() || undefined);
        statsDrawerTab.render(st.ledger);
      }
    } else if (payload.type === "vn_diagnostic_update" && payload.data) {
      diagDrawer?.updateDiagnostic(payload.data);
      diagBus.setTelemetry(payload.data);
    } else if (payload.type === "vn_manifest" && payload.manifest) {
      overlay.setManifest(payload.manifest);
      diagBus.setManifest(payload.manifest);
      charactersDrawerTab.render(diagBus.getLedger(), payload.manifest);
    } else if (payload.type === "vn_generating") {
      const targetCid = typeof payload.chatId === "string" ? payload.chatId : null;
      if (overlay.isActive() && (!targetCid || overlay.getCurrentChatId() === targetCid)) {
        overlay.showGenerating();
      }
    } else if (payload.type === "vn_user_message" && payload.text) {
      const targetCid = typeof payload.chatId === "string" ? payload.chatId : null;
      if (overlay.isActive() && (!targetCid || overlay.getCurrentChatId() === targetCid)) {
        const text = String(payload.text);
        const speaker = String(payload.speaker || "You");
        overlay.showUserMessage(text, speaker);
      }
    } else if (payload.type === "vn_director_note" && payload.data) {
      diagBus.setDirectorNote(payload.data);
    } else if (payload.type === "vn_stat_rules_settings" && payload.settings) {
      overlay.setStatRulesSettings(payload.settings);
    } else if (payload.type === "vn_director_settings" && payload.settings) {
      diagDrawer?.setDirectorSettings(payload.settings);
    } else if (payload.type === "vn_director_log" && payload.log) {
      diagDrawer?.pushDirectorLog(payload.log);
    } else if (payload.type === "vn_director_logs" && Array.isArray(payload.logs)) {
      diagDrawer?.setDirectorLogs(payload.logs);
    } else if (payload.type === "vn_log") {
      diagDrawer?.pushLog(String(payload.message), payload.level || "info");
      diagBus.pushLog(String(payload.message), payload.level || "info");
    } else if (payload.type === "vn_error") {
      diagDrawer?.pushLog(String(payload.error), "error");
      diagBus.pushLog(String(payload.error), "error");
    }
  });
  if (typeof ctx.ready === "function") {
    ctx.ready();
  }
  const cleanup = () => {
    unsubChatSwitched?.();
    unsubChatChanged?.();
    unsubChatForked?.();
    unsubscribeBackend();
    chatHeaderActionHandle?.destroy();
    inputBarActionHandle?.destroy();
    floatWidget?.destroy();
    diagDrawer?.tab.destroy();
    nativeCastTabHandle?.destroy?.();
    nativeStatsTabHandle?.destroy?.();
    overlay.destroy();
    if (appMount) {
      appMount.destroy();
    } else {
      mountContainer.remove();
    }
  };
  globalThis[CLEANUP_KEY] = cleanup;
  return cleanup;
}
export {
  setup
};
