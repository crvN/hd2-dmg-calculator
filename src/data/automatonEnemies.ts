import type { Enemy } from "./types";

export const AUTOMATON_ENEMIES: Enemy[] = [
  {
    id: "hulk",
    name: "Hulk",
    wikiUrl: "https://helldivers.wiki.gg/wiki/Hulk",
    parts: [
      {
        id: "main",
        label: "Main (body)",
        hp: 1800,
        durablePercent: 60,
        armorRating: 4,
        explosiveResistPercent: 0,
      },
      {
        id: "eye",
        label: "Eye",
        hp: 250,
        durablePercent: 25,
        armorRating: 4,
        explosiveResistPercent: 100,
      },
      {
        id: "arms",
        label: "Arm (each)",
        hp: 500,
        durablePercent: 70,
        armorRating: 4,
        explosiveResistPercent: 100,
      },
      {
        id: "legs",
        label: "Leg (each)",
        hp: 500,
        durablePercent: 80,
        armorRating: 4,
        explosiveResistPercent: 100,
      },
      {
        id: "heatsink",
        label: "Heatsink",
        hp: 900,
        durablePercent: 60,
        armorRating: 1,
        explosiveResistPercent: 0,
      },
    ],
  },
];
