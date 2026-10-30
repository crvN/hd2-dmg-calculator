import { matchesSearch } from "./search";

describe("matchesSearch", () => {
  it("matches any part of the name regardless of case", () => {
    expect(matchesSearch("Bile Titan", "titan")).toBe(true);
    expect(matchesSearch("Bile Titan", "BILE")).toBe(true);
    expect(matchesSearch("Bile Titan", "charger")).toBe(false);
  });

  it("requires every word but not their order", () => {
    expect(matchesSearch("Bile Titan", "titan bile")).toBe(true);
    expect(matchesSearch("Bile Titan", "bile charger")).toBe(false);
  });

  it("ignores punctuation on both sides", () => {
    expect(matchesSearch("RS-422 Railgun", "rs422")).toBe(true);
    expect(matchesSearch("RS-422 Railgun", "rs 422")).toBe(true);
    expect(matchesSearch("AC8 Autocannon", "ac-8")).toBe(true);
  });

  it("matches everything for a blank query", () => {
    expect(matchesSearch("Bile Titan", "")).toBe(true);
    expect(matchesSearch("Bile Titan", "   ")).toBe(true);
  });
});
