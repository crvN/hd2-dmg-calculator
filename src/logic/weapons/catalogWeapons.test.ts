import type { ApiAttack, ApiStratagem, ApiWeapon } from "../../data/catalogApi";
import {
  catalogWeaponsFrom,
  groupWeaponsByKind,
  penetrationRating,
  primaryWeaponsFrom,
  stratagemWeaponsFrom,
} from "./catalogWeapons";

function attack(
  name: string,
  kind: string,
  standard: number | null,
  durable: number | null,
  type: string | null,
  direct: string | null = null,
): ApiAttack {
  return {
    name,
    kind,
    damage: { standard, durable, type },
    penetration: { direct },
  };
}

function stratagem(
  id: string,
  attacks: ApiAttack[],
  overrides: Partial<ApiStratagem> = {},
): ApiStratagem {
  return {
    id,
    name: id.toUpperCase(),
    kind: "support_weapon",
    upcoming: false,
    attacks,
    ...overrides,
  };
}

describe("penetrationRating", () => {
  it.each([
    ["unarmored", 0],
    ["very_light", 1],
    ["light", 2],
    ["medium", 3],
    ["heavy", 4],
    ["anti_tank_i", 5],
    ["anti_tank_iv", 8],
  ])("rates %s as AP %i", (tier, rating) => {
    expect(penetrationRating(tier)).toBe(rating);
  });

  it("rates missing or unknown tiers as AP 0", () => {
    expect(penetrationRating(null)).toBe(0);
    expect(penetrationRating("anti_gravity")).toBe(0);
  });
});

