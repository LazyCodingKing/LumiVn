import type { SpindleFrontendContext, SpindleAppMountHandle } from "lumiverse-spindle-types";
import type { VnPresentationState, DirectorSettings, DirectorLogEntry, DirectorNoteData } from "./shared/types.js";
import { StageOverlay } from "./frontend/stage/overlay.js";
import { registerAssetDrawer } from "./frontend/studio/asset-drawer.js";
import {
  registerDiagnosticsDrawer,
  type DiagnosticData,
} from "./frontend/studio/diagnostics-drawer.js";
import { diagBus } from "./frontend/utils/diag-bus.js";

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

  // ── Host Lifecycle Subscriptions (Chat switched / changed / forked) ──
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

  // Handle Backend Messages
  const unsubscribeBackend = ctx.onBackendMessage((msg: unknown) => {
    const payload = msg as Record<string, unknown>;
    if (payload?.type === "vn_force_open") {
      if (!overlay.isActive()) toggleStage();
      diagDrawer?.pushLog("Stage launched via Command Palette.", "info");
      diagBus.pushLog("Stage launched via Command Palette.", "info");
    } else if (payload?.type === "vn_generating") {
      const targetCid = typeof payload.chatId === "string" ? payload.chatId : null;
      if (overlay.isActive() && (!targetCid || overlay.getCurrentChatId() === targetCid)) {
        overlay.showGenerating();
      }
    } else if (payload?.type === "vn_diagnostic_update" && payload.data) {
      diagDrawer?.updateDiagnostic(payload.data as DiagnosticData);
      diagBus.setTelemetry(payload.data as DiagnosticData);
    } else if (payload?.type === "vn_state" && payload.state) {
      const st = payload.state as VnPresentationState;
      overlay.updatePresentation(st);
      diagDrawer?.setLatestLedger(st.ledger);
      diagBus.setLedger(st.ledger);
    } else if (payload?.type === "vn_log") {
      diagDrawer?.pushLog(String(payload.message), (payload.level as any) || "info");
      diagBus.pushLog(String(payload.message), (payload.level as any) || "info");
    } else if (payload?.type === "vn_manifest" && payload.manifest) {
      diagDrawer?.setLatestManifest?.(payload.manifest);
      overlay.setManifest(payload.manifest as any);
      diagBus.setManifest(payload.manifest as any);
    } else if (payload?.type === "vn_director_settings" && payload.settings) {
      diagDrawer?.setDirectorSettings?.(payload.settings as DirectorSettings);
    } else if (payload?.type === "vn_director_note" && payload.data) {
      diagBus.setDirectorNote(payload.data as any);
    } else if (payload?.type === "vn_director_log" && payload.log) {
      diagDrawer?.pushDirectorLog?.(payload.log as DirectorLogEntry);
    } else if (payload?.type === "vn_director_logs" && Array.isArray(payload.logs)) {
      diagDrawer?.setDirectorLogs?.(payload.logs as DirectorLogEntry[]);
    } else if (payload?.type === "vn_error") {
      diagDrawer?.pushLog(String(payload.error), "error");
      diagBus.pushLog(String(payload.error), "error");
    }
  });

  ctx.ready();

  const cleanup = () => {
    unsubChatSwitched?.();
    unsubChatChanged?.();
    unsubChatForked?.();
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
