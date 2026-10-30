import type { DamageMode } from "../types";

/** Named damage curve applied while charging; defaults to a linear ramp. */
export type ChargeCurve = "linear" | "railgun-unsafe";

export type ChargeProfile = {
  maxChargeSeconds: number;
  maxDamageSeconds: number;
  damageRampStartSeconds: number;
  safeModeEndSeconds: number;
  criticalStartSeconds: number;
  safeHoldPercent: number;
  dangerPercent: number;
  explosionPercent: number;
  maxDamageMultiplier: number;
  curve?: ChargeCurve;
};

export type CatalogWeapon = {
  id: string;
  name: string;
  kind: string;
  imageUrl?: string;
  standardDamage: number;
  durableDamage: number;
  penetration: number;
  damageMode: DamageMode;
  explosiveDamage: number;
  notes?: string;
  chargeProfile?: ChargeProfile;
};

export type WeaponOverride = {
  /** Friendly names for attacks the API only identifies by internal name. */
  attackLabels?: Record<string, string>;
  /** Attacks the app models another way, such as through the charge control. */
  excludedAttacks?: string[];
  notes?: string;
  chargeProfile?: ChargeProfile;
};

/** The API lists kinds and attacks but has no flag for whether a stratagem is offensive. */
export const EXCLUDED_STRATAGEM_KINDS = ["backpack"];

/** Utility stratagems whose only listed damage is the shell's direct hit. */
export const EXCLUDED_STRATAGEM_IDS = [
  "eagle-smoke-strike",
  "orbital-smoke-strike",
  "orbital-ems-strike",
];

/** What the API does not provide, keyed by API stratagem id. */
export const WEAPON_OVERRIDES: Record<string, WeaponOverride> = {
  "rs-422-railgun": {
    excludedAttacks: ["Railgun Max Charge"],
    notes:
      "Safe mode sits at 60% charge. Unsafe mode scales up to 2.5x damage at 2.5s; at 3.0s (100%) the gun explodes.",
    chargeProfile: {
      maxChargeSeconds: 3,
      maxDamageSeconds: 2.5,
      damageRampStartSeconds: 0.5,
      safeModeEndSeconds: 0.45,
      criticalStartSeconds: 2.5,
      safeHoldPercent: 60,
      dangerPercent: 90,
      explosionPercent: 100,
      maxDamageMultiplier: 2.5,
      curve: "railgun-unsafe",
    },
  },
  "gr-8-recoilless-rifle": {
    attackLabels: { "GR-8 P": "HEAT", "GR-8 P1": "HE" },
  },
  "ac-8-autocannon": {
    attackLabels: { "AC-8 P": "APHET" },
  },
};
