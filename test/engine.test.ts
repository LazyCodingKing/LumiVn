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

  test("extracts narrative prose cleanly stripping director_note JSON block", () => {
    const rawWithDirector = `{"director_note": "Escalate tension immediately.", "thread_label": "Tension Arc"}\n\nAlethea stepped back, holding her breath. "Who is there?"`;
    const cleaned = extractProse(rawWithDirector);
    expect(cleaned).toBe('Alethea stepped back, holding her breath. "Who is there?"');
    expect(cleaned).not.toContain("director_note");
  });

  test("extracts narrative prose cleanly stripping details Director block", () => {
    const rawWithDetails = `<details><summary>🎬 Director</summary>\n{"director_note": "FIRST BEAT:...", "thread_label": "Tension"}\n</details>\n\nAlethea glanced at the doorway.`;
    const cleaned = extractProse(rawWithDetails);
    expect(cleaned).toBe('Alethea glanced at the doorway.');
    expect(cleaned).not.toContain("Director");
    expect(cleaned).not.toContain("director_note");
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

  test("parses shorthand and generic prop cards into structured game UI widgets", () => {
    // 1. Shorthand phone prop
    const phoneRaw = '<prop:phone from="Maya" time="23:14">Hey, meet me at midnight.</prop:phone>';
    const phoneHtml = formatDialogueHtml(phoneRaw).html;
    expect(phoneHtml).toContain('class="vn-prop-card vn-prop-phone"');
    expect(phoneHtml).toContain('📱 Maya');
    expect(phoneHtml).toContain('23:14');
    expect(phoneHtml).toContain('Hey, meet me at midnight.');

    // 2. Shorthand doc prop
    const docRaw = '<prop:doc title="Guild Notice" seal="VERIFIED">All bounties are temporarily doubled.</prop:doc>';
    const docHtml = formatDialogueHtml(docRaw).html;
    expect(docHtml).toContain('class="vn-prop-card vn-prop-doc"');
    expect(docHtml).toContain('📜 Guild Notice');
    expect(docHtml).toContain('VERIFIED');
    expect(docHtml).toContain('All bounties are temporarily doubled.');

    // 3. Generic tv prop
    const tvRaw = '<prop type="tv" station="K-NEWS" ticker="Substation offline">District blackout warning.</prop>';
    const tvHtml = formatDialogueHtml(tvRaw).html;
    expect(tvHtml).toContain('class="vn-prop-card vn-prop-tv"');
    expect(tvHtml).toContain('K-NEWS');
    expect(tvHtml).toContain('Substation offline');
    expect(tvHtml).toContain('District blackout warning.');
  });
});

import { splitParagraphIntoBeats, inferEmotionFromText, inferActionFromText } from "../src/frontend/stage/beat-splitter.js";
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

  test("infers emotion and actions directly from narrative prose without explicit tags", () => {
    expect(inferEmotionFromText("She smiled warmly at him.")).toBe("smile");
    expect(inferEmotionFromText("He blushed shyly and looked away.")).toBe("blush");
    expect(inferEmotionFromText("Her eyes narrowed suspiciously.")).toBe("suspicious");
    expect(inferActionFromText("*drawing sword* He stood ready.")).toBe("drawing_sword");

    const paras = [
      'Alethea smiled warmly. "I knew you would make it back in time."',
      'Donald scowled in frustration. *slams table* "This makes no sense!"',
    ];
    const beats = splitParagraphIntoBeats(paras, "Narrator");
    expect(beats[0]?.expression).toBe("smile");
    expect(beats[1]?.expression).toBe("angry");
    expect(beats[1]?.action).toBe("slams_table");
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

import { VnTtsEngine } from "../src/frontend/stage/tts-engine.js";

describe("LumiVN Host Default TTS Engine", () => {
  test("cleans dialogue text removing tags, macros, and formatting", () => {
    const engine = new VnTtsEngine();
    const raw = '**Akane**: "Wait! <shake>Look at that!</shake>" [[Run|run_away]] [expression: blush] {{img::surprised}}';
    const clean = engine.cleanDialogueText(raw);
    expect(clean).toBe("Akane: Wait! Look at that!");
  });

  test("resolves default connection from host /api/v1/tts-connections", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url: any) => {
      if (String(url).includes("/api/v1/tts-connections")) {
        return {
          ok: true,
          json: async () => ({
            data: [
              { id: "conn_secondary", name: "Backup Voice", provider: "openai_tts", is_default: false },
              { id: "conn_primary", name: "Default Voice", provider: "openrouter_tts", model: "elevenlabs", voice: "rachel", is_default: true },
            ],
          }),
        } as any;
      }
      return { ok: false, status: 404 } as any;
    };

    try {
      const engine = new VnTtsEngine();
      const conn = await engine.resolveDefaultConnection();
      expect(conn).toBeDefined();
      expect(conn?.id).toBe("conn_primary");
      expect(conn?.name).toBe("Default Voice");
      expect(conn?.voice).toBe("rachel");
      expect(conn?.isDefault).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("speaks using host /api/v1/tts/synthesize and falls back gracefully", async () => {
    let synthesizeCalled = false;
    let payloadSent: any = null;

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url: any, init: any) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/v1/tts-connections")) {
        return {
          ok: true,
          json: async () => ({
            data: [{ id: "conn_default", name: "Host Default", is_default: true, voice: "narrator_1" }],
          }),
        } as any;
      }
      if (urlStr.includes("/api/v1/tts/synthesize")) {
        synthesizeCalled = true;
        payloadSent = JSON.parse(init.body);
        return {
          ok: true,
          blob: async () => new Blob(["fake_mp3_data"], { type: "audio/mpeg" }),
        } as any;
      }
      return { ok: false, status: 404 } as any;
    };

    try {
      const engine = new VnTtsEngine();
      engine.setEnabled(true);
      await engine.speak('Hello from Visual Novel!', "Akane");

      expect(synthesizeCalled).toBe(true);
      expect(payloadSent).toBeDefined();
      expect(payloadSent.connectionId).toBe("conn_default");
      expect(payloadSent.text).toBe("Hello from Visual Novel!");
      expect(payloadSent.voice).toBe("narrator_1");

      engine.stop();
      expect(engine.isEnabled()).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});




