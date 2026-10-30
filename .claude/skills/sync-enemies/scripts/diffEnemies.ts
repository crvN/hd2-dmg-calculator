/**
 * Lists what an enemy sync changed, comparing two enemy data files by enemy and part id.
 *
 *   node .claude/skills/sync-enemies/scripts/diffEnemies.ts src/data/enemies.json <new-file>
 *
 * Compares whatever fields the parts have, so it keeps working as the part shape changes.
 */
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";

type Part = Record<string, unknown> & { id: string };
type Enemy = Record<string, unknown> & { id: string; parts: Part[] };
type EnemyFile = { fetchedAt?: string; enemies: Enemy[] };

const { positionals } = parseArgs({ allowPositionals: true });
const [oldPath, newPath] = positionals;
if (!oldPath || !newPath)
  throw new Error("Pass the old file, then the new file.");

const readEnemyFile = (path: string) =>
  JSON.parse(readFileSync(path, "utf8")) as EnemyFile;

function byId<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

function onlyInFirst<T>(
  first: Map<string, T>,
  second: Map<string, T>,
): string[] {
  return [...first.keys()].filter((id) => !second.has(id));
}

function changedFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): string[] {
  const fields = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...fields]
    .filter(
      (field) =>
        field !== "parts" &&
        JSON.stringify(before[field]) !== JSON.stringify(after[field]),
    )
    .map(
      (field) =>
        `${field}: ${JSON.stringify(before[field])} -> ${JSON.stringify(after[field])}`,
    );
}

function printEnemyChanges(before: Enemy, after: Enemy): void {
  const beforeParts = byId(before.parts);
  const afterParts = byId(after.parts);
  const lines = [
    ...changedFields(before, after),
    ...onlyInFirst(afterParts, beforeParts).map((id) => `part added: ${id}`),
    ...onlyInFirst(beforeParts, afterParts).map((id) => `part removed: ${id}`),
  ];
  for (const [id, part] of beforeParts) {
    const updated = afterParts.get(id);
    if (!updated) continue;
    lines.push(...changedFields(part, updated).map((line) => `${id} ${line}`));
  }
  if (lines.length === 0) return;
  console.log(`\n${after.id}`);
  for (const line of lines) console.log(`  ${line}`);
}

const oldFile = readEnemyFile(oldPath);
const newFile = readEnemyFile(newPath);
const oldEnemies = byId(oldFile.enemies);
const newEnemies = byId(newFile.enemies);

console.log(
  `Old: ${oldFile.enemies.length} enemies, fetched ${oldFile.fetchedAt}`,
);
console.log(
  `New: ${newFile.enemies.length} enemies, fetched ${newFile.fetchedAt}`,
);
console.log(
  `Enemies added: ${onlyInFirst(newEnemies, oldEnemies).join(", ") || "none"}`,
);
console.log(
  `Enemies removed: ${onlyInFirst(oldEnemies, newEnemies).join(", ") || "none"}`,
);

for (const [id, enemy] of newEnemies) {
  const previous = oldEnemies.get(id);
  if (previous) printEnemyChanges(previous, enemy);
}
