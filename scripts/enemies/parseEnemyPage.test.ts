import {
  parseEnemyPage,
  parseFactionIndex,
  robotsProblems,
} from "./parseEnemyPage";

const HEADER = `<tr><th>Part Name</th><th>Health<sup><a>1</a></sup></th><th>AV<sup>2</sup></th><th>Location</th><th>Durable</th><th>% To Main</th><th>Overflow Cap?</th><th>Constitution</th><th>Fatal?</th><th>ExDR</th></tr>`;

function armorCell(rating: number, tier: string): string {
  return `<span><a><img alt="" src="/images/Armor_AV${rating}_Icon.png?d0cc47" /></a>&#160;<a>${tier}</a></span>`;
}

function challengingIcon(): string {
  return `<a href="/wiki/Difficulty"><img alt="Challenging Difficulty Icon.svg" /></a>`;
}

function row(cells: string[]): string {
  return `<tr>${cells.map((cell) => `<td>${cell}</td>`).join("")}</tr>`;
}

function page(rows: string[], name = "Warrior"): string {
  return `<html><body><h1 id="firstHeading">${name}</h1><div id="mw-content-text"><table class="wikitable"><tbody>${HEADER}${rows.join("")}</tbody></table></div></body></html>`;
}

const warriorMain = row([
  "Main",
  `250 [Default]<br />325 at ${challengingIcon()}`,
  armorCell(1, "Very Light"),
  "Front Side",
  "20%",
  "-",
  "-",
  "None",
  "Yes",
  "0%",
]);

describe("parseEnemyPage", () => {
  it("reads a part's stats and its health at each difficulty", () => {
    const { name, parts, issues } = parseEnemyPage(page([warriorMain]));

    expect(issues).toEqual([]);
    expect(name).toBe("Warrior");
    expect(parts).toEqual([
      {
        id: "main",
        label: "Main",
        count: 1,
        hitPointsByDifficulty: [
          { fromDifficulty: 1, hitPoints: 250 },
          { fromDifficulty: 4, hitPoints: 325 },
        ],
        sharesMainHealth: false,
        armorRating: 1,
        durablePercent: 20,
        explosiveResistPercent: 0,
        percentToMain: null,
        capsOverflowToMain: null,
        isFatal: true,
        downsEnemy: false,
        constitution: null,
      },
    ]);
  });

  it("reads thousands separators and a part count in the name", () => {
    const { parts, issues } = parseEnemyPage(
      page([
        row([
          "Leg Flesh (3)",
          "2,000",
          armorCell(4, "Heavy"),
          "Front",
          "100%",
          "100%",
          "No",
          "2,000 [-0/s]",
          "Yes",
          "50%",
        ]),
      ]),
    );

    expect(issues).toEqual([]);
    expect(parts[0]).toMatchObject({
      id: "leg-flesh",
      label: "Leg Flesh",
      count: 3,
      hitPointsByDifficulty: [{ fromDifficulty: 1, hitPoints: 2000 }],
      constitution: "2,000 [-0/s]",
      capsOverflowToMain: false,
    });
  });

  it("joins a part name split across lines and still reads its count", () => {
    const { parts } = parseEnemyPage(
      page([
        row([
          "Leg<br />Armor (12)",
          "1,000",
          armorCell(4, "Heavy"),
          "Front",
          "100%",
          "100%",
          "No",
          "None",
          "No",
          "50%",
        ]),
      ]),
    );

    expect(parts[0]).toMatchObject({
      id: "leg-armor",
      label: "Leg Armor",
      count: 12,
    });
  });

  it("marks a part whose health is the main pool", () => {
    const { parts, issues } = parseEnemyPage(
      page([
        row([
          "Inner Flesh",
          "Main",
          armorCell(0, "Unarmored"),
          "Front",
          "70%",
          "100%",
          "Yes",
          "None",
          "Yes",
          "50%",
        ]),
      ]),
    );

    expect(issues).toEqual([]);
    expect(parts[0]).toMatchObject({
      hitPointsByDifficulty: [],
      sharesMainHealth: true,
      armorRating: 0,
    });
  });

  it.each([
    ["No<br />Downs", false],
    ["Yes<br />(Downs)", true],
  ])("reads a part that knocks the enemy down from %s", (fatalCell, isFatal) => {
    const { parts, issues } = parseEnemyPage(
      page([
        row([
          "Legs",
          "850",
          armorCell(2, "Light"),
          "Front",
          "0%",
          "50%",
          "No",
          "None",
          fatalCell,
          "0%",
        ]),
      ]),
    );

    expect(issues).toEqual([]);
    expect(parts[0]).toMatchObject({ isFatal, downsEnemy: true });
  });

  it("reports a value it cannot read instead of guessing", () => {
    const { issues } = parseEnemyPage(
      page([
        row([
          "Head",
          "lots",
          armorCell(1, "Very Light"),
          "Front",
          "soft",
          "100%",
          "Maybe",
          "None",
          "Yes",
          "0%",
        ]),
      ]),
    );

    expect(issues).toEqual([
      'Head: unreadable health "lots"',
      'Head: unreadable durable "soft"',
      'Head: unreadable overflow "Maybe"',
    ]);
  });

  it("reports when the armor icon and tier name disagree", () => {
    const { issues } = parseEnemyPage(
      page([
        row([
          "Head",
          "100",
          armorCell(4, "Light"),
          "Front",
          "0%",
          "100%",
          "No",
          "None",
          "Yes",
          "0%",
        ]),
      ]),
    );

    expect(issues).toEqual(["Head: armor icon says 4 but name says 2"]);
  });

  it("reports a page with no anatomy table, such as a disambiguation page", () => {
    const { parts, issues } = parseEnemyPage(
      `<html><body><h1 id="firstHeading">Hulk</h1><div id="mw-content-text"><p>Variants</p></div></body></html>`,
    );

    expect(parts).toEqual([]);
    expect(issues).toEqual(["no anatomy table on this page"]);
  });

  it("reports unexpected columns rather than reading the wrong ones", () => {
    const { parts, issues } = parseEnemyPage(
      `<html><body><div id="mw-content-text"><table class="wikitable"><tbody><tr><th>Part Name</th><th>Hit Points</th></tr></tbody></table></div></body></html>`,
    );

    expect(parts).toEqual([]);
    expect(issues[0]).toContain("unexpected anatomy columns");
  });

  it("reports duplicate part ids", () => {
    const { issues } = parseEnemyPage(page([warriorMain, warriorMain]));

    expect(issues).toEqual(["duplicate part ids: main"]);
  });
});

