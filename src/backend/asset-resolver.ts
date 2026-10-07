import type { SpindleAPI } from "lumiverse-spindle-types";
import type {
  LedgerData,
  ActorDossier,
  ActorPassions,
  VnPresentationState,
  StageCharacter,
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

    // Fallback SVG
    const svgFallback = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">` +
      `<defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">` +
      `<stop offset="0%" stop-color="#141e30"/><stop offset="100%" stop-color="#243b55"/></linearGradient></defs>` +
      `<rect width="1280" height="720" fill="url(#bg)"/>` +
      `<text x="640" y="360" font-family="system-ui, sans-serif" font-size="28" fill="#ffffff88" text-anchor="middle">` +
      `${placeId ? placeId.toUpperCase() : "STAGE BACKGROUND"}</text></svg>`
    );
    return { url: svgFallback, isVideo: false };
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

    if (characterCardAvatarUrl) {
      return { spriteUrl: characterCardAvatarUrl, layers: {}, emotion };
    }

    const svgAvatar = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="800" viewBox="0 0 400 800">` +
      `<rect width="400" height="800" fill="transparent"/>` +
      `<circle cx="200" cy="220" r="100" fill="#4a5568" opacity="0.8"/>` +
      `<path d="M 80 750 C 80 450, 320 450, 320 750 Z" fill="#2d3748" opacity="0.8"/>` +
      `<text x="200" y="230" font-family="system-ui, sans-serif" font-size="24" fill="#ffffff" text-anchor="middle">` +
      `${actorId.slice(0, 10).toUpperCase()}</text>` +
      `<text x="200" y="270" font-family="system-ui, sans-serif" font-size="16" fill="#cbd5e1" text-anchor="middle">` +
      `(${emotion})</text></svg>`
    );

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
        for (const r of ledger.roster.slice(0, 3)) {
          participants.push(r.id || r.name || "npc");
        }
      } else if (characterId) {
        participants.push(characterId);
      }
    }

    const slots: Array<"left" | "center" | "right"> =
      participants.length === 1 ? ["center"] :
      participants.length === 2 ? ["left", "right"] :
      ["left", "center", "right"];

    for (let i = 0; i < participants.length && i < 3; i++) {
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
      const isSpeaker = isMatch || (participants.length === 1 && normSpeaker !== "narrator");

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

    return {
      chatId,
      messageId,
      speakerName: activeSpeaker,
      paragraphs,
      background,
      characters: stageCharacters,
      ledger,
      hasBPlotNotification,
    };
  }
}
