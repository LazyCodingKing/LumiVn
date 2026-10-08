import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import type { LedgerData, BulletinPost } from "../../shared/types.js";

export class JournalTab {
  public root: HTMLElement;
  private ctx?: SpindleFrontendContext;

  constructor(ctx?: SpindleFrontendContext) {
    this.ctx = ctx;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-journal";
  }

  public render(ledger: LedgerData): void {
    this.root.innerHTML = "";

    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.style.cssText = "display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;";
    header.innerHTML = `
      <h3 style="margin: 0;">📜 Journal & Opportunity Leads</h3>
      <button id="vn-sim-offscreen-btn" class="vn-btn" style="font-size: 11px; padding: 5px 12px; border-radius: 6px; background: #6366f1; color: white; border: none; cursor: pointer; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
        <span>🎭</span> <span>Simulate Offscreen Moves</span>
      </button>
    `;
    this.root.appendChild(header);

    header.querySelector("#vn-sim-offscreen-btn")?.addEventListener("click", () => {
      this.ctx?.sendToBackend({ type: "vn_simulate_offscreen" });
    });

    // Bulletin Board & Local Rumors
    const rumorsSection = document.createElement("div");
    rumorsSection.className = "vn-section";
    rumorsSection.innerHTML = `<h4>📢 Bulletin Board & Local Rumors (${ledger.bulletins?.length || 0})</h4>`;

    const rumorsList = document.createElement("div");
    rumorsList.className = "vn-opps-list";

    if (!ledger.bulletins || ledger.bulletins.length === 0) {
      rumorsList.innerHTML = `<div class="vn-muted">No ambient rumors or board notices posted yet. Click "Simulate Offscreen Moves" above to generate local chatter.</div>`;
    } else {
      for (const post of ledger.bulletins) {
        const card = document.createElement("div");
        card.className = "vn-opp-card";
        card.innerHTML = `
          <div class="vn-opp-header" style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #f59e0b;">${post.title}</strong>
            <span style="font-size: 10px; background: #1e293b; padding: 2px 6px; border-radius: 4px; color: #94a3b8; border: 1px solid #334155;">${post.category || "Rumor"}</span>
          </div>
          <div class="vn-opp-body" style="font-size: 12px; margin: 6px 0; color: #cbd5e1; line-height: 1.4;">${post.body}</div>
          <div class="vn-opp-footer" style="display: flex; justify-content: space-between; font-size: 10px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 4px;">
            <span>Source: ${post.source || "Word on the Street"}</span>
            ${post.timestamp ? `<span>${post.timestamp}</span>` : ""}
          </div>
        `;
        rumorsList.appendChild(card);
      }
    }
    rumorsSection.appendChild(rumorsList);
    this.root.appendChild(rumorsSection);

    // Active Opportunities / Quests
    const oppsSection = document.createElement("div");
    oppsSection.className = "vn-section";
    oppsSection.innerHTML = `<h4>Open Opportunities (${ledger.opportunities?.length || 0})</h4>`;

    const oppsList = document.createElement("div");
    oppsList.className = "vn-opps-list";

    if (!ledger.opportunities || ledger.opportunities.length === 0) {
      oppsList.innerHTML = `<div class="vn-muted">No open opportunities tracked.</div>`;
    } else {
      for (const opp of ledger.opportunities) {
        const card = document.createElement("div");
        card.className = "vn-opp-card";

        const wanted = opp.wanted_by?.length ? opp.wanted_by.join(", ") : "Unknown";
        const payoff = opp.payoff ? ` • 🏆 ${opp.payoff}` : "";
        const statusBadge = `<span class="vn-status-badge vn-status-${opp.status || "lead"}">${opp.status || "lead"}</span>`;

        card.innerHTML = `
          <div class="vn-opp-header">
            <strong>${opp.id}</strong>
            ${statusBadge}
          </div>
          <div class="vn-opp-body">${opp.what || "No description"}</div>
          <div class="vn-opp-footer">
            <span>Wanted by: ${wanted}${payoff}</span>
            ${opp.due ? `<span>Due: ${opp.due}</span>` : ""}
          </div>
        `;
        oppsList.appendChild(card);
      }
    }
    oppsSection.appendChild(oppsList);
    this.root.appendChild(oppsSection);

    // Historical Journal Events
    const journalSection = document.createElement("div");
    journalSection.className = "vn-section";
    journalSection.innerHTML = `<h4>Chronicle of Events (${ledger.journal?.length || 0})</h4>`;

    const eventsList = document.createElement("div");
    eventsList.className = "vn-journal-events";

    if (!ledger.journal || ledger.journal.length === 0) {
      eventsList.innerHTML = `<div class="vn-muted">No events logged yet.</div>`;
    } else {
      // Show newest first
      const reversed = [...ledger.journal].reverse();
      for (const evt of reversed) {
        const row = document.createElement("div");
        row.className = "vn-journal-entry";

        const timeStr = evt.time ? `<span class="vn-evt-time">[${evt.time}]</span> ` : "";
        const placeStr = evt.place ? `@ ${evt.place} ` : "";
        const outcomeBadge = evt.outcome ? `<span class="vn-outcome-${evt.outcome}">${evt.outcome}</span>` : "";

        let mutationsHtml = "";
        if (evt.mutations && evt.mutations.length > 0) {
          mutationsHtml = `<ul class="vn-mutations-list">${evt.mutations
            .map((m) => `<li>${m}</li>`)
            .join("")}</ul>`;
        }

        row.innerHTML = `
          <div class="vn-evt-header">
            <strong>${evt.id}</strong> ${timeStr}${placeStr}${outcomeBadge}
          </div>
          <div class="vn-evt-action">${evt.action || ""}</div>
          ${mutationsHtml}
        `;
        eventsList.appendChild(row);
      }
    }
    journalSection.appendChild(eventsList);
    this.root.appendChild(journalSection);
  }
}
