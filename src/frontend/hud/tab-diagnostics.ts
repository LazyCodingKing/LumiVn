import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import type { LedgerData, AssetManifest, StatRulesSettings, CustomStatDefinition } from "../../shared/types.js";
import { diagBus, type LogEntry } from "../utils/diag-bus.js";
import { PROP_TEMPLATES_CATALOG, formatDialogueHtml } from "../stage/rich-text.js";
import { DEFAULT_STAT_RULES, DEFAULT_LEDGER_PROMPT } from "../../backend/default-rules.js";
import { DEFAULT_RPG_PROMPT, DEFAULT_DIRECTOR_SETTINGS } from "../../backend/storage.js";
import { buildUnifiedRulebook, parseUnifiedRulebook, DEFAULT_UNIFIED_RULEBOOK } from "../../shared/rulebook.js";
import type { VnAudioEngine } from "../stage/audio-player.js";
import { parseSkillTreesFromPrompt, RpgTab } from "./tab-rpg.js";
import { ALL_HUD_TABS, type HudTabId } from "./menu-bar.js";
import { CharactersTab } from "./tab-characters.js";
import { StatsTab } from "./tab-stats.js";
import { InventoryTab } from "./tab-inventory.js";
import { JournalTab } from "./tab-journal.js";
import { MapTab } from "./tab-map.js";
import { WardrobeTab } from "./tab-wardrobe.js";
import { BPlotsTab } from "./tab-bplots.js";

export class DiagnosticsTab {
  public root: HTMLElement;
  private ctx?: SpindleFrontendContext;
  private audioEngine?: VnAudioEngine;
  private menuBar?: { setVisibleTabs: (tabs: string[]) => void; getVisibleTabs: () => string[] };
  private currentLedger: LedgerData = {};
  private currentManifest?: AssetManifest;
  private activeFilter: "all" | "info" | "warn" | "error" = "all";
  private unsubscribeBus?: () => void;
  private statRulesSettings: StatRulesSettings | null = null;
  private activeRulebookSubtab: "unified" | "director" | "stats" | "ledger" | "rpg" | "custom_stats" | "preview" | "tabs" = "unified";

  constructor(
    ctx?: SpindleFrontendContext,
    audioEngine?: VnAudioEngine,
    menuBar?: { setVisibleTabs: (tabs: string[]) => void; getVisibleTabs: () => string[] }
  ) {
    this.ctx = ctx;
    this.audioEngine = audioEngine;
    this.menuBar = menuBar;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-diagnostics";
  }

  public setAudioEngine(engine: VnAudioEngine): void {
    this.audioEngine = engine;
  }

