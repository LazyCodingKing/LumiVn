import type { LedgerData, ActorInventory } from "../../shared/types.js";

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

// Legacy exports kept for backward-compatibility with external callers/tests
export interface DistrictShop {
  id: string;
  name: string;
  icon: string;
  placeKey: string;
  openHour: number;
  closeHour: number;
  shopkeeper: string;
  items: Array<{ id: string; name: string; icon: string; price: number; stock: number; maxStock: number; desc: string }>;
}
export const DEFAULT_DISTRICT_SHOPS: DistrictShop[] = [];
export function isShopOpen(shop: DistrictShop, hour: number): boolean {
  if (shop.openHour <= shop.closeHour) {
    return hour >= shop.openHour && hour < shop.closeHour;
  }
  return hour >= shop.openHour || hour < shop.closeHour;
}
export function extractDistrictShops(_ledger: LedgerData): DistrictShop[] {
  return [];
}

export function getItemIcon(itemName: string): string {
  const norm = itemName.toLowerCase();
  // Screens & Technology
  if (norm.includes("tv") || norm.includes("television") || norm.includes("screen") || norm.includes("monitor") || norm.includes("display")) return "📺";
  if (norm.includes("phone") || norm.includes("smartphone") || norm.includes("device") || norm.includes("cell")) return "📱";
  if (norm.includes("laptop") || norm.includes("computer") || norm.includes("pc") || norm.includes("terminal")) return "💻";
  if (norm.includes("radio") || norm.includes("stereo") || norm.includes("speaker") || norm.includes("audio")) return "📻";
  if (norm.includes("camera")) return "📷";

  // Furniture & Architecture
  if (norm.includes("bed") || norm.includes("futon") || norm.includes("mattress") || norm.includes("cot")) return "🛏️";
  if (norm.includes("sofa") || norm.includes("couch") || norm.includes("chair") || norm.includes("seat") || norm.includes("bench")) return "🛋️";
  if (norm.includes("desk") || norm.includes("table") || norm.includes("counter")) return "🪵";
  if (norm.includes("door") || norm.includes("gate") || norm.includes("portal") || norm.includes("exit") || norm.includes("entrance")) return "🚪";
  if (norm.includes("window") || norm.includes("balcony")) return "🪟";
  if (norm.includes("mirror")) return "🪞";
  if (norm.includes("lamp") || norm.includes("lantern") || norm.includes("light") || norm.includes("candle") || norm.includes("torch")) return "🏮";
  if (norm.includes("chest") || norm.includes("safe") || norm.includes("crate") || norm.includes("box") || norm.includes("closet") || norm.includes("wardrobe") || norm.includes("cabinet")) return "🧰";

  // Weapons & Tools
  if (norm.includes("sword") || norm.includes("blade") || norm.includes("katana") || norm.includes("knife") || norm.includes("dagger") || norm.includes("weapon") || norm.includes("gun") || norm.includes("pistol") || norm.includes("rifle") || norm.includes("spear") || norm.includes("bow")) return "🗡️";
  if (norm.includes("shield") || norm.includes("armor")) return "🛡️";
  if (norm.includes("key") || norm.includes("card") || norm.includes("pass") || norm.includes("keycard") || norm.includes("lockpick")) return "🔑";
  if (norm.includes("tool") || norm.includes("wrench") || norm.includes("hammer")) return "🔧";

  // Medicine & Potions
  if (norm.includes("potion") || norm.includes("draught") || norm.includes("elixir") || norm.includes("medicine") || norm.includes("pill") || norm.includes("aid") || norm.includes("bandage") || norm.includes("salve") || norm.includes("ointment")) return "🧪";

  // Books & Documents
  if (norm.includes("book") || norm.includes("letter") || norm.includes("note") || norm.includes("scroll") || norm.includes("diary") || norm.includes("journal") || norm.includes("tome") || norm.includes("paper") || norm.includes("document") || norm.includes("file")) return "📖";

  // Food & Sustenance
  if (norm.includes("food") || norm.includes("apple") || norm.includes("snack") || norm.includes("bento") || norm.includes("bread") || norm.includes("loaf") || norm.includes("cake") || norm.includes("meal") || norm.includes("dish") || norm.includes("sandwich") || norm.includes("soup") || norm.includes("meat")) return "🥪";
  if (norm.includes("coffee") || norm.includes("tea") || norm.includes("cup") || norm.includes("mug")) return "☕";
  if (norm.includes("wine") || norm.includes("beer") || norm.includes("ale") || norm.includes("whiskey") || norm.includes("liquor") || norm.includes("cocktail") || norm.includes("champagne")) return "🍷";
  if (norm.includes("water") || norm.includes("drink") || norm.includes("soda") || norm.includes("juice") || norm.includes("bottle")) return "🥤";

  // Clothes & Accessories
  if (norm.includes("ring") || norm.includes("necklace") || norm.includes("amulet") || norm.includes("badge") || norm.includes("ribbon") || norm.includes("jewel") || norm.includes("gem")) return "💍";
  if (norm.includes("cloth") || norm.includes("shirt") || norm.includes("pants") || norm.includes("dress") || norm.includes("jacket") || norm.includes("coat") || norm.includes("suit") || norm.includes("robe") || norm.includes("uniform")) return "👗";
  if (norm.includes("wallet") || norm.includes("money") || norm.includes("coin") || norm.includes("cash") || norm.includes("gold") || norm.includes("currency")) return "💰";
  if (norm.includes("bag") || norm.includes("backpack") || norm.includes("case") || norm.includes("pouch") || norm.includes("duffel") || norm.includes("suitcase")) return "🎒";

  // Environment & Nature
  if (norm.includes("car") || norm.includes("vehicle") || norm.includes("bike") || norm.includes("motorcycle")) return "🚗";
  if (norm.includes("flower") || norm.includes("plant") || norm.includes("rose") || norm.includes("herb")) return "🌸";
  if (norm.includes("fire") || norm.includes("hearth") || norm.includes("flame")) return "🔥";

  return "📦";
}

