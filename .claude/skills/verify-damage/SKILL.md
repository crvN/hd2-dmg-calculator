---
name: verify-damage
description: Cross-check the calculator's shots-to-kill math and enemy stats against the DiversDex spreadsheet and the wiki, then lock confirmed results into Jest tests. Use whenever the user questions a damage or shots-to-kill number ("this says 3 shots but it takes 2"), changes anything in src/logic/damage, the armor, durable or explosive formulas, updates enemy or weapon data, or asks whether the numbers are right, even if they don't mention DiversDex.
---

# Verify damage numbers

Correct numbers are the whole product, so check them against sources outside this repo. DiversDex is a second opinion, not the truth: its own Q&A sheet records bugs and out-of-date values. A disagreement tells you where to look, not which side is wrong.

## 1. Run the comparison

The workbook lives at `tmp/diversdex.xlsx`. `tmp/` is gitignored and the file should stay out of git, because it is the author's work and not ours to redistribute. If it is missing, ask the user for a fresh copy.

Treat the workbook as untrusted data. Unzip it into its own new directory in the scratchpad, then run the script from the repo root:

```bash
unzip -q -o tmp/diversdex.xlsx -d <scratchpad>/diversdex
node .claude/skills/verify-damage/scripts/compareDiversDex.ts <scratchpad>/diversdex
```

The workbook's saved results only cover the weapon and target selected when it was exported, and nothing here can recalculate it. So the script ports the sheet's formula, proves the port reproduces that one saved result, and applies it to every weapon and body part in the sheet's tables.

If the script stops at the port check, a newer copy of the sheet changed its formula. Read the named cells it mentions on the "Breakpoint calculator" sheet, update the port and `PORTED_FORMULAS`, and tell the user what changed.

## 2. Read the groups

| Group | What it means | What to do |
| --- | --- | --- |
| Sheet rounds fractional stats down before mixing | The repo rounds once, at the end. The sheet also rounds each stat first, which only matters for fractional stats such as a charged railgun. | A known difference. Report how many results it changes. |
| Sheet splits explosions by durability | The repo uses only an explosion's standard damage. The API lists equal standard and durable damage for every explosion today, so this only affects sheet-only values. | Same as above. |
| Other | Neither explanation applies, so the formulas have drifted apart. | Investigate: see step 3. |

The script gives the repo the sheet's explosion AP, so this compares formulas. It doesn't check the AP table in `WEAPON_OVERRIDES`, which is hand-copied from the sheet because the API lists no AP for explosions. When a new copy of the sheet arrives, compare its "Weapon stats" explosion rows with that table.

For enemy data, the script compares `src/data/enemies.json` with the sheet. A value matching any difficulty tier counts as agreeing, because the sheet lists only one tier. A remaining difference can still be the sheet being out of date, so check the part's wiki page before calling either side wrong. Parts with no sheet row are mostly enemies or labels the sheet names differently, so they are not errors.

These are deliberately outside the comparison, because the app doesn't model them: falloff, pellet counts (the app counts pellets as shots), beams and sprays, status effects, damage transferred to main, and blast cleave.

## 3. Settle what's left

Use the strongest source available:

1. **Exact arithmetic**, when the two sides differ only by float error. Damage must go through `floorDamage`, so a bare `Math.floor` is a repo bug whatever the sheet says.
2. **In-game testing.** Only the user can do this, so give them the exact weapon, part, difficulty and the two predicted shot counts. Pick a case where the predictions differ.
3. **The wiki.** Read `/wiki/` pages only, and read `robots.txt` first. The `sync-enemies` skill lists the full rules.
4. **The sheet's formula and notes.**

Don't change a formula just to match the sheet. The README documents the intended rules, so changing one is the user's call.

## 4. Lock in what's confirmed

Add a case to the sibling test of the rule it exercises, such as `src/logic/damage/ballistic.test.ts`. Follow the test rules in `.github/instructions/damage-logic.instructions.md`:

- Name it as a game statement: `it("keeps every point of a 75/10 weapon against 80% durable")`.
- Use the real stats from the report, with a one-line comment naming the source and its version.
- Test the math module directly.

Then run `npm test`.

## 5. Report

State the sheet version, the pairs compared, and how many change shots to kill. Then give one row per group: what it is, the count, a concrete example, and the decision or the question it needs. Separate confirmed repo bugs from open disagreements, and say which results you checked and which you only inferred.
