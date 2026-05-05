import { useState } from "react";

export type RailgunChargeModel = {
  active: boolean;
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
  onChange: (value: number) => void;
};

type RailgunChargeControlsProps = {
  charge: RailgunChargeModel;
};

export function RailgunChargeControls({ charge }: RailgunChargeControlsProps) {
  const [chargeInputDraft, setChargeInputDraft] = useState<string | null>(null);

  const safeSeconds = charge.safeModeEndSeconds;
  const dangerSeconds = charge.criticalStartSeconds;
  const safeStopPercent = (safeSeconds / charge.maxSeconds) * 100;
  const dangerStopPercent = (dangerSeconds / charge.maxSeconds) * 100;
  const markerPercent = (charge.seconds / charge.maxSeconds) * 100;
  const breakpoints = [safeSeconds, 1, 1.5, 2, dangerSeconds, charge.maxSeconds]
    .filter((t) => t > 0 && t <= charge.maxSeconds)
    .filter((t, idx, arr) => arr.indexOf(t) === idx)
    .sort((a, b) => a - b);

  function handleChargeInputChange(raw: string) {
    setChargeInputDraft(raw);
    const parsed = Number(raw.replace(",", "."));
    if (Number.isFinite(parsed)) {
      charge.onChange(parsed);
    }
  }

  function handleChargeInputBlur() {
    const parsed = Number((chargeInputDraft ?? "").replace(",", "."));
    if (Number.isFinite(parsed)) {
      charge.onChange(parsed);
    }
    setChargeInputDraft(null);
  }

  return (
    <fieldset className="mode railgun-charge">
      <legend>Railgun charge</legend>
      <label className="field">
        <span>Charge time (seconds)</span>
        <input
          type="text"
          inputMode="decimal"
          value={chargeInputDraft ?? String(charge.seconds)}
          onFocus={() =>
            setChargeInputDraft((prev) => prev ?? String(charge.seconds))
          }
          onBlur={handleChargeInputBlur}
          onChange={(e) => handleChargeInputChange(e.target.value)}
        />
      </label>
      <label className="field">
        <span>Charge meter</span>
        <input
          type="range"
          min={0}
          max={charge.maxSeconds}
          step={0.01}
          value={charge.seconds}
          onChange={(e) => charge.onChange(Number(e.target.value))}
        />
      </label>
      <div
        className="railgun-zones"
        style={{
          background: `linear-gradient(to right,
                    rgba(70, 170, 85, 0.65) 0% ${safeStopPercent}%,
                    rgba(220, 180, 40, 0.65) ${safeStopPercent}% ${dangerStopPercent}%,
                    rgba(210, 70, 70, 0.75) ${dangerStopPercent}% 100%)`,
        }}
      >
        <div className="railgun-zone-marker" style={{ left: `${markerPercent}%` }} />
      </div>
      <div className="railgun-breakpoints">
        {breakpoints.map((t) => (
          <div
            key={t}
            className="railgun-breakpoint"
            style={{ left: `${(t / charge.maxSeconds) * 100}%` }}
          >
            <span className="railgun-breakpoint-line" />
            <span className="railgun-breakpoint-label">{t.toFixed(2)}s</span>
          </div>
        ))}
      </div>
      <div className="railgun-presets">
        <button type="button" onClick={() => charge.onChange(safeSeconds)}>
          Safe ({safeSeconds.toFixed(2)}s)
        </button>
        <button type="button" onClick={() => charge.onChange(charge.maxDamageSeconds)}>
          Max dmg ({charge.maxDamageSeconds.toFixed(2)}s)
        </button>
        <button type="button" onClick={() => charge.onChange(charge.maxSeconds)}>
          Overload ({charge.maxSeconds.toFixed(2)}s)
        </button>
      </div>
      <dl className="railgun-dmg-preview">
        <dt>Current std / durable</dt>
        <dd>
          {charge.chargedStandardDamage} / {charge.chargedDurableDamage}
        </dd>
        <dt>Base std / durable</dt>
        <dd>
          {charge.baseStandardDamage} / {charge.baseDurableDamage}
        </dd>
      </dl>
      <p className="muted fineprint no-margin railgun-charge-meta">
        {charge.percent}% charged, damage x{charge.multiplier.toFixed(2)}.{" "}
        {charge.percent >= charge.explosionPercent
          ? "100%: overload (self-detonation risk)."
          : charge.percent >= charge.dangerPercent
            ? "Unsafe critical zone."
            : charge.percent > charge.safeHoldPercent
              ? "Unsafe overcharge."
              : "Safe hold range."}{" "}
        Safe mode ends at {safeSeconds.toFixed(2)}s (600/225 base damage). Max
        damage at {charge.maxDamageSeconds.toFixed(2)}s; overload at{" "}
        {charge.maxSeconds.toFixed(2)}s. (Critical zone after{" "}
        {dangerSeconds.toFixed(2)}s.)
      </p>
    </fieldset>
  );
}
