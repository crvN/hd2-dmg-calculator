import type { DamageMode } from "../types";

export type SupportWeaponPreset = {
  id: string;
  name: string;
  standardDamage: number;
  durableDamage: number;
  penetration: number;
  damageMode: DamageMode;
  explosiveDamage: number;
  notes?: string;
  chargeProfile?: {
    maxChargeSeconds: number;
    maxDamageSeconds: number;
    damageRampStartSeconds: number;
    safeModeEndSeconds: number;
    criticalStartSeconds: number;
    safeHoldPercent: number;
    dangerPercent: number;
    explosionPercent: number;
    maxDamageMultiplier: number;
  };
};

export const SUPPORT_WEAPON_PRESETS: SupportWeaponPreset[] = [
  {
    id: "mg-43",
    name: "MG-43 Machine Gun",
    standardDamage: 90,
    durableDamage: 23,
    penetration: 3,
    damageMode: "ballistic",
    explosiveDamage: 0,
  },
  {
    id: "m-105",
    name: "M-105 Stalwart",
    standardDamage: 90,
    durableDamage: 22,
    penetration: 2,
    damageMode: "ballistic",
    explosiveDamage: 0,
  },
  {
    id: "mg-206",
    name: "MG-206 Heavy Machine Gun",
    standardDamage: 150,
    durableDamage: 35,
    penetration: 4,
    damageMode: "ballistic",
    explosiveDamage: 0,
  },
  {
    id: "apw-1",
    name: "APW-1 Anti-Materiel Rifle",
    standardDamage: 450,
    durableDamage: 225,
    penetration: 4,
    damageMode: "ballistic",
    explosiveDamage: 0,
  },
  {
    id: "las-98",
    name: "LAS-98 Laser Cannon (beam tick, laser vs armor)",
    standardDamage: 350,
    durableDamage: 200,
    penetration: 4,
    damageMode: "ballistic",
    explosiveDamage: 0,
    notes:
      "Wiki lists Laser type; this app treats the beam as ballistic for the same AP/durable formula.",
  },
  {
    id: "rs-422",
    name: "RS-422 Railgun",
    standardDamage: 600,
    durableDamage: 225,
    penetration: 5,
    damageMode: "ballistic",
    explosiveDamage: 0,
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
    },
  },
  {
    id: "eat-17",
    name: "EAT-17 Expendable Anti-Tank (HEAT)",
    standardDamage: 2000,
    durableDamage: 2000,
    penetration: 6,
    damageMode: "combined",
    explosiveDamage: 150,
  },
  {
    id: "las-99",
    name: "LAS-99 Quasar Cannon",
    standardDamage: 2000,
    durableDamage: 2000,
    penetration: 6,
    damageMode: "combined",
    explosiveDamage: 150,
  },
  {
    id: "ac-8-aphet",
    name: "AC-8 Autocannon (APHET shell)",
    standardDamage: 325,
    durableDamage: 260,
    penetration: 4,
    damageMode: "combined",
    explosiveDamage: 150,
  },
  {
    id: "gl-21",
    name: "GL-21 Grenade Launcher (inner explosion)",
    standardDamage: 0,
    durableDamage: 0,
    penetration: 4,
    damageMode: "explosive",
    explosiveDamage: 400,
    notes:
      "Impact projectile is 0 ballistic; inner AoE is 400 explosive at Medium pen vs armor (explosive portion still uses AP3 in this calculator).",
  },
  {
    id: "gr-8-heat",
    name: "GR-8 Recoilless Rifle (HEAT)",
    standardDamage: 3200,
    durableDamage: 3200,
    penetration: 6,
    damageMode: "combined",
    explosiveDamage: 150,
  },
  {
    id: "gr-8-he",
    name: "GR-8 Recoilless Rifle (HE)",
    standardDamage: 750,
    durableDamage: 750,
    penetration: 5,
    damageMode: "combined",
    explosiveDamage: 800,
  },
];
