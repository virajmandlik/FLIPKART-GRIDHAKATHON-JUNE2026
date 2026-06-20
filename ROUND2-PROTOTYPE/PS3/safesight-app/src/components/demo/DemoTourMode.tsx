import { useEffect, useRef } from "react";
import { Clapperboard, X } from "lucide-react";
import { useScenario } from "../../context/ScenarioContext";

const TOUR_DURATION_S = 60;

type TourPhase = "overview" | "pipeline" | "evidence" | "command" | "done";

interface TourStep {
  at: number;
  phase: TourPhase;
  tab?: "overview" | "pipeline-journey" | "evidence-review" | "command-center";
  layer?: number;
  play?: boolean;
  clickDeployment?: boolean;
}

const STEPS: TourStep[] = [
  { at: 0, phase: "overview", tab: "overview" },
  { at: 5, phase: "pipeline", tab: "pipeline-journey", layer: 1, play: true },
  { at: 13, phase: "pipeline", layer: 2 },
  { at: 21, phase: "pipeline", layer: 3 },
  { at: 29, phase: "pipeline", layer: 4 },
  { at: 37, phase: "pipeline", layer: 5 },
  { at: 45, phase: "evidence", tab: "evidence-review", play: false },
  { at: 50, phase: "command", tab: "command-center", clickDeployment: true },
  { at: 60, phase: "done", play: false },
];

function phaseAt(elapsed: number): TourPhase {
  let phase: TourPhase = "overview";
  for (const step of STEPS) {
    if (elapsed >= step.at) phase = step.phase;
  }
  return phase;
}

export default function DemoTourMode() {
  const {
    activeTab,
    demoTourActive,
    demoTourElapsed,
    startDemoTour,
    stopDemoTour,
    setActiveTab,
    setActiveLayer,
    setPipelinePlaying,
  } = useScenario();

  const appliedRef = useRef(-1);

  const showButton = activeTab === "overview" || activeTab === "pipeline-journey";

  useEffect(() => {
    if (!demoTourActive) {
      appliedRef.current = -1;
      return;
    }

    const stepIdx = STEPS.findIndex((s, i) => {
      const next = STEPS[i + 1];
      return demoTourElapsed >= s.at && (!next || demoTourElapsed < next.at);
    });
    if (stepIdx < 0 || stepIdx === appliedRef.current) return;
    appliedRef.current = stepIdx;

    const step = STEPS[stepIdx];
    if (step.tab) setActiveTab(step.tab);
    if (step.layer) setActiveLayer(step.layer);
    if (step.play !== undefined) setPipelinePlaying(step.play);
    if (step.clickDeployment) {
      setTimeout(() => {
        document.querySelector<HTMLButtonElement>('[data-tour="deployment-row"]')?.click();
        document.getElementById("deployment")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 400);
    }
    if (step.phase === "done") stopDemoTour();
  }, [
    demoTourActive,
    demoTourElapsed,
    setActiveTab,
    setActiveLayer,
    setPipelinePlaying,
    stopDemoTour,
  ]);

  if (!showButton && !demoTourActive) return null;

  return (
    <>
      {demoTourActive && (
        <div className="fixed inset-x-0 top-[4.5rem] z-[60] flex justify-center px-4 pointer-events-none">
          <div className="flex items-center gap-3 rounded-xl bg-ink-950/90 px-4 py-2 ring-1 ring-saffron/40 backdrop-blur pointer-events-auto">
            <Clapperboard className="h-4 w-4 text-saffron animate-pulse" />
            <span className="font-mono text-sm font-bold text-white">
              Judge Tour {demoTourElapsed}/{TOUR_DURATION_S}s
            </span>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-saffron transition-all duration-1000"
                style={{ width: `${(demoTourElapsed / TOUR_DURATION_S) * 100}%` }}
              />
            </div>
            <span className="text-[10px] uppercase tracking-wider text-slate-500">
              {phaseAt(demoTourElapsed)}
            </span>
            <button
              type="button"
              onClick={stopDemoTour}
              className="grid h-7 w-7 place-items-center rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
              aria-label="Stop tour"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {showButton && !demoTourActive && (
        <button
          type="button"
          onClick={startDemoTour}
          className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-xl bg-saffron px-4 py-3 text-sm font-bold text-ink-950 shadow-lg shadow-saffron/20 transition hover:brightness-110"
        >
          <Clapperboard className="h-4 w-4" />
          Start Judge Tour
        </button>
      )}
    </>
  );
}
