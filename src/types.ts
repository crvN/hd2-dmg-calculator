import type { Hitmarker } from './damage'

export type DamageMode = 'ballistic' | 'explosive' | 'combined'
export type EntryMode = 'manual' | 'wiki'

export type ParsedResult = {
  hpN: number
  dPct: number
  armorN: number
  resN: number
  std: number
  dur: number
  ap: number
  expD: number
  ballistic: number
  explosive: number
  total: number
  shots: number | null
  ballisticMarker: Hitmarker
  explosiveMarker: Hitmarker
  damageModeEffective: DamageMode
}
