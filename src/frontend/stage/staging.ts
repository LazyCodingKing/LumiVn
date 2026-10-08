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

    for (const char of characters) {
      const slotEl = document.createElement("div");
      slotEl.className = `vn-char-slot vn-char-${char.slot} ${char.isSpeaker ? "vn-char-speaker" : "vn-char-inactive"}`;
      slotEl.dataset.actorId = char.actorId;
      slotEl.dataset.actorName = char.name;

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

      this.charactersContainer.appendChild(slotEl);
    }
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
