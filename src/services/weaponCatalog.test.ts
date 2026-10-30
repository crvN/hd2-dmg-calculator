import {
  CATALOG_MAX_AGE_MS,
  fetchWeaponCatalog,
  isCatalogFresh,
  readCachedCatalog,
  writeCachedCatalog,
  type CatalogStorage,
  type WeaponCatalog,
} from "./weaponCatalog";

const catalog: WeaponCatalog = {
  dataVersion: "2026-10-30.abc",
  fetchedAtMs: 1_000,
  weapons: [
    {
      id: "mg-43/MG-43 P",
      name: "MG-43",
      kind: "support_weapon",
      standardDamage: 90,
      durableDamage: 23,
      penetration: 3,
      damageMode: "ballistic",
      explosiveDamage: 0,
      explosivePenetration: 3,
    },
  ],
};

function memoryStorage(initial?: string): CatalogStorage {
  let stored: string | null = null;
  const storage: CatalogStorage = {
    getItem: () => stored,
    setItem: (_key, value) => {
      stored = value;
    },
  };
  if (initial !== undefined) storage.setItem("any", initial);
  return storage;
}

function throwingStorage(): CatalogStorage {
  const fail = () => {
    throw new Error("storage blocked");
  };
  return { getItem: fail, setItem: fail };
}

function mockFetchResponse(body: unknown, status = 200): void {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

function mockFetchResponsesByUrl(
  responses: Record<string, { body: unknown; status?: number }>,
): void {
  globalThis.fetch = jest.fn().mockImplementation(async (url: string) => {
    const key = Object.keys(responses).find((part) => url.includes(part));
    const { body, status = 200 } = responses[key ?? ""];
    return { ok: status === 200, status, json: async () => body };
  });
}

const projectile = {
  kind: "projectile",
  damage: { standard: 90, durable: 23, type: "Ballistic" },
  penetration: { direct: "medium" },
};

const stratagemsBody = {
  meta: { dataVersion: "v-1" },
  data: [
    {
      id: "mg-43",
      name: "MG-43",
      kind: "support_weapon",
      upcoming: false,
      attacks: [{ ...projectile, name: "MG-43 P" }],
    },
  ],
};

const primariesBody = {
  data: [
    {
      id: "ar-23",
      name: "AR-23",
      category: "primary",
      upcoming: false,
      attacks: [{ ...projectile, name: "AR-23 P" }],
    },
  ],
};

describe("catalog cache", () => {
  it("returns a catalog it previously stored", () => {
    const storage = memoryStorage();

    writeCachedCatalog(catalog, storage);

    expect(readCachedCatalog(storage)).toEqual(catalog);
  });

  it("returns nothing when the cache is empty", () => {
    expect(readCachedCatalog(memoryStorage())).toBeNull();
  });

  it("ignores corrupt or wrongly shaped entries", () => {
    expect(readCachedCatalog(memoryStorage("{not json"))).toBeNull();
    expect(readCachedCatalog(memoryStorage('{"weapons":"none"}'))).toBeNull();
    expect(
      readCachedCatalog(memoryStorage(JSON.stringify({ ...catalog, weapons: [] }))),
    ).toBeNull();
  });

  it("survives storage that throws or does not exist", () => {
    expect(readCachedCatalog(throwingStorage())).toBeNull();
    expect(readCachedCatalog(null)).toBeNull();
    expect(() => writeCachedCatalog(catalog, throwingStorage())).not.toThrow();
  });
});

describe("isCatalogFresh", () => {
  it("is fresh until one day has passed", () => {
    expect(isCatalogFresh(catalog, 1_000)).toBe(true);
    expect(isCatalogFresh(catalog, 1_000 + CATALOG_MAX_AGE_MS - 1)).toBe(true);
    expect(isCatalogFresh(catalog, 1_000 + CATALOG_MAX_AGE_MS)).toBe(false);
  });

  it("treats a timestamp from the future as expired", () => {
    expect(isCatalogFresh(catalog, 999)).toBe(false);
  });
});

describe("fetchWeaponCatalog", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("combines stratagems and primaries and records the data version", async () => {
    mockFetchResponsesByUrl({
      "stratagems.json": { body: stratagemsBody },
      "primary.json": { body: primariesBody },
    });

    const result = await fetchWeaponCatalog();

    expect(result.dataVersion).toBe("v-1");
    expect(result.weapons.map((weapon) => weapon.name)).toEqual([
      "MG-43",
      "AR-23",
    ]);
  });

  it("rejects when only the primaries request fails", async () => {
    mockFetchResponsesByUrl({
      "stratagems.json": { body: stratagemsBody },
      "primary.json": { body: {}, status: 500 },
    });

    await expect(fetchWeaponCatalog()).rejects.toThrow("HTTP 500");
  });

  it("rejects on an HTTP error", async () => {
    mockFetchResponse({}, 503);

    await expect(fetchWeaponCatalog()).rejects.toThrow("HTTP 503");
  });

  it("rejects when the response has no usable weapons", async () => {
    mockFetchResponse({ data: [] });

    await expect(fetchWeaponCatalog()).rejects.toThrow("no usable weapons");
  });
});
