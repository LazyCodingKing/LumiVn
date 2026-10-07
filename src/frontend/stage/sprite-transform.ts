export interface SpriteTransform {
  scale: number;   // 0.5 to 2.0 (default 1.0)
  offsetX: number; // -200 to +200 px (default 0)
  offsetY: number; // -200 to +200 px (default 0)
}

const STORAGE_PREFIX = "lumivn_transform_";

export function getSpriteTransform(actorId: string): SpriteTransform {
  if (typeof window === "undefined" || !actorId) {
    return { scale: 1.0, offsetX: 0, offsetY: 0 };
  }
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + actorId.toLowerCase().trim());
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        scale: typeof parsed.scale === "number" ? parsed.scale : 1.0,
        offsetX: typeof parsed.offsetX === "number" ? parsed.offsetX : 0,
        offsetY: typeof parsed.offsetY === "number" ? parsed.offsetY : 0,
      };
    }
  } catch {}
  return { scale: 1.0, offsetX: 0, offsetY: 0 };
}

export function saveSpriteTransform(actorId: string, transform: SpriteTransform): void {
  if (typeof window === "undefined" || !actorId) return;
  try {
    localStorage.setItem(STORAGE_PREFIX + actorId.toLowerCase().trim(), JSON.stringify(transform));
  } catch {}
}

export function resetSpriteTransform(actorId: string): void {
  if (typeof window === "undefined" || !actorId) return;
  try {
    localStorage.removeItem(STORAGE_PREFIX + actorId.toLowerCase().trim());
  } catch {}
}
