import {
  ballisticDamageAfterArmor,
  mixedBallisticBaseDamage,
} from "./ballistic";

describe("mixedBallisticBaseDamage", () => {
  it("uses only standard damage at 0% durable", () => {
    expect(mixedBallisticBaseDamage(100, 50, 0)).toBe(100);
  });

  it("uses only durable damage at 100% durable", () => {
    expect(mixedBallisticBaseDamage(100, 50, 100)).toBe(50);
  });

  it("mixes both values without rounding", () => {
    expect(mixedBallisticBaseDamage(100, 50, 55)).toBeCloseTo(72.5);
  });

  it("clamps invalid durable percentages", () => {
    expect(mixedBallisticBaseDamage(100, 10, -20)).toBe(100);
    expect(mixedBallisticBaseDamage(100, 10, 200)).toBe(10);
    expect(mixedBallisticBaseDamage(100, 10, Number.NaN)).toBe(100);
  });
});

describe("ballisticDamageAfterArmor", () => {
  it("rounds down once, after the armor multiplier", () => {
    expect(ballisticDamageAfterArmor(100, 50, 55, 3, 3)).toBe(47);
  });

  it("returns zero when penetration is below armor", () => {
    expect(ballisticDamageAfterArmor(100, 50, 25, 2, 4)).toBe(0);
  });

  // Stats and expected results in this block are from DiversDex 2.3.
  it("keeps every point of a Coyote against Bile Titan guts", () => {
    expect(ballisticDamageAfterArmor(75, 10, 80, 3, 2)).toBe(23);
  });

  it("gives a Redeemer its full partial damage against Bile Titan guts", () => {
    expect(ballisticDamageAfterArmor(60, 5, 80, 2, 2)).toBe(10);
  });

  it("does not lose a point of Halt stun damage to rounding twice", () => {
    expect(ballisticDamageAfterArmor(6, 2, 70, 2, 2)).toBe(2);
  });
});
