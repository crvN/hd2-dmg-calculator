---
name: sync-enemies
description: Refresh enemy body-part data from The Helldivers Wiki with the repo's sync script, review what the parser flagged, and diff the result against the current data before replacing it. Use whenever the user wants to update, refresh or add enemy stats, says a game patch changed enemies, mentions `sync:enemies` or `enemies.json`, or asks to pull anything from helldivers.wiki.gg, even if they don't name the script.
---

# Sync enemy data from the wiki

The wiki is a community site that lets scripts read it on stated terms, so staying inside those terms comes before getting the data. The script enforces most of them. Your job is to keep them intact and to review the result, because a clean parse can still hold wrong or surprising data.

## The wiki's rules

- Read `/wiki/` pages only. `robots.txt` disallows `api.php`, `index.php`, `rest.php`, `/wiki/Data:`, `Special:` pages and `?action=` URLs, even though they respond.
- Go through `scripts/syncEnemies.ts`, which waits at least 3 seconds between requests, identifies itself, and checks `robots.txt` on every run. Don't write another fetch loop, and don't lower the delay.
- Don't retry after a refusal. An HTTP error means the wiki is asking us to stop, so report it and let the user run it later.
- If the script stops with `re-read the wiki's rules`, stop too. Show the user what changed. Only they can decide to update `REVIEWED_CONTENT_SIGNAL`.
- The data is CC BY-NC-SA 4.0, so keep the `source`, `sourceUrl` and `license` fields, and keep the app non-commercial.

## 1. Check the starting point

Run `git status`. This pipeline changes often, so read the current `scripts/syncEnemies.ts` and `src/data/types.ts` rather than relying on memory. If those files have uncommitted changes you didn't make, another session may be working on them: don't edit them, and tell the user.

## 2. Sample before the full run

Always pass `--out` with a scratchpad path. Without it, the script writes to `src/data/enemies.json`, so a sample run would replace the whole dataset with just the sampled enemies, and the diff in step 4 would have nothing to compare against.

```bash
npm run sync:enemies -- --only Warrior,Bile_Titan --out <scratchpad>/enemies-sample.json
```

`--only` takes page names as they appear in wiki URLs. Some short names are disambiguation pages that fail with `no anatomy table on this page`: `Hulk` fails, `Hulk_Bruiser` works. Look names up in the cached index at `node_modules/.cache/enemy-sync/Factions.html`.

## 3. Run the full sync

```bash
npm run sync:enemies -- --out <scratchpad>/enemies.json
```

Pages are cached in `node_modules/.cache/enemy-sync`, and a run reuses them. **After a game patch add `--refresh`**, or you will get the old data back with a new timestamp. An uncached run takes several minutes, so run it in the background.

Then handle what it reports:

- **Issues** block the output file, and that's deliberate: a page the parser can't read must not ship. Fix the parser in `scripts/enemies/parseEnemyPage.ts` with a test in `parseEnemyPage.test.ts`, using the cached HTML so you don't fetch again. Re-run without `--refresh`.
- **Warnings** are oddities the parser worked around. Read them and pass on any that affect a stat.
- A non-enemy page in the index can go in `EXCLUDED_PAGES`, with a comment saying why. Check with the user first, because that removes data from the app.

## 4. Diff against the current data

```bash
node .claude/skills/sync-enemies/scripts/diffEnemies.ts src/data/enemies.json <scratchpad>/enemies.json
```

Look for changes a patch wouldn't explain. An enemy or part that vanished usually means a page or parser problem. A field changing on every enemy usually means the parser or the wiki's layout changed, not the game. Spot-check a few surprising values against their wiki pages.

## 5. Replace the data

Copy the new file over `src/data/enemies.json` once the diff makes sense. The app loads this file directly, so the change reaches users on the next deploy. If the diff looks wrong, report it and leave the old file in place.

Run `npm test` and `npm run build`. Then use the `verify-damage` skill to compare the new stats with DiversDex.

## 6. Report

Say what changed, using the diff's numbers: enemies added or removed, and the notable stat changes. List any issues you fixed and any warnings that matter.
