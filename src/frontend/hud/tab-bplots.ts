import type { LedgerData, BPlot, RosterCharacter, FrontNode, TravelNode, SceneLatent } from "../../shared/types.js";

export class BPlotsTab {
  public root: HTMLElement;

  constructor() {
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-bplots";
  }

  public render(ledger: LedgerData): void {
    this.root.innerHTML = "";
    this.root.style.cssText = "display: flex; flex-direction: column; gap: 14px; color: #f1f5f9; font-family: system-ui, sans-serif;";

    const bplots: BPlot[] = ledger.bplots || [];
    const roster: RosterCharacter[] = ledger.roster || [];
    const currentPlace = (ledger.scene?.place || "").toLowerCase();
    const offscreenCast = roster.filter((r) => {
      const isOffLOD = r.lod === 1 || r.lod === 2;
      const isDifferentLoc = r.loc && r.loc.toLowerCase() !== currentPlace;
      return (isOffLOD || isDifferentLoc) && (r.id || "").toLowerCase() !== "user";
    });
    const fronts: FrontNode[] = ledger.fronts || [];
    const travel: TravelNode[] = ledger.travel || [];
    const latents: SceneLatent[] = ledger.scene?.latents || [];

    // Header
    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <h3 style="margin: 0; font-size: 15px; color: #f8fafc; display: flex; align-items: center; gap: 6px;">
            <span>📡</span> <span>B-Plots, Fronts & Offscreen Cast</span>
          </h3>
          <p class="vn-muted" style="margin: 2px 0 0 0; font-size: 11px;">
            Distant third-party agendas, active ripple stages, offscreen errands, and environmental fronts.
          </p>
        </div>
        <div style="display: flex; gap: 6px;">
          <span style="font-size: 11px; background: rgba(99,102,241,0.2); border: 1px solid #6366f1; padding: 2px 8px; border-radius: 6px; color: #c7d2fe;">
            ${bplots.length} B-Plots
          </span>
          <span style="font-size: 11px; background: rgba(56,189,248,0.2); border: 1px solid #38bdf8; padding: 2px 8px; border-radius: 6px; color: #7dd3fc;">
            ${offscreenCast.length} Offscreen Cast
          </span>
        </div>
      </div>
    `;
    this.root.appendChild(header);

    // ── 1. B-Plots Section ──
    const bpSection = document.createElement("div");
    bpSection.className = "vn-section";
    bpSection.innerHTML = `<h4>🌐 Active B-Plots & Distant Agendas (${bplots.length})</h4>`;

    if (bplots.length === 0) {
      bpSection.innerHTML += `<div class="vn-muted" style="padding: 10px; background: #0f172a; border-radius: 6px;">No external B-plots active on the ledger.</div>`;
    } else {
      const bpList = document.createElement("div");
      bpList.style.cssText = "display: flex; flex-direction: column; gap: 10px;";

      for (const bp of bplots) {
        const card = document.createElement("div");
        card.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px;";

        const ripple = bp.ripple ?? 1;
        const rippleColor = ripple === 3 ? "#ef4444" : ripple === 2 ? "#f59e0b" : "#38bdf8";
        const rippleLabel = ripple === 3 ? "Stage 3: Collision" : ripple === 2 ? "Stage 2: Ambient Echo" : "Stage 1: Isolated";

        const knowsList = Array.isArray(bp.knows) ? bp.knows.join("; ") : bp.knows || "None";
        const hooksList = Array.isArray(bp.hooks) ? bp.hooks.join(", ") : bp.hooks || "None";
        const carriersList = (bp.carriers || []).map((c) => `${c.what || "News"} from ${c.from || "Source"} (ETA: ${c.eta || "?"})`).join("; ");

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="color: #f8fafc; font-size: 13px;">${bp.who || bp.id || "Unknown Entity"}</strong>
              <span style="font-size: 10px; background: #0f172a; border: 1px solid #475569; padding: 1px 6px; border-radius: 4px; color: #94a3b8;">
                ${bp.scope || "personal"}
              </span>
              <span style="font-size: 10px; background: rgba(34,197,94,0.15); border: 1px solid #22c55e; padding: 1px 6px; border-radius: 4px; color: #86efac;">
                ${bp.status || "active"}
              </span>
            </div>
            <span style="font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: ${rippleColor}22; border: 1px solid ${rippleColor}; color: ${rippleColor};">
              ${rippleLabel}
            </span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px; font-size: 11px;">
            <div><span style="color: #94a3b8;">Want:</span> <strong style="color: #f8fafc;">${bp.want || "Unstated"}</strong></div>
            <div><span style="color: #94a3b8;">Current Activity:</span> <span style="color: #cbd5e1;">${bp.doing || "Routine"}</span></div>
          </div>

          ${bp.next ? `
            <div style="background: #0f172a; border-radius: 6px; padding: 6px 10px; font-size: 11px; display: flex; justify-content: space-between;">
              <span><strong style="color: #38bdf8;">Next Move:</strong> ${bp.next.move || "Advance plan"}</span>
              <span style="color: #fca5a5; font-weight: 600;">Due: ${bp.next.due || "TBD"}</span>
            </div>
          ` : ""}

          <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: #cbd5e1;">
            ${bp.vector ? `<div><span style="color: #94a3b8;">Ripple Vector:</span> <em>${bp.vector}</em></div>` : ""}
            ${carriersList ? `<div><span style="color: #94a3b8;">Carriers & Outward News:</span> ${carriersList}</div>` : ""}
            <div><span style="color: #94a3b8;">Beliefs / What they know:</span> ${knowsList}</div>
            <div><span style="color: #94a3b8;">Scene Hooks:</span> <span style="color: #a78bfa;">${hooksList}</span></div>
          </div>
        `;
        bpList.appendChild(card);
      }
      bpSection.appendChild(bpList);
    }
    this.root.appendChild(bpSection);

    // ── 2. Offscreen Cast & Latents Section ──
    const offSection = document.createElement("div");
    offSection.className = "vn-section";
    offSection.innerHTML = `<h4>👥 Offscreen Cast & Area Latents (${offscreenCast.length + latents.length + travel.length})</h4>`;

    const offGrid = document.createElement("div");
    offGrid.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px;";

    for (const actor of offscreenCast) {
      const card = document.createElement("div");
      card.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px; font-size: 11px; display: flex; flex-direction: column; gap: 4px;";
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #38bdf8; font-size: 12px;">${actor.name || actor.id}</strong>
          <span style="font-size: 10px; background: #0f172a; padding: 1px 6px; border-radius: 4px; color: #a5b4fc;">
            LOD ${actor.lod ?? 1}
          </span>
        </div>
        <div><span style="color: #94a3b8;">Location:</span> <strong style="color: #f8fafc;">${actor.loc || "Unknown"}</strong></div>
        <div><span style="color: #94a3b8;">Status / Errand:</span> <span style="color: #cbd5e1;">${actor.status || "On routine"}</span></div>
        ${actor.tick !== undefined ? `<div style="font-size: 10px; color: #64748b;">Tick: ${actor.tick} | Record: ${actor.record || "normal"}</div>` : ""}
      `;
      offGrid.appendChild(card);
    }

    for (const lat of latents) {
      const card = document.createElement("div");
      card.style.cssText = "background: #1e293b; border: 1px solid #6366f1; border-radius: 8px; padding: 10px; font-size: 11px; display: flex; flex-direction: column; gap: 4px;";
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #c084fc; font-size: 12px;">⏳ ${lat.who || lat.id} (Latent)</strong>
          <span style="font-size: 10px; background: rgba(139,92,246,0.2); color: #d8b4fe; padding: 1px 6px; border-radius: 4px;">
            ${lat.status || "pending"}
          </span>
        </div>
        <div><span style="color: #94a3b8;">Errand:</span> <span style="color: #f8fafc;">${lat.errand || "None"}</span></div>
        ${lat.route ? `<div><span style="color: #94a3b8;">Route:</span> ${lat.route}</div>` : ""}
        ${lat.window_opens ? `<div><span style="color: #94a3b8;">Window Opens:</span> <strong style="color: #fca5a5;">${lat.window_opens}</strong></div>` : ""}
      `;
      offGrid.appendChild(card);
    }

    for (const tr of travel) {
      const card = document.createElement("div");
      card.style.cssText = "background: #1e293b; border: 1px solid #38bdf8; border-radius: 8px; padding: 10px; font-size: 11px; display: flex; flex-direction: column; gap: 4px;";
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #38bdf8; font-size: 12px;">🚶 ${tr.actor} (In Transit)</strong>
          <span style="font-size: 10px; background: rgba(56,189,248,0.2); color: #7dd3fc; padding: 1px 6px; border-radius: 4px;">
            ${tr.status || "en_route"}
          </span>
        </div>
        <div><span style="color: #94a3b8;">Route:</span> ${tr.from || "?"} ➔ ${tr.to || "?"}</div>
        <div><span style="color: #94a3b8;">Purpose:</span> ${tr.purpose || "Travel"}</div>
        <div style="display: flex; justify-content: space-between; margin-top: 2px;">
          <span>Depart: ${tr.depart || "—"}</span>
          <span style="color: #fca5a5; font-weight: 600;">ETA: ${tr.eta || "—"}</span>
        </div>
      `;
      offGrid.appendChild(card);
    }

    if (offscreenCast.length === 0 && latents.length === 0 && travel.length === 0) {
      offSection.innerHTML += `<div class="vn-muted" style="padding: 10px; background: #0f172a; border-radius: 6px;">All tracked cast members are currently on the active scene.</div>`;
    } else {
      offSection.appendChild(offGrid);
    }
    this.root.appendChild(offSection);

    // ── 3. Environmental Fronts Section ──
    if (fronts.length > 0) {
      const frontSec = document.createElement("div");
      frontSec.className = "vn-section";
      frontSec.innerHTML = `<h4>⚡ Environmental Fronts & Rising Tensions (${fronts.length})</h4>`;

      const fList = document.createElement("div");
      fList.style.cssText = "display: flex; flex-direction: column; gap: 8px;";

      for (const f of fronts) {
        const item = document.createElement("div");
        item.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 8px 12px; font-size: 11px;";
        const press = f.pressure ?? 0;
        const pressColor = press >= 4 ? "#ef4444" : press >= 3 ? "#f59e0b" : "#38bdf8";

        item.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="color: #f8fafc; font-size: 12px;">${f.id}</strong>
            <span style="font-weight: 700; color: ${pressColor}; background: ${pressColor}22; border: 1px solid ${pressColor}; padding: 1px 6px; border-radius: 4px;">
              Pressure ${press}/5
            </span>
          </div>
          <div style="color: #cbd5e1; margin-bottom: 2px;">${f.cause || "Active pressure"}</div>
          <div style="display: flex; justify-content: space-between; color: #94a3b8; font-size: 10px;">
            <span>Stage: <strong>${f.stage || "initial"}</strong></span>
            ${f.due ? `<span>Due: <strong style="color: #fca5a5;">${f.due}</strong></span>` : ""}
            <span>Known by: ${(f.known_by || []).join(", ") || "None"}</span>
          </div>
        `;
        fList.appendChild(item);
      }
      frontSec.appendChild(fList);
      this.root.appendChild(frontSec);
    }
  }
}
