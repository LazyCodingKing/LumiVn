import type { LedgerData, ActorDossier, AssetManifest } from "../../shared/types.js";

export class CharactersTab {
  public root: HTMLElement;
  private selectedActorId: string | null = null;

  constructor() {
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-characters";
  }

  public render(ledger: LedgerData, manifest?: AssetManifest): void {
    this.root.innerHTML = "";
    const actors: Record<string, ActorDossier> = { ...(ledger.actors || {}) };

    // Supplement from roster if actors are not yet recorded as full dossiers
    if (ledger.roster && Array.isArray(ledger.roster)) {
      for (const r of ledger.roster) {
        if (r.id && !actors[r.id]) {
          actors[r.id] = {
            id: r.id,
            name: r.name || r.id,
            life_model: { occupation: r.status || "Resident" },
            agency: { want_now: r.status || "None" },
          };
        }
      }
    }

    const allKeys = Object.keys(actors);
    // Put user first, then secondary characters
    const actorIds = allKeys.sort((a, b) => {
      if (a.toLowerCase() === "user") return -1;
      if (b.toLowerCase() === "user") return 1;
      return a.localeCompare(b);
    });

    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `<h3>👥 Cast & Character Records</h3><p class="vn-muted">Select a character to inspect attire, equipment, tells, and relationships.</p>`;
    this.root.appendChild(header);

    if (actorIds.length === 0) {
      this.root.innerHTML += `<div class="vn-muted" style="text-align:center; padding: 24px;">No characters recorded yet.</div>`;
      return;
    }

    if (!this.selectedActorId || !actors[this.selectedActorId]) {
      this.selectedActorId = actorIds[0]!;
    }

    // Avatar Icon Ribbon
    const ribbon = document.createElement("div");
    ribbon.style.cssText = "display: flex; gap: 14px; overflow-x: auto; padding: 6px 4px 16px 4px; border-bottom: 1px solid #334155; margin-bottom: 18px;";

    for (const id of actorIds) {
      const actor = actors[id]!;
      const isSelected = id === this.selectedActorId;
      const cleanId = id.toLowerCase().replace(/[^a-z0-9_-]/g, "_");

      // Resolve avatar URL from manifest or fallback
      let avatarUrl = "";
      if (manifest?.characters?.[cleanId]) {
        const charData = manifest.characters[cleanId]!;
        const outfits = charData.outfits || (charData as any);
        const defaultSet = outfits?.["default"] || (outfits ? Object.values(outfits)[0] : undefined);
        avatarUrl = defaultSet?.["neutral"] || defaultSet?.["smile"] || (defaultSet ? Object.values(defaultSet)[0] : "") || "";
      }

      const item = document.createElement("div");
      item.style.cssText = `display: flex; flex-direction: column; align-items: center; cursor: pointer; min-width: 68px; transition: transform 0.15s ease;`;
      item.innerHTML = `
        <div style="width: 56px; height: 56px; border-radius: 50%; overflow: hidden; border: 2px solid ${isSelected ? "#818cf8" : "#475569"}; box-shadow: ${isSelected ? "0 0 10px rgba(99,102,241,0.6)" : "none"}; background: #1e293b; display: flex; align-items: center; justify-content: center;">
          ${avatarUrl ? `<img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="${actor.name || id}" />` : `<span style="font-size: 20px;">👤</span>`}
        </div>
        <span style="font-size: 11px; margin-top: 5px; color: ${isSelected ? "#f8fafc" : "#94a3b8"}; font-weight: ${isSelected ? "700" : "500"}; max-width: 64px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${actor.name || id}</span>
      `;
      item.addEventListener("click", () => {
        this.selectedActorId = id;
        this.render(ledger, manifest);
      });
      ribbon.appendChild(item);
    }
    this.root.appendChild(ribbon);

    // Selected Actor Dossier View
    const actor = actors[this.selectedActorId]!;
    this.renderActorDetails(actor, ledger);
  }

