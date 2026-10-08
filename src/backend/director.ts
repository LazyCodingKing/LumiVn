import type { LlmMessageDTO, InterceptorResultDTO } from "lumiverse-spindle-types";
import type { LedgerData, BPlot } from "../shared/types.js";

export const DIRECTOR_DIRECTIVES = [
  "[LumiVN Living World Director]",
  "- PLAYER AGENCY GUARD: Never write dialogue, physical reactions, or internal choices for the player character.",
  "- NPC AUTONOMY: Present NPCs must act on their own active want_now before accommodating {{user}}.",
  "- PERSISTENT SECRETS: NPCs must conceal guarded secrets until direct witnessed evidence forces exposure.",
  "- UNRESOLVED TENSION: Keep current scene friction active; do not rush to polite consensus.",
].join("\n");

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

export async function evaluateDirectorInterceptor(
  messages: LlmMessageDTO[],
  context: unknown,
  getChatState: (chatId: string) => Promise<LedgerData | null>
): Promise<LlmMessageDTO[] | InterceptorResultDTO> {
  const chatId = extractChatId(context);
  const genType = extractGenerationType(context);
  const isDry = Boolean((context as any)?.dryRun || (context as any)?.isDryRun);

  // 1. Guard against quiet/background generations & dry runs
  if (!chatId || isDry || genType === "quiet") return messages;

  // 2. Read latest chat state and roster
  const currentState = await getChatState(chatId);
  if (!currentState) return messages;

  // Guard against duplicate injections
  if (messages.some((m) => typeof m.content === "string" && m.content.includes("[LumiVN Living World Director]"))) {
    return messages;
  }

  // 3. Directorial Guidance Block
  const directorBlock: LlmMessageDTO = {
    role: "system",
    content: DIRECTOR_DIRECTIVES,
  };

  return {
    messages: [directorBlock, ...messages],
    breakdown: [{ messageIndex: 0, name: "LumiVN Director" }],
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
