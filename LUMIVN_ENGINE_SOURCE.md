# LumiVN Engine - Complete Source Bundle

## File: `package.json`

```json
{
  "name": "lumivn_engine",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "bun build ./src/backend.ts ./src/frontend.ts --outdir ./dist --target browser --format esm",
    "typecheck": "tsc --noEmit",
    "verify": "bun run typecheck && bun run build"
  },
  "dependencies": {
    "@imgly/background-removal": "^1.7.0",
    "js-yaml": "^4.1.0"
  },
  "devDependencies": {
    "@types/js-yaml": "^4.0.9",
    "bun-types": "^1.3.14",
    "lumiverse-spindle-types": "0.6.36",
    "typescript": "^5.9.0"
  }
}

```

## File: `spindle.json`

```json
{
  "version": "1.0.0",
  "name": "LumiVN Interactive Studio",
  "identifier": "lumivn_engine",
  "author": "Raja",
  "description": "Ren'Py-style visual novel overlay with HTML life-sim menus, wardrobe, storage, and deterministic offline asset mapping.",
  "permissions": [
    "app_manipulation",
    "chat_mutation",
    "generation",
    "images",
    "chats",
    "characters"
  ],
  "entry_backend": "dist/backend.js",
  "entry_frontend": "dist/frontend.js",
  "minimum_lumiverse_version": "1.1.6"
}

```

## File: `src/backend.ts`

```typescript
import type {
  SpindleAPI,
  ChatMessageDTO,
  GenerationEndedPayloadDTO,
  MessageSwipedPayloadDTO,
  SwipeEditedPayloadDTO,
} from "lumiverse-spindle-types";
import { StorageManager } from "./backend/storage.js";
import { AssetResolver } from "./backend/asset-resolver.js";
import {
  extractLedgerRaw,
  parseLedgerYaml,
  deepMergeLedger,
  extractProse,
} from "./backend/ledger-parser.js";
import type { AssetManifest } from "./shared/types.js";

declare const spindle: SpindleAPI;

const storage = new StorageManager(spindle);
const resolver = new AssetResolver(spindle, storage);

let lastActiveChatId: string | null = null;

const spindleAnyObj = spindle as any;
if (typeof spindleAnyObj.on === "function") {
  spindleAnyObj.on("CHAT_SWITCHED", (payload: unknown) => {
    const candidate = payload && typeof payload === "object" ? (payload as { chatId?: unknown }) : {};
    if (typeof candidate.chatId === "string" && candidate.chatId) {
      lastActiveChatId = candidate.chatId;
      spindle.log.info("[LumiVN] Active chat switched to: " + lastActiveChatId);
    }
  });
}

async function resolveEffectiveChatId(suppliedChatId?: string): Promise<string | null> {
  if (suppliedChatId && suppliedChatId.trim()) {
    lastActiveChatId = suppliedChatId.trim();
    return lastActiveChatId;
  }
  if (lastActiveChatId) return lastActiveChatId;

  try {
    const list = await (spindle.chats as any).list?.({ limit: 1 });
    const first = list?.data?.[0] || list?.[0];
    const resolved = first?.id || first?.chat_id;
    if (resolved) {
      lastActiveChatId = resolved;
      return resolved;
    }
  } catch {}

  return null;
}


// ── 1. Register Command Palette Commands ──
spindle.commands.register([
  {
    id: "lumivn_launch",
    label: "Visual Novel: Open Stage",
    description: "Launch full-screen Ren'Py visual novel mode",
    keywords: ["vn", "renpy", "play", "stage", "visual novel"],
    scope: "chat",
  },
  {
    id: "lumivn_diagnostics",
    label: "Visual Novel: Open Diagnostics",
    description: "Inspect Ledger extraction state and loaded assets",
    keywords: ["debug", "diagnostics", "ledger", "vn"],
    scope: "global",
  },
]);

spindle.commands.onInvoked(async (commandId) => {
  if (commandId === "lumivn_launch") {
    spindle.sendToFrontend({ type: "vn_force_open" });
  } else if (commandId === "lumivn_diagnostics") {
    await spindle.ui.openDrawerTab("vn_diagnostics");
  }
});

async function processChatTurn(chatId: string, messageId?: string, overrideContent?: string): Promise<void> {
  if (!chatId) return;

  try {
    let targetMessage: ChatMessageDTO | null = null;
    let characterId: string | undefined;

    try {
      const activeChat = await spindle.chats.get(chatId);
      if (activeChat) {
        characterId = activeChat.character_id;
      }
    } catch {
      // Ignore if chat lookup fails
    }

    if (overrideContent && messageId) {
      targetMessage = {
        id: messageId,
        role: "assistant",
        content: overrideContent,
        created_at: new Date().toISOString(),
      } as unknown as ChatMessageDTO;
    } else {
      const messages = await spindle.chat.getMessages(chatId);
      if (!messages || messages.length === 0) return;

      // Find the latest assistant message
      for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i];
        if (m && (m.role === "assistant" || !m.is_user)) {
          targetMessage = m;
          break;
        }
      }
    }

    if (!targetMessage || !targetMessage.content) return;

    // Extract Ledger YAML
    const rawLedger = extractLedgerRaw(targetMessage.content);
    let cumulativeLedger = await storage.getChatState(chatId);

    if (rawLedger) {
      const delta = parseLedgerYaml(rawLedger);
      cumulativeLedger = deepMergeLedger(cumulativeLedger, delta);
      await storage.saveChatState(chatId, cumulativeLedger);
    } else if (!cumulativeLedger) {
      // Create empty baseline
      cumulativeLedger = deepMergeLedger(null, {});
    }

    const prose = extractProse(targetMessage.content);
    const presentation = await resolver.buildPresentationState(
      chatId,
      targetMessage.id || "msg_latest",
      prose,
      cumulativeLedger,
      characterId
    );

    // Send main presentation state
    spindle.sendToFrontend({
      type: "vn_state",
      state: presentation,
    });

    // Send telemetry update for diagnostics tab
    spindle.sendToFrontend({
      type: "vn_diagnostic_update",
      data: {
        timestamp: new Date().toLocaleTimeString(),
        chatId,
        messageId: targetMessage.id,
        hasLedger: Boolean(rawLedger),
        placeId: cumulativeLedger?.scene?.place || "default",
        participants: presentation.characters.map(
          (c) => `${c.name} (${c.slot}) [${c.spriteUrl?.startsWith("data:") ? "Fallback SVG" : (c.spriteUrl || "none")}]`
        ),
        bgUrl: presentation.background.url,
      },
    });

    spindle.log.info(
      `[LumiVN] Turn processed. Place: ${cumulativeLedger?.scene?.place || "none"}, Ledger found: ${Boolean(rawLedger)}`
    );
  } catch (err) {
    console.error(`[LumiVN] Error processing turn for chat ${chatId}:`, err);
    spindle.sendToFrontend({
      type: "vn_error",
      error: String(err),
    });
  }
}

// ── Event Handlers ──
spindle.on("GENERATION_ENDED", async (payload: GenerationEndedPayloadDTO) => {
  if (payload?.chatId) {
    await processChatTurn(payload.chatId, payload.messageId);
  }
});

spindle.on("MESSAGE_SWIPED", async (payload: MessageSwipedPayloadDTO) => {
  if (payload?.chatId) {
    await processChatTurn(payload.chatId, payload.message?.id);
  }
});

spindle.on("SWIPE_EDITED", async (payload: SwipeEditedPayloadDTO) => {
  if (payload?.chatId) {
    await processChatTurn(payload.chatId, payload.message?.id);
  }
});

const spindleAny = spindle as any;
if (typeof spindleAny.on === "function") {
  spindleAny.on("MESSAGE_EDITED", async (payload: { chatId?: string; messageId?: string }) => {
    if (payload?.chatId) {
      await processChatTurn(payload.chatId, payload.messageId);
    }
  });
}

// ── Frontend Message Bridge ──
spindle.onFrontendMessage(async (msg: unknown, senderUserId?: string) => {
  const payload = msg as Record<string, unknown>;
  if (!payload || typeof payload !== "object") return;

  const type = String(payload.type);

  switch (type) {
    case "vn_get_state":
    case "vn_init": {
      const chatId = await resolveEffectiveChatId(String(payload.chatId || ""));
      if (chatId) {
        await processChatTurn(chatId);
      } else {
        spindle.sendToFrontend({
          type: "vn_error",
          error: "No active chat could be found to launch Visual Novel.",
        });
      }
      break;
    }

    case "vn_action": {
      const chatId = await resolveEffectiveChatId(String(payload.chatId || ""));
      const actionText = String(payload.action || "");
      spindle.log.info(`[LumiVN] Dispatching action for chat ${chatId}: "${actionText.slice(0, 60)}"`);

      if (!chatId || !actionText) {
        spindle.sendToFrontend({
          type: "vn_error",
          error: "Failed to dispatch action: chatId or actionText was empty",
        });
        break;
      }

      try {
        await spindle.chat.appendMessage(
          chatId,
          { role: "user", content: actionText },
          { triggerGeneration: true }
        );
        spindle.log.info(`[LumiVN] Successfully appended user message and triggered generation.`);
        spindle.sendToFrontend({
          type: "vn_log",
          message: `Dispatched user action: "${actionText.slice(0, 40)}..."`,
          level: "action",
        });
      } catch (err: any) {
        const errMsg = String(err?.message || err);
        spindle.log.error(`[LumiVN] Failed to dispatch action: ${errMsg}`);

        let userNotice = errMsg;
        if (errMsg.includes("PERMISSION_DENIED: generation")) {
          userNotice = 'PERMISSION_DENIED: Please enable the "Generation" permission under Settings → Extensions → LumiVN Interactive Studio.';
        }

        spindle.sendToFrontend({
          type: "vn_error",
          error: `Action dispatch failed: ${userNotice}`,
        });
      }
      break;
    }

    case "vn_get_manifest": {
      const manifest = await storage.getManifest();
      spindle.sendToFrontend({ type: "vn_manifest", manifest });
      break;
    }

    case "vn_save_manifest": {
      const manifest = payload.manifest as AssetManifest;
      if (manifest) {
        await storage.saveManifest(manifest);
        spindle.sendToFrontend({ type: "vn_manifest", manifest });
      }
      break;
    }

    case "vn_edit_message": {
      const chatId = String(payload.chatId || "");
      const messageId = String(payload.messageId || "");
      const content = String(payload.content || "");

      if (chatId && messageId && content) {
        try {
          await spindle.chat.updateMessage(chatId, messageId, { content });
          spindle.log.info(`[LumiVN] Updated message ${messageId} in chat ${chatId}`);
          await processChatTurn(chatId, messageId, content);
          spindle.sendToFrontend({
            type: "vn_log",
            message: `Updated line in message #${messageId.slice(0, 8)}`,
            level: "info",
          });
        } catch (err: any) {
          spindle.log.error(`[LumiVN] Failed to edit message: ${err.message || err}`);
          spindle.sendToFrontend({ type: "vn_error", error: `Edit failed: ${String(err.message || err)}` });
        }
      }
      break;
    }

    case "vn_upload_asset": {
      try {
        const category = String(payload.category); // "places", "characters", or "actions"
        const scope = String(payload.scope || "").toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");
        let placeId = String(payload.placeId || "").toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");
        const actorId = String(payload.actorId || "").toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");
        const outfit = String(payload.outfit || "default").toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");
        const expression = String(payload.expression || "neutral").toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");
        const actionName = String(payload.actionName || "").toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");
        const filename = String(payload.filename || "asset.png");
        const dataUrl = String(payload.dataUrl || "");
        const chatId = String(payload.chatId || "");

        if (!dataUrl) throw new Error("No image data provided");

        // Format compound place key if scope is present
        const finalPlaceKey = scope ? `${scope}:${placeId}` : placeId;

        // Resolve userId for operator-scoped call
        let resolvedUserId = senderUserId || (payload.userId as string | undefined);
        if (!resolvedUserId && chatId) {
          try {
            const chat = await spindle.chats.get(chatId);
            resolvedUserId = (chat as any)?.user_id || (chat as any)?.userId;
          } catch {}
        }
        if (!resolvedUserId) {
          try {
            const chatList = await (spindle.chats as any).list?.({ limit: 1 });
            const first = chatList?.data?.[0];
            resolvedUserId = first?.user_id || first?.userId;
          } catch {}
        }

        // Decode Base64 to Uint8Array
        let base64 = dataUrl;
        let mimeType = "image/png";
        if (base64.includes(",")) {
          const match = base64.match(/data:([^;]+);base64,/);
          if (match) mimeType = match[1]!;
          base64 = base64.split(",")[1] ?? "";
        }
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const upload = await spindle.images.upload({
          data: bytes,
          filename,
          mime_type: mimeType,
          userId: resolvedUserId,
          user_id: resolvedUserId,
        } as any, resolvedUserId);

        const manifest = await storage.getManifest();

        if (category === "places" && finalPlaceKey) {
          manifest.places[finalPlaceKey] = upload.url;
        } else if (category === "characters" && actorId) {
          if (!manifest.characters[actorId]) manifest.characters[actorId] = {};
          if (!manifest.characters[actorId].outfits) manifest.characters[actorId].outfits = {};
          if (!manifest.characters[actorId].outfits[outfit]) manifest.characters[actorId].outfits[outfit] = {};
          manifest.characters[actorId].outfits[outfit][expression] = upload.url;
        } else if (category === "actions" && actorId && actionName) {
          if (!manifest.characters[actorId]) manifest.characters[actorId] = {};
          if (!manifest.characters[actorId].actions) manifest.characters[actorId].actions = {};
          manifest.characters[actorId].actions[actionName] = upload.url;
        }

        await storage.saveManifest(manifest);
        spindle.sendToFrontend({ type: "vn_manifest", manifest });
        spindle.sendToFrontend({
          type: "vn_log",
          message: `Registered: ${category} -> ${finalPlaceKey || `${actorId}/${outfit}/${expression}` || actionName}`,
          level: "info",
        });

        if (chatId) {
          await processChatTurn(chatId);
        }
      } catch (err: any) {
        spindle.sendToFrontend({ type: "vn_error", error: `Upload failed: ${String(err.message || err)}` });
      }
      break;
    }

    case "vn_delete_asset": {
      try {
        const category = String(payload.category); // "places", "characters", "actions"
        const key = String(payload.key || "");
        const actorId = String(payload.actorId || "").toLowerCase();
        const outfit = String(payload.outfit || "");
        const expression = String(payload.expression || "");
        const actionName = String(payload.actionName || "");
        const chatId = String(payload.chatId || "");

        const manifest = await storage.getManifest();

        if (category === "places" && key) {
          delete manifest.places[key];
        } else if (category === "characters" && actorId && outfit && expression) {
          const charData = manifest.characters[actorId];
          if (charData) {
            // 1. Delete from explicit wrapper structure if present
            if (charData.outfits?.[outfit]) {
              delete charData.outfits[outfit][expression];
              if (Object.keys(charData.outfits[outfit]).length === 0) {
                delete charData.outfits[outfit];
              }
            }
            // 2. Delete from top-level fallback structure (no explicit .outfits wrapper)
            if ((charData as any)[outfit]?.[expression]) {
              delete (charData as any)[outfit][expression];
              if (Object.keys((charData as any)[outfit]).length === 0) {
                delete (charData as any)[outfit];
              }
            }

            // 3. Cleanup empty outer properties / objects
            if (charData.outfits && Object.keys(charData.outfits).length === 0) {
              delete charData.outfits;
            }
            const hasOutfits = charData.outfits && Object.keys(charData.outfits).length > 0;
            const hasDirectOutfits = Object.keys(charData).filter(
              (k) => k !== "actions" && k !== "outfits"
            ).some((k) => typeof (charData as any)[k] === "object" && (charData as any)[k] !== null);
            const hasActions = charData.actions && Object.keys(charData.actions).length > 0;

            if (!hasOutfits && !hasDirectOutfits && !hasActions) {
              delete manifest.characters[actorId];
            }
          }
        } else if (category === "actions" && actorId && actionName) {
          if (manifest.characters[actorId]?.actions) {
            delete manifest.characters[actorId].actions[actionName];
            if (Object.keys(manifest.characters[actorId].actions).length === 0) {
              delete manifest.characters[actorId].actions;
            }
          }
          if (
            manifest.characters[actorId] &&
            Object.keys(manifest.characters[actorId]).length === 0
          ) {
            delete manifest.characters[actorId];
          }
        }

        await storage.saveManifest(manifest);
        spindle.sendToFrontend({ type: "vn_manifest", manifest });
        spindle.sendToFrontend({
          type: "vn_log",
          message: `Deleted asset entry: ${category} -> ${key || actionName || `${actorId}/${outfit}/${expression}`}`,
          level: "info",
        });

        if (chatId) {
          await processChatTurn(chatId);
        }
      } catch (err: any) {
        spindle.sendToFrontend({ type: "vn_error", error: `Delete failed: ${String(err.message || err)}` });
      }
      break;
    }
  }
});

```

## File: `src/backend/asset-resolver.ts`

```typescript
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

```

## File: `src/backend/ledger-parser.ts`

```typescript
import yaml from "js-yaml";
import type { LedgerData, ActorDossier, PlaceNode, BPlot, Opportunity, JournalEntry } from "../shared/types.js";

const LEDGER_DETAILS_RE = /<details[^>]*>\s*<summary[^>]*>.*?Ledger.*?<\/summary>([\s\S]*?)<\/details>/i;
const YAML_BLOCK_RE = /```(?:yaml|yml)?\s*([\s\S]*?)```/gi;
const THINK_TAGS_RE = /<think\b[^>]*>[\s\S]*?<\/think>/gi;
const SCENE_LOGIC_RE = /<details[^>]*>\s*<summary[^>]*>.*?Scene Logic.*?<\/summary>[\s\S]*?<\/details>/gi;
const PLAYER_TRACKING_RE = /\n*(?:Loadout|Attire|Body):[\s\S]*$/i;

/**
 * Extracts and cleans the narrative prose from the raw assistant message.
 */
export function extractProse(rawContent: string): string {
  let cleaned = (rawContent || "")
    .replace(THINK_TAGS_RE, "")
    .replace(SCENE_LOGIC_RE, "")
    .replace(LEDGER_DETAILS_RE, "")
    .replace(PLAYER_TRACKING_RE, "")
    .trim();

  return cleaned;
}

/**
 * Splits prose into clean paragraphs for the VN typewriter.
 */
