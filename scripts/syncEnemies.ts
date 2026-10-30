/**
 * Builds the enemy data file from The Helldivers Wiki (CC BY-NC-SA 4.0).
 *
 *   npm run sync:enemies -- --only Warrior,Bile_Titan --out enemies.json
 *
 * Reads only /wiki/ pages: the wiki's robots.txt disallows api.php and ?action= URLs.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { parseArgs } from "node:util";
import {
  parseEnemyPage,
  parseFactionIndex,
  robotsProblems,
  type FactionIndexEntry,
} from "./enemies/parseEnemyPage.ts";

const WIKI_ORIGIN = "https://helldivers.wiki.gg";
const USER_AGENT =
  "hd2-dmg-calculator-enemy-sync (+https://github.com/crvN/hd2-dmg-calculator)";
const MIN_DELAY_MS = 3000;
const MAX_JITTER_MS = 1000;
const REVIEWED_CONTENT_SIGNAL = "search=yes,ai-train=no,use=reference";
const FACTIONS_PAGE = "Factions";

const { values: options } = parseArgs({
  options: {
    only: { type: "string" },
    out: { type: "string", default: "enemies.json" },
    "cache-dir": { type: "string", default: "node_modules/.cache/enemy-sync" },
    refresh: { type: "boolean", default: false },
  },
});

const cacheDir = options["cache-dir"];
let lastRequestAtMs = 0;

async function politeFetch(url: string): Promise<string> {
  const waitMs =
    lastRequestAtMs + MIN_DELAY_MS + Math.random() * MAX_JITTER_MS - Date.now();
  if (waitMs > 0) await sleep(waitMs);
  lastRequestAtMs = Date.now();
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(30_000),
  });
  // No retries: a refusal is the wiki asking us to stop, and the run can be repeated later.
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.text();
}

async function readWikiPage(page: string): Promise<string> {
  const cachePath = join(cacheDir, `${page}.html`);
  if (!options.refresh && existsSync(cachePath)) {
    return readFileSync(cachePath, "utf8");
  }
  const html = await politeFetch(`${WIKI_ORIGIN}/wiki/${page}`);
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(cachePath, html);
  return html;
}

async function assertWikiRulesUnchanged(): Promise<void> {
  const robotsTxt = await politeFetch(`${WIKI_ORIGIN}/robots.txt`);
  const problems = robotsProblems(robotsTxt, REVIEWED_CONTENT_SIGNAL);
  if (problems.length > 0) {
    throw new Error(`Stopping, re-read the wiki's rules: ${problems.join("; ")}`);
  }
}

function pagesToRead(index: FactionIndexEntry[]): FactionIndexEntry[] {
  if (!options.only) return index;
  return options.only.split(",").map((page) => {
    const listed = index.find((entry) => entry.page === page);
    return listed ?? { page, name: page, faction: "", strain: null };
  });
}

async function main(): Promise<void> {
  await assertWikiRulesUnchanged();
  const index = parseFactionIndex(await readWikiPage(FACTIONS_PAGE));
  const enemies = [];
  const pagesWithIssues: Record<string, string[]> = {};

  for (const entry of pagesToRead(index)) {
    const { name, parts, issues } = parseEnemyPage(await readWikiPage(entry.page));
    if (issues.length > 0) pagesWithIssues[entry.page] = issues;
    if (parts.length > 0) {
      enemies.push({
        id: entry.page.toLowerCase().replace(/_/g, "-"),
        name,
        faction: entry.faction,
        strain: entry.strain,
        wikiUrl: `${WIKI_ORIGIN}/wiki/${entry.page}`,
        parts,
      });
    }
    console.log(`${entry.page}: ${parts.length} parts, ${issues.length} issues`);
  }

  mkdirSync(dirname(options.out), { recursive: true });
  writeFileSync(
    options.out,
    `${JSON.stringify(
      {
        source: "The Helldivers Wiki",
        sourceUrl: WIKI_ORIGIN,
        license: "CC BY-NC-SA 4.0",
        fetchedAt: new Date().toISOString(),
        enemies,
      },
      null,
      2,
    )}\n`,
  );

  console.log(`\nIndex lists ${index.length} pages. Wrote ${enemies.length} enemies to ${options.out}.`);
  if (Object.keys(pagesWithIssues).length > 0) {
    console.error("\nIssues to review:", JSON.stringify(pagesWithIssues, null, 2));
    process.exitCode = 1;
  }
}

await main();