describe("stratagemWeaponsFrom", () => {
  it("maps a plain projectile to a ballistic weapon named after the stratagem", () => {
    const [weapon] = stratagemWeaponsFrom([
      stratagem("mg-43", [
        attack("MG-43 P", "projectile", 90, 23, "Ballistic", "medium"),
      ]),
    ]);

    expect(weapon).toMatchObject({
      name: "MG-43",
      standardDamage: 90,
      durableDamage: 23,
      penetration: 3,
      damageMode: "ballistic",
      explosiveDamage: 0,
    });
  });

  it("combines a projectile with its impact explosion", () => {
    const [weapon] = stratagemWeaponsFrom([
      stratagem("eat", [
        attack("EAT P", "projectile", 2000, 2000, "Ballistic", "anti_tank_ii"),
        attack("EAT P IE", "explosion", 150, 150, "Explosion"),
      ]),
    ]);

    expect(weapon.damageMode).toBe("combined");
    expect(weapon.explosiveDamage).toBe(150);
  });

  it("treats a zero-damage projectile with an impact explosion as explosive only", () => {
    const [weapon] = stratagemWeaponsFrom([
      stratagem("gl", [
        attack("GL P", "projectile", 0, 0, "Ballistic", "heavy"),
        attack("GL P IE", "explosion", 150, 150, "Explosion"),
      ]),
    ]);

    expect(weapon.damageMode).toBe("explosive");
  });

  it("offers an explosion with no projectile as an explosive weapon", () => {
    const [weapon] = stratagemWeaponsFrom([
      stratagem("c4", [attack("C4 E", "explosion", 2000, 2000, "Explosion")]),
    ]);

    expect(weapon).toMatchObject({
      name: "C4",
      damageMode: "explosive",
      explosiveDamage: 2000,
    });
  });

  it("ignores backblast, status effects, and zero-damage attacks", () => {
    const weapons = stratagemWeaponsFrom([
      stratagem("rocket", [
        attack("ROCKET BACKBLAST E", "explosion", 15, 15, "Explosion"),
        attack("Fire", "status", 100, 100, "Fire", "heavy"),
        attack("Stun", "status", null, null, null),
        attack("ROCKET P2", "projectile", 0, 0, "Ballistic", "heavy"),
        attack("ROCKET P", "projectile", 500, 500, "Ballistic", "heavy"),
      ]),
    ]);

    expect(weapons.map((weapon) => weapon.name)).toEqual(["ROCKET"]);
  });

  it("lists each distinct attack and drops variants with identical stats", () => {
    const weapons = stratagemWeaponsFrom([
      stratagem("rl", [
        attack("RL P", "projectile", 350, 350, "Ballistic", "medium"),
        attack("RL P1", "projectile", 150, 150, "Ballistic", "medium"),
        attack("RL P2", "projectile", 350, 350, "Ballistic", "medium"),
      ]),
    ]);

    expect(weapons.map((weapon) => weapon.name)).toEqual([
      "RL (RL P)",
      "RL (RL P1)",
    ]);
  });

  it("names variants with the override's friendly labels", () => {
    const weapons = stratagemWeaponsFrom([
      stratagem("gr-8-recoilless-rifle", [
        attack("GR-8 P", "projectile", 3200, 3200, "Ballistic", "anti_tank_ii"),
        attack("GR-8 P1", "projectile", 750, 750, "Ballistic", "anti_tank_i"),
      ]),
    ]);

    expect(weapons.map((weapon) => weapon.name)).toEqual([
      "GR-8-RECOILLESS-RIFLE (HEAT)",
      "GR-8-RECOILLESS-RIFLE (HE)",
    ]);
  });

  it("gives the railgun its charge profile and leaves max charge to the control", () => {
    const weapons = stratagemWeaponsFrom([
      stratagem("rs-422-railgun", [
        attack("RS-422 P", "projectile", 600, 225, "Ballistic", "anti_tank_i"),
        attack("Railgun Max Charge", "other", 1500, 562, "Ballistic", "anti_tank_i"),
      ]),
    ]);

    expect(weapons).toHaveLength(1);
    expect(weapons[0].standardDamage).toBe(600);
    expect(weapons[0].chargeProfile?.maxDamageMultiplier).toBe(2.5);
  });

  it("explains non-ballistic, per-tick, and per-pellet damage in the notes", () => {
    const pellets: ApiAttack = {
      ...attack("EXO P", "projectile", 50, 12, "Ballistic", "medium"),
      projectile: { pellets: 40 },
    };
    const [flamer, exosuit] = stratagemWeaponsFrom([
      stratagem("flamer", [attack("FLAMER S", "spray", 2, 2, "Fire", "heavy")]),
      stratagem("exo", [pellets]),
    ]);

    expect(flamer.notes).toContain("Fire damage uses the ballistic formula");
    expect(flamer.notes).toContain("per tick");
    expect(exosuit.notes).toContain("40 pellets");
  });

  it("skips upcoming stratagems and stratagems without attacks", () => {
    const weapons = stratagemWeaponsFrom([
      stratagem(
        "soon",
        [attack("SOON P", "projectile", 100, 100, "Ballistic", "light")],
        { upcoming: true },
      ),
      stratagem("resupply", [], { kind: "mission" }),
      stratagem("reinforce", [], { attacks: null }),
    ]);

    expect(weapons).toEqual([]);
  });

  it("skips backpacks and utility strikes even when they list damage", () => {
    const weapons = stratagemWeaponsFrom([
      stratagem(
        "ax-ar-23-guard-dog",
        [attack("DOG P", "projectile", 65, 15, "Ballistic", "light")],
        { kind: "backpack" },
      ),
      stratagem(
        "orbital-smoke-strike",
        [attack("S P24", "projectile", 300, 300, "Ballistic", "heavy")],
        { kind: "orbital" },
      ),
    ]);

    expect(weapons).toEqual([]);
  });

  it("resolves the API's relative image path against the API origin", () => {
    const [withImage, withoutImage] = stratagemWeaponsFrom([
      stratagem("a", [attack("A P", "projectile", 1, 1, "Ballistic", "light")], {
        image: { url: "/images/v1/stratagems/a.abc.webp" },
      }),
      stratagem("b", [attack("B P", "projectile", 1, 1, "Ballistic", "light")]),
    ]);

    expect(withImage.imageUrl).toBe(
      "https://helldivers-api.dionatha.com.br/images/v1/stratagems/a.abc.webp",
    );
    expect(withoutImage.imageUrl).toBeUndefined();
  });

  it("rounds float noise out of listed damage", () => {
    const [weapon] = stratagemWeaponsFrom([
      stratagem("laser", [
        attack("LASER_DPS", "spray", 599.999994, 599.999994, "Damage", "heavy"),
      ]),
    ]);

    expect(weapon.standardDamage).toBe(600);
    expect(weapon.notes).toContain("per second");
  });

});

