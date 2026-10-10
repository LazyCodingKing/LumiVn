import type { LedgerData, ActorInventory, DistrictShop, DistrictShopItem } from "../../shared/types.js";

export function parseClockHour(clockT?: string, phase?: string): number {
  if (clockT) {
    const match = clockT.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      const h = parseInt(match[1]!, 10);
      const m = parseInt(match[2]!, 10);
      return h + m / 60;
    }
  }
  const p = (phase || "").toLowerCase();
  if (p.includes("dawn") || p.includes("morning")) return 8;
  if (p.includes("afternoon") || p.includes("noon")) return 14;
  if (p.includes("dusk") || p.includes("sunset") || p.includes("evening")) return 18;
  if (p.includes("night") || p.includes("midnight")) return 22;
  return 12;
}

export function isShopOpen(shop: DistrictShop, hour: number): boolean {
  if (shop.openHour <= shop.closeHour) {
    return hour >= shop.openHour && hour < shop.closeHour;
  }
  return hour >= shop.openHour || hour < shop.closeHour;
}

export const DEFAULT_DISTRICT_SHOPS: DistrictShop[] = [
  {
    id: "alchemist",
    name: "Apothecary & Alchemist's Emporium",
    icon: "⚗️",
    placeKey: "market",
    openHour: 8,
    closeHour: 20,
    shopkeeper: "Master Alchemist Lyra",
    items: [
      { id: "hp_potion", name: "Health Draught", icon: "🧪", type: "consumable", price: 35, stock: 5, maxStock: 10, desc: "Restores 45 HP immediately." },
      { id: "mp_elixir", name: "Starlight Elixir", icon: "💧", type: "consumable", price: 45, stock: 4, maxStock: 8, desc: "Restores 35 MP/Energy." },
      { id: "cure_salve", name: "Herbal Ointment", icon: "🌿", type: "consumable", price: 25, stock: 6, maxStock: 12, desc: "Soothes status conditions and fatigue." },
    ],
  },
  {
    id: "blacksmith",
    name: "Ironforge Armory & Smithy",
    icon: "⚒️",
    placeKey: "forge",
    openHour: 7,
    closeHour: 18,
    shopkeeper: "Goran the Smith",
    items: [
      { id: "steel_sword", name: "Tempered Steel Blade", icon: "🗡️", type: "equipment", price: 120, stock: 2, maxStock: 3, desc: "+15 Physical ATK in combat." },
      { id: "leather_armor", name: "Reinforced Leather Vest", icon: "🥋", type: "equipment", price: 95, stock: 3, maxStock: 4, desc: "+10 Armor & mitigation." },
      { id: "whetstone", name: "Dwarven Whetstone", icon: "🪨", type: "item", price: 20, stock: 8, maxStock: 10, desc: "Maintains weapon sharpness." },
    ],
  },
  {
    id: "bakery_inn",
    name: "The Golden Hearth Bakery & Tavern",
    icon: "🍞",
    placeKey: "tavern",
    openHour: 6,
    closeHour: 23,
    shopkeeper: "Innkeeper Martha",
    items: [
      { id: "fresh_loaf", name: "Warm Honey Bread", icon: "🥐", type: "consumable", price: 10, stock: 12, maxStock: 15, desc: "Delicious wholesome bread. Heals 15 HP." },
      { id: "spiced_tea", name: "Fragrant Spiced Tea", icon: "☕", type: "consumable", price: 12, stock: 10, maxStock: 15, desc: "Warms the heart, restores 10 MP." },
      { id: "tavern_ale", name: "Golden Amber Ale", icon: "🍺", type: "consumable", price: 15, stock: 10, maxStock: 20, desc: "Boosts courage and morale." },
    ],
  },
  {
    id: "night_market",
    name: "Velvet Crescent Night Bazaar",
    icon: "🌙",
    placeKey: "slums",
    openHour: 20,
    closeHour: 5,
    shopkeeper: "Shrouded Dealer Ren",
    items: [
      { id: "lockpick_set", name: "Thief's Tension Tools", icon: "🗝️", type: "item", price: 75, stock: 3, maxStock: 5, desc: "Opens locked chests and backdoors." },
      { id: "smoke_bomb", name: "Shadowflash Smoke Powder", icon: "💨", type: "consumable", price: 50, stock: 4, maxStock: 6, desc: "Guarantees escape or surprise attack." },
      { id: "spell_tome", name: "Tome of Forgotten Arcana", icon: "📖", type: "book", price: 180, stock: 1, maxStock: 1, desc: "Grants skill progression insight." },
    ],
  },
];

