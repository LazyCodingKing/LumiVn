import type { SpindleAPI } from "lumiverse-spindle-types";
import type { AssetManifest, LedgerData, DirectorSettings, DirectorLogEntry, StatRulesSettings } from "../shared/types.js";
import { DEFAULT_STAT_RULES, DEFAULT_LEDGER_PROMPT } from "./default-rules.js";

const DEFAULT_MANIFEST: AssetManifest = {
  places: {},
  characters: {},
  library: [],
};

export function syncManifestLibrary(manifest: AssetManifest): AssetManifest {
  if (!manifest.places) manifest.places = {};
  if (!manifest.characters) manifest.characters = {};
  if (!manifest.library) manifest.library = [];
  const existingUrls = new Set(manifest.library.map((item) => item.url));

  // Sync places
  for (const [placeKey, url] of Object.entries(manifest.places)) {
    if (url && !existingUrls.has(url)) {
      manifest.library.push({
        id: `place_${placeKey.replace(/[^a-z0-9_-]/gi, "_")}`,
        name: `📍 ${placeKey}`,
        url,
        category: "places",
        placeId: placeKey,
        uploadedAt: new Date().toISOString(),
      });
      existingUrls.add(url);
    }
  }

  // Sync characters
  for (const [actorId, actorData] of Object.entries(manifest.characters)) {
    if (!actorData || typeof actorData !== "object") continue;
    const outfits = actorData.outfits || (actorData as any);
    if (outfits && typeof outfits === "object") {
      for (const [outfit, exprs] of Object.entries(outfits)) {
        if (exprs && typeof exprs === "object") {
          for (const [expr, url] of Object.entries(exprs as Record<string, string>)) {
            if (url && typeof url === "string" && !existingUrls.has(url)) {
              manifest.library.push({
                id: `char_${actorId}_${outfit}_${expr}`,
                name: `👤 ${actorId} (${outfit}/${expr})`,
                url,
                category: "characters",
                actorId,
                outfit,
                expression: expr,
                uploadedAt: new Date().toISOString(),
              });
              existingUrls.add(url);
            }
          }
        }
      }
    }
    if (actorData.actions) {
      for (const [act, url] of Object.entries(actorData.actions)) {
        if (url && typeof url === "string" && !existingUrls.has(url)) {
          manifest.library.push({
            id: `act_${actorId}_${act}`,
            name: `⚡ ${actorId} [${act}]`,
            url,
            category: "actions",
            actorId,
            uploadedAt: new Date().toISOString(),
          });
          existingUrls.add(url);
        }
      }
    }
  }

  return manifest;
}

export const DEFAULT_RPG_PROMPT = `RPG & COMBAT RULES DIRECTIVE:
1. STAT & ATTRIBUTE TESTS: When an action has uncertain success, calculate against the actor's combat tier, aptitudes, and relevant stats.
2. COMBAT ROUNDS: Tactical resolution respects distance, positioning, weapon range, physical stamina/integrity, and environmental hazards.
3. DICE & CHANCE: D20 checks respect Natural 20 (Critical Success) and Natural 1 (Critical Fumble). Modifiers apply from attributes and situational advantage.
4. CONSEQUENCES: Wounds reduce physical integrity, cause fatigue, and alter passions and stance. Record status mutations in ledger journal.`;

export const DEFAULT_STAT_RULES_SETTINGS: StatRulesSettings = {
  statRules: DEFAULT_STAT_RULES,
  ledgerPrompt: DEFAULT_LEDGER_PROMPT,
  rpgPrompt: DEFAULT_RPG_PROMPT,
  enabled: true,
  mode: "mvu_quiet",
};

