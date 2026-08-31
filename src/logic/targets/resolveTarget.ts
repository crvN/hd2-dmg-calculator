import type { EnemyBodyPart } from "../../data/types";
import type { TargetStats } from "../../types";
import { toNumber } from "../shared/numbers";

/** Raw text fields from the manual target form. */
export type ManualTargetFields = {
  hitPoints: string;
  durablePercent: string;
  armorRating: string;
  explosiveResistPercent: string;
};

export function resolveManualTarget(fields: ManualTargetFields): TargetStats {
  return {
    hitPoints: toNumber(fields.hitPoints),
    durablePercent: toNumber(fields.durablePercent),
    armorRating: toNumber(fields.armorRating),
    explosiveResistPercent: toNumber(fields.explosiveResistPercent),
  };
}

export function resolveWikiTarget(
  part: EnemyBodyPart | undefined,
): TargetStats {
  return {
    hitPoints: part?.hp ?? 0,
    durablePercent: part?.durablePercent ?? 0,
    armorRating: part?.armorRating ?? 0,
    explosiveResistPercent: part?.explosiveResistPercent ?? 0,
  };
}
