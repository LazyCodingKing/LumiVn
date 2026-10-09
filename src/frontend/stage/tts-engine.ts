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
