import type { SpindleFrontendContext, SpindleDrawerTabHandle } from "lumiverse-spindle-types";

export interface DiagnosticData {
  timestamp: string;
  chatId: string;
  messageId?: string;
  hasLedger: boolean;
  placeId: string;
  participants: string[];
  bgUrl: string;
}

export interface DiagnosticsHandle {
  tab: SpindleDrawerTabHandle;
  pushLog: (msg: string, level?: "info" | "warn" | "error" | "action") => void;
  updateDiagnostic: (data: DiagnosticData) => void;
  setLatestLedger: (ledger: unknown) => void;
  setLatestManifest: (manifest: unknown) => void;
}

export function registerDiagnosticsDrawer(
  ctx: SpindleFrontendContext,
  onLaunchStage: () => void
): DiagnosticsHandle | null {
  if (!ctx.ui?.registerDrawerTab) return null;

  const tab = ctx.ui.registerDrawerTab({
    id: "vn_diagnostics",
    title: "LumiVN Controls & Diagnostics",
    shortName: "VN Diag",
    description: "Launch visual novel stage, inspect Ledger parsing, and copy engine logs",
    keywords: ["vn", "diagnostics", "ledger", "visual novel", "stage", "logs"],
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>`,
  });

  const root = tab.root;
  let rawLogHistory: string[] = [];
  let latestLedgerData: unknown = null;
  let latestManifestData: unknown = null;

  root.innerHTML = `
    <div style="padding: 16px; font-family: system-ui, -apple-system, sans-serif; color: #f1f5f9; height: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; box-sizing: border-box;">
      <div style="background: linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.25)); border: 1px solid rgba(129,140,248,0.5); border-radius: 12px; padding: 14px; text-align: center;">
        <h3 style="margin: 0 0 4px 0; font-size: 15px; color: #fff;">LumiVN Control Center</h3>
        <p style="font-size: 11px; color: #94a3b8; margin: 0 0 10px 0;">Switch between standard chat and the visual novel stage.</p>
        <button id="vn-launch-btn" style="width: 100%; padding: 9px 16px; background: #6366f1; border: none; border-radius: 8px; color: #fff; font-weight: 700; font-size: 13px; cursor: pointer;">
          ▶ Open Visual Novel Stage
        </button>
      </div>

      <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid #334155; border-radius: 10px; padding: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h4 style="margin: 0; font-size: 11px; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px;">Turn Telemetry</h4>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button id="vn-copy-all-drawer-btn" style="padding: 2px 8px; font-size: 10px; background: #6366f1; border: none; border-radius: 4px; color: #fff; font-weight: 700; cursor: pointer;">
              📋 Copy All
            </button>
            <button id="vn-copy-state-btn" style="padding: 2px 8px; font-size: 10px; background: #1e293b; border: 1px solid #475569; border-radius: 4px; color: #cbd5e1; cursor: pointer;">
              📋 Copy State JSON
            </button>
            <button id="vn-copy-manifest-btn" style="padding: 2px 8px; font-size: 10px; background: #1e293b; border: 1px solid #475569; border-radius: 4px; color: #cbd5e1; cursor: pointer;">
              📋 Copy Asset Manifest
            </button>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Ledger Block:</span>
            <span id="vn-diag-ledger" style="font-weight: 600; color: #94a3b8;">Pending turn</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Place ID:</span>
            <span id="vn-diag-place" style="font-weight: 600; color: #e2e8f0;">—</span>
          </div>
          <div>
            <span style="color: #94a3b8;">Background URL:</span>
            <div id="vn-diag-bg" style="font-size: 11px; color: #38bdf8; word-break: break-all; margin-top: 1px;">—</div>
          </div>
          <div>
            <span style="color: #94a3b8;">Cast & Slots:</span>
            <div id="vn-diag-cast" style="font-size: 11px; color: #e2e8f0; margin-top: 1px;">None</div>
          </div>
        </div>
      </div>

      <div style="flex: 1; display: flex; flex-direction: column; background: #020617; border: 1px solid #1e293b; border-radius: 10px; padding: 10px; min-height: 220px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <h4 style="margin: 0; font-size: 11px; color: #94a3b8; text-transform: uppercase;">Diagnostic Console</h4>
          <div style="display: flex; gap: 6px;">
            <button id="vn-copy-logs-btn" style="padding: 2px 8px; font-size: 10px; background: #334155; border: 1px solid #475569; border-radius: 4px; color: #f8fafc; font-weight: 600; cursor: pointer;">
              📋 Copy Logs
            </button>
            <button id="vn-clear-log-btn" style="padding: 2px 6px; font-size: 10px; background: #1e293b; border: 1px solid #334155; border-radius: 4px; color: #94a3b8; cursor: pointer;">
              Clear
            </button>
          </div>
        </div>
        <div id="vn-log-stream" style="flex: 1; overflow-y: auto; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; color: #cbd5e1; display: flex; flex-direction: column; gap: 4px; user-select: text;">
          <div style="color: #64748b;">[System] Diagnostic stream initialized.</div>
        </div>
      </div>
    </div>
  `;

  root.querySelector("#vn-launch-btn")?.addEventListener("click", onLaunchStage);

  const logStream = root.querySelector("#vn-log-stream") as HTMLElement;
  const copyAllDrawerBtn = root.querySelector("#vn-copy-all-drawer-btn") as HTMLButtonElement;
  const copyLogsBtn = root.querySelector("#vn-copy-logs-btn") as HTMLButtonElement;
  const copyStateBtn = root.querySelector("#vn-copy-state-btn") as HTMLButtonElement;
  const copyManifestBtn = root.querySelector("#vn-copy-manifest-btn") as HTMLButtonElement;

  root.querySelector("#vn-clear-log-btn")?.addEventListener("click", () => {
    if (logStream) logStream.innerHTML = "";
    rawLogHistory = [];
  });

  copyAllDrawerBtn?.addEventListener("click", async () => {
    try {
      const bundle = {
        timestamp: new Date().toISOString(),
        ledger: latestLedgerData,
        manifest: latestManifestData,
        logs: rawLogHistory,
      };
      await navigator.clipboard.writeText(JSON.stringify(bundle, null, 2));
      copyAllDrawerBtn.textContent = "✓ Copied!";
      setTimeout(() => (copyAllDrawerBtn.textContent = "📋 Copy All"), 1500);
    } catch (e) {
      pushLog(`Failed to copy all: ${String(e)}`, "error");
    }
  });

  const pushLog = (msg: string, level: "info" | "warn" | "error" | "action" = "info") => {
    const time = new Date().toLocaleTimeString();
    const entry = `[${time}] [${level.toUpperCase()}] ${msg}`;
    rawLogHistory.push(entry);

    if (!logStream) return;
    const item = document.createElement("div");
    item.style.wordBreak = "break-word";
    item.style.color =
      level === "error"
        ? "#f43f5e"
        : level === "warn"
        ? "#f59e0b"
        : level === "action"
        ? "#38bdf8"
        : "#cbd5e1";
    item.textContent = entry;
    logStream.appendChild(item);
    logStream.scrollTop = logStream.scrollHeight;
  };

  copyLogsBtn?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(rawLogHistory.join("\n"));
      copyLogsBtn.textContent = "✓ Copied!";
      setTimeout(() => (copyLogsBtn.textContent = "📋 Copy Logs"), 1500);
    } catch (e) {
      pushLog(`Clipboard write failed: ${String(e)}`, "error");
    }
  });

  copyStateBtn?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(latestLedgerData || {}, null, 2));
      copyStateBtn.textContent = "✓ Copied!";
      setTimeout(() => (copyStateBtn.textContent = "📋 Copy State JSON"), 1500);
    } catch (e) {
      pushLog(`Failed to copy state: ${String(e)}`, "error");
    }
  });

  copyManifestBtn?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(latestManifestData || {}, null, 2));
      copyManifestBtn.textContent = "✓ Copied!";
      setTimeout(() => (copyManifestBtn.textContent = "📋 Copy Asset Manifest"), 1500);
    } catch (e) {
      pushLog(`Failed to copy manifest: ${String(e)}`, "error");
    }
  });

  const updateDiagnostic = (data: DiagnosticData) => {
    const ledgerEl = root.querySelector("#vn-diag-ledger") as HTMLElement;
    const placeEl = root.querySelector("#vn-diag-place") as HTMLElement;
    const castEl = root.querySelector("#vn-diag-cast") as HTMLElement;
    const bgEl = root.querySelector("#vn-diag-bg") as HTMLElement;

    if (ledgerEl) {
      ledgerEl.textContent = data.hasLedger ? "DETECTED (Parsed)" : "NOT FOUND (Prose-only)";
      ledgerEl.style.color = data.hasLedger ? "#10b981" : "#f59e0b";
    }
    if (placeEl) placeEl.textContent = data.placeId || "default";
    if (castEl) castEl.textContent = data.participants.length > 0 ? data.participants.join(", ") : "None";
    if (bgEl) {
      bgEl.textContent = data.bgUrl.startsWith("data:") ? "[Fallback SVG Data URI]" : data.bgUrl;
    }

    pushLog(`Turn parsed: place='${data.placeId}', bg='${data.bgUrl.slice(0, 35)}...', cast=[${data.participants.join(", ")}]`, "info");
  };

  const setLatestLedger = (ledger: unknown) => {
    latestLedgerData = ledger;
  };

  const setLatestManifest = (manifest: unknown) => {
    latestManifestData = manifest;
  };

  // Request initial manifest from backend
  ctx.sendToBackend({ type: "vn_get_manifest" });

  return { tab, pushLog, updateDiagnostic, setLatestLedger, setLatestManifest };
}
