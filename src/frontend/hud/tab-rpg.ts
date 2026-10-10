import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import type { LedgerData, AssetManifest, StatRulesSettings, SkillTreeNode, SkillTreeCategory, PlayerProgression } from "../../shared/types.js";
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

export function parseSkillTreesFromPrompt(prompt: string): SkillTreeCategory[] {
  if (!prompt) return [];
  const categories: SkillTreeCategory[] = [];
  const treeRegex = /(?:【Tree:\s*([^】]+)】|\[Tree:\s*([^\]]+)\]|##?\s*Tree:\s*([^\n]+))/gi;

  const matches: Array<{ name: string; index: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = treeRegex.exec(prompt)) !== null) {
    const name = (m[1] || m[2] || m[3] || "").trim();
    if (name) matches.push({ name, index: m.index });
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i]!;
    const nextIndex = i + 1 < matches.length ? matches[i + 1]!.index : prompt.length;
    const chunk = prompt.slice(current.index, nextIndex);
    const nodes: SkillTreeNode[] = [];

    const lines = chunk.split("\n");
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith("- ")) continue;
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;

      const skillName = line.slice(2, colonIdx).trim();
      const paramsStr = line.slice(colonIdx + 1).trim();
      const parts = paramsStr.split("|").map((p) => p.trim());

      let tier = 1;
      let cost = 1;
      let requires: string[] = [];
      let type: "active" | "passive" = "active";
      let cd = 0;
      let cost_res: Record<string, number> = {};
      let formula = "";
      let desc = "";

      for (const part of parts) {
        const eqIdx = part.indexOf("=");
        if (eqIdx === -1) continue;
        const key = part.slice(0, eqIdx).trim().toLowerCase();
        const val = part.slice(eqIdx + 1).trim();

        if (key === "tier") tier = parseInt(val, 10) || 1;
        else if (key === "cost") cost = parseInt(val, 10) || 1;
        else if (key === "requires") {
          const clean = val.replace(/^\[|\]$/g, "").trim();
          requires = clean ? clean.split(",").map((s) => s.trim()).filter(Boolean) : [];
        } else if (key === "type") {
          type = val.toLowerCase() === "passive" ? "passive" : "active";
        } else if (key === "cd") {
          cd = parseInt(val, 10) || 0;
        } else if (key === "cost_res") {
          try {
            const jsonStr = val.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
            cost_res = JSON.parse(jsonStr);
          } catch {
            const pair = val.replace(/[{}]/g, "").split(":");
            if (pair.length === 2) cost_res[pair[0]!.trim()] = parseInt(pair[1]!, 10) || 0;
          }
        } else if (key === "formula") {
          formula = val;
        } else if (key === "desc") {
          desc = val;
        }
      }

      nodes.push({
        id: skillName.toLowerCase().replace(/\s+/g, "_"),
        name: skillName,
        tree: current.name,
        tier,
        cost,
        requires,
        type,
        cd,
        cost_res,
        formula,
        desc,
      });
    }

    if (nodes.length > 0) {
      categories.push({
        name: current.name,
        nodes,
      });
    }
  }

  return categories;
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
  public progression: PlayerProgression = {
    level: 1,
    exp: 0,
    maxExp: 100,
    skillPoints: 3,
    unlockedSkills: ["Strike"],
    cooldowns: {},
  };
  private selectedTreeTab = "";

  constructor(
    ctx?: SpindleFrontendContext,
    onAction?: (actionText: string) => void
  ) {
    this.ctx = ctx;
    this.onAction = onAction;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-rpg";
  }

  public addExp(amount: number): void {
    this.progression.exp += amount;
    while (this.progression.exp >= this.progression.maxExp) {
      this.progression.exp -= this.progression.maxExp;
      this.progression.level += 1;
      this.progression.skillPoints += 1;
      this.progression.maxExp = Math.round(this.progression.maxExp * 1.5);
    }
  }

  public levelUp(): void {
    this.progression.level += 1;
    this.progression.skillPoints += 1;
  }

  public unlockSkill(node: SkillTreeNode): boolean {
    if (this.progression.unlockedSkills.includes(node.name)) return false;
    if (this.progression.skillPoints < node.cost) return false;
    const hasPrereqs = (node.requires || []).every((req) => this.progression.unlockedSkills.includes(req));
    if (!hasPrereqs) return false;

    this.progression.skillPoints -= node.cost;
    this.progression.unlockedSkills.push(node.name);
    return true;
  }

  public tickCooldowns(): void {
    for (const key of Object.keys(this.progression.cooldowns)) {
      if ((this.progression.cooldowns[key] || 0) > 0) {
        this.progression.cooldowns[key]! -= 1;
      }
    }
  }

  public triggerSkillAction(skill: SkillTreeNode, currentActor: any): string {
    if (skill.type !== "active") return "";
    const cd = this.progression.cooldowns[skill.name] || 0;
    if (cd > 0) return "";

    const atk = typeof currentActor?.combat?.atk === "number" ? currentActor.combat.atk : 14;
    const matk = typeof currentActor?.combat?.matk === "number" ? currentActor.combat.matk : 16;
    let dmg = Math.round(atk * 1.2);

    if (skill.formula) {
      try {
        const expr = skill.formula
          .replace(/{ATK}/gi, String(atk))
          .replace(/{MATK}/gi, String(matk))
          .replace(/[^0-9\+\-\*\/\.\(\)]/g, "");
        const evalRes = Number(Function(`return (${expr})`)());
        if (!isNaN(evalRes) && evalRes > 0) {
          dmg = Math.round(evalRes);
        }
      } catch {
        dmg = Math.round(atk * 1.2);
      }
    }

    if (skill.cd && skill.cd > 0) {
      this.progression.cooldowns[skill.name] = skill.cd;
    }

    const mpCost = skill.cost_res?.mp ?? 0;
    const actionText = `[Combat Action: ${skill.name}! Dealt ${dmg} damage. ${skill.desc ? `(${skill.desc}) ` : ""}(Cost: ${mpCost} MP | CD: ${skill.cd || 0} turns)]`;
    if (this.onAction) {
      this.onAction(actionText);
    }
    return actionText;
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

    // ── 3. Level Progression & Skill Points Card ──
    const progCard = document.createElement("div");
    progCard.style.cssText =
      "background: #0f172a; border: 1px solid #10b981; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.4);";
    const expPct = Math.min(100, Math.max(0, Math.round((this.progression.exp / this.progression.maxExp) * 100)));

    progCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <strong style="color: #34d399; font-size: 13px; display: flex; align-items: center; gap: 6px;">
            <span>⭐</span> <span>Level Progression & Skill Points</span>
          </strong>
          <span style="background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #6ee7b7; font-weight: 800; font-size: 11px; padding: 2px 8px; border-radius: 9999px;">
            Level ${this.progression.level}
          </span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="background: rgba(245, 158, 11, 0.2); border: 1px solid #f59e0b; color: #fde68a; font-weight: 700; font-size: 11px; padding: 2px 8px; border-radius: 6px;">
            ✨ Available SP: ${this.progression.skillPoints}
          </span>
          <button id="vn-rpg-add-exp-btn" style="background: #1e293b; border: 1px solid #334155; color: #6ee7b7; font-size: 10px; font-weight: 700; border-radius: 4px; padding: 3px 8px; cursor: pointer;">
            +50 EXP
          </button>
          <button id="vn-rpg-level-up-btn" style="background: linear-gradient(135deg, #059669, #10b981); border: none; color: #fff; font-size: 10px; font-weight: 800; border-radius: 4px; padding: 3px 8px; cursor: pointer;">
            ▲ Level Up
          </button>
          <button id="vn-rpg-reset-sp-btn" style="background: transparent; border: 1px solid #475569; color: #94a3b8; font-size: 10px; border-radius: 4px; padding: 3px 6px; cursor: pointer;" title="Reset SP to 5">
            Reset
          </button>
        </div>
      </div>

      <div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
          <span style="color: #94a3b8;">Experience Points</span>
          <span style="color: #6ee7b7; font-weight: 700;">${this.progression.exp} / ${this.progression.maxExp} EXP (${expPct}%)</span>
        </div>
        <div style="background: #020617; height: 8px; border-radius: 4px; overflow: hidden;">
          <div style="width: ${expPct}%; height: 100%; background: linear-gradient(90deg, #059669, #34d399); transition: width 0.3s ease;"></div>
        </div>
      </div>
    `;
    this.root.appendChild(progCard);

    progCard.querySelector("#vn-rpg-add-exp-btn")?.addEventListener("click", () => {
      this.addExp(50);
      this.render(this.currentLedger, this.currentManifest);
    });
    progCard.querySelector("#vn-rpg-level-up-btn")?.addEventListener("click", () => {
      this.levelUp();
      this.render(this.currentLedger, this.currentManifest);
    });
    progCard.querySelector("#vn-rpg-reset-sp-btn")?.addEventListener("click", () => {
      this.progression.skillPoints += 3;
      this.render(this.currentLedger, this.currentManifest);
    });

    // ── 4. Combat Action Bar (Skills, Cooldowns & Turn Resolution) ──
    const promptText = this.statRulesSettings?.rpgPrompt || DEFAULT_RPG_PROMPT;
    const categories = parseSkillTreesFromPrompt(promptText);
    const allParsedNodes = categories.flatMap((c) => c.nodes);

    const activeUnlockedNodes = allParsedNodes.filter(
      (n) => n.type === "active" && this.progression.unlockedSkills.includes(n.name)
    );

    const actionCard = document.createElement("div");
    actionCard.style.cssText =
      "background: #0f172a; border: 1px solid #f59e0b; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.4);";
    actionCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
        <strong style="color: #fbbf24; font-size: 13px; display: flex; align-items: center; gap: 6px;">
          <span>⚡</span> <span>Combat Action Bar & Turn Cooldowns</span>
        </strong>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button id="vn-rpg-tick-cd-btn" style="background: #1e293b; border: 1px solid #f59e0b; color: #fde68a; font-size: 11px; font-weight: 700; border-radius: 6px; padding: 4px 10px; cursor: pointer;">
            ⏳ Next Turn / Tick CD
          </button>
        </div>
      </div>

      <div style="display: flex; flex-wrap: wrap; gap: 8px;" id="vn-rpg-action-buttons">
        ${
          activeUnlockedNodes.length === 0
            ? `
          <div style="color: #94a3b8; font-size: 11px; font-style: italic;">
            No active skills learned yet. Unlock active skills in the skill tree below to use them in combat.
          </div>
        `
            : activeUnlockedNodes
                .map((n) => {
                  const cd = this.progression.cooldowns[n.name] || 0;
                  const isReady = cd === 0;
                  const mp = n.cost_res?.mp ?? 0;
                  return `
            <button class="vn-combat-skill-btn" data-skill-name="${n.name}" style="background: ${isReady ? "#1e293b" : "#0f172a"}; border: 1px solid ${isReady ? "#38bdf8" : "#475569"}; border-radius: 8px; padding: 8px 12px; display: flex; flex-direction: column; gap: 4px; text-align: left; cursor: ${isReady ? "pointer" : "not-allowed"}; opacity: ${isReady ? "1" : "0.6"}; transition: all 0.2s ease;">
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                <strong style="color: ${isReady ? "#f8fafc" : "#94a3b8"}; font-size: 12px;">${n.name}</strong>
                <span style="font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 4px; background: ${isReady ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}; color: ${isReady ? "#4ade80" : "#fca5a5"};">
                  ${isReady ? "⚡ READY" : `⏳ CD: ${cd}T`}
                </span>
              </div>
              <div style="font-size: 10px; color: #94a3b8; display: flex; gap: 6px;">
                ${mp > 0 ? `<span>💧 ${mp} MP</span>` : `<span>Cost: 0 MP</span>`}
                ${n.formula ? `<span>⚔️ ${n.formula}</span>` : ""}
              </div>
            </button>
          `;
                })
                .join("")
        }
      </div>
    `;
    this.root.appendChild(actionCard);

    actionCard.querySelector("#vn-rpg-tick-cd-btn")?.addEventListener("click", () => {
      this.tickCooldowns();
      this.render(this.currentLedger, this.currentManifest);
    });

    actionCard.querySelectorAll(".vn-combat-skill-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = (btn as HTMLElement).dataset.skillName || "";
        const node = activeUnlockedNodes.find((x) => x.name === name);
        if (node) {
          this.triggerSkillAction(node, currentActor);
          this.render(this.currentLedger, this.currentManifest);
        }
      });
    });

    // ── 5. Interactive Skill Tree (Prompt-Driven & Customizable) ──
    const treeCard = document.createElement("div");
    treeCard.style.cssText =
      "background: #0f172a; border: 1px solid #6366f1; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.4);";

    if (!this.selectedTreeTab && categories.length > 0) {
      this.selectedTreeTab = categories[0]!.name;
    }

    const activeCat = categories.find((c) => c.name === this.selectedTreeTab) || categories[0];

    treeCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
        <strong style="color: #a5b4fc; font-size: 13px; display: flex; align-items: center; gap: 6px;">
          <span>🌳</span> <span>Skill Trees (Prompt-Driven & Customizable)</span>
        </strong>
        <span style="font-size: 10px; color: #94a3b8;">
          Earn SP upon leveling up. Unlock prerequisites to advance.
        </span>
      </div>

      <!-- Category Tabs -->
      <div style="display: flex; gap: 6px; flex-wrap: wrap; border-bottom: 1px solid #1e293b; padding-bottom: 8px;">
        ${categories
          .map(
            (c) => `
          <button class="vn-tree-tab-btn" data-tree-name="${c.name}" style="background: ${c.name === this.selectedTreeTab ? "#4f46e5" : "#1e293b"}; color: ${c.name === this.selectedTreeTab ? "#fff" : "#94a3b8"}; border: 1px solid ${c.name === this.selectedTreeTab ? "#6366f1" : "#334155"}; border-radius: 6px; padding: 4px 12px; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.15s ease;">
            ${c.name} (${c.nodes.length})
          </button>
        `
          )
          .join("")}
      </div>

      <!-- Nodes Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px;">
        ${
          activeCat
            ? activeCat.nodes
                .map((node) => {
                  const isUnlocked = this.progression.unlockedSkills.includes(node.name);
                  const hasPrereqs = (node.requires || []).every((req) => this.progression.unlockedSkills.includes(req));
                  const canUnlock = !isUnlocked && hasPrereqs && this.progression.skillPoints >= node.cost;

                  let statusHtml = "";
                  if (isUnlocked) {
                    statusHtml = `<span style="color: #4ade80; font-size: 11px; font-weight: 800;">✓ Learned</span>`;
                  } else if (canUnlock) {
                    statusHtml = `
              <button class="vn-unlock-skill-btn" data-skill-id="${node.id}" style="background: linear-gradient(135deg, #4f46e5, #6366f1); border: none; color: #fff; font-size: 11px; font-weight: 800; border-radius: 6px; padding: 4px 12px; cursor: pointer; box-shadow: 0 2px 6px rgba(99,102,241,0.4);">
                ✨ Unlock (${node.cost} SP)
              </button>
            `;
                  } else if (!hasPrereqs) {
                    statusHtml = `<span style="color: #f87171; font-size: 10px;">🔒 Requires: [${node.requires.join(", ")}]</span>`;
                  } else {
                    statusHtml = `<span style="color: #f59e0b; font-size: 10px;">🔒 Needs ${node.cost} SP</span>`;
                  }

                  return `
            <div style="background: #1e293b; border: 1px solid ${isUnlocked ? "#10b981" : canUnlock ? "#6366f1" : "#334155"}; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <strong style="color: ${isUnlocked ? "#6ee7b7" : "#f8fafc"}; font-size: 12px;">${node.name}</strong>
                  <span style="font-size: 9px; padding: 1px 5px; border-radius: 4px; background: ${node.type === "active" ? "rgba(56,189,248,0.2)" : "rgba(168,85,247,0.2)"}; color: ${node.type === "active" ? "#7dd3fc" : "#d8b4fe"}; font-weight: 700;">
                    ${node.type.toUpperCase()}
                  </span>
                </div>
                <span style="font-size: 10px; color: #94a3b8; font-weight: 600;">T${node.tier}</span>
              </div>
              <div style="font-size: 11px; color: #cbd5e1; line-height: 1.3;">
                ${node.desc || "A specialized skill."}
              </div>
              ${node.formula ? `<div style="font-size: 10px; color: #f59e0b;">Formula: ${node.formula}</div>` : ""}
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #334155; padding-top: 6px; margin-top: 2px;">
                <span style="font-size: 10px; color: #94a3b8;">Cost: ${node.cost} SP</span>
                <div>${statusHtml}</div>
              </div>
            </div>
          `;
                })
                .join("")
            : `<div style="color: #94a3b8; font-size: 11px;">No skills in this category.</div>`
        }
      </div>
    `;
    this.root.appendChild(treeCard);

    treeCard.querySelectorAll(".vn-tree-tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.selectedTreeTab = (btn as HTMLElement).dataset.treeName || "";
        this.render(this.currentLedger, this.currentManifest);
      });
    });

    treeCard.querySelectorAll(".vn-unlock-skill-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = (btn as HTMLElement).dataset.skillId || "";
        const node = activeCat?.nodes.find((n) => n.id === id);
        if (node && this.unlockSkill(node)) {
          this.render(this.currentLedger, this.currentManifest);
        }
      });
    });

    // ── 6. Interactive TTRPG Dice Roller Widget ──
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

      this.render(this.currentLedger, this.currentManifest);

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