export function extractParagraphs(prose: string): string[] {
  return (prose || "")
    .split(/\r?\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/**
 * Determines the active speaker name and text from a paragraph.
 */
export function detectSpeaker(paragraph: string, defaultSpeaker = "Narrator"): { speaker: string; text: string } {
  // Pattern 1: **Name**: "..." or **Name:** "..."
  const boldPrefix = paragraph.match(/^\*\*([A-Za-z0-9_\-\s]+?)\*\*[:\s]+([\s\S]*)$/);
  if (boldPrefix) {
    return { speaker: boldPrefix[1]!.replace(/:$/, "").trim(), text: boldPrefix[2]!.trim() };
  }

  // Pattern 2: Name: "..."
  const colonPrefix = paragraph.match(/^([A-Z][a-zA-Z0-9_\s]{1,24}):\s+([\s\S]*)$/);
  if (colonPrefix) {
    return { speaker: colonPrefix[1]!.trim(), text: colonPrefix[2]!.trim() };
  }

  // Pattern 3: Name followed by narrative action leading to quoted dialogue: Name glanced... "..."
  const actionDialogue = paragraph.match(/^([A-Z][a-zA-Z0-9_]{1,20})\b[^"“]*?["“]([\s\S]*?)["”]/);
  if (actionDialogue) {
    return { speaker: actionDialogue[1]!.trim(), text: paragraph };
  }

  // Pattern 4: Dialogue quotes with speech tag, e.g. "..." Name said.
  const speechTag = paragraph.match(/["”]\s*([A-Z][a-zA-Z0-9_]{1,20})\s+(?:said|whispered|asked|replied|shouted|murmured)/i);
  if (speechTag) {
    return { speaker: speechTag[1]!.trim(), text: paragraph };
  }

  return { speaker: defaultSpeaker, text: paragraph };
}

/**
 * Extracts raw YAML from the My World Ledger block.
 */
export function extractLedgerRaw(rawContent: string): string | null {
  const match = LEDGER_DETAILS_RE.exec(rawContent);
  if (!match) return null;
  return match[1] || "";
}

/**
 * Parses the raw Ledger details content into a structured LedgerData object.
 */
export function parseLedgerYaml(rawLedgerText: string): Partial<LedgerData> {
  const combined: Record<string, unknown> = {};

  // Check for markdown code blocks (```yaml ... ```)
  const codeBlocks: string[] = [];
  let blockMatch: RegExpExecArray | null;
  YAML_BLOCK_RE.lastIndex = 0;
  while ((blockMatch = YAML_BLOCK_RE.exec(rawLedgerText)) !== null) {
    if (blockMatch[1]?.trim()) {
      codeBlocks.push(blockMatch[1].trim());
    }
  }

  if (codeBlocks.length > 0) {
    for (const block of codeBlocks) {
      try {
        const parsed = yaml.load(block);
        if (parsed && typeof parsed === "object") {
          Object.assign(combined, parsed);
        }
      } catch (err) {
        console.warn("[LumiVN] Failed to parse YAML block in Ledger:", err);
      }
    }
  } else {
    // If no explicit code fence, clean out headers (## ...) and attempt whole block parse
    const stripped = rawLedgerText
      .split(/\r?\n/)
      .filter((line) => !line.trim().startsWith("#"))
      .join("\n");
    try {
      const parsed = yaml.load(stripped);
      if (parsed && typeof parsed === "object") {
        Object.assign(combined, parsed);
      }
    } catch (err) {
      console.warn("[LumiVN] Failed to parse stripped YAML text in Ledger:", err);
    }
  }

  // Normalize actor dossiers:
  // In My World 1.79, actors may appear as top-level keys in the YAML document,
  // or under 'actors', or 'user' + NPC ids.
  const actors: Record<string, ActorDossier> = {};
  const standardRootKeys = new Set([
    "world",
    "clock",
    "places",
    "travel",
    "roster",
    "scene",
    "fronts",
    "journal",
    "bplots",
    "opportunities",
    "init",
  ]);

  for (const [key, val] of Object.entries(combined)) {
    if (!standardRootKeys.has(key) && val && typeof val === "object" && !Array.isArray(val)) {
      const obj = val as Record<string, unknown>;
      // If it looks like an actor dossier (has outfit, passions, relations, inventory, or appearance)
      if (obj.outfit || obj.passions || obj.relations || obj.inventory || obj.appearance || key === "user") {
        actors[key] = { id: key, ...(obj as ActorDossier) };
      }
    }
  }

  if (combined.actors && typeof combined.actors === "object" && !Array.isArray(combined.actors)) {
    Object.assign(actors, combined.actors);
  }

  const result: Partial<LedgerData> = {
    world: combined.world as Record<string, unknown> | undefined,
    clock: combined.clock as LedgerData["clock"] | undefined,
    scene: combined.scene as LedgerData["scene"] | undefined,
    places: combined.places as Record<string, PlaceNode> | undefined,
    roster: Array.isArray(combined.roster) ? (combined.roster as LedgerData["roster"]) : undefined,
    actors,
    bplots: Array.isArray(combined.bplots) ? (combined.bplots as BPlot[]) : undefined,
    opportunities: Array.isArray(combined.opportunities) ? (combined.opportunities as Opportunity[]) : undefined,
    journal: Array.isArray(combined.journal) ? (combined.journal as JournalEntry[]) : undefined,
  };

  return result;
}

/**
 * Deep merges cumulative ledger states across turns.
 */
export function deepMergeLedger(base: LedgerData | null, delta: Partial<LedgerData>): LedgerData {
  if (!base) {
    return {
      world: delta.world || {},
      clock: delta.clock || {},
      scene: delta.scene || {},
      places: delta.places || {},
      roster: delta.roster || [],
      actors: delta.actors || {},
      bplots: delta.bplots || [],
      opportunities: delta.opportunities || [],
      journal: delta.journal || [],
    };
  }

  const merged: LedgerData = {
    world: { ...base.world, ...delta.world },
    clock: { ...base.clock, ...delta.clock },
    scene: { ...base.scene, ...delta.scene },
    places: { ...base.places, ...delta.places },
    roster: delta.roster && delta.roster.length > 0 ? delta.roster : base.roster || [],
    actors: { ...base.actors },
    bplots: delta.bplots && delta.bplots.length > 0 ? delta.bplots : base.bplots || [],
    opportunities: delta.opportunities && delta.opportunities.length > 0 ? delta.opportunities : base.opportunities || [],
    journal: [...(base.journal || []), ...(delta.journal || [])],
  };

  if (delta.actors) {
    for (const [actorId, actorDelta] of Object.entries(delta.actors)) {
      const baseActor = base.actors?.[actorId] || {};
      merged.actors![actorId] = {
        ...baseActor,
        ...actorDelta,
        appearance: { ...baseActor.appearance, ...actorDelta.appearance },
        money: { ...baseActor.money, ...actorDelta.money },
        passions: { ...baseActor.passions, ...actorDelta.passions },
        outfit: {
          ...baseActor.outfit,
          ...actorDelta.outfit,
          accessories: actorDelta.outfit?.accessories || baseActor.outfit?.accessories || [],
        },
        inventory: {
          ...baseActor.inventory,
          ...actorDelta.inventory,
          in_hand: { ...baseActor.inventory?.in_hand, ...actorDelta.inventory?.in_hand },
          carried: actorDelta.inventory?.carried || baseActor.inventory?.carried || [],
          room: actorDelta.inventory?.room || baseActor.inventory?.room || [],
        },
        relations: { ...baseActor.relations, ...actorDelta.relations },
      };
    }
  }

  return merged;
}

```

## File: `src/backend/storage.ts`

```typescript
import type { SpindleAPI } from "lumiverse-spindle-types";
import type { AssetManifest, LedgerData } from "../shared/types.js";

const DEFAULT_MANIFEST: AssetManifest = {
  places: {},
  characters: {},
};

export class StorageManager {
  private spindle: SpindleAPI;

  constructor(spindle: SpindleAPI) {
    this.spindle = spindle;
  }

  async getManifest(): Promise<AssetManifest> {
    try {
      const exists = await this.spindle.storage.exists("asset_manifest.json");
      if (exists) {
        const raw = await this.spindle.storage.read("asset_manifest.json");
        return JSON.parse(raw) as AssetManifest;
      }
    } catch (e) {
      console.warn("[LumiVN] Failed to read asset_manifest.json, using default:", e);
    }
    return { ...DEFAULT_MANIFEST };
  }

  async saveManifest(manifest: AssetManifest): Promise<void> {
    try {
      await this.spindle.storage.write("asset_manifest.json", JSON.stringify(manifest, null, 2));
    } catch (e) {
      console.error("[LumiVN] Failed to save asset_manifest.json:", e);
    }
  }

  async getChatState(chatId: string): Promise<LedgerData | null> {
    try {
      const path = `chats/${chatId}/state.json`;
      const exists = await this.spindle.storage.exists(path);
      if (exists) {
        const raw = await this.spindle.storage.read(path);
        return JSON.parse(raw) as LedgerData;
      }
    } catch (e) {
      console.warn(`[LumiVN] Failed to read chat state for ${chatId}:`, e);
    }
    return null;
  }

  async saveChatState(chatId: string, state: LedgerData): Promise<void> {
    try {
      const dir = `chats/${chatId}`;
      if (!(await this.spindle.storage.exists(dir))) {
        await this.spindle.storage.mkdir(dir);
      }
      await this.spindle.storage.write(`${dir}/state.json`, JSON.stringify(state, null, 2));
    } catch (e) {
      console.error(`[LumiVN] Failed to save chat state for ${chatId}:`, e);
    }
  }

  async saveMediaFile(relPath: string, dataUrlOrBase64: string): Promise<string> {
    try {
      const parts = relPath.split("/");
      if (parts.length > 1) {
        let currentDir = "";
        for (let i = 0; i < parts.length - 1; i++) {
          currentDir = currentDir ? `${currentDir}/${parts[i]}` : parts[i]!;
          if (!(await this.spindle.storage.exists(currentDir))) {
            await this.spindle.storage.mkdir(currentDir);
          }
        }
      }

      // Convert data url / base64 to binary
      let base64 = dataUrlOrBase64;
      if (base64.includes(",")) {
        base64 = base64.split(",")[1] ?? "";
      }
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      await this.spindle.storage.writeBinary(relPath, bytes);
      return relPath;
    } catch (e) {
      console.error(`[LumiVN] Failed to save media file to ${relPath}:`, e);
      throw e;
    }
  }

  async fileExists(path: string): Promise<boolean> {
    try {
      return await this.spindle.storage.exists(path);
    } catch {
      return false;
    }
  }
}

```

## File: `src/frontend.ts`

```typescript
import type { SpindleFrontendContext, SpindleAppMountHandle } from "lumiverse-spindle-types";
import type { VnPresentationState } from "./shared/types.js";
import { StageOverlay } from "./frontend/stage/overlay.js";
import { registerAssetDrawer } from "./frontend/studio/asset-drawer.js";
import {
  registerDiagnosticsDrawer,
  type DiagnosticData,
} from "./frontend/studio/diagnostics-drawer.js";

const CLEANUP_KEY = "__lumivnCleanup";

export function setup(ctx: SpindleFrontendContext): () => void {
  const prevCleanup = (globalThis as Record<string, unknown>)[CLEANUP_KEY];
  if (typeof prevCleanup === "function") {
    try {
      prevCleanup();
    } catch {
      // Ignore
    }
  }

  let appMount: SpindleAppMountHandle | null = null;
  let mountContainer: HTMLElement;

  if (typeof ctx.ui?.mountApp === "function") {
    appMount = ctx.ui.mountApp({
      className: "lumivn-app-mount",
      position: "app-overlay",
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
      if (appMount) appMount.setVisible(false);
    } else {
      if (appMount) appMount.setVisible(true);
      overlay.activate();
    }
  };

  const overlay = new StageOverlay({
    ctx,
    onExit: () => {
      if (appMount) appMount.setVisible(false);
    },
  });
  mountContainer.appendChild(overlay.root);

  // Register Drawer Tabs
  const diagDrawer = registerDiagnosticsDrawer(ctx, toggleStage);
  const assetDrawer = registerAssetDrawer(ctx);

  // 1. Chat Header Button (Like Cue)
  let chatHeaderActionHandle: { destroy(): void } | null = null;
  const ctxAny = ctx as any;
  if (typeof ctxAny.ui?.registerChatHeaderAction === "function") {
    chatHeaderActionHandle = ctxAny.ui.registerChatHeaderAction({
      id: "lumivn_header_toggle",
      label: "Visual Novel",
      tooltip: "Open full-screen Visual Novel life-sim stage",
      iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><polygon points="10 8 16 11 10 14 10 8"/><line x1="6" y1="21" x2="18" y2="21"/></svg>`,
      onClick: () => toggleStage(),
    });
  }

  // Register Input Bar Action (Fallback)
  let inputBarActionHandle: { destroy(): void } | null = null;
  if (typeof ctx.ui?.registerInputBarAction === "function") {
    const action = ctx.ui.registerInputBarAction({
      id: "lumivn_toggle",
      label: "Visual Novel",
      subtitle: "Open full-screen Visual Novel stage",
      enabled: true,
    });
    action.onClick(() => toggleStage());
    inputBarActionHandle = action;
  }

  // ── Persistent Floating Chat Window Toggle ──
  const POS_STORAGE_KEY = "lumivn_float_button_pos";
  let floatBtn = document.getElementById("lumivn-float-toggle") as HTMLButtonElement | null;
  if (!floatBtn) {
    floatBtn = document.createElement("button");
    floatBtn.id = "lumivn-float-toggle";
    floatBtn.title = "Click to start Visual Novel • Drag to move anywhere";
    floatBtn.innerHTML = `
      <span style="opacity: 0.6; font-size: 11px; cursor: grab; user-select: none;">⋮⋮</span>
      <span style="font-size: 16px;">🎬</span>
      <span style="font-weight: 700; font-size: 13px; letter-spacing: 0.3px;">Visual Novel</span>
    `;

    // Load saved position
    let savedPos: { top: number; left: number } | null = null;
    try {
      const raw = localStorage.getItem(POS_STORAGE_KEY);
      if (raw) savedPos = JSON.parse(raw);
    } catch {}

    const initialTop = savedPos ? `${Math.max(10, Math.min(window.innerHeight - 50, savedPos.top))}px` : "70px";
    const initialLeft = savedPos ? `${Math.max(10, Math.min(window.innerWidth - 150, savedPos.left))}px` : "";

    floatBtn.style.cssText = `
      position: fixed;
      top: ${initialTop};
      ${savedPos ? `left: ${initialLeft};` : `right: 20px;`}
      z-index: 9995;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(139, 92, 246, 0.95));
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 24px;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: grab;
      user-select: none;
      touch-action: none;
      box-shadow: 0 4px 18px rgba(99, 102, 241, 0.45), 0 2px 6px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(8px);
      transition: box-shadow 0.2s ease, opacity 0.2s ease;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    // Drag-and-drop state
    let isDragging = false;
    let hasMoved = false;
    let startX = 0;
    let startY = 0;
    let originLeft = 0;
    let originTop = 0;

    floatBtn.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return; // Primary button only
      isDragging = true;
      hasMoved = false;
      startX = e.clientX;
      startY = e.clientY;

      const rect = floatBtn!.getBoundingClientRect();
      originLeft = rect.left;
      originTop = rect.top;

      floatBtn!.style.cursor = "grabbing";
      try {
        floatBtn!.setPointerCapture(e.pointerId);
      } catch {}
    });

    floatBtn.addEventListener("pointermove", (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (Math.hypot(dx, dy) > 4) {
        hasMoved = true;
      }

      const w = floatBtn!.offsetWidth || 140;
      const h = floatBtn!.offsetHeight || 40;
      const newLeft = Math.max(8, Math.min(window.innerWidth - w - 8, originLeft + dx));
      const newTop = Math.max(8, Math.min(window.innerHeight - h - 8, originTop + dy));

      floatBtn!.style.left = `${newLeft}px`;
      floatBtn!.style.top = `${newTop}px`;
      floatBtn!.style.right = "auto";
    });

    const endDrag = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      floatBtn!.style.cursor = "grab";

      try {
        floatBtn!.releasePointerCapture(e.pointerId);
      } catch {}

      if (hasMoved) {
        const rect = floatBtn!.getBoundingClientRect();
        try {
          localStorage.setItem(POS_STORAGE_KEY, JSON.stringify({ top: rect.top, left: rect.left }));
        } catch {}
      }
    };

    floatBtn.addEventListener("pointerup", endDrag);
    floatBtn.addEventListener("pointercancel", endDrag);

    floatBtn.addEventListener("mouseenter", () => {
      if (!isDragging) {
        floatBtn!.style.boxShadow = "0 6px 22px rgba(99, 102, 241, 0.65)";
      }
    });
    floatBtn.addEventListener("mouseleave", () => {
      if (!isDragging) {
        floatBtn!.style.boxShadow = "0 4px 18px rgba(99, 102, 241, 0.45)";
      }
    });

    floatBtn.addEventListener("click", (e) => {
      if (hasMoved) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      toggleStage();
    });

    document.body.appendChild(floatBtn);
  }

  // Handle Backend Messages
  const unsubscribeBackend = ctx.onBackendMessage((msg: unknown) => {
    const payload = msg as Record<string, unknown>;
    if (payload?.type === "vn_force_open") {
      if (!overlay.isActive()) toggleStage();
      diagDrawer?.pushLog("Stage launched via Command Palette.", "info");
    } else if (payload?.type === "vn_diagnostic_update" && payload.data) {
      diagDrawer?.updateDiagnostic(payload.data as DiagnosticData);
    } else if (payload?.type === "vn_state" && payload.state) {
      const st = payload.state as VnPresentationState;
      overlay.updatePresentation(st);
      diagDrawer?.setLatestLedger(st.ledger);
    } else if (payload?.type === "vn_log") {
      diagDrawer?.pushLog(String(payload.message), (payload.level as any) || "info");
    } else if (payload?.type === "vn_manifest" && payload.manifest) {
      diagDrawer?.setLatestManifest?.(payload.manifest);
      overlay.setManifest(payload.manifest);
    } else if (payload?.type === "vn_error") {
      diagDrawer?.pushLog(String(payload.error), "error");
    }
  });

  ctx.ready();

  const cleanup = () => {
    unsubscribeBackend();
    chatHeaderActionHandle?.destroy();
    inputBarActionHandle?.destroy();
    assetDrawer?.destroy();
    diagDrawer?.tab.destroy();
    overlay.destroy();
    const existingFloatBtn = document.getElementById("lumivn-float-toggle");
    existingFloatBtn?.remove();
    if (appMount) {
      appMount.destroy();
    } else {
      mountContainer.remove();
    }
  };

  (globalThis as Record<string, unknown>)[CLEANUP_KEY] = cleanup;
  return cleanup;
}

```

## File: `src/frontend/hud/menu-bar.ts`

```typescript
import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import type { LedgerData, AssetManifest } from "../../shared/types.js";
import { CharactersTab } from "./tab-characters.js";
import { WardrobeTab } from "./tab-wardrobe.js";
import { StatsTab } from "./tab-stats.js";
import { InventoryTab } from "./tab-inventory.js";
import { MapTab } from "./tab-map.js";
import { PhoneTab } from "./tab-phone.js";
import { JournalTab } from "./tab-journal.js";
import { SceneTab } from "./tab-scene.js";
import type { SpriteTransform } from "../stage/sprite-transform.js";

export type HudTabId = "characters" | "wardrobe" | "stats" | "inventory" | "map" | "phone" | "journal" | "scene";

export interface MenuBarOptions {
  ctx: SpindleFrontendContext;
  onAction: (actionText: string) => void;
  onTransformChange?: (actorId: string, transform: SpriteTransform) => void;
}

export class MenuBar {
  public root: HTMLElement;
  private panelOverlay: HTMLElement;
  private panelBody: HTMLElement;
  private phoneBadge: HTMLElement | null = null;

  private charactersTab: CharactersTab;
  private wardrobeTab: WardrobeTab;
  private statsTab: StatsTab;
  private inventoryTab: InventoryTab;
  private mapTab: MapTab;
  private phoneTab: PhoneTab;
  private journalTab: JournalTab;
  private sceneTab: SceneTab;

  private activeTabId: HudTabId | null = null;
  private currentLedger: LedgerData = {};
  private currentManifest?: AssetManifest;

  constructor(options: MenuBarOptions) {
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
      if (e.target === this.panelOverlay) this.closeTab();
    });

    // Instantiate tab views
    this.charactersTab = new CharactersTab();
    this.wardrobeTab = new WardrobeTab(options.onAction);
    this.statsTab = new StatsTab();
    this.inventoryTab = new InventoryTab(options.onAction);
    this.mapTab = new MapTab(options.onAction);
    this.phoneTab = new PhoneTab(options.ctx, options.onAction);
    this.journalTab = new JournalTab();
    this.sceneTab = new SceneTab(options.ctx, options.onTransformChange);

    // Render bar buttons
    const barItems: Array<{ id: HudTabId; icon: string; label: string }> = [
      { id: "characters", icon: "👥", label: "Cast" },
      { id: "wardrobe", icon: "👗", label: "Wardrobe" },
      { id: "stats", icon: "📊", label: "Stats" },
      { id: "inventory", icon: "🎒", label: "Inventory" },
      { id: "map", icon: "🗺️", label: "Map" },
      { id: "phone", icon: "📱", label: "Phone" },
      { id: "journal", icon: "📜", label: "Journal" },
      { id: "scene", icon: "🎬", label: "Scene" },
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

  public getOverlay(): HTMLElement {
    return this.panelOverlay;
  }

  public setLedger(ledger: LedgerData, hasBPlotNotification = false): void {
    this.currentLedger = ledger;
    if (this.phoneBadge) {
      this.phoneBadge.style.display = hasBPlotNotification ? "inline-block" : "none";
    }

    if (this.activeTabId) {
      this.renderActiveTab();
    }
  }

  public setManifest(manifest: AssetManifest): void {
    this.currentManifest = manifest;
    if (this.activeTabId === "characters" || this.activeTabId === "scene") {
      this.renderActiveTab();
    }
  }

  public openTab(tabId: HudTabId): void {
    this.activeTabId = tabId;
    this.renderActiveTab();
    this.panelOverlay.style.display = "flex";
  }

  public closeTab(): void {
    this.activeTabId = null;
    this.panelOverlay.style.display = "none";
  }

  private renderActiveTab(): void {
    this.panelBody.innerHTML = "";
    switch (this.activeTabId) {
      case "characters":
        this.charactersTab.render(this.currentLedger, this.currentManifest);
        this.panelBody.appendChild(this.charactersTab.root);
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
    }
  }
}

```

## File: `src/frontend/hud/tab-characters.ts`

```typescript
import type { LedgerData, ActorDossier, AssetManifest } from "../../shared/types.js";

export class CharactersTab {
  public root: HTMLElement;
  private selectedActorId: string | null = null;

  constructor() {
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-characters";
  }

  public render(ledger: LedgerData, manifest?: AssetManifest): void {
    this.root.innerHTML = "";
    const actors = ledger.actors || {};
    const actorIds = Object.keys(actors).filter((id) => id.toLowerCase() !== "user");

    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `<h3>👥 Cast & Character Records</h3><p class="vn-muted">Select a character to inspect appearance, personality profile, and relationships.</p>`;
    this.root.appendChild(header);

    if (actorIds.length === 0) {
      this.root.innerHTML += `<div class="vn-muted" style="text-align:center; padding: 24px;">No secondary characters recorded yet.</div>`;
      return;
    }

    if (!this.selectedActorId || !actors[this.selectedActorId]) {
      this.selectedActorId = actorIds[0]!;
    }

    // Avatar Icon Ribbon
    const ribbon = document.createElement("div");
    ribbon.style.cssText = "display: flex; gap: 14px; overflow-x: auto; padding: 6px 4px 16px 4px; border-bottom: 1px solid #334155; margin-bottom: 18px;";

    for (const id of actorIds) {
      const actor = actors[id]!;
      const isSelected = id === this.selectedActorId;
      const cleanId = id.toLowerCase().replace(/[^a-z0-9_-]/g, "_");

      // Resolve avatar URL from manifest or fallback
      let avatarUrl = "";
      if (manifest?.characters?.[cleanId]) {
        const charData = manifest.characters[cleanId]!;
        const outfits = charData.outfits || (charData as any);
        const defaultSet = outfits?.["default"] || (outfits ? Object.values(outfits)[0] : undefined);
        avatarUrl = defaultSet?.["neutral"] || defaultSet?.["smile"] || (defaultSet ? Object.values(defaultSet)[0] : "") || "";
      }

      const item = document.createElement("div");
      item.style.cssText = `display: flex; flex-direction: column; align-items: center; cursor: pointer; min-width: 68px; transition: transform 0.15s ease;`;
      item.innerHTML = `
        <div style="width: 56px; height: 56px; border-radius: 50%; overflow: hidden; border: 2px solid ${isSelected ? "#818cf8" : "#475569"}; box-shadow: ${isSelected ? "0 0 10px rgba(99,102,241,0.6)" : "none"}; background: #1e293b; display: flex; align-items: center; justify-content: center;">
          ${avatarUrl ? `<img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="${actor.name || id}" />` : `<span style="font-size: 20px;">👤</span>`}
        </div>
        <span style="font-size: 11px; margin-top: 5px; color: ${isSelected ? "#f8fafc" : "#94a3b8"}; font-weight: ${isSelected ? "700" : "500"}; max-width: 64px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${actor.name || id}</span>
      `;
      item.addEventListener("click", () => {
        this.selectedActorId = id;
        this.render(ledger, manifest);
      });
      ribbon.appendChild(item);
    }
    this.root.appendChild(ribbon);

    // Selected Actor Dossier View
    const actor = actors[this.selectedActorId]!;
    this.renderActorDetails(actor, ledger);
  }

  private renderActorDetails(actor: ActorDossier, ledger: LedgerData): void {
    const detailsContainer = document.createElement("div");
    detailsContainer.style.cssText = "display: flex; flex-direction: column; gap: 16px;";

    const prof = (actor.profile as Record<string, any>) || {};
    const life = (actor.life_model as Record<string, any>) || {};
    const app = (actor.appearance as Record<string, any>) || {};

    // 1. Identity & Appearance Card
    const idCard = document.createElement("div");
    idCard.className = "vn-section";
    idCard.innerHTML = `
      <h4>${actor.name || actor.id} — Overview</h4>
      <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 12px; font-size: 13px; line-height: 1.5; color: #cbd5e1;">
        <div><strong>Occupation:</strong> ${life.occupation || "Unknown"} | <strong>Age/Traits:</strong> ${app.age || "Unknown"}, ${app.traits || "None"}</div>
        <div style="margin-top: 4px;"><strong>Style & Appeal:</strong> ${app.style || "Casual"} (${app.appeal ?? "?"}/100)</div>
        <div style="margin-top: 4px;"><strong>Current Want:</strong> <span style="color: #38bdf8;">${(actor.agency as any)?.want_now || "None declared"}</span></div>
      </div>
    `;
    detailsContainer.appendChild(idCard);

    // 2. Personality & Dispositions
    const disp = prof.dispositions || {};
    const dispKeys = Object.keys(disp);
    if (dispKeys.length > 0) {
      const dispSection = document.createElement("div");
      dispSection.className = "vn-section";
      dispSection.innerHTML = `<h4>Dispositions & Psychological Traits</h4>`;
      const grid = document.createElement("div");
      grid.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 8px;";
      for (const k of dispKeys) {
        const item = document.createElement("div");
        item.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 6px 10px; font-size: 11px;";
        item.innerHTML = `<span style="color: #94a3b8; text-transform: capitalize;">${k}:</span> <strong style="color: #f8fafc;">${disp[k]}</strong>`;
        grid.appendChild(item);
      }
      dispSection.appendChild(grid);
      detailsContainer.appendChild(dispSection);
    }

    // 3. Boundaries & Red Lines
    const boundaries = prof.boundaries || [];
    const redLines = prof.red_lines || [];
    if (boundaries.length > 0 || redLines.length > 0) {
      const boundSection = document.createElement("div");
      boundSection.className = "vn-section";
      boundSection.innerHTML = `
        <h4>Limits & Boundaries</h4>
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px; font-size: 12px; color: #cbd5e1;">
          ${boundaries.length > 0 ? `<div><strong>Boundaries:</strong> ${boundaries.join(", ")}</div>` : ""}
          ${redLines.length > 0 ? `<div style="margin-top: 4px; color: #fca5a5;"><strong>Red Lines:</strong> ${redLines.join(", ")}</div>` : ""}
        </div>
      `;
      detailsContainer.appendChild(boundSection);
    }

    // 4. Relations toward Other NPCs & Player
    const rels = actor.relations || {};
    const targetIds = Object.keys(rels);
    const relsSection = document.createElement("div");
    relsSection.className = "vn-section";
    relsSection.innerHTML = `<h4>Relationship Matrix (${targetIds.length})</h4>`;

    if (targetIds.length === 0) {
      relsSection.innerHTML += `<div class="vn-muted">No relational links recorded.</div>`;
    } else {
      const relsList = document.createElement("div");
      relsList.style.cssText = "display: flex; flex-direction: column; gap: 10px;";

      for (const targetId of targetIds) {
        const r = rels[targetId] as Record<string, any>;
        const targetName = targetId === "user" ? "Player (You)" : ledger.actors?.[targetId]?.name || targetId;
        const bThreshold = r.betrayal_threshold !== undefined && r.betrayal_threshold !== null ? r.betrayal_threshold : "N/A";

        const card = document.createElement("div");
        card.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; font-size: 12px;";
        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="color: #818cf8; font-size: 13px;">Towards ${targetName}</strong>
            <span style="font-size: 11px; background: rgba(239,68,68,0.2); border: 1px solid #ef4444; color: #fca5a5; padding: 2px 6px; border-radius: 4px;">
              Betrayal Thresh: ${bThreshold}
            </span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 6px; color: #cbd5e1; margin-bottom: 6px;">
            <div>Affinity: <strong>${r.affinity ?? 0}</strong></div>
            <div>Trust: <strong>${r.trust ?? 0}</strong></div>
            <div>Respect: <strong>${r.respect ?? 0}</strong></div>
            <div>Attraction: <strong>${r.attraction ?? 0}</strong></div>
            <div>Loyalty: <strong>${r.loyalty ?? 0}</strong></div>
            <div>Sacrifice: <strong>${r.sacrifice_willingness ?? 0}</strong></div>
          </div>
          ${(r.leverage && r.leverage.length > 0) ? `<div style="font-size: 11px; color: #f59e0b;">Leverage: ${r.leverage.join(", ")}</div>` : ""}
          ${(r.obligations && r.obligations.length > 0) ? `<div style="font-size: 11px; color: #38bdf8;">Obligations: ${r.obligations.join(", ")}</div>` : ""}
        `;
        relsList.appendChild(card);
      }
      relsSection.appendChild(relsList);
    }
    detailsContainer.appendChild(relsSection);

    this.root.appendChild(detailsContainer);
  }
}

```

## File: `src/frontend/hud/tab-inventory.ts`

```typescript
import type { LedgerData, ActorInventory } from "../../shared/types.js";

export class InventoryTab {
  public root: HTMLElement;
  private onAction: (actionText: string) => void;

  constructor(onAction: (actionText: string) => void) {
    this.onAction = onAction;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-inventory";
  }

  public render(ledger: LedgerData, activeActorId?: string): void {
    this.root.innerHTML = "";

    const actorId = activeActorId || (ledger.actors?.["user"] ? "user" : Object.keys(ledger.actors || {})[0] || "user");
    const actor = ledger.actors?.[actorId];
    const inv: ActorInventory = actor?.inventory || {
      in_hand: { L: "Empty", R: "Empty" },
      carried: [],
      room: [],
      room_location: "",
    };

    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `<h3>🎒 Inventory & Containers — ${actor?.name || actorId}</h3>`;
    this.root.appendChild(header);

    // In Hands
    const handsSection = document.createElement("div");
    handsSection.className = "vn-section";
    handsSection.innerHTML = `<h4>In Hands</h4>`;
    const handsGrid = document.createElement("div");
    handsGrid.className = "vn-hands-grid";

    for (const hand of ["L", "R"] as const) {
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

    // Carried Items
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

    // Room Container
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

```

## File: `src/frontend/hud/tab-journal.ts`

```typescript
import type { LedgerData } from "../../shared/types.js";

export class JournalTab {
  public root: HTMLElement;

  constructor() {
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-journal";
  }

  public render(ledger: LedgerData): void {
    this.root.innerHTML = "";

    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `<h3>📜 Journal & Opportunity Leads</h3>`;
    this.root.appendChild(header);

    // Active Opportunities / Quests
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
        const payoff = opp.payoff ? ` • 🏆 ${opp.payoff}` : "";
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

    // Historical Journal Events
    const journalSection = document.createElement("div");
    journalSection.className = "vn-section";
    journalSection.innerHTML = `<h4>Chronicle of Events (${ledger.journal?.length || 0})</h4>`;

    const eventsList = document.createElement("div");
    eventsList.className = "vn-journal-events";

    if (!ledger.journal || ledger.journal.length === 0) {
      eventsList.innerHTML = `<div class="vn-muted">No events logged yet.</div>`;
    } else {
      // Show newest first
      const reversed = [...ledger.journal].reverse();
      for (const evt of reversed) {
        const row = document.createElement("div");
        row.className = "vn-journal-entry";

        const timeStr = evt.time ? `<span class="vn-evt-time">[${evt.time}]</span> ` : "";
        const placeStr = evt.place ? `@ ${evt.place} ` : "";
        const outcomeBadge = evt.outcome ? `<span class="vn-outcome-${evt.outcome}">${evt.outcome}</span>` : "";

        let mutationsHtml = "";
        if (evt.mutations && evt.mutations.length > 0) {
          mutationsHtml = `<ul class="vn-mutations-list">${evt.mutations
            .map((m) => `<li>${m}</li>`)
            .join("")}</ul>`;
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

```

## File: `src/frontend/hud/tab-map.ts`

```typescript
import type { LedgerData } from "../../shared/types.js";

export class MapTab {
  public root: HTMLElement;
  private onAction: (actionText: string) => void;
  private viewMode: "indoor" | "outdoor" = "indoor";

  constructor(onAction: (actionText: string) => void) {
    this.onAction = onAction;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-map";
  }

  public render(ledger: LedgerData): void {
    this.root.innerHTML = "";
    const currentPlace = (ledger.scene?.place || "default").toLowerCase();
    const isIndoor = currentPlace.includes(":") || currentPlace.includes("residence") || currentPlace.includes("dojo") || currentPlace.includes("room");
    this.viewMode = isIndoor ? "indoor" : "outdoor";

    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h3>🗺️ World Cartography & Living Roster</h3>
          <p class="vn-muted">Time: <strong>${ledger.clock?.t || "Unknown"}</strong> (${ledger.clock?.phase || "Day"}) | Location: <span style="color:#38bdf8;">${currentPlace}</span></p>
        </div>
        <div style="display: flex; gap: 6px;">
          <button id="vn-map-indoor-btn" class="vn-btn vn-btn-sm ${this.viewMode === "indoor" ? "vn-btn-primary" : "vn-btn-secondary"}">🏠 Building Floorplan</button>
          <button id="vn-map-outdoor-btn" class="vn-btn vn-btn-sm ${this.viewMode === "outdoor" ? "vn-btn-primary" : "vn-btn-secondary"}">🌐 City / Region</button>
        </div>
      </div>
    `;
    this.root.appendChild(header);

    header.querySelector("#vn-map-indoor-btn")?.addEventListener("click", () => {
      this.viewMode = "indoor";
      this.renderMapBody(ledger, currentPlace);
    });
    header.querySelector("#vn-map-outdoor-btn")?.addEventListener("click", () => {
      this.viewMode = "outdoor";
      this.renderMapBody(ledger, currentPlace);
    });

    const mapContainer = document.createElement("div");
    mapContainer.id = "vn-map-canvas-container";
    this.root.appendChild(mapContainer);

    this.renderMapBody(ledger, currentPlace);
  }

  private renderMapBody(ledger: LedgerData, currentPlace: string): void {
    const container = this.root.querySelector("#vn-map-canvas-container") as HTMLElement;
    if (!container) return;
    container.innerHTML = "";

    if (this.viewMode === "indoor") {
      this.renderIndoorFloorplan(container, ledger, currentPlace);
    } else {
      this.renderOutdoorLivingWorld(container, ledger, currentPlace);
    }
  }

  private renderIndoorFloorplan(container: HTMLElement, ledger: LedgerData, currentPlace: string): void {
    const floorplanCard = document.createElement("div");
    floorplanCard.style.cssText = "background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 16px; margin-bottom: 16px;";
    
    // Extract base building scope (e.g. "tendo_residence")
    const scopePrefix = currentPlace.includes(":") ? currentPlace.split(":")[0]! : "building";
    const currentRoom = currentPlace.includes(":") ? currentPlace.split(":")[1]! : currentPlace;

    // Filter places belonging to this indoor scope or standard household rooms
    const knownPlaces = Object.keys(ledger.places || {});
    const indoorRooms = knownPlaces.filter((p) => p.startsWith(`${scopePrefix}:`) || !p.includes(":"));
    const roomsToShow = indoorRooms.length > 0 ? indoorRooms : ["entrance", "living_room", "kitchen", "dojo", "bedroom", "courtyard"];

    floorplanCard.innerHTML = `
      <div style="font-weight: 700; color: #818cf8; margin-bottom: 12px; font-size: 14px;">🏠 Indoor Blueprint — ${scopePrefix.toUpperCase()}</div>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px;">
        ${roomsToShow.map((roomKey) => {
          const rawName = roomKey.includes(":") ? roomKey.split(":")[1]! : roomKey;
          const isHere = rawName === currentRoom || roomKey === currentPlace;
          const presentNpcs = (ledger.roster || []).filter((r) => (r.loc || "").toLowerCase().includes(rawName));
          const npcTags = presentNpcs.map((n) => `<span style="background: rgba(99,102,241,0.3); color: #c7d2fe; padding: 2px 6px; border-radius: 4px; font-size: 10px;">👤 ${n.name || n.id}</span>`).join(" ");

          return `
            <div style="background: ${isHere ? "rgba(56,189,248,0.15)" : "#1e293b"}; border: 2px solid ${isHere ? "#38bdf8" : "#334155"}; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <strong style="color: ${isHere ? "#38bdf8" : "#f8fafc"}; font-size: 13px; text-transform: capitalize;">${rawName.replace(/_/g, " ")}</strong>
                  ${isHere ? '<span style="font-size: 10px; background: #38bdf8; color: #000; padding: 1px 5px; border-radius: 4px; font-weight: 800;">YOU</span>' : ''}
                </div>
                <div style="min-height: 20px; margin-top: 6px; display: flex; flex-wrap: wrap; gap: 4px;">${npcTags || '<span style="font-size: 11px; color: #64748b;">(Empty)</span>'}</div>
              </div>
              ${!isHere ? `<button class="vn-btn vn-btn-sm vn-btn-primary vn-move-btn" data-dest="${roomKey}" style="margin-top: 10px; width: 100%;">Enter Room</button>` : ''}
            </div>
          `;
        }).join("")}
      </div>
    `;

    floorplanCard.querySelectorAll(".vn-move-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const dest = btn.getAttribute("data-dest");
        if (dest) this.onAction(`*Heads to the ${dest.replace(/.*:/, "").replace(/_/g, " ")}*`);
      });
    });

    container.appendChild(floorplanCard);
  }

  private renderOutdoorLivingWorld(container: HTMLElement, ledger: LedgerData, currentPlace: string): void {
    const worldCard = document.createElement("div");
    worldCard.style.cssText = "background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 16px;";

    // Routes and locations in external world
    const routes = ledger.places?.[currentPlace]?.routes || [];
    const travelers = ledger.travel || [];

    worldCard.innerHTML = `
      <div style="font-weight: 700; color: #38bdf8; margin-bottom: 8px; font-size: 14px;">🌐 Living World Map & District Connections</div>
      <p style="font-size: 12px; color: #94a3b8; margin-bottom: 14px;">Actors advance routines continuously. Travel consumes clock minutes.</p>

      ${travelers.length > 0 ? `
        <div style="background: rgba(245,158,11,0.1); border: 1px solid #f59e0b; border-radius: 8px; padding: 10px; margin-bottom: 14px; font-size: 12px; color: #fcd34d;">
          <strong>🚶 Active Travelers in Transit:</strong>
          <ul style="margin: 4px 0 0 16px; padding: 0;">
            ${travelers.map((t) => `<li><strong>${t.actor}</strong>: ${t.from || "Start"} ➔ ${t.to} (ETA: ${t.eta || "En route"})</li>`).join("")}
          </ul>
        </div>
      ` : ''}

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px;">
        ${routes.map((r: any) => {
          const dest = typeof r === "object" && r.to ? r.to : String(r);
          const mins = typeof r === "object" && r.minutes ? r.minutes : 10;
          return `
            <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <strong style="color: #f8fafc; font-size: 13px;">📍 ${dest}</strong>
                <div style="font-size: 11px; color: #94a3b8; margin: 4px 0;">⏱️ Transit: ${mins} mins</div>
              </div>
              <button class="vn-btn vn-btn-sm vn-btn-primary vn-travel-btn" data-dest="${dest}" style="margin-top: 8px;">Travel</button>
            </div>
          `;
        }).join("")}
      </div>
    `;

    worldCard.querySelectorAll(".vn-travel-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const dest = btn.getAttribute("data-dest");
        if (dest) this.onAction(`*Travels to ${dest}*`);
      });
    });

    container.appendChild(worldCard);
  }
}

```

## File: `src/frontend/hud/tab-phone.ts`

```typescript
import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import type { LedgerData } from "../../shared/types.js";

export class PhoneTab {
  public root: HTMLElement;
  private ctx: SpindleFrontendContext;
  private onAction: (actionText: string) => void;
  private currentLedger: LedgerData = {};
  private activeApp: "home" | "messages" | "calls" | "bank" | "arcade" = "home";
  private selectedGame: "menu" | "shooter" | "racer" | "snake" = "menu";
  private selectedChatActor: string | null = null;
  private stopCurrentGame: (() => void) | null = null;

  constructor(ctx: SpindleFrontendContext, onAction: (actionText: string) => void) {
    this.ctx = ctx;
    this.onAction = onAction;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-phone";
  }

  public render(ledger: LedgerData): void {
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

    // 1. Status Bar & Dynamic Island
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

    // 2. Active Screen Content
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

    // 3. Bottom Home Indicator Bar
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

  private renderHomeScreen(container: HTMLElement): void {
    // Stage 2 B-Plot notifications
    const ripples = (this.currentLedger.bplots || []).filter((b) => b.ripple === 2 && b.status === "active");

    let notifHtml = "";
    if (ripples.length > 0) {
      notifHtml = `
        <div style="background: rgba(244,63,94,0.2); border: 1px solid #f43f5e; border-radius: 12px; padding: 10px; margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 700; color: #f43f5e; margin-bottom: 2px;">🚨 EMERGENCY NOTIFICATION</div>
          ${ripples.map((r) => `<div style="font-size: 11px; color: #fff;"><strong>${r.who}:</strong> ${r.doing}</div>`).join("")}
        </div>
      `;
    }

    container.innerHTML = `
      ${notifHtml}
      <div style="flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; align-content: start; margin-top: 10px;">
        <div class="vn-phone-app-icon" data-app="messages" style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="width: 54px; height: 54px; background: #10b981; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px;">💬</div>
          <span style="font-size: 11px; color: #fff; margin-top: 4px;">Messages</span>
        </div>
        <div class="vn-phone-app-icon" data-app="calls" style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="width: 54px; height: 54px; background: #3b82f6; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px;">📞</div>
          <span style="font-size: 11px; color: #fff; margin-top: 4px;">Phone</span>
        </div>
        <div class="vn-phone-app-icon" data-app="bank" style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="width: 54px; height: 54px; background: #f59e0b; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px;">💳</div>
          <span style="font-size: 11px; color: #fff; margin-top: 4px;">Wallet</span>
        </div>
        <div class="vn-phone-app-icon" data-app="arcade" style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="width: 54px; height: 54px; background: linear-gradient(135deg, #ec4899, #8b5cf6); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 0 4px 12px rgba(236,72,153,0.4);">🎮</div>
          <span style="font-size: 11px; color: #fff; margin-top: 4px; font-weight: 700;">Arcade</span>
        </div>
      </div>
    `;

    container.querySelectorAll(".vn-phone-app-icon").forEach((el) => {
      el.addEventListener("click", () => {
        const app = el.getAttribute("data-app") as any;
        if (app) {
          this.activeApp = app;
          this.selectedGame = "menu";
          this.render(this.currentLedger);
        }
      });
    });
  }

  private renderMessagesApp(container: HTMLElement): void {
    const actors = this.currentLedger.actors || {};
    const actorIds = Object.keys(actors).filter((id) => id.toLowerCase() !== "user");

    if (!this.selectedChatActor && actorIds.length > 0) {
      this.selectedChatActor = actorIds[0]!;
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

    const select = container.querySelector("#vn-phone-contact-select") as HTMLSelectElement;
    select?.addEventListener("change", () => {
      this.selectedChatActor = select.value;
      this.renderMessagesApp(container);
    });

    const input = container.querySelector("#vn-phone-sms-input") as HTMLInputElement;
    const sendBtn = container.querySelector("#vn-phone-send-sms") as HTMLButtonElement;

    const sendSms = () => {
      const text = input.value.trim();
      if (!text) return;
      this.onAction(`*Texts ${npcName} on phone*: "${text}"`);
      input.value = "";
    };

    sendBtn?.addEventListener("click", sendSms);
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendSms();
    });
  }

  private renderCallsApp(container: HTMLElement): void {
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
              <button class="vn-phone-call-btn" data-target="${name}" style="background: #3b82f6; border: none; border-radius: 6px; padding: 4px 10px; color: #fff; font-size: 11px; cursor: pointer;">📞 Call</button>
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
        if (target) this.onAction(`*Calls ${target} on phone*`);
      });
    });
  }

  private renderBankApp(container: HTMLElement): void {
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

  // ── ARCADE GAMES SUITE ──
  private renderArcadeApp(container: HTMLElement): void {
    if (this.selectedGame === "menu") {
      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2d334d; padding-bottom: 8px; margin-bottom: 14px;">
          <button id="vn-arcade-home-btn" style="background: transparent; border: none; color: #38bdf8; font-size: 12px; cursor: pointer;">◀ Home</button>
          <strong style="color: #f472b6; font-size: 14px; letter-spacing: 0.5px;">🎮 Pocket Arcade</strong>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div class="vn-game-card" data-game="shooter" style="background: linear-gradient(135deg, #1e1b4b, #2e1065); border: 1px solid #a855f7; border-radius: 12px; padding: 14px; cursor: pointer; display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 32px;">🚀</div>
            <div style="flex: 1;">
              <div style="font-weight: 800; color: #f8fafc; font-size: 13px;">Star Striker</div>
              <div style="font-size: 11px; color: #c084fc; margin-top: 2px;">Vertical space shooter with lasers & alien waves!</div>
            </div>
            <span style="color: #a855f7; font-size: 18px;">▶</span>
          </div>

          <div class="vn-game-card" data-game="racer" style="background: linear-gradient(135deg, #451a03, #78350f); border: 1px solid #f97316; border-radius: 12px; padding: 14px; cursor: pointer; display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 32px;">🏎️</div>
            <div style="flex: 1;">
              <div style="font-weight: 800; color: #f8fafc; font-size: 13px;">Traffic Racer</div>
              <div style="font-size: 11px; color: #fdba74; margin-top: 2px;">3-lane high-speed highway dodge with nitro boost!</div>
            </div>
            <span style="color: #f97316; font-size: 18px;">▶</span>
          </div>

          <div class="vn-game-card" data-game="snake" style="background: linear-gradient(135deg, #064e3b, #047857); border: 1px solid #10b981; border-radius: 12px; padding: 14px; cursor: pointer; display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 32px;">🐍</div>
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
          const game = card.getAttribute("data-game") as any;
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

  // ── GAME 1: STAR STRIKER (SPACE SHOOTER) ──
  private initSpaceShooter(container: HTMLElement): void {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <button id="vn-game-back-btn" style="background: transparent; border: none; color: #38bdf8; font-size: 12px; cursor: pointer;">◀ Games</button>
        <span style="font-size: 12px; font-weight: 800; color: #a855f7;">🚀 Star Striker</span>
        <span id="vn-shooter-score" style="font-size: 12px; font-weight: 700; color: #ffd700;">Score: 0</span>
      </div>
      <canvas id="vn-shooter-canvas" width="280" height="320" style="background: #030712; border: 1px solid #374151; border-radius: 8px; display: block; margin: 0 auto;"></canvas>
      <div style="display: flex; justify-content: center; gap: 8px; margin-top: 10px;">
        <button id="vn-btn-left" style="background: #1f2937; border: 1px solid #4b5563; border-radius: 8px; color: #fff; width: 60px; height: 38px; font-size: 18px; cursor: pointer;">◀</button>
        <button id="vn-btn-fire" style="background: #dc2626; border: 1px solid #ef4444; border-radius: 8px; color: #fff; flex: 1; height: 38px; font-weight: 800; font-size: 13px; cursor: pointer;">💥 FIRE</button>
        <button id="vn-btn-right" style="background: #1f2937; border: 1px solid #4b5563; border-radius: 8px; color: #fff; width: 60px; height: 38px; font-size: 18px; cursor: pointer;">▶</button>
      </div>
      <p style="font-size: 10px; color: #6b7280; text-align: center; margin-top: 6px;">Use ◀ / ▶ and Space / Fire to play</p>
    `;

    container.querySelector("#vn-game-back-btn")?.addEventListener("click", () => {
      this.selectedGame = "menu";
      this.renderArcadeApp(container);
    });

    const canvas = container.querySelector("#vn-shooter-canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let score = 0;
    let lives = 3;
    let gameOver = false;
    let playerX = 140;
    const playerSpeed = 4;
    let moveLeft = false;
    let moveRight = false;

    const bullets: Array<{ x: number; y: number }> = [];
    const enemies: Array<{ x: number; y: number; vx: number; hp: number }> = [];
    const stars: Array<{ x: number; y: number; speed: number }> = [];

    for (let i = 0; i < 25; i++) {
      stars.push({ x: Math.random() * 280, y: Math.random() * 320, speed: Math.random() * 1.5 + 0.5 });
    }

    let enemySpawnCounter = 0;
    let animId: number;

    const fireBullet = () => {
      if (gameOver) {
        // Restart game
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

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        moveLeft = true;
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        moveRight = true;
      }
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        fireBullet();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        moveLeft = false;
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        moveRight = false;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const btnLeft = container.querySelector("#vn-btn-left") as HTMLButtonElement;
    const btnRight = container.querySelector("#vn-btn-right") as HTMLButtonElement;
    const btnFire = container.querySelector("#vn-btn-fire") as HTMLButtonElement;

    btnLeft?.addEventListener("pointerdown", () => { moveLeft = true; });
    btnLeft?.addEventListener("pointerup", () => { moveLeft = false; });
    btnLeft?.addEventListener("pointerleave", () => { moveLeft = false; });
    btnRight?.addEventListener("pointerdown", () => { moveRight = true; });
    btnRight?.addEventListener("pointerup", () => { moveRight = false; });
    btnRight?.addEventListener("pointerleave", () => { moveRight = false; });
    btnFire?.addEventListener("click", fireBullet);

    const loop = () => {
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, 280, 320);

      // Stars
      ctx.fillStyle = "#475569";
      for (const s of stars) {
        ctx.fillRect(s.x, s.y, 1.5, 1.5);
        s.y += s.speed;
        if (s.y > 320) s.y = 0;
      }

      if (!gameOver) {
        if (moveLeft && playerX > 16) playerX -= playerSpeed;
        if (moveRight && playerX < 264) playerX += playerSpeed;

        // Player ship
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.moveTo(playerX, 280);
        ctx.lineTo(playerX - 12, 305);
        ctx.lineTo(playerX + 12, 305);
        ctx.closePath();
        ctx.fill();

        // Engine glow
        ctx.fillStyle = "#f97316";
        ctx.fillRect(playerX - 3, 305, 6, 4);

        // Bullets
        ctx.fillStyle = "#f43f5e";
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i]!;
          b.y -= 7;
          ctx.fillRect(b.x - 2, b.y, 4, 8);
          if (b.y < -10) bullets.splice(i, 1);
        }

        // Spawn Enemies
        enemySpawnCounter++;
        if (enemySpawnCounter > 35) {
          enemySpawnCounter = 0;
          enemies.push({ x: Math.random() * 240 + 20, y: -20, vx: (Math.random() - 0.5) * 1.5, hp: 1 });
        }

        // Enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
          const e = enemies[i]!;
          e.y += 2.2;
          e.x += e.vx;
          if (e.x < 15 || e.x > 265) e.vx *= -1;

          ctx.fillStyle = "#a855f7";
          ctx.fillRect(e.x - 10, e.y - 10, 20, 16);
          ctx.fillStyle = "#fde047";
          ctx.fillRect(e.x - 6, e.y - 4, 3, 3);
          ctx.fillRect(e.x + 3, e.y - 4, 3, 3);

          // Bullet Collision
          for (let bi = bullets.length - 1; bi >= 0; bi--) {
            const b = bullets[bi]!;
            if (Math.abs(b.x - e.x) < 14 && Math.abs(b.y - e.y) < 14) {
              bullets.splice(bi, 1);
              enemies.splice(i, 1);
              score += 100;
              const scoreEl = container.querySelector("#vn-shooter-score");
              if (scoreEl) scoreEl.textContent = `Score: ${score}`;
              break;
            }
          }

          // Player Collision
          if (Math.abs(playerX - e.x) < 16 && Math.abs(290 - e.y) < 16) {
            enemies.splice(i, 1);
            lives--;
            if (lives <= 0) gameOver = true;
          }

          if (e.y > 330) enemies.splice(i, 1);
        }

        // HUD Lives
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

  // ── GAME 2: TRAFFIC RACER (HIGHWAY DODGE) ──
  private initTrafficRacer(container: HTMLElement): void {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <button id="vn-game-back-btn" style="background: transparent; border: none; color: #38bdf8; font-size: 12px; cursor: pointer;">◀ Games</button>
        <span style="font-size: 12px; font-weight: 800; color: #f97316;">🏎️ Traffic Racer</span>
        <span id="vn-racer-score" style="font-size: 12px; font-weight: 700; color: #ffd700;">0m</span>
      </div>
      <canvas id="vn-racer-canvas" width="280" height="320" style="background: #1e293b; border: 1px solid #374151; border-radius: 8px; display: block; margin: 0 auto;"></canvas>
      <div style="display: flex; justify-content: center; gap: 8px; margin-top: 10px;">
        <button id="vn-racer-left" style="background: #1f2937; border: 1px solid #4b5563; border-radius: 8px; color: #fff; flex: 1; height: 38px; font-weight: 700; font-size: 14px; cursor: pointer;">◀ Left Lane</button>
        <button id="vn-racer-nitro" style="background: #ea580c; border: 1px solid #f97316; border-radius: 8px; color: #fff; width: 80px; height: 38px; font-weight: 800; font-size: 12px; cursor: pointer;">🔥 NITRO</button>
        <button id="vn-racer-right" style="background: #1f2937; border: 1px solid #4b5563; border-radius: 8px; color: #fff; flex: 1; height: 38px; font-weight: 700; font-size: 14px; cursor: pointer;">Right Lane ▶</button>
      </div>
      <p style="font-size: 10px; color: #6b7280; text-align: center; margin-top: 6px;">Use ◀ / ▶ or buttons to steer</p>
    `;

    container.querySelector("#vn-game-back-btn")?.addEventListener("click", () => {
      this.selectedGame = "menu";
      this.renderArcadeApp(container);
    });

    const canvas = container.querySelector("#vn-racer-canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const lanes = [65, 140, 215];
    let currentLane = 1;
    let targetX = lanes[1]!;
    let playerX = targetX;
    let distance = 0;
    let speed = 4;
    let nitro = false;
    let gameOver = false;

    const traffic: Array<{ x: number; y: number; speed: number; color: string }> = [];
    const coins: Array<{ x: number; y: number }> = [];
    let roadDashY = 0;
    let animId: number;

    const steerLeft = () => {
      if (gameOver) {
        restart();
        return;
      }
      if (currentLane > 0) currentLane--;
      targetX = lanes[currentLane]!;
    };
    const steerRight = () => {
      if (gameOver) {
        restart();
        return;
      }
      if (currentLane < 2) currentLane++;
      targetX = lanes[currentLane]!;
    };
    const restart = () => {
      gameOver = false;
      distance = 0;
      currentLane = 1;
      targetX = lanes[1]!;
      playerX = targetX;
      traffic.length = 0;
      coins.length = 0;
      speed = 4;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        steerLeft();
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        steerRight();
      }
      if (e.key === "ArrowUp" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        nitro = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        nitro = false;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    container.querySelector("#vn-racer-left")?.addEventListener("click", steerLeft);
    container.querySelector("#vn-racer-right")?.addEventListener("click", steerRight);
    const nitroBtn = container.querySelector("#vn-racer-nitro") as HTMLButtonElement;
    nitroBtn?.addEventListener("pointerdown", () => { nitro = true; });
    nitroBtn?.addEventListener("pointerup", () => { nitro = false; });
    nitroBtn?.addEventListener("pointerleave", () => { nitro = false; });

    let spawnTimer = 0;

    const loop = () => {
      ctx.fillStyle = "#334155";
      ctx.fillRect(0, 0, 280, 320);

      // Grass borders
      ctx.fillStyle = "#15803d";
      ctx.fillRect(0, 0, 20, 320);
      ctx.fillRect(260, 0, 20, 320);

      // Road dash lines
      roadDashY = (roadDashY + (nitro ? 9 : speed)) % 40;
      ctx.fillStyle = "#f8fafc";
      for (let y = -40 + roadDashY; y < 340; y += 40) {
        ctx.fillRect(102, y, 4, 20);
        ctx.fillRect(177, y, 4, 20);
      }

      if (!gameOver) {
        const curSpeed = nitro ? 8 : speed;
        distance += Math.floor(curSpeed);
        speed = 4 + Math.min(6, distance / 1500);

        const scoreEl = container.querySelector("#vn-racer-score");
        if (scoreEl) scoreEl.textContent = `${distance}m`;

        // Smooth player move
        playerX += (targetX - playerX) * 0.3;

        // Draw Player Car
        ctx.fillStyle = "#dc2626";
        ctx.fillRect(playerX - 12, 250, 24, 44);
        ctx.fillStyle = "#38bdf8"; // Windshield
        ctx.fillRect(playerX - 9, 260, 18, 10);
        ctx.fillStyle = "#0f172a"; // Wheels
        ctx.fillRect(playerX - 14, 255, 3, 10);
        ctx.fillRect(playerX + 11, 255, 3, 10);
        ctx.fillRect(playerX - 14, 280, 3, 10);
        ctx.fillRect(playerX + 11, 280, 3, 10);

        if (nitro) {
          ctx.fillStyle = "#f97316";
          ctx.fillRect(playerX - 6, 294, 12, 10);
        }

        // Spawn traffic
        spawnTimer++;
        if (spawnTimer > (nitro ? 30 : 45)) {
          spawnTimer = 0;
          const laneIdx = Math.floor(Math.random() * 3);
          const colors = ["#2563eb", "#059669", "#7c3aed", "#d97706"];
          traffic.push({
            x: lanes[laneIdx]!,
            y: -50,
            speed: Math.random() * 1.5 + 2,
            color: colors[Math.floor(Math.random() * colors.length)]!,
          });

          if (Math.random() > 0.5) {
            coins.push({ x: lanes[(laneIdx + 1) % 3]!, y: -30 });
          }
        }

        // Draw Traffic
        for (let i = traffic.length - 1; i >= 0; i--) {
          const t = traffic[i]!;
          t.y += curSpeed - t.speed;

          ctx.fillStyle = t.color;
          ctx.fillRect(t.x - 12, t.y, 24, 42);
          ctx.fillStyle = "#94a3b8";
          ctx.fillRect(t.x - 9, t.y + 12, 18, 8);

          // Collision Check
          if (Math.abs(playerX - t.x) < 20 && Math.abs(270 - (t.y + 21)) < 36) {
            gameOver = true;
          }

          if (t.y > 340) traffic.splice(i, 1);
        }

        // Draw Coins
        for (let i = coins.length - 1; i >= 0; i--) {
          const c = coins[i]!;
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

  // ── GAME 3: RETRO SNAKE ──
  private initRetroSnake(container: HTMLElement): void {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <button id="vn-game-back-btn" style="background: transparent; border: none; color: #38bdf8; font-size: 12px; cursor: pointer;">◀ Games</button>
        <span style="font-size: 12px; font-weight: 800; color: #10b981;">🐍 Retro Snake</span>
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

    const canvas = container.querySelector("#vn-snake-canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gridSize = 14;
    const tileCount = 20; // 280 / 14 = 20
    let snake = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
    let dx = 0;
    let dy = -1;
    let apple = { x: 5, y: 5 };
    let score = 0;
    let gameOver = false;
    let timerId: number;

    const spawnApple = () => {
      apple = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount),
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
      if (scoreEl) scoreEl.textContent = `Score: ${score}`;
    };

    const setDir = (newDx: number, newDy: number) => {
      if (gameOver) {
        restart();
        return;
      }
      if (newDx !== -dx && newDy !== -dy) {
        dx = newDx;
        dy = newDy;
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setDir(0, -1);
      }
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setDir(0, 1);
      }
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setDir(-1, 0);
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
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
        const head = { x: snake[0]!.x + dx, y: snake[0]!.y + dy };

        // Wall hit
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
          gameOver = true;
        }

        // Self hit
        for (const seg of snake) {
          if (seg.x === head.x && seg.y === head.y) {
            gameOver = true;
          }
        }

        if (!gameOver) {
          snake.unshift(head);

          // Eat apple
          if (head.x === apple.x && head.y === apple.y) {
            score += 10;
            const scoreEl = container.querySelector("#vn-snake-score");
            if (scoreEl) scoreEl.textContent = `Score: ${score}`;
            spawnApple();
          } else {
            snake.pop();
          }
        }
      }

      // Draw
      ctx.fillStyle = "#064e3b";
      ctx.fillRect(0, 0, 280, 280);

      // Apple
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(apple.x * gridSize + 1, apple.y * gridSize + 1, gridSize - 2, gridSize - 2);

      // Snake
      ctx.fillStyle = "#34d399";
      for (let i = 0; i < snake.length; i++) {
        const s = snake[i]!;
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

```

## File: `src/frontend/hud/tab-scene.ts`

```typescript
import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import type { LedgerData, AssetManifest } from "../../shared/types.js";
import { resolveOutfitName } from "../../backend/asset-resolver.js";
import { getSpriteTransform, type SpriteTransform } from "../stage/sprite-transform.js";
import { removeImageBackground } from "../utils/bg-remover.js";

export class SceneTab {
  public root: HTMLElement;
  private ctx: SpindleFrontendContext;
  private currentManifest?: AssetManifest;
  private onTransformChange?: (actorId: string, transform: SpriteTransform) => void;

  constructor(ctx: SpindleFrontendContext, onTransformChange?: (actorId: string, transform: SpriteTransform) => void) {
    this.ctx = ctx;
    this.onTransformChange = onTransformChange;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-scene";
  }

  private getContextIds(): { chatId?: string; userId?: string } {
    const ctxAny = this.ctx as any;
    const activeChat = ctxAny.getActiveChat?.();
    return {
      chatId: activeChat?.id || activeChat?.chatId,
      userId: ctxAny.user?.id || ctxAny.currentUser?.id || activeChat?.user_id || activeChat?.userId,
    };
  }

  public setManifest(manifest: AssetManifest): void {
    this.currentManifest = manifest;
  }

  public render(ledger: LedgerData, manifest?: AssetManifest): void {
    if (manifest) this.currentManifest = manifest;
    this.root.innerHTML = "";
    const placeId = (ledger.scene?.place || "default").toLowerCase().trim();
    const participants = (ledger.scene?.participants || []).filter((p) => p && p.toLowerCase() !== "user");

    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `<h3>🎬 Scene Visuals, Custom Poses & Gallery</h3>`;
    this.root.appendChild(header);

    // ── 1. Scoped Background Upload Section ──
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
    bgUploadBtn.textContent = `📁 Upload Background Media`;
    bgUploadBtn.addEventListener("click", async () => {
      const scope = (bgSec.querySelector("#vn-bg-scope") as HTMLInputElement).value.trim();
      const place = (bgSec.querySelector("#vn-bg-place") as HTMLInputElement).value.trim() || placeId;

      try {
        const files = await this.ctx.uploads.pickFile({
          accept: ["image/*", "video/mp4", "video/webm"],
          multiple: false,
        });
        if (!files || files.length === 0) return;
        const file = files[0]!;

        const { chatId, userId } = this.getContextIds();
        const dataUrl = await this.fileToDataUrl(file);

        this.ctx.sendToBackend({
          type: "vn_upload_asset",
          category: "places",
          scope,
          placeId: place,
          filename: file.name,
          dataUrl,
          chatId,
          userId,
        });
      } catch (err) {
        console.error("[LumiVN] Background upload failed:", err);
      }
    });

    bgSec.appendChild(bgUploadBtn);
    this.root.appendChild(bgSec);

    // ── 2. Character Sprites & Custom Expressions ──
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
        uploadSpriteBtn.textContent = `📁 Upload Expression Sprite`;
        uploadSpriteBtn.addEventListener("click", async () => {
          const outfit = (card.querySelector(".vn-input-outfit") as HTMLInputElement).value.trim().toLowerCase();
          const expression = (card.querySelector(".vn-input-expr") as HTMLInputElement).value.trim().toLowerCase() || "neutral";

          try {
            const files = await this.ctx.uploads.pickFile({
              accept: ["image/png", "image/webp", "image/jpeg"],
              multiple: false,
            });
            if (!files || files.length === 0) return;
            const file = files[0]!;

            const { chatId, userId } = this.getContextIds();
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
              userId,
            });
          } catch (e) {
            console.error("[LumiVN] Sprite upload failed:", e);
          }
        });

        const uploadNoBgBtn = document.createElement("button");
        uploadNoBgBtn.className = "vn-btn vn-btn-sm vn-btn-secondary";
        uploadNoBgBtn.innerHTML = `✨ Upload Sprite (Remove BG)`;
        uploadNoBgBtn.title = "Automatically isolates character by removing solid background";
        uploadNoBgBtn.addEventListener("click", async () => {
          const outfit = (card.querySelector(".vn-input-outfit") as HTMLInputElement).value.trim().toLowerCase();
          const expression = (card.querySelector(".vn-input-expr") as HTMLInputElement).value.trim().toLowerCase() || "neutral";

          try {
            const files = await this.ctx.uploads.pickFile({
              accept: ["image/png", "image/webp", "image/jpeg"],
              multiple: false,
            });
            if (!files || files.length === 0) return;
            const file = files[0]!;

            const originalText = uploadNoBgBtn.innerHTML;
            uploadNoBgBtn.disabled = true;
            uploadNoBgBtn.textContent = "Removing background... 0%";

            try {
              const dataUrl = await removeImageBackground(
                file.bytes,
                file.mimeType || "image/png",
                (pct) => {
                  uploadNoBgBtn.textContent = `Removing background... ${pct}%`;
                }
              );

              const { chatId, userId } = this.getContextIds();
              const baseName = file.name.replace(/\.[^.]+$/, "");

              this.ctx.sendToBackend({
                type: "vn_upload_asset",
                category: "characters",
                actorId,
                outfit,
                expression,
                filename: `${baseName}_nobg.png`,
                dataUrl,
                chatId,
                userId,
              });
            } catch (err) {
              console.error("[LumiVN] Background removal failed:", err);
              alert(`Background removal failed: ${err instanceof Error ? err.message : String(err)}`);
            } finally {
              uploadNoBgBtn.disabled = false;
              uploadNoBgBtn.innerHTML = originalText;
            }
          } catch (e) {
            console.error("[LumiVN] File pick failed:", e);
          }
        });

        btnRow.appendChild(uploadSpriteBtn);
        btnRow.appendChild(uploadNoBgBtn);
        card.appendChild(btnRow);

        // ── Sprite Size & Positioning Alignment ──
        const transform = getSpriteTransform(actorId);
        const transformBox = document.createElement("div");
        transformBox.style.cssText = "background:#0f172a; border:1px solid #334155; border-radius:8px; padding:10px; margin-top:10px;";
        transformBox.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-size:12px; font-weight:700; color:#38bdf8;">📐 Size & Position Alignment</span>
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

        const scaleInput = transformBox.querySelector(".vn-slider-scale") as HTMLInputElement;
        const xInput = transformBox.querySelector(".vn-slider-x") as HTMLInputElement;
        const yInput = transformBox.querySelector(".vn-slider-y") as HTMLInputElement;
        const scaleVal = transformBox.querySelector(".vn-val-scale") as HTMLElement;
        const xVal = transformBox.querySelector(".vn-val-x") as HTMLElement;
        const yVal = transformBox.querySelector(".vn-val-y") as HTMLElement;
        const resetBtn = transformBox.querySelector(".vn-btn-reset") as HTMLButtonElement;

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

    // ── 3. Custom Actions & Event Poses ──
    const actionSec = document.createElement("div");
    actionSec.className = "vn-section";
    actionSec.innerHTML = `
      <h4>Custom Actions & Event Poses</h4>
      <p style="font-size:12px; color:#94a3b8; margin-bottom:10px;">
        Upload sprites for specific actions (e.g. cooking, sleeping, training). Displayed when the narrative mentions the action.
      </p>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom:10px;">
        <div>
          <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:2px;">Actor ID:</label>
          <input id="vn-action-actor" type="text" placeholder="e.g. tessa" value="${participants[0] || ""}" style="width:100%; box-sizing:border-box; background:#0f172a; border:1px solid #475569; border-radius:4px; padding:6px; color:#fff; font-size:12px;" />
        </div>
        <div>
          <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:2px;">Action Keyword:</label>
          <input id="vn-action-name" type="text" placeholder="e.g. cooking, sleeping" style="width:100%; box-sizing:border-box; background:#0f172a; border:1px solid #475569; border-radius:4px; padding:6px; color:#fff; font-size:12px;" />
        </div>
      </div>
    `;

    const actionBtnRow = document.createElement("div");
    actionBtnRow.style.cssText = "display: flex; gap: 8px; flex-wrap: wrap;";

    const uploadActionBtn = document.createElement("button");
    uploadActionBtn.className = "vn-btn vn-btn-secondary";
    uploadActionBtn.textContent = `📁 Upload Action Pose Sprite`;
    uploadActionBtn.addEventListener("click", async () => {
      const actorId = (actionSec.querySelector("#vn-action-actor") as HTMLInputElement).value.trim().toLowerCase();
      const actionName = (actionSec.querySelector("#vn-action-name") as HTMLInputElement).value.trim().toLowerCase();

      if (!actorId || !actionName) {
        alert("Please specify both an Actor ID and Action Keyword.");
        return;
      }

      try {
        const files = await this.ctx.uploads.pickFile({
          accept: ["image/png", "image/webp", "image/jpeg"],
          multiple: false,
        });
        if (!files || files.length === 0) return;
        const file = files[0]!;

        const { chatId, userId } = this.getContextIds();
        const dataUrl = await this.fileToDataUrl(file);

        this.ctx.sendToBackend({
          type: "vn_upload_asset",
          category: "actions",
          actorId,
          actionName,
          filename: file.name,
          dataUrl,
          chatId,
          userId,
        });
      } catch (err) {
        console.error("[LumiVN] Action upload failed:", err);
      }
    });

    const uploadActionNoBgBtn = document.createElement("button");
    uploadActionNoBgBtn.className = "vn-btn vn-btn-secondary";
    uploadActionNoBgBtn.innerHTML = `✨ Upload Action (Remove BG)`;
    uploadActionNoBgBtn.title = "Automatically isolates character by removing solid background";
    uploadActionNoBgBtn.addEventListener("click", async () => {
      const actorId = (actionSec.querySelector("#vn-action-actor") as HTMLInputElement).value.trim().toLowerCase();
      const actionName = (actionSec.querySelector("#vn-action-name") as HTMLInputElement).value.trim().toLowerCase();

      if (!actorId || !actionName) {
        alert("Please specify both an Actor ID and Action Keyword.");
        return;
      }

      try {
        const files = await this.ctx.uploads.pickFile({
          accept: ["image/png", "image/webp", "image/jpeg"],
          multiple: false,
        });
        if (!files || files.length === 0) return;
        const file = files[0]!;

        const originalText = uploadActionNoBgBtn.innerHTML;
        uploadActionNoBgBtn.disabled = true;
        uploadActionNoBgBtn.textContent = "Removing background... 0%";

        try {
          const dataUrl = await removeImageBackground(
            file.bytes,
            file.mimeType || "image/png",
            (pct) => {
              uploadActionNoBgBtn.textContent = `Removing background... ${pct}%`;
            }
          );

          const { chatId, userId } = this.getContextIds();
          const baseName = file.name.replace(/\.[^.]+$/, "");

          this.ctx.sendToBackend({
            type: "vn_upload_asset",
            category: "actions",
            actorId,
            actionName,
            filename: `${baseName}_nobg.png`,
            dataUrl,
            chatId,
            userId,
          });
        } catch (err) {
          console.error("[LumiVN] Action background removal failed:", err);
          alert(`Background removal failed: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
          uploadActionNoBgBtn.disabled = false;
          uploadActionNoBgBtn.innerHTML = originalText;
        }
      } catch (e) {
        console.error("[LumiVN] File pick failed:", e);
      }
    });

    actionBtnRow.appendChild(uploadActionBtn);
    actionBtnRow.appendChild(uploadActionNoBgBtn);
    actionSec.appendChild(actionBtnRow);
    this.root.appendChild(actionSec);

    // ── 4. Uploaded Assets Gallery with Delete ──
    const gallerySec = document.createElement("div");
    gallerySec.className = "vn-section";
    gallerySec.innerHTML = `<h4>📁 Uploaded Assets Manager</h4>`;

    const manifestData = this.currentManifest;
    const galleryList = document.createElement("div");
    galleryList.style.cssText = "display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto; padding-right: 4px;";

    let assetCount = 0;

    // List Places
    if (manifestData?.places) {
      for (const [key, url] of Object.entries(manifestData.places)) {
        assetCount++;
        galleryList.appendChild(this.createAssetCard("places", `📍 Place: ${key}`, url, () => {
          this.deleteAsset({ category: "places", key });
        }));
      }
    }

    // List Character Outfits/Expressions
    if (manifestData?.characters) {
      for (const [actorId, actorData] of Object.entries(manifestData.characters)) {
        const outfits = actorData.outfits || (actorData as any);
        for (const [outfit, exprs] of Object.entries(outfits)) {
          if (exprs && typeof exprs === "object") {
            for (const [expr, url] of Object.entries(exprs as Record<string, string>)) {
              assetCount++;
              galleryList.appendChild(this.createAssetCard("characters", `👤 ${actorId} (${outfit}/${expr})`, url, () => {
                this.deleteAsset({ category: "characters", actorId, outfit, expression: expr });
              }));
            }
          }
        }

        // List Actions
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

  private createAssetCard(category: string, title: string, url: string, onDelete: () => void): HTMLElement {
    const card = document.createElement("div");
    card.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#1e293b; border:1px solid #334155; border-radius:8px; padding:6px 10px;";
    card.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px; overflow:hidden;">
        <img src="${url}" style="width:36px; height:36px; object-fit:cover; border-radius:4px; background:#0f172a;" alt="" onerror="this.style.display='none'" />
        <span style="font-size:12px; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${title}</span>
      </div>
      <button class="vn-btn vn-btn-sm vn-btn-danger" style="padding:4px 8px; font-size:11px;">🗑️ Delete</button>
    `;

    card.querySelector("button")?.addEventListener("click", () => {
      if (confirm(`Remove this asset (${title})?`)) {
        onDelete();
      }
    });

    return card;
  }

  private deleteAsset(params: Record<string, unknown>): void {
    const { chatId } = this.getContextIds();
    this.ctx.sendToBackend({
      type: "vn_delete_asset",
      ...params,
      chatId,
    });
  }

  private async fileToDataUrl(file: { bytes: Uint8Array; mimeType?: string }): Promise<string> {
    let binary = "";
    for (let i = 0; i < file.bytes.byteLength; i++) {
      binary += String.fromCharCode(file.bytes[i]!);
    }
    return `data:${file.mimeType || "image/png"};base64,${btoa(binary)}`;
  }
}

```

## File: `src/frontend/hud/tab-stats.ts`

```typescript
import type { LedgerData } from "../../shared/types.js";

export class StatsTab {
  public root: HTMLElement;
  private selectedActorId: string = "user";
  private selectedTargetId: string = "user";

  constructor() {
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-stats";
  }

  public render(ledger: LedgerData): void {
    this.root.innerHTML = "";
    const actors = ledger.actors || {};
    const actorIds = Object.keys(actors);

    if (actorIds.length === 0) {
      this.root.innerHTML = `<div class="vn-muted" style="padding: 24px; text-align: center;">No actor dossiers recorded.</div>`;
      return;
    }

    if (!actors[this.selectedActorId]) {
      this.selectedActorId = actorIds[0]!;
    }

    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `<h3>📊 Status, Passions & Relationship Metrics</h3>`;
    this.root.appendChild(header);

    // Actor Selector Dropdown Ribbon
    const controls = document.createElement("div");
    controls.style.cssText = "display: flex; gap: 10px; margin-bottom: 16px; align-items: center; flex-wrap: wrap;";
    controls.innerHTML = `
      <label style="font-size: 12px; color: #94a3b8;">Actor:</label>
      <select id="vn-stats-actor-select" style="background: #1e293b; color: #f8fafc; border: 1px solid #475569; border-radius: 6px; padding: 6px 10px; font-size: 13px;">
        ${actorIds.map((id) => `<option value="${id}" ${id === this.selectedActorId ? "selected" : ""}>${id === "user" ? "Player (You)" : actors[id]?.name || id}</option>`).join("")}
      </select>
    `;
    this.root.appendChild(controls);

    const actorSelect = controls.querySelector("#vn-stats-actor-select") as HTMLSelectElement;
    actorSelect.addEventListener("change", () => {
      this.selectedActorId = actorSelect.value;
      this.render(ledger);
    });

    const actor = actors[this.selectedActorId]!;

    // 1. Passions / Emotions Badges
    const passionsSection = document.createElement("div");
    passionsSection.className = "vn-section";
    passionsSection.innerHTML = `<h4>Current Passions & Affect</h4>`;
    const badgesContainer = document.createElement("div");
    badgesContainer.className = "vn-badges-container";

    const passions = actor.passions || {};
    const passionEntries: Array<[string, number | undefined]> = [
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
      ["Guilt", passions.guilt],
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
      badgesContainer.innerHTML = `<span class="vn-muted">Equilibrium / Baseline state</span>`;
    }
    passionsSection.appendChild(badgesContainer);
    this.root.appendChild(passionsSection);

    // 2. Relations Section
    const rels = actor.relations || {};
    const availableTargets = Object.keys(rels);

    const relsSection = document.createElement("div");
    relsSection.className = "vn-section";

    if (availableTargets.length === 0) {
      relsSection.innerHTML = `<h4>Relationships</h4><div class="vn-muted">No relationship edges initialized for this actor.</div>`;
      this.root.appendChild(relsSection);
      return;
    }

    if (!rels[this.selectedTargetId]) {
      this.selectedTargetId = availableTargets[0]!;
    }

    relsSection.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h4 style="margin: 0;">Relations Toward:</h4>
        <select id="vn-stats-target-select" style="background: #1e293b; color: #f8fafc; border: 1px solid #475569; border-radius: 6px; padding: 4px 8px; font-size: 12px;">
          ${availableTargets.map((t) => `<option value="${t}" ${t === this.selectedTargetId ? "selected" : ""}>${t === "user" ? "Player (You)" : actors[t]?.name || t}</option>`).join("")}
        </select>
      </div>
    `;

    const targetSelect = relsSection.querySelector("#vn-stats-target-select") as HTMLSelectElement;
    targetSelect.addEventListener("change", () => {
      this.selectedTargetId = targetSelect.value;
      this.render(ledger);
    });

    const activeRel = (rels[this.selectedTargetId] as Record<string, any>) || {};
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
      { label: "Sacrifice Willingness", min: 0, max: 100, val: Number(activeRel.sacrifice_willingness ?? 0) },
    ];

    for (const m of relMeters) {
      const pct = m.min < 0 ? Math.max(0, Math.min(100, ((m.val + 100) / 200) * 100)) : Math.max(0, Math.min(100, (m.val / m.max) * 100));
      const row = document.createElement("div");
      row.className = "vn-meter-row";
      row.innerHTML = `
        <div class="vn-meter-header"><span>${m.label}</span><span>${m.val}</span></div>
        <div class="vn-meter-bar-bg"><div class="vn-meter-bar-fill" style="width: ${pct}%"></div></div>
      `;
      metersContainer.appendChild(row);
    }

    // Betrayal Threshold & Secret/Leverage Chips
    const bThresh = activeRel.betrayal_threshold ?? "N/A";
    const extraInfo = document.createElement("div");
    extraInfo.style.cssText = "margin-top: 14px; background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px; font-size: 12px; display: flex; flex-direction: column; gap: 6px;";
    extraInfo.innerHTML = `
      <div style="display:flex; justify-content:space-between;">
        <span style="color: #94a3b8;">Betrayal Threshold:</span>
        <strong style="color: #fca5a5;">${bThresh}</strong>
      </div>
      <div>
        <span style="color: #94a3b8;">Shared Secrets:</span>
        <span style="color: #f8fafc;">${(activeRel.shared_secrets && activeRel.shared_secrets.length) ? activeRel.shared_secrets.join(", ") : "None"}</span>
      </div>
      <div>
        <span style="color: #94a3b8;">Held Leverage:</span>
        <span style="color: #f59e0b;">${(activeRel.leverage && activeRel.leverage.length) ? activeRel.leverage.join(", ") : "None"}</span>
      </div>
      <div>
        <span style="color: #94a3b8;">Obligations:</span>
        <span style="color: #38bdf8;">${(activeRel.obligations && activeRel.obligations.length) ? activeRel.obligations.join(", ") : "None"}</span>
      </div>
    `;
    metersContainer.appendChild(extraInfo);

    relsSection.appendChild(metersContainer);
    this.root.appendChild(relsSection);
  }
}

```

## File: `src/frontend/hud/tab-wardrobe.ts`

```typescript
import type { LedgerData, ActorOutfit } from "../../shared/types.js";

export class WardrobeTab {
  public root: HTMLElement;
  private onAction: (actionText: string) => void;

  constructor(onAction: (actionText: string) => void) {
    this.onAction = onAction;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-wardrobe";
  }

  public render(ledger: LedgerData, activeActorId?: string): void {
    this.root.innerHTML = "";

    // Pick target actor: activeActorId, or 'user', or first actor
    const actorId = activeActorId || (ledger.actors?.["user"] ? "user" : Object.keys(ledger.actors || {})[0] || "user");
    const actor = ledger.actors?.[actorId];
    const outfit: ActorOutfit = actor?.outfit || {
      top: "None",
      bottom: "None",
      underwear_top: "None",
      underwear_bottom: "None",
      shoes: "None",
      accessories: [],
    };

    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `<h3>👗 Wardrobe & Dressing — ${actor?.name || actorId}</h3>`;
    this.root.appendChild(header);

    const slotsGrid = document.createElement("div");
    slotsGrid.className = "vn-wardrobe-grid";

    const slots: Array<{ label: string; key: keyof ActorOutfit; value: string | string[] }> = [
      { label: "Top", key: "top", value: outfit.top || "None" },
      { label: "Bottom", key: "bottom", value: outfit.bottom || "None" },
      { label: "Underwear (Top)", key: "underwear_top", value: outfit.underwear_top || "None" },
      { label: "Underwear (Bottom)", key: "underwear_bottom", value: outfit.underwear_bottom || "None" },
      { label: "Shoes", key: "shoes", value: outfit.shoes || "None" },
      { label: "Accessories", key: "accessories", value: outfit.accessories || [] },
    ];

    for (const slot of slots) {
      const card = document.createElement("div");
      card.className = "vn-slot-card";

      const valStr = Array.isArray(slot.value) ? (slot.value.length ? slot.value.join(", ") : "None") : slot.value;
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

    // Bulk actions
    const footer = document.createElement("div");
    footer.className = "vn-tab-footer";
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

    footer.appendChild(undressBtn);
    footer.appendChild(stripBtn);
    this.root.appendChild(footer);
  }
}

```

## File: `src/frontend/stage/audio-player.ts`

```typescript
export type SoundEffectType = "click" | "type" | "page" | "impact" | "chime";

export class VnAudioEngine {
  private audioCtx: AudioContext | null = null;
  private bgmAudio: HTMLAudioElement | null = null;
  private sfxVolume = 0.5;
  private bgmVolume = 0.4;
  private isMuted = false;

  constructor() {
    // AudioContext will be lazily initialized on first user gesture
  }

  private getContext(): AudioContext | null {
    if (!this.audioCtx && typeof window !== "undefined") {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.bgmAudio) {
      this.bgmAudio.muted = muted;
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public playSfx(typeOrUrl: SoundEffectType | string): void {
    if (this.isMuted) return;

    if (typeOrUrl.startsWith("http") || typeOrUrl.startsWith("/") || typeOrUrl.startsWith("data:")) {
      try {
        const audio = new Audio(typeOrUrl);
        audio.volume = this.sfxVolume;
        audio.play().catch(() => {});
      } catch {}
      return;
    }

    const ctx = this.getContext();
    if (!ctx) return;

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

  public playBgm(url: string): void {
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

  public stopBgm(): void {
    if (this.bgmAudio) {
      try {
        this.bgmAudio.pause();
        this.bgmAudio.currentTime = 0;
      } catch {}
      this.bgmAudio = null;
    }
  }

  public destroy(): void {
    this.stopBgm();
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
  }
}

```

## File: `src/frontend/stage/backlog.ts`

```typescript
export interface BacklogEntry {
  messageId: string;
  speaker: string;
  text: string;
  isUser: boolean;
}

export class BacklogModal {
  public root: HTMLElement;
  private entriesContainer: HTMLElement;
  private onEditRequest?: (messageId: string, currentText: string) => void;

  constructor(onEditRequest?: (messageId: string, currentText: string) => void) {
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
        <span style="font-size:18px;">📜</span>
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
      if (e.target === this.root) this.close();
    });
    header.querySelector(".vn-backlog-close-btn")?.addEventListener("click", () => this.close());
  }

  public open(entries: BacklogEntry[]): void {
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

  public close(): void {
    this.root.style.display = "none";
  }
}

```

## File: `src/frontend/stage/beat-splitter.ts`

```typescript
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

```

## File: `src/frontend/stage/choice-modal.ts`

```typescript
export interface ChoiceOption {
  label: string;
  action: string;
}

export class ChoiceModal {
  public root: HTMLElement;
  private choicesContainer: HTMLElement;
  private promptTitle: HTMLElement;
  private onSelect: (action: string) => void;

  constructor(onSelect: (action: string) => void) {
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

  public show(choices: ChoiceOption[], prompt = "Make your choice"): void {
    this.promptTitle.textContent = prompt;
    this.choicesContainer.innerHTML = "";

    const pills = ["A", "B", "C", "D", "E", "F"];

    choices.forEach((choice, idx) => {
      const pill = pills[idx % pills.length]!;
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

  public hide(): void {
    this.root.style.display = "none";
  }
}

```

## File: `src/frontend/stage/dialogue-box.ts`

```typescript
import { formatDialogueHtml } from "./rich-text.js";
import { splitParagraphIntoBeats, type DialogueBeat } from "./beat-splitter.js";
import { BacklogModal, type BacklogEntry } from "./backlog.js";
import { ChoiceModal, type ChoiceOption } from "./choice-modal.js";
import type { VnAudioEngine } from "./audio-player.js";
import type { VnTtsEngine } from "./tts-engine.js";

export interface DialogueBoxOptions {
  onAction: (actionText: string) => void;
  onEditMessage?: (messageId: string, content: string) => void;
  onParagraphChange?: (paraIndex: number, speaker: string) => void;
  onBeatChange?: (beat: DialogueBeat, index: number) => void;
  audioEngine?: VnAudioEngine;
  ttsEngine?: VnTtsEngine;
  knownActors?: string[];
}

export class DialogueBox {
  public root: HTMLElement;
  private nameplate: HTMLElement;
  private textContainer: HTMLElement;
  private controlsContainer: HTMLElement;
  private composerContainer: HTMLElement;
  private inputField: HTMLInputElement;
  private autoBtn: HTMLButtonElement;
  private skipBtn: HTMLButtonElement;
  private voiceBtn: HTMLButtonElement;
  private prevBtn: HTMLButtonElement;
  private nextBtn: HTMLButtonElement;
  private choicesContainer: HTMLElement;

  private beats: DialogueBeat[] = [];
  private currentBeatIndex = 0;
  private isTyping = false;
  private typeTimer: number | null = null;
  private autoPlay = false;
  private autoTimer: number | null = null;
  private isSkipping = false;
  private skipTimer: number | null = null;
  private backlogModal: BacklogModal;
  private choiceModal: ChoiceModal;
  private backlogHistory: BacklogEntry[] = [];
  private currentMessageId = "";
  private onAction: (actionText: string) => void;
  private onParagraphChange?: (paraIndex: number, speaker: string) => void;
  private onBeatChange?: (beat: DialogueBeat, index: number) => void;
  private audioEngine?: VnAudioEngine;
  private ttsEngine?: VnTtsEngine;
  private knownActors: string[] = [];

  constructor(options: DialogueBoxOptions) {
    this.onAction = options.onAction;
    this.onParagraphChange = options.onParagraphChange;
    this.onBeatChange = options.onBeatChange;
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

    // Ren'Py Control Bar: Backlog, Auto, Skip, Voice, Prev, Next
    this.controlsContainer = document.createElement("div");
    this.controlsContainer.className = "vn-reading-controls";

    const logBtn = document.createElement("button");
    logBtn.className = "vn-nav-btn vn-log-btn";
    logBtn.innerHTML = "📜 Log";
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
    this.voiceBtn.innerHTML = voiceOn ? "🔊 Voice" : "🔇 Voice";
    this.voiceBtn.title = "Toggle Speech Voice";
    this.voiceBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.audioEngine?.playSfx("click");
      const active = this.ttsEngine?.toggle() ?? false;
      this.voiceBtn.innerHTML = active ? "🔊 Voice" : "🔇 Voice";
      this.voiceBtn.style.color = active ? "var(--vn-accent, #ffd700)" : "#cbd5e1";
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

    // Composer Bar
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

    // Modals
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

  public setKnownActors(actors: string[]): void {
    this.knownActors = actors;
  }

  private bindEvents(): void {
    this.root.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (
        target.closest(".vn-dialogue-composer") ||
        target.closest(".vn-reading-controls") ||
        target.closest(".vn-choice-overlay") ||
        target.closest(".vn-backlog-overlay") ||
        target.classList.contains("vn-inline-choice") ||
        target.classList.contains("vn-choice-btn")
      ) {
        if (target.classList.contains("vn-inline-choice")) {
          const act = target.getAttribute("data-action");
          if (act) this.onAction(act);
        }
        return;
      }
      this.advance();
    });

    window.addEventListener("keydown", (e) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      // Check if any HUD modal/drawer is open
      const hudOverlay = document.querySelector<HTMLElement>(".vn-hud-overlay");
      if (hudOverlay && hudOverlay.style.display !== "none") {
        return;
      }

      // Check if phone simulator or arcade game is visible
      const phoneSim = document.querySelector<HTMLElement>(".vn-phone-simulator");
      if (phoneSim && phoneSim.offsetParent !== null) {
        return;
      }

      // Check event target
      const target = e.target as HTMLElement | null;
      if (
        target?.closest?.(".vn-hud-overlay") ||
        target?.closest?.(".vn-phone-simulator") ||
        target?.closest?.(".vn-hud-modal") ||
        target?.tagName === "CANVAS"
      ) {
        return;
      }

      if (e.code === "Space" || e.code === "Enter" || e.code === "ArrowRight") {
        e.preventDefault();
        this.advance();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        this.rewind();
      }
    });
  }

  public setContent(speakerName: string, paragraphs: string[], messageId = ""): void {
    if (this.typeTimer) clearTimeout(this.typeTimer);
    if (this.autoTimer) clearTimeout(this.autoTimer);
    if (this.skipTimer) clearTimeout(this.skipTimer);
    this.ttsEngine?.stop();

    this.currentMessageId = messageId;
    this.beats = splitParagraphIntoBeats(paragraphs, speakerName, this.knownActors);
    this.currentBeatIndex = 0;
    this.composerContainer.style.display = "none";
    this.choicesContainer.innerHTML = "";
    this.inputField.value = "";

    // Record into backlog history
    for (const b of this.beats) {
      this.backlogHistory.push({
        messageId,
        speaker: b.speaker,
        text: b.text,
        isUser: b.speaker.toLowerCase() === "user",
      });
    }

    this.renderCurrentBeat();
  }

  public advance(): void {
    if (this.isTyping) {
      if (this.typeTimer) clearTimeout(this.typeTimer);
      this.isTyping = false;
      const beat = this.beats[this.currentBeatIndex];
      if (beat) this.textContainer.innerHTML = formatDialogueHtml(beat.text).html;
      this.onBeatSettled();
      return;
    }

    if (this.currentBeatIndex < this.beats.length - 1) {
      this.currentBeatIndex++;
      this.renderCurrentBeat();
    }
  }

  public rewind(): void {
    if (this.currentBeatIndex > 0) {
      if (this.typeTimer) clearTimeout(this.typeTimer);
      if (this.autoTimer) clearTimeout(this.autoTimer);
      if (this.skipTimer) clearTimeout(this.skipTimer);
      this.ttsEngine?.stop();
      this.isTyping = false;
      this.currentBeatIndex--;
      this.renderCurrentBeat();
    }
  }

  private renderCurrentBeat(): void {
    const beat = this.beats[this.currentBeatIndex];
    if (!beat) return;

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

    // Fast-Forward Skip Mode
    if (this.isSkipping) {
      this.isTyping = false;
      this.textContainer.innerHTML = html;
      this.onBeatSettled();
      return;
    }

    // Normal Typewriter Mode
    this.isTyping = true;
    this.textContainer.innerHTML = "";

    const temp = document.createElement("div");
    temp.innerHTML = html;
    const plain = temp.textContent || beat.text;
    let charIdx = 0;

    // Trigger TTS speech
    if (this.ttsEngine?.isEnabled()) {
      this.ttsEngine.speak(beat.text, beat.speaker, () => {
        if (this.autoPlay && !this.isTyping) {
          this.advance();
        }
      });
    }

    const tick = () => {
      if (!this.isTyping) return;
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
        this.typeTimer = window.setTimeout(tick, 20);
      }
    };
    tick();
  }

  private onBeatSettled(): void {
    const isLast = this.currentBeatIndex >= this.beats.length - 1;
    this.nextBtn.style.display = isLast ? "none" : "inline-block";

    if (isLast) {
      this.composerContainer.style.display = "flex";
      this.inputField.focus();
      if (this.autoPlay) this.toggleAutoPlay();
      if (this.isSkipping) this.toggleSkip();
    } else if (this.isSkipping) {
      this.skipTimer = window.setTimeout(() => this.advance(), 100);
    } else if (this.autoPlay && !this.ttsEngine?.isEnabled()) {
      const beat = this.beats[this.currentBeatIndex];
      const charCount = beat?.text.length || 20;
      const puncts = (beat?.text.match(/[.,!?;:、。！？]/g) || []).length;
      const delay = Math.max(1600, Math.min(8000, (charCount / 240) * 60000 + puncts * 250));
      this.autoTimer = window.setTimeout(() => this.advance(), delay);
    }
  }

  private toggleAutoPlay(): void {
    this.autoPlay = !this.autoPlay;
    if (this.autoPlay && this.isSkipping) this.toggleSkip();
    this.autoBtn.innerHTML = this.autoPlay ? "⏸ Pause" : "▶ Auto";
    this.autoBtn.style.color = this.autoPlay ? "var(--vn-accent, #ffd700)" : "#cbd5e1";

    if (this.autoPlay && !this.isTyping) {
      this.onBeatSettled();
    } else if (!this.autoPlay && this.autoTimer) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }
  }

  private toggleSkip(): void {
    this.isSkipping = !this.isSkipping;
    if (this.isSkipping && this.autoPlay) this.toggleAutoPlay();
    this.skipBtn.innerHTML = this.isSkipping ? "⏹ Stop" : "⏩ Skip";
    this.skipBtn.style.color = this.isSkipping ? "var(--vn-accent, #ffd700)" : "#cbd5e1";

    if (this.isSkipping) {
      this.advance();
    } else if (this.skipTimer) {
      clearTimeout(this.skipTimer);
      this.skipTimer = null;
    }
  }

  public showChoices(choices: ChoiceOption[], prompt = "Make your choice"): void {
    if (this.isSkipping) this.toggleSkip();
    if (this.autoPlay) this.toggleAutoPlay();
    this.choiceModal.show(choices, prompt);
  }

  public destroy(): void {
    if (this.typeTimer) clearTimeout(this.typeTimer);
    if (this.autoTimer) clearTimeout(this.autoTimer);
    if (this.skipTimer) clearTimeout(this.skipTimer);
    this.ttsEngine?.stop();
    this.choiceModal.root.remove();
    this.backlogModal.root.remove();
  }
}

```

## File: `src/frontend/stage/overlay.ts`

```typescript
import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import type { VnPresentationState } from "../../shared/types.js";
import { TEXT_EFFECTS_CSS } from "./rich-text.js";
import { StageRenderer } from "./staging.js";
import { DialogueBox } from "./dialogue-box.js";
import { MenuBar } from "../hud/menu-bar.js";
import { applyVnTheme } from "./theme.js";
import { VnAudioEngine } from "./audio-player.js";
import { VnTtsEngine } from "./tts-engine.js";
import type { DialogueBeat } from "./beat-splitter.js";

export type ComponentOverrideHandle = { destroy(): void };

export interface OverlayOptions {
  ctx: SpindleFrontendContext;
  onExit: () => void;
}

export class StageOverlay {
  private ctx: SpindleFrontendContext;
  private onExit: () => void;

  public root: HTMLElement;
  public exitButton: HTMLElement;
  private stageRenderer: StageRenderer;
  private dialogueBox: DialogueBox;
  private menuBar: MenuBar;
  private audioEngine: VnAudioEngine;
  private ttsEngine: VnTtsEngine;
  private manifest: any = null;

  private currentChatId: string | null = null;
  private overrideHandles: ComponentOverrideHandle[] = [];
  private styleEl: HTMLStyleElement | null = null;
  private active = false;
  private lastProcessedEvtId: string | null = null;
  private toastContainer: HTMLElement;

  constructor(options: OverlayOptions) {
    this.ctx = options.ctx;
    this.onExit = options.onExit;

    this.audioEngine = new VnAudioEngine();
    this.ttsEngine = new VnTtsEngine();

    this.root = document.createElement("div");
    this.root.className = "vn-overlay-root";
    this.root.style.display = "none";

    // Top-level safety exit button (placed directly in safety layer)
    this.exitButton = document.createElement("button");
    this.exitButton.className = "vn-safety-exit-btn";
    this.exitButton.innerHTML = "← Back to Chat";
    this.exitButton.addEventListener("click", () => this.deactivate());

    // Main Stage Renderer
    this.stageRenderer = new StageRenderer();

    // Dialogue Box
    this.dialogueBox = new DialogueBox({
      onAction: (actionText) => this.dispatchAction(actionText),
      audioEngine: this.audioEngine,
      ttsEngine: this.ttsEngine,
      onEditMessage: (messageId, content) => {
        const activeChat = (this.ctx as any).getActiveChat?.();
        const targetChatId = this.currentChatId || activeChat?.id || activeChat?.chatId;
        if (targetChatId && messageId) {
          this.ctx.sendToBackend({
            type: "vn_edit_message",
            chatId: targetChatId,
            messageId,
            content,
          });
        }
      },
      onParagraphChange: (_paraIndex, speaker) => {
        this.stageRenderer.setActiveSpeaker(speaker);
      },
      onBeatChange: (beat, _index) => {
        this.handleBeatChange(beat);
      },
    });

    // Game HUD Menu Bar
    this.menuBar = new MenuBar({
      ctx: this.ctx,
      onAction: (actionText) => this.dispatchAction(actionText),
      onTransformChange: (actorId, transform) => {
        this.stageRenderer.setActorTransform(actorId, transform);
      },
    });

    // Toast Container
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

  public setTheme(themeId: string): void {
    applyVnTheme(this.root, themeId);
  }

  private resolveChatId(): string | undefined {
    if (this.currentChatId) return this.currentChatId;

    // 1. Host context check
    const ctxAny = this.ctx as any;
    const active = ctxAny.getActiveChat?.() || ctxAny.activeChat || ctxAny.chat;
    if (active?.id || active?.chatId) return active.id || active.chatId;

    // 2. URL path/hash inspection (/chat/:id or #/chat/:id)
    if (typeof window !== "undefined") {
      const urlMatch = window.location.href.match(/[\/#]chat[s]?\/([a-zA-Z0-9_-]+)/);
      if (urlMatch?.[1]) return urlMatch[1];

      // 3. DOM dataset inspection
      const chatEl = document.querySelector("[data-chat-id]");
      if (chatEl) return chatEl.getAttribute("data-chat-id") || undefined;
    }

    return undefined;
  }

  public activate(): void {
    if (this.active) return;
    this.active = true;

    // Register component overrides (priority 10 replace)
    const ctxAny = this.ctx as any;
    if (typeof ctxAny.ui?.registerComponentOverride === "function") {
      try {
        const dummyComponent = () => null;
        this.overrideHandles = (["BubbleMessage", "MinimalMessage", "InputArea"] as const).map(
          (host) =>
            ctxAny.ui.registerComponentOverride({
              host,
              mode: "replace",
              priority: 10,
              component: dummyComponent,
            })
        );
      } catch (e) {
        console.warn("[LumiVN] Failed to register component overrides:", e);
      }
    }

    this.root.style.display = "block";
    const targetChatId = this.resolveChatId();

    this.ctx.sendToBackend({
      type: "vn_get_state",
      chatId: targetChatId || "",
    });
  }

  public deactivate(): void {
    if (!this.active) return;
    this.active = false;

    // Destroy overrides immediately to restore native chat
    for (const h of this.overrideHandles) {
      try {
        h.destroy();
      } catch {
        // Ignore
      }
    }
    this.overrideHandles = [];
    this.root.style.display = "none";
    this.onExit();
  }

  public isActive(): boolean {
    return this.active;
  }

  public updatePresentation(state: VnPresentationState): void {
    this.currentChatId = state.chatId; // Store authoritative chat ID
    this.stageRenderer.setBackground(state.background);
    this.stageRenderer.setCharacters(state.characters);

    // Weather / particle ambience from ledger place
    const place = state.ledger?.scene?.place || "";
    this.stageRenderer.setWeather(place);

    // Extract known actors for robust dialogue speaker resolution
    const actorNames = state.characters.map((c) => c.name);
    if (state.ledger?.actors) {
      for (const [id, dossier] of Object.entries(state.ledger.actors)) {
        if (dossier?.name) actorNames.push(dossier.name);
        actorNames.push(id);
      }
    }
    this.dialogueBox.setKnownActors([...new Set(actorNames)]);

    this.dialogueBox.setContent(state.speakerName, state.paragraphs, state.messageId);
    this.menuBar.setLedger(state.ledger, state.hasBPlotNotification);

    const newEvts = state.ledger?.journal || [];
    if (newEvts.length > 0) {
      const latestEvt = newEvts[newEvts.length - 1]!;
      if (latestEvt.id !== this.lastProcessedEvtId) {
        this.lastProcessedEvtId = latestEvt.id;
        if (latestEvt.mutations && latestEvt.mutations.length > 0) {
          this.showMutationToasts(latestEvt.mutations);
        }
      }
    }
  }

  public setManifest(manifest: any): void {
    this.manifest = manifest;
    this.menuBar.setManifest(manifest);
  }

  private handleBeatChange(beat: DialogueBeat): void {
    if (!beat.expression && !beat.action) return;

    const speaker = (beat.speaker || "").toLowerCase().trim();
    if (!speaker || speaker === "narrator" || !this.manifest?.characters) return;

    // Search manifest characters for matching actor
    for (const [actorKey, charData] of Object.entries<any>(this.manifest.characters)) {
      const normKey = actorKey.toLowerCase();
      if (normKey === speaker || normKey.includes(speaker) || speaker.includes(normKey)) {
        let targetUrl: string | undefined;

        // 1. Try expression in outfits
        if (beat.expression && charData.outfits) {
          for (const outfitGroup of Object.values<any>(charData.outfits)) {
            if (outfitGroup && typeof outfitGroup === "object" && outfitGroup[beat.expression]) {
              targetUrl = outfitGroup[beat.expression];
              break;
            }
          }
        }

        // 2. Try action in actions
        if (!targetUrl && beat.action && charData.actions && charData.actions[beat.action]) {
          targetUrl = charData.actions[beat.action];
        }

        // 3. Fallback direct expression
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

  private showMutationToasts(mutations: string[]): void {
    for (const m of mutations.slice(0, 4)) {
      const toast = document.createElement("div");
      toast.className = "vn-stat-toast";
      toast.innerHTML = `<span style="font-size: 14px;">✨</span> <span>${m.split("|")[0]?.trim() || m}</span>`;
      this.toastContainer.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    }
  }

  private dispatchAction(actionText: string): void {
    const targetChatId = this.resolveChatId();

    this.ctx.sendToBackend({
      type: "vn_action",
      chatId: targetChatId || "",
      action: actionText,
    });
  }

  private injectStyles(): void {
    if (this.styleEl) return;
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
        transform: translate(var(--char-offset-x, 0px), var(--char-offset-y, 0px)) scale(calc(var(--char-scale, 1) * 0.97));
        z-index: 2;
        filter: drop-shadow(0 8px 16px rgba(0,0,0,0.7)) brightness(0.7) saturate(0.85);
        opacity: 0.78;
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

      /* Reading Controls & Pacing */
      .vn-reading-controls {
        position: absolute;
        bottom: 16px;
        right: 24px;
        display: flex;
        gap: 8px;
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

  public destroy(): void {
    this.deactivate();
    this.audioEngine.destroy();
    this.ttsEngine.stop();
    this.stageRenderer.destroy();
    this.dialogueBox.destroy();
    this.root.remove();
    this.styleEl?.remove();
  }
}

```

## File: `src/frontend/stage/particles.ts`

```typescript
export type ParticlePreset = "sakura" | "rain" | "snow" | "embers" | "dust" | "none";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  rotation?: number;
  vRot?: number;
  sway?: number;
  swaySpeed?: number;
}

export class ParticleEngine {
  public canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;
  private particles: Particle[] = [];
  private currentPreset: ParticlePreset = "none";
  private width = 0;
  private height = 0;
  private resizeObserver: ResizeObserver | null = null;

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

    // Initial size
    requestAnimationFrame(() => this.handleResize());
    window.addEventListener("resize", this.handleResize);
  }

  private handleResize(): void {
    const rect = this.canvas.parentElement?.getBoundingClientRect() || {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    this.width = rect.width || window.innerWidth;
    this.height = rect.height || window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  public setWeather(weatherOrPlace: string): void {
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

  public setPreset(preset: ParticlePreset): void {
    if (this.currentPreset === preset) return;
    this.currentPreset = preset;
    this.particles = [];

    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }

    if (preset === "none") {
      if (this.ctx) this.ctx.clearRect(0, 0, this.width, this.height);
      return;
    }

    this.initParticles();
    this.animId = requestAnimationFrame(this.loop);
  }

  private initParticles(): void {
    const count = this.currentPreset === "rain" ? 100
      : this.currentPreset === "sakura" ? 35
      : this.currentPreset === "snow" ? 60
      : this.currentPreset === "embers" ? 40
      : 30; // dust

    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(true));
    }
  }

  private createParticle(randomY = false): Particle {
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
          color: "rgba(180, 215, 255, ",
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
          swaySpeed: 0.02 + Math.random() * 0.03,
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
          swaySpeed: 0.03 + Math.random() * 0.03,
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
          swaySpeed: 0.04 + Math.random() * 0.04,
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
          swaySpeed: 0.01 + Math.random() * 0.02,
        };
    }
  }

  private loop(): void {
    if (this.currentPreset === "none" || !this.ctx) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]!;

      // Update position
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

      // Render
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
        // Petal shape
        this.ctx.ellipse(0, 0, p.size * 0.9, p.size * 0.45, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      } else {
        // Circle / Glow
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      }

      // Reset offscreen particles
      const isOffscreen = this.currentPreset === "embers"
        ? p.y < -20 || p.x < -20 || p.x > this.width + 20
        : p.y > this.height + 20 || p.x < -30 || p.x > this.width + 30;

      if (isOffscreen) {
        this.particles[i] = this.createParticle(false);
      }
    }

    this.animId = requestAnimationFrame(this.loop);
  }

  public destroy(): void {
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener("resize", this.handleResize);
    this.canvas.remove();
  }
}

```

## File: `src/frontend/stage/rich-text.ts`

```typescript
import { TEXT_EFFECT_IDS, escapeHtml, parseTwineChoices } from "../../shared/text-effects.js";

export function formatDialogueHtml(rawText: string): { html: string; hasInlineChoices: boolean } {
  // 1. Process Twine-style [[Label|Action]] or <choice action="...">
  const { cleanText, choices } = parseTwineChoices(rawText);

  // 2. Pair known text effect tags into <span data-vn-text-fx="tag">
  let formatted = escapeHtml(cleanText);

  // Unescape the button elements created by parseTwineChoices
  formatted = formatted.replace(
    /&lt;button class=&quot;vn-inline-choice&quot; data-action=&quot;([\s\S]*?)&quot;&gt;([\s\S]*?)&lt;\/button&gt;/g,
    '<button class="vn-inline-choice" data-action="$1">$2</button>'
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
`;

```

## File: `src/frontend/stage/sprite-transform.ts`

```typescript
export interface SpriteTransform {
  scale: number;   // 0.5 to 2.0 (default 1.0)
  offsetX: number; // -200 to +200 px (default 0)
  offsetY: number; // -200 to +200 px (default 0)
}

const STORAGE_PREFIX = "lumivn_transform_";

export function getSpriteTransform(actorId: string): SpriteTransform {
  if (typeof window === "undefined" || !actorId) {
    return { scale: 1.0, offsetX: 0, offsetY: 0 };
  }
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + actorId.toLowerCase().trim());
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        scale: typeof parsed.scale === "number" ? parsed.scale : 1.0,
        offsetX: typeof parsed.offsetX === "number" ? parsed.offsetX : 0,
        offsetY: typeof parsed.offsetY === "number" ? parsed.offsetY : 0,
      };
    }
  } catch {}
  return { scale: 1.0, offsetX: 0, offsetY: 0 };
}

export function saveSpriteTransform(actorId: string, transform: SpriteTransform): void {
  if (typeof window === "undefined" || !actorId) return;
  try {
    localStorage.setItem(STORAGE_PREFIX + actorId.toLowerCase().trim(), JSON.stringify(transform));
  } catch {}
}

export function resetSpriteTransform(actorId: string): void {
  if (typeof window === "undefined" || !actorId) return;
  try {
    localStorage.removeItem(STORAGE_PREFIX + actorId.toLowerCase().trim());
  } catch {}
}

```

## File: `src/frontend/stage/staging.ts`

```typescript
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

  public destroy(): void {
    this.particleEngine.destroy();
  }
}

```

## File: `src/frontend/stage/theme.ts`

```typescript
export interface VnTheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  bgGlass: string;
  border: string;
  glow: string;
  text: string;
}

export const VN_THEMES: Record<string, VnTheme> = {
  default: {
    id: "default",
    name: "Classic ADV",
    primary: "#6366f1",
    secondary: "#8b5cf6",
    accent: "#ffd700",
    bgGlass: "rgba(15, 23, 42, 0.92)",
    border: "rgba(129, 140, 248, 0.5)",
    glow: "rgba(99, 102, 241, 0.35)",
    text: "#f8fafc",
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
    text: "#e0f7fa",
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
    text: "#f3e8ff",
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
    text: "#fdf2f8",
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
    text: "#fff7ed",
  },
};

export function applyVnTheme(rootEl: HTMLElement, themeId = "default"): void {
  const theme = VN_THEMES[themeId] || VN_THEMES["default"]!;
  rootEl.style.setProperty("--vn-primary", theme.primary);
  rootEl.style.setProperty("--vn-secondary", theme.secondary);
  rootEl.style.setProperty("--vn-accent", theme.accent);
  rootEl.style.setProperty("--vn-card-bg", theme.bgGlass);
  rootEl.style.setProperty("--vn-border", theme.border);
  rootEl.style.setProperty("--vn-glow", theme.glow);
  rootEl.style.setProperty("--vn-text", theme.text);
}

```

## File: `src/frontend/stage/tts-engine.ts`

```typescript
export class VnTtsEngine {
  private enabled = false;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.loadVoices();
      window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices(): void {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.voices = window.speechSynthesis.getVoices();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean): void {
    this.enabled = val;
    if (!val) {
      this.stop();
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  public stop(): void {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  public speak(text: string, speaker: string, onEnd?: () => void): void {
    if (!this.enabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      onEnd?.();
      return;
    }

    this.stop();

    // Clean text of markdown, bracket tags, and formatting
    const cleaned = text
      .replace(/\[\[.*?\]\]/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/[\*_~`#]/g, "")
      .replace(/["“”]/g, "")
      .trim();

    if (!cleaned) {
      onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleaned);
    this.currentUtterance = utterance;

    // Pick consistent pitch and rate based on speaker name
    const hash = speaker.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const isNarrator = !speaker || speaker.toLowerCase() === "narrator";

    if (isNarrator) {
      utterance.pitch = 0.95;
      utterance.rate = 1.0;
    } else {
      // Distinct pitch variation per character: 0.85 to 1.25
      utterance.pitch = 0.85 + (hash % 9) * 0.05;
      utterance.rate = 1.0 + (hash % 3) * 0.05;
    }

    // Try to pick an appropriate language voice
    if (this.voices.length > 0) {
      const enVoices = this.voices.filter((v) => v.lang.startsWith("en"));
      const pool = enVoices.length > 0 ? enVoices : this.voices;
      utterance.voice = pool[hash % pool.length] || null;
    }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      this.currentUtterance = null;
      onEnd?.();
    };

    utterance.onend = finish;
    utterance.onerror = finish;

    // Safety timeout in case speech synthesis hangs on certain browsers
    const maxDuration = Math.max(2000, cleaned.length * 100);
    window.setTimeout(() => {
      if (!settled) finish();
    }, maxDuration);

    window.speechSynthesis.speak(utterance);
  }
}

```

## File: `src/frontend/studio/asset-drawer.ts`

```typescript
import type { SpindleFrontendContext, SpindleDrawerTabHandle } from "lumiverse-spindle-types";
import type { AssetManifest } from "../../shared/types.js";

export function registerAssetDrawer(ctx: SpindleFrontendContext): SpindleDrawerTabHandle | null {
  if (!ctx.ui?.registerDrawerTab) return null;

  const handle = ctx.ui.registerDrawerTab({
    id: "vn_asset_studio",
    title: "LumiVN Asset Studio",
    shortName: "VN Studio",
    description: "Manage local visual novel backgrounds, character paper-dolls, and sprite sheets.",
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  });

  const root = handle.root;
  root.innerHTML = `
    <div class="vn-studio-container" style="padding: 16px; font-family: system-ui, sans-serif; color: #f1f5f9; height: 100%; overflow-y: auto;">
      <h2 style="font-size: 18px; margin-bottom: 8px;">🎨 LumiVN Asset Studio</h2>
      <p style="font-size: 13px; color: #94a3b8; margin-bottom: 16px;">
        Upload offline place backgrounds and character sprite layers directly to extension storage.
      </p>

      <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid #334155; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
        <h3 style="font-size: 14px; margin-bottom: 10px;">Upload Place Background</h3>
        <div style="display: flex; gap: 8px; margin-bottom: 10px;">
          <input id="vn-place-id-input" type="text" placeholder="Place ID (e.g. courtyard)" style="flex: 1; padding: 6px 10px; background: #0f172a; border: 1px solid #475569; border-radius: 4px; color: #fff; font-size: 13px;" />
          <button id="vn-upload-place-btn" style="padding: 6px 14px; background: #6366f1; border: none; border-radius: 4px; color: #fff; font-weight: 600; cursor: pointer; font-size: 13px;">Pick Media</button>
        </div>
        <div style="font-size: 11px; color: #64748b;">Supports PNG, WEBP, JPG, MP4, WEBM</div>
      </div>

      <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid #334155; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
        <h3 style="font-size: 14px; margin-bottom: 10px;">Upload Character Sprite / Layer</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
          <input id="vn-char-actor-input" type="text" placeholder="Actor ID (e.g. alethea)" style="padding: 6px 10px; background: #0f172a; border: 1px solid #475569; border-radius: 4px; color: #fff; font-size: 13px;" />
          <input id="vn-char-outfit-input" type="text" placeholder="Outfit (default, uniform...)" style="padding: 6px 10px; background: #0f172a; border: 1px solid #475569; border-radius: 4px; color: #fff; font-size: 13px;" />
        </div>
        <div style="display: flex; gap: 8px; margin-bottom: 10px;">
          <input id="vn-char-expr-input" type="text" placeholder="Expression/Layer (neutral, angry, base...)" style="flex: 1; padding: 6px 10px; background: #0f172a; border: 1px solid #475569; border-radius: 4px; color: #fff; font-size: 13px;" />
          <button id="vn-upload-char-btn" style="padding: 6px 14px; background: #8b5cf6; border: none; border-radius: 4px; color: #fff; font-weight: 600; cursor: pointer; font-size: 13px;">Pick Image</button>
        </div>
      </div>

      <div id="vn-manifest-view" style="background: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b; border-radius: 8px; padding: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h3 style="font-size: 14px;">Indexed Asset Manifest</h3>
          <button id="vn-refresh-manifest-btn" style="padding: 4px 10px; background: #334155; border: none; border-radius: 4px; color: #94a3b8; font-size: 12px; cursor: pointer;">Refresh</button>
        </div>
        <pre id="vn-manifest-json" style="font-size: 11px; color: #94a3b8; max-height: 200px; overflow-y: auto; background: #020617; padding: 8px; border-radius: 4px;"></pre>
      </div>
      <div id="vn-upload-status" style="margin-top: 12px; font-size: 12px; color: #38bdf8;"></div>
    </div>
  `;

  const statusEl = root.querySelector("#vn-upload-status") as HTMLElement;
  const manifestJsonEl = root.querySelector("#vn-manifest-json") as HTMLElement;

  const showStatus = (msg: string, isError = false) => {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.style.color = isError ? "#f43f5e" : "#38bdf8";
  };

  const getDrawerContextIds = () => {
    const ctxAny = ctx as any;
    const activeChat = ctxAny.getActiveChat?.();
    return {
      chatId: activeChat?.id || activeChat?.chatId,
      userId:
        ctxAny.user?.id ||
        ctxAny.currentUser?.id ||
        activeChat?.user_id ||
        activeChat?.userId,
    };
  };

  const uploadPlaceBtn = root.querySelector("#vn-upload-place-btn");
  uploadPlaceBtn?.addEventListener("click", async () => {
    const placeIdInput = root.querySelector("#vn-place-id-input") as HTMLInputElement;
    const placeId = (placeIdInput?.value || "").trim().toLowerCase();
    if (!placeId) {
      showStatus("Please enter a Place ID first", true);
      return;
    }

    try {
      const files = await ctx.uploads.pickFile({
        accept: ["image/*", "video/mp4", "video/webm"],
        multiple: false,
      });
      if (!files || files.length === 0) return;

      const file = files[0]!;
      showStatus(`Uploading ${file.name}...`);

      let binary = "";
      for (let i = 0; i < file.bytes.byteLength; i++) {
        binary += String.fromCharCode(file.bytes[i]!);
      }
      const dataUrl = `data:${file.mimeType || "application/octet-stream"};base64,${btoa(binary)}`;

      const { chatId: pChatId, userId: pUserId } = getDrawerContextIds();
      ctx.sendToBackend({
        type: "vn_upload_asset",
        category: "places",
        placeId,
        filename: file.name,
        dataUrl,
        chatId: pChatId,
        userId: pUserId,
      });
      showStatus(`Uploaded ${placeId} (${file.name}) successfully!`);
    } catch (e) {
      showStatus(`Upload error: ${String(e)}`, true);
    }
  });

  const uploadCharBtn = root.querySelector("#vn-upload-char-btn");
  uploadCharBtn?.addEventListener("click", async () => {
    const actorInput = root.querySelector("#vn-char-actor-input") as HTMLInputElement;
    const outfitInput = root.querySelector("#vn-char-outfit-input") as HTMLInputElement;
    const exprInput = root.querySelector("#vn-char-expr-input") as HTMLInputElement;

    const actor = (actorInput?.value || "").trim().toLowerCase();
    const outfit = (outfitInput?.value || "default").trim().toLowerCase();
    const expr = (exprInput?.value || "neutral").trim().toLowerCase();

    if (!actor) {
      showStatus("Please enter an Actor ID first", true);
      return;
    }

    try {
      const files = await ctx.uploads.pickFile({
        accept: ["image/png", "image/webp"],
        multiple: false,
      });
      if (!files || files.length === 0) return;

      const file = files[0]!;
      showStatus(`Uploading character layer...`);

      let binary = "";
      for (let i = 0; i < file.bytes.byteLength; i++) {
        binary += String.fromCharCode(file.bytes[i]!);
      }
      const dataUrl = `data:${file.mimeType || "image/png"};base64,${btoa(binary)}`;

      const { chatId: cChatId, userId: cUserId } = getDrawerContextIds();
      ctx.sendToBackend({
        type: "vn_upload_asset",
        category: "characters",
        actorId: actor,
        outfit,
        expression: expr,
        filename: file.name,
        dataUrl,
        chatId: cChatId,
        userId: cUserId,
      });
      showStatus(`Uploaded ${actor}/${outfit}/${expr} (${file.name}) successfully!`);
    } catch (e) {
      showStatus(`Upload error: ${String(e)}`, true);
    }
  });

  const refreshBtn = root.querySelector("#vn-refresh-manifest-btn");
  refreshBtn?.addEventListener("click", () => {
    ctx.sendToBackend({ type: "vn_get_manifest" });
  });

  // Request initial manifest
  ctx.sendToBackend({ type: "vn_get_manifest" });

  ctx.onBackendMessage((msg: unknown) => {
    const payload = msg as Record<string, unknown>;
    if (payload?.type === "vn_manifest" && manifestJsonEl) {
      manifestJsonEl.textContent = JSON.stringify(payload.manifest, null, 2);
    }
  });

  return handle;
}

```

## File: `src/frontend/studio/diagnostics-drawer.ts`

```typescript
import type { SpindleFrontendContext, SpindleDrawerTabHandle } from "lumiverse-spindle-types";

export interface DiagnosticData {
  timestamp: string;
  chatId: string;
  messageId?: string;
  hasLedger: boolean;
  placeId: string;
  participants: string[];
  bgUrl: string;
}

export interface DiagnosticsHandle {
  tab: SpindleDrawerTabHandle;
  pushLog: (msg: string, level?: "info" | "warn" | "error" | "action") => void;
  updateDiagnostic: (data: DiagnosticData) => void;
  setLatestLedger: (ledger: unknown) => void;
  setLatestManifest: (manifest: unknown) => void;
}

export function registerDiagnosticsDrawer(
  ctx: SpindleFrontendContext,
  onLaunchStage: () => void
): DiagnosticsHandle | null {
  if (!ctx.ui?.registerDrawerTab) return null;

  const tab = ctx.ui.registerDrawerTab({
    id: "vn_diagnostics",
    title: "LumiVN Controls & Diagnostics",
    shortName: "VN Diag",
    description: "Launch visual novel stage, inspect Ledger parsing, and copy engine logs",
    keywords: ["vn", "diagnostics", "ledger", "visual novel", "stage", "logs"],
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>`,
  });

  const root = tab.root;
  let rawLogHistory: string[] = [];
  let latestLedgerData: unknown = null;
  let latestManifestData: unknown = null;

  root.innerHTML = `
    <div style="padding: 16px; font-family: system-ui, -apple-system, sans-serif; color: #f1f5f9; height: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; box-sizing: border-box;">
      <div style="background: linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.25)); border: 1px solid rgba(129,140,248,0.5); border-radius: 12px; padding: 14px; text-align: center;">
        <h3 style="margin: 0 0 4px 0; font-size: 15px; color: #fff;">LumiVN Control Center</h3>
        <p style="font-size: 11px; color: #94a3b8; margin: 0 0 10px 0;">Switch between standard chat and the visual novel stage.</p>
        <button id="vn-launch-btn" style="width: 100%; padding: 9px 16px; background: #6366f1; border: none; border-radius: 8px; color: #fff; font-weight: 700; font-size: 13px; cursor: pointer;">
          ▶ Open Visual Novel Stage
        </button>
      </div>

      <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid #334155; border-radius: 10px; padding: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h4 style="margin: 0; font-size: 11px; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px;">Turn Telemetry</h4>
          <div style="display: flex; gap: 6px;">
            <button id="vn-copy-state-btn" style="padding: 2px 8px; font-size: 10px; background: #1e293b; border: 1px solid #475569; border-radius: 4px; color: #cbd5e1; cursor: pointer;">
              📋 Copy State JSON
            </button>
            <button id="vn-copy-manifest-btn" style="padding: 2px 8px; font-size: 10px; background: #1e293b; border: 1px solid #475569; border-radius: 4px; color: #cbd5e1; cursor: pointer;">
              📋 Copy Asset Manifest
            </button>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Ledger Block:</span>
            <span id="vn-diag-ledger" style="font-weight: 600; color: #94a3b8;">Pending turn</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Place ID:</span>
            <span id="vn-diag-place" style="font-weight: 600; color: #e2e8f0;">—</span>
          </div>
          <div>
            <span style="color: #94a3b8;">Background URL:</span>
            <div id="vn-diag-bg" style="font-size: 11px; color: #38bdf8; word-break: break-all; margin-top: 1px;">—</div>
          </div>
          <div>
            <span style="color: #94a3b8;">Cast & Slots:</span>
            <div id="vn-diag-cast" style="font-size: 11px; color: #e2e8f0; margin-top: 1px;">None</div>
          </div>
        </div>
      </div>

      <div style="flex: 1; display: flex; flex-direction: column; background: #020617; border: 1px solid #1e293b; border-radius: 10px; padding: 10px; min-height: 220px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <h4 style="margin: 0; font-size: 11px; color: #94a3b8; text-transform: uppercase;">Diagnostic Console</h4>
          <div style="display: flex; gap: 6px;">
            <button id="vn-copy-logs-btn" style="padding: 2px 8px; font-size: 10px; background: #334155; border: 1px solid #475569; border-radius: 4px; color: #f8fafc; font-weight: 600; cursor: pointer;">
              📋 Copy Logs
            </button>
            <button id="vn-clear-log-btn" style="padding: 2px 6px; font-size: 10px; background: #1e293b; border: 1px solid #334155; border-radius: 4px; color: #94a3b8; cursor: pointer;">
              Clear
            </button>
          </div>
        </div>
        <div id="vn-log-stream" style="flex: 1; overflow-y: auto; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; color: #cbd5e1; display: flex; flex-direction: column; gap: 4px; user-select: text;">
          <div style="color: #64748b;">[System] Diagnostic stream initialized.</div>
        </div>
      </div>
    </div>
  `;

  root.querySelector("#vn-launch-btn")?.addEventListener("click", onLaunchStage);

  const logStream = root.querySelector("#vn-log-stream") as HTMLElement;
  const copyLogsBtn = root.querySelector("#vn-copy-logs-btn") as HTMLButtonElement;
  const copyStateBtn = root.querySelector("#vn-copy-state-btn") as HTMLButtonElement;
  const copyManifestBtn = root.querySelector("#vn-copy-manifest-btn") as HTMLButtonElement;

  root.querySelector("#vn-clear-log-btn")?.addEventListener("click", () => {
    if (logStream) logStream.innerHTML = "";
    rawLogHistory = [];
  });

  const pushLog = (msg: string, level: "info" | "warn" | "error" | "action" = "info") => {
    const time = new Date().toLocaleTimeString();
    const entry = `[${time}] [${level.toUpperCase()}] ${msg}`;
    rawLogHistory.push(entry);

    if (!logStream) return;
    const item = document.createElement("div");
    item.style.wordBreak = "break-word";
    item.style.color =
      level === "error"
        ? "#f43f5e"
        : level === "warn"
        ? "#f59e0b"
        : level === "action"
        ? "#38bdf8"
        : "#cbd5e1";
    item.textContent = entry;
    logStream.appendChild(item);
    logStream.scrollTop = logStream.scrollHeight;
  };

  copyLogsBtn?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(rawLogHistory.join("\n"));
      copyLogsBtn.textContent = "✓ Copied!";
      setTimeout(() => (copyLogsBtn.textContent = "📋 Copy Logs"), 1500);
    } catch (e) {
      pushLog(`Clipboard write failed: ${String(e)}`, "error");
    }
  });

  copyStateBtn?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(latestLedgerData || {}, null, 2));
      copyStateBtn.textContent = "✓ Copied!";
      setTimeout(() => (copyStateBtn.textContent = "📋 Copy State JSON"), 1500);
    } catch (e) {
      pushLog(`Failed to copy state: ${String(e)}`, "error");
    }
  });

  copyManifestBtn?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(latestManifestData || {}, null, 2));
      copyManifestBtn.textContent = "✓ Copied!";
      setTimeout(() => (copyManifestBtn.textContent = "📋 Copy Asset Manifest"), 1500);
    } catch (e) {
      pushLog(`Failed to copy manifest: ${String(e)}`, "error");
    }
  });

  const updateDiagnostic = (data: DiagnosticData) => {
    const ledgerEl = root.querySelector("#vn-diag-ledger") as HTMLElement;
    const placeEl = root.querySelector("#vn-diag-place") as HTMLElement;
    const castEl = root.querySelector("#vn-diag-cast") as HTMLElement;
    const bgEl = root.querySelector("#vn-diag-bg") as HTMLElement;

    if (ledgerEl) {
      ledgerEl.textContent = data.hasLedger ? "DETECTED (Parsed)" : "NOT FOUND (Prose-only)";
      ledgerEl.style.color = data.hasLedger ? "#10b981" : "#f59e0b";
    }
    if (placeEl) placeEl.textContent = data.placeId || "default";
    if (castEl) castEl.textContent = data.participants.length > 0 ? data.participants.join(", ") : "None";
    if (bgEl) {
      bgEl.textContent = data.bgUrl.startsWith("data:") ? "[Fallback SVG Data URI]" : data.bgUrl;
    }

    pushLog(`Turn parsed: place='${data.placeId}', bg='${data.bgUrl.slice(0, 35)}...', cast=[${data.participants.join(", ")}]`, "info");
  };

  const setLatestLedger = (ledger: unknown) => {
    latestLedgerData = ledger;
  };

  const setLatestManifest = (manifest: unknown) => {
    latestManifestData = manifest;
  };

  // Request initial manifest from backend
  ctx.sendToBackend({ type: "vn_get_manifest" });

  return { tab, pushLog, updateDiagnostic, setLatestLedger, setLatestManifest };
}

```

## File: `src/frontend/utils/bg-remover.ts`

```typescript
/**
 * Client-side Neural Background Removal Utility using @imgly/background-removal.
 * Runs in-browser WASM/WebGPU segmentation to produce transparent PNGs.
 */

export async function removeImageBackground(
  bytes: Uint8Array,
  mimeType = "image/png",
  onProgress?: (percent: number) => void
): Promise<string> {
  try {
    // 1. Wrap raw bytes into an image Blob
    const inputBlob = new Blob([bytes as BlobPart], { type: mimeType || "image/png" });

    // 2. Lazily import @imgly/background-removal to keep initial engine bundle lightweight
    const { removeBackground } = await import("@imgly/background-removal");

    // 3. Execute background removal with progress tracking
    const resultBlob = await removeBackground(inputBlob, {
      progress: (_key: string, current: number, total: number) => {
        if (total > 0 && onProgress) {
          const pct = Math.min(100, Math.round((current / total) * 100));
          onProgress(pct);
        }
      },
    });

    // 4. Convert transparent output Blob to Base64 data URL
    return await blobToDataUrl(resultBlob);
  } catch (err) {
    console.error("[LumiVN] Background removal failed:", err);
    throw new Error(err instanceof Error ? err.message : String(err));
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert resulting image blob to data URL"));
      }
    };
    reader.onerror = () => reject(reader.error || new Error("FileReader encountered an error reading image blob"));
    reader.readAsDataURL(blob);
  });
}

