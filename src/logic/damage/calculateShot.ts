import type { DamageMode, ShotInput, ShotOutcome } from "../../types";
import { hitmarkerFor } from "./armor";
import { ballisticDamageAfterArmor } from "./ballistic";
import { EXPLOSIVE_AP, explosiveDamageAfterArmor } from "./explosive";
import { shotsToKill } from "./shotsToKill";

function dealsBallisticDamage(mode: DamageMode): boolean {
  return mode === "ballistic" || mode === "combined";
}

function dealsExplosiveDamage(mode: DamageMode): boolean {
  return mode === "explosive" || mode === "combined";
}

export function calculateShot(input: ShotInput): ShotOutcome {
  const ballisticDamage = dealsBallisticDamage(input.damageMode)
    ? ballisticDamageAfterArmor(
        input.standardDamage,
        input.durableDamage,
        input.durablePercent,
        input.penetration,
        input.armorRating,
      )
    : 0;

  const explosiveDamage = dealsExplosiveDamage(input.damageMode)
    ? explosiveDamageAfterArmor(
        input.explosiveDamage,
        input.armorRating,
        input.explosiveResistPercent,
      )
    : 0;

  const totalDamage = ballisticDamage + explosiveDamage;

  return {
    damageMode: input.damageMode,
    ballisticDamage,
    explosiveDamage,
    totalDamage,
    shotsToKill: shotsToKill(input.hitPoints, totalDamage),
    ballisticMarker: hitmarkerFor(input.penetration, input.armorRating),
    explosiveMarker: hitmarkerFor(EXPLOSIVE_AP, input.armorRating),
  };
}
