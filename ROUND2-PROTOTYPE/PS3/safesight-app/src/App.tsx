import { useState } from "react";

import AppShell from "./components/layout/AppShell";

import Hero from "./components/Hero";

import Problem from "./components/Problem";

import Differentiators from "./components/Differentiators";

import Scale from "./components/Scale";

import Footer from "./components/Footer";

import ViolationGallery from "./components/ViolationGallery";

import LivePipeline from "./components/LivePipeline";

import Architecture from "./components/Architecture";

import EscalatorDiagram from "./components/architecture/EscalatorDiagram";

import CityCommandCenter, { type MapFocusRequest } from "./components/CityCommandCenter";

import LayerJourney from "./components/pipeline/LayerJourney";

import ArchitectureLightbox from "./components/shared/ArchitectureLightbox";

import Layer4EvidencePanel from "./components/layers/Layer4EvidencePanel";

import Layer5CommandPanel from "./components/layers/Layer5CommandPanel";

import LayerStepper from "./components/pipeline/LayerStepper";

import { SectionTitle, Pill } from "./components/ui";

import { useScenario } from "./context/ScenarioContext";

import { ArrowRight, Layers, ListOrdered, Shield } from "lucide-react";



type DemoPipelineMode = "classic" | "journey";



function OverviewTab() {

  return (

    <>

      <div id="top">

        <Hero />

        <Problem />

        <Differentiators />

        <Scale />

      </div>

      <Footer />

    </>

  );

}



function JourneyModePanel() {

  const { scenario, setActiveTab, setActiveLayer, setPipelinePlaying } = useScenario();



  const openJourney = () => {

    setActiveLayer(1);

    setPipelinePlaying(true);

    setActiveTab("pipeline-journey");

  };



  return (

    <section id="pipeline" className="relative py-24 sm:py-32">

      <div className="section-pad">

        <SectionTitle

          kicker="5-layer journey · UVH-26"

          title={<>Synced scenario · <span className="text-saffron">{scenario.title}</span></>}

          sub="Classic 9-step pipeline is available via toggle. Five-layer mode opens the full Pipeline Journey with the selected scenario context."

        />

        <div className="mt-8 rounded-2xl glass p-6 sm:p-8">

          <div className="flex flex-wrap items-center gap-3">

            <Pill tone="cyan">{scenario.cameraId}</Pill>

            <Pill tone="amber">{scenario.location.split(",")[0]}</Pill>

            {!scenario.isViolation && <Pill tone="ok">Edge case — auto-clear</Pill>}

          </div>

          <div className="mt-6">

            <LayerStepper activeLayer={1} onSelect={() => {}} completedLayers={[]} />

          </div>

          <p className="mt-4 text-sm text-slate-400">

            L1 ingest → L2 enhancement → L3 agentic validation → L4 evidence → L5 command dashboard.

            Auto-play walks all five layers with Bengaluru junction context.

          </p>

          <button

            type="button"

            onClick={openJourney}

            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-saffron px-5 py-3 text-sm font-bold text-ink-950 transition hover:brightness-110"

          >

            Open 5-layer journey

            <ArrowRight className="h-4 w-4" />

          </button>

        </div>

      </div>

    </section>

  );

}



function LiveDemoTab() {

  const { scenarioId, setScenarioId } = useScenario();

  const [pipelineMode, setPipelineMode] = useState<DemoPipelineMode>("classic");



  return (

    <>

      <ViolationGallery selectedId={scenarioId} onSelect={setScenarioId} />



      <div className="section-pad -mt-16 pb-4">

        <div className="inline-flex rounded-xl bg-white/[0.03] p-1 ring-1 ring-white/10">

          <button

            type="button"

            onClick={() => setPipelineMode("classic")}

            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition sm:text-sm ${

              pipelineMode === "classic"

                ? "bg-saffron text-ink-950"

                : "text-slate-400 hover:text-white"

            }`}

          >

            <ListOrdered className="h-4 w-4" />

            Classic pipeline (9 steps)

          </button>

          <button

            type="button"

            onClick={() => setPipelineMode("journey")}

            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition sm:text-sm ${

              pipelineMode === "journey"

                ? "bg-saffron text-ink-950"

                : "text-slate-400 hover:text-white"

            }`}

          >

            <Layers className="h-4 w-4" />

            5-layer journey

          </button>

        </div>

      </div>



      {pipelineMode === "classic" ? (

        <LivePipeline scenarioId={scenarioId} onScenarioChange={setScenarioId} />

      ) : (

        <JourneyModePanel />

      )}

      <Footer />

    </>

  );

}



