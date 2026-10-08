import { describe, test, expect } from "bun:test";
import {
  advanceClock,
  updateActorLocationsByRoutines,
  giftItem,
  snoopRoom,
} from "../src/backend/engine-actions.js";
import type { LedgerData } from "../src/shared/types.js";

describe("HTML Game Mechanics: Clock & Engine Actions", () => {
  test("advanceClock increments minutes and computes correct phases", () => {
    const start = { date: "Day 1", t: "09:00", phase: "Morning" };

    // Advance 30 mins
    const plus30 = advanceClock(start, 30);
    expect(plus30.t).toBe("09:30");
    expect(plus30.date).toBe("Day 1");
    expect(plus30.phase).toBe("Morning");

    // Advance across noon into Afternoon
    const afternoon = advanceClock(plus30, 180);
    expect(afternoon.t).toBe("12:30");
    expect(afternoon.phase).toBe("Afternoon");

    // Advance into Evening
    const evening = advanceClock(afternoon, 300);
    expect(evening.t).toBe("17:30");
    expect(evening.phase).toBe("Evening");

    // Advance into Night
    const night = advanceClock(evening, 240);
    expect(night.t).toBe("21:30");
    expect(night.phase).toBe("Night");
  });

  test("advanceClock handles day rollover across midnight", () => {
    const late = { date: "Day 1", t: "23:45", phase: "Night" };
    const rolled = advanceClock(late, 30);
    expect(rolled.date).toBe("Day 2");
    expect(rolled.t).toBe("00:15");
    expect(rolled.phase).toBe("Night");
  });

  test("advanceClock sleepUntilMorning advances to next morning 07:00", () => {
    const evening = { date: "Day 1", t: "21:00", phase: "Night" };
    const morning = advanceClock(evening, 0, true);
    expect(morning.date).toBe("Day 2");
    expect(morning.t).toBe("07:00");
    expect(morning.phase).toBe("Morning");
  });

  test("updateActorLocationsByRoutines positions NPCs matching time", () => {
    const actors = {
      user: { id: "user", name: "Player" },
      akane: {
        id: "akane",
        name: "Akane",
        life_model: {
          routines: [
            { time: "08:00", place: "tendo_residence:kitchen", phase: "Morning" },
            { time: "13:00", place: "nerima_high:classroom", phase: "Afternoon" },
            { time: "18:00", place: "tendo_residence:dojo", phase: "Evening" },
          ],
        },
      },
    };

    // At 14:00 (Afternoon)
    const moved = updateActorLocationsByRoutines(actors as any, "14:00", "Afternoon");
    expect(moved["akane"].inventory?.room_location).toBe("nerima_high:classroom");

    // At 19:00 (Evening)
    const eveningMoved = updateActorLocationsByRoutines(actors as any, "19:00", "Evening");
    expect(eveningMoved["akane"].inventory?.room_location).toBe("tendo_residence:dojo");
  });

  test("giftItem transfers item, raises affinity, and awards favor", () => {
    const state: LedgerData = {
      clock: { t: "14:00", date: "Day 1" },
      scene: { place: "tendo_residence:dojo" },
      actors: {
        user: {
          id: "user",
          inventory: { carried: ["Box of Chocolates", "Wooden Sword"] },
        },
        akane: {
          id: "akane",
          name: "Akane Tendo",
          inventory: { carried: [] },
          relations: {
            user: { affinity: 50, trust: 40 },
          },
        },
      },
      journal: [],
    };

    const res = giftItem(state, "akane", "Box of Chocolates");
    expect(res.success).toBe(true);

    // Item moved from player to NPC
    const nextUser = res.state.actors?.user;
    const nextAkane = res.state.actors?.akane;
    expect(nextUser?.inventory?.carried).toEqual(["Wooden Sword"]);
    expect(nextAkane?.inventory?.carried).toEqual(["Box of Chocolates"]);

    // Affinity and favors updated
    expect(nextAkane?.relations?.user?.affinity).toBe(60);
    expect((nextAkane?.relations?.user as any)?.favors_owed).toBe(1);

    // Journal logged
    expect(res.state.journal?.length).toBe(1);
    expect(res.state.journal?.[0].action).toContain("Box of Chocolates");
  });

  test("snoopRoom retrieves resources and evaluates suspicion risk", () => {
    const state: LedgerData = {
      places: {
        "tendo_residence:dojo": {
          privacy: 1, // low privacy = raises suspicion
          resources: ["Wooden Bokken", "First Aid Kit"],
        },
      },
      actors: {
        user: {
          id: "user",
          passions: { suspicion: 10 },
          inventory: { carried: [] },
        },
      },
    };

    const res = snoopRoom(state, "tendo_residence:dojo");
    expect(res.success).toBe(true);
    expect(res.foundItem).toBeDefined();

    // Found item in user inventory
    const user = res.state.actors?.user;
    expect(user?.inventory?.carried).toContain(res.foundItem!);

    // Suspicion increased due to low privacy (<= 1)
    expect(user?.passions?.suspicion).toBeGreaterThan(10);
  });
});
