import { describe, expect, test } from "bun:test";
import {
  extractProse,
  extractParagraphs,
  detectSpeaker,
  extractLedgerRaw,
  parseLedgerYaml,
  deepMergeLedger,
} from "../src/backend/ledger-parser.js";
import {
  AssetResolver,
  resolveDominantEmotion,
  resolveOutfitName,
} from "../src/backend/asset-resolver.js";
import { formatDialogueHtml } from "../src/frontend/stage/rich-text.js";
import { parseTwineChoices } from "../src/shared/text-effects.js";

const SAMPLE_MY_WORLD_MESSAGE = `
<think>Evaluating scene dynamics</think>
<details><summary>🧠 Scene Logic</summary>
- Input: IC | Preconditions: PASS
</details>

Alethea glanced toward the edge of the courtyard, her fingers nervously clutching her bag. "Are you really sure we should be heading out now?"

The afternoon wind swept through the trees with an uneasy chill.

<details><summary>📊 Ledger</summary>

## World
\`\`\`yaml
world:
  genre: "Fantasy Romance"
clock:
  t: "D1 14:30"
  phase: "Afternoon"
\`\`\`

## Places
\`\`\`yaml
places:
  courtyard:
    routes:
      - to: "library"
        minutes: 10
      - to: "market"
        minutes: 25
\`\`\`

## Actor dossiers
\`\`\`yaml
alethea:
  name: "Alethea"
  passions:
    arousal: 55
    fear: 20
    joy: 10
  outfit:
    top: "School Blouse"
    bottom: "Pleated Skirt"
    underwear_top: "White Bra"
    underwear_bottom: "White Panties"
    shoes: "Loafers"
  inventory:
    in_hand:
      L: "School Bag"
      R: "Empty"
    carried: ["Notebook", "House Key"]
    room: ["Warm Coat"]
  relations:
    user:
      affinity: 45
      trust: 50
\`\`\`

## B-Plots
\`\`\`yaml
bplots:
  - id: "bp_police"
    who: "City Guard Dispatch"
    doing: "Investigating broken gate in lower quarter"
    vector: "Siren in distance"
    ripple: 2
    status: "active"
\`\`\`

## Opportunities
\`\`\`yaml
opportunities:
  - id: "opp_secret_archive"
    what: "Infiltrate library restricted section"
    wanted_by: ["alethea"]
    payoff: "Ancient Grimoire"
    status: "lead"
\`\`\`

</details>

Loadout: L:School Bag R:Empty
Attire: Top:School Blouse Bot:Pleated Skirt
`;

describe("LumiVN Deterministic Ledger Parser", () => {
  test("extracts narrative prose cleanly without logic or ledger tags", () => {
    const prose = extractProse(SAMPLE_MY_WORLD_MESSAGE);
    expect(prose).toContain('Alethea glanced toward the edge of the courtyard');
    expect(prose).not.toContain('<think>');
    expect(prose).not.toContain('Scene Logic');
    expect(prose).not.toContain('Ledger');
    expect(prose).not.toContain('Loadout:');
  });

  test("parses paragraphs and detects active speaker", () => {
    const prose = extractProse(SAMPLE_MY_WORLD_MESSAGE);
    const paras = extractParagraphs(prose);
    expect(paras.length).toBe(2);

    const first = detectSpeaker(paras[0]!);
    expect(first.speaker).toBe("Alethea");
  });

  test("extracts and parses My World 1.79 YAML ledger blocks", () => {
    const raw = extractLedgerRaw(SAMPLE_MY_WORLD_MESSAGE);
    expect(raw).not.toBeNull();

    const parsed = parseLedgerYaml(raw!);
    expect(parsed.clock?.t).toBe("D1 14:30");
    expect(parsed.places?.courtyard).toBeDefined();

    const alethea = parsed.actors?.alethea;
    expect(alethea).toBeDefined();
    expect(alethea?.passions?.arousal).toBe(55);
    expect(alethea?.outfit?.top).toBe("School Blouse");
    expect(alethea?.relations?.user.trust).toBe(50);

    expect(parsed.bplots?.[0]?.ripple).toBe(2);
    expect(parsed.opportunities?.[0]?.id).toBe("opp_secret_archive");
  });

  test("deep merges ledger state across turns preserving base state", () => {
    const raw = extractLedgerRaw(SAMPLE_MY_WORLD_MESSAGE);
    const delta1 = parseLedgerYaml(raw!);
    const state1 = deepMergeLedger(null, delta1);

    const delta2 = {
      clock: { t: "D1 14:45", phase: "Afternoon" },
      actors: {
        alethea: {
          passions: { arousal: 65, anger: 10 },
        },
      },
    };

    const state2 = deepMergeLedger(state1, delta2);
    expect(state2.clock?.t).toBe("D1 14:45");
    // Preserves outfit from turn 1
    expect(state2.actors?.alethea?.outfit?.top).toBe("School Blouse");
    // Updates passion
    expect(state2.actors?.alethea?.passions?.arousal).toBe(65);
    expect(state2.actors?.alethea?.passions?.anger).toBe(10);
  });
});

