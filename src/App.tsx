import { AppHeader } from "./components/AppHeader";
import { EntryModeTabs } from "./components/EntryModeTabs";
import { ResultCard } from "./components/ResultCard";
import { TargetCard } from "./components/TargetCard";
import { WeaponCard } from "./components/WeaponCard";
import { useShotCalculator } from "./hooks/useShotCalculator";
import "./App.css";

export default function App() {
  const { entryMode, setEntryMode, parsed, targetCardProps, weaponCardProps } =
    useShotCalculator();

  return (
    <div className="app">
      <AppHeader />
      <EntryModeTabs entryMode={entryMode} onChange={setEntryMode} />

      {entryMode === "wiki" && (
        <p className="wiki-note muted">
          Support weapons and wiki body parts from{" "}
          <a href="https://helldivers.wiki.gg/wiki/Stratagems">Stratagems</a> /{" "}
          <a href="https://helldivers.wiki.gg/wiki/Terminids">Terminids</a> /{" "}
          <a href="https://helldivers.wiki.gg/wiki/Automatons">Automatons</a>.
          Values are a curated snapshot; patch changes may drift.
        </p>
      )}

      <div className="grid">
        <TargetCard {...targetCardProps} />
        <WeaponCard {...weaponCardProps} />
      </div>

      <ResultCard parsed={parsed} />
    </div>
  );
}
