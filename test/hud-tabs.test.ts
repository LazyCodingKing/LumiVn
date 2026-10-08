import { describe, expect, test, beforeAll } from "bun:test";
import { Window } from "happy-dom";

// Initialize happy-dom globals for headless UI testing
const window = new Window();
globalThis.window = window as any;
globalThis.document = window.document as any;
globalThis.HTMLElement = window.HTMLElement as any;
globalThis.HTMLSelectElement = window.HTMLSelectElement as any;
globalThis.HTMLButtonElement = window.HTMLButtonElement as any;
globalThis.HTMLDivElement = window.HTMLDivElement as any;
globalThis.customElements = window.customElements as any;

import { parseLedgerYaml } from "../src/backend/ledger-parser.js";
import { CharactersTab } from "../src/frontend/hud/tab-characters.js";
import { StatsTab } from "../src/frontend/hud/tab-stats.js";
import { InventoryTab } from "../src/frontend/hud/tab-inventory.js";
import { WardrobeTab } from "../src/frontend/hud/tab-wardrobe.js";
import { MapTab } from "../src/frontend/hud/tab-map.js";
import { PhoneTab } from "../src/frontend/hud/tab-phone.js";
import { JournalTab } from "../src/frontend/hud/tab-journal.js";
import { SceneTab } from "../src/frontend/hud/tab-scene.js";
import { MenuBar } from "../src/frontend/hud/menu-bar.js";