function ArchitectureTab() {

  return (

    <section className="py-12 sm:py-16">

      <div className="section-pad">

        <SectionTitle

          kicker="System architecture"

          title={<>Five layers · <span className="text-saffron">edge to command</span></>}

          sub="UVH-26 pipeline from pole-side ingest to BTP Smart Enforcement Center. Click any layer to walk the Pipeline Journey."

        />

        <div className="mt-10 rounded-xl border border-white/[0.08] bg-white/[0.015] p-6 sm:p-10">

          <EscalatorDiagram />

          <div className="mt-8 flex justify-center border-t border-white/[0.06] pt-6">

            <ArchitectureLightbox linkOnly />

          </div>

        </div>

      </div>

      <Architecture />

      <Footer />

    </section>

  );

}



function CommandCenterTab() {

  const [mapFocus, setMapFocus] = useState<MapFocusRequest | null>(null);



  const handleJunctionFocus = (nodeId: string, zoomIdx: number) => {

    setMapFocus({ nodeId, zoomIdx });

    document.getElementById("deployment")?.scrollIntoView({ behavior: "smooth", block: "start" });

  };



  return (

    <>

      <section className="border-b border-white/[0.06] bg-ink-900/40 py-6">

        <div className="section-pad flex flex-wrap items-center justify-between gap-4">

          <div className="flex items-center gap-3">

            <span className="grid h-10 w-10 place-items-center rounded-lg border border-saffron/25 bg-saffron/10">

              <Shield className="h-5 w-5 text-saffron" />

            </span>

            <div>

              <div className="gov-label">BTP enforcement console</div>

              <div className="text-lg font-bold text-white">Bengaluru Smart Enforcement · ASTraM</div>

            </div>

          </div>

          <Pill tone="amber">Phase 1 · 8 junctions live</Pill>

        </div>

      </section>

      <CityCommandCenter focusRequest={mapFocus} />

      <section className="section-pad pb-16">

        <SectionTitle

          kicker="Layer 5 · Operations"

          title={<>Violation intel · <span className="text-saffron">deployment windows</span></>}

          sub="Junction heatmap from live edge nodes — Silk Board, Marathahalli, Hebbal, KR Puram. Officer-reviewed; no auto-fines."

        />

        <div className="mt-8">

          <Layer5CommandPanel onJunctionFocus={handleJunctionFocus} />

        </div>

      </section>

      <Footer />

    </>

  );

}



function EvidenceReviewTab() {

  return (

    <section className="enforcement-console py-12 sm:py-16">

      <div className="section-pad space-y-8">

        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.08] pb-6">

          <SectionTitle

            kicker="BTP evidence & review"

            title={<>Court-ready packet · <span className="text-saffron">KA01 AB 1234</span></>}

            sub="BSA 2023 S.63(4) admissibility path · DPDP-minimised frames · officer sign-off on every challan."

          />

          <span className="stamp-verified">Verified chain</span>
 
        </div>

        <Layer4EvidencePanel />

      </div>

      <Footer />

    </section>

  );

}



export default function App() {

  const { activeTab } = useScenario();



  return (

    <AppShell>

      {activeTab === "overview" && <OverviewTab />}

      {activeTab === "live-demo" && <LiveDemoTab />}

      {activeTab === "pipeline-journey" && <LayerJourney />}

      {activeTab === "architecture" && <ArchitectureTab />}

      {activeTab === "command-center" && <CommandCenterTab />}

      {activeTab === "evidence-review" && <EvidenceReviewTab />}

    </AppShell>

  );

}

