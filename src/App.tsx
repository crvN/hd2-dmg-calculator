import { AppHeader } from "./components/AppHeader";
import { EntryModeTabs } from "./components/EntryModeTabs";
import { ResultCard } from "./components/ResultCard";
import { TargetCard } from "./components/TargetCard";
import { WeaponCard } from "./components/WeaponCard";
import { WikiDataNote } from "./components/WikiDataNote";
import { useShotCalculator } from "./hooks/useShotCalculator";
import "./App.css";

export default function App() {
  const {
    entryMode,
    setEntryMode,
    outcome,
    isMissingWeapon,
    catalogStatus,
    catalogDataVersion,
    targetCardProps,
    weaponCardProps,
  } = useShotCalculator();

  return (
    <div className="app">
      <AppHeader />
      <EntryModeTabs entryMode={entryMode} onChange={setEntryMode} />

      {entryMode === "wiki" && (
        <WikiDataNote status={catalogStatus} dataVersion={catalogDataVersion} />
      )}

      <div className="grid">
        <TargetCard {...targetCardProps} />
        <WeaponCard {...weaponCardProps} />
      </div>

      {!isMissingWeapon && <ResultCard outcome={outcome} />}
    </div>
  );
}
