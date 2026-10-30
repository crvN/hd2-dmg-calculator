export type Difficulty = {
  level: number;
  name: string;
};

export const DIFFICULTIES: Difficulty[] = [
  { level: 1, name: "Trivial" },
  { level: 2, name: "Easy" },
  { level: 3, name: "Medium" },
  { level: 4, name: "Challenging" },
  { level: 5, name: "Hard" },
  { level: 6, name: "Extreme" },
  { level: 7, name: "Suicide Mission" },
  { level: 8, name: "Impossible" },
  { level: 9, name: "Helldive" },
  { level: 10, name: "Super Helldive" },
];

export const DEFAULT_DIFFICULTY_LEVEL = 10;
