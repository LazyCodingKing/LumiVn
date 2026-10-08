import type { LedgerData, ActorOutfit } from "../../shared/types.js";

export class WardrobeTab {
  public root: HTMLElement;
  private onAction: (actionText: string) => void;

  constructor(onAction: (actionText: string) => void) {
    this.onAction = onAction;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-wardrobe";
  }

  public render(ledger: LedgerData, activeActorId?: string): void {
    this.root.innerHTML = "";

    // Pick target actor: activeActorId, or 'user', or first actor
    const actorId = activeActorId || (ledger.actors?.["user"] ? "user" : Object.keys(ledger.actors || {})[0] || "user");
    const actor = ledger.actors?.[actorId];
    const outfit: ActorOutfit = actor?.outfit || {
      top: "None",
      bottom: "None",
      underwear_top: "None",
      underwear_bottom: "None",
      shoes: "None",
      accessories: [],
    };

    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `<h3>👗 Wardrobe & Dressing — ${actor?.name || actorId}</h3>`;
    this.root.appendChild(header);

    const statusBar = document.createElement("div");
    statusBar.className = "vn-wardrobe-status-bar";
    const scentVal = outfit.scent || "None";
    const conditionVal = outfit.state || "Clean";
    const integrityVal = outfit.integrity ?? 100;
    const residueVal =
      Array.isArray(outfit.residue) && outfit.residue.length > 0
        ? outfit.residue.join(", ")
        : "None";

    statusBar.innerHTML = `
      <div class="vn-wardrobe-status-item"><span>Scent:</span> <strong>${scentVal}</strong></div>
      <div class="vn-wardrobe-status-item"><span>Condition:</span> <strong>${conditionVal}</strong></div>
      <div class="vn-wardrobe-status-item"><span>Integrity:</span> <strong>${integrityVal}%</strong></div>
      <div class="vn-wardrobe-status-item"><span>Residue:</span> <strong>${residueVal}</strong></div>
    `;
    this.root.appendChild(statusBar);

    const slotsGrid = document.createElement("div");
    slotsGrid.className = "vn-wardrobe-grid";

    const slots: Array<{ label: string; key: keyof ActorOutfit; value: string | string[] }> = [
      { label: "Top", key: "top", value: outfit.top || "None" },
      { label: "Bottom", key: "bottom", value: outfit.bottom || "None" },
      { label: "Underwear (Top)", key: "underwear_top", value: outfit.underwear_top || "None" },
      { label: "Underwear (Bottom)", key: "underwear_bottom", value: outfit.underwear_bottom || "None" },
      { label: "Shoes", key: "shoes", value: outfit.shoes || "None" },
      { label: "Accessories", key: "accessories", value: outfit.accessories || [] },
    ];

    for (const slot of slots) {
      const card = document.createElement("div");
      card.className = "vn-slot-card";

      const valStr = Array.isArray(slot.value) ? (slot.value.length ? slot.value.join(", ") : "None") : slot.value;
      const isEquipped = valStr && valStr !== "None" && valStr !== "none";

      card.innerHTML = `
        <div class="vn-slot-title">${slot.label}</div>
        <div class="vn-slot-value">${valStr}</div>
      `;

      const actions = document.createElement("div");
      actions.className = "vn-slot-actions";

      if (isEquipped) {
        const takeOffBtn = document.createElement("button");
        takeOffBtn.className = "vn-btn vn-btn-sm vn-btn-danger";
        takeOffBtn.textContent = "Take off";
        takeOffBtn.addEventListener("click", () => {
          this.onAction(`*Takes off ${slot.label.toLowerCase()}*`);
        });
        actions.appendChild(takeOffBtn);
      } else {
        const wearBtn = document.createElement("button");
        wearBtn.className = "vn-btn vn-btn-sm vn-btn-primary";
        wearBtn.textContent = "Wear";
        wearBtn.addEventListener("click", () => {
          this.onAction(`*Puts on ${slot.label.toLowerCase()}*`);
        });
        actions.appendChild(wearBtn);
      }

      card.appendChild(actions);
      slotsGrid.appendChild(card);
    }

    this.root.appendChild(slotsGrid);

    // Bulk actions
    const footer = document.createElement("div");
    footer.className = "vn-tab-footer";

    const cleanBtn = document.createElement("button");
    cleanBtn.className = "vn-btn vn-btn-primary";
    cleanBtn.textContent = "Clean Clothes";
    cleanBtn.addEventListener("click", () => {
      this.onAction(`*Cleans and washes garments*`);
    });

    const repairBtn = document.createElement("button");
    repairBtn.className = "vn-btn vn-btn-primary";
    repairBtn.textContent = "Repair Garments";
    repairBtn.addEventListener("click", () => {
      this.onAction(`*Mends and repairs clothing tears*`);
    });

    const undressBtn = document.createElement("button");
    undressBtn.className = "vn-btn vn-btn-warning";
    undressBtn.textContent = "Undress to Underwear";
    undressBtn.addEventListener("click", () => {
      this.onAction(`*Undresses down to underwear*`);
    });

    const stripBtn = document.createElement("button");
    stripBtn.className = "vn-btn vn-btn-danger";
    stripBtn.textContent = "Completely Undress";
    stripBtn.addEventListener("click", () => {
      this.onAction(`*Completely strips clothes*`);
    });

    footer.appendChild(cleanBtn);
    footer.appendChild(repairBtn);
    footer.appendChild(undressBtn);
    footer.appendChild(stripBtn);
    this.root.appendChild(footer);
  }
}