const FENCE = "```";
const REALISTIC_MY_WORLD_YAML =
  FENCE +
  "yaml\n" +
  `ledger:
  world:
    name: "Dames Mansion"
    genre: "Slice of Life / Drama"
  clock:
    date: "12-10-18"
    t: "D1 16:30"
    phase: "Afternoon"
    location: "Dames Mansion"
    region: "Suburban Estate"
    country: "USA"
    step: 1
  scene:
    place: "dames_mansion:foyer"
    time: "D1 16:30"
    participants: ["user", "jessica", "tessa"]
    threads: ["lease_signing_wine", "tessa_teasing_pretty_boy"]
    pressures: ["Leslie is upstairs and doesn't know her ex just moved in"]
  places:
    "dames_mansion:foyer":
      function: "Entryway"
      traffic: 3
      privacy: 1
      routes:
        - to: "dames_mansion:living_room"
          minutes: 1
        - to: "dames_mansion:upstairs_hall"
          minutes: 1
    "dames_mansion:living_room":
      function: "Common Lounge"
      traffic: 4
      privacy: 2
  roster:
    - id: "jessica"
      name: "Jessica"
      lod: 3
      status: "Tipsy, welcoming User"
      loc: "dames_mansion:foyer"
    - id: "tessa"
      name: "Tessa"
      lod: 3
      status: "Teasing User at bottom of stairs"
      loc: "dames_mansion:foyer"
    - id: "leslie"
      name: "Leslie"
      lod: 1
      status: "Filming upstairs"
      loc: "dames_mansion:upstairs_hall"
  actors:
    user:
      id: "user"
      appearance:
        age: 22
        traits: "Slender, androgynous, striking symmetry"
        appeal: 90
        style: "Casual chic"
        condition: "Flustered"
      money:
        in_hand: 140
        in_bank: 1250
        currency: "$"
      combat:
        tier: 1
        lv: 1
        exp: "0/100"
        hp: "120/120"
        mp: "60/60"
        pwr: 14
        agi: 16
        int: 24
        eff_pwr: 14
        eff_agi: 16
        talent: ["Adaptability", "Bartering"]
      life_model:
        orientation: "Open"
        romantic_history: "Ex-boyfriend of Leslie Dames"
        occupation: "College Graduate / Transmigrator"
        residence: "Dames Mansion Room 3"
        routines:
          - ["08:00", "Morning routine", "bedroom", "Morning"]
          - ["16:30", "Arrival at mansion", "foyer", "Afternoon"]
      wounds:
        physical: []
        psychological: ["Transmigration shock"]
      passions:
        anger: 0
        shame: 0
        arousal: 20
        stress: 15
        fear: 5
      outfit:
        top: "Fitted heather-gray henley"
        bottom: "Dark slim-fit jeans"
        underwear_top: "none"
        underwear_bottom: "Calvin Klein trunks"
        shoes: "White leather sneakers"
        accessories: ["Silver wrist watch"]
        state: "Pristine"
      inventory:
        in_hand:
          L: "Empty"
          R: "Canvas duffel bag"
        carried: ["2018 smartphone", "Wallet", "Lease agreement"]
        room: ["Extra clothes in suitcase"]
        room_location: "Room 3"
      agency:
        want_now: "Settle into the mansion and avoid Leslie for now"
      relations: {}
    jessica:
      id: "jessica"
      name: "Jessica"
      appearance:
        age: 44
        traits: "Long black curly hair, glasses, curvy/fit yoga build"
        appeal: 88
        style: "Athleisure"
        condition: "Buzzed"
      money:
        in_hand: 80
        in_bank: 45000
        currency: "$"
      combat:
        tier: 1
        lv: 2
        hp: "130/130"
        mp: "70/70"
        pwr: 12
        agi: 14
        int: 20
        talent: ["Hostessing", "Seductive Hospitality"]
      life_model:
        orientation: "Bi-curious"
        romantic_history: "Married to absentee husband"
        occupation: "Landlady"
        residence: "Master Bedroom"
      wounds:
        physical: []
        psychological: ["Lonely marriage"]
      passions:
        anger: 0
        arousal: 35
        joy: 40
        stress: 10
      outfit:
        top: "Lavender sports bra"
        bottom: "Tight gray yoga pants"
        shoes: "Barefoot"
        accessories: ["Diamond wedding ring"]
      inventory:
        in_hand:
          L: "Empty"
          R: "Glass of Pinot Noir"
        carried: ["House master keys", "iPhone"]
      profile:
        tells: ["Pours wine to cover awkward pauses", "Touches hair when sizing someone up"]
        defense: "Maternal charm"
      agency:
        want_now: "Make the handsome new tenant feel welcome"
        goals:
          - ["g_jess_1", "Get the new tenant settled and enjoy his attention", 80, 60, "Tonight", "Lonely with husband away", 15, "active"]
      knowledge:
        secrets:
          - ["Keeps high-end bondage gear locked in dresser", ["jessica"], ["tessa"], 10, "Yoga storage"]
        beliefs:
          - ["User is remarkably polite and handsome", 95, "direct", "@b:W", "D1 16:30"]
      relations:
        user:
          affinity: 20
          trust: 15
          respect: 10
          attraction: 45
          loyalty: 10
          betrayal_threshold: 40
          leverage: ["Holds his lease"]
      stats:
        T: 15
        A: 20
        R: 10
        F: 0
        Fam: 2
        G: 0
        Integ: 70
        Stress: 10
        CAU: 25
        GRD: 30
        PRD: 40
        EMP: 80
        STB: 75
        BLD: 20
        RX: 35
        RC: 60
        Rig: 15
        Mask: 40
        MIS: 10
        WV: 30
        COMP: 15
  opportunities:
    - id: "opp_wine_welcome"
      what: "Accept a glass of wine with Jessica"
      wanted_by: ["jessica"]
      cost: "Might lower inhibitions"
      payoff: "+15 Jessica Affinity, unlocks private talk"
      status: "lead"
  journal:
    - id: "j_arrival"
      time: "D1 16:30"
      place: "dames_mansion:foyer"
      action: "Arrived at Dames Mansion with duffel bag"
      outcome: "Greeted by landlady Jessica with wine"
` +
  FENCE;

