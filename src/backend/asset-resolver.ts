import type { SpindleAPI } from "lumiverse-spindle-types";
import type {
  LedgerData,
  ActorDossier,
  ActorPassions,
  VnPresentationState,
  StageCharacter,
  StageSlot,
  StageBackground,
  CharacterSpriteLayers,
} from "../shared/types.js";
import { StorageManager } from "./storage.js";
import { extractParagraphs, detectSpeaker } from "./ledger-parser.js";

export function resolveDominantEmotion(passions?: ActorPassions): string {
  if (!passions) return "neutral";
  if ((passions.arousal ?? 0) >= 50) return "blush";
  if ((passions.anger ?? 0) >= 40) return "angry";
  if ((passions.fear ?? 0) >= 40) return "scared";
  if ((passions.joy ?? 0) >= 40) return "smile";
  if ((passions.sadness ?? 0) >= 40) return "sad";
  if ((passions.suspicion ?? 0) >= 40) return "suspicious";
  return "neutral";
}

export function resolveOutfitName(actor?: ActorDossier): string {
  if (!actor?.outfit) return "default";
  if (actor.outfit.state) {
    const sanitized = actor.outfit.state.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    if (sanitized) return sanitized;
  }
  if (actor.outfit.top) {
    const sanitized = actor.outfit.top.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    if (sanitized) return sanitized;
  }
  return "default";
}

export class AssetResolver {
  private spindle: SpindleAPI;
  private storage: StorageManager;

  constructor(spindle: SpindleAPI, storage: StorageManager) {
    this.spindle = spindle;
    this.storage = storage;
  }

  async resolveBackground(placeId?: string, scope?: string): Promise<StageBackground> {
    let cleanPlace = (placeId || "").toLowerCase().trim();
    let cleanScope = (scope || "").toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");

    if (!cleanScope && cleanPlace.includes(":")) {
      const parts = cleanPlace.split(":");
      cleanScope = parts[0]!.trim().replace(/[^a-z0-9_-]/g, "_");
      cleanPlace = parts[1]!.trim().replace(/[^a-z0-9_-]/g, "_");
    } else {
      cleanPlace = cleanPlace.replace(/[^a-z0-9_-]/g, "_");
    }

    const manifest = await this.storage.getManifest();

    // 1. Scoped match: "scope:place" or "scope_place"
    if (cleanScope && cleanPlace) {
      const scopedKey1 = `${cleanScope}:${cleanPlace}`;
      const scopedKey2 = `${cleanScope}_${cleanPlace}`;
      if (manifest.places[scopedKey1]) return { url: manifest.places[scopedKey1]!, isVideo: false };
      if (manifest.places[scopedKey2]) return { url: manifest.places[scopedKey2]!, isVideo: false };
    }

    // 2. Exact place match
    if (cleanPlace && manifest.places[cleanPlace]) {
      return { url: manifest.places[cleanPlace]!, isVideo: false };
    }

    // 3. Prefix partial match (e.g. manifest has "tendo_kitchen", place is "kitchen")
    for (const [key, url] of Object.entries(manifest.places)) {
      if (key.endsWith(`:${cleanPlace}`) || key.endsWith(`_${cleanPlace}`)) {
        return { url, isVideo: false };
      }
    }

    // 4. Default background
    if (manifest.places["default"]) {
      return { url: manifest.places["default"]!, isVideo: false };
    }

    // Procedural Scenic SVG Fallback
    const scenicSvg = generateScenicSvg(placeId || "STAGE BACKGROUND");
    return { url: scenicSvg, isVideo: false };
  }

