import { describe, expect, test } from "bun:test";
import {
  evaluateDirectorInterceptor,
  processBPlots,
  DIRECTOR_DIRECTIVES,
  extractChatId,
  extractGenerationType,
} from "../src/backend/director.js";
import { MenuBar } from "../src/frontend/hud/menu-bar.js";
import type { LlmMessageDTO, InterceptorResultDTO } from "lumiverse-spindle-types";
import type { LedgerData } from "../src/shared/types.js";

describe("LumiVN Director & Lifecycle Systems", () => {
  describe("Pre-Turn Director Interceptor & Agency Guardrails", () => {
    test("guards against dry runs, missing chat IDs, and quiet generation types", async () => {
      const messages: LlmMessageDTO[] = [{ role: "user", content: "Hello there" }];

      // 1. Missing chatId
      const res1 = await evaluateDirectorInterceptor(messages, {}, async () => ({}));
      expect(res1).toBe(messages);

      // 2. dryRun = true
      const res2 = await evaluateDirectorInterceptor(
        messages,
        { chatId: "chat_123", dryRun: true },
        async () => ({})
      );
      expect(res2).toBe(messages);

      // 3. isDryRun = true
      const res3 = await evaluateDirectorInterceptor(
        messages,
        { chatId: "chat_123", isDryRun: true },
        async () => ({})
      );
      expect(res3).toBe(messages);

      // 4. quiet generation type
      const res4 = await evaluateDirectorInterceptor(
        messages,
        { chatId: "chat_123", generationType: "quiet" },
        async () => ({})
      );
      expect(res4).toBe(messages);
    });

    test("skips injection if current chat state is not found", async () => {
      const messages: LlmMessageDTO[] = [{ role: "user", content: "Hello" }];
      const res = await evaluateDirectorInterceptor(
        messages,
        { chatId: "chat_123", generationType: "normal" },
        async () => null
      );
      expect(res).toBe(messages);
    });

    test("injects living world director directives and breakdown attribution", async () => {
      const messages: LlmMessageDTO[] = [
        { role: "user", content: "I take a step into the parlor." },
      ];
      const fakeLedger: LedgerData = {
        scene: { place: "parlor", participants: ["user", "npc_a"] },
        roster: [{ id: "npc_a", name: "Alice" }],
      };

      const result = await evaluateDirectorInterceptor(
        messages,
        { chatId: "chat_active", generationType: "normal" },
        async () => fakeLedger
      );

      expect(typeof result).toBe("object");
      const interceptorRes = result as InterceptorResultDTO;
      expect(interceptorRes.messages).toBeDefined();
      expect(interceptorRes.messages.length).toBe(2);

      // First message is director system prompt
      const directorMsg = interceptorRes.messages[0];
      expect(directorMsg.role).toBe("system");
      expect(directorMsg.content).toContain("[LumiVN Living World Director]");
      expect(directorMsg.content).toContain("PLAYER AGENCY GUARD");
      expect(directorMsg.content).toContain("NPC AUTONOMY");
      expect(directorMsg.content).toContain("PERSISTENT SECRETS");
      expect(directorMsg.content).toContain("UNRESOLVED TENSION");

      // Original user message preserved
      expect(interceptorRes.messages[1].content).toBe("I take a step into the parlor.");

      // Prompt breakdown registered
      expect(interceptorRes.breakdown).toBeDefined();
      expect(interceptorRes.breakdown?.[0].messageIndex).toBe(0);
      expect(interceptorRes.breakdown?.[0].name).toBe("LumiVN Director");
    });

    test("idempotent: does not duplicate director block if already present", async () => {
      const messages: LlmMessageDTO[] = [
        { role: "system", content: DIRECTOR_DIRECTIVES },
        { role: "user", content: "Already injected turn." },
      ];
      const result = await evaluateDirectorInterceptor(
        messages,
        { chatId: "chat_active" },
        async () => ({})
      );
      expect(result).toBe(messages);
    });
  });

  describe("B-Plot Emergent NPC Arrival & Phone Notification Hook", () => {
    test("detects ripple === 2 active B-plots and flags notification", () => {
      const ledger: LedgerData = {
        bplots: [
          {
            id: "bp_1",
            who: "Officer Jenny",
            doing: "Investigating broken lock at warehouse",
            vector: "Police radio chatter",
            ripple: 2,
            status: "active",
          },
          {
            id: "bp_2",
            who: "Mysterious Merchant",
            doing: "Selling rare artifacts",
            ripple: 1,
            status: "active",
          },
        ],
      };

      const res = processBPlots(ledger);
      expect(res.hasBPlotNotification).toBe(true);
      expect(res.activeRipples.length).toBe(1);
      expect(res.activeRipples[0].who).toBe("Officer Jenny");
      expect(res.promotedActors.length).toBe(0);
    });

    test("promotes ripple === 3 collision actor into roster as newcomer", () => {
      const ledger: LedgerData = {
        scene: { place: "warehouse:exterior" },
        roster: [{ id: "user", name: "User" }],
        bplots: [
          {
            id: "bp_collision",
            who: "detective_kane",
            doing: "Kicks open the rear door with weapon drawn",
            ripple: 3,
            status: "active",
          },
        ],
      };

      const res = processBPlots(ledger);
      expect(res.promotedActors).toContain("detective_kane");

      const promoted = ledger.roster?.find((r) => r.id === "detective_kane");
      expect(promoted).toBeDefined();
      expect(promoted?.name).toBe("detective_kane");
      expect(promoted?.status).toBe("Kicks open the rear door with weapon drawn");
      expect(promoted?.loc).toBe("warehouse:exterior");
      expect(promoted?.lod).toBe(2);
      expect(promoted?.record).toBe("roster");

      // Running processBPlots again does not duplicate the promoted actor
      const res2 = processBPlots(ledger);
      expect(res2.promotedActors.length).toBe(0);
      expect(ledger.roster?.filter((r) => r.id === "detective_kane").length).toBe(1);
    });
  });

  describe("HUD MenuBar Phone Badge Animation", () => {
    test("toggles vn-pulse class and display flex on Phone badge when hasBPlotNotification is true", () => {
      const mockCtx: any = {
        onBackendMessage: () => () => {},
        ready: () => {},
      };
      const menuBar = new MenuBar(mockCtx, () => {});

      const phoneBtn = menuBar.root.querySelector('[data-tab-id="phone"]');
      const badge = phoneBtn?.querySelector(".vn-hud-badge") as HTMLElement;
      expect(badge).not.toBeNull();
      expect(badge.style.display).toBe("none");

      // Call setLedger with hasBPlotNotification = true
      menuBar.setLedger({ clock: { t: "14:00" } }, true);
      expect(badge.style.display).toBe("flex");
      expect(badge.classList.contains("vn-pulse")).toBe(true);

      // Call setLedger with hasBPlotNotification = false
      menuBar.setLedger({ clock: { t: "14:05" } }, false);
      expect(badge.style.display).toBe("none");
      expect(badge.classList.contains("vn-pulse")).toBe(false);
    });
  });
});
