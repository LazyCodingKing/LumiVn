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
      const chatId = String(payload.chatId || "");
      if (chatId) {
        await processChatTurn(chatId);
      }
      break;
    }

    case "vn_action": {
      const chatId = String(payload.chatId || "");
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
