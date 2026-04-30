import { useMemo, useState } from 'react'
import {
  EXPLOSIVE_AP,
  ballisticDamageAfterArmor,
  explosiveDamageAfterArmor,
  hitmarkerFor,
  shotsToKill,
} from './damage'
import './App.css'

function num(v: string, fallback = 0): number {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : fallback
}

export default function App() {
  const [hp, setHp] = useState('100')
  const [durablePct, setDurablePct] = useState('30')
  const [armor, setArmor] = useState('2')
  const [explosiveResist, setExplosiveResist] = useState('0')

  const [standardDmg, setStandardDmg] = useState('95')
  const [durableDmg, setDurableDmg] = useState('23')
  const [penetration, setPenetration] = useState('2')

  const [damageMode, setDamageMode] = useState<'ballistic' | 'explosive' | 'combined'>('ballistic')
  const [explosiveDmg, setExplosiveDmg] = useState('150')

  const parsed = useMemo(() => {
    const hpN = num(hp, 0)
    const dPct = num(durablePct, 0)
    const armorN = num(armor, 0)
    const resN = num(explosiveResist, 0)
    const std = num(standardDmg, 0)
    const dur = num(durableDmg, 0)
    const ap = num(penetration, 0)
    const expD = num(explosiveDmg, 0)

    let ballistic = 0
    let explosive = 0

    if (damageMode === 'ballistic' || damageMode === 'combined') {
      ballistic = ballisticDamageAfterArmor(std, dur, dPct, ap, armorN)
    }
    if (damageMode === 'explosive' || damageMode === 'combined') {
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
    }
  }, [
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

  return (
    <div className="app">
      <header className="header">
        <h1>Helldivers 2 — shots to break</h1>
        <p className="subtitle">
          Armor (AP vs rating), durable mix, explosive AP3 and resistance. Educational helper; verify in-game.
        </p>
      </header>

      <div className="grid">
        <section className="card">
          <h2>Target (body part)</h2>
          <label className="field">
            <span>HP</span>
            <input inputMode="decimal" value={hp} onChange={(e) => setHp(e.target.value)} />
          </label>
          <label className="field">
            <span>Durability % (0–100)</span>
            <input
              inputMode="decimal"
              value={durablePct}
              onChange={(e) => setDurablePct(e.target.value)}
            />
            <small>How much of the hit uses durable damage vs standard (wiki part stat).</small>
          </label>
          <label className="field">
            <span>Armor rating (0–10)</span>
            <input inputMode="numeric" value={armor} onChange={(e) => setArmor(e.target.value)} />
          </label>
          <label className="field">
            <span>Explosive resistance % (0–100)</span>
            <input
              inputMode="decimal"
              value={explosiveResist}
              onChange={(e) => setExplosiveResist(e.target.value)}
            />
            <small>Reduces only the explosive portion of the hit.</small>
          </label>
        </section>

        <section className="card">
          <h2>Weapon</h2>
          <fieldset className="mode">
            <legend>Damage profile</legend>
            <label className="radio">
              <input
                type="radio"
                name="mode"
                checked={damageMode === 'ballistic'}
                onChange={() => setDamageMode('ballistic')}
              />
              Ballistic / non-explosive only
            </label>
            <label className="radio">
              <input
                type="radio"
                name="mode"
                checked={damageMode === 'explosive'}
                onChange={() => setDamageMode('explosive')}
              />
              Explosive only (AP {EXPLOSIVE_AP})
            </label>
            <label className="radio">
              <input
                type="radio"
                name="mode"
                checked={damageMode === 'combined'}
                onChange={() => setDamageMode('combined')}
              />
              Combined (ballistic + separate explosive value)
            </label>
          </fieldset>

          {(damageMode === 'ballistic' || damageMode === 'combined') && (
            <>
              <label className="field">
                <span>Standard damage</span>
                <input
                  inputMode="decimal"
                  value={standardDmg}
                  onChange={(e) => setStandardDmg(e.target.value)}
                />
              </label>
              <label className="field">
                <span>Durable damage</span>
                <input
                  inputMode="decimal"
                  value={durableDmg}
                  onChange={(e) => setDurableDmg(e.target.value)}
                />
              </label>
              <label className="field">
                <span>Armor penetration (0–10)</span>
                <input
                  inputMode="numeric"
                  value={penetration}
                  onChange={(e) => setPenetration(e.target.value)}
                />
              </label>
            </>
          )}

          {(damageMode === 'explosive' || damageMode === 'combined') && (
            <label className="field">
              <span>Explosive damage (listed explosive)</span>
              <input
                inputMode="decimal"
                value={explosiveDmg}
                onChange={(e) => setExplosiveDmg(e.target.value)}
              />
              <small>
                Explosive uses AP {EXPLOSIVE_AP} vs armor, then × (1 − explosive resistance). Listed value is
                applied as full “explosive” damage (no standard/durable split on this portion).
              </small>
            </label>
          )}
        </section>
      </div>

      <section className="card result">
        <h2>Result</h2>
        <div className="result-main">
          {parsed.shots === null ? (
            <p className="warn">No damage per shot (ricochet or zero inputs). Cannot reach HP.</p>
          ) : (
            <p className="shots">
              Shots required: <strong>{parsed.shots}</strong>
            </p>
          )}
        </div>
        <dl className="breakdown">
          {(damageMode === 'ballistic' || damageMode === 'combined') && (
            <>
              <dt>Ballistic damage / shot</dt>
              <dd>
                {parsed.ballistic}{' '}
                <span className={`tag tag-${parsed.ballisticMarker}`}>{parsed.ballisticMarker}</span>
              </dd>
            </>
          )}
          {(damageMode === 'explosive' || damageMode === 'combined') && (
            <>
              <dt>Explosive damage / shot</dt>
              <dd>
                {parsed.explosive}{' '}
                <span className={`tag tag-${parsed.explosiveMarker}`}>{parsed.explosiveMarker}</span>
                <span className="muted"> (AP {EXPLOSIVE_AP})</span>
              </dd>
            </>
          )}
          <dt>Total damage / shot</dt>
          <dd>{parsed.total}</dd>
        </dl>
        <p className="muted fineprint">
          Ballistic: floor( floor(Std×(1−D%) + Dur×D%) × armor mult ). Explosive: floor(Exp × armor mult × (1−resist)).
          Armor mult: AP &gt; armor → 100%, AP = armor → 65%, AP &lt; armor → 0%.
        </p>
      </section>
    </div>
  )
}
