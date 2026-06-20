import {

  createContext,

  useCallback,

  useContext,

  useEffect,

  useMemo,

  useState,

  type ReactNode,

} from "react";

import { DEFAULT_SCENARIO_ID, getScenario, type Scenario } from "../data/scenarios";

import { LAYER_PIPELINE, type LayerDefinition } from "../data/layerPipeline";



export type AppTab =

  | "overview"

  | "live-demo"

  | "pipeline-journey"

  | "architecture"

  | "command-center"

  | "evidence-review";



const TAB_IDS: AppTab[] = [

  "overview",

  "live-demo",

  "pipeline-journey",

  "architecture",

  "command-center",

  "evidence-review",

];



const TOUR_DURATION_S = 60;



function parseTab(value: string | null): AppTab {

  if (value && TAB_IDS.includes(value as AppTab)) return value as AppTab;

  return "overview";

}



function parseLayer(value: string | null): number {

  const n = Number(value);

  if (n >= 1 && n <= LAYER_PIPELINE.length) return n;

  return 1;

}



interface ScenarioContextValue {

  scenarioId: string;

  scenario: Scenario;

  setScenarioId: (id: string) => void;

  activeTab: AppTab;

  setActiveTab: (tab: AppTab) => void;

  activeLayer: number;

  setActiveLayer: (layer: number) => void;

  activeLayerDef: LayerDefinition;

  pipelinePlaying: boolean;

  setPipelinePlaying: React.Dispatch<React.SetStateAction<boolean>>;

  demoTourActive: boolean;

  demoTourElapsed: number;

  startDemoTour: () => void;

  stopDemoTour: () => void;

}



const ScenarioContext = createContext<ScenarioContextValue | null>(null);



export function ScenarioProvider({ children }: { children: ReactNode }) {

  const [scenarioId, setScenarioIdState] = useState(DEFAULT_SCENARIO_ID);

  const [activeTab, setActiveTabState] = useState<AppTab>(() =>

    parseTab(new URLSearchParams(window.location.search).get("tab"))

  );

  const [activeLayer, setActiveLayerState] = useState(() =>

    parseLayer(new URLSearchParams(window.location.search).get("layer"))

  );

  const [pipelinePlaying, setPipelinePlaying] = useState(true);

  const [demoTourActive, setDemoTourActive] = useState(false);

  const [demoTourElapsed, setDemoTourElapsed] = useState(0);



  const syncFromUrl = useCallback(() => {

    const params = new URLSearchParams(window.location.search);

    setActiveTabState(parseTab(params.get("tab")));

    setActiveLayerState(parseLayer(params.get("layer")));

  }, []);



  useEffect(() => {

    window.addEventListener("popstate", syncFromUrl);

    return () => window.removeEventListener("popstate", syncFromUrl);

  }, [syncFromUrl]);



  const pushUrl = useCallback((tab: AppTab, layer: number) => {

    const params = new URLSearchParams(window.location.search);

    params.set("tab", tab);

    if (tab === "pipeline-journey") {

      params.set("layer", String(layer));

    } else {

      params.delete("layer");

    }

    const qs = params.toString();

    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;

    window.history.replaceState(null, "", url);

  }, []);



  const setActiveTab = useCallback(

    (tab: AppTab) => {

      setActiveTabState(tab);

      pushUrl(tab, activeLayer);

    },

    [activeLayer, pushUrl]

  );



  const setActiveLayer = useCallback(

    (layer: number) => {

      const clamped = Math.min(Math.max(layer, 1), LAYER_PIPELINE.length);

      setActiveLayerState(clamped);

      if (activeTab === "pipeline-journey") pushUrl(activeTab, clamped);

    },

    [activeTab, pushUrl]

  );



  const setScenarioId = useCallback((id: string) => {

    setScenarioIdState(id);

  }, []);



  const startDemoTour = useCallback(() => {

    setDemoTourElapsed(0);

    setDemoTourActive(true);

    setPipelinePlaying(false);

    setActiveTabState("overview");

    pushUrl("overview", 1);

  }, [pushUrl]);



  const stopDemoTour = useCallback(() => {

    setDemoTourActive(false);

    setDemoTourElapsed(0);

    setPipelinePlaying(false);

  }, []);



  useEffect(() => {

    if (!demoTourActive) return;

    const interval = setInterval(() => {

      setDemoTourElapsed((e) => {

        if (e >= TOUR_DURATION_S) {

          setDemoTourActive(false);

          return TOUR_DURATION_S;

        }

        return e + 1;

      });

    }, 1000);

    return () => clearInterval(interval);

  }, [demoTourActive]);



  useEffect(() => {

    const onKey = (e: KeyboardEvent) => {

      if (e.key === "Escape" && demoTourActive) {

        e.preventDefault();

        stopDemoTour();

        return;

      }



      if (activeTab !== "pipeline-journey") return;

      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;



      if (e.key === "ArrowLeft") {

        e.preventDefault();

        setPipelinePlaying(false);

        setActiveLayer(Math.max(1, activeLayer - 1));

      } else if (e.key === "ArrowRight") {

        e.preventDefault();

        setPipelinePlaying(false);

        setActiveLayer(Math.min(LAYER_PIPELINE.length, activeLayer + 1));

      } else if (e.key === " ") {

        e.preventDefault();

        setPipelinePlaying((p) => !p);

      }

    };



    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);

  }, [activeTab, activeLayer, demoTourActive, setActiveLayer, stopDemoTour]);



  const scenario = getScenario(scenarioId);

  const activeLayerDef = LAYER_PIPELINE.find((l) => l.id === activeLayer) ?? LAYER_PIPELINE[0];



  const value = useMemo<ScenarioContextValue>(

    () => ({

      scenarioId,

      scenario,

      setScenarioId,

      activeTab,

      setActiveTab,

      activeLayer,

      setActiveLayer,

      activeLayerDef,

      pipelinePlaying,

      setPipelinePlaying,

      demoTourActive,

      demoTourElapsed,

      startDemoTour,

      stopDemoTour,

    }),

    [

      scenarioId,

      scenario,

      setScenarioId,

      activeTab,

      setActiveTab,

      activeLayer,

      setActiveLayer,

      activeLayerDef,

      pipelinePlaying,

      demoTourActive,

      demoTourElapsed,

      startDemoTour,

      stopDemoTour,

    ]

  );



  return <ScenarioContext.Provider value={value}>{children}</ScenarioContext.Provider>;

}



export function useScenario(): ScenarioContextValue {

  const ctx = useContext(ScenarioContext);

  if (!ctx) throw new Error("useScenario must be used within ScenarioProvider");

  return ctx;

}


