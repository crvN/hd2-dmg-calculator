import { load } from "cheerio";
import type {
  ArmorTier,
  EnemyBodyPart,
  HitPointsTier,
  PartImage,
} from "../../src/data/types";

type ParsedEnemyPart = EnemyBodyPart;

export type ParsedEnemyPage = {
  name: string;
  parts: ParsedEnemyPart[];
  /** Anything the parser could not read; a page with issues must not be published. */
  issues: string[];
  /** Oddities in the wiki's data that the parser worked around; worth a look, not a blocker. */
  warnings: string[];
};

export type FactionIndexEntry = {
  page: string;
  name: string;
  faction: string;
  strain: string | null;
};

/** The game's difficulty levels, named by the wiki's difficulty icons. */
const DIFFICULTY_LEVELS: Record<string, number> = {
  Trivial: 1,
  Easy: 2,
  Medium: 3,
  Challenging: 4,
  Hard: 5,
  Extreme: 6,
  "Suicide Mission": 7,
  Impossible: 8,
  Helldive: 9,
  "Super Helldive": 10,
};

/** Numeric AV per named tier, from https://helldivers.wiki.gg/wiki/Armor_Penetration. */
const ARMOR_TIERS: Record<string, number> = {
  Unarmored: 0,
  "Very Light": 1,
  Light: 2,
  Medium: 3,
  Heavy: 4,
  "Tank I": 5,
  "Tank II": 6,
  "Tank III": 7,
  "Tank IV": 8,
  "Tank V": 9,
  "Tank VI": 10,
};

const COLUMNS = {
  part: "Part Name",
  health: "Health",
  armor: "AV",
  location: "Location",
  durable: "Durable",
  toMain: "% To Main",
  overflow: "Overflow Cap?",
  constitution: "Constitution",
  fatal: "Fatal?",
  explosiveResist: "ExDR",
} as const;

type ColumnKey = keyof typeof COLUMNS;

/** Cell text with footnote markers dropped, line breaks kept, and icons as [[alt text]]. */
function cellText(cellHtml: string): string {
  const $ = load(cellHtml, null, false);
  $("sup").remove();
  $("br").replaceWith("\n");
  $("img").replaceWith((_index, image) => `[[${$(image).attr("alt") ?? ""}]]`);
  // [^\S\n] is all whitespace except newlines, which includes the wiki's non-breaking spaces.
  return $.root().text().replace(/[^\S\n]+/g, " ").trim();
}

function parseInteger(text: string): number {
  return Number(text.replace(/,/g, ""));
}

function parseHealthLine(line: string): HitPointsTier | null {
  const base = line.match(/^([\d,]+)(?:\s*\[Default\])?$/);
  if (base) return { fromDifficulty: 1, hitPoints: parseInteger(base[1]) };

  const tier = line.match(/^([\d,]+)\s+at\s+\[\[(.+?) Difficulty Icon/);
  const fromDifficulty = tier ? DIFFICULTY_LEVELS[tier[2]] : undefined;
  if (!tier || fromDifficulty === undefined) return null;
  return { fromDifficulty, hitPoints: parseInteger(tier[1]) };
}

type PartHealth = Pick<
  ParsedEnemyPart,
  "hitPointsByDifficulty" | "sharesHealthWith" | "hasInfiniteHealth"
>;

/** "Main" is the enemy's main pool; tanks name one of two pools, as in "Main (Turret)". */
function sharedHealthPool(text: string): string | null {
  const match = text.match(/^Main(?:\s*\((\w+)\))?$/);
  if (!match) return null;
  return match[1] ? `${match[1]} Main` : "Main";
}

function parseHealth(text: string, issues: string[]): PartHealth {
  const noOwnHealth = {
    hitPointsByDifficulty: [],
    sharesHealthWith: null,
    hasInfiniteHealth: false,
  };
  if (text === "Infinite") return { ...noOwnHealth, hasInfiniteHealth: true };
  const sharesHealthWith = sharedHealthPool(text);
  if (sharesHealthWith) return { ...noOwnHealth, sharesHealthWith };

  const hitPointsByDifficulty: HitPointsTier[] = [];
  for (const line of text.split("\n").map((part) => part.trim())) {
    const tier = line ? parseHealthLine(line) : null;
    if (tier) hitPointsByDifficulty.push(tier);
    else issues.push(`unreadable health "${line}"`);
  }
  return { ...noOwnHealth, hitPointsByDifficulty };
}

/** Some wiki rows put a Fatal-style value in this column, so it is reported rather than kept. */
function parseConstitution(text: string, warnings: string[]): string | null {
  if (text === "None" || text === "-") return null;
  if (/^([\d,]+ )?\[-?[\d,.]+\/s\]$/.test(text)) return text;
  warnings.push(`constitution column holds "${text.replace(/\s+/g, " ")}"`);
  return null;
}

/** "Light, Medium at [Extreme]": each rating after the first starts at the next difficulty icon. */
function armorTiers(
  ratings: number[],
  cellHtml: string,
  issues: string[],
): ArmorTier[] {
  const starts = [...cellHtml.matchAll(/alt="([^"]+?) Difficulty Icon/g)].map(
    (match) => DIFFICULTY_LEVELS[match[1]],
  );
  if (starts.length !== ratings.length - 1 || starts.some((start) => !start)) {
    issues.push(`unreadable armor tiers "${cellText(cellHtml)}"`);
    return [];
  }
  return ratings.map((armorRating, index) => ({
    fromDifficulty: index === 0 ? 1 : starts[index - 1],
    armorRating,
  }));
}

