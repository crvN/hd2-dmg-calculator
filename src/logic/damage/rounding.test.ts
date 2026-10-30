import { floorDamage } from "./rounding";

describe("floorDamage", () => {
  it("rounds fractional damage down", () => {
    expect(floorDamage(47.125)).toBe(47);
    expect(floorDamage(0.99)).toBe(0);
  });

  it("keeps a point that float noise would lose", () => {
    expect(floorDamage(75 * (1 - 0.8) + 10 * 0.8)).toBe(23);
    expect(floorDamage(100 * 0.65 * (1 - 0.8))).toBe(13);
  });

  it("leaves whole damage alone", () => {
    expect(floorDamage(0)).toBe(0);
    expect(floorDamage(10000)).toBe(10000);
  });
});
