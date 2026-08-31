import { armorDamageMultiplier, hitmarkerFor } from "./armor";

describe("armorDamageMultiplier", () => {
  it("returns full damage when AP is above armor", () => {
    expect(armorDamageMultiplier(4, 3)).toBe(1);
    expect(armorDamageMultiplier(4.6, 4.4)).toBe(1);
  });

  it("returns partial damage when AP equals armor after rounding", () => {
    expect(armorDamageMultiplier(3, 3)).toBe(0.65);
    expect(armorDamageMultiplier(2.6, 3.4)).toBe(0.65);
  });

  it("returns zero damage when AP is below armor", () => {
    expect(armorDamageMultiplier(2, 3)).toBe(0);
    expect(armorDamageMultiplier(2.4, 3.4)).toBe(0);
  });
});

describe("hitmarkerFor", () => {
  it("maps AP > armor to red", () => {
    expect(hitmarkerFor(5, 4)).toBe("red");
  });

  it("maps AP = armor to white", () => {
    expect(hitmarkerFor(3, 3)).toBe("white");
  });

  it("maps AP < armor to ricochet", () => {
    expect(hitmarkerFor(2, 4)).toBe("ricochet");
  });
});
