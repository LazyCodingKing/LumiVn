export interface SafeTtsConnection {
  id: string;
  name: string;
  provider: string;
  model: string;
  voice: string;
  isDefault: boolean;
}

export class VnTtsEngine {
  private enabled = false;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private defaultConnection: SafeTtsConnection | null = null;
  private connectionFetched = false;
  private currentAudio: HTMLAudioElement | null = null;
  private currentObjectUrl: string | null = null;
  private abortController: AbortController | null = null;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.loadVoices();
      window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices(): void {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.voices = window.speechSynthesis.getVoices();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean): void {
    this.enabled = val;
    if (!val) {
      this.stop();
    } else {
      void this.resolveDefaultConnection();
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  public async resolveDefaultConnection(forceRefresh = false): Promise<SafeTtsConnection | null> {
    if (this.defaultConnection && !forceRefresh) {
      return this.defaultConnection;
    }
    if (typeof window === "undefined" || typeof fetch === "undefined") {
      return null;
    }

    try {
      const res = await fetch("/api/v1/tts-connections?limit=100&offset=0", {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) return null;
      const json = (await res.json()) as { data?: unknown[] };
      const rows = Array.isArray(json?.data) ? json.data : [];

      let foundDefault: SafeTtsConnection | null = null;
      let firstValid: SafeTtsConnection | null = null;

      for (const row of rows) {
        if (!row || typeof row !== "object") continue;
        const r = row as Record<string, unknown>;
        if (typeof r.id !== "string" || !r.id) continue;

        const conn: SafeTtsConnection = {
          id: r.id,
          name: typeof r.name === "string" ? r.name : r.id,
          provider: typeof r.provider === "string" ? r.provider : "",
          model: typeof r.model === "string" ? r.model : "",
          voice: typeof r.voice === "string" ? r.voice : "",
          isDefault: r.is_default === true,
        };

        if (!firstValid) firstValid = conn;
        if (conn.isDefault) {
          foundDefault = conn;
          break;
        }
      }

      this.defaultConnection = foundDefault || firstValid;
      this.connectionFetched = true;
      return this.defaultConnection;
    } catch {
      this.connectionFetched = true;
      return null;
    }
  }

  public getDefaultConnection(): SafeTtsConnection | null {
    return this.defaultConnection;
  }

  public stop(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.cleanupCurrentAudio();

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
      this.currentUtterance = null;
    }
  }

  private cleanupCurrentAudio(): void {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.removeAttribute("src");
        this.currentAudio.load();
      } catch {}
      this.currentAudio = null;
    }
    if (this.currentObjectUrl) {
      try {
        URL.revokeObjectURL(this.currentObjectUrl);
      } catch {}
      this.currentObjectUrl = null;
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

  private async synthesizeWithHost(
    text: string,
    conn: SafeTtsConnection,
    signal: AbortSignal
  ): Promise<Blob> {
    const payload: Record<string, unknown> = {
      connectionId: conn.id,
      text,
      outputFormat: "mp3",
    };
    if (conn.voice) {
      payload.voice = conn.voice;
    }

    const res = await fetch("/api/v1/tts/synthesize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
      signal,
    });

    if (!res.ok) {
      throw new Error(`Host TTS synthesize error: HTTP ${res.status}`);
    }

    const blob = await res.blob();
    if (blob.size === 0) {
      throw new Error("Host TTS returned empty audio");
    }
    return blob;
  }

  public async speak(text: string, speaker: string, onEnd?: () => void): Promise<void> {
    if (!this.enabled || typeof window === "undefined") {
      onEnd?.();
      return;
    }

    this.stop();

    const cleaned = this.cleanDialogueText(text);
    if (!cleaned) {
      onEnd?.();
      return;
    }

    // 1. Try host default TTS connection
    const conn = await this.resolveDefaultConnection();
    if (conn) {
      this.abortController = new AbortController();
      const signal = this.abortController.signal;

      try {
        const blob = await this.synthesizeWithHost(cleaned, conn, signal);
        if (signal.aborted) return;

        if (typeof Audio !== "undefined") {
          const url = URL.createObjectURL(blob);
          this.currentObjectUrl = url;

          const audio = new Audio(url);
          this.currentAudio = audio;

          let settled = false;
          const finish = () => {
            if (settled) return;
            settled = true;
            this.cleanupCurrentAudio();
            onEnd?.();
          };

          audio.onended = finish;
          audio.onerror = (e) => {
            console.warn("[LumiVN TTS] Host audio playback failed, falling back to Web Speech:", e);
            this.cleanupCurrentAudio();
            this.speakWithWebSpeech(cleaned, speaker, onEnd);
          };

          await audio.play();
          return;
        }
      } catch (err: any) {
        if (signal.aborted) return;
        console.warn("[LumiVN TTS] Host TTS synthesis error, falling back to Web Speech:", err);
      }
    }

    // 2. Fallback: Browser Web Speech API
    this.speakWithWebSpeech(cleaned, speaker, onEnd);
  }

  private speakWithWebSpeech(cleaned: string, speaker: string, onEnd?: () => void): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onEnd?.();
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(cleaned);
      this.currentUtterance = utterance;

      const hash = speaker.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const isNarrator = !speaker || speaker.toLowerCase() === "narrator";

      if (isNarrator) {
        utterance.pitch = 0.95;
        utterance.rate = 1.0;
      } else {
        utterance.pitch = 0.85 + (hash % 9) * 0.05;
        utterance.rate = 1.0 + (hash % 3) * 0.05;
      }

      if (this.voices.length > 0) {
        const enVoices = this.voices.filter((v) => v.lang.startsWith("en"));
        const pool = enVoices.length > 0 ? enVoices : this.voices;
        utterance.voice = pool[hash % pool.length] || null;
      }

      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        this.currentUtterance = null;
        onEnd?.();
      };

      utterance.onend = finish;
      utterance.onerror = finish;

      const maxDuration = Math.max(2000, cleaned.length * 100);
      window.setTimeout(() => {
        if (!settled) finish();
      }, maxDuration);

      window.speechSynthesis.speak(utterance);
    } catch {
      onEnd?.();
    }
  }
}
