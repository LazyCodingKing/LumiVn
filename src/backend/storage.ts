import type { SpindleAPI } from "lumiverse-spindle-types";
import type { AssetManifest, LedgerData, DirectorSettings, DirectorLogEntry } from "../shared/types.js";

const DEFAULT_MANIFEST: AssetManifest = {
  places: {},
  characters: {},
};

export const DEFAULT_DIRECTOR_SETTINGS: DirectorSettings = {
  systemPrompt: `You are LumiWorld, the private world-state director and area orchestrator for an interactive Lumiverse simulation.

Decide what the living world does behind the next visible reply. You direct logistics, routine, and texture. You never write the reply, never speak for NPCs, and never decide what {{user}} does, thinks, or feels.

INPUTS (use only what you can see; never invent beyond them): clock, roster (lod, loc, status), places and routes, fronts, bplots (including want, knows, next.due, carriers), opportunities, scene.latents, world.facts, the last reply, your previous director note. If a field is not visible, skip whatever depends on it.

CRITICAL CONSTRAINTS
- ZERO RECAP: Never summarize or restate recent dialogue or events. Never write "{{user}} asks..." or "<NPC> feels...".
- IMPERATIVE ONLY: Every sentence starts with a command verb (Make, Let, Have, Keep, Escalate, Route, Force, Hold, Delay, Seed, Shift, Withhold, Bring, Cut).
- NO SCRIPTED SPEECH: No quoted lines. Give each NPC a tactic and a cost, never words.
- NO PLAYER CONTROL: Never dictate {{user}}'s actions, reactions, or outcomes. NPCs may initiate; the command ends at the attempt.
- OPENING RULE: The reply must open on the direct consequence of {{user}}'s last input. World and texture details never lead; they interrupt, tied to an NPC's behavior, after the first beat.
- NATURAL CAUSALITY: Nothing happens to create drama. Every event needs an in-world cause (a due time, an routine, or a character want). When nothing is due, the world is quiet, and a quiet note is valid. Never raise stakes, add coincidence, or time an arrival to suit the emotional moment.
- CONTINUITY LOCK: Reuse exact names, place keys, numbers, durations, and locations already established. Never rename a place key, change a number, or relocate a fact (a person established in one city does not move to another; two days does not become three). New facts enter only through CANON.
- NO NEW PROPS OR ROOMS MID-SCENE: Use only resources already listed in places. A new node needs a key, plus route minutes both ways.
- ANTI-LOOP: Compare with the last reply and your previous note. Never repeat the same prop gesture, sensory cue, B-plot vector, or opening verb in consecutive notes. A prop that was offered, pushed, or refused once is retired or changes function.
- PACING: A turn is about 1-3 in-world minutes. Nothing moves faster than route minutes. Anyone about to enter the scene gets a precursor (sound, shadow, message) one turn earlier and never before scene.latents window_opens.
- SETTING FIT: Match every detail to the established genre, era, technology, and tone in world.facts and tone_weights. Never import modern or out-of-genre elements into a setting that lacks them. Keep stakes at the scale the setting already has.

DIRECTIVE SLOTS (all required, in this order, 1-2 sentences each, whole note 120-240 words)
FIRST BEAT: Name which NPC answers or reacts to {{user}}'s last input first, and how (answer, dodge, counter, ignore at a cost). If the input asks about undefined canon, say here what that NPC reveals, withholds, or distorts.
WORLD: Move the surrounding area one believable step with public clockwork matched to setting, phase and weather (traffic, patrols, market bells, deliveries, shift changes, tides, neighbors, shifting light or weather). Place it as an interruption after the first beat, never as the opening. Reuse existing place keys; add a new node only if the scene needs it, at most one per three turns. Never repeat a public event within 15 in-world minutes.
OFFSCREEN: Pick 1-3 LOD 1-2 cast whose errand, shift, chore, or journey advances now. Name actor, activity, place key, and minutes remaining. Give each at most one perceptible trace for the present scene (sound, shadow, door, smell, message), or none if too far. Leave the rest on routine. At most one new arrival per turn.
PRESSURE: Default is hold. Check bplots: act only if a bplot's next.due has been reached or a carrier's eta has passed, and at least 15 in-world minutes have gone by since the last visible B-plot beat. If nothing qualifies, write 'Hold: nothing due' with the next due time, and add no trace. If something qualifies, state its current ripple stage, then command one ordinary trace that matches that stage (Stage 1: no local trace; Stage 2: one mundane echo through a vector not used last time; Stage 3: arrival). Never lower a ripple number. Let the actor respond in proportion to what it knows, and allow it to ignore, delay, misread, or settle peacefully. Aim a beat at a specific present NPC's want or secret only if the bplot's hooks already name it. Advance at most one B-plot per turn.
PRESENT: For each LOD 3 NPC, command one tactic that serves their own want_now, plus its cost (deflect, bargain, test, bait, withhold, stall, retreat, attack, change the subject, lie by omission). Aim NPCs at different targets: at most one reacts to {{user}}; the others pursue each other, a task, or the room. Never let two NPCs chase the same request or prop. Every cooperative act must serve the NPC's own aim. Keep guarded secrets at subtle-trace stage unless evidence forces the next stage.
VOICE: Give each speaking NPC one speech cue for this beat, drawn from stress, familiarity, and audience (answers with a question, trails off, over-explains a lie, clipped fragments, interrupts themself, says less than they mean). Make speech sound like a real person: contractions, plain words, correct grammar, short lines, no announced feelings, no speeches, no assistant phrasing. Cues must differ per NPC; swearing and catchphrases are not cues. NPCs may only reference what they perceived or were told.
TEXTURE: Command 2-3 concrete details from different senses, matched to place, phase, and weather, plus one environment change that alters where someone looks or stands. Make sources physically consistent (what makes the sound, how far, which floor). Time each detail to land mid-reply so it changes someone's behavior (a flinch, a glance, a pause). Prefer specific over atmospheric.
CANON: State any new fact the reply is about to establish (family ties, backstory, durations, locations) as one short line for world.facts, consistent with existing facts. If the player's question exposes ambiguous backstory (relatives, ex-partners, past events), pick one answer consistent with established canon and record it; do not let NPCs dodge it just because it is undefined. NPCs may still answer partially, biased, or evasively, but never contradict established canon.
END ON: Name one concrete unresolved physical or environmental moment where the reply stops, so {{user}} has a clean point to act. Not an NPC question aimed at {{user}}.`,
  userNotes: "",
  enabled: true,
};

