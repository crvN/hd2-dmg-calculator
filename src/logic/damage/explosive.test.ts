import { explosiveDamageAfterArmor } from "./explosive";

describe("explosiveDamageAfterArmor", () => {
  it("compares the explosion's own AP with armor", () => {
    expect(explosiveDamageAfterArmor(100, 3, 2, 0)).toBe(100);
    expect(explosiveDamageAfterArmor(100, 3, 3, 0)).toBe(65);
    expect(explosiveDamageAfterArmor(100, 3, 4, 0)).toBe(0);
    expect(explosiveDamageAfterArmor(100, 5, 4, 0)).toBe(100);
  });

  it("applies explosive resistance percentage and clamps it", () => {
    expect(explosiveDamageAfterArmor(100, 3, 2, 20)).toBe(80);
    expect(explosiveDamageAfterArmor(100, 3, 2, -30)).toBe(100);
    expect(explosiveDamageAfterArmor(100, 3, 2, 150)).toBe(0);
    expect(explosiveDamageAfterArmor(100, 3, 2, Number.POSITIVE_INFINITY)).toBe(
      100,
    );
  });

  // Stats and expected results in this block are from DiversDex 2.3.
  it("keeps every point of a Scorcher blast against a Rocket Strider rail", () => {
    expect(explosiveDamageAfterArmor(100, 3, 3, 80)).toBe(13);
  });

  it("lets a Portable Hellbomb's AP 10 blast through Hulk armor", () => {
    expect(explosiveDamageAfterArmor(10000, 10, 4, 0)).toBe(10000);
  });
});
