import { describe, expect, test } from "bun:test";
import {
  evaluateDirectorInterceptor,
  processBPlots,
  computeDirectorImpactDiff,
  resolveIdentityMacros,
  formatDirectorDirective,
  DIRECTOR_DIRECTIVES,
} from "../src/backend/director.js";
import { MenuBar } from "../src/frontend/hud/menu-bar.js";
import { registerDiagnosticsDrawer } from "../src/frontend/studio/diagnostics-drawer.js";
import type { LlmMessageDTO, InterceptorResultDTO } from "lumiverse-spindle-types";
import type { LedgerData, DirectorSettings, DirectorLogEntry } from "../src/shared/types.js";

describe("LumiVN Director & Lifecycle Systems", () => {
  describe("Macros & Director Directive Formatting", () => {
    test("resolveIdentityMacros substitutes {{user}} and {{char}} correctly", () => {
      const template = "Guide {{user}} into interacting with {{char}} carefully.";
      const resolved = resolveIdentityMacros(template, "Raja", "Tessa");
      expect(resolved).toBe("Guide Raja into interacting with Tessa carefully.");
    });

    test("formatDirectorDirective combines system prompt and resolved scene notes", () => {
      const settings: DirectorSettings = {
        systemPrompt: "[LumiVN Living World Director]\n- Guard agency.",
        userNotes: "Do not let {{user}} discover the key yet.",
        enabled: true,
      };
      const formatted = formatDirectorDirective(settings, "Hero");
      expect(formatted).toContain("[LumiVN Living World Director]");
      expect(formatted).toContain("[Scene Notes & Guidance]");
      expect(formatted).toContain("Do not let Hero discover the key yet.");
    });
  });

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

    test("skips injection if Director is disabled in settings", async () => {
      const messages: LlmMessageDTO[] = [{ role: "user", content: "Hello" }];
      const res = await evaluateDirectorInterceptor(
        messages,
        { chatId: "chat_123", generationType: "normal" },
        async () => ({ scene: { place: "room" } }),
        async () => ({
          systemPrompt: "System",
          userNotes: "",
          enabled: false,
        })
      );
      expect(res).toBe(messages);
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

      let cachedKey: string | null = null;
      let cachedDirective: string | null = null;

      const result = await evaluateDirectorInterceptor(
        messages,
        { chatId: "chat_active", generationId: "gen_99", generationType: "normal" },
        async () => fakeLedger,
        async () => ({
          systemPrompt: DIRECTOR_DIRECTIVES,
          userNotes: "Stay cautious.",
          enabled: true,
        }),
        (key, dir) => {
          cachedKey = key;
          cachedDirective = dir;
        }
      );

      expect(typeof result).toBe("object");
      const interceptorRes = result as InterceptorResultDTO;
      expect(interceptorRes.messages).toBeDefined();
      expect(interceptorRes.messages.length).toBe(2);

      // First message is director system prompt
      const directorMsg = interceptorRes.messages[0];
      expect(directorMsg.role).toBe("system");
      expect(directorMsg.content).toContain("[LumiVN Living World Director Guidance]");
      expect(directorMsg.content).toContain("CRITICAL INSTRUCTION: Execute this guidance as internal steering. Do NOT output JSON.");
      expect(directorMsg.content).toContain("PLAYER AGENCY GUARD");
      expect(directorMsg.content).toContain("NPC AUTONOMY");
      expect(directorMsg.content).toContain("PERSISTENT SECRETS");
      expect(directorMsg.content).toContain("UNRESOLVED TENSION");
      expect(directorMsg.content).toContain("Stay cautious.");

      // Injected directive cached for post-turn diff logging
      expect(cachedKey).toBe("chat_active");
      expect(cachedDirective).toContain("Stay cautious.");

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

    test("injects decorum guidance when player is underdressed in formal public room", async () => {
      const messages: LlmMessageDTO[] = [{ role: "user", content: "I enter the grand ballroom." }];
      const ledger: LedgerData = {
        scene: { place: "ballroom" },
        places: {
          ballroom: {
            norm: "formal gala",
            privacy: 1,
          },
        },
        actors: {
          user: {
            name: "Player",
            outfit: {
              top: "none",
              bottom: "trousers",
            },
          },
        },
      };

      const res = (await evaluateDirectorInterceptor(
        messages,
        { chatId: "chat_ballroom" },
        async () => ledger
      )) as any;

      expect(res.messages).toBeDefined();
      const content = res.messages[0].content;
      expect(content).toContain("Director Guidance: {{user}} is visibly under-dressed");
    });

    test("injects active investigation alerts when alert_level >= 1", async () => {
      const messages: LlmMessageDTO[] = [{ role: "user", content: "Walking through town." }];
      const ledger: LedgerData = {
        world: {
          investigations: {
            guard: {
              authority: "Royal Guard",
              alert_level: 2,
              target_id: "user",
              clues: ["Footprint", "Stolen locket"],
            },
          },
        },
      };

      const res = (await evaluateDirectorInterceptor(
        messages,
        { chatId: "chat_town" },
        async () => ledger
      )) as any;

      expect(res.messages).toBeDefined();
      const content = res.messages[0].content;
      expect(content).toContain("Director Alert: Investigation by Royal Guard active at Alert Level 2");
      expect(content).toContain("Clues: Footprint, Stolen locket");
    });
  });

  describe("Post-Turn State Diffing & Director Log Generation", () => {
    test("accurately diffs world shifts, NPC intent, passions, relations, and mutations", () => {
      const prevLedger: LedgerData = {
        clock: { t: "D1 10:00" },
        scene: { place: "hallway" },
        bplots: [
          { id: "bp_1", who: "Officer Jenny", ripple: 1, status: "active" },
        ],
        opportunities: [
          { id: "opp_1", what: "Old Key", status: "lead" },
        ],
        actors: {
          tessa: {
            name: "Tessa",
            agency: { want_now: "Explore the house" },
            passions: { anger: 10, fear: 0 },
            relations: { user: { trust: 50 } },
          },
        },
        journal: [],
      };

      const nextLedger: LedgerData = {
        clock: { t: "D1 10:15" },
        scene: { place: "library" },
        bplots: [
          { id: "bp_1", who: "Officer Jenny", ripple: 2, status: "active" },
          { id: "bp_2", who: "Mysterious Merchant", ripple: 1, status: "active" },
        ],
        opportunities: [
          { id: "opp_1", what: "Old Key", status: "taken" },
        ],
        actors: {
          tessa: {
            name: "Tessa",
            agency: { want_now: "Conceal embarrassment" },
            passions: { anger: 25, arousal: 30 },
            relations: { user: { trust: 65 } },
          },
        },
        journal: [
          {
            id: "j_1",
            action: "Looked around the library",
            mutations: ["tessa.passions.arousal += 30", "user.inventory += 'Old Key'"],
          },
        ],
      };

      const diff = computeDirectorImpactDiff(
        prevLedger,
        nextLedger,
        "[LumiVN Living World Director] Directives"
      );

      expect(diff).toBeDefined();
      expect(diff.directive).toBe("[LumiVN Living World Director] Directives");

      // World shifts
      expect(diff.worldChanges).toContain("Clock advanced: D1 10:00 -> D1 10:15");
      expect(diff.worldChanges).toContain("Scene location moved: hallway -> library");
      expect(diff.worldChanges.some((w) => w.includes("B-Plot escalated: Officer Jenny ripple 1 -> 2"))).toBe(true);
      expect(diff.worldChanges.some((w) => w.includes("New B-Plot: Mysterious Merchant"))).toBe(true);
      expect(diff.worldChanges.some((w) => w.includes('Opportunity status changed: "Old Key" -> taken'))).toBe(true);

      // NPC intent & changes
      expect(diff.npcChanges.length).toBe(1);
      const tessaDiff = diff.npcChanges[0];
      expect(tessaDiff.actorId).toBe("tessa");
      expect(tessaDiff.wantNow).toBe("Conceal embarrassment");
      expect(tessaDiff.passionsMoved?.anger).toBe(25);
      expect(tessaDiff.passionsMoved?.arousal).toBe(30);
      expect(tessaDiff.relationsMoved?.user).toEqual({ trust: 65 });

      // Journal mutations
      expect(diff.mutations).toContain("tessa.passions.arousal += 30");
      expect(diff.mutations).toContain("user.inventory += 'Old Key'");
    });

    test("diffs investigations escalation and NPC attire changes (scent, integrity, residue)", () => {
      const prevLedger: LedgerData = {
        world: {
          investigations: {
            watch: {
              authority: "City Watch",
              alert_level: 1,
              target_id: "suspect",
              clues: ["bootprint"],
            },
          },
        },
        actors: {
          clara: {
            name: "Clara",
            outfit: {
              top: "Silk blouse",
              integrity: 100,
              scent: "lavender",
              residue: [],
            },
          },
        },
      };

      const nextLedger: LedgerData = {
        world: {
          investigations: {
            watch: {
              authority: "City Watch",
              alert_level: 2,
              target_id: "suspect",
              clues: ["bootprint", "dagger sheath"],
            },
          },
        },
        actors: {
          clara: {
            name: "Clara",
            outfit: {
              top: "Silk blouse",
              integrity: 75,
              scent: "smoke",
              residue: ["soot", "mud"],
            },
          },
        },
      };

      const diff = computeDirectorImpactDiff(prevLedger, nextLedger, "Directive");

      expect(diff.worldChanges.some((w) => w.includes("Investigation alert escalated: City Watch Alert Level 1 -> 2"))).toBe(true);
      expect(diff.worldChanges.some((w) => w.includes("Investigation clues discovered by City Watch: dagger sheath"))).toBe(true);

      expect(diff.npcChanges.length).toBe(1);
      const claraDiff = diff.npcChanges[0];
      expect(claraDiff.actorId).toBe("clara");
      expect(claraDiff.attireChanged).toBeDefined();
      expect(claraDiff.attireChanged).toContain("integrity 100% -> 75%");
      expect(claraDiff.attireChanged).toContain('scent "lavender" -> "smoke"');
      expect(claraDiff.attireChanged).toContain("residue [soot, mud]");
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

  describe("Sidebar Diagnostics Drawer: Director Prompt Editor & Impact Console", () => {
    test("renders Director Prompt editor controls and dispatches vn_save_director_settings", () => {
      const sentMessages: any[] = [];
      const mockCtx: any = {
        ui: {
          registerDrawerTab: (opts: any) => ({
            id: opts.id,
            root: document.createElement("div"),
            destroy: () => {},
          }),
        },
        sendToBackend: (msg: any) => sentMessages.push(msg),
      };

      const drawer = registerDiagnosticsDrawer(mockCtx, () => {});
      expect(drawer).not.toBeNull();
      const root = drawer!.tab.root;

      // Editor elements exist
      const systemTextarea = root.querySelector("#vn-director-system") as HTMLTextAreaElement;
      const notesTextarea = root.querySelector("#vn-director-notes") as HTMLTextAreaElement;
      const enabledCheckbox = root.querySelector("#vn-director-enabled") as HTMLInputElement;
      const saveBtn = root.querySelector("#vn-director-save-btn") as HTMLButtonElement;

      expect(systemTextarea).not.toBeNull();
      expect(notesTextarea).not.toBeNull();
      expect(enabledCheckbox).not.toBeNull();
      expect(saveBtn).not.toBeNull();

      // Test setDirectorSettings
      drawer!.setDirectorSettings({
        systemPrompt: "Custom directive",
        userNotes: "Tessa secret notes",
        enabled: true,
      });

      expect(systemTextarea.value).toBe("Custom directive");
      expect(notesTextarea.value).toBe("Tessa secret notes");
      expect(enabledCheckbox.checked).toBe(true);

      // Click save button
      saveBtn.click();
      const saveMsg = sentMessages.find((m) => m.type === "vn_save_director_settings");
      expect(saveMsg).toBeDefined();
      expect(saveMsg.settings.systemPrompt).toBe("Custom directive");
      expect(saveMsg.settings.userNotes).toBe("Tessa secret notes");
      expect(saveMsg.settings.enabled).toBe(true);
    });

    test("renders Director Impact Console entries with visual tags", () => {
      const mockCtx: any = {
        ui: {
          registerDrawerTab: (opts: any) => ({
            id: opts.id,
            root: document.createElement("div"),
            destroy: () => {},
          }),
        },
        sendToBackend: () => {},
      };

      const drawer = registerDiagnosticsDrawer(mockCtx, () => {});
      const root = drawer!.tab.root;

      const logEntry: DirectorLogEntry = {
        timestamp: "12:34:56",
        directive: "Stay in role and keep tension active",
        worldChanges: ["Scene location moved: street -> dojo"],
        npcChanges: [
          {
            actorId: "tessa",
            name: "Tessa",
            wantNow: "Hide the letter",
            passionsMoved: { anger: 40 },
          },
        ],
        mutations: ["user.stamina -= 10"],
      };

      drawer!.pushDirectorLog(logEntry);

      const directorStream = root.querySelector("#vn-director-log-stream") as HTMLElement;
      expect(directorStream).not.toBeNull();
      expect(directorStream.textContent).toContain("TURN IMPACT");
      expect(directorStream.textContent).toContain("[Directive]");
      expect(directorStream.textContent).toContain("Stay in role and keep tension active");
      expect(directorStream.textContent).toContain("[World Shifts]");
      expect(directorStream.textContent).toContain("Scene location moved: street -> dojo");
      expect(directorStream.textContent).toContain("[NPC Intent]");
      expect(directorStream.textContent).toContain("Tessa");
      expect(directorStream.textContent).toContain('want_now -> "Hide the letter"');
      expect(directorStream.textContent).toContain("anger (40)");
      expect(directorStream.textContent).toContain("[Mutations]");
      expect(directorStream.textContent).toContain("user.stamina -= 10");
    });
  });
});