function getItemIcon(itemName: string): string {
  const norm = itemName.toLowerCase();
  if (norm.includes("sword") || norm.includes("blade") || norm.includes("katana") || norm.includes("knife") || norm.includes("dagger") || norm.includes("weapon") || norm.includes("gun")) return "🗡️";
  if (norm.includes("phone") || norm.includes("smartphone") || norm.includes("device") || norm.includes("terminal")) return "📱";
  if (norm.includes("key") || norm.includes("card") || norm.includes("pass")) return "🔑";
  if (norm.includes("potion") || norm.includes("draught") || norm.includes("elixir") || norm.includes("medicine") || norm.includes("pill") || norm.includes("aid") || norm.includes("bandage") || norm.includes("ointment")) return "🧪";
  if (norm.includes("book") || norm.includes("letter") || norm.includes("note") || norm.includes("scroll") || norm.includes("diary") || norm.includes("tome")) return "📜";
  if (norm.includes("food") || norm.includes("apple") || norm.includes("snack") || norm.includes("bento") || norm.includes("bread") || norm.includes("loaf")) return "🥪";
  if (norm.includes("drink") || norm.includes("water") || norm.includes("tea") || norm.includes("coffee") || norm.includes("soda") || norm.includes("bottle") || norm.includes("ale")) return "☕";
  if (norm.includes("ring") || norm.includes("necklace") || norm.includes("amulet") || norm.includes("badge") || norm.includes("ribbon")) return "💍";
  if (norm.includes("wallet") || norm.includes("money") || norm.includes("coin") || norm.includes("cash") || norm.includes("gold")) return "💰";
  if (norm.includes("bag") || norm.includes("backpack") || norm.includes("case") || norm.includes("pouch")) return "🎒";
  return "📦";
}