export function getCharacterIcon(charName: string, role?: string, status?: string): string {
  const norm = `${charName} ${role || ""} ${status || ""}`.toLowerCase();
  if (norm.includes("wizard") || norm.includes("mage") || norm.includes("witch") || norm.includes("sorcer") || norm.includes("alchemist")) return "🧙‍♀️";
  if (norm.includes("knight") || norm.includes("warrior") || norm.includes("guard") || norm.includes("soldier") || norm.includes("blade") || norm.includes("fighter")) return "⚔️";
  if (norm.includes("queen") || norm.includes("king") || norm.includes("princess") || norm.includes("prince") || norm.includes("noble") || norm.includes("lord") || norm.includes("lady")) return "👑";
  if (norm.includes("doctor") || norm.includes("medic") || norm.includes("nurse") || norm.includes("healer")) return "🩺";
  if (norm.includes("detective") || norm.includes("police") || norm.includes("investigator") || norm.includes("agent") || norm.includes("spy")) return "🕵️";
  if (norm.includes("teacher") || norm.includes("professor") || norm.includes("scholar") || norm.includes("student") || norm.includes("sensei")) return "🎓";
  if (norm.includes("maid") || norm.includes("servant")) return "🫖";
  if (norm.includes("butler") || norm.includes("waiter")) return "🤵";
  if (norm.includes("merchant") || norm.includes("shopkeeper") || norm.includes("trader") || norm.includes("vendor")) return "💰";
  if (norm.includes("singer") || norm.includes("idol") || norm.includes("musician") || norm.includes("bard") || norm.includes("artist")) return "🎤";
  if (norm.includes("ninja") || norm.includes("assassin") || norm.includes("thief") || norm.includes("rogue")) return "🥷";
  if (norm.includes("girl") || norm.includes("woman") || norm.includes("sister") || norm.includes("mother") || norm.includes("female") || norm.includes("lady") || norm.includes("jessica") || norm.includes("tessa") || norm.includes("leslie") || norm.includes("akane")) return "🌸";
  if (norm.includes("boy") || norm.includes("man") || norm.includes("brother") || norm.includes("father") || norm.includes("male") || norm.includes("guy")) return "👨";
  return "👤";
}

