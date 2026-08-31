export type Hitmarker = 'red' | 'white' | 'ricochet'

export type DamageMode = 'ballistic' | 'explosive' | 'combined'
export type EntryMode = 'manual' | 'wiki'

export type TargetStats = {
  hitPoints: number
  durablePercent: number
  armorRating: number
  explosiveResistPercent: number
}

/** Damage actually leaving the weapon, after any weapon-specific modifiers. */
export type WeaponShot = {
  standardDamage: number
  durableDamage: number
  penetration: number
  explosiveDamage: number
  damageMode: DamageMode
}

export type ShotInput = TargetStats & WeaponShot

export type ShotOutcome = {
  damageMode: DamageMode
  ballisticDamage: number
  explosiveDamage: number
  totalDamage: number
  /** null when the target cannot be killed by this shot. */
  shotsToKill: number | null
  ballisticMarker: Hitmarker
  explosiveMarker: Hitmarker
}
