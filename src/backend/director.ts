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

  let activeDirective = formatDirectorDirective(settings);
  if (!activeDirective) return messages;

  // Decorum validation scan
  const currentPlaceId = currentState.scene?.place;
  const currentPlace = currentPlaceId && currentState.places?.[currentPlaceId];
  const userDossier = currentState.actors?.["user"];
  if (currentPlace && userDossier?.outfit) {
    const norm = String(currentPlace.norm || "").toLowerCase();
    const privacy = Number(currentPlace.privacy ?? 0);
    const top = String(userDossier.outfit.top || "none").toLowerCase();
    const bottom = String(userDossier.outfit.bottom || "none").toLowerCase();
    const isUnderdressed = top === "none" || bottom === "none";
    if (privacy <= 1 && norm.includes("formal") && isUnderdressed) {
      activeDirective +=
        "\n[Director Guidance: {{user}} is visibly under-dressed for this public formal environment. Present NPCs must react to this breach before proceeding.]";
    }
  }

  // Active investigation alerts
  const investigations = currentState.world?.investigations;
  if (investigations && typeof investigations === "object") {
    for (const [auth, track] of Object.entries(investigations)) {
      if (track && typeof track === "object" && track.alert_level >= 1) {
        const cluesText =
          Array.isArray(track.clues) && track.clues.length > 0
            ? track.clues.join(", ")
            : "none";
        activeDirective += `\n[Director Alert: Investigation by ${
          track.authority || auth
        } active at Alert Level ${track.alert_level} targeting ${
          track.target_id || "suspect"
        }. Clues: ${cluesText}. Authorities and informants be vigilant.]`;
      }
    }
  }

  // Guard against duplicate injections
  if (messages.some((m) => typeof m.content === "string" && (m.content.includes(activeDirective) || m.content.includes("[LumiVN Living World Director Guidance]")))) {
    return messages;
  }

  const systemGuard = `[LumiVN Living World Director Guidance]
${activeDirective}

[OUTPUT FORMAT REQUIREMENT]
1. Begin your reply on the very first line with the director JSON:
{"director_note":"<your directive here>","thread_label":"<short thread name>"}
2. Immediately continue with the preset output contract:
<details><summary>🧠 Scene Logic</summary>
...
</details>
(Prose text here)
<details><summary>📊 Ledger</summary>
...
</details>`;

  // Cache injected directive
  const generationId = (context as any)?.generationId;
  if (onInjectedDirective) {
    if (generationId) onInjectedDirective(`${chatId}:${generationId}`, activeDirective);
    onInjectedDirective(chatId, activeDirective);
  }

  // 3. Directorial Guidance Block
  const directorBlock: LlmMessageDTO = {
    role: "system",
    content: systemGuard,
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
  const npcChanges: DirectorLogEntry["npcChanges"] = [];
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

  // Investigations
  const prevInvs = prevLedger?.world?.investigations || {};
  const nextInvs = nextLedger?.world?.investigations || {};
  for (const [auth, track] of Object.entries(nextInvs)) {
    if (!track) continue;
    const prevTrack = prevInvs[auth];
    const name = track.authority || auth;
    if (!prevTrack) {
      worldChanges.push(
        `New Investigation: ${name} targeting ${track.target_id || "suspect"} (Alert Level ${track.alert_level})`
      );
    } else {
      if (track.alert_level !== prevTrack.alert_level) {
        worldChanges.push(
          `Investigation alert escalated: ${name} Alert Level ${prevTrack.alert_level} -> ${track.alert_level}`
        );
      }
      const prevClues = prevTrack.clues || [];
      const nextClues = track.clues || [];
      const newClues = nextClues.filter((c) => !prevClues.includes(c));
      if (newClues.length > 0) {
        worldChanges.push(
          `Investigation clues discovered by ${name}: ${newClues.join(", ")}`
        );
      }
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

    // Attire shifts (integrity, scent, residue)
    const prevOutfit = prevActor?.outfit;
    const nextOutfit = actor.outfit;
    const attireShifts: string[] = [];
    if (nextOutfit && prevOutfit) {
      if (
        nextOutfit.integrity !== undefined &&
        nextOutfit.integrity !== prevOutfit.integrity
      ) {
        attireShifts.push(
          `integrity ${prevOutfit.integrity ?? 100}% -> ${nextOutfit.integrity}%`
        );
      }
      if (
        nextOutfit.scent !== undefined &&
        nextOutfit.scent !== prevOutfit.scent
      ) {
        attireShifts.push(
          `scent "${prevOutfit.scent || "none"}" -> "${nextOutfit.scent}"`
        );
      }
      const prevResidue = JSON.stringify(prevOutfit.residue || []);
      const nextResidue = JSON.stringify(nextOutfit.residue || []);
      if (nextResidue !== prevResidue) {
        attireShifts.push(
          `residue [${(nextOutfit.residue || []).join(", ")}]`
        );
      }
    } else if (nextOutfit && !prevOutfit) {
      if (nextOutfit.scent) attireShifts.push(`scent "${nextOutfit.scent}"`);
      if (nextOutfit.residue && nextOutfit.residue.length > 0) {
        attireShifts.push(`residue [${nextOutfit.residue.join(", ")}]`);
      }
      if (nextOutfit.integrity !== undefined && nextOutfit.integrity < 100) {
        attireShifts.push(`integrity ${nextOutfit.integrity}%`);
      }
    }
    const attireChanged = attireShifts.length > 0 ? attireShifts.join("; ") : undefined;

    if (
      wantChanged ||
      goalsChanged ||
      Object.keys(passionsMoved).length > 0 ||
      Object.keys(relationsMoved).length > 0 ||
      attireChanged
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
        attireChanged,
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
