---
name: "React View Composition"
description: "Use when writing or refactoring React components, hooks, or JSX for the shots-to-kill calculator. Enforces presentational components, composition over props explosion, and no calculation logic in the view layer."
applyTo: "src/**/*.tsx, src/hooks/**"
---

# View Layer Rules

The view renders values. It never computes them.

## No logic in components

- Components contain JSX, event wiring, and formatting for display — nothing else.
- No damage math, no armor comparison, no `Math.floor`/`Math.ceil` in a `.tsx` file.
  Import the rule from `src/logic/` instead.
- Parsing user input (`parseFloat`, clamping, defaults) belongs to the hook/logic layer, not the JSX.
- If a component needs a derived value, add a named function to the logic layer and call it.

## Composition over configuration

- Build screens by nesting small components, not by adding flags:

```tsx
// good
<TargetCard>
  <StatField label="Body part HP" value={hitPoints} />
  <ArmorField rating={armorRating} onChange={setArmorRating} />
</TargetCard>

// avoid
<TargetCard showArmor showResist variant="wiki" compact />
```

- Prefer `children` and slot props (`header`, `footer`) over boolean variants. Two booleans that control
  layout is the signal to split the component.
- One component per file, named export matching the filename, in `src/components/`.
- A component should fit on one screen (~60 lines of JSX). Extract a child instead of scrolling.
- Repeated JSX shapes (labelled input, stat row, hitmarker badge) become their own component the second time
  they appear.

## Props

- Props are already-computed, display-ready values plus callbacks. No raw state bags.
- Name callbacks `onX` and handlers `handleX`.
- Group related props into a typed object exported next to the component
  (`export type TargetCardProps = { ... }`), and keep the list short — many props means the
  component wants to be composed, not configured.
- Never pass the whole calculator state down; pass what the component renders.

## Hooks

- `src/hooks/` holds state wiring only: `useState`, `useMemo` calls that *delegate* to pure functions.
- A `useMemo` body should read as a few named calls. If it grows an algorithm, move the algorithm to
  `src/logic/` and call it from the memo.
- Split a hook once it manages two unrelated concerns (e.g. entry-mode selection vs. charge controls) —
  small hooks compose into one.
- Hooks return a flat, named result object; do not return tuples of anonymous values.

## Styling and accessibility

- Class names in `App.css`, kebab-case, semantic (`.result-card`, `.hitmarker--ricochet`). No inline style objects
  for anything reusable.
- Every input has an associated `<label>`; selects and toggles are keyboard reachable.
- Show the "cannot kill" case explicitly in the UI rather than rendering an empty or `Infinity` value.
