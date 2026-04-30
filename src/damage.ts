/** Helldivers 2 armor interaction: AP vs part armor rating (0–10). */
export type Hitmarker = 'red' | 'white' | 'ricochet'

export function armorDamageMultiplier(ap: number, armor: number): number {
  const a = Math.round(ap)
  const r = Math.round(armor)
  if (a > r) return 1
  if (a === r) return 0.65
  return 0
}

export function hitmarkerFor(ap: number, armor: number): Hitmarker {
  const a = Math.round(ap)
  const r = Math.round(armor)
  if (a > r) return 'red'
  if (a === r) return 'white'
  return 'ricochet'
}

/** Fixed AP for explosive damage in this model. */
export const EXPLOSIVE_AP = 3

/**
 * Mixed standard + durable damage before armor (round down once).
 * Standard × (1 − Durable%) + Durable × Durable% → floor.
 */
export function mixedBallisticBaseDamage(
  standardDamage: number,
  durableDamage: number,
  durablePercent: number,
): number {
  const p = clampPercent(durablePercent) / 100
  const raw = standardDamage * (1 - p) + durableDamage * p
  return Math.floor(raw)
}

/**
 * Damage after armor multiplier (floor after mixing, then floor after armor per common reading of the example).
 */
export function ballisticDamageAfterArmor(
  standardDamage: number,
  durableDamage: number,
  durablePercent: number,
  penetration: number,
  armor: number,
): number {
  const mixed = mixedBallisticBaseDamage(standardDamage, durableDamage, durablePercent)
  const mult = armorDamageMultiplier(penetration, armor)
  return Math.floor(mixed * mult)
}

/**
 * Explosive portion: uses listed explosive damage, AP3, then explosive resistance %.
 * Resistance reduces dealt damage (multiplicative).
 */
export function explosiveDamageAfterArmor(
  explosiveDamage: number,
  armor: number,
  explosiveResistancePercent: number,
): number {
  const mult = armorDamageMultiplier(EXPLOSIVE_AP, armor)
  const resist = clampPercent(explosiveResistancePercent) / 100
  return Math.floor(explosiveDamage * mult * (1 - resist))
}

export function clampPercent(n: number): number {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0
  return Math.min(100, Math.max(0, n))
}

export function clampArmor(n: number): number {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0
  return Math.min(10, Math.max(0, Math.round(n)))
}

export function shotsToKill(hp: number, damagePerShot: number): number | null {
  if (hp <= 0) return 0
  if (damagePerShot <= 0) return null
  return Math.ceil(hp / damagePerShot)
}
