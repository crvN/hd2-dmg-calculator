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

/** The tier in force at a difficulty: the highest one starting at or below it. */
function tierAtDifficulty<Tier extends { fromDifficulty: number }>(
  tiers: Tier[],
  difficulty: number,
): Tier | undefined {
  return tiers.findLast((tier) => tier.fromDifficulty <= difficulty);
}

/** The part whose health this one uses, preferring its own wiki tab when several share a label. */
function healthPool(
  part: EnemyBodyPart,
  enemyParts: EnemyBodyPart[],
): EnemyBodyPart {
  if (!part.sharesHealthWith) return part;
  const named = enemyParts.filter((p) => p.label === part.sharesHealthWith);
  return named.find((p) => p.section === part.section) ?? named[0] ?? part;
}

function hitPointsAtDifficulty(
  part: EnemyBodyPart,
  enemyParts: EnemyBodyPart[],
  difficulty: number,
): number {
  if (part.hasInfiniteHealth) return Infinity;
  const { hitPointsByDifficulty } = healthPool(part, enemyParts);
  return tierAtDifficulty(hitPointsByDifficulty, difficulty)?.hitPoints ?? 0;
}

export function resolveWikiTarget(
  part: EnemyBodyPart | undefined,
  enemyParts: EnemyBodyPart[],
  difficulty: number,
): TargetStats {
  if (!part) {
    return {
      hitPoints: 0,
      durablePercent: 0,
      armorRating: 0,
      explosiveResistPercent: 0,
    };
  }
  return {
    hitPoints: hitPointsAtDifficulty(part, enemyParts, difficulty),
    durablePercent: part.durablePercent,
    armorRating:
      tierAtDifficulty(part.armorByDifficulty, difficulty)?.armorRating ?? 0,
    explosiveResistPercent: part.explosiveResistPercent,
  };
}

/** Name for a part picker: "Armor Broken: Internals (×2)". */
export function partOptionLabel(part: EnemyBodyPart): string {
  const name = part.section ? `${part.section}: ${part.label}` : part.label;
  return part.count > 1 ? `${name} (×${part.count})` : name;
}

export function formatHitPoints(hitPoints: number): string {
  return Number.isFinite(hitPoints) ? String(hitPoints) : "Infinite";
}
