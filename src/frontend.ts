import type { SpindleFrontendContext, SpindleAppMountHandle } from "lumiverse-spindle-types";
import type { VnPresentationState, DiagnosticData } from "./shared/types.js";
import { StageOverlay } from "./frontend/stage/overlay.js";
import { diagBus } from "./frontend/utils/diag-bus.js";

const CLEANUP_KEY = "__lumivnCleanup";

export function setup(ctx: SpindleFrontendContext): () => void {
  // 1. Readiness Protocol: opt out of auto-ready, queue startup messages
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
  let mountContainer: HTMLElement;

  // 2. DOM Cleanliness: Mount full-screen stage via official app mount
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

  // 3. Register Official UI Actions (No unmanaged floating elements on document.body)
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

  // 4. Host Lifecycle Subscriptions (Chat switched / changed / forked)
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

  // 5. Handle Backend Messages
  const unsubscribeBackend = ctx.onBackendMessage((msg: unknown) => {
    const payload = msg as Record<string, unknown>;
    if (payload?.type === "vn_force_open") {
      if (!overlay.isActive()) toggleStage();
      if (typeof payload.tab === "string") {
        overlay.openHudTab(payload.tab);
      }
      diagBus.pushLog("Stage launched via Command Palette.", "info");
    } else if (payload?.type === "vn_generating") {
      const targetCid = typeof payload.chatId === "string" ? payload.chatId : null;
      if (overlay.isActive() && (!targetCid || overlay.getCurrentChatId() === targetCid)) {
        overlay.showGenerating();
      }
    } else if (payload?.type === "vn_user_message") {
      const targetCid = typeof payload.chatId === "string" ? payload.chatId : null;
      if (overlay.isActive() && (!targetCid || overlay.getCurrentChatId() === targetCid)) {
        const text = typeof payload.text === "string" ? payload.text : "";
        const speaker = typeof payload.speaker === "string" ? payload.speaker : "You";
        if (text) {
          overlay.showUserMessage(text, speaker);
        }
      }
    } else if (payload?.type === "vn_diagnostic_update" && payload.data) {
      diagBus.setTelemetry(payload.data as DiagnosticData);
    } else if (payload?.type === "vn_state" && payload.state) {
      const st = payload.state as VnPresentationState;
      overlay.updatePresentation(st);
      diagBus.setLedger(st.ledger);
    } else if (payload?.type === "vn_log") {
      diagBus.pushLog(String(payload.message), (payload.level as any) || "info");
    } else if (payload?.type === "vn_manifest" && payload.manifest) {
      overlay.setManifest(payload.manifest as any);
      diagBus.setManifest(payload.manifest as any);
    } else if (payload?.type === "vn_director_note" && payload.data) {
      diagBus.setDirectorNote(payload.data as any);
    } else if (payload?.type === "vn_error") {
      diagBus.pushLog(String(payload.error), "error");
    }
  });

  // 6. Signal Frontend Ready immediately after setup completion
  ctx.ready();

  const cleanup = () => {
    unsubChatSwitched?.();
    unsubChatChanged?.();
    unsubChatForked?.();
    unsubscribeBackend();
    chatHeaderActionHandle?.destroy();
    inputBarActionHandle?.destroy();
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
