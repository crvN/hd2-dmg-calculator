/**
 * Rounds damage down, once per damage source (DiversDex 2.3, `_targetProjSumX`).
 * Drops float noise first: 75 × 0.2 + 10 × 0.8 evaluates to 22.999999999999996, not 23.
 */
export function floorDamage(damage: number): number {
  return Math.floor(Number(damage.toPrecision(15)));
}
