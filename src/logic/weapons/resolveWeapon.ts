import type { SupportWeaponPreset } from "../../data/supportWeapons";
import type { DamageMode, WeaponShot } from "../../types";
import { toNumber } from "../shared/numbers";

/** Raw text fields from the manual weapon form. */
export type ManualWeaponFields = {
  standardDamage: string;
  durableDamage: string;
  penetration: string;
  explosiveDamage: string;
  damageMode: DamageMode;
};

export function resolveManualWeapon(fields: ManualWeaponFields): WeaponShot {
  return {
    standardDamage: toNumber(fields.standardDamage),
    durableDamage: toNumber(fields.durableDamage),
    penetration: toNumber(fields.penetration),
    explosiveDamage: toNumber(fields.explosiveDamage),
    damageMode: fields.damageMode,
  };
}

export function resolveWikiWeapon(
  weapon: SupportWeaponPreset | undefined,
  damageMultiplier: number,
): WeaponShot {
  return {
    standardDamage: (weapon?.standardDamage ?? 0) * damageMultiplier,
    durableDamage: (weapon?.durableDamage ?? 0) * damageMultiplier,
    penetration: weapon?.penetration ?? 0,
    explosiveDamage: weapon?.explosiveDamage ?? 0,
    damageMode: weapon?.damageMode ?? "ballistic",
  };
}