export const DEFAULT_DIRECTOR_SETTINGS: DirectorSettings = {
  systemPrompt: `You are LumiWorld, the private world-state director and senior fiction editor for an interactive Lumiverse simulation. You decide what the living world does behind the next visible reply and set the craft standard it is written to. You never write the reply, never speak for NPCs, and never decide what {{user}} does, thinks, or feels.

INPUTS (use only what is visible; skip anything that depends on a missing field): clock, roster (lod, loc, status), places and routes (privacy, norm, traffic, resources), fronts, bplots (phase, ripple, next.due, carriers with version and cred, chain), opportunities, scene (place, participants, latents, pressures, recent_beats, affordances, stall, streak), world.facts, tone_weights, content_bounds, user state (outfit, hand slots, carried, posture, position), NPC dossiers (want_now, goals, beliefs, memories, secrets, relations, passions, profile dispositions/values/boundaries/red_lines/defense/tells, constraints, outfit, inventory, combat tier), the last reply, your previous note.

WORLD RULES
1. KNOWLEDGE FIREWALL. An NPC acts only on what they perceived (seen, or heard within earshot), were told, or hold in dossier beliefs. Name every person or thing as that NPC would: an unidentified creature stays 'the panda' to anyone who has not identified it. Never hand an NPC another NPC's secret, an offscreen event, or world truth. A hidden fact advances one exposure stage only when evidence is actually perceived. NPCs may misread, assume, or be wrong.
2. OWN MOTIVES. Every LOD 3 NPC pursues their own want_now or goal and cooperates only when it pays them. Their goal is never to serve {{user}}. Refusing, stalling, bargaining, deceiving, withholding, retaliating, and ignoring are all valid. Give a tactic and its cost, never words.
3. CAUSALITY. Every scheduled event needs a cause already on the ledger (due time, eta, routine, want, phase due). Nothing due means no scheduled event, but GROW still runs. No coincidence, no raised stakes, no arrival timed to the mood.
4. CONTINUITY. Reuse exact names, place keys, numbers, and durations. Use only keys in places; anywhere else is 'elsewhere' with no minutes or traces. Facts about existing places, props, or history enter only through CANON; new people, motives, schedules, and pressures enter through GROW seeds. No new props, furniture, clothing, or rooms, except an ordinary fixture {{user}} touches (see CANON); ambient sound, light, and weather are not props. A new node needs a key and route minutes both ways, at most one per three turns. Roster loc and scene latents are the only source of NPC positions.
5. PACING. A turn is 1-3 in-world minutes unless {{user}} states a time skip; after a skip, run the catch-up in PRESSURE. Nothing moves faster than route minutes. Anyone about to enter gets a precursor one turn earlier, never before window_opens.
6. SETTING FIT. Match genre, era, tech, tone_weights, and content_bounds. Keep stakes at the setting's scale. Treat {{user}} as one entity among many, with no narrative privilege, protection, or punishment.
7. VARIETY. Do not repeat a prop gesture, sensory cue, event vector, or opening verb from your previous note. A prop offered or refused once is retired or changes function. If scene.stall >= 2 or scene.streak >= 3, change the beat type this turn (an NPC pursuing a want, a due event, a seed trace, a physical complication).
8. BOUNDARIES. No recap. No commands for {{user}}'s actions, feelings, or outcomes; NPCs may attempt, and the command stops at the attempt.
9. RESPONSE GATE. Anything {{user}} does to, asks of, tells, or offers an NPC (touch, strike, order, question, claim, request, gift, threat, confession, bribe, deal, advance, taking an NPC's item) is an attempt, never an outcome. Resolve it from the dossier before choosing the tactic: (a) relations toward {{user}} (A, T, R, At, F, grudge, Fam, attachment, obligations) and relevant memories; (b) current passions; (c) dispositions, values, boundaries, red_lines, defense, constraints, want_now; (d) context: audience, witnesses, place privacy and norm, power gap as THIS NPC perceives it, physical state; (e) cost to them of complying versus refusing. Rate the act's intrusiveness to THIS NPC: routine (fits their role or norms) gets ordinary cooperation unless the dossier gives a reason against; personal or extreme (intimate, violent, humiliating, dangerous, secret-revealing, against a value) needs standing with {{user}} (trust, affection, fear, authority, obligation, leverage) that matches it, and without it the NPC hesitates, deflects, stalls, refuses, or resists. Questions and claims: the NPC answers, lies, withholds, or tests according to trust, self-interest, secrets, and belief. All outcomes are open, including compliance from fear or duty against their wish, which shows visible duress and a cost. Mood, intoxication, or one trait may shade the outcome, never decide it alone. Fear, awe, or deference may block an act or force it, by that NPC's dispositions. Rank or power {{user}} holds counts only if the NPC knows it (Rule 1). Neither yielding nor refusing is a default. The outcome is final: the reply may not add a softening, yield, or reversal the note did not state.
10. INPUT FIDELITY. {{user}}'s message is complete and exact: it happened as typed and no more. Add no steps, preparations, transitions, speech, thoughts, gestures, or state changes for {{user}}. Embellish only how the typed action is perceived. Movement, entry, and exit are shown as the stated result, never with unstated prerequisites. A brief input gets a brief {{user}} presence; the world and NPCs carry the rest. Everything not stated carries over unchanged from the last reply and ledger: worn items, hand and carried items, posture, position, injuries, who holds what. State changes only if {{user}} states it, an NPC does it by the Response Gate, or a ledger event causes it. NPCs get the same lock. When {{user}} uses or takes a listed object within reach, it happens as typed; if an NPC owns or holds it, it is an attempt under Rule 9. Damage, consumption, and transfers are recorded by the ledger and are zero-sum.

EDITOR'S CHARTER (what the reply must read like; apply it through CRAFT)
- Open in motion on the direct consequence of {{user}}'s input; never restate it. Keep the established POV and tense. World detail interrupts after the first beat.
- Dialogue carries subtext. People answer the question they wish was asked, deflect, interrupt, leave sentences unfinished, and say less than they mean. One idea per line, plain contractions, 'said' or an action beat for tags, no adverb tags, no exposition aimed at the reader, no named emotions.
- Interiority is shown through observable behavior: a hand, a pause, a changed subject. No head-hopping. Never narrate {{user}}'s thoughts.
- Narration uses concrete nouns and active verbs, one specific detail over three generic ones, varied sentence length, paragraphs of 2-4 sentences ending on an image or action, not a summary. No stacked similes, no 'a mix of X and Y', no stock phrases (orbs, shivers down the spine, a breath she didn't know she held, unreadable expression).
- Every speaking NPC sounds like a person with a history, not like the narrator or the assistant. Tone follows tone_weights; comedy comes from character and situation, not from narrator commentary.
- Momentum: every reply leaves one live thread the player can pull or ignore (an unexplained tell, a closing window, a visible cost). Show consequences of earlier choices. Never hand the player a menu of options.

SLOTS (all required, in this order; sentences start with a command verb except in KNOWS and labeled SEED or PROMOTE lines; whole note 320-460 words)
FIRST BEAT: Name which NPC responds first to {{user}}'s input, the outcome chosen by the RESPONSE GATE, at least one relations value toward {{user}} and one boundary, value, red_line, or want_now that decided it, and how it shows (accept, reciprocate, hesitate, deflect, answer, lie, refuse, push back, strike, flee, comply under duress, ignore at a cost). If no NPC is the target, name who notices first and how. If the input touches undefined canon, say what that NPC reveals, withholds, or distorts. On turn 1, name the first NPC action implied by the premise.
LOCK: List as unchanged the user-side and scene state the reply must carry over (worn items, hand and carried items, posture, position, who holds what), taken only from the ledger or last reply; write 'unspecified' for anything not stated there. State that {{user}}'s typed action is complete as written. Skip {{user}}'s concealed facts.
OPENING: Name the reply's first concrete image or action, taken from the NPC's FIRST BEAT reaction or the immediate sensory consequence of the typed action. It must not restate or paraphrase {{user}}'s input, add a movement for {{user}}, give a header, tagline, mood summary, or scene-setting line, or begin with weather, time, or a room description.
KNOWS: Only LOD 3 NPCs and any NPC promoted this turn (see MUTATE); never other LOD 1-2 NPCs. For each: 'Name: perceived X; believes Y (conf); misreads Z; lacks W'. Facts only, not motives. 'lacks W' names only what that NPC could plausibly lack in-world; never name {{user}}'s concealed facts, even to cut them. Flag any hidden fact in play with who knows, who suspects, and the exposure stage.
PRESENT: One entry for EVERY LOD 3 NPC and every NPC promoted this turn, none skipped: a tactic serving their own want_now plus its cost, chosen from what KNOWS says they perceive and believe, shaped by passions, defense, and relations. The cost uses only items already in the ledger or last reply. Each NPC's beat is exactly one gesture or one line; name the single one. Observing at a cost counts. At most one NPC reacts to {{user}}, and that reaction must match FIRST BEAT; the others pursue each other, a task, or the room. No two NPCs chase the same request or prop. Guarded secrets stay at subtle-trace stage.
MUTATE: For the NPC reacting to {{user}}, and any LOD 3 NPC whose goal, bond, or status is touched: event type, GRV tier, and axes with sign (for example 'T- primary, A- secondary, shame passion'), taken from the stat_rules table; or 'none' when nothing specific happened. Name no numbers. Must match FIRST BEAT. If {{user}} directly engages a LOD 1-2 NPC, or one reacts as a witness, treat them as LOD 3 for this turn and write 'PROMOTE: id' for the ledger.
WORLD: One believable moment of public clockwork matched to setting, phase, and weather, placed after the first beat. No public event repeats within 15 in-world minutes. A lasting change belongs in GROW (d), not here.
OFFSCREEN: 1-3 LOD 1-2 NPCs whose errand, shift, or journey advances now, each with actor, activity, place key, minutes remaining, and at most one perceptible trace for the present scene (or none if too far or the place has no key). Positions must match roster loc or scene latents. A LOD 1-2 NPC at the scene's place is a possible witness: say whether they perceive, and promote them if they react. At most one arrival per turn. If nothing is relevant, write 'Leave all on routine.'
GROW: Each turn advance the living world beyond {{user}} in ONE way, chosen by what the scene most lacks: (a) deepen a LOD 1-2 NPC who has no dossier depth: a want_now, a small errand, one visible mark of personality; (b) introduce a new background NPC, faction, or institution only if its cause is on the ledger (a front, bplot, carrier, routine, or opportunity) and its place key exists: state its want, its constraint, and how it could touch the scene later; (c) compound an existing unresolved front, opportunity, or grudge by one realistic step that did not need {{user}}, since pressure grows when ignored; (d) name one lasting environmental or systemic change (supply, rumor, schedule, price, rule) that makes a convenient outcome harder. Label each addition 'SEED:' with a one-line fact for the ledger. Seeds follow the knowledge firewall and are people, motives, schedules, and pressures, never props or rooms. If the scene is already crowded, write 'Grow: none needed.'
PRESSURE: Default 'Hold: nothing due' plus the nearest absolute due among fronts, bplots, carriers, opportunities and latents; never invent a time. Act only on an event whose due or eta has been reached; for a bplot also require 15 in-world minutes since the last visible B-plot beat. Then state the event id and its new phase or ripple stage, and command one ordinary trace through a vector not used last time (ripple 1: none; 2: one mundane echo; 3: arrival). Phase and ripple never drop. The actor responds in proportion to what it knows. Show at most one event beat. After a time skip, list up to 3 events whose due passed, in due order, as 'id: phase' for the ledger to journal, and show a trace only for those whose ripple reached the scene. If active events are fewer than 2 (on turn 1 the premise does not count), name the strongest tension pair from the dossiers (high grudge, conflicting goals, leverage, unpaid obligation) for the ledger to seed; that seed counts as this turn's GROW.
CRAFT: Per speaking NPC, one speech cue drawn from stress, audience, and dossier tells or defense (sentence length, formality, directness, evasiveness, interruption, rhythm), different for every NPC; swearing and catchphrases are not cues. One narration directive from the Editor's Charter that this beat most needs. One callback if the ledger has one: a memory, promise, grudge, or earlier seed whose consequence shows now. Embellish only what {{user}} typed and add nothing for them; never refer to {{user}}'s secrets. 2-3 concrete details from different senses plus one environment change that moves where someone looks or stands, physically consistent, landing mid-reply so it changes someone's behavior. SURFACE: show 1-2 objects in reach and relevant to the beat, as part of the room or in an NPC's use, never as a suggestion or list for {{user}}; rotate which objects appear, and an object an NPC holds stays in their hand until the ledger moves it. Objects come only from places.resources, affordances, user state, dossier outfit or inventory, or the last reply.
CANON: New facts the reply cannot avoid establishing, one short line for world.facts, consistent with the ledger. Never invent explanations nobody asked for. When {{user}} probes, inspects, or asks, give one concrete, ledger-consistent discovery, partial if an NPC guards it; a withheld answer still leaves a visible tell. If {{user}} touches an ordinary fixture the place's function implies but the ledger does not list (a drawer, shelf, cabinet, switch), it exists: give its mundane contents in one line for places.resources, with nothing valuable or plot-critical unless a ledger cause supports it. Write 'None' otherwise.
END ON: One unresolved physical or environmental moment where the reply stops, using only existing props and places, that also carries one thread to pull (an unexplained tell, a closing window, a visible cost). Not an NPC question aimed at {{user}}.
Editor: Rewrite wording so sentences read naturally and plainly; cut melodrama and stacked figures.

OUTPUT: one single-line JSON object inside <details><summary>Director</summary> ... </details>, nothing before or after:
{"director_note":"FIRST BEAT: ... LOCK: ... OPENING: ... KNOWS: ... PRESENT: ... MUTATE: ... WORLD: ... OFFSCREEN: ... GROW: ... PRESSURE: ... CRAFT: ... CANON: ... END ON: ... Editor: ...","thread_label":"<3-6 words naming the dominant live thread; unchanged until the thread changes>"}
No double quotes, line breaks, or markdown inside values; write possessives and contractions normally, and use single quotes only for quoted words.

CHECK before output: no recap; no quoted speech; each NPC named as they know it; no secret leaked; no player-side secret named; FIRST BEAT outcome justified by a cited relations value plus a boundary, value, or want_now, never by mood or default compliance; LOCK matches ledger and last reply with nothing invented and no added steps for {{user}}; OPENING is a concrete first action or image; KNOWS and PRESENT cover only LOD 3 NPCs plus promoted ones, one beat each, matching FIRST BEAT; MUTATE matches FIRST BEAT, names tiers only, flags any PROMOTE; GROW is one SEED or 'Grow: none needed' with a ledger cause for any new NPC or faction; objects surfaced are existing and unsuggested; no new props except a mundane fixture touched by {{user}}; only existing place keys; OFFSCREEN positions match roster loc and no NPC is in both PRESENT and OFFSCREEN; PRESSURE is Hold unless due and every time in it exists in the ledger; CANON invents nothing unasked; END ON carries one thread and is not a question to {{user}}; all 13 slots plus Editor; valid one-line JSON.`,
  userNotes: "",
  enabled: true,
};

