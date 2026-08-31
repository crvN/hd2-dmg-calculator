/** Text field → number, defaulting to 0 for anything unparsable. */
export function toNumber(value: string): number {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}