export function getCharacterMoodBadge(status?: string, passion?: number): string {
  const norm = (status || "").toLowerCase();
  if (norm.includes("happy") || norm.includes("smile") || norm.includes("joy") || norm.includes("laugh") || norm.includes("tipsy") || norm.includes("warm")) return "😊";
  if (norm.includes("angry") || norm.includes("rage") || norm.includes("mad") || norm.includes("furious") || norm.includes("hostile")) return "💢";
  if (norm.includes("sad") || norm.includes("cry") || norm.includes("grief") || norm.includes("tear") || norm.includes("depressed")) return "😢";
  if (norm.includes("blush") || norm.includes("shy") || norm.includes("fluster") || norm.includes("embarrass") || norm.includes("teasing")) return "😳";
  if (norm.includes("fear") || norm.includes("scare") || norm.includes("nervous") || norm.includes("anxious") || norm.includes("panic")) return "😨";
  if (norm.includes("excited") || norm.includes("sparkle") || norm.includes("hyper")) return "✨";
  if (norm.includes("thinking") || norm.includes("curious") || norm.includes("ponder")) return "🤔";
  if (norm.includes("calm") || norm.includes("relax") || norm.includes("sleep") || norm.includes("peace")) return "😌";
  if (typeof passion === "number" && passion > 60) return "💖";
  return "💬";
}

export function getTwineCharacterActions(charName: string, placeName: string): Array<{ label: string; action: string }> {
  return [
    { label: `Talk with ${charName}`, action: `*Approaches ${charName} to talk*` },
    { label: `Greet ${charName}`, action: `*Nods and greets ${charName} warmly*` },
    { label: `Observe ${charName}`, action: `*Observes ${charName}'s expressions and posture*` },
    { label: `Inquire about ${placeName}`, action: `*Asks ${charName} about what is going on here in ${placeName}*` },
  ];
}