describe("LumiVN Asset Resolver Rules", () => {
  test("resolves dominant emotion accurately", () => {
    expect(resolveDominantEmotion({ arousal: 55 })).toBe("blush");
    expect(resolveDominantEmotion({ anger: 45 })).toBe("angry");
    expect(resolveDominantEmotion({ fear: 40 })).toBe("scared");
    expect(resolveDominantEmotion({ joy: 40 })).toBe("smile");
    expect(resolveDominantEmotion({ stress: 20 })).toBe("neutral");
  });

  test("normalizes outfit identifiers", () => {
    expect(resolveOutfitName({ outfit: { state: "School Uniform" } })).toBe("school_uniform");
    expect(resolveOutfitName({ outfit: { top: "Silk Shirt" } })).toBe("silk_shirt");
    expect(resolveOutfitName({})).toBe("default");
  });

  test("resolves scoped locations without colliding with common room names", async () => {
    const mockSpindle = {
      log: { info: () => {}, warn: () => {}, error: () => {} },
    } as any;
    const mockStorage = {
      getManifest: async () => ({
        places: {
          "tendo_dojo:kitchen": "https://images.local/tendo_kitchen.png",
          "kitchen": "https://images.local/default_kitchen.png",
        },
        characters: {},
      }),
    } as any;

    const resolver = new AssetResolver(mockSpindle, mockStorage);
    const scopedBg = await resolver.resolveBackground("kitchen", "tendo_dojo");
    expect(scopedBg.url).toBe("https://images.local/tendo_kitchen.png");

    const defaultBg = await resolver.resolveBackground("kitchen");
    expect(defaultBg.url).toBe("https://images.local/default_kitchen.png");
  });

  test("prioritizes action pose sprite when action keyword occurs in context", async () => {
    const mockSpindle = {
      log: { info: () => {}, warn: () => {}, error: () => {} },
    } as any;
    const mockStorage = {
      getManifest: async () => ({
        places: {},
        characters: {
          tessa: {
            outfits: { default: { neutral: "https://images.local/tessa_default.png" } },
            actions: { cooking: "https://images.local/tessa_cooking.png" },
          },
        },
      }),
    } as any;

    const resolver = new AssetResolver(mockSpindle, mockStorage);

    const actionSprite = await resolver.resolveCharacterSprite(
      "tessa",
      undefined,
      undefined,
      "Tessa was happily cooking a batch of stew in the pot."
    );
    expect(actionSprite.spriteUrl).toBe("https://images.local/tessa_cooking.png");
    expect(actionSprite.emotion).toBe("cooking");

    const defaultSprite = await resolver.resolveCharacterSprite(
      "tessa",
      undefined,
      undefined,
      "Tessa looked out the window peacefully."
    );
    expect(defaultSprite.spriteUrl).toBe("https://images.local/tessa_default.png");
    expect(defaultSprite.emotion).toBe("neutral");
  });
});

describe("LumiVN Rich Text & Twine Action Triggers", () => {
  test("parses inline Twine bracket choices and choice tags", () => {
    const text = 'Do you wish to [[Enter Library|enter_library]] or <choice action="flee">Run away</choice>?';
    const { cleanText, choices } = parseTwineChoices(text);

    expect(choices.length).toBe(2);
    expect(choices[0]).toEqual({ text: "Enter Library", action: "enter_library" });
    expect(choices[1]).toEqual({ text: "Run away", action: "flee" });
    expect(cleanText).toContain('data-action="enter_library"');
  });

  test("converts text effect tags into animation spans", () => {
    const raw = '<shake>Look out!</shake> The <rainbow>gem</rainbow> glows softly.';
    const { html } = formatDialogueHtml(raw);

    expect(html).toContain('<span data-vn-text-fx="shake">Look out!</span>');
    expect(html).toContain('<span data-vn-text-fx="rainbow">gem</span>');
  });
});

import { splitParagraphIntoBeats } from "../src/frontend/stage/beat-splitter.js";
import { VN_THEMES } from "../src/frontend/stage/theme.js";