  async resolveCharacterSprite(
    actorId: string,
    actor?: ActorDossier,
    characterCardAvatarUrl?: string,
    currentSentenceText?: string
  ): Promise<{ spriteUrl: string; layers: CharacterSpriteLayers; emotion: string }> {
    const cleanActor = actorId.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");
    const emotion = resolveDominantEmotion(actor?.passions);
    const outfit = resolveOutfitName(actor);
    const manifest = await this.storage.getManifest();
    const actorManifest = manifest.characters[cleanActor];

    if (actorManifest) {
      // 1. Check for Active Action match (if current text contains action tag/verb)
      if (actorManifest.actions && currentSentenceText) {
        const lowerText = currentSentenceText.toLowerCase();
        for (const [actionName, actionUrl] of Object.entries(actorManifest.actions)) {
          if (lowerText.includes(actionName.toLowerCase())) {
            this.spindle.log.info(`[LumiVN] Matched action sprite '${actionName}' for actor '${cleanActor}'`);
            return { spriteUrl: actionUrl, layers: {}, emotion: actionName };
          }
        }
      }

      const outfits = actorManifest.outfits || (actorManifest as any);

      // 2. Exact outfit & emotion
      if (outfits[outfit]?.[emotion]) {
        return { spriteUrl: outfits[outfit][emotion], layers: {}, emotion };
      }
      // 3. Outfit neutral
      if (outfits[outfit]?.["neutral"]) {
        return { spriteUrl: outfits[outfit]["neutral"], layers: {}, emotion };
      }
      // 4. Default outfit emotion
      if (outfits["default"]?.[emotion]) {
        return { spriteUrl: outfits["default"][emotion], layers: {}, emotion };
      }
      // 5. Default neutral
      if (outfits["default"]?.["neutral"]) {
        return { spriteUrl: outfits["default"]["neutral"], layers: {}, emotion };
      }
      // 6. Any registered sprite fallback
      for (const oKey of Object.keys(outfits)) {
        const exprs = outfits[oKey];
        if (exprs) {
          const anyUrl = exprs[emotion] || exprs["neutral"] || Object.values(exprs)[0];
          if (anyUrl) return { spriteUrl: anyUrl as string, layers: {}, emotion };
        }
      }
    }

    // 2. Resolve from Lumiverse Character Card (Expressions, Alt Avatars, Risu Maps)
    try {
      let cardChar: any = null;
      if (this.spindle.characters) {
        if (actorId && actorId.length >= 8) {
          cardChar = await this.spindle.characters.get(actorId).catch(() => null);
        }
        if (!cardChar && this.spindle.characters.list) {
          const listRes = await this.spindle.characters.list().catch(() => null);
          const chars = Array.isArray(listRes) ? listRes : listRes?.data || [];
          cardChar = chars.find((c: any) =>
            c.name?.toLowerCase() === cleanActor ||
            c.name?.toLowerCase() === actorId.toLowerCase() ||
            c.id === actorId
          );
        }
      }

      if (cardChar?.extensions) {
        // A. Inline tag in sentence text: <img="name">, <pimg="name">, {{img::name}}
        if (currentSentenceText) {
          const tagMatch = currentSentenceText.match(/<p?img\s*(?:=|cmd=|src=)["']?([^"'>\s]+)["']?[^>]*\/?>|\{\{img::([^\}]+)\}\}/i);
          const inlineTag = (tagMatch?.[1] || tagMatch?.[2] || "").trim().toLowerCase();
          if (inlineTag) {
            const mappings = cardChar.extensions.expressions?.mappings || {};
            const risu = cardChar.extensions.risu_asset_map || {};
            const matchedId = mappings[inlineTag] || risu[inlineTag] || risu[`${inlineTag}.png`];
            if (matchedId) {
              return { spriteUrl: `/api/v1/images/${matchedId}`, layers: {}, emotion: inlineTag };
            }
          }
        }

        // B. Character expressions mappings
        const exprMappings = cardChar.extensions.expressions?.mappings;
        if (exprMappings && typeof exprMappings === "object") {
          const EMOTION_ALIASES: Record<string, string[]> = {
            blush: ["blush", "embarrassed", "shy", "flustered"],
            smile: ["smile", "happy", "joy", "laugh"],
            angry: ["angry", "rage", "annoyed", "mad"],
            sad: ["sad", "crying", "sorrow", "grief"],
            scared: ["scared", "fear", "shocked", "surprised"],
            neutral: ["neutral", "idle", "default", "normal"],
          };
          const candidates = EMOTION_ALIASES[emotion] || [emotion];
          for (const cand of candidates) {
            for (const [k, id] of Object.entries(exprMappings)) {
              if (k.toLowerCase() === cand || k.toLowerCase().replace(/[^a-z0-9]/g, "") === cand) {
                if (typeof id === "string" && id) {
                  return { spriteUrl: `/api/v1/images/${id}`, layers: {}, emotion };
                }
              }
            }
          }
          const defaultExpr = cardChar.extensions.expressions?.defaultExpression;
          if (defaultExpr && exprMappings[defaultExpr]) {
            return { spriteUrl: `/api/v1/images/${exprMappings[defaultExpr]}`, layers: {}, emotion };
          }
        }

        // C. Risu asset map
        const risuMap = cardChar.extensions.risu_asset_map;
        if (risuMap && typeof risuMap === "object") {
          for (const [k, id] of Object.entries(risuMap)) {
            const cleanKey = k.toLowerCase().replace(/\.[a-z0-9]+$/i, "");
            if (cleanKey === emotion || cleanKey === "default" || cleanKey === "neutral") {
              if (typeof id === "string" && id) {
                return { spriteUrl: `/api/v1/images/${id}`, layers: {}, emotion };
              }
            }
          }
        }

        // D. Alternate avatar for outfit
        if (cardChar.extensions.alternate_avatars && Array.isArray(cardChar.extensions.alternate_avatars)) {
          const matchedAvatar = cardChar.extensions.alternate_avatars.find((a: any) =>
            a.name?.toLowerCase().includes(outfit) || a.label?.toLowerCase().includes(outfit)
          );
          if (matchedAvatar?.image_id) {
            return { spriteUrl: `/api/v1/images/${matchedAvatar.image_id}`, layers: {}, emotion };
          }
        }

        if (cardChar.image_id) {
          return { spriteUrl: `/api/v1/images/${cardChar.image_id}`, layers: {}, emotion };
        }
      }
    } catch {}

