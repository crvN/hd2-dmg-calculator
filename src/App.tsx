import { useMemo, useState } from 'react'
import {
  EXPLOSIVE_AP,
  ballisticDamageAfterArmor,
  explosiveDamageAfterArmor,
  hitmarkerFor,
  shotsToKill,
} from './damage'
import { SUPPORT_WEAPON_PRESETS } from './data/supportWeapons'
import { TERMINID_ENEMIES } from './data/terminidEnemies'
import { AppHeader } from './components/AppHeader'
import { EntryModeTabs } from './components/EntryModeTabs'
import { ResultCard } from './components/ResultCard'
import { TargetCard } from './components/TargetCard'
import { WeaponCard } from './components/WeaponCard'
import type { DamageMode, EntryMode, ParsedResult } from './types'
import './App.css'

function num(v: string, fallback = 0): number {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : fallback
}

export default function App() {
  const [entryMode, setEntryMode] = useState<EntryMode>('manual')

  const [wikiEnemyId, setWikiEnemyId] = useState(TERMINID_ENEMIES[0]!.id)
  const [wikiPartId, setWikiPartId] = useState(TERMINID_ENEMIES[0]!.parts[0]!.id)
  const [wikiWeaponId, setWikiWeaponId] = useState(SUPPORT_WEAPON_PRESETS[0]!.id)

  const [hp, setHp] = useState('100')
  const [durablePct, setDurablePct] = useState('30')
  const [armor, setArmor] = useState('2')
  const [explosiveResist, setExplosiveResist] = useState('0')

  const [standardDmg, setStandardDmg] = useState('95')
  const [durableDmg, setDurableDmg] = useState('23')
  const [penetration, setPenetration] = useState('2')

  const [damageMode, setDamageMode] = useState<DamageMode>('ballistic')
  const [explosiveDmg, setExplosiveDmg] = useState('150')

  const wikiPart = useMemo(() => {
    const enemy = TERMINID_ENEMIES.find((e) => e.id === wikiEnemyId)
    return enemy?.parts.find((p) => p.id === wikiPartId) ?? enemy?.parts[0]
  }, [wikiEnemyId, wikiPartId])

  const wikiWeapon = useMemo(
    () => SUPPORT_WEAPON_PRESETS.find((w) => w.id === wikiWeaponId),
    [wikiWeaponId],
  )

  const parsed = useMemo<ParsedResult>(() => {
    const fromWiki = entryMode === 'wiki'
    const hpN = fromWiki ? (wikiPart?.hp ?? 0) : num(hp, 0)
    const dPct = fromWiki ? (wikiPart?.durablePercent ?? 0) : num(durablePct, 0)
    const armorN = fromWiki ? (wikiPart?.armorRating ?? 0) : num(armor, 0)
    const resN = fromWiki ? (wikiPart?.explosiveResistPercent ?? 0) : num(explosiveResist, 0)
    const std = fromWiki ? (wikiWeapon?.standardDamage ?? 0) : num(standardDmg, 0)
    const dur = fromWiki ? (wikiWeapon?.durableDamage ?? 0) : num(durableDmg, 0)
    const ap = fromWiki ? (wikiWeapon?.penetration ?? 0) : num(penetration, 0)
    const expD = fromWiki ? (wikiWeapon?.explosiveDamage ?? 0) : num(explosiveDmg, 0)
    const mode: DamageMode = fromWiki ? (wikiWeapon?.damageMode ?? 'ballistic') : damageMode

    let ballistic = 0
    let explosive = 0

    if (mode === 'ballistic' || mode === 'combined') {
      ballistic = ballisticDamageAfterArmor(std, dur, dPct, ap, armorN)
    }
    if (mode === 'explosive' || mode === 'combined') {
      explosive = explosiveDamageAfterArmor(expD, armorN, resN)
    }

    const total = ballistic + explosive
    const shots = shotsToKill(hpN, total)

    const ballisticMarker = hitmarkerFor(ap, armorN)
    const explosiveMarker = hitmarkerFor(EXPLOSIVE_AP, armorN)

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
    }
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
  ])

  const selectedEnemy = TERMINID_ENEMIES.find((e) => e.id === wikiEnemyId)
  const selectedWeapon = SUPPORT_WEAPON_PRESETS.find((w) => w.id === wikiWeaponId)

  function handleWikiEnemyChange(id: string) {
    setWikiEnemyId(id)
    const e = TERMINID_ENEMIES.find((x) => x.id === id)
    if (e?.parts[0]) setWikiPartId(e.parts[0].id)
  }

  return (
    <div className="app">
      <AppHeader />
      <EntryModeTabs entryMode={entryMode} onChange={setEntryMode} />

      {entryMode === 'wiki' && (
        <p className="wiki-note muted">
          Support weapons and Terminid body parts from{' '}
          <a href="https://helldivers.wiki.gg/wiki/Stratagems">Stratagems</a> /{' '}
          <a href="https://helldivers.wiki.gg/wiki/Terminids">Terminids</a>. Values are a curated snapshot; patch
          changes may drift.
        </p>
      )}

      <div className="grid">
        <TargetCard
          entryMode={entryMode}
          manual={{
            hp,
            onHpChange: setHp,
            durablePct,
            onDurablePctChange: setDurablePct,
            armor,
            onArmorChange: setArmor,
            explosiveResist,
            onExplosiveResistChange: setExplosiveResist,
          }}
          wiki={{
            wikiEnemyId,
            wikiPartId,
            selectedEnemy,
            enemies: TERMINID_ENEMIES,
            onWikiEnemyChange: handleWikiEnemyChange,
            onWikiPartChange: setWikiPartId,
          }}
        />
        <WeaponCard
          entryMode={entryMode}
          manual={{
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
          }}
          wiki={{
            wikiWeaponId,
            onWikiWeaponChange: setWikiWeaponId,
            weapons: SUPPORT_WEAPON_PRESETS,
            selectedWeapon,
          }}
        />
      </div>

      <ResultCard parsed={parsed} />
    </div>
  )
}
