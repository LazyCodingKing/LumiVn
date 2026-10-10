import { describe, test, expect } from "bun:test";
import {
  encodeToonState,
  extractToonRaw,
  parseToonDelta,
  moodToPassions,
} from "../src/backend/toon-parser.js";
import {
  extractProse,
  inferProseEmotionDelta,
  deepMergeLedger,
  extractLedgerRaw,
  parseLedgerYaml,
} from "../src/backend/ledger-parser.js";
import { evaluateMvuLedgerDelta } from "../src/backend/mvu-evaluator.js";
import type { LedgerData, StatRulesSettings } from "../src/shared/types.js";

describe("TOON Format & Preset Independence", () => {
  test("encodeToonState produces ultra-compact tabular notation", () => {
    const ledger: LedgerData = {
      scene: { place: "tendo_dojo", time: "D1 14:00" },
      clock: { t: "D1 14:00" },
      actors: {
        user: { passions: { arousal: 0, joy: 0 }, outfit: { state: "casual" } } as any,
        akane: { passions: { arousal: 60 }, outfit: { top: "school_uniform" } } as any,
      },
    };

    const encoded = encodeToonState(ledger);
    expect(encoded).toContain("scene: place:tendo_dojo time:D1 14:00");
    expect(encoded).toContain("actors[2]{id,mood,slot,outfit}:");
    expect(encoded).toContain("user,neutral,left,casual");
    expect(encoded).toContain("akane,blush,center,school_uniform");

    // Token efficiency: Total encoded length is very small (~130 chars = ~30 tokens)
    expect(encoded.length).toBeLessThan(170);
  });

  test("extractToonRaw extracts TOON blocks from HTML comments and brackets", () => {
    const htmlComment = `Here is the story prose.\n<!--toon\nscene: place:kitchen\nactors[1]{id,mood,slot}:\n akane,smile,center\n-->`;
    const extracted1 = extractToonRaw(htmlComment);
    expect(extracted1).toBeDefined();
    expect(extracted1).toContain("scene: place:kitchen");
    expect(extracted1).toContain("akane,smile,center");

    const bracketBlock = `The dialogue continues.\n[toon\nscene: place:garden\nactors[1]{id,mood}:\n kasumi,neutral\n]`;
    const extracted2 = extractToonRaw(bracketBlock);
    expect(extracted2).toBeDefined();
    expect(extracted2).toContain("scene: place:garden");
  });

  test("parseToonDelta parses tabular rows into structured LedgerData", () => {
    const rawToon = `
scene: place:parlor time:16:00
actors[2]{id,mood,slot,outfit}:
 user,neutral,left,casual
 ranma,angry,center,martial_arts
`;
    const delta = parseToonDelta(rawToon);
    expect(delta).not.toBeNull();
    expect(delta?.scene?.place).toBe("parlor");
    expect(delta?.scene?.time).toBe("16:00");
    expect(delta?.actors?.["user"]).toBeDefined();
    expect(delta?.actors?.["ranma"]).toBeDefined();
    expect(delta?.actors?.["ranma"]?.passions?.anger).toBe(60);
    expect(delta?.actors?.["ranma"]?.outfit?.state).toBe("martial_arts");
    expect((delta?.actors?.["ranma"] as any)?.slot).toBe("center");
  });

  test("moodToPassions correctly maps emotional bands", () => {
    expect(moodToPassions("blush").arousal).toBe(70);
    expect(moodToPassions("angry").anger).toBe(60);
    expect(moodToPassions("scared").fear).toBe(60);
    expect(moodToPassions("smile").joy).toBe(60);
    expect(moodToPassions("sad").sadness).toBe(60);
    expect(moodToPassions("suspicious").suspicion).toBe(60);
    expect(moodToPassions("neutral").joy).toBe(0);
  });

  test("extractProse strips TOON tags cleanly without affecting narrative", () => {
    const raw = `Ranma crossed his arms.\n"What are you looking at?"\n<!--toon\nscene: place:kitchen\nactors[1]{id,mood}:\n ranma,angry\n-->`;
    const clean = extractProse(raw);
    expect(clean).toBe(`Ranma crossed his arms.\n"What are you looking at?"`);
    expect(clean).not.toContain("<!--toon");
    expect(clean).not.toContain("scene:");
  });

  test("inferProseEmotionDelta extracts emotional shift from pure narrative prose", () => {
    const prose = `Akane looked away, her cheeks blushing red with embarrassment.\n"I suppose you did well today."`;
    const delta = inferProseEmotionDelta(prose, "akane");
    expect(delta).not.toBeNull();
    expect(delta?.actors?.["akane"]?.passions?.arousal).toBe(60);

    const happyProse = `Nabiki chuckled warmly and counted the notes with a grin.`;
    const happyDelta = inferProseEmotionDelta(happyProse, "nabiki");
    expect(happyDelta).not.toBeNull();
    expect(happyDelta?.actors?.["nabiki"]?.passions?.joy).toBe(60);
  });

  test("deepMergeLedger merges TOON delta seamlessly with existing chat state", () => {
    const base: LedgerData = {
      scene: { place: "tendo_dojo", time: "12:00" },
      actors: {
        user: { passions: { arousal: 0 } } as any,
        akane: { passions: { anger: 20 }, outfit: { state: "school" } } as any,
      },
    };

    const delta = parseToonDelta(`
scene: place:kitchen
actors[1]{id,mood,slot}:
 akane,blush,right
`);

    expect(delta).not.toBeNull();
    const merged = deepMergeLedger(base, delta!);

    expect(merged.scene?.place).toBe("kitchen");
    expect(merged.scene?.time).toBe("12:00"); // preserved
    expect(merged.actors?.["akane"]?.passions?.arousal).toBe(70); // updated
    expect(merged.actors?.["akane"]?.outfit?.state).toBe("school"); // preserved
    expect((merged.actors?.["akane"] as any)?.slot).toBe("right"); // updated
    expect(merged.actors?.["user"]).toBeDefined(); // preserved
  });
});

