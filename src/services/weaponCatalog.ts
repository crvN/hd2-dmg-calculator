import {
  API_ORIGIN,
  type ApiListResponse,
  type ApiStratagem,
  type ApiWeapon,
} from "../data/catalogApi";
import type { CatalogWeapon } from "../data/catalogWeapons";
import { catalogWeaponsFrom } from "../logic/weapons";

const STRATAGEMS_URL = `${API_ORIGIN}/v1/stratagems.json`;
const PRIMARIES_URL = `${API_ORIGIN}/v1/weapons/by-category/primary.json`;

/** Bump the suffix when the mapping changes, so browsers drop weapons mapped the old way. */
const CACHE_KEY = "hd2:weapon-catalog:v3";

/** The API publishes at most one data update per day. */
export const CATALOG_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type WeaponCatalog = {
  dataVersion: string;
  fetchedAtMs: number;
  weapons: CatalogWeapon[];
};

export type CatalogStorage = Pick<Storage, "getItem" | "setItem">;

/** Storage access itself can throw, for example when site data is blocked. */
function browserStorage(): CatalogStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isWeaponCatalog(value: unknown): value is WeaponCatalog {
  const catalog = value as Partial<WeaponCatalog> | null;
  return (
    typeof catalog?.dataVersion === "string" &&
    typeof catalog.fetchedAtMs === "number" &&
    Array.isArray(catalog.weapons) &&
    catalog.weapons.length > 0
  );
}

export function readCachedCatalog(
  storage: CatalogStorage | null = browserStorage(),
): WeaponCatalog | null {
  try {
    const stored = storage?.getItem(CACHE_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : null;
    return isWeaponCatalog(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** A failed write only costs a refetch on the next visit. */
export function writeCachedCatalog(
  catalog: WeaponCatalog,
  storage: CatalogStorage | null = browserStorage(),
): void {
  try {
    storage?.setItem(CACHE_KEY, JSON.stringify(catalog));
  } catch {
    // Ignored: the catalog is still usable for this visit.
  }
}

export function isCatalogFresh(
  catalog: WeaponCatalog,
  nowMs: number = Date.now(),
): boolean {
  const ageMs = nowMs - catalog.fetchedAtMs;
  return ageMs >= 0 && ageMs < CATALOG_MAX_AGE_MS;
}

async function fetchApiList<Item>(
  url: string,
  signal?: AbortSignal,
): Promise<ApiListResponse<Item>> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Catalog request failed: HTTP ${response.status}`);
  }
  return (await response.json()) as ApiListResponse<Item>;
}

/** All or nothing, so a refresh never replaces a complete saved catalog with a partial one. */
export async function fetchWeaponCatalog(
  signal?: AbortSignal,
): Promise<WeaponCatalog> {
  const [stratagems, primaries] = await Promise.all([
    fetchApiList<ApiStratagem>(STRATAGEMS_URL, signal),
    fetchApiList<ApiWeapon>(PRIMARIES_URL, signal),
  ]);
  const weapons = catalogWeaponsFrom(stratagems.data ?? [], primaries.data ?? []);
  if (weapons.length === 0) {
    throw new Error("Catalog responses contained no usable weapons");
  }
  return {
    dataVersion: stratagems.meta?.dataVersion ?? "unknown",
    fetchedAtMs: Date.now(),
    weapons,
  };
}
