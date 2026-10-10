import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import type { LedgerData, AssetManifest, StatRulesSettings } from "../../shared/types.js";
import { DEFAULT_RPG_PROMPT } from "../../backend/storage.js";

export interface DiceRollResult {
  dice: string;
  sides: number;
  roll: number;
  modifier: number;
  total: number;
  isNat20: boolean;
  isNat1: boolean;
  timestamp: string;
}

export class RpgTab {
  public root: HTMLElement;
  private ctx?: SpindleFrontendContext;
  private onAction?: (actionText: string) => void;
  private currentLedger: LedgerData = {};
  private currentManifest?: AssetManifest;
  private selectedActorId = "user";
  private selectedSides = 20;
  private modifier = 0;
  private lastRoll: DiceRollResult | null = null;
  private statRulesSettings: StatRulesSettings | null = null;

  constructor(
    ctx?: SpindleFrontendContext,
    onAction?: (actionText: string) => void
  ) {
    this.ctx = ctx;
    this.onAction = onAction;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-rpg";
  }

  public setStatRulesSettings(settings: StatRulesSettings): void {
    this.statRulesSettings = settings;
    const promptInput = this.root.querySelector("#vn-rpg-prompt-input") as HTMLTextAreaElement | null;
    if (promptInput) {
      promptInput.value = settings.rpgPrompt || DEFAULT_RPG_PROMPT;
    }
  }

