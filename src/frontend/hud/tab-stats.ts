import type { LedgerData, ActorDossier } from "../../shared/types.js";

export class StatsTab {
  public root: HTMLElement;
  private selectedActorId: string = "user";
  private selectedTargetId: string = "user";

  constructor() {
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-stats";
  }

  public render(ledger: LedgerData): void {
    this.root.innerHTML = "";
    const actors: Record<string, ActorDossier> = { ...(ledger.actors || {}) };

    // Supplement from roster if actors not yet in actors dict
    if (ledger.roster && Array.isArray(ledger.roster)) {
      for (const r of ledger.roster) {
        if (r.id && !actors[r.id]) {
          actors[r.id] = {
            id: r.id,
            name: r.name || r.id,
            profile: { public_roles: [r.status || "Resident"] },
          };
        }
      }
    }

    const actorIds = Object.keys(actors);
    if (actorIds.length === 0) {
      this.root.innerHTML = `<div class="vn-muted" style="padding: 32px; text-align: center;">No actor dossiers recorded.</div>`;
      return;
    }

    // Default to first actor that has stats or relations if user has neither, or keep current
    if (!actors[this.selectedActorId]) {
      // Find one with stats or relations, otherwise first
      const withStats = actorIds.find(id => actors[id]?.stats || (actors[id]?.relations && Object.keys(actors[id]!.relations!).length > 0));
      this.selectedActorId = withStats || actorIds[0]!;
    }

    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div>
          <h3 style="margin:0; font-size:15px; color:#f8fafc; display:flex; align-items:center; gap:6px;">
            <span>📊</span> <span>Status, Passions & 21-Stat Ledger Matrix</span>
          </h3>
          <p class="vn-muted" style="margin:2px 0 0 0; font-size:11px;">
            Comprehensive emotional equilibrium, psychological friction, RPG vitals, and relational dynamics.
          </p>
        </div>
      </div>
    `;
    this.root.appendChild(header);

    // Actor Selector Ribbon
    const controls = document.createElement("div");
    controls.style.cssText = "display: flex; gap: 10px; margin-bottom: 14px; align-items: center; flex-wrap: wrap; background: #1e293b; padding: 8px 12px; border-radius: 8px; border: 1px solid #334155;";
    controls.innerHTML = `
      <label style="font-size: 12px; color: #94a3b8; font-weight:600;">Inspect Actor:</label>
      <select id="vn-stats-actor-select" style="background: #0f172a; color: #f8fafc; border: 1px solid #475569; border-radius: 6px; padding: 4px 10px; font-size: 12px;">
        ${actorIds.map((id) => {
          const a = actors[id]!;
          const label = id.toLowerCase() === "user" ? "Player (You)" : a.name || id;
          const hasMatrix = a.stats ? " [21-Stat]" : "";
          return `<option value="${id}" ${id === this.selectedActorId ? "selected" : ""}>${label}${hasMatrix}</option>`;
        }).join("")}
      </select>
    `;
    this.root.appendChild(controls);

    const actorSelect = controls.querySelector("#vn-stats-actor-select") as HTMLSelectElement;
    actorSelect.addEventListener("change", () => {
      this.selectedActorId = actorSelect.value;
      this.render(ledger);
    });

    const actor = actors[this.selectedActorId]!;
    const statsMatrix = (actor.stats as Record<string, number | undefined>) || {};
    const combat = (actor.combat as Record<string, any>) || {};

    // 1. RPG Vitals (HP / MP / Attributes)
    if (combat && (combat.hp || combat.pwr || combat.tier)) {
      const vitalsSection = document.createElement("div");
      vitalsSection.className = "vn-section";
      vitalsSection.innerHTML = `<h4>⚔️ Vitals & Attributes</h4>`;

      const vBox = document.createElement("div");
      vBox.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; font-size: 12px;";

      // Parse HP / MP percentages if in "X/Y" format
      const parseRatio = (val: any) => {
        if (typeof val === "string" && val.includes("/")) {
          const [cur, max] = val.split("/").map(Number);
          return max && max > 0 ? Math.max(0, Math.min(100, (cur / max) * 100)) : 100;
        }
        return 100;
      };

      const hpPct = parseRatio(combat.hp);
      const mpPct = parseRatio(combat.mp);

      vBox.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:11px; color:#94a3b8;">
          <span>Tier ${combat.tier ?? 1} | Level ${combat.lv ?? 1}</span>
          <span>EXP: ${combat.exp ?? "0/100"}</span>
        </div>

        <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:10px;">
          <div>
            <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:2px;">
              <span style="color:#f87171; font-weight:700;">HP</span>
              <span style="color:#cbd5e1;">${combat.hp ?? "100/100"}</span>
            </div>
            <div style="background:#0f172a; border-radius:4px; height:8px; overflow:hidden; border:1px solid #334155;">
              <div style="background:linear-gradient(90deg, #ef4444, #f87171); width:${hpPct}%; height:100%;"></div>
            </div>
          </div>

          <div>
            <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:2px;">
              <span style="color:#60a5fa; font-weight:700;">MP</span>
              <span style="color:#cbd5e1;">${combat.mp ?? "50/50"}</span>
            </div>
            <div style="background:#0f172a; border-radius:4px; height:8px; overflow:hidden; border:1px solid #334155;">
              <div style="background:linear-gradient(90deg, #3b82f6, #60a5fa); width:${mpPct}%; height:100%;"></div>
            </div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(70px, 1fr)); gap:6px; text-align:center;">
          <div style="background:#0f172a; padding:4px; border-radius:4px; border:1px solid #334155;"><span style="color:#94a3b8; font-size:10px;">PWR</span><br/><strong style="color:#f8fafc;">${combat.pwr ?? "-"}</strong></div>
          <div style="background:#0f172a; padding:4px; border-radius:4px; border:1px solid #334155;"><span style="color:#94a3b8; font-size:10px;">AGI</span><br/><strong style="color:#f8fafc;">${combat.agi ?? "-"}</strong></div>
          <div style="background:#0f172a; padding:4px; border-radius:4px; border:1px solid #334155;"><span style="color:#94a3b8; font-size:10px;">INT</span><br/><strong style="color:#f8fafc;">${combat.int ?? "-"}</strong></div>
          <div style="background:#0f172a; padding:4px; border-radius:4px; border:1px solid #334155;"><span style="color:#94a3b8; font-size:10px;">Eff PWR</span><br/><strong style="color:#38bdf8;">${combat.eff_pwr ?? "-"}</strong></div>
          <div style="background:#0f172a; padding:4px; border-radius:4px; border:1px solid #334155;"><span style="color:#94a3b8; font-size:10px;">Eff AGI</span><br/><strong style="color:#38bdf8;">${combat.eff_agi ?? "-"}</strong></div>
        </div>
      `;
      vitalsSection.appendChild(vBox);
      this.root.appendChild(vitalsSection);
    }

