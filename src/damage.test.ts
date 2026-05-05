import {
  EXPLOSIVE_AP,
  armorDamageMultiplier,
  ballisticDamageAfterArmor,
  clampArmor,
  clampPercent,
  explosiveDamageAfterArmor,
  hitmarkerFor,
  mixedBallisticBaseDamage,
  railgunChargeDamageMultiplier,
  shotsToKill,
} from './damage'

describe('armorDamageMultiplier', () => {
  it('returns full damage when AP is above armor', () => {
    expect(armorDamageMultiplier(4, 3)).toBe(1)
    expect(armorDamageMultiplier(4.6, 4.4)).toBe(1)
  })

  it('returns partial damage when AP equals armor after rounding', () => {
    expect(armorDamageMultiplier(3, 3)).toBe(0.65)
    expect(armorDamageMultiplier(2.6, 3.4)).toBe(0.65)
  })

  it('returns zero damage when AP is below armor', () => {
    expect(armorDamageMultiplier(2, 3)).toBe(0)
    expect(armorDamageMultiplier(2.4, 3.4)).toBe(0)
  })
})

describe('hitmarkerFor', () => {
  it('maps AP > armor to red', () => {
    expect(hitmarkerFor(5, 4)).toBe('red')
  })

  it('maps AP = armor to white', () => {
    expect(hitmarkerFor(3, 3)).toBe('white')
  })

  it('maps AP < armor to ricochet', () => {
    expect(hitmarkerFor(2, 4)).toBe('ricochet')
  })
})

describe('mixedBallisticBaseDamage', () => {
  it('uses only standard damage at 0% durable', () => {
    expect(mixedBallisticBaseDamage(100, 50, 0)).toBe(100)
  })

  it('uses only durable damage at 100% durable', () => {
    expect(mixedBallisticBaseDamage(100, 50, 100)).toBe(50)
  })

  it('mixes both values and floors once', () => {
    expect(mixedBallisticBaseDamage(100, 50, 55)).toBe(72)
  })

  it('clamps invalid durable percentages', () => {
    expect(mixedBallisticBaseDamage(100, 10, -20)).toBe(100)
    expect(mixedBallisticBaseDamage(100, 10, 200)).toBe(10)
    expect(mixedBallisticBaseDamage(100, 10, Number.NaN)).toBe(100)
  })
})

describe('ballisticDamageAfterArmor', () => {
  it('applies floor on mixed damage and after armor multiplier', () => {
    expect(ballisticDamageAfterArmor(100, 50, 55, 3, 3)).toBe(46)
  })

  it('returns zero when penetration is below armor', () => {
    expect(ballisticDamageAfterArmor(100, 50, 25, 2, 4)).toBe(0)
  })
})

describe('explosiveDamageAfterArmor', () => {
  it('uses fixed explosive AP value', () => {
    expect(EXPLOSIVE_AP).toBe(3)
    expect(explosiveDamageAfterArmor(100, 2, 0)).toBe(100)
    expect(explosiveDamageAfterArmor(100, 3, 0)).toBe(65)
    expect(explosiveDamageAfterArmor(100, 4, 0)).toBe(0)
  })

  it('applies explosive resistance percentage and clamps it', () => {
    expect(explosiveDamageAfterArmor(100, 2, 20)).toBe(80)
    expect(explosiveDamageAfterArmor(100, 2, -30)).toBe(100)
    expect(explosiveDamageAfterArmor(100, 2, 150)).toBe(0)
    expect(explosiveDamageAfterArmor(100, 2, Number.POSITIVE_INFINITY)).toBe(100)
  })
})

describe('clampPercent', () => {
  it('clamps values into 0..100 range', () => {
    expect(clampPercent(-10)).toBe(0)
    expect(clampPercent(37)).toBe(37)
    expect(clampPercent(140)).toBe(100)
  })

  it('returns 0 for non-finite values', () => {
    expect(clampPercent(Number.NaN)).toBe(0)
    expect(clampPercent(Number.POSITIVE_INFINITY)).toBe(0)
    expect(clampPercent(Number.NEGATIVE_INFINITY)).toBe(0)
  })
})

describe('clampArmor', () => {
  it('rounds and clamps values into 0..10 range', () => {
    expect(clampArmor(-2)).toBe(0)
    expect(clampArmor(3.4)).toBe(3)
    expect(clampArmor(3.5)).toBe(4)
    expect(clampArmor(12.2)).toBe(10)
  })

  it('returns 0 for non-finite values', () => {
    expect(clampArmor(Number.NaN)).toBe(0)
    expect(clampArmor(Number.POSITIVE_INFINITY)).toBe(0)
    expect(clampArmor(Number.NEGATIVE_INFINITY)).toBe(0)
  })
})

describe('shotsToKill', () => {
  it('returns 0 when hp is already depleted', () => {
    expect(shotsToKill(0, 10)).toBe(0)
    expect(shotsToKill(-20, 10)).toBe(0)
  })

  it('returns null for non-positive damage per shot', () => {
    expect(shotsToKill(100, 0)).toBeNull()
    expect(shotsToKill(100, -10)).toBeNull()
  })

  it('returns the ceiling of hp divided by damage', () => {
    expect(shotsToKill(100, 30)).toBe(4)
    expect(shotsToKill(90, 30)).toBe(3)
  })
})

describe('railgunChargeDamageMultiplier', () => {
  it('stays at safe-mode multiplier up to 0.45s', () => {
    expect(railgunChargeDamageMultiplier(0)).toBe(1)
    expect(railgunChargeDamageMultiplier(0.45)).toBe(1)
  })

  it('matches spreadsheet-style unsafe formula with truncation', () => {
    expect(railgunChargeDamageMultiplier(1)).toBe(1.3)
    expect(railgunChargeDamageMultiplier(2.5)).toBe(2.2)
    expect(railgunChargeDamageMultiplier(3)).toBe(2.5)
  })

  it('clamps invalid and over-range values', () => {
    expect(railgunChargeDamageMultiplier(Number.NaN)).toBe(1)
    expect(railgunChargeDamageMultiplier(Number.POSITIVE_INFINITY)).toBe(1)
    expect(railgunChargeDamageMultiplier(99)).toBe(2.5)
  })
})
