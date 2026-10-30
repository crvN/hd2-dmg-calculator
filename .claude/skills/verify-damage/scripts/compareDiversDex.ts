/**
 * Compares this repo's damage pipeline and enemy data with the DiversDex workbook.
 *
 *   unzip -q -o tmp/diversdex.xlsx -d <scratch>/diversdex
 *   node .claude/skills/verify-damage/scripts/compareDiversDex.ts <scratch>/diversdex
 *
 * Run from the repo root. The workbook's saved results only cover the weapon and target selected
 * when it was exported, so this ports the sheet's formula and applies it to the sheet's tables.
 */
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { runnerImport } from "vite";

type Cell = { value?: string; formula?: string };
type Row = Record<string, string | undefined>;

const EXAMPLES_PER_GROUP = 6;
const LISTED_PER_SECTION = 30;
const ENEMY_DATA_FILE = "src/data/enemies.json";
/** The formula cells the port below copies; a change means the port must be re-read. */
const PORTED_FORMULAS: Record<string, string> = {
  _calcProjStd: "ROUNDDOWN(_dataProjStd*",
  _targetProjStd: "_calcProjStd*(1-_targetDur)*_targetProjCoeff",
  _targetProjDur: "_calcProjDur*_targetDur*_targetProjCoeff",
  _targetProjSumX: "ROUNDDOWN(SUM(_targetProjSum),0)",
  _targetExplStd:
    '"damage","explosion",0) * (1 - _targetDur) * (1-_targetExpl) * _targetExplCoeff',
  _targetBTK: "ROUNDUP(CHECK_HP(_checkA)/_targetTotal,0)",
};

const { positionals } = parseArgs({ allowPositionals: true });
const unzippedDir = positionals[0];
if (!unzippedDir)
  throw new Error("Pass the directory holding the unzipped workbook.");

