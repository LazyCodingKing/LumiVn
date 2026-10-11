import type { ActorDossier } from "../../shared/types.js";

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
  private playSessionId = 0;
  private settings: VnVoiceSettings = { ...DEFAULT_VOICE_SETTINGS };
  private activeChatId = "";
  private cachedDefaultConnection: SafeTtsProfile | null = null;
  private ledgerVoices = new Map<string, SpeechVoiceRef>();
  private audioCache = new Map<string, { blob: Blob; url: string; duration?: number }>();
  private pendingFetches = new Map<string, Promise<{ blob: Blob; url: string; duration?: number } | null>>();

  constructor() {
    this.loadLocalSettings();
  }

  public setChatId(chatId: string): void {
    if (this.activeChatId !== chatId) {
      this.clearAudioCache();
    }
    this.activeChatId = chatId;
  }

  public setLedgerVoices(actors?: Record<string, ActorDossier>): void {
    this.ledgerVoices.clear();
    if (!actors) return;
    for (const [id, dossier] of Object.entries(actors)) {
      const v = (dossier as any).voice || (dossier?.profile as any)?.voice;
      if (v) {
        let speed: number | undefined;
        if (typeof (dossier as any).speech_style === "string") {
          const style = (dossier as any).speech_style.toLowerCase();
          if (style.includes("fast") || style.includes("hurried") || style.includes("excited")) speed = 1.15;
          if (style.includes("slow") || style.includes("deliberate") || style.includes("calm")) speed = 0.88;
        }
        const ref: SpeechVoiceRef =
          typeof v === "string"
            ? { connectionId: "", voice: v, speed }
            : { connectionId: v.connectionId || "", voice: v.voice || "", speed: v.speed ?? speed };

        this.ledgerVoices.set(speakerKey(id), ref);
        if (dossier.name) this.ledgerVoices.set(speakerKey(dossier.name), ref);
      }
    }
  }

  public clearAudioCache(): void {
    for (const cached of this.audioCache.values()) {
      try {
        URL.revokeObjectURL(cached.url);
      } catch {}
    }
    this.audioCache.clear();
    this.pendingFetches.clear();
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
    this.playSessionId++;
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
   * Resolves voice ref: manual override -> ledger actor voice tag -> characterDefault -> narrator -> null
   */
  public resolveVoice(speakerName = ""): SpeechVoiceRef | null {
    const clean = speakerKey(speakerName);
    const isNarrator = !clean || clean === "narrator";

    if (isNarrator) {
      return this.settings.narrator || this.settings.characterDefault || null;
    }

    // 1. Manual user override for this character
    const scopedKey = characterVoiceKey(this.activeChatId, clean);
    const manualRef = this.settings.characters[scopedKey] || this.settings.characters[clean];
    if (manualRef) return manualRef;

    // 2. Character ledger voice tag / speech style
    const ledgerRef = this.ledgerVoices.get(clean);
    if (ledgerRef) return ledgerRef;

    // 3. Fallbacks
    return (
      this.settings.characterDefault ||
      this.settings.narrator ||
      null
    );
  }

  /**
   * Asynchronously prefetches and caches synthesized audio so dialogue plays instantly at word 1.
   */
  public async prefetch(text: string, speakerName = ""): Promise<void> {
    if (!this.settings.enabled || !text.trim()) return;
    const cleanText = this.cleanDialogueText(text);
    if (!cleanText) return;
    const key = `${speakerKey(speakerName)}::${cleanText}`;
    if (this.audioCache.has(key) || this.pendingFetches.has(key)) return;

    const fetchPromise = (async () => {
      let voiceRef = this.resolveVoice(speakerName);
      if (!voiceRef?.connectionId) {
        const defaultConn = await this.resolveDefaultConnection();
        if (defaultConn) {
          voiceRef = {
            connectionId: defaultConn.id,
            voice: voiceRef?.voice || defaultConn.voice || "",
            speed: voiceRef?.speed,
          };
        }
      }
      if (!voiceRef?.connectionId) return null;

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
          if (typeof URL !== "undefined") {
            const url = URL.createObjectURL(blob);
            const entry = { blob, url };
            this.audioCache.set(key, entry);
            if (this.audioCache.size > 20) {
              const firstKey = this.audioCache.keys().next().value;
              if (firstKey) {
                const old = this.audioCache.get(firstKey);
                if (old) URL.revokeObjectURL(old.url);
                this.audioCache.delete(firstKey);
              }
            }
            return entry;
          }
        }
      } catch {}
      return null;
    })();

    this.pendingFetches.set(key, fetchPromise);
    try {
      await fetchPromise;
    } finally {
      this.pendingFetches.delete(key);
    }
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
    const sessionId = this.playSessionId;

    const cb: SpeakCallbacks =
      typeof callbacks === "function" ? { onEnd: callbacks } : callbacks || {};

    const cleanText = this.cleanDialogueText(text);
    if (!cleanText) {
      cb.onEnd?.();
      return;
    }

    const cacheKey = `${speakerKey(speakerName)}::${cleanText}`;
    let cached = this.audioCache.get(cacheKey);
    if (!cached && this.pendingFetches.has(cacheKey)) {
      cached = (await this.pendingFetches.get(cacheKey)) || undefined;
    }
    if (sessionId !== this.playSessionId) return;

    // Fast-path: audio is already cached in memory!
    if (cached && typeof Audio !== "undefined") {
      const audio = new Audio(cached.url);
      this.currentAudio = audio;
      audio.volume = Math.max(0, Math.min(1, this.settings.volume));

      audio.addEventListener("play", () => {
        cb.onStart?.(audio.duration || undefined);
      });

      audio.addEventListener("ended", () => {
        this.currentAudio = null;
        cb.onEnd?.();
      });

      audio.addEventListener("error", (e) => {
        this.currentAudio = null;
        cb.onError?.(e);
      });

      try {
        await audio.play();
        return;
      } catch {
        // Autoplay policy or error, fall through
      }
    }
    if (sessionId !== this.playSessionId) return;

    let voiceRef = this.resolveVoice(speakerName);

    // Fall back to host default connection if no explicit voice configured
    if (!voiceRef?.connectionId) {
      const defaultConn = await this.resolveDefaultConnection();
      if (defaultConn) {
        voiceRef = {
          connectionId: defaultConn.id,
          voice: voiceRef?.voice || defaultConn.voice || "",
          speed: voiceRef?.speed,
        };
      }
    }
    if (sessionId !== this.playSessionId) return;

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

        if (sessionId !== this.playSessionId) return;

        if (resp.ok) {
          const blob = await resp.blob();
          if (sessionId !== this.playSessionId) return;
          if (typeof Audio !== "undefined" && typeof URL !== "undefined") {
            const url = URL.createObjectURL(blob);
            this.audioCache.set(cacheKey, { blob, url });
            const audio = new Audio(url);
            this.currentAudio = audio;
            audio.volume = Math.max(0, Math.min(1, this.settings.volume));

            audio.addEventListener("play", () => {
              cb.onStart?.(audio.duration || undefined);
            });

            audio.addEventListener("ended", () => {
              this.currentAudio = null;
              cb.onEnd?.();
            });

            audio.addEventListener("error", (e) => {
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

  public prefetchBeats(beats: Array<{ text: string; speaker?: string }>): void {
    if (!this.settings.enabled || !Array.isArray(beats)) return;
    for (const b of beats.slice(0, 5)) {
      if (b.text) {
        this.prefetch(b.text, b.speaker || "");
      }
    }
  }
}
