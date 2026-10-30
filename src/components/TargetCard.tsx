import type { WikiFactionId } from "../data";
import type { Difficulty } from "../data/difficulties";
import type { Enemy, EnemyBodyPart } from "../data/types";
import type { PartImageModel } from "../logic/targets";
import type { EntryMode, TargetStats } from "../types";
import { PartImages } from "./PartImages";
import { SearchableSelect, type SearchableSelectOption } from "./SearchableSelect";

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

type WikiFactionOption = {
  id: WikiFactionId;
  label: string;
};

type WikiTargetForm = {
  wikiFactionId: WikiFactionId;
  wikiFactions: readonly WikiFactionOption[];
  onWikiFactionChange: (value: WikiFactionId) => void;
  difficulties: Difficulty[];
  wikiDifficulty: number;
  onWikiDifficultyChange: (level: number) => void;
  wikiEnemyId: string;
  wikiPartId: string;
  selectedEnemy?: Enemy;
  selectedPart?: EnemyBodyPart;
  partOptions: SearchableSelectOption[];
  partStats: TargetStats;
  partHitPointsLabel: string;
  partImages: PartImageModel[];
  enemies: Enemy[];
  onWikiEnemyChange: (value: string) => void;
  onWikiPartChange: (value: string) => void;
};

type TargetCardProps = {
  entryMode: EntryMode;
  manual: ManualTargetForm;
  wiki: WikiTargetForm;
};

export function TargetCard({ entryMode, manual, wiki }: TargetCardProps) {
  return (
    <section className="card">
      <h2>Target (body part)</h2>
      {entryMode === "wiki" ? (
        <>
          <label className="field">
            <span>Faction</span>
            <select
              className="select"
              value={wiki.wikiFactionId}
              onChange={(e) =>
                wiki.onWikiFactionChange(e.target.value as WikiFactionId)
              }
            >
              {wiki.wikiFactions.map((faction) => (
                <option key={faction.id} value={faction.id}>
                  {faction.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Difficulty</span>
            <select
              className="select"
              value={wiki.wikiDifficulty}
              onChange={(e) =>
                wiki.onWikiDifficultyChange(Number(e.target.value))
              }
            >
              {wiki.difficulties.map((difficulty) => (
                <option key={difficulty.level} value={difficulty.level}>
                  {difficulty.level} – {difficulty.name}
                </option>
              ))}
            </select>
          </label>
          <SearchableSelect
            label="Enemy"
            value={wiki.wikiEnemyId}
            options={wiki.enemies.map((enemy) => ({
              id: enemy.id,
              label: enemy.name,
            }))}
            onChange={wiki.onWikiEnemyChange}
          />
          <label className="field">
            <span>Body part</span>
            <select
              className="select"
              value={wiki.wikiPartId}
              onChange={(e) => wiki.onWikiPartChange(e.target.value)}
            >
              {wiki.partOptions.map((part) => (
                <option key={part.id} value={part.id}>
                  {part.label}
                </option>
              ))}
            </select>
          </label>
          {wiki.selectedPart && (
            <dl className="part-stats">
              <dt>HP</dt>
              <dd>
                {wiki.partHitPointsLabel}
                {wiki.selectedPart.sharesHealthWith &&
                  ` (shared with ${wiki.selectedPart.sharesHealthWith})`}
              </dd>
              <dt>Armor (AV)</dt>
              <dd>{wiki.partStats.armorRating}</dd>
              <dt>Durable %</dt>
              <dd>{wiki.partStats.durablePercent}%</dd>
              <dt>Explosive resist</dt>
              <dd>{wiki.partStats.explosiveResistPercent}%</dd>
            </dl>
          )}
          <PartImages images={wiki.partImages} />
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
