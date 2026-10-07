import type { LedgerData } from "../../shared/types.js";

export class MapTab {
  public root: HTMLElement;
  private onAction: (actionText: string) => void;
  private viewMode: "indoor" | "outdoor" = "indoor";

  constructor(onAction: (actionText: string) => void) {
    this.onAction = onAction;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-map";
  }

  public render(ledger: LedgerData): void {
    this.root.innerHTML = "";
    const currentPlace = (ledger.scene?.place || "default").toLowerCase();
    const isIndoor = currentPlace.includes(":") || currentPlace.includes("residence") || currentPlace.includes("dojo") || currentPlace.includes("room");
    this.viewMode = isIndoor ? "indoor" : "outdoor";

    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h3>🗺️ World Cartography & Living Roster</h3>
          <p class="vn-muted">Time: <strong>${ledger.clock?.t || "Unknown"}</strong> (${ledger.clock?.phase || "Day"}) | Location: <span style="color:#38bdf8;">${currentPlace}</span></p>
        </div>
        <div style="display: flex; gap: 6px;">
          <button id="vn-map-indoor-btn" class="vn-btn vn-btn-sm ${this.viewMode === "indoor" ? "vn-btn-primary" : "vn-btn-secondary"}">🏠 Building Floorplan</button>
          <button id="vn-map-outdoor-btn" class="vn-btn vn-btn-sm ${this.viewMode === "outdoor" ? "vn-btn-primary" : "vn-btn-secondary"}">🌐 City / Region</button>
        </div>
      </div>
    `;
    this.root.appendChild(header);

    header.querySelector("#vn-map-indoor-btn")?.addEventListener("click", () => {
      this.viewMode = "indoor";
      this.renderMapBody(ledger, currentPlace);
    });
    header.querySelector("#vn-map-outdoor-btn")?.addEventListener("click", () => {
      this.viewMode = "outdoor";
      this.renderMapBody(ledger, currentPlace);
    });

    const mapContainer = document.createElement("div");
    mapContainer.id = "vn-map-canvas-container";
    this.root.appendChild(mapContainer);

    this.renderMapBody(ledger, currentPlace);
  }

  private renderMapBody(ledger: LedgerData, currentPlace: string): void {
    const container = this.root.querySelector("#vn-map-canvas-container") as HTMLElement;
    if (!container) return;
    container.innerHTML = "";

    if (this.viewMode === "indoor") {
      this.renderIndoorFloorplan(container, ledger, currentPlace);
    } else {
      this.renderOutdoorLivingWorld(container, ledger, currentPlace);
    }
  }

  private renderIndoorFloorplan(container: HTMLElement, ledger: LedgerData, currentPlace: string): void {
    const floorplanCard = document.createElement("div");
    floorplanCard.style.cssText = "background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 16px; margin-bottom: 16px;";
    
    // Extract base building scope (e.g. "tendo_residence")
    const scopePrefix = currentPlace.includes(":") ? currentPlace.split(":")[0]! : "building";
    const currentRoom = currentPlace.includes(":") ? currentPlace.split(":")[1]! : currentPlace;

    // Filter places belonging to this indoor scope or standard household rooms
    const knownPlaces = Object.keys(ledger.places || {});
    const indoorRooms = knownPlaces.filter((p) => p.startsWith(`${scopePrefix}:`) || !p.includes(":"));
    const roomsToShow = indoorRooms.length > 0 ? indoorRooms : ["entrance", "living_room", "kitchen", "dojo", "bedroom", "courtyard"];

    floorplanCard.innerHTML = `
      <div style="font-weight: 700; color: #818cf8; margin-bottom: 12px; font-size: 14px;">🏠 Indoor Blueprint — ${scopePrefix.toUpperCase()}</div>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px;">
        ${roomsToShow.map((roomKey) => {
          const rawName = roomKey.includes(":") ? roomKey.split(":")[1]! : roomKey;
          const isHere = rawName === currentRoom || roomKey === currentPlace;
          const presentNpcs = (ledger.roster || []).filter((r) => (r.loc || "").toLowerCase().includes(rawName));
          const npcTags = presentNpcs.map((n) => `<span style="background: rgba(99,102,241,0.3); color: #c7d2fe; padding: 2px 6px; border-radius: 4px; font-size: 10px;">👤 ${n.name || n.id}</span>`).join(" ");

          return `
            <div style="background: ${isHere ? "rgba(56,189,248,0.15)" : "#1e293b"}; border: 2px solid ${isHere ? "#38bdf8" : "#334155"}; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <strong style="color: ${isHere ? "#38bdf8" : "#f8fafc"}; font-size: 13px; text-transform: capitalize;">${rawName.replace(/_/g, " ")}</strong>
                  ${isHere ? '<span style="font-size: 10px; background: #38bdf8; color: #000; padding: 1px 5px; border-radius: 4px; font-weight: 800;">YOU</span>' : ''}
                </div>
                <div style="min-height: 20px; margin-top: 6px; display: flex; flex-wrap: wrap; gap: 4px;">${npcTags || '<span style="font-size: 11px; color: #64748b;">(Empty)</span>'}</div>
              </div>
              ${!isHere ? `<button class="vn-btn vn-btn-sm vn-btn-primary vn-move-btn" data-dest="${roomKey}" style="margin-top: 10px; width: 100%;">Enter Room</button>` : ''}
            </div>
          `;
        }).join("")}
      </div>
    `;

    floorplanCard.querySelectorAll(".vn-move-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const dest = btn.getAttribute("data-dest");
        if (dest) this.onAction(`*Heads to the ${dest.replace(/.*:/, "").replace(/_/g, " ")}*`);
      });
    });

    container.appendChild(floorplanCard);
  }

  private renderOutdoorLivingWorld(container: HTMLElement, ledger: LedgerData, currentPlace: string): void {
    const worldCard = document.createElement("div");
    worldCard.style.cssText = "background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 16px;";

    // Routes and locations in external world
    const routes = ledger.places?.[currentPlace]?.routes || [];
    const travelers = ledger.travel || [];

    worldCard.innerHTML = `
      <div style="font-weight: 700; color: #38bdf8; margin-bottom: 8px; font-size: 14px;">🌐 Living World Map & District Connections</div>
      <p style="font-size: 12px; color: #94a3b8; margin-bottom: 14px;">Actors advance routines continuously. Travel consumes clock minutes.</p>

      ${travelers.length > 0 ? `
        <div style="background: rgba(245,158,11,0.1); border: 1px solid #f59e0b; border-radius: 8px; padding: 10px; margin-bottom: 14px; font-size: 12px; color: #fcd34d;">
          <strong>🚶 Active Travelers in Transit:</strong>
          <ul style="margin: 4px 0 0 16px; padding: 0;">
            ${travelers.map((t) => `<li><strong>${t.actor}</strong>: ${t.from || "Start"} ➔ ${t.to} (ETA: ${t.eta || "En route"})</li>`).join("")}
          </ul>
        </div>
      ` : ''}

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px;">
        ${routes.map((r: any) => {
          const dest = typeof r === "object" && r.to ? r.to : String(r);
          const mins = typeof r === "object" && r.minutes ? r.minutes : 10;
          return `
            <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <strong style="color: #f8fafc; font-size: 13px;">📍 ${dest}</strong>
                <div style="font-size: 11px; color: #94a3b8; margin: 4px 0;">⏱️ Transit: ${mins} mins</div>
              </div>
              <button class="vn-btn vn-btn-sm vn-btn-primary vn-travel-btn" data-dest="${dest}" style="margin-top: 8px;">Travel</button>
            </div>
          `;
        }).join("")}
      </div>
    `;

    worldCard.querySelectorAll(".vn-travel-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const dest = btn.getAttribute("data-dest");
        if (dest) this.onAction(`*Travels to ${dest}*`);
      });
    });

    container.appendChild(worldCard);
  }
}
