import { useState } from "react";
import { calculateShot } from "../logic/damage";
import type { EntryMode } from "../types";
import { useTargetSelection } from "./useTargetSelection";
import { useWeaponSelection } from "./useWeaponSelection";

export function useShotCalculator() {
  const [entryMode, setEntryMode] = useState<EntryMode>("wiki");

  const target = useTargetSelection(entryMode);
  const weapon = useWeaponSelection(entryMode);

  const outcome = calculateShot({ ...target.stats, ...weapon.shot });
  const isMissingWeapon =
    entryMode === "wiki" &&
    (weapon.catalogStatus === "loading" ||
      weapon.catalogStatus === "unavailable");

  return {
    entryMode,
    setEntryMode,
    outcome,
    isMissingWeapon,
    catalogStatus: weapon.catalogStatus,
    catalogDataVersion: weapon.catalogDataVersion,
    targetCardProps: target.targetCardProps,
    weaponCardProps: weapon.weaponCardProps,
  };
}
