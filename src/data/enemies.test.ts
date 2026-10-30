import { resolveWikiTarget } from "../logic/targets";
import { DIFFICULTIES } from "./difficulties";
import { enemiesForWikiFaction, WIKI_FACTIONS } from "./index";
import type { Enemy } from "./types";

const allEnemies: Enemy[] = WIKI_FACTIONS.flatMap((faction) => [
  ...faction.enemies,
]);

function enemyNamed(name: string): Enemy {
  const enemy = allEnemies.find((candidate) => candidate.name === name);
  if (!enemy) throw new Error(`${name} is missing from enemies.json`);
  return enemy;
}

function partOf(enemyName: string, label: string) {
  const part = enemyNamed(enemyName).parts.find((p) => p.label === label);
  if (!part) throw new Error(`${enemyName} has no part ${label}`);
  return part;
}

describe("enemy data", () => {
  it("gives every faction a roster", () => {
    for (const faction of WIKI_FACTIONS) {
      expect(enemiesForWikiFaction(faction.id).length).toBeGreaterThan(0);
    }
  });

  it("keeps the structures that the wiki's enemy tables leave out", () => {
    expect(enemyNamed("Shrieker Nest").faction).toBe("Terminids");
    expect(enemyNamed("Spore Spewer").faction).toBe("Terminids");
  });

  it("leaves out the player", () => {
    expect(allEnemies.some((enemy) => enemy.name === "Helldiver")).toBe(false);
  });

  it("has unique part ids within every enemy", () => {
    for (const enemy of allEnemies) {
      const ids = enemy.parts.map((part) => part.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("resolves every part to usable stats at every difficulty", () => {
    for (const enemy of allEnemies) {
      for (const part of enemy.parts) {
        for (const { level } of DIFFICULTIES) {
          const stats = resolveWikiTarget(part, enemy.parts, level);
          expect(stats.hitPoints).toBeGreaterThan(0);
          expect(part.armorByDifficulty.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("has a picture for every part", () => {
    for (const enemy of allEnemies) {
      for (const part of enemy.parts) {
        expect(part.images.length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps both sets of Hive Lord pictures on one set of parts", () => {
    const crown = partOf("Hive Lord", "Crown");

    expect(crown.section).toBeNull();
    expect(crown.images.map((image) => image.file)).toEqual([
      "Hive_Lord_Crown_Top.png",
      "Hive_Lord_Crown_Side.png",
      "Hive_Lord_Crown_Face.png",
    ]);
  });

  it("raises Warrior health from Challenging", () => {
    const { parts } = enemyNamed("Warrior");
    const main = partOf("Warrior", "Main");

    expect(resolveWikiTarget(main, parts, 3).hitPoints).toBe(250);
    expect(resolveWikiTarget(main, parts, 4).hitPoints).toBe(325);
  });

  it("raises Bile Spewer armor from Extreme on armored parts only", () => {
    const { parts } = enemyNamed("Bile Spewer");
    const main = partOf("Bile Spewer", "Main");
    const mouth = partOf("Bile Spewer", "Mouth");

    expect(resolveWikiTarget(main, parts, 5).armorRating).toBe(2);
    expect(resolveWikiTarget(main, parts, 6).armorRating).toBe(3);
    expect(resolveWikiTarget(mouth, parts, 10).armorRating).toBe(0);
  });

  it("draws a tank's front armor from the matching health pool", () => {
    const { parts } = enemyNamed("Annihilator Tank");

    expect(
      resolveWikiTarget(partOf("Annihilator Tank", "Hull Front"), parts, 10)
        .hitPoints,
    ).toBe(4000);
    expect(
      resolveWikiTarget(partOf("Annihilator Tank", "Turret Front"), parts, 10)
        .hitPoints,
    ).toBe(2100);
  });

  it("treats an indestructible shield as infinite health", () => {
    const { parts } = enemyNamed("Incendiary MG Devastator");
    const shield = partOf("Incendiary MG Devastator", "Shield");

    expect(resolveWikiTarget(shield, parts, 10).hitPoints).toBe(Infinity);
  });
});
