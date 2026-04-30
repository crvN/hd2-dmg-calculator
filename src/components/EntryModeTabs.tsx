import type { EntryMode } from "../types";

type EntryModeTabsProps = {
  entryMode: EntryMode;
  onChange: (mode: EntryMode) => void;
};

export function EntryModeTabs({ entryMode, onChange }: EntryModeTabsProps) {
  return (
    <div className="tabs" role="tablist" aria-label="Input mode">
      <button
        type="button"
        role="tab"
        aria-selected={entryMode === "manual"}
        className={`tab ${entryMode === "manual" ? "tab-active" : ""}`}
        onClick={() => onChange("manual")}
      >
        Custom numbers
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={entryMode === "wiki"}
        className={`tab ${entryMode === "wiki" ? "tab-active" : ""}`}
        onClick={() => onChange("wiki")}
      >
        Wiki presets (WIP)
      </button>
    </div>
  );
}
