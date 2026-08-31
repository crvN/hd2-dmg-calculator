import type { ChargeProfile } from "../../data/supportWeapons";

type ChargeCurveFn = (profile: ChargeProfile, chargeSeconds: number) => number;

export function clampChargeSeconds(
  profile: ChargeProfile,
  chargeSeconds: number,
): number {
  if (!Number.isFinite(chargeSeconds)) return 0;
  return Math.min(profile.maxChargeSeconds, Math.max(0, chargeSeconds));
}

/** Damage ramps linearly between damageRampStartSeconds and maxDamageSeconds. */
function linearChargeMultiplier(
  profile: ChargeProfile,
  chargeSeconds: number,
): number {
  if (chargeSeconds <= profile.damageRampStartSeconds + Number.EPSILON) return 1;
  const rampDuration =
    profile.maxDamageSeconds - profile.damageRampStartSeconds;
  if (rampDuration <= 0) return profile.maxDamageMultiplier;
  const rampedSeconds = Math.min(chargeSeconds, profile.maxDamageSeconds);
  const ratio = (rampedSeconds - profile.damageRampStartSeconds) / rampDuration;
  return 1 + (profile.maxDamageMultiplier - 1) * ratio;
}

/**
 * Spreadsheet-aligned railgun unsafe multiplier:
 * IF(t > 0.45, TRUNC((1 + (t - 0.5) / 1.6666) * 100) / 100, 1)
 */
export function railgunUnsafeChargeMultiplier(chargeSeconds: number): number {
  if (!Number.isFinite(chargeSeconds) || chargeSeconds <= 0.45) return 1;
  const unsafePercent = Math.trunc((1 + (chargeSeconds - 0.5) / 1.6666) * 100);
  return Math.min(2.5, Math.max(1, unsafePercent / 100));
}

const CHARGE_CURVES: Record<string, ChargeCurveFn> = {
  linear: linearChargeMultiplier,
  "railgun-unsafe": (_profile, chargeSeconds) =>
    railgunUnsafeChargeMultiplier(chargeSeconds),
};

export function chargeDamageMultiplier(
  profile: ChargeProfile,
  chargeSeconds: number,
): number {
  const seconds = clampChargeSeconds(profile, chargeSeconds);
  const curve =
    CHARGE_CURVES[profile.curve ?? "linear"] ?? linearChargeMultiplier;
  return curve(profile, seconds);
}

function ratioBetween(start: number, end: number, value: number): number {
  if (end <= start) return 1;
  return (value - start) / (end - start);
}

function percentBetween(
  startPercent: number,
  endPercent: number,
  ratio: number,
): number {
  return Math.round(startPercent + ratio * (endPercent - startPercent));
}

/** Heat/charge gauge shown to the player, in percent of the explosion threshold. */
export function chargeHeatPercent(
  profile: ChargeProfile,
  chargeSeconds: number,
): number {
  const seconds = clampChargeSeconds(profile, chargeSeconds);
  if (seconds <= 0) return 0;

  if (profile.safeModeEndSeconds > 0 && seconds <= profile.safeModeEndSeconds) {
    return Math.round(
      (seconds / profile.safeModeEndSeconds) * profile.safeHoldPercent,
    );
  }
  if (seconds <= profile.criticalStartSeconds) {
    const ratio = ratioBetween(
      profile.safeModeEndSeconds,
      profile.criticalStartSeconds,
      seconds,
    );
    return percentBetween(profile.safeHoldPercent, profile.dangerPercent, ratio);
  }
  if (seconds <= profile.maxChargeSeconds) {
    const ratio = ratioBetween(
      profile.criticalStartSeconds,
      profile.maxChargeSeconds,
      seconds,
    );
    return percentBetween(
      profile.dangerPercent,
      profile.explosionPercent,
      ratio,
    );
  }
  return profile.explosionPercent;
}
