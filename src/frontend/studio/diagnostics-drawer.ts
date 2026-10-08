import type { SpindleFrontendContext, SpindleDrawerTabHandle } from "lumiverse-spindle-types";
import type { DirectorSettings, DirectorLogEntry } from "../../shared/types.js";

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
  setDirectorSettings: (settings: DirectorSettings) => void;
  pushDirectorLog: (log: DirectorLogEntry) => void;
  setDirectorLogs: (logs: DirectorLogEntry[]) => void;
}

function escapeHtml(text: string): string {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
    description: "Launch visual novel stage, edit Director instructions, and inspect Director impact logs",
    keywords: ["vn", "diagnostics", "ledger", "director", "visual novel", "stage", "logs"],
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>`,
  });

  const root = tab.root;
  let rawLogHistory: string[] = [];
  let rawDirectorLogs: DirectorLogEntry[] = [];
  let latestLedgerData: unknown = null;
  let latestManifestData: unknown = null;
  let activeConsoleTab: "logs" | "director" = "logs";

  root.innerHTML = `
    <div style="padding: 16px; font-family: system-ui, -apple-system, sans-serif; color: #f1f5f9; height: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; box-sizing: border-box;">
      <!-- Control Center -->
      <div style="background: linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.25)); border: 1px solid rgba(129,140,248,0.5); border-radius: 12px; padding: 14px; text-align: center;">
        <h3 style="margin: 0 0 4px 0; font-size: 15px; color: #fff;">LumiVN Control Center</h3>
        <p style="font-size: 11px; color: #94a3b8; margin: 0 0 10px 0;">Switch between standard chat and the visual novel stage.</p>
        <button id="vn-launch-btn" style="width: 100%; padding: 9px 16px; background: #6366f1; border: none; border-radius: 8px; color: #fff; font-weight: 700; font-size: 13px; cursor: pointer; transition: background 0.2s;">
          ▶ Open Visual Novel Stage
        </button>
      </div>

      <!-- Director Prompt Editor Card -->
      <details class="vn-director-card" open style="background: rgba(15, 23, 42, 0.7); border: 1px solid #334155; border-radius: 10px; padding: 12px;">
        <summary style="font-size: 13px; font-weight: 700; color: #a5b4fc; cursor: pointer; display: flex; align-items: center; justify-content: space-between; user-select: none;">
          <span>🎬 Director Instructions & Scene Notes</span>
          <label id="vn-director-toggle-label" style="font-size: 11px; font-weight: 500; color: #cbd5e1; display: inline-flex; align-items: center; gap: 4px; cursor: pointer;" onclick="event.stopPropagation()">
            <input type="checkbox" id="vn-director-enabled" checked style="accent-color: #6366f1; cursor: pointer;" />
            Active
          </label>
        </summary>

        <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 10px;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <label for="vn-director-system" style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase;">
                Director System Directives
              </label>
              <button id="vn-director-expand-btn" type="button" style="padding: 2px 7px; font-size: 10px; background: #1e293b; border: 1px solid #475569; border-radius: 4px; color: #cbd5e1; cursor: pointer;">
                ⤢ Expand Editor
              </button>
            </div>
            <textarea id="vn-director-system" rows="5" placeholder="System directives enforced before generation..." style="width: 100%; box-sizing: border-box; background: #020617; border: 1px solid #334155; border-radius: 6px; color: #f8fafc; font-family: ui-monospace, Menlo, monospace; font-size: 11px; padding: 8px; resize: vertical; line-height: 1.4;"></textarea>
          </div>

          <div>
            <label for="vn-director-notes" style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 4px;">
              Scene Notes & Guidance (Macros: {{user}}, {{char}})
            </label>
            <textarea id="vn-director-notes" rows="3" placeholder="Optional turn guidance (e.g. keep current tension active, reveal hints of secret)..." style="width: 100%; box-sizing: border-box; background: #020617; border: 1px solid #334155; border-radius: 6px; color: #f8fafc; font-family: ui-monospace, Menlo, monospace; font-size: 11px; padding: 8px; resize: vertical; line-height: 1.4;"></textarea>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <button id="vn-director-save-btn" type="button" style="padding: 6px 14px; font-size: 11px; font-weight: 700; background: #6366f1; border: none; border-radius: 6px; color: #fff; cursor: pointer; transition: background 0.2s;">
              Save Directives
            </button>
          </div>
        </div>
      </details>

      <!-- Turn Telemetry Card -->
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

      <!-- Engine & Director Impact Console -->
      <div style="flex: 1; display: flex; flex-direction: column; background: #020617; border: 1px solid #1e293b; border-radius: 10px; padding: 10px; min-height: 250px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="display: flex; gap: 4px;">
            <button id="vn-console-tab-logs" type="button" style="padding: 3px 8px; font-size: 10px; font-weight: 700; background: #334155; border: 1px solid #475569; border-radius: 4px; color: #fff; cursor: pointer;">
              Engine Console
            </button>
            <button id="vn-console-tab-director" type="button" style="padding: 3px 8px; font-size: 10px; font-weight: 600; background: #1e293b; border: 1px solid #334155; border-radius: 4px; color: #94a3b8; cursor: pointer;">
              Director Impact
            </button>
          </div>
          <div style="display: flex; gap: 6px;">
            <button id="vn-copy-logs-btn" style="padding: 2px 8px; font-size: 10px; background: #334155; border: 1px solid #475569; border-radius: 4px; color: #f8fafc; font-weight: 600; cursor: pointer;">
              📋 Copy
            </button>
            <button id="vn-clear-log-btn" style="padding: 2px 6px; font-size: 10px; background: #1e293b; border: 1px solid #334155; border-radius: 4px; color: #94a3b8; cursor: pointer;">
              Clear
            </button>
          </div>
        </div>

        <!-- Stream: Engine Logs -->
        <div id="vn-log-stream" style="flex: 1; overflow-y: auto; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; color: #cbd5e1; display: flex; flex-direction: column; gap: 4px; user-select: text;">
          <div style="color: #64748b;">[System] Diagnostic stream initialized.</div>
        </div>

        <!-- Stream: Director Impact Logs -->
        <div id="vn-director-log-stream" style="flex: 1; overflow-y: auto; font-family: system-ui, -apple-system, sans-serif; font-size: 11px; color: #cbd5e1; display: none; flex-direction: column; gap: 8px; user-select: text;">
          <div id="vn-director-empty-notice" style="color: #64748b; font-style: italic;">No Director impact turns recorded yet.</div>
        </div>
      </div>
    </div>
  `;

  root.querySelector("#vn-launch-btn")?.addEventListener("click", onLaunchStage);

  const logStream = root.querySelector("#vn-log-stream") as HTMLElement;
  const directorStream = root.querySelector("#vn-director-log-stream") as HTMLElement;
  const directorEmptyNotice = root.querySelector("#vn-director-empty-notice") as HTMLElement;

  const tabLogsBtn = root.querySelector("#vn-console-tab-logs") as HTMLButtonElement;
  const tabDirectorBtn = root.querySelector("#vn-console-tab-director") as HTMLButtonElement;

  const systemTextarea = root.querySelector("#vn-director-system") as HTMLTextAreaElement;
  const notesTextarea = root.querySelector("#vn-director-notes") as HTMLTextAreaElement;
  const enabledCheckbox = root.querySelector("#vn-director-enabled") as HTMLInputElement;
  const saveBtn = root.querySelector("#vn-director-save-btn") as HTMLButtonElement;
  const expandBtn = root.querySelector("#vn-director-expand-btn") as HTMLButtonElement;

  const copyAllDrawerBtn = root.querySelector("#vn-copy-all-drawer-btn") as HTMLButtonElement;
  const copyLogsBtn = root.querySelector("#vn-copy-logs-btn") as HTMLButtonElement;
  const copyStateBtn = root.querySelector("#vn-copy-state-btn") as HTMLButtonElement;
  const copyManifestBtn = root.querySelector("#vn-copy-manifest-btn") as HTMLButtonElement;

  // ── Console Tab Switching ──
  const setConsoleTab = (tabMode: "logs" | "director") => {
    activeConsoleTab = tabMode;
    if (tabMode === "logs") {
      logStream.style.display = "flex";
      directorStream.style.display = "none";
      tabLogsBtn.style.background = "#334155";
      tabLogsBtn.style.borderColor = "#475569";
      tabLogsBtn.style.color = "#fff";
      tabDirectorBtn.style.background = "#1e293b";
      tabDirectorBtn.style.borderColor = "#334155";
      tabDirectorBtn.style.color = "#94a3b8";
    } else {
      logStream.style.display = "none";
      directorStream.style.display = "flex";
      tabDirectorBtn.style.background = "#334155";
      tabDirectorBtn.style.borderColor = "#475569";
      tabDirectorBtn.style.color = "#fff";
      tabLogsBtn.style.background = "#1e293b";
      tabLogsBtn.style.borderColor = "#334155";
      tabLogsBtn.style.color = "#94a3b8";
    }
  };

  tabLogsBtn?.addEventListener("click", () => setConsoleTab("logs"));
  tabDirectorBtn?.addEventListener("click", () => setConsoleTab("director"));

  // ── Clear Logs ──
  root.querySelector("#vn-clear-log-btn")?.addEventListener("click", () => {
    if (activeConsoleTab === "logs") {
      if (logStream) logStream.innerHTML = "";
      rawLogHistory = [];
    } else {
      if (directorStream) {
        directorStream.innerHTML = "";
        directorStream.appendChild(directorEmptyNotice);
        directorEmptyNotice.style.display = "block";
      }
      rawDirectorLogs = [];
    }
  });

  // ── Director Prompt Editor Actions ──
  expandBtn?.addEventListener("click", async () => {
    const textEditor = (ctx as any).textEditor;
    if (textEditor?.open) {
      try {
        const result = await textEditor.open({
          title: "Edit Director Prompt",
          value: systemTextarea.value,
        });
        if (result && !result.cancelled && typeof result.text === "string") {
          systemTextarea.value = result.text;
        }
      } catch (e) {
        pushLog(`Failed to open text editor: ${String(e)}`, "error");
      }
    } else {
      pushLog("Spindle text editor API not available.", "warn");
    }
  });

  saveBtn?.addEventListener("click", () => {
    const settings: DirectorSettings = {
      systemPrompt: systemTextarea.value,
      userNotes: notesTextarea.value,
      enabled: enabledCheckbox.checked,
    };
    ctx.sendToBackend({
      type: "vn_save_director_settings",
      settings,
    });
    saveBtn.textContent = "✓ Saved!";
    setTimeout(() => (saveBtn.textContent = "Save Directives"), 1500);
  });

  // ── Copy Handlers ──
  copyAllDrawerBtn?.addEventListener("click", async () => {
    try {
      const bundle = {
        timestamp: new Date().toISOString(),
        ledger: latestLedgerData,
        manifest: latestManifestData,
        logs: rawLogHistory,
        directorLogs: rawDirectorLogs,
        directorSettings: {
          systemPrompt: systemTextarea.value,
          userNotes: notesTextarea.value,
          enabled: enabledCheckbox.checked,
        },
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
      if (activeConsoleTab === "logs") {
        await navigator.clipboard.writeText(rawLogHistory.join("\n"));
      } else {
        await navigator.clipboard.writeText(JSON.stringify(rawDirectorLogs, null, 2));
      }
      copyLogsBtn.textContent = "✓ Copied!";
      setTimeout(() => (copyLogsBtn.textContent = "📋 Copy"), 1500);
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

  const setDirectorSettings = (settings: DirectorSettings) => {
    if (!settings) return;
    if (systemTextarea) systemTextarea.value = settings.systemPrompt || "";
    if (notesTextarea) notesTextarea.value = settings.userNotes || "";
    if (enabledCheckbox) enabledCheckbox.checked = settings.enabled ?? true;
  };

  const renderDirectorLogCard = (entry: DirectorLogEntry): HTMLElement => {
    const card = document.createElement("div");
    card.style.cssText =
      "background: rgba(15, 23, 42, 0.8); border: 1px solid #334155; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px; font-size: 11px;";

    const hasWorld = entry.worldChanges && entry.worldChanges.length > 0;
    const hasNpc = entry.npcChanges && entry.npcChanges.length > 0;
    const hasMut = entry.mutations && entry.mutations.length > 0;
    const isQuiet = !hasWorld && !hasNpc && !hasMut;

    let worldHtml = "";
    if (hasWorld) {
      worldHtml = `
        <div style="color: #38bdf8;">
          <span style="font-weight: 700; text-transform: uppercase; font-size: 10px;">[World Shifts]</span>
          <ul style="margin: 2px 0 0 16px; padding: 0;">
            ${entry.worldChanges.map((w) => `<li>${escapeHtml(w)}</li>`).join("")}
          </ul>
        </div>
      `;
    }

    let npcHtml = "";
    if (hasNpc) {
      npcHtml = `
        <div style="color: #34d399;">
          <span style="font-weight: 700; text-transform: uppercase; font-size: 10px;">[NPC Intent]</span>
          <ul style="margin: 2px 0 0 16px; padding: 0;">
            ${entry.npcChanges
              .map((n) => {
                const parts: string[] = [];
                if (n.wantNow) parts.push(`want_now -> "${escapeHtml(n.wantNow)}"`);
                if (n.passionsMoved && Object.keys(n.passionsMoved).length > 0) {
                  parts.push(
                    `passions: ${Object.entries(n.passionsMoved)
                      .map(([k, v]) => `${k} (${v})`)
                      .join(", ")}`
                  );
                }
                if (n.relationsMoved && Object.keys(n.relationsMoved).length > 0) {
                  parts.push(
                    `relations: ${escapeHtml(JSON.stringify(n.relationsMoved))}`
                  );
                }
                return `<li><strong>${escapeHtml(n.name)}:</strong> ${parts.join(" | ")}</li>`;
              })
              .join("")}
          </ul>
        </div>
      `;
    }

    let mutHtml = "";
    if (hasMut) {
      mutHtml = `
        <div style="color: #f43f5e;">
          <span style="font-weight: 700; text-transform: uppercase; font-size: 10px;">[Mutations]</span>
          <ul style="margin: 2px 0 0 16px; padding: 0;">
            ${entry.mutations.map((m) => `<li>${escapeHtml(m)}</li>`).join("")}
          </ul>
        </div>
      `;
    }

    let quietHtml = "";
    if (isQuiet) {
      quietHtml = `<div style="color: #64748b; font-style: italic; font-size: 10px;">No structural changes recorded this turn.</div>`;
    }

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 4px; font-size: 10px;">
        <span style="font-weight: 700; color: #818cf8;">⚡ TURN IMPACT</span>
        <span style="color: #94a3b8;">${entry.timestamp || ""}</span>
      </div>
      <details style="cursor: pointer;">
        <summary style="color: #a78bfa; font-weight: 600; font-size: 10px;">[Directive] Active Guidance</summary>
        <div style="background: #020617; border: 1px solid #1e293b; border-radius: 4px; padding: 6px; margin-top: 4px; font-family: ui-monospace, Menlo, monospace; font-size: 10px; color: #cbd5e1; white-space: pre-wrap; word-break: break-word;">${escapeHtml(entry.directive)}</div>
      </details>
      ${worldHtml}
      ${npcHtml}
      ${mutHtml}
      ${quietHtml}
    `;

    return card;
  };

  const pushDirectorLog = (log: DirectorLogEntry) => {
    rawDirectorLogs.push(log);
    if (rawDirectorLogs.length > 20) {
      rawDirectorLogs.shift();
    }
    if (!directorStream) return;
    if (directorEmptyNotice) directorEmptyNotice.style.display = "none";

    const card = renderDirectorLogCard(log);
    directorStream.appendChild(card);
    directorStream.scrollTop = directorStream.scrollHeight;
  };

  const setDirectorLogs = (logs: DirectorLogEntry[]) => {
    rawDirectorLogs = Array.isArray(logs) ? [...logs] : [];
    if (!directorStream) return;
    directorStream.innerHTML = "";
    if (rawDirectorLogs.length === 0) {
      directorStream.appendChild(directorEmptyNotice);
      directorEmptyNotice.style.display = "block";
      return;
    }
    if (directorEmptyNotice) directorEmptyNotice.style.display = "none";
    for (const entry of rawDirectorLogs) {
      directorStream.appendChild(renderDirectorLogCard(entry));
    }
    directorStream.scrollTop = directorStream.scrollHeight;
  };

  // ── Initial State Requests from Host ──
  ctx.sendToBackend({ type: "vn_get_manifest" });
  ctx.sendToBackend({ type: "vn_get_director_settings" });
  ctx.sendToBackend({ type: "vn_get_director_logs" });

  return {
    tab,
    pushLog,
    updateDiagnostic,
    setLatestLedger,
    setLatestManifest,
    setDirectorSettings,
    pushDirectorLog,
    setDirectorLogs,
  };
}
