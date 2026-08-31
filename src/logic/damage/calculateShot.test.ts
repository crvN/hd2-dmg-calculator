import type { ShotInput } from "../../types";
import { calculateShot } from "./calculateShot";

const baseInput: ShotInput = {
  hitPoints: 1000,
  durablePercent: 0,
  armorRating: 2,
  explosiveResistPercent: 0,
  standardDamage: 100,
  durableDamage: 50,
  penetration: 3,
  explosiveDamage: 200,
  damageMode: "ballistic",
};

describe("calculateShot", () => {
  it("counts only ballistic damage in ballistic mode", () => {
    const outcome = calculateShot(baseInput);
    expect(outcome.ballisticDamage).toBe(100);
    expect(outcome.explosiveDamage).toBe(0);
    expect(outcome.totalDamage).toBe(100);
    expect(outcome.shotsToKill).toBe(10);
  });

  it("counts only explosive damage in explosive mode", () => {
    const outcome = calculateShot({ ...baseInput, damageMode: "explosive" });
    expect(outcome.ballisticDamage).toBe(0);
    expect(outcome.explosiveDamage).toBe(200);
    expect(outcome.shotsToKill).toBe(5);
  });

  it("adds both damage sources in combined mode", () => {
    const outcome = calculateShot({ ...baseInput, damageMode: "combined" });
    expect(outcome.totalDamage).toBe(300);
    expect(outcome.shotsToKill).toBe(4);
  });

  it("reports markers per damage source", () => {
    const outcome = calculateShot({ ...baseInput, armorRating: 3 });
    expect(outcome.ballisticMarker).toBe("white");
    expect(outcome.explosiveMarker).toBe("white");
  });

  it("returns null shots when the shot ricochets", () => {
    const outcome = calculateShot({ ...baseInput, armorRating: 5 });
    expect(outcome.totalDamage).toBe(0);
    expect(outcome.shotsToKill).toBeNull();
    expect(outcome.ballisticMarker).toBe("ricochet");
  });
});