export function extractDistrictShops(ledger: LedgerData): DistrictShop[] {
  const dynamicShops: DistrictShop[] = [];
  const places = Object.entries(ledger.places || {});

  for (const [key, place] of places) {
    const fn = (place.function || key).toLowerCase();
    const isCommercial =
      fn.includes("shop") ||
      fn.includes("market") ||
      fn.includes("store") ||
      fn.includes("tavern") ||
      fn.includes("inn") ||
      fn.includes("forge") ||
      fn.includes("apothecary") ||
      fn.includes("bakery") ||
      fn.includes("merchant") ||
      (place.resources && place.resources.length > 0);

    if (isCommercial) {
      const cleanKey = key.replace(/^@/, "");
      const namePart = cleanKey.includes(":") ? cleanKey.split(":")[1]! : cleanKey;
      const displayName = namePart.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

      let icon = "🏪";
      if (fn.includes("tavern") || fn.includes("inn")) icon = "🍺";
      else if (fn.includes("forge") || fn.includes("smith")) icon = "⚒️";
      else if (fn.includes("apothecary") || fn.includes("herb")) icon = "⚗️";
      else if (fn.includes("bakery") || fn.includes("food")) icon = "🍞";

      const items: DistrictShopItem[] = (place.resources || []).map((res, idx) => ({
        id: `dyn_item_${cleanKey}_${idx}`,
        name: String(res).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        icon: getItemIcon(String(res)),
        type: "item",
        price: 20 + idx * 15,
        stock: 3,
        maxStock: 5,
        desc: `Local commodity available at ${displayName}.`,
      }));

      if (items.length === 0) {
        items.push({
          id: `dyn_item_${cleanKey}_staple`,
          name: `${displayName} Provisions`,
          icon: "📦",
          type: "consumable",
          price: 25,
          stock: 5,
          maxStock: 10,
          desc: `Essential local supplies from ${displayName}.`,
        });
      }

      dynamicShops.push({
        id: cleanKey,
        name: displayName,
        icon,
        placeKey: key,
        openHour: 7,
        closeHour: 21,
        shopkeeper: place.population || place.users || "Local Merchant",
        items,
      });
    }
  }

  // If no explicit commercial places were matched, synthesize shops for the active places
  if (dynamicShops.length === 0 && places.length > 0) {
    for (const [key, place] of places) {
      const cleanKey = key.replace(/^@/, "");
      const namePart = cleanKey.includes(":") ? cleanKey.split(":")[1]! : cleanKey;
      const displayName = namePart.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const fn = (place.function || cleanKey).toLowerCase();

      let icon = "🏪";
      let shopSuffix = "Supply Post";
      if (fn.includes("tavern") || fn.includes("inn") || fn.includes("bar") || fn.includes("lounge")) {
        icon = "🍺";
        shopSuffix = "Lounge Bar";
      } else if (fn.includes("forge") || fn.includes("smith") || fn.includes("armory")) {
        icon = "⚒️";
        shopSuffix = "Smithy & Armory";
      } else if (fn.includes("apothecary") || fn.includes("herb") || fn.includes("clinic") || fn.includes("medic")) {
        icon = "⚗️";
        shopSuffix = "Dispensary";
      } else if (fn.includes("kitchen") || fn.includes("dining") || fn.includes("pantry") || fn.includes("cafe")) {
        icon = "🍞";
        shopSuffix = "Provisions";
      } else if (fn.includes("dojo") || fn.includes("gym") || fn.includes("arena")) {
        icon = "🥋";
        shopSuffix = "Armory & Gear";
      } else if (fn.includes("school") || fn.includes("academy") || fn.includes("campus") || fn.includes("library")) {
        icon = "📚";
        shopSuffix = "Commissary";
      } else if (fn.includes("residence") || fn.includes("room") || fn.includes("house") || fn.includes("foyer") || fn.includes("mansion")) {
        icon = "🏠";
        shopSuffix = "Quartermaster";
      }

      const items: DistrictShopItem[] = (place.resources || []).map((res, idx) => ({
        id: `dyn_item_${cleanKey}_${idx}`,
        name: String(res).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        icon: getItemIcon(String(res)),
        type: "item",
        price: 20 + idx * 15,
        stock: 3,
        maxStock: 5,
        desc: `Local resource acquired from ${displayName}.`,
      }));

      if (items.length === 0) {
        items.push({
          id: `dyn_item_${cleanKey}_staple`,
          name: `${displayName} Supplies`,
          icon: "📦",
          type: "consumable",
          price: 25,
          stock: 5,
          maxStock: 10,
          desc: `Local commodity available at ${displayName}.`,
        });
      }

      dynamicShops.push({
        id: cleanKey,
        name: `${displayName} ${shopSuffix}`,
        icon,
        placeKey: key,
        openHour: 6,
        closeHour: 23,
        shopkeeper: place.population || place.users || `${displayName} Merchant`,
        items,
      });
    }
  }

  // If places was empty, synthesize shop from current scene.place or clock location
  if (dynamicShops.length === 0 && (ledger.scene?.place || ledger.clock?.location)) {
    const activePlace = ledger.scene?.place || ledger.clock?.location || "Local District";
    const cleanKey = activePlace.replace(/^@/, "");
    const namePart = cleanKey.includes(":") ? cleanKey.split(":")[1]! : cleanKey;
    const displayName = namePart.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    dynamicShops.push({
      id: cleanKey,
      name: `${displayName} Merchant Post`,
      icon: "🏪",
      placeKey: activePlace,
      openHour: 6,
      closeHour: 23,
      shopkeeper: "District Merchant",
      items: [
        {
          id: `dyn_item_${cleanKey}_staple`,
          name: `${displayName} Supplies`,
          icon: "📦",
          type: "consumable",
          price: 25,
          stock: 5,
          maxStock: 10,
          desc: `Local goods from ${displayName}.`,
        },
      ],
    });
  }

  if (dynamicShops.length > 0) {
    return [...dynamicShops, ...DEFAULT_DISTRICT_SHOPS];
  }
  return DEFAULT_DISTRICT_SHOPS;
}