```

## File: `src/shared/text-effects.ts`

```typescript
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
      const lbl = (twineP2 !== undefined ? twineP1 : twineP1).trim();
      const act = (twineP2 !== undefined ? twineP2 : twineP1).trim();
      choices.push({ text: lbl, action: act });
      return `<button class="vn-inline-choice" data-action="${escapeHtml(act)}">${escapeHtml(lbl)}</button>`;
    }
  });

  return { cleanText, choices };
}

```

## File: `src/shared/types.ts`

```typescript
export interface ClockState {
  t?: string;
  phase?: string;
  step?: number;
}

export interface SceneState {
  place?: string;
  time?: string;
  participants?: string[];
  threads?: string[];
  pressures?: string[];
  recent_changes?: string[];
  recent_beats?: string[];
}

export interface ActorOutfit {
  top?: string;
  bottom?: string;
  underwear_top?: string;
  underwear_bottom?: string;
  shoes?: string;
  accessories?: string[];
  state?: string;
}

export interface ActorPassions {
  anger?: number;
  shame?: number;
  arousal?: number;
  fear?: number;
  stress?: number;
  pain?: number;
  exhaustion?: number;
  suspicion?: number;
  disgust?: number;
  sadness?: number;
  guilt?: number;
  joy?: number;
}

