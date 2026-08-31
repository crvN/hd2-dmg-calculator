import { EXPLOSIVE_AP } from '../logic/damage'
import type { ShotOutcome } from '../types'

type ResultCardProps = {
  outcome: ShotOutcome
}

export function ResultCard({ outcome }: ResultCardProps) {
  return (
    <section className="card result">
      <h2>Result</h2>
      <div className="result-main">
        {outcome.shotsToKill === null ? (
          <p className="warn">No damage per shot (ricochet or zero inputs). Cannot reach HP.</p>
        ) : (
          <p className="shots">
            Shots required: <strong>{outcome.shotsToKill}</strong>
          </p>
        )}
      </div>
      <dl className="breakdown">
        {(outcome.damageMode === 'ballistic' || outcome.damageMode === 'combined') && (
          <>
            <dt>Ballistic damage / shot</dt>
            <dd>
              {outcome.ballisticDamage}{' '}
              <span className={`tag tag-${outcome.ballisticMarker}`}>{outcome.ballisticMarker}</span>
            </dd>
          </>
        )}
        {(outcome.damageMode === 'explosive' || outcome.damageMode === 'combined') && (
          <>
            <dt>Explosive damage / shot</dt>
            <dd>
              {outcome.explosiveDamage}{' '}
              <span className={`tag tag-${outcome.explosiveMarker}`}>{outcome.explosiveMarker}</span>
              <span className="muted"> (AP {EXPLOSIVE_AP})</span>
            </dd>
          </>
        )}
        <dt>Total damage / shot</dt>
        <dd>{outcome.totalDamage}</dd>
      </dl>
      <p className="muted fineprint">
        Ballistic: floor( floor(Std×(1−D%) + Dur×D%) × armor mult ). Explosive: floor(Exp × armor mult × (1−resist)).
        Armor mult: AP &gt; armor → 100%, AP = armor → 65%, AP &lt; armor → 0%.
      </p>
    </section>
  )
}
