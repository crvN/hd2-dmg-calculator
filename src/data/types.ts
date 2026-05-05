export type EnemyBodyPart = {
  id: string;
  label: string;
  hp: number;
  durablePercent: number;
  armorRating: number;
  explosiveResistPercent: number;
};

export type Enemy = {
  id: string;
  name: string;
  wikiUrl: string;
  parts: EnemyBodyPart[];
};