  public render(ledger: LedgerData, manifest?: AssetManifest): void {
    this.currentLedger = ledger;
    this.currentManifest = manifest;
    this.root.innerHTML = "";
    this.root.style.cssText =
      "display: flex; flex-direction: column; gap: 14px; height: 100%; color: #f1f5f9; font-family: system-ui, -apple-system, sans-serif; overflow-y: auto; padding-right: 4px;";

    const actors = ledger.actors || {};
    const actorKeys = Object.keys(actors);
    if (!actorKeys.includes(this.selectedActorId) && actorKeys.length > 0) {
      this.selectedActorId = actorKeys.includes("user") ? "user" : actorKeys[0]!;
    }
    const currentActor = actors[this.selectedActorId] || {};
    const combat = currentActor.combat || {};

    // ── 1. Header & Actor Selector ──
    const header = document.createElement("div");
    header.style.cssText =
      "display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; border-bottom: 1px solid #334155; padding-bottom: 10px;";
    header.innerHTML = `
      <div>
        <h3 style="margin: 0; font-size: 15px; color: #fff; display: flex; align-items: center; gap: 6px;">
          <span>⚔️</span> <span>RPG Rules, Vitals & Dice Engine</span>
        </h3>
        <p style="margin: 2px 0 0 0; font-size: 11px; color: #94a3b8;">
          Combat matrix, skill proficiencies, interactive TTRPG dice roller, and prompt directives.
        </p>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 11px; color: #94a3b8;">Actor:</span>
        <select id="vn-rpg-actor-select" style="background: #1e293b; border: 1px solid #475569; color: #38bdf8; font-weight: 600; border-radius: 6px; padding: 4px 10px; font-size: 12px; outline: none; cursor: pointer;">
          ${actorKeys.map((id) => `<option value="${id}" ${id === this.selectedActorId ? "selected" : ""}>${actors[id]?.name || id} ${id === "user" ? "(You)" : ""}</option>`).join("")}
        </select>
      </div>
    `;
    this.root.appendChild(header);

    header.querySelector("#vn-rpg-actor-select")?.addEventListener("change", (e) => {
      this.selectedActorId = (e.target as HTMLSelectElement).value;
      this.render(this.currentLedger, this.currentManifest);
    });

    // ── 2. Combat Vitals & Aptitudes Dashboard ──
    const vitalsCard = document.createElement("div");
    vitalsCard.style.cssText =
      "background: #0f172a; border: 1px solid #3b82f6; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.4);";

    const hpNum = typeof combat.hp === "number" ? combat.hp : parseInt(String(combat.hp || "100"), 10) || 100;
    const mpNum = typeof combat.mp === "number" ? combat.mp : parseInt(String(combat.mp || "50"), 10) || 50;
    const lv = combat.lv || combat.tier || 1;
    const tier = combat.tier || "Standard";

    vitalsCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong style="color: #60a5fa; font-size: 13px; display: flex; align-items: center; gap: 6px;">
          <span>🛡️</span> <span>${currentActor.name || this.selectedActorId} — Vitals & Attributes</span>
        </strong>
        <span style="font-size: 11px; background: rgba(59, 130, 246, 0.2); border: 1px solid #3b82f6; color: #93c5fd; padding: 2px 8px; border-radius: 4px; font-weight: 700;">
          Level ${lv} • Tier ${tier}
        </span>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;">
        <!-- Health Gauge -->
        <div style="background: #1e293b; padding: 8px 12px; border-radius: 8px; border: 1px solid #334155;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
            <span style="color: #f87171; font-weight: 700;">❤️ Health (HP)</span>
            <span style="color: #fca5a5; font-weight: 700;">${hpNum} / 100</span>
          </div>
          <div style="background: #020617; height: 8px; border-radius: 4px; overflow: hidden;">
            <div style="width: ${Math.min(100, Math.max(0, hpNum))}%; height: 100%; background: linear-gradient(90deg, #ef4444, #f87171); transition: width 0.3s ease;"></div>
          </div>
        </div>

        <!-- Mana / Energy Gauge -->
        <div style="background: #1e293b; padding: 8px 12px; border-radius: 8px; border: 1px solid #334155;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
            <span style="color: #38bdf8; font-weight: 700;">💧 Energy / Mana (MP)</span>
            <span style="color: #7dd3fc; font-weight: 700;">${mpNum} / 100</span>
          </div>
          <div style="background: #020617; height: 8px; border-radius: 4px; overflow: hidden;">
            <div style="width: ${Math.min(100, Math.max(0, mpNum))}%; height: 100%; background: linear-gradient(90deg, #0284c7, #38bdf8); transition: width 0.3s ease;"></div>
          </div>
        </div>
      </div>

      <!-- Skills, Techniques & Proficiencies -->
      <div style="border-top: 1px solid #1e293b; padding-top: 8px; display: flex; flex-direction: column; gap: 4px;">
        <span style="font-size: 10px; color: #94a3b8; font-weight: 700;">SKILLS & COMBAT APTITUDES</span>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${this.renderAptitudes(currentActor)}
        </div>
      </div>
    `;
    this.root.appendChild(vitalsCard);

    // ── 3. Interactive TTRPG Dice Roller Widget ──
    const diceCard = document.createElement("div");
    diceCard.style.cssText =
      "background: #0f172a; border: 1px solid #8b5cf6; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.4);";

    diceCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong style="color: #c084fc; font-size: 13px; display: flex; align-items: center; gap: 6px;">
          <span>🎲</span> <span>Tabletop RPG Dice Roller</span>
        </strong>
        <span style="font-size: 10px; color: #94a3b8;">D4 to D100 with Critical Success Checks</span>
      </div>

      <!-- Dice Type Selector -->
      <div style="display: flex; gap: 6px; flex-wrap: wrap;" id="vn-dice-buttons">
        ${[4, 6, 8, 10, 12, 20, 100]
          .map(
            (s) => `
          <button class="vn-dice-btn" data-sides="${s}" style="padding: 5px 12px; font-size: 11px; font-weight: 700; border-radius: 6px; cursor: pointer; border: 1px solid ${s === this.selectedSides ? "#a855f7" : "#475569"}; background: ${s === this.selectedSides ? "#7e22ce" : "#1e293b"}; color: #fff; transition: all 0.15s ease;">
            D${s}
          </button>
        `
          )
          .join("")}
      </div>

      <!-- Modifier & Roll Trigger Bar -->
      <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 11px; color: #94a3b8;">Modifier:</span>
          <input id="vn-dice-mod" type="number" value="${this.modifier}" style="width: 55px; background: #020617; border: 1px solid #475569; color: #f8fafc; border-radius: 4px; padding: 4px 6px; font-size: 12px; text-align: center; outline: none;" />
        </div>
        <button id="vn-roll-dice-btn" style="flex: 1; min-width: 120px; background: linear-gradient(135deg, #8b5cf6, #ec4899); border: none; color: #fff; font-weight: 800; font-size: 12px; padding: 8px 16px; border-radius: 8px; cursor: pointer; box-shadow: 0 2px 10px rgba(139,92,246,0.4); transition: transform 0.15s;">
          🎲 Roll D${this.selectedSides}${this.modifier !== 0 ? (this.modifier > 0 ? `+${this.modifier}` : `${this.modifier}`) : ""}
        </button>
      </div>

      <!-- Roll Result Display Area -->
      <div id="vn-dice-result-box" style="background: #020617; border: 1px solid #334155; border-radius: 8px; padding: 12px; min-height: 50px; display: flex; justify-content: space-between; align-items: center;">
        ${this.renderDiceResult()}
      </div>
    `;
    this.root.appendChild(diceCard);

    // Dice Button Handlers
    diceCard.querySelectorAll(".vn-dice-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.selectedSides = parseInt(btn.getAttribute("data-sides") || "20", 10);
        diceCard.querySelectorAll(".vn-dice-btn").forEach((b) => {
          const active = b === btn;
          (b as HTMLElement).style.background = active ? "#7e22ce" : "#1e293b";
          (b as HTMLElement).style.borderColor = active ? "#a855f7" : "#475569";
        });
        const rollBtn = diceCard.querySelector("#vn-roll-dice-btn") as HTMLButtonElement | null;
        if (rollBtn) {
          rollBtn.textContent = `🎲 Roll D${this.selectedSides}${this.modifier !== 0 ? (this.modifier > 0 ? `+${this.modifier}` : `${this.modifier}`) : ""}`;
        }
      });
    });

    const modInput = diceCard.querySelector("#vn-dice-mod") as HTMLInputElement | null;
    modInput?.addEventListener("input", () => {
      this.modifier = parseInt(modInput.value, 10) || 0;
      const rollBtn = diceCard.querySelector("#vn-roll-dice-btn") as HTMLButtonElement | null;
      if (rollBtn) {
        rollBtn.textContent = `🎲 Roll D${this.selectedSides}${this.modifier !== 0 ? (this.modifier > 0 ? `+${this.modifier}` : `${this.modifier}`) : ""}`;
      }
    });

    diceCard.querySelector("#vn-roll-dice-btn")?.addEventListener("click", () => {
      this.executeDiceRoll();
    });

    diceCard.querySelector("#vn-inject-dice-btn")?.addEventListener("click", () => {
      if (this.lastRoll && this.onAction) {
        const text = `[Dice Roll: d${this.lastRoll.sides}${this.lastRoll.modifier ? (this.lastRoll.modifier > 0 ? `+${this.lastRoll.modifier}` : `${this.lastRoll.modifier}`) : ""} = ${this.lastRoll.total}${this.lastRoll.isNat20 ? " (Critical Success!)" : this.lastRoll.isNat1 ? " (Critical Fumble!)" : ""}]`;
        this.onAction(text);
      }
    });

    // ── 4. Dedicated RPG Rules & Combat Prompt Editor ──
    const promptCard = document.createElement("div");
    promptCard.style.cssText =
      "background: #0f172a; border: 1px solid #10b981; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.4);";

    promptCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong style="color: #34d399; font-size: 13px; display: flex; align-items: center; gap: 6px;">
          <span>📜</span> <span>RPG Stat Rules & Combat Prompt Directive</span>
        </strong>
        <span style="font-size: 10px; background: rgba(16,185,129,0.2); border: 1px solid #10b981; color: #6ee7b7; padding: 2px 8px; border-radius: 4px; font-weight: 700;">
          Injected in Director & Turn Evaluator
        </span>
      </div>
      <p style="margin: 0; font-size: 11px; color: #94a3b8;">
        Define rules, skills resolution, and combat directives for the simulation engine. Updates automatically persist across chats:
      </p>
      <textarea id="vn-rpg-prompt-input" style="width: 100%; height: 130px; background: #020617; color: #f8fafc; border: 1px solid #334155; border-radius: 6px; font-family: monospace; font-size: 11px; padding: 8px; box-sizing: border-box; resize: vertical; line-height: 1.5; outline: none;"></textarea>
      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 4px;">
        <button id="vn-reset-rpg-prompt-btn" style="background: transparent; border: 1px solid #475569; color: #94a3b8; border-radius: 4px; padding: 4px 10px; font-size: 11px; cursor: pointer;">
          Reset to Default
        </button>
        <button id="vn-save-rpg-prompt-btn" style="background: linear-gradient(135deg, #059669, #10b981); color: #fff; border: none; border-radius: 6px; padding: 6px 16px; font-size: 11px; font-weight: 700; cursor: pointer; box-shadow: 0 2px 8px rgba(16,185,129,0.4);">
          💾 Save RPG Rules
        </button>
      </div>
    `;
    this.root.appendChild(promptCard);

    const promptInput = promptCard.querySelector("#vn-rpg-prompt-input") as HTMLTextAreaElement | null;
    const saveBtn = promptCard.querySelector("#vn-save-rpg-prompt-btn") as HTMLButtonElement | null;
    const resetBtn = promptCard.querySelector("#vn-reset-rpg-prompt-btn") as HTMLButtonElement | null;

    if (promptInput) {
      promptInput.value = this.statRulesSettings?.rpgPrompt || DEFAULT_RPG_PROMPT;
    }

    resetBtn?.addEventListener("click", () => {
      if (promptInput) {
        promptInput.value = DEFAULT_RPG_PROMPT;
      }
    });

    saveBtn?.addEventListener("click", () => {
      const newPrompt = promptInput?.value || "";
      const updated: StatRulesSettings = {
        mode: this.statRulesSettings?.mode || "mvu_quiet",
        statRules: this.statRulesSettings?.statRules || "",
        ledgerPrompt: this.statRulesSettings?.ledgerPrompt || "",
        enabled: this.statRulesSettings?.enabled !== false,
        rpgPrompt: newPrompt,
      };
      this.statRulesSettings = updated;
      this.ctx?.sendToBackend?.({
        type: "vn_save_stat_rules_settings",
        settings: updated,
      });

      if (saveBtn) {
        const orig = saveBtn.textContent;
        saveBtn.textContent = "✓ Saved & Injected!";
        setTimeout(() => {
          saveBtn.textContent = orig;
        }, 1500);
      }
    });
  }

  private renderAptitudes(actor: any): string {
    const apts: string[] = [];
    if (actor.skills && Array.isArray(actor.skills)) {
      apts.push(...actor.skills);
    }
    if (actor.combat?.skills && Array.isArray(actor.combat.skills)) {
      apts.push(...actor.combat.skills);
    }
    if (actor.combat?.techniques && Array.isArray(actor.combat.techniques)) {
      apts.push(...actor.combat.techniques);
    }
    if (actor.combat?.mastery) {
      apts.push(String(actor.combat.mastery));
    }

    if (apts.length === 0) {
      return `<span style="font-size: 11px; color: #64748b; font-style: italic;">No specific skills recorded for this actor.</span>`;
    }

    return apts
      .map(
        (a) => `
      <span style="font-size: 11px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.4); color: #93c5fd; padding: 2px 8px; border-radius: 4px;">
        ⚔️ ${a}
      </span>
    `
      )
      .join("");
  }

  private executeDiceRoll(): void {
    const sides = this.selectedSides;
    const roll = Math.floor(Math.random() * sides) + 1;
    const total = roll + this.modifier;
    const isNat20 = sides === 20 && roll === 20;
    const isNat1 = sides === 20 && roll === 1;

    this.lastRoll = {
      dice: `D${sides}`,
      sides,
      roll,
      modifier: this.modifier,
      total,
      isNat20,
      isNat1,
      timestamp: new Date().toLocaleTimeString(),
    };

    const resultBox = this.root.querySelector("#vn-dice-result-box");
    if (resultBox) {
      resultBox.innerHTML = this.renderDiceResult();
      resultBox.querySelector("#vn-inject-dice-btn")?.addEventListener("click", () => {
        if (this.lastRoll && this.onAction) {
          const text = `[Dice Roll: d${this.lastRoll.sides}${this.lastRoll.modifier ? (this.lastRoll.modifier > 0 ? `+${this.lastRoll.modifier}` : `${this.lastRoll.modifier}`) : ""} = ${this.lastRoll.total}${this.lastRoll.isNat20 ? " (Critical Success!)" : this.lastRoll.isNat1 ? " (Critical Fumble!)" : ""}]`;
          this.onAction(text);
        }
      });
    }
  }

  private renderDiceResult(): string {
    if (!this.lastRoll) {
      return `
        <span style="color: #64748b; font-size: 12px; font-style: italic;">No dice rolled yet. Select dice and click Roll!</span>
        <span></span>
      `;
    }

    const { sides, roll, modifier, total, isNat20, isNat1 } = this.lastRoll;
    let badge = "";
    if (isNat20) {
      badge = `<span style="background: rgba(234, 179, 8, 0.2); border: 1px solid #eab308; color: #fde047; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 800;">✨ NATURAL 20!</span>`;
    } else if (isNat1) {
      badge = `<span style="background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #fca5a5; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 800;">💀 NATURAL 1!</span>`;
    }

    return `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 24px; font-weight: 900; color: ${isNat20 ? "#ffd700" : isNat1 ? "#f87171" : "#38bdf8"};">
          ${total}
        </span>
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <span style="font-size: 11px; color: #cbd5e1;">
            Rolled <strong>${roll}</strong> on d${sides} ${modifier ? `${modifier > 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`}` : ""}
          </span>
          <div>${badge}</div>
        </div>
      </div>
      <button id="vn-inject-dice-btn" style="background: #1e293b; border: 1px solid #8b5cf6; color: #c084fc; font-weight: 700; border-radius: 6px; padding: 5px 12px; font-size: 11px; cursor: pointer; transition: all 0.2s;">
        ⚡ Use in Action
      </button>
    `;
  }
}