/** The tier name and the icon both state the rating, so a mismatch means the page is inconsistent. */
function parseArmor(
  cellHtml: string,
  text: string,
  issues: string[],
): ArmorTier[] {
  const ratings = [...cellHtml.matchAll(/Armor_AV(\d+)_Icon/g)].map((match) =>
    Number(match[1]),
  );
  if (ratings.length > 1) return armorTiers(ratings, cellHtml, issues);

  const nameRating = ARMOR_TIERS[text.replace(/\[\[.*?\]\]/g, "").trim()];
  if (nameRating === undefined) {
    issues.push(`unreadable armor "${text}"`);
    return [];
  }
  const armorRating = ratings[0] ?? nameRating;
  if (nameRating !== armorRating) {
    issues.push(`armor icon says ${armorRating} but name says ${nameRating}`);
  }
  return [{ fromDifficulty: 1, armorRating }];
}

/** For a stat every part must have, where a dash would leave the calculator with nothing to use. */
function requiredPercent(
  text: string,
  field: string,
  issues: string[],
): number {
  const percent = parsePercent(text, field, issues);
  if (percent === null && text === "-") issues.push(`no ${field} listed`);
  return percent ?? 0;
}

function parsePercent(
  text: string,
  field: string,
  issues: string[],
): number | null {
  const match = text.match(/^(\d+(?:\.\d+)?)%$/);
  if (match) return Number(match[1]);
  if (text !== "-") issues.push(`unreadable ${field} "${text}"`);
  return null;
}

function parseYesNo(
  text: string,
  field: string,
  issues: string[],
): boolean | null {
  if (text === "Yes") return true;
  if (text === "No") return false;
  if (text !== "-") issues.push(`unreadable ${field} "${text}"`);
  return null;
}

/** The Fatal column can add a second line, as in "No / Downs" or "Yes / (Downs)". */
function parseFatal(
  text: string,
  issues: string[],
): Pick<ParsedEnemyPart, "isFatal" | "downsEnemy"> {
  const [verdict, detail] = text.split("\n").map((line) => line.trim());
  const downsEnemy = detail === "Downs" || detail === "(Downs)";
  if (detail !== undefined && !downsEnemy) {
    issues.push(`unreadable fatal "${text}"`);
  }
  return { isFatal: parseYesNo(verdict, "fatal", issues), downsEnemy };
}

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** The count can sit mid-name, as in "Side Circuits (2) (Broken Side Armor)". */
function partIdentity(
  rawLabel: string,
): Pick<ParsedEnemyPart, "id" | "label" | "count"> {
  const singleLine = rawLabel.replace(/\s*\n\s*/g, " ");
  const count = singleLine.match(/\((\d+)\)/)?.[1];
  const label = singleLine.replace(/\s*\(\d+\)/, "").trim();
  return { id: slug(label), label, count: count ? Number(count) : 1 };
}

function partImage(
  src: string | undefined,
  view: string | null,
  warnings: string[],
): PartImage[] {
  const match = src?.match(/^\/images\/thumb\/([^/]+)\/\d+px-[^?]+\?(\w+)$/);
  if (!match) {
    warnings.push(`unexpected image address "${src}"`);
    return [];
  }
  return [{ view, file: match[1], version: match[2] }];
}