    // 2. The 21-Stat Ledger Matrix (if actor has `stats`)
    const statKeys = Object.keys(statsMatrix);
    if (statKeys.length > 0) {
      const matrixSection = document.createElement("div");
      matrixSection.className = "vn-section";
      matrixSection.innerHTML = `<h4>🎲 21-Stat Engine Matrix (${statKeys.length} metrics)</h4>`;

      const matrixBox = document.createElement("div");
      matrixBox.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; gap: 10px;";

      // Groups of stats
      const groups = [
        {
          name: "Interpersonal Stance",
          color: "#818cf8",
          stats: [
            { k: "T", name: "Trust", max: 100 },
            { k: "A", name: "Affinity / Affection", max: 100 },
            { k: "R", name: "Respect", max: 100 },
            { k: "F", name: "Fear", max: 100 },
            { k: "Fam", name: "Familiarity", max: 10 },
            { k: "G", name: "Grudge", max: 100 },
          ],
        },
        {
          name: "Psychological Equilibrium",
          color: "#38bdf8",
          stats: [
            { k: "Integ", name: "Integrity", max: 100 },
            { k: "Stress", name: "Stress Level", max: 100 },
            { k: "CAU", name: "Caution", max: 100 },
            { k: "GRD", name: "Guard / Defense", max: 100 },
            { k: "PRD", name: "Pride", max: 100 },
            { k: "EMP", name: "Empathy", max: 100 },
            { k: "STB", name: "Stability", max: 100 },
            { k: "BLD", name: "Bleed / Leakage", max: 100 },
          ],
        },
        {
          name: "Behavioral Dynamics",
          color: "#f43f5e",
          stats: [
            { k: "RX", name: "Reactiveness", max: 100 },
            { k: "RC", name: "Recovery Rate", max: 100 },
            { k: "Rig", name: "Rigidity", max: 100 },
            { k: "Mask", name: "Social Facade", max: 100 },
            { k: "MIS", name: "Misperception", max: 100 },
            { k: "WV", name: "Willpower", max: 100 },
            { k: "COMP", name: "Compliance", max: 100 },
          ],
        },
      ];

      for (const grp of groups) {
        const groupEl = document.createElement("div");
        groupEl.innerHTML = `<div style="font-size:11px; font-weight:700; color:${grp.color}; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">${grp.name}</div>`;
        const grid = document.createElement("div");
        grid.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 6px;";

        for (const def of grp.stats) {
          const val = statsMatrix[def.k];
          if (val !== undefined) {
            const num = Number(val);
            const pct = Math.max(0, Math.min(100, (num / def.max) * 100));
            const card = document.createElement("div");
            card.style.cssText = "background: #0f172a; border: 1px solid #334155; border-radius: 6px; padding: 4px 8px; font-size: 11px;";
            card.innerHTML = `
              <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                <span style="color:#94a3b8;">${def.k} <span style="font-size:9px; color:#64748b;">(${def.name})</span></span>
                <strong style="color:#f8fafc;">${num}</strong>
              </div>
              <div style="background:#1e293b; border-radius:3px; height:4px; overflow:hidden;">
                <div style="background:${grp.color}; width:${pct}%; height:100%;"></div>
              </div>
            `;
            grid.appendChild(card);
          }
        }
        groupEl.appendChild(grid);
        matrixBox.appendChild(groupEl);
      }

      matrixSection.appendChild(matrixBox);
      this.root.appendChild(matrixSection);
    }

