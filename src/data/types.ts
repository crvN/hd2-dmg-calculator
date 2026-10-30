export type HitPointsTier = {
  fromDifficulty: number;
  hitPoints: number;
};

export type ArmorTier = {
  fromDifficulty: number;
  armorRating: number;
};

/** A wiki picture highlighting a part; the app loads it from the wiki rather than bundling it. */
export type PartImage = {
  /** The picture's angle, such as "Front" or "Rear"; null when the wiki has only one. */
  view: string | null;
  file: string;
  /** The wiki's cache-busting token for this version of the file. */
  version: string;
};

export type EnemyBodyPart = {
  id: string;
  label: string;
  /** The wiki tab holding this part, such as "Armor Broken" or "Pilot"; null with a single table. */
  section: string | null;
  count: number;
  images: PartImage[];
  /** Empty when the part has no health of its own: see the next two fields. */
  hitPointsByDifficulty: HitPointsTier[];
  /** Label of the part whose health pool this one draws from, such as "Main" or "Hull Main". */
  sharesHealthWith: string | null;
  hasInfiniteHealth: boolean;
  armorByDifficulty: ArmorTier[];
  durablePercent: number;
  explosiveResistPercent: number;
  percentToMain: number | null;
  capsOverflowToMain: boolean | null;
  isFatal: boolean | null;
  /** Destroying the part knocks the enemy down, as with a Hulk's legs. */
  downsEnemy: boolean;
  constitution: string | null;
};

export type Enemy = {
  id: string;
  name: string;
  faction: string;
  strain: string | null;
  wikiUrl: string;
  parts: EnemyBodyPart[];
};
