import type { EnemyBodyPart } from "../../data/types";
import {
  formatHitPoints,
  partOptionLabel,
  resolveManualTarget,
  resolveWikiTarget,
} from "./resolveTarget";

const part: EnemyBodyPart = {
  id: "head",
  label: "Head",
  section: null,
  count: 1,
  images: [],
  hitPointsByDifficulty: [
    { fromDifficulty: 1, hitPoints: 350 },
    { fromDifficulty: 4, hitPoints: 500 },
  ],
  sharesHealthWith: null,
  hasInfiniteHealth: false,
  armorByDifficulty: [
    { fromDifficulty: 1, armorRating: 2 },
    { fromDifficulty: 6, armorRating: 3 },
  ],
  durablePercent: 20,
  explosiveResistPercent: 15,
  percentToMain: 100,
  capsOverflowToMain: false,
  isFatal: true,
  downsEnemy: false,
  constitution: null,
};

describe("resolveManualTarget", () => {
  it("parses text fields into numbers", () => {
    const stats = resolveManualTarget({
      hitPoints: "500",
      durablePercent: "30",
      armorRating: "2",
      explosiveResistPercent: "10",
    });

    expect(stats).toEqual({
      hitPoints: 500,
      durablePercent: 30,
      armorRating: 2,
      explosiveResistPercent: 10,
    });
  });

  it("falls back to 0 for unparsable fields", () => {
    const stats = resolveManualTarget({
      hitPoints: "",
      durablePercent: "abc",
      armorRating: "",
      explosiveResistPercent: "",
    });

    expect(stats.hitPoints).toBe(0);
    expect(stats.durablePercent).toBe(0);
  });
});

describe("resolveWikiTarget", () => {
  it("takes stats from the selected body part", () => {
    expect(resolveWikiTarget(part, [part], 1)).toEqual({
      hitPoints: 350,
      durablePercent: 20,
      armorRating: 2,
      explosiveResistPercent: 15,
    });
  });

  it("uses each stat's own tier for the difficulty", () => {
    expect(resolveWikiTarget(part, [part], 3)).toMatchObject({
      hitPoints: 350,
      armorRating: 2,
    });
    expect(resolveWikiTarget(part, [part], 4)).toMatchObject({
      hitPoints: 500,
      armorRating: 2,
    });
    expect(resolveWikiTarget(part, [part], 6)).toMatchObject({
      hitPoints: 500,
      armorRating: 3,
    });
  });

  it("uses the health of the part it shares a pool with", () => {
    const main = {
      ...part,
      id: "hull-main",
      label: "Hull Main",
      hitPointsByDifficulty: [{ fromDifficulty: 1, hitPoints: 4000 }],
    };
    const front = {
      ...part,
      id: "hull-front",
      label: "Hull Front",
      hitPointsByDifficulty: [],
      sharesHealthWith: "Hull Main",
    };

    expect(resolveWikiTarget(front, [main, front], 10).hitPoints).toBe(4000);
  });

  it("prefers a shared pool in the part's own wiki tab", () => {
    const heavyMain = {
      ...part,
      id: "heavy-main",
      label: "Main",
      section: "Heavy",
      hitPointsByDifficulty: [{ fromDifficulty: 1, hitPoints: 160 }],
    };
    const lightMain = {
      ...heavyMain,
      id: "light-main",
      section: "Light",
      hitPointsByDifficulty: [{ fromDifficulty: 1, hitPoints: 100 }],
    };
    const heavyLegs = {
      ...part,
      id: "heavy-legs",
      label: "Legs",
      section: "Heavy",
      hitPointsByDifficulty: [],
      sharesHealthWith: "Main",
    };

    expect(
      resolveWikiTarget(heavyLegs, [lightMain, heavyMain, heavyLegs], 1)
        .hitPoints,
    ).toBe(160);
  });

  it("gives an indestructible part infinite health", () => {
    const shield = {
      ...part,
      hitPointsByDifficulty: [],
      hasInfiniteHealth: true,
    };

    expect(resolveWikiTarget(shield, [shield], 1).hitPoints).toBe(Infinity);
  });

  it("returns a zeroed target when nothing is selected", () => {
    expect(resolveWikiTarget(undefined, [], 1).hitPoints).toBe(0);
  });
});

describe("partOptionLabel", () => {
  it("uses the plain label for a single part", () => {
    expect(partOptionLabel(part)).toBe("Head");
  });

  it("adds the wiki tab and the part count when there are any", () => {
    expect(
      partOptionLabel({
        ...part,
        label: "Internals",
        section: "Armor Broken",
        count: 2,
      }),
    ).toBe("Armor Broken: Internals (×2)");
  });
});

describe("formatHitPoints", () => {
  it("shows a finite value as the number", () => {
    expect(formatHitPoints(6500)).toBe("6500");
  });

  it("names infinite health", () => {
    expect(formatHitPoints(Infinity)).toBe("Infinite");
  });
});
