import { useEffect, useState } from "react";
import type { CatalogWeapon } from "../data/catalogWeapons";
import {
  fetchWeaponCatalog,
  isCatalogFresh,
  readCachedCatalog,
  writeCachedCatalog,
  type WeaponCatalog,
} from "../services";

export type WeaponCatalogStatus = "loading" | "ready" | "stale" | "unavailable";

type CatalogState = {
  catalog: WeaponCatalog | null;
  isLoading: boolean;
  hasFailed: boolean;
};

const NO_WEAPONS: CatalogWeapon[] = [];

function initialCatalogState(): CatalogState {
  const catalog = readCachedCatalog();
  return {
    catalog,
    isLoading: catalog === null || !isCatalogFresh(catalog),
    hasFailed: false,
  };
}

function catalogStatus({ catalog, hasFailed }: CatalogState): WeaponCatalogStatus {
  if (catalog) return hasFailed ? "stale" : "ready";
  return hasFailed ? "unavailable" : "loading";
}

/** Serves cached weapons immediately and refreshes them from the API once they expire. */
export function useWeaponCatalog() {
  const [state, setState] = useState(initialCatalogState);
  const { isLoading } = state;

  useEffect(() => {
    if (!isLoading) return;
    const controller = new AbortController();
    fetchWeaponCatalog(controller.signal)
      .then((catalog) => {
        writeCachedCatalog(catalog);
        setState({ catalog, isLoading: false, hasFailed: false });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setState((current) => ({
          ...current,
          isLoading: false,
          hasFailed: true,
        }));
      });
    return () => controller.abort();
  }, [isLoading]);

  return {
    weapons: state.catalog?.weapons ?? NO_WEAPONS,
    dataVersion: state.catalog?.dataVersion,
    status: catalogStatus(state),
  };
}
