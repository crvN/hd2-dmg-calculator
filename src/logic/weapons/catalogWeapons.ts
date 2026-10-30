import {
  API_ORIGIN,
  type ApiArmament,
  type ApiAttack,
  type ApiStratagem,
  type ApiWeapon,
} from "../../data/catalogApi";
import {
  EXCLUDED_STRATAGEM_IDS,
  EXCLUDED_STRATAGEM_KINDS,
  WEAPON_OVERRIDES,
  type WeaponOverride,
  type CatalogWeapon,
} from "../../data/catalogWeapons";
import type { DamageMode } from "../../types";
import { roundTo2 } from "../shared/numbers";

/** Numeric AP per named tier, from https://helldivers.wiki.gg/wiki/Armor_Penetration. */
const PENETRATION_RATINGS: Record<string, number> = {
  unarmored: 0,
  very_light: 1,
  light: 2,
  medium: 3,
  heavy: 4,
  anti_tank_i: 5,
  anti_tank_ii: 6,
  anti_tank_iii: 7,
  anti_tank_iv: 8,
  anti_tank_v: 9,
  anti_tank_vi: 10,
};

const KIND_LABELS: Record<string, string> = {
  support_weapon: "Support weapons",
  primary: "Primaries",
  sentry: "Sentries",
  emplacement: "Emplacements",
  vehicle: "Vehicles",
  eagle: "Eagles",
  orbital: "Orbitals",
  mission: "Mission",
};

const KIND_ORDER = Object.keys(KIND_LABELS);

/** Attacks that hit the player or fire when the equipment is destroyed. */
const SELF_INFLICTED_ATTACK =
  /backblast|overcharge|destruction|death explosion|fuel explosion/i;

/** Damage types the app runs through the ballistic armor formula. */
const NON_BALLISTIC_DAMAGE_TYPES = ["Laser", "Arc", "Fire", "Gas"];

export type WeaponGroup = {
  kind: string;
  label: string;
  weapons: CatalogWeapon[];
};

export function penetrationRating(tier: string | null | undefined): number {
  return PENETRATION_RATINGS[tier ?? ""] ?? 0;
}

function isExplosion(attack: ApiAttack): boolean {
  return attack.kind === "explosion" && attack.damage?.type === "Explosion";
}

function isDirectAttack(attack: ApiAttack): boolean {
  return attack.kind !== "explosion" && attack.kind !== "status";
}

function impactExplosionName(attack: ApiAttack): string {
  return `${attack.name} IE`;
}

function damageModeFor(
  directDamage: number,
  explosiveDamage: number,
): DamageMode {
  if (explosiveDamage === 0) return "ballistic";
  return directDamage > 0 ? "combined" : "explosive";
}

function attackNotes(attack: ApiAttack): string[] {
  const notes: string[] = [];
  const damageType = attack.damage?.type ?? "";
  if (NON_BALLISTIC_DAMAGE_TYPES.includes(damageType)) {
    notes.push(`${damageType} damage uses the ballistic formula in this app.`);
  }
  if (attack.name.endsWith("_DPS")) {
    notes.push("Listed damage is per second, so shots count seconds.");
  } else if (attack.kind === "beam" || attack.kind === "spray") {
    notes.push("Listed damage is per tick, so shots count ticks.");
  }
  const pellets = attack.projectile?.pellets ?? 1;
  if (pellets > 1) {
    notes.push(
      `Listed damage is per pellet (${pellets} pellets per shot), so shots count pellets.`,
    );
  }
  return notes;
}

function directAttackWeapon(
  armament: ApiArmament,
  attack: ApiAttack,
  explosion: ApiAttack | undefined,
): CatalogWeapon {
  // The API carries float noise from the game files, such as 599.999994 for 600.
  const standardDamage = roundTo2(attack.damage?.standard ?? 0);
  const durableDamage = roundTo2(attack.damage?.durable ?? 0);
  const explosiveDamage = roundTo2(explosion?.damage?.standard ?? 0);
  return {
    id: `${armament.id}/${attack.name}`,
    name: attack.name,
    kind: armament.kind,
    standardDamage,
    durableDamage,
    penetration: penetrationRating(attack.penetration?.direct),
    damageMode: damageModeFor(standardDamage + durableDamage, explosiveDamage),
    explosiveDamage,
    notes: attackNotes(attack).join(" "),
  };
}

function explosionWeapon(
  armament: ApiArmament,
  attack: ApiAttack,
): CatalogWeapon {
  return {
    id: `${armament.id}/${attack.name}`,
    name: attack.name,
    kind: armament.kind,
    standardDamage: 0,
    durableDamage: 0,
    penetration: 0,
    damageMode: "explosive",
    explosiveDamage: roundTo2(attack.damage?.standard ?? 0),
  };
}