describe("parseFactionIndex", () => {
  const table = (page: string, name: string) =>
    `<table class="wikitable sortable"><tbody><tr><th>Icon</th><th>Name</th><th>Description</th></tr><tr><td><a href="/wiki/File:Icon.png">i</a></td><td><a href="/wiki/${page}">${name}</a></td><td>Text <a href="/wiki/Other">link</a></td></tr></tbody></table>`;

  it("assigns enemies to their faction and strain and ignores other links", () => {
    const entries = parseFactionIndex(
      `<div id="mw-content-text"><h2><span id="Terminids">Terminids</span></h2>${table("Warrior", "Warrior")}<h3><span id="Predator_Strain">Predator Strain</span></h3>${table("Stalker", "Stalker")}<h2><span id="Automatons">Automatons</span></h2>${table("Trooper", "Trooper")}</div>`,
    );

    expect(entries).toEqual([
      { page: "Warrior", name: "Warrior", faction: "Terminids", strain: null },
      {
        page: "Stalker",
        name: "Stalker",
        faction: "Terminids",
        strain: "Predator Strain",
      },
      { page: "Trooper", name: "Trooper", faction: "Automatons", strain: null },
    ]);
  });

  it("keeps an enemy's first listing when it appears under two headings", () => {
    const entries = parseFactionIndex(
      `<div id="mw-content-text"><h2><span id="A">A</span></h2>${table("Warrior", "Warrior")}<h3><span id="B">B</span></h3>${table("Warrior", "Warrior")}</div>`,
    );

    expect(entries).toHaveLength(1);
    expect(entries[0].strain).toBeNull();
  });
});

describe("robotsProblems", () => {
  const SIGNAL = "search=yes,ai-train=no,use=reference";

  it("accepts the rules the scraper was reviewed against", () => {
    const robots = `User-agent: *\nContent-Signal: ${SIGNAL}\nAllow: /\nDisallow: /api.php\n\nUser-agent: GPTBot\nDisallow: /\n`;

    expect(robotsProblems(robots, SIGNAL)).toEqual([]);
  });

  it("flags a changed content signal", () => {
    const robots = `User-agent: *\nContent-Signal: use=none\nAllow: /\n`;

    expect(robotsProblems(robots, SIGNAL)[0]).toContain("Content-Signal changed");
  });

  it("flags a blanket disallow for all crawlers", () => {
    const robots = `User-agent: *\nContent-Signal: ${SIGNAL}\nDisallow: /wiki/\n`;

    expect(robotsProblems(robots, SIGNAL)).toEqual([
      "robots.txt now disallows /wiki/",
    ]);
  });
});