    // 3. Active Persona resolution for user
    if ((actorId.toLowerCase() === "user" || cleanActor === "user") && this.spindle.personas?.getActive) {
      try {
        const activePersona = await this.spindle.personas.getActive();
        if (activePersona?.image_id) {
          return { spriteUrl: `/api/v1/images/${activePersona.image_id}`, layers: {}, emotion };
        }
      } catch {}
    }

    if (characterCardAvatarUrl) {
      return { spriteUrl: characterCardAvatarUrl, layers: {}, emotion };
    }

    // Stylized Generic NPC Fallback Sprite
    const svgAvatar = generateGenericNpcSprite(actorId, actor, emotion);
    return { spriteUrl: svgAvatar, layers: {}, emotion };
  }

  async buildPresentationState(
    chatId: string,
    messageId: string,
    prose: string,
    ledger: LedgerData,
    characterId?: string
  ): Promise<VnPresentationState> {
    let hostAvatarUrl: string | undefined;
    let characterName: string | undefined;
    if (characterId) {
      try {
        const char = await this.spindle.characters.get(characterId);
        if (char?.image_id) {
          hostAvatarUrl = `/api/v1/images/${char.image_id}`;
        }
        if (char?.name) {
          characterName = char.name;
        }
      } catch {}
    }

    const stageCharacters: StageCharacter[] = [];
    const participants = (ledger.scene?.participants || []).filter((p) => p && p.toLowerCase() !== "user");
    const firstNpc = participants[0];
    const fallbackSpeaker = characterName || (firstNpc ? ledger.actors?.[firstNpc]?.name || firstNpc : "Narrator");

    const paragraphs = extractParagraphs(prose);
    const firstPara = paragraphs[0] || "";
    const { speaker: activeSpeaker } = detectSpeaker(firstPara, fallbackSpeaker);

    const background = await this.resolveBackground(ledger.scene?.place);

    if (participants.length === 0) {
      if (ledger.roster && ledger.roster.length > 0) {
        for (const r of ledger.roster.slice(0, 5)) {
          participants.push(r.id || r.name || "npc");
        }
      } else if (characterId) {
        participants.push(characterId);
      }
    }

    // Multi-Sprite Staging: supports up to 5 concurrent characters on stage
    const count = Math.min(participants.length, 5);
    const slots: StageSlot[] =
      count === 1 ? ["center"] :
      count === 2 ? ["left", "right"] :
      count === 3 ? ["left", "center", "right"] :
      count === 4 ? ["far-left", "left", "right", "far-right"] :
      ["far-left", "left", "center", "right", "far-right"];

    for (let i = 0; i < count; i++) {
      const actorId = participants[i]!;
      const actorDossier = ledger.actors?.[actorId];
      const slot = slots[i]!;
      const actorName = actorDossier?.name || actorId;
      const normSpeaker = activeSpeaker.toLowerCase().trim();
      const normId = actorId.toLowerCase().trim();
      const normName = actorName.toLowerCase().trim();
      const isMatch = normSpeaker !== "narrator" && (
        normSpeaker === normId ||
        normSpeaker === normName ||
        normName.split(/\s+/).includes(normSpeaker) ||
        normId.split(/[_-]/).includes(normSpeaker) ||
        (normSpeaker.length >= 3 && (normName.includes(normSpeaker) || normId.includes(normSpeaker)))
      );
      const isSpeaker = isMatch || (count === 1 && normSpeaker !== "narrator");

      const latestJournalAction = ledger.journal && ledger.journal.length > 0
        ? ledger.journal[ledger.journal.length - 1]?.action || ""
        : "";
      const currentSentenceText = `${firstPara} ${latestJournalAction}`.trim();

      const resolved = await this.resolveCharacterSprite(
        actorId,
        actorDossier,
        hostAvatarUrl,
        currentSentenceText
      );

      stageCharacters.push({
        actorId,
        name: actorDossier?.name || actorId,
        slot,
        isSpeaker,
        layers: resolved.layers,
        spriteUrl: resolved.spriteUrl,
        emotion: resolved.emotion,
      });
    }

    let hasBPlotNotification = false;
    if (ledger.bplots && ledger.bplots.length > 0) {
      for (const bp of ledger.bplots) {
        if (bp.ripple === 2 && bp.status === "active") {
          hasBPlotNotification = true;
          break;
        }
      }
    }

    // BGM resolution from inline prose tags or place/mood
    const manifest = await this.storage.getManifest();
    const bgmMatch = prose.match(/(?:🎵\s*Music|BGM|\[Music|【Music|Play music)[：:]\s*([^\n\r\]】]+)/i);
    const bgmTrack = bgmMatch ? bgmMatch[1]!.trim() : undefined;
    const bgmUrl = bgmTrack ? (manifest.places[bgmTrack] || undefined) : undefined;

    return {
      chatId,
      messageId,
      speakerName: activeSpeaker,
      paragraphs,
      background,
      characters: stageCharacters,
      ledger,
      hasBPlotNotification,
      bgmTrack,
      bgmUrl,
    };
  }
}

