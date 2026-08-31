import type { Hitmarker } from "../../types";

/** Helldivers 2 armor interaction: AP vs part armor rating (0–10). */
export function armorDamageMultiplier(ap: number, armor: number): number {
  const a = Math.round(ap);
  const r = Math.round(armor);
  if (a > r) return 1;
  if (a === r) return 0.65;
  return 0;
}

export function hitmarkerFor(ap: number, armor: number): Hitmarker {
  const a = Math.round(ap);
  const r = Math.round(armor);
  if (a > r) return "red";
  if (a === r) return "white";
  return "ricochet";
}
