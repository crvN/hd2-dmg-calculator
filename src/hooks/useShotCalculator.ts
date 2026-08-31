import { useState } from "react";
import { calculateShot } from "../logic/damage";
import type { EntryMode } from "../types";
import { useTargetSelection } from "./useTargetSelection";
import { useWeaponSelection } from "./useWeaponSelection";

export function useShotCalculator() {
  const [entryMode, setEntryMode] = useState<EntryMode>("manual");

  const target = useTargetSelection(entryMode);
  const weapon = useWeaponSelection(entryMode);

  const outcome = calculateShot({ ...target.stats, ...weapon.shot });

  return {
    entryMode,
    setEntryMode,
    outcome,
    targetCardProps: target.targetCardProps,
    weaponCardProps: weapon.weaponCardProps,
  };
}
