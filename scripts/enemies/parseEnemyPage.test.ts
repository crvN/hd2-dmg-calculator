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

function thumbnail(file: string, version: string): string {
  return `<a><img src="/images/thumb/${file}/200px-${file}?${version}" /></a>`;
}

function locationTabs(views: [string, string, string][]): string {
  const tabs = views
    .map(([view]) => `<a class="tabber__tab" id="${view}-0-label">${view}</a>`)
    .join("");
  const panels = views
    .map(
      ([view, file, version]) =>
        `<article class="tabber__panel" aria-labelledby="${view}-0-label">${thumbnail(file, version)}</article>`,
    )
    .join("");
  return `<div class="tabber"><nav>${tabs}</nav><section>${panels}</section></div>`;
}

function rowWithLocation(label: string, location: string): string {
  return row([
    label,
    "100",
    armorCell(1, "Very Light"),
    location,
    "0%",
    "100%",
    "No",
    "None",
    "Yes",
    "0%",
  ]);
}

function partRowWithArmor(label: string, armor: string): string {
  return row([
    label,
    "100",
    armor,
    "Front",
    "0%",
    "100%",
    "No",
    "None",
    "Yes",
    "0%",
  ]);
}

function partRow(label: string, health: string): string {
  return row([
    label,
    health,
    armorCell(1, "Very Light"),
    "Front",
    "0%",
    "100%",
    "No",
    "None",
    "Yes",
    "0%",
  ]);
}

function sharedPart(label: string, health: string): string {
  return row([
    label,
    health,
    armorCell(0, "Unarmored"),
    "Front",
    "70%",
    "100%",
    "Yes",
    "None",
    "Yes",
    "50%",
  ]);
}

function tabbedPage(tabs: [string, string[]][]): string {
  const labels = tabs
    .map(([tab], index) => `<a class="tabber__tab" id="tab-${index}-label">${tab}</a>`)
    .join("");
  const panels = tabs
    .map(
      ([, rows], index) =>
        `<article class="tabber__panel" aria-labelledby="tab-${index}-label"><table class="wikitable"><tbody>${HEADER}${rows.join("")}</tbody></table></article>`,
    )
    .join("");
  return `<html><body><h1 id="firstHeading">Harvester</h1><div id="mw-content-text"><div class="tabber"><nav>${labels}</nav><section>${panels}</section></div></div></body></html>`;
}

