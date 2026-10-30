import { useMemo, useState } from "react";
import {
  DEFAULT_WEAPON_TUNING,
  groupWeaponsByKind,
  resolveManualWeapon,
  resolveWikiWeapon,
  weaponBehaviorFor,
  type WeaponTuning,
} from "../logic/weapons";
import type { DamageMode, EntryMode, WeaponShot } from "../types";
import { useWeaponCatalog } from "./useWeaponCatalog";

export function useWeaponSelection(entryMode: EntryMode) {
  const { weapons, dataVersion, status } = useWeaponCatalog();

  const [groupKind, setGroupKind] = useState("");
  const [weaponId, setWeaponId] = useState("");
  const [tuning, setTuning] = useState<WeaponTuning>(DEFAULT_WEAPON_TUNING);

  const [standardDmg, setStandardDmg] = useState("95");
  const [durableDmg, setDurableDmg] = useState("23");
  const [penetration, setPenetration] = useState("2");
  const [explosiveDmg, setExplosiveDmg] = useState("150");
  const [damageMode, setDamageMode] = useState<DamageMode>("ballistic");

  const weaponGroups = useMemo(() => groupWeaponsByKind(weapons), [weapons]);

  const selectedGroup = useMemo(
    () => weaponGroups.find((group) => group.kind === groupKind) ?? weaponGroups[0],
    [weaponGroups, groupKind],
  );

  const selectedWeapon = useMemo(
    () =>
      selectedGroup?.weapons.find((weapon) => weapon.id === weaponId) ??
      selectedGroup?.weapons[0],
    [selectedGroup, weaponId],
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

  function handleGroupChange(kind: string) {
    setGroupKind(kind);
    handleWeaponChange("");
  }

  function handleChargeSecondsChange(seconds: number) {
    setTuning(behavior.clampTuning({ chargeSeconds: seconds }));
  }

  return {
    shot,
    catalogStatus: status,
    catalogDataVersion: dataVersion,
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
        weaponGroups,
        wikiGroupKind: selectedGroup?.kind ?? "",
        onWikiGroupChange: handleGroupChange,
        groupWeapons: selectedGroup?.weapons ?? [],
        wikiWeaponId: selectedWeapon?.id ?? "",
        onWikiWeaponChange: handleWeaponChange,
        selectedWeapon,
        control: behavior.controlModel(activeTuning),
        onChargeSecondsChange: handleChargeSecondsChange,
      },
    },
  };
}
