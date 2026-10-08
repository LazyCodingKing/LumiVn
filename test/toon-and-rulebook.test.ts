import { describe, test, expect } from "bun:test";
import {
  encodeToonState,
  extractToonRaw,
  parseToonDelta,
  moodToPassions,
  getToonPromptInstruction,
} from "../src/backend/toon-parser.js";
import {
  extractProse,
  inferProseEmotionDelta,
  deepMergeLedger,
} from "../src/backend/ledger-parser.js";
import {
  generateCharacterDossier,
  generateSurroundingPlaces,
  simulateOffscreenMoves,
} from "../src/backend/out-of-band.js";
import type { LedgerData } from "../src/shared/types.js";

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

describe("Out-of-Band LLM Generation & World Simulation", () => {
  test("generateCharacterDossier provides complete fallback dossier on missing LLM", async () => {
    const mockSpindle: any = {
      log: { error: () => {}, info: () => {} },
    };
    const dossier = await generateCharacterDossier(
      mockSpindle,
      "akane",
      "Akane Tendo",
      { scene: { place: "tendo_dojo" } }
    );

    expect(dossier.id).toBe("akane");
    expect(dossier.name).toBe("Akane Tendo");
    expect(dossier.combat?.tier).toBe(1);
    expect(dossier.combat?.hp).toBe("150/150");
    expect(dossier.life_model?.routines?.length).toBeGreaterThan(0);
    expect(dossier.passions?.joy).toBe(40);
  });

  test("generateSurroundingPlaces returns adjoining room fallback", async () => {
    const mockSpindle: any = {
      log: { error: () => {}, info: () => {} },
    };
    const places = await generateSurroundingPlaces(
      mockSpindle,
      "tendo_dojo:hall",
      { scene: { place: "tendo_dojo:hall" } }
    );

    expect(Object.keys(places).length).toBeGreaterThan(0);
    expect(Object.keys(places)[0]).toContain("tendo_dojo");
  });

  test("simulateOffscreenMoves produces bulletin post and rumor", async () => {
    const mockSpindle: any = {
      log: { error: () => {}, info: () => {} },
    };
    const sim = await simulateOffscreenMoves(mockSpindle, {
      clock: { t: "14:00", date: "Day 1" },
      actors: {
        akane: { name: "Akane" },
        ranma: { name: "Ranma" },
      },
    });

    expect(sim.bulletin).toBeDefined();
    expect(sim.bulletin.title).toContain("Spotted");
    expect(sim.relationUpdates?.length).toBe(1);
  });
});
