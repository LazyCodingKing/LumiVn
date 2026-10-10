import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import type { VnPresentationState, LedgerData } from "../../shared/types.js";
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
  private statusPill: HTMLElement;

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

    // Top Status Pill (floating Mini-HUD)
    this.statusPill = document.createElement("div");
    this.statusPill.className = "vn-top-status-pill";
    this.statusPill.style.display = "none";

    this.root.appendChild(this.exitButton);
    this.root.appendChild(this.statusPill);
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

  public getManifest(): any {
    return this.manifest;
  }

  public resetStage(targetChatId?: string): void {
    this.currentChatId = targetChatId || this.resolveChatId() || null;
    this.ttsEngine.setChatId(this.currentChatId || "");
    this.lastProcessedEvtId = null;
    this.statusPill.style.display = "none";
    this.statusPill.innerHTML = "";
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

    this.audioEngine.stopBgm();
    this.ttsEngine.stop();

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

    // Dynamic BGM handling (explicit track URL, inline [Music: ...]/🎵 tags, or mood/place mapping)
    if (state.bgmUrl) {
      this.audioEngine.playBgm(state.bgmUrl);
    } else {
      const fullText = (state.paragraphs || []).join(" ");
      const primaryEmotion = state.characters?.[0]?.emotion;
      this.audioEngine.handleDynamicBgm(
        fullText,
        primaryEmotion,
        place,
        this.manifest?.places
      );
    }

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
    this.updateStatusPill(state.ledger);
    this.ttsEngine.setLedgerVoices(state.ledger?.actors);

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

  private updateStatusPill(ledger?: LedgerData): void {
    if (!ledger) {
      this.statusPill.style.display = "none";
      return;
    }

    const clockPhase = ledger.clock?.phase || (ledger.clock as any)?.period;
    const clockText = ledger.clock
      ? `${ledger.clock.t || ""}${clockPhase ? ` (${clockPhase})` : ""}`.trim() || ""
      : "";

    const placeText = ledger.scene?.room || ledger.scene?.place || ledger.scene?.district || "";

    // Count items in carried + hands (checking both ActorInventory and legacy layout)
    const inv: any = (ledger as any).inventory || ledger.actors?.["user"]?.inventory;
    let itemCount = 0;
    if (Array.isArray(inv?.carried)) {
      itemCount += inv.carried.length;
    }
    if (inv?.in_hand?.L && inv.in_hand.L !== "Empty" && inv.in_hand.L !== "none") itemCount++;
    if (inv?.in_hand?.R && inv.in_hand.R !== "Empty" && inv.in_hand.R !== "none") itemCount++;
    if (inv?.hands?.left && inv.hands.left !== "Empty" && inv.hands.left !== "none") itemCount++;
    if (inv?.hands?.right && inv.hands.right !== "Empty" && inv.hands.right !== "none") itemCount++;

    // Find main relation affinity if available
    let relText = "";
    if (ledger.relationships) {
      for (const [targetId, rels] of Object.entries(ledger.relationships)) {
        if (targetId.toLowerCase() === "user") continue;
        const affinity = (rels as any).affinity ?? (rels as any).Affinity;
        if (typeof affinity === "number") {
          const targetName = ledger.actors?.[targetId]?.name || targetId;
          relText = `${targetName} ${affinity >= 0 ? "+" : ""}${affinity}`;
          break;
        }
      }
    }

    if (!clockText && !placeText && !relText && itemCount === 0) {
      this.statusPill.style.display = "none";
      return;
    }

    this.statusPill.innerHTML = "";

    // 1. Clock Pill Item -> opens Scene tab
    if (clockText) {
      const clockBtn = document.createElement("button");
      clockBtn.className = "vn-pill-item";
      clockBtn.innerHTML = `<span class="vn-pill-icon">⏱️</span><span class="vn-pill-text">${clockText}</span>`;
      clockBtn.title = "Time & Chronology";
      clockBtn.addEventListener("click", () => this.menuBar.openTab("scene"));
      this.statusPill.appendChild(clockBtn);
    }

    // 2. Place Pill Item -> opens Map
    if (placeText) {
      if (this.statusPill.children.length > 0) {
        const sep = document.createElement("span");
        sep.className = "vn-pill-sep";
        this.statusPill.appendChild(sep);
      }
      const placeBtn = document.createElement("button");
      placeBtn.className = "vn-pill-item";
      placeBtn.innerHTML = `<span class="vn-pill-icon">📍</span><span class="vn-pill-text">${placeText}</span>`;
      placeBtn.title = "Current Location — Click for Map";
      placeBtn.addEventListener("click", () => this.menuBar.openTab("map"));
      this.statusPill.appendChild(placeBtn);
    }

    // 3. Affinity Pill Item -> opens Stats
    if (relText) {
      if (this.statusPill.children.length > 0) {
        const sep = document.createElement("span");
        sep.className = "vn-pill-sep";
        this.statusPill.appendChild(sep);
      }
      const relBtn = document.createElement("button");
      relBtn.className = "vn-pill-item";
      relBtn.innerHTML = `<span class="vn-pill-icon">💖</span><span class="vn-pill-text">${relText}</span>`;
      relBtn.title = "Relationship Affinity — Click for Stats";
      relBtn.addEventListener("click", () => this.menuBar.openTab("stats"));
      this.statusPill.appendChild(relBtn);
    }

    // 4. Inventory Pill Item -> opens Inventory
    if (this.statusPill.children.length > 0) {
      const sep = document.createElement("span");
      sep.className = "vn-pill-sep";
      this.statusPill.appendChild(sep);
    }
    const bagBtn = document.createElement("button");
    bagBtn.className = "vn-pill-item";
    bagBtn.innerHTML = `<span class="vn-pill-icon">🎒</span><span class="vn-pill-text">${itemCount} item${itemCount === 1 ? "" : "s"}</span>`;
    bagBtn.title = "Inventory Bag — Click to view items";
    bagBtn.addEventListener("click", () => this.menuBar.openTab("inventory"));
    this.statusPill.appendChild(bagBtn);

    this.statusPill.style.display = "flex";
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
      @keyframes vn-char-slide-in {
        from {
          opacity: 0;
          transform: translate(var(--char-offset-x, 0px), calc(var(--char-offset-y, 0px) + 20px)) scale(calc(var(--char-scale, 1) * 0.96));
        }
        to {
          opacity: 1;
          transform: translate(var(--char-offset-x, 0px), var(--char-offset-y, 0px)) scale(var(--char-scale, 1));
        }
      }

      .vn-char-slot {
        height: 85%;
        max-width: 25%;
        position: relative;
        display: flex;
        justify-content: center;
        align-items: flex-end;
        transform: translate(var(--char-offset-x, 0px), var(--char-offset-y, 0px)) scale(var(--char-scale, 1));
        transform-origin: bottom center;
        transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.35s ease, opacity 0.35s ease;
        animation: vn-char-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) backwards;
        animation-delay: var(--enter-delay, 0s);
        pointer-events: auto;
        cursor: pointer;
      }
      .vn-char-slot:hover {
        transform: translate(var(--char-offset-x, 0px), calc(var(--char-offset-y, 0px) - 6px)) scale(calc(var(--char-scale, 1) * 1.02));
        z-index: 6;
      }
      .vn-char-slot:hover .vn-char-tag {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
      .vn-char-tag {
        position: absolute;
        bottom: 12px;
        left: 50%;
        transform: translateX(-50%) translateY(6px);
        background: rgba(15, 23, 42, 0.88);
        border: 1px solid rgba(129, 140, 248, 0.4);
        color: #f8fafc;
        padding: 3px 10px;
        border-radius: 9999px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.3px;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
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
      .vn-char-far-left { order: 1; }
      .vn-char-left { order: 2; }
      .vn-char-center { order: 3; }
      .vn-char-right { order: 4; }
      .vn-char-far-right { order: 5; }

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

      /* Tactile Sprite Touch Reactions */
      .vn-touch-overlay {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        z-index: 10;
        pointer-events: auto;
      }
      .vn-touch-zone {
        width: 100%;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .vn-touch-zone:hover {
        background: rgba(255, 255, 255, 0.05);
      }
      .vn-touch-head {
        height: 25%;
      }
      .vn-touch-face {
        height: 25%;
      }
      .vn-touch-body {
        height: 50%;
      }
      @keyframes vn-touch-bounce {
        0% { transform: translate(var(--char-offset-x, 0px), var(--char-offset-y, 0px)) scale(var(--char-scale, 1)); }
        40% { transform: translate(var(--char-offset-x, 0px), calc(var(--char-offset-y, 0px) - 10px)) scale(calc(var(--char-scale, 1) * 1.05)); }
        70% { transform: translate(var(--char-offset-x, 0px), calc(var(--char-offset-y, 0px) + 2px)) scale(calc(var(--char-scale, 1) * 0.98)); }
        100% { transform: translate(var(--char-offset-x, 0px), var(--char-offset-y, 0px)) scale(var(--char-scale, 1)); }
      }
      .vn-touch-bounce {
        animation: vn-touch-bounce 0.45s cubic-bezier(0.17, 0.89, 0.32, 1.28) !important;
      }
      .vn-touch-bubble {
        position: absolute;
        top: -45px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(15, 23, 42, 0.94);
        border: 1px solid rgba(129, 140, 248, 0.6);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 12px rgba(99, 102, 241, 0.3);
        color: #f8fafc;
        padding: 6px 12px;
        border-radius: 12px;
        font-size: 11px;
        line-height: 1.4;
        white-space: nowrap;
        max-width: 220px;
        overflow: hidden;
        text-overflow: ellipsis;
        z-index: 20;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        animation: vn-bubble-pop 0.25s cubic-bezier(0.17, 0.89, 0.32, 1.28);
        backdrop-filter: blur(8px);
      }
      .vn-touch-bubble::after {
        content: "";
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        border-width: 6px 6px 0;
        border-style: solid;
        border-color: rgba(15, 23, 42, 0.94) transparent transparent;
        display: block;
        width: 0;
      }
      .vn-touch-bubble-fade {
        opacity: 0;
        transform: translateX(-50%) translateY(-8px);
        transition: opacity 0.35s ease, transform 0.35s ease;
      }
      .vn-touch-bubble-name {
        font-size: 9px;
        font-weight: 800;
        color: #38bdf8;
        letter-spacing: 0.5px;
        text-transform: uppercase;
      }
      .vn-touch-bubble-text {
        font-size: 11px;
        color: #e2e8f0;
        font-style: italic;
      }
      @keyframes vn-bubble-pop {
        0% { opacity: 0; transform: translateX(-50%) scale(0.7) translateY(8px); }
        100% { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
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

      /* Top Status Pill (floating Mini-HUD) */
      .vn-top-status-pill {
        position: fixed;
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        display: flex;
        align-items: center;
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 9999px;
        padding: 4px 12px;
        backdrop-filter: blur(14px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.2);
        max-width: 55vw;
        overflow-x: auto;
      }
      .vn-top-status-pill::-webkit-scrollbar { display: none; }
      .vn-pill-item {
        background: transparent;
        border: none;
        color: #f1f5f9;
        font-size: 12px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 9999px;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s ease;
      }
      .vn-pill-item:hover {
        background: rgba(255, 255, 255, 0.14);
        color: #38bdf8;
      }
      .vn-pill-sep {
        width: 1px;
        height: 14px;
        background: rgba(255, 255, 255, 0.18);
        margin: 0 2px;
        flex-shrink: 0;
      }
      .vn-pill-icon {
        font-size: 13px;
      }
      .vn-pill-text {
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* HUD Menu Bar - Vertical Navigation Rail on Left */
      .vn-hud-menubar {
        position: fixed;
        top: 68px;
        left: 16px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 6px;
        max-height: calc(100vh - 90px);
        overflow-y: auto;
        scrollbar-width: none;
      }
      .vn-hud-menubar::-webkit-scrollbar { display: none; }
      .vn-hud-btn {
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        padding: 7px 12px;
        color: #f8fafc;
        font-size: 12px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 7px;
        cursor: pointer;
        backdrop-filter: blur(8px);
        position: relative;
        transition: all 0.2s ease;
        white-space: nowrap;
      }
      .vn-hud-btn:hover {
        background: rgba(30, 41, 59, 0.95);
        border-color: #818cf8;
        color: #fff;
      }
      .vn-hud-btn.active {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.35), rgba(139, 92, 246, 0.25));
        border-color: #a5b4fc;
        color: #fff;
        box-shadow: 0 0 10px rgba(99, 102, 241, 0.35);
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

      /* HUD Modal / Overlay (Ren'Py Glassmorphism) */
      .vn-hud-overlay {
        position: fixed;
        inset: 0;
        z-index: 99998;
        background: rgba(0, 0, 0, 0.72);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .vn-hud-modal {
        background: rgba(15, 23, 42, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 20px;
        width: min(840px, calc(94vw - 110px));
        margin-left: 110px;
        max-height: 86vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        position: relative;
        backdrop-filter: blur(24px);
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.85), 0 0 1px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.12);
      }
      @media (max-width: 768px) {
        .vn-hud-menubar {
          top: auto;
          bottom: 16px;
          left: 16px;
          right: 16px;
          flex-direction: row;
          max-height: none;
          overflow-x: auto;
        }
        .vn-hud-modal {
          margin-left: 0;
          width: 96%;
        }
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
      .vn-wardrobe-status-bar {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        padding: 10px 14px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        margin-bottom: 16px;
      }
      .vn-wardrobe-status-item {
        font-size: 13px;
        color: #94a3b8;
        display: flex;
        gap: 6px;
        align-items: center;
      }
      .vn-wardrobe-status-item strong {
        color: #f8fafc;
      }
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
