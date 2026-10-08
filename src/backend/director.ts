import type { LlmMessageDTO, InterceptorResultDTO } from "lumiverse-spindle-types";
import type { LedgerData, BPlot, DirectorSettings, DirectorLogEntry } from "../shared/types.js";
import { DEFAULT_DIRECTOR_SETTINGS } from "./storage.js";

export const DIRECTOR_DIRECTIVES = DEFAULT_DIRECTOR_SETTINGS.systemPrompt;

export function extractChatId(context: unknown): string | null {
  if (!context || typeof context !== "object") return null;
  const ctx = context as Record<string, unknown>;
  if (typeof ctx.chatId === "string" && ctx.chatId.trim()) return ctx.chatId.trim();
  return null;
}

export function extractGenerationType(context: unknown): string | null {
  if (!context || typeof context !== "object") return null;
  const ctx = context as Record<string, unknown>;
  if (typeof ctx.generationType === "string" && ctx.generationType.trim()) {
    return ctx.generationType.trim();
  }
  return null;
}

export function resolveIdentityMacros(template: string, userName = "User", charName = "Character"): string {
  if (!template) return "";
  return template
    .replace(/\{\{user\}\}/gi, userName)
    .replace(/\{\{char\}\}/gi, charName);
}

export function formatDirectorDirective(
  settings: DirectorSettings,
  userName?: string,
  charName?: string
): string {
  let activeDirective = (settings.systemPrompt || "").trim();
  if (settings.userNotes && settings.userNotes.trim()) {
    const resolvedNotes = resolveIdentityMacros(settings.userNotes.trim(), userName, charName);
    activeDirective = activeDirective
      ? `${activeDirective}\n\n[Scene Notes & Guidance]\n${resolvedNotes}`
      : resolvedNotes;
  }
  return activeDirective;
}

export async function evaluateDirectorInterceptor(
  messages: LlmMessageDTO[],
  context: unknown,
  getChatState: (chatId: string) => Promise<LedgerData | null>,
  getDirectorSettings?: () => Promise<DirectorSettings>,
  onInjectedDirective?: (key: string, directive: string) => void
): Promise<LlmMessageDTO[] | InterceptorResultDTO> {
  const chatId = extractChatId(context);
  const genType = extractGenerationType(context);
  const isDry = Boolean((context as any)?.dryRun || (context as any)?.isDryRun);

  // 1. Guard against quiet/background generations & dry runs
  if (!chatId || isDry || genType === "quiet") return messages;

  const settings = getDirectorSettings
    ? await getDirectorSettings()
    : DEFAULT_DIRECTOR_SETTINGS;

  if (!settings || !settings.enabled) return messages;

  // 2. Read latest chat state and roster
  const currentState = await getChatState(chatId);
  if (!currentState) return messages;

  const activeDirective = formatDirectorDirective(settings);
  if (!activeDirective) return messages;

  // Guard against duplicate injections
  if (messages.some((m) => typeof m.content === "string" && m.content.includes(activeDirective))) {
    return messages;
  }

  // Cache injected directive
  const generationId = (context as any)?.generationId;
  if (onInjectedDirective) {
    if (generationId) onInjectedDirective(`${chatId}:${generationId}`, activeDirective);
    onInjectedDirective(chatId, activeDirective);
  }

  // 3. Directorial Guidance Block
  const directorBlock: LlmMessageDTO = {
    role: "system",
    content: activeDirective,
  };

  return {
    messages: [directorBlock, ...messages],
    breakdown: [{ messageIndex: 0, name: "LumiVN Director" }],
  };
}

