import {
  BarChart3,
  Brain,
  Camera,
  ChevronDown,
  FileLock2,
  Sparkles,
} from "lucide-react";
import { useScenario } from "../../context/ScenarioContext";

const STEPS = [
  {
    layer: 1,
    icon: Camera,
    title: "Smart Ingestion",
    subtitle: "30→3 FPS · motion filter · duplicate drop",
    tech: "UVH-26 · RTSP",
  },
  {
    layer: 2,
    icon: Sparkles,
    title: "Enhancement + ROI",
    subtitle: "Restormer · RT-DETR · ROI crops",
    tech: "Real-ESRGAN · ANPR prep",
  },
  {
    layer: 3,
    icon: Brain,
    title: "AI Violation Engine",
    subtitle: "Helmet · Triple · OCR · Rules",
    tech: "PaddleOCR · YOLO · agentic",
  },
  {
    layer: 4,
    icon: FileLock2,
    title: "Evidence + Review",
    subtitle: "DPDP · SHA-256 · PDF · HITL",
    tech: "BSA S.63(4) · WORM",
  },
  {
    layer: 5,
    icon: BarChart3,
    title: "Command Center",
    subtitle: "Heatmap · Deploy recs · ASTraM",
    tech: "Parivahan · KPI dashboard",
  },
] as const;

const BLACKBOX_MODELS = [
  "Restormer",
  "RT-DETR",
  "PaddleOCR",
  "Helmet cls",
  "Triple rider",
  "UVH-26 rules",
];

export default function EscalatorDiagram() {
  const { setActiveTab, setActiveLayer, setPipelinePlaying } = useScenario();

  const openLayer = (layer: number) => {
    setActiveLayer(layer);
    setPipelinePlaying(true);
    setActiveTab("pipeline-journey");
  };

  return (
    <div className="relative mx-auto max-w-3xl">
      <p className="mb-6 text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
        UVH-26 · Five-layer pipeline · Click any step to explore
      </p>

      <div className="flex flex-col gap-0 lg:flex-row lg:items-start lg:justify-center lg:gap-10">
        <div className="flex flex-1 flex-col items-center">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === STEPS.length - 1;

            return (
              <div key={step.layer} className="flex w-full max-w-md flex-col items-center">
                <button
                  type="button"
                  onClick={() => openLayer(step.layer)}
                  className="group w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-left transition hover:border-saffron/30 hover:bg-white/[0.04]"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/[0.08] bg-ink-900 text-saffron transition group-hover:border-saffron/25">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-[10px] font-bold text-teal">L{step.layer}</span>
                        <span className="text-sm font-semibold text-white">{step.title}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{step.subtitle}</p>
                    </div>
                  </div>
                </button>

                {!isLast && (
                  <div className="flex flex-col items-center py-1 text-slate-600">
                    <div className="h-4 w-px bg-white/10" />
                    <ChevronDown className="h-3.5 w-3.5" />
                    <div className="h-4 w-px bg-white/10" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <aside className="mt-6 w-full shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.02] p-4 lg:mt-0 lg:w-44">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Edge blackbox
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            Models run at pole — only signed packets egress.
          </p>
          <ul className="mt-3 space-y-1.5">
            {BLACKBOX_MODELS.map((m) => (
              <li
                key={m}
                className="rounded border border-white/[0.06] bg-ink-900/60 px-2 py-1 font-mono text-[10px] text-slate-400"
              >
                {m}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
