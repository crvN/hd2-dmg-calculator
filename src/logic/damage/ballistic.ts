import { clampPercent } from "../shared/clamp";
import { armorDamageMultiplier } from "./armor";
import { floorDamage } from "./rounding";

/**
 * Mixed standard + durable damage before armor, not yet rounded.
 * Standard × (1 − Durable%) + Durable × Durable%.
 */
export function mixedBallisticBaseDamage(
  standardDamage: number,
  durableDamage: number,
  durablePercent: number,
): number {
  const p = clampPercent(durablePercent) / 100;
  return standardDamage * (1 - p) + durableDamage * p;
}

/** Rounds once, after the armor multiplier. */
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
  return floorDamage(mixed * armorDamageMultiplier(penetration, armor));
}
