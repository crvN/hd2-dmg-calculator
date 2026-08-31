import { useMemo, useState } from "react";
import {
  enemiesForWikiFaction,
  WIKI_FACTIONS,
  type WikiFactionId,
} from "../data";
import { resolveManualTarget, resolveWikiTarget } from "../logic/targets";
import type { EntryMode, TargetStats } from "../types";

const INITIAL_FACTION: WikiFactionId = "terminids";

export function useTargetSelection(entryMode: EntryMode) {
  const initialEnemies = enemiesForWikiFaction(INITIAL_FACTION);

  const [factionId, setFactionId] = useState<WikiFactionId>(INITIAL_FACTION);
  const [enemyId, setEnemyId] = useState(initialEnemies[0]?.id ?? "");
  const [partId, setPartId] = useState(initialEnemies[0]?.parts[0]?.id ?? "");

  const [hp, setHp] = useState("100");
  const [durablePct, setDurablePct] = useState("30");
  const [armor, setArmor] = useState("2");
  const [explosiveResist, setExplosiveResist] = useState("0");

  const enemies = useMemo(
    () => enemiesForWikiFaction(factionId),
    [factionId],
  );

  const selectedEnemy = useMemo(
    () => enemies.find((enemy) => enemy.id === enemyId),
    [enemies, enemyId],
  );

  const selectedPart = useMemo(
    () =>
      selectedEnemy?.parts.find((part) => part.id === partId) ??
      selectedEnemy?.parts[0],
    [selectedEnemy, partId],
  );

  const stats: TargetStats =
    entryMode === "wiki"
      ? resolveWikiTarget(selectedPart)
      : resolveManualTarget({
          hitPoints: hp,
          durablePercent: durablePct,
          armorRating: armor,
          explosiveResistPercent: explosiveResist,
        });

  function handleFactionChange(id: WikiFactionId) {
    setFactionId(id);
    const firstEnemy = enemiesForWikiFaction(id)[0];
    if (!firstEnemy) return;
    setEnemyId(firstEnemy.id);
    setPartId(firstEnemy.parts[0]?.id ?? "");
  }

  function handleEnemyChange(id: string) {
    setEnemyId(id);
    const enemy = enemies.find((candidate) => candidate.id === id);
    setPartId(enemy?.parts[0]?.id ?? "");
  }

  return {
    stats,
    targetCardProps: {
      entryMode,
      manual: {
        hp,
        onHpChange: setHp,
        durablePct,
        onDurablePctChange: setDurablePct,
        armor,
        onArmorChange: setArmor,
        explosiveResist,
        onExplosiveResistChange: setExplosiveResist,
      },
      wiki: {
        wikiFactionId: factionId,
        wikiFactions: WIKI_FACTIONS,
        onWikiFactionChange: handleFactionChange,
        wikiEnemyId: enemyId,
        wikiPartId: partId,
        selectedEnemy,
        enemies,
        onWikiEnemyChange: handleEnemyChange,
        onWikiPartChange: setPartId,
      },
    },
  };
}
