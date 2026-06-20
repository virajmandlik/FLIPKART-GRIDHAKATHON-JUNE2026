// LivePipeline.tsx
import { useEffect, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Play, Pause, ChevronLeft, ChevronRight, Eye, Server } from "lucide-react";
import { STEPS } from "../data/pipeline";
import { getScenario, SCENARIOS } from "../data/scenarios";
import { SectionTitle } from "./ui";
import FrontStage from "./FrontStage";
import BackStage from "./BackStage";

const DURATION = 2800;

interface Props {
  scenarioId: string;
  onScenarioChange: (id: string) => void;
}

export default function LivePipeline({ scenarioId, onScenarioChange }: Props) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const scenario = getScenario(scenarioId);
  const step = STEPS[active];

  const frontText = scenario.stepOverrides[step.id]?.front ?? step.frontText;
  const backText = scenario.stepOverrides[step.id]?.back ?? step.backText;

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % STEPS.length), DURATION);
    return () => clearTimeout(t);
  }, [active, playing]);

  const go = (d: number) => { setPlaying(false); setActive((a) => (a + d + STEPS.length) % STEPS.length); };

  return (
    <section id="pipeline" className="relative py-24 sm:py-32">
      <div className="section-pad">
        <SectionTitle
          kicker="The journey · front-stage & back-stage"
          title={<>One frame, <span className="text-saffron">end to end</span></>}
          sub="Watch a single CCTV frame become a court-ready challan. Pick any PS3 violation scenario below — each has its own junction scene, detections and evidence story."
        />

        <div className="mt-10">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Violation scenario (PS3 §3)
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => { onScenarioChange(s.id); setActive(0); setPlaying(false); }}
                className={`rounded-lg px-3 py-2 text-left text-xs font-medium transition ${
                  scenarioId === s.id
                    ? "bg-saffron/10 text-saffron"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="block">{s.title}</span>
                <span className="mt-0.5 block text-[10px] font-normal opacity-70">{s.location.split(",")[0]}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Active: <span className="text-teal">{scenario.ps3Task}</span>
            {!scenario.isViolation && <span className="ml-2 text-ok">Edge case — no challan</span>}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-white/[0.07] pt-6">
          <button onClick={() => setPlaying((p) => !p)}
            className="inline-flex items-center gap-2 rounded-full bg-saffron px-4 py-2 text-sm font-semibold text-ink-950 transition hover:brightness-105">
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {playing ? "Pause" : "Play"}
          </button>
          <button onClick={() => go(-1)} className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:text-white"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => go(1)} className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:text-white"><ChevronRight className="h-4 w-4" /></button>
          <div className="ml-1 flex flex-wrap gap-1">
            {STEPS.map((s, i) => (
              <button key={s.id} onClick={() => { setPlaying(false); setActive(i); }}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${i === active ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"}`}>
                {s.short}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 h-px w-full bg-white/10">
          <m.div className="h-px bg-saffron"
            animate={{ width: `${((active + 1) / STEPS.length) * 100}%` }} transition={{ duration: 0.4 }} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <FrontStage reveal={step.reveal} stepId={step.id} scenario={scenario} />
          </div>

          <div className="lg:col-span-2">
            <div className="flex h-full flex-col border-l border-white/[0.07] pl-6">
              <div className="flex items-center gap-3">
                <step.icon className={`h-5 w-5 ${step.tier === "edge" ? "text-teal" : "text-saffron"}`} />
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                    Step {active + 1}/{STEPS.length} · {step.tier === "edge" ? "Edge node" : "Cloud"}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <m.div key={`${scenario.id}-${step.id}`}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }} className="mt-6 space-y-5">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-teal">
                      <Eye className="h-3.5 w-3.5" /> Front-stage
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-200">{frontText}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-saffron">
                      <Server className="h-3.5 w-3.5" /> Back-stage
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-200">{backText}</p>
                  </div>
                </m.div>
              </AnimatePresence>

              <div className="mt-auto pt-6 text-xs font-mono text-slate-500">{step.service}</div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <BackStage active={active} />
        </div>
      </div>
    </section>
  );
}