function decodeXml(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

const readPart = (path: string) =>
  readFileSync(join(unzippedDir, path), "utf8");
const workbookXml = readPart("xl/workbook.xml");
const sharedStrings = [
  ...readPart("xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g),
].map(([, item]) =>
  decodeXml(
    [...item.matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map(([, t]) => t).join(""),
  ),
);

function sheetPath(sheetName: string): string {
  const escapedName = sheetName.replace(/&/g, "&amp;");
  const tag = [...workbookXml.matchAll(/<sheet\b[^>]*>/g)]
    .map(([sheetTag]) => sheetTag)
    .find((sheetTag) => sheetTag.includes(`name="${escapedName}"`));
  const relationId = tag?.match(/r:id="([^"]+)"/)?.[1];
  if (!relationId) throw new Error(`No sheet named "${sheetName}".`);
  const relation = [
    ...readPart("xl/_rels/workbook.xml.rels").matchAll(
      /<Relationship\b[^>]*>/g,
    ),
  ]
    .map(([relationTag]) => relationTag)
    .find((relationTag) => relationTag.includes(`Id="${relationId}"`));
  return `xl/${relation?.match(/Target="([^"]+)"/)?.[1].replace(/^\/?xl\//, "")}`;
}

function readCells(sheetName: string): Map<string, Cell> {
  const cells = new Map<string, Cell>();
  const cellPattern = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
  for (const [, attributes, body] of readPart(sheetPath(sheetName)).matchAll(
    cellPattern,
  )) {
    const ref = attributes.match(/r="([A-Z]+\d+)"/)?.[1];
    if (!ref || !body) continue;
    const raw = body.match(/<v>([^<]*)<\/v>/)?.[1];
    const formula = body.match(/<f[^>]*>([^<]*)<\/f>/)?.[1];
    cells.set(ref, {
      value:
        attributes.includes('t="s"') && raw !== undefined
          ? sharedStrings[Number(raw)]
          : raw && decodeXml(raw),
      formula: formula && decodeXml(formula),
    });
  }
  return cells;
}

/** Rows keyed by the header text in row 1, so a new copy of the sheet can reorder its columns. */
function readTable(sheetName: string): Row[] {
  const rows = new Map<number, Row>();
  const headers = new Map<string, string>();
  const cells = [...readCells(sheetName)].map(([ref, cell]) => {
    const [, column, row] = ref.match(/^([A-Z]+)(\d+)$/) as RegExpMatchArray;
    return { column, row: Number(row), value: cell.value };
  });
  for (const cell of cells) {
    if (cell.row === 1 && cell.value) headers.set(cell.column, cell.value);
  }
  for (const cell of cells) {
    const header = headers.get(cell.column);
    if (cell.row === 1 || !header) continue;
    rows.set(cell.row, { ...rows.get(cell.row), [header]: cell.value });
  }
  return [...rows.values()];
}

function toNumber(text: string | undefined): number | undefined {
  if (text === undefined || text.trim() === "") return undefined;
  const value = Number(text);
  return Number.isFinite(value) ? value : undefined;
}

/** Sheets drops noise past 15 significant digits before rounding down; plain Math.floor does not. */
function sheetFloor(value: number): number {
  return Math.floor(Number(value.toPrecision(15)));
}

function armorFactor(armorRating: number, penetration: number): number {
  if (penetration < armorRating) return 0;
  return penetration === armorRating ? 0.65 : 1;
}

type DamageRow = { standard: number; durable: number; penetration: number };
type PartStats = {
  hitPoints: number;
  armorRating: number;
  durableRatio: number;
  explosiveResistRatio: number;
};

function sheetProjectileDamage(
  projectile: DamageRow,
  part: PartStats,
  falloff = 0,
): number {
  const coefficient = armorFactor(part.armorRating, projectile.penetration);
  const standard = sheetFloor(projectile.standard * (1 - falloff));
  const durable = sheetFloor(projectile.durable * (1 - falloff));
  return sheetFloor(
    standard * (1 - part.durableRatio) * coefficient +
      durable * part.durableRatio * coefficient,
  );
}

function sheetExplosionDamage(
  explosion: DamageRow | undefined,
  part: PartStats,
): number {
  if (!explosion) return 0;
  const coefficient = armorFactor(part.armorRating, explosion.penetration);
  const afterResist = (1 - part.explosiveResistRatio) * coefficient;
  return sheetFloor(
    explosion.standard * (1 - part.durableRatio) * afterResist +
      explosion.durable * part.durableRatio * afterResist,
  );
}

function assertPortMatchesWorkbook(): string {
  const calculator = readCells("Breakpoint calculator");
  const named = new Map<string, Cell | undefined>();
  for (const [, name, ref] of workbookXml.matchAll(
    /<definedName\b[^>]*name="([^"]+)"[^>]*>([^<]*)</g,
  )) {
    const cellRef = decodeXml(ref).match(
      /^'Breakpoint calculator'!\$([A-Z]+)\$(\d+)$/,
    );
    if (cellRef) named.set(name, calculator.get(cellRef[1] + cellRef[2]));
  }
  const text = (name: string) => named.get(name)?.value;
  const number = (name: string) => toNumber(text(name)) ?? 0;

  for (const [name, expected] of Object.entries(PORTED_FORMULAS)) {
    if (!named.get(name)?.formula?.includes(expected)) {
      throw new Error(
        `${name} no longer contains "${expected}". Re-read the sheet's formula.`,
      );
    }
  }
  const part: PartStats = {
    hitPoints: number("_targetHP"),
    armorRating: number("_targetAV"),
    durableRatio: number("_targetDur"),
    explosiveResistRatio: number("_targetExpl"),
  };
  const projectile: DamageRow = {
    standard: number("_dataProjStd"),
    durable: number("_dataProjDur"),
    penetration: number("_targetProjAP"),
  };
  const ported = sheetProjectileDamage(
    projectile,
    part,
    number("_calcFallOff"),
  );
  if (ported !== number("_targetProjSumX")) {
    throw new Error(
      `The port gives ${ported}, the workbook saved ${text("_targetProjSumX")}.`,
    );
  }
  return `${text("_weaponFullName")} vs ${text("_targetFullName")}: ${ported} damage per projectile, as saved`;
}

type WeaponCase = {
  name: string;
  projectile: DamageRow;
  explosion?: DamageRow;
};

function damageRow(row: Row): DamageRow {
  return {
    standard: toNumber(row["Damage"]) ?? 0,
    durable: toNumber(row["Durable"]) ?? 0,
    penetration: toNumber(row["AP direct"]) ?? 0,
  };
}

/** Beams and sprays list damage over time, so only counted projectiles are comparable per shot. */
function readWeapons(): { weapons: WeaponCase[]; skipped: number } {
  const rows = readTable("Weapon stats");
  const projectileRows = rows.filter(
    (row) => row["Type"]?.toLowerCase() === "projectile",
  );
  const weapons = projectileRows
    .filter((row) => toNumber(row["Projectiles"]) !== undefined)
    .map((row) => {
      const explosion = rows.find(
        (other) =>
          other["Full name"] === row["Full name"] &&
          other["Type"]?.toLowerCase() === "explosion",
      );
      return {
        name: row["Full name"] ?? "",
        projectile: damageRow(row),
        explosion: explosion && damageRow(explosion),
      };
    });
  return { weapons, skipped: projectileRows.length - weapons.length };
}

