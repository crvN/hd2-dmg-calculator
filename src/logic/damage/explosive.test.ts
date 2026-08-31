import { EXPLOSIVE_AP, explosiveDamageAfterArmor } from "./explosive";

describe("explosiveDamageAfterArmor", () => {
  it("uses fixed explosive AP value", () => {
    expect(EXPLOSIVE_AP).toBe(3);
    expect(explosiveDamageAfterArmor(100, 2, 0)).toBe(100);
    expect(explosiveDamageAfterArmor(100, 3, 0)).toBe(65);
    expect(explosiveDamageAfterArmor(100, 4, 0)).toBe(0);
  });

  it("applies explosive resistance percentage and clamps it", () => {
    expect(explosiveDamageAfterArmor(100, 2, 20)).toBe(80);
    expect(explosiveDamageAfterArmor(100, 2, -30)).toBe(100);
    expect(explosiveDamageAfterArmor(100, 2, 150)).toBe(0);
    expect(explosiveDamageAfterArmor(100, 2, Number.POSITIVE_INFINITY)).toBe(
      100,
    );
  });
});
