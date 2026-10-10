import type { SpindleAPI } from "lumiverse-spindle-types";
import type { LedgerData, StatRulesSettings } from "../shared/types.js";
import { parseLedgerYaml } from "./ledger-parser.js";

export async function evaluateMvuLedgerDelta(
  spindle: SpindleAPI,
  chatId: string,
  latestProse: string,
  currentLedger: LedgerData,
  settings: StatRulesSettings
): Promise<Partial<LedgerData> | null> {
  if (!settings.enabled || settings.mode !== "mvu_quiet") return null;

  const currentSummary = JSON.stringify({
    clock: currentLedger.clock,
    scene: currentLedger.scene,
    actors: currentLedger.actors,
  });

  const systemPrompt = `You are the authoritative living world state evaluator and ledger updater.
Read the narrative prose and apply the following <stat_rules> and <ledger> schema.
Calculate exact state deltas, edge mutations, and inventory movements caused by the latest prose.

${settings.statRules}

${settings.ledgerPrompt}

[CRITICAL INSTRUCTION]
Output ONLY the YAML ledger inside:
<details><summary>📊 Ledger</summary>
...
</details>
Follow compact delta rules strictly.`;

  const userPrompt = `Current World State Baseline:
${currentSummary}

Latest Narrative Turn Prose:
${latestProse}

Emit the resulting ledger compact delta now.`;

  try {
    const res = await spindle.generate.quiet({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const output = typeof res === "string" ? res : (res as any)?.content || "";
    if (!output) return null;

    const rawMatch = output.match(/<details\b[^>]*>([\s\S]*?)<\/details>/i) || [null, output];
    const yamlChunk = rawMatch[1] || output;
    return parseLedgerYaml(yamlChunk);
  } catch (err) {
    spindle.log.error(`[LumiVN MVU] Background quiet calculation failed: ${err}`);
    return null;
  }
}
