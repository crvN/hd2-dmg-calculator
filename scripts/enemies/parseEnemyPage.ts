import { load } from "cheerio";

export type HitPointsTier = {
  fromDifficulty: number;
  hitPoints: number;
};

export type ParsedEnemyPart = {
  id: string;
  label: string;
  count: number;
  /** Empty when the part draws from the main health pool instead of its own. */
  hitPointsByDifficulty: HitPointsTier[];
  sharesMainHealth: boolean;
  armorRating: number | null;
  durablePercent: number | null;
  explosiveResistPercent: number | null;
  percentToMain: number | null;
  capsOverflowToMain: boolean | null;
  isFatal: boolean | null;
  /** Destroying the part knocks the enemy down, as with a Hulk's legs. */
  downsEnemy: boolean;
  constitution: string | null;
};

export type ParsedEnemyPage = {
  name: string;
  parts: ParsedEnemyPart[];
  /** Anything the parser could not read; a page with issues must not be published silently. */
  issues: string[];
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
};

const COLUMNS = {
  part: "Part Name",
  health: "Health",
  armor: "AV",
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

function parseHealth(
  text: string,
  issues: string[],
): Pick<ParsedEnemyPart, "hitPointsByDifficulty" | "sharesMainHealth"> {
  if (text === "Main") {
    return { hitPointsByDifficulty: [], sharesMainHealth: true };
  }
  const hitPointsByDifficulty: HitPointsTier[] = [];
  for (const line of text.split("\n").map((part) => part.trim())) {
    const tier = line ? parseHealthLine(line) : null;
    if (tier) hitPointsByDifficulty.push(tier);
    else issues.push(`unreadable health "${line}"`);
  }
  return { hitPointsByDifficulty, sharesMainHealth: false };
}

/** The tier name and the icon both state the rating, so a mismatch means the page is inconsistent. */
function parseArmorRating(
  cellHtml: string,
  text: string,
  issues: string[],
): number | null {
  const fromIcon = cellHtml.match(/Armor_AV(\d+)_Icon/)?.[1];
  const iconRating = fromIcon === undefined ? undefined : Number(fromIcon);
  const nameRating = ARMOR_TIERS[text.replace(/\[\[.*?\]\]/g, "").trim()];
  const rating = iconRating ?? nameRating;
  if (rating === undefined) {
    issues.push(`unreadable armor "${text}"`);
    return null;
  }
  if (nameRating !== undefined && nameRating !== rating) {
    issues.push(`armor icon says ${rating} but name says ${nameRating}`);
  }
  return rating;
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

function partIdentity(
  rawLabel: string,
): Pick<ParsedEnemyPart, "id" | "label" | "count"> {
  const singleLine = rawLabel.replace(/\s*\n\s*/g, " ");
  const match = singleLine.match(/^(.*?)\s*\((\d+)\)$/);
  const label = match ? match[1] : singleLine;
  return {
    id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    label,
    count: match ? Number(match[2]) : 1,
  };
}

function parsePartRow(
  cells: Record<ColumnKey, string>,
  issues: string[],
): ParsedEnemyPart {
  const text = (key: ColumnKey) => cellText(cells[key]);
  const identity = partIdentity(text("part"));
  const partIssues: string[] = [];
  const part: ParsedEnemyPart = {
    ...identity,
    ...parseHealth(text("health"), partIssues),
    armorRating: parseArmorRating(cells.armor, text("armor"), partIssues),
    durablePercent: parsePercent(text("durable"), "durable", partIssues),
    explosiveResistPercent: parsePercent(
      text("explosiveResist"),
      "ExDR",
      partIssues,
    ),
    percentToMain: parsePercent(text("toMain"), "% to main", partIssues),
    capsOverflowToMain: parseYesNo(text("overflow"), "overflow", partIssues),
    ...parseFatal(text("fatal"), partIssues),
    constitution: text("constitution") === "None" ? null : text("constitution"),
  };
  issues.push(...partIssues.map((issue) => `${identity.label}: ${issue}`));
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
  return rows.slice(1).map((row) => {
    const cells = $(row).children("td").toArray();
    const cellOf = (key: ColumnKey) => $(cells[columns[key]]).html() ?? "";
    const rowCells = Object.fromEntries(
      (Object.keys(COLUMNS) as ColumnKey[]).map((key) => [key, cellOf(key)]),
    ) as Record<ColumnKey, string>;
    return parsePartRow(rowCells, issues);
  });
}

export function parseEnemyPage(html: string): ParsedEnemyPage {
  const $ = load(html);
  const issues: string[] = [];
  const name = $("#firstHeading").text().trim();
  const tables = $("#mw-content-text table.wikitable")
    .toArray()
    .filter((table) =>
      $(table).find("> tbody > tr").first().text().includes(COLUMNS.part),
    );
  if (tables.length === 0) {
    return { name, parts: [], issues: ["no anatomy table on this page"] };
  }
  if (tables.length > 1) {
    issues.push(`${tables.length} anatomy tables; only the first was read`);
  }
  const parts = parseAnatomyTable($.html(tables[0]), issues);
  const ids = parts.map((part) => part.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length > 0) {
    issues.push(`duplicate part ids: ${[...new Set(duplicates)].join(", ")}`);
  }
  return { name, parts, issues };
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