  public setStatRulesSettings(settings: StatRulesSettings): void {
    this.statRulesSettings = settings;
    const modeSelect = this.root.querySelector("#vn-mvu-mode-select") as HTMLSelectElement | null;
    const rulesInput = this.root.querySelector("#vn-stat-rules-input") as HTMLTextAreaElement | null;
    const ledgerInput = this.root.querySelector("#vn-ledger-prompt-input") as HTMLTextAreaElement | null;
    const rpgInput = this.root.querySelector("#vn-rpg-rules-input") as HTMLTextAreaElement | null;
    if (modeSelect) modeSelect.value = settings.mode || "mvu_quiet";
    if (rulesInput) rulesInput.value = settings.statRules?.trim() ? settings.statRules : DEFAULT_STAT_RULES;
    if (ledgerInput) ledgerInput.value = settings.ledgerPrompt?.trim() ? settings.ledgerPrompt : DEFAULT_LEDGER_PROMPT;
    if (rpgInput) rpgInput.value = settings.rpgPrompt?.trim() ? settings.rpgPrompt : DEFAULT_RPG_PROMPT;
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

    // Consolidated World & Simulation Rulebook Card
    const rulesCard = document.createElement("div");
    rulesCard.style.cssText = "background: #0f172a; border: 1px solid #38bdf8; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px;";
    
    const visibleTabs = this.menuBar?.getVisibleTabs?.() || ALL_HUD_TABS.map((t) => t.id);

    rulesCard.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid #1e293b; padding-bottom: 8px; flex-wrap: wrap; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 16px;">📖</span>
          <strong style="color: #38bdf8; font-size: 13px;">Unified Simulation Rulebook &amp; Live Tab Preview</strong>
        </div>
        <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
          <select id="vn-rulebook-preset-select" style="background: #1e293b; color: #fde047; border: 1px solid #eab308; border-radius: 4px; padding: 2px 6px; font-size: 11px; font-weight: 600; cursor: pointer;">
            <option value="full">🌟 Preset: Full RPG &amp; Living World</option>
            <option value="economy">⚡ Preset: Economy TOON (~80 tokens)</option>
            <option value="pure_vn">🚀 Preset: Pure VN (0 Extra Tokens)</option>
          </select>
          <select id="vn-mvu-mode-select" style="background: #1e293b; color: #fff; border: 1px solid #475569; border-radius: 4px; padding: 2px 6px; font-size: 11px;">
            <option value="mvu_quiet">MVU Mode (Quiet LLM Evaluator)</option>
            <option value="inline_interceptor">Inline Mode (Prompt Injection)</option>
            <option value="passive">Passive Mode (Parse only)</option>
          </select>
        </div>
      </div>

      <!-- Rulebook Sub-tabs Navigation -->
      <div style="display: flex; gap: 4px; border-bottom: 1px solid #1e293b; padding-bottom: 6px; flex-wrap: wrap;">
        <button class="vn-rb-subtab-btn" data-subtab="unified" style="background: #0284c7; color: #fff; border: 1px solid #38bdf8; border-radius: 4px; padding: 3px 8px; font-size: 11px; cursor: pointer; font-weight: 700;">📖 Unified Rulebook</button>
        <button class="vn-rb-subtab-btn" data-subtab="stats" style="background: #1e293b; color: #94a3b8; border: 1px solid #334155; border-radius: 4px; padding: 3px 8px; font-size: 11px; cursor: pointer;">📊 Stat Rules</button>
        <button class="vn-rb-subtab-btn" data-subtab="director" style="background: #1e293b; color: #94a3b8; border: 1px solid #334155; border-radius: 4px; padding: 3px 8px; font-size: 11px; cursor: pointer;">🎬 Director</button>
        <button class="vn-rb-subtab-btn" data-subtab="ledger" style="background: #1e293b; color: #94a3b8; border: 1px solid #334155; border-radius: 4px; padding: 3px 8px; font-size: 11px; cursor: pointer;">📜 Ledger Schema</button>
        <button class="vn-rb-subtab-btn" data-subtab="rpg" style="background: #1e293b; color: #94a3b8; border: 1px solid #334155; border-radius: 4px; padding: 3px 8px; font-size: 11px; cursor: pointer;">⚔️ RPG &amp; Skills</button>
        <button class="vn-rb-subtab-btn" data-subtab="custom_stats" style="background: #1e293b; color: #fbbf24; border: 1px solid #d97706; border-radius: 4px; padding: 3px 8px; font-size: 11px; cursor: pointer;">🛠️ Custom Stats</button>
        <button class="vn-rb-subtab-btn" data-subtab="preview" style="background: #1e293b; color: #a78bfa; border: 1px solid #7c3aed; border-radius: 4px; padding: 3px 8px; font-size: 11px; cursor: pointer;">👁️ Live Tab Preview</button>
        <button class="vn-rb-subtab-btn" data-subtab="tabs" style="background: #1e293b; color: #34d399; border: 1px solid #059669; border-radius: 4px; padding: 3px 8px; font-size: 11px; cursor: pointer;">🎛️ HUD Tab Checkboxes</button>
      </div>

      <!-- Domain Panels -->
      <div id="vn-rb-panel-unified" class="vn-rb-panel" style="display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <label style="font-size: 10px; color: #38bdf8; font-weight: 700;">Unified Rulebook (All Directives, Rules, RPG &amp; Ledger Combined):</label>
          <div style="display: flex; gap: 4px;">
            <button id="vn-parse-unified-btn" type="button" style="background: #1e293b; border: 1px solid #38bdf8; color: #38bdf8; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; cursor: pointer;">⚡ Parse &amp; Sync Sections</button>
            <button id="vn-copy-unified-btn" type="button" style="background: #1e293b; border: 1px solid #475569; color: #cbd5e1; font-size: 10px; padding: 2px 6px; border-radius: 4px; cursor: pointer;">📋 Copy Rulebook</button>
          </div>
        </div>
        <textarea id="vn-unified-rulebook-input" style="width: 100%; height: 160px; background: #020617; color: #f8fafc; border: 1px solid #334155; border-radius: 4px; font-family: monospace; font-size: 10px; padding: 6px; box-sizing: border-box; resize: vertical; line-height: 1.4;"></textarea>
      </div>

      <div id="vn-rb-panel-stats" class="vn-rb-panel" style="display: none; flex-direction: column; gap: 4px;">
        <label style="font-size: 10px; color: #94a3b8;">21-Stat Network &amp; Gravity Tiers Rules:</label>
        <textarea id="vn-stat-rules-input" style="width: 100%; height: 120px; background: #020617; color: #f8fafc; border: 1px solid #334155; border-radius: 4px; font-family: monospace; font-size: 10px; padding: 6px; box-sizing: border-box; resize: vertical;"></textarea>
      </div>

      <div id="vn-rb-panel-director" class="vn-rb-panel" style="display: none; flex-direction: column; gap: 6px;">
        <label style="font-size: 10px; color: #94a3b8;">World Director System Directives:</label>
        <textarea id="vn-director-system-input" style="width: 100%; height: 90px; background: #020617; color: #f8fafc; border: 1px solid #334155; border-radius: 4px; font-family: monospace; font-size: 10px; padding: 6px; box-sizing: border-box; resize: vertical;"></textarea>
        <label style="font-size: 10px; color: #94a3b8;">Turn Notes &amp; Scene Guidance (Macros: {{user}}, {{char}}):</label>
        <textarea id="vn-director-notes-input" style="width: 100%; height: 50px; background: #020617; color: #f8fafc; border: 1px solid #334155; border-radius: 4px; font-family: monospace; font-size: 10px; padding: 6px; box-sizing: border-box; resize: vertical;"></textarea>
      </div>

      <div id="vn-rb-panel-ledger" class="vn-rb-panel" style="display: none; flex-direction: column; gap: 4px;">
        <label style="font-size: 10px; color: #94a3b8;">Ledger Output Schema &amp; Structural Directives:</label>
        <textarea id="vn-ledger-prompt-input" style="width: 100%; height: 120px; background: #020617; color: #f8fafc; border: 1px solid #334155; border-radius: 4px; font-family: monospace; font-size: 10px; padding: 6px; box-sizing: border-box; resize: vertical;"></textarea>
      </div>

      <div id="vn-rb-panel-rpg" class="vn-rb-panel" style="display: none; flex-direction: column; gap: 4px;">
        <label style="font-size: 10px; color: #94a3b8;">RPG &amp; Skills Progression Rules (Tactical Directives &amp; Trees):</label>
        <textarea id="vn-rpg-rules-input" style="width: 100%; height: 120px; background: #020617; color: #f8fafc; border: 1px solid #334155; border-radius: 4px; font-family: monospace; font-size: 10px; padding: 6px; box-sizing: border-box; resize: vertical;"></textarea>
      </div>

      <div id="vn-rb-panel-custom_stats" class="vn-rb-panel" style="display: none; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <label style="font-size: 11px; color: #fbbf24; font-weight: 700;">Custom Stats &amp; Attributes Schema:</label>
          <span style="font-size: 10px; color: #94a3b8;">Add/remove custom attributes for all tabs</span>
        </div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap; background: #020617; border: 1px solid #334155; border-radius: 6px; padding: 8px; align-items: center;">
          <input id="vn-diag-stat-name" type="text" placeholder="Stat Name (e.g. Sanity)" style="background: #1e293b; color: #fff; border: 1px solid #475569; border-radius: 4px; padding: 4px 6px; font-size: 11px; flex: 1; min-width: 110px;" />
          <input id="vn-diag-stat-default" type="number" placeholder="Default" value="100" style="background: #1e293b; color: #fff; border: 1px solid #475569; border-radius: 4px; padding: 4px 6px; font-size: 11px; width: 65px;" />
          <input id="vn-diag-stat-max" type="number" placeholder="Max" value="100" style="background: #1e293b; color: #fff; border: 1px solid #475569; border-radius: 4px; padding: 4px 6px; font-size: 11px; width: 65px;" />
          <button id="vn-diag-add-stat-btn" type="button" style="background: #0284c7; color: #fff; border: none; border-radius: 4px; padding: 4px 10px; font-size: 11px; font-weight: 700; cursor: pointer;">➕ Add Stat</button>
        </div>
        <div id="vn-diag-custom-stats-list" style="display: flex; flex-direction: column; gap: 4px; max-height: 140px; overflow-y: auto;"></div>
      </div>

      <!-- Live Tab Preview with dynamic tab picker -->
      <div id="vn-rb-panel-preview" class="vn-rb-panel" style="display: none; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
          <span id="vn-preview-active-badge" style="font-size: 11px; color: #a78bfa; font-weight: 700;">🟢 Live Tab Preview (Select a tab below to inspect live rendering):</span>
          <div style="display: flex; gap: 4px; flex-wrap: wrap;">
            <select id="vn-preview-tab-select" style="background: #1e293b; color: #f8fafc; border: 1px solid #7c3aed; border-radius: 4px; padding: 3px 8px; font-size: 11px; font-weight: 600; cursor: pointer;">
              <option value="stats">📊 Stats &amp; Vitals Matrix</option>
              <option value="rpg">⚔️ RPG Skills &amp; Progression</option>
              <option value="inventory">🎒 Current Scene &amp; Items</option>
              <option value="journal">📜 Story Journal &amp; Mutations</option>
              <option value="characters">👥 Cast &amp; Living Dossiers</option>
              <option value="map">🗺️ Map &amp; Exploration</option>
              <option value="wardrobe">👗 Wardrobe &amp; Attire</option>
              <option value="bplots">📡 B-Plots &amp; Rumors</option>
            </select>
            <button id="vn-preview-refresh-btn" type="button" style="background: #1e293b; border: 1px solid #475569; color: #cbd5e1; font-size: 10px; padding: 2px 6px; border-radius: 4px; cursor: pointer;">🔄 Refresh</button>
          </div>
        </div>
        <div id="vn-rb-preview-viewport" style="background: #020617; border: 1px solid #334155; border-radius: 8px; padding: 12px; max-height: 380px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
        </div>
      </div>

      <div id="vn-rb-panel-tabs" class="vn-rb-panel" style="display: none; flex-direction: column; gap: 8px;">
        <div style="font-size: 11px; color: #cbd5e1; font-weight: 700;">Toggle which tabs appear on the bottom Game HUD Menu Bar:</div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 6px;">
          ${ALL_HUD_TABS.filter((t) => t.id !== "diagnostics").map((tabItem) => `
            <label style="background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 6px 8px; display: flex; align-items: center; gap: 6px; font-size: 11px; cursor: pointer; color: #f8fafc;">
              <input type="checkbox" class="vn-tab-checkbox" data-tab-id="${tabItem.id}" ${visibleTabs.includes(tabItem.id) ? "checked" : ""} style="accent-color: #10b981; cursor: pointer;" />
              <span>${tabItem.icon}</span> <span>${tabItem.label}</span>
            </label>
          `).join("")}
        </div>

        <div style="border-top: 1px solid #334155; margin-top: 8px; padding-top: 8px;">
          <div style="font-size: 11px; color: #38bdf8; font-weight: 700; margin-bottom: 6px;">Cinema &amp; Stage Engine Toggles:</div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <label style="background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 6px 8px; display: flex; align-items: center; gap: 6px; font-size: 11px; cursor: pointer; color: #f8fafc;">
              <input type="checkbox" id="vn-hud-toggle-cinema-anim" checked style="accent-color: #6366f1; cursor: pointer;" />
              <span>🎬 Cinema Sprite Movement &amp; Speaking Bob</span>
            </label>
            <label style="background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 6px 8px; display: flex; align-items: center; gap: 6px; font-size: 11px; cursor: pointer; color: #f8fafc;">
              <input type="checkbox" id="vn-hud-toggle-card-sprites" checked style="accent-color: #6366f1; cursor: pointer;" />
              <span>🎭 Character Expressions Auto-Sync (Card Sprites)</span>
            </label>
            <label style="background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 6px 8px; display: flex; align-items: center; gap: 6px; font-size: 11px; cursor: pointer; color: #f8fafc;">
              <input type="checkbox" id="vn-hud-toggle-bgm" checked style="accent-color: #6366f1; cursor: pointer;" />
              <span>🎵 Ambient BGM &amp; Procedural Chords</span>
            </label>
            <label style="background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 6px 8px; display: flex; align-items: center; gap: 6px; font-size: 11px; cursor: pointer; color: #f8fafc;">
              <input type="checkbox" id="vn-hud-toggle-shaders" checked style="accent-color: #6366f1; cursor: pointer;" />
              <span>🌧️ Atmospheric Weather &amp; Shaders</span>
            </label>
          </div>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; border-top: 1px solid #1e293b; padding-top: 8px; margin-top: 4px;">
        <span style="font-size: 10px; color: #94a3b8;">Edits take effect dynamically in tabs and on next turn.</span>
        <button id="vn-save-rules-btn" style="background: linear-gradient(135deg, #0284c7, #38bdf8); color: #fff; border: none; border-radius: 4px; padding: 6px 16px; font-size: 11px; font-weight: 700; cursor: pointer;">💾 Save &amp; Apply Rulebook</button>
      </div>
    `;
    this.root.appendChild(rulesCard);

    const modeSelect = rulesCard.querySelector("#vn-mvu-mode-select") as HTMLSelectElement | null;
    const presetSelect = rulesCard.querySelector("#vn-rulebook-preset-select") as HTMLSelectElement | null;
    const unifiedInput = rulesCard.querySelector("#vn-unified-rulebook-input") as HTMLTextAreaElement | null;
    const rulesInput = rulesCard.querySelector("#vn-stat-rules-input") as HTMLTextAreaElement | null;
    const ledgerInput = rulesCard.querySelector("#vn-ledger-prompt-input") as HTMLTextAreaElement | null;
    const rpgInput = rulesCard.querySelector("#vn-rpg-rules-input") as HTMLTextAreaElement | null;
    const directorSysInput = rulesCard.querySelector("#vn-director-system-input") as HTMLTextAreaElement | null;
    const directorNotesInput = rulesCard.querySelector("#vn-director-notes-input") as HTMLTextAreaElement | null;
    const saveRulesBtn = rulesCard.querySelector("#vn-save-rules-btn") as HTMLButtonElement | null;
    const parseUnifiedBtn = rulesCard.querySelector("#vn-parse-unified-btn") as HTMLButtonElement | null;
    const copyUnifiedBtn = rulesCard.querySelector("#vn-copy-unified-btn") as HTMLButtonElement | null;

    const previewTabSelect = rulesCard.querySelector("#vn-preview-tab-select") as HTMLSelectElement | null;
    const previewRefreshBtn = rulesCard.querySelector("#vn-preview-refresh-btn") as HTMLButtonElement | null;
    const previewViewport = rulesCard.querySelector("#vn-rb-preview-viewport") as HTMLElement | null;
    const previewBadge = rulesCard.querySelector("#vn-preview-active-badge") as HTMLElement | null;

    const customStatsListEl = rulesCard.querySelector("#vn-diag-custom-stats-list") as HTMLElement | null;
    const addStatNameInput = rulesCard.querySelector("#vn-diag-stat-name") as HTMLInputElement | null;
    const addStatDefaultInput = rulesCard.querySelector("#vn-diag-stat-default") as HTMLInputElement | null;
    const addStatMaxInput = rulesCard.querySelector("#vn-diag-stat-max") as HTMLInputElement | null;
    const addStatBtn = rulesCard.querySelector("#vn-diag-add-stat-btn") as HTMLButtonElement | null;

    let activeCustomStats: CustomStatDefinition[] = [];
    try {
      const savedDefs = localStorage.getItem("vn_custom_stats_definitions");
      if (savedDefs) activeCustomStats = JSON.parse(savedDefs);
    } catch {}

    const renderCustomStatsList = () => {
      if (!customStatsListEl) return;
      if (activeCustomStats.length === 0) {
        customStatsListEl.innerHTML = `<span style="font-size: 11px; color: #64748b; font-style: italic;">No custom stats defined yet.</span>`;
        return;
      }
      customStatsListEl.innerHTML = activeCustomStats.map((st) => `
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 4px; padding: 4px 8px; display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
          <div>
            <strong style="color: #38bdf8;">${st.name}</strong>
            <span style="color: #94a3b8; font-size: 10px; margin-left: 6px;">(Default: ${st.defaultValue ?? 100} / Max: ${st.max ?? 100})</span>
          </div>
          <button class="vn-diag-del-stat-btn" data-stat="${st.name}" style="background: transparent; border: none; color: #f87171; cursor: pointer; font-size: 11px;">🗑️</button>
        </div>
      `).join("");

      customStatsListEl.querySelectorAll<HTMLButtonElement>(".vn-diag-del-stat-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const sName = btn.dataset.stat;
          activeCustomStats = activeCustomStats.filter((s) => s.name !== sName);
          try {
            localStorage.setItem("vn_custom_stats_definitions", JSON.stringify(activeCustomStats));
          } catch {}
          renderCustomStatsList();
          syncUnifiedFromSections();
          updateLiveTabPreview();
        });
      });
    };

    addStatBtn?.addEventListener("click", () => {
      const name = addStatNameInput?.value?.trim();
      if (!name) return;
      const defVal = addStatDefaultInput ? parseInt(addStatDefaultInput.value, 10) || 100 : 100;
      const maxVal = addStatMaxInput ? parseInt(addStatMaxInput.value, 10) || 100 : 100;

      if (!activeCustomStats.some((s) => s.name === name)) {
        activeCustomStats.push({ name, defaultValue: defVal, max: maxVal, category: "custom" });
        try {
          localStorage.setItem("vn_custom_stats_definitions", JSON.stringify(activeCustomStats));
        } catch {}
        if (addStatNameInput) addStatNameInput.value = "";
        renderCustomStatsList();
        syncUnifiedFromSections();
        updateLiveTabPreview();
      }
    });

    renderCustomStatsList();

    const activeMode = this.statRulesSettings?.mode || "mvu_quiet";
    const activeRules = this.statRulesSettings?.statRules?.trim() || DEFAULT_STAT_RULES;
    const activeLedger = this.statRulesSettings?.ledgerPrompt?.trim() || DEFAULT_LEDGER_PROMPT;
    const activeRpg = this.statRulesSettings?.rpgPrompt?.trim() || DEFAULT_RPG_PROMPT;
    const activeDirSys = DEFAULT_DIRECTOR_SETTINGS.systemPrompt;
    const activeDirNotes = DEFAULT_DIRECTOR_SETTINGS.userNotes || "";

    if (modeSelect) modeSelect.value = activeMode;
    if (rulesInput) rulesInput.value = activeRules;
    if (ledgerInput) ledgerInput.value = activeLedger;
    if (rpgInput) rpgInput.value = activeRpg;
    if (directorSysInput) directorSysInput.value = activeDirSys;
    if (directorNotesInput) directorNotesInput.value = activeDirNotes;

    const syncUnifiedFromSections = () => {
      if (!unifiedInput) return;
      unifiedInput.value = buildUnifiedRulebook({
        director: directorSysInput?.value,
        stats: rulesInput?.value,
        rpg: rpgInput?.value,
        ledger: ledgerInput?.value,
        customStats: activeCustomStats,
      });
    };

    const applyUnifiedToSections = (rawText: string) => {
      const parsed = parseUnifiedRulebook(rawText);
      if (directorSysInput) directorSysInput.value = parsed.directorSystem;
      if (rulesInput) rulesInput.value = parsed.statRules;
      if (rpgInput) rpgInput.value = parsed.rpgPrompt;
      if (ledgerInput) ledgerInput.value = parsed.ledgerPrompt;
      if (parsed.customStats && parsed.customStats.length > 0) {
        for (const cs of parsed.customStats) {
          if (!activeCustomStats.some((s) => s.name === cs.name)) {
            activeCustomStats.push(cs);
          }
        }
        try {
          localStorage.setItem("vn_custom_stats_definitions", JSON.stringify(activeCustomStats));
        } catch {}
        renderCustomStatsList();
      }
    };

    syncUnifiedFromSections();

    parseUnifiedBtn?.addEventListener("click", () => {
      if (unifiedInput) {
        applyUnifiedToSections(unifiedInput.value);
        if (parseUnifiedBtn) {
          const orig = parseUnifiedBtn.textContent;
          parseUnifiedBtn.textContent = "✓ Parsed & Synced!";
          setTimeout(() => (parseUnifiedBtn.textContent = orig), 1500);
        }
        updateLiveTabPreview();
      }
    });

    copyUnifiedBtn?.addEventListener("click", async () => {
      if (unifiedInput) {
        await navigator.clipboard.writeText(unifiedInput.value).catch(() => undefined);
        if (copyUnifiedBtn) {
          const orig = copyUnifiedBtn.textContent;
          copyUnifiedBtn.textContent = "✓ Copied!";
          setTimeout(() => (copyUnifiedBtn.textContent = orig), 1500);
        }
      }
    });

    // ── Live Multi-Tab Preview Engine ──
    let currentPreviewTab = previewTabSelect?.value || "stats";

    const updateLiveTabPreview = (tabKey: string = currentPreviewTab) => {
      currentPreviewTab = tabKey;
      if (!previewViewport) return;
      previewViewport.innerHTML = "";

      if (previewBadge) {
        const labels: Record<string, string> = {
          stats: "Stats & Vitals Matrix",
          rpg: "RPG Skills & Trees",
          inventory: "Current Scene & Items",
          journal: "Story Journal & Mutations",
          characters: "Cast & Living Dossiers",
          map: "Map & Exploration",
          wardrobe: "Wardrobe & Attire",
          bplots: "B-Plots & Rumors",
        };
        previewBadge.textContent = `🟢 Live Preview: ${labels[tabKey] || tabKey} (Real-time sync)`;
      }

      // Clone current ledger or provide default preview state
      const previewLedger: LedgerData = JSON.parse(JSON.stringify(this.currentLedger || {}));
      if (!previewLedger.actors) previewLedger.actors = {};
      if (!previewLedger.actors["user"]) {
        previewLedger.actors["user"] = {
          id: "user",
          name: "Player",
          stats: { T: 50, A: 40, R: 60, Integ: 80, Stress: 20 },
          combat: { tier: 1, lv: 1, hp: "100/100", mp: "50/50", pwr: 14, agi: 12, int: 16 },
        };
      }
      const uActor = previewLedger.actors["user"]!;
      if (!uActor.stats) uActor.stats = {};
      for (const def of activeCustomStats) {
        if (uActor.stats[def.name] === undefined) {
          uActor.stats[def.name] = def.defaultValue ?? 100;
        }
      }

      let instance: { root: HTMLElement; render: (l: LedgerData, m?: any) => void } | null = null;
      switch (tabKey) {
        case "stats":
          instance = new StatsTab();
          break;
        case "rpg":
          instance = new RpgTab(this.ctx);
          break;
        case "inventory":
          instance = new InventoryTab(this.ctx);
          break;
        case "journal":
          instance = new JournalTab();
          break;
        case "characters":
          instance = new CharactersTab(this.ctx);
          break;
        case "map":
          instance = new MapTab(this.ctx);
          break;
        case "wardrobe":
          instance = new WardrobeTab(this.ctx);
          break;
        case "bplots":
          instance = new BPlotsTab();
          break;
        default:
          instance = new StatsTab();
          break;
      }

      if (instance) {
        instance.render(previewLedger, this.currentManifest);
        previewViewport.appendChild(instance.root);
      }
    };

    previewTabSelect?.addEventListener("change", () => {
      updateLiveTabPreview(previewTabSelect.value);
    });
    previewRefreshBtn?.addEventListener("click", () => {
      updateLiveTabPreview(previewTabSelect?.value || currentPreviewTab);
    });

    // Subtab switching
    const subtabBtns = rulesCard.querySelectorAll<HTMLButtonElement>(".vn-rb-subtab-btn");
    subtabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.subtab as any;
        if (!target) return;
        this.activeRulebookSubtab = target;
        subtabBtns.forEach((b) => {
          b.style.background = "#1e293b";
          b.style.color = "#94a3b8";
          b.style.fontWeight = "normal";
          b.style.borderColor = "#334155";
        });
        btn.style.background = "#0284c7";
        btn.style.color = "#fff";
        btn.style.fontWeight = "700";
        btn.style.borderColor = "#38bdf8";

        rulesCard.querySelectorAll<HTMLElement>(".vn-rb-panel").forEach((p) => (p.style.display = "none"));
        const activePanel = rulesCard.querySelector(`#vn-rb-panel-${target}`) as HTMLElement | null;
        if (activePanel) activePanel.style.display = "flex";
        if (target === "preview") updateLiveTabPreview();
        if (target === "unified") syncUnifiedFromSections();
      });
    });

    // Auto-update live preview on textarea changes
    [rulesInput, rpgInput, ledgerInput, directorSysInput].forEach((inp) => {
      inp?.addEventListener("input", () => {
        syncUnifiedFromSections();
        if (this.activeRulebookSubtab === "preview") updateLiveTabPreview();
      });
    });

    // Preset selector handling
    presetSelect?.addEventListener("change", () => {
      const p = presetSelect.value;
      if (p === "pure_vn") {
        if (modeSelect) modeSelect.value = "passive";
        if (rulesInput) rulesInput.value = "";
        if (ledgerInput) ledgerInput.value = "";
        if (directorSysInput) directorSysInput.value = "";
      } else if (p === "economy") {
        if (modeSelect) modeSelect.value = "passive";
        if (rulesInput) rulesInput.value = DEFAULT_STAT_RULES.slice(0, 400);
        if (ledgerInput) ledgerInput.value = "LEDGER: emit compact delta only.";
      } else {
        if (modeSelect) modeSelect.value = "mvu_quiet";
        if (rulesInput) rulesInput.value = DEFAULT_STAT_RULES;
        if (ledgerInput) ledgerInput.value = DEFAULT_LEDGER_PROMPT;
        if (rpgInput) rpgInput.value = DEFAULT_RPG_PROMPT;
        if (directorSysInput) directorSysInput.value = DEFAULT_DIRECTOR_SETTINGS.systemPrompt;
      }
      syncUnifiedFromSections();
      updateLiveTabPreview();
    });

    // Tab checkboxes handling
    rulesCard.querySelectorAll<HTMLInputElement>(".vn-tab-checkbox").forEach((cb) => {
      cb.addEventListener("change", () => {
        const checkedList = Array.from(rulesCard.querySelectorAll<HTMLInputElement>(".vn-tab-checkbox:checked")).map(
          (c) => c.dataset.tabId || ""
        ).filter(Boolean);
        this.menuBar?.setVisibleTabs?.(checkedList);
      });
    });

    // Engine toggle checkboxes handling
    const cinemaAnimCb = rulesCard.querySelector<HTMLInputElement>("#vn-hud-toggle-cinema-anim");
    if (cinemaAnimCb) {
      cinemaAnimCb.checked = typeof localStorage !== "undefined" ? localStorage.getItem("vn_cinema_animations_enabled") !== "false" : true;
      cinemaAnimCb.addEventListener("change", () => {
        if (typeof localStorage !== "undefined") localStorage.setItem("vn_cinema_animations_enabled", String(cinemaAnimCb.checked));
        document.querySelector(".vn-stage-overlay")?.classList.toggle("vn-no-cinema-anim", !cinemaAnimCb.checked);
      });
    }

    const cardSpritesCb = rulesCard.querySelector<HTMLInputElement>("#vn-hud-toggle-card-sprites");
    if (cardSpritesCb) {
      cardSpritesCb.checked = typeof localStorage !== "undefined" ? localStorage.getItem("vn_card_sprites_enabled") !== "false" : true;
      cardSpritesCb.addEventListener("change", () => {
        if (typeof localStorage !== "undefined") localStorage.setItem("vn_card_sprites_enabled", String(cardSpritesCb.checked));
      });
    }

    const bgmCb = rulesCard.querySelector<HTMLInputElement>("#vn-hud-toggle-bgm");
    if (bgmCb) {
      bgmCb.checked = typeof localStorage !== "undefined" ? localStorage.getItem("vn_bgm_enabled") !== "false" : true;
      bgmCb.addEventListener("change", () => {
        if (typeof localStorage !== "undefined") localStorage.setItem("vn_bgm_enabled", String(bgmCb.checked));
      });
    }

    const shadersCb = rulesCard.querySelector<HTMLInputElement>("#vn-hud-toggle-shaders");
    if (shadersCb) {
      shadersCb.checked = typeof localStorage !== "undefined" ? localStorage.getItem("vn_shaders_enabled") !== "false" : true;
      shadersCb.addEventListener("change", () => {
        if (typeof localStorage !== "undefined") localStorage.setItem("vn_shaders_enabled", String(shadersCb.checked));
        const canvas = document.querySelector<HTMLCanvasElement>(".vn-stage canvas");
        if (canvas) canvas.style.display = shadersCb.checked ? "block" : "none";
      });
    }

    if (!this.statRulesSettings) {
      this.ctx?.sendToBackend?.({ type: "vn_get_stat_rules_settings" });
    }

    saveRulesBtn?.addEventListener("click", () => {
      // If saving from unified input, parse sections first
      if (this.activeRulebookSubtab === "unified" && unifiedInput) {
        applyUnifiedToSections(unifiedInput.value);
      }

      const updated: StatRulesSettings = {
        mode: (modeSelect?.value as any) || "mvu_quiet",
        statRules: rulesInput?.value?.trim() || DEFAULT_STAT_RULES,
        ledgerPrompt: ledgerInput?.value?.trim() || DEFAULT_LEDGER_PROMPT,
        rpgPrompt: rpgInput?.value?.trim() || DEFAULT_RPG_PROMPT,
        unifiedRulebook: unifiedInput?.value?.trim() || buildUnifiedRulebook({
          director: directorSysInput?.value,
          stats: rulesInput?.value,
          rpg: rpgInput?.value,
          ledger: ledgerInput?.value,
          customStats: activeCustomStats,
        }),
        customStats: activeCustomStats,
        enabled: presetSelect?.value !== "pure_vn",
      };
      this.statRulesSettings = updated;
      this.ctx?.sendToBackend?.({
        type: "vn_save_stat_rules_settings",
        settings: updated,
      });

      if (directorSysInput) {
        this.ctx?.sendToBackend?.({
          type: "vn_save_director_settings",
          settings: {
            systemPrompt: directorSysInput.value.trim() || DEFAULT_DIRECTOR_SETTINGS.systemPrompt,
            userNotes: directorNotesInput?.value?.trim() || "",
            enabled: presetSelect?.value !== "pure_vn",
          },
        });
      }

      updateLiveTabPreview();

      if (saveRulesBtn) {
        const orig = saveRulesBtn.textContent;
        saveRulesBtn.textContent = "✓ Rulebook Saved & Applied!";
        setTimeout(() => {
          saveRulesBtn.textContent = orig;
        }, 1500);
      }
    });

    // Dedicated Background Music (BGM) & Audio Engine Controls Card
    const audioCard = document.createElement("div");
    audioCard.style.cssText = "background: #0f172a; border: 1px solid #10b981; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 10px;";
    const isBgmActive = this.audioEngine?.isBgmActive() ?? false;
    const bgmVol = Math.round((this.audioEngine?.getBgmVolume() ?? 0.4) * 100);
    const currTrack = this.audioEngine?.getCurrentBgm() || "idle / adaptive";

    audioCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 6px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 15px;">🎵</span>
          <strong style="color: #34d399; font-size: 12px; text-transform: uppercase;">Background Music (BGM) & Audio Controls</strong>
        </div>
        <button id="vn-diag-toggle-bgm" style="background: ${isBgmActive ? "linear-gradient(135deg, #059669, #10b981)" : "#334155"}; border: none; color: #fff; border-radius: 6px; padding: 4px 12px; font-size: 11px; font-weight: 700; cursor: pointer;">
          ${isBgmActive ? "🟢 BGM: Playing (Click to Pause)" : "▶ BGM: Turn On / Play"}
        </button>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; font-size: 11px;">
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <label style="color: #94a3b8; font-weight: 600;">BGM Volume</label>
            <span id="vn-diag-bgm-val" style="color: #34d399; font-weight: 700;">${bgmVol}%</span>
          </div>
          <input type="range" id="vn-diag-bgm-slider" min="0" max="100" value="${bgmVol}" style="width: 100%; cursor: pointer;" />
        </div>
        <div>
          <label style="color: #94a3b8; font-weight: 600; display: block; margin-bottom: 4px;">Active Track / Scene Ambience</label>
          <span id="vn-diag-curr-track" style="color: #38bdf8; font-weight: 600; font-family: monospace;">${currTrack}</span>
        </div>
      </div>
    `;
    this.root.appendChild(audioCard);

    const toggleBgmBtn = audioCard.querySelector("#vn-diag-toggle-bgm") as HTMLButtonElement | null;
    const bgmSlider = audioCard.querySelector("#vn-diag-bgm-slider") as HTMLInputElement | null;
    const bgmVal = audioCard.querySelector("#vn-diag-bgm-val") as HTMLElement | null;

    toggleBgmBtn?.addEventListener("click", () => {
      if (this.audioEngine) {
        const active = this.audioEngine.toggleBgm();
        toggleBgmBtn.innerHTML = active ? "🟢 BGM: Playing (Click to Pause)" : "▶ BGM: Turn On / Play";
        toggleBgmBtn.style.background = active ? "linear-gradient(135deg, #059669, #10b981)" : "#334155";
        const trackEl = audioCard.querySelector("#vn-diag-curr-track") as HTMLElement | null;
        if (trackEl) trackEl.textContent = this.audioEngine.getCurrentBgm() || "peaceful";
      }
    });

    bgmSlider?.addEventListener("input", () => {
      const vol = Number(bgmSlider.value);
      if (bgmVal) bgmVal.textContent = `${vol}%`;
      this.audioEngine?.setBgmVolume(vol / 100);
    });

    // Dedicated Roleplay Prop & UI Templates Card
    const propsCard = document.createElement("div");
    propsCard.style.cssText = "background: #0f172a; border: 1px solid #38bdf8; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 8px;";
    propsCard.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <strong style="color: #38bdf8; font-size: 13px;">🎭 Roleplay Prop & UI Templates</strong>
        <span style="font-size: 10px; background: rgba(56, 189, 248, 0.2); border: 1px solid #0284c7; color: #7dd3fc; padding: 2px 6px; border-radius: 4px;">HTML/CSS Props</span>
      </div>
      <p style="margin: 0; font-size: 11px; color: #94a3b8;">
        Inspect game-style prop widgets and copy standard tags for prose & Director notes:
      </p>
      <div id="vn-diag-prop-tabs" style="display: flex; gap: 4px; flex-wrap: wrap;">
        ${PROP_TEMPLATES_CATALOG.map((p, idx) => `
          <button class="vn-diag-prop-btn" data-prop-id="${p.id}" style="padding: 3px 8px; font-size: 11px; background: ${idx === 0 ? "#0284c7" : "#1e293b"}; border: 1px solid ${idx === 0 ? "#38bdf8" : "#475569"}; color: #fff; border-radius: 4px; cursor: pointer;">
            ${p.icon} ${p.name}
          </button>
        `).join("")}
      </div>
      <div style="background: #020617; border: 1px solid #334155; border-radius: 8px; padding: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span id="vn-diag-prop-desc" style="font-size: 10px; color: #94a3b8;">${PROP_TEMPLATES_CATALOG[0]?.description}</span>
          <button id="vn-diag-copy-prop-btn" style="padding: 2px 8px; font-size: 10px; font-weight: 700; background: #1e293b; border: 1px solid #38bdf8; color: #38bdf8; border-radius: 4px; cursor: pointer;">
            📋 Copy Tag
          </button>
        </div>
        <div id="vn-diag-prop-preview" style="min-height: 60px;">
          ${formatDialogueHtml(PROP_TEMPLATES_CATALOG[0]?.sampleTag || "").html}
        </div>
      </div>
    `;
    this.root.appendChild(propsCard);

    let activeProp = PROP_TEMPLATES_CATALOG[0]!;
    const diagDesc = propsCard.querySelector("#vn-diag-prop-desc") as HTMLElement | null;
    const diagPreview = propsCard.querySelector("#vn-diag-prop-preview") as HTMLElement | null;
    const diagCopyBtn = propsCard.querySelector("#vn-diag-copy-prop-btn") as HTMLButtonElement | null;

    propsCard.querySelectorAll(".vn-diag-prop-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const propId = btn.getAttribute("data-prop-id");
        const found = PROP_TEMPLATES_CATALOG.find((p) => p.id === propId);
        if (found) {
          activeProp = found;
          if (diagDesc) diagDesc.textContent = found.description;
          if (diagPreview) diagPreview.innerHTML = formatDialogueHtml(found.sampleTag).html;
          propsCard.querySelectorAll(".vn-diag-prop-btn").forEach((b) => {
            (b as HTMLElement).style.background = b === btn ? "#0284c7" : "#1e293b";
            (b as HTMLElement).style.borderColor = b === btn ? "#38bdf8" : "#475569";
          });
        }
      });
    });

    diagCopyBtn?.addEventListener("click", async () => {
      await navigator.clipboard.writeText(activeProp.sampleTag).catch(() => {});
      if (diagCopyBtn) {
        const orig = diagCopyBtn.textContent;
        diagCopyBtn.textContent = "✓ Copied Tag!";
        diagCopyBtn.style.borderColor = "#10b981";
        setTimeout(() => {
          diagCopyBtn.textContent = orig;
          diagCopyBtn.style.borderColor = "#38bdf8";
        }, 1500);
      }
    });

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

  public destroy(): void {
    if (this.unsubscribeBus) {
      this.unsubscribeBus();
      this.unsubscribeBus = undefined;
    }
  }
}
