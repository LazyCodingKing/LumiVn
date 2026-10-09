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
