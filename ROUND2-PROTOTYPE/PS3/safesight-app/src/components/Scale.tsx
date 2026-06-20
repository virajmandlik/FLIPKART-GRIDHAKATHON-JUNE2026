// Scale.tsx
import { Reveal, SectionTitle } from "./ui";
import { scaleStages } from "../data/mockApi";
import { Check } from "lucide-react";

const NOTES = [
  "Cloud-agnostic",
  "On-prem / data-localised option",
  "GPU scale-to-zero",
  "Replaces ~200 reviewer-equivalents at 500 junctions",
];

export default function Scale() {
  return (
    <section id="scale" className="relative border-t border-white/[0.07] py-24 sm:py-32">
      <div className="section-pad">
        <SectionTitle
          kicker="From one junction to a city"
          title={<>Scales <span className="text-saffron">sub-linearly</span></>}
          sub="Because inference is at the edge, cloud cost grows with the number of violations — not with the volume of video. That's the answer to 'will it work for all of Bengaluru?'"
        />

        <div className="mt-16 divide-y divide-white/[0.07] border-t border-white/[0.07] sm:divide-y-0 sm:border-t-0 sm:grid sm:grid-cols-4 sm:gap-px sm:bg-white/[0.07]">
          {scaleStages.map((s, i) => (
            <Reveal key={s.stage} delay={i * 0.06}>
              <div className="bg-ink-950 py-6 sm:px-6">
                <div className="text-xs font-semibold uppercase tracking-wider text-saffron">{s.stage}</div>
                <div className="mt-3 text-2xl font-semibold text-white">{s.cameras}</div>
                <div className="mt-5 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Edge</span><span className="text-slate-300">{s.edge}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Cloud</span><span className="text-slate-300">{s.cloud}</span></div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
            {NOTES.map((n) => (
              <span key={n} className="inline-flex items-center gap-2 text-sm text-slate-400">
                <Check className="h-4 w-4 text-teal" /> {n}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}