function generateScenicSvg(place: string): string {
  const p = (place || "").toLowerCase();
  let gradientStops = `<stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e293b"/>`;
  let silhouette = `<rect x="0" y="500" width="1280" height="220" fill="#090d16" opacity="0.9"/>`;
  let ambientIcon = "🏛️";

  if (p.includes("forest") || p.includes("nature") || p.includes("garden") || p.includes("park") || p.includes("woods")) {
    gradientStops = `<stop offset="0%" stop-color="#064e3b"/><stop offset="60%" stop-color="#022c22"/><stop offset="100%" stop-color="#0f172a"/>`;
    silhouette = `<path d="M 0 720 L 100 520 L 180 720 L 260 480 L 340 720 L 500 500 L 640 720 L 800 460 L 950 720 L 1100 490 L 1280 720 Z" fill="#022c22" opacity="0.95"/>`;
    ambientIcon = "🌲";
  } else if (p.includes("tavern") || p.includes("bar") || p.includes("cafe") || p.includes("restaurant") || p.includes("kitchen")) {
    gradientStops = `<stop offset="0%" stop-color="#451a03"/><stop offset="60%" stop-color="#271106"/><stop offset="100%" stop-color="#180c05"/>`;
    silhouette = `<rect x="0" y="580" width="1280" height="140" fill="#180c05"/><circle cx="200" cy="200" r="120" fill="#ea580c" opacity="0.15"/>`;
    ambientIcon = "🍺";
  } else if (p.includes("street") || p.includes("city") || p.includes("alley") || p.includes("market") || p.includes("urban") || p.includes("neon")) {
    gradientStops = `<stop offset="0%" stop-color="#1e1b4b"/><stop offset="50%" stop-color="#0f172a"/><stop offset="100%" stop-color="#030712"/>`;
    silhouette = `<path d="M 0 720 L 0 450 L 120 450 L 120 380 L 240 380 L 240 500 L 400 500 L 400 320 L 540 320 L 540 720 L 700 720 L 700 400 L 850 400 L 850 350 L 1000 350 L 1000 480 L 1280 480 L 1280 720 Z" fill="#090d16" opacity="0.95"/>`;
    ambientIcon = "🌃";
  } else if (p.includes("sky") || p.includes("rooftop") || p.includes("balcony") || p.includes("tower")) {
    gradientStops = `<stop offset="0%" stop-color="#312e81"/><stop offset="50%" stop-color="#4c1d95"/><stop offset="100%" stop-color="#0f172a"/>`;
    silhouette = `<circle cx="1000" cy="180" r="60" fill="#fef08a" opacity="0.85"/><path d="M 0 720 L 0 620 L 1280 620 L 1280 720 Z" fill="#090d16"/>`;
    ambientIcon = "✨";
  } else if (p.includes("dungeon") || p.includes("cave") || p.includes("ruin") || p.includes("crypt") || p.includes("vault")) {
    gradientStops = `<stop offset="0%" stop-color="#1c1917"/><stop offset="60%" stop-color="#0c0a09"/><stop offset="100%" stop-color="#000000"/>`;
    silhouette = `<path d="M 0 0 L 180 200 L 300 0 L 600 150 L 900 0 L 1100 220 L 1280 0 Z" fill="#0c0a09" opacity="0.8"/>`;
    ambientIcon = "⚔️";
  }

  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">` +
    `<defs><linearGradient id="scenic-bg" x1="0%" y1="0%" x2="100%" y2="100%">${gradientStops}</linearGradient></defs>` +
    `<rect width="1280" height="720" fill="url(#scenic-bg)"/>` +
    `${silhouette}` +
    `<text x="640" y="320" font-family="system-ui, sans-serif" font-size="54" fill="#ffffff22" text-anchor="middle">${ambientIcon}</text>` +
    `<text x="640" y="380" font-family="system-ui, sans-serif" font-weight="700" font-size="24" fill="#ffffffbb" text-anchor="middle">${place.toUpperCase()}</text>` +
    `</svg>`
  );
}

