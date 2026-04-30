import { EXPLOSIVE_AP } from '../damage'
import type { ParsedResult } from '../types'

type ResultCardProps = {
  parsed: ParsedResult
}

export function ResultCard({ parsed }: ResultCardProps) {
  return (
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
        {(parsed.damageModeEffective === 'ballistic' || parsed.damageModeEffective === 'combined') && (
          <>
            <dt>Ballistic damage / shot</dt>
            <dd>
              {parsed.ballistic} <span className={`tag tag-${parsed.ballisticMarker}`}>{parsed.ballisticMarker}</span>
            </dd>
          </>
        )}
        {(parsed.damageModeEffective === 'explosive' || parsed.damageModeEffective === 'combined') && (
          <>
            <dt>Explosive damage / shot</dt>
            <dd>
              {parsed.explosive} <span className={`tag tag-${parsed.explosiveMarker}`}>{parsed.explosiveMarker}</span>
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
  )
}
