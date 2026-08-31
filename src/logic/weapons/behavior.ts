import type {
  ChargeProfile,
  SupportWeaponPreset,
} from "../../data/supportWeapons";
import { roundTo2 } from "../shared/numbers";
import {
  chargeDamageMultiplier,
  chargeHeatPercent,
  clampChargeSeconds,
} from "./charge";

/** Per-shot input a weapon may expose to the player (charge today; spool-up, heat, burst later). */
export type WeaponTuning = {
  chargeSeconds: number;
};

export const DEFAULT_WEAPON_TUNING: WeaponTuning = { chargeSeconds: 0 };

export type ChargeControlModel = {
  kind: "charge";
  label: string;
  seconds: number;
  maxSeconds: number;
  maxDamageSeconds: number;
  safeModeEndSeconds: number;
  criticalStartSeconds: number;
  percent: number;
  multiplier: number;
  safeHoldPercent: number;
  dangerPercent: number;
  explosionPercent: number;
  baseStandardDamage: number;
  baseDurableDamage: number;
  chargedStandardDamage: number;
  chargedDurableDamage: number;
};

export type WeaponControlModel = ChargeControlModel | { kind: "none" };

/** Everything weapon-specific the rest of the app is allowed to know about a weapon. */
export type WeaponBehavior = {
  clampTuning: (tuning: WeaponTuning) => WeaponTuning;
  damageMultiplier: (tuning: WeaponTuning) => number;
  controlModel: (tuning: WeaponTuning) => WeaponControlModel;
};

const PLAIN_WEAPON: WeaponBehavior = {
  clampTuning: () => DEFAULT_WEAPON_TUNING,
  damageMultiplier: () => 1,
  controlModel: () => ({ kind: "none" }),
};

function chargedWeaponBehavior(
  weapon: SupportWeaponPreset,
  profile: ChargeProfile,
): WeaponBehavior {
  return {
    clampTuning: (tuning) => ({
      chargeSeconds: clampChargeSeconds(profile, tuning.chargeSeconds),
    }),

    damageMultiplier: (tuning) =>
      chargeDamageMultiplier(profile, tuning.chargeSeconds),

    controlModel: (tuning) => {
      const seconds = clampChargeSeconds(profile, tuning.chargeSeconds);
      const multiplier = chargeDamageMultiplier(profile, seconds);
      return {
        kind: "charge",
        label: "Charge",
        seconds,
        multiplier,
        percent: chargeHeatPercent(profile, seconds),
        maxSeconds: profile.maxChargeSeconds,
        maxDamageSeconds: profile.maxDamageSeconds,
        safeModeEndSeconds: profile.safeModeEndSeconds,
        criticalStartSeconds: profile.criticalStartSeconds,
        safeHoldPercent: profile.safeHoldPercent,
        dangerPercent: profile.dangerPercent,
        explosionPercent: profile.explosionPercent,
        baseStandardDamage: weapon.standardDamage,
        baseDurableDamage: weapon.durableDamage,
        chargedStandardDamage: roundTo2(weapon.standardDamage * multiplier),
        chargedDurableDamage: roundTo2(weapon.durableDamage * multiplier),
      };
    },
  };
}

export function weaponBehaviorFor(
  weapon: SupportWeaponPreset | undefined,
): WeaponBehavior {
  if (weapon?.chargeProfile) {
    return chargedWeaponBehavior(weapon, weapon.chargeProfile);
  }
  return PLAIN_WEAPON;
}