describe("parseEnemyPage", () => {
  it("reads a part's stats and its health at each difficulty", () => {
    const { name, parts, issues } = parseEnemyPage(page([warriorMain]));

    expect(issues).toEqual([]);
    expect(name).toBe("Warrior");
    expect(parts).toEqual([
      {
        id: "main",
        label: "Main",
        section: null,
        count: 1,
        images: [],
        hitPointsByDifficulty: [
          { fromDifficulty: 1, hitPoints: 250 },
          { fromDifficulty: 4, hitPoints: 325 },
        ],
        sharesHealthWith: null,
        hasInfiniteHealth: false,
        armorByDifficulty: [{ fromDifficulty: 1, armorRating: 1 }],
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
      page([warriorMain, sharedPart("Inner Flesh", "Main")]),
    );

    expect(issues).toEqual([]);
    expect(parts[1]).toMatchObject({
      hitPointsByDifficulty: [],
      sharesHealthWith: "Main",
      armorByDifficulty: [{ fromDifficulty: 1, armorRating: 0 }],
    });
  });

  it("reads armor that rises at a difficulty, as on a Bile Spewer", () => {
    const { parts, issues } = parseEnemyPage(
      page([
        row([
          "Main",
          "750",
          `${armorCell(2, "Light")}<br />${armorCell(3, "Medium")} at <a><img alt="Extreme Difficulty Icon.svg" /></a>`,
          "Front",
          "50%",
          "-",
          "-",
          "None",
          "Yes",
          "0%",
        ]),
      ]),
    );

    expect(issues).toEqual([]);
    expect(parts[0].armorByDifficulty).toEqual([
      { fromDifficulty: 1, armorRating: 2 },
      { fromDifficulty: 6, armorRating: 3 },
    ]);
  });

  it("reports armor tiers without a difficulty to start from", () => {
    const { issues } = parseEnemyPage(
      page([
        row([
          "Main",
          "750",
          `${armorCell(2, "Light")}<br />${armorCell(3, "Medium")}`,
          "Front",
          "50%",
          "-",
          "-",
          "None",
          "Yes",
          "0%",
        ]),
      ]),
    );

    expect(issues[0]).toContain("Main: unreadable armor tiers");
  });

  it("reports an armor name it does not recognise even with an icon present", () => {
    const { issues } = parseEnemyPage(
      page([partRowWithArmor("Head", armorCell(2, "Mystery"))]),
    );

    expect(issues).toEqual(['Head: unreadable armor "[[]] Mystery"']);
  });

  it("reports a dash in a stat every part must have", () => {
    const { issues } = parseEnemyPage(
      page([
        row([
          "Head",
          "100",
          armorCell(1, "Very Light"),
          "Front",
          "-",
          "100%",
          "No",
          "None",
          "Yes",
          "-",
        ]),
      ]),
    );

    expect(issues).toEqual([
      "Head: no durable listed",
      "Head: no ExDR listed",
    ]);
  });

  it("links a tank part to the named health pool it draws from", () => {
    const { parts, issues } = parseEnemyPage(
      page([
        partRow("Hull<br />Main", "4,000"),
        sharedPart("Hull Front", "Main<br />(Hull)"),
      ]),
    );

    expect(issues).toEqual([]);
    expect(parts[0].label).toBe("Hull Main");
    expect(parts[1].sharesHealthWith).toBe("Hull Main");
  });

  it("reports a shared health pool that no part provides", () => {
    const { issues } = parseEnemyPage(
      page([sharedPart("Turret Front", "Main<br />(Turret)")]),
    );

    expect(issues).toEqual([
      'Turret Front: no part named "Turret Main"',
    ]);
  });

  it("marks a part that cannot be destroyed", () => {
    const { parts, issues } = parseEnemyPage(page([partRow("Shield", "Infinite")]));

    expect(issues).toEqual([]);
    expect(parts[0]).toMatchObject({
      hitPointsByDifficulty: [],
      hasInfiniteHealth: true,
    });
  });

  it("skips a part with no health listed and says so", () => {
    const { parts, warnings, issues } = parseEnemyPage(
      page([warriorMain, partRow("Hatches (2)", "-")]),
    );

    expect(issues).toEqual([]);
    expect(parts.map((part) => part.label)).toEqual(["Main"]);
    expect(warnings).toEqual(["Hatches (2): no health listed, so skipped"]);
  });

  it("warns when the constitution column holds a Fatal-style value", () => {
    const { parts, warnings, issues } = parseEnemyPage(
      page([
        row([
          "Legs",
          "80",
          armorCell(0, "Unarmored"),
          "Front",
          "0%",
          "30%",
          "Yes",
          "No<br />(Downs)",
          "Yes",
          "100%",
        ]),
      ]),
    );

    expect(issues).toEqual([]);
    expect(parts[0]).toMatchObject({ constitution: null, downsEnemy: true });
    expect(warnings).toEqual(['Legs: constitution column holds "No (Downs)"']);
  });

  it.each(["100 [50/s]", "[10/s]", "50,000 [-10,000/s]"])(
    "accepts the constitution format %s",
    (constitution) => {
      const { parts, warnings } = parseEnemyPage(
        page([
          row([
            "Main",
            "100",
            armorCell(0, "Unarmored"),
            "Front",
            "0%",
            "-",
            "-",
            constitution,
            "Yes",
            "0%",
          ]),
        ]),
      );

      expect(warnings).toEqual([]);
      expect(parts[0].constitution).toBe(constitution);
    },
  );

  it("reads a count that sits in the middle of a part name", () => {
    const { parts } = parseEnemyPage(
      page([partRow("Side Circuits (2)<br />(Broken Side Armor)", "1,200")]),
    );

    expect(parts[0]).toMatchObject({
      label: "Side Circuits (Broken Side Armor)",
      count: 2,
    });
  });

  it("keeps each tab's table as a named section with its own part ids", () => {
    const { parts, issues } = parseEnemyPage(
      tabbedPage([
        ["Intact", [warriorMain, partRow("Head", "100")]],
        ["Armor Broken", [warriorMain, partRow("Internals (2)", "800")]],
      ]),
    );

    expect(issues).toEqual([]);
    expect(parts.map((part) => [part.id, part.section])).toEqual([
      ["intact-main", "Intact"],
      ["intact-head", "Intact"],
      ["armor-broken-main", "Armor Broken"],
      ["armor-broken-internals", "Armor Broken"],
    ]);
  });

  it("reads one picture per angle from the location tabs", () => {
    const { parts, warnings } = parseEnemyPage(
      page([
        rowWithLocation(
          "Head",
          locationTabs([
            ["Front", "Warrior_Head_Front.png", "aa11"],
            ["Side", "Warrior_Head_Side.png", "bb22"],
          ]),
        ),
      ]),
    );

    expect(warnings).toEqual([]);
    expect(parts[0].images).toEqual([
      { view: "Front", file: "Warrior_Head_Front.png", version: "aa11" },
      { view: "Side", file: "Warrior_Head_Side.png", version: "bb22" },
    ]);
  });

  it("reads a lone picture with no angle", () => {
    const { parts } = parseEnemyPage(
      page([rowWithLocation("Main", thumbnail("Warrior_Main.png", "cc33"))]),
    );

    expect(parts[0].images).toEqual([
      { view: null, file: "Warrior_Main.png", version: "cc33" },
    ]);
  });

  it("warns about an unusual image address without blocking the stats", () => {
    const { parts, issues, warnings } = parseEnemyPage(
      page([rowWithLocation("Main", `<img src="/images/Odd.svg" />`)]),
    );

    expect(issues).toEqual([]);
    expect(parts[0].images).toEqual([]);
    expect(warnings).toEqual([
      'Main: unexpected image address "/images/Odd.svg"',
    ]);
  });

  it("merges the pictures of tabs that repeat the same stats", () => {
    const { parts, issues } = parseEnemyPage(
      tabbedPage([
        [
          "Top & Side",
          [rowWithLocation("Main", thumbnail("Lord_Top.png", "aa11"))],
        ],
        [
          "Bottom & Face",
          [rowWithLocation("Main", thumbnail("Lord_Bottom.png", "bb22"))],
        ],
      ]),
    );

    expect(issues).toEqual([]);
    expect(parts).toHaveLength(1);
    expect(parts[0].section).toBeNull();
    expect(parts[0].images.map((image) => image.file)).toEqual([
      "Lord_Top.png",
      "Lord_Bottom.png",
    ]);
  });

  it("treats tabs that repeat the same table as one table", () => {
    const { parts, issues } = parseEnemyPage(
      tabbedPage([
        ["Top & Side", [warriorMain]],
        ["Bottom & Face", [warriorMain]],
      ]),
    );

    expect(issues).toEqual([]);
    expect(parts).toHaveLength(1);
    expect(parts[0]).toMatchObject({ id: "main", section: null });
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
