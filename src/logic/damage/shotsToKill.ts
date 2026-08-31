/** null when the target cannot be killed with this damage per shot. */
export function shotsToKill(
  hp: number,
  damagePerShot: number,
): number | null {
  if (hp <= 0) return 0;
  if (damagePerShot <= 0) return null;
  return Math.ceil(hp / damagePerShot);
}