type EnemyPartRow = PartStats & {
  name: string;
  faction: string;
  enemy: string;
  part: string;
};

function readParts(): EnemyPartRow[] {
  return readTable("Enemy stats").flatMap((row) => {
    const hitPoints = toNumber(row["HP"]);
    const armorRating = toNumber(row["Armor"]);
    const durableRatio = toNumber(row["Durability"]);
    if (
      !hitPoints ||
      hitPoints <= 0 ||
      armorRating === undefined ||
      durableRatio === undefined
    ) {
      return [];
    }
    return [
      {
        name: row["Full name"] ?? "",
        faction: row["Faction"] ?? "",
        enemy: (row["Enemy"] ?? "").split(" / ").pop() ?? "",
        part: row["Part"] ?? "",
        hitPoints,
        armorRating,
        durableRatio,
        explosiveResistRatio: toNumber(row["ExDR"]) ?? 0,
      },
    ];
  });
}

type ShotOutcome = {
  ballisticDamage: number;
  explosiveDamage: number;
  shotsToKill: number | null;
};
type Finding = {
  group: string;
  shotsGap: number;
  text: string;
};

const toPercent = (ratio: number) => Number((ratio * 100).toFixed(6));

function disagreementGroup(
  weapon: WeaponCase,
  part: PartStats,
  repo: ShotOutcome,
  sheetBallistic: number,
  sheetExplosive: number,
): string | null {
  const { projectile, explosion } = weapon;
  if (repo.ballisticDamage !== sheetBallistic) {
    return Number.isInteger(projectile.standard) &&
      Number.isInteger(projectile.durable)
      ? "Ballistic: other"
      : "Ballistic: sheet rounds fractional stats down before mixing";
  }
  if (repo.explosiveDamage === sheetExplosive) return null;
  return part.durableRatio > 0 && explosion?.durable !== explosion?.standard
    ? "Explosive: sheet splits explosions by durability"
    : "Explosive: other";
}

async function compareFormulas(
  weapons: WeaponCase[],
  parts: EnemyPartRow[],
): Promise<void> {
  const { module } = await runnerImport<{
    calculateShot: (input: Record<string, unknown>) => ShotOutcome;
  }>(resolve("src/logic/damage/index.ts"), {
    configFile: false,
    logLevel: "error",
  });

  const findings = new Map<string, Finding[]>();
  let pairs = 0;
  let shotsDiffer = 0;
  for (const weapon of weapons) {
    const { projectile, explosion } = weapon;
    const hasDirect = projectile.standard + projectile.durable > 0;
    const damageMode = explosion
      ? hasDirect
        ? "combined"
        : "explosive"
      : "ballistic";
    for (const part of parts) {
      pairs += 1;
      const repo = module.calculateShot({
        hitPoints: part.hitPoints,
        durablePercent: toPercent(part.durableRatio),
        armorRating: part.armorRating,
        explosiveResistPercent: toPercent(part.explosiveResistRatio),
        standardDamage: projectile.standard,
        durableDamage: projectile.durable,
        penetration: projectile.penetration,
        explosiveDamage: explosion?.standard ?? 0,
        explosivePenetration: explosion?.penetration ?? 0,
        damageMode,
      });
      const sheetBallistic = sheetProjectileDamage(projectile, part);
      const sheetExplosive = sheetExplosionDamage(explosion, part);
      const group = disagreementGroup(
        weapon,
        part,
        repo,
        sheetBallistic,
        sheetExplosive,
      );
      if (!group) continue;

      const sheetTotal = sheetBallistic + sheetExplosive;
      const sheetShots =
        sheetTotal > 0 ? Math.ceil(part.hitPoints / sheetTotal) : null;
      if (sheetShots !== repo.shotsToKill) shotsDiffer += 1;
      const list = findings.get(group) ?? [];
      list.push({
        group,
        shotsGap:
          sheetShots === null || repo.shotsToKill === null
            ? Number.POSITIVE_INFINITY
            : Math.abs(sheetShots - repo.shotsToKill),
        text:
          `${weapon.name} vs ${part.name}: repo ${repo.ballisticDamage}+${repo.explosiveDamage} ` +
          `= ${repo.shotsToKill} shots, sheet ${sheetBallistic}+${sheetExplosive} = ${sheetShots} shots ` +
          `(HP ${part.hitPoints}, AV ${part.armorRating}, durable ${toPercent(part.durableRatio)}%, ` +
          `ExDR ${toPercent(part.explosiveResistRatio)}%; std ${projectile.standard}, dur ${projectile.durable}, ` +
          `AP ${projectile.penetration}${explosion ? `; explosion ${explosion.standard}/${explosion.durable} AP ${explosion.penetration}` : ""})`,
      });
      findings.set(group, list);
    }
  }

  const disagreeing = [...findings.values()].reduce(
    (sum, list) => sum + list.length,
    0,
  );
  console.log(
    `\nFORMULAS: ${pairs} weapon/part pairs, no falloff, one projectile per shot`,
  );
  console.log(`  Damage per shot differs: ${disagreeing}`);
  console.log(`  Shots to kill differs:   ${shotsDiffer}`);
  for (const [group, list] of findings) {
    const changesShots = list.filter((finding) => finding.shotsGap > 0).length;
    console.log(
      `\n  ${group}: ${list.length} pairs, ${changesShots} change shots to kill`,
    );
    const examples = [...list]
      .sort((a, b) => b.shotsGap - a.shotsGap)
      .slice(0, EXAMPLES_PER_GROUP);
    for (const example of examples) console.log(`    - ${example.text}`);
  }
}

