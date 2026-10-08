import type { LedgerData } from "../../shared/types.js";

export class JournalTab {
  public root: HTMLElement;

  constructor() {
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-journal";
  }

  public render(ledger: LedgerData): void {
    this.root.innerHTML = "";

    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `<h3>📜 Journal & Opportunity Leads</h3>`;
    this.root.appendChild(header);

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
