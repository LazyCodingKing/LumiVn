export class VnTtsEngine {
  private enabled = false;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;

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
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  public stop(): void {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  public speak(text: string, speaker: string, onEnd?: () => void): void {
    if (!this.enabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      onEnd?.();
      return;
    }

    this.stop();

    // Clean text of markdown, bracket tags, and formatting
    const cleaned = text
      .replace(/\[\[.*?\]\]/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/[\*_~`#]/g, "")
      .replace(/["“”]/g, "")
      .trim();

    if (!cleaned) {
      onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleaned);
    this.currentUtterance = utterance;

    // Pick consistent pitch and rate based on speaker name
    const hash = speaker.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const isNarrator = !speaker || speaker.toLowerCase() === "narrator";

    if (isNarrator) {
      utterance.pitch = 0.95;
      utterance.rate = 1.0;
    } else {
      // Distinct pitch variation per character: 0.85 to 1.25
      utterance.pitch = 0.85 + (hash % 9) * 0.05;
      utterance.rate = 1.0 + (hash % 3) * 0.05;
    }

    // Try to pick an appropriate language voice
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

    // Safety timeout in case speech synthesis hangs on certain browsers
    const maxDuration = Math.max(2000, cleaned.length * 100);
    window.setTimeout(() => {
      if (!settled) finish();
    }, maxDuration);

    window.speechSynthesis.speak(utterance);
  }
}