    // 3. Current Passions & Emotional Affect
    const passionsSection = document.createElement("div");
    passionsSection.className = "vn-section";
    passionsSection.innerHTML = `<h4>🔥 Current Passions & Affect</h4>`;
    const badgesContainer = document.createElement("div");
    badgesContainer.className = "vn-badges-container";

    const passions = actor.passions || {};
    const passionEntries: Array<[string, number | undefined]> = [
      ["Arousal", passions.arousal],
      ["Anger", passions.anger],
      ["Joy", passions.joy],
      ["Stress", passions.stress],
      ["Fear", passions.fear],
      ["Shame", passions.shame],
      ["Exhaustion", passions.exhaustion],
      ["Pain", passions.pain],
      ["Suspicion", passions.suspicion],
      ["Disgust", passions.disgust],
      ["Sadness", passions.sadness],
      ["Guilt", passions.guilt],
    ];

    let hasBadge = false;
    for (const [name, val] of passionEntries) {
      if (val !== undefined && val > 0) {
        hasBadge = true;
        const badge = document.createElement("div");
        const severity = val >= 70 ? "high" : val >= 40 ? "mid" : "low";
        badge.className = `vn-passion-badge vn-badge-${severity}`;
        badge.innerHTML = `<span class="vn-badge-label">${name}</span> <span class="vn-badge-val">${val}</span>`;
        badgesContainer.appendChild(badge);
      }
    }
    if (!hasBadge) {
      badgesContainer.innerHTML = `<span class="vn-muted" style="padding:4px;">Equilibrium / Baseline emotional state</span>`;
    }
    passionsSection.appendChild(badgesContainer);
    this.root.appendChild(passionsSection);

