import { clampPercent } from "../shared/clamp";
import { armorDamageMultiplier } from "./armor";
import { floorDamage } from "./rounding";

/** Explosive portion: listed explosive damage against armor, then explosive resistance. */
export function explosiveDamageAfterArmor(
  explosiveDamage: number,
  explosivePenetration: number,
  armor: number,
  explosiveResistancePercent: number,
): number {
  const mult = armorDamageMultiplier(explosivePenetration, armor);
  const resist = clampPercent(explosiveResistancePercent) / 100;
  return floorDamage(explosiveDamage * mult * (1 - resist));
}
