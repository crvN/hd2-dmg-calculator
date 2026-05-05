import { TERMINID_ENEMIES } from "./terminidEnemies";
import { AUTOMATON_ENEMIES } from "./automatonEnemies";
import type { Enemy } from "./types";

export const ENEMIES = {
  TERMINIEDS: TERMINID_ENEMIES,
  AUTOMATONS: AUTOMATON_ENEMIES,
} as const;

/** Wiki tab: faction → enemy roster (curated snapshot). */
export const WIKI_FACTIONS = [
  { id: "terminids" as const, label: "Terminids", enemies: TERMINID_ENEMIES },
  {
    id: "automatons" as const,
    label: "Automatons",
    enemies: AUTOMATON_ENEMIES,
  },
] as const;

export type WikiFactionId = (typeof WIKI_FACTIONS)[number]["id"];

export function enemiesForWikiFaction(id: WikiFactionId): Enemy[] {
  const row = WIKI_FACTIONS.find((f) => f.id === id);
  return row?.enemies ?? TERMINID_ENEMIES;
}
