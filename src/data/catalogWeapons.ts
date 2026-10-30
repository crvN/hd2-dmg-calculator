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
  explosivePenetration: number;
  notes?: string;
  chargeProfile?: ChargeProfile;
};

export type WeaponOverride = {
  /** Friendly names for attacks the API only identifies by internal name. */
  attackLabels?: Record<string, string>;
  /** Attacks the app models another way, such as through the charge control. */
  excludedAttacks?: string[];
  /** Armor penetration of explosions that differ from the default, keyed by attack name. */
  explosivePenetration?: Record<string, number>;
  notes?: string;
  chargeProfile?: ChargeProfile;
};

/** The API lists no armor penetration for explosions, and most of them are AP 3. */
export const DEFAULT_EXPLOSIVE_PENETRATION = 3;

/** The API lists kinds and attacks but has no flag for whether a stratagem is offensive. */
export const EXCLUDED_STRATAGEM_KINDS = ["backpack"];

/** Utility stratagems whose only listed damage is the shell's direct hit. */
export const EXCLUDED_STRATAGEM_IDS = [
  "eagle-smoke-strike",
  "orbital-smoke-strike",
  "orbital-ems-strike",
];

/**
 * What the API does not provide, keyed by API stratagem id.
 * Explosive penetration values are from the "Weapon stats" sheet of DiversDex 2.3.
 */
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
    explosivePenetration: { "GR-8 P1 IE": 4 },
  },
  "ac-8-autocannon": {
    attackLabels: { "AC-8 P": "APHET" },
  },
  "md-17-anti-tank-mines": {
    explosivePenetration: { "ANTI-TANK MINES E": 5 },
  },
  "plas-45-epoch": {
    explosivePenetration: { "P3 IE": 5, "PLAS-45 P IE": 4 },
  },
  "eagle-500kg-bomb": { explosivePenetration: { "S P E": 6 } },
  "eagle-airstrike": { explosivePenetration: { "S P2 IE": 6 } },
  "eagle-strafing-run": { explosivePenetration: { "P5 IE": 6 } },
  "orbital-120mm-he-barrage": { explosivePenetration: { "S P18 IE": 5 } },
  "orbital-380mm-he-barrage": { explosivePenetration: { "S P22 IE": 6 } },
  "orbital-gatling-barrage": { explosivePenetration: { "S P16 IE": 6 } },
  "orbital-napalm-barrage": { explosivePenetration: { "S P20 IE": 5 } },
  "orbital-precision-strike": { explosivePenetration: { "S P13 IE": 6 } },
  "orbital-railcannon-strike": { explosivePenetration: { "S P26 E": 6 } },
  "orbital-walking-barrage": { explosivePenetration: { "S P22 IE": 6 } },
  "seaf-artillery": {
    explosivePenetration: { "S P8 IE": 6, "S P9 IE": 6, "S P10 IE": 10 },
  },
  "nux-223-hellbomb": { explosivePenetration: { Hellbomb: 10 } },
};
