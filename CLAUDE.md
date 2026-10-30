# Helldivers 2 shots-to-kill calculator

React and Vite app that answers one question: how many shots does it take to kill this body part?

## Commands

CI runs these three on every pull request:

```bash
npm run lint
npm test
npm run build   # tsc -b, then vite build
```

## Project rules

Each file's `applyTo` line says which paths it covers.

- Damage math, game data and services: @.github/instructions/damage-logic.instructions.md
- React components and hooks: @.github/instructions/react-view.instructions.md

## Data sources

- The README explains where weapon and enemy data comes from, and its licensing.
- Scripts may read only `/wiki/` pages on helldivers.wiki.gg. Its `robots.txt` disallows `api.php` and `?action=` URLs, even though they respond.
- `tmp/` holds a local DiversDex copy for cross-checking. It stays out of git.
