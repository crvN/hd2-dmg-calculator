import { clampPercent } from "../shared/clamp";
import { armorDamageMultiplier } from "./armor";

/**
 * Mixed standard + durable damage before armor (round down once).
 * Standard × (1 − Durable%) + Durable × Durable% → floor.
 */
export function mixedBallisticBaseDamage(
  standardDamage: number,
  durableDamage: number,
  durablePercent: number,
): number {
  const p = clampPercent(durablePercent) / 100;
  const raw = standardDamage * (1 - p) + durableDamage * p;
  return Math.floor(raw);
}

/** Floors after mixing, then again after the armor multiplier. */
export function ballisticDamageAfterArmor(
  standardDamage: number,
  durableDamage: number,
  durablePercent: number,
  penetration: number,
  armor: number,
): number {
  const mixed = mixedBallisticBaseDamage(
    standardDamage,
    durableDamage,
    durablePercent,
  );
  return Math.floor(mixed * armorDamageMultiplier(penetration, armor));
}