/** The wiki says "Claws" where the sheet says "Claw (each)", so plurals and notes are dropped. */
function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/\[|\]/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/s\b/g, "")
    .trim();
}

type RepoPart = {
  label: string;
  hitPointsByDifficulty: { hitPoints: number }[];
  armorByDifficulty: { armorRating: number }[];
  durablePercent: number;
  explosiveResistPercent: number;
};
type RepoEnemy = { name: string; parts: RepoPart[] };

/** A value matching any difficulty tier counts as agreeing: the sheet lists only one tier. */
function partDifferences(part: RepoPart, sheet: EnemyPartRow): string[] {
  const checks: [string, number[], number][] = [
    [
      "hp",
      part.hitPointsByDifficulty.map((tier) => tier.hitPoints),
      sheet.hitPoints,
    ],
    [
      "armor",
      part.armorByDifficulty.map((tier) => tier.armorRating),
      sheet.armorRating,
    ],
    ["durable%", [part.durablePercent], toPercent(sheet.durableRatio)],
    [
      "ExDR%",
      [part.explosiveResistPercent],
      toPercent(sheet.explosiveResistRatio),
    ],
  ];
  return checks
    .filter(
      ([, values, expected]) => values.length > 0 && !values.includes(expected),
    )
    .map(
      ([field, values, expected]) =>
        `${field} ${values.join("/")} vs ${expected}`,
    );
}

function printList(title: string, items: string[]): void {
  console.log(`  ${title}: ${items.length}`);
  for (const item of items.slice(0, LISTED_PER_SECTION))
    console.log(`    - ${item}`);
  if (items.length > LISTED_PER_SECTION) {
    console.log(`    ... and ${items.length - LISTED_PER_SECTION} more`);
  }
}

function compareEnemyData(parts: EnemyPartRow[]): void {
  const { enemies } = JSON.parse(readFileSync(ENEMY_DATA_FILE, "utf8")) as {
    enemies: RepoEnemy[];
  };
  const differences: string[] = [];
  const missing: string[] = [];
  let compared = 0;
  for (const enemy of enemies) {
    const sheetParts = parts.filter(
      (row) => normalizeLabel(row.enemy) === normalizeLabel(enemy.name),
    );
    for (const part of enemy.parts) {
      const sheet = sheetParts.find(
        (row) => normalizeLabel(row.part) === normalizeLabel(part.label),
      );
      if (!sheet) {
        missing.push(`${enemy.name} / ${part.label}`);
        continue;
      }
      compared += 1;
      const changed = partDifferences(part, sheet);
      if (changed.length > 0)
        differences.push(
          `${enemy.name} / ${part.label}: ${changed.join(", ")}`,
        );
    }
  }
  console.log(
    `\nENEMY DATA: ${compared} parts in ${ENEMY_DATA_FILE} matched to the sheet (repo vs sheet)`,
  );
  printList("Stats differ", differences);
  printList("No sheet row found", missing);
}

const version = readCells("Intro  READ FIRST");
const versionCell = [...version.values()].find((cell) =>
  /^\d+\.\d+/.test(cell.value ?? ""),
);
console.log(`DiversDex version: ${versionCell?.value ?? "unknown"}`);
console.log(`Port check: ${assertPortMatchesWorkbook()}`);

const { weapons, skipped } = readWeapons();
const parts = readParts();
console.log(
  `Sheet tables: ${weapons.length} weapons (${skipped} beam or spray skipped), ${parts.length} parts`,
);
await compareFormulas(weapons, parts);
compareEnemyData(parts);
