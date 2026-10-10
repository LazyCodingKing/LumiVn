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
import { InventoryTab, parseClockHour, isShopOpen, DEFAULT_DISTRICT_SHOPS } from "../src/frontend/hud/tab-inventory.js";
import { WardrobeTab } from "../src/frontend/hud/tab-wardrobe.js";
import { MapTab } from "../src/frontend/hud/tab-map.js";
import { PhoneTab, parsePhoneGameKey } from "../src/frontend/hud/tab-phone.js";
import { JournalTab } from "../src/frontend/hud/tab-journal.js";
import { SceneTab } from "../src/frontend/hud/tab-scene.js";
import { BPlotsTab, generateBondInterlude } from "../src/frontend/hud/tab-bplots.js";
import { MenuBar } from "../src/frontend/hud/menu-bar.js";
import { DiagnosticsTab } from "../src/frontend/hud/tab-diagnostics.js";
import { RpgTab, parseSkillTreesFromPrompt } from "../src/frontend/hud/tab-rpg.js";
import { VnAudioEngine } from "../src/frontend/stage/audio-player.js";
import { StageRenderer } from "../src/frontend/stage/staging.js";
import { diagBus } from "../src/frontend/utils/diag-bus.js";
import { syncManifestLibrary } from "../src/backend/storage.js";

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

    // Toggle portrait button exists
    const toggleBtn = tab.root.querySelector("#vn-toggle-portrait-btn") as HTMLButtonElement;
    expect(toggleBtn).not.toBeNull();
    expect(toggleBtn.textContent).toContain("Show Image");

    // Click toggle button -> expands full size portrait card on the left
    toggleBtn.click();
    expect(tab.root.innerHTML).toContain("vn-character-portrait-card");
    const closeBtn = tab.root.querySelector("#vn-close-portrait-btn") as HTMLButtonElement;
    expect(closeBtn).not.toBeNull();

    // Click close button -> collapses portrait card
    closeBtn.click();
    expect(tab.root.querySelector(".vn-character-portrait-card")).toBeNull();
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

  test("11. DiagnosticsTab renders copy director button and active director guidance card", () => {
    diagBus.setDirectorNote({
      directorNote: "Maintain romantic tension during the interview.",
      threadLabel: "Romance Arc",
      timestamp: "14:00:00",
    });

    const tab = new DiagnosticsTab();
    tab.render(parsedLedger);

    const html = tab.root.innerHTML;
    expect(html).toContain("vn-copy-director-btn");
    expect(html).toContain("Active Director Guidance");
    expect(html).toContain("Romance Arc");
    expect(html).toContain("Maintain romantic tension during the interview.");

    expect(diagBus.getDirectorNote()?.threadLabel).toBe("Romance Arc");
    const bundle = JSON.parse(diagBus.exportAllBundle());
    expect(bundle.directorNote).toBeDefined();
    expect(bundle.directorNote.directorNote).toBe("Maintain romantic tension during the interview.");
  });

  test("12. BPlotsTab renders active b-plots, offscreen cast, latents, travel, and environmental fronts", () => {
    const tab = new BPlotsTab();
    tab.render({
      scene: {
        place: "dames_mansion:foyer",
        latents: [
          { who: "leslie", errand: "Returning from grocery", route: "Main Street", window_opens: "17:00", status: "pending" },
        ],
      },
      roster: [
        { id: "leslie", name: "Leslie", lod: 2, loc: "grocery_store", status: "Shopping" },
      ],
      travel: [
        { actor: "delivery_courier", purpose: "Package dropoff", from: "depot", to: "dames_mansion", depart: "16:15", eta: "16:45", status: "en_route" },
      ],
      bplots: [
        {
          id: "bp_1",
          who: "Neighborhood Council",
          want: "Rezoning hearing approval",
          doing: "Canvassing votes",
          scope: "neighborhood",
          ripple: 2,
          status: "active",
          next: { move: "Distribute flyers", due: "Tomorrow" },
        },
      ],
      fronts: [
        { id: "heatwave", cause: "Severe summer heatwave", stage: "escalating", pressure: 4, due: "D2", known_by: ["User", "Jessica"] },
      ],
    });

    const html = tab.root.innerHTML;
    expect(html).toContain("B-Plots, Fronts &amp; Offscreen Cast");
    expect(html).toContain("Neighborhood Council");
    expect(html).toContain("Stage 2: Ambient Echo");
    expect(html).toContain("Rezoning hearing approval");
    expect(html).toContain("Leslie");
    expect(html).toContain("LOD 2");
    expect(html).toContain("Returning from grocery");
    expect(html).toContain("delivery_courier");
    expect(html).toContain("heatwave");
    expect(html).toContain("Pressure 4/5");
  });

  test("13. syncManifestLibrary indexes places, characters, and actions into reusable library", () => {
    const rawManifest = {
      places: {
        "mansion:parlor": "/images/places/parlor.png",
      },
      characters: {
        alethea: {
          outfits: {
            casual: { neutral: "/images/alethea_casual.png" },
          },
          actions: {
            cast_spell: "/images/alethea_magic.png",
          },
        },
      },
    };

    const synced = syncManifestLibrary(rawManifest as any);
    expect(synced.library).toBeDefined();
    expect(synced.library!.length).toBe(3);
    const urls = synced.library!.map((item) => item.url);
    expect(urls).toContain("/images/places/parlor.png");
    expect(urls).toContain("/images/alethea_casual.png");
    expect(urls).toContain("/images/alethea_magic.png");
  });

  test("14. CharactersTab renders avatar face framing controls and applies object-position to icons", () => {
    const tab = new CharactersTab();
    const manifest = {
      places: {},
      characters: {
        alethea: {
          outfits: {
            default: { neutral: "/images/alethea_neutral.png" },
          },
          avatarFocus: { x: 50, y: 18 },
        },
      },
    };

    tab.render(
      {
        actors: {
          alethea: {
            id: "alethea",
            name: "Alethea",
            agency: { want_now: "Solve puzzle" },
          },
        },
      },
      manifest as any
    );

    const html = tab.root.innerHTML;
    expect(html).toContain("vn-avatar-framing-box");
    expect(html).toContain("Avatar Icon &amp; Face Positioning");
    expect(html).toContain("Vertical Position (Face Alignment):");
    expect(html).toContain("vn-slider-focus-y");
    expect(html).toContain("Drag to pan");
    expect(html).toContain("object-position: 50% 18%");
  });

  test("15. parsePhoneGameKey normalizes arrow keys, WASD, IJKL, HJKL, numpad, and actions", () => {
    // Arrow keys
    expect(parsePhoneGameKey({ key: "ArrowUp" }).up).toBe(true);
    expect(parsePhoneGameKey({ key: "ArrowDown" }).down).toBe(true);
    expect(parsePhoneGameKey({ key: "ArrowLeft" }).left).toBe(true);
    expect(parsePhoneGameKey({ key: "ArrowRight" }).right).toBe(true);

    // WASD
    expect(parsePhoneGameKey({ key: "w" }).up).toBe(true);
    expect(parsePhoneGameKey({ key: "s" }).down).toBe(true);
    expect(parsePhoneGameKey({ key: "a" }).left).toBe(true);
    expect(parsePhoneGameKey({ key: "d" }).right).toBe(true);

    // IJKL
    expect(parsePhoneGameKey({ key: "i" }).up).toBe(true);
    expect(parsePhoneGameKey({ key: "k" }).down).toBe(true);
    expect(parsePhoneGameKey({ key: "j" }).left).toBe(true);
    expect(parsePhoneGameKey({ key: "l" }).right).toBe(true);

    // HJKL Vim keys
    expect(parsePhoneGameKey({ key: "h" }).left).toBe(true);

    // Numpad
    expect(parsePhoneGameKey({ code: "Numpad8" }).up).toBe(true);
    expect(parsePhoneGameKey({ code: "Numpad2" }).down).toBe(true);
    expect(parsePhoneGameKey({ code: "Numpad4" }).left).toBe(true);
    expect(parsePhoneGameKey({ code: "Numpad6" }).right).toBe(true);

    // Action keys
    expect(parsePhoneGameKey({ key: " " }).action).toBe(true);
    expect(parsePhoneGameKey({ key: "Enter" }).action).toBe(true);
    expect(parsePhoneGameKey({ key: "z" }).action).toBe(true);

    // Restart key
    expect(parsePhoneGameKey({ key: "r" }).restart).toBe(true);
  });

  test("16. RpgTab renders vitals, skill aptitudes, interactive dice roller, and customizable RPG rules prompt editor", () => {
    let triggeredAction = "";
    const mockCtx: any = {
      getActiveChat: () => ({ id: "chat-123" }),
      sendToBackend: () => {},
    };
    const tab = new RpgTab(mockCtx, (act) => { triggeredAction = act; });
    tab.render(parsedLedger, "user");

    const html = tab.root.innerHTML;
    expect(html).toContain("RPG Rules, Vitals &amp; Dice Engine");
    expect(html).toContain("Health (HP)");
    expect(html).toContain("Energy / Mana (MP)");
    expect(html).toContain("Tabletop RPG Dice Roller");
    expect(html).toContain("D20");
    expect(html).toContain("RPG Stat Rules &amp; Combat Prompt Directive");
    expect(html).toContain("Save RPG Rules");
    expect(html).toContain("Reset to Default");

    // Test dice roll interaction
    const rollBtn = tab.root.querySelector("#vn-roll-dice-btn") as HTMLButtonElement | null;
    expect(rollBtn).not.toBeNull();
    rollBtn?.click();

    const resultBox = tab.root.querySelector("#vn-dice-result-box");
    expect(resultBox?.textContent).toContain("Rolled");
    expect(resultBox?.textContent).toContain("on d20");
    expect(resultBox?.textContent).toContain("Use in Action");
  });

  test("17. VnAudioEngine handles dynamic BGM tags, mood mapping, and place fallback", () => {
    const engine = new VnAudioEngine();

    // 1. Tag extraction from prose
    const track1 = engine.handleDynamicBgm("Suddenly a clash occurs! 🎵 Music: battle_theme", "tense");
    expect(track1).toBe("battle_theme");
    expect(engine.getCurrentBgm()).toBe("battle_theme");

    // 2. Bracketed tag extraction
    const track2 = engine.handleDynamicBgm("A mystery unfolds. [Music: dungeon_ambience]");
    expect(track2).toBe("dungeon_ambience");
    expect(engine.getCurrentBgm()).toBe("dungeon_ambience");

    // 3. Mood fallback mapping
    const track3 = engine.handleDynamicBgm("A warm and joyful morning.", "happy");
    expect(track3).toBe("daily_happy");
    expect(engine.getCurrentBgm()).toBe("daily_happy");

    // 4. Place mapping
    const track4 = engine.handleDynamicBgm(
      "Entering the noisy tavern.",
      undefined,
      "tavern",
      { tavern: "/audio/tavern_bgm.mp3" }
    );
    expect(track4).toBe("tavern");
    expect(engine.getCurrentBgm()).toBe("tavern");

    // Stop BGM
    engine.stopBgm();
    expect(engine.getCurrentBgm()).toBeNull();
  });

  test("18. Prompt-driven Skill Tree parser & Level-up progression mechanics", () => {
    const samplePrompt = `
【Tree: Warrior】
- Strike: tier=1 | cost=1 | requires=[] | type=active | cd=0 | cost_res={mp:0} | formula={ATK}*1.2 | desc=Basic decisive physical blow.
- Cleave: tier=2 | cost=1 | requires=[Strike] | type=active | cd=2 | cost_res={mp:15} | formula={ATK}*1.8 | desc=Wide sweep dealing damage to targets.
- Juggernaut: tier=3 | cost=2 | requires=[Cleave] | type=passive | desc=Armor mitigation increased by 20%.

【Tree: Sorcery】
- Spark: tier=1 | cost=1 | requires=[] | type=active | cd=0 | cost_res={mp:10} | formula={ATK}*1.5 | desc=Crackling bolt of electrical surge.
    `;

    const categories = parseSkillTreesFromPrompt(samplePrompt);
    expect(categories.length).toBe(2);
    expect(categories[0]?.name).toBe("Warrior");
    expect(categories[0]?.nodes.length).toBe(3);

    const cleave = categories[0]?.nodes.find((n) => n.name === "Cleave");
    expect(cleave).toBeDefined();
    expect(cleave?.tier).toBe(2);
    expect(cleave?.cost).toBe(1);
    expect(cleave?.requires).toEqual(["Strike"]);
    expect(cleave?.cd).toBe(2);
    expect(cleave?.cost_res).toEqual({ mp: 15 });
    expect(cleave?.formula).toBe("{ATK}*1.8");

    // Progression Engine
    let actionEmitted = "";
    const tab = new RpgTab(undefined, (act) => {
      actionEmitted = act;
    });
    tab.setStatRulesSettings({
      statRules: "",
      ledgerPrompt: "",
      rpgPrompt: samplePrompt,
      enabled: true,
      mode: "mvu_quiet",
    });

    // 1. Initial state
    expect(tab.progression.level).toBe(1);
    expect(tab.progression.skillPoints).toBe(3);
    expect(tab.progression.unlockedSkills).toContain("Strike");

    // 2. EXP & Level Up rollover
    tab.addExp(150);
    expect(tab.progression.level).toBe(2);
    expect(tab.progression.skillPoints).toBe(4);

    // 3. Unlocking Cleave with Strike requirement met
    const unlockedCleave = tab.unlockSkill(cleave!);
    expect(unlockedCleave).toBe(true);
    expect(tab.progression.unlockedSkills).toContain("Cleave");
    expect(tab.progression.skillPoints).toBe(3);

    // 4. Juggernaut unlock (cost=2, requires=[Cleave])
    const juggernaut = categories[0]?.nodes.find((n) => n.name === "Juggernaut");
    expect(tab.unlockSkill(juggernaut!)).toBe(true);
    expect(tab.progression.skillPoints).toBe(1);

    // 5. Trying to unlock with insufficient SP fails
    const spark = categories[1]?.nodes.find((n) => n.name === "Spark");
    tab.progression.skillPoints = 0;
    expect(tab.unlockSkill(spark!)).toBe(false);

    // 6. Combat Action Bar & formula calculation
    tab.progression.skillPoints = 5;
    const actorCombat = { combat: { atk: 20 } };
    const combatResult = tab.triggerSkillAction(cleave!, actorCombat);
    expect(combatResult).toContain("Cleave!");
    expect(combatResult).toContain("Dealt 36 damage");
    expect(combatResult).toContain("Cost: 15 MP");
    expect(tab.progression.cooldowns["Cleave"]).toBe(2);
    expect(actionEmitted).toBe(combatResult);

    // Skill is on cooldown, cannot trigger again
    const onCooldownResult = tab.triggerSkillAction(cleave!, actorCombat);
    expect(onCooldownResult).toBe("");

    // Tick cooldowns
    tab.tickCooldowns();
    expect(tab.progression.cooldowns["Cleave"]).toBe(1);
    tab.tickCooldowns();
    expect(tab.progression.cooldowns["Cleave"]).toBe(0);

    // Render verification
    tab.render(parsedLedger);
    const html = tab.root.innerHTML;
    expect(html).toContain("Level Progression &amp; Skill Points");
    expect(html).toContain("Combat Action Bar &amp; Turn Cooldowns");
    expect(html).toContain("Skill Trees (Prompt-Driven &amp; Customizable)");
  });

  test("19. Current Scene Navigation, Character Interactions & Environment Objects", () => {
    // 1. Clock parsing
    expect(parseClockHour("D1 16:30", "Afternoon")).toBe(16.5);
    expect(parseClockHour(undefined, "Morning")).toBe(8);
    expect(parseClockHour(undefined, "Night")).toBe(22);

    // 2. InventoryTab Current Scene rendering & character/item interaction
    let actionTriggered = "";
    const tab = new InventoryTab((act) => {
      actionTriggered = act;
    });

    // Switch to Current Scene view
    tab.currentView = "scene";
    tab.render(parsedLedger, "user");

    const html = tab.root.innerHTML;
    expect(html).toContain("Current Scene: Foyer");
    expect(html).not.toContain("Apothecary");
    expect(html).not.toContain("Marketplace");

    // Verify characters present in the scene
    expect(html).toContain("Characters in Current Scene");
    expect(html).toContain("Jessica");
    expect(html).toContain("Tessa");

    // Trigger Twine interaction on character
    const talkBtn = tab.root.querySelector('.vn-twine-action-btn[data-action*="Jessica"]') as HTMLButtonElement;
    expect(talkBtn).toBeDefined();
    talkBtn?.click();
    expect(actionTriggered).toContain("Jessica");

    // Test direct dialogue say input
    const sayInput = tab.root.querySelector('.vn-char-say-input[data-char-name="Jessica"]') as HTMLInputElement;
    const sayBtn = tab.root.querySelector('.vn-char-say-btn[data-char-name="Jessica"]') as HTMLButtonElement;
    expect(sayInput).toBeDefined();
    expect(sayBtn).toBeDefined();
    if (sayInput && sayBtn) {
      sayInput.value = "Hey Jessica, nice to see you!";
      sayBtn.click();
      expect(actionTriggered).toBe('*To Jessica:* "Hey Jessica, nice to see you!"');
    }
  });

  test("20. Tactile Sprite Touch Reactions on Stage Characters", () => {
    const stage = new StageRenderer();
    stage.setCharacters([
      {
        slot: "center",
        actorId: "akane",
        name: "Akane",
        spriteUrl: "/sprites/akane_neutral.png",
      },
    ]);

    const slotEl = stage.root.querySelector(".vn-char-slot") as HTMLElement;
    expect(slotEl).toBeDefined();

    // Check touch zones
    const touchOverlay = slotEl.querySelector(".vn-touch-overlay");
    expect(touchOverlay).toBeDefined();
    const headZone = slotEl.querySelector(".vn-touch-head") as HTMLElement;
    const faceZone = slotEl.querySelector(".vn-touch-face") as HTMLElement;
    const bodyZone = slotEl.querySelector(".vn-touch-body") as HTMLElement;
    expect(headZone).toBeDefined();
    expect(faceZone).toBeDefined();
    expect(bodyZone).toBeDefined();

    // Trigger touch reaction
    const reactionLine = stage.triggerSpriteTouch(
      slotEl,
      { slot: "center", actorId: "akane", name: "Akane", spriteUrl: "/sprites/akane.png" },
      "head"
    );
    expect(reactionLine).toBeDefined();
    expect(typeof reactionLine).toBe("string");

    // Check comic speech bubble
    const bubble = slotEl.querySelector(".vn-touch-bubble");
    expect(bubble).toBeDefined();
    expect(bubble?.textContent).toContain("Akane");
  });

  test("21. Dual Blueprint Indoor and District Outdoor Navigation Map", () => {
    let travelAction = "";
    const tab = new MapTab((act) => {
      travelAction = act;
    });

    // 1. Render Indoor Blueprint
    (tab as any).viewMode = "indoor";
    tab.render(parsedLedger);

    const viewport = tab.root.querySelector("#vn-map-viewport");
    expect(viewport).not.toBeNull();
    const svgGroup = tab.root.querySelector("#vn-map-svg-group");
    expect(svgGroup).not.toBeNull();

    // 2. Render Outdoor District
    (tab as any).viewMode = "outdoor";
    tab.render(parsedLedger);

    const outdoorSvg = tab.root.querySelector("#vn-map-svg-group");
    expect(outdoorSvg).not.toBeNull();

    // 3. Trigger affordance interaction
    const affordanceBtn = tab.root.querySelector(".vn-affordance-interactive") as HTMLElement | null;
    if (affordanceBtn) {
      affordanceBtn.click();
      expect(travelAction).toContain("Interacts with");
    }

    tab.cleanupInteractiveModes();
  });

  test("22. Off-Screen Bond Theater Interlude generation & intel sharing", () => {
    let intelEmitted = "";
    const tab = new BPlotsTab((act) => {
      intelEmitted = act;
    });

    // Generate interlude
    const beats = generateBondInterlude(
      { id: "kasumi", name: "Kasumi", loc: "Tendo Dojo", status: "Arranging tea" },
      { id: "akane", name: "Akane", loc: "Dojo Veranda", want: "Protect martial legacy" }
    );

    expect(beats.length).toBe(5);
    expect(beats[0]?.speaker).toBe("Narrator");
    expect(beats[1]?.speaker).toBe("Kasumi");
    expect(beats[2]?.speaker).toBe("Akane");

    // Render BPlotsTab with Bond Theater (using ledger with at least 2 offscreen cast members)
    const ledgerWithCast: any = {
      ...parsedLedger,
      roster: [
        { id: "kasumi", name: "Kasumi", lod: 1, loc: "dames_mansion:garden", status: "Arranging tea" },
        { id: "akane", name: "Akane", lod: 1, loc: "dames_mansion:dojo", status: "Practicing katas" },
      ],
    };
    tab.render(ledgerWithCast);
    const html = tab.root.innerHTML;
    expect(html).toContain("Bond Theater — NPC × NPC Offscreen Interlude");

    const startBtn = tab.root.querySelector("#vn-start-theater-btn") as HTMLButtonElement;
    expect(startBtn).toBeDefined();
    startBtn?.click();

    // Verify stage box rendered first beat
    const stageBox = tab.root.querySelector("#vn-theater-stage-box");
    expect(stageBox?.textContent).toContain("Beat 1 of");

    // Click through to next beat
    const nextBtn = tab.root.querySelector("#vn-next-beat-btn") as HTMLButtonElement;
    expect(nextBtn).toBeDefined();
    nextBtn?.click();
    expect(stageBox?.textContent).toContain("Beat 2 of");
  });
});

