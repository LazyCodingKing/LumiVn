import type { LlmMessageDTO, InterceptorResultDTO } from "lumiverse-spindle-types";
import type { LedgerData, BPlot, DirectorSettings, DirectorLogEntry } from "../shared/types.js";
import { DEFAULT_DIRECTOR_SETTINGS } from "./storage.js";
import { encodeToonState } from "./toon-parser.js";

export const DIRECTOR_DIRECTIVES = DEFAULT_DIRECTOR_SETTINGS.systemPrompt;

export function extractChatId(context: unknown): string | null {
  if (!context || typeof context !== "object") return null;
  const ctx = context as Record<string, unknown>;
  if (typeof ctx.chatId === "string" && ctx.chatId.trim()) return ctx.chatId.trim();
  if (typeof ctx.chat_id === "string" && ctx.chat_id.trim()) return ctx.chat_id.trim();
  const chatObj = ctx.chat as Record<string, unknown> | undefined;
  if (typeof chatObj?.id === "string" && chatObj.id.trim()) return chatObj.id.trim();
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

export function formatLivingWorldContext(currentState: LedgerData): string {
  const clock = currentState.clock || {};
  const date = clock.date || "Day 1";
  const time = clock.t || "12:00";
  const place = currentState.scene?.place || "Current Location";

  const presentActors: string[] = [];
  const participants = Array.isArray(currentState.scene?.participants) ? currentState.scene.participants : [];
  const actors = currentState.actors || {};

  for (const [id, a] of Object.entries(actors)) {
    if (id.toLowerCase() === "user") continue;
    if (participants.includes(id) || !participants.length) {
      const name = a.name || id;
      const topPassion = a.passions
        ? Object.entries(a.passions).sort((x, y) => (y[1] ?? 0) - (x[1] ?? 0))[0]
        : undefined;
      const moodStr = topPassion && (topPassion[1] ?? 0) > 15 ? `${topPassion[0]} (${topPassion[1]})` : "composed";
      const attire = a.outfit?.top ? `${a.outfit.top}` : (a.outfit?.state || "casual");
      const want = a.agency?.want_now ? `wants: ${a.agency.want_now}` : "";
      const secret = Array.isArray((a.knowledge as any)?.secrets) && (a.knowledge as any).secrets[0]?.truth
        ? `secret: ${(a.knowledge as any).secrets[0].truth}`
        : "";
      const relToUser = (a.relations as any)?.["user"]?.affinity !== undefined
        ? `affinity: ${(a.relations as any)["user"].affinity}`
        : "";
      const details = [want, secret, relToUser].filter(Boolean).join(", ");
      presentActors.push(`${name} (attire: ${attire}, mood: ${moodStr}${details ? ` | ${details}` : ""})`);
    }
  }

  const user = actors["user"] || {};
  const userAttire = user.outfit?.top ? `${user.outfit.top} / ${user.outfit.bottom || ""}` : (user.outfit?.state || "casual");
  const inHand = user.inventory?.in_hand?.R || user.inventory?.in_hand?.L ? `held: ${[user.inventory?.in_hand?.R, user.inventory?.in_hand?.L].filter(Boolean).join(", ")}` : "";

  // Active B-Plots
  const activeBplots = (currentState.bplots || []).filter((b) => b.status !== "resolved").slice(0, 1);
  const bplotStr = activeBplots.length
    ? `Offscreen: ${activeBplots[0].who || "Distant parties"} (${activeBplots[0].doing || "active"}) [ripple ${activeBplots[0].ripple ?? 1}]`
    : "";

  return [
    `[LumiVN Living World Context]`,
    `⏰ Clock: ${date}, ${time} | Location: ${place}`,
    presentActors.length ? `👥 Present: ${presentActors.slice(0, 3).join("; ")}` : "",
    `👔 Player: ${userAttire}${inHand ? ` | ${inHand}` : ""}`,
    bplotStr ? `🎭 ${bplotStr}` : "",
  ].filter(Boolean).join("\n");
}

export const STATE_DETAILS_CONTRACT = `[STATE DETAILS CONTRACT & DELTA RULES]
- TURN 1: Emit baseline dossier (appearance, money, combat, life_model, outfit, inventory, profile, relations).
- ONGOING TURNS (COMPACT DELTA — ZERO STATIC LEAK):
  * Omit ## World and ## Places unless location or rules shifted.
  * The extension permanently stores and merges state. NEVER re-emit unchanged fields.
  * \`user\` is strictly a delta after Turn 1. Omit unchanged user appearance, combat, life_model.
  * Sub-dictionary deltas:
    - Passions: Emit ONLY moved keys (e.g. passions: { anger: 20 }), never the full list.
    - Combat: Omit entirely unless HP/MP moved (e.g. combat: { hp: "80/100" }).
    - Outfit: Emit ONLY the slot that changed (e.g. outfit: { top: "none" }). Never re-emit unchanged bottom/shoes/underwear.
    - Inventory: Emit only the specific hand slot or carried prop that moved.
  * Journal: Along with everything Emit ONLY the new event(s) generated in THIS reply (\`EVT-n\`). Never re-print past records.
  * Inactive actors: If an actor had no state or gear shifts this turn, OMIT their dossier entirely.
- CONTAINERS & ZERO-SUM TRANSFERS:
  * Props exist in exactly one place (hand slot, container, or local places.resources). Transfers are zero-sum.
- MANDATORY COMPOUND PLACE KEYS: Places MUST use the format <unique_scope_name>:<room> (e.g. tendo_residence:kitchen, tendo_residence:foyer, nerima_high:classroom_2a) so backgrounds map accurately without room name collisions.
- ALWAYS EMIT: clock, scene, roster, journal, open opportunities, bplots (id plus changed fields only; ripple, status and any due or carrier change count as changed).

Always Append this below prose:
<details><summary>State</summary>

## World
\`\`\`yaml
world:
  genre:
  facts: []
  calendar:
  currency: "$"
  time_scale:
  tone_weights:
  content_bounds:
  special_rules: []
  needs: []
  capabilities: []
  investigations: {} # authority: { alert_level: 0-3, clues: [], target_id: "" }
clock:
  date: "DD-MM-YY"
  t: "D# HH:MM"
  phase: "Morning" # Dawn | Morning | Afternoon | Dusk | Night | Late Night
  location: "Building or Venue"
  region: "District or City"
  country: "Country or Realm"
  step: N
init: complete or pending
\`\`\`

## Places
\`\`\`yaml
places:
  scope:place_id: (Use unique name before common locations)
    function:
    traffic: 0-3
    privacy: 0-3
    visibility: 0-3
    access:
    norm:
    rhythm:
    resources: []
    population:
    hazards:
    barriers:
    affordances: []
    routes: [to: "scope:place_id", minutes: N]
travel:
  - {actor: , purpose: , from: , to: , depart: , eta: , status: }
\`\`\`

## Roster
NPCs ONLY. {{user}} is NEVER in roster (player id is \`user\`).
\`\`\`yaml
roster:(Use only the roster npc name for display in extension)
  - {id: , name: , lod: 0-3, status: , loc: , record: full, tick: }
\`\`\`

## Actor dossiers
COMBAT TABLE (Lv0..10; copy directly):
T1 HP 100-300 | MP 50-150 | PWR=AGI 15-45 (+20 HP, +10 MP, +3 stats/lv)
T2 HP 400-1000 | MP 200-500 | PWR=AGI 50-150 (+60 HP, +30 MP, +10 stats/lv)
T3 HP 1500-4500 | MP 800-2300 | PWR 200-650 | AGI 200-700 (+300 HP, +150 MP, +45 PWR, +50 AGI/lv)
T4 HP 6000-18000 | MP 3000-9000 | PWR 800-2300 | AGI 800-2600 (+1200 HP, +600 MP, +150 PWR, +180 AGI/lv)
T5 HP 25000-75000 | MP 15000-45000 | PWR 3000-9000 | AGI 3500-10500 (+5000 HP, +3000 MP, +600 PWR, +700 AGI/lv)
Rules: hp="cur/max"; mp="cur/max"; underwear: underwear_top, underwear_bottom (or \`none\`).

\`\`\`yaml
* \`user\`: Feeds Companion 'You' tab. Delta after Turn 1. 
Loadout: L:[Current|Empty] R:[Current|Empty] │ Pkt:[$Cash] │ Bnk:[$Bank] │ Carried:[Bags/Props]
Attire: Top:[Shirt] Bot:[Pants] UW:[Top]/[Bottom] Shoes:[Footwear] Cond:[Clean/Disheveled]
Body:[Build, traits, age, noticeable features]
Agency: ONLY \`want_now\`.
* NPCs: Full schema on Turn 1 debut; compact deltas ongoing.
\`\`\`

\`\`\`yaml
actor_id:
  appearance: {age: , traits: , appeal: 0-100, style: , condition: }
  money: {in_hand: 0, in_bank: 0, currency: "$"}
  combat: {tier: 1-10, lv: 0-10, exp: "0/100", hp: "cur/max", mp: "cur/max", eff_pwr: , eff_agi: , pwr: , agi: , int: , talent: []}
  life_model: {orientation: , romantic_history: , upbringing: , family: [], occupation: , residence: , routines: [cue, act, place, time], worldview: , self_concept: }
  wounds: {physical: [], psychological: []}
  trauma: []
  passions: {anger: 0-100, shame: 0-100, arousal: 0-100, fear: 0-100, stress: 0-100, pain: 0-100, exhaustion: 0-100, suspicion: 0-100, disgust: 0-100, sadness: 0-100, guilt: 0-100, joy: 0-100}
  constraints: ""
  outfit: {top: , bottom: , underwear_top: , underwear_bottom: , shoes: , accessories: [], state: }
  inventory: {in_hand: {L: "Empty", R: "Empty"}, carried: [], room: [], room_location: ""}
  profile:
    public_roles: []
    dispositions: {risk: , assertiveness: , empathy: , impulse_control: , curiosity: , sociability: , status_sensitivity: , acquisitiveness: , persistence: }
    capabilities: {}
    values: []
    self_concept: []
    boundaries: []
    red_lines: []
    defense: ""
    blind_spot: ""
    tells: {lying: "", hurt: "", shame: ""}
    stress_default:
  state: {condition: , needs: {name: urgency}, affect: {valence: , arousal: , control: , episodes: []}, resources: {}}
  agency:
    goals: [id, intent, priority, commitment, deadline, cause, progress, status]
    plans: [goal, steps, now, preconditions, revisions]
    policies: [id, when, effects, strength, origin]
    commitments: []
    want_now: want (source, cost)
  relations:
    other_id: {affinity: 0, trust: 0, respect: 0, attraction: 0, grudge: 0, fear: 0, familiarity: 0, attachment: 0, loyalty: 0-100, sacrifice_willingness: 0-100, betrayal_threshold: 50, shared_secrets: [], leverage: [], grievances: [], obligations: []}
  knowledge:
    beliefs: [p, conf, source, basis, t]
    memories: [evt, interpretation, salience, imprint, with]
    expectations: [situation, expect, conf]
    secrets: [truth, knows, suspects, exposure, cover]
    held_leverage: []
    presents_as: {audience: face}
  stats: {T, A, R, F, Fam, G, Integ, Stress, CAU, GRD, PRD, EMP, STB, BLD, RX, RC, Rig, Mask, MIS, WV, COMP}
\`\`\`

## Scene
\`\`\`yaml
scene:
  player_intent:
  place: "scope:place_id"
  time:
  participants: []
  threads: []
  pressures: []
  recent_changes: []
  recent_beats: []
  constraints:
  affordances: []
  stall: N
  streak: N
  transients: [id, purpose, loc, want, exit_cause]
  latents: [id, who, errand, route, window_opens, status]
\`\`\`

## Fronts
\`\`\`yaml
fronts:
  - {id: , cause: , stage: , due: , pressure: 0-5, known_by: []}
\`\`\`

## Journal
\`\`\`yaml
journal:
  - id: EVT-n
    time:
    place: "scope:place_id"
    cause: []
    actors: []
    action:
    outcome: full or partial or fail
    sensory: only if it changes who perceives
    witnesses: [actor: confidence]
    effects: [target: change]
    opp: [opportunity ids touched]
    mutations: ["Actor.STAT@Target old->new | cause | D/R/I | GRV#", "user.money.in_hand -20 | vendor.money.in_hand +20"]
    dice: ev, lane, flavor, intensity, cand, origin, d20
    repetition_group:
    cooldown_until:
    novel: false
\`\`\`

## B-Plots
Offscreen third parties on their own clock. Debut with all fields; afterwards emit only \`id\` plus changed fields.
\`\`\`yaml
bplots:
  - id: "bp_id"
    who: "Distant person, group, or institution outside the local cast"
    want: "What they are after, in their own terms"
    doing: "What they are doing now on their own routine, miles away"
    knows: ["what they currently believe about the local cast; may be partial or wrong"]
    next: {move: "what they do next if nothing interferes", due: "D# HH:MM"}
    scope: "personal" # personal | household | neighborhood | city
    hooks: ["npc_id, front id, secret, or opportunity this touches"]
    carriers: [{what: "person, message, image, purchase, or record carrying local news outward", from: "npc_id or source", eta: "D# HH:MM"}]
    vector: "ordinary way the ripple reaches the scene (call, bill, delivery, visit, remark, notice); must match ripple stage"
    ripple: 1 # Stage 1 (isolated) | Stage 2 (ambient echo) | Stage 3 (collision); never lowered
    status: "active" # active | dormant | resolved
\`\`\`

## Opportunities
\`\`\`yaml
opportunities:
  - id: "opp_id"
    what: "Description of contestable opening"
    wanted_by: ["npc_id"]
    noticed_by: ["npc_id"]
    readings: {npc_id: ["verb", 80, "basis"]}
    cost: {npc_id: "cost description"}
    payoff: "payoff description"
    claimed_by: []
    status: lead
    due: "expiry condition"
\`\`\`
</details>`;

export const LEDGER_CONTRACT = STATE_DETAILS_CONTRACT;

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
Line 1: Return the director JSON object (optionally inside <details><summary>🎬 Director</summary>...</details>):
{"director_note":"FIRST BEAT: ... WORLD: ... OFFSCREEN: ... PRESSURE: ... PRESENT: ... VOICE: ... TEXTURE: ... CANON: ... END ON: ...","thread_label":"<3-6 words thread title>"}

Follow immediately on Line 2 with natural narrative prose.
Below the prose, append the State details block:
${STATE_DETAILS_CONTRACT}`;

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
  const prevInvs = (prevLedger?.world?.investigations as Record<string, any>) || {};
  const nextInvs = (nextLedger?.world?.investigations as Record<string, any>) || {};
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
      const prevClues = (prevTrack.clues as string[]) || [];
      const nextClues = (track.clues as string[]) || [];
      const newClues = nextClues.filter((c: string) => !prevClues.includes(c));
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