export function getTwineItemActions(
  itemName: string,
  context?: { isShop?: boolean; price?: number; shopName?: string }
): Array<{ label: string; action: string }> {
  const lower = itemName.toLowerCase();
  const actions: Array<{ label: string; action: string }> = [];

  if (context?.isShop && context.price !== undefined) {
    actions.push(
      {
        label: `Buy for ${context.price}g`,
        action: `[Trade: Purchased 1x ${itemName} from ${context.shopName || "merchant"} for ${context.price} Gold]`,
      },
      {
        label: `Inspect ${itemName}`,
        action: `*Inspects the ${itemName} carefully on the counter*`,
      },
      {
        label: `Ask merchant about ${itemName}`,
        action: `*Asks the merchant about where they acquired this ${itemName}*`,
      }
    );
    return actions;
  }

  if (lower.includes("tv") || lower.includes("television") || lower.includes("screen") || lower.includes("monitor")) {
    actions.push(
      { label: "Watch TV broadcast", action: `*Turns on the TV and watches the current broadcast*` },
      { label: "Flip channels for news", action: `*Flips through TV channels checking the latest news and weather*` },
      { label: "Turn off TV", action: `*Turns off the television*` },
      { label: "Inspect TV display", action: `*Inspects the TV display and surroundings*` }
    );
  } else if (lower.includes("radio") || lower.includes("stereo")) {
    actions.push(
      { label: "Tune radio frequency", action: `*Turns the radio dial to find music and local chatter*` },
      { label: "Turn off radio", action: `*Turns off the radio*` }
    );
  } else if (lower.includes("tea") || lower.includes("coffee") || lower.includes("drink") || lower.includes("draught") || lower.includes("elixir") || lower.includes("potion")) {
    actions.push(
      { label: `Sip ${itemName}`, action: `*Takes a warm, slow sip of ${itemName}*` },
      { label: `Smell aroma of ${itemName}`, action: `*Breathes in the aroma of ${itemName}*` },
      { label: `Offer ${itemName} to companion`, action: `*Offers a cup of ${itemName} to a companion*` }
    );
  } else if (lower.includes("food") || lower.includes("meal") || lower.includes("snack") || lower.includes("bread") || lower.includes("cake") || lower.includes("apple")) {
    actions.push(
      { label: `Eat ${itemName}`, action: `*Eats the ${itemName} thoughtfully*` },
      { label: `Savor a bite of ${itemName}`, action: `*Takes a slow bite of ${itemName}*` },
      { label: `Share ${itemName}`, action: `*Shares the ${itemName} with a companion*` }
    );
  } else if (lower.includes("bed") || lower.includes("sofa") || lower.includes("couch") || lower.includes("futon")) {
    actions.push(
      { label: `Rest on ${itemName}`, action: `*Lies down comfortably on the ${itemName} to rest*` },
      { label: `Sit on ${itemName}`, action: `*Sits down on the ${itemName} and relaxes*` },
      { label: `Take a brief nap`, action: `*Closes eyes and drifts into a brief nap on the ${itemName}*` }
    );
  } else if (lower.includes("book") || lower.includes("novel") || lower.includes("scroll") || lower.includes("journal")) {
    actions.push(
      { label: `Read ${itemName}`, action: `*Opens the ${itemName} and reads through the pages*` },
      { label: `Skim ${itemName} for notes`, action: `*Skims through the ${itemName} searching for interesting details*` },
      { label: `Close ${itemName}`, action: `*Bookmarks the ${itemName} and sets it down*` }
    );
  } else {
    actions.push(
      { label: `Interact with ${itemName}`, action: `*Interacts with the ${itemName}*` },
      { label: `Examine ${itemName}`, action: `*Examines the ${itemName} closely*` },
      { label: `Pick up ${itemName}`, action: `*Reaches out to pick up the ${itemName}*` }
    );
  }

  return actions;
}

export class InventoryTab {
  public root: HTMLElement;
  private onAction: (actionText: string) => void;
  private currentView: "inventory" | "marketplace" = "inventory";
  public playerGold: number = 200;
  public shops: DistrictShop[] = JSON.parse(JSON.stringify(DEFAULT_DISTRICT_SHOPS));

  constructor(onAction: (actionText: string) => void) {
    this.onAction = onAction;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-inventory";
  }

