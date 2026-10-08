import type { SpindleAPI, WorldBookEntryDTO } from "lumiverse-spindle-types";
import type { AssetManifest } from "../shared/types.js";

export const RULESET_BOOK_NAME = "lumivn-ruleset";
export const knownRulebookEntryIds = new Set<string>();
export const knownRulebookBookIds = new Set<string>();

export function isRulesetBookName(name?: string): boolean {
  if (!name) return false;
  return name.trim().toLowerCase().startsWith(RULESET_BOOK_NAME);
}

export function isRulesetEntryTitle(comment?: string): boolean {
  if (!comment) return false;
  const c = comment.trim().toLowerCase();
  return c.startsWith("lumivn-ruleset") || c.startsWith("[lumivn]") || c.startsWith("lumivn ·");
}

export interface CharacterRulebookData {
  places: Record<string, { label?: string; bg?: string; norm?: string }>;
  characters: Record<string, { name?: string; defaultMood?: string; defaultOutfit?: string; slot?: string }>;
}

/**
 * Loads character-attached lumivn-ruleset lorebooks.
 */
export async function loadRulebookForCharacter(
  spindle: SpindleAPI,
  characterId: string,
  userId?: string
): Promise<CharacterRulebookData | null> {
  try {
    const character = await spindle.characters.get(characterId, userId);
    if (!character || !Array.isArray(character.world_book_ids) || character.world_book_ids.length === 0) {
      return null;
    }

    const data: CharacterRulebookData = { places: {}, characters: {} };
    let foundAny = false;

    for (const bookId of character.world_book_ids) {
      const book = await spindle.world_books.get(bookId, userId).catch(() => null);
      if (!book) continue;

      const isRuleset = isRulesetBookName(book.name);
      if (isRuleset) {
        knownRulebookBookIds.add(bookId);
      }

      const entries = await spindle.world_books.entries.list(bookId, { limit: 100, userId }).catch(() => null);
      if (!entries || !Array.isArray(entries.data)) continue;

      for (const entry of entries.data) {
        if (!isRuleset && !isRulesetEntryTitle(entry.comment)) continue;
        knownRulebookEntryIds.add(entry.id);
        foundAny = true;

        try {
          const lines = (entry.content || "").split("\n");
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("place:") || trimmed.startsWith("location:")) {
              const parts = trimmed.split(":");
              const placeId = parts[1]?.trim().toLowerCase();
              if (placeId) data.places[placeId] = { label: placeId };
            } else if (trimmed.startsWith("actor:") || trimmed.startsWith("character:")) {
              const parts = trimmed.split(":");
              const charId = parts[1]?.trim().toLowerCase();
              if (charId) data.characters[charId] = { name: charId };
            }
          }
        } catch {}
      }
    }

    return foundAny ? data : null;
  } catch (e) {
    spindle.log?.warn?.(`[LumiVN] Failed to load character rulebook for ${characterId}: ${e}`);
    return null;
  }
}

/**
 * Ensures a character has an attached lumivn-ruleset lorebook, creating one if missing.
 */
export async function ensureCharacterRulebook(
  spindle: SpindleAPI,
  characterId: string,
  manifest: AssetManifest,
  userId?: string
): Promise<string | null> {
  try {
    const character = await spindle.characters.get(characterId, userId);
    if (!character) return null;

    // Check if already has a lumivn-ruleset attached
    if (Array.isArray(character.world_book_ids)) {
      for (const bookId of character.world_book_ids) {
        const book = await spindle.world_books.get(bookId, userId).catch(() => null);
        if (book && isRulesetBookName(book.name)) {
          knownRulebookBookIds.add(book.id);
          return book.id;
        }
      }
    }

    // Create a new lumivn-ruleset world book
    const book = await spindle.world_books.create(
      {
        name: RULESET_BOOK_NAME,
        description: `Visual novel stage definitions for ${character.name || characterId}. Managed by LumiVN.`,
        metadata: { lumivn: { rulebook: 1 } },
      },
      userId
    );

    knownRulebookBookIds.add(book.id);

    // Create default Places entry
    const placeKeys = Object.keys(manifest.places || {});
    const placesContent = placeKeys.length > 0
      ? placeKeys.map((p) => `place: ${p}`).join("\n")
      : "place: default\nplace: room\nplace: outdoors";

    const pEntry = await spindle.world_books.entries.create(
      book.id,
      {
        comment: "lumivn-ruleset · Places",
        content: `# Places and Stage Backgrounds\n${placesContent}`,
        key: [],
        disabled: true, // Keep disabled so it only resolves via LumiVN engine
        constant: false,
        order_value: 10,
      },
      userId
    );
    knownRulebookEntryIds.add(pEntry.id);

    // Create default Cast entry
    const charKeys = Object.keys(manifest.characters || {});
    const charContent = charKeys.length > 0
      ? charKeys.map((c) => `character: ${c}`).join("\n")
      : `character: ${character.name?.toLowerCase().replace(/[^a-z0-9_-]/g, "_") || "char"}\ncharacter: user`;

    const cEntry = await spindle.world_books.entries.create(
      book.id,
      {
        comment: "lumivn-ruleset · Cast",
        content: `# Stage Cast and Default Slots\n${charContent}`,
        key: [],
        disabled: true,
        constant: false,
        order_value: 20,
      },
      userId
    );
    knownRulebookEntryIds.add(cEntry.id);

    // Attach to character
    const existingBookIds = character.world_book_ids || [];
    await spindle.characters.update(
      characterId,
      { world_book_ids: [...existingBookIds, book.id] },
      userId
    );

    spindle.log?.info?.(`[LumiVN] Created and attached ${RULESET_BOOK_NAME} to character ${character.name}`);
    return book.id;
  } catch (e) {
    spindle.log?.warn?.(`[LumiVN] Failed to ensure character rulebook: ${e}`);
    return null;
  }
}
