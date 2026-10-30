import { ENEMY_SNAPSHOT_DATE } from "../data";
import type { WeaponCatalogStatus } from "../hooks/useWeaponCatalog";

type WikiDataNoteProps = {
  status: WeaponCatalogStatus;
  dataVersion?: string;
};

export function WikiDataNote({ status, dataVersion }: WikiDataNoteProps) {
  return (
    <div className="wiki-note muted">
      <p className="no-margin">
        Weapons from the{" "}
        <a href="https://github.com/DionathaGoulart/Helldivers-api">
          Helldivers 2 Data API
        </a>{" "}
        by DionathaGoulart, based on{" "}
        <a href="https://helldivers.wiki.gg">The Helldivers Wiki</a>,{" "}
        <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">
          CC BY-NC-SA 4.0
        </a>
        {dataVersion && ` (data version ${dataVersion})`}, cached for one day.
        Enemy stats are a snapshot of{" "}
        <a href="https://helldivers.wiki.gg/wiki/Factions">the same wiki</a>{" "}
        from {ENEMY_SNAPSHOT_DATE}; patch changes may drift. Part pictures load
        from the wiki.
      </p>
      {status === "loading" && <p role="status">Loading weapons…</p>}
      {status === "stale" && (
        <p className="warn" role="status">
          Could not refresh weapons, so this is the last saved data.
        </p>
      )}
      {status === "unavailable" && (
        <p className="warn" role="alert">
          Could not load weapons. Reload to retry, or use Custom numbers.
        </p>
      )}
    </div>
  );
}
