import type { TerminidEnemy } from "../data/terminidEnemies";
import type { EntryMode } from "../types";

type ManualTargetForm = {
  hp: string;
  onHpChange: (value: string) => void;
  durablePct: string;
  onDurablePctChange: (value: string) => void;
  armor: string;
  onArmorChange: (value: string) => void;
  explosiveResist: string;
  onExplosiveResistChange: (value: string) => void;
};

type WikiTargetForm = {
  wikiEnemyId: string;
  wikiPartId: string;
  selectedEnemy?: TerminidEnemy;
  enemies: TerminidEnemy[];
  onWikiEnemyChange: (value: string) => void;
  onWikiPartChange: (value: string) => void;
};

type TargetCardProps = {
  entryMode: EntryMode;
  manual: ManualTargetForm;
  wiki: WikiTargetForm;
};

export function TargetCard({ entryMode, manual, wiki }: TargetCardProps) {
  const selectedPart = wiki.selectedEnemy?.parts.find(
    (p) => p.id === wiki.wikiPartId,
  );

  return (
    <section className="card">
      <h2>Target (body part)</h2>
      {entryMode === "wiki" ? (
        <>
          <label className="field">
            <span>Terminid</span>
            <select
              className="select"
              value={wiki.wikiEnemyId}
              onChange={(e) => wiki.onWikiEnemyChange(e.target.value)}
            >
              {wiki.enemies.map((enemy) => (
                <option key={enemy.id} value={enemy.id}>
                  {enemy.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Body part</span>
            <select
              className="select"
              value={wiki.wikiPartId}
              onChange={(e) => wiki.onWikiPartChange(e.target.value)}
            >
              {(wiki.selectedEnemy?.parts ?? []).map((part) => (
                <option key={part.id} value={part.id}>
                  {part.label}
                </option>
              ))}
            </select>
          </label>
          {selectedPart && (
            <dl className="part-stats">
              <dt>HP</dt>
              <dd>{selectedPart.hp}</dd>
              <dt>Armor (AV)</dt>
              <dd>{selectedPart.armorRating}</dd>
              <dt>Durable %</dt>
              <dd>{selectedPart.durablePercent}%</dd>
              <dt>Explosive resist</dt>
              <dd>{selectedPart.explosiveResistPercent}%</dd>
            </dl>
          )}
          {wiki.selectedEnemy && (
            <p className="muted fineprint wiki-enemy-link">
              <a
                href={wiki.selectedEnemy.wikiUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Wiki: {wiki.selectedEnemy.name}
              </a>
            </p>
          )}
        </>
      ) : (
        <>
          <label className="field">
            <span>HP</span>
            <input
              inputMode="decimal"
              value={manual.hp}
              onChange={(e) => manual.onHpChange(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Durability % (0–100)</span>
            <input
              inputMode="decimal"
              value={manual.durablePct}
              onChange={(e) => manual.onDurablePctChange(e.target.value)}
            />
            <small>
              How much of the hit uses durable damage vs standard (wiki part
              stat).
            </small>
          </label>
          <label className="field">
            <span>Armor rating (0–10)</span>
            <input
              inputMode="numeric"
              value={manual.armor}
              onChange={(e) => manual.onArmorChange(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Explosive resistance % (0–100)</span>
            <input
              inputMode="decimal"
              value={manual.explosiveResist}
              onChange={(e) => manual.onExplosiveResistChange(e.target.value)}
            />
            <small>Reduces only the explosive portion of the hit.</small>
          </label>
        </>
      )}
    </section>
  );
}
