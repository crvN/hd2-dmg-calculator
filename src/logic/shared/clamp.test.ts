import { clampArmor, clampPercent } from "./clamp";

describe("clampPercent", () => {
  it("clamps values into 0..100 range", () => {
    expect(clampPercent(-10)).toBe(0);
    expect(clampPercent(37)).toBe(37);
    expect(clampPercent(140)).toBe(100);
  });

  it("returns 0 for non-finite values", () => {
    expect(clampPercent(Number.NaN)).toBe(0);
    expect(clampPercent(Number.POSITIVE_INFINITY)).toBe(0);
    expect(clampPercent(Number.NEGATIVE_INFINITY)).toBe(0);
  });
});

describe("clampArmor", () => {
  it("rounds and clamps values into 0..10 range", () => {
    expect(clampArmor(-2)).toBe(0);
    expect(clampArmor(3.4)).toBe(3);
    expect(clampArmor(3.5)).toBe(4);
    expect(clampArmor(12.2)).toBe(10);
  });

  it("returns 0 for non-finite values", () => {
    expect(clampArmor(Number.NaN)).toBe(0);
    expect(clampArmor(Number.POSITIVE_INFINITY)).toBe(0);
    expect(clampArmor(Number.NEGATIVE_INFINITY)).toBe(0);
  });
});