export interface ActorInventory {
  in_hand?: {
    L?: string;
    R?: string;
  };
  carried?: string[];
  room?: string[];
  room_location?: string;
}

export interface ActorDossier {
  id?: string;
  name?: string;
  appearance?: {
    age?: string | number;
    traits?: string;
    appeal?: number;
    style?: string;
    condition?: string;
  };
  money?: {
    in_hand?: number;
    in_bank?: number;
    currency?: string;
  };
  combat?: Record<string, unknown>;
  passions?: ActorPassions;
  outfit?: ActorOutfit;
  inventory?: ActorInventory;
  relations?: Record<string, Record<string, number | unknown>>;
  profile?: Record<string, unknown>;
  state?: Record<string, unknown>;
  agency?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface PlaceRoute {
  to: string;
  minutes: number | string;
}

export interface PlaceNode {
  function?: string;
  traffic?: number;
  privacy?: number;
  visibility?: number;
  access?: string;
  norm?: string;
  rhythm?: string;
  resources?: string[];
  routes?: Array<PlaceRoute | Record<string, string | number>>;
  [key: string]: unknown;
}

export interface Opportunity {
  id: string;
  what?: string;
  wanted_by?: string[];
  noticed_by?: string[];
  cost?: Record<string, unknown> | string;
  payoff?: string;
  claimed_by?: string[];
  status?: string; // lead | taken | contested | lost
  due?: string;
  [key: string]: unknown;
}

export interface BPlot {
  id: string;
  who?: string;
  doing?: string;
  vector?: string;
  ripple?: number; // 1: isolated | 2: ambient echo (news/text/siren) | 3: collision
  status?: string; // active | converged | fizzled
}

export interface JournalEntry {
  id: string;
  time?: string;
  place?: string;
  action?: string;
  outcome?: string;
  witnesses?: Record<string, unknown> | unknown[];
  effects?: Record<string, unknown> | unknown[];
  mutations?: string[];
  [key: string]: unknown;
}

export interface LedgerData {
  world?: Record<string, unknown>;
  clock?: ClockState;
  scene?: SceneState;
  places?: Record<string, PlaceNode>;
  roster?: Array<{ id: string; name?: string; lod?: number; status?: string; loc?: string }>;
  actors?: Record<string, ActorDossier>;
  bplots?: BPlot[];
  opportunities?: Opportunity[];
  journal?: JournalEntry[];
  travel?: Array<{ actor: string; purpose?: string; from?: string; to: string; eta?: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

export interface CharacterSpriteLayers {
  base?: string;
  underwear?: string;
  outfit?: string;
  expression?: string;
  accessories?: string;
}

export interface StageCharacter {
  actorId: string;
  name: string;
  slot: "left" | "center" | "right";
  isSpeaker: boolean;
  layers: CharacterSpriteLayers;
  spriteUrl?: string; // Fallback or composite URL
  emotion: string;
}

export interface StageBackground {
  url: string;
  isVideo?: boolean;
}

export interface VnPresentationState {
  chatId: string;
  messageId: string;
  speakerName: string;
  speakerId?: string;
  paragraphs: string[];
  background: StageBackground;
  characters: StageCharacter[];
  ledger: LedgerData;
  hasBPlotNotification?: boolean;
}

export interface AssetRecord {
  url: string;
  imageId?: string;
  uploadedAt?: string;
}

export interface AssetManifest {
  places: Record<string, string>; // key: "scope:placeId" or "placeId" -> url
  characters: Record<string, {
    outfits?: Record<string, Record<string, string>>; // outfit -> expression -> url
    actions?: Record<string, string>;                 // action -> url
  }>;
  cgs?: Record<string, string>; // event action/cg name -> url
}


```

## File: `test/engine.test.ts`

```typescript
import { describe, expect, test } from "bun:test";
import {
  extractProse,
  extractParagraphs,
  detectSpeaker,
  extractLedgerRaw,
  parseLedgerYaml,
  deepMergeLedger,
} from "../src/backend/ledger-parser.js";
import {
  AssetResolver,
  resolveDominantEmotion,
  resolveOutfitName,
} from "../src/backend/asset-resolver.js";
import { formatDialogueHtml } from "../src/frontend/stage/rich-text.js";
import { parseTwineChoices } from "../src/shared/text-effects.js";

const SAMPLE_MY_WORLD_MESSAGE = `
<think>Evaluating scene dynamics</think>
<details><summary>🧠 Scene Logic</summary>
- Input: IC | Preconditions: PASS
</details>

Alethea glanced toward the edge of the courtyard, her fingers nervously clutching her bag. "Are you really sure we should be heading out now?"

The afternoon wind swept through the trees with an uneasy chill.

<details><summary>📊 Ledger</summary>

## World
\`\`\`yaml
world:
  genre: "Fantasy Romance"
clock:
  t: "D1 14:30"
  phase: "Afternoon"
\`\`\`

## Places
\`\`\`yaml
places:
  courtyard:
    routes:
      - to: "library"
        minutes: 10
      - to: "market"
        minutes: 25
\`\`\`

## Actor dossiers
\`\`\`yaml
alethea:
  name: "Alethea"
  passions:
    arousal: 55
    fear: 20
    joy: 10
  outfit:
    top: "School Blouse"
    bottom: "Pleated Skirt"
    underwear_top: "White Bra"
    underwear_bottom: "White Panties"
    shoes: "Loafers"
  inventory:
    in_hand:
      L: "School Bag"
      R: "Empty"
    carried: ["Notebook", "House Key"]
    room: ["Warm Coat"]
  relations:
    user:
      affinity: 45
      trust: 50
\`\`\`

## B-Plots
\`\`\`yaml
bplots:
  - id: "bp_police"
    who: "City Guard Dispatch"
    doing: "Investigating broken gate in lower quarter"
    vector: "Siren in distance"
    ripple: 2
    status: "active"
\`\`\`

## Opportunities
\`\`\`yaml
opportunities:
  - id: "opp_secret_archive"
    what: "Infiltrate library restricted section"
    wanted_by: ["alethea"]
    payoff: "Ancient Grimoire"
    status: "lead"
\`\`\`

</details>

Loadout: L:School Bag R:Empty
Attire: Top:School Blouse Bot:Pleated Skirt
`;

describe("LumiVN Deterministic Ledger Parser", () => {
  test("extracts narrative prose cleanly without logic or ledger tags", () => {
    const prose = extractProse(SAMPLE_MY_WORLD_MESSAGE);
    expect(prose).toContain('Alethea glanced toward the edge of the courtyard');
    expect(prose).not.toContain('<think>');
    expect(prose).not.toContain('Scene Logic');
    expect(prose).not.toContain('Ledger');
    expect(prose).not.toContain('Loadout:');
  });

  test("parses paragraphs and detects active speaker", () => {
    const prose = extractProse(SAMPLE_MY_WORLD_MESSAGE);
    const paras = extractParagraphs(prose);
    expect(paras.length).toBe(2);

    const first = detectSpeaker(paras[0]!);
    expect(first.speaker).toBe("Alethea");
  });

  test("extracts and parses My World 1.79 YAML ledger blocks", () => {
    const raw = extractLedgerRaw(SAMPLE_MY_WORLD_MESSAGE);
    expect(raw).not.toBeNull();

    const parsed = parseLedgerYaml(raw!);
    expect(parsed.clock?.t).toBe("D1 14:30");
    expect(parsed.places?.courtyard).toBeDefined();

    const alethea = parsed.actors?.alethea;
    expect(alethea).toBeDefined();
    expect(alethea?.passions?.arousal).toBe(55);
    expect(alethea?.outfit?.top).toBe("School Blouse");
    expect(alethea?.relations?.user.trust).toBe(50);

    expect(parsed.bplots?.[0]?.ripple).toBe(2);
    expect(parsed.opportunities?.[0]?.id).toBe("opp_secret_archive");
  });

  test("deep merges ledger state across turns preserving base state", () => {
    const raw = extractLedgerRaw(SAMPLE_MY_WORLD_MESSAGE);
    const delta1 = parseLedgerYaml(raw!);
    const state1 = deepMergeLedger(null, delta1);

    const delta2 = {
      clock: { t: "D1 14:45", phase: "Afternoon" },
      actors: {
        alethea: {
          passions: { arousal: 65, anger: 10 },
        },
      },
    };

    const state2 = deepMergeLedger(state1, delta2);
    expect(state2.clock?.t).toBe("D1 14:45");
    // Preserves outfit from turn 1
    expect(state2.actors?.alethea?.outfit?.top).toBe("School Blouse");
    // Updates passion
    expect(state2.actors?.alethea?.passions?.arousal).toBe(65);
    expect(state2.actors?.alethea?.passions?.anger).toBe(10);
  });
});

describe("LumiVN Asset Resolver Rules", () => {
  test("resolves dominant emotion accurately", () => {
    expect(resolveDominantEmotion({ arousal: 55 })).toBe("blush");
    expect(resolveDominantEmotion({ anger: 45 })).toBe("angry");
    expect(resolveDominantEmotion({ fear: 40 })).toBe("scared");
    expect(resolveDominantEmotion({ joy: 40 })).toBe("smile");
    expect(resolveDominantEmotion({ stress: 20 })).toBe("neutral");
  });

  test("normalizes outfit identifiers", () => {
    expect(resolveOutfitName({ outfit: { state: "School Uniform" } })).toBe("school_uniform");
    expect(resolveOutfitName({ outfit: { top: "Silk Shirt" } })).toBe("silk_shirt");
    expect(resolveOutfitName({})).toBe("default");
  });

  test("resolves scoped locations without colliding with common room names", async () => {
    const mockSpindle = {
      log: { info: () => {}, warn: () => {}, error: () => {} },
    } as any;
    const mockStorage = {
      getManifest: async () => ({
        places: {
          "tendo_dojo:kitchen": "https://images.local/tendo_kitchen.png",
          "kitchen": "https://images.local/default_kitchen.png",
        },
        characters: {},
      }),
    } as any;

    const resolver = new AssetResolver(mockSpindle, mockStorage);
    const scopedBg = await resolver.resolveBackground("kitchen", "tendo_dojo");
    expect(scopedBg.url).toBe("https://images.local/tendo_kitchen.png");

    const defaultBg = await resolver.resolveBackground("kitchen");
    expect(defaultBg.url).toBe("https://images.local/default_kitchen.png");
  });

  test("prioritizes action pose sprite when action keyword occurs in context", async () => {
    const mockSpindle = {
      log: { info: () => {}, warn: () => {}, error: () => {} },
    } as any;
    const mockStorage = {
      getManifest: async () => ({
        places: {},
        characters: {
          tessa: {
            outfits: { default: { neutral: "https://images.local/tessa_default.png" } },
            actions: { cooking: "https://images.local/tessa_cooking.png" },
          },
        },
      }),
    } as any;

    const resolver = new AssetResolver(mockSpindle, mockStorage);

    const actionSprite = await resolver.resolveCharacterSprite(
      "tessa",
      undefined,
      undefined,
      "Tessa was happily cooking a batch of stew in the pot."
    );
    expect(actionSprite.spriteUrl).toBe("https://images.local/tessa_cooking.png");
    expect(actionSprite.emotion).toBe("cooking");

    const defaultSprite = await resolver.resolveCharacterSprite(
      "tessa",
      undefined,
      undefined,
      "Tessa looked out the window peacefully."
    );
    expect(defaultSprite.spriteUrl).toBe("https://images.local/tessa_default.png");
    expect(defaultSprite.emotion).toBe("neutral");
  });
});

describe("LumiVN Rich Text & Twine Action Triggers", () => {
  test("parses inline Twine bracket choices and choice tags", () => {
    const text = 'Do you wish to [[Enter Library|enter_library]] or <choice action="flee">Run away</choice>?';
    const { cleanText, choices } = parseTwineChoices(text);

    expect(choices.length).toBe(2);
    expect(choices[0]).toEqual({ text: "Enter Library", action: "enter_library" });
    expect(choices[1]).toEqual({ text: "Run away", action: "flee" });
    expect(cleanText).toContain('data-action="enter_library"');
  });

  test("converts text effect tags into animation spans", () => {
    const raw = '<shake>Look out!</shake> The <rainbow>gem</rainbow> glows softly.';
    const { html } = formatDialogueHtml(raw);

    expect(html).toContain('<span data-vn-text-fx="shake">Look out!</span>');
    expect(html).toContain('<span data-vn-text-fx="rainbow">gem</span>');
  });
});

import { splitParagraphIntoBeats } from "../src/frontend/stage/beat-splitter.js";
import { VN_THEMES } from "../src/frontend/stage/theme.js";

describe("Ren'Py ADV Beat Chunking & Theme Presets", () => {
  test("preserves cohesive paragraph dialogue with speaker attribution", () => {
    const paras = [
      '**Alethea**: "Wait! We can\'t go in there yet. The guards are still watching."',
      "The heavy iron doors groaned under the wind.",
    ];

    const beats = splitParagraphIntoBeats(paras, "Narrator");
    expect(beats.length).toBe(2);
    expect(beats[0]?.speaker).toBe("Alethea");
    expect(beats[0]?.text).toBe('"Wait! We can\'t go in there yet. The guards are still watching."');
    expect(beats[1]?.speaker).toBe("Narrator");
    expect(beats[1]?.text).toBe("The heavy iron doors groaned under the wind.");
  });

  test("extracts narrative dialogue attribution to speaking character for nameplate", () => {
    const paras = [
      'Alethea glanced toward the edge of the courtyard nervously. "Are you really sure we should be heading out now?"',
    ];
    const beats = splitParagraphIntoBeats(paras, "Narrator");
    expect(beats.length).toBe(1);
    expect(beats[0]?.speaker).toBe("Alethea");
    expect(beats[0]?.text).toContain("Alethea glanced toward the edge of the courtyard nervously.");
    expect(beats[0]?.text).toContain("Are you really sure we should be heading out now?");
  });

  test("defines all 5 authentic visual themes with required color tokens", () => {
    const requiredThemes = ["default", "cyberpunk", "midnight", "sakura", "sunset"];
    for (const key of requiredThemes) {
      const theme = VN_THEMES[key];
      expect(theme).toBeDefined();
      expect(theme?.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme?.bgGlass).toBeDefined();
      expect(theme?.border).toBeDefined();
    }
  });

  test("extracts inline asset and expression tags stripping them from dialogue text", () => {
    const raw = 'Alethea gasped, <img cmd="blush"> "I didn\'t expect to see you here!" [sfx: chime]';
    const beats = splitParagraphIntoBeats([raw], "Narrator");
    expect(beats.length).toBe(1);
    expect(beats[0]?.speaker).toBe("Alethea");
    expect(beats[0]?.expression).toBe("blush");
    expect(beats[0]?.sfx).toBe("chime");
    expect(beats[0]?.text).not.toContain('<img');
    expect(beats[0]?.text).not.toContain('[sfx:');
  });

  test("detects inverted speech tags and multi-character dialogue in one turn", () => {
    const paras = [
      '"Wait right there," said Alethea softly.',
      '"We don\'t have time for this," replied Donald.',
    ];
    const beats = splitParagraphIntoBeats(paras, "Narrator");
    expect(beats.length).toBe(2);
    expect(beats[0]?.speaker).toBe("Alethea");
    expect(beats[1]?.speaker).toBe("Donald");
  });
});

import { isActorMatch } from "../src/frontend/stage/staging.js";

describe("LumiVN Multi-Actor Spotlight Matching", () => {
  test("robustly matches full names, slugs, and tokens without false positives on narrator", () => {
    expect(isActorMatch("Akane", "tendo_akane", "Akane Tendo")).toBe(true);
    expect(isActorMatch("Tendo", "tendo_akane", "Akane Tendo")).toBe(true);
    expect(isActorMatch("Donald", "donald_duck", "Donald Duck")).toBe(true);
    expect(isActorMatch("Narrator", "alethea", "Alethea")).toBe(false);
    expect(isActorMatch("", "alethea", "Alethea")).toBe(false);
  });
});



```

## File: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["bun-types"],
    "strict": true,
    "noUncheckedIndexedAccess": false,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"]
}

```

