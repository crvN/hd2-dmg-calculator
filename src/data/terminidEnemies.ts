export type TerminidBodyPart = {
  id: string;
  label: string;
  hp: number;
  durablePercent: number;
  armorRating: number;
  explosiveResistPercent: number;
};

export type TerminidEnemy = {
  id: string;
  name: string;
  wikiUrl: string;
  parts: TerminidBodyPart[];
};

/**
 * Terminid units only (no structures/flora). HP uses wiki “default” / Medium-and-below values where difficulty splits exist.
 * Armor uses AV 0–10 per https://helldivers.wiki.gg/wiki/Damage#Armor_Penetration_&_Armor_Values
 * Durable % from anatomy “Location” when “Durable2” is “-”, else from “Durable2” when it is a 0–100% durability value.
 */
export const TERMINID_ENEMIES: TerminidEnemy[] = [
  {
    id: "warrior",
    name: "Warrior",
    wikiUrl: "https://helldivers.wiki.gg/wiki/Warrior",
    parts: [
      {
        id: "main",
        label: "Main (body)",
        hp: 250,
        durablePercent: 20,
        armorRating: 1,
        explosiveResistPercent: 0,
      },
      {
        id: "head",
        label: "Head",
        hp: 110,
        durablePercent: 20,
        armorRating: 1,
        explosiveResistPercent: 100,
      },
      {
        id: "claws",
        label: "Claw (each)",
        hp: 75,
        durablePercent: 0,
        armorRating: 1,
        explosiveResistPercent: 100,
      },
      {
        id: "legs",
        label: "Leg (each)",
        hp: 75,
        durablePercent: 0,
        armorRating: 1,
        explosiveResistPercent: 100,
      },
    ],
  },
  {
    id: "hunter",
    name: "Hunter",
    wikiUrl: "https://helldivers.wiki.gg/wiki/Hunter",
    parts: [
      {
        id: "main",
        label: "Main (body)",
        hp: 130,
        durablePercent: 0,
        armorRating: 0,
        explosiveResistPercent: 0,
      },
      {
        id: "head",
        label: "Head",
        hp: 40,
        durablePercent: 0,
        armorRating: 0,
        explosiveResistPercent: 100,
      },
      {
        id: "claws",
        label: "Claw (each)",
        hp: 45,
        durablePercent: 0,
        armorRating: 0,
        explosiveResistPercent: 100,
      },
      {
        id: "legs",
        label: "Leg (each)",
        hp: 45,
        durablePercent: 0,
        armorRating: 0,
        explosiveResistPercent: 100,
      },
      {
        id: "wings",
        label: "Wing (each)",
        hp: 20,
        durablePercent: 0,
        armorRating: 0,
        explosiveResistPercent: 100,
      },
    ],
  },
  {
    id: "hive-guard",
    name: "Hive Guard",
    wikiUrl: "https://helldivers.wiki.gg/wiki/Hive_Guard",
    parts: [
      {
        id: "main",
        label: "Main (body)",
        hp: 375,
        durablePercent: 30,
        armorRating: 1,
        explosiveResistPercent: 0,
      },
      {
        id: "head",
        label: "Head (armored)",
        hp: 250,
        durablePercent: 75,
        armorRating: 4,
        explosiveResistPercent: 100,
      },
      {
        id: "claws",
        label: "Claw (each)",
        hp: 100,
        durablePercent: 0,
        armorRating: 1,
        explosiveResistPercent: 100,
      },
      {
        id: "tarsal",
        label: "Frontal tarsal plate (each)",
        hp: 125,
        durablePercent: 0,
        armorRating: 4,
        explosiveResistPercent: 100,
      },
      {
        id: "front-leg",
        label: "Front leg (each)",
        hp: 125,
        durablePercent: 0,
        armorRating: 1,
        explosiveResistPercent: 100,
      },
      {
        id: "rear-leg",
        label: "Rear leg (each)",
        hp: 125,
        durablePercent: 0,
        armorRating: 1,
        explosiveResistPercent: 100,
      },
    ],
  },
  {
    id: "charger",
    name: "Charger",
    wikiUrl: "https://helldivers.wiki.gg/wiki/Charger",
    parts: [
      {
        id: "main",
        label: "Main",
        hp: 2400,
        durablePercent: 100,
        armorRating: 4,
        explosiveResistPercent: 25,
      },
      {
        id: "head",
        label: "Head",
        hp: 1200,
        durablePercent: 70,
        armorRating: 4,
        explosiveResistPercent: 25,
      },
      {
        id: "torso-armor",
        label: "Torso armor plate (each)",
        hp: 800,
        durablePercent: 85,
        armorRating: 4,
        explosiveResistPercent: 25,
      },
      {
        id: "rear-plates",
        label: "Rear armor plates",
        hp: 2200,
        durablePercent: 75,
        armorRating: 4,
        explosiveResistPercent: 100,
      },
      {
        id: "butt",
        label: "Rear / “weak rear”",
        hp: 950,
        durablePercent: 80,
        armorRating: 0,
        explosiveResistPercent: 25,
      },
      {
        id: "leg-flesh",
        label: "Leg flesh (exposed, each)",
        hp: 800,
        durablePercent: 70,
        armorRating: 2,
        explosiveResistPercent: 25,
      },
      {
        id: "underside",
        label: "Underside",
        hp: 2400,
        durablePercent: 100,
        armorRating: 2,
        explosiveResistPercent: 100,
      },
      {
        id: "front-leg-armor",
        label: "Front leg armor plate (each)",
        hp: 800,
        durablePercent: 70,
        armorRating: 4,
        explosiveResistPercent: 25,
      },
      {
        id: "rear-leg-armor",
        label: "Rear leg armor plate (each)",
        hp: 800,
        durablePercent: 70,
        armorRating: 4,
        explosiveResistPercent: 25,
      },
      {
        id: "inner-flesh",
        label: "Inner flesh",
        hp: 2400,
        durablePercent: 30,
        armorRating: 1,
        explosiveResistPercent: 100,
      },
    ],
  },
];
