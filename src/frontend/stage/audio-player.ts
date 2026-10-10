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

  private currentBgmTrack: string | null = null;
  private customBgmMap: Record<string, string> = {};

  public static readonly DEFAULT_MOOD_BGM_MAP: Record<string, string> = {
    happy: "daily_happy",
    joyful: "daily_happy",
    cheerful: "daily_happy",
    romantic: "romantic_piano",
    love: "romantic_piano",
    tender: "romantic_piano",
    warm: "warm_acoustic",
    tense: "suspense_tension",
    danger: "combat_intense",
    combat: "combat_intense",
    action: "combat_intense",
    sad: "melancholy_strings",
    melancholy: "melancholy_strings",
    grief: "melancholy_strings",
    mysterious: "mystery_ambient",
    mystery: "mystery_ambient",
    eerie: "mystery_ambient",
    peaceful: "calm_ambient",
    calm: "calm_ambient",
    daily: "daily_ambient",
    ambient: "daily_ambient",
  };

  public extractBgmTag(text: string): string | null {
    if (!text) return null;
    const match = text.match(/(?:🎵\s*Music|BGM|\[Music|【Music|Play music)[：:]\s*([^\n\r\]】]+)/i);
    return match ? match[1]!.trim() : null;
  }

  public setCustomBgmMap(map: Record<string, string>): void {
    this.customBgmMap = { ...map };
  }

  public getCustomBgmMap(): Record<string, string> {
    return { ...this.customBgmMap };
  }

  public getCurrentBgm(): string | null {
    return this.currentBgmTrack;
  }

  private isDucked = false;

  public duckBgm(factor = 0.35): void {
    if (this.isDucked || !this.bgmAudio) return;
    this.isDucked = true;
    this.bgmAudio.volume = this.bgmVolume * Math.max(0.05, Math.min(1, factor));
  }

  public unduckBgm(): void {
    if (!this.isDucked) return;
    this.isDucked = false;
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.bgmVolume;
    }
  }

  public setBgmVolume(volume: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.isDucked ? this.bgmVolume * 0.35 : this.bgmVolume;
    }
  }

  public getBgmVolume(): number {
    return this.bgmVolume;
  }

  public handleDynamicBgm(
    text: string,
    mood?: string,
    place?: string,
    manifestBgm?: Record<string, string>
  ): string | null {
    // 1. Explicit tag in prose
    const tagged = this.extractBgmTag(text);
    if (tagged) {
      const url = manifestBgm?.[tagged] || this.customBgmMap[tagged] || tagged;
      this.playBgm(url, tagged);
      return tagged;
    }

    // 2. Explicit place BGM
    if (place) {
      const cleanPlace = place.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      if (manifestBgm?.[cleanPlace] || this.customBgmMap[cleanPlace]) {
        const url = manifestBgm?.[cleanPlace] || this.customBgmMap[cleanPlace]!;
        this.playBgm(url, cleanPlace);
        return cleanPlace;
      }
    }

    // 3. Dominant mood BGM
    if (mood) {
      const normMood = mood.toLowerCase().trim();
      const mappedTrack = VnAudioEngine.DEFAULT_MOOD_BGM_MAP[normMood];
      if (mappedTrack) {
        const url = manifestBgm?.[mappedTrack] || this.customBgmMap[mappedTrack] || mappedTrack;
        this.playBgm(url, mappedTrack);
        return mappedTrack;
      }
    }

    return null;
  }

  public playBgm(url: string, trackName?: string): void {
    if (!url) {
      this.stopBgm();
      return;
    }

    const trackId = trackName || url;
    if (this.currentBgmTrack === trackId && this.bgmAudio && !this.bgmAudio.paused) {
      return;
    }

    this.stopBgm();
    this.currentBgmTrack = trackId;

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
    this.currentBgmTrack = null;
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