/** The Location column holds one picture, or one per angle in tabs like Front and Side. */
function parsePartImages(cellHtml: string, warnings: string[]): PartImage[] {
  const $ = load(cellHtml, null, false);
  const panels = $("article.tabber__panel").toArray();
  if (panels.length === 0) {
    return $("img")
      .toArray()
      .flatMap((image) => partImage($(image).attr("src"), null, warnings));
  }
  return panels.flatMap((panel) => {
    const labelId = $(panel).attr("aria-labelledby");
    const tab = $("a.tabber__tab").filter((_i, a) => $(a).attr("id") === labelId);
    const view = tab.first().text().trim() || null;
    return $(panel)
      .find("img")
      .toArray()
      .flatMap((image) => partImage($(image).attr("src"), view, warnings));
  });
}

function parsePartRow(
  cells: Record<ColumnKey, string>,
  issues: string[],
  warnings: string[],
): ParsedEnemyPart {
  const text = (key: ColumnKey) => cellText(cells[key]);
  const identity = partIdentity(text("part"));
  const partIssues: string[] = [];
  const partWarnings: string[] = [];
  const part: ParsedEnemyPart = {
    ...identity,
    section: null,
    images: parsePartImages(cells.location, partWarnings),
    ...parseHealth(text("health"), partIssues),
    armorByDifficulty: parseArmor(cells.armor, text("armor"), partIssues),
    durablePercent: requiredPercent(text("durable"), "durable", partIssues),
    explosiveResistPercent: requiredPercent(
      text("explosiveResist"),
      "ExDR",
      partIssues,
    ),
    percentToMain: parsePercent(text("toMain"), "% to main", partIssues),
    capsOverflowToMain: parseYesNo(text("overflow"), "overflow", partIssues),
    ...parseFatal(text("fatal"), partIssues),
    constitution: parseConstitution(text("constitution"), partWarnings),
  };
  if (text("constitution").includes("Downs")) part.downsEnemy = true;
  issues.push(...partIssues.map((issue) => `${identity.label}: ${issue}`));
  warnings.push(...partWarnings.map((note) => `${identity.label}: ${note}`));
  return part;
}

function columnIndexes(headers: string[]): Record<ColumnKey, number> | null {
  const entries = Object.entries(COLUMNS).map(
    ([key, header]) => [key, headers.indexOf(header)] as const,
  );
  if (entries.some(([, index]) => index === -1)) return null;
  return Object.fromEntries(entries) as Record<ColumnKey, number>;
}

function parseAnatomyTable(
  tableHtml: string,
  issues: string[],
  warnings: string[],
): ParsedEnemyPart[] {
  const $ = load(tableHtml, null, false);
  const rows = $("table").first().find("> tbody > tr").toArray();
  const headers = $(rows[0])
    .children("th")
    .toArray()
    .map((header) => cellText($.html(header)));
  const columns = columnIndexes(headers);
  if (!columns) {
    issues.push(`unexpected anatomy columns: ${headers.join(", ")}`);
    return [];
  }
  return rows.slice(1).flatMap((row) => {
    const cells = $(row).children("td").toArray();
    const cellOf = (key: ColumnKey) => $(cells[columns[key]]).html() ?? "";
    const rowCells = Object.fromEntries(
      (Object.keys(COLUMNS) as ColumnKey[]).map((key) => [key, cellOf(key)]),
    ) as Record<ColumnKey, string>;
    if (cellText(rowCells.health) === "-") {
      warnings.push(`${cellText(rowCells.part)}: no health listed, so skipped`);
      return [];
    }
    return [parsePartRow(rowCells, issues, warnings)];
  });
}

function addMissingImages(part: ParsedEnemyPart, images: PartImage[]): void {
  const files = new Set(part.images.map((image) => image.file));
  part.images.push(...images.filter((image) => !files.has(image.file)));
}