function generateGenericNpcSprite(actorId: string, actor?: ActorDossier, emotion = "neutral"): string {
  const name = (actor?.name || actorId).toLowerCase();
  const desc = JSON.stringify(actor || {}).toLowerCase();
  const isFemale = name.includes("girl") || name.includes("woman") || name.includes("lady") || name.includes("she") || name.includes("her") || desc.includes("female") || desc.includes("woman") || desc.includes("dress") || desc.includes("skirt");
  const isKnight = name.includes("guard") || name.includes("knight") || name.includes("soldier") || name.includes("warrior") || desc.includes("armor") || desc.includes("sword");
  const isMage = name.includes("mage") || name.includes("wizard") || name.includes("witch") || name.includes("priest") || desc.includes("magic") || desc.includes("spell");

  const themePrimary = isFemale ? "#a855f7" : isKnight ? "#ef4444" : isMage ? "#3b82f6" : "#6366f1";
  const themeSecondary = isFemale ? "#ec4899" : isKnight ? "#991b1b" : isMage ? "#1d4ed8" : "#4338ca";
  const roleIcon = isFemale ? "♀" : isKnight ? "⚔" : isMage ? "🔮" : "👤";
  const displayName = (actor?.name || actorId).toUpperCase().slice(0, 16);

  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="800" viewBox="0 0 400 800">` +
    `<defs>` +
    `<linearGradient id="npc-grad-${displayName.replace(/[^a-zA-Z0-9]/g, '')}" x1="0%" y1="0%" x2="100%" y2="100%">` +
    `<stop offset="0%" stop-color="${themePrimary}" stop-opacity="0.9"/>` +
    `<stop offset="100%" stop-color="${themeSecondary}" stop-opacity="0.95"/>` +
    `</linearGradient>` +
    `</defs>` +
    `<rect width="400" height="800" fill="transparent"/>` +
    `<circle cx="200" cy="200" r="85" fill="url(#npc-grad-${displayName.replace(/[^a-zA-Z0-9]/g, '')})"/>` +
    `<path d="M 90 760 C 90 440, 140 330, 200 330 C 260 330, 310 440, 310 760 Z" fill="url(#npc-grad-${displayName.replace(/[^a-zA-Z0-9]/g, '')})"/>` +
    `<circle cx="200" cy="200" r="70" fill="#ffffff" opacity="0.15"/>` +
    `<text x="200" y="215" font-family="system-ui, sans-serif" font-size="44" fill="#ffffff" text-anchor="middle" font-weight="bold">${roleIcon}</text>` +
    `<text x="200" y="380" font-family="system-ui, sans-serif" font-size="20" fill="#ffffff" text-anchor="middle" font-weight="800" letter-spacing="1">${displayName}</text>` +
    `<text x="200" y="415" font-family="system-ui, sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">(${emotion})</text>` +
    `</svg>`
  );
}
