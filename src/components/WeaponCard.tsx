import { EXPLOSIVE_AP } from '../damage'
import type { SupportWeaponPreset } from '../data/supportWeapons'
import type { DamageMode, EntryMode } from '../types'

type ManualWeaponForm = {
  damageMode: DamageMode
  onDamageModeChange: (value: DamageMode) => void
  standardDmg: string
  onStandardDmgChange: (value: string) => void
  durableDmg: string
  onDurableDmgChange: (value: string) => void
  penetration: string
  onPenetrationChange: (value: string) => void
  explosiveDmg: string
  onExplosiveDmgChange: (value: string) => void
}

type WikiWeaponForm = {
  wikiWeaponId: string
  onWikiWeaponChange: (value: string) => void
  weapons: SupportWeaponPreset[]
  selectedWeapon?: SupportWeaponPreset
}

type WeaponCardProps = {
  entryMode: EntryMode
  manual: ManualWeaponForm
  wiki: WikiWeaponForm
}

export function WeaponCard({ entryMode, manual, wiki }: WeaponCardProps) {
  return (
    <section className="card">
      <h2>Weapon</h2>
      {entryMode === 'wiki' ? (
        <>
          <label className="field">
            <span>Support weapon</span>
            <select className="select" value={wiki.wikiWeaponId} onChange={(e) => wiki.onWikiWeaponChange(e.target.value)}>
              {wiki.weapons.map((weapon) => (
                <option key={weapon.id} value={weapon.id}>
                  {weapon.name}
                </option>
              ))}
            </select>
          </label>
          {wiki.selectedWeapon?.notes && <p className="muted fineprint">{wiki.selectedWeapon.notes}</p>}
          <fieldset className="mode wiki-readonly-mode">
            <legend>Damage profile (from preset)</legend>
            <p className="muted fineprint">
              {wiki.selectedWeapon?.damageMode === 'ballistic' && 'Ballistic / non-explosive only'}
              {wiki.selectedWeapon?.damageMode === 'explosive' &&
                `Explosive only (AP ${EXPLOSIVE_AP} vs armor in this app)`}
              {wiki.selectedWeapon?.damageMode === 'combined' && 'Combined (ballistic + listed explosive portion)'}
            </p>
          </fieldset>
        </>
      ) : (
        <>
          <fieldset className="mode">
            <legend>Damage profile</legend>
            <label className="radio">
              <input
                type="radio"
                name="mode"
                checked={manual.damageMode === 'ballistic'}
                onChange={() => manual.onDamageModeChange('ballistic')}
              />
              Ballistic / non-explosive only
            </label>
            <label className="radio">
              <input
                type="radio"
                name="mode"
                checked={manual.damageMode === 'explosive'}
                onChange={() => manual.onDamageModeChange('explosive')}
              />
              Explosive only (AP {EXPLOSIVE_AP})
            </label>
            <label className="radio">
              <input
                type="radio"
                name="mode"
                checked={manual.damageMode === 'combined'}
                onChange={() => manual.onDamageModeChange('combined')}
              />
              Combined (ballistic + separate explosive value)
            </label>
          </fieldset>

          {(manual.damageMode === 'ballistic' || manual.damageMode === 'combined') && (
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

          {(manual.damageMode === 'explosive' || manual.damageMode === 'combined') && (
            <label className="field">
              <span>Explosive damage (listed explosive)</span>
              <input
                inputMode="decimal"
                value={manual.explosiveDmg}
                onChange={(e) => manual.onExplosiveDmgChange(e.target.value)}
              />
              <small>
                Explosive uses AP {EXPLOSIVE_AP} vs armor, then × (1 − explosive resistance). Listed value is applied
                as full “explosive” damage (no standard/durable split on this portion).
              </small>
            </label>
          )}
        </>
      )}
    </section>
  )
}
