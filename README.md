# Helldivers 2 — shots to break (calculator)

Small React (Vite) app that estimates **how many hits** it takes to destroy a body part, using:

- **Armor:** penetration vs part rating → 100% (red), 65% (white), or 0% (ricochet).
- **Durability %:** blends **standard** and **durable** weapon stats:  
  `floor((Std × (1 − D%) + Dur × D%) × armor multiplier)`, rounding down once, at the end.
- **Explosive:** the explosion's own **AP** vs armor (AP 3 for most weapons), optional **explosive resistance %** on the target (multiplies explosive damage only). Supports **combined** ballistic + listed explosive damage.

This is a fan helper; always double-check numbers against the wiki and in-game behavior.

## Data sources

- **Stratagem and primary weapons:** loaded in the browser from the [Helldivers 2 Data API](https://github.com/DionathaGoulart/Helldivers-api) by DionathaGoulart, based on [The Helldivers Wiki](https://helldivers.wiki.gg), under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). Backpacks and utility strikes (smoke, EMS) are left out. Mapped weapons are cached in `localStorage` for one day. If a refresh fails, the last saved data stays in use. The data is for non-commercial use. Weapon images are loaded from the API and belong to the game, not the CC license.
- **Enemies:** the API has no enemy data, so `src/data/enemies.json` is a snapshot of [The Helldivers Wiki](https://helldivers.wiki.gg/wiki/Factions) (CC BY-NC-SA 4.0), including health and armor that change with difficulty. Refresh it with `npm run sync:enemies -- --refresh`, then review the diff. The script reads only `/wiki/` pages, at most one every 3 seconds, because the wiki's `robots.txt` disallows `api.php`. It writes nothing if a page can't be read. Body part pictures aren't bundled: the file stores their names, and the browser loads each one from the wiki when that part is selected, so they need the wiki to be reachable.
- **Railgun charge timings, a few ammo labels, and explosion AP:** not in the API, so they live in `WEAPON_OVERRIDES` in `src/data/catalogWeapons.ts`. Explosion AP values come from the DiversDex spreadsheet (version 2.3), and any explosion not listed there is treated as AP 3.

## Local dev

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy on Vercel

1. Push this folder to a Git repository (or use Vercel CLI).
2. In [Vercel](https://vercel.com), **New Project** → import the repo.
3. Framework preset: **Vite** (or leave auto-detect). Root: this directory. Build: `npm run build`, output: `dist`.

Alternatively:

```bash
npx vercel
```

`vercel.json` sets the output directory to `dist` for clarity.
