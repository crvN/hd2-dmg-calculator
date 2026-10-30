import type { CatalogWeapon } from "../data/catalogWeapons";
import { EXPLOSIVE_AP } from "../logic/damage";
import type { WeaponControlModel, WeaponGroup } from "../logic/weapons";
import type { DamageMode, EntryMode } from "../types";
import { ChargeControls } from "./ChargeControls";
import { SearchableSelect } from "./SearchableSelect";

type ManualWeaponForm = {
  damageMode: DamageMode;
  onDamageModeChange: (value: DamageMode) => void;
  standardDmg: string;
  onStandardDmgChange: (value: string) => void;
  durableDmg: string;
  onDurableDmgChange: (value: string) => void;
  penetration: string;
  onPenetrationChange: (value: string) => void;
  explosiveDmg: string;
  onExplosiveDmgChange: (value: string) => void;
};

type WikiWeaponForm = {
  weaponGroups: WeaponGroup[];
  wikiGroupKind: string;
  onWikiGroupChange: (value: string) => void;
  groupWeapons: CatalogWeapon[];
  wikiWeaponId: string;
  onWikiWeaponChange: (value: string) => void;
  selectedWeapon?: CatalogWeapon;
  control: WeaponControlModel;
  onChargeSecondsChange: (seconds: number) => void;
};

type WeaponCardProps = {
  entryMode: EntryMode;
  manual: ManualWeaponForm;
  wiki: WikiWeaponForm;
};

export function WeaponCard({ entryMode, manual, wiki }: WeaponCardProps) {
  return (
    <section className="card">
      <h2>Weapon</h2>
      {entryMode === "wiki" ? (
        <>
          <label className="field">
            <span>Type</span>
            <select
              className="select"
              value={wiki.wikiGroupKind}
              disabled={wiki.weaponGroups.length === 0}
              onChange={(e) => wiki.onWikiGroupChange(e.target.value)}
            >
              {wiki.weaponGroups.map((group) => (
                <option key={group.kind} value={group.kind}>
                  {group.label}
                </option>
              ))}
            </select>
          </label>
          <SearchableSelect
            label="Weapon"
            value={wiki.wikiWeaponId}
            options={wiki.groupWeapons.map((weapon) => ({
              id: weapon.id,
              label: weapon.name,
            }))}
            disabled={wiki.groupWeapons.length === 0}
            onChange={wiki.onWikiWeaponChange}
          />
          {wiki.selectedWeapon?.imageUrl && (
            <img
              key={wiki.selectedWeapon.imageUrl}
              className="weapon-image"
              src={wiki.selectedWeapon.imageUrl}
              alt={wiki.selectedWeapon.name}
            />
          )}
          {wiki.selectedWeapon?.notes && (
            <p className="muted fineprint">{wiki.selectedWeapon.notes}</p>
          )}
          {wiki.control.kind === "charge" && (
            <ChargeControls
              model={wiki.control}
              onSecondsChange={wiki.onChargeSecondsChange}
            />
          )}
          {wiki.selectedWeapon && (
            <fieldset className="mode wiki-readonly-mode">
              <legend>Damage profile (from API)</legend>
              <p className="muted fineprint no-margin">
                {wiki.selectedWeapon.damageMode === "ballistic" &&
                  "Ballistic / non-explosive only"}
                {wiki.selectedWeapon.damageMode === "explosive" &&
                  `Explosive only (AP ${EXPLOSIVE_AP} vs armor in this app)`}
                {wiki.selectedWeapon.damageMode === "combined" &&
                  "Combined (ballistic + listed explosive portion)"}
                <br />
                Standard damage: {wiki.selectedWeapon.standardDamage}
                <br />
                Durable damage: {wiki.selectedWeapon.durableDamage}
                <br />
                Armor penetration: {wiki.selectedWeapon.penetration}
                <br />
                Explosive damage: {wiki.selectedWeapon.explosiveDamage}
              </p>
            </fieldset>
          )}
        </>
      ) : (
        <>
          <fieldset className="mode">
            <legend>Damage profile</legend>
            <label className="radio">
              <input
                type="radio"
                name="mode"
                checked={manual.damageMode === "ballistic"}
                onChange={() => manual.onDamageModeChange("ballistic")}
              />
              Ballistic / non-explosive only
            </label>
            <label className="radio">
              <input
                type="radio"
                name="mode"
                checked={manual.damageMode === "explosive"}
                onChange={() => manual.onDamageModeChange("explosive")}
              />
              Explosive only (AP {EXPLOSIVE_AP})
            </label>
            <label className="radio">
              <input
                type="radio"
                name="mode"
                checked={manual.damageMode === "combined"}
                onChange={() => manual.onDamageModeChange("combined")}
              />
              Combined (ballistic + separate explosive value)
            </label>
          </fieldset>

          {(manual.damageMode === "ballistic" ||
            manual.damageMode === "combined") && (
            <>
              <label className="field">
                <span>Standard damage</span>
                <input
                  inputMode="decimal"
                  value={manual.standardDmg}
                  onChange={(e) => manual.onStandardDmgChange(e.target.value)}
                />
              </label>
              <label className="field">
                <span>Durable damage</span>
                <input
                  inputMode="decimal"
                  value={manual.durableDmg}
                  onChange={(e) => manual.onDurableDmgChange(e.target.value)}
                />
              </label>
              <label className="field">
                <span>Armor penetration (0–10)</span>
                <input
                  inputMode="numeric"
                  value={manual.penetration}
                  onChange={(e) => manual.onPenetrationChange(e.target.value)}
                />
              </label>
            </>
          )}

          {(manual.damageMode === "explosive" ||
            manual.damageMode === "combined") && (
            <label className="field">
              <span>Explosive damage (listed explosive)</span>
              <input
                inputMode="decimal"
                value={manual.explosiveDmg}
                onChange={(e) => manual.onExplosiveDmgChange(e.target.value)}
              />
              <small>
                Explosive uses AP {EXPLOSIVE_AP} vs armor, then × (1 − explosive
                resistance). Listed value is applied as full “explosive” damage
                (no standard/durable split on this portion).
              </small>
            </label>
          )}
        </>
      )}
    </section>
  );
}
