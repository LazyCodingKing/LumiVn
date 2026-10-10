# LumiVN Engine Codebase & Documentation

This document aggregates all source code, configuration, tests, and documentation files of the LumiVN engine repository for ingestion into NotebookLM.

## Table of Contents

- [.gitignore](#-gitignore)
- [bun.lock](#bun-lock)
- [package.json](#package-json)
- [spindle.json](#spindle-json)
- [src/backend.ts](#src-backend-ts)
- [src/backend/asset-resolver.ts](#src-backend-asset-resolver-ts)
- [src/backend/default-rules.ts](#src-backend-default-rules-ts)
- [src/backend/director.ts](#src-backend-director-ts)
- [src/backend/ledger-parser.ts](#src-backend-ledger-parser-ts)
- [src/backend/mvu-evaluator.ts](#src-backend-mvu-evaluator-ts)
- [src/backend/storage.ts](#src-backend-storage-ts)
- [src/backend/toon-parser.ts](#src-backend-toon-parser-ts)
- [src/frontend.ts](#src-frontend-ts)
- [src/frontend/hud/menu-bar.ts](#src-frontend-hud-menu-bar-ts)
- [src/frontend/hud/tab-bplots.ts](#src-frontend-hud-tab-bplots-ts)
- [src/frontend/hud/tab-characters.ts](#src-frontend-hud-tab-characters-ts)
- [src/frontend/hud/tab-diagnostics.ts](#src-frontend-hud-tab-diagnostics-ts)
- [src/frontend/hud/tab-inventory.ts](#src-frontend-hud-tab-inventory-ts)
- [src/frontend/hud/tab-journal.ts](#src-frontend-hud-tab-journal-ts)
- [src/frontend/hud/tab-map.ts](#src-frontend-hud-tab-map-ts)
- [src/frontend/hud/tab-phone.ts](#src-frontend-hud-tab-phone-ts)
- [src/frontend/hud/tab-scene.ts](#src-frontend-hud-tab-scene-ts)
- [src/frontend/hud/tab-stats.ts](#src-frontend-hud-tab-stats-ts)
- [src/frontend/hud/tab-wardrobe.ts](#src-frontend-hud-tab-wardrobe-ts)
- [src/frontend/stage/audio-player.ts](#src-frontend-stage-audio-player-ts)
- [src/frontend/stage/backlog.ts](#src-frontend-stage-backlog-ts)
- [src/frontend/stage/beat-splitter.ts](#src-frontend-stage-beat-splitter-ts)
- [src/frontend/stage/choice-modal.ts](#src-frontend-stage-choice-modal-ts)
- [src/frontend/stage/dialogue-box.ts](#src-frontend-stage-dialogue-box-ts)
- [src/frontend/stage/overlay.ts](#src-frontend-stage-overlay-ts)
- [src/frontend/stage/particles.ts](#src-frontend-stage-particles-ts)
- [src/frontend/stage/rich-text.ts](#src-frontend-stage-rich-text-ts)
- [src/frontend/stage/sprite-transform.ts](#src-frontend-stage-sprite-transform-ts)
- [src/frontend/stage/staging.ts](#src-frontend-stage-staging-ts)
- [src/frontend/stage/theme.ts](#src-frontend-stage-theme-ts)
- [src/frontend/stage/tts-engine.ts](#src-frontend-stage-tts-engine-ts)
- [src/frontend/studio/diagnostics-drawer.ts](#src-frontend-studio-diagnostics-drawer-ts)
- [src/frontend/utils/diag-bus.ts](#src-frontend-utils-diag-bus-ts)
- [src/shared/text-effects.ts](#src-shared-text-effects-ts)
- [src/shared/types.ts](#src-shared-types-ts)
- [test/director-and-lifecycle.test.ts](#test-director-and-lifecycle-test-ts)
- [test/engine.test.ts](#test-engine-test-ts)
- [test/hud-tabs.test.ts](#test-hud-tabs-test-ts)
- [test/toon-and-rulebook.test.ts](#test-toon-and-rulebook-test-ts)
- [tsconfig.json](#tsconfig-json)

---

<a id="-gitignore"></a>
## File: `.gitignore`

**Description**: Source file `.gitignore` in LumiVN Visual Novel Engine.

```text
node_modules/
.DS_Store

```

---

<a id="bun-lock"></a>
## File: `bun.lock`

**Description**: Source file `bun.lock` in LumiVN Visual Novel Engine.

```text
{
  "lockfileVersion": 2,
  "configVersion": 1,
  "workspaces": {
    "": {
      "name": "lumivn_engine",
      "dependencies": {
        "js-yaml": "^4.1.0",
      },
      "devDependencies": {
        "@types/js-yaml": "^4.0.9",
        "bun-types": "^1.4.2",
        "lumiverse-spindle-types": "0.6.36",
        "typescript": "^5.9.0",
      },
    },
  },
  "packages": {
    "@types/js-yaml": ["@types/js-yaml@4.0.9", "", {}, "sha512-k4MGaQl5TGo/iipqb2UDG2UwjXziSWkh0uysQelTlJpX1qGlpUZYm8PnO4DxG1qBomtJUdYJ6qR6xdIah10JLg=="],

    "@types/node": ["@types/node@26.6.4", "", { "dependencies": { "undici-types": "~8.9.0" } }, "sha512-ldVPDCzj7fsaGZrLB0NuHuTvJcsNasysBAqMolr/cgxrLd1xbqxIr3XJiPnHHJUCxj5sNF1vnRj9aWnrVh5Jcg=="],

    "argparse": ["argparse@2.0.1", "", {}, "sha512-8+9WqebbFzpX9OR+Wa6O29asIogeRMzcGtAINdpMHHyAg10f05aSFVBbcEqGf/PXw1EjAZ+q2/bEBg3DvurK3Q=="],

    "bun-types": ["bun-types@1.4.2", "", { "dependencies": { "@types/node": "*" } }, "sha512-bxV1FgK7yBIzjRe5zBozIM4Bem11ZJcCXSrjWRG3YWLt8yFDePu4cLjpebO8OvPeIE9trbyPF4fuj3Cia4Fj3w=="],

    "js-yaml": ["js-yaml@4.3.2", "", { "dependencies": { "argparse": "^2.0.1" }, "bin": { "js-yaml": "bin/js-yaml.js" } }, "sha512-SFNOvSJ+Dgf/9An904Yx+CgSlIPCkIpao4qo51lpee25TIRejdH3rhR4EZMGoNx3/TP3O+wzWuiTFl4sqbltzA=="],

    "lumiverse-spindle-types": ["lumiverse-spindle-types@0.6.36", "", {}, "sha512-ngiQdsXOpngvpW5f0SHV3mZ0Gh+xHgcjZbeGmlmbUqplUSyQ0QlcF78VCodYTT5ZlhIWDGNRHcLuFEGtYtoKBw=="],

    "typescript": ["typescript@5.9.3", "", { "bin": { "tsc": "bin/tsc", "tsserver": "bin/tsserver" } }, "sha512-jl1vZzPDinLr9eUt3J/t7V6FgNEw9QjvBPdysz9KfQDD41fQrC2Y4vKQdiaUpFT4bXlb1RHhLpp8wtm6M5TgSw=="],

    "undici-types": ["undici-types@8.9.0", "", {}, "sha512-KTDyRTYX8sWmKXAikPHHSyc63CRPETMctyjKFupcC6OBLXT3xsN0e9aF7m+mIXutFWpUXuedtowG7iLOzp0kQg=="],
  }
}

```

---

<a id="package-json"></a>
## File: `package.json`

**Description**: Source file `package.json` in LumiVN Visual Novel Engine.

```json
{
  "name": "lumivn_engine",
  "version": "2.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build:backend": "bun build ./src/backend.ts --outdir ./dist --target bun --format esm",
    "build:frontend": "bun build ./src/frontend.ts --outdir ./dist --target browser --format esm",
    "build": "bun run build:backend && bun run build:frontend",
    "typecheck": "tsc --noEmit",
    "verify": "bun run typecheck && bun run build"
  },
  "dependencies": {
    "js-yaml": "^4.1.0"
  },
  "devDependencies": {
    "@types/js-yaml": "^4.0.9",
    "bun-types": "^1.4.2",
    "lumiverse-spindle-types": "0.6.36",
    "typescript": "^5.9.0"
  }
}

```

---

<a id="spindle-json"></a>
## File: `spindle.json`

**Description**: Source file `spindle.json` in LumiVN Visual Novel Engine.

```json
{
  "version": "2.0.0",
  "name": "LumiVN Interactive Studio",
  "identifier": "lumivn_engine",
  "author": "Raja",
  "github": "https://github.com/raja/lumivn_engine",
  "homepage": "https://github.com/raja/lumivn_engine",
  "description": "High-efficiency Ren'Py visual novel stage and living-world simulator.",
  "permissions": [
    "ui_panels",
    "app_manipulation",
    "chat_mutation",
    "generation",
    "images",
    "chats",
    "characters",
    "interceptor"
  ],
  "requested_capabilities": [
    "base64_decode"
  ],
  "interceptorTimeoutMs": 10000,
  "entry_backend": "dist/backend.js",
  "entry_frontend": "dist/frontend.js",
  "minimum_lumiverse_version": "1.1.6"
}

```

---

<a id="src-backend-ts"></a>
## File: `src/backend.ts`

**Description**: Source file `src/backend.ts` in LumiVN Visual Novel Engine.

```typescript
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
import { evaluateMvuLedgerDelta } from "./backend/mvu-evaluator.js";
import type { AssetManifest, LedgerData, DirectorSettings, DirectorLogEntry, StatRulesSettings } from "./shared/types.js";

declare const spindle: SpindleAPI;

const storage = new StorageManager(spindle);
const resolver = new AssetResolver(spindle, storage);

let lastActiveChatId: string | null = null;

// View Registry: Track active visual novel stage presence per chat
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
      // Memory cached access first to guarantee zero-overhead synchronous execution
      const cached = storage.getCachedChatState(cid);
      if (cached) return cached;
      return (await storage.getChatState(cid)) || { scene: { place: "default" }, actors: {} };
    },
    async () => storage.getDirectorSettings(),
    (key, directive) => injectedDirectives.set(key, directive)
  );
}

if (typeof (spindle as any).registerInterceptor === "function") {
  (spindle as any).registerInterceptor(handleInterceptor, 50);
  spindle.log.info("[LumiVN] Living World Director interceptor registered at priority 50.");
}

function onHostChatSwitched(chatId: string | null) {
  if (!chatId) return;
  lastActiveChatId = chatId;
  spindle.log.info("[LumiVN] Active chat switched to: " + chatId);
  if (activeVnChats.has(chatId)) {
    void processChatTurn(chatId, undefined, undefined, true);
  }
}

const spindleAnyObj = spindle as any;
if (typeof spindleAnyObj.on === "function") {
  spindleAnyObj.on("CHAT_SWITCHED", (payload: unknown) => {
    const candidate = payload && typeof payload === "object" ? (payload as { chatId?: unknown }) : {};
    if (typeof candidate.chatId === "string" && candidate.chatId) {
      onHostChatSwitched(candidate.chatId);
    }
  });

  spindleAnyObj.on("CHAT_CHANGED", (payload: unknown) => {
    const candidate = payload && typeof payload === "object" ? (payload as { chat?: { id?: unknown }; chatId?: unknown }) : {};
    const cid = (typeof candidate.chat?.id === "string" ? candidate.chat.id : null) ||
                (typeof candidate.chatId === "string" ? candidate.chatId : null);
    if (cid) {
      onHostChatSwitched(cid);
    }
  });

  spindleAnyObj.on("CHAT_FORKED", (payload: unknown) => {
    const candidate = payload && typeof payload === "object" ? (payload as { forkedChatId?: unknown; chat?: { id?: unknown } }) : {};
    const cid = (typeof candidate.forkedChatId === "string" ? candidate.forkedChatId : null) ||
                (typeof candidate.chat?.id === "string" ? candidate.chat.id : null);
    if (cid) {
      onHostChatSwitched(cid);
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

// ── Command Palette Commands ──
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

async function processChatTurn(
  chatId: string,
  messageId?: string,
  overrideContent?: string,
  force = false,
  generationId?: string,
  swipeId?: string | number
): Promise<void> {
  if (!chatId) return;

  // View-Gating: Guard background chats when VN stage is not active for this chat
  if (!activeVnChats.has(chatId) && !force) return;

  lastActiveChatId = chatId;

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

    if (overrideContent) {
      targetMessage = {
        id: messageId || `msg_${Date.now()}`,
        role: "assistant",
        content: overrideContent,
        created_at: new Date().toISOString(),
      } as unknown as ChatMessageDTO;
    } else {
      // Bounded Message Ingestion: limit to 5 messages to prevent event-loop stalls
      let messages: ChatMessageDTO[] = [];
      try {
        messages = await (spindle.chat as any).getMessages(chatId, { limit: 5 });
      } catch {}
      const boundedMessages = Array.isArray(messages) ? messages : [];

      // Find the latest assistant message
      for (let i = boundedMessages.length - 1; i >= 0; i--) {
        const m = boundedMessages[i];
        if (m && ((m as any).role === "assistant" || !m.is_user)) {
          targetMessage = m;
          break;
        }
      }
    }

    // Load state isolated by turn/swipe snapshot or active chat snapshot
    let cumulativeLedger = await storage.getChatState(chatId, targetMessage?.id, swipeId);

    // If chat is new / empty / has no assistant message yet:
    if (!targetMessage || !targetMessage.content) {
      if (!cumulativeLedger) {
        cumulativeLedger = { scene: { place: "default" }, actors: {} };
      }
      const presentation = await resolver.buildPresentationState(
        chatId,
        "msg_init",
        "",
        cumulativeLedger,
        characterId
      );
      spindle.sendToFrontend({
        type: "vn_state",
        state: presentation,
      });
      return;
    }

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
    } catch {
      // Ignore malformed JSON chunks
    }

    // Extract State Delta: 1. State Details Block (YAML), 2. TOON format, 3. MVU Quiet LLM, 4. Prose Heuristics Fallback
    const statRulesSettings = await storage.getStatRulesSettings();
    const rawLedger = extractLedgerRaw(targetMessage.content);
    const rawToon = rawLedger ? null : extractToonRaw(targetMessage.content);
    const prevLedger: LedgerData | null = cumulativeLedger
      ? JSON.parse(JSON.stringify(cumulativeLedger))
      : null;

    let delta: Partial<LedgerData> | null = null;
    if (rawLedger) {
      delta = parseLedgerYaml(rawLedger);
    } else if (rawToon) {
      delta = parseToonDelta(rawToon);
    } else if (statRulesSettings.enabled && statRulesSettings.mode === "mvu_quiet") {
      delta = await evaluateMvuLedgerDelta(
        spindle,
        chatId,
        extractProse(targetMessage.content),
        cumulativeLedger || { scene: { place: "default" }, actors: {} },
        statRulesSettings
      );
    } else {
      const prose = extractProse(targetMessage.content);
      delta = inferProseEmotionDelta(prose, characterId || "char");
    }

    if (delta) {
      cumulativeLedger = deepMergeLedger(cumulativeLedger, delta);
    } else if (!cumulativeLedger) {
      cumulativeLedger = deepMergeLedger(null, {});
    }

    // B-Plot State Monitor & Collision Roster Promotion
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

    // Two-Stage Commit Lifecycle: Staged until successful generation completion
    const effectiveGenId = generationId || activeGenerationIds.get(chatId);
    const commitKey = effectiveGenId ? `${chatId}:${effectiveGenId}` : null;
    if (commitKey) {
      pendingCommits.set(commitKey, cumulativeLedger);
    }

    // Persist active snapshot and isolated turn branch
    await storage.saveChatState(chatId, cumulativeLedger, targetMessage.id, swipeId);

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
spindle.on("GENERATION_STARTED", async (payload: GenerationStartedPayloadDTO) => {
  const { chatId, generationId } = payload || {};
  if (!chatId || !generationId) return;

  lastActiveChatId = chatId;

  const previousGenId = activeGenerationIds.get(chatId);
  if (previousGenId && previousGenId !== generationId) {
    pendingCommits.delete(`${chatId}:${previousGenId}`);
    injectedDirectives.delete(`${chatId}:${previousGenId}`);
    spindle.log.info(`[LumiVN] Discarded uncommitted state from superseded generation ${previousGenId} on chat ${chatId}`);
  }
  activeGenerationIds.set(chatId, generationId);

  // Notify frontend if visual novel stage is open for this chat
  if (activeVnChats.has(chatId)) {
    try {
      const messages: any[] = await (spindle.chat as any).getMessages(chatId, { limit: 5 });
      const bounded = Array.isArray(messages) ? messages : [];
      let latestUserMsg: any = null;
      for (let i = bounded.length - 1; i >= 0; i--) {
        const m = bounded[i];
        if (m && (m.role === "user" || m.is_user)) {
          latestUserMsg = m;
          break;
        }
      }
      if (latestUserMsg && latestUserMsg.content) {
        const speaker = latestUserMsg.name || "You";
        spindle.sendToFrontend({
          type: "vn_user_message",
          chatId,
          speaker,
          text: latestUserMsg.content,
        });
      } else {
        spindle.sendToFrontend({ type: "vn_generating", chatId });
      }
    } catch {
      spindle.sendToFrontend({ type: "vn_generating", chatId });
    }
  }
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

  // View-Gating: abort in < 1ms if stage not open for this chat
  if (!activeVnChats.has(chatId)) return;
  await processChatTurn(chatId, payload.messageId, payload.content, false, generationId);
});

spindle.on("MESSAGE_SWIPED", async (payload: MessageSwipedPayloadDTO) => {
  const cid = payload?.chatId || lastActiveChatId;
  // View-Gating: abort in < 1ms if stage not active for this chat
  if (!cid || !activeVnChats.has(cid)) return;
  const swipeIndex = (payload as any)?.swipeIndex ?? (payload as any)?.swipe_index;
  await processChatTurn(cid, payload.message?.id, undefined, false, undefined, swipeIndex);
});

spindle.on("SWIPE_EDITED", async (payload: SwipeEditedPayloadDTO) => {
  const cid = payload?.chatId || lastActiveChatId;
  // View-Gating: abort in < 1ms if stage not active for this chat
  if (!cid || !activeVnChats.has(cid)) return;
  const swipeIndex = (payload as any)?.swipeIndex ?? (payload as any)?.swipe_index;
  await processChatTurn(cid, payload.message?.id, undefined, false, undefined, swipeIndex);
});

const spindleAny = spindle as any;
if (typeof spindleAny.on === "function") {
  spindleAny.on("MESSAGE_EDITED", async (payload: { chatId?: string; messageId?: string }) => {
    const cid = payload?.chatId || lastActiveChatId;
    if (!cid || !activeVnChats.has(cid)) return;
    await processChatTurn(cid, payload.messageId);
  });
  spindleAny.on("MESSAGE_DELETED", async (payload: { chatId?: string }) => {
    const cid = payload?.chatId || lastActiveChatId;
    if (!cid || !activeVnChats.has(cid)) return;
    await processChatTurn(cid);
  });
}

// ── Frontend Message Bridge ──
spindle.onFrontendMessage(async (msg: unknown, senderUserId?: string) => {
  const payload = msg as Record<string, unknown>;
  if (!payload || typeof payload !== "object") return;

  const type = String(payload.type);

  switch (type) {
    case "vn_stage_opened": {
      const cid = String(payload.chatId || "");
      if (cid) {
        activeVnChats.add(cid);
        lastActiveChatId = cid;
      }
      break;
    }

    case "vn_stage_closed": {
      const cid = String(payload.chatId || "");
      if (cid) {
        activeVnChats.delete(cid);
      } else if (lastActiveChatId) {
        activeVnChats.delete(lastActiveChatId);
      }
      break;
    }

    case "vn_get_state":
    case "vn_init": {
      const chatId = await resolveEffectiveChatId(String(payload.chatId || ""));
      if (chatId) {
        activeVnChats.add(chatId);
        lastActiveChatId = chatId;
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

      // Immediately echo user action to frontend dialogue box under "You"
      spindle.sendToFrontend({
        type: "vn_user_message",
        chatId,
        speaker: "You",
        text: actionText,
      });

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

    case "vn_get_stat_rules_settings": {
      const settings = await storage.getStatRulesSettings();
      spindle.sendToFrontend({ type: "vn_stat_rules_settings", settings });
      break;
    }

    case "vn_save_stat_rules_settings": {
      const settings = payload.settings as StatRulesSettings;
      if (settings) {
        await storage.saveStatRulesSettings(settings);
        spindle.sendToFrontend({ type: "vn_stat_rules_settings", settings });
        spindle.sendToFrontend({
          type: "vn_log",
          message: "Stat rules and ledger schema updated.",
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
        const directUrl = typeof payload.url === "string" ? payload.url : "";
        const dataUrl = typeof payload.dataUrl === "string" ? payload.dataUrl : "";
        const chatId = String(payload.chatId || "");

        // Format compound place key if scope is present
        const finalPlaceKey = scope ? `${scope}:${placeId}` : placeId;

        let finalUrl = directUrl;

        // Fallback: If no direct URL provided, decode dataUrl and upload through spindle.images
        if (!finalUrl && dataUrl) {
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
          finalUrl = upload.url;
        }

        if (!finalUrl) throw new Error("No image URL or data provided");

        const manifest = await storage.getManifest();

        if (category === "places" && finalPlaceKey) {
          manifest.places[finalPlaceKey] = finalUrl;
        } else if (category === "characters" && actorId) {
          if (!manifest.characters[actorId]) manifest.characters[actorId] = {};
          if (!manifest.characters[actorId].outfits) manifest.characters[actorId].outfits = {};
          if (!manifest.characters[actorId].outfits[outfit]) manifest.characters[actorId].outfits[outfit] = {};
          manifest.characters[actorId].outfits[outfit][expression] = finalUrl;
        } else if (category === "actions" && actorId && actionName) {
          if (!manifest.characters[actorId]) manifest.characters[actorId] = {};
          if (!manifest.characters[actorId].actions) manifest.characters[actorId].actions = {};
          manifest.characters[actorId].actions[actionName] = finalUrl;
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

---

<a id="src-backend-asset-resolver-ts"></a>
## File: `src/backend/asset-resolver.ts`

**Description**: Source file `src/backend/asset-resolver.ts` in LumiVN Visual Novel Engine.

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

---

<a id="src-backend-default-rules-ts"></a>
## File: `src/backend/default-rules.ts`

**Description**: Source file `src/backend/default-rules.ts` in LumiVN Visual Novel Engine.

```typescript
export const DEFAULT_STAT_RULES = `<stat_rules>
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
</stat_rules>`;

export const DEFAULT_LEDGER_PROMPT = `LEDGER (after prose; authoritative world state):
1. TURN 1: emit baseline dossier (appearance, money, combat, life_model, outfit, inventory, profile, relations).
2. AFTER TURN 1 = COMPACT DELTA, ZERO STATIC LEAK. The extension permanently stores and merges state; NEVER re-emit unchanged fields.
  * Omit ## World and ## Places unless location or rules shifted (\`clock\` is still always emitted).
  * \`user\`: delta only; omit unchanged appearance, combat, life_model.
  * Passions: moved keys only (\`passions: { anger: 20 }\`).
  * Combat: omit unless HP/MP moved (\`combat: { hp: "80/100" }\`).
  * Outfit: changed slot only (\`outfit: { top: "none" }\`); never re-emit unchanged slots.
  * Inventory: only the hand slot or carried prop that moved.
  * Journal: only the new event(s) from THIS reply (\`EVT-n\`); never reprint past records.
  * Actors with no state or gear shift this turn: omit dossier entirely.
3. Props exist in exactly one place (hand slot, container, or local \`places.resources\`); transfers are zero-sum.
4. Place keys MUST be \`<unique_scope_name>:<room>\` (e.g. \`tendo_residence:kitchen\`, \`nerima_high:classroom_2a\`) so backgrounds map without room-name collisions.
5. ALWAYS EMIT: clock, scene, roster, journal, open opportunities, bplots (\`id\` + changed fields only; ripple, status, due, carrier changes count as changed).

Always append this details block after prose:
<details><summary>📊 Ledger</summary>

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
  scope:place_id:
    function:
    traffic: 0-3
    privacy: 0-3
    visibility: 0-3
    access:
    norm:
    rhythm:
    resources: []
    population:
    hazards:
    barriers:
    affordances: []
    routes:
      - { to: "scope:place_id", minutes: 5 }
travel:
  - { actor: "", purpose: "", from: "", to: "", depart: "", eta: "", status: "" }
\`\`\`

## Roster

\`\`\`yaml
roster:
  - { id: "actor_id", name: "Display Name", lod: 3, status: "Active", loc: "scope:place_id", record: "full", tick: 1 }
\`\`\`

## Actor dossiers

COMBAT TABLE (Lv0..10; copy directly):
T1 HP 100-300 | MP 50-150 | PWR=AGI 15-45 (+20 HP, +10 MP, +3 stats/lv)
T2 HP 400-1000 | MP 200-500 | PWR=AGI 50-150 (+60 HP, +30 MP, +10 stats/lv)
T3 HP 1500-4500 | MP 800-2300 | PWR 200-650 | AGI 200-700 (+300 HP, +150 MP, +45 PWR, +50 AGI/lv)
T4 HP 6000-18000 | MP 3000-9000 | PWR 800-2300 | AGI 800-2600 (+1200 HP, +600 MP, +150 PWR, +180 AGI/lv)
T5 HP 25000-75000 | MP 15000-45000 | PWR 3000-9000 | AGI 3500-10500 (+5000 HP, +3000 MP, +600 PWR, +700 AGI/lv)
Rules: underwear: underwear_top, underwear_bottom (or \`none\`).

\`\`\`yaml
user:
  appearance: {age: , traits: , appeal: 0-100, style: , condition: }
  money: {in_hand: 0, in_bank: 0, currency: "$"}
  combat: {tier: 1-10, lv: 0-10, exp: "0/100", hp: "cur/max", mp: "cur/max", eff_pwr: , eff_agi: , pwr: , agi: , int: , talent: []}
  passions: { anger: 0, shame: 0, arousal: 0, fear: 0, stress: 0, pain: 0, exhaustion: 0, suspicion: 0, disgust: 0, sadness: 0, guilt: 0, joy: 10 }
  outfit: {top: , bottom: , underwear_top: , underwear_bottom: , shoes: , accessories: [], state: }
  inventory: {in_hand: {L: "Empty", R: "Empty"}, carried: [], room: [], room_location: ""}
    want_now: "explore area"
    

actor_id:
  name: "Actor Name"
  appearance: {age: , traits: , appeal: 0-100, style: , condition: }
  money: {in_hand: 0, in_bank: 0, currency: "$"}
  combat: {tier: 1-10, lv: 0-10, exp: "0/100", hp: "cur/max", mp: "cur/max", eff_pwr: , eff_agi: , pwr: , agi: , int: , talent: []}
  life_model: { orientation: "pansexual", romantic_history: "none", upbringing: "strict", family: [], occupation: "student", residence: "tendo_residence:room", routines: [["morning", "tea", "tendo_residence:kitchen", "07:00"]], worldview: "stoic", self_concept: "competent" }
  wounds: { physical: [], psychological: [] }
  trauma: []
  passions: { anger: 0, shame: 0, arousal: 0, fear: 0, stress: 10, pain: 0, exhaustion: 0, suspicion: 15, disgust: 0, sadness: 0, guilt: 0, joy: 5 }
  constraints: ""
  outfit: {top: , bottom: , underwear_top: , underwear_bottom: , shoes: , accessories: [], state: }
  inventory: {in_hand: {L: "Empty", R: "Empty"}, carried: [], room: [], room_location: ""}
 profile:
    public_roles: []
    dispositions: {risk: , assertiveness: , empathy: , impulse_control: , curiosity: , sociability: , status_sensitivity: , acquisitiveness: , persistence: }
    capabilities: {}
    values: []
    self_concept: []
    boundaries: []
    red_lines: []
    defense: ""
    blind_spot: ""
    tells: {lying: "", hurt: "", shame: ""}
    stress_default:
  state: {condition: , needs: {name: urgency}, affect: {valence: , arousal: , control: , episodes: []}, resources: {}}
  agency:
    goals: [id, intent, priority, commitment, deadline, cause, progress, status]
    plans: [goal, steps, now, preconditions, revisions]
    policies: [id, when, effects, strength, origin]
    commitments: []
    want_now: want (source, cost)
  relations:
    other_id: {affinity: 0, trust: 0, respect: 0, attraction: 0, grudge: 0, fear: 0, familiarity: 0, attachment: 0, loyalty: 0-100, sacrifice_willingness: 0-100, betrayal_threshold: 50, shared_secrets: [], leverage: [], grievances: [], obligations: []}
  knowledge:(Emit towards {{user}} and any newly introduced npcs when they are present in the scene)
    beliefs: [p, conf, source, basis, t]
    Opinion: []
    memories: [evt, interpretation, salience, imprint, with]
    expectations: [situation, expect, conf]
    grudges: [Any grudge or grievances towards them]
    secrets: [truth, knows, suspects, exposure, cover]
    Promises: [Any promises between each other]
    held_leverage: []
    presents_as: {audience: face}
    Recent Interaction:[]
Trigger:(Important memory from the past)
Current Status: []
Relationship Network:
  stats: {T, A, R, F, Fam, G, Integ, Stress, CAU, GRD, PRD, EMP, STB, BLD, RX, RC, Rig, Mask, MIS, WV, COMP}
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
## B-Plots

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

```

---

<a id="src-backend-director-ts"></a>
## File: `src/backend/director.ts`

**Description**: Source file `src/backend/director.ts` in LumiVN Visual Novel Engine.

```typescript
import type { LlmMessageDTO, InterceptorResultDTO } from "lumiverse-spindle-types";
import type { LedgerData, BPlot, DirectorSettings, DirectorLogEntry } from "../shared/types.js";
import { DEFAULT_DIRECTOR_SETTINGS } from "./storage.js";
import { encodeToonState } from "./toon-parser.js";

export const DIRECTOR_DIRECTIVES = DEFAULT_DIRECTOR_SETTINGS.systemPrompt;

export function extractChatId(context: unknown): string | null {
  if (!context || typeof context !== "object") return null;
  const ctx = context as Record<string, unknown>;
  if (typeof ctx.chatId === "string" && ctx.chatId.trim()) return ctx.chatId.trim();
  if (typeof ctx.chat_id === "string" && ctx.chat_id.trim()) return ctx.chat_id.trim();
  const chatObj = ctx.chat as Record<string, unknown> | undefined;
  if (typeof chatObj?.id === "string" && chatObj.id.trim()) return chatObj.id.trim();
  return null;
}

export function extractGenerationType(context: unknown): string | null {
  if (!context || typeof context !== "object") return null;
  const ctx = context as Record<string, unknown>;
  if (typeof ctx.generationType === "string" && ctx.generationType.trim()) {
    return ctx.generationType.trim();
  }
  return null;
}

export function resolveIdentityMacros(template: string, userName = "User", charName = "Character"): string {
  if (!template) return "";
  return template
    .replace(/\{\{user\}\}/gi, userName)
    .replace(/\{\{char\}\}/gi, charName);
}

export function formatDirectorDirective(
  settings: DirectorSettings,
  userName?: string,
  charName?: string
): string {
  let activeDirective = (settings.systemPrompt || "").trim();
  if (settings.userNotes && settings.userNotes.trim()) {
    const resolvedNotes = resolveIdentityMacros(settings.userNotes.trim(), userName, charName);
    activeDirective = activeDirective
      ? `${activeDirective}\n\n[Scene Notes & Guidance]\n${resolvedNotes}`
      : resolvedNotes;
  }
  return activeDirective;
}

export function formatLivingWorldContext(currentState: LedgerData): string {
  const clock = currentState.clock || {};
  const date = clock.date || "Day 1";
  const time = clock.t || "12:00";
  const place = currentState.scene?.place || "Current Location";

  const presentActors: string[] = [];
  const participants = Array.isArray(currentState.scene?.participants) ? currentState.scene.participants : [];
  const actors = currentState.actors || {};

  for (const [id, a] of Object.entries(actors)) {
    if (id.toLowerCase() === "user") continue;
    if (participants.includes(id) || !participants.length) {
      const name = a.name || id;
      const topPassion = a.passions
        ? Object.entries(a.passions).sort((x, y) => (y[1] ?? 0) - (x[1] ?? 0))[0]
        : undefined;
      const moodStr = topPassion && (topPassion[1] ?? 0) > 15 ? `${topPassion[0]} (${topPassion[1]})` : "composed";
      const attire = a.outfit?.top ? `${a.outfit.top}` : (a.outfit?.state || "casual");
      const want = a.agency?.want_now ? `wants: ${a.agency.want_now}` : "";
      const secret = Array.isArray((a.knowledge as any)?.secrets) && (a.knowledge as any).secrets[0]?.truth
        ? `secret: ${(a.knowledge as any).secrets[0].truth}`
        : "";
      const relToUser = (a.relations as any)?.["user"]?.affinity !== undefined
        ? `affinity: ${(a.relations as any)["user"].affinity}`
        : "";
      const details = [want, secret, relToUser].filter(Boolean).join(", ");
      presentActors.push(`${name} (attire: ${attire}, mood: ${moodStr}${details ? ` | ${details}` : ""})`);
    }
  }

  const user = actors["user"] || {};
  const userAttire = user.outfit?.top ? `${user.outfit.top} / ${user.outfit.bottom || ""}` : (user.outfit?.state || "casual");
  const inHand = user.inventory?.in_hand?.R || user.inventory?.in_hand?.L ? `held: ${[user.inventory?.in_hand?.R, user.inventory?.in_hand?.L].filter(Boolean).join(", ")}` : "";

  // Active B-Plots
  const activeBplots = (currentState.bplots || []).filter((b) => b.status !== "resolved").slice(0, 1);
  const bplotStr = activeBplots.length
    ? `Offscreen: ${activeBplots[0].who || "Distant parties"} (${activeBplots[0].doing || "active"}) [ripple ${activeBplots[0].ripple ?? 1}]`
    : "";

  return [
    `[LumiVN Living World Context]`,
    `⏰ Clock: ${date}, ${time} | Location: ${place}`,
    presentActors.length ? `👥 Present: ${presentActors.slice(0, 3).join("; ")}` : "",
    `👔 Player: ${userAttire}${inHand ? ` | ${inHand}` : ""}`,
    bplotStr ? `🎭 ${bplotStr}` : "",
  ].filter(Boolean).join("\n");
}

export async function evaluateDirectorInterceptor(
  messages: LlmMessageDTO[],
  context: unknown,
  getChatState: (chatId: string) => Promise<LedgerData | null>,
  getDirectorSettings?: () => Promise<DirectorSettings>,
  onInjectedDirective?: (key: string, directive: string) => void
): Promise<LlmMessageDTO[] | InterceptorResultDTO> {
  const chatId = extractChatId(context);
  const genType = extractGenerationType(context);
  const isDry = Boolean((context as any)?.dryRun || (context as any)?.isDryRun);

  // 1. Guard against quiet/background generations & dry runs
  if (!chatId || isDry || genType === "quiet") return messages;

  const settings = getDirectorSettings
    ? await getDirectorSettings()
    : DEFAULT_DIRECTOR_SETTINGS;

  if (!settings || !settings.enabled) return messages;

  // 2. Read latest chat state and roster
  const currentState = await getChatState(chatId);
  if (!currentState) return messages;

  let activeDirective = formatDirectorDirective(settings);
  if (!activeDirective) return messages;

  // Decorum validation scan
  const currentPlaceId = currentState.scene?.place;
  const currentPlace = currentPlaceId && currentState.places?.[currentPlaceId];
  const userDossier = currentState.actors?.["user"];
  if (currentPlace && userDossier?.outfit) {
    const norm = String(currentPlace.norm || "").toLowerCase();
    const privacy = Number(currentPlace.privacy ?? 0);
    const top = String(userDossier.outfit.top || "none").toLowerCase();
    const bottom = String(userDossier.outfit.bottom || "none").toLowerCase();
    const isUnderdressed = top === "none" || bottom === "none";
    if (privacy <= 1 && norm.includes("formal") && isUnderdressed) {
      activeDirective +=
        "\n[Director Guidance: {{user}} is visibly under-dressed for this public formal environment. Present NPCs must react to this breach before proceeding.]";
    }
  }

  // Active investigation alerts
  const investigations = currentState.world?.investigations;
  if (investigations && typeof investigations === "object") {
    for (const [auth, track] of Object.entries(investigations)) {
      if (track && typeof track === "object" && track.alert_level >= 1) {
        const cluesText =
          Array.isArray(track.clues) && track.clues.length > 0
            ? track.clues.join(", ")
            : "none";
        activeDirective += `\n[Director Alert: Investigation by ${
          track.authority || auth
        } active at Alert Level ${track.alert_level} targeting ${
          track.target_id || "suspect"
        }. Clues: ${cluesText}. Authorities and informants be vigilant.]`;
      }
    }
  }

  // Guard against duplicate injections
  if (messages.some((m) => typeof m.content === "string" && (m.content.includes(activeDirective) || m.content.includes("[LumiVN Living World Director Guidance]")))) {
    return messages;
  }

  const systemGuard = `[LumiVN Living World Director Guidance]
${activeDirective}

[OUTPUT FORMAT REQUIREMENT]
Line 1: Return the director JSON object (optionally inside <details><summary>🎬 Director</summary>...</details>):
{"director_note":"FIRST BEAT: ... WORLD: ... OFFSCREEN: ... PRESSURE: ... PRESENT: ... VOICE: ... TEXTURE: ... CANON: ... END ON: ...","thread_label":"<3-6 words thread title>"}

Follow immediately on Line 2 with natural narrative prose.`;

  // Cache injected directive
  const generationId = (context as any)?.generationId;
  if (onInjectedDirective) {
    if (generationId) onInjectedDirective(`${chatId}:${generationId}`, activeDirective);
    onInjectedDirective(chatId, activeDirective);
  }

  // 3. Directorial Guidance Block
  const directorBlock: LlmMessageDTO = {
    role: "system",
    content: systemGuard,
  };

  return {
    messages: [directorBlock, ...messages],
    breakdown: [{ messageIndex: 0, name: "LumiVN Director" }],
  };
}

export function computeDirectorImpactDiff(
  prevLedger: LedgerData | null,
  nextLedger: LedgerData,
  directive: string
): DirectorLogEntry {
  const worldChanges: string[] = [];
  const npcChanges: DirectorLogEntry["npcChanges"] = [];
  const mutations: string[] = [];

  // 1. World diff
  const prevTime = prevLedger?.clock?.t;
  const nextTime = nextLedger?.clock?.t;
  if (nextTime && nextTime !== prevTime) {
    worldChanges.push(`Clock advanced: ${prevTime || "start"} -> ${nextTime}`);
  }

  const prevPlace = prevLedger?.scene?.place;
  const nextPlace = nextLedger?.scene?.place;
  if (nextPlace && nextPlace !== prevPlace) {
    worldChanges.push(`Scene location moved: ${prevPlace || "initial"} -> ${nextPlace}`);
  }

  // B-Plots
  const prevBPlots = prevLedger?.bplots || [];
  const nextBPlots = nextLedger?.bplots || [];
  for (const nextBp of nextBPlots) {
    const prevBp = prevBPlots.find((b) => b.id === nextBp.id);
    if (!prevBp) {
      worldChanges.push(
        `New B-Plot: ${nextBp.who || nextBp.id} (${nextBp.doing || "active"}) [ripple ${nextBp.ripple ?? 1}]`
      );
    } else if (prevBp.ripple !== nextBp.ripple) {
      worldChanges.push(
        `B-Plot escalated: ${nextBp.who || nextBp.id} ripple ${prevBp.ripple} -> ${nextBp.ripple}`
      );
    } else if (prevBp.status !== nextBp.status) {
      worldChanges.push(
        `B-Plot status shift: ${nextBp.who || nextBp.id} -> ${nextBp.status}`
      );
    }
  }

  // Opportunities
  const prevOpps = prevLedger?.opportunities || [];
  const nextOpps = nextLedger?.opportunities || [];
  for (const nextOpp of nextOpps) {
    const prevOpp = prevOpps.find((o) => o.id === nextOpp.id);
    if (!prevOpp) {
      worldChanges.push(
        `New Opportunity: "${nextOpp.what || nextOpp.id}" (${nextOpp.status || "lead"})`
      );
    } else if (prevOpp.status !== nextOpp.status) {
      worldChanges.push(
        `Opportunity status changed: "${nextOpp.what || nextOpp.id}" -> ${nextOpp.status}`
      );
    }
  }

  // Investigations
  const prevInvs = (prevLedger?.world?.investigations as Record<string, any>) || {};
  const nextInvs = (nextLedger?.world?.investigations as Record<string, any>) || {};
  for (const [auth, track] of Object.entries(nextInvs)) {
    if (!track) continue;
    const prevTrack = prevInvs[auth];
    const name = track.authority || auth;
    if (!prevTrack) {
      worldChanges.push(
        `New Investigation: ${name} targeting ${track.target_id || "suspect"} (Alert Level ${track.alert_level})`
      );
    } else {
      if (track.alert_level !== prevTrack.alert_level) {
        worldChanges.push(
          `Investigation alert escalated: ${name} Alert Level ${prevTrack.alert_level} -> ${track.alert_level}`
        );
      }
      const prevClues = (prevTrack.clues as string[]) || [];
      const nextClues = (track.clues as string[]) || [];
      const newClues = nextClues.filter((c: string) => !prevClues.includes(c));
      if (newClues.length > 0) {
        worldChanges.push(
          `Investigation clues discovered by ${name}: ${newClues.join(", ")}`
        );
      }
    }
  }

  // 2. NPC Behavior & Plans
  const nextActors = nextLedger?.actors || {};
  const prevActors = prevLedger?.actors || {};
  for (const [actorId, actor] of Object.entries(nextActors)) {
    if (!actor) continue;
    const prevActor = prevActors[actorId];
    const name = actor.name || actorId;

    const prevWantNow =
      (prevActor?.agency as any)?.want_now || (prevActor?.state as any)?.want_now;
    const nextWantNow =
      (actor.agency as any)?.want_now || (actor.state as any)?.want_now;
    const wantChanged = Boolean(nextWantNow && nextWantNow !== prevWantNow);

    const prevGoals = (prevActor?.agency as any)?.goals;
    const nextGoals = (actor.agency as any)?.goals;
    const goalsChanged = Boolean(
      nextGoals && JSON.stringify(nextGoals) !== JSON.stringify(prevGoals)
    );

    // Shifted passions
    const passionsMoved: Record<string, number> = {};
    const nextPassions = actor.passions || {};
    const prevPassions = prevActor?.passions || {};
    for (const [pKey, pVal] of Object.entries(nextPassions)) {
      if (typeof pVal === "number" && pVal !== (prevPassions as any)[pKey]) {
        passionsMoved[pKey] = pVal;
      }
    }

    // Moved relations
    const relationsMoved: Record<string, any> = {};
    const nextRelations = actor.relations || {};
    const prevRelations = prevActor?.relations || {};
    for (const [target, relData] of Object.entries(nextRelations)) {
      if (JSON.stringify(relData) !== JSON.stringify(prevRelations[target])) {
        relationsMoved[target] = relData;
      }
    }

    // Attire shifts (integrity, scent, residue)
    const prevOutfit = prevActor?.outfit;
    const nextOutfit = actor.outfit;
    const attireShifts: string[] = [];
    if (nextOutfit && prevOutfit) {
      if (
        nextOutfit.integrity !== undefined &&
        nextOutfit.integrity !== prevOutfit.integrity
      ) {
        attireShifts.push(
          `integrity ${prevOutfit.integrity ?? 100}% -> ${nextOutfit.integrity}%`
        );
      }
      if (
        nextOutfit.scent !== undefined &&
        nextOutfit.scent !== prevOutfit.scent
      ) {
        attireShifts.push(
          `scent "${prevOutfit.scent || "none"}" -> "${nextOutfit.scent}"`
        );
      }
      const prevResidue = JSON.stringify(prevOutfit.residue || []);
      const nextResidue = JSON.stringify(nextOutfit.residue || []);
      if (nextResidue !== prevResidue) {
        attireShifts.push(
          `residue [${(nextOutfit.residue || []).join(", ")}]`
        );
      }
    } else if (nextOutfit && !prevOutfit) {
      if (nextOutfit.scent) attireShifts.push(`scent "${nextOutfit.scent}"`);
      if (nextOutfit.residue && nextOutfit.residue.length > 0) {
        attireShifts.push(`residue [${nextOutfit.residue.join(", ")}]`);
      }
      if (nextOutfit.integrity !== undefined && nextOutfit.integrity < 100) {
        attireShifts.push(`integrity ${nextOutfit.integrity}%`);
      }
    }
    const attireChanged = attireShifts.length > 0 ? attireShifts.join("; ") : undefined;

    if (
      wantChanged ||
      goalsChanged ||
      Object.keys(passionsMoved).length > 0 ||
      Object.keys(relationsMoved).length > 0 ||
      attireChanged
    ) {
      npcChanges.push({
        actorId,
        name,
        wantNow:
          nextWantNow ||
          (goalsChanged ? `Goals: ${JSON.stringify(nextGoals)}` : undefined),
        passionsMoved:
          Object.keys(passionsMoved).length > 0 ? passionsMoved : undefined,
        relationsMoved:
          Object.keys(relationsMoved).length > 0 ? relationsMoved : undefined,
        attireChanged,
      });
    }
  }

  // 3. Journal Mutations
  if (nextLedger?.journal && nextLedger.journal.length > 0) {
    const latest = nextLedger.journal[nextLedger.journal.length - 1];
    if (Array.isArray(latest?.mutations)) {
      for (const m of latest.mutations) {
        if (m) mutations.push(String(m));
      }
    }
  }

  return {
    timestamp: new Date().toLocaleTimeString(),
    directive: directive || "Default living world constraints",
    worldChanges,
    npcChanges,
    mutations,
  };
}


export interface BPlotProcessResult {
  hasBPlotNotification: boolean;
  activeRipples: BPlot[];
  promotedActors: string[];
}

export function processBPlots(ledger: LedgerData): BPlotProcessResult {
  let hasBPlotNotification = false;
  const activeRipples: BPlot[] = [];
  const promotedActors: string[] = [];

  if (!ledger.bplots || !Array.isArray(ledger.bplots)) {
    return { hasBPlotNotification, activeRipples, promotedActors };
  }

  if (!ledger.roster) {
    ledger.roster = [];
  }

  for (const bp of ledger.bplots) {
    if (bp.ripple === 2 && bp.status === "active") {
      hasBPlotNotification = true;
      activeRipples.push(bp);
    } else if (bp.ripple === 3) {
      const who = bp.who?.trim() || "newcomer";
      const exists = ledger.roster.some(
        (r) => r.id === who || (r.name && r.name.toLowerCase() === who.toLowerCase())
      );
      if (!exists) {
        ledger.roster.push({
          id: who,
          name: who,
          lod: 2,
          status: bp.doing || "Arrived in area",
          loc: ledger.scene?.place || "default",
          record: "roster",
          tick: 1,
        });
        promotedActors.push(who);
      }
    }
  }

  return { hasBPlotNotification, activeRipples, promotedActors };
}

```

---

<a id="src-backend-ledger-parser-ts"></a>
## File: `src/backend/ledger-parser.ts`

**Description**: Source file `src/backend/ledger-parser.ts` in LumiVN Visual Novel Engine.

```typescript
import yaml from "js-yaml";
import type { LedgerData, ActorDossier, PlaceNode, BPlot, Opportunity, JournalEntry } from "../shared/types.js";

const ALL_DETAILS_RE = /<details\b[^>]*>[\s\S]*?<\/details>/gi;
const DETAILS_BLOCK_EXTRACT_RE = /<details\b[^>]*>([\s\S]*?)<\/details>/gi;
const YAML_BLOCK_RE = /```(?:yaml|yml)?\s*([\s\S]*?)```/gi;
const THINK_TAGS_RE = /<think\b[^>]*>[\s\S]*?<\/think>/gi;
const DIRECTOR_JSON_RE = /\{[\s\S]*?"director_note"[\s\S]*?\}\s*/gi;
const PLAYER_TRACKING_RE = /\n*(?:Loadout|Attire|Body):[\s\S]*$/i;
const TOON_COMMENT_RE = /<!--\s*toon\b[\s\S]*?-->/gi;
const TOON_BRACKET_RE = /\[toon\b[\s\S]*?\]/gi;

/**
 * Extracts and cleans the narrative prose from the raw assistant message.
 */
export function extractProse(rawContent: string): string {
  let cleaned = (rawContent || "")
    .replace(THINK_TAGS_RE, "")
    .replace(ALL_DETAILS_RE, "")
    .replace(DIRECTOR_JSON_RE, "")
    .replace(TOON_COMMENT_RE, "")
    .replace(TOON_BRACKET_RE, "")
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
 * Extracts raw YAML from any details block (State, Ledger, Status, or untagged details).
 */
export function extractLedgerRaw(rawContent: string): string | null {
  if (!rawContent) return null;

  // 1. Try closed details blocks, prioritizing the ledger/state block
  const closedMatches: string[] = [];
  let m: RegExpExecArray | null;
  DETAILS_BLOCK_EXTRACT_RE.lastIndex = 0;
  while ((m = DETAILS_BLOCK_EXTRACT_RE.exec(rawContent)) !== null) {
    if (m[1]) closedMatches.push(m[1]);
  }

  for (const block of closedMatches) {
    if (
      block.includes("actors:") ||
      block.includes("scene:") ||
      block.includes("clock:") ||
      block.includes("passions:") ||
      block.includes("combat:") ||
      block.includes("relations:") ||
      block.includes("world:") ||
      block.includes("places:") ||
      block.includes("alethea:") ||
      block.includes("```yaml") ||
      block.includes("```yml")
    ) {
      return block.replace(/<summary[^>]*>[\s\S]*?<\/summary>/i, "").trim();
    }
  }

  // 2. If no specific keywords matched but closed details exist
  if (closedMatches.length > 0) {
    const candidate = closedMatches[closedMatches.length - 1]!;
    if (!candidate.includes("director_note")) {
      return candidate.replace(/<summary[^>]*>[\s\S]*?<\/summary>/i, "").trim();
    }
  }

  // 3. Fallback for truncated/unclosed details
  const openMatch = rawContent.match(/<details\b[^>]*>([\s\S]*)$/i);
  if (openMatch && openMatch[1]) {
    return openMatch[1].replace(/<summary[^>]*>[\s\S]*?<\/summary>/i, "").trim();
  }
  return null;
}

export const extractDetailsRaw = extractLedgerRaw;

/**
 * Parses the raw Ledger details content into a structured LedgerData object.
 */
export function parseLedgerYaml(rawLedgerText: string): Partial<LedgerData> {
  let combined: Record<string, unknown> = {};

  // Check for markdown code blocks (```yaml ... ```)
  const codeBlocks: string[] = [];
  let blockMatch: RegExpExecArray | null;
  YAML_BLOCK_RE.lastIndex = 0;
  while ((blockMatch = YAML_BLOCK_RE.exec(rawLedgerText)) !== null) {
    if (blockMatch[1]?.trim()) {
      codeBlocks.push(blockMatch[1].trim());
    }
  }

  function parseYamlChunkWithRecovery(chunk: string, target: Record<string, unknown>): void {
    if (!chunk.trim()) return;
    try {
      const parsed = yaml.load(chunk);
      if (parsed && typeof parsed === "object") {
        Object.assign(target, parsed);
        return;
      }
    } catch {}

    // 1. Sanitization attempt for unescaped quotes inside flow mappings
    try {
      const sanitized = chunk.split("\n").map((line) => {
        const flowMatch = line.match(/^(\s*[a-zA-Z0-9_-]+:\s*\{)(.*)(\}\s*)$/);
        if (flowMatch) {
          const prefix = flowMatch[1];
          const body = flowMatch[2];
          const suffix = flowMatch[3];
          const cleanedBody = body.replace(/([a-zA-Z0-9_-]+:\s*)"([\s\S]*?)"(?=\s*(?:,|\}))/g, (_m, k, val) => {
            return k + "\"" + val.replace(/"/g, "\\\"") + "\"";
          });
          return prefix + cleanedBody + suffix;
        }
        return line;
      }).join("\n");
      const parsed = yaml.load(sanitized);
      if (parsed && typeof parsed === "object") {
        Object.assign(target, parsed);
        return;
      }
    } catch {}

    // 2. Sub-block chunk recovery: parse each root section or actor independently
    const subBlocks = chunk.split(/^(?=[a-zA-Z0-9_-]+:)/m);
    for (const sub of subBlocks) {
      if (!sub.trim()) continue;
      try {
        const parsedSub = yaml.load(sub);
        if (parsedSub && typeof parsedSub === "object") {
          Object.assign(target, parsedSub);
          continue;
        }
      } catch {}

      // Strip problematic nested line (like tells:) and retry sub-block
      const cleanedSub = sub.replace(/^\s*(?:tells|wounds|trauma):\s*\{.*$/gm, "");
      try {
        const parsedSub = yaml.load(cleanedSub);
        if (parsedSub && typeof parsedSub === "object") {
          Object.assign(target, parsedSub);
        }
      } catch {}
    }
  }

  if (codeBlocks.length > 0) {
    for (const block of codeBlocks) {
      parseYamlChunkWithRecovery(block, combined);
    }
  } else {
    // If no explicit code fence, clean out headers (## ...) and attempt recovery parse
    const stripped = rawLedgerText
      .split(/\r?\n/)
      .filter((line) => !line.trim().startsWith("#"))
      .join("\n");
    parseYamlChunkWithRecovery(stripped, combined);
  }

  // Flatten nested "ledger" key if present
  if (combined.ledger && typeof combined.ledger === "object" && !Array.isArray(combined.ledger)) {
    combined = { ...(combined.ledger as Record<string, unknown>), ...combined };
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
    "ledger",
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

  // Player Template String Extraction
  const loadoutMatch = rawLedgerText.match(/Loadout:\s*L:\[(.*?)\]\s*R:\[(.*?)\]\s*│\s*Pkt:\[(.*?)\]\s*│\s*Bnk:\[(.*?)\]\s*│\s*Carried:\[(.*?)\]/i);
  if (loadoutMatch) {
    if (!actors["user"]) actors["user"] = { id: "user" };
    if (!actors["user"].inventory) actors["user"].inventory = {};
    actors["user"].inventory.in_hand = { L: loadoutMatch[1], R: loadoutMatch[2] };
    actors["user"].inventory.carried = loadoutMatch[5] ? loadoutMatch[5].split(",").map(s => s.trim()) : [];
  }
  const attireMatch = rawLedgerText.match(/Attire:\s*Top:\[(.*?)\]\s*Bot:\[(.*?)\]\s*UW:\[(.*?)\]\/\[(.*?)\]\s*Shoes:\[(.*?)\]\s*Cond:\[(.*?)\]/i);
  if (attireMatch) {
    if (!actors["user"]) actors["user"] = { id: "user" };
    actors["user"].outfit = {
      top: attireMatch[1],
      bottom: attireMatch[2],
      underwear_top: attireMatch[3],
      underwear_bottom: attireMatch[4],
      shoes: attireMatch[5],
      state: attireMatch[6]
    };
  }

  // Normalize 21-Stat Network
  for (const [key, val] of Object.entries(actors)) {
    const anyVal = val as any;
    if (anyVal["Relationship Network"]?.stats) {
      anyVal.stats = { ...(anyVal.stats || {}), ...anyVal["Relationship Network"].stats };
    } else if (anyVal.relationship_network?.stats) {
      anyVal.stats = { ...(anyVal.stats || {}), ...anyVal.relationship_network.stats };
    }
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
    world: {
      ...base.world,
      ...delta.world,
      ...(base.world?.investigations || delta.world?.investigations
        ? {
            investigations: {
              ...(base.world?.investigations || {}),
              ...(delta.world?.investigations || {}),
            },
          }
        : {}),
    },
    clock: { ...base.clock, ...delta.clock },
    scene: { ...base.scene, ...delta.scene },
    places: { ...base.places, ...delta.places },
    roster: delta.roster && delta.roster.length > 0 ? delta.roster : base.roster || [],
    actors: { ...base.actors },
    bplots: delta.bplots && delta.bplots.length > 0 ? delta.bplots : base.bplots || [],
    opportunities: delta.opportunities && delta.opportunities.length > 0 ? delta.opportunities : base.opportunities || [],
    journal: [],
  };

  const existingJournal = base.journal || [];
  const newJournal = delta.journal || [];
  const journalMap = new Map<string, JournalEntry>();
  existingJournal.forEach(e => journalMap.set(e.id, e));
  newJournal.forEach(e => journalMap.set(e.id, e));
  merged.journal = Array.from(journalMap.values());

  if (delta.actors) {
    for (const [actorId, actorDelta] of Object.entries(delta.actors)) {
      const baseActor = base.actors?.[actorId] || {};

      // Deep merge relations per target
      const mergedRelations = { ...(baseActor.relations || {}) };
      if (actorDelta.relations) {
        for (const [tgt, rData] of Object.entries(actorDelta.relations)) {
          mergedRelations[tgt] = {
            ...(mergedRelations[tgt] || {}),
            ...(rData as any)
          };
        }
      }

      merged.actors![actorId] = {
        ...baseActor,
        ...actorDelta,
        appearance: { ...baseActor.appearance, ...actorDelta.appearance },
        money: { ...baseActor.money, ...actorDelta.money },
        passions: { ...baseActor.passions, ...actorDelta.passions },
        combat: { ...baseActor.combat, ...actorDelta.combat },
        life_model: { ...baseActor.life_model, ...actorDelta.life_model },
        profile: { ...baseActor.profile, ...actorDelta.profile },
        agency: { ...baseActor.agency, ...actorDelta.agency },
        knowledge: { ...baseActor.knowledge, ...actorDelta.knowledge },
        stats: { ...baseActor.stats, ...actorDelta.stats },
        wounds: { ...baseActor.wounds, ...actorDelta.wounds },
        outfit: {
          ...baseActor.outfit,
          ...actorDelta.outfit,
          accessories: actorDelta.outfit?.accessories || baseActor.outfit?.accessories || [],
          scent: actorDelta.outfit?.scent !== undefined ? actorDelta.outfit.scent : baseActor.outfit?.scent,
          residue: actorDelta.outfit?.residue !== undefined ? actorDelta.outfit.residue : (baseActor.outfit?.residue || []),
          integrity: actorDelta.outfit?.integrity !== undefined ? actorDelta.outfit.integrity : (baseActor.outfit?.integrity ?? 100)
        },
        inventory: {
          ...baseActor.inventory,
          ...actorDelta.inventory,
          in_hand: { ...baseActor.inventory?.in_hand, ...actorDelta.inventory?.in_hand },
          carried: actorDelta.inventory?.carried || baseActor.inventory?.carried || [],
          room: actorDelta.inventory?.room || baseActor.inventory?.room || []
        },
        relations: mergedRelations,
      };
    }
  }

  return merged;
}

/**
 * Infers emotion and active speaker deltas directly from pure narrative prose
 * when no structured tags (TOON or Ledger) are emitted by the model.
 */
export function inferProseEmotionDelta(
  prose: string,
  defaultActor = "char"
): Partial<LedgerData> | null {
  if (!prose || !prose.trim()) return null;

  const paragraphs = extractParagraphs(prose);
  if (paragraphs.length === 0) return null;

  // Determine active speaker from latest dialogue or paragraph
  let targetSpeaker = defaultActor;
  for (let i = paragraphs.length - 1; i >= 0; i--) {
    const detected = detectSpeaker(paragraphs[i]!, defaultActor);
    if (detected.speaker && detected.speaker !== "Narrator") {
      targetSpeaker = detected.speaker.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      break;
    }
  }

  const lowerProse = prose.toLowerCase();
  let inferredEmotion: string | null = null;

  if (/\b(blush\w*|fluster\w*|flush\w*|shy\w*|embarrass\w*|heat rises)\b/i.test(lowerProse)) {
    inferredEmotion = "blush";
  } else if (/\b(smile\w*|laugh\w*|giggle\w*|grin\w*|chuckle\w*|warmly)\b/i.test(lowerProse)) {
    inferredEmotion = "smile";
  } else if (/\b(angr\w*|shout\w*|frown\w*|glar\w*|growl\w*|scowl\w*|snarl\w*|fum\w*)\b/i.test(lowerProse)) {
    inferredEmotion = "angry";
  } else if (/\b(scar\w*|fear\w*|trembl\w*|shiver\w*|gasp\w*|wide-eyed|shriek\w*)\b/i.test(lowerProse)) {
    inferredEmotion = "scared";
  } else if (/\b(sad\w*|cr\w*|sob\w*|weep\w*|tear\w*|falter\w*|mourn\w*|sniffl\w*)\b/i.test(lowerProse)) {
    inferredEmotion = "sad";
  } else if (/\b(suspicio\w*|doubt\w*|squint\w*|narrowed eyes)\b/i.test(lowerProse)) {
    inferredEmotion = "suspicious";
  }

  if (!inferredEmotion) return null;

  const passions: Record<string, number> = {
    blush: { arousal: 60 },
    smile: { joy: 60 },
    angry: { anger: 60 },
    scared: { fear: 60 },
    sad: { sadness: 60 },
    suspicious: { suspicion: 60 },
  }[inferredEmotion] || {};

  return {
    actors: {
      [targetSpeaker]: {
        passions,
      } as ActorDossier,
    },
  };
}


```

---

<a id="src-backend-mvu-evaluator-ts"></a>
## File: `src/backend/mvu-evaluator.ts`

**Description**: Source file `src/backend/mvu-evaluator.ts` in LumiVN Visual Novel Engine.

```typescript
import type { SpindleAPI } from "lumiverse-spindle-types";
import type { LedgerData, StatRulesSettings } from "../shared/types.js";
import { parseLedgerYaml } from "./ledger-parser.js";

export async function evaluateMvuLedgerDelta(
  spindle: SpindleAPI,
  chatId: string,
  latestProse: string,
  currentLedger: LedgerData,
  settings: StatRulesSettings
): Promise<Partial<LedgerData> | null> {
  if (!settings.enabled || settings.mode !== "mvu_quiet") return null;

  const currentSummary = JSON.stringify({
    clock: currentLedger.clock,
    scene: currentLedger.scene,
    actors: currentLedger.actors,
  });

  const systemPrompt = `You are the authoritative living world state evaluator and ledger updater.
Read the narrative prose and apply the following <stat_rules> and <ledger> schema.
Calculate exact state deltas, edge mutations, and inventory movements caused by the latest prose.

${settings.statRules}

${settings.ledgerPrompt}

[CRITICAL INSTRUCTION]
Output ONLY the YAML ledger inside:
<details><summary>📊 Ledger</summary>
...
</details>
Follow compact delta rules strictly.`;

  const userPrompt = `Current World State Baseline:
${currentSummary}

Latest Narrative Turn Prose:
${latestProse}

Emit the resulting ledger compact delta now.`;

  try {
    const res = await spindle.generate.quiet({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const output = typeof res === "string" ? res : (res as any)?.content || "";
    if (!output) return null;

    const rawMatch = output.match(/<details\b[^>]*>([\s\S]*?)<\/details>/i) || [null, output];
    const yamlChunk = rawMatch[1] || output;
    return parseLedgerYaml(yamlChunk);
  } catch (err) {
    spindle.log.error(`[LumiVN MVU] Background quiet calculation failed: ${err}`);
    return null;
  }
}

```

---

<a id="src-backend-storage-ts"></a>
## File: `src/backend/storage.ts`

**Description**: Source file `src/backend/storage.ts` in LumiVN Visual Novel Engine.

```typescript
import type { SpindleAPI } from "lumiverse-spindle-types";
import type { AssetManifest, LedgerData, DirectorSettings, DirectorLogEntry, StatRulesSettings } from "../shared/types.js";
import { DEFAULT_STAT_RULES, DEFAULT_LEDGER_PROMPT } from "./default-rules.js";

const DEFAULT_MANIFEST: AssetManifest = {
  places: {},
  characters: {},
};

export const DEFAULT_STAT_RULES_SETTINGS: StatRulesSettings = {
  statRules: DEFAULT_STAT_RULES,
  ledgerPrompt: DEFAULT_LEDGER_PROMPT,
  enabled: true,
  mode: "mvu_quiet",
};

export const DEFAULT_DIRECTOR_SETTINGS: DirectorSettings = {
  systemPrompt: `You are LumiWorld, the private world-state director and area orchestrator for an interactive Lumiverse simulation.

Decide what the living world does behind the next visible reply. You direct logistics, routine, and texture. You never write the reply, never speak for NPCs, and never decide what {{user}} does, thinks, or feels.

INPUTS (use only what you can see; never invent beyond them): clock, roster (lod, loc, status), places and routes, fronts, bplots (including want, knows, next.due, carriers), opportunities, scene.latents, world.facts, the last reply, your previous director note. If a field is not visible, skip whatever depends on it.

CRITICAL CONSTRAINTS
- ZERO RECAP: Never summarize or restate recent dialogue or events. Never write "{{user}} asks..." or "<NPC> feels...".
- IMPERATIVE ONLY: Every sentence starts with a command verb (Make, Let, Have, Keep, Escalate, Route, Force, Hold, Delay, Seed, Shift, Withhold, Bring, Cut).
- NO SCRIPTED SPEECH: No quoted lines. Give each NPC a tactic and a cost, never words.
- NO PLAYER CONTROL: Never dictate {{user}}'s actions, reactions, or outcomes. NPCs may initiate; the command ends at the attempt.
- OPENING RULE: The reply must open on the direct consequence of {{user}}'s last input. World and texture details never lead; they interrupt, tied to an NPC's behavior, after the first beat.
- NATURAL CAUSALITY: Nothing happens to create drama. Every event needs an in-world cause (a due time, an routine, or a character want). When nothing is due, the world is quiet, and a quiet note is valid. Never raise stakes, add coincidence, or time an arrival to suit the emotional moment.
- CONTINUITY LOCK: Reuse exact names, place keys, numbers, durations, and locations already established. Never rename a place key, change a number, or relocate a fact (a person established in one city does not move to another; two days does not become three). New facts enter only through CANON.
- NO NEW PROPS OR ROOMS MID-SCENE: Use only resources already listed in places. A new node needs a key, plus route minutes both ways.
- ANTI-LOOP: Compare with the last reply and your previous note. Never repeat the same prop gesture, sensory cue, B-plot vector, or opening verb in consecutive notes. A prop that was offered, pushed, or refused once is retired or changes function.
- PACING: A turn is about 1-3 in-world minutes. Nothing moves faster than route minutes. Anyone about to enter the scene gets a precursor (sound, shadow, message) one turn earlier and never before scene.latents window_opens.
- SETTING FIT: Match every detail to the established genre, era, technology, and tone in world.facts and tone_weights. Never import modern or out-of-genre elements into a setting that lacks them. Keep stakes at the scale the setting already has.

DIRECTIVE SLOTS (all required, in this order, 1-2 sentences each, whole note 120-240 words)
FIRST BEAT: Name which NPC answers or reacts to {{user}}'s last input first, and how (answer, dodge, counter, ignore at a cost). If the input asks about undefined canon, say here what that NPC reveals, withholds, or distorts.
WORLD: Move the surrounding area one believable step with public clockwork matched to setting, phase and weather (traffic, patrols, market bells, deliveries, shift changes, tides, neighbors, shifting light or weather). Place it as an interruption after the first beat, never as the opening. Reuse existing place keys; add a new node only if the scene needs it, at most one per three turns. Never repeat a public event within 15 in-world minutes.
OFFSCREEN: Pick 1-3 LOD 1-2 cast whose errand, shift, chore, or journey advances now. Name actor, activity, place key, and minutes remaining. Give each at most one perceptible trace for the present scene (sound, shadow, door, smell, message), or none if too far. Leave the rest on routine. At most one new arrival per turn.
PRESSURE: Default is hold. Check bplots: act only if a bplot's next.due has been reached or a carrier's eta has passed, and at least 15 in-world minutes have gone by since the last visible B-plot beat. If nothing qualifies, write 'Hold: nothing due' with the next due time, and add no trace. If something qualifies, state its current ripple stage, then command one ordinary trace that matches that stage (Stage 1: no local trace; Stage 2: one mundane echo through a vector not used last time; Stage 3: arrival). Never lower a ripple number. Let the actor respond in proportion to what it knows, and allow it to ignore, delay, misread, or settle peacefully. Aim a beat at a specific present NPC's want or secret only if the bplot's hooks already name it. Advance at most one B-plot per turn.
PRESENT: For each LOD 3 NPC, command one tactic that serves their own want_now, plus its cost (deflect, bargain, test, bait, withhold, stall, retreat, attack, change the subject, lie by omission). Aim NPCs at different targets: at most one reacts to {{user}}; the others pursue each other, a task, or the room. Never let two NPCs chase the same request or prop. Every cooperative act must serve the NPC's own aim. Keep guarded secrets at subtle-trace stage unless evidence forces the next stage.
VOICE: Give each speaking NPC one speech cue for this beat, drawn from stress, familiarity, and audience (answers with a question, trails off, over-explains a lie, clipped fragments, interrupts themself, says less than they mean). Make speech sound like a real person: contractions, plain words, correct grammar, short lines, no announced feelings, no speeches, no assistant phrasing. Cues must differ per NPC; swearing and catchphrases are not cues. NPCs may only reference what they perceived or were told.
TEXTURE: Command 2-3 concrete details from different senses, matched to place, phase, and weather, plus one environment change that alters where someone looks or stands. Make sources physically consistent (what makes the sound, how far, which floor). Time each detail to land mid-reply so it changes someone's behavior (a flinch, a glance, a pause). Prefer specific over atmospheric.
CANON: State any new fact the reply is about to establish (family ties, backstory, durations, locations) as one short line for world.facts, consistent with existing facts. If the player's question exposes ambiguous backstory (relatives, ex-partners, past events), pick one answer consistent with established canon and record it; do not let NPCs dodge it just because it is undefined. NPCs may still answer partially, biased, or evasively, but never contradict established canon.
END ON: Name one concrete unresolved physical or environmental moment where the reply stops, so {{user}} has a clean point to act. Not an NPC question aimed at {{user}}.`,
  userNotes: "",
  enabled: true,
};

export class StorageManager {
  private spindle: SpindleAPI;
  private manifestCache: AssetManifest | null = null;
  private manifestDirty = false;
  private chatStateCache: Map<string, LedgerData> = new Map();
  private directorSettingsCache: DirectorSettings | null = null;
  private statRulesSettingsCache: StatRulesSettings | null = null;

  constructor(spindle: SpindleAPI) {
    this.spindle = spindle;
  }

  private async ensureDir(dirPath: string): Promise<void> {
    const parts = dirPath.split("/").filter(Boolean);
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      try {
        if (!(await this.spindle.storage.exists(current))) {
          await this.spindle.storage.mkdir(current);
        }
      } catch {
        // Ignore directory already exists
      }
    }
  }

  // ── Asset Manifest with In-Memory Caching & Dirty Writes ──

  async getManifest(): Promise<AssetManifest> {
    if (this.manifestCache) {
      return this.manifestCache;
    }
    try {
      const exists = await this.spindle.storage.exists("asset_manifest.json");
      if (exists) {
        const raw = await this.spindle.storage.read("asset_manifest.json");
        this.manifestCache = JSON.parse(raw) as AssetManifest;
        return this.manifestCache;
      }
    } catch (e) {
      console.warn("[LumiVN] Failed to read asset_manifest.json, using default:", e);
    }
    this.manifestCache = { ...DEFAULT_MANIFEST };
    return this.manifestCache;
  }

  getCachedManifest(): AssetManifest {
    return this.manifestCache || DEFAULT_MANIFEST;
  }

  async saveManifest(manifest: AssetManifest): Promise<void> {
    this.manifestCache = manifest;
    this.manifestDirty = true;
    try {
      await this.spindle.storage.write("asset_manifest.json", JSON.stringify(manifest, null, 2));
      this.manifestDirty = false;
    } catch (e) {
      console.error("[LumiVN] Failed to save asset_manifest.json:", e);
    }
  }

  // ── Isolated Turn Persistence (Active vs Historical Branch Snapshots) ──

  getCachedChatState(chatId: string): LedgerData | null {
    return this.chatStateCache.get(chatId) || null;
  }

  setCachedChatState(chatId: string, state: LedgerData): void {
    this.chatStateCache.set(chatId, state);
  }

  async getChatState(
    chatId: string,
    messageId?: string,
    swipeId?: string | number
  ): Promise<LedgerData | null> {
    // 1. If messageId and swipeId are provided, check historical branch snapshot first
    if (messageId) {
      const sId = swipeId !== undefined ? String(swipeId) : "0";
      const branchPath = `turns/${chatId}/${messageId}/${sId}.json`;
      try {
        if (await this.spindle.storage.exists(branchPath)) {
          const raw = await this.spindle.storage.read(branchPath);
          const parsed = JSON.parse(raw) as LedgerData;
          this.chatStateCache.set(chatId, parsed);
          return parsed;
        }
      } catch (e) {
        console.warn(`[LumiVN] Failed to read branch snapshot ${branchPath}:`, e);
      }
    }

    // 2. Check memory cache for active chat state
    if (this.chatStateCache.has(chatId)) {
      return this.chatStateCache.get(chatId)!;
    }

    // 3. Fall back to active chat snapshot: chats/${chatId}/state.json
    try {
      const activePath = `chats/${chatId}/state.json`;
      if (await this.spindle.storage.exists(activePath)) {
        const raw = await this.spindle.storage.read(activePath);
        const parsed = JSON.parse(raw) as LedgerData;
        this.chatStateCache.set(chatId, parsed);
        return parsed;
      }
    } catch (e) {
      console.warn(`[LumiVN] Failed to read active chat state for ${chatId}:`, e);
    }
    return null;
  }

  async saveChatState(
    chatId: string,
    state: LedgerData,
    messageId?: string,
    swipeId?: string | number
  ): Promise<void> {
    // Update in-memory cache
    this.chatStateCache.set(chatId, state);

    try {
      // 1. Active Chat Snapshot: chats/${chatId}/state.json
      await this.ensureDir(`chats/${chatId}`);
      await this.spindle.storage.write(
        `chats/${chatId}/state.json`,
        JSON.stringify(state, null, 2)
      );

      // 2. Historical Branch Snapshot: turns/${chatId}/${messageId}/${swipeId}.json
      if (messageId) {
        const sId = swipeId !== undefined ? String(swipeId) : "0";
        const turnDir = `turns/${chatId}/${messageId}`;
        await this.ensureDir(turnDir);
        await this.spindle.storage.write(
          `${turnDir}/${sId}.json`,
          JSON.stringify(state, null, 2)
        );
      }
    } catch (e) {
      console.error(`[LumiVN] Failed to persist chat state for ${chatId}:`, e);
    }
  }

  async saveMediaFile(relPath: string, dataUrlOrBase64: string): Promise<string> {
    try {
      const parts = relPath.split("/");
      if (parts.length > 1) {
        const dir = parts.slice(0, -1).join("/");
        await this.ensureDir(dir);
      }

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

  // ── Director Settings with In-Memory Caching ──

  getCachedDirectorSettings(): DirectorSettings {
    return this.directorSettingsCache || DEFAULT_DIRECTOR_SETTINGS;
  }

  async getDirectorSettings(): Promise<DirectorSettings> {
    if (this.directorSettingsCache) {
      return this.directorSettingsCache;
    }
    try {
      const exists = await this.spindle.storage.exists("director_settings.json");
      if (exists) {
        const raw = await this.spindle.storage.read("director_settings.json");
        const loaded: DirectorSettings = { ...DEFAULT_DIRECTOR_SETTINGS, ...JSON.parse(raw) };
        this.directorSettingsCache = loaded;
        return loaded;
      }
    } catch (e) {
      console.warn("[LumiVN] Failed to read director_settings.json, using defaults:", e);
    }
    const fallback: DirectorSettings = { ...DEFAULT_DIRECTOR_SETTINGS };
    this.directorSettingsCache = fallback;
    return fallback;
  }

  async saveDirectorSettings(settings: DirectorSettings): Promise<void> {
    this.directorSettingsCache = settings;
    try {
      await this.spindle.storage.write("director_settings.json", JSON.stringify(settings, null, 2));
    } catch (e) {
      console.error("[LumiVN] Failed to save director_settings.json:", e);
    }
  }

  // ── Stat Rules & Ledger Settings ──

  async getStatRulesSettings(): Promise<StatRulesSettings> {
    if (this.statRulesSettingsCache) return this.statRulesSettingsCache;
    try {
      if (await this.spindle.storage.exists("stat_rules_settings.json")) {
        const raw = await this.spindle.storage.read("stat_rules_settings.json");
        this.statRulesSettingsCache = { ...DEFAULT_STAT_RULES_SETTINGS, ...JSON.parse(raw) };
        return this.statRulesSettingsCache;
      }
    } catch (e) {
      console.warn("[LumiVN] Failed to read stat_rules_settings.json, using defaults:", e);
    }
    this.statRulesSettingsCache = { ...DEFAULT_STAT_RULES_SETTINGS };
    return this.statRulesSettingsCache;
  }

  async saveStatRulesSettings(settings: StatRulesSettings): Promise<void> {
    this.statRulesSettingsCache = settings;
    try {
      await this.spindle.storage.write("stat_rules_settings.json", JSON.stringify(settings, null, 2));
    } catch (e) {
      console.error("[LumiVN] Failed to save stat_rules_settings.json:", e);
    }
  }

  // ── Director Impact Logs ──

  async getDirectorLogs(chatId: string): Promise<DirectorLogEntry[]> {
    try {
      const path = `chats/${chatId}/director_logs.json`;
      const exists = await this.spindle.storage.exists(path);
      if (exists) {
        const raw = await this.spindle.storage.read(path);
        return JSON.parse(raw) as DirectorLogEntry[];
      }
    } catch (e) {
      console.warn(`[LumiVN] Failed to read director logs for ${chatId}:`, e);
    }
    return [];
  }

  async saveDirectorLogs(chatId: string, logs: DirectorLogEntry[]): Promise<void> {
    try {
      await this.ensureDir(`chats/${chatId}`);
      await this.spindle.storage.write(
        `chats/${chatId}/director_logs.json`,
        JSON.stringify(logs, null, 2)
      );
    } catch (e) {
      console.error(`[LumiVN] Failed to save director logs for ${chatId}:`, e);
    }
  }
}

```

---

<a id="src-backend-toon-parser-ts"></a>
## File: `src/backend/toon-parser.ts`

**Description**: Source file `src/backend/toon-parser.ts` in LumiVN Visual Novel Engine.

```typescript
import type { LedgerData, SceneState, ActorDossier, ActorPassions } from "../shared/types.js";
import { resolveDominantEmotion, resolveOutfitName } from "./asset-resolver.js";

const TOON_COMMENT_RE = /<!--\s*toon\b([\s\S]*?)-->/i;
const TOON_FENCE_RE = /```(?:toon)?\s*([\s\S]*?)```/i;
const TOON_BRACKET_RE = /\[toon\b([\s\S]*?)\]/i;

/**
 * Maps simple mood names to passions values for compatibility with LedgerData.
 */
export function moodToPassions(mood: string): ActorPassions {
  const clean = (mood || "").toLowerCase().trim();
  switch (clean) {
    case "blush":
    case "horny":
    case "lust":
      return { arousal: 70 };
    case "angry":
    case "rage":
    case "mad":
      return { anger: 60 };
    case "scared":
    case "fear":
    case "shock":
      return { fear: 60 };
    case "smile":
    case "joy":
    case "happy":
    case "laugh":
      return { joy: 60 };
    case "sad":
    case "cry":
    case "sorrow":
      return { sadness: 60 };
    case "suspicious":
    case "doubt":
    case "glare":
      return { suspicion: 60 };
    default:
      return { arousal: 0, anger: 0, fear: 0, joy: 0, sadness: 0, suspicion: 0 };
  }
}

/**
 * Encodes current LedgerData state into compact TOON tabular notation.
 */
export function encodeToonState(ledger: LedgerData | null): string {
  if (!ledger) return "scene: place:default\nactors[0]{id,mood,slot,outfit}:";

  const lines: string[] = [];

  // Scene line
  const place = ledger.scene?.place || "default";
  const time = ledger.clock?.t || ledger.scene?.time || "";
  lines.push(`scene: place:${place}${time ? ` time:${time}` : ""}`);

  // Tabular actors header and rows
  const actorEntries = Object.entries(ledger.actors || {});
  const count = actorEntries.length;
  lines.push(`actors[${count}]{id,mood,slot,outfit}:`);

  for (const [id, actor] of actorEntries) {
    const mood = resolveDominantEmotion(actor.passions);
    const slot = (actor as any).slot || (id === "user" ? "left" : "center");
    const outfit = resolveOutfitName(actor);
    lines.push(` ${id},${mood},${slot},${outfit}`);
  }

  return lines.join("\n");
}

/**
 * Extracts raw TOON delta string from assistant message content.
 */
export function extractToonRaw(content: string): string | null {
  if (!content) return null;

  const commentMatch = TOON_COMMENT_RE.exec(content);
  if (commentMatch && commentMatch[1]) return commentMatch[1].trim();

  const bracketMatch = TOON_BRACKET_RE.exec(content);
  if (bracketMatch && bracketMatch[1]) return bracketMatch[1].trim();

  const fenceMatch = TOON_FENCE_RE.exec(content);
  if (fenceMatch && fenceMatch[1] && /actors\[|scene:/i.test(fenceMatch[1])) {
    return fenceMatch[1].trim();
  }

  return null;
}

/**
 * Parses a TOON formatted string into a partial LedgerData delta.
 */
export function parseToonDelta(toonText: string): Partial<LedgerData> | null {
  if (!toonText || !toonText.trim()) return null;

  const lines = toonText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));

  if (lines.length === 0) return null;

  const result: Partial<LedgerData> = {};
  let currentTable: {
    name: string;
    columns: string[];
  } | null = null;

  for (const line of lines) {
    // 1. Table Header: name[N]{col1,col2,...}:
    const tableHeaderMatch = /^([A-Za-z0-9_]+)\[\d*\]\{([^}]+)\}:?$/.exec(line);
    if (tableHeaderMatch) {
      const tableName = tableHeaderMatch[1]!.toLowerCase();
      const columns = tableHeaderMatch[2]!.split(",").map((c) => c.trim().toLowerCase());
      currentTable = { name: tableName, columns };
      continue;
    }

    // 2. Tabular Row: val1,val2,val3...
    if (currentTable && currentTable.name === "actors" && line.includes(",")) {
      const values = line.split(",").map((v) => v.trim());
      const rowData: Record<string, string> = {};
      currentTable.columns.forEach((col, idx) => {
        rowData[col] = values[idx] || "";
      });

      const actorId = rowData.id || rowData.actor || rowData.name;
      if (actorId) {
        if (!result.actors) result.actors = {};
        const passions = rowData.mood ? moodToPassions(rowData.mood) : undefined;
        const actorDelta: Partial<ActorDossier> = {};

        if (passions) actorDelta.passions = passions;
        if (rowData.outfit) {
          actorDelta.outfit = { state: rowData.outfit, top: rowData.outfit };
        }
        if (rowData.slot) {
          (actorDelta as any).slot = rowData.slot;
        }

        result.actors[actorId] = actorDelta as ActorDossier;
      }
      continue;
    }

    // 3. Single-line Key-Value or sub-properties: scene: place:kitchen time:D1 14:00
    if (/^scene\s*:/i.test(line)) {
      currentTable = null;
      if (!result.scene) result.scene = {};
      const rest = line.replace(/^scene\s*:\s*/i, "").trim();
      const tokens = rest.split(/\s+/);
      for (const token of tokens) {
        const colonIdx = token.indexOf(":");
        if (colonIdx > 0) {
          const k = token.slice(0, colonIdx).toLowerCase();
          const v = token.slice(colonIdx + 1).trim();
          if (k === "place") result.scene.place = v;
          if (k === "time") result.scene.time = v;
          if (k === "weather") result.scene.weather = v;
        } else if (!result.scene.place && token) {
          result.scene.place = token;
        }
      }
      continue;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Returns a tight, self-contained prompt instruction for LLM visual guidance.
 */
export function getToonPromptInstruction(currentLedger: LedgerData | null): string {
  const stateSummary = encodeToonState(currentLedger);
  return `[LumiVN Stage Context]
${stateSummary}

[Visual Novel Directive]
Write the reply as standard narrative prose with natural dialogue.
If the scene location, character expression, or position changes, append an ultra-compact tag at the very end of your reply:
<!--toon
scene: place:<place_id>
actors[N]{id,mood,slot}:
 <actor_id>,<mood>,<slot>
-->
(Valid moods: neutral, smile, blush, angry, sad, scared, suspicious. Slots: left, center, right.)`;
}

```

---

<a id="src-frontend-ts"></a>
## File: `src/frontend.ts`

**Description**: Source file `src/frontend.ts` in LumiVN Visual Novel Engine.

```typescript
import type {
  SpindleFrontendContext,
  SpindleAppMountHandle,
  SpindleFloatWidgetHandle,
} from "lumiverse-spindle-types";
import type { VnPresentationState, DiagnosticData } from "./shared/types.js";
import { StageOverlay } from "./frontend/stage/overlay.js";
import { registerDiagnosticsDrawer } from "./frontend/studio/diagnostics-drawer.js";
import { diagBus } from "./frontend/utils/diag-bus.js";

const CLEANUP_KEY = "__lumivnCleanup";

export function setup(ctx: SpindleFrontendContext): () => void {
  // Required startup readiness protocol
  if (typeof ctx.deferReady === "function") {
    ctx.deferReady();
  }

  const prevCleanup = (globalThis as Record<string, unknown>)[CLEANUP_KEY];
  if (typeof prevCleanup === "function") {
    try {
      prevCleanup();
    } catch {
      // Ignore
    }
  }

  let appMount: SpindleAppMountHandle | null = null;
  let floatWidget: SpindleFloatWidgetHandle | null = null;
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

  // 1. Sidebar Drawer Tab (VN Studio)
  const diagDrawer = registerDiagnosticsDrawer(ctx, toggleStage);

  // 2. Persistent Floating "🎬 Stage" Widget
  const WIDGET_STORAGE_KEY = "lumivn_launcher_widget_pos";

  function getSavedWidgetPosition(): { x: number; y: number } {
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

  function saveWidgetPosition(x: number, y: number) {
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
        snapToEdge: false, // Prevents forced snapping back to window bounds
        chromeless: true,
        tooltip: "Launch Visual Novel Stage",
      });
      floatWidget = widget;

      // Style the inner button: MUST NOT be position: fixed!
      widget.root.style.width = "48px";
      widget.root.style.height = "48px";
      widget.root.style.position = "relative"; // Allows Spindle parent to handle positioning
      widget.root.style.overflow = "visible";

      const launchBtn = document.createElement("button");
      launchBtn.className = "vn-stage-launcher-btn";
      launchBtn.innerHTML = "🎬";
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
          if (appMount) appMount.setVisible(true);
          overlay.activate();
        } else {
          overlay.deactivate();
          if (appMount) appMount.setVisible(false);
        }
      });

      widget.root.appendChild(launchBtn);

      // Save updated coordinates when user completes dragging the widget
      widget.root.addEventListener("pointerup", () => {
        const rect = widget.root.getBoundingClientRect();
        saveWidgetPosition(rect.left, rect.top);
      });
    } catch (e) {
      console.warn("[LumiVN] Failed to create float widget:", e);
    }
  }

  // 3. Input Bar Composer Action (Fallback)
  let inputBarActionHandle: { destroy(): void } | null = null;
  if (typeof ctx.ui?.registerInputBarAction === "function") {
    try {
      const action = ctx.ui.registerInputBarAction({
        id: "lumivn_toggle",
        label: "Visual Novel",
        subtitle: "Open full-screen Visual Novel stage",
        enabled: true,
      });
      action.onClick(() => toggleStage());
      inputBarActionHandle = action;
    } catch (e) {
      console.warn("[LumiVN] Failed to register input bar action:", e);
    }
  }

  // 4. Chat Header Action
  let chatHeaderActionHandle: { destroy(): void } | null = null;
  const ctxAny = ctx as any;
  if (typeof ctxAny.ui?.registerChatHeaderAction === "function") {
    try {
      chatHeaderActionHandle = ctxAny.ui.registerChatHeaderAction({
        id: "lumivn_header_toggle",
        label: "Visual Novel",
        tooltip: "Open full-screen Visual Novel life-sim stage",
        iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><polygon points="10 8 16 11 10 14 10 8"/><line x1="6" y1="21" x2="18" y2="21"/></svg>`,
        onClick: () => toggleStage(),
      });
    } catch (e) {
      console.warn("[LumiVN] Failed to register chat header action:", e);
    }
  }

  // 5. Host Lifecycle Subscriptions (Chat switched / changed / forked)
  const unsubChatSwitched = ctx.events?.on?.("CHAT_SWITCHED", (payload: unknown) => {
    const candidate = payload && typeof payload === "object" ? (payload as { chatId?: unknown }) : {};
    const newChatId = (typeof candidate.chatId === "string" ? candidate.chatId : null) || ctx.getActiveChat()?.chatId || null;
    overlay.onChatChanged(newChatId);
  });

  const unsubChatChanged = ctx.events?.on?.("CHAT_CHANGED", (payload: unknown) => {
    const candidate = payload && typeof payload === "object" ? (payload as { chat?: { id?: unknown }; chatId?: unknown }) : {};
    const newChatId = (typeof candidate.chat?.id === "string" ? candidate.chat.id : null) ||
                      (typeof candidate.chatId === "string" ? candidate.chatId : null) ||
                      ctx.getActiveChat()?.chatId || null;
    overlay.onChatChanged(newChatId);
  });

  const unsubChatForked = ctx.events?.on?.("CHAT_FORKED", (payload: unknown) => {
    const candidate = payload && typeof payload === "object" ? (payload as { forkedChatId?: unknown; chat?: { id?: unknown } }) : {};
    const newChatId = (typeof candidate.forkedChatId === "string" ? candidate.forkedChatId : null) ||
                      (typeof candidate.chat?.id === "string" ? candidate.chat.id : null) ||
                      ctx.getActiveChat()?.chatId || null;
    overlay.onChatChanged(newChatId);
  });

  // 6. Backend Message Bridge
  const unsubscribeBackend = ctx.onBackendMessage((msg: unknown) => {
    const payload = msg as Record<string, unknown>;
    if (!payload || typeof payload !== "object") return;

    if (payload.type === "vn_force_open") {
      if (!overlay.isActive()) {
        if (appMount) appMount.setVisible(true);
        overlay.activate();
      }
      if (typeof payload.tab === "string") {
        overlay.openHudTab(payload.tab);
      }
      diagDrawer?.pushLog("Stage launched via Command Palette.", "info");
      diagBus.pushLog("Stage launched via Command Palette.", "info");
    } else if (payload.type === "vn_state" && payload.state) {
      const st = payload.state as VnPresentationState;
      overlay.updatePresentation(st);
      diagDrawer?.setLatestLedger(st.ledger);
      diagBus.setLedger(st.ledger);
    } else if (payload.type === "vn_diagnostic_update" && payload.data) {
      diagDrawer?.updateDiagnostic(payload.data as DiagnosticData);
      diagBus.setTelemetry(payload.data as DiagnosticData);
    } else if (payload.type === "vn_manifest" && payload.manifest) {
      overlay.setManifest(payload.manifest as any);
      diagBus.setManifest(payload.manifest as any);
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
      diagBus.setDirectorNote(payload.data as any);
    } else if (payload.type === "vn_stat_rules_settings" && payload.settings) {
      overlay.setStatRulesSettings(payload.settings as any);
    } else if (payload.type === "vn_director_settings" && payload.settings) {
      diagDrawer?.setDirectorSettings(payload.settings as any);
    } else if (payload.type === "vn_director_log" && payload.log) {
      diagDrawer?.pushDirectorLog(payload.log as any);
    } else if (payload.type === "vn_director_logs" && Array.isArray(payload.logs)) {
      diagDrawer?.setDirectorLogs(payload.logs as any);
    } else if (payload.type === "vn_log") {
      diagDrawer?.pushLog(String(payload.message), (payload.level as any) || "info");
      diagBus.pushLog(String(payload.message), (payload.level as any) || "info");
    } else if (payload.type === "vn_error") {
      diagDrawer?.pushLog(String(payload.error), "error");
      diagBus.pushLog(String(payload.error), "error");
    }
  });

  // Signal completion of startup registration
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

  (globalThis as Record<string, unknown>)[CLEANUP_KEY] = cleanup;
  return cleanup;
}

```

---

<a id="src-frontend-hud-menu-bar-ts"></a>
## File: `src/frontend/hud/menu-bar.ts`

**Description**: Source file `src/frontend/hud/menu-bar.ts` in LumiVN Visual Novel Engine.

```typescript
import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import type { LedgerData, AssetManifest } from "../../shared/types.js";
import { CharactersTab } from "./tab-characters.js";
import { BPlotsTab } from "./tab-bplots.js";
import { WardrobeTab } from "./tab-wardrobe.js";
import { StatsTab } from "./tab-stats.js";
import { InventoryTab } from "./tab-inventory.js";
import { MapTab } from "./tab-map.js";
import { PhoneTab } from "./tab-phone.js";
import { JournalTab } from "./tab-journal.js";
import { SceneTab } from "./tab-scene.js";
import { DiagnosticsTab } from "./tab-diagnostics.js";
import type { SpriteTransform } from "../stage/sprite-transform.js";
import type { VnTtsEngine } from "../stage/tts-engine.js";

export type HudTabId =
  | "characters"
  | "bplots"
  | "wardrobe"
  | "stats"
  | "inventory"
  | "map"
  | "phone"
  | "journal"
  | "scene"
  | "diagnostics";

export interface MenuBarOptions {
  ctx: SpindleFrontendContext;
  onAction: (actionText: string) => void;
  onTransformChange?: (actorId: string, transform: SpriteTransform) => void;
  isOverlayActive?: () => boolean;
  ttsEngine?: VnTtsEngine;
}

export class MenuBar {
  public root: HTMLElement;
  private panelOverlay: HTMLElement;
  private panelBody: HTMLElement;
  private phoneBadge: HTMLElement | null = null;

  private charactersTab: CharactersTab;
  private bplotsTab: BPlotsTab;
  private wardrobeTab: WardrobeTab;
  private statsTab: StatsTab;
  private inventoryTab: InventoryTab;
  private mapTab: MapTab;
  private phoneTab: PhoneTab;
  private journalTab: JournalTab;
  private sceneTab: SceneTab;
  private diagnosticsTab: DiagnosticsTab;

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
    this.charactersTab = new CharactersTab(options.ttsEngine);
    this.bplotsTab = new BPlotsTab();
    this.wardrobeTab = new WardrobeTab(options.onAction);
    this.statsTab = new StatsTab();
    this.inventoryTab = new InventoryTab(options.onAction);
    this.mapTab = new MapTab(options.onAction);
    this.phoneTab = new PhoneTab(options.ctx, options.onAction, options.isOverlayActive);
    this.journalTab = new JournalTab();
    this.sceneTab = new SceneTab(options.ctx, options.onTransformChange);
    this.diagnosticsTab = new DiagnosticsTab(options.ctx);

    // Render bar buttons
    const barItems: Array<{ id: HudTabId; icon: string; label: string }> = [
      { id: "characters", icon: "👥", label: "Cast" },
      { id: "bplots", icon: "📡", label: "B-Plots" },
      { id: "wardrobe", icon: "👗", label: "Wardrobe" },
      { id: "stats", icon: "📊", label: "Stats" },
      { id: "inventory", icon: "🎒", label: "Inventory" },
      { id: "map", icon: "🗺️", label: "Map" },
      { id: "phone", icon: "📱", label: "Phone" },
      { id: "journal", icon: "📜", label: "Journal" },
      { id: "scene", icon: "🎬", label: "Scene" },
      { id: "diagnostics", icon: "📋", label: "Copy / Diag" },
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
    const raw = ledger as any;
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

  public setManifest(manifest: AssetManifest): void {
    this.currentManifest = manifest;
    if (this.activeTabId === "characters" || this.activeTabId === "scene") {
      this.renderActiveTab();
    }
  }

  public setStatRulesSettings(settings: any): void {
    this.diagnosticsTab.setStatRulesSettings(settings);
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

```

---

<a id="src-frontend-hud-tab-bplots-ts"></a>
## File: `src/frontend/hud/tab-bplots.ts`

**Description**: Source file `src/frontend/hud/tab-bplots.ts` in LumiVN Visual Novel Engine.

```typescript
import type { LedgerData, BPlot, RosterCharacter, FrontNode, TravelNode, SceneLatent } from "../../shared/types.js";

export class BPlotsTab {
  public root: HTMLElement;

  constructor() {
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-bplots";
  }

  public render(ledger: LedgerData): void {
    this.root.innerHTML = "";
    this.root.style.cssText = "display: flex; flex-direction: column; gap: 14px; color: #f1f5f9; font-family: system-ui, sans-serif;";

    const bplots: BPlot[] = ledger.bplots || [];
    const roster: RosterCharacter[] = ledger.roster || [];
    const currentPlace = (ledger.scene?.place || "").toLowerCase();
    const offscreenCast = roster.filter((r) => {
      const isOffLOD = r.lod === 1 || r.lod === 2;
      const isDifferentLoc = r.loc && r.loc.toLowerCase() !== currentPlace;
      return (isOffLOD || isDifferentLoc) && (r.id || "").toLowerCase() !== "user";
    });
    const fronts: FrontNode[] = ledger.fronts || [];
    const travel: TravelNode[] = ledger.travel || [];
    const latents: SceneLatent[] = ledger.scene?.latents || [];

    // Header
    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <h3 style="margin: 0; font-size: 15px; color: #f8fafc; display: flex; align-items: center; gap: 6px;">
            <span>📡</span> <span>B-Plots, Fronts & Offscreen Cast</span>
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

    // ── 1. B-Plots Section ──
    const bpSection = document.createElement("div");
    bpSection.className = "vn-section";
    bpSection.innerHTML = `<h4>🌐 Active B-Plots & Distant Agendas (${bplots.length})</h4>`;

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

    // ── 2. Offscreen Cast & Latents Section ──
    const offSection = document.createElement("div");
    offSection.className = "vn-section";
    offSection.innerHTML = `<h4>👥 Offscreen Cast & Area Latents (${offscreenCast.length + latents.length + travel.length})</h4>`;

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
          <strong style="color: #38bdf8; font-size: 12px;">🚶 ${tr.actor} (In Transit)</strong>
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

    // ── 3. Environmental Fronts Section ──
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

```

---

<a id="src-frontend-hud-tab-characters-ts"></a>
## File: `src/frontend/hud/tab-characters.ts`

**Description**: Source file `src/frontend/hud/tab-characters.ts` in LumiVN Visual Novel Engine.

```typescript
import type { LedgerData, ActorDossier, AssetManifest, RosterCharacter } from "../../shared/types.js";
import type { VnTtsEngine, SpeechVoiceRef } from "../stage/tts-engine.js";

// Helper normalizers for tuples vs objects emitted by LLM My World 1.85 ledger
function normalizeGoal(g: any): {
  id: string;
  intent: string;
  priority: number | string;
  commitment: number | string;
  deadline: string;
  cause: string;
  progress: number | string;
  status: string;
} {
  if (Array.isArray(g)) {
    return {
      id: String(g[0] ?? "goal"),
      intent: String(g[1] ?? ""),
      priority: g[2] ?? 0,
      commitment: g[3] ?? 0,
      deadline: String(g[4] ?? ""),
      cause: String(g[5] ?? ""),
      progress: g[6] ?? 0,
      status: String(g[7] ?? "active"),
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
    status: String(g?.status ?? "active"),
  };
}

function normalizePlan(p: any): {
  goal: string;
  steps: any[];
  now: string;
  preconditions: any[];
  revisions: number;
} {
  if (Array.isArray(p)) {
    return {
      goal: String(p[0] ?? ""),
      steps: Array.isArray(p[1]) ? p[1] : p[1] ? [p[1]] : [],
      now: String(p[2] ?? ""),
      preconditions: Array.isArray(p[3]) ? p[3] : p[3] ? [p[3]] : [],
      revisions: Number(p[4] ?? 0),
    };
  }
  return {
    goal: String(p?.goal ?? ""),
    steps: Array.isArray(p?.steps) ? p.steps : p?.steps ? [p.steps] : [],
    now: String(p?.now ?? ""),
    preconditions: Array.isArray(p?.preconditions) ? p.preconditions : p?.preconditions ? [p.preconditions] : [],
    revisions: Number(p?.revisions ?? 0),
  };
}

function normalizeMemory(m: any): {
  evt: string;
  interpretation: string;
  salience: number;
  imprint: string;
  with: string;
} {
  if (Array.isArray(m)) {
    return {
      evt: String(m[0] ?? ""),
      interpretation: String(m[1] ?? ""),
      salience: Number(m[2] ?? 0),
      imprint: String(m[3] ?? ""),
      with: String(m[4] ?? ""),
    };
  }
  return {
    evt: String(m?.evt ?? m?.event ?? ""),
    interpretation: String(m?.interpretation ?? ""),
    salience: Number(m?.salience ?? 0),
    imprint: String(m?.imprint ?? ""),
    with: String(m?.with ?? ""),
  };
}

function normalizeExpectation(e: any): {
  situation: string;
  expect: string;
  conf: number;
} {
  if (Array.isArray(e)) {
    return {
      situation: String(e[0] ?? ""),
      expect: String(e[1] ?? ""),
      conf: Number(e[2] ?? 100),
    };
  }
  return {
    situation: String(e?.situation ?? ""),
    expect: String(e?.expect ?? ""),
    conf: Number(e?.conf ?? 100),
  };
}

function normalizeSecret(s: any): {
  truth: string;
  knows: string[];
  suspects: string[];
  exposure: number;
  cover: string;
} {
  if (Array.isArray(s)) {
    return {
      truth: String(s[0] ?? ""),
      knows: Array.isArray(s[1]) ? s[1].map(String) : s[1] ? [String(s[1])] : [],
      suspects: Array.isArray(s[2]) ? s[2].map(String) : s[2] ? [String(s[2])] : [],
      exposure: Number(s[3] ?? 0),
      cover: String(s[4] ?? ""),
    };
  }
  return {
    truth: String(s?.truth ?? s?.secret ?? ""),
    knows: Array.isArray(s?.knows) ? s.knows.map(String) : [],
    suspects: Array.isArray(s?.suspects) ? s.suspects.map(String) : [],
    exposure: Number(s?.exposure ?? 0),
    cover: String(s?.cover ?? ""),
  };
}

function normalizeBelief(b: any): {
  proposition: string;
  confidence: number;
  source: string;
  basis: string;
  timestamp: string;
} {
  if (Array.isArray(b)) {
    return {
      proposition: String(b[0] ?? ""),
      confidence: Number(b[1] ?? 100),
      source: String(b[2] ?? "direct"),
      basis: String(b[3] ?? ""),
      timestamp: String(b[4] ?? ""),
    };
  }
  return {
    proposition: String(b?.proposition ?? b?.p ?? b?.belief ?? ""),
    confidence: Number(b?.confidence ?? b?.conf ?? 100),
    source: String(b?.source ?? "direct"),
    basis: String(b?.basis ?? ""),
    timestamp: String(b?.timestamp ?? b?.t ?? ""),
  };
}

function normalizeRoutine(r: any): {
  time: string;
  action: string;
  place: string;
  phase: string;
} {
  if (Array.isArray(r)) {
    return {
      time: String(r[0] ?? ""),
      action: String(r[1] ?? ""),
      place: String(r[2] ?? ""),
      phase: String(r[3] ?? ""),
    };
  }
  return {
    time: String(r?.time ?? r?.t ?? ""),
    action: String(r?.action ?? r?.activity ?? ""),
    place: String(r?.place ?? r?.loc ?? ""),
    phase: String(r?.phase ?? ""),
  };
}

export class CharactersTab {
  public root: HTMLElement;
  private selectedActorId: string | null = null;
  private ttsEngine?: VnTtsEngine;

  constructor(ttsEngine?: VnTtsEngine) {
    this.ttsEngine = ttsEngine;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-characters";
  }

  public render(ledger: LedgerData, manifest?: AssetManifest): void {
    this.root.innerHTML = "";
    const actors: Record<string, ActorDossier> = { ...(ledger.actors || {}) };

    // Supplement from roster if actors are not yet recorded as full dossiers
    if (ledger.roster && Array.isArray(ledger.roster)) {
      for (const r of ledger.roster) {
        if (r.id && !actors[r.id]) {
          actors[r.id] = {
            id: r.id,
            name: r.name || r.id,
            life_model: { occupation: r.status || "Resident" },
            agency: { want_now: r.status || "None" },
          };
        }
      }
    }

    // Supplement from scene participants
    if (ledger.scene?.participants && Array.isArray(ledger.scene.participants)) {
      for (const p of ledger.scene.participants) {
        if (typeof p === "string" && !actors[p]) {
          actors[p] = {
            id: p,
            name: p,
            life_model: { occupation: "Participant" },
            agency: { want_now: "Present in scene" },
          };
        }
      }
    }

    const allKeys = Object.keys(actors);
    if (allKeys.length === 0) {
      this.root.innerHTML = `<div class="vn-muted" style="text-align:center; padding: 32px;">No characters recorded in the ledger yet.</div>`;
      return;
    }

    // Sort: user first, then alphabetical
    const actorIds = allKeys.sort((a, b) => {
      if (a.toLowerCase() === "user") return -1;
      if (b.toLowerCase() === "user") return 1;
      return a.localeCompare(b);
    });

    if (!this.selectedActorId || !actors[this.selectedActorId]) {
      this.selectedActorId = actorIds[0]!;
    }

    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div>
          <h3 style="margin:0; font-size:15px; color:#f8fafc; display:flex; align-items:center; gap:6px;">
            <span>👥</span> <span>Cast & Living World Dossiers</span>
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

    // Avatar Ribbon with LOD and Location fallback
    const ribbon = document.createElement("div");
    ribbon.style.cssText = "display: flex; gap: 12px; overflow-x: auto; padding: 6px 4px 14px 4px; border-bottom: 1px solid #334155; margin-bottom: 16px;";

    const rosterMap = new Map<string, RosterCharacter>();
    if (ledger.roster && Array.isArray(ledger.roster)) {
      for (const r of ledger.roster) {
        if (r.id) rosterMap.set(r.id.toLowerCase(), r);
      }
    }

    for (const id of actorIds) {
      const actor = actors[id]!;
      const isSelected = id === this.selectedActorId;
      const cleanId = id.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      const rosterItem = rosterMap.get(id.toLowerCase());

      let avatarUrl = "";
      if (manifest?.characters?.[cleanId]) {
        const charData = manifest.characters[cleanId]!;
        const outfits = charData.outfits || (charData as any);
        const defaultSet = outfits?.["default"] || (outfits ? Object.values(outfits)[0] : undefined);
        avatarUrl = defaultSet?.["neutral"] || defaultSet?.["smile"] || (defaultSet ? Object.values(defaultSet)[0] : "") || "";
      }

      const item = document.createElement("div");
      item.style.cssText = `display: flex; flex-direction: column; align-items: center; cursor: pointer; min-width: 68px; transition: transform 0.15s ease;`;
      const displayName = id.toLowerCase() === "user" ? "Player (You)" : actor.name || id;

      item.innerHTML = `
        <div style="width: 52px; height: 52px; border-radius: 50%; overflow: hidden; border: 2px solid ${isSelected ? "#818cf8" : "#475569"}; box-shadow: ${isSelected ? "0 0 10px rgba(99,102,241,0.6)" : "none"}; background: #1e293b; display: flex; align-items: center; justify-content: center; position: relative;">
          ${avatarUrl ? `<img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="${displayName}" />` : `<span style="font-size: 22px;">👤</span>`}
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

    // Render Detailed Dossier of Selected Actor
    const currentActor = actors[this.selectedActorId]!;
    this.renderActorDetails(currentActor, ledger);
  }

  private renderActorDetails(actor: ActorDossier, ledger: LedgerData): void {
    const container = document.createElement("div");
    container.style.cssText = "display: flex; flex-direction: column; gap: 14px;";

    const isUser = (actor.id || "").toLowerCase() === "user";
    const displayName = isUser ? "Player (You)" : actor.name || actor.id || "Unknown";

    const app = (actor.appearance as Record<string, any>) || {};
    const money = (actor.money as Record<string, any>) || {};
    const combat = (actor.combat as Record<string, any>) || {};
    const life = (actor.life_model as Record<string, any>) || {};
    const outfit = (actor.outfit as Record<string, any>) || {};
    const inv = (actor.inventory as Record<string, any>) || {};
    const wounds = (actor.wounds as Record<string, any>) || {};
    const trauma = Array.isArray(actor.trauma) ? actor.trauma : [];
    const prof = (actor.profile as Record<string, any>) || {};
    const state = (actor.state as Record<string, any>) || {};
    const agency = (actor.agency as Record<string, any>) || {};
    const know = (actor.knowledge as Record<string, any>) || {};
    const rels = (actor.relations as Record<string, any>) || {};

    const conditionStr = app.condition || state.condition || "Normal";
    const wantStr = agency.want_now || "None declared";
    const selfConcept = prof.self_concept || life.self_concept || "";

    // 1. Identity & Physical Persona Banner
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
        <span style="color:#38bdf8; font-weight:700;">🎯 Immediate Want:</span> ${wantStr}
      </div>

      ${selfConcept ? `
        <div style="margin-top:6px; background:#0f172a; border-left:3px solid #38bdf8; padding:6px 8px; border-radius:4px; color:#cbd5e1; font-size:11px;">
          <span style="color:#38bdf8; font-weight:700;">🪞 Self-Concept:</span> "${selfConcept}"
        </div>
      ` : ""}

      ${(actor.constraints || prof.constraints) ? `
        <div style="margin-top:6px; background:rgba(244,63,94,0.1); border:1px solid rgba(244,63,94,0.3); border-radius:4px; padding:6px 8px; color:#fecdd3;">
          <span style="color:#f43f5e; font-weight:700;">⚠️ Constraint / Taboo:</span> ${actor.constraints || prof.constraints}
        </div>
      ` : ""}

      ${(prof.boundaries || prof.red_lines) ? `
        <div style="margin-top:6px; display:flex; flex-direction:column; gap:4px; font-size:11px;">
          ${prof.boundaries ? `<div><span style="color:#f59e0b; font-weight:600;">🚧 Boundaries:</span> <span style="color:#fde68a;">${Array.isArray(prof.boundaries) ? prof.boundaries.join("; ") : prof.boundaries}</span></div>` : ""}
          ${prof.red_lines ? `<div><span style="color:#ef4444; font-weight:600;">🚫 Red Lines:</span> <span style="color:#fca5a5;">${Array.isArray(prof.red_lines) ? prof.red_lines.join("; ") : prof.red_lines}</span></div>` : ""}
        </div>
      ` : ""}

      ${(prof.values || prof.public_roles || prof.capabilities) ? `
        <div style="margin-top:6px; padding-top:6px; border-top:1px solid #334155; display:flex; flex-direction:column; gap:4px; font-size:11px;">
          ${prof.values ? `<div><span style="color:#94a3b8;">Values:</span> <strong style="color:#f8fafc;">${Array.isArray(prof.values) ? prof.values.join(", ") : prof.values}</strong></div>` : ""}
          ${prof.public_roles ? `<div><span style="color:#94a3b8;">Public Roles:</span> <span style="color:#cbd5e1;">${Array.isArray(prof.public_roles) ? prof.public_roles.join(", ") : prof.public_roles}</span></div>` : ""}
          ${prof.capabilities ? `<div><span style="color:#94a3b8;">Capabilities:</span> <span style="color:#cbd5e1;">${Array.isArray(prof.capabilities) ? prof.capabilities.join(", ") : prof.capabilities}</span></div>` : ""}
        </div>
      ` : ""}
    `;

    // Passions Snapshot Badges
    const rawPassions = actor.passions;
    if (rawPassions) {
      let passionBadges: string[] = [];
      if (Array.isArray(rawPassions)) {
        passionBadges = rawPassions.map((p: any) => {
          if (typeof p === "string") return p;
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
            ${passionBadges.map((badge) => `<span style="background: rgba(244,63,94,0.15); border: 1px solid rgba(244,63,94,0.4); color: #fda4af; font-size: 11px; padding: 2px 8px; border-radius: 4px;">🔥 ${badge}</span>`).join("")}
          </div>
        `;
        banner.appendChild(pContainer);
      }
    }

    container.appendChild(banner);

    // 2. Dispositions Grid
    const disps = prof.dispositions as Record<string, any> | undefined;
    if (disps && typeof disps === "object" && Object.keys(disps).length > 0) {
      const dispSection = document.createElement("div");
      dispSection.className = "vn-section";
      dispSection.innerHTML = `<h4>🧭 Personality Dispositions</h4>`;

      const dispGrid = document.createElement("div");
      dispGrid.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 6px;";

      const dispLabels: Record<string, string> = {
        risk: "Risk Propensity",
        assertiveness: "Assertiveness",
        empathy: "Empathy",
        impulse_control: "Impulse Control",
        curiosity: "Curiosity",
        sociability: "Sociability",
        status_sensitivity: "Status Sensitivity",
        acquisitiveness: "Acquisitiveness",
        persistence: "Persistence",
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

    // 3. Needs & Affect Episodes
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
        let needsItems: Array<{ name: string; urgency: string | number }> = [];
        if (Array.isArray(state.needs)) {
          needsItems = state.needs.map((n: any) => {
            if (Array.isArray(n)) return { name: String(n[0] ?? ""), urgency: n[1] ?? 0 };
            if (typeof n === "object" && n !== null) return { name: String(n.name ?? n.need ?? ""), urgency: n.urgency ?? n.value ?? 0 };
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
        const epFormatted = affectEpisodes.map((ep: any) => {
          if (typeof ep === "string") return ep;
          if (Array.isArray(ep)) return `${ep[0] ?? ""}${ep[1] ? ` ➔ ${ep[1]}` : ""}${ep[2] !== undefined ? ` (${ep[2]})` : ""}`;
          if (typeof ep === "object" && ep !== null) {
            return `${ep.name || ep.emotion || "affect"}${ep.target ? ` ➔ ${ep.target}` : ""}${ep.intensity !== undefined ? ` (${ep.intensity})` : ""}`;
          }
          return String(ep);
        });

        nBox.innerHTML += `
          <div style="${hasNeeds ? "border-top: 1px solid #334155; padding-top: 6px;" : ""}">
            <div style="color: #eab308; font-weight: 700; font-size: 11px; margin-bottom: 4px;">Affect Episodes:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${epFormatted.map((ep: string) => `
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

    // 4. Attire & Wardrobe Layer Breakdown
    const outfitSection = document.createElement("div");
    outfitSection.className = "vn-section";
    outfitSection.innerHTML = `<h4>👗 Attire & Wardrobe</h4>`;
    const outfitGrid = document.createElement("div");
    outfitGrid.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px;";

    const outfitKeys: Array<{ label: string; key: string; icon: string }> = [
      { label: "Top", key: "top", icon: "👕" },
      { label: "Bottom", key: "bottom", icon: "👖" },
      { label: "Underwear Top", key: "underwear_top", icon: "👙" },
      { label: "Underwear Bottom", key: "underwear_bottom", icon: "🩲" },
      { label: "Footwear", key: "shoes", icon: "👟" },
      { label: "Hair & Makeup", key: "hair", icon: "💄" },
      { label: "Scent", key: "scent", icon: "✨" },
      { label: "Condition", key: "state", icon: "🧵" },
      { label: "Integrity", key: "integrity", icon: "🛡️" },
      { label: "Residue", key: "residue", icon: "💧" },
    ];

    let hasOutfitItems = false;
    for (const item of outfitKeys) {
      let val = (outfit as any)[item.key] || (item.key === "shoes" ? (outfit as any)["footwear"] : undefined);
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
        <div style="color: #94a3b8; margin-bottom: 2px;">💍 Accessories & Jewelry</div>
        <div style="color: #f8fafc; font-weight: 600;">${accList}</div>
      `;
      outfitGrid.appendChild(accBox);
    }

    if (!hasOutfitItems) {
      outfitGrid.innerHTML = `<div class="vn-muted" style="padding:8px;">Standard default attire</div>`;
    }
    outfitSection.appendChild(outfitGrid);
    container.appendChild(outfitSection);

    // 5. Possessions, Inventory & Wealth
    const invSection = document.createElement("div");
    invSection.className = "vn-section";
    invSection.innerHTML = `<h4>🎒 Equipment, Carried Gear & Finances</h4>`;

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
          ${carriedList.length > 0 ? carriedList.map((item: any) => `<span style="background:#0f172a; border:1px solid #475569; padding:2px 8px; border-radius:4px; font-size:11px; color:#f8fafc;">📦 ${item}</span>`).join("") : `<span class="vn-muted">Nothing carried</span>`}
        </div>
      </div>

      ${roomList.length > 0 ? `
        <div style="margin-top:4px;">
          <div style="color:#94a3b8; font-size:11px; margin-bottom:4px;">Stored in Room (${inv.room_location || "Quarters"}):</div>
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            ${roomList.map((item: any) => `<span style="background:#0f172a; border:1px solid #334155; padding:2px 8px; border-radius:4px; font-size:11px; color:#94a3b8;">🗄️ ${item}</span>`).join("")}
          </div>
        </div>
      ` : ""}
    `;
    invSection.appendChild(invBox);
    container.appendChild(invSection);

    // 6. Combat Vitals & RPG Stats (if populated)
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
              ${(Array.isArray(combat.talent) ? combat.talent : [combat.talent]).map((t: any) => `<span style="background:rgba(129,140,248,0.15); border:1px solid #818cf8; color:#c7d2fe; padding:2px 6px; border-radius:4px;">✦ ${t}</span>`).join("")}
            </div>
          </div>
        ` : ""}
      `;
      combatSection.appendChild(cBox);
      container.appendChild(combatSection);
    }

    // 7. Psychological Condition, Wounds, Traumas & Tells
    const physWounds = Array.isArray(wounds.physical) ? wounds.physical : [];
    const psychWounds = Array.isArray(wounds.psychological) ? wounds.psychological : [];

    // Behavioral tells: object or array
    let formattedTells: string[] = [];
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
    psychoSection.innerHTML = `<h4>🧠 Condition, Tells & Wounds</h4>`;

    const psychoBox = document.createElement("div");
    psychoBox.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; font-size: 12px; display: flex; flex-direction: column; gap: 8px;";
    psychoBox.innerHTML = `
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:8px;">
        <div>
          <div style="color:#fca5a5; font-weight:700; font-size:11px; margin-bottom:3px;">Physical Wounds:</div>
          <div>${physWounds.length > 0 ? physWounds.map((w: any) => `<span style="display:inline-block; background:rgba(239,68,68,0.2); border:1px solid #ef4444; color:#fca5a5; padding:2px 6px; border-radius:4px; margin-right:4px; margin-bottom:4px;">🩹 ${w}</span>`).join("") : `<span class="vn-muted">None</span>`}</div>
        </div>
        <div>
          <div style="color:#fcd34d; font-weight:700; font-size:11px; margin-bottom:3px;">Psychological Wounds & Trauma:</div>
          <div>${(psychWounds.length > 0 || trauma.length > 0) ? [...psychWounds, ...trauma].map((pw: any) => `<span style="display:inline-block; background:rgba(245,158,11,0.2); border:1px solid #f59e0b; color:#fde68a; padding:2px 6px; border-radius:4px; margin-right:4px; margin-bottom:4px;">⚠️ ${pw}</span>`).join("") : `<span class="vn-muted">None</span>`}</div>
        </div>
      </div>

      ${formattedTells.length > 0 ? `
        <div style="margin-top:4px; border-top:1px solid #334155; padding-top:6px;">
          <div style="color:#38bdf8; font-weight:700; font-size:11px; margin-bottom:3px;">👁️ Behavioral Tells & Micro-Expressions:</div>
          <div style="display:flex; flex-direction:column; gap:3px;">
            ${formattedTells.map((t) => `<div style="background:#0f172a; padding:4px 8px; border-radius:4px; font-size:11px; color:#e0f2fe;">${t}</div>`).join("")}
          </div>
        </div>
      ` : ""}

      ${(prof.defense || prof.blind_spot) ? `
        <div style="margin-top:2px; display:flex; flex-wrap:wrap; gap:12px; font-size:11px; color:#94a3b8;">
          ${prof.defense ? `<div>Defense: <strong style="color:#cbd5e1;">${prof.defense}</strong></div>` : ""}
          ${prof.blind_spot ? `<div>Blind Spot: <strong style="color:#cbd5e1;">${prof.blind_spot}</strong></div>` : ""}
        </div>
      ` : ""}
    `;
    psychoSection.appendChild(psychoBox);
    container.appendChild(psychoSection);

    // 8. Life Model, Upbringing & Daily Routines
    const routines = Array.isArray(life.routines) ? life.routines.map(normalizeRoutine) : [];
    const lifeSection = document.createElement("div");
    lifeSection.className = "vn-section";
    lifeSection.innerHTML = `<h4>📖 Persona, Upbringing & Routines</h4>`;

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
            ${routines.map(r => `
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

    // 9. Agency: Active Goals, Plans, Policies & Commitments
    const rawGoals = Array.isArray(agency.goals) ? agency.goals : [];
    const rawPlans = Array.isArray(agency.plans) ? agency.plans : [];
    const rawPolicies = Array.isArray(agency.policies) ? agency.policies : [];
    const rawCommitments = Array.isArray(agency.commitments) ? agency.commitments : [];

    if (rawGoals.length > 0 || rawPlans.length > 0 || rawPolicies.length > 0 || rawCommitments.length > 0) {
      const agencySection = document.createElement("div");
      agencySection.className = "vn-section";
      agencySection.innerHTML = `<h4>🎯 Agency, Plans & Directives</h4>`;

      const agencyBody = document.createElement("div");
      agencyBody.style.cssText = "display: flex; flex-direction: column; gap: 10px;";

      // Goals
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

      // Plans
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

      // Policies & Commitments
      if (rawPolicies.length > 0 || rawCommitments.length > 0) {
        const polBox = document.createElement("div");
        polBox.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 8px 10px; font-size: 11px; display: flex; flex-direction: column; gap: 6px;";
        if (rawPolicies.length > 0) {
          polBox.innerHTML += `
            <div>
              <span style="color: #f59e0b; font-weight: 700;">Operating Policies:</span>
              <ul style="margin: 2px 0 0 16px; padding: 0; color: #cbd5e1;">
                ${rawPolicies.map((pol: any) => `<li>${typeof pol === "object" ? JSON.stringify(pol) : String(pol)}</li>`).join("")}
              </ul>
            </div>
          `;
        }
        if (rawCommitments.length > 0) {
          polBox.innerHTML += `
            <div>
              <span style="color: #22c55e; font-weight: 700;">Active Commitments:</span>
              <ul style="margin: 2px 0 0 16px; padding: 0; color: #cbd5e1;">
                ${rawCommitments.map((com: any) => `<li>${typeof com === "object" ? JSON.stringify(com) : String(com)}</li>`).join("")}
              </ul>
            </div>
          `;
        }
        agencyBody.appendChild(polBox);
      }

      agencySection.appendChild(agencyBody);
      container.appendChild(agencySection);
    }

    // 10. Knowledge, Epistemics, Memories, Expectations & Secrets
    const rawSecrets = Array.isArray(know.secrets) ? know.secrets : [];
    const rawBeliefs = Array.isArray(know.beliefs) ? know.beliefs : [];
    const rawMemories = Array.isArray(know.memories) ? know.memories : [];
    const rawExpectations = Array.isArray(know.expectations) ? know.expectations : [];
    const heldLeverage = know.held_leverage;
    const presentsAs = know.presents_as;

    if (rawSecrets.length > 0 || rawBeliefs.length > 0 || rawMemories.length > 0 || rawExpectations.length > 0 || heldLeverage || presentsAs) {
      const knowSection = document.createElement("div");
      knowSection.className = "vn-section";
      knowSection.innerHTML = `<h4>🔒 Epistemics, Memories & Guarded Secrets</h4>`;

      const knowBox = document.createElement("div");
      knowBox.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; font-size: 12px; display:flex; flex-direction:column; gap:8px;";

      // Presents As
      if (presentsAs) {
        knowBox.innerHTML += `
          <div style="background: #0f172a; padding: 6px 8px; border-radius: 4px; font-size: 11px; border-left: 3px solid #818cf8;">
            <strong style="color: #818cf8;">Presents As:</strong> <span style="color: #e0f2fe;">${typeof presentsAs === "object" ? JSON.stringify(presentsAs) : String(presentsAs)}</span>
          </div>
        `;
      }

      // Held Leverage
      if (heldLeverage && (Array.isArray(heldLeverage) ? heldLeverage.length > 0 : true)) {
        const levList = Array.isArray(heldLeverage) ? heldLeverage : [heldLeverage];
        knowBox.innerHTML += `
          <div style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); padding: 6px 8px; border-radius: 4px; font-size: 11px;">
            <strong style="color: #f59e0b;">Held Leverage:</strong>
            <span style="color: #fde68a;">${levList.map((x: any) => typeof x === "object" ? (x.truth || x.id || JSON.stringify(x)) : String(x)).join("; ")}</span>
          </div>
        `;
      }

      // Memories
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

      // Expectations
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

      // Guarded Secrets
      if (rawSecrets.length > 0) {
        const secrets = rawSecrets.map(normalizeSecret);
        knowBox.innerHTML += `
          <div style="margin-top: 4px;">
            <div style="color:#f43f5e; font-weight:700; font-size:11px; margin-bottom:4px;">Guarded Secrets:</div>
            <div style="display:flex; flex-direction:column; gap:6px;">
              ${secrets.map(s => `
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

      // Beliefs
      if (rawBeliefs.length > 0) {
        const beliefs = rawBeliefs.map(normalizeBelief);
        knowBox.innerHTML += `
          <div style="margin-top:4px;">
            <div style="color:#38bdf8; font-weight:700; font-size:11px; margin-bottom:4px;">Epistemic Beliefs:</div>
            <div style="display:flex; flex-direction:column; gap:4px;">
              ${beliefs.map(b => `
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

    // 11. Relational Ties Matrix
    const targetIds = Object.keys(rels);
    if (targetIds.length > 0) {
      const relsSection = document.createElement("div");
      relsSection.className = "vn-section";
      relsSection.innerHTML = `<h4>🤝 Interpersonal Relations (${targetIds.length})</h4>`;

      const relsList = document.createElement("div");
      relsList.style.cssText = "display: flex; flex-direction: column; gap: 8px;";

      for (const targetId of targetIds) {
        const r = rels[targetId] as Record<string, any>;
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
          ${(r.grievances && (Array.isArray(r.grievances) ? r.grievances.length > 0 : true)) ? `
            <div style="margin-top:4px; color:#f87171;">
              Grievances: <span style="color:#fecdd3;">${(Array.isArray(r.grievances) ? r.grievances : [r.grievances]).map(String).join("; ")}</span>
            </div>
          ` : ""}
          ${(r.shared_secrets && (Array.isArray(r.shared_secrets) ? r.shared_secrets.length > 0 : true)) ? `
            <div style="margin-top:4px; color:#c084fc;">
              Shared Secrets: <span style="color:#e9d5ff;">${(Array.isArray(r.shared_secrets) ? r.shared_secrets : [r.shared_secrets]).map(String).join("; ")}</span>
            </div>
          ` : ""}
          ${(r.leverage && (Array.isArray(r.leverage) ? r.leverage.length > 0 : true)) ? `<div style="margin-top:4px; color:#f59e0b;">Leverage: ${(Array.isArray(r.leverage) ? r.leverage : [r.leverage]).map((x: any) => typeof x === 'object' ? (x.truth || x.id || JSON.stringify(x)) : String(x)).join(", ")}</div>` : ""}
          ${(r.obligations && (Array.isArray(r.obligations) ? r.obligations.length > 0 : true)) ? `<div style="margin-top:4px; color:#38bdf8;">Obligations: ${(Array.isArray(r.obligations) ? r.obligations : [r.obligations]).map((x: any) => typeof x === 'object' ? (x.truth || x.id || JSON.stringify(x)) : String(x)).join(", ")}</div>` : ""}
        `;
        relsList.appendChild(card);
      }
      relsSection.appendChild(relsList);
      container.appendChild(relsSection);
    }

    // Add Voice Assignment Panel to Character Dossier
    if (this.ttsEngine) {
      const voiceSec = document.createElement("div");
      voiceSec.className = "vn-section";
      voiceSec.innerHTML = `<h4>🎙️ Voice Assignment (TTS)</h4>`;

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

      // Populate Profiles from Host
      const profileSelect = vBox.querySelector("#vn-voice-profile-select") as HTMLSelectElement;
      const voiceSelect = vBox.querySelector("#vn-voice-id-select") as HTMLSelectElement;
      const saveBtn = vBox.querySelector("#vn-voice-save-btn") as HTMLButtonElement;
      const testBtn = vBox.querySelector("#vn-voice-test-btn") as HTMLButtonElement;

      void this.ttsEngine.listProfiles().then((profiles) => {
        profiles.forEach((p) => {
          const opt = document.createElement("option");
          opt.value = p.id;
          opt.textContent = `${p.name} (${p.provider})`;
          if (currentVoice?.connectionId === p.id) opt.selected = true;
          profileSelect.appendChild(opt);
        });

        if (profileSelect.value) {
          void updateVoiceList(profileSelect.value);
        }
      });

      const updateVoiceList = async (connId: string) => {
        voiceSelect.innerHTML = `<option value="">(Profile Default Voice)</option>`;
        if (!connId) return;
        const voices = await this.ttsEngine!.listVoices(connId);
        voices.forEach((v) => {
          const opt = document.createElement("option");
          opt.value = v.id;
          opt.textContent = v.name;
          if (currentVoice?.voice === v.id) opt.selected = true;
          voiceSelect.appendChild(opt);
        });
      };

      profileSelect.addEventListener("change", () => {
        void updateVoiceList(profileSelect.value);
      });

      saveBtn.addEventListener("click", () => {
        const connectionId = profileSelect.value;
        const voice = voiceSelect.value;
        const settings = this.ttsEngine!.getSettings();

        if (isNarrator) {
          this.ttsEngine!.updateSettings({
            narrator: connectionId ? { connectionId, voice } : null,
          });
        } else {
          const key = (actor.name || actor.id || "").toLowerCase();
          const nextChars = { ...settings.characters };
          if (connectionId) {
            nextChars[key] = { connectionId, voice };
          } else {
            delete nextChars[key];
          }
          this.ttsEngine!.updateSettings({ characters: nextChars });
        }

        saveBtn.textContent = "✓ Saved!";
        setTimeout(() => { saveBtn.textContent = "Save Voice"; }, 1500);
      });

      testBtn.addEventListener("click", () => {
        const testText = isNarrator
          ? "The morning light filtered through the quiet room."
          : `Hello, my name is ${displayName}.`;

        const selectedConnId = profileSelect.value.trim();
        const selectedVoiceId = voiceSelect.value.trim();

        const activeVoiceRef: SpeechVoiceRef | null = selectedConnId
          ? { connectionId: selectedConnId, voice: selectedVoiceId }
          : null;

        const originalText = testBtn.textContent;
        testBtn.textContent = "🔊 Playing...";
        testBtn.disabled = true;

        void this.ttsEngine!.testVoice(testText, activeVoiceRef, displayName, {
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
          },
        });
      });
    }

    this.root.appendChild(container);
  }
}

```

---

<a id="src-frontend-hud-tab-diagnostics-ts"></a>
## File: `src/frontend/hud/tab-diagnostics.ts`

**Description**: Source file `src/frontend/hud/tab-diagnostics.ts` in LumiVN Visual Novel Engine.

```typescript
import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import type { LedgerData, AssetManifest, StatRulesSettings } from "../../shared/types.js";
import { diagBus, type LogEntry } from "../utils/diag-bus.js";

export class DiagnosticsTab {
  public root: HTMLElement;
  private ctx?: SpindleFrontendContext;
  private currentLedger: LedgerData = {};
  private currentManifest?: AssetManifest;
  private activeFilter: "all" | "info" | "warn" | "error" = "all";
  private unsubscribeBus?: () => void;
  private statRulesSettings: StatRulesSettings | null = null;

  constructor(ctx?: SpindleFrontendContext) {
    this.ctx = ctx;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-diagnostics";
  }

  public setStatRulesSettings(settings: StatRulesSettings): void {
    this.statRulesSettings = settings;
    const modeSelect = this.root.querySelector("#vn-mvu-mode-select") as HTMLSelectElement | null;
    const rulesInput = this.root.querySelector("#vn-stat-rules-input") as HTMLTextAreaElement | null;
    const ledgerInput = this.root.querySelector("#vn-ledger-prompt-input") as HTMLTextAreaElement | null;
    if (modeSelect) modeSelect.value = settings.mode;
    if (rulesInput) rulesInput.value = settings.statRules;
    if (ledgerInput) ledgerInput.value = settings.ledgerPrompt;
  }

  public render(ledger: LedgerData, manifest?: AssetManifest): void {
    this.currentLedger = ledger;
    this.currentManifest = manifest;
    diagBus.setLedger(ledger);
    if (manifest) diagBus.setManifest(manifest);

    this.root.innerHTML = "";
    this.root.style.cssText = "display: flex; flex-direction: column; gap: 14px; height: 100%; color: #f1f5f9; font-family: system-ui, -apple-system, sans-serif;";

    const telemetry = diagBus.getTelemetry();
    const hasLedger = Boolean(ledger && (ledger.clock || ledger.scene || ledger.actors));
    const deltaStatus = hasLedger ? "accepted" : "idle";

    // 1. Header & Quick Copy Action Bar
    const header = document.createElement("div");
    header.style.cssText = "display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; border-bottom: 1px solid #334155; padding-bottom: 10px;";
    header.innerHTML = `
      <div>
        <h3 style="margin: 0; font-size: 15px; color: #fff; display: flex; align-items: center; gap: 6px;">
          <span>🛠️</span> <span>Engine Diagnostics & Clipboard Export</span>
        </h3>
        <p style="margin: 2px 0 0 0; font-size: 11px; color: #94a3b8;">
          Inspect delta synchronization, export living world ledgers, and view engine logs.
        </p>
      </div>
      <div style="display: flex; gap: 6px; flex-wrap: wrap;">
        <button id="vn-copy-all-btn" class="vn-btn vn-btn-sm" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; color: #fff; font-weight: 700; border-radius: 6px; padding: 6px 12px; cursor: pointer; font-size: 11px; box-shadow: 0 2px 8px rgba(99,102,241,0.4);">
          📋 Copy All
        </button>
        <button id="vn-copy-yaml-btn" class="vn-btn vn-btn-sm" style="background: #1e293b; border: 1px solid #475569; color: #38bdf8; font-weight: 600; border-radius: 6px; padding: 6px 10px; cursor: pointer; font-size: 11px;">
          📄 Copy Ledger (YAML)
        </button>
        <button id="vn-copy-director-btn" class="vn-btn vn-btn-sm" style="background: #1e293b; border: 1px solid #8b5cf6; color: #c084fc; font-weight: 600; border-radius: 6px; padding: 6px 10px; cursor: pointer; font-size: 11px;">
          🎬 Copy Director Note
        </button>
        <button id="vn-copy-json-btn" class="vn-btn vn-btn-sm" style="background: #1e293b; border: 1px solid #475569; color: #cbd5e1; border-radius: 6px; padding: 6px 10px; cursor: pointer; font-size: 11px;">
          📦 Copy State (JSON)
        </button>
        <button id="vn-copy-diag-btn" class="vn-btn vn-btn-sm" style="background: #1e293b; border: 1px solid #475569; color: #cbd5e1; border-radius: 6px; padding: 6px 10px; cursor: pointer; font-size: 11px;">
          📜 Copy Logs
        </button>
      </div>
    `;
    this.root.appendChild(header);

    // Copy Button Handlers
    const showToast = (btn: HTMLButtonElement, label: string) => {
      const orig = btn.textContent;
      btn.textContent = "✓ Copied!";
      btn.style.borderColor = "#10b981";
      setTimeout(() => {
        btn.textContent = orig;
        btn.style.borderColor = "";
      }, 1500);
    };

    header.querySelector("#vn-copy-all-btn")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      await navigator.clipboard.writeText(diagBus.exportAllBundle()).catch(() => undefined);
      showToast(btn, "Copy All");
    });

    header.querySelector("#vn-copy-yaml-btn")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      const yamlStr = diagBus.formatLedgerYaml(this.currentLedger);
      await navigator.clipboard.writeText(yamlStr).catch(() => undefined);
      showToast(btn, "Copy Ledger (YAML)");
    });

    header.querySelector("#vn-copy-director-btn")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      const note = diagBus.getDirectorNote();
      if (note && note.directorNote) {
        const textToCopy = `[${note.threadLabel || "Active Thread"}]\n${note.directorNote}`;
        await navigator.clipboard.writeText(textToCopy).catch(() => undefined);
        showToast(btn, "Copy Director Note");
      } else {
        showToast(btn, "No Note Available");
      }
    });

    header.querySelector("#vn-copy-json-btn")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      await navigator.clipboard.writeText(JSON.stringify(this.currentLedger, null, 2)).catch(() => undefined);
      showToast(btn, "Copy State (JSON)");
    });

    header.querySelector("#vn-copy-diag-btn")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      const logLines = diagBus.getLogs().map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join("\n");
      await navigator.clipboard.writeText(logLines).catch(() => undefined);
      showToast(btn, "Copy Logs");
    });

    // 2. Middle Row: Delta Telemetry Card + Actors Presence Breakdown (Living World style)
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
              ${participants.length > 0
                ? participants.map((p) => `<span style="background: rgba(56,189,248,0.2); color: #7dd3fc; border: 1px solid #0284c7; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">👤 ${p}</span>`).join("")
                : '<span style="color: #64748b; font-size: 10px;">No spotlight participants</span>'
              }
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

    // Dedicated Director Note Card
    const directorNote = diagBus.getDirectorNote();
    const directorCard = document.createElement("div");
    directorCard.style.cssText = "background: #0f172a; border: 1px solid #6366f1; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 6px;";
    directorCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 6px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 14px;">🎬</span>
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

    // Dedicated Stat Rules & MVU Ledger Configuration Card
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
        <button id="vn-save-rules-btn" style="background: #0284c7; color: #fff; border: none; border-radius: 4px; padding: 6px 14px; font-size: 11px; font-weight: 700; cursor: pointer;">💾 Save & Update Rules</button>
      </div>
    `;
    this.root.appendChild(rulesCard);

    const modeSelect = rulesCard.querySelector("#vn-mvu-mode-select") as HTMLSelectElement | null;
    const rulesInput = rulesCard.querySelector("#vn-stat-rules-input") as HTMLTextAreaElement | null;
    const ledgerInput = rulesCard.querySelector("#vn-ledger-prompt-input") as HTMLTextAreaElement | null;
    const saveRulesBtn = rulesCard.querySelector("#vn-save-rules-btn") as HTMLButtonElement | null;

    if (this.statRulesSettings) {
      if (modeSelect) modeSelect.value = this.statRulesSettings.mode;
      if (rulesInput) rulesInput.value = this.statRulesSettings.statRules;
      if (ledgerInput) ledgerInput.value = this.statRulesSettings.ledgerPrompt;
    } else {
      this.ctx?.sendToBackend?.({ type: "vn_get_stat_rules_settings" });
    }

    saveRulesBtn?.addEventListener("click", () => {
      const updated: StatRulesSettings = {
        mode: (modeSelect?.value as any) || "mvu_quiet",
        statRules: rulesInput?.value || "",
        ledgerPrompt: ledgerInput?.value || "",
        enabled: true,
      };
      this.statRulesSettings = updated;
      this.ctx?.sendToBackend?.({
        type: "vn_save_stat_rules_settings",
        settings: updated,
      });
      if (saveRulesBtn) {
        const orig = saveRulesBtn.textContent;
        saveRulesBtn.textContent = "✓ Saved!";
        setTimeout(() => {
          saveRulesBtn.textContent = orig;
        }, 1500);
      }
    });

    // 3. Bottom Row: Diagnostic Console & Raw Ledger Viewer Split
    const bottomSplit = document.createElement("div");
    bottomSplit.style.cssText = "flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; min-height: 220px; overflow: hidden;";

    // Left Pane: Diagnostic Log Console
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

    // Right Pane: Raw Ledger / Markdown Inspector
    const ledgerBox = document.createElement("div");
    ledgerBox.style.cssText = "background: #020617; border: 1px solid #1e293b; border-radius: 10px; padding: 10px; display: flex; flex-direction: column; gap: 8px;";
    ledgerBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase;">Active World Ledger Viewer</span>
        <button id="vn-copy-editor-btn" style="padding: 2px 8px; font-size: 10px; background: #1e293b; border: 1px solid #475569; border-radius: 4px; color: #38bdf8; font-weight: 600; cursor: pointer;">
          📋 Copy Block
        </button>
      </div>
      <textarea id="vn-ledger-editor" readonly style="flex: 1; background: #090d16; border: 1px solid #334155; border-radius: 6px; color: #a5b4fc; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10px; padding: 8px; resize: none; outline: none; user-select: text; white-space: pre; max-height: 200px;">${diagBus.formatLedgerYaml(this.currentLedger)}</textarea>
    `;

    bottomSplit.appendChild(consoleBox);
    bottomSplit.appendChild(ledgerBox);
    this.root.appendChild(bottomSplit);

    // Setup filter listeners
    const stream = consoleBox.querySelector("#vn-diag-stream") as HTMLElement;
    const renderLogs = () => {
      if (!stream) return;
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
        item.style.color =
          entry.level === "error"
            ? "#f43f5e"
            : entry.level === "warn"
            ? "#f59e0b"
            : entry.level === "action"
            ? "#38bdf8"
            : "#cbd5e1";
        item.textContent = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
        stream.appendChild(item);
      }
      stream.scrollTop = stream.scrollHeight;
    };

    renderLogs();

    consoleBox.querySelector("#vn-filter-all")?.addEventListener("click", () => { this.activeFilter = "all"; this.render(this.currentLedger, this.currentManifest); });
    consoleBox.querySelector("#vn-filter-info")?.addEventListener("click", () => { this.activeFilter = "info"; this.render(this.currentLedger, this.currentManifest); });
    consoleBox.querySelector("#vn-filter-warn")?.addEventListener("click", () => { this.activeFilter = "warn"; this.render(this.currentLedger, this.currentManifest); });
    consoleBox.querySelector("#vn-filter-error")?.addEventListener("click", () => { this.activeFilter = "error"; this.render(this.currentLedger, this.currentManifest); });
    consoleBox.querySelector("#vn-clear-logs")?.addEventListener("click", () => { diagBus.clearLogs(); renderLogs(); });

    ledgerBox.querySelector("#vn-copy-editor-btn")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      const textarea = ledgerBox.querySelector("#vn-ledger-editor") as HTMLTextAreaElement;
      if (textarea) {
        await navigator.clipboard.writeText(textarea.value).catch(() => undefined);
        showToast(btn, "Copy Block");
      }
    });

    // Subscribe to bus updates
    const updateDirectorCard = () => {
      const note = diagBus.getDirectorNote();
      const labelEl = directorCard.querySelector("#vn-director-thread-label");
      const bodyEl = directorCard.querySelector("#vn-director-note-body");
      if (labelEl) labelEl.textContent = note?.threadLabel || "General Steering";
      if (bodyEl) bodyEl.textContent = note?.directorNote || "No active turn steering notes recorded.";
    };

    if (this.unsubscribeBus) this.unsubscribeBus();
    this.unsubscribeBus = diagBus.subscribe(() => {
      renderLogs();
      updateDirectorCard();
    });
  }
}

```

---

<a id="src-frontend-hud-tab-inventory-ts"></a>
## File: `src/frontend/hud/tab-inventory.ts`

**Description**: Source file `src/frontend/hud/tab-inventory.ts` in LumiVN Visual Novel Engine.

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

---

<a id="src-frontend-hud-tab-journal-ts"></a>
## File: `src/frontend/hud/tab-journal.ts`

**Description**: Source file `src/frontend/hud/tab-journal.ts` in LumiVN Visual Novel Engine.

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

---

<a id="src-frontend-hud-tab-map-ts"></a>
## File: `src/frontend/hud/tab-map.ts`

**Description**: Source file `src/frontend/hud/tab-map.ts` in LumiVN Visual Novel Engine.

```typescript
import type { LedgerData, PlaceRoute, PlaceNode } from "../../shared/types.js";

export class MapTab {
  public root: HTMLElement;
  private onAction: (actionText: string) => void;
  private viewMode: "indoor" | "outdoor" = "indoor";

  // Pan & Zoom state
  private zoom = 1.0;
  private panX = 0;
  private panY = 0;
  private isPanning = false;
  private startPointerX = 0;
  private startPointerY = 0;
  private selectedNodeId: string | null = null;

  constructor(onAction: (actionText: string) => void) {
    this.onAction = onAction;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-map";
  }

  public render(ledger: LedgerData): void {
    this.root.innerHTML = "";
    const currentPlace = (ledger.scene?.place || "default").toLowerCase();
    const isIndoor = currentPlace.includes(":") || currentPlace.includes("residence") || currentPlace.includes("dojo") || currentPlace.includes("room") || currentPlace.includes("foyer");
    
    // Default to matching mode if not manually changed
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
            <span>🗺️</span> <span>Interactive Cartography & Blueprint</span>
          </h3>
          <p class="vn-muted" style="margin: 2px 0 0 0; font-size: 11px;">
            <span>⏱️ <strong>${ledger.clock?.t || "D1 12:00"}</strong> (${ledger.clock?.phase || "Day"})</span>
            ${ledger.clock?.date ? `<span> • 📅 ${ledger.clock.date}</span>` : ""}
            <span> • 📍 <span style="color:#38bdf8; font-weight: 600;">${currentPlace}</span></span>
          </p>
        </div>
        <div style="display: flex; gap: 6px; align-items: center;">
          <div style="background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 2px; display: flex;">
            <button id="vn-map-indoor-btn" class="vn-btn vn-btn-sm" style="border: none; border-radius: 4px; padding: 4px 10px; font-size: 11px; cursor: pointer; ${this.viewMode === "indoor" ? "background: #6366f1; color: #fff; font-weight: 600;" : "background: transparent; color: #94a3b8;"}">
              🏠 Blueprint
            </button>
            <button id="vn-map-outdoor-btn" class="vn-btn vn-btn-sm" style="border: none; border-radius: 4px; padding: 4px 10px; font-size: 11px; cursor: pointer; ${this.viewMode === "outdoor" ? "background: #6366f1; color: #fff; font-weight: 600;" : "background: transparent; color: #94a3b8;"}">
              🌐 District
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

    // Main map container layout: Canvas viewport + Details sidebar
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

  private resetView(): void {
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
  }

  private adjustZoom(factor: number): void {
    this.zoom = Math.max(0.4, Math.min(3.0, this.zoom * factor));
    this.updateTransform();
  }

  private updateTransform(): void {
    const group = this.root.querySelector("#vn-map-svg-group") as SVGGraphicsElement | null;
    if (group) {
      group.setAttribute("transform", `translate(${this.panX}, ${this.panY}) scale(${this.zoom})`);
    }
  }

  private setupPanZoom(viewport: HTMLElement): void {
    viewport.addEventListener("pointerdown", (e) => {
      if ((e.target as HTMLElement).closest(".vn-map-node-interactive")) return;
      this.isPanning = true;
      this.startPointerX = e.clientX - this.panX;
      this.startPointerY = e.clientY - this.panY;
      viewport.style.cursor = "grabbing";
      viewport.setPointerCapture(e.pointerId);
    });

    viewport.addEventListener("pointermove", (e) => {
      if (!this.isPanning) return;
      this.panX = e.clientX - this.startPointerX;
      this.panY = e.clientY - this.startPointerY;
      this.updateTransform();
    });

    const endPan = (e: PointerEvent) => {
      if (!this.isPanning) return;
      this.isPanning = false;
      viewport.style.cursor = "grab";
      try { viewport.releasePointerCapture(e.pointerId); } catch {}
    };

    viewport.addEventListener("pointerup", endPan);
    viewport.addEventListener("pointercancel", endPan);

    viewport.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
      this.adjustZoom(zoomFactor);
    }, { passive: false });
  }

  private renderGraph(viewport: HTMLElement, ledger: LedgerData, currentPlace: string): void {
    viewport.innerHTML = "";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.display = "block";

    // Blueprint grid pattern definition
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

    // Background rect with grid
    const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bgRect.setAttribute("width", "100%");
    bgRect.setAttribute("height", "100%");
    bgRect.setAttribute("fill", "url(#grid-pattern)");
    svg.appendChild(bgRect);

    // Dynamic zoomable group
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

  private renderIndoorSvg(group: SVGGElement, ledger: LedgerData, currentPlace: string): void {
    const scopePrefix = currentPlace.includes(":") ? currentPlace.split(":")[0]! : "building";
    const currentRoom = currentPlace.includes(":") ? currentPlace.split(":")[1]! : currentPlace;

    // Collect rooms
    const knownPlaces = Object.keys(ledger.places || {});
    const indoorKeys = knownPlaces.filter((p) => p.startsWith(`${scopePrefix}:`) || !p.includes(":"));
    const rawKeys = indoorKeys.length > 0
      ? indoorKeys
      : ["entrance", "living_room", "kitchen", "hallway", "bedroom", "courtyard", "bathroom"];

    // Layout nodes in a blueprint coordinate scheme
    interface RoomLayout {
      id: string;
      cleanName: string;
      x: number;
      y: number;
      w: number;
      h: number;
    }

    const layouts: RoomLayout[] = [];
    const cols = 3;
    const roomW = 160;
    const roomH = 95;
    const gapX = 50;
    const gapY = 40;
    const startX = 60;
    const startY = 40;

    rawKeys.forEach((key, idx) => {
      const clean = key.includes(":") ? key.split(":")[1]! : key;
      const c = idx % cols;
      const r = Math.floor(idx / cols);
      layouts.push({
        id: key,
        cleanName: clean,
        x: startX + c * (roomW + gapX),
        y: startY + r * (roomH + gapY),
        w: roomW,
        h: roomH,
      });
    });

    // Draw connecting corridor paths between adjacent rooms
    for (let i = 0; i < layouts.length; i++) {
      for (let j = i + 1; j < layouts.length; j++) {
        const r1 = layouts[i]!;
        const r2 = layouts[j]!;
        const dx = Math.abs(r1.x - r2.x);
        const dy = Math.abs(r1.y - r2.y);
        if ((dx <= roomW + gapX + 10 && dy === 0) || (dy <= roomH + gapY + 10 && dx === 0)) {
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

    // Render Room Boxes and NPC Presence Tokens
    layouts.forEach((room) => {
      const isHere = room.cleanName.toLowerCase() === currentRoom.toLowerCase() || room.id === currentPlace;
      const isSelected = room.id === this.selectedNodeId;
      const placeConfig = (ledger.places?.[room.id] || {}) as PlaceNode;

      // Check route gating if coming from current place
      const currentRoutes = (ledger.places?.[currentPlace]?.routes || []) as PlaceRoute[];
      const routeToThis = currentRoutes.find((r) => typeof r === "object" && r.to === room.id);
      const isLocked = Boolean(routeToThis?.why_not || (routeToThis?.requires && Object.keys(routeToThis.requires).length > 0));

      const roomG = document.createElementNS("http://www.w3.org/2000/svg", "g");
      roomG.setAttribute("class", "vn-map-node-interactive");
      roomG.style.cursor = "pointer";

      // Rect
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

      // Title
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", String(room.x + 12));
      text.setAttribute("y", String(room.y + 24));
      text.setAttribute("fill", isHere ? "#38bdf8" : "#f1f5f9");
      text.setAttribute("font-size", "12");
      text.setAttribute("font-weight", "700");
      text.textContent = (room.cleanName.replace(/_/g, " ")).toUpperCase();
      roomG.appendChild(text);

      // Room type / privacy hint
      const sub = document.createElementNS("http://www.w3.org/2000/svg", "text");
      sub.setAttribute("x", String(room.x + 12));
      sub.setAttribute("y", String(room.y + 38));
      sub.setAttribute("fill", "#64748b");
      sub.setAttribute("font-size", "9");
      sub.textContent = placeConfig.norm || (isLocked ? `🔒 ${routeToThis?.why_not || "Restricted"}` : "Interior Zone");
      roomG.appendChild(sub);

      // Presence badges
      const npcsInRoom = (ledger.roster || []).filter((r) =>
        (r.loc || "").toLowerCase().includes(room.cleanName.toLowerCase())
      );

      let tokenOffset = 0;
      if (isHere) {
        // Player badge
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

  private renderOutdoorSvg(group: SVGGElement, ledger: LedgerData, currentPlace: string): void {
    const places = ledger.places || {};
    const placeKeys = Object.keys(places);

    const outdoorKeys = placeKeys.length > 0
      ? placeKeys
      : ["nerima_district", "tendo_dojo", "furinkan_high", "cat_cafe", "shopping_district", "park"];

    // Distribute nodes in a pleasant circular or multi-hub cartography layout
    interface NodePos {
      id: string;
      x: number;
      y: number;
    }

    const nodes: NodePos[] = [];
    const centerX = 320;
    const centerY = 200;
    const radius = 140;

    outdoorKeys.forEach((key, idx) => {
      if (idx === 0) {
        nodes.push({ id: key, x: centerX, y: centerY });
      } else {
        const angle = ((idx - 1) / (outdoorKeys.length - 1)) * 2 * Math.PI;
        nodes.push({
          id: key,
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
        });
      }
    });

    const nodeMap = new Map<string, NodePos>(nodes.map((n) => [n.id, n]));

    // Draw route paths
    nodes.forEach((source) => {
      const routes = (places[source.id]?.routes || []) as PlaceRoute[];
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

          // Route minute badge on midpoint
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

    // Draw Nodes
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
        const countBadge = this.createPresenceToken(node.x - 16, node.y + 14, `👥 ${npcs.length}`, "#4338ca", "#c7d2fe");
        nodeG.appendChild(countBadge);
      }

      nodeG.addEventListener("click", () => {
        this.selectedNodeId = node.id;
        this.render(ledger);
      });

      group.appendChild(nodeG);
    });
  }

  private createPresenceToken(x: number, y: number, textStr: string, bg: string, fg: string): SVGGElement {
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

  private renderSidebar(sidebar: HTMLElement, ledger: LedgerData, currentPlace: string): void {
    sidebar.innerHTML = "";
    const selected = this.selectedNodeId || currentPlace;
    const cleanName = selected.includes(":") ? selected.split(":")[1]! : selected;
    const placeConfig = (ledger.places?.[selected] || {}) as PlaceNode;
    const isHere = selected.toLowerCase() === currentPlace.toLowerCase() || cleanName.toLowerCase() === currentPlace.toLowerCase();

    // Check routing gating
    const currentRoutes = (ledger.places?.[currentPlace]?.routes || []) as PlaceRoute[];
    const route = currentRoutes.find((r) => typeof r === "object" && (r.to === selected || r.to === cleanName));
    const isGated = Boolean(route?.why_not || (route?.requires && Object.keys(route.requires).length > 0));
    const whyNot = route?.why_not;

    // Presence in selected node
    const npcsHere = (ledger.roster || []).filter((r) => (r.loc || "").toLowerCase().includes(cleanName.toLowerCase()));

    sidebar.innerHTML = `
      <div style="border-bottom: 1px solid #334155; padding-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h4 style="margin: 0; font-size: 13px; color: #38bdf8; text-transform: uppercase;">
            ${cleanName.replace(/_/g, " ")}
          </h4>
          ${isHere ? '<span style="font-size: 10px; background: #0284c7; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: 700;">CURRENT</span>' : ''}
        </div>
        <p style="margin: 2px 0 0 0; font-size: 11px; color: #94a3b8;">${placeConfig.norm || (placeConfig.indoors ? "Indoor Facility" : "Public District")}</p>
      </div>

      ${isGated ? `
        <div style="background: rgba(244, 63, 94, 0.15); border: 1px solid #f43f5e; border-radius: 6px; padding: 8px; font-size: 11px; color: #fda4af;">
          <strong>🔒 Access Restricted:</strong>
          <div style="margin-top: 3px;">${whyNot || "Requirements not met."}</div>
        </div>
      ` : ''}

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
        ` : ''}
      </div>

      ${Array.isArray(placeConfig.affordances) && placeConfig.affordances.length > 0 ? `
        <div>
          <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Affordances</div>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${placeConfig.affordances.map((a: string) => `<span style="background: #1e293b; border: 1px solid #475569; padding: 2px 6px; border-radius: 4px; font-size: 10px;">${a}</span>`).join("")}
          </div>
        </div>
      ` : ''}

      ${Array.isArray(placeConfig.hazards) && placeConfig.hazards.length > 0 ? `
        <div>
          <div style="font-size: 10px; color: #f59e0b; text-transform: uppercase; margin-bottom: 4px;">⚠️ Hazards</div>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${placeConfig.hazards.map((h: string) => `<span style="background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; padding: 2px 6px; border-radius: 4px; font-size: 10px; color: #fcd34d;">${h}</span>`).join("")}
          </div>
        </div>
      ` : ''}

      <div>
        <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Present Cast (${npcsHere.length})</div>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          ${npcsHere.length > 0
            ? npcsHere.map((n) => `
                <div style="background: #1e293b; padding: 4px 8px; border-radius: 4px; font-size: 11px; display: flex; justify-content: space-between;">
                  <span style="color: #c7d2fe; font-weight: 600;">${n.name || n.id}</span>
                  <span style="color: #94a3b8; font-size: 10px;">${n.posture || n.activity || "Idle"}</span>
                </div>
              `).join("")
            : '<span style="color: #64748b; font-size: 11px;">No detected actors</span>'
          }
        </div>
      </div>

      <div style="margin-top: auto; padding-top: 10px;">
        ${!isHere ? `
          <button id="vn-sidebar-navigate-btn" class="vn-btn" style="width: 100%; padding: 8px; font-size: 12px; font-weight: 700; ${isGated ? "background: #475569; cursor: not-allowed; opacity: 0.7;" : "background: #6366f1; cursor: pointer;"}" ${isGated ? "disabled" : ""}>
            ${isGated ? "🔒 Travel Gated" : `Travel to ${cleanName.replace(/_/g, " ")}`}
          </button>
        ` : `
          <button class="vn-btn" style="width: 100%; padding: 8px; font-size: 12px; background: #0284c7; cursor: default;" disabled>
            ✓ Already Present Here
          </button>
        `}
      </div>
    `;

    sidebar.querySelector("#vn-sidebar-navigate-btn")?.addEventListener("click", () => {
      if (isGated) return;
      this.onAction(`*Travels to the ${cleanName.replace(/_/g, " ")}*`);
    });
  }
}

```

---

<a id="src-frontend-hud-tab-phone-ts"></a>
## File: `src/frontend/hud/tab-phone.ts`

**Description**: Source file `src/frontend/hud/tab-phone.ts` in LumiVN Visual Novel Engine.

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
  private isOverlayActive?: () => boolean;

  constructor(
    ctx: SpindleFrontendContext,
    onAction: (actionText: string) => void,
    isOverlayActive?: () => boolean
  ) {
    this.ctx = ctx;
    this.onAction = onAction;
    this.isOverlayActive = isOverlayActive;
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
        <div style="font-size: 11px; color: #38bdf8; margin-top: 2px;">📍 ${locStr}${regionStr}</div>
      </div>
      <div style="flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; align-content: start; margin-top: 6px;">
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
      if (this.isOverlayActive && !this.isOverlayActive()) return;
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
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
    const onKeyUp = (e: KeyboardEvent) => {
      if (this.isOverlayActive && !this.isOverlayActive()) return;
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
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
      if (this.isOverlayActive && !this.isOverlayActive()) return;
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
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
    const onKeyUp = (e: KeyboardEvent) => {
      if (this.isOverlayActive && !this.isOverlayActive()) return;
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
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
      if (this.isOverlayActive && !this.isOverlayActive()) return;
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
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

---

<a id="src-frontend-hud-tab-scene-ts"></a>
## File: `src/frontend/hud/tab-scene.ts`

**Description**: Source file `src/frontend/hud/tab-scene.ts` in LumiVN Visual Novel Engine.

```typescript
import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import type { LedgerData, AssetManifest } from "../../shared/types.js";
import { resolveOutfitName } from "../../backend/asset-resolver.js";
import { getSpriteTransform, type SpriteTransform } from "../stage/sprite-transform.js";

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

  private async uploadImageFile(file: { name: string; bytes: Uint8Array; mimeType?: string }): Promise<string | null> {
    // Attempt direct HTTP upload to avoid multi-megabyte WebSocket IPC serialization
    try {
      const formData = new FormData();
      formData.append("file", new Blob([file.bytes as any], { type: file.mimeType || "image/png" }), file.name);
      const resp = await fetch("/api/v1/images", {
        method: "POST",
        body: formData,
      });
      if (resp.ok) {
        const data = await resp.json();
        const url = data.url || data.image_url || (data.id ? `/api/v1/images/${data.id}` : "");
        if (url) return url;
      }
    } catch {
      // Fallback if host direct fetch is unavailable
    }
    return null;
  }

  private async fileToDataUrl(file: { bytes: Uint8Array; mimeType?: string }): Promise<string> {
    let binary = "";
    for (let i = 0; i < file.bytes.byteLength; i++) {
      binary += String.fromCharCode(file.bytes[i]!);
    }
    return `data:${file.mimeType || "image/png"};base64,${btoa(binary)}`;
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
            userId,
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
            userId,
          });
        }
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
                userId,
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
                userId,
              });
            }
          } catch (e) {
            console.error("[LumiVN] Sprite upload failed:", e);
          }
        });

        btnRow.appendChild(uploadSpriteBtn);
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
            userId,
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
            userId,
          });
        }
      } catch (err) {
        console.error("[LumiVN] Action upload failed:", err);
      }
    });

    actionBtnRow.appendChild(uploadActionBtn);
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
}

```

---

<a id="src-frontend-hud-tab-stats-ts"></a>
## File: `src/frontend/hud/tab-stats.ts`

**Description**: Source file `src/frontend/hud/tab-stats.ts` in LumiVN Visual Novel Engine.

```typescript
import type { LedgerData, ActorDossier } from "../../shared/types.js";

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
    const actors: Record<string, ActorDossier> = { ...(ledger.actors || {}) };

    // Supplement from roster if actors not yet in actors dict
    if (ledger.roster && Array.isArray(ledger.roster)) {
      for (const r of ledger.roster) {
        if (r.id && !actors[r.id]) {
          actors[r.id] = {
            id: r.id,
            name: r.name || r.id,
            profile: { public_roles: [r.status || "Resident"] },
          };
        }
      }
    }

    const actorIds = Object.keys(actors);
    if (actorIds.length === 0) {
      this.root.innerHTML = `<div class="vn-muted" style="padding: 32px; text-align: center;">No actor dossiers recorded.</div>`;
      return;
    }

    // Default to first actor that has stats or relations if user has neither, or keep current
    if (!actors[this.selectedActorId]) {
      // Find one with stats or relations, otherwise first
      const withStats = actorIds.find(id => actors[id]?.stats || (actors[id]?.relations && Object.keys(actors[id]!.relations!).length > 0));
      this.selectedActorId = withStats || actorIds[0]!;
    }

    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div>
          <h3 style="margin:0; font-size:15px; color:#f8fafc; display:flex; align-items:center; gap:6px;">
            <span>📊</span> <span>Status, Passions & 21-Stat Ledger Matrix</span>
          </h3>
          <p class="vn-muted" style="margin:2px 0 0 0; font-size:11px;">
            Comprehensive emotional equilibrium, psychological friction, RPG vitals, and relational dynamics.
          </p>
        </div>
      </div>
    `;
    this.root.appendChild(header);

    // Actor Selector Ribbon
    const controls = document.createElement("div");
    controls.style.cssText = "display: flex; gap: 10px; margin-bottom: 14px; align-items: center; flex-wrap: wrap; background: #1e293b; padding: 8px 12px; border-radius: 8px; border: 1px solid #334155;";
    controls.innerHTML = `
      <label style="font-size: 12px; color: #94a3b8; font-weight:600;">Inspect Actor:</label>
      <select id="vn-stats-actor-select" style="background: #0f172a; color: #f8fafc; border: 1px solid #475569; border-radius: 6px; padding: 4px 10px; font-size: 12px;">
        ${actorIds.map((id) => {
          const a = actors[id]!;
          const label = id.toLowerCase() === "user" ? "Player (You)" : a.name || id;
          const hasMatrix = a.stats ? " [21-Stat]" : "";
          return `<option value="${id}" ${id === this.selectedActorId ? "selected" : ""}>${label}${hasMatrix}</option>`;
        }).join("")}
      </select>
    `;
    this.root.appendChild(controls);

    const actorSelect = controls.querySelector("#vn-stats-actor-select") as HTMLSelectElement;
    actorSelect.addEventListener("change", () => {
      this.selectedActorId = actorSelect.value;
      this.render(ledger);
    });

    const actor = actors[this.selectedActorId]!;
    const statsMatrix = (actor.stats as Record<string, number | undefined>) || {};
    const combat = (actor.combat as Record<string, any>) || {};

    // 1. RPG Vitals (HP / MP / Attributes)
    if (combat && (combat.hp || combat.pwr || combat.tier)) {
      const vitalsSection = document.createElement("div");
      vitalsSection.className = "vn-section";
      vitalsSection.innerHTML = `<h4>⚔️ Vitals & Attributes</h4>`;

      const vBox = document.createElement("div");
      vBox.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; font-size: 12px;";

      // Parse HP / MP percentages if in "X/Y" format
      const parseRatio = (val: any) => {
        if (typeof val === "string" && val.includes("/")) {
          const [cur, max] = val.split("/").map(Number);
          return max && max > 0 ? Math.max(0, Math.min(100, (cur / max) * 100)) : 100;
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

    // 2. The 21-Stat Ledger Matrix (if actor has `stats`)
    const statKeys = Object.keys(statsMatrix);
    if (statKeys.length > 0) {
      const matrixSection = document.createElement("div");
      matrixSection.className = "vn-section";
      matrixSection.innerHTML = `<h4>🎲 21-Stat Engine Matrix (${statKeys.length} metrics)</h4>`;

      const matrixBox = document.createElement("div");
      matrixBox.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; gap: 10px;";

      // Groups of stats
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
            { k: "G", name: "Grudge", max: 100 },
          ],
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
            { k: "BLD", name: "Bleed / Leakage", max: 100 },
          ],
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
            { k: "COMP", name: "Compliance", max: 100 },
          ],
        },
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
            const pct = Math.max(0, Math.min(100, (num / def.max) * 100));
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

    // 3. Current Passions & Emotional Affect
    const passionsSection = document.createElement("div");
    passionsSection.className = "vn-section";
    passionsSection.innerHTML = `<h4>🔥 Current Passions & Affect</h4>`;
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
      badgesContainer.innerHTML = `<span class="vn-muted" style="padding:4px;">Equilibrium / Baseline emotional state</span>`;
    }
    passionsSection.appendChild(badgesContainer);
    this.root.appendChild(passionsSection);

    // 4. Relationships Meter Matrix
    const rels = actor.relations || {};
    const availableTargets = Object.keys(rels);

    const relsSection = document.createElement("div");
    relsSection.className = "vn-section";

    if (availableTargets.length === 0) {
      relsSection.innerHTML = `<h4>🤝 Interpersonal Relations</h4><div class="vn-muted">No outgoing relationship edges initialized for this actor.</div>`;
      this.root.appendChild(relsSection);
    } else {
      if (!rels[this.selectedTargetId]) {
        this.selectedTargetId = availableTargets[0]!;
      }

    relsSection.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h4 style="margin: 0;">Relations Toward:</h4>
        <select id="vn-stats-target-select" style="background: #1e293b; color: #f8fafc; border: 1px solid #475569; border-radius: 6px; padding: 4px 8px; font-size: 12px;">
          ${availableTargets.map((t) => `<option value="${t}" ${t === this.selectedTargetId ? "selected" : ""}>${t.toLowerCase() === "user" ? "Player (You)" : actors[t]?.name || t}</option>`).join("")}
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
    extraInfo.style.cssText = "margin-top: 14px; background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px; font-size: 12px; display: flex; flex-direction: column; gap: 8px;";

    const formatChip = (item: any, color: string, badge: string) => {
      const text = typeof item === "object" ? (item.truth || item.id || JSON.stringify(item)) : String(item);
      return `<span style="display:inline-flex; align-items:center; gap:4px; background:${color}22; border:1px solid ${color}66; color:${color}; padding:2px 8px; border-radius:12px; font-size:11px; margin:2px 4px 2px 0;"><strong>${badge}</strong> ${text}</span>`;
    };

    const leverageChips = Array.isArray(activeRel.leverage) && activeRel.leverage.length > 0
      ? activeRel.leverage.map((item: any) => formatChip(item, "#f59e0b", "LEVERAGE")).join("")
      : '<span class="vn-muted">None</span>';

    const obligationChips = Array.isArray(activeRel.obligations) && activeRel.obligations.length > 0
      ? activeRel.obligations.map((item: any) => formatChip(item, "#38bdf8", "DEBT")).join("")
      : '<span class="vn-muted">None</span>';

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

    // 5. Active Investigations
    const investigations = ledger.world?.investigations;
    if (investigations && Object.keys(investigations).length > 0) {
      const invSection = document.createElement("div");
      invSection.className = "vn-section";
      invSection.innerHTML = `<h4>🔍 Active Investigations</h4>`;
      const invContainer = document.createElement("div");
      invContainer.style.cssText = "display: flex; flex-direction: column; gap: 8px;";

      for (const [auth, track] of Object.entries(investigations)) {
        if (!track) continue;
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

```

---

<a id="src-frontend-hud-tab-wardrobe-ts"></a>
## File: `src/frontend/hud/tab-wardrobe.ts`

**Description**: Source file `src/frontend/hud/tab-wardrobe.ts` in LumiVN Visual Novel Engine.

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

    const statusBar = document.createElement("div");
    statusBar.className = "vn-wardrobe-status-bar";
    const scentVal = outfit.scent || "None";
    const conditionVal = outfit.state || "Clean";
    const integrityVal = outfit.integrity ?? 100;
    const residueVal =
      Array.isArray(outfit.residue) && outfit.residue.length > 0
        ? outfit.residue.join(", ")
        : "None";

    statusBar.innerHTML = `
      <div class="vn-wardrobe-status-item"><span>Scent:</span> <strong>${scentVal}</strong></div>
      <div class="vn-wardrobe-status-item"><span>Condition:</span> <strong>${conditionVal}</strong></div>
      <div class="vn-wardrobe-status-item"><span>Integrity:</span> <strong>${integrityVal}%</strong></div>
      <div class="vn-wardrobe-status-item"><span>Residue:</span> <strong>${residueVal}</strong></div>
    `;
    this.root.appendChild(statusBar);

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

```

---

<a id="src-frontend-stage-audio-player-ts"></a>
## File: `src/frontend/stage/audio-player.ts`

**Description**: Source file `src/frontend/stage/audio-player.ts` in LumiVN Visual Novel Engine.

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

---

<a id="src-frontend-stage-backlog-ts"></a>
## File: `src/frontend/stage/backlog.ts`

**Description**: Source file `src/frontend/stage/backlog.ts` in LumiVN Visual Novel Engine.

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

---

<a id="src-frontend-stage-beat-splitter-ts"></a>
## File: `src/frontend/stage/beat-splitter.ts`

**Description**: Source file `src/frontend/stage/beat-splitter.ts` in LumiVN Visual Novel Engine.

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

const PROSE_EMOTION_PATTERNS: Array<{ regex: RegExp; emotion: string }> = [
  { regex: /\b(?:blush(?:ed|ing|es)?|flush(?:ed|ing|es)?|shyly|embarrass(?:ed|ing)?)\b/i, emotion: "blush" },
  { regex: /\b(?:smil(?:ed|ing|es)?|grin(?:ned|ning|s)?|laugh(?:ed|ing|s)?|chuckle(?:d|s|ing)?|beam(?:ed|ing|s)?|giggle(?:d|s|ing)?)\b/i, emotion: "smile" },
  { regex: /\b(?:frown(?:ed|ing|es)?|scowl(?:ed|ing|es)?|glar(?:ed|ing|es)?|growl(?:ed|ing|s)?|snapp(?:ed|ing|s)?|shout(?:ed|ing|s)?|yell(?:ed|ing|s)?|anger|angry)\b/i, emotion: "angry" },
  { regex: /\b(?:gasp(?:ed|ing|s)?|flinch(?:ed|ing|es)?|trembl(?:ed|ing|es)?|startl(?:ed|ing|es)?|terrifi(?:ed|es)?|fear|scared)\b/i, emotion: "fear" },
  { regex: /\b(?:sigh(?:ed|ing|s)?|look(?:ed|ing|s)?\s+down|tear(?:ed|ing)?\s+up|sob(?:bed|bing|s)?|sad(?:ly)?|pensive)\b/i, emotion: "sad" },
  { regex: /\b(?:narrow(?:ed|ing|s)?\s+eyes|rais(?:ed|ing|es)?\s+an?\s+eyebrow|skeptic(?:al)?|suspicious(?:ly)?)\b/i, emotion: "suspicious" },
];

export function inferEmotionFromText(text: string): string | undefined {
  for (const { regex, emotion } of PROSE_EMOTION_PATTERNS) {
    if (regex.test(text)) return emotion;
  }
  return undefined;
}

export function inferActionFromText(text: string): string | undefined {
  const italicMatch = text.match(/\*([A-Za-z0-9_\-\s]{2,30})\*/);
  if (italicMatch && !/^\s*(?:said|whispered|asked|replied)\s*$/i.test(italicMatch[1]!)) {
    return italicMatch[1]!.trim().toLowerCase().replace(/\s+/g, "_");
  }
  return undefined;
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
        const inferredExpr = expression || inferEmotionFromText(chunk);
        const inferredAct = action || inferActionFromText(chunk);
        beats.push({
          speaker,
          text: cleanBody,
          rawText: chunk,
          expression: inferredExpr,
          action: inferredAct,
          sfx,
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
      sfx,
    });
  }

  return beats.length > 0 ? beats : [{ speaker: defaultSpeaker, text: "...", rawText: "..." }];
}

```

---

<a id="src-frontend-stage-choice-modal-ts"></a>
## File: `src/frontend/stage/choice-modal.ts`

**Description**: Source file `src/frontend/stage/choice-modal.ts` in LumiVN Visual Novel Engine.

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

---

<a id="src-frontend-stage-dialogue-box-ts"></a>
## File: `src/frontend/stage/dialogue-box.ts`

**Description**: Source file `src/frontend/stage/dialogue-box.ts` in LumiVN Visual Novel Engine.

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
  isOverlayActive?: () => boolean;
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
  private isOverlayActive?: () => boolean;
  private onKeydown?: (e: KeyboardEvent) => void;
  private audioEngine?: VnAudioEngine;
  private ttsEngine?: VnTtsEngine;
  private knownActors: string[] = [];
  private isUserTurn = false;
  private lastUserText = "";

  constructor(options: DialogueBoxOptions) {
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
    this.voiceBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      this.audioEngine?.playSfx("click");
      const active = this.ttsEngine?.toggle() ?? false;
      this.voiceBtn.innerHTML = active ? "🔊 Voice" : "🔇 Voice";
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

    this.onKeydown = (e: KeyboardEvent) => {
      // 1. Strict Stage / Overlay Active Gate
      if (this.isOverlayActive && !this.isOverlayActive()) {
        return;
      }
      if (!this.root.isConnected || this.root.offsetParent === null) {
        return;
      }
      const stageOverlay = this.root.closest<HTMLElement>(".vn-stage-overlay");
      if (stageOverlay && stageOverlay.style.display === "none") {
        return;
      }

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
    };

    window.addEventListener("keydown", this.onKeydown);
  }

  public reset(): void {
    if (this.typeTimer) clearTimeout(this.typeTimer);
    if (this.autoTimer) clearTimeout(this.autoTimer);
    if (this.skipTimer) clearTimeout(this.skipTimer);
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

  public showGeneratingIndicator(): void {
    if (this.typeTimer) clearTimeout(this.typeTimer);
    if (this.autoTimer) clearTimeout(this.autoTimer);
    if (this.skipTimer) clearTimeout(this.skipTimer);
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

  public presentUserParagraph(text: string, speaker = "You", isWaiting = true): void {
    if (this.typeTimer) clearTimeout(this.typeTimer);
    if (this.autoTimer) clearTimeout(this.autoTimer);
    if (this.skipTimer) clearTimeout(this.skipTimer);
    this.ttsEngine?.stop();

    this.isUserTurn = true;
    this.lastUserText = text;
    this.beats = [];
    this.currentBeatIndex = 0;
    this.nameplate.textContent = speaker || "You";
    this.nameplate.style.display = "block";

    const { html } = formatDialogueHtml(text);
    const waitingHtml = isWaiting
      ? `<div class="vn-generating-indicator" style="margin-top:10px;font-size:0.85em;opacity:0.75;display:inline-flex;align-items:center;gap:6px;"><span>✍️</span> <i>Writing next response...</i></div>`
      : "";

    this.textContainer.innerHTML = `<div>${html}</div>${waitingHtml}`;
    this.choicesContainer.innerHTML = "";
    this.composerContainer.style.display = "none";
    this.nextBtn.style.display = "none";
    this.prevBtn.disabled = true;

    // Record into backlog history
    this.backlogHistory.push({
      messageId: "user-" + Date.now(),
      speaker: speaker || "You",
      text,
      isUser: true,
    });
  }

  public setContent(speakerName: string, paragraphs: string[], messageId = ""): void {
    if (this.typeTimer) clearTimeout(this.typeTimer);
    if (this.autoTimer) clearTimeout(this.autoTimer);
    if (this.skipTimer) clearTimeout(this.skipTimer);
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
    let hasStartedTyping = false;
    let stepDelay = 20;

    const startTypewriter = (audioDuration?: number) => {
      if (hasStartedTyping || !this.isTyping) return;
      hasStartedTyping = true;

      // Pacing synchronized to audio duration when available
      if (audioDuration && audioDuration > 0 && plain.length > 0) {
        stepDelay = Math.max(10, Math.min(80, (audioDuration * 1000) / (plain.length / 2)));
      }
      tick();
    };

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
        this.typeTimer = window.setTimeout(tick, stepDelay);
      }
    };

    if (this.ttsEngine?.isEnabled()) {
      // 1.2s fallback timer in case browser autoplay policy blocks audio
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
        },
      });
    } else {
      startTypewriter();
    }
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
    if (this.onKeydown) {
      window.removeEventListener("keydown", this.onKeydown);
      this.onKeydown = undefined;
    }
    if (this.typeTimer) clearTimeout(this.typeTimer);
    if (this.autoTimer) clearTimeout(this.autoTimer);
    if (this.skipTimer) clearTimeout(this.skipTimer);
    this.ttsEngine?.stop();
    this.choiceModal.root.remove();
    this.backlogModal.root.remove();
  }
}

```

---

<a id="src-frontend-stage-overlay-ts"></a>
## File: `src/frontend/stage/overlay.ts`

**Description**: Source file `src/frontend/stage/overlay.ts` in LumiVN Visual Novel Engine.

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
      isOverlayActive: () => this.isActive(),
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
      isOverlayActive: () => this.isActive(),
      ttsEngine: this.ttsEngine,
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

  public openHudTab(tabId: any): void {
    this.menuBar.openTab(tabId);
  }

  public setStatRulesSettings(settings: any): void {
    this.menuBar.setStatRulesSettings(settings);
  }

  public getCurrentChatId(): string | null {
    return this.resolveChatId() || null;
  }

  private resolveChatId(): string | undefined {
    // 1. Host context check (always check live active chat first)
    const ctxAny = this.ctx as any;
    const active = ctxAny.getActiveChat?.() || ctxAny.activeChat || ctxAny.chat;
    const activeId = active?.id || active?.chatId;
    if (activeId && typeof activeId === "string") return activeId;

    // 2. URL path/hash inspection (/chat/:id or #/chat/:id)
    if (typeof window !== "undefined") {
      const urlMatch = window.location.href.match(/[\/#]chat[s]?\/([a-zA-Z0-9_-]+)/);
      if (urlMatch?.[1]) return urlMatch[1];

      // 3. DOM dataset inspection
      const chatEl = document.querySelector("[data-chat-id]");
      if (chatEl) return chatEl.getAttribute("data-chat-id") || undefined;
    }

    return this.currentChatId || undefined;
  }

  public resetStage(targetChatId?: string): void {
    this.currentChatId = targetChatId || this.resolveChatId() || null;
    this.ttsEngine.setChatId(this.currentChatId || "");
    this.lastProcessedEvtId = null;
    this.dialogueBox.reset();
    this.stageRenderer.reset();
  }

  public showGenerating(): void {
    this.dialogueBox.showGeneratingIndicator();
  }

  public showUserMessage(text: string, speaker = "You"): void {
    this.dialogueBox.presentUserParagraph(text, speaker, true);
  }

  public onChatChanged(newChatId: string | null): void {
    const resolved = newChatId || this.resolveChatId() || null;
    this.resetStage(resolved || undefined);

    if (this.active && resolved) {
      this.ctx.sendToBackend({
        type: "vn_stage_opened",
        chatId: resolved,
      });
      this.ctx.sendToBackend({
        type: "vn_get_state",
        chatId: resolved,
      });
    }
  }

  public activate(): void {
    if (this.active) return;
    this.active = true;

    // Register component overrides (priority 10 replace)
    const ctxAny = this.ctx as any;
    const regOverride =
      typeof ctxAny.registerComponentOverride === "function"
        ? ctxAny.registerComponentOverride.bind(ctxAny)
        : typeof ctxAny.ui?.registerComponentOverride === "function"
        ? ctxAny.ui.registerComponentOverride.bind(ctxAny.ui)
        : null;

    if (regOverride) {
      try {
        const dummyComponent = () => null;
        this.overrideHandles = (["BubbleMessage", "MinimalMessage", "InputArea"] as const).map(
          (host) =>
            regOverride({
              host,
              componentId: host,
              mode: "replace",
              priority: 10,
              component: dummyComponent,
              render: (target: HTMLElement) => {
                target.style.display = "none";
              },
            })
        );
      } catch (e) {
        console.warn("[LumiVN] Failed to register component overrides:", e);
      }
    }

    this.root.style.display = "block";
    const targetChatId = this.resolveChatId();

    this.ctx.sendToBackend({
      type: "vn_stage_opened",
      chatId: targetChatId || "",
    });

    this.ctx.sendToBackend({
      type: "vn_get_state",
      chatId: targetChatId || "",
    });
  }

  public deactivate(): void {
    if (!this.active) return;
    this.active = false;

    const targetChatId = this.resolveChatId();
    this.ctx.sendToBackend({
      type: "vn_stage_closed",
      chatId: targetChatId || "",
    });

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
    const activeChat = this.resolveChatId();
    // Guard against stale async responses arriving after chat was switched
    if (activeChat && state.chatId && state.chatId !== activeChat) {
      return;
    }

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

---

<a id="src-frontend-stage-particles-ts"></a>
## File: `src/frontend/stage/particles.ts`

**Description**: Source file `src/frontend/stage/particles.ts` in LumiVN Visual Novel Engine.

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
    if (typeof requestAnimationFrame !== "undefined") {
      requestAnimationFrame(() => this.handleResize());
    } else {
      setTimeout(() => this.handleResize(), 0);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("resize", this.handleResize);
    }
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

---

<a id="src-frontend-stage-rich-text-ts"></a>
## File: `src/frontend/stage/rich-text.ts`

**Description**: Source file `src/frontend/stage/rich-text.ts` in LumiVN Visual Novel Engine.

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

---

<a id="src-frontend-stage-sprite-transform-ts"></a>
## File: `src/frontend/stage/sprite-transform.ts`

**Description**: Source file `src/frontend/stage/sprite-transform.ts` in LumiVN Visual Novel Engine.

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

---

<a id="src-frontend-stage-staging-ts"></a>
## File: `src/frontend/stage/staging.ts`

**Description**: Source file `src/frontend/stage/staging.ts` in LumiVN Visual Novel Engine.

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

```

---

<a id="src-frontend-stage-theme-ts"></a>
## File: `src/frontend/stage/theme.ts`

**Description**: Source file `src/frontend/stage/theme.ts` in LumiVN Visual Novel Engine.

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

---

<a id="src-frontend-stage-tts-engine-ts"></a>
## File: `src/frontend/stage/tts-engine.ts`

**Description**: Source file `src/frontend/stage/tts-engine.ts` in LumiVN Visual Novel Engine.

```typescript
export interface SpeechVoiceRef {
  connectionId: string;
  voice: string;
  speed?: number;
}

export interface VnVoiceSettings {
  enabled: boolean;
  volume: number;
  narrator: SpeechVoiceRef | null;
  characterDefault: SpeechVoiceRef | null;
  characters: Record<string, SpeechVoiceRef>; // Key: "chat::<chatId>::<lowercased_name>" or "<lowercased_name>"
}

export const DEFAULT_VOICE_SETTINGS: VnVoiceSettings = {
  enabled: false,
  volume: 0.8,
  narrator: null,
  characterDefault: null,
  characters: {},
};

export interface SafeTtsProfile {
  id: string;
  name: string;
  provider: string;
  model: string;
  voice: string;
  isDefault: boolean;
}

export interface VoiceOption {
  id: string;
  name: string;
}

export interface SpeakCallbacks {
  onStart?: (duration?: number) => void;
  onBoundary?: (charIndex: number) => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

export function speakerKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export function characterVoiceKey(chatId: string, name: string): string {
  return `chat::${chatId}::${speakerKey(name)}`;
}

export class VnTtsEngine {
  private currentAudio: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private settings: VnVoiceSettings = { ...DEFAULT_VOICE_SETTINGS };
  private activeChatId = "";
  private cachedDefaultConnection: SafeTtsProfile | null = null;

  constructor() {
    this.loadLocalSettings();
  }

  public setChatId(chatId: string): void {
    this.activeChatId = chatId;
  }

  public getSettings(): VnVoiceSettings {
    return this.settings;
  }

  public updateSettings(patch: Partial<VnVoiceSettings>): void {
    this.settings = { ...this.settings, ...patch };
    this.saveLocalSettings();
    if (!this.settings.enabled) this.stop();
  }

  public setEnabled(val: boolean): void {
    this.updateSettings({ enabled: val });
  }

  private loadLocalSettings(): void {
    try {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem("lumivn_voice_settings");
        if (raw) this.settings = { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(raw) };
      }
    } catch {}
  }

  private saveLocalSettings(): void {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("lumivn_voice_settings", JSON.stringify(this.settings));
      }
    } catch {}
  }

  public isEnabled(): boolean {
    return this.settings.enabled;
  }

  public toggle(): boolean {
    this.updateSettings({ enabled: !this.settings.enabled });
    return this.settings.enabled;
  }

  public stop(): void {
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

  public cleanDialogueText(text: string): string {
    return text
      .replace(/<[^>]+>/g, "")
      .replace(/\[\[.*?\]\]/g, "")
      .replace(/\[(?:expression|pose|emotion|action|sfx)[^\]]*\]/gi, "")
      .replace(/\{\{img::[^\}]+\}\}/gi, "")
      .replace(/[\*_~`#]/g, "")
      .replace(/["“”]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Fetches saved Lumiverse TTS connections via the authenticated host REST API
   */
  public async listProfiles(): Promise<SafeTtsProfile[]> {
    try {
      const res = await fetch("/api/v1/tts-connections?limit=50", { credentials: "include" });
      if (!res.ok) return [];
      const body = await res.json();
      const rows = Array.isArray(body.data) ? body.data : [];
      return rows.map((r: any) => ({
        id: r.id,
        name: r.name || r.id,
        provider: r.provider || "",
        model: r.model || "",
        voice: r.voice || "",
        isDefault: Boolean(r.is_default),
      }));
    } catch {
      return [];
    }
  }

  /**
   * Resolves default connection from host
   */
  public async resolveDefaultConnection(forceRefresh = false): Promise<SafeTtsProfile | null> {
    if (this.cachedDefaultConnection && !forceRefresh) {
      return this.cachedDefaultConnection;
    }
    const profiles = await this.listProfiles();
    const found = profiles.find((p) => p.isDefault) || profiles[0] || null;
    this.cachedDefaultConnection = found;
    return found;
  }

  /**
   * Fetches model-specific voices for a connection
   */
  public async listVoices(connectionId: string): Promise<VoiceOption[]> {
    if (!connectionId) return [];
    try {
      const res = await fetch(`/api/v1/tts-connections/${encodeURIComponent(connectionId)}/voices`, { credentials: "include" });
      if (!res.ok) return [];
      const body = await res.json();
      const rows = Array.isArray(body.voices) ? body.voices : [];
      return rows.map((v: any) => ({
        id: v.id || v.name,
        name: v.name || v.id,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Resolves voice ref: override -> character default -> narrator -> host default -> null
   */
  public resolveVoice(speakerName = ""): SpeechVoiceRef | null {
    const clean = speakerKey(speakerName);
    const isNarrator = !clean || clean === "narrator";

    if (isNarrator) {
      return this.settings.narrator || this.settings.characterDefault || null;
    }

    // Check chat-scoped override, then global character name, then characterDefault, then narrator
    const scopedKey = characterVoiceKey(this.activeChatId, clean);
    return (
      this.settings.characters[scopedKey] ||
      this.settings.characters[clean] ||
      this.settings.characterDefault ||
      this.settings.narrator ||
      null
    );
  }

  public async speak(
    text: string,
    speakerName = "",
    callbacks?: SpeakCallbacks | (() => void)
  ): Promise<void> {
    if (!this.settings.enabled || !text.trim()) {
      if (typeof callbacks === "function") callbacks();
      else callbacks?.onEnd?.();
      return;
    }
    this.stop();

    const cb: SpeakCallbacks =
      typeof callbacks === "function" ? { onEnd: callbacks } : callbacks || {};

    const cleanText = this.cleanDialogueText(text);
    if (!cleanText) {
      cb.onEnd?.();
      return;
    }

    let voiceRef = this.resolveVoice(speakerName);

    // Fall back to host default connection if no explicit voice configured
    if (!voiceRef?.connectionId) {
      const defaultConn = await this.resolveDefaultConnection();
      if (defaultConn) {
        voiceRef = {
          connectionId: defaultConn.id,
          voice: defaultConn.voice || "",
        };
      }
    }

    // 1. Try Lumiverse Server Synthesize Path
    if (voiceRef?.connectionId) {
      try {
        const payload: Record<string, unknown> = {
          connectionId: voiceRef.connectionId,
          text: cleanText,
          outputFormat: "mp3",
        };
        if (voiceRef.voice) payload.voice = voiceRef.voice;
        if (voiceRef.speed) payload.parameters = { speed: voiceRef.speed };

        const resp = await fetch("/api/v1/tts/synthesize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
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
      } catch (err) {
        // Fall through to browser Web Speech API
      }
    }

    // 2. Browser Native Web Speech API Fallback
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      this.currentUtterance = utterance;
      utterance.volume = this.settings.volume;

      utterance.onstart = () => {
        cb.onStart?.();
      };
      utterance.onboundary = (e) => {
        if (e.name === "word") cb.onBoundary?.(e.charIndex);
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

  /**
   * Tests a specific voice connection directly, bypassing global enable state.
   */
  public async testVoice(
    text: string,
    overrideVoiceRef?: SpeechVoiceRef | null,
    speakerName = "",
    callbacks?: SpeakCallbacks
  ): Promise<void> {
    if (!text.trim()) return;
    this.stop();

    const cb: SpeakCallbacks = callbacks || {};
    const cleanText = text.replace(/<[^>]*>/g, "").trim();
    const voiceRef = overrideVoiceRef !== undefined ? overrideVoiceRef : this.resolveVoice(speakerName);

    // 1. Host REST Synthesis Path
    if (voiceRef?.connectionId) {
      try {
        const payload: Record<string, unknown> = {
          connectionId: voiceRef.connectionId,
          text: cleanText,
          outputFormat: "mp3",
        };
        if (voiceRef.voice) payload.voice = voiceRef.voice;
        if (voiceRef.speed) payload.parameters = { speed: voiceRef.speed };

        const resp = await fetch("/api/v1/tts/synthesize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          throw new Error(`TTS synthesis returned HTTP ${resp.status}`);
        }

        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        this.currentAudio = audio;
        audio.volume = Math.max(0, Math.min(1, this.settings.volume || 1.0));

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

    // 2. Browser Native Web Speech API Fallback
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      this.currentUtterance = utterance;
      utterance.volume = this.settings.volume || 1.0;

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

```

---

<a id="src-frontend-studio-diagnostics-drawer-ts"></a>
## File: `src/frontend/studio/diagnostics-drawer.ts`

**Description**: Source file `src/frontend/studio/diagnostics-drawer.ts` in LumiVN Visual Novel Engine.

```typescript
import type { SpindleFrontendContext, SpindleDrawerTabHandle } from "lumiverse-spindle-types";
import type { DiagnosticData, DirectorSettings, DirectorLogEntry } from "../../shared/types.js";

export interface DiagnosticsDrawerHandle {
  tab: SpindleDrawerTabHandle;
  pushLog: (msg: string, level?: "info" | "warn" | "error" | "action") => void;
  updateDiagnostic: (data: DiagnosticData) => void;
  setLatestLedger: (ledger: unknown) => void;
  setLatestManifest: (manifest: unknown) => void;
  setDirectorSettings: (settings: DirectorSettings) => void;
  pushDirectorLog: (log: DirectorLogEntry) => void;
  setDirectorLogs: (logs: DirectorLogEntry[]) => void;
}

function escapeHtml(text: string): string {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function registerDiagnosticsDrawer(
  ctx: SpindleFrontendContext,
  onLaunchStage: () => void
): DiagnosticsDrawerHandle | null {
  if (typeof ctx.ui?.registerDrawerTab !== "function") return null;

  const tab = ctx.ui.registerDrawerTab({
    id: "vn_diagnostics",
    title: "LumiVN Controls & Diagnostics",
    shortName: "VN Studio",
    headerTitle: "Visual Novel Studio",
    description: "Launch visual novel stage, inspect Ledger parsing, and copy engine logs",
    keywords: ["vn", "diagnostics", "ledger", "visual novel", "stage", "studio", "director"],
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>`,
  });

  const root = tab.root;
  let rawLogHistory: string[] = [];
  let rawDirectorLogs: DirectorLogEntry[] = [];
  let latestLedgerData: unknown = null;
  let latestManifestData: unknown = null;
  let activeConsoleTab: "logs" | "director" = "logs";

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
          <span>🎬 Director Instructions & Scene Notes</span>
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
            📋 Copy State JSON
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
              📋 Copy Logs
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

  const consoleStream = root.querySelector("#vn-console-stream") as HTMLElement;
  const directorStream = root.querySelector("#vn-director-log-stream") as HTMLElement;
  const directorEmptyNotice = root.querySelector("#vn-director-empty-notice") as HTMLElement;

  const tabLogsBtn = root.querySelector("#vn-console-tab-logs") as HTMLButtonElement;
  const tabDirectorBtn = root.querySelector("#vn-console-tab-director") as HTMLButtonElement;

  const systemTextarea = root.querySelector("#vn-director-system") as HTMLTextAreaElement;
  const notesTextarea = root.querySelector("#vn-director-notes") as HTMLTextAreaElement;
  const enabledCheckbox = root.querySelector("#vn-director-enabled") as HTMLInputElement;
  const saveBtn = root.querySelector("#vn-director-save-btn") as HTMLButtonElement;

  const copyLogsBtn = root.querySelector("#vn-copy-logs-btn") as HTMLButtonElement;
  const copyStateBtn = root.querySelector("#vn-copy-state-btn") as HTMLButtonElement;

  // Tab switching
  const setConsoleTab = (tabMode: "logs" | "director") => {
    activeConsoleTab = tabMode;
    if (tabMode === "logs") {
      if (consoleStream) consoleStream.style.display = "flex";
      if (directorStream) directorStream.style.display = "none";
      if (tabLogsBtn) {
        tabLogsBtn.style.background = "#334155";
        tabLogsBtn.style.color = "#fff";
      }
      if (tabDirectorBtn) {
        tabDirectorBtn.style.background = "#1e293b";
        tabDirectorBtn.style.color = "#94a3b8";
      }
    } else {
      if (consoleStream) consoleStream.style.display = "none";
      if (directorStream) directorStream.style.display = "flex";
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
    const settings: DirectorSettings = {
      systemPrompt: systemTextarea?.value || "",
      userNotes: notesTextarea?.value || "",
      enabled: enabledCheckbox?.checked ?? true,
    };
    ctx.sendToBackend?.({
      type: "vn_save_director_settings",
      settings,
    });
    if (saveBtn) {
      saveBtn.textContent = "✓ Saved!";
      setTimeout(() => (saveBtn.textContent = "Save Directives"), 1500);
    }
  });

  root.querySelector("#vn-clear-log-btn")?.addEventListener("click", () => {
    if (activeConsoleTab === "logs") {
      if (consoleStream) consoleStream.innerHTML = "";
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

  const pushLog = (msg: string, level: "info" | "warn" | "error" | "action" = "info") => {
    const time = new Date().toLocaleTimeString();
    const entry = `[${time}] [${level.toUpperCase()}] ${msg}`;
    rawLogHistory.push(entry);

    if (!consoleStream) return;
    const line = document.createElement("div");
    line.style.wordBreak = "break-word";
    line.style.color =
      level === "error"
        ? "#f43f5e"
        : level === "warn"
        ? "#f59e0b"
        : level === "action"
        ? "#38bdf8"
        : "#cbd5e1";
    line.textContent = entry;
    consoleStream.appendChild(line);
    consoleStream.scrollTop = consoleStream.scrollHeight;
  };

  copyLogsBtn?.addEventListener("click", async () => {
    try {
      if (activeConsoleTab === "logs") {
        await navigator.clipboard.writeText(rawLogHistory.join("\n"));
      } else {
        await navigator.clipboard.writeText(JSON.stringify(rawDirectorLogs, null, 2));
      }
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

  const updateDiagnostic = (data: DiagnosticData) => {
    const elLedger = root.querySelector("#diag-ledger-status") as HTMLElement;
    const elPlace = root.querySelector("#diag-place-id") as HTMLElement;
    const elCast = root.querySelector("#diag-cast-list") as HTMLElement;
    const elBg = root.querySelector("#diag-bg-url") as HTMLElement;

    if (elLedger) {
      elLedger.textContent = data.hasLedger ? "DETECTED (Parsed)" : "NOT FOUND (Prose-only)";
      elLedger.style.color = data.hasLedger ? "#10b981" : "#f59e0b";
    }
    if (elPlace) elPlace.textContent = data.placeId || "default";
    if (elCast) elCast.textContent = data.participants.length > 0 ? data.participants.join(", ") : "None";
    if (elBg) elBg.textContent = data.bgUrl.startsWith("data:") ? "[Fallback SVG Data URI]" : data.bgUrl;

    pushLog(`Turn parsed: place='${data.placeId}', actors=${data.participants.length}`, "info");
  };

  const setLatestLedger = (ledger: unknown) => {
    latestLedgerData = ledger;
  };

  const setLatestManifest = (manifest: unknown) => {
    latestManifestData = manifest;
  };

  const setDirectorSettings = (settings: DirectorSettings) => {
    if (!settings) return;
    if (systemTextarea) systemTextarea.value = settings.systemPrompt || "";
    if (notesTextarea) notesTextarea.value = settings.userNotes || "";
    if (enabledCheckbox) enabledCheckbox.checked = settings.enabled ?? true;
  };

  const renderDirectorLogCard = (entry: DirectorLogEntry): HTMLElement => {
    const card = document.createElement("div");
    card.style.cssText =
      "background: rgba(15, 23, 42, 0.8); border: 1px solid #334155; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px; font-size: 11px;";

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
            ${entry.worldChanges.map((w) => `<li>${escapeHtml(w)}</li>`).join("")}
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
            ${entry.npcChanges
              .map((n) => {
                const parts: string[] = [];
                if (n.wantNow) parts.push(`want_now -> "${escapeHtml(n.wantNow)}"`);
                if (n.passionsMoved && Object.keys(n.passionsMoved).length > 0) {
                  parts.push(
                    `passions: ${Object.entries(n.passionsMoved)
                      .map(([k, v]) => `${k} (${v})`)
                      .join(", ")}`
                  );
                }
                if (n.relationsMoved && Object.keys(n.relationsMoved).length > 0) {
                  parts.push(
                    `relations: ${escapeHtml(JSON.stringify(n.relationsMoved))}`
                  );
                }
                return `<li><strong>${escapeHtml(n.name)}:</strong> ${parts.join(" | ")}</li>`;
              })
              .join("")}
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
            ${entry.mutations.map((m) => `<li>${escapeHtml(m)}</li>`).join("")}
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
        <div style="background: #020617; border: 1px solid #1e293b; border-radius: 4px; padding: 6px; margin-top: 4px; font-family: ui-monospace, Menlo, monospace; font-size: 10px; color: #cbd5e1; white-space: pre-wrap; word-break: break-word;">${escapeHtml(entry.directive)}</div>
      </details>
      ${worldHtml}
      ${npcHtml}
      ${mutHtml}
      ${quietHtml}
    `;

    return card;
  };

  const pushDirectorLog = (log: DirectorLogEntry) => {
    rawDirectorLogs.push(log);
    if (rawDirectorLogs.length > 20) {
      rawDirectorLogs.shift();
    }
    if (!directorStream) return;
    if (directorEmptyNotice) directorEmptyNotice.style.display = "none";

    const card = renderDirectorLogCard(log);
    directorStream.appendChild(card);
    directorStream.scrollTop = directorStream.scrollHeight;
  };

  const setDirectorLogs = (logs: DirectorLogEntry[]) => {
    rawDirectorLogs = Array.isArray(logs) ? [...logs] : [];
    if (!directorStream) return;
    directorStream.innerHTML = "";
    if (rawDirectorLogs.length === 0) {
      directorStream.appendChild(directorEmptyNotice);
      if (directorEmptyNotice) directorEmptyNotice.style.display = "block";
      return;
    }
    if (directorEmptyNotice) directorEmptyNotice.style.display = "none";
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
    setDirectorLogs,
  };
}

```

---

<a id="src-frontend-utils-diag-bus-ts"></a>
## File: `src/frontend/utils/diag-bus.ts`

**Description**: Source file `src/frontend/utils/diag-bus.ts` in LumiVN Visual Novel Engine.

```typescript
import type { LedgerData, AssetManifest, DirectorNoteData, DiagnosticData } from "../../shared/types.js";

export interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "action";
  message: string;
}

export type DiagListener = () => void;

class DiagnosticBus {
  private logs: LogEntry[] = [];
  private telemetry: DiagnosticData | null = null;
  private latestDirectorNote: DirectorNoteData | null = null;
  private latestLedger: LedgerData = {};
  private latestManifest: AssetManifest | null = null;
  private listeners: Set<DiagListener> = new Set();
  private maxLogs = 500;

  constructor() {
    this.pushLog("LumiVN Diagnostic Bus initialized.", "info");
  }

  public subscribe(listener: DiagListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {}
    }
  }

  public pushLog(message: string, level: "info" | "warn" | "error" | "action" = "info"): void {
    const time = new Date().toLocaleTimeString();
    this.logs.push({ timestamp: time, level, message });
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    this.notify();
  }

  public clearLogs(): void {
    this.logs = [];
    this.notify();
  }

  public getLogs(): readonly LogEntry[] {
    return this.logs;
  }

  public setTelemetry(data: DiagnosticData): void {
    this.telemetry = data;
    this.pushLog(
      `Turn telemetry: place='${data.placeId}', bg='${(data.bgUrl || "").slice(0, 32)}...', cast=[${(data.participants || []).join(", ")}]`,
      "info"
    );
    this.notify();
  }

  public getTelemetry(): DiagnosticData | null {
    return this.telemetry;
  }

  public setLedger(ledger: LedgerData): void {
    this.latestLedger = ledger;
    this.notify();
  }

  public getLedger(): LedgerData {
    return this.latestLedger;
  }

  public setManifest(manifest: AssetManifest): void {
    this.latestManifest = manifest;
    this.notify();
  }

  public getManifest(): AssetManifest | null {
    return this.latestManifest;
  }

  public setDirectorNote(note: DirectorNoteData): void {
    this.latestDirectorNote = note;
    this.pushLog(`Director Note updated: [${note.threadLabel}]`, "info");
    this.notify();
  }

  public getDirectorNote(): DirectorNoteData | null {
    return this.latestDirectorNote;
  }

  /** Formats current ledger into a clean YAML representation */
  public formatLedgerYaml(ledger?: LedgerData): string {
    const data = ledger || this.latestLedger;
    try {
      // Basic YAML serializer for clean Markdown ledger blocks
      const lines: string[] = ["```yaml"];
      lines.push("# My World 1.79 World Ledger");

      if (data.clock) {
        lines.push("clock:");
        if (data.clock.t) lines.push(`  t: "${data.clock.t}"`);
        if (data.clock.phase) lines.push(`  phase: "${data.clock.phase}"`);
        if (data.clock.date) lines.push(`  date: "${data.clock.date}"`);
        if (data.clock.location) lines.push(`  location: "${data.clock.location}"`);
        if (data.clock.region) lines.push(`  region: "${data.clock.region}"`);
        if (data.clock.country) lines.push(`  country: "${data.clock.country}"`);
      }

      if (data.scene) {
        lines.push("scene:");
        if (data.scene.place) lines.push(`  place: "${data.scene.place}"`);
        if (data.scene.participants && data.scene.participants.length > 0) {
          lines.push(`  participants: [${data.scene.participants.map((p) => `"${p}"`).join(", ")}]`);
        }
      }

      if (data.roster && data.roster.length > 0) {
        lines.push("roster:");
        for (const r of data.roster) {
          lines.push(`  - id: "${r.id}"`);
          if (r.name) lines.push(`    name: "${r.name}"`);
          if (r.loc) lines.push(`    loc: "${r.loc}"`);
          if (r.status) lines.push(`    status: "${r.status}"`);
        }
      }

      if (data.actors && Object.keys(data.actors).length > 0) {
        lines.push("actors:");
        for (const [id, doc] of Object.entries(data.actors)) {
          lines.push(`  ${id}:`);
          if (doc.name) lines.push(`    name: "${doc.name}"`);
          if (doc.outfit) {
            lines.push("    outfit:");
            if (doc.outfit.top) lines.push(`      top: "${doc.outfit.top}"`);
            if (doc.outfit.bottom) lines.push(`      bottom: "${doc.outfit.bottom}"`);
            if (doc.outfit.underwear_top) lines.push(`      underwear_top: "${doc.outfit.underwear_top}"`);
            if (doc.outfit.underwear_bottom) lines.push(`      underwear_bottom: "${doc.outfit.underwear_bottom}"`);
            if (doc.outfit.shoes) lines.push(`      shoes: "${doc.outfit.shoes}"`);
          }
        }
      }

      lines.push("```");
      return lines.join("\n");
    } catch {
      return JSON.stringify(data, null, 2);
    }
  }

  /** Bundles all diagnostics, ledger, manifest, and logs into a single export JSON */
  public exportAllBundle(): string {
    const bundle = {
      timestamp: new Date().toISOString(),
      telemetry: this.telemetry,
      directorNote: this.latestDirectorNote,
      clock: this.latestLedger.clock,
      scene: this.latestLedger.scene,
      ledger: this.latestLedger,
      manifest: this.latestManifest,
      logs: this.logs,
    };
    return JSON.stringify(bundle, null, 2);
  }
}

export const diagBus = new DiagnosticBus();

```

---

<a id="src-shared-text-effects-ts"></a>
## File: `src/shared/text-effects.ts`

**Description**: Source file `src/shared/text-effects.ts` in LumiVN Visual Novel Engine.

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

---

<a id="src-shared-types-ts"></a>
## File: `src/shared/types.ts`

**Description**: Source file `src/shared/types.ts` in LumiVN Visual Novel Engine.

```typescript
export interface ClockState {
  date?: string;      // DD-MM-YY
  t?: string;         // D# HH:MM
  phase?: string;     // Dawn | Morning | Afternoon | Dusk | Night | Late Night
  step?: number;
  location?: string;  // e.g. "Tendo Dojo"
  region?: string;    // e.g. "Nerima, Tokyo"
  country?: string;   // e.g. "Japan"
}

export interface SceneLatent {
  id?: string;
  who?: string;
  errand?: string;
  route?: string;
  window_opens?: string;
  status?: string;
}

export interface SceneState {
  place?: string;
  time?: string;
  participants?: string[];
  threads?: string[];
  pressures?: string[];
  recent_changes?: string[];
  recent_beats?: string[];
  constraints?: string;
  affordances?: string[];
  stall?: number;
  streak?: number;
  transients?: Array<Record<string, unknown> | string>;
  latents?: SceneLatent[];
  [key: string]: unknown;
}

export interface ActorOutfit {
  top?: string;
  bottom?: string;
  underwear_top?: string;
  underwear_bottom?: string;
  shoes?: string;
  footwear?: string;
  accessories?: string[] | string;
  jewelry?: string[] | string;
  hair?: string;
  makeup?: string;
  scent?: string;
  residue?: string[];
  integrity?: number;
  state?: string;
  [key: string]: unknown;
}

export interface ActorCombat {
  tier?: number | string;
  lv?: number | string;
  exp?: string | number;
  hp?: string | number;
  mp?: string | number;
  eff_pwr?: number;
  eff_agi?: number;
  pwr?: number;
  agi?: number;
  int?: number;
  talent?: string[] | string;
  [key: string]: unknown;
}

export interface ActorLifeModel {
  orientation?: string;
  romantic_history?: string;
  upbringing?: string;
  family?: string[] | string;
  occupation?: string;
  residence?: string;
  routines?: Array<[string, string, string, string] | Record<string, unknown>>;
  worldview?: string;
  self_concept?: string;
  [key: string]: unknown;
}

export interface ActorWounds {
  physical?: string[] | unknown[];
  psychological?: string[] | unknown[];
  [key: string]: unknown;
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
  [key: string]: number | undefined;
}

export interface ActorInventory {
  in_hand?: {
    L?: string;
    R?: string;
  };
  carried?: string[];
  room?: string[];
  room_location?: string;
  [key: string]: unknown;
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
    [key: string]: unknown;
  };
  money?: {
    in_hand?: number;
    in_bank?: number;
    currency?: string;
    [key: string]: unknown;
  };
  combat?: ActorCombat | Record<string, unknown>;
  life_model?: ActorLifeModel | Record<string, unknown>;
  wounds?: ActorWounds | Record<string, unknown>;
  trauma?: string[] | unknown[];
  constraints?: string;
  passions?: ActorPassions;
  outfit?: ActorOutfit;
  inventory?: ActorInventory;
  relations?: Record<string, Record<string, number | unknown>>;
  profile?: Record<string, unknown>;
  state?: Record<string, unknown>;
  agency?: Record<string, unknown>;
  knowledge?: Record<string, unknown>;
  stats?: Record<string, number | unknown>;
  [key: string]: unknown;
}

export interface PlaceRoute {
  to: string;
  minutes: number | string;
  requires?: Record<string, unknown>;
  why_not?: string;
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
  indoors?: boolean;
  population?: string;
  hazards?: string[];
  barriers?: string[];
  affordances?: string[];
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

export interface BPlotCarrier {
  what?: string;
  from?: string;
  eta?: string;
}

export interface BPlot {
  id?: string;
  who?: string;
  want?: string;
  doing?: string;
  knows?: string[] | string;
  next?: { move?: string; due?: string };
  scope?: "personal" | "household" | "neighborhood" | "city" | string;
  hooks?: string[] | string;
  carriers?: BPlotCarrier[];
  vector?: string;
  ripple?: number; // 1: Isolated, 2: Ambient Echo, 3: Collision
  status?: "active" | "dormant" | "resolved" | string;
  [key: string]: unknown;
}

export interface FrontNode {
  id?: string;
  cause?: string;
  stage?: string;
  due?: string;
  pressure?: number; // 0-5
  known_by?: string[];
  [key: string]: unknown;
}

export interface TravelNode {
  actor?: string;
  purpose?: string;
  from?: string;
  to?: string;
  depart?: string;
  eta?: string;
  status?: string;
  [key: string]: unknown;
}

export interface RosterCharacter {
  id: string;
  name?: string;
  lod?: number;
  status?: string;
  loc?: string;
  posture?: string;
  activity?: string;
  destination?: string;
  eta?: string;
  tick?: number | string;
  record?: string;
  [key: string]: unknown;
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

export interface InvestigationTrack {
  authority: string;
  alert_level: number;
  clues: string[];
  target_id: string;
}

export interface LedgerData {
  world?: Record<string, unknown>;
  clock?: ClockState;
  scene?: SceneState;
  places?: Record<string, PlaceNode>;
  travel?: TravelNode[];
  roster?: RosterCharacter[];
  actors?: Record<string, ActorDossier>;
  bplots?: BPlot[];
  fronts?: FrontNode[];
  opportunities?: Opportunity[];
  journal?: JournalEntry[];
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

export interface DirectorNoteData {
  directorNote: string;
  threadLabel: string;
  timestamp?: string;
}

export interface DirectorNotePayload {
  type: "vn_director_note";
  data: DirectorNoteData;
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
  directorNote?: DirectorNoteData;
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

export interface DirectorSettings {
  systemPrompt: string;
  userNotes: string;
  enabled: boolean;
}

export interface DirectorLogEntry {
  timestamp: string;
  directive: string;
  worldChanges: string[];
  npcChanges: Array<{
    actorId: string;
    name: string;
    wantNow?: string;
    passionsMoved?: Record<string, number>;
    relationsMoved?: Record<string, any>;
    attireChanged?: string;
  }>;
  mutations: string[];
}

export interface DiagnosticData {
  timestamp: string;
  chatId: string;
  messageId?: string;
  hasLedger: boolean;
  placeId: string;
  participants: string[];
  bgUrl: string;
}

export interface StatRulesSettings {
  statRules: string;
  ledgerPrompt: string;
  enabled: boolean;
  mode: "mvu_quiet" | "inline_interceptor" | "passive";
}

export interface StatRulesSettingsPayload {
  type: "vn_stat_rules_settings";
  settings: StatRulesSettings;
}



```

---

<a id="test-director-and-lifecycle-test-ts"></a>
## File: `test/director-and-lifecycle.test.ts`

**Description**: Source file `test/director-and-lifecycle.test.ts` in LumiVN Visual Novel Engine.

```typescript
import { describe, expect, test } from "bun:test";
import {
  evaluateDirectorInterceptor,
  processBPlots,
  computeDirectorImpactDiff,
  resolveIdentityMacros,
  formatDirectorDirective,
  DIRECTOR_DIRECTIVES,
} from "../src/backend/director.js";
import { MenuBar } from "../src/frontend/hud/menu-bar.js";
import { registerDiagnosticsDrawer } from "../src/frontend/studio/diagnostics-drawer.js";
import { StageOverlay } from "../src/frontend/stage/overlay.js";
import type { LlmMessageDTO, InterceptorResultDTO } from "lumiverse-spindle-types";
import type { LedgerData, DirectorSettings, DirectorLogEntry, VnPresentationState } from "../src/shared/types.js";

describe("LumiVN Director & Lifecycle Systems", () => {
  describe("Macros & Director Directive Formatting", () => {
    test("resolveIdentityMacros substitutes {{user}} and {{char}} correctly", () => {
      const template = "Guide {{user}} into interacting with {{char}} carefully.";
      const resolved = resolveIdentityMacros(template, "Raja", "Tessa");
      expect(resolved).toBe("Guide Raja into interacting with Tessa carefully.");
    });

    test("formatDirectorDirective combines system prompt and resolved scene notes", () => {
      const settings: DirectorSettings = {
        systemPrompt: "[LumiVN Living World Director]\n- Guard agency.",
        userNotes: "Do not let {{user}} discover the key yet.",
        enabled: true,
      };
      const formatted = formatDirectorDirective(settings, "Hero");
      expect(formatted).toContain("[LumiVN Living World Director]");
      expect(formatted).toContain("[Scene Notes & Guidance]");
      expect(formatted).toContain("Do not let Hero discover the key yet.");
    });
  });

  describe("Pre-Turn Director Interceptor & Agency Guardrails", () => {
    test("guards against dry runs, missing chat IDs, and quiet generation types", async () => {
      const messages: LlmMessageDTO[] = [{ role: "user", content: "Hello there" }];

      // 1. Missing chatId
      const res1 = await evaluateDirectorInterceptor(messages, {}, async () => ({}));
      expect(res1).toBe(messages);

      // 2. dryRun = true
      const res2 = await evaluateDirectorInterceptor(
        messages,
        { chatId: "chat_123", dryRun: true },
        async () => ({})
      );
      expect(res2).toBe(messages);

      // 3. isDryRun = true
      const res3 = await evaluateDirectorInterceptor(
        messages,
        { chatId: "chat_123", isDryRun: true },
        async () => ({})
      );
      expect(res3).toBe(messages);

      // 4. quiet generation type
      const res4 = await evaluateDirectorInterceptor(
        messages,
        { chatId: "chat_123", generationType: "quiet" },
        async () => ({})
      );
      expect(res4).toBe(messages);
    });

    test("skips injection if Director is disabled in settings", async () => {
      const messages: LlmMessageDTO[] = [{ role: "user", content: "Hello" }];
      const res = await evaluateDirectorInterceptor(
        messages,
        { chatId: "chat_123", generationType: "normal" },
        async () => ({ scene: { place: "room" } }),
        async () => ({
          systemPrompt: "System",
          userNotes: "",
          enabled: false,
        })
      );
      expect(res).toBe(messages);
    });

    test("skips injection if current chat state is not found", async () => {
      const messages: LlmMessageDTO[] = [{ role: "user", content: "Hello" }];
      const res = await evaluateDirectorInterceptor(
        messages,
        { chatId: "chat_123", generationType: "normal" },
        async () => null
      );
      expect(res).toBe(messages);
    });

    test("injects living world director directives and breakdown attribution", async () => {
      const messages: LlmMessageDTO[] = [
        { role: "user", content: "I take a step into the parlor." },
      ];
      const fakeLedger: LedgerData = {
        scene: { place: "parlor", participants: ["user", "npc_a"] },
        roster: [{ id: "npc_a", name: "Alice" }],
      };

      let cachedKey: string | null = null;
      let cachedDirective: string | null = null;

      const result = await evaluateDirectorInterceptor(
        messages,
        { chatId: "chat_active", generationId: "gen_99", generationType: "normal" },
        async () => fakeLedger,
        async () => ({
          systemPrompt: DIRECTOR_DIRECTIVES,
          userNotes: "Stay cautious.",
          enabled: true,
        }),
        (key, dir) => {
          cachedKey = key;
          cachedDirective = dir;
        }
      );

      expect(typeof result).toBe("object");
      const interceptorRes = result as InterceptorResultDTO;
      expect(interceptorRes.messages).toBeDefined();
      expect(interceptorRes.messages.length).toBe(2);

      // First message is director system prompt
      const directorMsg = interceptorRes.messages[0];
      expect(directorMsg.role).toBe("system");
      expect(directorMsg.content).toContain("[LumiVN Living World Director Guidance]");
      expect(directorMsg.content).toContain("[OUTPUT FORMAT REQUIREMENT]");
      expect(directorMsg.content).toContain("Line 1: Return the director JSON object");
      expect(directorMsg.content).not.toContain("STATE DETAILS CONTRACT");
      expect(directorMsg.content).toContain("Stay cautious.");

      // Injected directive cached for post-turn diff logging
      expect(cachedKey).toBe("chat_active");
      expect(cachedDirective).toContain("Stay cautious.");

      // Original user message preserved
      expect(interceptorRes.messages[1].content).toBe("I take a step into the parlor.");

      // Prompt breakdown registered
      expect(interceptorRes.breakdown).toBeDefined();
      expect(interceptorRes.breakdown?.[0].messageIndex).toBe(0);
      expect(interceptorRes.breakdown?.[0].name).toBe("LumiVN Director");
    });

    test("idempotent: does not duplicate director block if already present", async () => {
      const messages: LlmMessageDTO[] = [
        { role: "system", content: DIRECTOR_DIRECTIVES },
        { role: "user", content: "Already injected turn." },
      ];
      const result = await evaluateDirectorInterceptor(
        messages,
        { chatId: "chat_active" },
        async () => ({})
      );
      expect(result).toBe(messages);
    });

    test("injects decorum guidance when player is underdressed in formal public room", async () => {
      const messages: LlmMessageDTO[] = [{ role: "user", content: "I enter the grand ballroom." }];
      const ledger: LedgerData = {
        scene: { place: "ballroom" },
        places: {
          ballroom: {
            norm: "formal gala",
            privacy: 1,
          },
        },
        actors: {
          user: {
            name: "Player",
            outfit: {
              top: "none",
              bottom: "trousers",
            },
          },
        },
      };

      const res = (await evaluateDirectorInterceptor(
        messages,
        { chatId: "chat_ballroom" },
        async () => ledger
      )) as any;

      expect(res.messages).toBeDefined();
      const content = res.messages[0].content;
      expect(content).toContain("Director Guidance: {{user}} is visibly under-dressed");
    });

    test("injects active investigation alerts when alert_level >= 1", async () => {
      const messages: LlmMessageDTO[] = [{ role: "user", content: "Walking through town." }];
      const ledger: LedgerData = {
        world: {
          investigations: {
            guard: {
              authority: "Royal Guard",
              alert_level: 2,
              target_id: "user",
              clues: ["Footprint", "Stolen locket"],
            },
          },
        },
      };

      const res = (await evaluateDirectorInterceptor(
        messages,
        { chatId: "chat_town" },
        async () => ledger
      )) as any;

      expect(res.messages).toBeDefined();
      const content = res.messages[0].content;
      expect(content).toContain("Director Alert: Investigation by Royal Guard active at Alert Level 2");
      expect(content).toContain("Clues: Footprint, Stolen locket");
    });
  });

  describe("Post-Turn State Diffing & Director Log Generation", () => {
    test("accurately diffs world shifts, NPC intent, passions, relations, and mutations", () => {
      const prevLedger: LedgerData = {
        clock: { t: "D1 10:00" },
        scene: { place: "hallway" },
        bplots: [
          { id: "bp_1", who: "Officer Jenny", ripple: 1, status: "active" },
        ],
        opportunities: [
          { id: "opp_1", what: "Old Key", status: "lead" },
        ],
        actors: {
          tessa: {
            name: "Tessa",
            agency: { want_now: "Explore the house" },
            passions: { anger: 10, fear: 0 },
            relations: { user: { trust: 50 } },
          },
        },
        journal: [],
      };

      const nextLedger: LedgerData = {
        clock: { t: "D1 10:15" },
        scene: { place: "library" },
        bplots: [
          { id: "bp_1", who: "Officer Jenny", ripple: 2, status: "active" },
          { id: "bp_2", who: "Mysterious Merchant", ripple: 1, status: "active" },
        ],
        opportunities: [
          { id: "opp_1", what: "Old Key", status: "taken" },
        ],
        actors: {
          tessa: {
            name: "Tessa",
            agency: { want_now: "Conceal embarrassment" },
            passions: { anger: 25, arousal: 30 },
            relations: { user: { trust: 65 } },
          },
        },
        journal: [
          {
            id: "j_1",
            action: "Looked around the library",
            mutations: ["tessa.passions.arousal += 30", "user.inventory += 'Old Key'"],
          },
        ],
      };

      const diff = computeDirectorImpactDiff(
        prevLedger,
        nextLedger,
        "[LumiVN Living World Director] Directives"
      );

      expect(diff).toBeDefined();
      expect(diff.directive).toBe("[LumiVN Living World Director] Directives");

      // World shifts
      expect(diff.worldChanges).toContain("Clock advanced: D1 10:00 -> D1 10:15");
      expect(diff.worldChanges).toContain("Scene location moved: hallway -> library");
      expect(diff.worldChanges.some((w) => w.includes("B-Plot escalated: Officer Jenny ripple 1 -> 2"))).toBe(true);
      expect(diff.worldChanges.some((w) => w.includes("New B-Plot: Mysterious Merchant"))).toBe(true);
      expect(diff.worldChanges.some((w) => w.includes('Opportunity status changed: "Old Key" -> taken'))).toBe(true);

      // NPC intent & changes
      expect(diff.npcChanges.length).toBe(1);
      const tessaDiff = diff.npcChanges[0];
      expect(tessaDiff.actorId).toBe("tessa");
      expect(tessaDiff.wantNow).toBe("Conceal embarrassment");
      expect(tessaDiff.passionsMoved?.anger).toBe(25);
      expect(tessaDiff.passionsMoved?.arousal).toBe(30);
      expect(tessaDiff.relationsMoved?.user).toEqual({ trust: 65 });

      // Journal mutations
      expect(diff.mutations).toContain("tessa.passions.arousal += 30");
      expect(diff.mutations).toContain("user.inventory += 'Old Key'");
    });

    test("diffs investigations escalation and NPC attire changes (scent, integrity, residue)", () => {
      const prevLedger: LedgerData = {
        world: {
          investigations: {
            watch: {
              authority: "City Watch",
              alert_level: 1,
              target_id: "suspect",
              clues: ["bootprint"],
            },
          },
        },
        actors: {
          clara: {
            name: "Clara",
            outfit: {
              top: "Silk blouse",
              integrity: 100,
              scent: "lavender",
              residue: [],
            },
          },
        },
      };

      const nextLedger: LedgerData = {
        world: {
          investigations: {
            watch: {
              authority: "City Watch",
              alert_level: 2,
              target_id: "suspect",
              clues: ["bootprint", "dagger sheath"],
            },
          },
        },
        actors: {
          clara: {
            name: "Clara",
            outfit: {
              top: "Silk blouse",
              integrity: 75,
              scent: "smoke",
              residue: ["soot", "mud"],
            },
          },
        },
      };

      const diff = computeDirectorImpactDiff(prevLedger, nextLedger, "Directive");

      expect(diff.worldChanges.some((w) => w.includes("Investigation alert escalated: City Watch Alert Level 1 -> 2"))).toBe(true);
      expect(diff.worldChanges.some((w) => w.includes("Investigation clues discovered by City Watch: dagger sheath"))).toBe(true);

      expect(diff.npcChanges.length).toBe(1);
      const claraDiff = diff.npcChanges[0];
      expect(claraDiff.actorId).toBe("clara");
      expect(claraDiff.attireChanged).toBeDefined();
      expect(claraDiff.attireChanged).toContain("integrity 100% -> 75%");
      expect(claraDiff.attireChanged).toContain('scent "lavender" -> "smoke"');
      expect(claraDiff.attireChanged).toContain("residue [soot, mud]");
    });
  });

  describe("B-Plot Emergent NPC Arrival & Phone Notification Hook", () => {
    test("detects ripple === 2 active B-plots and flags notification", () => {
      const ledger: LedgerData = {
        bplots: [
          {
            id: "bp_1",
            who: "Officer Jenny",
            doing: "Investigating broken lock at warehouse",
            vector: "Police radio chatter",
            ripple: 2,
            status: "active",
          },
          {
            id: "bp_2",
            who: "Mysterious Merchant",
            doing: "Selling rare artifacts",
            ripple: 1,
            status: "active",
          },
        ],
      };

      const res = processBPlots(ledger);
      expect(res.hasBPlotNotification).toBe(true);
      expect(res.activeRipples.length).toBe(1);
      expect(res.activeRipples[0].who).toBe("Officer Jenny");
      expect(res.promotedActors.length).toBe(0);
    });

    test("promotes ripple === 3 collision actor into roster as newcomer", () => {
      const ledger: LedgerData = {
        scene: { place: "warehouse:exterior" },
        roster: [{ id: "user", name: "User" }],
        bplots: [
          {
            id: "bp_collision",
            who: "detective_kane",
            doing: "Kicks open the rear door with weapon drawn",
            ripple: 3,
            status: "active",
          },
        ],
      };

      const res = processBPlots(ledger);
      expect(res.promotedActors).toContain("detective_kane");

      const promoted = ledger.roster?.find((r) => r.id === "detective_kane");
      expect(promoted).toBeDefined();
      expect(promoted?.name).toBe("detective_kane");
      expect(promoted?.status).toBe("Kicks open the rear door with weapon drawn");
      expect(promoted?.loc).toBe("warehouse:exterior");
      expect(promoted?.lod).toBe(2);
      expect(promoted?.record).toBe("roster");

      // Running processBPlots again does not duplicate the promoted actor
      const res2 = processBPlots(ledger);
      expect(res2.promotedActors.length).toBe(0);
      expect(ledger.roster?.filter((r) => r.id === "detective_kane").length).toBe(1);
    });
  });

  describe("HUD MenuBar Phone Badge Animation", () => {
    test("toggles vn-pulse class and display flex on Phone badge when hasBPlotNotification is true", () => {
      const mockCtx: any = {
        onBackendMessage: () => () => {},
        ready: () => {},
      };
      const menuBar = new MenuBar(mockCtx, () => {});

      const phoneBtn = menuBar.root.querySelector('[data-tab-id="phone"]');
      const badge = phoneBtn?.querySelector(".vn-hud-badge") as HTMLElement;
      expect(badge).not.toBeNull();
      expect(badge.style.display).toBe("none");

      // Call setLedger with hasBPlotNotification = true
      menuBar.setLedger({ clock: { t: "14:00" } }, true);
      expect(badge.style.display).toBe("flex");
      expect(badge.classList.contains("vn-pulse")).toBe(true);

      // Call setLedger with hasBPlotNotification = false
      menuBar.setLedger({ clock: { t: "14:05" } }, false);
      expect(badge.style.display).toBe("none");
      expect(badge.classList.contains("vn-pulse")).toBe(false);
    });
  });

  describe("Sidebar Diagnostics Drawer: Director Prompt Editor & Impact Console", () => {
    test("renders Director Prompt editor controls and dispatches vn_save_director_settings", () => {
      const sentMessages: any[] = [];
      const mockCtx: any = {
        ui: {
          registerDrawerTab: (opts: any) => ({
            id: opts.id,
            root: document.createElement("div"),
            destroy: () => {},
          }),
        },
        sendToBackend: (msg: any) => sentMessages.push(msg),
      };

      const drawer = registerDiagnosticsDrawer(mockCtx, () => {});
      expect(drawer).not.toBeNull();
      const root = drawer!.tab.root;

      // Editor elements exist
      const systemTextarea = root.querySelector("#vn-director-system") as HTMLTextAreaElement;
      const notesTextarea = root.querySelector("#vn-director-notes") as HTMLTextAreaElement;
      const enabledCheckbox = root.querySelector("#vn-director-enabled") as HTMLInputElement;
      const saveBtn = root.querySelector("#vn-director-save-btn") as HTMLButtonElement;

      expect(systemTextarea).not.toBeNull();
      expect(notesTextarea).not.toBeNull();
      expect(enabledCheckbox).not.toBeNull();
      expect(saveBtn).not.toBeNull();

      // Test setDirectorSettings
      drawer!.setDirectorSettings({
        systemPrompt: "Custom directive",
        userNotes: "Tessa secret notes",
        enabled: true,
      });

      expect(systemTextarea.value).toBe("Custom directive");
      expect(notesTextarea.value).toBe("Tessa secret notes");
      expect(enabledCheckbox.checked).toBe(true);

      // Click save button
      saveBtn.click();
      const saveMsg = sentMessages.find((m) => m.type === "vn_save_director_settings");
      expect(saveMsg).toBeDefined();
      expect(saveMsg.settings.systemPrompt).toBe("Custom directive");
      expect(saveMsg.settings.userNotes).toBe("Tessa secret notes");
      expect(saveMsg.settings.enabled).toBe(true);
    });

    test("renders Director Impact Console entries with visual tags", () => {
      const mockCtx: any = {
        ui: {
          registerDrawerTab: (opts: any) => ({
            id: opts.id,
            root: document.createElement("div"),
            destroy: () => {},
          }),
        },
        sendToBackend: () => {},
      };

      const drawer = registerDiagnosticsDrawer(mockCtx, () => {});
      const root = drawer!.tab.root;

      const logEntry: DirectorLogEntry = {
        timestamp: "12:34:56",
        directive: "Stay in role and keep tension active",
        worldChanges: ["Scene location moved: street -> dojo"],
        npcChanges: [
          {
            actorId: "tessa",
            name: "Tessa",
            wantNow: "Hide the letter",
            passionsMoved: { anger: 40 },
          },
        ],
        mutations: ["user.stamina -= 10"],
      };

      drawer!.pushDirectorLog(logEntry);

      const directorStream = root.querySelector("#vn-director-log-stream") as HTMLElement;
      expect(directorStream).not.toBeNull();
      expect(directorStream.textContent).toContain("TURN IMPACT");
      expect(directorStream.textContent).toContain("[Directive]");
      expect(directorStream.textContent).toContain("Stay in role and keep tension active");
      expect(directorStream.textContent).toContain("[World Shifts]");
      expect(directorStream.textContent).toContain("Scene location moved: street -> dojo");
      expect(directorStream.textContent).toContain("[NPC Intent]");
      expect(directorStream.textContent).toContain("Tessa");
      expect(directorStream.textContent).toContain('want_now -> "Hide the letter"');
      expect(directorStream.textContent).toContain("anger (40)");
      expect(directorStream.textContent).toContain("[Mutations]");
      expect(directorStream.textContent).toContain("user.stamina -= 10");
    });
  });

  describe("Chat Switch, Stage Reset & Live Generation Sync", () => {
    test("StageOverlay resets state and queries backend when chat is switched", () => {
      const sentMessages: any[] = [];
      let activeChatId: string | null = "chat_alpha";

      const mockCtx: any = {
        getActiveChat: () => ({ chatId: activeChatId, characterId: "char_1" }),
        sendToBackend: (msg: any) => sentMessages.push(msg),
        ui: {},
      };

      const overlay = new StageOverlay({ ctx: mockCtx, onExit: () => {} });
      overlay.activate();

      expect(overlay.getCurrentChatId()).toBe("chat_alpha");
      expect(sentMessages).toContainEqual({ type: "vn_stage_opened", chatId: "chat_alpha" });
      expect(sentMessages).toContainEqual({ type: "vn_get_state", chatId: "chat_alpha" });

      // Simulate chat switch to chat_beta
      activeChatId = "chat_beta";
      sentMessages.length = 0;
      overlay.onChatChanged("chat_beta");

      expect(overlay.getCurrentChatId()).toBe("chat_beta");
      expect(sentMessages).toContainEqual({ type: "vn_stage_opened", chatId: "chat_beta" });
      expect(sentMessages).toContainEqual({ type: "vn_get_state", chatId: "chat_beta" });
    });

    test("StageOverlay ignores presentation updates from stale chats", () => {
      let activeChatId: string | null = "chat_current";
      const mockCtx: any = {
        getActiveChat: () => ({ chatId: activeChatId, characterId: "char_1" }),
        sendToBackend: () => {},
        ui: {},
      };

      const overlay = new StageOverlay({ ctx: mockCtx, onExit: () => {} });
      overlay.activate();

      const staleState: VnPresentationState = {
        chatId: "chat_old",
        messageId: "msg_old",
        speakerName: "OldSpeaker",
        paragraphs: ["Old conversation that should be discarded."],
        characters: [],
        background: { url: "old_bg.jpg", isVideo: false },
        ledger: { scene: { place: "old_room" }, actors: {} },
      };

      overlay.updatePresentation(staleState);
      // Because state belongs to chat_old while active is chat_current, it must be ignored
      expect(overlay.getCurrentChatId()).toBe("chat_current");
    });

    test("StageOverlay showGenerating displays writing indicator and clears stale text", () => {
      const mockCtx: any = {
        getActiveChat: () => ({ chatId: "chat_live", characterId: "char_1" }),
        sendToBackend: () => {},
        ui: {},
      };

      const overlay = new StageOverlay({ ctx: mockCtx, onExit: () => {} });
      overlay.activate();

      // Set some initial content
      const state: VnPresentationState = {
        chatId: "chat_live",
        messageId: "msg_1",
        speakerName: "Akane",
        paragraphs: ["Previous message text."],
        characters: [],
        background: { url: "room.jpg", isVideo: false },
        ledger: { scene: { place: "room" }, actors: {} },
      };
      overlay.updatePresentation(state);

      const dialogueBoxEl = overlay.root.querySelector(".vn-dialogue-text") as HTMLElement;
      expect(dialogueBoxEl.textContent.length).toBeGreaterThan(0);

      // Now generation starts
      overlay.showGenerating();
      expect(dialogueBoxEl.textContent).toContain("Writing next response...");
    });

    test("StageOverlay showUserMessage renders user input under user nameplate with waiting badge", () => {
      const mockCtx: any = {
        getActiveChat: () => ({ chatId: "chat_live", characterId: "char_1" }),
        sendToBackend: () => {},
        ui: {},
      };

      const overlay = new StageOverlay({ ctx: mockCtx, onExit: () => {} });
      overlay.activate();

      overlay.showUserMessage("I open the treasure chest carefully.", "Traveler");

      const nameplateEl = overlay.root.querySelector(".vn-nameplate") as HTMLElement;
      expect(nameplateEl.style.display).toBe("block");
      expect(nameplateEl.textContent).toBe("Traveler");

      const dialogueBoxEl = overlay.root.querySelector(".vn-dialogue-text") as HTMLElement;
      expect(dialogueBoxEl.textContent).toContain("I open the treasure chest carefully.");
      expect(dialogueBoxEl.textContent).toContain("Writing next response...");

      // Subsequent showGenerating() preserves the user message
      overlay.showGenerating();
      expect(nameplateEl.textContent).toBe("Traveler");
      expect(dialogueBoxEl.textContent).toContain("I open the treasure chest carefully.");
      expect(dialogueBoxEl.textContent).toContain("Writing next response...");
    });
  });
});


```

---

<a id="test-engine-test-ts"></a>
## File: `test/engine.test.ts`

**Description**: Source file `test/engine.test.ts` in LumiVN Visual Novel Engine.

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

  test("extracts narrative prose cleanly stripping director_note JSON block", () => {
    const rawWithDirector = `{"director_note": "Escalate tension immediately.", "thread_label": "Tension Arc"}\n\nAlethea stepped back, holding her breath. "Who is there?"`;
    const cleaned = extractProse(rawWithDirector);
    expect(cleaned).toBe('Alethea stepped back, holding her breath. "Who is there?"');
    expect(cleaned).not.toContain("director_note");
  });

  test("extracts narrative prose cleanly stripping details Director block", () => {
    const rawWithDetails = `<details><summary>🎬 Director</summary>\n{"director_note": "FIRST BEAT:...", "thread_label": "Tension"}\n</details>\n\nAlethea glanced at the doorway.`;
    const cleaned = extractProse(rawWithDetails);
    expect(cleaned).toBe('Alethea glanced at the doorway.');
    expect(cleaned).not.toContain("Director");
    expect(cleaned).not.toContain("director_note");
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

import { splitParagraphIntoBeats, inferEmotionFromText, inferActionFromText } from "../src/frontend/stage/beat-splitter.js";
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

  test("infers emotion and actions directly from narrative prose without explicit tags", () => {
    expect(inferEmotionFromText("She smiled warmly at him.")).toBe("smile");
    expect(inferEmotionFromText("He blushed shyly and looked away.")).toBe("blush");
    expect(inferEmotionFromText("Her eyes narrowed suspiciously.")).toBe("suspicious");
    expect(inferActionFromText("*drawing sword* He stood ready.")).toBe("drawing_sword");

    const paras = [
      'Alethea smiled warmly. "I knew you would make it back in time."',
      'Donald scowled in frustration. *slams table* "This makes no sense!"',
    ];
    const beats = splitParagraphIntoBeats(paras, "Narrator");
    expect(beats[0]?.expression).toBe("smile");
    expect(beats[1]?.expression).toBe("angry");
    expect(beats[1]?.action).toBe("slams_table");
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

import { diagBus } from "../src/frontend/utils/diag-bus.js";

describe("LumiVN Robust YAML Recovery & Diagnostic Export", () => {
  test("recovers actor dossiers even when flow mappings contain unescaped quotes", () => {
    const rawYaml = `
clock:
  date: "14-09-18"
  t: "D1 16:32"
  phase: "Afternoon"
  location: "Living Room"
  region: "Westchester"
  country: "USA"

actors:
  user:
    name: "User"
    outfit:
      top: "cream knit sweater"
      bottom: "high-waisted jeans"
    inventory:
      in_hand: { L: "duffel bag", R: null }
  jessica:
    name: "Jessica"
    outfit:
      top: "loose silk blouse"
    tells: { lying: "Says "Weeee!" or "Boop!" nervously", fidget: "plays with necklace" }
  tessa:
    name: "Tessa"
    outfit:
      top: "cropped tank"
    tells: { smug: "Smirks and twirls hair" }
`;
    const parsed = parseLedgerYaml(rawYaml);
    expect(parsed).toBeDefined();
    expect(parsed.clock?.date).toBe("14-09-18");
    expect(parsed.actors).toBeDefined();
    expect(Object.keys(parsed.actors || {})).toContain("user");
    expect(Object.keys(parsed.actors || {})).toContain("jessica");
    expect(Object.keys(parsed.actors || {})).toContain("tessa");
    expect(parsed.actors?.["jessica"]?.outfit?.top).toBe("loose silk blouse");
  });

  test("diagBus formats clean YAML and exports complete telemetry bundle", () => {
    diagBus.setLedger({
      clock: { t: "D1 16:32", phase: "Afternoon", date: "14-09-18", region: "Nerima" },
      scene: { place: "tendo_residence:foyer", participants: ["user", "jessica"] },
    });
    const yaml = diagBus.formatLedgerYaml();
    expect(yaml).toContain("```yaml");
    expect(yaml).toContain('t: "D1 16:32"');
    expect(yaml).toContain('date: "14-09-18"');
    expect(yaml).toContain('place: "tendo_residence:foyer"');

    const bundleStr = diagBus.exportAllBundle();
    const bundle = JSON.parse(bundleStr);
    expect(bundle.clock.t).toBe("D1 16:32");
    expect(bundle.scene.participants).toContain("user");
  });
});

import { VnTtsEngine } from "../src/frontend/stage/tts-engine.js";

describe("LumiVN Host Default TTS Engine", () => {
  test("cleans dialogue text removing tags, macros, and formatting", () => {
    const engine = new VnTtsEngine();
    const raw = '**Akane**: "Wait! <shake>Look at that!</shake>" [[Run|run_away]] [expression: blush] {{img::surprised}}';
    const clean = engine.cleanDialogueText(raw);
    expect(clean).toBe("Akane: Wait! Look at that!");
  });

  test("resolves default connection from host /api/v1/tts-connections", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url: any) => {
      if (String(url).includes("/api/v1/tts-connections")) {
        return {
          ok: true,
          json: async () => ({
            data: [
              { id: "conn_secondary", name: "Backup Voice", provider: "openai_tts", is_default: false },
              { id: "conn_primary", name: "Default Voice", provider: "openrouter_tts", model: "elevenlabs", voice: "rachel", is_default: true },
            ],
          }),
        } as any;
      }
      return { ok: false, status: 404 } as any;
    };

    try {
      const engine = new VnTtsEngine();
      const conn = await engine.resolveDefaultConnection();
      expect(conn).toBeDefined();
      expect(conn?.id).toBe("conn_primary");
      expect(conn?.name).toBe("Default Voice");
      expect(conn?.voice).toBe("rachel");
      expect(conn?.isDefault).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("speaks using host /api/v1/tts/synthesize and falls back gracefully", async () => {
    let synthesizeCalled = false;
    let payloadSent: any = null;

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url: any, init: any) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/v1/tts-connections")) {
        return {
          ok: true,
          json: async () => ({
            data: [{ id: "conn_default", name: "Host Default", is_default: true, voice: "narrator_1" }],
          }),
        } as any;
      }
      if (urlStr.includes("/api/v1/tts/synthesize")) {
        synthesizeCalled = true;
        payloadSent = JSON.parse(init.body);
        return {
          ok: true,
          blob: async () => new Blob(["fake_mp3_data"], { type: "audio/mpeg" }),
        } as any;
      }
      return { ok: false, status: 404 } as any;
    };

    try {
      const engine = new VnTtsEngine();
      engine.setEnabled(true);
      await engine.speak('Hello from Visual Novel!', "Akane");

      expect(synthesizeCalled).toBe(true);
      expect(payloadSent).toBeDefined();
      expect(payloadSent.connectionId).toBe("conn_default");
      expect(payloadSent.text).toBe("Hello from Visual Novel!");
      expect(payloadSent.voice).toBe("narrator_1");

      engine.stop();
      expect(engine.isEnabled()).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});





```

---

<a id="test-hud-tabs-test-ts"></a>
## File: `test/hud-tabs.test.ts`

**Description**: Source file `test/hud-tabs.test.ts` in LumiVN Visual Novel Engine.

```typescript
import { describe, expect, test, beforeAll } from "bun:test";
import { Window } from "happy-dom";

// Initialize happy-dom globals for headless UI testing
const window = new Window();
globalThis.window = window as any;
globalThis.document = window.document as any;
globalThis.HTMLElement = window.HTMLElement as any;
globalThis.HTMLSelectElement = window.HTMLSelectElement as any;
globalThis.HTMLButtonElement = window.HTMLButtonElement as any;
globalThis.HTMLDivElement = window.HTMLDivElement as any;
globalThis.customElements = window.customElements as any;

import { parseLedgerYaml } from "../src/backend/ledger-parser.js";
import { CharactersTab } from "../src/frontend/hud/tab-characters.js";
import { StatsTab } from "../src/frontend/hud/tab-stats.js";
import { InventoryTab } from "../src/frontend/hud/tab-inventory.js";
import { WardrobeTab } from "../src/frontend/hud/tab-wardrobe.js";
import { MapTab } from "../src/frontend/hud/tab-map.js";
import { PhoneTab } from "../src/frontend/hud/tab-phone.js";
import { JournalTab } from "../src/frontend/hud/tab-journal.js";
import { SceneTab } from "../src/frontend/hud/tab-scene.js";
import { BPlotsTab } from "../src/frontend/hud/tab-bplots.js";
import { MenuBar } from "../src/frontend/hud/menu-bar.js";
import { DiagnosticsTab } from "../src/frontend/hud/tab-diagnostics.js";
import { diagBus } from "../src/frontend/utils/diag-bus.js";

const FENCE = "```";
const REALISTIC_MY_WORLD_YAML =
  FENCE +
  "yaml\n" +
  `ledger:
  world:
    name: "Dames Mansion"
    genre: "Slice of Life / Drama"
  clock:
    date: "12-10-18"
    t: "D1 16:30"
    phase: "Afternoon"
    location: "Dames Mansion"
    region: "Suburban Estate"
    country: "USA"
    step: 1
  scene:
    place: "dames_mansion:foyer"
    time: "D1 16:30"
    participants: ["user", "jessica", "tessa"]
    threads: ["lease_signing_wine", "tessa_teasing_pretty_boy"]
    pressures: ["Leslie is upstairs and doesn't know her ex just moved in"]
  places:
    "dames_mansion:foyer":
      function: "Entryway"
      traffic: 3
      privacy: 1
      routes:
        - to: "dames_mansion:living_room"
          minutes: 1
        - to: "dames_mansion:upstairs_hall"
          minutes: 1
    "dames_mansion:living_room":
      function: "Common Lounge"
      traffic: 4
      privacy: 2
  roster:
    - id: "jessica"
      name: "Jessica"
      lod: 3
      status: "Tipsy, welcoming User"
      loc: "dames_mansion:foyer"
    - id: "tessa"
      name: "Tessa"
      lod: 3
      status: "Teasing User at bottom of stairs"
      loc: "dames_mansion:foyer"
    - id: "leslie"
      name: "Leslie"
      lod: 1
      status: "Filming upstairs"
      loc: "dames_mansion:upstairs_hall"
  actors:
    user:
      id: "user"
      appearance:
        age: 22
        traits: "Slender, androgynous, striking symmetry"
        appeal: 90
        style: "Casual chic"
        condition: "Flustered"
      money:
        in_hand: 140
        in_bank: 1250
        currency: "$"
      combat:
        tier: 1
        lv: 1
        exp: "0/100"
        hp: "120/120"
        mp: "60/60"
        pwr: 14
        agi: 16
        int: 24
        eff_pwr: 14
        eff_agi: 16
        talent: ["Adaptability", "Bartering"]
      life_model:
        orientation: "Open"
        romantic_history: "Ex-boyfriend of Leslie Dames"
        occupation: "College Graduate / Transmigrator"
        residence: "Dames Mansion Room 3"
        routines:
          - ["08:00", "Morning routine", "bedroom", "Morning"]
          - ["16:30", "Arrival at mansion", "foyer", "Afternoon"]
      wounds:
        physical: []
        psychological: ["Transmigration shock"]
      passions:
        anger: 0
        shame: 0
        arousal: 20
        stress: 15
        fear: 5
      outfit:
        top: "Fitted heather-gray henley"
        bottom: "Dark slim-fit jeans"
        underwear_top: "none"
        underwear_bottom: "Calvin Klein trunks"
        shoes: "White leather sneakers"
        accessories: ["Silver wrist watch"]
        state: "Pristine"
      inventory:
        in_hand:
          L: "Empty"
          R: "Canvas duffel bag"
        carried: ["2018 smartphone", "Wallet", "Lease agreement"]
        room: ["Extra clothes in suitcase"]
        room_location: "Room 3"
      agency:
        want_now: "Settle into the mansion and avoid Leslie for now"
      relations: {}
    jessica:
      id: "jessica"
      name: "Jessica"
      appearance:
        age: 44
        traits: "Long black curly hair, glasses, curvy/fit yoga build"
        appeal: 88
        style: "Athleisure"
        condition: "Buzzed"
      money:
        in_hand: 80
        in_bank: 45000
        currency: "$"
      combat:
        tier: 1
        lv: 2
        hp: "130/130"
        mp: "70/70"
        pwr: 12
        agi: 14
        int: 20
        talent: ["Hostessing", "Seductive Hospitality"]
      life_model:
        orientation: "Bi-curious"
        romantic_history: "Married to absentee husband"
        occupation: "Landlady"
        residence: "Master Bedroom"
      wounds:
        physical: []
        psychological: ["Lonely marriage"]
      passions:
        anger: 0
        arousal: 35
        joy: 40
        stress: 10
      outfit:
        top: "Lavender sports bra"
        bottom: "Tight gray yoga pants"
        shoes: "Barefoot"
        accessories: ["Diamond wedding ring"]
      inventory:
        in_hand:
          L: "Empty"
          R: "Glass of Pinot Noir"
        carried: ["House master keys", "iPhone"]
      profile:
        tells: ["Pours wine to cover awkward pauses", "Touches hair when sizing someone up"]
        defense: "Maternal charm"
      agency:
        want_now: "Make the handsome new tenant feel welcome"
        goals:
          - ["g_jess_1", "Get the new tenant settled and enjoy his attention", 80, 60, "Tonight", "Lonely with husband away", 15, "active"]
      knowledge:
        secrets:
          - ["Keeps high-end bondage gear locked in dresser", ["jessica"], ["tessa"], 10, "Yoga storage"]
        beliefs:
          - ["User is remarkably polite and handsome", 95, "direct", "@b:W", "D1 16:30"]
      relations:
        user:
          affinity: 20
          trust: 15
          respect: 10
          attraction: 45
          loyalty: 10
          betrayal_threshold: 40
          leverage: ["Holds his lease"]
      stats:
        T: 15
        A: 20
        R: 10
        F: 0
        Fam: 2
        G: 0
        Integ: 70
        Stress: 10
        CAU: 25
        GRD: 30
        PRD: 40
        EMP: 80
        STB: 75
        BLD: 20
        RX: 35
        RC: 60
        Rig: 15
        Mask: 40
        MIS: 10
        WV: 30
        COMP: 15
  opportunities:
    - id: "opp_wine_welcome"
      what: "Accept a glass of wine with Jessica"
      wanted_by: ["jessica"]
      cost: "Might lower inhibitions"
      payoff: "+15 Jessica Affinity, unlocks private talk"
      status: "lead"
  journal:
    - id: "j_arrival"
      time: "D1 16:30"
      place: "dames_mansion:foyer"
      action: "Arrived at Dames Mansion with duffel bag"
      outcome: "Greeted by landlady Jessica with wine"
` +
  FENCE;

describe("End-to-End YAML Parsing & HUD Tab Rendering", () => {
  let parsedLedger: any;

  beforeAll(() => {
    parsedLedger = parseLedgerYaml(REALISTIC_MY_WORLD_YAML);
  });

  test("1. parseLedgerYaml unwraps nested 'ledger:' envelope correctly", () => {
    expect(parsedLedger).toBeDefined();
    expect(parsedLedger.clock?.date).toBe("12-10-18");
    expect(parsedLedger.clock?.location).toBe("Dames Mansion");
    expect(parsedLedger.scene?.place).toBe("dames_mansion:foyer");
    expect(parsedLedger.places?.["dames_mansion:foyer"]).toBeDefined();
    expect(parsedLedger.actors).toBeDefined();
    expect(Object.keys(parsedLedger.actors)).toContain("user");
    expect(Object.keys(parsedLedger.actors)).toContain("jessica");
    expect(parsedLedger.opportunities?.length).toBe(1);
    expect(parsedLedger.journal?.length).toBe(1);
  });

  test("2. MenuBar.setLedger safely hydrates currentLedger", () => {
    const actions: string[] = [];
    const menuBar = new MenuBar((act) => actions.push(act));
    menuBar.setLedger(parsedLedger);

    const overlay = menuBar.getOverlay();
    expect(overlay).toBeDefined();
    expect(overlay.className).toContain("vn-hud-overlay");
  });

  test("3. CharactersTab renders avatar ribbon, attire, inventory, combat, and secrets", () => {
    const tab = new CharactersTab();
    tab.render(parsedLedger);

    const html = tab.root.innerHTML;
    // Header & Ribbon
    expect(html).toContain("Cast &amp; Living World Dossiers");
    expect(html).toContain("Player (You)");
    expect(html).toContain("Jessica");

    // Attire breakdown
    expect(html).toContain("Attire &amp; Wardrobe");
    expect(html).toContain("Fitted heather-gray henley");
    expect(html).toContain("Dark slim-fit jeans");
    expect(html).toContain("Calvin Klein trunks");
    expect(html).toContain("White leather sneakers");

    // Equipment & Money
    expect(html).toContain("Equipment, Carried Gear &amp; Finances");
    expect(html).toContain("$140");
    expect(html).toContain("$1250");
    expect(html).toContain("Canvas duffel bag");
    expect(html).toContain("2018 smartphone");

    // Combat attributes
    expect(html).toContain("Combat Vitals &amp; Aptitudes");
    expect(html).toContain("120/120");
    expect(html).toContain("Bartering");

    // Life model & Want
    expect(html).toContain("Immediate Want:");
    expect(html).toContain("Settle into the mansion");
  });

  test("4. StatsTab renders cleanly without crashing on empty user relations, and displays 21-stat matrix", () => {
    const tab = new StatsTab();
    // Render with user default
    tab.render(parsedLedger);
    let html = tab.root.innerHTML;

    expect(html).toContain("Status, Passions &amp; 21-Stat Ledger Matrix");
    expect(html).toContain("Inspect Actor:");
    expect(html).toContain("Vitals &amp; Attributes");
    expect(html).toContain("No outgoing relationship edges initialized");

    // Now switch selected actor to jessica who has 21-stat matrix and relations
    (tab as any).selectedActorId = "jessica";
    tab.render(parsedLedger);
    html = tab.root.innerHTML;

    // 21-stat matrix verification
    expect(html).toContain("21-Stat Engine Matrix");
    expect(html).toContain("Interpersonal Stance");
    expect(html).toContain("Psychological Equilibrium");
    expect(html).toContain("Behavioral Dynamics");
    expect(html).toContain("Integ");
    expect(html).toContain("Stress");
    expect(html).toContain("EMP");

    // Passions badges
    expect(html).toContain("Current Passions &amp; Affect");
    expect(html).toContain("Arousal");
    expect(html).toContain("Joy");

    // Relationships toward User
    expect(html).toContain("Relations Toward:");
    expect(html).toContain("Affinity");
    expect(html).toContain("Attraction");
    expect(html).toContain("Betrayal Threshold:");

    // Test with active investigation and leverage chips
    const ledgerWithInv: LedgerData = {
      ...parsedLedger,
      world: {
        investigations: {
          watch: {
            authority: "City Watch",
            alert_level: 2,
            target_id: "user",
            clues: ["Muddy footprints", "Torn fabric"],
          },
        },
      },
      actors: {
        ...parsedLedger.actors,
        jessica: {
          ...parsedLedger.actors?.jessica,
          relations: {
            user: {
              trust: 50,
              leverage: ["Knows secret entrance"],
              obligations: ["Owes rent favor"],
            },
          },
        },
      },
    };
    (tab as any).selectedActorId = "jessica";
    tab.render(ledgerWithInv);
    const htmlWithInv = tab.root.innerHTML;
    expect(htmlWithInv).toContain("Active Investigations");
    expect(htmlWithInv).toContain("City Watch");
    expect(htmlWithInv).toContain("Level 2: Suspect Named");
    expect(htmlWithInv).toContain("Muddy footprints, Torn fabric");
    expect(htmlWithInv).toContain("LEVERAGE");
    expect(htmlWithInv).toContain("Knows secret entrance");
    expect(htmlWithInv).toContain("DEBT");
    expect(htmlWithInv).toContain("Owes rent favor");
  });

  test("5. InventoryTab renders in-hand equipment, carried items, and room containers", () => {
    let triggeredAction = "";
    const tab = new InventoryTab((act) => { triggeredAction = act; });
    tab.render(parsedLedger, "user");

    const html = tab.root.innerHTML;
    expect(html).toContain("Inventory &amp; Containers");
    expect(html).toContain("Canvas duffel bag");
    expect(html).toContain("2018 smartphone");
    expect(html).toContain("Extra clothes in suitcase");
  });

  test("6. WardrobeTab renders outfit layers and state", () => {
    let triggeredAction = "";
    const tab = new WardrobeTab((act) => { triggeredAction = act; });
    tab.render(parsedLedger, "user");

    const html = tab.root.innerHTML;
    expect(html).toContain("Wardrobe &amp; Dressing");
    expect(html).toContain("Fitted heather-gray henley");
    expect(html).toContain("Dark slim-fit jeans");
    expect(html).toContain("Calvin Klein trunks");
    expect(html).toContain("White leather sneakers");
    expect(html).toContain("Scent:");
    expect(html).toContain("Condition:");
    expect(html).toContain("Integrity:");
    expect(html).toContain("Clean Clothes");
    expect(html).toContain("Repair Garments");
  });

  test("7. MapTab renders indoor/outdoor nodes and navigation routes", () => {
    let travelTarget = "";
    const tab = new MapTab((act) => { travelTarget = act; });
    tab.render(parsedLedger);

    const html = tab.root.innerHTML;
    expect(html).toContain("Interactive Cartography &amp; Blueprint");
    expect(html).toContain("dames_mansion:foyer");
    expect(html).toContain("LIVING ROOM");
  });

  test("8. PhoneTab renders clock, location, and OS interface", () => {
    let actionTriggered = "";
    const mockCtx: any = {
      getActiveChat: () => ({ id: "chat-123" }),
      user: { id: "user-123" },
      storage: { get: () => null, set: () => {} },
    };
    const tab = new PhoneTab(mockCtx, (act) => { actionTriggered = act; });
    tab.render(parsedLedger);

    const html = tab.root.innerHTML;
    expect(html).toContain("16:30");
    expect(html).toContain("Dames Mansion");
    expect(html).toContain("Messages");
    expect(html).toContain("Wallet");
  });

  test("9. JournalTab renders active opportunities and historical journal entries", () => {
    const tab = new JournalTab();
    tab.render(parsedLedger);

    const html = tab.root.innerHTML;
    expect(html).toContain("Journal &amp; Opportunity Leads");
    expect(html).toContain("Accept a glass of wine with Jessica");
    expect(html).toContain("Arrived at Dames Mansion with duffel bag");
  });

  test("10. SceneTab renders participants and stage state", () => {
    const mockCtx: any = {
      getActiveChat: () => ({ id: "chat-123" }),
      user: { id: "user-123" },
    };
    const tab = new SceneTab(mockCtx);
    tab.render(parsedLedger);

    const html = tab.root.innerHTML;
    expect(html).toContain("Scene Visuals");
    expect(html).toContain("dames_mansion:foyer");
  });

  test("11. DiagnosticsTab renders copy director button and active director guidance card", () => {
    diagBus.setDirectorNote({
      directorNote: "Maintain romantic tension during the interview.",
      threadLabel: "Romance Arc",
      timestamp: "14:00:00",
    });

    const tab = new DiagnosticsTab();
    tab.render(parsedLedger);

    const html = tab.root.innerHTML;
    expect(html).toContain("vn-copy-director-btn");
    expect(html).toContain("Active Director Guidance");
    expect(html).toContain("Romance Arc");
    expect(html).toContain("Maintain romantic tension during the interview.");

    expect(diagBus.getDirectorNote()?.threadLabel).toBe("Romance Arc");
    const bundle = JSON.parse(diagBus.exportAllBundle());
    expect(bundle.directorNote).toBeDefined();
    expect(bundle.directorNote.directorNote).toBe("Maintain romantic tension during the interview.");
  });

  test("12. BPlotsTab renders active b-plots, offscreen cast, latents, travel, and environmental fronts", () => {
    const tab = new BPlotsTab();
    tab.render({
      scene: {
        place: "dames_mansion:foyer",
        latents: [
          { who: "leslie", errand: "Returning from grocery", route: "Main Street", window_opens: "17:00", status: "pending" },
        ],
      },
      roster: [
        { id: "leslie", name: "Leslie", lod: 2, loc: "grocery_store", status: "Shopping" },
      ],
      travel: [
        { actor: "delivery_courier", purpose: "Package dropoff", from: "depot", to: "dames_mansion", depart: "16:15", eta: "16:45", status: "en_route" },
      ],
      bplots: [
        {
          id: "bp_1",
          who: "Neighborhood Council",
          want: "Rezoning hearing approval",
          doing: "Canvassing votes",
          scope: "neighborhood",
          ripple: 2,
          status: "active",
          next: { move: "Distribute flyers", due: "Tomorrow" },
        },
      ],
      fronts: [
        { id: "heatwave", cause: "Severe summer heatwave", stage: "escalating", pressure: 4, due: "D2", known_by: ["User", "Jessica"] },
      ],
    });

    const html = tab.root.innerHTML;
    expect(html).toContain("B-Plots, Fronts &amp; Offscreen Cast");
    expect(html).toContain("Neighborhood Council");
    expect(html).toContain("Stage 2: Ambient Echo");
    expect(html).toContain("Rezoning hearing approval");
    expect(html).toContain("Leslie");
    expect(html).toContain("LOD 2");
    expect(html).toContain("Returning from grocery");
    expect(html).toContain("delivery_courier");
    expect(html).toContain("heatwave");
    expect(html).toContain("Pressure 4/5");
  });
});

```

---

<a id="test-toon-and-rulebook-test-ts"></a>
## File: `test/toon-and-rulebook.test.ts`

**Description**: Source file `test/toon-and-rulebook.test.ts` in LumiVN Visual Novel Engine.

```typescript
import { describe, test, expect } from "bun:test";
import {
  encodeToonState,
  extractToonRaw,
  parseToonDelta,
  moodToPassions,
  getToonPromptInstruction,
} from "../src/backend/toon-parser.js";
import {
  extractProse,
  inferProseEmotionDelta,
  deepMergeLedger,
  extractLedgerRaw,
  parseLedgerYaml,
} from "../src/backend/ledger-parser.js";
import type { LedgerData } from "../src/shared/types.js";

describe("TOON Format & Preset Independence", () => {
  test("encodeToonState produces ultra-compact tabular notation", () => {
    const ledger: LedgerData = {
      scene: { place: "tendo_dojo", time: "D1 14:00" },
      clock: { t: "D1 14:00" },
      actors: {
        user: { passions: { arousal: 0, joy: 0 }, outfit: { state: "casual" } } as any,
        akane: { passions: { arousal: 60 }, outfit: { top: "school_uniform" } } as any,
      },
    };

    const encoded = encodeToonState(ledger);
    expect(encoded).toContain("scene: place:tendo_dojo time:D1 14:00");
    expect(encoded).toContain("actors[2]{id,mood,slot,outfit}:");
    expect(encoded).toContain("user,neutral,left,casual");
    expect(encoded).toContain("akane,blush,center,school_uniform");

    // Token efficiency: Total encoded length is very small (~130 chars = ~30 tokens)
    expect(encoded.length).toBeLessThan(170);
  });

  test("extractToonRaw extracts TOON blocks from HTML comments and brackets", () => {
    const htmlComment = `Here is the story prose.\n<!--toon\nscene: place:kitchen\nactors[1]{id,mood,slot}:\n akane,smile,center\n-->`;
    const extracted1 = extractToonRaw(htmlComment);
    expect(extracted1).toBeDefined();
    expect(extracted1).toContain("scene: place:kitchen");
    expect(extracted1).toContain("akane,smile,center");

    const bracketBlock = `The dialogue continues.\n[toon\nscene: place:garden\nactors[1]{id,mood}:\n kasumi,neutral\n]`;
    const extracted2 = extractToonRaw(bracketBlock);
    expect(extracted2).toBeDefined();
    expect(extracted2).toContain("scene: place:garden");
  });

  test("parseToonDelta parses tabular rows into structured LedgerData", () => {
    const rawToon = `
scene: place:parlor time:16:00
actors[2]{id,mood,slot,outfit}:
 user,neutral,left,casual
 ranma,angry,center,martial_arts
`;
    const delta = parseToonDelta(rawToon);
    expect(delta).not.toBeNull();
    expect(delta?.scene?.place).toBe("parlor");
    expect(delta?.scene?.time).toBe("16:00");
    expect(delta?.actors?.["user"]).toBeDefined();
    expect(delta?.actors?.["ranma"]).toBeDefined();
    expect(delta?.actors?.["ranma"]?.passions?.anger).toBe(60);
    expect(delta?.actors?.["ranma"]?.outfit?.state).toBe("martial_arts");
    expect((delta?.actors?.["ranma"] as any)?.slot).toBe("center");
  });

  test("moodToPassions correctly maps emotional bands", () => {
    expect(moodToPassions("blush").arousal).toBe(70);
    expect(moodToPassions("angry").anger).toBe(60);
    expect(moodToPassions("scared").fear).toBe(60);
    expect(moodToPassions("smile").joy).toBe(60);
    expect(moodToPassions("sad").sadness).toBe(60);
    expect(moodToPassions("suspicious").suspicion).toBe(60);
    expect(moodToPassions("neutral").joy).toBe(0);
  });

  test("extractProse strips TOON tags cleanly without affecting narrative", () => {
    const raw = `Ranma crossed his arms.\n"What are you looking at?"\n<!--toon\nscene: place:kitchen\nactors[1]{id,mood}:\n ranma,angry\n-->`;
    const clean = extractProse(raw);
    expect(clean).toBe(`Ranma crossed his arms.\n"What are you looking at?"`);
    expect(clean).not.toContain("<!--toon");
    expect(clean).not.toContain("scene:");
  });

  test("inferProseEmotionDelta extracts emotional shift from pure narrative prose", () => {
    const prose = `Akane looked away, her cheeks blushing red with embarrassment.\n"I suppose you did well today."`;
    const delta = inferProseEmotionDelta(prose, "akane");
    expect(delta).not.toBeNull();
    expect(delta?.actors?.["akane"]?.passions?.arousal).toBe(60);

    const happyProse = `Nabiki chuckled warmly and counted the notes with a grin.`;
    const happyDelta = inferProseEmotionDelta(happyProse, "nabiki");
    expect(happyDelta).not.toBeNull();
    expect(happyDelta?.actors?.["nabiki"]?.passions?.joy).toBe(60);
  });

  test("deepMergeLedger merges TOON delta seamlessly with existing chat state", () => {
    const base: LedgerData = {
      scene: { place: "tendo_dojo", time: "12:00" },
      actors: {
        user: { passions: { arousal: 0 } } as any,
        akane: { passions: { anger: 20 }, outfit: { state: "school" } } as any,
      },
    };

    const delta = parseToonDelta(`
scene: place:kitchen
actors[1]{id,mood,slot}:
 akane,blush,right
`);

    expect(delta).not.toBeNull();
    const merged = deepMergeLedger(base, delta!);

    expect(merged.scene?.place).toBe("kitchen");
    expect(merged.scene?.time).toBe("12:00"); // preserved
    expect(merged.actors?.["akane"]?.passions?.arousal).toBe(70); // updated
    expect(merged.actors?.["akane"]?.outfit?.state).toBe("school"); // preserved
    expect((merged.actors?.["akane"] as any)?.slot).toBe("right"); // updated
    expect(merged.actors?.["user"]).toBeDefined(); // preserved
  });
});

describe("State Details Block Extraction & Comprehensive Character Stats", () => {
  test("extractLedgerRaw extracts from <details><summary>State</summary> block", () => {
    const reply = `
She stepped into the hallway, fixing her collar.
"We should leave soon."

<details><summary>State</summary>
\`\`\`yaml
clock:
  date: "14-04-26"
  t: "D1 18:30"
scene:
  place: "nerima:hallway"
  participants: [user, akane]
actors:
  akane:
    name: "Akane Tendo"
    passions:
      anger: 15
      shame: 45
      arousal: 25
      fear: 0
      stress: 30
      pain: 0
      exhaustion: 10
      suspicion: 20
      disgust: 0
      sadness: 5
      guilt: 0
      joy: 50
    combat:
      tier: "T2"
      lv: 3
      hp: "450/600"
      mp: "200/300"
      pwr: 80
      agi: 95
      int: 60
      talent: ["Martial Arts Kata"]
    relations:
      user:
        affinity: 65
        trust: 55
        loyalty: 70
        betrayal_threshold: 40
        shared_secrets: ["Secret Training"]
    agency:
      want_now: "Master the whirlwind technique"
    knowledge:
      secrets:
        - truth: "Fears water"
          exposure: 30
\`\`\`
</details>
`;

    const cleanProse = extractProse(reply);
    expect(cleanProse).toBe(`She stepped into the hallway, fixing her collar.\n"We should leave soon."`);
    expect(cleanProse).not.toContain("<details");
    expect(cleanProse).not.toContain("State");
    expect(cleanProse).not.toContain("akane:");

    const raw = extractLedgerRaw(reply);
    expect(raw).not.toBeNull();
    const parsed = parseLedgerYaml(raw!);

    expect(parsed.clock?.t).toBe("D1 18:30");
    expect(parsed.scene?.place).toBe("nerima:hallway");

    const akane = parsed.actors?.["akane"];
    expect(akane).toBeDefined();
    expect(akane?.name).toBe("Akane Tendo");

    // Passions
    expect(akane?.passions?.shame).toBe(45);
    expect(akane?.passions?.joy).toBe(50);
    expect(akane?.passions?.anger).toBe(15);

    // Combat
    expect(akane?.combat?.tier).toBe("T2");
    expect(akane?.combat?.hp).toBe("450/600");
    expect(akane?.combat?.pwr).toBe(80);

    // Relations & Betrayal Threshold
    const userRel = (akane?.relations as any)?.["user"];
    expect(userRel).toBeDefined();
    expect(userRel?.affinity).toBe(65);
    expect(userRel?.betrayal_threshold).toBe(40);
    expect(userRel?.shared_secrets).toEqual(["Secret Training"]);

    // Agency & Secrets
    expect(akane?.agency?.want_now).toBe("Master the whirlwind technique");
    const secret = (akane?.knowledge as any)?.secrets?.[0];
    expect(secret?.truth).toBe("Fears water");
    expect(secret?.exposure).toBe(30);
  });

  test("extractLedgerRaw extracts from untagged <details> block with yaml", () => {
    const reply = `
The rain started drumming against the glass.

<details>
\`\`\`yaml
clock:
  t: "D2 09:00"
scene:
  place: "school:roof"
actors:
  ranma:
    name: "Ranma Saotome"
    passions:
      anger: 50
    relations:
      user:
        affinity: 30
        betrayal_threshold: 75
\`\`\`
</details>
`;

    const clean = extractProse(reply);
    expect(clean).toBe("The rain started drumming against the glass.");

    const raw = extractLedgerRaw(reply);
    expect(raw).not.toBeNull();
    const parsed = parseLedgerYaml(raw!);
    expect(parsed.scene?.place).toBe("school:roof");
    expect((parsed.actors?.["ranma"]?.relations as any)?.["user"]?.betrayal_threshold).toBe(75);
  });
});


```

---

<a id="tsconfig-json"></a>
## File: `tsconfig.json`

**Description**: Source file `tsconfig.json` in LumiVN Visual Novel Engine.

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

---

