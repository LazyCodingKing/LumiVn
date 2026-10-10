import type { StageBackground, StageCharacter } from "../../shared/types.js";
import { ParticleEngine } from "./particles.js";
import { getSpriteTransform, saveSpriteTransform, type SpriteTransform } from "./sprite-transform.js";

function normalizeActorString(str: string): string {
  return (str || "")
    .toLowerCase()
    .replace(/[\(\)\[\]"'`~_—–\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isActorMatch(candidate: string, actorId: string, actorName: string): boolean {
  if (!candidate) return false;
  const c = normalizeActorString(candidate);
  if (!c || c === "narrator") return false;

  const id = normalizeActorString(actorId);
  const name = normalizeActorString(actorName);

  // 1. Direct match
  if (c === id || c === name) return true;

  // 2. Token match (e.g. candidate "akane" matches "akane tendo" or "tendo akane")
  const cTokens = c.split(" ");
  const nameTokens = name.split(" ");
  const idTokens = id.split(" ");

  if (cTokens.length === 1) {
    const single = cTokens[0]!;
    if (nameTokens.includes(single) || idTokens.includes(single)) return true;
  }

  // 3. Substring match if token is long enough
  if (c.length >= 3) {
    if (name.includes(c) || c.includes(name)) return true;
    if (id.includes(c) || c.includes(id)) return true;
  }

  return false;
}

export class StageRenderer {
  public root: HTMLElement;
  private bgContainer: HTMLElement;
  private charactersContainer: HTMLElement;
  public particleEngine: ParticleEngine;

  private currentBgUrl = "";

  constructor() {
    this.root = document.createElement("div");
    this.root.className = "vn-stage";
    this.root.style.position = "relative";

    this.bgContainer = document.createElement("div");
    this.bgContainer.className = "vn-stage-bg";

    this.charactersContainer = document.createElement("div");
    this.charactersContainer.className = "vn-stage-characters";

    this.particleEngine = new ParticleEngine();

    this.root.appendChild(this.bgContainer);
    this.root.appendChild(this.particleEngine.canvas);
    this.root.appendChild(this.charactersContainer);
  }

  public setBackground(bg: StageBackground): void {
    if (this.currentBgUrl === bg.url) return;
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

  public setWeather(weatherOrPlace: string): void {
    this.particleEngine.setWeather(weatherOrPlace);
  }

  public setCharacters(characters: StageCharacter[]): void {
    this.charactersContainer.innerHTML = "";

    for (let index = 0; index < characters.length; index++) {
      const char = characters[index]!;
      const slotEl = document.createElement("div");
      slotEl.className = `vn-char-slot vn-char-${char.slot} ${char.isSpeaker ? "vn-char-speaker" : "vn-char-inactive"}`;
      slotEl.dataset.actorId = char.actorId;
      slotEl.dataset.actorName = char.name;
      slotEl.style.setProperty("--enter-delay", `${index * 0.08}s`);

      const transform = getSpriteTransform(char.actorId);
      this.applyTransformToSlot(slotEl, transform);

      const hasLayers = char.layers && (char.layers.base || char.layers.outfit || char.layers.expression);

      if (hasLayers) {
        // Layered Paper-Doll Container
        const doll = document.createElement("div");
        doll.className = "vn-paper-doll";

        const addLayer = (src: string, layerClass: string) => {
          const l = document.createElement("img");
          l.className = `vn-doll-layer ${layerClass}`;
          l.src = src;
          l.alt = "";
          l.onload = () => console.log(`[LumiVN] Layer ${layerClass} loaded for ${char.name}`);
          l.onerror = () => console.error(`[LumiVN] Failed to load layer ${layerClass} for ${char.name}: ${src}`);
          doll.appendChild(l);
        };

        if (char.layers.base) addLayer(char.layers.base, "vn-layer-base");
        if (char.layers.underwear) addLayer(char.layers.underwear, "vn-layer-underwear");
        if (char.layers.outfit) addLayer(char.layers.outfit, "vn-layer-outfit");
        if (char.layers.expression) addLayer(char.layers.expression, "vn-layer-expression");
        if (char.layers.accessories) addLayer(char.layers.accessories, "vn-layer-accessories");

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

      // Visual Staging Hover Name Badge
      const nameTag = document.createElement("span");
      nameTag.className = "vn-char-tag";
      nameTag.textContent = char.name;
      slotEl.appendChild(nameTag);

      // Tactile Touch Zones & Interaction Overlay
      const touchOverlay = document.createElement("div");
      touchOverlay.className = "vn-touch-overlay";

      const zones: Array<{ id: "head" | "face" | "body"; label: string }> = [
        { id: "head", label: "Headpat" },
        { id: "face", label: "Touch cheek" },
        { id: "body", label: "Touch hand" },
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

  public triggerSpriteTouch(slotEl: HTMLElement, char: StageCharacter, zone: "head" | "face" | "body"): string {
    // 1. Play tactile micro-bounce animation
    slotEl.classList.remove("vn-touch-bounce");
    void slotEl.offsetWidth; // reflow trigger
    slotEl.classList.add("vn-touch-bounce");

    // 2. Select contextual dialogue line
    const reactions: Record<"head" | "face" | "body", string[]> = {
      head: [
        "*leans in softly* ...That feels nice.",
        "*blushes* Hey, don't mess up my hair!",
        "*giggles softly* You always do that.",
        "*soft exhale* ...Warm.",
      ],
      face: [
        "*cheeks turn pink* W-what are you staring at?",
        "*blinks rapidly* Ah! Your hands are warm...",
        "*smiles playfully* Looking for something?",
        "*pouts slightly* Hey, no pinching!",
      ],
      body: [
        "*clasps your hand firmly* I'm right here with you.",
        "*steps a bit closer* Ready whenever you are!",
        "*gives a confident nod* Let's make today count.",
        "*chuckles warmly* Always so energetic.",
      ],
    };

    const lines = reactions[zone] || reactions.body;
    const line = lines[Math.floor(Math.random() * lines.length)] || lines[0]!;

    // 3. Render or replace comic speech bubble
    const oldBubble = slotEl.querySelector(".vn-touch-bubble");
    if (oldBubble) oldBubble.remove();

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

  public setActiveSpeaker(speakerName: string): void {
    const normSpeaker = (speakerName || "").trim();
    const isNarrator = !normSpeaker || normSpeaker.toLowerCase() === "narrator";
    const slotElements = this.charactersContainer.querySelectorAll<HTMLElement>(".vn-char-slot");

    slotElements.forEach((slotEl) => {
      const actorId = slotEl.dataset.actorId || "";
      const actorName = slotEl.dataset.actorName || "";

      if (isNarrator) {
        // Balanced neutral lighting: no one is speaking, neither dimmed nor spotlighted
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

  public updateCharacterSprite(actorIdOrName: string, spriteUrl: string): void {
    if (!spriteUrl) return;
    const slotElements = this.charactersContainer.querySelectorAll<HTMLElement>(".vn-char-slot");
    slotElements.forEach((slotEl) => {
      const actorId = slotEl.dataset.actorId || "";
      const actorName = slotEl.dataset.actorName || "";
      if (isActorMatch(actorIdOrName, actorId, actorName)) {
        const img = slotEl.querySelector<HTMLImageElement>(".vn-char-sprite");
        if (img && img.src !== spriteUrl) {
          img.src = spriteUrl;
        }
      }
    });
  }

  public setActorTransform(actorId: string, transform: SpriteTransform): void {
    saveSpriteTransform(actorId, transform);
    const slotElements = this.charactersContainer.querySelectorAll<HTMLElement>(".vn-char-slot");
    slotElements.forEach((slotEl) => {
      const slotActorId = slotEl.dataset.actorId || "";
      const slotActorName = slotEl.dataset.actorName || "";
      if (isActorMatch(actorId, slotActorId, slotActorName)) {
        this.applyTransformToSlot(slotEl, transform);
      }
    });
  }

  private applyTransformToSlot(slotEl: HTMLElement, transform: SpriteTransform): void {
    slotEl.style.setProperty("--char-scale", String(transform.scale));
    slotEl.style.setProperty("--char-offset-x", `${transform.offsetX}px`);
    slotEl.style.setProperty("--char-offset-y", `${transform.offsetY}px`);
  }

  public reset(): void {
    this.currentBgUrl = "";
    this.bgContainer.innerHTML = "";
    this.charactersContainer.innerHTML = "";
    this.particleEngine.setWeather("default");
  }

  public destroy(): void {
    this.particleEngine.destroy();
  }
}
