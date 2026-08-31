import type { EnemyBodyPart } from "../../data/types";
import { resolveManualTarget, resolveWikiTarget } from "./resolveTarget";

const part: EnemyBodyPart = {
  id: "head",
  label: "Head",
  hp: 350,
  durablePercent: 20,
  armorRating: 3,
  explosiveResistPercent: 15,
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
    expect(resolveWikiTarget(part)).toEqual({
      hitPoints: 350,
      durablePercent: 20,
      armorRating: 3,
      explosiveResistPercent: 15,
    });
  });

  it("returns a zeroed target when nothing is selected", () => {
    expect(resolveWikiTarget(undefined).hitPoints).toBe(0);
  });
});