describe("End-to-End YAML Parsing & HUD Tab Rendering", () => {
  let parsedLedger: any;

  beforeAll(() => {
    parsedLedger = parseLedgerYaml(REALISTIC_MY_WORLD_YAML);
  });

  test("1. parseLedgerYaml unwraps nested 'ledger:' envelope correctly", () => {
    expect(parsedLedger).toBeDefined();
    expect(parsedLedger.clock?.date).toBe("12-10-18");
    expect(parsedLedger.clock?.location).toBe("Dames Mansion");
    expect(parsedLedger.scene?.place).toBe("dames_mansion:foyer");
    expect(parsedLedger.places?.["dames_mansion:foyer"]).toBeDefined();
    expect(parsedLedger.actors).toBeDefined();
    expect(Object.keys(parsedLedger.actors)).toContain("user");
    expect(Object.keys(parsedLedger.actors)).toContain("jessica");
    expect(parsedLedger.opportunities?.length).toBe(1);
    expect(parsedLedger.journal?.length).toBe(1);
  });

  test("2. MenuBar.setLedger safely hydrates currentLedger", () => {
    const actions: string[] = [];
    const menuBar = new MenuBar((act) => actions.push(act));
    menuBar.setLedger(parsedLedger);

    const overlay = menuBar.getOverlay();
    expect(overlay).toBeDefined();
    expect(overlay.className).toContain("vn-hud-overlay");
  });

  test("3. CharactersTab renders avatar ribbon, attire, inventory, combat, and secrets", () => {
    const tab = new CharactersTab();
    tab.render(parsedLedger);

    const html = tab.root.innerHTML;
    // Header & Ribbon
    expect(html).toContain("Cast &amp; Living World Dossiers");
    expect(html).toContain("Player (You)");
    expect(html).toContain("Jessica");

    // Attire breakdown
    expect(html).toContain("Attire &amp; Wardrobe");
    expect(html).toContain("Fitted heather-gray henley");
    expect(html).toContain("Dark slim-fit jeans");
    expect(html).toContain("Calvin Klein trunks");
    expect(html).toContain("White leather sneakers");

    // Equipment & Money
    expect(html).toContain("Equipment, Carried Gear &amp; Finances");
    expect(html).toContain("$140");
    expect(html).toContain("$1250");
    expect(html).toContain("Canvas duffel bag");
    expect(html).toContain("2018 smartphone");

    // Combat attributes
    expect(html).toContain("Combat Vitals &amp; Aptitudes");
    expect(html).toContain("120/120");
    expect(html).toContain("Bartering");

    // Life model & Want
    expect(html).toContain("Immediate Want:");
    expect(html).toContain("Settle into the mansion");
  });

  test("4. StatsTab renders cleanly without crashing on empty user relations, and displays 21-stat matrix", () => {
    const tab = new StatsTab();
    // Render with user default
    tab.render(parsedLedger);
    let html = tab.root.innerHTML;

    expect(html).toContain("Status, Passions &amp; 21-Stat Ledger Matrix");
    expect(html).toContain("Inspect Actor:");
    expect(html).toContain("Vitals &amp; Attributes");
    expect(html).toContain("No outgoing relationship edges initialized");

    // Now switch selected actor to jessica who has 21-stat matrix and relations
    (tab as any).selectedActorId = "jessica";
    tab.render(parsedLedger);
    html = tab.root.innerHTML;

    // 21-stat matrix verification
    expect(html).toContain("21-Stat Engine Matrix");
    expect(html).toContain("Interpersonal Stance");
    expect(html).toContain("Psychological Equilibrium");
    expect(html).toContain("Behavioral Dynamics");
    expect(html).toContain("Integ");
    expect(html).toContain("Stress");
    expect(html).toContain("EMP");

    // Passions badges
    expect(html).toContain("Current Passions &amp; Affect");
    expect(html).toContain("Arousal");
    expect(html).toContain("Joy");

    // Relationships toward User
    expect(html).toContain("Relations Toward:");
    expect(html).toContain("Affinity");
    expect(html).toContain("Attraction");
    expect(html).toContain("Betrayal Threshold:");

    // Test with active investigation and leverage chips
    const ledgerWithInv: LedgerData = {
      ...parsedLedger,
      world: {
        investigations: {
          watch: {
            authority: "City Watch",
            alert_level: 2,
            target_id: "user",
            clues: ["Muddy footprints", "Torn fabric"],
          },
        },
      },
      actors: {
        ...parsedLedger.actors,
        jessica: {
          ...parsedLedger.actors?.jessica,
          relations: {
            user: {
              trust: 50,
              leverage: ["Knows secret entrance"],
              obligations: ["Owes rent favor"],
            },
          },
        },
      },
    };
    (tab as any).selectedActorId = "jessica";
    tab.render(ledgerWithInv);
    const htmlWithInv = tab.root.innerHTML;
    expect(htmlWithInv).toContain("Active Investigations");
    expect(htmlWithInv).toContain("City Watch");
    expect(htmlWithInv).toContain("Level 2: Suspect Named");
    expect(htmlWithInv).toContain("Muddy footprints, Torn fabric");
    expect(htmlWithInv).toContain("LEVERAGE");
    expect(htmlWithInv).toContain("Knows secret entrance");
    expect(htmlWithInv).toContain("DEBT");
    expect(htmlWithInv).toContain("Owes rent favor");
  });

  test("5. InventoryTab renders in-hand equipment, carried items, and room containers", () => {
    let triggeredAction = "";
    const tab = new InventoryTab((act) => { triggeredAction = act; });
    tab.render(parsedLedger, "user");

    const html = tab.root.innerHTML;
    expect(html).toContain("Inventory &amp; Containers");
    expect(html).toContain("Canvas duffel bag");
    expect(html).toContain("2018 smartphone");
    expect(html).toContain("Extra clothes in suitcase");
  });

  test("6. WardrobeTab renders outfit layers and state", () => {
    let triggeredAction = "";
    const tab = new WardrobeTab((act) => { triggeredAction = act; });
    tab.render(parsedLedger, "user");

    const html = tab.root.innerHTML;
    expect(html).toContain("Wardrobe &amp; Dressing");
    expect(html).toContain("Fitted heather-gray henley");
    expect(html).toContain("Dark slim-fit jeans");
    expect(html).toContain("Calvin Klein trunks");
    expect(html).toContain("White leather sneakers");
    expect(html).toContain("Scent:");
    expect(html).toContain("Condition:");
    expect(html).toContain("Integrity:");
    expect(html).toContain("Clean Clothes");
    expect(html).toContain("Repair Garments");
  });

  test("7. MapTab renders indoor/outdoor nodes and navigation routes", () => {
    let travelTarget = "";
    const tab = new MapTab((act) => { travelTarget = act; });
    tab.render(parsedLedger);

    const html = tab.root.innerHTML;
    expect(html).toContain("Interactive Cartography &amp; Blueprint");
    expect(html).toContain("dames_mansion:foyer");
    expect(html).toContain("LIVING ROOM");
  });

  test("8. PhoneTab renders clock, location, and OS interface", () => {
    let actionTriggered = "";
    const mockCtx: any = {
      getActiveChat: () => ({ id: "chat-123" }),
      user: { id: "user-123" },
      storage: { get: () => null, set: () => {} },
    };
    const tab = new PhoneTab(mockCtx, (act) => { actionTriggered = act; });
    tab.render(parsedLedger);

    const html = tab.root.innerHTML;
    expect(html).toContain("16:30");
    expect(html).toContain("Dames Mansion");
    expect(html).toContain("Messages");
    expect(html).toContain("Wallet");
  });

  test("9. JournalTab renders active opportunities and historical journal entries", () => {
    const tab = new JournalTab();
    tab.render(parsedLedger);

    const html = tab.root.innerHTML;
    expect(html).toContain("Journal &amp; Opportunity Leads");
    expect(html).toContain("Accept a glass of wine with Jessica");
    expect(html).toContain("Arrived at Dames Mansion with duffel bag");
  });

  test("10. SceneTab renders participants and stage state", () => {
    const mockCtx: any = {
      getActiveChat: () => ({ id: "chat-123" }),
      user: { id: "user-123" },
    };
    const tab = new SceneTab(mockCtx);
    tab.render(parsedLedger);

    const html = tab.root.innerHTML;
    expect(html).toContain("Scene Visuals");
    expect(html).toContain("dames_mansion:foyer");
  });
});
