import type { LedgerData, AssetManifest } from "../../shared/types.js";
import { diagBus, type LogEntry } from "../utils/diag-bus.js";

export class DiagnosticsTab {
  public root: HTMLElement;
  private currentLedger: LedgerData = {};
  private currentManifest?: AssetManifest;
  private activeFilter: "all" | "info" | "warn" | "error" = "all";
  private unsubscribeBus?: () => void;

  constructor() {
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-diagnostics";
  }

  public render(ledger: LedgerData, manifest?: AssetManifest): void {
    this.currentLedger = ledger;
    this.currentManifest = manifest;
    diagBus.setLedger(ledger);
    if (manifest) diagBus.setManifest(manifest);

    this.root.innerHTML = "";
    this.root.style.cssText = "display: flex; flex-direction: column; gap: 14px; height: 100%; color: #f1f5f9; font-family: system-ui, -apple-system, sans-serif;";

    const telemetry = diagBus.getTelemetry();
    const hasLedger = Boolean(ledger && (ledger.clock || ledger.scene || ledger.actors));
    const deltaStatus = hasLedger ? "accepted" : "idle";

    // 1. Header & Quick Copy Action Bar
    const header = document.createElement("div");
    header.style.cssText = "display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; border-bottom: 1px solid #334155; padding-bottom: 10px;";
    header.innerHTML = `
      <div>
        <h3 style="margin: 0; font-size: 15px; color: #fff; display: flex; align-items: center; gap: 6px;">
          <span>🛠️</span> <span>Engine Diagnostics & Clipboard Export</span>
        </h3>
        <p style="margin: 2px 0 0 0; font-size: 11px; color: #94a3b8;">
          Inspect delta synchronization, export living world ledgers, and view engine logs.
        </p>
      </div>
      <div style="display: flex; gap: 6px; flex-wrap: wrap;">
        <button id="vn-copy-all-btn" class="vn-btn vn-btn-sm" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; color: #fff; font-weight: 700; border-radius: 6px; padding: 6px 12px; cursor: pointer; font-size: 11px; box-shadow: 0 2px 8px rgba(99,102,241,0.4);">
          📋 Copy All
        </button>
        <button id="vn-copy-yaml-btn" class="vn-btn vn-btn-sm" style="background: #1e293b; border: 1px solid #475569; color: #38bdf8; font-weight: 600; border-radius: 6px; padding: 6px 10px; cursor: pointer; font-size: 11px;">
          📄 Copy Ledger (YAML)
        </button>
        <button id="vn-copy-director-btn" class="vn-btn vn-btn-sm" style="background: #1e293b; border: 1px solid #8b5cf6; color: #c084fc; font-weight: 600; border-radius: 6px; padding: 6px 10px; cursor: pointer; font-size: 11px;">
          🎬 Copy Director Note
        </button>
        <button id="vn-copy-json-btn" class="vn-btn vn-btn-sm" style="background: #1e293b; border: 1px solid #475569; color: #cbd5e1; border-radius: 6px; padding: 6px 10px; cursor: pointer; font-size: 11px;">
          📦 Copy State (JSON)
        </button>
        <button id="vn-copy-diag-btn" class="vn-btn vn-btn-sm" style="background: #1e293b; border: 1px solid #475569; color: #cbd5e1; border-radius: 6px; padding: 6px 10px; cursor: pointer; font-size: 11px;">
          📜 Copy Logs
        </button>
      </div>
    `;
    this.root.appendChild(header);

    // Copy Button Handlers
    const showToast = (btn: HTMLButtonElement, label: string) => {
      const orig = btn.textContent;
      btn.textContent = "✓ Copied!";
      btn.style.borderColor = "#10b981";
      setTimeout(() => {
        btn.textContent = orig;
        btn.style.borderColor = "";
      }, 1500);
    };

    header.querySelector("#vn-copy-all-btn")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      await navigator.clipboard.writeText(diagBus.exportAllBundle()).catch(() => undefined);
      showToast(btn, "Copy All");
    });

    header.querySelector("#vn-copy-yaml-btn")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      const yamlStr = diagBus.formatLedgerYaml(this.currentLedger);
      await navigator.clipboard.writeText(yamlStr).catch(() => undefined);
      showToast(btn, "Copy Ledger (YAML)");
    });

    header.querySelector("#vn-copy-director-btn")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      const note = diagBus.getDirectorNote();
      if (note && note.directorNote) {
        const textToCopy = `[${note.threadLabel || "Active Thread"}]\n${note.directorNote}`;
        await navigator.clipboard.writeText(textToCopy).catch(() => undefined);
        showToast(btn, "Copy Director Note");
      } else {
        showToast(btn, "No Note Available");
      }
    });

    header.querySelector("#vn-copy-json-btn")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      await navigator.clipboard.writeText(JSON.stringify(this.currentLedger, null, 2)).catch(() => undefined);
      showToast(btn, "Copy State (JSON)");
    });

    header.querySelector("#vn-copy-diag-btn")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      const logLines = diagBus.getLogs().map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join("\n");
      await navigator.clipboard.writeText(logLines).catch(() => undefined);
      showToast(btn, "Copy Logs");
    });

    // 2. Middle Row: Delta Telemetry Card + Actors Presence Breakdown (Living World style)
    const midRow = document.createElement("div");
    midRow.style.cssText = "display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;";

    const participants = ledger.scene?.participants || [];
    const actorEntries = Object.entries(ledger.actors || {});
    const rosterEntries = ledger.roster || [];

    midRow.innerHTML = `
      <!-- Delta & Telemetry Status Card -->
      <div style="background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 6px;">
          <strong style="color: #38bdf8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Delta Telemetry Status</strong>
          <span style="font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; ${deltaStatus === "accepted" ? "background: rgba(16,185,129,0.2); color: #34d399; border: 1px solid #10b981;" : "background: rgba(245,158,11,0.2); color: #fbbf24; border: 1px solid #f59e0b;"}">
            ${deltaStatus === "accepted" ? "● Delta Accepted" : "○ Waiting Delta"}
          </span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Clock Anchor:</span>
            <span style="font-weight: 600; color: #f8fafc;">${ledger.clock?.t || "Unknown"} (${ledger.clock?.phase || "Day"})${ledger.clock?.date ? ` • ${ledger.clock.date}` : ""}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Place Scoping:</span>
            <span style="font-weight: 600; color: #38bdf8;">${ledger.scene?.place || "default"}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Region / Country:</span>
            <span style="color: #cbd5e1;">${[ledger.clock?.location, ledger.clock?.region, ledger.clock?.country].filter(Boolean).join(", ") || "Nerima, Tokyo"}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Background Rendered:</span>
            <span style="color: #94a3b8; font-family: monospace; font-size: 10px;">${(telemetry?.bgUrl || "Default").slice(0, 30)}...</span>
          </div>
        </div>
      </div>

      <!-- Living Roster & Epistemics Presence Card -->
      <div style="background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 6px;">
          <strong style="color: #a78bfa; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Epistemic Presence Breakdown</strong>
          <span style="font-size: 10px; color: #94a3b8;">${actorEntries.length} dossiers loaded</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px;">
          <div>
            <span style="color: #38bdf8; font-weight: 600;">Spotlight (${participants.length}):</span>
            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px;">
              ${participants.length > 0
                ? participants.map((p) => `<span style="background: rgba(56,189,248,0.2); color: #7dd3fc; border: 1px solid #0284c7; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">👤 ${p}</span>`).join("")
                : '<span style="color: #64748b; font-size: 10px;">No spotlight participants</span>'
              }
            </div>
          </div>
          <div>
            <span style="color: #94a3b8;">Living Roster (${rosterEntries.length}):</span>
            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px;">
              ${rosterEntries.slice(0, 6).map((r) => `<span style="background: #1e293b; border: 1px solid #334155; padding: 1px 6px; border-radius: 4px; font-size: 10px; color: #cbd5e1;">${r.name || r.id} (${r.loc || "?"})</span>`).join("")}
              ${rosterEntries.length > 6 ? `<span style="color: #64748b; font-size: 10px;">+${rosterEntries.length - 6} more</span>` : ""}
            </div>
          </div>
        </div>
      </div>
    `;
    this.root.appendChild(midRow);

    // Dedicated Director Note Card
    const directorNote = diagBus.getDirectorNote();
    const directorCard = document.createElement("div");
    directorCard.style.cssText = "background: #0f172a; border: 1px solid #6366f1; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 6px;";
    directorCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 6px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 14px;">🎬</span>
          <strong style="color: #a78bfa; font-size: 12px; text-transform: uppercase;">Active Director Guidance</strong>
        </div>
        <span id="vn-director-thread-label" style="font-size: 10px; background: rgba(139,92,246,0.2); border: 1px solid #8b5cf6; color: #c084fc; padding: 2px 8px; border-radius: 4px; font-weight: 600;">
          ${directorNote?.threadLabel || "General Steering"}
        </span>
      </div>
      <div id="vn-director-note-body" style="font-size: 11px; line-height: 1.5; color: #cbd5e1; max-height: 120px; overflow-y: auto; white-space: pre-wrap; font-style: italic;">
        ${directorNote?.directorNote || "No active turn steering notes recorded."}
      </div>
    `;
    this.root.appendChild(directorCard);

    // 3. Bottom Row: Diagnostic Console & Raw Ledger Viewer Split
    const bottomSplit = document.createElement("div");
    bottomSplit.style.cssText = "flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; min-height: 220px; overflow: hidden;";

    // Left Pane: Diagnostic Log Console
    const consoleBox = document.createElement("div");
    consoleBox.style.cssText = "background: #020617; border: 1px solid #1e293b; border-radius: 10px; padding: 10px; display: flex; flex-direction: column; gap: 8px;";
    consoleBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Engine Diagnostic Log</span>
        <div style="display: flex; gap: 4px; align-items: center;">
          <button id="vn-filter-all" style="padding: 2px 6px; font-size: 10px; border-radius: 4px; border: 1px solid #334155; background: ${this.activeFilter === "all" ? "#4f46e5" : "#1e293b"}; color: #fff; cursor: pointer;">All</button>
          <button id="vn-filter-info" style="padding: 2px 6px; font-size: 10px; border-radius: 4px; border: 1px solid #334155; background: ${this.activeFilter === "info" ? "#4f46e5" : "#1e293b"}; color: #fff; cursor: pointer;">Info</button>
          <button id="vn-filter-warn" style="padding: 2px 6px; font-size: 10px; border-radius: 4px; border: 1px solid #334155; background: ${this.activeFilter === "warn" ? "#4f46e5" : "#1e293b"}; color: #fff; cursor: pointer;">Warn</button>
          <button id="vn-filter-error" style="padding: 2px 6px; font-size: 10px; border-radius: 4px; border: 1px solid #334155; background: ${this.activeFilter === "error" ? "#4f46e5" : "#1e293b"}; color: #fff; cursor: pointer;">Err</button>
          <button id="vn-clear-logs" style="padding: 2px 6px; font-size: 10px; border-radius: 4px; border: 1px solid #334155; background: #1e293b; color: #94a3b8; cursor: pointer; margin-left: 4px;">Clear</button>
        </div>
      </div>
      <div id="vn-diag-stream" style="flex: 1; overflow-y: auto; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10px; color: #cbd5e1; display: flex; flex-direction: column; gap: 3px; user-select: text; max-height: 200px;">
      </div>
    `;

    // Right Pane: Raw Ledger / Markdown Inspector
    const ledgerBox = document.createElement("div");
    ledgerBox.style.cssText = "background: #020617; border: 1px solid #1e293b; border-radius: 10px; padding: 10px; display: flex; flex-direction: column; gap: 8px;";
    ledgerBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase;">Active World Ledger Viewer</span>
        <button id="vn-copy-editor-btn" style="padding: 2px 8px; font-size: 10px; background: #1e293b; border: 1px solid #475569; border-radius: 4px; color: #38bdf8; font-weight: 600; cursor: pointer;">
          📋 Copy Block
        </button>
      </div>
      <textarea id="vn-ledger-editor" readonly style="flex: 1; background: #090d16; border: 1px solid #334155; border-radius: 6px; color: #a5b4fc; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10px; padding: 8px; resize: none; outline: none; user-select: text; white-space: pre; max-height: 200px;">${diagBus.formatLedgerYaml(this.currentLedger)}</textarea>
    `;

    bottomSplit.appendChild(consoleBox);
    bottomSplit.appendChild(ledgerBox);
    this.root.appendChild(bottomSplit);

    // Setup filter listeners
    const stream = consoleBox.querySelector("#vn-diag-stream") as HTMLElement;
    const renderLogs = () => {
      if (!stream) return;
      stream.innerHTML = "";
      const logs = diagBus.getLogs();
      const filtered = this.activeFilter === "all" ? logs : logs.filter((l) => l.level === this.activeFilter);
      if (filtered.length === 0) {
        stream.innerHTML = '<div style="color: #64748b; font-style: italic;">No logs for this filter.</div>';
        return;
      }
      for (const entry of filtered) {
        const item = document.createElement("div");
        item.style.wordBreak = "break-word";
        item.style.color =
          entry.level === "error"
            ? "#f43f5e"
            : entry.level === "warn"
            ? "#f59e0b"
            : entry.level === "action"
            ? "#38bdf8"
            : "#cbd5e1";
        item.textContent = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
        stream.appendChild(item);
      }
      stream.scrollTop = stream.scrollHeight;
    };

    renderLogs();

    consoleBox.querySelector("#vn-filter-all")?.addEventListener("click", () => { this.activeFilter = "all"; this.render(this.currentLedger, this.currentManifest); });
    consoleBox.querySelector("#vn-filter-info")?.addEventListener("click", () => { this.activeFilter = "info"; this.render(this.currentLedger, this.currentManifest); });
    consoleBox.querySelector("#vn-filter-warn")?.addEventListener("click", () => { this.activeFilter = "warn"; this.render(this.currentLedger, this.currentManifest); });
    consoleBox.querySelector("#vn-filter-error")?.addEventListener("click", () => { this.activeFilter = "error"; this.render(this.currentLedger, this.currentManifest); });
    consoleBox.querySelector("#vn-clear-logs")?.addEventListener("click", () => { diagBus.clearLogs(); renderLogs(); });

    ledgerBox.querySelector("#vn-copy-editor-btn")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      const textarea = ledgerBox.querySelector("#vn-ledger-editor") as HTMLTextAreaElement;
      if (textarea) {
        await navigator.clipboard.writeText(textarea.value).catch(() => undefined);
        showToast(btn, "Copy Block");
      }
    });

    // Subscribe to bus updates
    const updateDirectorCard = () => {
      const note = diagBus.getDirectorNote();
      const labelEl = directorCard.querySelector("#vn-director-thread-label");
      const bodyEl = directorCard.querySelector("#vn-director-note-body");
      if (labelEl) labelEl.textContent = note?.threadLabel || "General Steering";
      if (bodyEl) bodyEl.textContent = note?.directorNote || "No active turn steering notes recorded.";
    };

    if (this.unsubscribeBus) this.unsubscribeBus();
    this.unsubscribeBus = diagBus.subscribe(() => {
      renderLogs();
      updateDirectorCard();
    });
  }
}