/** Hive Lord's tabs repeat one table with different pictures, so they merge rather than become states. */
function mergeRepeatedTables(
  tables: { section: string; parts: ParsedEnemyPart[] }[],
): { section: string; parts: ParsedEnemyPart[] }[] {
  const merged = new Map<string, (typeof tables)[number]>();
  for (const table of tables) {
    const key = JSON.stringify(table.parts.map((p) => ({ ...p, images: [] })));
    const first = merged.get(key);
    if (first) {
      first.parts.forEach((part, index) =>
        addMissingImages(part, table.parts[index].images),
      );
    } else {
      merged.set(key, table);
    }
  }
  return [...merged.values()];
}

function missingHealthPools(parts: ParsedEnemyPart[]): string[] {
  const labels = new Set(parts.map((part) => part.label));
  return parts
    .filter((part) => part.sharesHealthWith && !labels.has(part.sharesHealthWith))
    .map((part) => `${part.label}: no part named "${part.sharesHealthWith}"`);
}

function duplicateIdIssues(parts: ParsedEnemyPart[]): string[] {
  const ids = parts.map((part) => part.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  return duplicates.length > 0
    ? [`duplicate part ids: ${[...new Set(duplicates)].join(", ")}`]
    : [];
}

export function parseEnemyPage(html: string): ParsedEnemyPage {
  const $ = load(html);
  const issues: string[] = [];
  const warnings: string[] = [];
  const name = $("#firstHeading").text().trim();
  const tables = $("#mw-content-text table.wikitable")
    .toArray()
    .filter((table) =>
      $(table).find("> tbody > tr").first().text().includes(COLUMNS.part),
    );
  if (tables.length === 0) {
    return { name, parts: [], issues: ["no anatomy table on this page"], warnings };
  }
  const sections = mergeRepeatedTables(
    tables.map((table) => {
      const labelId = $(table).closest("article.tabber__panel").attr("aria-labelledby");
      const tab = $("a.tabber__tab").filter((_i, a) => $(a).attr("id") === labelId);
      return {
        section: tab.first().text().trim(),
        parts: parseAnatomyTable($.html(table), issues, warnings),
      };
    }),
  );
  if (sections.length > 1 && sections.some(({ section }) => !section)) {
    issues.push("several anatomy tables, but one has no tab name");
  }
  const parts = sections.flatMap(({ section, parts: sectionParts }) =>
    sections.length === 1
      ? sectionParts
      : sectionParts.map((part) => ({
          ...part,
          id: `${slug(section)}-${part.id}`,
          section,
        })),
  );
  issues.push(...missingHealthPools(parts), ...duplicateIdIssues(parts));
  return { name, parts, issues, warnings };
}

/** Lists every enemy on the Factions page, which has one table per faction or strain heading. */
export function parseFactionIndex(html: string): FactionIndexEntry[] {
  const $ = load(html);
  const entries = new Map<string, FactionIndexEntry>();
  let faction = "";
  let strain: string | null = null;
  for (const element of $(
    "#mw-content-text h2, #mw-content-text h3, #mw-content-text table.wikitable",
  ).toArray()) {
    const heading = $(element).find("[id]").first().text().trim();
    if (element.tagName === "h2") {
      faction = heading;
      strain = null;
    } else if (element.tagName === "h3") {
      strain = heading;
    } else {
      for (const link of $(element).find("td:nth-child(2) a[href^='/wiki/']").toArray()) {
        const page = ($(link).attr("href") ?? "").replace("/wiki/", "");
        if (!entries.has(page)) {
          entries.set(page, { page, name: $(link).text().trim(), faction, strain });
        }
      }
    }
  }
  return [...entries.values()];
}

/** Stops a run when the wiki's rules change, so a human re-reads them before scraping resumes. */
export function robotsProblems(
  robotsTxt: string,
  expectedContentSignal: string,
): string[] {
  const problems: string[] = [];
  const signal = robotsTxt.match(/^Content-Signal:\s*(.+)$/m)?.[1].trim();
  if (signal !== expectedContentSignal) {
    problems.push(`Content-Signal changed to "${signal}"`);
  }
  let appliesToEveryone = false;
  for (const rawLine of robotsTxt.split("\n")) {
    const line = rawLine.trim();
    const agent = line.match(/^User-agent:\s*(.+)$/i)?.[1];
    if (agent) appliesToEveryone = agent === "*";
    const disallowed = line.match(/^Disallow:\s*(\S+)$/i)?.[1];
    if (appliesToEveryone && (disallowed === "/" || disallowed === "/wiki/")) {
      problems.push(`robots.txt now disallows ${disallowed}`);
    }
  }
  return problems;
}
