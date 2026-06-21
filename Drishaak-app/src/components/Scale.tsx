import { Reveal, SectionTitle, Pill } from "./ui";
import { scaleStages } from "../data/mockApi";
import { TrendingUp, CheckCircle2 } from "lucide-react";

export default function Scale() {
  return (
    <section id="scale" className="relative py-24 sm:py-32">
      <div className="section-pad">
        <SectionTitle
          kicker="From one junction to a city"
          title={<>Scales <span className="text-gradient">sub-linearly</span></>}
          sub="Because inference is at the edge, cloud cost grows with the number of violations — not with the volume of video. That is the answer to 'will it work for all of Bengaluru?'"
        />

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {scaleStages.map((s, i) => (
            <Reveal key={s.stage} delay={i * 0.08}>
              <div className="relative h-full rounded-2xl glass p-6">
                <div className="flex items-center gap-2 text-amber-brand">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">{s.stage}</span>
                </div>
                <div className="mt-4 text-2xl font-extrabold text-white">{s.cameras}</div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Edge</span><span className="text-slate-200">{s.edge}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Cloud</span><span className="text-slate-200">{s.cloud}</span></div>
                </div>
                <span className="absolute right-4 top-4 font-mono text-3xl font-black text-white/5">{i + 1}</span>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Pill tone="ok"><CheckCircle2 className="h-3 w-3" /> Cloud-agnostic</Pill>
            <Pill tone="ok"><CheckCircle2 className="h-3 w-3" /> On-prem / data-localised option</Pill>
            <Pill tone="ok"><CheckCircle2 className="h-3 w-3" /> GPU scale-to-zero</Pill>
            <Pill tone="ok"><CheckCircle2 className="h-3 w-3" /> Replaces ~200 reviewer-equivalents at 500 junctions</Pill>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
