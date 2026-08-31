import { useState } from "react";
import type { ChargeControlModel } from "../logic/weapons";

type ChargeControlsProps = {
  model: ChargeControlModel;
  onSecondsChange: (seconds: number) => void;
};

export function ChargeControls({ model, onSecondsChange }: ChargeControlsProps) {
  const [secondsDraft, setSecondsDraft] = useState<string | null>(null);

  const safeStopPercent = (model.safeModeEndSeconds / model.maxSeconds) * 100;
  const dangerStopPercent = (model.criticalStartSeconds / model.maxSeconds) * 100;
  const markerPercent = (model.seconds / model.maxSeconds) * 100;
  const breakpoints = [
    model.safeModeEndSeconds,
    model.maxDamageSeconds,
    model.criticalStartSeconds,
    model.maxSeconds,
  ]
    .filter((seconds) => seconds > 0 && seconds <= model.maxSeconds)
    .filter((seconds, index, all) => all.indexOf(seconds) === index)
    .sort((a, b) => a - b);

  function commitDraft(raw: string) {
    const parsed = Number(raw.replace(",", "."));
    if (Number.isFinite(parsed)) onSecondsChange(parsed);
  }

  return (
    <fieldset className="mode railgun-charge">
      <legend>{model.label}</legend>
      <label className="field">
        <span>Charge time (seconds)</span>
        <input
          type="text"
          inputMode="decimal"
          value={secondsDraft ?? String(model.seconds)}
          onFocus={() => setSecondsDraft((prev) => prev ?? String(model.seconds))}
          onBlur={() => {
            commitDraft(secondsDraft ?? "");
            setSecondsDraft(null);
          }}
          onChange={(e) => {
            setSecondsDraft(e.target.value);
            commitDraft(e.target.value);
          }}
        />
      </label>
      <label className="field">
        <span>Charge meter</span>
        <input
          type="range"
          min={0}
          max={model.maxSeconds}
          step={0.01}
          value={model.seconds}
          onChange={(e) => onSecondsChange(Number(e.target.value))}
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
        {breakpoints.map((seconds) => (
          <div
            key={seconds}
            className="railgun-breakpoint"
            style={{ left: `${(seconds / model.maxSeconds) * 100}%` }}
          >
            <span className="railgun-breakpoint-line" />
            <span className="railgun-breakpoint-label">{seconds.toFixed(2)}s</span>
          </div>
        ))}
      </div>
      <div className="railgun-presets">
        <button type="button" onClick={() => onSecondsChange(model.safeModeEndSeconds)}>
          Safe ({model.safeModeEndSeconds.toFixed(2)}s)
        </button>
        <button type="button" onClick={() => onSecondsChange(model.maxDamageSeconds)}>
          Max dmg ({model.maxDamageSeconds.toFixed(2)}s)
        </button>
        <button type="button" onClick={() => onSecondsChange(model.maxSeconds)}>
          Overload ({model.maxSeconds.toFixed(2)}s)
        </button>
      </div>
      <dl className="railgun-dmg-preview">
        <dt>Current std / durable</dt>
        <dd>
          {model.chargedStandardDamage} / {model.chargedDurableDamage}
        </dd>
        <dt>Base std / durable</dt>
        <dd>
          {model.baseStandardDamage} / {model.baseDurableDamage}
        </dd>
      </dl>
      <p className="muted fineprint no-margin railgun-charge-meta">
        {model.percent}% charged, damage x{model.multiplier.toFixed(2)}.{" "}
        {model.percent >= model.explosionPercent
          ? "Overload (self-detonation risk)."
          : model.percent >= model.dangerPercent
            ? "Critical zone."
            : model.percent > model.safeHoldPercent
              ? "Overcharge."
              : "Safe hold range."}{" "}
        Safe hold ends at {model.safeModeEndSeconds.toFixed(2)}s, max damage at{" "}
        {model.maxDamageSeconds.toFixed(2)}s, overload at{" "}
        {model.maxSeconds.toFixed(2)}s.
      </p>
    </fieldset>
  );
}
