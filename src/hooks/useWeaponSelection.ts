import { useMemo, useState } from "react";
import { SUPPORT_WEAPON_PRESETS } from "../data/supportWeapons";
import {
  DEFAULT_WEAPON_TUNING,
  resolveManualWeapon,
  resolveWikiWeapon,
  weaponBehaviorFor,
  type WeaponTuning,
} from "../logic/weapons";
import type { DamageMode, EntryMode, WeaponShot } from "../types";

export function useWeaponSelection(entryMode: EntryMode) {
  const [weaponId, setWeaponId] = useState(SUPPORT_WEAPON_PRESETS[0]?.id ?? "");
  const [tuning, setTuning] = useState<WeaponTuning>(DEFAULT_WEAPON_TUNING);

  const [standardDmg, setStandardDmg] = useState("95");
  const [durableDmg, setDurableDmg] = useState("23");
  const [penetration, setPenetration] = useState("2");
  const [explosiveDmg, setExplosiveDmg] = useState("150");
  const [damageMode, setDamageMode] = useState<DamageMode>("ballistic");

  const selectedWeapon = useMemo(
    () => SUPPORT_WEAPON_PRESETS.find((weapon) => weapon.id === weaponId),
    [weaponId],
  );

  const behavior = useMemo(
    () => weaponBehaviorFor(selectedWeapon),
    [selectedWeapon],
  );

  const activeTuning = behavior.clampTuning(tuning);

  const shot: WeaponShot =
    entryMode === "wiki"
      ? resolveWikiWeapon(selectedWeapon, behavior.damageMultiplier(activeTuning))
      : resolveManualWeapon({
          standardDamage: standardDmg,
          durableDamage: durableDmg,
          penetration,
          explosiveDamage: explosiveDmg,
          damageMode,
        });

  function handleWeaponChange(id: string) {
    setWeaponId(id);
    setTuning(DEFAULT_WEAPON_TUNING);
  }

  function handleChargeSecondsChange(seconds: number) {
    setTuning(behavior.clampTuning({ chargeSeconds: seconds }));
  }

  return {
    shot,
    weaponCardProps: {
      entryMode,
      manual: {
        damageMode,
        onDamageModeChange: setDamageMode,
        standardDmg,
        onStandardDmgChange: setStandardDmg,
        durableDmg,
        onDurableDmgChange: setDurableDmg,
        penetration,
        onPenetrationChange: setPenetration,
        explosiveDmg,
        onExplosiveDmgChange: setExplosiveDmg,
      },
      wiki: {
        wikiWeaponId: weaponId,
        onWikiWeaponChange: handleWeaponChange,
        weapons: SUPPORT_WEAPON_PRESETS,
        selectedWeapon,
        control: behavior.controlModel(activeTuning),
        onChargeSecondsChange: handleChargeSecondsChange,
      },
    },
  };
}