    // 4. Relationships Meter Matrix
    const rels = actor.relations || {};
    const availableTargets = Object.keys(rels);

    const relsSection = document.createElement("div");
    relsSection.className = "vn-section";

    if (availableTargets.length === 0) {
      relsSection.innerHTML = `<h4>🤝 Interpersonal Relations</h4><div class="vn-muted">No outgoing relationship edges initialized for this actor.</div>`;
      this.root.appendChild(relsSection);
    } else {
      if (!rels[this.selectedTargetId]) {
        this.selectedTargetId = availableTargets[0]!;
      }

    relsSection.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h4 style="margin: 0;">Relations Toward:</h4>
        <select id="vn-stats-target-select" style="background: #1e293b; color: #f8fafc; border: 1px solid #475569; border-radius: 6px; padding: 4px 8px; font-size: 12px;">
          ${availableTargets.map((t) => `<option value="${t}" ${t === this.selectedTargetId ? "selected" : ""}>${t.toLowerCase() === "user" ? "Player (You)" : actors[t]?.name || t}</option>`).join("")}
        </select>
      </div>
    `;

    const targetSelect = relsSection.querySelector("#vn-stats-target-select") as HTMLSelectElement;
    targetSelect.addEventListener("change", () => {
      this.selectedTargetId = targetSelect.value;
      this.render(ledger);
    });

    const activeRel = (rels[this.selectedTargetId] as Record<string, any>) || {};
    const metersContainer = document.createElement("div");
    metersContainer.className = "vn-meters-container";

    const relMeters = [
      { label: "Affinity", min: -100, max: 100, val: Number(activeRel.affinity ?? 0) },
      { label: "Trust", min: -100, max: 100, val: Number(activeRel.trust ?? 0) },
      { label: "Respect", min: -100, max: 100, val: Number(activeRel.respect ?? 0) },
      { label: "Attraction", min: -100, max: 100, val: Number(activeRel.attraction ?? 0) },
      { label: "Fear", min: 0, max: 100, val: Number(activeRel.fear ?? 0) },
      { label: "Familiarity", min: 0, max: 100, val: Number(activeRel.familiarity ?? 0) },
      { label: "Attachment", min: 0, max: 100, val: Number(activeRel.attachment ?? 0) },
      { label: "Grudge", min: 0, max: 100, val: Number(activeRel.grudge ?? 0) },
      { label: "Loyalty", min: 0, max: 100, val: Number(activeRel.loyalty ?? 0) },
      { label: "Sacrifice Willingness", min: 0, max: 100, val: Number(activeRel.sacrifice_willingness ?? 0) },
    ];

    for (const m of relMeters) {
      const pct = m.min < 0 ? Math.max(0, Math.min(100, ((m.val + 100) / 200) * 100)) : Math.max(0, Math.min(100, (m.val / m.max) * 100));
      const row = document.createElement("div");
      row.className = "vn-meter-row";
      row.innerHTML = `
        <div class="vn-meter-header"><span>${m.label}</span><span>${m.val}</span></div>
        <div class="vn-meter-bar-bg"><div class="vn-meter-bar-fill" style="width: ${pct}%"></div></div>
      `;
      metersContainer.appendChild(row);
    }

    // Betrayal Threshold & Secret/Leverage Chips
    const bThresh = activeRel.betrayal_threshold ?? "N/A";
    const extraInfo = document.createElement("div");
    extraInfo.style.cssText = "margin-top: 14px; background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px; font-size: 12px; display: flex; flex-direction: column; gap: 8px;";

    const formatChip = (item: any, color: string, badge: string) => {
      const text = typeof item === "object" ? (item.truth || item.id || JSON.stringify(item)) : String(item);
      return `<span style="display:inline-flex; align-items:center; gap:4px; background:${color}22; border:1px solid ${color}66; color:${color}; padding:2px 8px; border-radius:12px; font-size:11px; margin:2px 4px 2px 0;"><strong>${badge}</strong> ${text}</span>`;
    };

    const leverageChips = Array.isArray(activeRel.leverage) && activeRel.leverage.length > 0
      ? activeRel.leverage.map((item: any) => formatChip(item, "#f59e0b", "LEVERAGE")).join("")
      : '<span class="vn-muted">None</span>';

    const obligationChips = Array.isArray(activeRel.obligations) && activeRel.obligations.length > 0
      ? activeRel.obligations.map((item: any) => formatChip(item, "#38bdf8", "DEBT")).join("")
      : '<span class="vn-muted">None</span>';

    extraInfo.innerHTML = `
      <div style="display:flex; justify-content:space-between;">
        <span style="color: #94a3b8;">Betrayal Threshold:</span>
        <strong style="color: #fca5a5;">${bThresh}</strong>
      </div>
      <div>
        <span style="color: #94a3b8;">Shared Secrets:</span>
        <span style="color: #f8fafc;">${(activeRel.shared_secrets && activeRel.shared_secrets.length) ? activeRel.shared_secrets.join(", ") : "None"}</span>
      </div>
      <div>
        <div style="color: #94a3b8; margin-bottom: 4px;">Held Leverage:</div>
        <div>${leverageChips}</div>
      </div>
      <div>
        <div style="color: #94a3b8; margin-bottom: 4px;">Obligations:</div>
        <div>${obligationChips}</div>
      </div>
    `;
    metersContainer.appendChild(extraInfo);

      relsSection.appendChild(metersContainer);
      this.root.appendChild(relsSection);
    }

    // 5. Active Investigations
    const investigations = ledger.world?.investigations;
    if (investigations && Object.keys(investigations).length > 0) {
      const invSection = document.createElement("div");
      invSection.className = "vn-section";
      invSection.innerHTML = `<h4>🔍 Active Investigations</h4>`;
      const invContainer = document.createElement("div");
      invContainer.style.cssText = "display: flex; flex-direction: column; gap: 8px;";

      for (const [auth, track] of Object.entries(investigations)) {
        if (!track) continue;
        const card = document.createElement("div");
        card.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px; font-size: 12px;";
        const alertColor = track.alert_level >= 3 ? "#ef4444" : track.alert_level === 2 ? "#f59e0b" : track.alert_level === 1 ? "#38bdf8" : "#94a3b8";
        const alertLabel = track.alert_level === 3 ? "Active Warrant" : track.alert_level === 2 ? "Suspect Named" : track.alert_level === 1 ? "Clue Found" : "Dormant";
        const clues = Array.isArray(track.clues) && track.clues.length > 0 ? track.clues.join(", ") : "None";

        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <strong style="color:#f8fafc; font-size:13px;">${track.authority || auth}</strong>
            <span style="background:${alertColor}22; border:1px solid ${alertColor}88; color:${alertColor}; padding:2px 8px; border-radius:10px; font-weight:600; font-size:10px;">
              Level ${track.alert_level}: ${alertLabel}
            </span>
          </div>
          <div style="color:#cbd5e1; font-size:11px; margin-bottom:4px;">
            <span style="color:#94a3b8;">Target:</span> <strong>${track.target_id || "Unidentified"}</strong>
          </div>
          <div style="color:#cbd5e1; font-size:11px;">
            <span style="color:#94a3b8;">Clues Linked:</span> <em>${clues}</em>
          </div>
        `;
        invContainer.appendChild(card);
      }
      invSection.appendChild(invContainer);
      this.root.appendChild(invSection);
    }
  }
}
