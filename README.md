# Helldivers 2 — shots to break (calculator)

Small React (Vite) app that estimates **how many hits** it takes to destroy a body part, using:

- **Armor:** penetration vs part rating → 100% (red), 65% (white), or 0% (ricochet).
- **Durability %:** blends **standard** and **durable** weapon stats:  
  `floor(Std × (1 − D%) + Dur × D%)`, then armor multiplier, then `floor`.
- **Explosive:** fixed **AP 3** vs armor, optional **explosive resistance %** on the target (multiplies explosive damage only). Supports **combined** ballistic + listed explosive damage.

This is a fan helper; always double-check numbers against the wiki and in-game behavior.

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
