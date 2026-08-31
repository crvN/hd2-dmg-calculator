import type { SupportWeaponPreset } from "../../data/supportWeapons";
import { resolveManualWeapon, resolveWikiWeapon } from "./resolveWeapon";

const weapon: SupportWeaponPreset = {
  id: "test",
  name: "Test Weapon",
  standardDamage: 200,
  durableDamage: 100,
  penetration: 4,
  damageMode: "combined",
  explosiveDamage: 150,
};

describe("resolveManualWeapon", () => {
  it("parses text fields into numbers", () => {
    const shot = resolveManualWeapon({
      standardDamage: "95",
      durableDamage: "23",
      penetration: "3",
      explosiveDamage: "150",
      damageMode: "ballistic",
    });

    expect(shot.standardDamage).toBe(95);
    expect(shot.penetration).toBe(3);
    expect(shot.damageMode).toBe("ballistic");
  });

  it("falls back to 0 for unparsable fields", () => {
    const shot = resolveManualWeapon({
      standardDamage: "",
      durableDamage: "abc",
      penetration: "",
      explosiveDamage: "",
      damageMode: "combined",
    });

    expect(shot.standardDamage).toBe(0);
    expect(shot.durableDamage).toBe(0);
  });
});

describe("resolveWikiWeapon", () => {
  it("takes the preset stats at multiplier 1", () => {
    const shot = resolveWikiWeapon(weapon, 1);

    expect(shot.standardDamage).toBe(200);
    expect(shot.penetration).toBe(4);
    expect(shot.damageMode).toBe("combined");
  });

  it("scales ballistic damage only", () => {
    const shot = resolveWikiWeapon(weapon, 2);

    expect(shot.standardDamage).toBe(400);
    expect(shot.durableDamage).toBe(200);
    expect(shot.explosiveDamage).toBe(150);
  });

  it("returns a zeroed shot when no weapon is selected", () => {
    const shot = resolveWikiWeapon(undefined, 2);

    expect(shot.standardDamage).toBe(0);
    expect(shot.damageMode).toBe("ballistic");
  });
});
