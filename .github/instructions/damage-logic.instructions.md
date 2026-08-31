---
name: "Damage Logic"
description: "Use when writing or changing Helldivers 2 damage math, armor penetration, shots-to-kill calculations, enemy/weapon data, or unit tests for them. Enforces small pure functions, explicit units, and logic kept out of React."
applyTo: "src/logic/**, src/data/**, src/services/**, src/types.ts"
---

# Damage Logic Rules

The calculator answers one question: *how many shots does it take to kill this body part?*
All of that math lives in plain TypeScript modules — never inside components.

## Where code goes

| Folder | Holds |
|--------|-------|
| `src/logic/damage/` | Game damage rules: armor, ballistic, explosive, shots-to-kill, the `calculateShot` pipeline |
| `src/logic/weapons/` | Weapon-specific behavior: charge curves, `WeaponBehavior`, weapon → `WeaponShot` resolvers |
| `src/logic/targets/` | Enemy body part → `TargetStats` resolvers |
| `src/logic/shared/` | Cross-cutting primitives only (clamping, number parsing) |
| `src/data/` | Static game data tables, no functions |
| `src/services/` | I/O boundary: persistence, URL state, remote data. Nothing pure belongs here |

Each folder has an `index.ts` barrel; import from the folder (`../logic/damage`), not from deep paths.
A new file per game rule beats a growing `misc.ts`. If something doesn't fit a folder, it needs a new one —
never widen `shared/`.

## Weapon-specific rules stay behind `WeaponBehavior`

Never branch on a weapon id or probe for a capability field outside `src/logic/weapons/`.
A weapon with unusual mechanics gets a new `WeaponBehavior` factory (and a `WeaponControlModel`
variant if it needs a player-facing control); hooks and components stay unchanged.

## Pure functions only

- Every calculation is a **pure function**: same inputs → same output, no React, no DOM, no `Date`, no globals.
- One function = one game rule. If a function needs a comment explaining a second rule, split it.
- Target ≤ 15 statements per function. Longer means an intermediate rule is hiding inside it.
- Compose the pipeline from named steps instead of one big formula:

```ts
// good — each step is a rule you can name, test, and read
const mixed = mixedBallisticBaseDamage(standard, durable, durablePercent)
const multiplier = armorDamageMultiplier(penetration, armor)
const perShot = Math.floor(mixed * multiplier)
const shots = shotsToKill(hp, perShot)
```

## Naming and units

- Name functions after the game concept: `armorDamageMultiplier`, `explosiveDamageAfterArmor`, `shotsToKill`.
- Put the unit in the identifier: `chargeSeconds`, `durablePercent`, `armorRating`, `damagePerShot`.
  Never a bare `pct`, `t`, `n`, or `dmg` in exported signatures.
- Percentages are `0–100` at module boundaries and converted to a `0–1` ratio inside the function.
- Prefer named object params when a function takes more than 3 values:

```ts
export function ballisticDamageAfterArmor(input: BallisticShot): number
```

## Rounding and edge cases

- Rounding is part of the game rule — state where it happens with a one-line comment referencing the source
  (wiki/spreadsheet formula) and keep it in the function that owns the rule.
- Impossible-to-kill must be representable: return `null` from `shotsToKill` for non-positive damage, never `Infinity`.
- Clamp at the boundary (`clampPercent`, `clampArmor`), not repeatedly inside the math.

## Types and data

- Use `type` aliases and string literal unions for game vocabulary: `'red' | 'white' | 'ricochet'`, `DamageMode`.
- Data tables (enemies, body parts, weapons) are `const` typed arrays in `src/data/` — data only, no functions.
- Result types describe the domain, not the UI. Fields are spelled out (`hitPoints`, `armorRating`),
  not abbreviated (`hpN`, `armorN`).
- No `any`, no non-null `!` on lookups that can legitimately miss — return `undefined` and let the caller handle it.

## Tests

- Every exported rule has a `describe` block in a sibling `*.test.ts` file with `it` names that read as
  game statements: `it('returns partial damage when AP equals armor after rounding')`.
- Cover the three armor outcomes (over / equal / under), zero and negative damage, and clamp boundaries.
- Test the math modules directly. Do not reach through a component or hook to test a formula.
