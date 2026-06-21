import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { SCENARIOS, getScenario, type Scenario } from "../data/scenarios";

interface ScenarioStore {
  id: string;
  scenario: Scenario;
  setId: (id: string) => void;
  all: Scenario[];
}

const Ctx = createContext<ScenarioStore | null>(null);

const DEFAULT_ID = "triple-riding";

export function ScenarioStoreProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState(DEFAULT_ID);
  const value = useMemo<ScenarioStore>(
    () => ({ id, setId, scenario: getScenario(id), all: SCENARIOS }),
    [id],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useScenarioStore(): ScenarioStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useScenarioStore must be used within ScenarioStoreProvider");
  return ctx;
}
