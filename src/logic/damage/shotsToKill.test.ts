import { shotsToKill } from "./shotsToKill";

describe("shotsToKill", () => {
  it("returns 0 when hp is already depleted", () => {
    expect(shotsToKill(0, 10)).toBe(0);
    expect(shotsToKill(-20, 10)).toBe(0);
  });

  it("returns null for non-positive damage per shot", () => {
    expect(shotsToKill(100, 0)).toBeNull();
    expect(shotsToKill(100, -10)).toBeNull();
  });

  it("returns the ceiling of hp divided by damage", () => {
    expect(shotsToKill(100, 30)).toBe(4);
    expect(shotsToKill(90, 30)).toBe(3);
  });
});