export function getTwineItemActions(itemName: string): Array<{ label: string; action: string }> {
  const lower = itemName.toLowerCase();
  const actions: Array<{ label: string; action: string }> = [];

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
  } else if (lower.includes("tea") || lower.includes("coffee") || lower.includes("drink") || lower.includes("draught") || lower.includes("elixir") || lower.includes("potion") || lower.includes("wine") || lower.includes("water")) {
    actions.push(
      { label: `Sip ${itemName}`, action: `*Takes a warm, slow sip of ${itemName}*` },
      { label: `Smell aroma of ${itemName}`, action: `*Breathes in the aroma of ${itemName}*` },
      { label: `Offer ${itemName} to companion`, action: `*Offers a cup of ${itemName} to a companion*` }
    );
  } else if (lower.includes("food") || lower.includes("meal") || lower.includes("snack") || lower.includes("bread") || lower.includes("cake") || lower.includes("apple") || lower.includes("sandwich")) {
    actions.push(
      { label: `Eat ${itemName}`, action: `*Eats the ${itemName} thoughtfully*` },
      { label: `Savor a bite of ${itemName}`, action: `*Takes a slow bite of ${itemName}*` },
      { label: `Share ${itemName}`, action: `*Shares the ${itemName} with a companion*` }
    );
  } else if (lower.includes("bed") || lower.includes("sofa") || lower.includes("couch") || lower.includes("futon") || lower.includes("chair")) {
    actions.push(
      { label: `Rest on ${itemName}`, action: `*Lies down comfortably on the ${itemName} to rest*` },
      { label: `Sit on ${itemName}`, action: `*Sits down on the ${itemName} and relaxes*` },
      { label: `Take a brief nap`, action: `*Closes eyes and drifts into a brief nap on the ${itemName}*` }
    );
  } else if (lower.includes("book") || lower.includes("novel") || lower.includes("scroll") || lower.includes("journal") || lower.includes("note")) {
    actions.push(
      { label: `Read ${itemName}`, action: `*Opens the ${itemName} and reads through the pages*` },
      { label: `Skim ${itemName} for notes`, action: `*Skims through the ${itemName} searching for interesting details*` },
      { label: `Close ${itemName}`, action: `*Bookmarks the ${itemName} and sets it down*` }
    );
  } else if (lower.includes("door") || lower.includes("gate")) {
    actions.push(
      { label: `Knock on ${itemName}`, action: `*Knocks firmly on the ${itemName}*` },
      { label: `Open ${itemName}`, action: `*Carefully opens the ${itemName} and peers through*` }
    );
  } else if (lower.includes("mirror")) {
    actions.push(
      { label: `Look in mirror`, action: `*Looks into the mirror, checking appearance and expression*` }
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
  public currentView: "inventory" | "scene" | "marketplace" = "inventory";

  constructor(onAction: (actionText: string) => void) {
    this.onAction = onAction;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-inventory";
  }

  public render(ledger: LedgerData, activeActorId?: string): void {
    this.root.innerHTML = "";

    const isSceneView = this.currentView === "scene" || this.currentView === "marketplace";
    const actorId = activeActorId || (ledger.actors?.["user"] ? "user" : Object.keys(ledger.actors || {})[0] || "user");
    const actor = ledger.actors?.[actorId];
    const inv: ActorInventory = actor?.inventory || {
      in_hand: { L: "Empty", R: "Empty" },
      carried: [],
      room: [],
      room_location: "",
    };

    const currentPlace = ledger.scene?.place || ledger.clock?.location || "";
    const cleanPlaceKey = currentPlace.replace(/^@/, "");
    const placeNamePart = cleanPlaceKey.includes(":") ? cleanPlaceKey.split(":")[1]! : cleanPlaceKey;
    const sceneDisplayName = (placeNamePart || "Current Scene")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <h3 style="margin: 0; font-size: 15px; color: #f8fafc; display: flex; align-items: center; gap: 6px;">
            <span>${isSceneView ? "🎬" : "🎒"}</span>
            <span>${!isSceneView ? `Inventory & Containers — ${actor?.name || actorId}` : `Current Scene: ${sceneDisplayName}`}</span>
          </h3>
          <p class="vn-muted" style="margin: 2px 0 0 0; font-size: 11px;">
            <span>⏱️ <strong>${ledger.clock?.t || "D1 12:00"}</strong> (${ledger.clock?.phase || "Day"})</span>
            ${ledger.clock?.location ? `<span> • 📍 ${ledger.clock.location}</span>` : ""}
          </p>
        </div>
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 2px; display: flex; gap: 4px;">
          <button id="vn-inv-tab-btn" style="border: none; border-radius: 4px; padding: 4px 10px; font-size: 11px; cursor: pointer; ${!isSceneView ? "background: #6366f1; color: #fff; font-weight: 600;" : "background: transparent; color: #94a3b8;"}">
            🎒 Backpack
          </button>
          <button id="vn-scene-tab-btn" class="vn-market-tab-btn" style="border: none; border-radius: 4px; padding: 4px 10px; font-size: 11px; cursor: pointer; ${isSceneView ? "background: #6366f1; color: #fff; font-weight: 600;" : "background: transparent; color: #94a3b8;"}">
            🎬 Current Scene
          </button>
        </div>
      </div>
    `;
    this.root.appendChild(header);

    header.querySelector("#vn-inv-tab-btn")?.addEventListener("click", () => {
      this.currentView = "inventory";
      this.render(ledger, activeActorId);
    });

    header.querySelector("#vn-scene-tab-btn, .vn-market-tab-btn")?.addEventListener("click", () => {
      this.currentView = "scene";
      this.render(ledger, activeActorId);
    });

    if (isSceneView) {
      this.renderSceneView(ledger, inv, activeActorId);
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

  private renderSceneView(ledger: LedgerData, inv: ActorInventory, activeActorId?: string): void {
    const sceneWrap = document.createElement("div");
    sceneWrap.style.cssText = "display: flex; flex-direction: column; gap: 14px;";

    const currentPlace = ledger.scene?.place || ledger.clock?.location || "";
    const placeData = ledger.places?.[currentPlace] || {};
    const cleanPlaceKey = currentPlace.replace(/^@/, "");
    const placeNamePart = cleanPlaceKey.includes(":") ? cleanPlaceKey.split(":")[1]! : cleanPlaceKey;
    const sceneDisplayName = (placeNamePart || "Current Scene")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    // 1. Atmosphere & Context Banner
    const banner = document.createElement("div");
    banner.style.cssText = "background: #0f172a; border: 1px solid #3b82f6; border-radius: 8px; padding: 10px 14px; font-size: 11px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;";
    
    const atmosphereText = ledger.scene?.atmosphere
      ? ` • ✨ <em>${ledger.scene.atmosphere}</em>`
      : "";
    const threadsText = Array.isArray(ledger.scene?.threads) && ledger.scene.threads.length > 0
      ? ` • 📌 Threads: <span style="color: #93c5fd;">${ledger.scene.threads.join(", ")}</span>`
      : "";

    banner.innerHTML = `
      <div>
        <strong style="color: #60a5fa;">📍 ${sceneDisplayName}</strong>
        <span style="color: #cbd5e1;">(${currentPlace || "Local Scene"})${atmosphereText}${threadsText}</span>
      </div>
      <div style="color: #94a3b8; font-size: 10px;">
        Environment & Characters
      </div>
    `;
    sceneWrap.appendChild(banner);

    // 2. Characters Present in Current Scene
    const presentChars: Array<{
      id: string;
      name: string;
      role?: string;
      status?: string;
      icon: string;
      avatarUrl?: string;
      moodBadge: string;
    }> = [];
    const seenCharIds = new Set<string>();
    const activeUserKey = (activeActorId || "user").toLowerCase();

    // 2a. Participants from ledger.scene.participants
    const participants = Array.isArray(ledger.scene?.participants) ? ledger.scene.participants : [];
    for (const p of participants) {
      const pKey = String(p).toLowerCase().replace(/^@/, "");
      if (pKey === activeUserKey || pKey === "user" || pKey === "{{user}}") continue;
      if (seenCharIds.has(pKey)) continue;

      const actor = ledger.actors?.[pKey] || Object.values(ledger.actors || {}).find(a => (a.name || "").toLowerCase() === pKey);
      const rosterEntry = (ledger.roster || []).find(r => r.id?.toLowerCase() === pKey || r.name?.toLowerCase() === pKey);

      const name = actor?.name || rosterEntry?.name || pKey.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      const status = rosterEntry?.status || actor?.status || actor?.activity || (actor?.attire ? `Attire: ${actor.attire}` : "Present in scene");
      const role = rosterEntry?.role || (actor as any)?.role || "";
      const icon = getCharacterIcon(name, role, status);
      const moodBadge = getCharacterMoodBadge(status, (actor?.stats as any)?.passion);

      seenCharIds.add(pKey);
      presentChars.push({
        id: pKey,
        name,
        role,
        status,
        icon,
        avatarUrl: (actor as any)?.image_id ? `/api/v1/images/${(actor as any).image_id}` : undefined,
        moodBadge,
      });
    }

    // 2b. Characters from ledger.roster matching location
    if (Array.isArray(ledger.roster)) {
      for (const r of ledger.roster) {
        const rKey = (r.id || r.name || "").toLowerCase();
        if (rKey === activeUserKey || rKey === "user") continue;
        if (seenCharIds.has(rKey)) continue;
        if (r.loc && currentPlace && r.loc.toLowerCase() === currentPlace.toLowerCase()) {
          seenCharIds.add(rKey);
          const actor = ledger.actors?.[rKey];
          const name = r.name || rKey.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
          const status = r.status || actor?.status || "Present in location";
          const icon = getCharacterIcon(name, r.role, status);
          const moodBadge = getCharacterMoodBadge(status);
          presentChars.push({
            id: rKey,
            name,
            role: r.role,
            status,
            icon,
            avatarUrl: (actor as any)?.image_id ? `/api/v1/images/${(actor as any).image_id}` : undefined,
            moodBadge,
          });
        }
      }
    }

    // 2c. Characters from ledger.actors matching location
    if (ledger.actors) {
      for (const [aKey, actor] of Object.entries(ledger.actors)) {
        const normKey = aKey.toLowerCase();
        if (normKey === activeUserKey || normKey === "user") continue;
        if (seenCharIds.has(normKey)) continue;
        const aLoc = (actor.location || (actor as any)?.loc || "").toLowerCase();
        if (aLoc && currentPlace && aLoc === currentPlace.toLowerCase()) {
          seenCharIds.add(normKey);
          const name = actor.name || normKey.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
          const status = actor.status || actor.activity || (actor.attire ? `Attire: ${actor.attire}` : "Present in location");
          const icon = getCharacterIcon(name, (actor as any)?.role, status);
          const moodBadge = getCharacterMoodBadge(status, (actor?.stats as any)?.passion);
          presentChars.push({
            id: normKey,
            name,
            status,
            icon,
            avatarUrl: (actor as any)?.image_id ? `/api/v1/images/${(actor as any).image_id}` : undefined,
            moodBadge,
          });
        }
      }
    }

    const charsSection = document.createElement("div");
    charsSection.className = "vn-scene-chars-section";
    charsSection.style.cssText = "background: #0f172a; border: 1px solid #818cf8; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px;";
    charsSection.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 8px;">
        <strong style="color: #a5b4fc; font-size: 13px; display: flex; align-items: center; gap: 6px;">
          <span>👥</span> <span>Characters in Current Scene (${presentChars.length})</span>
        </strong>
        <span style="font-size: 10px; color: #94a3b8;">Choose dialogue choices or speak directly</span>
      </div>
      ${presentChars.length === 0 ? `
        <div style="background: #1e293b; border: 1px dashed #334155; border-radius: 8px; padding: 12px; text-align: center; color: #94a3b8; font-size: 11px;">
          No other characters currently present in ${sceneDisplayName}.
          <div style="margin-top: 8px;">
            <button class="vn-twine-action-btn" data-action="*Waits quietly to see if anyone arrives in ${sceneDisplayName}*" style="background: rgba(15, 23, 42, 0.7); border: 1px solid #818cf8; border-radius: 4px; padding: 4px 10px; color: #c7d2fe; font-size: 11px; cursor: pointer; font-family: ui-monospace, Menlo, monospace;">
              [[ ⏳ Wait quietly ]]
            </button>
          </div>
        </div>
      ` : `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px;">
          ${presentChars.map((char) => {
            const charActions = getTwineCharacterActions(char.name, sceneDisplayName);
            return `
              <div class="vn-scene-char-card" style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  ${char.avatarUrl ? `
                    <img src="${char.avatarUrl}" alt="${char.name}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid #818cf8;" />
                  ` : `
                    <div style="width: 36px; height: 36px; border-radius: 50%; background: #312e81; border: 1px solid #6366f1; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                      ${char.icon}
                    </div>
                  `}
                  <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <strong style="color: #f8fafc; font-size: 12px;">${char.name}</strong>
                      <span style="font-size: 12px;">${char.moodBadge}</span>
                    </div>
                    <div style="font-size: 10px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      ${char.status || "Present"}
                    </div>
                  </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 4px; border-top: 1px solid #2d3748; padding-top: 6px;">
                  ${charActions.map((act) => `
                    <button class="vn-twine-action-btn" data-action="${act.action.replace(/"/g, '&quot;')}" style="background: rgba(15, 23, 42, 0.7); border: 1px solid #818cf8; border-radius: 4px; padding: 4px 8px; color: #c7d2fe; font-size: 11px; text-align: left; cursor: pointer; transition: all 0.15s ease; font-family: ui-monospace, Menlo, monospace;">
                      [[ ${act.label} ]]
                    </button>
                  `).join("")}
                </div>

                <div class="vn-char-say-row" style="display: flex; gap: 6px; margin-top: 4px; border-top: 1px solid #2d3748; padding-top: 6px;">
                  <input type="text" class="vn-char-say-input" data-char-name="${char.name}" placeholder="Say something to ${char.name}..." style="flex: 1; background: #0f172a; border: 1px solid #475569; border-radius: 4px; padding: 4px 8px; color: #f8fafc; font-size: 11px; outline: none;" />
                  <button class="vn-char-say-btn" data-char-name="${char.name}" style="background: #6366f1; border: none; border-radius: 4px; padding: 4px 10px; color: #fff; font-size: 11px; font-weight: 600; cursor: pointer;">
                    💬 Say
                  </button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      `}
    `;
    sceneWrap.appendChild(charsSection);

    // 3. Objects & Interactables in Current Scene
    const rawObjects: string[] = [
      ...(placeData.resources || []),
      ...(placeData.affordances || []),
      ...(ledger.scene?.affordances || []),
      ...(inv.room || []),
    ];

    const seenObjects = new Set<string>();
    const displayObjects: string[] = [];
    for (const obj of rawObjects) {
      const clean = String(obj).trim();
      const lower = clean.toLowerCase();
      if (clean && !seenObjects.has(lower)) {
        seenObjects.add(lower);
        displayObjects.push(clean);
      }
    }

    const objectsSection = document.createElement("div");
    objectsSection.className = "vn-scene-objects-section";
    objectsSection.style.cssText = "background: #0f172a; border: 1px solid #38bdf8; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px;";
    objectsSection.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 8px;">
        <strong style="color: #38bdf8; font-size: 13px; display: flex; align-items: center; gap: 6px;">
          <span>🔍</span> <span>Discovered & Present Objects in ${sceneDisplayName} (${displayObjects.length})</span>
        </strong>
        <span style="font-size: 10px; color: #94a3b8;">Click hypertext choices to interact directly</span>
      </div>
      ${displayObjects.length === 0 ? `
        <div style="background: #1e293b; border: 1px dashed #334155; border-radius: 8px; padding: 12px; text-align: center; color: #94a3b8; font-size: 11px;">
          No interactable objects currently recorded in ${sceneDisplayName}.
          <div style="margin-top: 8px; display: flex; justify-content: center; gap: 8px;">
            <button class="vn-twine-action-btn" data-action="*Examines the surroundings of ${sceneDisplayName} carefully*" style="background: rgba(15, 23, 42, 0.7); border: 1px solid #38bdf8; border-radius: 4px; padding: 4px 10px; color: #7dd3fc; font-size: 11px; cursor: pointer; font-family: ui-monospace, Menlo, monospace;">
              [[ 🔍 Examine surroundings ]]
            </button>
            <button class="vn-twine-action-btn" data-action="*Searches ${sceneDisplayName} for anything useful*" style="background: rgba(15, 23, 42, 0.7); border: 1px solid #38bdf8; border-radius: 4px; padding: 4px 10px; color: #7dd3fc; font-size: 11px; cursor: pointer; font-family: ui-monospace, Menlo, monospace;">
              [[ 🚪 Search room ]]
            </button>
          </div>
        </div>
      ` : `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px;">
          ${displayObjects.map((obj) => {
            const twineActions = getTwineItemActions(obj);
            return `
              <div class="vn-present-obj-card" style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 20px;">${getItemIcon(obj)}</span>
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
      `}
    `;
    sceneWrap.appendChild(objectsSection);

    // Bind all Twine choice buttons
    sceneWrap.querySelectorAll(".vn-twine-action-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const act = (btn as HTMLElement).dataset.action;
        if (act) this.onAction(act);
      });
    });

    // Bind Direct Dialogue Say buttons & Enter key
    sceneWrap.querySelectorAll(".vn-char-say-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const charName = (btn as HTMLElement).dataset.charName;
        const row = (btn as HTMLElement).closest(".vn-char-say-row");
        const input = row?.querySelector(".vn-char-say-input") as HTMLInputElement | null;
        if (charName && input && input.value.trim()) {
          const text = input.value.trim();
          this.onAction(`*To ${charName}:* "${text}"`);
          input.value = "";
        }
      });
    });

    sceneWrap.querySelectorAll(".vn-char-say-input").forEach((inp) => {
      inp.addEventListener("keydown", (e) => {
        if ((e as KeyboardEvent).key === "Enter") {
          const charName = (inp as HTMLInputElement).dataset.charName;
          const text = (inp as HTMLInputElement).value.trim();
          if (charName && text) {
            this.onAction(`*To ${charName}:* "${text}"`);
            (inp as HTMLInputElement).value = "";
          }
        }
      });
    });

    this.root.appendChild(sceneWrap);
  }
}
