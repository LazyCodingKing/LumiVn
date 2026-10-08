import type {
  SpindleAPI,
  ChatMessageDTO,
  GenerationStartedPayloadDTO,
  GenerationEndedPayloadDTO,
  GenerationStoppedPayloadDTO,
  MessageSwipedPayloadDTO,
  SwipeEditedPayloadDTO,
  LlmMessageDTO,
  InterceptorResultDTO,
} from "lumiverse-spindle-types";
import { StorageManager } from "./backend/storage.js";
import { AssetResolver } from "./backend/asset-resolver.js";
import {
  extractLedgerRaw,
  parseLedgerYaml,
  deepMergeLedger,
  extractProse,
  inferProseEmotionDelta,
} from "./backend/ledger-parser.js";
import {
  extractToonRaw,
  parseToonDelta,
} from "./backend/toon-parser.js";
import {
  evaluateDirectorInterceptor,
  processBPlots,
  computeDirectorImpactDiff,
  extractChatId,
} from "./backend/director.js";
import {
  generateCharacterDossier,
  generateSurroundingPlaces,
  simulateOffscreenMoves,
} from "./backend/out-of-band.js";
import {
  advanceClock,
  updateActorLocationsByRoutines,
  giftItem,
  snoopRoom,
} from "./backend/engine-actions.js";
import type { AssetManifest, LedgerData, DirectorSettings, DirectorLogEntry, DirectorNoteData } from "./shared/types.js";

declare const spindle: SpindleAPI;

const storage = new StorageManager(spindle);
const resolver = new AssetResolver(spindle, storage);

let lastActiveChatId: string | null = null;
let isStageOpen = false;
const activeVnChats = new Set<string>();

// LumiWorld Two-Stage Commit Lifecycle & Injected Directives Tracking
const activeGenerationIds = new Map<string, string>(); // chatId -> generationId
const pendingCommits = new Map<string, LedgerData>(); // `${chatId}:${generationId}` -> LedgerData
const injectedDirectives = new Map<string, string>(); // `${chatId}:${generationId}` -> directive
const directorLogBuffers = new Map<string, DirectorLogEntry[]>(); // chatId -> DirectorLogEntry[]

// ── Pre-Turn Director & Agency Guardrails ──
async function handleInterceptor(
  messages: LlmMessageDTO[],
  context: unknown
): Promise<LlmMessageDTO[] | InterceptorResultDTO> {
  let effectiveChatId = extractChatId(context);
  if (!effectiveChatId) {
    effectiveChatId = lastActiveChatId || (await resolveEffectiveChatId());
  }

  const effectiveContext =
    context && typeof context === "object"
      ? { ...context, chatId: effectiveChatId }
      : { chatId: effectiveChatId };

  return evaluateDirectorInterceptor(
    messages,
    effectiveContext,
    async (cid) => {
      const state = await storage.getChatState(cid);
      return state || { scene: { place: "default" }, actors: {} };
    },
    () => storage.getDirectorSettings(),
    (key, directive) => injectedDirectives.set(key, directive)
  );
}

if (typeof (spindle as any).registerInterceptor === "function") {
  (spindle as any).registerInterceptor(handleInterceptor, 50);
  spindle.log.info("[LumiVN] Living World Director interceptor registered at priority 50.");
}

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
    isStageOpen = true;
    spindle.sendToFrontend({ type: "vn_force_open" });
  } else if (commandId === "lumivn_diagnostics") {
    await spindle.ui.openDrawerTab("vn_diagnostics");
  }
});