function primary(
  id: string,
  attacks: ApiAttack[],
  overrides: Partial<ApiWeapon> = {},
): ApiWeapon {
  return {
    id,
    name: id.toUpperCase(),
    category: "primary",
    upcoming: false,
    attacks,
    ...overrides,
  };
}

describe("primaryWeaponsFrom", () => {
  it("maps a primary's attack using its category as the kind", () => {
    const [weapon] = primaryWeaponsFrom([
      primary(
        "ar-23",
        [attack("AR-23 P", "projectile", 90, 22, "Ballistic", "light")],
        { image: { url: "/images/v1/weapons/ar-23.abc.webp" } },
      ),
    ]);

    expect(weapon).toMatchObject({
      name: "AR-23",
      kind: "primary",
      standardDamage: 90,
      durableDamage: 22,
      penetration: 2,
      imageUrl:
        "https://helldivers-api.dionatha.com.br/images/v1/weapons/ar-23.abc.webp",
    });
  });

  it("explains that a shotgun's shots count pellets", () => {
    const [weapon] = primaryWeaponsFrom([
      primary("sg-225", [
        {
          ...attack("SG-225 P", "projectile", 36, 8, "Ballistic", "light"),
          projectile: { pellets: 11 },
        },
      ]),
    ]);

    expect(weapon.notes).toContain("11 pellets per shot");
    expect(weapon.notes).toContain("shots count pellets");
  });

  it("skips upcoming primaries", () => {
    const weapons = primaryWeaponsFrom([
      primary(
        "soon",
        [attack("SOON P", "projectile", 90, 22, "Ballistic", "light")],
        { upcoming: true },
      ),
    ]);

    expect(weapons).toEqual([]);
  });
});

describe("catalogWeaponsFrom", () => {
  it("orders support weapons, then primaries, then other stratagems", () => {
    const weapons = catalogWeaponsFrom(
      [
        stratagem(
          "eagle",
          [attack("S E", "explosion", 1500, 1500, "Explosion")],
          { kind: "eagle" },
        ),
        stratagem("mg", [
          attack("MG P", "projectile", 90, 23, "Ballistic", "medium"),
        ]),
      ],
      [primary("ar", [attack("AR P", "projectile", 90, 22, "Ballistic", "light")])],
    );

    expect(weapons.map((weapon) => weapon.kind)).toEqual([
      "support_weapon",
      "primary",
      "eagle",
    ]);
  });
});

describe("groupWeaponsByKind", () => {
  it("groups weapons under a readable label and keeps their order", () => {
    const weapons = stratagemWeaponsFrom([
      stratagem("a", [attack("A P", "projectile", 1, 1, "Ballistic", "light")]),
      stratagem("b", [attack("B P", "projectile", 1, 1, "Ballistic", "light")]),
      stratagem(
        "c",
        [attack("C P", "projectile", 1, 1, "Ballistic", "light")],
        { kind: "orbital" },
      ),
    ]);

    const groups = groupWeaponsByKind(weapons);

    expect(groups.map((group) => group.label)).toEqual([
      "Support weapons",
      "Orbitals",
    ]);
    expect(groups[0].weapons.map((weapon) => weapon.name)).toEqual(["A", "B"]);
  });

  it("falls back to the raw kind for a kind the app does not know", () => {
    const [group] = groupWeaponsByKind(
      stratagemWeaponsFrom([
        stratagem(
          "x",
          [attack("X P", "projectile", 1, 1, "Ballistic", "light")],
          { kind: "new_kind" },
        ),
      ]),
    );

    expect(group.label).toBe("new_kind");
  });
});
