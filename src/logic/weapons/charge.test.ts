import type { ChargeProfile } from "../../data/supportWeapons";
import {
  chargeDamageMultiplier,
  chargeHeatPercent,
  clampChargeSeconds,
  railgunUnsafeChargeMultiplier,
} from "./charge";

const linearProfile: ChargeProfile = {
  maxChargeSeconds: 2,
  maxDamageSeconds: 2,
  damageRampStartSeconds: 0,
  safeModeEndSeconds: 1,
  criticalStartSeconds: 1.5,
  safeHoldPercent: 50,
  dangerPercent: 90,
  explosionPercent: 100,
  maxDamageMultiplier: 3,
};

const railgunProfile: ChargeProfile = {
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
};

describe("clampChargeSeconds", () => {
  it("clamps into the profile charge window", () => {
    expect(clampChargeSeconds(linearProfile, -1)).toBe(0);
    expect(clampChargeSeconds(linearProfile, 1.2)).toBe(1.2);
    expect(clampChargeSeconds(linearProfile, 9)).toBe(2);
  });

  it("returns 0 for non-finite values", () => {
    expect(clampChargeSeconds(linearProfile, Number.NaN)).toBe(0);
  });
});

describe("railgunUnsafeChargeMultiplier", () => {
  it("stays at safe-mode multiplier up to 0.45s", () => {
    expect(railgunUnsafeChargeMultiplier(0)).toBe(1);
    expect(railgunUnsafeChargeMultiplier(0.45)).toBe(1);
  });

  it("matches spreadsheet-style unsafe formula with truncation", () => {
    expect(railgunUnsafeChargeMultiplier(1)).toBe(1.3);
    expect(railgunUnsafeChargeMultiplier(2.5)).toBe(2.2);
    expect(railgunUnsafeChargeMultiplier(3)).toBe(2.5);
  });

  it("clamps invalid and over-range values", () => {
    expect(railgunUnsafeChargeMultiplier(Number.NaN)).toBe(1);
    expect(railgunUnsafeChargeMultiplier(Number.POSITIVE_INFINITY)).toBe(1);
    expect(railgunUnsafeChargeMultiplier(99)).toBe(2.5);
  });
});

describe("chargeDamageMultiplier", () => {
  it("ramps linearly to the max multiplier by default", () => {
    expect(chargeDamageMultiplier(linearProfile, 0)).toBe(1);
    expect(chargeDamageMultiplier(linearProfile, 1)).toBe(2);
    expect(chargeDamageMultiplier(linearProfile, 2)).toBe(3);
  });

  it("holds the max multiplier past the damage cap", () => {
    expect(chargeDamageMultiplier(linearProfile, 5)).toBe(3);
  });

  it("uses the railgun unsafe curve when the profile selects it", () => {
    expect(chargeDamageMultiplier(railgunProfile, 0.45)).toBe(1);
    expect(chargeDamageMultiplier(railgunProfile, 1)).toBe(1.3);
    expect(chargeDamageMultiplier(railgunProfile, 3)).toBe(2.5);
  });
});

describe("chargeHeatPercent", () => {
  it("fills the safe segment first", () => {
    expect(chargeHeatPercent(linearProfile, 0)).toBe(0);
    expect(chargeHeatPercent(linearProfile, 0.5)).toBe(25);
    expect(chargeHeatPercent(linearProfile, 1)).toBe(50);
  });

  it("interpolates through the danger segment", () => {
    expect(chargeHeatPercent(linearProfile, 1.25)).toBe(70);
    expect(chargeHeatPercent(linearProfile, 1.5)).toBe(90);
  });

  it("reaches the explosion percent at max charge", () => {
    expect(chargeHeatPercent(linearProfile, 2)).toBe(100);
    expect(chargeHeatPercent(linearProfile, 99)).toBe(100);
  });
});
