import type { LedgerData, ActorInventory } from "../../shared/types.js";

export class InventoryTab {
  public root: HTMLElement;
  private onAction: (actionText: string) => void;

  constructor(onAction: (actionText: string) => void) {
    this.onAction = onAction;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-inventory";
  }

  public render(ledger: LedgerData, activeActorId?: string): void {
    this.root.innerHTML = "";

    const actorId = activeActorId || (ledger.actors?.["user"] ? "user" : Object.keys(ledger.actors || {})[0] || "user");
    const actor = ledger.actors?.[actorId];
    const inv: ActorInventory = actor?.inventory || {
      in_hand: { L: "Empty", R: "Empty" },
      carried: [],
      room: [],
      room_location: "",
    };

    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `<h3>🎒 Inventory & Containers — ${actor?.name || actorId}</h3>`;
    this.root.appendChild(header);

    // In Hands
    const handsSection = document.createElement("div");
    handsSection.className = "vn-section";
    handsSection.innerHTML = `<h4>In Hands</h4>`;
    const handsGrid = document.createElement("div");
    handsGrid.className = "vn-hands-grid";

    for (const hand of ["L", "R"] as const) {
      const item = inv.in_hand?.[hand] || "Empty";
      const isEmpty = item.toLowerCase() === "empty";
      const card = document.createElement("div");
      card.className = "vn-item-card";
      card.innerHTML = `
        <div class="vn-item-title">${hand === "L" ? "Left Hand" : "Right Hand"}</div>
        <div class="vn-item-desc">${item}</div>
      `;
      if (!isEmpty) {
        const btn = document.createElement("button");
        btn.className = "vn-btn vn-btn-sm vn-btn-warning";
        btn.textContent = "Stow";
        btn.addEventListener("click", () => {
          this.onAction(`*Stows ${item} from ${hand === "L" ? "left" : "right"} hand*`);
        });
        card.appendChild(btn);
      }
      handsGrid.appendChild(card);
    }
    handsSection.appendChild(handsGrid);
    this.root.appendChild(handsSection);

    // Carried Items
    const carriedSection = document.createElement("div");
    carriedSection.className = "vn-section";
    carriedSection.innerHTML = `<h4>Carried (${inv.carried?.length || 0})</h4>`;
    const carriedList = document.createElement("div");
    carriedList.className = "vn-items-list";

    if (!inv.carried || inv.carried.length === 0) {
      carriedList.innerHTML = `<div class="vn-muted">Nothing carried.</div>`;
    } else {
      for (const item of inv.carried) {
        const row = document.createElement("div");
        row.className = "vn-item-row";
        row.innerHTML = `<span class="vn-item-name">${item}</span>`;

        const actions = document.createElement("div");
        actions.className = "vn-item-row-actions";

        const equipBtn = document.createElement("button");
        equipBtn.className = "vn-btn vn-btn-sm vn-btn-primary";
        equipBtn.textContent = "Equip";
        equipBtn.addEventListener("click", () => {
          this.onAction(`*Equips ${item} in hand*`);
        });

        const useBtn = document.createElement("button");
        useBtn.className = "vn-btn vn-btn-sm vn-btn-secondary";
        useBtn.textContent = "Use";
        useBtn.addEventListener("click", () => {
          this.onAction(`*Uses ${item}*`);
        });

        const dropBtn = document.createElement("button");
        dropBtn.className = "vn-btn vn-btn-sm vn-btn-danger";
        dropBtn.textContent = "Drop";
        dropBtn.addEventListener("click", () => {
          this.onAction(`*Drops ${item} on the ground*`);
        });

        actions.appendChild(equipBtn);
        actions.appendChild(useBtn);
        actions.appendChild(dropBtn);
        row.appendChild(actions);
        carriedList.appendChild(row);
      }
    }
    carriedSection.appendChild(carriedList);
    this.root.appendChild(carriedSection);

    // Room Container
    const roomSection = document.createElement("div");
    roomSection.className = "vn-section";
    const roomLoc = inv.room_location ? ` (${inv.room_location})` : "";
    roomSection.innerHTML = `<h4>Room Container${roomLoc}</h4>`;
    const roomList = document.createElement("div");
    roomList.className = "vn-items-list";

    if (!inv.room || inv.room.length === 0) {
      roomList.innerHTML = `<div class="vn-muted">Container is empty.</div>`;
    } else {
      for (const item of inv.room) {
        const row = document.createElement("div");
        row.className = "vn-item-row";
        row.innerHTML = `<span class="vn-item-name">${item}</span>`;

        const takeBtn = document.createElement("button");
        takeBtn.className = "vn-btn vn-btn-sm vn-btn-primary";
        takeBtn.textContent = "Take";
        takeBtn.addEventListener("click", () => {
          this.onAction(`*Takes ${item} from container*`);
        });

        row.appendChild(takeBtn);
        roomList.appendChild(row);
      }
    }
    roomSection.appendChild(roomList);
    this.root.appendChild(roomSection);
  }
}