describe("Ren'Py ADV Beat Chunking & Theme Presets", () => {
  test("preserves cohesive paragraph dialogue with speaker attribution", () => {
    const paras = [
      '**Alethea**: "Wait! We can\'t go in there yet. The guards are still watching."',
      "The heavy iron doors groaned under the wind.",
    ];

    const beats = splitParagraphIntoBeats(paras, "Narrator");
    expect(beats.length).toBe(2);
    expect(beats[0]?.speaker).toBe("Alethea");
    expect(beats[0]?.text).toBe('"Wait! We can\'t go in there yet. The guards are still watching."');
    expect(beats[1]?.speaker).toBe("Narrator");
    expect(beats[1]?.text).toBe("The heavy iron doors groaned under the wind.");
  });

  test("extracts narrative dialogue attribution to speaking character for nameplate", () => {
    const paras = [
      'Alethea glanced toward the edge of the courtyard nervously. "Are you really sure we should be heading out now?"',
    ];
    const beats = splitParagraphIntoBeats(paras, "Narrator");
    expect(beats.length).toBe(1);
    expect(beats[0]?.speaker).toBe("Alethea");
    expect(beats[0]?.text).toContain("Alethea glanced toward the edge of the courtyard nervously.");
    expect(beats[0]?.text).toContain("Are you really sure we should be heading out now?");
  });

  test("defines all 5 authentic visual themes with required color tokens", () => {
    const requiredThemes = ["default", "cyberpunk", "midnight", "sakura", "sunset"];
    for (const key of requiredThemes) {
      const theme = VN_THEMES[key];
      expect(theme).toBeDefined();
      expect(theme?.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme?.bgGlass).toBeDefined();
      expect(theme?.border).toBeDefined();
    }
  });

  test("extracts inline asset and expression tags stripping them from dialogue text", () => {
    const raw = 'Alethea gasped, <img cmd="blush"> "I didn\'t expect to see you here!" [sfx: chime]';
    const beats = splitParagraphIntoBeats([raw], "Narrator");
    expect(beats.length).toBe(1);
    expect(beats[0]?.speaker).toBe("Alethea");
    expect(beats[0]?.expression).toBe("blush");
    expect(beats[0]?.sfx).toBe("chime");
    expect(beats[0]?.text).not.toContain('<img');
    expect(beats[0]?.text).not.toContain('[sfx:');
  });

  test("detects inverted speech tags and multi-character dialogue in one turn", () => {
    const paras = [
      '"Wait right there," said Alethea softly.',
      '"We don\'t have time for this," replied Donald.',
    ];
    const beats = splitParagraphIntoBeats(paras, "Narrator");
    expect(beats.length).toBe(2);
    expect(beats[0]?.speaker).toBe("Alethea");
    expect(beats[1]?.speaker).toBe("Donald");
  });
});

import { isActorMatch } from "../src/frontend/stage/staging.js";

describe("LumiVN Multi-Actor Spotlight Matching", () => {
  test("robustly matches full names, slugs, and tokens without false positives on narrator", () => {
    expect(isActorMatch("Akane", "tendo_akane", "Akane Tendo")).toBe(true);
    expect(isActorMatch("Tendo", "tendo_akane", "Akane Tendo")).toBe(true);
    expect(isActorMatch("Donald", "donald_duck", "Donald Duck")).toBe(true);
    expect(isActorMatch("Narrator", "alethea", "Alethea")).toBe(false);
    expect(isActorMatch("", "alethea", "Alethea")).toBe(false);
  });
});

import { diagBus } from "../src/frontend/utils/diag-bus.js";

describe("LumiVN Robust YAML Recovery & Diagnostic Export", () => {
  test("recovers actor dossiers even when flow mappings contain unescaped quotes", () => {
    const rawYaml = `
clock:
  date: "14-09-18"
  t: "D1 16:32"
  phase: "Afternoon"
  location: "Living Room"
  region: "Westchester"
  country: "USA"

actors:
  user:
    name: "User"
    outfit:
      top: "cream knit sweater"
      bottom: "high-waisted jeans"
    inventory:
      in_hand: { L: "duffel bag", R: null }
  jessica:
    name: "Jessica"
    outfit:
      top: "loose silk blouse"
    tells: { lying: "Says "Weeee!" or "Boop!" nervously", fidget: "plays with necklace" }
  tessa:
    name: "Tessa"
    outfit:
      top: "cropped tank"
    tells: { smug: "Smirks and twirls hair" }
`;
    const parsed = parseLedgerYaml(rawYaml);
    expect(parsed).toBeDefined();
    expect(parsed.clock?.date).toBe("14-09-18");
    expect(parsed.actors).toBeDefined();
    expect(Object.keys(parsed.actors || {})).toContain("user");
    expect(Object.keys(parsed.actors || {})).toContain("jessica");
    expect(Object.keys(parsed.actors || {})).toContain("tessa");
    expect(parsed.actors?.["jessica"]?.outfit?.top).toBe("loose silk blouse");
  });

  test("diagBus formats clean YAML and exports complete telemetry bundle", () => {
    diagBus.setLedger({
      clock: { t: "D1 16:32", phase: "Afternoon", date: "14-09-18", region: "Nerima" },
      scene: { place: "tendo_residence:foyer", participants: ["user", "jessica"] },
    });
    const yaml = diagBus.formatLedgerYaml();
    expect(yaml).toContain("```yaml");
    expect(yaml).toContain('t: "D1 16:32"');
    expect(yaml).toContain('date: "14-09-18"');
    expect(yaml).toContain('place: "tendo_residence:foyer"');

    const bundleStr = diagBus.exportAllBundle();
    const bundle = JSON.parse(bundleStr);
    expect(bundle.clock.t).toBe("D1 16:32");
    expect(bundle.scene.participants).toContain("user");
  });
});