export class StorageManager {
  private spindle: SpindleAPI;
  private manifestCache: AssetManifest | null = null;
  private manifestDirty = false;
  private chatStateCache: Map<string, LedgerData> = new Map();
  private directorSettingsCache: DirectorSettings | null = null;

  constructor(spindle: SpindleAPI) {
    this.spindle = spindle;
  }

  private async ensureDir(dirPath: string): Promise<void> {
    const parts = dirPath.split("/").filter(Boolean);
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      try {
        if (!(await this.spindle.storage.exists(current))) {
          await this.spindle.storage.mkdir(current);
        }
      } catch {
        // Ignore directory already exists
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
        this.manifestCache = JSON.parse(raw) as AssetManifest;
        return this.manifestCache;
      }
    } catch (e) {
      console.warn("[LumiVN] Failed to read asset_manifest.json, using default:", e);
    }
    this.manifestCache = { ...DEFAULT_MANIFEST };
    return this.manifestCache;
  }

  getCachedManifest(): AssetManifest {
    return this.manifestCache || DEFAULT_MANIFEST;
  }

  async saveManifest(manifest: AssetManifest): Promise<void> {
    this.manifestCache = manifest;
    this.manifestDirty = true;
    try {
      await this.spindle.storage.write("asset_manifest.json", JSON.stringify(manifest, null, 2));
      this.manifestDirty = false;
    } catch (e) {
      console.error("[LumiVN] Failed to save asset_manifest.json:", e);
    }
  }

  // ── Isolated Turn Persistence (Active vs Historical Branch Snapshots) ──

  getCachedChatState(chatId: string): LedgerData | null {
    return this.chatStateCache.get(chatId) || null;
  }

  setCachedChatState(chatId: string, state: LedgerData): void {
    this.chatStateCache.set(chatId, state);
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

  async saveMediaFile(relPath: string, dataUrlOrBase64: string): Promise<string> {
    try {
      const parts = relPath.split("/");
      if (parts.length > 1) {
        const dir = parts.slice(0, -1).join("/");
        await this.ensureDir(dir);
      }

      let base64 = dataUrlOrBase64;
      if (base64.includes(",")) {
        base64 = base64.split(",")[1] ?? "";
      }
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      await this.spindle.storage.writeBinary(relPath, bytes);
      return relPath;
    } catch (e) {
      console.error(`[LumiVN] Failed to save media file to ${relPath}:`, e);
      throw e;
    }
  }

  async fileExists(path: string): Promise<boolean> {
    try {
      return await this.spindle.storage.exists(path);
    } catch {
      return false;
    }
  }

  // ── Director Settings with In-Memory Caching ──

  getCachedDirectorSettings(): DirectorSettings {
    return this.directorSettingsCache || DEFAULT_DIRECTOR_SETTINGS;
  }

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
