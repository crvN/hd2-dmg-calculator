export function clampPercent(n: number): number {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

export function clampArmor(n: number): number {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return Math.min(10, Math.max(0, Math.round(n)));
}
