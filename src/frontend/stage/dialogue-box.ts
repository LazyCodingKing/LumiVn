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
