import type { LedgerData } from "../../shared/types.js";

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
    const actors = ledger.actors || {};
    const actorIds = Object.keys(actors);

    if (actorIds.length === 0) {
      this.root.innerHTML = `<div class="vn-muted" style="padding: 24px; text-align: center;">No actor dossiers recorded.</div>`;
      return;
    }

    if (!actors[this.selectedActorId]) {
      this.selectedActorId = actorIds[0]!;
    }

    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `<h3>📊 Status, Passions & Relationship Metrics</h3>`;
    this.root.appendChild(header);

    // Actor Selector Dropdown Ribbon
    const controls = document.createElement("div");
    controls.style.cssText = "display: flex; gap: 10px; margin-bottom: 16px; align-items: center; flex-wrap: wrap;";
    controls.innerHTML = `
      <label style="font-size: 12px; color: #94a3b8;">Actor:</label>
      <select id="vn-stats-actor-select" style="background: #1e293b; color: #f8fafc; border: 1px solid #475569; border-radius: 6px; padding: 6px 10px; font-size: 13px;">
        ${actorIds.map((id) => `<option value="${id}" ${id === this.selectedActorId ? "selected" : ""}>${id === "user" ? "Player (You)" : actors[id]?.name || id}</option>`).join("")}
      </select>
    `;
    this.root.appendChild(controls);

    const actorSelect = controls.querySelector("#vn-stats-actor-select") as HTMLSelectElement;
    actorSelect.addEventListener("change", () => {
      this.selectedActorId = actorSelect.value;
      this.render(ledger);
    });

    const actor = actors[this.selectedActorId]!;

    // 1. Passions / Emotions Badges
    const passionsSection = document.createElement("div");
    passionsSection.className = "vn-section";
    passionsSection.innerHTML = `<h4>Current Passions & Affect</h4>`;
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
      badgesContainer.innerHTML = `<span class="vn-muted">Equilibrium / Baseline state</span>`;
    }
    passionsSection.appendChild(badgesContainer);
    this.root.appendChild(passionsSection);

    // 2. Relations Section
    const rels = actor.relations || {};
    const availableTargets = Object.keys(rels);

    const relsSection = document.createElement("div");
    relsSection.className = "vn-section";

    if (availableTargets.length === 0) {
      relsSection.innerHTML = `<h4>Relationships</h4><div class="vn-muted">No relationship edges initialized for this actor.</div>`;
      this.root.appendChild(relsSection);
      return;
    }

    if (!rels[this.selectedTargetId]) {
      this.selectedTargetId = availableTargets[0]!;
    }

    relsSection.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h4 style="margin: 0;">Relations Toward:</h4>
        <select id="vn-stats-target-select" style="background: #1e293b; color: #f8fafc; border: 1px solid #475569; border-radius: 6px; padding: 4px 8px; font-size: 12px;">
          ${availableTargets.map((t) => `<option value="${t}" ${t === this.selectedTargetId ? "selected" : ""}>${t === "user" ? "Player (You)" : actors[t]?.name || t}</option>`).join("")}
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
    extraInfo.style.cssText = "margin-top: 14px; background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px; font-size: 12px; display: flex; flex-direction: column; gap: 6px;";
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
        <span style="color: #94a3b8;">Held Leverage:</span>
        <span style="color: #f59e0b;">${(activeRel.leverage && activeRel.leverage.length) ? activeRel.leverage.join(", ") : "None"}</span>
      </div>
      <div>
        <span style="color: #94a3b8;">Obligations:</span>
        <span style="color: #38bdf8;">${(activeRel.obligations && activeRel.obligations.length) ? activeRel.obligations.join(", ") : "None"}</span>
      </div>
    `;
    metersContainer.appendChild(extraInfo);

    relsSection.appendChild(metersContainer);
    this.root.appendChild(relsSection);
  }
}