function dealsDamage(weapon: CatalogWeapon): boolean {
  return (
    weapon.standardDamage + weapon.durableDamage + weapon.explosiveDamage > 0
  );
}

/** Variants that hit identically, like repeated rocket stages, are one choice for the player. */
function withoutDuplicateStats(weapons: CatalogWeapon[]): CatalogWeapon[] {
  const seenStats = new Set<string>();
  return weapons.filter((weapon) => {
    const stats = `${weapon.standardDamage}|${weapon.durableDamage}|${weapon.penetration}|${weapon.explosiveDamage}`;
    if (seenStats.has(stats)) return false;
    seenStats.add(stats);
    return true;
  });
}

function usableAttacks(
  armament: ApiArmament,
  override: WeaponOverride | undefined,
): ApiAttack[] {
  return (armament.attacks ?? []).filter(
    (attack) =>
      !SELF_INFLICTED_ATTACK.test(attack.name) &&
      !override?.excludedAttacks?.includes(attack.name),
  );
}

function attackVariants(
  armament: ApiArmament,
  attacks: ApiAttack[],
): CatalogWeapon[] {
  const explosions = attacks.filter(isExplosion);
  const direct = attacks.filter(isDirectAttack);
  const impactNames = direct.map(impactExplosionName);
  const standalone = explosions.filter(
    (explosion) => !impactNames.includes(explosion.name),
  );
  return [
    ...direct.map((attack) =>
      directAttackWeapon(
        armament,
        attack,
        explosions.find((e) => e.name === impactExplosionName(attack)),
      ),
    ),
    ...standalone.map((attack) => explosionWeapon(armament, attack)),
  ];
}

function variantName(
  armament: ApiArmament,
  variant: CatalogWeapon,
  variantCount: number,
  override: WeaponOverride | undefined,
): string {
  if (variantCount === 1) return armament.name;
  const label =
    override?.attackLabels?.[variant.name] ??
    variant.name.replace(/_dm$/, "");
  return `${armament.name} (${label})`;
}

function armamentImageUrl(armament: ApiArmament): string | undefined {
  return armament.image?.url
    ? new URL(armament.image.url, API_ORIGIN).href
    : undefined;
}

function isOffensiveStratagem(stratagem: ApiStratagem): boolean {
  return (
    !stratagem.upcoming &&
    !EXCLUDED_STRATAGEM_KINDS.includes(stratagem.kind) &&
    !EXCLUDED_STRATAGEM_IDS.includes(stratagem.id)
  );
}

function weaponsFromArmament(armament: ApiArmament): CatalogWeapon[] {
  const override = WEAPON_OVERRIDES[armament.id];
  const variants = withoutDuplicateStats(
    attackVariants(armament, usableAttacks(armament, override)).filter(
      dealsDamage,
    ),
  );
  return variants.map((variant) => ({
    ...variant,
    name: variantName(armament, variant, variants.length, override),
    imageUrl: armamentImageUrl(armament),
    notes:
      [override?.notes, variant.notes].filter(Boolean).join(" ") || undefined,
    chargeProfile: override?.chargeProfile,
  }));
}

function kindRank(kind: string): number {
  const rank = KIND_ORDER.indexOf(kind);
  return rank === -1 ? KIND_ORDER.length : rank;
}

/** One entry per way a released offensive stratagem can hit a target. */
export function stratagemWeaponsFrom(
  stratagems: ApiStratagem[],
): CatalogWeapon[] {
  return stratagems.filter(isOffensiveStratagem).flatMap(weaponsFromArmament);
}

/** One entry per way a released primary can hit a target. */
export function primaryWeaponsFrom(primaries: ApiWeapon[]): CatalogWeapon[] {
  return primaries
    .filter((primary) => !primary.upcoming)
    .flatMap((primary) =>
      weaponsFromArmament({ ...primary, kind: primary.category }),
    );
}

/** Everything the player can pick, ordered by kind with support weapons first. */
export function catalogWeaponsFrom(
  stratagems: ApiStratagem[],
  primaries: ApiWeapon[],
): CatalogWeapon[] {
  return [
    ...stratagemWeaponsFrom(stratagems),
    ...primaryWeaponsFrom(primaries),
  ].sort((a, b) => kindRank(a.kind) - kindRank(b.kind));
}

export function groupWeaponsByKind(weapons: CatalogWeapon[]): WeaponGroup[] {
  const groups = new Map<string, WeaponGroup>();
  for (const weapon of weapons) {
    const group = groups.get(weapon.kind) ?? {
      kind: weapon.kind,
      label: KIND_LABELS[weapon.kind] ?? weapon.kind,
      weapons: [],
    };
    group.weapons.push(weapon);
    groups.set(weapon.kind, group);
  }
  return [...groups.values()];
}