async function processChatTurn(
  chatId: string,
  messageId?: string,
  overrideContent?: string,
  force = false,
  generationId?: string
): Promise<void> {
  if (!chatId) return;

  // View-Gating: Guard background chats when VN stage is not active
  if (!isStageOpen && !force) return;
  if (activeVnChats.size > 0 && !activeVnChats.has(chatId) && !force) return;

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
      // Bounded Message Fetching: Fetch at most 5 messages to avoid large tree memory bloat
      const messages = await (spindle.chat as any).getMessages(chatId, { limit: 5 });
      const boundedMessages = Array.isArray(messages) ? messages.slice(-5) : [];
      if (boundedMessages.length === 0) return;

      // Find the latest assistant message
      for (let i = boundedMessages.length - 1; i >= 0; i--) {
        const m = boundedMessages[i];
        if (m && (m.role === "assistant" || !m.is_user)) {
          targetMessage = m;
          break;
        }
      }
    }

    if (!targetMessage || !targetMessage.content) return;

    // Extract and broadcast AI-generated Director Note
    try {
      const jsonMatch = targetMessage.content.match(/\{[\s\S]*?"director_note"[\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed && typeof parsed.director_note === "string") {
          spindle.sendToFrontend({
            type: "vn_director_note",
            data: {
              directorNote: parsed.director_note.trim(),
              threadLabel: (parsed.thread_label || "Active Thread").trim(),
              timestamp: new Date().toLocaleTimeString(),
            },
          });
        }
      }
    } catch (e) {
      // Ignore malformed JSON chunks
    }

    // Extract State Delta: 1. TOON format, 2. Legacy YAML Ledger, 3. Prose Heuristics Fallback
    const rawToon = extractToonRaw(targetMessage.content);
    const rawLedger = rawToon ? null : extractLedgerRaw(targetMessage.content);
    let cumulativeLedger = await storage.getChatState(chatId);
    const prevLedger: LedgerData | null = cumulativeLedger
      ? JSON.parse(JSON.stringify(cumulativeLedger))
      : null;

    let delta: Partial<LedgerData> | null = null;
    if (rawToon) {
      delta = parseToonDelta(rawToon);
    } else if (rawLedger) {
      delta = parseLedgerYaml(rawLedger);
    } else {
      const prose = extractProse(targetMessage.content);
      delta = inferProseEmotionDelta(prose, characterId || "char");
    }

    if (delta) {
      cumulativeLedger = deepMergeLedger(cumulativeLedger, delta);
    } else if (!cumulativeLedger) {
      // Create empty baseline
      cumulativeLedger = deepMergeLedger(null, {});
    }

    // Phase 4: B-Plot State Monitor & Collision Roster Promotion
    const bplotResult = processBPlots(cumulativeLedger);
    if (bplotResult.hasBPlotNotification) {
      spindle.sendToFrontend({
        type: "vn_bplot_notification",
        chatId,
        ripples: bplotResult.activeRipples,
      });
      spindle.sendToFrontend({
        type: "vn_log",
        message: `[B-Plot Alert] Active ripple(s): ${bplotResult.activeRipples.map((r) => `${r.who}: ${r.doing}`).join("; ")}`,
        level: "warn",
      });
    }

    // Phase 2: Transactional State Merging
    const effectiveGenId = generationId || activeGenerationIds.get(chatId);
    const commitKey = effectiveGenId ? `${chatId}:${effectiveGenId}` : null;
    if (commitKey) {
      pendingCommits.set(commitKey, cumulativeLedger);
    }

    await storage.saveChatState(chatId, cumulativeLedger);

    if (commitKey) {
      pendingCommits.delete(commitKey);
    }

    // Post-Turn State Diffing & Director Log Generation
    const activeDirective =
      (effectiveGenId && injectedDirectives.get(`${chatId}:${effectiveGenId}`)) ||
      injectedDirectives.get(chatId) ||
      (await storage.getDirectorSettings()).systemPrompt;

    const directorEntry = computeDirectorImpactDiff(
      prevLedger,
      cumulativeLedger,
      activeDirective
    );

    let logBuffer = directorLogBuffers.get(chatId);
    if (!logBuffer) {
      logBuffer = await storage.getDirectorLogs(chatId);
    }
    logBuffer.push(directorEntry);
    if (logBuffer.length > 20) {
      logBuffer = logBuffer.slice(logBuffer.length - 20);
    }
    directorLogBuffers.set(chatId, logBuffer);
    await storage.saveDirectorLogs(chatId, logBuffer);

    spindle.sendToFrontend({
      type: "vn_director_log",
      log: directorEntry,
    });

    if (effectiveGenId) {
      injectedDirectives.delete(`${chatId}:${effectiveGenId}`);
    }

    const prose = extractProse(targetMessage.content);
    const presentation = await resolver.buildPresentationState(
      chatId,
      targetMessage.id || "msg_latest",
      prose,
      cumulativeLedger,
      characterId
    );

    if (bplotResult.hasBPlotNotification) {
      presentation.hasBPlotNotification = true;
    }

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
        hasLedger: Boolean(rawLedger || rawToon || delta),
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
spindle.on("GENERATION_STARTED", (payload: GenerationStartedPayloadDTO) => {
  const { chatId, generationId } = payload || {};
  if (!chatId || !generationId) return;

  const previousGenId = activeGenerationIds.get(chatId);
  if (previousGenId && previousGenId !== generationId) {
    pendingCommits.delete(`${chatId}:${previousGenId}`);
    injectedDirectives.delete(`${chatId}:${previousGenId}`);
    spindle.log.info(`[LumiVN] Discarded uncommitted state from superseded generation ${previousGenId} on chat ${chatId}`);
  }
  activeGenerationIds.set(chatId, generationId);
});

spindle.on("GENERATION_STOPPED", (payload: GenerationStoppedPayloadDTO) => {
  const { chatId, generationId } = payload || {};
  if (!chatId || !generationId) return;

  const commitKey = `${chatId}:${generationId}`;
  pendingCommits.delete(commitKey);
  injectedDirectives.delete(commitKey);
  if (activeGenerationIds.get(chatId) === generationId) {
    activeGenerationIds.delete(chatId);
  }
  spindle.log.info(`[LumiVN] Discarded staged commit for stopped generation ${generationId}`);
});

spindle.on("GENERATION_ENDED", async (payload: GenerationEndedPayloadDTO) => {
  const { chatId, generationId, error } = payload || {};
  if (!chatId) return;

  if (error) {
    if (generationId) {
      pendingCommits.delete(`${chatId}:${generationId}`);
      injectedDirectives.delete(`${chatId}:${generationId}`);
    }
    if (activeGenerationIds.get(chatId) === generationId) {
      activeGenerationIds.delete(chatId);
    }
    spindle.log.warn(`[LumiVN] Generation ${generationId} failed with error (${error}), discarded pending commits.`);
    return;
  }

  if (generationId && activeGenerationIds.get(chatId) === generationId) {
    activeGenerationIds.delete(chatId);
  }

  if (!isStageOpen) return;
  if (activeVnChats.has(chatId) || activeVnChats.size === 0) {
    await processChatTurn(chatId, payload.messageId, payload.content, false, generationId);
  }
});

spindle.on("MESSAGE_SWIPED", async (payload: MessageSwipedPayloadDTO) => {
  if (!isStageOpen) return;
  if (payload?.chatId && (activeVnChats.has(payload.chatId) || activeVnChats.size === 0)) {
    await processChatTurn(payload.chatId, payload.message?.id);
  }
});

spindle.on("SWIPE_EDITED", async (payload: SwipeEditedPayloadDTO) => {
  if (!isStageOpen) return;
  if (payload?.chatId && (activeVnChats.has(payload.chatId) || activeVnChats.size === 0)) {
    await processChatTurn(payload.chatId, payload.message?.id);
  }
});

const spindleAny = spindle as any;
if (typeof spindleAny.on === "function") {
  spindleAny.on("MESSAGE_EDITED", async (payload: { chatId?: string; messageId?: string }) => {
    if (!isStageOpen) return;
    if (payload?.chatId && (activeVnChats.has(payload.chatId) || activeVnChats.size === 0)) {
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
    case "vn_stage_opened": {
      isStageOpen = true;
      const cid = String(payload.chatId || "");
      if (cid) activeVnChats.add(cid);
      break;
    }

    case "vn_stage_closed": {
      const cid = String(payload.chatId || "");
      if (cid) activeVnChats.delete(cid);
      if (activeVnChats.size === 0) isStageOpen = false;
      break;
    }

    case "vn_get_state":
    case "vn_init": {
      isStageOpen = true;
      const chatId = await resolveEffectiveChatId(String(payload.chatId || ""));
      if (chatId) {
        activeVnChats.add(chatId);
        await processChatTurn(chatId, undefined, undefined, true);
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

    case "vn_unfold_dossier": {
      const chatId = await resolveEffectiveChatId(String(payload.chatId || ""));
      const actorId = String(payload.actorId || "");
      const actorName = String(payload.actorName || actorId);
      if (!chatId || !actorId) break;

      const state = (await storage.getChatState(chatId)) || { scene: { place: "default" }, actors: {} };
      spindle.sendToFrontend({ type: "vn_log", message: `Unfolding backstory and dossier for ${actorName}...`, level: "action" });

      try {
        const partialDossier = await generateCharacterDossier(spindle, actorId, actorName, state, chatId);
        if (!state.actors) state.actors = {};
        state.actors[actorId] = {
          ...(state.actors[actorId] || {}),
          ...partialDossier,
          appearance: { ...(state.actors[actorId]?.appearance || {}), ...(partialDossier.appearance || {}) },
          combat: { ...(state.actors[actorId]?.combat || {}), ...(partialDossier.combat || {}) },
          life_model: { ...(state.actors[actorId]?.life_model || {}), ...(partialDossier.life_model || {}) },
          passions: { ...(state.actors[actorId]?.passions || {}), ...(partialDossier.passions || {}) },
          profile: { ...(state.actors[actorId]?.profile || {}), ...(partialDossier.profile || {}) },
          agency: { ...(state.actors[actorId]?.agency || {}), ...(partialDossier.agency || {}) },
          knowledge: { ...(state.actors[actorId]?.knowledge || {}), ...(partialDossier.knowledge || {}) },
        };
        await storage.saveChatState(chatId, state);
        spindle.sendToFrontend({ type: "vn_state", ledger: state });
        spindle.sendToFrontend({ type: "vn_log", message: `Dossier for ${actorName} complete!`, level: "action" });
      } catch (err: any) {
        spindle.sendToFrontend({ type: "vn_error", error: `Failed to unfold dossier: ${String(err?.message || err)}` });
      }
      break;
    }

    case "vn_skip_time": {
      const chatId = await resolveEffectiveChatId(String(payload.chatId || ""));
      const minutes = Number(payload.minutes || 60);
      const sleep = Boolean(payload.sleep);
      if (!chatId) break;

      const state = (await storage.getChatState(chatId)) || { scene: { place: "default" }, actors: {} };
      state.clock = advanceClock(state.clock, minutes, sleep);
      if (state.actors) {
        state.actors = updateActorLocationsByRoutines(state.actors, state.clock.t || "12:00", state.clock.phase || "Day");
      }
      await storage.saveChatState(chatId, state);
      spindle.sendToFrontend({ type: "vn_state", ledger: state });
      spindle.sendToFrontend({ type: "vn_log", message: `Time advanced to ${state.clock.date}, ${state.clock.t} (${state.clock.phase})`, level: "action" });
      break;
    }

    case "vn_scout_places": {
      const chatId = await resolveEffectiveChatId(String(payload.chatId || ""));
      const placeId = String(payload.placeId || "");
      if (!chatId) break;

      const state = (await storage.getChatState(chatId)) || { scene: { place: "default" }, actors: {} };
      const currentPlace = placeId || state.scene?.place || "local:room";
      spindle.sendToFrontend({ type: "vn_log", message: `Scouting surrounding areas from ${currentPlace}...`, level: "action" });

      try {
        const newPlaces = await generateSurroundingPlaces(spindle, currentPlace, state);
        if (!state.places) state.places = {};
        state.places = { ...state.places, ...newPlaces };
        await storage.saveChatState(chatId, state);
        spindle.sendToFrontend({ type: "vn_state", ledger: state });
        spindle.sendToFrontend({ type: "vn_log", message: `Discovered ${Object.keys(newPlaces).length} connected places!`, level: "action" });
      } catch (err: any) {
        spindle.sendToFrontend({ type: "vn_error", error: `Failed to scout places: ${String(err?.message || err)}` });
      }
      break;
    }

    case "vn_simulate_offscreen": {
      const chatId = await resolveEffectiveChatId(String(payload.chatId || ""));
      if (!chatId) break;

      const state = (await storage.getChatState(chatId)) || { scene: { place: "default" }, actors: {} };
      spindle.sendToFrontend({ type: "vn_log", message: `Simulating offscreen cast movements and rumors...`, level: "action" });

      try {
        const sim = await simulateOffscreenMoves(spindle, state);
        if (!Array.isArray(state.bulletins)) state.bulletins = [];
        state.bulletins.unshift(sim.bulletin);

        if (sim.relationUpdates && state.actors) {
          for (const upd of sim.relationUpdates) {
            if (state.actors[upd.from]) {
              const rels = state.actors[upd.from].relations || {};
              const cur = (rels[upd.to] as any)?.affinity ?? 50;
              rels[upd.to] = { ...(rels[upd.to] || {}), affinity: Math.min(100, cur + upd.affinityDelta) };
              state.actors[upd.from].relations = rels;
            }
          }
        }
        await storage.saveChatState(chatId, state);
        spindle.sendToFrontend({ type: "vn_state", ledger: state });
        spindle.sendToFrontend({ type: "vn_log", message: `Offscreen move recorded: "${sim.bulletin.title}"`, level: "action" });
      } catch (err: any) {
        spindle.sendToFrontend({ type: "vn_error", error: `Failed offscreen simulation: ${String(err?.message || err)}` });
      }
      break;
    }

    case "vn_gift_item": {
      const chatId = await resolveEffectiveChatId(String(payload.chatId || ""));
      const actorId = String(payload.actorId || "");
      const itemName = String(payload.itemName || "");
      if (!chatId || !actorId || !itemName) break;

      const state = (await storage.getChatState(chatId)) || { scene: { place: "default" }, actors: {} };
      const res = giftItem(state, actorId, itemName);
      if (res.success) {
        await storage.saveChatState(chatId, res.state);
        spindle.sendToFrontend({ type: "vn_state", ledger: res.state });
        spindle.sendToFrontend({ type: "vn_log", message: res.message, level: "action" });
      } else {
        spindle.sendToFrontend({ type: "vn_error", error: res.message });
      }
      break;
    }

    case "vn_search_room": {
      const chatId = await resolveEffectiveChatId(String(payload.chatId || ""));
      const placeId = String(payload.placeId || "");
      if (!chatId) break;

      const state = (await storage.getChatState(chatId)) || { scene: { place: "default" }, actors: {} };
      const currentPlace = placeId || state.scene?.place || "current_room";
      const res = snoopRoom(state, currentPlace);
      await storage.saveChatState(chatId, res.state);
      spindle.sendToFrontend({ type: "vn_state", ledger: res.state });
      spindle.sendToFrontend({ type: "vn_log", message: res.message, level: "action" });
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

    case "vn_get_director_settings": {
      const settings = await storage.getDirectorSettings();
      spindle.sendToFrontend({ type: "vn_director_settings", settings });
      break;
    }

    case "vn_save_director_settings": {
      const settings = payload.settings as DirectorSettings;
      if (settings) {
        await storage.saveDirectorSettings(settings);
        if (typeof (spindle as any).toast?.success === "function") {
          (spindle as any).toast.success("Director prompt saved");
        }
        spindle.sendToFrontend({ type: "vn_director_settings", settings });
        spindle.sendToFrontend({
          type: "vn_log",
          message: "Director prompt and scene notes saved.",
          level: "info",
        });
      }
      break;
    }

    case "vn_get_director_logs": {
      const chatId = await resolveEffectiveChatId(String(payload.chatId || ""));
      if (chatId) {
        let logs = directorLogBuffers.get(chatId);
        if (!logs) {
          logs = await storage.getDirectorLogs(chatId);
          directorLogBuffers.set(chatId, logs);
        }
        spindle.sendToFrontend({
          type: "vn_director_logs",
          chatId,
          logs,
        });
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