  public render(ledger: LedgerData, activeActorId?: string): void {
    this.root.innerHTML = "";
    this.shops = extractDistrictShops(ledger);

    const actorId = activeActorId || (ledger.actors?.["user"] ? "user" : Object.keys(ledger.actors || {})[0] || "user");
    const actor = ledger.actors?.[actorId];
    const inv: ActorInventory = actor?.inventory || {
      in_hand: { L: "Empty", R: "Empty" },
      carried: [],
      room: [],
      room_location: "",
    };

    const currentHour = parseClockHour(ledger.clock?.t, ledger.clock?.phase);

    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <h3 style="margin: 0; font-size: 15px; color: #f8fafc; display: flex; align-items: center; gap: 6px;">
            <span>🎒</span> <span>${this.currentView === "inventory" ? `Inventory & Containers — ${actor?.name || actorId}` : "Living District Marketplace & Trading"}</span>
          </h3>
          <p class="vn-muted" style="margin: 2px 0 0 0; font-size: 11px;">
            <span>⏱️ <strong>${ledger.clock?.t || "D1 12:00"}</strong> (${ledger.clock?.phase || "Day"})</span>
            <span> • 💰 <strong style="color: #ffd700;">${this.playerGold} Gold</strong></span>
          </p>
        </div>
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 2px; display: flex; gap: 4px;">
          <button id="vn-inv-tab-btn" style="border: none; border-radius: 4px; padding: 4px 10px; font-size: 11px; cursor: pointer; ${this.currentView === "inventory" ? "background: #6366f1; color: #fff; font-weight: 600;" : "background: transparent; color: #94a3b8;"}">
            🎒 Backpack
          </button>
          <button id="vn-market-tab-btn" style="border: none; border-radius: 4px; padding: 4px 10px; font-size: 11px; cursor: pointer; ${this.currentView === "marketplace" ? "background: #6366f1; color: #fff; font-weight: 600;" : "background: transparent; color: #94a3b8;"}">
            🏪 Marketplace
          </button>
        </div>
      </div>
    `;
    this.root.appendChild(header);

    header.querySelector("#vn-inv-tab-btn")?.addEventListener("click", () => {
      this.currentView = "inventory";
      this.render(ledger, activeActorId);
    });
    header.querySelector("#vn-market-tab-btn")?.addEventListener("click", () => {
      this.currentView = "marketplace";
      this.render(ledger, activeActorId);
    });

    if (this.currentView === "marketplace") {
      this.renderMarketplaceView(ledger, inv, currentHour, activeActorId);
      return;
    }

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

  private renderMarketplaceView(ledger: LedgerData, inv: ActorInventory, currentHour: number, activeActorId?: string): void {
    const marketWrap = document.createElement("div");
    marketWrap.style.cssText = "display: flex; flex-direction: column; gap: 14px;";

    // Info Banner
    const banner = document.createElement("div");
    banner.style.cssText = "background: #0f172a; border: 1px solid #3b82f6; border-radius: 8px; padding: 10px 14px; font-size: 11px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;";
    banner.innerHTML = `
      <div>
        <strong style="color: #60a5fa;">Living District Trading Hub:</strong>
        <span style="color: #cbd5e1;"> Shops follow autonomous diurnal schedules. Visit open stalls to buy equipment or barter surplus carried items.</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="color: #fde047; font-weight: 700;">Wallet: ${this.playerGold}g</span>
        <button id="vn-market-add-funds" style="background: #1e293b; border: 1px solid #475569; color: #94a3b8; font-size: 10px; border-radius: 4px; padding: 2px 6px; cursor: pointer;">+50g</button>
      </div>
    `;
    marketWrap.appendChild(banner);

    banner.querySelector("#vn-market-add-funds")?.addEventListener("click", () => {
      this.playerGold += 50;
      this.render(ledger, activeActorId);
    });

    // 1. Present & Discovered Objects in Location (HTML Twine Choice Interactions)
    const currentPlace = ledger.scene?.place || ledger.clock?.location || "";
    const placeData = ledger.places?.[currentPlace] || {};
    const presentResources: string[] = [
      ...(placeData.resources || []),
      ...(placeData.affordances || []),
      ...(inv.room || []),
    ];
    const displayObjects = presentResources.length > 0
      ? presentResources
      : ["Television (TV)", "Comfortable Bed", "Coffee Maker", "Tea Set", "Desk & Books"];

    const objectsSection = document.createElement("div");
    objectsSection.style.cssText = "background: #0f172a; border: 1px solid #38bdf8; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px;";
    objectsSection.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 8px;">
        <strong style="color: #38bdf8; font-size: 13px; display: flex; align-items: center; gap: 6px;">
          <span>🔍</span> <span>Discovered & Present Objects in ${currentPlace || "Scene"} (Twine Actions)</span>
        </strong>
        <span style="font-size: 10px; color: #94a3b8;">Click hypertext choices to interact directly with the world</span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px;">
        ${displayObjects.map((obj) => {
          const twineActions = getTwineItemActions(obj);
          return `
            <div class="vn-present-obj-card" style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 18px;">${getItemIcon(obj)}</span>
                <strong style="color: #f8fafc; font-size: 12px;">${obj}</strong>
              </div>
              <div style="display: flex; flex-direction: column; gap: 4px; border-top: 1px solid #2d3748; padding-top: 6px;">
                ${twineActions.map((act) => `
                  <button class="vn-twine-action-btn" data-action="${act.action.replace(/"/g, '&quot;')}" style="background: rgba(15, 23, 42, 0.7); border: 1px solid #38bdf8; border-radius: 4px; padding: 4px 8px; color: #7dd3fc; font-size: 11px; text-align: left; cursor: pointer; transition: all 0.15s ease; font-family: ui-monospace, Menlo, monospace;">
                    [[ ${act.label} ]]
                  </button>
                `).join("")}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
    marketWrap.appendChild(objectsSection);

    objectsSection.querySelectorAll(".vn-twine-action-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const act = (btn as HTMLElement).dataset.action;
        if (act) this.onAction(act);
      });
    });

    // Shops List
    for (const shop of this.shops) {
      const open = isShopOpen(shop, currentHour);
      const shopCard = document.createElement("div");
      shopCard.style.cssText = `background: #0f172a; border: 1px solid ${open ? "#10b981" : "#334155"}; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; opacity: ${open ? "1" : "0.75"};`;

      const formatHour = (h: number) => `${String(Math.floor(h)).padStart(2, "0")}:00`;
      const hoursText = `${formatHour(shop.openHour)} - ${formatHour(shop.closeHour)}`;

      shopCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; border-bottom: 1px solid #1e293b; padding-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">${shop.icon}</span>
            <div>
              <strong style="color: #f8fafc; font-size: 13px;">${shop.name}</strong>
              <div style="font-size: 10px; color: #94a3b8;">
                Keeper: ${shop.shopkeeper || "Merchant"} • Location: <span style="color: #38bdf8;">${shop.placeKey}</span>
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 10px; color: #94a3b8;">Hours: ${hoursText}</span>
            <span style="font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 4px; background: ${open ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}; border: 1px solid ${open ? "#22c55e" : "#ef4444"}; color: ${open ? "#86efac" : "#fca5a5"};">
              ${open ? "🟢 OPEN" : "🔴 CLOSED"}
            </span>
          </div>
        </div>

        ${!open ? `
          <div style="color: #94a3b8; font-size: 11px; font-style: italic; padding: 6px 0;">
            The shutters are barred. This merchant operates strictly from ${hoursText}.
          </div>
        ` : `
          <!-- Items Stall Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px;">
            ${shop.items.map((item) => {
              const canAfford = this.playerGold >= item.price;
              const hasStock = item.stock > 0;
              return `
                <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; justify-content: space-between; gap: 6px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <span style="font-size: 16px;">${item.icon}</span>
                      <strong style="color: #f8fafc; font-size: 11px;">${item.name}</strong>
                    </div>
                    <span style="color: #ffd700; font-weight: 700; font-size: 11px;">${item.price}g</span>
                  </div>
                  <div style="font-size: 10px; color: #cbd5e1; line-height: 1.3;">
                    ${item.desc || "Standard commodity."}
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #2d3748; padding-top: 6px; margin-top: 2px;">
                    <span style="font-size: 9px; color: #94a3b8;">Stock: ${item.stock}/${item.maxStock}</span>
                    <button class="vn-buy-item-btn" data-shop-id="${shop.id}" data-item-id="${item.id}" style="background: ${canAfford && hasStock ? "linear-gradient(135deg, #059669, #10b981)" : "#334155"}; border: none; color: ${canAfford && hasStock ? "#fff" : "#94a3b8"}; font-size: 10px; font-weight: 700; border-radius: 4px; padding: 3px 10px; cursor: ${canAfford && hasStock ? "pointer" : "not-allowed"};">
                      ${!hasStock ? "Out of Stock" : !canAfford ? "Can't Afford" : "Buy"}
                    </button>
                  </div>
                  <div style="display: flex; gap: 4px; margin-top: 4px;">
                    <button class="vn-twine-link-inspect" data-item-name="${item.name}" style="flex: 1; background: rgba(15, 23, 42, 0.6); border: 1px dashed #38bdf8; color: #7dd3fc; border-radius: 4px; padding: 2px 4px; font-size: 9px; cursor: pointer; font-family: ui-monospace, Menlo, monospace;">
                      [[ Examine ]]
                    </button>
                    <button class="vn-twine-link-inquire" data-item-name="${item.name}" data-shop-name="${shop.name}" style="flex: 1; background: rgba(15, 23, 42, 0.6); border: 1px dashed #818cf8; color: #a5b4fc; border-radius: 4px; padding: 2px 4px; font-size: 9px; cursor: pointer; font-family: ui-monospace, Menlo, monospace;">
                      [[ Inquire ]]
                    </button>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        `}
      `;
      marketWrap.appendChild(shopCard);
    }

    // Sell Surplus Section
    if (inv.carried && inv.carried.length > 0) {
      const sellSection = document.createElement("div");
      sellSection.style.cssText = "background: #0f172a; border: 1px solid #eab308; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px;";
      sellSection.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #fde047; font-size: 12px; display: flex; align-items: center; gap: 6px;">
            <span>🤝</span> <span>Merchant Barter & Sell Back (Sell for 15g each)</span>
          </strong>
          <span style="font-size: 10px; color: #94a3b8;">Turn carried goods into gold coins</span>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${inv.carried.map((cItem, idx) => `
            <div style="background: #1e293b; border: 1px solid #475569; border-radius: 6px; padding: 4px 10px; display: flex; align-items: center; gap: 8px; font-size: 11px;">
              <span>${getItemIcon(cItem)} ${cItem}</span>
              <button class="vn-sell-item-btn" data-item-idx="${idx}" data-item-name="${cItem}" style="background: #eab308; border: none; color: #000; font-size: 10px; font-weight: 700; border-radius: 4px; padding: 2px 6px; cursor: pointer;">
                Sell (+15g)
              </button>
            </div>
          `).join("")}
        </div>
      `;
      marketWrap.appendChild(sellSection);

      sellSection.querySelectorAll(".vn-sell-item-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = parseInt((btn as HTMLElement).dataset.itemIdx || "-1", 10);
          const name = (btn as HTMLElement).dataset.itemName || "";
          if (idx >= 0 && inv.carried && inv.carried[idx]) {
            inv.carried.splice(idx, 1);
            this.playerGold += 15;
            this.onAction(`[Trade: Sold ${name} to merchant for 15 Gold]`);
            this.render(ledger, activeActorId);
          }
        });
      });
    }

    this.root.appendChild(marketWrap);

    marketWrap.querySelectorAll(".vn-buy-item-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const shopId = (btn as HTMLElement).dataset.shopId;
        const itemId = (btn as HTMLElement).dataset.itemId;
        const shop = this.shops.find((s) => s.id === shopId);
        const item = shop?.items.find((i) => i.id === itemId);
        if (shop && item && item.stock > 0 && this.playerGold >= item.price) {
          this.playerGold -= item.price;
          item.stock -= 1;
          if (!inv.carried) inv.carried = [];
          inv.carried.push(item.name);
          this.onAction(`[Trade: Purchased 1x ${item.name} from ${shop.name} for ${item.price} Gold]`);
          this.render(ledger, activeActorId);
        }
      });
    });

    marketWrap.querySelectorAll(".vn-twine-link-inspect").forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = (btn as HTMLElement).dataset.itemName;
        if (name) this.onAction(`*Inspects the ${name} closely on the counter*`);
      });
    });

    marketWrap.querySelectorAll(".vn-twine-link-inquire").forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = (btn as HTMLElement).dataset.itemName;
        const sname = (btn as HTMLElement).dataset.shopName || "merchant";
        if (name) this.onAction(`*Asks the ${sname} shopkeeper about the origins of ${name}*`);
      });
    });
  }
}
