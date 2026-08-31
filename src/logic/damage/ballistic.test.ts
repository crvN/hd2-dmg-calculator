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

  it("mixes both values and floors once", () => {
    expect(mixedBallisticBaseDamage(100, 50, 55)).toBe(72);
  });

  it("clamps invalid durable percentages", () => {
    expect(mixedBallisticBaseDamage(100, 10, -20)).toBe(100);
    expect(mixedBallisticBaseDamage(100, 10, 200)).toBe(10);
    expect(mixedBallisticBaseDamage(100, 10, Number.NaN)).toBe(100);
  });
});

describe("ballisticDamageAfterArmor", () => {
  it("applies floor on mixed damage and after armor multiplier", () => {
    expect(ballisticDamageAfterArmor(100, 50, 55, 3, 3)).toBe(46);
  });

  it("returns zero when penetration is below armor", () => {
    expect(ballisticDamageAfterArmor(100, 50, 25, 2, 4)).toBe(0);
  });
});