describe("State Details Block Extraction & Comprehensive Character Stats", () => {
  test("extractLedgerRaw extracts from <details><summary>State</summary> block", () => {
    const reply = `
She stepped into the hallway, fixing her collar.
"We should leave soon."

<details><summary>State</summary>
\`\`\`yaml
clock:
  date: "14-04-26"
  t: "D1 18:30"
scene:
  place: "nerima:hallway"
  participants: [user, akane]
actors:
  akane:
    name: "Akane Tendo"
    passions:
      anger: 15
      shame: 45
      arousal: 25
      fear: 0
      stress: 30
      pain: 0
      exhaustion: 10
      suspicion: 20
      disgust: 0
      sadness: 5
      guilt: 0
      joy: 50
    combat:
      tier: "T2"
      lv: 3
      hp: "450/600"
      mp: "200/300"
      pwr: 80
      agi: 95
      int: 60
      talent: ["Martial Arts Kata"]
    relations:
      user:
        affinity: 65
        trust: 55
        loyalty: 70
        betrayal_threshold: 40
        shared_secrets: ["Secret Training"]
    agency:
      want_now: "Master the whirlwind technique"
    knowledge:
      secrets:
        - truth: "Fears water"
          exposure: 30
\`\`\`
</details>
`;

    const cleanProse = extractProse(reply);
    expect(cleanProse).toBe(`She stepped into the hallway, fixing her collar.\n"We should leave soon."`);
    expect(cleanProse).not.toContain("<details");
    expect(cleanProse).not.toContain("State");
    expect(cleanProse).not.toContain("akane:");

    const raw = extractLedgerRaw(reply);
    expect(raw).not.toBeNull();
    const parsed = parseLedgerYaml(raw!);

    expect(parsed.clock?.t).toBe("D1 18:30");
    expect(parsed.scene?.place).toBe("nerima:hallway");

    const akane = parsed.actors?.["akane"];
    expect(akane).toBeDefined();
    expect(akane?.name).toBe("Akane Tendo");

    // Passions
    expect(akane?.passions?.shame).toBe(45);
    expect(akane?.passions?.joy).toBe(50);
    expect(akane?.passions?.anger).toBe(15);

    // Combat
    expect(akane?.combat?.tier).toBe("T2");
    expect(akane?.combat?.hp).toBe("450/600");
    expect(akane?.combat?.pwr).toBe(80);

    // Relations & Betrayal Threshold
    const userRel = (akane?.relations as any)?.["user"];
    expect(userRel).toBeDefined();
    expect(userRel?.affinity).toBe(65);
    expect(userRel?.betrayal_threshold).toBe(40);
    expect(userRel?.shared_secrets).toEqual(["Secret Training"]);

    // Agency & Secrets
    expect(akane?.agency?.want_now).toBe("Master the whirlwind technique");
    const secret = (akane?.knowledge as any)?.secrets?.[0];
    expect(secret?.truth).toBe("Fears water");
    expect(secret?.exposure).toBe(30);
  });

  test("extractLedgerRaw extracts from untagged <details> block with yaml", () => {
    const reply = `
The rain started drumming against the glass.

<details>
\`\`\`yaml
clock:
  t: "D2 09:00"
scene:
  place: "school:roof"
actors:
  ranma:
    name: "Ranma Saotome"
    passions:
      anger: 50
    relations:
      user:
        affinity: 30
        betrayal_threshold: 75
\`\`\`
</details>
`;

    const clean = extractProse(reply);
    expect(clean).toBe("The rain started drumming against the glass.");

    const raw = extractLedgerRaw(reply);
    expect(raw).not.toBeNull();
    const parsed = parseLedgerYaml(raw!);
    expect(parsed.scene?.place).toBe("school:roof");
    expect((parsed.actors?.["ranma"]?.relations as any)?.["user"]?.betrayal_threshold).toBe(75);
  });
});

