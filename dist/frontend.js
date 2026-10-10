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
      const lbl = (twineP2 !== undefined ? twineP1 : twineP1).trim();
      const act = (twineP2 !== undefined ? twineP2 : twineP1).trim();
      choices.push({ text: lbl, action: act });
      return `<button class="vn-inline-choice" data-action="${escapeHtml(act)}">${escapeHtml(lbl)}</button>`;
    }
  });
  return { cleanText, choices };
}

// src/frontend/stage/rich-text.ts
function formatDialogueHtml(rawText) {
  const { cleanText, choices } = parseTwineChoices(rawText);
  let formatted = escapeHtml(cleanText);
  formatted = formatted.replace(/&lt;button class=&quot;vn-inline-choice&quot; data-action=&quot;([\s\S]*?)&quot;&gt;([\s\S]*?)&lt;\/button&gt;/g, '<button class="vn-inline-choice" data-action="$1">$2</button>');
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
    for (const char of characters) {
      const slotEl = document.createElement("div");
      slotEl.className = `vn-char-slot vn-char-${char.slot} ${char.isSpeaker ? "vn-char-speaker" : "vn-char-inactive"}`;
      slotEl.dataset.actorId = char.actorId;
      slotEl.dataset.actorName = char.name;
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
      this.charactersContainer.appendChild(slotEl);
    }
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
    this.ttsEngine?.stop();
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
    this.renderCurrentBeat();
  }
  advance() {
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
    if (this.isSkipping) {
      this.isTyping = false;
      this.textContainer.innerHTML = html;
      this.onBeatSettled();
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
      const fallbackTimer = window.setTimeout(() => {
        startTypewriter();
      }, 1200);
      this.ttsEngine.speak(beat.text, beat.speaker, {
        onStart: (duration) => {
          clearTimeout(fallbackTimer);
          startTypewriter(duration);
        },
        onBoundary: (wordCharIdx) => {
          if (wordCharIdx > charIdx) {
            charIdx = wordCharIdx;
            this.textContainer.textContent = plain.substring(0, charIdx);
          }
        },
        onEnd: () => {
          if (this.isTyping) {
            this.textContainer.innerHTML = html;
            this.isTyping = false;
            this.onBeatSettled();
          } else if (this.autoPlay) {
            this.advance();
          }
        },
        onError: () => {
          clearTimeout(fallbackTimer);
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
  ttsEngine;
  constructor(ttsEngine) {
    this.ttsEngine = ttsEngine;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-characters";
  }
  render(ledger, manifest) {
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
      if (manifest?.characters?.[cleanId]) {
        const charData = manifest.characters[cleanId];
        const outfits = charData.outfits || charData;
        const defaultSet = outfits?.["default"] || (outfits ? Object.values(outfits)[0] : undefined);
        avatarUrl = defaultSet?.["neutral"] || defaultSet?.["smile"] || (defaultSet ? Object.values(defaultSet)[0] : "") || "";
      }
      const item = document.createElement("div");
      item.style.cssText = `display: flex; flex-direction: column; align-items: center; cursor: pointer; min-width: 68px; transition: transform 0.15s ease;`;
      const displayName = id.toLowerCase() === "user" ? "Player (You)" : actor.name || id;
      item.innerHTML = `
        <div style="width: 52px; height: 52px; border-radius: 50%; overflow: hidden; border: 2px solid ${isSelected ? "#818cf8" : "#475569"}; box-shadow: ${isSelected ? "0 0 10px rgba(99,102,241,0.6)" : "none"}; background: #1e293b; display: flex; align-items: center; justify-content: center; position: relative;">
          ${avatarUrl ? `<img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="${displayName}" />` : `<span style="font-size: 22px;">\uD83D\uDC64</span>`}
          ${rosterItem ? `<span style="position: absolute; bottom: 0; right: 0; font-size: 9px; background: #0f172a; padding: 1px 3px; border-radius: 3px; border: 1px solid #334155; color: #a5b4fc; font-weight: 700;">L${rosterItem.lod ?? 1}</span>` : ""}
        </div>
        <span style="font-size: 11px; margin-top: 5px; color: ${isSelected ? "#f8fafc" : "#94a3b8"}; font-weight: ${isSelected ? "700" : "500"}; max-width: 68px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${displayName}
        </span>
        ${rosterItem?.loc ? `<span style="font-size: 9px; color: #64748b; max-width: 68px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${rosterItem.loc}</span>` : ""}
      `;
      item.addEventListener("click", () => {
        this.selectedActorId = id;
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
    this.root.appendChild(container);
  }
}

// src/frontend/hud/tab-bplots.ts
class BPlotsTab {
  root;
  constructor() {
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
  constructor(onAction) {
    this.onAction = onAction;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-wardrobe";
  }
  render(ledger, activeActorId) {
    this.root.innerHTML = "";
    const actorId = activeActorId || (ledger.actors?.["user"] ? "user" : Object.keys(ledger.actors || {})[0] || "user");
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
    const statusBar = document.createElement("div");
    statusBar.className = "vn-wardrobe-status-bar";
    const scentVal = outfit.scent || "None";
    const conditionVal = outfit.state || "Clean";
    const integrityVal = outfit.integrity ?? 100;
    const residueVal = Array.isArray(outfit.residue) && outfit.residue.length > 0 ? outfit.residue.join(", ") : "None";
    statusBar.innerHTML = `
      <div class="vn-wardrobe-status-item"><span>Scent:</span> <strong>${scentVal}</strong></div>
      <div class="vn-wardrobe-status-item"><span>Condition:</span> <strong>${conditionVal}</strong></div>
      <div class="vn-wardrobe-status-item"><span>Integrity:</span> <strong>${integrityVal}%</strong></div>
      <div class="vn-wardrobe-status-item"><span>Residue:</span> <strong>${residueVal}</strong></div>
    `;
    this.root.appendChild(statusBar);
    const slotsGrid = document.createElement("div");
    slotsGrid.className = "vn-wardrobe-grid";
    const slots = [
      { label: "Top", key: "top", value: outfit.top || "None" },
      { label: "Bottom", key: "bottom", value: outfit.bottom || "None" },
      { label: "Underwear (Top)", key: "underwear_top", value: outfit.underwear_top || "None" },
      { label: "Underwear (Bottom)", key: "underwear_bottom", value: outfit.underwear_bottom || "None" },
      { label: "Shoes", key: "shoes", value: outfit.shoes || "None" },
      { label: "Accessories", key: "accessories", value: outfit.accessories || [] }
    ];
    for (const slot of slots) {
      const card = document.createElement("div");
      card.className = "vn-slot-card";
      const valStr = Array.isArray(slot.value) ? slot.value.length ? slot.value.join(", ") : "None" : slot.value;
      const isEquipped = valStr && valStr !== "None" && valStr !== "none";
      card.innerHTML = `
        <div class="vn-slot-title">${slot.label}</div>
        <div class="vn-slot-value">${valStr}</div>
      `;
      const actions = document.createElement("div");
      actions.className = "vn-slot-actions";
      if (isEquipped) {
        const takeOffBtn = document.createElement("button");
        takeOffBtn.className = "vn-btn vn-btn-sm vn-btn-danger";
        takeOffBtn.textContent = "Take off";
        takeOffBtn.addEventListener("click", () => {
          this.onAction(`*Takes off ${slot.label.toLowerCase()}*`);
        });
        actions.appendChild(takeOffBtn);
      } else {
        const wearBtn = document.createElement("button");
        wearBtn.className = "vn-btn vn-btn-sm vn-btn-primary";
        wearBtn.textContent = "Wear";
        wearBtn.addEventListener("click", () => {
          this.onAction(`*Puts on ${slot.label.toLowerCase()}*`);
        });
        actions.appendChild(wearBtn);
      }
      card.appendChild(actions);
      slotsGrid.appendChild(card);
    }
    this.root.appendChild(slotsGrid);
    const footer = document.createElement("div");
    footer.className = "vn-tab-footer";
    const cleanBtn = document.createElement("button");
    cleanBtn.className = "vn-btn vn-btn-primary";
    cleanBtn.textContent = "Clean Clothes";
    cleanBtn.addEventListener("click", () => {
      this.onAction(`*Cleans and washes garments*`);
    });
    const repairBtn = document.createElement("button");
    repairBtn.className = "vn-btn vn-btn-primary";
    repairBtn.textContent = "Repair Garments";
    repairBtn.addEventListener("click", () => {
      this.onAction(`*Mends and repairs clothing tears*`);
    });
    const undressBtn = document.createElement("button");
    undressBtn.className = "vn-btn vn-btn-warning";
    undressBtn.textContent = "Undress to Underwear";
    undressBtn.addEventListener("click", () => {
      this.onAction(`*Undresses down to underwear*`);
    });
    const stripBtn = document.createElement("button");
    stripBtn.className = "vn-btn vn-btn-danger";
    stripBtn.textContent = "Completely Undress";
    stripBtn.addEventListener("click", () => {
      this.onAction(`*Completely strips clothes*`);
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
    badgesContainer.className = "vn-badges-container";
    const passions = actor.passions || {};
    const passionEntries = [
      ["Arousal", passions.arousal],
      ["Anger", passions.anger],
      ["Joy", passions.joy],
      ["Stress", passions.stress],
      ["Fear", passions.fear],
      ["Shame", passions.shame],
      ["Exhaustion", passions.exhaustion],
      ["Pain", passions.pain],
      ["Suspicion", passions.suspicion],
      ["Disgust", passions.disgust],
      ["Sadness", passions.sadness],
      ["Guilt", passions.guilt]
    ];
    let hasBadge = false;
    for (const [name, val] of passionEntries) {
      if (val !== undefined && val > 0) {
        hasBadge = true;
        const badge = document.createElement("div");
        const severity = val >= 70 ? "high" : val >= 40 ? "mid" : "low";
        badge.className = `vn-passion-badge vn-badge-${severity}`;
        badge.innerHTML = `<span class="vn-badge-label">${name}</span> <span class="vn-badge-val">${val}</span>`;
        badgesContainer.appendChild(badge);
      }
    }
    if (!hasBadge) {
      badgesContainer.innerHTML = `<span class="vn-muted" style="padding:4px;">Equilibrium / Baseline emotional state</span>`;
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
        { label: "Affinity", min: -100, max: 100, val: Number(activeRel.affinity ?? 0) },
        { label: "Trust", min: -100, max: 100, val: Number(activeRel.trust ?? 0) },
        { label: "Respect", min: -100, max: 100, val: Number(activeRel.respect ?? 0) },
        { label: "Attraction", min: -100, max: 100, val: Number(activeRel.attraction ?? 0) },
        { label: "Fear", min: 0, max: 100, val: Number(activeRel.fear ?? 0) },
        { label: "Familiarity", min: 0, max: 100, val: Number(activeRel.familiarity ?? 0) },
        { label: "Attachment", min: 0, max: 100, val: Number(activeRel.attachment ?? 0) },
        { label: "Grudge", min: 0, max: 100, val: Number(activeRel.grudge ?? 0) },
        { label: "Loyalty", min: 0, max: 100, val: Number(activeRel.loyalty ?? 0) },
        { label: "Sacrifice Willingness", min: 0, max: 100, val: Number(activeRel.sacrifice_willingness ?? 0) }
      ];
      for (const m of relMeters) {
        const pct = m.min < 0 ? Math.max(0, Math.min(100, (m.val + 100) / 200 * 100)) : Math.max(0, Math.min(100, m.val / m.max * 100));
        const row = document.createElement("div");
        row.className = "vn-meter-row";
        row.innerHTML = `
        <div class="vn-meter-header"><span>${m.label}</span><span>${m.val}</span></div>
        <div class="vn-meter-bar-bg"><div class="vn-meter-bar-fill" style="width: ${pct}%"></div></div>
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
class InventoryTab {
  root;
  onAction;
  constructor(onAction) {
    this.onAction = onAction;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-inventory";
  }
  render(ledger, activeActorId) {
    this.root.innerHTML = "";
    const actorId = activeActorId || (ledger.actors?.["user"] ? "user" : Object.keys(ledger.actors || {})[0] || "user");
    const actor = ledger.actors?.[actorId];
    const inv = actor?.inventory || {
      in_hand: { L: "Empty", R: "Empty" },
      carried: [],
      room: [],
      room_location: ""
    };
    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `<h3>\uD83C\uDF92 Inventory & Containers — ${actor?.name || actorId}</h3>`;
    this.root.appendChild(header);
    const handsSection = document.createElement("div");
    handsSection.className = "vn-section";
    handsSection.innerHTML = `<h4>In Hands</h4>`;
    const handsGrid = document.createElement("div");
    handsGrid.className = "vn-hands-grid";
    for (const hand of ["L", "R"]) {
      const item = inv.in_hand?.[hand] || "Empty";
      const isEmpty = item.toLowerCase() === "empty";
      const card = document.createElement("div");
      card.className = "vn-item-card";
      card.innerHTML = `
        <div class="vn-item-title">${hand === "L" ? "Left Hand" : "Right Hand"}</div>
        <div class="vn-item-desc">${item}</div>
      `;
      if (!isEmpty) {
        const btn = document.createElement("button");
        btn.className = "vn-btn vn-btn-sm vn-btn-warning";
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
    carriedSection.innerHTML = `<h4>Carried (${inv.carried?.length || 0})</h4>`;
    const carriedList = document.createElement("div");
    carriedList.className = "vn-items-list";
    if (!inv.carried || inv.carried.length === 0) {
      carriedList.innerHTML = `<div class="vn-muted">Nothing carried.</div>`;
    } else {
      for (const item of inv.carried) {
        const row = document.createElement("div");
        row.className = "vn-item-row";
        row.innerHTML = `<span class="vn-item-name">${item}</span>`;
        const actions = document.createElement("div");
        actions.className = "vn-item-row-actions";
        const equipBtn = document.createElement("button");
        equipBtn.className = "vn-btn vn-btn-sm vn-btn-primary";
        equipBtn.textContent = "Equip";
        equipBtn.addEventListener("click", () => {
          this.onAction(`*Equips ${item} in hand*`);
        });
        const useBtn = document.createElement("button");
        useBtn.className = "vn-btn vn-btn-sm vn-btn-secondary";
        useBtn.textContent = "Use";
        useBtn.addEventListener("click", () => {
          this.onAction(`*Uses ${item}*`);
        });
        const dropBtn = document.createElement("button");
        dropBtn.className = "vn-btn vn-btn-sm vn-btn-danger";
        dropBtn.textContent = "Drop";
        dropBtn.addEventListener("click", () => {
          this.onAction(`*Drops ${item} on the ground*`);
        });
        actions.appendChild(equipBtn);
        actions.appendChild(useBtn);
        actions.appendChild(dropBtn);
        row.appendChild(actions);
        carriedList.appendChild(row);
      }
    }
    carriedSection.appendChild(carriedList);
    this.root.appendChild(carriedSection);
    const roomSection = document.createElement("div");
    roomSection.className = "vn-section";
    const roomLoc = inv.room_location ? ` (${inv.room_location})` : "";
    roomSection.innerHTML = `<h4>Room Container${roomLoc}</h4>`;
    const roomList = document.createElement("div");
    roomList.className = "vn-items-list";
    if (!inv.room || inv.room.length === 0) {
      roomList.innerHTML = `<div class="vn-muted">Container is empty.</div>`;
    } else {
      for (const item of inv.room) {
        const row = document.createElement("div");
        row.className = "vn-item-row";
        row.innerHTML = `<span class="vn-item-name">${item}</span>`;
        const takeBtn = document.createElement("button");
        takeBtn.className = "vn-btn vn-btn-sm vn-btn-primary";
        takeBtn.textContent = "Take";
        takeBtn.addEventListener("click", () => {
          this.onAction(`*Takes ${item} from container*`);
        });
        row.appendChild(takeBtn);
        roomList.appendChild(row);
      }
    }
    roomSection.appendChild(roomList);
    this.root.appendChild(roomSection);
  }
}

// src/frontend/hud/tab-map.ts
class MapTab {
  root;
  onAction;
  viewMode = "indoor";
  zoom = 1;
  panX = 0;
  panY = 0;
  isPanning = false;
  startPointerX = 0;
  startPointerY = 0;
  selectedNodeId = null;
  constructor(onAction) {
    this.onAction = onAction;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-map";
  }
  render(ledger) {
    this.root.innerHTML = "";
    const currentPlace = (ledger.scene?.place || "default").toLowerCase();
    const isIndoor = currentPlace.includes(":") || currentPlace.includes("residence") || currentPlace.includes("dojo") || currentPlace.includes("room") || currentPlace.includes("foyer");
    if (!this.selectedNodeId) {
      this.viewMode = isIndoor ? "indoor" : "outdoor";
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
        <div style="display: flex; gap: 6px; align-items: center;">
          <div style="background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 2px; display: flex;">
            <button id="vn-map-indoor-btn" class="vn-btn vn-btn-sm" style="border: none; border-radius: 4px; padding: 4px 10px; font-size: 11px; cursor: pointer; ${this.viewMode === "indoor" ? "background: #6366f1; color: #fff; font-weight: 600;" : "background: transparent; color: #94a3b8;"}">
              \uD83C\uDFE0 Blueprint
            </button>
            <button id="vn-map-outdoor-btn" class="vn-btn vn-btn-sm" style="border: none; border-radius: 4px; padding: 4px 10px; font-size: 11px; cursor: pointer; ${this.viewMode === "outdoor" ? "background: #6366f1; color: #fff; font-weight: 600;" : "background: transparent; color: #94a3b8;"}">
              \uD83C\uDF10 District
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
    viewportWrap.style.cssText = "flex: 1; background: #070d19; border: 1px solid #1e293b; border-radius: 10px; overflow: hidden; position: relative; cursor: grab; user-select: none;";
    const sidebar = document.createElement("div");
    sidebar.id = "vn-map-sidebar";
    sidebar.style.cssText = "width: 280px; background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; box-sizing: border-box;";
    mainLayout.appendChild(viewportWrap);
    mainLayout.appendChild(sidebar);
    this.root.appendChild(mainLayout);
    this.renderGraph(viewportWrap, ledger, currentPlace);
    this.renderSidebar(sidebar, ledger, currentPlace);
    this.setupPanZoom(viewportWrap);
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
    const currentRoom = currentPlace.includes(":") ? currentPlace.split(":")[1] : currentPlace;
    const knownPlaces = Object.keys(ledger.places || {});
    const indoorKeys = knownPlaces.filter((p) => p.startsWith(`${scopePrefix}:`) || !p.includes(":"));
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
      const clean = key.includes(":") ? key.split(":")[1] : key;
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
    const cleanName = selected.includes(":") ? selected.split(":")[1] : selected;
    const placeConfig = ledger.places?.[selected] || {};
    const isHere = selected.toLowerCase() === currentPlace.toLowerCase() || cleanName.toLowerCase() === currentPlace.toLowerCase();
    const currentRoutes = ledger.places?.[currentPlace]?.routes || [];
    const route = currentRoutes.find((r) => typeof r === "object" && (r.to === selected || r.to === cleanName));
    const isGated = Boolean(route?.why_not || route?.requires && Object.keys(route.requires).length > 0);
    const whyNot = route?.why_not;
    const npcsHere = (ledger.roster || []).filter((r) => (r.loc || "").toLowerCase().includes(cleanName.toLowerCase()));
    sidebar.innerHTML = `
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
        ${placeConfig.population ? `
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Population:</span>
            <span>${placeConfig.population}</span>
          </div>
        ` : ""}
      </div>

      ${Array.isArray(placeConfig.affordances) && placeConfig.affordances.length > 0 ? `
        <div>
          <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Affordances</div>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${placeConfig.affordances.map((a) => `<span style="background: #1e293b; border: 1px solid #475569; padding: 2px 6px; border-radius: 4px; font-size: 10px;">${a}</span>`).join("")}
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
          ${npcsHere.length > 0 ? npcsHere.map((n) => `
                <div style="background: #1e293b; padding: 4px 8px; border-radius: 4px; font-size: 11px; display: flex; justify-content: space-between;">
                  <span style="color: #c7d2fe; font-weight: 600;">${n.name || n.id}</span>
                  <span style="color: #94a3b8; font-size: 10px;">${n.posture || n.activity || "Idle"}</span>
                </div>
              `).join("") : '<span style="color: #64748b; font-size: 11px;">No detected actors</span>'}
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
  }
}

// src/frontend/hud/tab-phone.ts
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
      <p style="font-size: 10px; color: #6b7280; text-align: center; margin-top: 6px;">Use ◀ / ▶ and Space / Fire to play</p>
    `;
    container.querySelector("#vn-game-back-btn")?.addEventListener("click", () => {
      this.selectedGame = "menu";
      this.renderArcadeApp(container);
    });
    const canvas = container.querySelector("#vn-shooter-canvas");
    if (!canvas)
      return;
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
      if (this.isOverlayActive && !this.isOverlayActive())
        return;
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        moveLeft = true;
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        moveRight = true;
      }
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        fireBullet();
      }
    };
    const onKeyUp = (e) => {
      if (this.isOverlayActive && !this.isOverlayActive())
        return;
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        moveLeft = false;
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        moveRight = false;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    const btnLeft = container.querySelector("#vn-btn-left");
    const btnRight = container.querySelector("#vn-btn-right");
    const btnFire = container.querySelector("#vn-btn-fire");
    btnLeft?.addEventListener("pointerdown", () => {
      moveLeft = true;
    });
    btnLeft?.addEventListener("pointerup", () => {
      moveLeft = false;
    });
    btnLeft?.addEventListener("pointerleave", () => {
      moveLeft = false;
    });
    btnRight?.addEventListener("pointerdown", () => {
      moveRight = true;
    });
    btnRight?.addEventListener("pointerup", () => {
      moveRight = false;
    });
    btnRight?.addEventListener("pointerleave", () => {
      moveRight = false;
    });
    btnFire?.addEventListener("click", fireBullet);
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
        if (moveLeft && playerX > 16)
          playerX -= playerSpeed;
        if (moveRight && playerX < 264)
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
      <p style="font-size: 10px; color: #6b7280; text-align: center; margin-top: 6px;">Use ◀ / ▶ or buttons to steer</p>
    `;
    container.querySelector("#vn-game-back-btn")?.addEventListener("click", () => {
      this.selectedGame = "menu";
      this.renderArcadeApp(container);
    });
    const canvas = container.querySelector("#vn-racer-canvas");
    if (!canvas)
      return;
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
      if (this.isOverlayActive && !this.isOverlayActive())
        return;
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        steerLeft();
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        steerRight();
      }
      if (e.key === "ArrowUp" || e.key === " ") {
        e.preventDefault();
        nitro = true;
      }
    };
    const onKeyUp = (e) => {
      if (this.isOverlayActive && !this.isOverlayActive())
        return;
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }
      if (e.key === "ArrowUp" || e.key === " ") {
        nitro = false;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    container.querySelector("#vn-racer-left")?.addEventListener("click", steerLeft);
    container.querySelector("#vn-racer-right")?.addEventListener("click", steerRight);
    const nitroBtn = container.querySelector("#vn-racer-nitro");
    nitroBtn?.addEventListener("pointerdown", () => {
      nitro = true;
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
    `;
    container.querySelector("#vn-game-back-btn")?.addEventListener("click", () => {
      this.selectedGame = "menu";
      this.renderArcadeApp(container);
    });
    const canvas = container.querySelector("#vn-snake-canvas");
    if (!canvas)
      return;
    const ctx = canvas.getContext("2d");
    if (!ctx)
      return;
    const gridSize = 14;
    const tileCount = 20;
    let snake = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
    let dx = 0;
    let dy = -1;
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
      if (newDx !== -dx && newDy !== -dy) {
        dx = newDx;
        dy = newDy;
      }
    };
    const onKeyDown = (e) => {
      if (this.isOverlayActive && !this.isOverlayActive())
        return;
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        setDir(0, -1);
      }
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        setDir(0, 1);
      }
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        setDir(-1, 0);
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        setDir(1, 0);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    container.querySelector("#vn-snake-up")?.addEventListener("click", () => setDir(0, -1));
    container.querySelector("#vn-snake-down")?.addEventListener("click", () => setDir(0, 1));
    container.querySelector("#vn-snake-left")?.addEventListener("click", () => setDir(-1, 0));
    container.querySelector("#vn-snake-right")?.addEventListener("click", () => setDir(1, 0));
    const tick = () => {
      if (!gameOver) {
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
    let binary = "";
    for (let i = 0;i < file.bytes.byteLength; i++) {
      binary += String.fromCharCode(file.bytes[i]);
    }
    return `data:${file.mimeType || "image/png"};base64,${btoa(binary)}`;
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
    bgSec.appendChild(bgUploadBtn);
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
        btnRow.appendChild(uploadSpriteBtn);
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
    actionBtnRow.appendChild(uploadActionBtn);
    actionSec.appendChild(actionBtnRow);
    this.root.appendChild(actionSec);
    const gallerySec = document.createElement("div");
    gallerySec.className = "vn-section";
    gallerySec.innerHTML = `<h4>\uD83D\uDCC1 Uploaded Assets Manager</h4>`;
    const manifestData = this.currentManifest;
    const galleryList = document.createElement("div");
    galleryList.style.cssText = "display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto; padding-right: 4px;";
    let assetCount = 0;
    if (manifestData?.places) {
      for (const [key, url] of Object.entries(manifestData.places)) {
        assetCount++;
        galleryList.appendChild(this.createAssetCard("places", `\uD83D\uDCCD Place: ${key}`, url, () => {
          this.deleteAsset({ category: "places", key });
        }));
      }
    }
    if (manifestData?.characters) {
      for (const [actorId, actorData] of Object.entries(manifestData.characters)) {
        const outfits = actorData.outfits || actorData;
        for (const [outfit, exprs] of Object.entries(outfits)) {
          if (exprs && typeof exprs === "object") {
            for (const [expr, url] of Object.entries(exprs)) {
              assetCount++;
              galleryList.appendChild(this.createAssetCard("characters", `\uD83D\uDC64 ${actorId} (${outfit}/${expr})`, url, () => {
                this.deleteAsset({ category: "characters", actorId, outfit, expression: expr });
              }));
            }
          }
        }
        if (actorData.actions) {
          for (const [actionName, url] of Object.entries(actorData.actions)) {
            assetCount++;
            galleryList.appendChild(this.createAssetCard("actions", `⚡ ${actorId} [${actionName}]`, url, () => {
              this.deleteAsset({ category: "actions", actorId, actionName });
            }));
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
    card.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#1e293b; border:1px solid #334155; border-radius:8px; padding:6px 10px;";
    card.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px; overflow:hidden;">
        <img src="${url}" style="width:36px; height:36px; object-fit:cover; border-radius:4px; background:#0f172a;" alt="" onerror="this.style.display='none'" />
        <span style="font-size:12px; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${title}</span>
      </div>
      <button class="vn-btn vn-btn-sm vn-btn-danger" style="padding:4px 8px; font-size:11px;">\uD83D\uDDD1️ Delete</button>
    `;
    card.querySelector("button")?.addEventListener("click", () => {
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

// src/frontend/hud/tab-diagnostics.ts
class DiagnosticsTab {
  root;
  ctx;
  currentLedger = {};
  currentManifest;
  activeFilter = "all";
  unsubscribeBus;
  statRulesSettings = null;
  constructor(ctx) {
    this.ctx = ctx;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-diagnostics";
  }
  setStatRulesSettings(settings) {
    this.statRulesSettings = settings;
    const modeSelect = this.root.querySelector("#vn-mvu-mode-select");
    const rulesInput = this.root.querySelector("#vn-stat-rules-input");
    const ledgerInput = this.root.querySelector("#vn-ledger-prompt-input");
    if (modeSelect)
      modeSelect.value = settings.mode;
    if (rulesInput)
      rulesInput.value = settings.statRules;
    if (ledgerInput)
      ledgerInput.value = settings.ledgerPrompt;
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
      <textarea id="vn-stat-rules-input" style="width: 100%; height: 110px; background: #020617; color: #f8fafc; border: 1px solid #334155; border-radius: 4px; font-family: monospace; font-size: 10px; padding: 6px; box-sizing: border-box; resize: vertical;"></textarea>
      <label style="font-size: 10px; color: #94a3b8;">Ledger Output Schema:</label>
      <textarea id="vn-ledger-prompt-input" style="width: 100%; height: 110px; background: #020617; color: #f8fafc; border: 1px solid #334155; border-radius: 4px; font-family: monospace; font-size: 10px; padding: 6px; box-sizing: border-box; resize: vertical;"></textarea>
      <div style="display:flex; justify-content:flex-end;">
        <button id="vn-save-rules-btn" style="background: #0284c7; color: #fff; border: none; border-radius: 4px; padding: 6px 14px; font-size: 11px; font-weight: 700; cursor: pointer;">\uD83D\uDCBE Save & Update Rules</button>
      </div>
    `;
    this.root.appendChild(rulesCard);
    const modeSelect = rulesCard.querySelector("#vn-mvu-mode-select");
    const rulesInput = rulesCard.querySelector("#vn-stat-rules-input");
    const ledgerInput = rulesCard.querySelector("#vn-ledger-prompt-input");
    const saveRulesBtn = rulesCard.querySelector("#vn-save-rules-btn");
    if (this.statRulesSettings) {
      if (modeSelect)
        modeSelect.value = this.statRulesSettings.mode;
      if (rulesInput)
        rulesInput.value = this.statRulesSettings.statRules;
      if (ledgerInput)
        ledgerInput.value = this.statRulesSettings.ledgerPrompt;
    } else {
      this.ctx?.sendToBackend?.({ type: "vn_get_stat_rules_settings" });
    }
    saveRulesBtn?.addEventListener("click", () => {
      const updated = {
        mode: modeSelect?.value || "mvu_quiet",
        statRules: rulesInput?.value || "",
        ledgerPrompt: ledgerInput?.value || "",
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
  diagnosticsTab;
  activeTabId = null;
  currentLedger = {};
  currentManifest;
  constructor(options) {
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
    this.charactersTab = new CharactersTab(options.ttsEngine);
    this.bplotsTab = new BPlotsTab;
    this.wardrobeTab = new WardrobeTab(options.onAction);
    this.statsTab = new StatsTab;
    this.inventoryTab = new InventoryTab(options.onAction);
    this.mapTab = new MapTab(options.onAction);
    this.phoneTab = new PhoneTab(options.ctx, options.onAction, options.isOverlayActive);
    this.journalTab = new JournalTab;
    this.sceneTab = new SceneTab(options.ctx, options.onTransformChange);
    this.diagnosticsTab = new DiagnosticsTab(options.ctx);
    const barItems = [
      { id: "characters", icon: "\uD83D\uDC65", label: "Cast" },
      { id: "bplots", icon: "\uD83D\uDCE1", label: "B-Plots" },
      { id: "wardrobe", icon: "\uD83D\uDC57", label: "Wardrobe" },
      { id: "stats", icon: "\uD83D\uDCCA", label: "Stats" },
      { id: "inventory", icon: "\uD83C\uDF92", label: "Inventory" },
      { id: "map", icon: "\uD83D\uDDFA️", label: "Map" },
      { id: "phone", icon: "\uD83D\uDCF1", label: "Phone" },
      { id: "journal", icon: "\uD83D\uDCDC", label: "Journal" },
      { id: "scene", icon: "\uD83C\uDFAC", label: "Scene" },
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
    if (this.activeTabId === "characters" || this.activeTabId === "scene") {
      this.renderActiveTab();
    }
  }
  setStatRulesSettings(settings) {
    this.diagnosticsTab.setStatRulesSettings(settings);
  }
  openTab(tabId) {
    this.activeTabId = tabId;
    this.renderActiveTab();
    this.panelOverlay.style.display = "flex";
  }
  closeTab() {
    this.activeTabId = null;
    this.panelOverlay.style.display = "none";
  }
  renderActiveTab() {
    this.panelBody.innerHTML = "";
    switch (this.activeTabId) {
      case "characters":
        this.charactersTab.render(this.currentLedger, this.currentManifest);
        this.panelBody.appendChild(this.charactersTab.root);
        break;
      case "bplots":
        this.bplotsTab.render(this.currentLedger);
        this.panelBody.appendChild(this.bplotsTab.root);
        break;
      case "wardrobe":
        this.wardrobeTab.render(this.currentLedger);
        this.panelBody.appendChild(this.wardrobeTab.root);
        break;
      case "stats":
        this.statsTab.render(this.currentLedger);
        this.panelBody.appendChild(this.statsTab.root);
        break;
      case "inventory":
        this.inventoryTab.render(this.currentLedger);
        this.panelBody.appendChild(this.inventoryTab.root);
        break;
      case "map":
        this.mapTab.render(this.currentLedger);
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
  playBgm(url) {
    if (!url) {
      this.stopBgm();
      return;
    }
    if (this.bgmAudio && this.bgmAudio.src.includes(url)) {
      if (this.bgmAudio.paused && !this.isMuted) {
        this.bgmAudio.play().catch(() => {});
      }
      return;
    }
    this.stopBgm();
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
  constructor() {
    this.loadLocalSettings();
  }
  setChatId(chatId) {
    this.activeChatId = chatId;
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
    return this.settings.characters[scopedKey] || this.settings.characters[clean] || this.settings.characterDefault || this.settings.narrator || null;
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
    let voiceRef = this.resolveVoice(speakerName);
    if (!voiceRef?.connectionId) {
      const defaultConn = await this.resolveDefaultConnection();
      if (defaultConn) {
        voiceRef = {
          connectionId: defaultConn.id,
          voice: defaultConn.voice || ""
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
            const audio = new Audio(url);
            this.currentAudio = audio;
            audio.volume = Math.max(0, Math.min(1, this.settings.volume));
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
      ttsEngine: this.ttsEngine
    });
    this.toastContainer = document.createElement("div");
    this.toastContainer.className = "vn-toast-container";
    this.root.appendChild(this.exitButton);
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
  resetStage(targetChatId) {
    this.currentChatId = targetChatId || this.resolveChatId() || null;
    this.ttsEngine.setChatId(this.currentChatId || "");
    this.lastProcessedEvtId = null;
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
      .vn-char-slot {
        height: 85%;
        max-width: 32%;
        position: relative;
        display: flex;
        justify-content: center;
        align-items: flex-end;
        transform: translate(var(--char-offset-x, 0px), var(--char-offset-y, 0px)) scale(var(--char-scale, 1));
        transform-origin: bottom center;
        transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.35s ease, opacity 0.35s ease;
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
      .vn-char-left { order: 1; }
      .vn-char-center { order: 2; }
      .vn-char-right { order: 3; }

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

      /* HUD Menu Bar */
      .vn-hud-menubar {
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 9999;
        display: flex;
        gap: 8px;
      }
      .vn-hud-btn {
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        padding: 8px 14px;
        color: #f8fafc;
        font-size: 13px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        backdrop-filter: blur(8px);
        position: relative;
        transition: all 0.2s ease;
      }
      .vn-hud-btn:hover {
        background: rgba(30, 41, 59, 0.95);
        border-color: #818cf8;
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

      /* HUD Modal / Overlay */
      .vn-hud-overlay {
        position: fixed;
        inset: 0;
        z-index: 99998;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .vn-hud-modal {
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 20px;
        width: min(720px, 94%);
        max-height: 82vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        position: relative;
        box-shadow: 0 24px 60px rgba(0,0,0,0.9);
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
    } else if (payload.type === "vn_diagnostic_update" && payload.data) {
      diagDrawer?.updateDiagnostic(payload.data);
      diagBus.setTelemetry(payload.data);
    } else if (payload.type === "vn_manifest" && payload.manifest) {
      overlay.setManifest(payload.manifest);
      diagBus.setManifest(payload.manifest);
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
