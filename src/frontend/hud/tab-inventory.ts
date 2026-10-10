import type { LedgerData, ActorInventory } from "../../shared/types.js";

function getItemIcon(itemName: string): string {
  const norm = itemName.toLowerCase();
  if (norm.includes("sword") || norm.includes("blade") || norm.includes("katana") || norm.includes("knife") || norm.includes("dagger") || norm.includes("weapon") || norm.includes("gun")) return "🗡️";
  if (norm.includes("phone") || norm.includes("smartphone") || norm.includes("device") || norm.includes("terminal")) return "📱";
  if (norm.includes("key") || norm.includes("card") || norm.includes("pass")) return "🔑";
  if (norm.includes("potion") || norm.includes("medicine") || norm.includes("pill") || norm.includes("aid") || norm.includes("bandage")) return "💊";
  if (norm.includes("book") || norm.includes("letter") || norm.includes("note") || norm.includes("scroll") || norm.includes("diary")) return "📜";
  if (norm.includes("food") || norm.includes("apple") || norm.includes("snack") || norm.includes("bento") || norm.includes("bread")) return "🥪";
  if (norm.includes("drink") || norm.includes("water") || norm.includes("tea") || norm.includes("coffee") || norm.includes("soda") || norm.includes("bottle")) return "☕";
  if (norm.includes("ring") || norm.includes("necklace") || norm.includes("amulet") || norm.includes("badge") || norm.includes("ribbon")) return "💍";
  if (norm.includes("wallet") || norm.includes("money") || norm.includes("coin") || norm.includes("cash") || norm.includes("gold")) return "💰";
  if (norm.includes("bag") || norm.includes("backpack") || norm.includes("case") || norm.includes("pouch")) return "🎒";
  return "📦";
}

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

    // 1. In Hands (Hero Slots)
    const handsSection = document.createElement("div");
    handsSection.className = "vn-section";
    handsSection.innerHTML = `<h4>✋ In Hands</h4>`;
    const handsGrid = document.createElement("div");
    handsGrid.style.cssText = "display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px;";

    for (const hand of ["L", "R"] as const) {
      const item = inv.in_hand?.[hand] || "Empty";
      const isEmpty = item.toLowerCase() === "empty";
      const card = document.createElement("div");
      card.style.cssText = `background: #0f172a; border: 1px solid ${isEmpty ? "#334155" : "#6366f1"}; border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; box-shadow: ${isEmpty ? "none" : "0 0 10px rgba(99,102,241,0.2)"};`;
      card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 22px;">${isEmpty ? "✋" : getItemIcon(item)}</span>
          <div>
            <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">${hand === "L" ? "Left Hand" : "Right Hand"}</div>
            <div style="font-size: 13px; font-weight: 700; color: ${isEmpty ? "#64748b" : "#f8fafc"};">${item}</div>
          </div>
        </div>
      `;
      if (!isEmpty) {
        const btn = document.createElement("button");
        btn.className = "vn-btn vn-btn-sm vn-btn-warning";
        btn.style.cssText = "padding: 4px 10px; font-size: 11px; cursor: pointer;";
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

    // 2. Carried Items (RPG Card Grid)
    const carriedSection = document.createElement("div");
    carriedSection.className = "vn-section";
    carriedSection.innerHTML = `<h4>🎒 Carried Backpack (${inv.carried?.length || 0})</h4>`;
    const carriedGrid = document.createElement("div");
    carriedGrid.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px;";

    if (!inv.carried || inv.carried.length === 0) {
      carriedGrid.innerHTML = `<div class="vn-muted" style="grid-column: 1 / -1; padding: 12px; text-align: center; background: #0f172a; border-radius: 8px; border: 1px dashed #334155;">Backpack is empty.</div>`;
    } else {
      for (const item of inv.carried) {
        const card = document.createElement("div");
        card.style.cssText = "background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; justify-content: space-between; gap: 8px; transition: border-color 0.15s ease;";
        card.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">${getItemIcon(item)}</span>
            <span style="font-size: 12px; font-weight: 600; color: #f8fafc; word-break: break-word; line-height: 1.3;">${item}</span>
          </div>
          <div style="display: flex; gap: 4px; margin-top: auto; padding-top: 6px; border-top: 1px solid #1e293b;">
            <button class="vn-btn vn-btn-sm vn-btn-primary vn-equip-btn" style="flex: 1; padding: 3px 0; font-size: 10px; font-weight: 600;">Equip</button>
            <button class="vn-btn vn-btn-sm vn-btn-secondary vn-use-btn" style="flex: 1; padding: 3px 0; font-size: 10px; font-weight: 600;">Use</button>
            <button class="vn-btn vn-btn-sm vn-btn-danger vn-drop-btn" style="padding: 3px 6px; font-size: 10px;" title="Drop">✕</button>
          </div>
        `;

        card.querySelector(".vn-equip-btn")?.addEventListener("click", () => {
          this.onAction(`*Equips ${item} in hand*`);
        });
        card.querySelector(".vn-use-btn")?.addEventListener("click", () => {
          this.onAction(`*Uses ${item}*`);
        });
        card.querySelector(".vn-drop-btn")?.addEventListener("click", () => {
          this.onAction(`*Drops ${item} on the ground*`);
        });

        carriedGrid.appendChild(card);
      }
    }
    carriedSection.appendChild(carriedGrid);
    this.root.appendChild(carriedSection);

    // 3. Room Container
    const roomSection = document.createElement("div");
    roomSection.className = "vn-section";
    const roomLoc = inv.room_location ? ` (${inv.room_location})` : "";
    roomSection.innerHTML = `<h4>📦 Room Container${roomLoc}</h4>`;
    const roomGrid = document.createElement("div");
    roomGrid.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px;";

    if (!inv.room || inv.room.length === 0) {
      roomGrid.innerHTML = `<div class="vn-muted" style="grid-column: 1 / -1; padding: 12px; text-align: center; background: #0f172a; border-radius: 8px; border: 1px dashed #334155;">Container is empty.</div>`;
    } else {
      for (const item of inv.room) {
        const card = document.createElement("div");
        card.style.cssText = "background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 10px; display: flex; justify-content: space-between; align-items: center; gap: 8px;";
        card.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">${getItemIcon(item)}</span>
            <span style="font-size: 12px; font-weight: 600; color: #cbd5e1; word-break: break-word;">${item}</span>
          </div>
          <button class="vn-btn vn-btn-sm vn-btn-primary vn-take-btn" style="padding: 3px 8px; font-size: 10px; font-weight: 600;">Take</button>
        `;

        card.querySelector(".vn-take-btn")?.addEventListener("click", () => {
          this.onAction(`*Takes ${item} from container*`);
        });

        roomGrid.appendChild(card);
      }
    }
    roomSection.appendChild(roomGrid);
    this.root.appendChild(roomSection);
  }
}