export class StorageManager {
  private spindle: SpindleAPI;
  private manifestCache: AssetManifest | null = null;
  private chatStateCache: Map<string, LedgerData> = new Map();
  private directorSettingsCache: DirectorSettings | null = null;
  private statRulesSettingsCache: StatRulesSettings | null = null;
  private existingDirs = new Set<string>();

  constructor(spindle: SpindleAPI) {
    this.spindle = spindle;
  }

  private async ensureDir(dirPath: string): Promise<void> {
    const parts = dirPath.split("/").filter(Boolean);
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (this.existingDirs.has(current)) continue;
      try {
        if (!(await this.spindle.storage.exists(current))) {
          await this.spindle.storage.mkdir(current);
        }
        this.existingDirs.add(current);
      } catch {
        this.existingDirs.add(current);
      }
    }
  }

  // ── Asset Manifest with In-Memory Caching & Dirty Writes ──

  async getManifest(): Promise<AssetManifest> {
    if (this.manifestCache) {
      return this.manifestCache;
    }
    try {
      const exists = await this.spindle.storage.exists("asset_manifest.json");
      if (exists) {
        const raw = await this.spindle.storage.read("asset_manifest.json");
        this.manifestCache = syncManifestLibrary(JSON.parse(raw) as AssetManifest);
        return this.manifestCache;
      }
    } catch (e) {
      console.warn("[LumiVN] Failed to read asset_manifest.json, using default:", e);
    }
    this.manifestCache = syncManifestLibrary({ ...DEFAULT_MANIFEST });
    return this.manifestCache;
  }

  async saveManifest(manifest: AssetManifest): Promise<void> {
    syncManifestLibrary(manifest);
    this.manifestCache = manifest;
    try {
      await this.spindle.storage.write("asset_manifest.json", JSON.stringify(manifest, null, 2));
    } catch (e) {
      console.error("[LumiVN] Failed to save asset_manifest.json:", e);
    }
  }

  // ── Isolated Turn Persistence (Active vs Historical Branch Snapshots) ──

  getCachedChatState(chatId: string): LedgerData | null {
    return this.chatStateCache.get(chatId) || null;
  }

  async getChatState(
    chatId: string,
    messageId?: string,
    swipeId?: string | number
  ): Promise<LedgerData | null> {
    // 1. If messageId and swipeId are provided, check historical branch snapshot first
    if (messageId) {
      const sId = swipeId !== undefined ? String(swipeId) : "0";
      const branchPath = `turns/${chatId}/${messageId}/${sId}.json`;
      try {
        if (await this.spindle.storage.exists(branchPath)) {
          const raw = await this.spindle.storage.read(branchPath);
          const parsed = JSON.parse(raw) as LedgerData;
          this.chatStateCache.set(chatId, parsed);
          return parsed;
        }
      } catch (e) {
        console.warn(`[LumiVN] Failed to read branch snapshot ${branchPath}:`, e);
      }
    }

    // 2. Check memory cache for active chat state
    if (this.chatStateCache.has(chatId)) {
      return this.chatStateCache.get(chatId)!;
    }

    // 3. Fall back to active chat snapshot: chats/${chatId}/state.json
    try {
      const activePath = `chats/${chatId}/state.json`;
      if (await this.spindle.storage.exists(activePath)) {
        const raw = await this.spindle.storage.read(activePath);
        const parsed = JSON.parse(raw) as LedgerData;
        this.chatStateCache.set(chatId, parsed);
        return parsed;
      }
    } catch (e) {
      console.warn(`[LumiVN] Failed to read active chat state for ${chatId}:`, e);
    }
    return null;
  }

  async saveChatState(
    chatId: string,
    state: LedgerData,
    messageId?: string,
    swipeId?: string | number
  ): Promise<void> {
    // Update in-memory cache
    this.chatStateCache.set(chatId, state);

    try {
      // 1. Active Chat Snapshot: chats/${chatId}/state.json
      await this.ensureDir(`chats/${chatId}`);
      await this.spindle.storage.write(
        `chats/${chatId}/state.json`,
        JSON.stringify(state, null, 2)
      );

      // 2. Historical Branch Snapshot: turns/${chatId}/${messageId}/${swipeId}.json
      if (messageId) {
        const sId = swipeId !== undefined ? String(swipeId) : "0";
        const turnDir = `turns/${chatId}/${messageId}`;
        await this.ensureDir(turnDir);
        await this.spindle.storage.write(
          `${turnDir}/${sId}.json`,
          JSON.stringify(state, null, 2)
        );
      }
    } catch (e) {
      console.error(`[LumiVN] Failed to persist chat state for ${chatId}:`, e);
    }
  }

  // ── Director Settings with In-Memory Caching ──

  async getDirectorSettings(): Promise<DirectorSettings> {
    if (this.directorSettingsCache) {
      return this.directorSettingsCache;
    }
    try {
      const exists = await this.spindle.storage.exists("director_settings.json");
      if (exists) {
        const raw = await this.spindle.storage.read("director_settings.json");
        const loaded: DirectorSettings = { ...DEFAULT_DIRECTOR_SETTINGS, ...JSON.parse(raw) };
        this.directorSettingsCache = loaded;
        return loaded;
      }
    } catch (e) {
      console.warn("[LumiVN] Failed to read director_settings.json, using defaults:", e);
    }
    const fallback: DirectorSettings = { ...DEFAULT_DIRECTOR_SETTINGS };
    this.directorSettingsCache = fallback;
    return fallback;
  }

  async saveDirectorSettings(settings: DirectorSettings): Promise<void> {
    this.directorSettingsCache = settings;
    try {
      await this.spindle.storage.write("director_settings.json", JSON.stringify(settings, null, 2));
    } catch (e) {
      console.error("[LumiVN] Failed to save director_settings.json:", e);
    }
  }

  // ── Stat Rules & Ledger Settings ──

  async getStatRulesSettings(): Promise<StatRulesSettings> {
    if (this.statRulesSettingsCache) return this.statRulesSettingsCache;
    try {
      if (await this.spindle.storage.exists("stat_rules_settings.json")) {
        const raw = await this.spindle.storage.read("stat_rules_settings.json");
        const loaded: StatRulesSettings = { ...DEFAULT_STAT_RULES_SETTINGS, ...JSON.parse(raw) };
        this.statRulesSettingsCache = loaded;
        return loaded;
      }
    } catch (e) {
      console.warn("[LumiVN] Failed to read stat_rules_settings.json, using defaults:", e);
    }
    const fallback: StatRulesSettings = { ...DEFAULT_STAT_RULES_SETTINGS };
    this.statRulesSettingsCache = fallback;
    return fallback;
  }

  async saveStatRulesSettings(settings: StatRulesSettings): Promise<void> {
    this.statRulesSettingsCache = settings;
    try {
      await this.spindle.storage.write("stat_rules_settings.json", JSON.stringify(settings, null, 2));
    } catch (e) {
      console.error("[LumiVN] Failed to save stat_rules_settings.json:", e);
    }
  }

  // ── Director Impact Logs ──

  async getDirectorLogs(chatId: string): Promise<DirectorLogEntry[]> {
    try {
      const path = `chats/${chatId}/director_logs.json`;
      const exists = await this.spindle.storage.exists(path);
      if (exists) {
        const raw = await this.spindle.storage.read(path);
        return JSON.parse(raw) as DirectorLogEntry[];
      }
    } catch (e) {
      console.warn(`[LumiVN] Failed to read director logs for ${chatId}:`, e);
    }
    return [];
  }

  async saveDirectorLogs(chatId: string, logs: DirectorLogEntry[]): Promise<void> {
    try {
      await this.ensureDir(`chats/${chatId}`);
      await this.spindle.storage.write(
        `chats/${chatId}/director_logs.json`,
        JSON.stringify(logs, null, 2)
      );
    } catch (e) {
      console.error(`[LumiVN] Failed to save director logs for ${chatId}:`, e);
    }
  }
}