describe("MVU Quiet LLM Ledger Evaluator", () => {
  const dummySettings: StatRulesSettings = {
    enabled: true,
    mode: "mvu_quiet",
    statRules: "Passions: arousal 0..100. Modifiers on physical contact.",
    ledgerPrompt: "Emit yaml inside <details><summary>📊 Ledger</summary>.",
  };

  test("returns null if settings are disabled or mode is not mvu_quiet", async () => {
    const mockSpindle: any = { generate: { quiet: async () => "" }, log: { error: () => {} } };
    const res1 = await evaluateMvuLedgerDelta(
      mockSpindle,
      "chat-1",
      "prose",
      {},
      { ...dummySettings, enabled: false }
    );
    expect(res1).toBeNull();

    const res2 = await evaluateMvuLedgerDelta(
      mockSpindle,
      "chat-1",
      "prose",
      {},
      { ...dummySettings, mode: "inline_interceptor" }
    );
    expect(res2).toBeNull();
  });

  test("calls quiet generation, passes userId, and parses yaml delta", async () => {
    let capturedPayload: any = null;
    let capturedUserId: string | undefined = undefined;

    const mockSpindle: any = {
      generate: {
        quiet: async (payload: any, userId?: string) => {
          capturedPayload = payload;
          capturedUserId = userId;
          return `<details><summary>📊 Ledger</summary>\n\`\`\`yaml\nscene:\n  place: "dojo"\nactors:\n  akane:\n    passions:\n      arousal: 40\n\`\`\`\n</details>`;
        },
      },
      log: { error: () => {} },
    };

    const delta = await evaluateMvuLedgerDelta(
      mockSpindle,
      "chat-123",
      "She turned away quickly, her face flushed.",
      { scene: { place: "garden" }, actors: {} },
      dummySettings,
      "user-42"
    );

    expect(delta).not.toBeNull();
    expect(delta?.scene?.place).toBe("dojo");
    expect(delta?.actors?.["akane"]?.passions?.arousal).toBe(40);
    expect(capturedUserId).toBe("user-42");
    expect(capturedPayload.userId).toBe("user-42");
    expect(capturedPayload.messages[0].content).toContain(dummySettings.statRules);
    expect(capturedPayload.messages[1].content).toContain("She turned away quickly");
  });

  test("handles LLM failure or empty response gracefully returning null", async () => {
    const failingSpindle: any = {
      generate: {
        quiet: async () => {
          throw new Error("Quiet generation timeout");
        },
      },
      log: { error: () => {} },
    };

    const delta = await evaluateMvuLedgerDelta(
      failingSpindle,
      "chat-123",
      "Prose text",
      {},
      dummySettings
    );
    expect(delta).toBeNull();
  });
});

