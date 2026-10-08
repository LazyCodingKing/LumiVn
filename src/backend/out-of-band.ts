import type { SpindleAPI } from "lumiverse-spindle-types";
import type { LedgerData, ActorDossier, PlaceNode, BulletinPost, BPlot } from "../shared/types.js";

function cleanJsonText(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

/**
 * Generate a complete, rich character dossier out-of-band using spindle.generate.quiet
 */
export async function generateCharacterDossier(
  spindle: SpindleAPI,
  actorId: string,
  actorName: string,
  currentState: LedgerData,
  chatId?: string
): Promise<Partial<ActorDossier>> {
  const currentScene = currentState.scene?.place || "Current Location";
  const genre = (currentState.world?.genre as string) || "Visual Novel Roleplay";
  const existingActor = currentState.actors?.[actorId] || {};

  const systemPrompt = `You are a world simulation engine for an immersive visual novel life-sim (${genre}).
Generate an authentic, grounded, comprehensive character dossier for "${actorName}" (ID: "${actorId}").
The current scene is: ${currentScene}.

Respond ONLY with a valid JSON object matching this schema (no preamble, no markdown fences):
{
  "appearance": {
    "age": "string",
    "traits": "key distinguishing traits and features",
    "appeal": 50 to 95,
    "style": "clothing / presentation style",
    "condition": "Clean"
  },
  "combat": {
    "tier": 1,
    "lv": 1,
    "hp": "150/150",
    "mp": "80/80",
    "eff_pwr": 25,
    "eff_agi": 30,
    "pwr": 25,
    "agi": 30,
    "int": 40,
    "talent": ["signature skill or talent"]
  },
  "life_model": {
    "orientation": "sexual/romantic orientation",
    "romantic_history": "brief background",
    "upbringing": "formative childhood / environment",
    "family": ["family members or background"],
    "occupation": "job, student status, or role",
    "residence": "home location",
    "routines": [
      { "time": "08:00", "action": "Morning routine", "place": "Residence", "phase": "Morning" },
      { "time": "13:00", "action": "Day routine", "place": "Work or Study", "phase": "Afternoon" },
      { "time": "18:00", "action": "Evening leisure", "place": "Living Area", "phase": "Evening" },
      { "time": "22:00", "action": "Rest", "place": "Bedroom", "phase": "Night" }
    ],
    "worldview": "core life philosophy",
    "self_concept": "how they view themselves internally"
  },
  "passions": {
    "anger": 10,
    "shame": 5,
    "arousal": 15,
    "fear": 5,
    "stress": 20,
    "suspicion": 10,
    "joy": 50
  },
  "profile": {
    "values": ["core value 1", "core value 2"],
    "boundaries": ["personal boundary"],
    "red_lines": ["unacceptable line"],
    "defense": "psychological defense mechanism",
    "blind_spot": "key weakness or vulnerability",
    "tells": { "lying": "physical tell", "hurt": "physical tell", "shame": "physical tell" }
  },
  "agency": {
    "goals": [
      { "id": "g1", "intent": "primary active goal", "priority": 1, "status": "active" }
    ],
    "want_now": "what they immediately want right now in the scene"
  },
  "knowledge": {
    "secrets": [
      { "truth": "guarded secret", "knows": ["${actorName}"], "exposure": 10, "cover": "cover story" }
    ],
    "held_leverage": []
  }
}`;

  const userPrompt = `Generate the dossier for "${actorName}" who is currently situated in ${currentScene}. Context: ${JSON.stringify(existingActor.appearance || {})}`;

  try {
    const spindleAny = spindle as any;
    if (typeof spindleAny.generate?.quiet === "function") {
      const res = await spindleAny.generate.quiet({
        type: "quiet",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        parameters: { temperature: 0.6, max_tokens: 2500 },
      });
      const content = typeof res === "string" ? res : res?.content || "";
      const cleaned = cleanJsonText(content);
      const parsed = JSON.parse(cleaned);
      return {
        id: actorId,
        name: actorName,
        ...parsed,
      };
    }
  } catch (err) {
    spindle.log.error(`[LumiVN] Out-of-band dossier generation failed for ${actorName}: ${String(err)}`);
  }

  // Graceful deterministic fallback if LLM is unavailable
  return {
    id: actorId,
    name: actorName,
    appearance: { age: "20", traits: "Noticeable presence", appeal: 65, style: "Casual", condition: "Clean" },
    combat: { tier: 1, lv: 1, hp: "150/150", mp: "80/80", eff_pwr: 30, eff_agi: 30, int: 35, talent: ["Focus"] },
    life_model: {
      occupation: "Resident",
      residence: currentScene,
      routines: [
        { time: "08:00", action: "Morning routine", place: currentScene, phase: "Morning" },
        { time: "18:00", action: "Evening leisure", place: currentScene, phase: "Evening" },
      ],
      worldview: "Pragmatic",
      self_concept: "Capable and watchful",
    },
    passions: { anger: 5, shame: 5, arousal: 10, fear: 5, stress: 15, suspicion: 10, joy: 40 },
    agency: { want_now: "Engage with the present company" },
  };
}

/**
 * Scout surrounding rooms / places on demand
 */
export async function generateSurroundingPlaces(
  spindle: SpindleAPI,
  currentPlaceId: string,
  currentState: LedgerData
): Promise<Record<string, PlaceNode>> {
  const scope = currentPlaceId.includes(":") ? currentPlaceId.split(":")[0] : "local";
  const genre = (currentState.world?.genre as string) || "Visual Novel";

  const systemPrompt = `You are a world simulation engine for a visual novel (${genre}).
Generate 2 adjacent places / rooms connected to current place "${currentPlaceId}".
Return ONLY valid JSON (no markdown fences, no preamble):
{
  "${scope}:hallway": {
    "function": "Transit corridor connecting main rooms",
    "traffic": 2,
    "privacy": 1,
    "visibility": 2,
    "norm": "casual",
    "resources": ["notice board", "water dispenser"],
    "routes": [{ "to": "${currentPlaceId}", "minutes": 1 }]
  },
  "${scope}:courtyard": {
    "function": "Open-air gathering space",
    "traffic": 2,
    "privacy": 0,
    "visibility": 3,
    "norm": "public",
    "resources": ["benches", "vending machine"],
    "routes": [{ "to": "${currentPlaceId}", "minutes": 2 }]
  }
}`;

  try {
    const spindleAny = spindle as any;
    if (typeof spindleAny.generate?.quiet === "function") {
      const res = await spindleAny.generate.quiet({
        type: "quiet",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate adjacent rooms for ${currentPlaceId}` },
        ],
        parameters: { temperature: 0.5, max_tokens: 1200 },
      });
      const content = typeof res === "string" ? res : res?.content || "";
      return JSON.parse(cleanJsonText(content));
    }
  } catch (err) {
    spindle.log.error(`[LumiVN] Out-of-band places generation failed: ${String(err)}`);
  }

  return {
    [`${scope}:adjoining_room`]: {
      function: "Adjacent connected room",
      traffic: 1,
      privacy: 2,
      visibility: 1,
      norm: "casual",
      resources: ["desk", "chairs"],
      routes: [{ to: currentPlaceId, minutes: 1 }],
    },
  };
}

/**
 * Simulate offscreen NPC moves and generate ambient rumors
 */
export async function simulateOffscreenMoves(
  spindle: SpindleAPI,
  currentState: LedgerData
): Promise<{
  bulletin: BulletinPost;
  relationUpdates?: Array<{ from: string; to: string; affinityDelta: number; note: string }>;
}> {
  const actors = Object.keys(currentState.actors || {}).filter((k) => k !== "user");
  const time = currentState.clock?.t || "12:00";
  const date = currentState.clock?.date || "Day 1";

  if (actors.length < 2) {
    return {
      bulletin: {
        id: `rumor_${Date.now()}`,
        category: "Local Chatter",
        title: "Quiet in Town",
        body: `Things remain relatively calm around ${currentState.scene?.place || "the area"}.`,
        source: "Town Word",
        timestamp: `${date} ${time}`,
      },
    };
  }

  const a1 = actors[0];
  const a2 = actors[1];
  const n1 = currentState.actors?.[a1]?.name || a1;
  const n2 = currentState.actors?.[a2]?.name || a2;

  const systemPrompt = `You are a life-sim world director.
Simulate a minor offscreen interaction between ${n1} and ${n2} that happened elsewhere while the player was away.
Return ONLY valid JSON (no markdown):
{
  "title": "Short catchy rumor headline (3-6 words)",
  "body": "1-2 sentences of what someone noticed them doing or talking about.",
  "category": "Rumor",
  "affinityDelta": 2,
  "note": "brief summary of relationship shift"
}`;

  try {
    const spindleAny = spindle as any;
    if (typeof spindleAny.generate?.quiet === "function") {
      const res = await spindleAny.generate.quiet({
        type: "quiet",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate offscreen interaction between ${n1} and ${n2}` },
        ],
        parameters: { temperature: 0.7, max_tokens: 400 },
      });
      const parsed = JSON.parse(cleanJsonText(typeof res === "string" ? res : res?.content || ""));
      return {
        bulletin: {
          id: `rumor_${Date.now()}`,
          category: parsed.category || "Rumor",
          title: parsed.title || `${n1} and ${n2} Spotted`,
          body: parsed.body || `${n1} and ${n2} were seen speaking in private earlier today.`,
          source: "Heard Nearby",
          timestamp: `${date} ${time}`,
          hot: true,
        },
        relationUpdates: [
          {
            from: a1,
            to: a2,
            affinityDelta: Number(parsed.affinityDelta || 2),
            note: parsed.note || "Interacted offscreen",
          },
        ],
      };
    }
  } catch (err) {
    spindle.log.error(`[LumiVN] Offscreen simulation error: ${String(err)}`);
  }

  return {
    bulletin: {
      id: `rumor_${Date.now()}`,
      category: "Rumor",
      title: `${n1} and ${n2} Spotted Nearby`,
      body: `Witnesses mentioned seeing ${n1} and ${n2} having a quick discussion near the corridor.`,
      source: "Hallway Chatter",
      timestamp: `${date} ${time}`,
    },
    relationUpdates: [{ from: a1, to: a2, affinityDelta: 1, note: "Brief conversation" }],
  };
}
