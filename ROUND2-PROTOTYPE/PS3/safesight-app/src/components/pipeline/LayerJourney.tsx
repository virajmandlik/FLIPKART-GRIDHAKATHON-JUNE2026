import { useEffect, useRef, useState } from "react";
import { Pause, Play, Keyboard } from "lucide-react";
import { useScenario } from "../../context/ScenarioContext";
import { LAYER_PIPELINE, getLayer } from "../../data/layerPipeline";
import { SectionTitle, Pill } from "../ui";
import LayerStepper, { LayerProgressBar } from "./LayerStepper";
import Layer1IngestPanel from "../layers/Layer1IngestPanel";
import Layer2EnhancementPanel from "../layers/Layer2EnhancementPanel";
import Layer3ValidationPanel from "../layers/Layer3ValidationPanel";
import Layer4EvidencePanel from "../layers/Layer4EvidencePanel";
import Layer5CommandPanel from "../layers/Layer5CommandPanel";
import RepeatOffenderCard from "../vishal/RepeatOffenderCard";
import PoliceDeploymentWidget from "../vishal/PoliceDeploymentWidget";

function LayerPanel({ layerId }: { layerId: number }) {
  switch (layerId) {
    case 1:
      return <Layer1IngestPanel />;
    case 2:
      return <Layer2EnhancementPanel />;
    case 3:
      return <Layer3ValidationPanel />;
    case 4:
      return <Layer4EvidencePanel />;
    case 5:
      return <Layer5CommandPanel />;
    default:
      return null;
  }
}

export default function LayerJourney() {
  const {
    activeLayer,
    setActiveLayer,
    activeLayerDef,
    pipelinePlaying,
    setPipelinePlaying,
  } = useScenario();

  const [progress, setProgress] = useState(0);
  const [completedLayers, setCompletedLayers] = useState<number[]>([]);
  const startRef = useRef(Date.now());
  const layerDef = getLayer(activeLayer);

  useEffect(() => {
    startRef.current = Date.now();
    setProgress(0);
  }, [activeLayer]);

  useEffect(() => {
    if (!pipelinePlaying) return;

    const duration = layerDef.durationMs;
    const tick = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      setProgress(Math.min(1, elapsed / duration));
    }, 50);

    const advance = setTimeout(() => {
      setCompletedLayers((prev) => (prev.includes(activeLayer) ? prev : [...prev, activeLayer]));
      if (activeLayer < LAYER_PIPELINE.length) {
        setActiveLayer(activeLayer + 1);
      } else {
        setPipelinePlaying(false);
      }
    }, duration);

    return () => {
      clearInterval(tick);
      clearTimeout(advance);
    };
  }, [activeLayer, layerDef.durationMs, pipelinePlaying, setActiveLayer, setPipelinePlaying]);

  const handleSelectLayer = (layer: number) => {
    setPipelinePlaying(false);
    setActiveLayer(layer);
  };

  const Icon = activeLayerDef.icon;

  return (
    <section className="relative py-12 sm:py-16">
      <div className="section-pad">
        <SectionTitle
          kicker="Pipeline Journey · UVH-26"
          title={<>Five layers. <span className="text-gradient">One evidence chain.</span></>}
          sub="Golden path: Silk Board → Marathahalli · BLR_CAM_023 · KA01AB1234. Auto-play walks L1 ingest through L3 agentic validation."
        />

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setPipelinePlaying((p) => !p)}
            className="inline-flex items-center gap-2 rounded-xl bg-saffron px-4 py-2 text-sm font-bold text-ink-950 transition hover:brightness-110"
          >
            {pipelinePlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {pipelinePlaying ? "Pause" : "Auto-play"}
          </button>
          <Pill tone="cyan">{activeLayerDef.short} · {activeLayerDef.tier}</Pill>
          <Pill tone="amber">{activeLayerDef.outputStatus.replace(/_/g, " ")}</Pill>
          <span
            className="group relative inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-[10px] text-slate-500 ring-1 ring-white/10"
            title="← → prev/next layer · Space play/pause · Esc stop tour"
          >
            <Keyboard className="h-3 w-3" />
            Shortcuts
            <span className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-56 rounded-lg bg-ink-950 px-3 py-2 text-[10px] leading-relaxed text-slate-300 ring-1 ring-white/10 group-hover:block">
              ← → previous / next layer<br />
              Space — play / pause auto-play<br />
              Esc — stop judge tour
            </span>
          </span>
        </div>

        <div className="mt-6">
          <LayerStepper
            activeLayer={activeLayer}
            onSelect={handleSelectLayer}
            completedLayers={completedLayers}
          />
        </div>

        <div className="mt-4">
          <LayerProgressBar progress={progress} />
        </div>

        <div className="mt-8 rounded-2xl glass p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal/15 ring-1 ring-teal/40">
              <Icon className="h-5 w-5 text-teal" />
            </span>
            <div>
              <h3 className="text-xl font-extrabold text-white">{activeLayerDef.title}</h3>
              <p className="text-sm text-slate-400">{activeLayerDef.subtitle}</p>
            </div>
          </div>

          <LayerPanel layerId={activeLayer} />
        </div>

        {activeLayer >= 3 && (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <RepeatOffenderCard />
            <PoliceDeploymentWidget />
          </div>
        )}
      </div>
    </section>
  );
}