  private renderActorDetails(actor: ActorDossier, ledger: LedgerData): void {
    const detailsContainer = document.createElement("div");
    detailsContainer.style.cssText = "display: flex; flex-direction: column; gap: 16px;";

    const prof = (actor.profile as Record<string, any>) || {};
    const life = (actor.life_model as Record<string, any>) || {};
    const app = (actor.appearance as Record<string, any>) || {};

    // 1. Identity & Appearance Card
    const idCard = document.createElement("div");
    idCard.className = "vn-section";
    idCard.innerHTML = `
      <h4>${actor.name || actor.id} — Overview</h4>
      <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 12px; font-size: 13px; line-height: 1.5; color: #cbd5e1;">
        <div><strong>Occupation:</strong> ${life.occupation || "Unknown"} | <strong>Age/Traits:</strong> ${app.age || "Unknown"}, ${app.traits || "None"}</div>
        <div style="margin-top: 4px;"><strong>Style & Appeal:</strong> ${app.style || "Casual"} (${app.appeal ?? "?"}/100)</div>
        <div style="margin-top: 4px;"><strong>Current Want:</strong> <span style="color: #38bdf8;">${(actor.agency as any)?.want_now || "None declared"}</span></div>
      </div>
    `;
    detailsContainer.appendChild(idCard);

    // 2. Personality & Dispositions
    const disp = prof.dispositions || {};
    const dispKeys = Object.keys(disp);
    if (dispKeys.length > 0) {
      const dispSection = document.createElement("div");
      dispSection.className = "vn-section";
      dispSection.innerHTML = `<h4>Dispositions & Psychological Traits</h4>`;
      const grid = document.createElement("div");
      grid.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 8px;";
      for (const k of dispKeys) {
        const item = document.createElement("div");
        item.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 6px 10px; font-size: 11px;";
        item.innerHTML = `<span style="color: #94a3b8; text-transform: capitalize;">${k}:</span> <strong style="color: #f8fafc;">${disp[k]}</strong>`;
        grid.appendChild(item);
      }
      dispSection.appendChild(grid);
      detailsContainer.appendChild(dispSection);
    }

    // 3. Boundaries & Red Lines
    const boundaries = prof.boundaries || [];
    const redLines = prof.red_lines || [];
    if (boundaries.length > 0 || redLines.length > 0) {
      const boundSection = document.createElement("div");
      boundSection.className = "vn-section";
      boundSection.innerHTML = `
        <h4>Limits & Boundaries</h4>
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px; font-size: 12px; color: #cbd5e1;">
          ${boundaries.length > 0 ? `<div><strong>Boundaries:</strong> ${boundaries.join(", ")}</div>` : ""}
          ${redLines.length > 0 ? `<div style="margin-top: 4px; color: #fca5a5;"><strong>Red Lines:</strong> ${redLines.join(", ")}</div>` : ""}
        </div>
      `;
      detailsContainer.appendChild(boundSection);
    }

    // 4. Relations toward Other NPCs & Player
    const rels = actor.relations || {};
    const targetIds = Object.keys(rels);
    const relsSection = document.createElement("div");
    relsSection.className = "vn-section";
    relsSection.innerHTML = `<h4>Relationship Matrix (${targetIds.length})</h4>`;

    if (targetIds.length === 0) {
      relsSection.innerHTML += `<div class="vn-muted">No relational links recorded.</div>`;
    } else {
      const relsList = document.createElement("div");
      relsList.style.cssText = "display: flex; flex-direction: column; gap: 10px;";

      for (const targetId of targetIds) {
        const r = rels[targetId] as Record<string, any>;
        const targetName = targetId === "user" ? "Player (You)" : ledger.actors?.[targetId]?.name || targetId;
        const bThreshold = r.betrayal_threshold !== undefined && r.betrayal_threshold !== null ? r.betrayal_threshold : "N/A";

        const card = document.createElement("div");
        card.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; font-size: 12px;";
        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="color: #818cf8; font-size: 13px;">Towards ${targetName}</strong>
            <span style="font-size: 11px; background: rgba(239,68,68,0.2); border: 1px solid #ef4444; color: #fca5a5; padding: 2px 6px; border-radius: 4px;">
              Betrayal Thresh: ${bThreshold}
            </span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 6px; color: #cbd5e1; margin-bottom: 6px;">
            <div>Affinity: <strong>${r.affinity ?? 0}</strong></div>
            <div>Trust: <strong>${r.trust ?? 0}</strong></div>
            <div>Respect: <strong>${r.respect ?? 0}</strong></div>
            <div>Attraction: <strong>${r.attraction ?? 0}</strong></div>
            <div>Loyalty: <strong>${r.loyalty ?? 0}</strong></div>
            <div>Sacrifice: <strong>${r.sacrifice_willingness ?? 0}</strong></div>
          </div>
          ${(r.leverage && r.leverage.length > 0) ? `<div style="font-size: 11px; color: #f59e0b;">Leverage: ${r.leverage.join(", ")}</div>` : ""}
          ${(r.obligations && r.obligations.length > 0) ? `<div style="font-size: 11px; color: #38bdf8;">Obligations: ${r.obligations.join(", ")}</div>` : ""}
        `;
        relsList.appendChild(card);
      }
      relsSection.appendChild(relsList);
    }
    detailsContainer.appendChild(relsSection);

    this.root.appendChild(detailsContainer);
  }
}
