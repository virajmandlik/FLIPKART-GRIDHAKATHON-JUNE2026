// ViolationGallery.tsx
import { Reveal, SectionTitle } from "./ui";
import { SCENARIOS } from "../data/scenarios";
import { STEPS } from "../data/pipeline";
import FrontStage from "./FrontStage";
import { MapPin, ArrowRight, Sparkles } from "lucide-react";

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function ViolationGallery({ selectedId, onSelect }: Props) {
  const classifyReveal = STEPS.find((s) => s.id === "classify")!.reveal;

  const handleSelect = (id: string) => {
    onSelect(id);
    setTimeout(() => {
      document.getElementById("pipeline")?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  };

  return (
    <section id="scenarios" className="relative border-t border-white/[0.07] py-24 sm:py-32">
      <div className="section-pad">
        <SectionTitle
          kicker="PS3 violation coverage · all edge cases"
          title={<>Nine scenarios, <span className="text-saffron">one platform</span></>}
          sub="Every violation type from the problem statement — plus culturally-fair edge cases and low-light preprocessing. Click any card to load it into the live pipeline above."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SCENARIOS.map((s, i) => (
            <Reveal key={s.id} delay={(i % 3) * 0.06}>
              <button
                onClick={() => handleSelect(s.id)}
                className={`group w-full overflow-hidden rounded-xl text-left transition ${
                  selectedId === s.id
                    ? "ring-1 ring-saffron/60"
                    : "ring-1 ring-white/[0.08] hover:ring-white/20"
                }`}
              >
                <div className="relative">
                  <FrontStage reveal={classifyReveal} stepId="classify" scenario={s} compact />
                  {!s.isViolation && (
                    <span className="absolute left-3 top-12 flex items-center gap-1 rounded bg-ok/90 px-2 py-1 text-[10px] font-semibold text-ink-950">
                      <Sparkles className="h-3 w-3" /> Edge case
                    </span>
                  )}
                  {s.lowLight && (
                    <span className="absolute left-3 top-12 rounded bg-teal/90 px-2 py-1 text-[10px] font-semibold text-ink-950">
                      PS3 §1 preprocess
                    </span>
                  )}
                </div>
                <div className="bg-ink-900/60 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-saffron">{s.title}</h3>
                      <p className="mt-1 text-xs text-slate-400">{s.subtitle}</p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-saffron" />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px]">
                    <span className="font-mono text-slate-500">{s.ps3Task}</span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <MapPin className="h-3 w-3" /> {s.location.split(",")[0]}
                    </span>
                  </div>
                  <div className="mt-2 font-mono text-[10px] text-teal/80">
                    {s.isViolation ? `conf ${(s.violationConfidence * 100).toFixed(0)}%` : "auto-cleared"} · {s.plate}
                  </div>
                </div>
              </button>
            </Reveal>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-slate-500">
          Real CCTV-style scene renders per PS3 violation type — detection overlays are simulated for the prototype.
        </p>
      </div>
    </section>
  );
}