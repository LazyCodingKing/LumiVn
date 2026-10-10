import type { SpindleFrontendContext, SpindleDrawerTabHandle } from "lumiverse-spindle-types";
import type { DiagnosticData, DirectorSettings, DirectorLogEntry } from "../../shared/types.js";
import { PROP_TEMPLATES_CATALOG, formatDialogueHtml, TEXT_EFFECTS_CSS } from "../stage/rich-text.js";
import { DEFAULT_STAT_RULES, DEFAULT_LEDGER_PROMPT } from "../../backend/default-rules.js";
import { DEFAULT_RPG_PROMPT } from "../../backend/storage.js";
import { ALL_HUD_TABS } from "../hud/menu-bar.js";

export interface DiagnosticsDrawerHandle {
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
): DiagnosticsDrawerHandle | null {
  if (typeof ctx.ui?.registerDrawerTab !== "function") return null;

  const tab = ctx.ui.registerDrawerTab({
    id: "vn_diagnostics",
    title: "LumiVN Controls & Diagnostics",
    shortName: "VN Studio",
    headerTitle: "Visual Novel Studio",
    description: "Launch visual novel stage, inspect Ledger parsing, and copy engine logs",
    keywords: ["vn", "diagnostics", "ledger", "visual novel", "stage", "studio", "director"],
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
      <!-- Primary Launch Controls -->
      <div style="background: linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.25)); border: 1px solid rgba(129,140,248,0.5); border-radius: 12px; padding: 14px; text-align: center;">
        <h3 style="margin: 0 0 4px 0; font-size: 15px; color: #fff;">LumiVN Control Center</h3>
        <p style="font-size: 11px; color: #94a3b8; margin: 0 0 10px 0;">Switch between standard chat and the visual novel stage.</p>
        <button id="vn-btn-launch-stage" style="width: 100%; padding: 10px 16px; background: #6366f1; border: none; border-radius: 8px; color: #fff; font-weight: 700; font-size: 13px; cursor: pointer; transition: background 0.2s ease;">
          ▶ Open Visual Novel Stage
        </button>
      </div>

      <!-- Simulation Rulebook & Director Card -->
      <details class="vn-director-card" open style="background: rgba(15, 23, 42, 0.7); border: 1px solid #38bdf8; border-radius: 10px; padding: 12px;">
        <summary style="font-size: 13px; font-weight: 700; color: #38bdf8; cursor: pointer; display: flex; align-items: center; justify-content: space-between; user-select: none;">
          <span>📖 Simulation Rulebook & Director</span>
          <label id="vn-director-toggle-label" style="font-size: 11px; font-weight: 500; color: #cbd5e1; display: inline-flex; align-items: center; gap: 4px; cursor: pointer;" onclick="event.stopPropagation()">
            <input type="checkbox" id="vn-director-enabled" checked style="accent-color: #6366f1; cursor: pointer;" />
            Active
          </label>
        </summary>

        <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 10px;">
          <!-- Sub-tabs bar -->
          <div style="display: flex; gap: 4px; border-bottom: 1px solid #1e293b; padding-bottom: 6px; flex-wrap: wrap;">
            <button type="button" class="vn-dr-subtab-btn" data-subtab="director" style="background: #0284c7; color: #fff; border: 1px solid #38bdf8; border-radius: 4px; padding: 2px 6px; font-size: 10px; cursor: pointer; font-weight: 700;">🎬 Director</button>
            <button type="button" class="vn-dr-subtab-btn" data-subtab="stats" style="background: #1e293b; color: #94a3b8; border: 1px solid #334155; border-radius: 4px; padding: 2px 6px; font-size: 10px; cursor: pointer;">📊 Stat Rules</button>
            <button type="button" class="vn-dr-subtab-btn" data-subtab="ledger" style="background: #1e293b; color: #94a3b8; border: 1px solid #334155; border-radius: 4px; padding: 2px 6px; font-size: 10px; cursor: pointer;">📜 Ledger Schema</button>
            <button type="button" class="vn-dr-subtab-btn" data-subtab="rpg" style="background: #1e293b; color: #94a3b8; border: 1px solid #334155; border-radius: 4px; padding: 2px 6px; font-size: 10px; cursor: pointer;">⚔️ RPG Rules</button>
            <button type="button" class="vn-dr-subtab-btn" data-subtab="tabs" style="background: #1e293b; color: #34d399; border: 1px solid #059669; border-radius: 4px; padding: 2px 6px; font-size: 10px; cursor: pointer;">🎛️ HUD Tabs</button>
          </div>

          <div id="vn-dr-panel-director" class="vn-dr-panel" style="display: flex; flex-direction: column; gap: 8px;">
            <div>
              <label for="vn-director-system" style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 4px;">
                Director System Directives
              </label>
              <textarea id="vn-director-system" rows="4" placeholder="System directives enforced before generation..." style="width: 100%; box-sizing: border-box; background: #020617; border: 1px solid #334155; border-radius: 6px; color: #f8fafc; font-family: ui-monospace, Menlo, monospace; font-size: 11px; padding: 8px; resize: vertical; line-height: 1.4;"></textarea>
            </div>
            <div>
              <label for="vn-director-notes" style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 4px;">
                Scene Notes & Guidance (Macros: {{user}}, {{char}})
              </label>
              <textarea id="vn-director-notes" rows="3" placeholder="Optional turn guidance..." style="width: 100%; box-sizing: border-box; background: #020617; border: 1px solid #334155; border-radius: 6px; color: #f8fafc; font-family: ui-monospace, Menlo, monospace; font-size: 11px; padding: 8px; resize: vertical; line-height: 1.4;"></textarea>
            </div>
          </div>

          <div id="vn-dr-panel-stats" class="vn-dr-panel" style="display: none; flex-direction: column; gap: 4px;">
            <label style="font-size: 10px; color: #94a3b8;">Stat Rules Formulation:</label>
            <textarea id="vn-drawer-stat-rules" rows="6" style="width: 100%; box-sizing: border-box; background: #020617; border: 1px solid #334155; border-radius: 6px; color: #f8fafc; font-family: ui-monospace, Menlo, monospace; font-size: 10px; padding: 8px; resize: vertical;"></textarea>
          </div>

          <div id="vn-dr-panel-ledger" class="vn-dr-panel" style="display: none; flex-direction: column; gap: 4px;">
            <label style="font-size: 10px; color: #94a3b8;">Ledger Output Schema:</label>
            <textarea id="vn-drawer-ledger-prompt" rows="6" style="width: 100%; box-sizing: border-box; background: #020617; border: 1px solid #334155; border-radius: 6px; color: #f8fafc; font-family: ui-monospace, Menlo, monospace; font-size: 10px; padding: 8px; resize: vertical;"></textarea>
          </div>

          <div id="vn-dr-panel-rpg" class="vn-dr-panel" style="display: none; flex-direction: column; gap: 4px;">
            <label style="font-size: 10px; color: #94a3b8;">RPG & Skills Progression Directives:</label>
            <textarea id="vn-drawer-rpg-prompt" rows="6" style="width: 100%; box-sizing: border-box; background: #020617; border: 1px solid #334155; border-radius: 6px; color: #f8fafc; font-family: ui-monospace, Menlo, monospace; font-size: 10px; padding: 8px; resize: vertical;"></textarea>
          </div>

          <div id="vn-dr-panel-tabs" class="vn-dr-panel" style="display: none; flex-direction: column; gap: 6px;">
            <label style="font-size: 10px; color: #94a3b8; font-weight: 700;">HUD Tab Checkboxes (Show / Hide):</label>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px;">
              ${ALL_HUD_TABS.filter((t) => t.id !== "diagnostics").map((tabItem) => `
                <label style="background: #1e293b; border: 1px solid #334155; border-radius: 4px; padding: 4px 6px; display: flex; align-items: center; gap: 4px; font-size: 10px; cursor: pointer; color: #f8fafc;">
                  <input type="checkbox" class="vn-drawer-tab-cb" data-tab-id="${tabItem.id}" checked style="accent-color: #10b981; cursor: pointer;" />
                  <span>${tabItem.icon}</span> <span>${tabItem.label}</span>
                </label>
              `).join("")}
            </div>

            <div style="border-top: 1px solid #334155; margin-top: 6px; padding-top: 6px;">
              <label style="font-size: 10px; color: #38bdf8; font-weight: 700;">Cinema & Audio Engine Toggles:</label>
              <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
                <label style="background: #1e293b; border: 1px solid #334155; border-radius: 4px; padding: 4px 6px; display: flex; align-items: center; gap: 6px; font-size: 10px; cursor: pointer; color: #f8fafc;">
                  <input type="checkbox" id="vn-toggle-cinema-anim" checked style="accent-color: #6366f1; cursor: pointer;" />
                  <span>🎬 Cinema Sprite Movement & Speaking Bob</span>
                </label>
                <label style="background: #1e293b; border: 1px solid #334155; border-radius: 4px; padding: 4px 6px; display: flex; align-items: center; gap: 6px; font-size: 10px; cursor: pointer; color: #f8fafc;">
                  <input type="checkbox" id="vn-toggle-card-sprites" checked style="accent-color: #6366f1; cursor: pointer;" />
                  <span>🎭 Character Expressions Auto-Sync (Card Sprites)</span>
                </label>
                <label style="background: #1e293b; border: 1px solid #334155; border-radius: 4px; padding: 4px 6px; display: flex; align-items: center; gap: 6px; font-size: 10px; cursor: pointer; color: #f8fafc;">
                  <input type="checkbox" id="vn-toggle-bgm" checked style="accent-color: #6366f1; cursor: pointer;" />
                  <span>🎵 Ambient BGM & Procedural Chords</span>
                </label>
                <label style="background: #1e293b; border: 1px solid #334155; border-radius: 4px; padding: 4px 6px; display: flex; align-items: center; gap: 6px; font-size: 10px; cursor: pointer; color: #f8fafc;">
                  <input type="checkbox" id="vn-toggle-shaders" checked style="accent-color: #6366f1; cursor: pointer;" />
                  <span>🌧️ Atmospheric Weather & Shaders</span>
                </label>
              </div>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px;">
            <button id="vn-director-save-btn" type="button" style="padding: 6px 14px; font-size: 11px; font-weight: 700; background: #6366f1; border: none; border-radius: 6px; color: #fff; cursor: pointer; transition: background 0.2s;">
              Save Directives
            </button>
          </div>
        </div>
      </details>

      <!-- Turn Telemetry -->
      <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid #334155; border-radius: 10px; padding: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h4 style="margin: 0; font-size: 11px; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px;">Turn Telemetry</h4>
          <button id="vn-copy-state-btn" style="padding: 2px 8px; font-size: 10px; background: #1e293b; border: 1px solid #475569; border-radius: 4px; color: #cbd5e1; cursor: pointer;">
            📋 Copy State JSON
          </button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Ledger Block:</span>
            <span id="diag-ledger-status" style="font-weight: 600; color: #94a3b8;">Pending turn</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Location:</span>
            <span id="diag-place-id" style="font-weight: 600; color: #e2e8f0;">—</span>
          </div>
          <div>
            <span style="color: #94a3b8;">Cast Detected:</span>
            <div id="diag-cast-list" style="font-size: 11px; color: #e2e8f0; margin-top: 1px;">None</div>
          </div>
          <div>
            <span style="color: #94a3b8;">Background URL:</span>
            <div id="diag-bg-url" style="font-size: 11px; color: #38bdf8; word-break: break-all; margin-top: 1px;">—</div>
          </div>
        </div>
      </div>

      <!-- Roleplay Prop & UI Templates Card -->
      <details class="vn-props-card" style="background: rgba(15, 23, 42, 0.7); border: 1px solid #38bdf8; border-radius: 10px; padding: 12px;">
        <summary style="font-size: 13px; font-weight: 700; color: #38bdf8; cursor: pointer; display: flex; align-items: center; justify-content: space-between; user-select: none;">
          <span>🎭 Roleplay Prop & UI Templates</span>
          <span style="font-size: 10px; background: rgba(56, 189, 248, 0.2); border: 1px solid #0284c7; color: #7dd3fc; padding: 2px 6px; border-radius: 4px;">HTML/CSS Props</span>
        </summary>
        <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 10px;">
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">
            Select a prop widget to inspect live game styling and copy its prompt tag:
          </p>
          <div id="vn-prop-tabs" style="display: flex; gap: 4px; flex-wrap: wrap;">
            ${PROP_TEMPLATES_CATALOG.map((p, idx) => `
              <button class="vn-prop-select-btn" data-prop-id="${p.id}" style="padding: 3px 8px; font-size: 11px; background: ${idx === 0 ? "#0284c7" : "#1e293b"}; border: 1px solid ${idx === 0 ? "#38bdf8" : "#475569"}; color: #fff; border-radius: 4px; cursor: pointer;">
                ${p.icon} ${p.name}
              </button>
            `).join("")}
          </div>

          <!-- Live Preview Box -->
          <div style="background: #020617; border: 1px solid #334155; border-radius: 8px; padding: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span id="vn-prop-desc" style="font-size: 10px; color: #94a3b8;">${PROP_TEMPLATES_CATALOG[0]?.description}</span>
              <button id="vn-copy-prop-tag-btn" style="padding: 2px 8px; font-size: 10px; font-weight: 700; background: #1e293b; border: 1px solid #38bdf8; color: #38bdf8; border-radius: 4px; cursor: pointer;">
                📋 Copy Tag
              </button>
            </div>
            <div id="vn-prop-preview-container" style="min-height: 60px;">
              ${formatDialogueHtml(PROP_TEMPLATES_CATALOG[0]?.sampleTag || "").html}
            </div>
          </div>

          <!-- Custom Prop CSS Overrides -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <label for="vn-custom-css-input" style="font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase;">
                Custom Prop CSS Overrides
              </label>
              <button id="vn-save-custom-css-btn" style="padding: 2px 8px; font-size: 10px; background: #0284c7; border: none; color: #fff; border-radius: 4px; cursor: pointer; font-weight: 700;">
                💾 Save CSS
              </button>
            </div>
            <textarea id="vn-custom-css-input" rows="3" placeholder="/* Add custom CSS rules for .vn-prop-card or custom classes */" style="width: 100%; box-sizing: border-box; background: #020617; border: 1px solid #334155; border-radius: 6px; color: #f8fafc; font-family: ui-monospace, Menlo, monospace; font-size: 10px; padding: 6px; resize: vertical;"></textarea>
          </div>
        </div>
      </details>

      <!-- Engine & Director Impact Console -->
      <div style="flex: 1; display: flex; flex-direction: column; background: #020617; border: 1px solid #1e293b; border-radius: 10px; padding: 10px; min-height: 220px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <div style="display: flex; gap: 4px;">
            <button id="vn-console-tab-logs" type="button" style="padding: 2px 8px; font-size: 10px; font-weight: 700; background: #334155; border: 1px solid #475569; border-radius: 4px; color: #fff; cursor: pointer;">
              Diagnostic Console
            </button>
            <button id="vn-console-tab-director" type="button" style="padding: 2px 8px; font-size: 10px; font-weight: 600; background: #1e293b; border: 1px solid #334155; border-radius: 4px; color: #94a3b8; cursor: pointer;">
              Director Impact
            </button>
          </div>
          <div style="display: flex; gap: 6px;">
            <button id="vn-copy-logs-btn" style="padding: 2px 8px; font-size: 10px; background: #334155; border: 1px solid #475569; border-radius: 4px; color: #f8fafc; font-weight: 600; cursor: pointer;">
              📋 Copy Logs
            </button>
            <button id="vn-clear-log-btn" style="padding: 2px 6px; font-size: 10px; background: #1e293b; border: 1px solid #334155; border-radius: 4px; color: #94a3b8; cursor: pointer;">
              Clear
            </button>
          </div>
        </div>

        <!-- Stream: Engine Logs -->
        <div id="vn-console-stream" style="flex: 1; overflow-y: auto; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; color: #cbd5e1; display: flex; flex-direction: column; gap: 4px; user-select: text;">
          <div style="color: #64748b;">[System] Diagnostic log initialized.</div>
        </div>

        <!-- Stream: Director Impact Logs -->
        <div id="vn-director-log-stream" style="flex: 1; overflow-y: auto; font-family: system-ui, -apple-system, sans-serif; font-size: 11px; color: #cbd5e1; display: none; flex-direction: column; gap: 8px; user-select: text;">
          <div id="vn-director-empty-notice" style="color: #64748b; font-style: italic;">No Director impact turns recorded yet.</div>
        </div>
      </div>
    </div>
  `;

  root.querySelector("#vn-btn-launch-stage")?.addEventListener("click", onLaunchStage);

  const consoleStream = root.querySelector("#vn-console-stream") as HTMLElement;
  const directorStream = root.querySelector("#vn-director-log-stream") as HTMLElement;
  const directorEmptyNotice = root.querySelector("#vn-director-empty-notice") as HTMLElement;

  const tabLogsBtn = root.querySelector("#vn-console-tab-logs") as HTMLButtonElement;
  const tabDirectorBtn = root.querySelector("#vn-console-tab-director") as HTMLButtonElement;

  const systemTextarea = root.querySelector("#vn-director-system") as HTMLTextAreaElement;
  const notesTextarea = root.querySelector("#vn-director-notes") as HTMLTextAreaElement;
  const enabledCheckbox = root.querySelector("#vn-director-enabled") as HTMLInputElement;
  const saveBtn = root.querySelector("#vn-director-save-btn") as HTMLButtonElement;

  const copyLogsBtn = root.querySelector("#vn-copy-logs-btn") as HTMLButtonElement;
  const copyStateBtn = root.querySelector("#vn-copy-state-btn") as HTMLButtonElement;

  // Tab switching
  const setConsoleTab = (tabMode: "logs" | "director") => {
    activeConsoleTab = tabMode;
    if (tabMode === "logs") {
      if (consoleStream) consoleStream.style.display = "flex";
      if (directorStream) directorStream.style.display = "none";
      if (tabLogsBtn) {
        tabLogsBtn.style.background = "#334155";
        tabLogsBtn.style.color = "#fff";
      }
      if (tabDirectorBtn) {
        tabDirectorBtn.style.background = "#1e293b";
        tabDirectorBtn.style.color = "#94a3b8";
      }
    } else {
      if (consoleStream) consoleStream.style.display = "none";
      if (directorStream) directorStream.style.display = "flex";
      if (tabDirectorBtn) {
        tabDirectorBtn.style.background = "#334155";
        tabDirectorBtn.style.color = "#fff";
      }
      if (tabLogsBtn) {
        tabLogsBtn.style.background = "#1e293b";
        tabLogsBtn.style.color = "#94a3b8";
      }
    }
  };

  tabLogsBtn?.addEventListener("click", () => setConsoleTab("logs"));
  tabDirectorBtn?.addEventListener("click", () => setConsoleTab("director"));

  const drawerStatRules = root.querySelector("#vn-drawer-stat-rules") as HTMLTextAreaElement | null;
  const drawerLedgerPrompt = root.querySelector("#vn-drawer-ledger-prompt") as HTMLTextAreaElement | null;
  const drawerRpgPrompt = root.querySelector("#vn-drawer-rpg-prompt") as HTMLTextAreaElement | null;

  if (drawerStatRules) drawerStatRules.value = DEFAULT_STAT_RULES;
  if (drawerLedgerPrompt) drawerLedgerPrompt.value = DEFAULT_LEDGER_PROMPT;
  if (drawerRpgPrompt) drawerRpgPrompt.value = DEFAULT_RPG_PROMPT;

  // Drawer rulebook subtab switching
  const drSubtabBtns = root.querySelectorAll<HTMLButtonElement>(".vn-dr-subtab-btn");
  drSubtabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.subtab;
      if (!target) return;
      drSubtabBtns.forEach((b) => {
        b.style.background = "#1e293b";
        b.style.color = "#94a3b8";
        b.style.fontWeight = "normal";
        b.style.borderColor = "#334155";
      });
      btn.style.background = "#0284c7";
      btn.style.color = "#fff";
      btn.style.fontWeight = "700";
      btn.style.borderColor = "#38bdf8";

      root.querySelectorAll<HTMLElement>(".vn-dr-panel").forEach((p) => (p.style.display = "none"));
      const activePanel = root.querySelector(`#vn-dr-panel-${target}`) as HTMLElement | null;
      if (activePanel) activePanel.style.display = "flex";
    });
  });

  // Drawer HUD tab checkboxes
  try {
    const rawSavedTabs = localStorage.getItem("vn_hud_enabled_tabs");
    if (rawSavedTabs) {
      const savedList: string[] = JSON.parse(rawSavedTabs);
      root.querySelectorAll<HTMLInputElement>(".vn-drawer-tab-cb").forEach((cb) => {
        cb.checked = savedList.includes(cb.dataset.tabId || "");
      });
    }
  } catch {}

  root.querySelectorAll<HTMLInputElement>(".vn-drawer-tab-cb").forEach((cb) => {
    cb.addEventListener("change", () => {
      const checkedList = Array.from(root.querySelectorAll<HTMLInputElement>(".vn-drawer-tab-cb:checked"))
        .map((c) => c.dataset.tabId || "")
        .filter(Boolean);
      try {
        localStorage.setItem("vn_hud_enabled_tabs", JSON.stringify(checkedList));
      } catch {}
    });
  });

  // Engine toggles handling
  const cinemaAnimCb = root.querySelector<HTMLInputElement>("#vn-toggle-cinema-anim");
  if (cinemaAnimCb) {
    cinemaAnimCb.checked = typeof localStorage !== "undefined" ? localStorage.getItem("vn_cinema_animations_enabled") !== "false" : true;
    cinemaAnimCb.addEventListener("change", () => {
      if (typeof localStorage !== "undefined") localStorage.setItem("vn_cinema_animations_enabled", String(cinemaAnimCb.checked));
      document.querySelector(".vn-stage-overlay")?.classList.toggle("vn-no-cinema-anim", !cinemaAnimCb.checked);
    });
  }

  const cardSpritesCb = root.querySelector<HTMLInputElement>("#vn-toggle-card-sprites");
  if (cardSpritesCb) {
    cardSpritesCb.checked = typeof localStorage !== "undefined" ? localStorage.getItem("vn_card_sprites_enabled") !== "false" : true;
    cardSpritesCb.addEventListener("change", () => {
      if (typeof localStorage !== "undefined") localStorage.setItem("vn_card_sprites_enabled", String(cardSpritesCb.checked));
    });
  }

  const bgmCb = root.querySelector<HTMLInputElement>("#vn-toggle-bgm");
  if (bgmCb) {
    bgmCb.checked = typeof localStorage !== "undefined" ? localStorage.getItem("vn_bgm_enabled") !== "false" : true;
    bgmCb.addEventListener("change", () => {
      if (typeof localStorage !== "undefined") localStorage.setItem("vn_bgm_enabled", String(bgmCb.checked));
    });
  }

  const shadersCb = root.querySelector<HTMLInputElement>("#vn-toggle-shaders");
  if (shadersCb) {
    shadersCb.checked = typeof localStorage !== "undefined" ? localStorage.getItem("vn_shaders_enabled") !== "false" : true;
    shadersCb.addEventListener("change", () => {
      if (typeof localStorage !== "undefined") localStorage.setItem("vn_shaders_enabled", String(shadersCb.checked));
      const canvas = document.querySelector<HTMLCanvasElement>(".vn-stage canvas");
      if (canvas) canvas.style.display = shadersCb.checked ? "block" : "none";
    });
  }

  saveBtn?.addEventListener("click", () => {
    const settings: DirectorSettings = {
      systemPrompt: systemTextarea?.value || "",
      userNotes: notesTextarea?.value || "",
      enabled: enabledCheckbox?.checked ?? true,
    };
    ctx.sendToBackend?.({
      type: "vn_save_director_settings",
      settings,
    });

    if (drawerStatRules || drawerLedgerPrompt || drawerRpgPrompt) {
      ctx.sendToBackend?.({
        type: "vn_save_stat_rules_settings",
        settings: {
          mode: "mvu_quiet",
          statRules: drawerStatRules?.value?.trim() || DEFAULT_STAT_RULES,
          ledgerPrompt: drawerLedgerPrompt?.value?.trim() || DEFAULT_LEDGER_PROMPT,
          rpgPrompt: drawerRpgPrompt?.value?.trim() || DEFAULT_RPG_PROMPT,
          enabled: true,
        },
      });
    }

    if (saveBtn) {
      saveBtn.textContent = "✓ Saved!";
      setTimeout(() => (saveBtn.textContent = "Save Directives"), 1500);
    }
  });

  // Roleplay Props & CSS Template Manager Wiring
  let styleEl = document.getElementById("lumivn-custom-prop-styles") as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "lumivn-custom-prop-styles";
    document.head.appendChild(styleEl);
  }
  let savedCustomCss = "";
  try {
    savedCustomCss = localStorage.getItem("lumivn_custom_prop_css") || "";
  } catch {}
  styleEl.textContent = `${TEXT_EFFECTS_CSS}\n${savedCustomCss}`;

  let selectedPropDef = PROP_TEMPLATES_CATALOG[0]!;
  const propDesc = root.querySelector("#vn-prop-desc") as HTMLElement | null;
  const propPreview = root.querySelector("#vn-prop-preview-container") as HTMLElement | null;
  const copyTagBtn = root.querySelector("#vn-copy-prop-tag-btn") as HTMLButtonElement | null;
  const customCssInput = root.querySelector("#vn-custom-css-input") as HTMLTextAreaElement | null;
  const saveCustomCssBtn = root.querySelector("#vn-save-custom-css-btn") as HTMLButtonElement | null;

  if (customCssInput) {
    customCssInput.value = savedCustomCss;
  }

  root.querySelectorAll(".vn-prop-select-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const propId = btn.getAttribute("data-prop-id");
      const found = PROP_TEMPLATES_CATALOG.find((p) => p.id === propId);
      if (found) {
        selectedPropDef = found;
        if (propDesc) propDesc.textContent = found.description;
        if (propPreview) propPreview.innerHTML = formatDialogueHtml(found.sampleTag).html;
        root.querySelectorAll(".vn-prop-select-btn").forEach((b) => {
          (b as HTMLElement).style.background = b === btn ? "#0284c7" : "#1e293b";
          (b as HTMLElement).style.borderColor = b === btn ? "#38bdf8" : "#475569";
        });
      }
    });
  });

  copyTagBtn?.addEventListener("click", async () => {
    await navigator.clipboard.writeText(selectedPropDef.sampleTag).catch(() => {});
    if (copyTagBtn) {
      const orig = copyTagBtn.textContent;
      copyTagBtn.textContent = "✓ Copied Tag!";
      copyTagBtn.style.borderColor = "#10b981";
      setTimeout(() => {
        copyTagBtn.textContent = orig;
        copyTagBtn.style.borderColor = "#38bdf8";
      }, 1500);
    }
  });

  saveCustomCssBtn?.addEventListener("click", () => {
    const cssVal = customCssInput?.value || "";
    try {
      localStorage.setItem("lumivn_custom_prop_css", cssVal);
    } catch {}
    if (styleEl) {
      styleEl.textContent = `${TEXT_EFFECTS_CSS}\n${cssVal}`;
    }
    if (saveCustomCssBtn) {
      const orig = saveCustomCssBtn.textContent;
      saveCustomCssBtn.textContent = "✓ Saved!";
      setTimeout(() => (saveCustomCssBtn.textContent = orig), 1500);
    }
  });

  root.querySelector("#vn-clear-log-btn")?.addEventListener("click", () => {
    if (activeConsoleTab === "logs") {
      if (consoleStream) consoleStream.innerHTML = "";
      rawLogHistory = [];
    } else {
      if (directorStream) {
        directorStream.innerHTML = "";
        if (directorEmptyNotice) {
          directorStream.appendChild(directorEmptyNotice);
          directorEmptyNotice.style.display = "block";
        }
      }
      rawDirectorLogs = [];
    }
  });

  const pushLog = (msg: string, level: "info" | "warn" | "error" | "action" = "info") => {
    const time = new Date().toLocaleTimeString();
    const entry = `[${time}] [${level.toUpperCase()}] ${msg}`;
    rawLogHistory.push(entry);

    if (!consoleStream) return;
    const line = document.createElement("div");
    line.style.wordBreak = "break-word";
    line.style.color =
      level === "error"
        ? "#f43f5e"
        : level === "warn"
        ? "#f59e0b"
        : level === "action"
        ? "#38bdf8"
        : "#cbd5e1";
    line.textContent = entry;
    consoleStream.appendChild(line);
    consoleStream.scrollTop = consoleStream.scrollHeight;
  };

  copyLogsBtn?.addEventListener("click", async () => {
    try {
      if (activeConsoleTab === "logs") {
        await navigator.clipboard.writeText(rawLogHistory.join("\n"));
      } else {
        await navigator.clipboard.writeText(JSON.stringify(rawDirectorLogs, null, 2));
      }
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

  const updateDiagnostic = (data: DiagnosticData) => {
    const elLedger = root.querySelector("#diag-ledger-status") as HTMLElement;
    const elPlace = root.querySelector("#diag-place-id") as HTMLElement;
    const elCast = root.querySelector("#diag-cast-list") as HTMLElement;
    const elBg = root.querySelector("#diag-bg-url") as HTMLElement;

    if (elLedger) {
      elLedger.textContent = data.hasLedger ? "DETECTED (Parsed)" : "NOT FOUND (Prose-only)";
      elLedger.style.color = data.hasLedger ? "#10b981" : "#f59e0b";
    }
    if (elPlace) elPlace.textContent = data.placeId || "default";
    if (elCast) elCast.textContent = data.participants.length > 0 ? data.participants.join(", ") : "None";
    if (elBg) elBg.textContent = data.bgUrl.startsWith("data:") ? "[Fallback SVG Data URI]" : data.bgUrl;

    pushLog(`Turn parsed: place='${data.placeId}', actors=${data.participants.length}`, "info");
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
      if (directorEmptyNotice) directorEmptyNotice.style.display = "block";
      return;
    }
    if (directorEmptyNotice) directorEmptyNotice.style.display = "none";
    for (const entry of rawDirectorLogs) {
      directorStream.appendChild(renderDirectorLogCard(entry));
    }
    directorStream.scrollTop = directorStream.scrollHeight;
  };

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