export function computeDirectorImpactDiff(
  prevLedger: LedgerData | null,
  nextLedger: LedgerData,
  directive: string
): DirectorLogEntry {
  const worldChanges: string[] = [];
  const npcChanges: Array<{
    actorId: string;
    name: string;
    wantNow?: string;
    passionsMoved?: Record<string, number>;
    relationsMoved?: Record<string, any>;
  }> = [];
  const mutations: string[] = [];

  // 1. World diff
  const prevTime = prevLedger?.clock?.t;
  const nextTime = nextLedger?.clock?.t;
  if (nextTime && nextTime !== prevTime) {
    worldChanges.push(`Clock advanced: ${prevTime || "start"} -> ${nextTime}`);
  }

  const prevPlace = prevLedger?.scene?.place;
  const nextPlace = nextLedger?.scene?.place;
  if (nextPlace && nextPlace !== prevPlace) {
    worldChanges.push(`Scene location moved: ${prevPlace || "initial"} -> ${nextPlace}`);
  }

  // B-Plots
  const prevBPlots = prevLedger?.bplots || [];
  const nextBPlots = nextLedger?.bplots || [];
  for (const nextBp of nextBPlots) {
    const prevBp = prevBPlots.find((b) => b.id === nextBp.id);
    if (!prevBp) {
      worldChanges.push(
        `New B-Plot: ${nextBp.who || nextBp.id} (${nextBp.doing || "active"}) [ripple ${nextBp.ripple ?? 1}]`
      );
    } else if (prevBp.ripple !== nextBp.ripple) {
      worldChanges.push(
        `B-Plot escalated: ${nextBp.who || nextBp.id} ripple ${prevBp.ripple} -> ${nextBp.ripple}`
      );
    } else if (prevBp.status !== nextBp.status) {
      worldChanges.push(
        `B-Plot status shift: ${nextBp.who || nextBp.id} -> ${nextBp.status}`
      );
    }
  }

  // Opportunities
  const prevOpps = prevLedger?.opportunities || [];
  const nextOpps = nextLedger?.opportunities || [];
  for (const nextOpp of nextOpps) {
    const prevOpp = prevOpps.find((o) => o.id === nextOpp.id);
    if (!prevOpp) {
      worldChanges.push(
        `New Opportunity: "${nextOpp.what || nextOpp.id}" (${nextOpp.status || "lead"})`
      );
    } else if (prevOpp.status !== nextOpp.status) {
      worldChanges.push(
        `Opportunity status changed: "${nextOpp.what || nextOpp.id}" -> ${nextOpp.status}`
      );
    }
  }

  // 2. NPC Behavior & Plans
  const nextActors = nextLedger?.actors || {};
  const prevActors = prevLedger?.actors || {};
  for (const [actorId, actor] of Object.entries(nextActors)) {
    if (!actor) continue;
    const prevActor = prevActors[actorId];
    const name = actor.name || actorId;

    const prevWantNow =
      (prevActor?.agency as any)?.want_now || (prevActor?.state as any)?.want_now;
    const nextWantNow =
      (actor.agency as any)?.want_now || (actor.state as any)?.want_now;
    const wantChanged = Boolean(nextWantNow && nextWantNow !== prevWantNow);

    const prevGoals = (prevActor?.agency as any)?.goals;
    const nextGoals = (actor.agency as any)?.goals;
    const goalsChanged = Boolean(
      nextGoals && JSON.stringify(nextGoals) !== JSON.stringify(prevGoals)
    );

    // Shifted passions
    const passionsMoved: Record<string, number> = {};
    const nextPassions = actor.passions || {};
    const prevPassions = prevActor?.passions || {};
    for (const [pKey, pVal] of Object.entries(nextPassions)) {
      if (typeof pVal === "number" && pVal !== (prevPassions as any)[pKey]) {
        passionsMoved[pKey] = pVal;
      }
    }

    // Moved relations
    const relationsMoved: Record<string, any> = {};
    const nextRelations = actor.relations || {};
    const prevRelations = prevActor?.relations || {};
    for (const [target, relData] of Object.entries(nextRelations)) {
      if (JSON.stringify(relData) !== JSON.stringify(prevRelations[target])) {
        relationsMoved[target] = relData;
      }
    }

    if (
      wantChanged ||
      goalsChanged ||
      Object.keys(passionsMoved).length > 0 ||
      Object.keys(relationsMoved).length > 0
    ) {
      npcChanges.push({
        actorId,
        name,
        wantNow:
          nextWantNow ||
          (goalsChanged ? `Goals: ${JSON.stringify(nextGoals)}` : undefined),
        passionsMoved:
          Object.keys(passionsMoved).length > 0 ? passionsMoved : undefined,
        relationsMoved:
          Object.keys(relationsMoved).length > 0 ? relationsMoved : undefined,
      });
    }
  }

  // 3. Journal Mutations
  if (nextLedger?.journal && nextLedger.journal.length > 0) {
    const latest = nextLedger.journal[nextLedger.journal.length - 1];
    if (Array.isArray(latest?.mutations)) {
      for (const m of latest.mutations) {
        if (m) mutations.push(String(m));
      }
    }
  }

  return {
    timestamp: new Date().toLocaleTimeString(),
    directive: directive || "Default living world constraints",
    worldChanges,
    npcChanges,
    mutations,
  };
}


export interface BPlotProcessResult {
  hasBPlotNotification: boolean;
  activeRipples: BPlot[];
  promotedActors: string[];
}

export function processBPlots(ledger: LedgerData): BPlotProcessResult {
  let hasBPlotNotification = false;
  const activeRipples: BPlot[] = [];
  const promotedActors: string[] = [];

  if (!ledger.bplots || !Array.isArray(ledger.bplots)) {
    return { hasBPlotNotification, activeRipples, promotedActors };
  }

  if (!ledger.roster) {
    ledger.roster = [];
  }

  for (const bp of ledger.bplots) {
    if (bp.ripple === 2 && bp.status === "active") {
      hasBPlotNotification = true;
      activeRipples.push(bp);
    } else if (bp.ripple === 3) {
      const who = bp.who?.trim() || "newcomer";
      const exists = ledger.roster.some(
        (r) => r.id === who || (r.name && r.name.toLowerCase() === who.toLowerCase())
      );
      if (!exists) {
        ledger.roster.push({
          id: who,
          name: who,
          lod: 2,
          status: bp.doing || "Arrived in area",
          loc: ledger.scene?.place || "default",
          record: "roster",
          tick: 1,
        });
        promotedActors.push(who);
      }
    }
  }

  return { hasBPlotNotification, activeRipples, promotedActors };
}
