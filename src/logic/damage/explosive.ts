import { clampPercent } from "../shared/clamp";
import { armorDamageMultiplier } from "./armor";

/** Fixed AP for explosive damage in this model. */
export const EXPLOSIVE_AP = 3;

/** Explosive portion: listed explosive damage at AP3, then explosive resistance. */
export function explosiveDamageAfterArmor(
  explosiveDamage: number,
  armor: number,
  explosiveResistancePercent: number,
): number {
  const mult = armorDamageMultiplier(EXPLOSIVE_AP, armor);
  const resist = clampPercent(explosiveResistancePercent) / 100;
  return Math.floor(explosiveDamage * mult * (1 - resist));
}
