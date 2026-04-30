/**
 * Maps wiki.gg armor penetration / armor value tier names to the game's 0–10 scale.
 * @see https://helldivers.wiki.gg/wiki/Damage#Armor_Penetration_&_Armor_Values
 */
const TIER_TO_VALUE: Record<string, number> = {
  'no hitbox': -1,
  unarmored: 0,
  'unarmored i': 0,
  'unarmored ii': 1,
  light: 2,
  medium: 3,
  heavy: 4,
  'anti-tank i': 5,
  'anti-tank ii': 6,
  'anti-tank iii': 7,
  'anti-tank iv': 8,
  'anti-tank v': 9,
  'anti-tank vi': 10,
  'tank i': 5,
  'tank ii': 6,
  'tank iii': 7,
  'tank iv': 8,
  'tank v': 9,
  'tank vi': 10,
  indestructible: 99,
}

function normalizeTierKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Returns armor or penetration value 0–10, or null if unknown (exact / normalized tier names only). */
export function armorValueFromWikiTier(tierName: string): number | null {
  const k = normalizeTierKey(tierName)
  if (k in TIER_TO_VALUE) return TIER_TO_VALUE[k]!
  return null
}
