import type { SupportWeaponPreset } from "../../data/supportWeapons";
import { DEFAULT_WEAPON_TUNING, weaponBehaviorFor } from "./behavior";

const plainWeapon: SupportWeaponPreset = {
  id: "mg-43",
  name: "MG-43",
  standardDamage: 90,
  durableDamage: 23,
  penetration: 3,
  damageMode: "ballistic",
  explosiveDamage: 0,
};

const chargedWeapon: SupportWeaponPreset = {
  ...plainWeapon,
  id: "rs-422",
  name: "Railgun",
  standardDamage: 600,
  durableDamage: 225,
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
};

describe("weaponBehaviorFor", () => {
  it("gives weapons without a special profile a flat multiplier and no control", () => {
    const behavior = weaponBehaviorFor(plainWeapon);

    expect(behavior.damageMultiplier({ chargeSeconds: 2 })).toBe(1);
    expect(behavior.controlModel(DEFAULT_WEAPON_TUNING).kind).toBe("none");
  });

  it("falls back to plain behavior when no weapon is selected", () => {
    expect(
      weaponBehaviorFor(undefined).damageMultiplier({ chargeSeconds: 2 }),
    ).toBe(1);
  });

  it("exposes a charge control for charged weapons", () => {
    const control = weaponBehaviorFor(chargedWeapon).controlModel({
      chargeSeconds: 1,
    });

    expect(control.kind).toBe("charge");
    if (control.kind !== "charge") return;
    expect(control.multiplier).toBe(1.3);
    expect(control.chargedStandardDamage).toBe(780);
    expect(control.chargedDurableDamage).toBe(292.5);
  });

  it("clamps tuning to the weapon charge window", () => {
    const behavior = weaponBehaviorFor(chargedWeapon);

    expect(behavior.clampTuning({ chargeSeconds: 9 })).toEqual({
      chargeSeconds: 3,
    });
    expect(behavior.clampTuning({ chargeSeconds: -1 })).toEqual({
      chargeSeconds: 0,
    });
  });

  it("ignores tuning for weapons that have no controls", () => {
    expect(
      weaponBehaviorFor(plainWeapon).clampTuning({ chargeSeconds: 9 }),
    ).toEqual(DEFAULT_WEAPON_TUNING);
  });
});
