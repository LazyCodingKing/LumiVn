import type { LedgerData, AssetManifest } from "../../shared/types.js";
import type { DiagnosticData } from "../studio/diagnostics-drawer.js";

export interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "action";
  message: string;
}

export type DiagListener = () => void;

class DiagnosticBus {
  private logs: LogEntry[] = [];
  private telemetry: DiagnosticData | null = null;
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
          if (doc.outfit) {
            lines.push("    outfit:");
            if (doc.outfit.top) lines.push(`      top: "${doc.outfit.top}"`);
            if (doc.outfit.bottom) lines.push(`      bottom: "${doc.outfit.bottom}"`);
            if (doc.outfit.underwear_top) lines.push(`      underwear_top: "${doc.outfit.underwear_top}"`);
            if (doc.outfit.underwear_bottom) lines.push(`      underwear_bottom: "${doc.outfit.underwear_bottom}"`);
            if (doc.outfit.shoes) lines.push(`      shoes: "${doc.outfit.shoes}"`);
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
