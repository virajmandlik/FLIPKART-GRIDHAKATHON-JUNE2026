import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Pause, ChevronLeft, ChevronRight, Eye, Server } from "lucide-react";
import { STEPS } from "../data/pipeline";
import { getScenario, SCENARIOS } from "../data/scenarios";
import { SectionTitle, Pill } from "./ui";
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
          title={<>One frame, <span className="text-gradient">end to end</span></>}
          sub="Watch a single CCTV frame become a court-ready challan. Pick any PS3 violation scenario below — each has its own junction scene, detections and evidence story."
        />

        {/* scenario picker */}
        <div className="mt-8">
          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
            Violation scenario (PS3 §3)
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => { onScenarioChange(s.id); setActive(0); setPlaying(false); }}
                className={`rounded-xl px-3 py-2 text-left text-xs font-semibold transition ring-1 ${
                  scenarioId === s.id
                    ? "bg-amber-brand/15 text-amber-brand ring-amber-brand/50"
                    : "glass text-slate-400 ring-white/10 hover:text-white hover:ring-white/20"
                }`}
              >
                <span className="block">{s.title}</span>
                <span className="mt-0.5 block text-[10px] font-normal opacity-70">{s.location.split(",")[0]}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Active: <span className="text-cyan-tech">{scenario.ps3Task}</span>
            {!scenario.isViolation && (
              <span className="ml-2 rounded bg-ok/15 px-2 py-0.5 text-ok">Edge case — no challan</span>
            )}
          </p>
        </div>

        {/* controls */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button onClick={() => setPlaying((p) => !p)}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-brand px-4 py-2 text-sm font-bold text-ink-950 transition hover:brightness-110">
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {playing ? "Pause" : "Play"}
          </button>
          <button onClick={() => go(-1)} className="grid h-9 w-9 place-items-center rounded-xl glass hover:bg-white/10"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => go(1)} className="grid h-9 w-9 place-items-center rounded-xl glass hover:bg-white/10"><ChevronRight className="h-4 w-4" /></button>
          <div className="ml-1 flex flex-wrap gap-1.5">
            {STEPS.map((s, i) => (
              <button key={s.id} onClick={() => { setPlaying(false); setActive(i); }}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${i === active ? "bg-white/15 text-white" : "text-slate-500 hover:text-slate-300"}`}>
                {s.short}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div className="h-full bg-gradient-to-r from-cyan-tech to-amber-brand"
            animate={{ width: `${((active + 1) / STEPS.length) * 100}%` }} transition={{ duration: 0.4 }} />
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <FrontStage reveal={step.reveal} stepId={step.id} scenario={scenario} />
          </div>

          <div className="lg:col-span-2">
            <div className="flex h-full flex-col rounded-2xl glass p-6">
              <div className="flex items-center gap-3">
                <span className={`grid h-12 w-12 place-items-center rounded-xl ${step.tier === "edge" ? "bg-cyan-tech/15 ring-1 ring-cyan-tech/40" : "bg-amber-brand/15 ring-1 ring-amber-brand/40"}`}>
                  <step.icon className={`h-6 w-6 ${step.tier === "edge" ? "text-cyan-tech" : "text-amber-brand"}`} />
                </span>
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-widest text-slate-500">
                    Step {active + 1}/{STEPS.length} · {step.tier === "edge" ? "Edge node" : "Cloud"}
                  </div>
                  <h3 className="text-xl font-extrabold text-white">{step.title}</h3>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={`${scenario.id}-${step.id}`}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }} className="mt-6 space-y-4">
                  <div className="rounded-xl bg-cyan-tech/[0.06] p-4 ring-1 ring-cyan-tech/20">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-cyan-tech">
                      <Eye className="h-3.5 w-3.5" /> Front-stage
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-200">{frontText}</p>
                  </div>
                  <div className="rounded-xl bg-amber-brand/[0.06] p-4 ring-1 ring-amber-brand/20">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-brand">
                      <Server className="h-3.5 w-3.5" /> Back-stage
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-200">{backText}</p>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="mt-auto pt-6">
                <Pill tone={step.tier === "edge" ? "cyan" : "amber"}>
                  <Server className="h-3 w-3" /> {step.service}
                </Pill>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <BackStage active={active} />
        </div>
      </div>
    </section>
  );
}
