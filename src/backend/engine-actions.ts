import type { ClockState, LedgerData, ActorDossier } from "../shared/types.js";

/**
 * Advance clock by minutes or sleep until morning
 */
export function advanceClock(
  clock: ClockState | undefined,
  minutesToAdd: number,
  sleepUntilMorning = false
): ClockState {
  const c: ClockState = { ...(clock || {}) };
  let currentHour = 12;
  let currentMin = 0;

  if (c.t) {
    const timeMatch = c.t.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      currentHour = parseInt(timeMatch[1], 10);
      currentMin = parseInt(timeMatch[2], 10);
    }
  }

  let dayNum = 1;
  if (c.date) {
    const dayMatch = c.date.match(/Day\s*(\d+)/i) || c.date.match(/D(\d+)/i);
    if (dayMatch) {
      dayNum = parseInt(dayMatch[1], 10);
    }
  }

  if (sleepUntilMorning) {
    dayNum += 1;
    currentHour = 7;
    currentMin = 0;
  } else {
    currentMin += minutesToAdd;
    while (currentMin >= 60) {
      currentMin -= 60;
      currentHour += 1;
    }
    while (currentHour >= 24) {
      currentHour -= 24;
      dayNum += 1;
    }
  }

  const paddedH = String(currentHour).padStart(2, "0");
  const paddedM = String(currentMin).padStart(2, "0");
  c.t = `${paddedH}:${paddedM}`;
  c.date = `Day ${dayNum}`;

  if (currentHour >= 5 && currentHour < 12) {
    c.phase = "Morning";
  } else if (currentHour >= 12 && currentHour < 17) {
    c.phase = "Afternoon";
  } else if (currentHour >= 17 && currentHour < 21) {
    c.phase = "Evening";
  } else if (currentHour >= 21 || currentHour < 2) {
    c.phase = "Night";
  } else {
    c.phase = "Late Night";
  }

  return c;
}

/**
 * Update actor room locations based on daily routines matching new time
 */
export function updateActorLocationsByRoutines(
  actors: Record<string, ActorDossier>,
  currentTime: string,
  currentPhase: string
): Record<string, ActorDossier> {
  const updated: Record<string, ActorDossier> = { ...actors };
  const targetHour = parseInt(currentTime.split(":")[0] || "12", 10);

  for (const [id, actor] of Object.entries(updated)) {
    if (id.toLowerCase() === "user") continue;
    const actorCopy: ActorDossier = { ...actor };
    const routines = (actorCopy.life_model as any)?.routines;

    if (Array.isArray(routines) && routines.length > 0) {
      let bestPlace: string | null = null;
      for (const r of routines) {
        if (!r) continue;
        const rTime = typeof r === "object" ? r.time || r.t : r[0];
        const rPlace = typeof r === "object" ? r.place || r.loc : r[2];
        const rPhase = typeof r === "object" ? r.phase : r[3];

        if (rTime) {
          const match = String(rTime).match(/(\d{1,2}):/);
          if (match && parseInt(match[1], 10) <= targetHour) {
            bestPlace = String(rPlace);
          }
        } else if (rPhase && String(rPhase).toLowerCase() === currentPhase.toLowerCase()) {
          bestPlace = String(rPlace);
        }
      }

      if (bestPlace) {
        if (!actorCopy.inventory) actorCopy.inventory = {};
        actorCopy.inventory.room_location = bestPlace;
      }
    }
    updated[id] = actorCopy;
  }

  return updated;
}

/**
 * Gifting item transfer between player and NPC
 */
export function giftItem(
  state: LedgerData,
  actorId: string,
  itemName: string
): { success: boolean; state: LedgerData; message: string } {
  const next = JSON.parse(JSON.stringify(state)) as LedgerData;
  if (!next.actors) next.actors = {};
  if (!next.actors.user) next.actors.user = {};
  if (!next.actors[actorId]) next.actors[actorId] = { id: actorId, name: actorId };

  const user = next.actors.user;
  const target = next.actors[actorId];

  let found = false;
  const userCarried = Array.isArray(user.inventory?.carried) ? user.inventory!.carried : [];
  const idx = userCarried.findIndex((i) => i.toLowerCase().includes(itemName.toLowerCase()));
  if (idx >= 0) {
    userCarried.splice(idx, 1);
    found = true;
  } else if (user.inventory?.in_hand?.R?.toLowerCase().includes(itemName.toLowerCase())) {
    user.inventory.in_hand.R = "Empty";
    found = true;
  } else if (user.inventory?.in_hand?.L?.toLowerCase().includes(itemName.toLowerCase())) {
    user.inventory.in_hand.L = "Empty";
    found = true;
  }

  if (!found) {
    return { success: false, state, message: `Item "${itemName}" was not found in your inventory.` };
  }

  if (!target.inventory) target.inventory = {};
  if (!Array.isArray(target.inventory.carried)) target.inventory.carried = [];
  target.inventory.carried.push(itemName);

  if (!target.relations) target.relations = {};
  if (!target.relations.user) target.relations.user = { affinity: 50, trust: 50 };
  const prevAff = Number(target.relations.user.affinity ?? 50);
  target.relations.user.affinity = Math.min(100, prevAff + 10);
  (target.relations.user as any).favors_owed = Number((target.relations.user as any).favors_owed ?? 0) + 1;

  if (!Array.isArray(next.journal)) next.journal = [];
  next.journal.push({
    id: `EVT-${Date.now()}`,
    time: next.clock?.t || "12:00",
    place: next.scene?.place || "Current Location",
    action: `Player gave ${itemName} to ${target.name || actorId}`,
    outcome: `Affinity rose to ${target.relations.user.affinity}. Social favor earned.`,
  });

  return {
    success: true,
    state: next,
    message: `Gifted ${itemName} to ${target.name || actorId}! Affinity increased (+10).`,
  };
}

/**
 * Snoop / search room
 */
export function snoopRoom(
  state: LedgerData,
  placeId: string
): { success: boolean; state: LedgerData; message: string; foundItem?: string } {
  const next = JSON.parse(JSON.stringify(state)) as LedgerData;
  const place = next.places?.[placeId];
  const privacy = Number(place?.privacy ?? 1);

  // Chance of finding item from place resources
  let foundItem: string | undefined;
  if (place?.resources && Array.isArray(place.resources) && place.resources.length > 0) {
    foundItem = place.resources[Math.floor(Math.random() * place.resources.length)];
  }

  if (!next.actors) next.actors = {};
  if (!next.actors.user) next.actors.user = {};
  const user = next.actors.user;
  if (!user.passions) user.passions = {};

  if (foundItem) {
    if (!user.inventory) user.inventory = {};
    if (!Array.isArray(user.inventory.carried)) user.inventory.carried = [];
    user.inventory.carried.push(foundItem);
  }

  // Suspicion risk if privacy is low (0 or 1)
  if (privacy <= 1) {
    const prevSusp = Number(user.passions.suspicion ?? 0);
    user.passions.suspicion = Math.min(100, prevSusp + 15);
  }

  const msg = foundItem
    ? `Searched ${placeId}: Found "${foundItem}"!${privacy <= 1 ? " (Suspicion slightly increased)" : ""}`
    : `Searched ${placeId}: Nothing unusual discovered.${privacy <= 1 ? " (Suspicion slightly increased)" : ""}`;

  return {
    success: true,
    state: next,
    message: msg,
    foundItem,
  };
}
