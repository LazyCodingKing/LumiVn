import type { LedgerData, AssetManifest, DirectorNoteData, DiagnosticData } from "../../shared/types.js";

export interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "action";
  message: string;
}

export type DiagListener = () => void;

class DiagnosticBus {
  private logs: LogEntry[] = [];
  private telemetry: DiagnosticData | null = null;
  private latestDirectorNote: DirectorNoteData | null = null;
  private latestLedger: LedgerData = {};
  private latestManifest: AssetManifest | null = null;
  private listeners: Set<DiagListener> = new Set();
  private maxLogs = 500;

  constructor() {
    this.pushLog("LumiVN Diagnostic Bus initialized.", "info");
  }

  public subscribe(listener: DiagListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {}
    }
  }

  public pushLog(message: string, level: "info" | "warn" | "error" | "action" = "info"): void {
    const time = new Date().toLocaleTimeString();
    this.logs.push({ timestamp: time, level, message });
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    this.notify();
  }

  public clearLogs(): void {
    this.logs = [];
    this.notify();
  }

  public getLogs(): readonly LogEntry[] {
    return this.logs;
  }

  public setTelemetry(data: DiagnosticData): void {
    this.telemetry = data;
    this.pushLog(
      `Turn telemetry: place='${data.placeId}', bg='${(data.bgUrl || "").slice(0, 32)}...', cast=[${(data.participants || []).join(", ")}]`,
      "info"
    );
    this.notify();
  }

  public getTelemetry(): DiagnosticData | null {
    return this.telemetry;
  }

  public setLedger(ledger: LedgerData): void {
    this.latestLedger = ledger;
    this.notify();
  }

  public getLedger(): LedgerData {
    return this.latestLedger;
  }

  public setManifest(manifest: AssetManifest): void {
    this.latestManifest = manifest;
    this.notify();
  }

  public getManifest(): AssetManifest | null {
    return this.latestManifest;
  }

  public setDirectorNote(note: DirectorNoteData): void {
    this.latestDirectorNote = note;
    this.pushLog(`Director Note updated: [${note.threadLabel}]`, "info");
    this.notify();
  }

  public getDirectorNote(): DirectorNoteData | null {
    return this.latestDirectorNote;
  }

  /** Formats current ledger into a clean YAML representation */
  public formatLedgerYaml(ledger?: LedgerData): string {
    const data = ledger || this.latestLedger;
    try {
      // Basic YAML serializer for clean Markdown ledger blocks
      const lines: string[] = ["```yaml"];
      lines.push("# My World 1.79 World Ledger");

      if (data.clock) {
        lines.push("clock:");
        if (data.clock.t) lines.push(`  t: "${data.clock.t}"`);
        if (data.clock.phase) lines.push(`  phase: "${data.clock.phase}"`);
        if (data.clock.date) lines.push(`  date: "${data.clock.date}"`);
        if (data.clock.location) lines.push(`  location: "${data.clock.location}"`);
        if (data.clock.region) lines.push(`  region: "${data.clock.region}"`);
        if (data.clock.country) lines.push(`  country: "${data.clock.country}"`);
      }

      if (data.scene) {
        lines.push("scene:");
        if (data.scene.place) lines.push(`  place: "${data.scene.place}"`);
        if (data.scene.participants && data.scene.participants.length > 0) {
          lines.push(`  participants: [${data.scene.participants.map((p) => `"${p}"`).join(", ")}]`);
        }
      }

      if (data.world && Object.keys(data.world).length > 0) {
        lines.push("world:");
        for (const [wk, wv] of Object.entries(data.world)) {
          if (wv !== undefined && wv !== null) {
            lines.push(`  ${wk}: ${typeof wv === "object" ? JSON.stringify(wv) : typeof wv === "string" ? `"${wv}"` : wv}`);
          }
        }
      }

      if (data.places && Object.keys(data.places).length > 0) {
        lines.push("places:");
        for (const [pk, pv] of Object.entries(data.places)) {
          lines.push(`  "${pk}":`);
          if (pv.function) lines.push(`    function: "${pv.function}"`);
          if (pv.norm) lines.push(`    norm: "${pv.norm}"`);
          if (pv.resources && pv.resources.length > 0) {
            lines.push(`    resources: [${pv.resources.map((r: any) => `"${r}"`).join(", ")}]`);
          }
          if (pv.routes && pv.routes.length > 0) {
            lines.push(`    routes: ${JSON.stringify(pv.routes)}`);
          }
        }
      }

      if (data.roster && data.roster.length > 0) {
        lines.push("roster:");
        for (const r of data.roster) {
          lines.push(`  - id: "${r.id}"`);
          if (r.name) lines.push(`    name: "${r.name}"`);
          if (r.loc) lines.push(`    loc: "${r.loc}"`);
          if (r.status) lines.push(`    status: "${r.status}"`);
        }
      }

      if (data.actors && Object.keys(data.actors).length > 0) {
        lines.push("actors:");
        for (const [id, doc] of Object.entries(data.actors)) {
          lines.push(`  ${id}:`);
          if (doc.name) lines.push(`    name: "${doc.name}"`);
          if (doc.money) {
            lines.push(`    money: { in_hand: ${doc.money.in_hand ?? 0}, in_bank: ${doc.money.in_bank ?? 0}, currency: "${doc.money.currency || "$"}" }`);
          }
          if (doc.combat && Object.keys(doc.combat).length > 0) {
            lines.push("    combat:");
            for (const [ck, cv] of Object.entries(doc.combat)) {
              lines.push(`      ${ck}: ${typeof cv === "string" ? `"${cv}"` : cv}`);
            }
          }
          if (doc.stats && Object.keys(doc.stats).length > 0) {
            lines.push("    stats:");
            for (const [sk, sv] of Object.entries(doc.stats)) {
              lines.push(`      ${sk}: ${sv}`);
            }
          }
          if (doc.passions && Object.keys(doc.passions).length > 0) {
            lines.push("    passions:");
            for (const [pk, pv] of Object.entries(doc.passions)) {
              lines.push(`      ${pk}: ${pv}`);
            }
          }
          if (doc.outfit) {
            lines.push("    outfit:");
            if (doc.outfit.top) lines.push(`      top: "${doc.outfit.top}"`);
            if (doc.outfit.bottom) lines.push(`      bottom: "${doc.outfit.bottom}"`);
            if (doc.outfit.underwear_top) lines.push(`      underwear_top: "${doc.outfit.underwear_top}"`);
            if (doc.outfit.underwear_bottom) lines.push(`      underwear_bottom: "${doc.outfit.underwear_bottom}"`);
            if (doc.outfit.shoes) lines.push(`      shoes: "${doc.outfit.shoes}"`);
          }
          if (doc.inventory) {
            lines.push("    inventory:");
            if (doc.inventory.in_hand) {
              lines.push(`      in_hand: { L: "${doc.inventory.in_hand.L || "Empty"}", R: "${doc.inventory.in_hand.R || "Empty"}" }`);
            }
            if (doc.inventory.carried && doc.inventory.carried.length > 0) {
              lines.push(`      carried: [${doc.inventory.carried.map((c: any) => `"${c}"`).join(", ")}]`);
            }
            if (doc.inventory.room && doc.inventory.room.length > 0) {
              lines.push(`      room: [${doc.inventory.room.map((r: any) => `"${r}"`).join(", ")}]`);
            }
            if (doc.inventory.room_location) {
              lines.push(`      room_location: "${doc.inventory.room_location}"`);
            }
          }
        }
      }

      lines.push("```");
      return lines.join("\n");
    } catch {
      return JSON.stringify(data, null, 2);
    }
  }

  /** Bundles all diagnostics, ledger, manifest, and logs into a single export JSON */
  public exportAllBundle(): string {
    const bundle = {
      timestamp: new Date().toISOString(),
      telemetry: this.telemetry,
      directorNote: this.latestDirectorNote,
      clock: this.latestLedger.clock,
      scene: this.latestLedger.scene,
      ledger: this.latestLedger,
      manifest: this.latestManifest,
      logs: this.logs,
    };
    return JSON.stringify(bundle, null, 2);
  }
}

export const diagBus = new DiagnosticBus();
