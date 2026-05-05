import { useMemo, useState } from "react";
import {
  EXPLOSIVE_AP,
  ballisticDamageAfterArmor,
  explosiveDamageAfterArmor,
  hitmarkerFor,
  shotsToKill,
} from "../damage";
import {
  enemiesForWikiFaction,
  WIKI_FACTIONS,
  type WikiFactionId,
} from "../data";
import { SUPPORT_WEAPON_PRESETS } from "../data/supportWeapons";
import type { DamageMode, EntryMode, ParsedResult } from "../types";

function num(v: string, fallback = 0): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

export function useShotCalculator() {
  const [entryMode, setEntryMode] = useState<EntryMode>("manual");

  const [wikiFactionId, setWikiFactionId] = useState<WikiFactionId>("terminids");
  const initialWikiEnemies = enemiesForWikiFaction("terminids");
  const [wikiEnemyId, setWikiEnemyId] = useState(initialWikiEnemies[0]!.id);
  const [wikiPartId, setWikiPartId] = useState(
    initialWikiEnemies[0]!.parts[0]!.id,
  );
  const [wikiWeaponId, setWikiWeaponId] = useState(
    SUPPORT_WEAPON_PRESETS[0]!.id,
  );

  const [hp, setHp] = useState("100");
  const [durablePct, setDurablePct] = useState("30");
  const [armor, setArmor] = useState("2");
  const [explosiveResist, setExplosiveResist] = useState("0");

  const [standardDmg, setStandardDmg] = useState("95");
  const [durableDmg, setDurableDmg] = useState("23");
  const [penetration, setPenetration] = useState("2");

  const [damageMode, setDamageMode] = useState<DamageMode>("ballistic");
  const [explosiveDmg, setExplosiveDmg] = useState("150");

  const wikiEnemyList = useMemo(
    () => enemiesForWikiFaction(wikiFactionId),
    [wikiFactionId],
  );

  const wikiPart = useMemo(() => {
    const enemy = wikiEnemyList.find((e) => e.id === wikiEnemyId);
    return enemy?.parts.find((p) => p.id === wikiPartId) ?? enemy?.parts[0];
  }, [wikiEnemyList, wikiEnemyId, wikiPartId]);

  const wikiWeapon = useMemo(
    () => SUPPORT_WEAPON_PRESETS.find((w) => w.id === wikiWeaponId),
    [wikiWeaponId],
  );

  const parsed = useMemo<ParsedResult>(() => {
    const fromWiki = entryMode === "wiki";
    const hpN = fromWiki ? (wikiPart?.hp ?? 0) : num(hp, 0);
    const dPct = fromWiki
      ? (wikiPart?.durablePercent ?? 0)
      : num(durablePct, 0);
    const armorN = fromWiki ? (wikiPart?.armorRating ?? 0) : num(armor, 0);
    const resN = fromWiki
      ? (wikiPart?.explosiveResistPercent ?? 0)
      : num(explosiveResist, 0);
    const std = fromWiki
      ? (wikiWeapon?.standardDamage ?? 0)
      : num(standardDmg, 0);
    const dur = fromWiki
      ? (wikiWeapon?.durableDamage ?? 0)
      : num(durableDmg, 0);
    const ap = fromWiki ? (wikiWeapon?.penetration ?? 0) : num(penetration, 0);
    const expD = fromWiki
      ? (wikiWeapon?.explosiveDamage ?? 0)
      : num(explosiveDmg, 0);
    const mode: DamageMode = fromWiki
      ? (wikiWeapon?.damageMode ?? "ballistic")
      : damageMode;

    let ballistic = 0;
    let explosive = 0;

    if (mode === "ballistic" || mode === "combined") {
      ballistic = ballisticDamageAfterArmor(std, dur, dPct, ap, armorN);
    }
    if (mode === "explosive" || mode === "combined") {
      explosive = explosiveDamageAfterArmor(expD, armorN, resN);
    }

    const total = ballistic + explosive;
    const shots = shotsToKill(hpN, total);

    const ballisticMarker = hitmarkerFor(ap, armorN);
    const explosiveMarker = hitmarkerFor(EXPLOSIVE_AP, armorN);

    return {
      hpN,
      dPct,
      armorN,
      resN,
      std,
      dur,
      ap,
      expD,
      ballistic,
      explosive,
      total,
      shots,
      ballisticMarker,
      explosiveMarker,
      damageModeEffective: mode,
    };
  }, [
    entryMode,
    wikiPart,
    wikiWeapon,
    hp,
    durablePct,
    armor,
    explosiveResist,
    standardDmg,
    durableDmg,
    penetration,
    damageMode,
    explosiveDmg,
  ]);

  const selectedEnemy = wikiEnemyList.find((e) => e.id === wikiEnemyId);
  const selectedWeapon = SUPPORT_WEAPON_PRESETS.find(
    (w) => w.id === wikiWeaponId,
  );

  function handleWikiFactionChange(id: WikiFactionId) {
    setWikiFactionId(id);
    const list = enemiesForWikiFaction(id);
    const first = list[0];
    if (first) {
      setWikiEnemyId(first.id);
      if (first.parts[0]) setWikiPartId(first.parts[0].id);
    }
  }

  function handleWikiEnemyChange(id: string) {
    setWikiEnemyId(id);
    const e = wikiEnemyList.find((x) => x.id === id);
    if (e?.parts[0]) setWikiPartId(e.parts[0].id);
  }

  return {
    entryMode,
    setEntryMode,
    parsed,
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
        wikiFactionId,
        wikiFactions: WIKI_FACTIONS,
        onWikiFactionChange: handleWikiFactionChange,
        wikiEnemyId,
        wikiPartId,
        selectedEnemy,
        enemies: wikiEnemyList,
        onWikiEnemyChange: handleWikiEnemyChange,
        onWikiPartChange: setWikiPartId,
      },
    },
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
        wikiWeaponId,
        onWikiWeaponChange: setWikiWeaponId,
        weapons: SUPPORT_WEAPON_PRESETS,
        selectedWeapon,
      },
    },
  };
}
