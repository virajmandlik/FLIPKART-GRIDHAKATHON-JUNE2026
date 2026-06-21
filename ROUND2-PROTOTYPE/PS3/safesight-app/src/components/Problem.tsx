// Problem.tsx
import { Reveal, SectionTitle } from "./ui";
import { Eye, Clock, Scale, AlertTriangle } from "lucide-react";

const PAINS = [
  { icon: Clock, n: "01", title: "Manual & slow", body: "Officers eyeball thousands of frames daily. Inconsistent, fatiguing, unscalable." },
  { icon: AlertTriangle, n: "02", title: "Wrong challans erode trust", body: "Generic detectors fine Sikh riders wearing a pagdi and misread plates — public backlash follows." },
  { icon: Scale, n: "03", title: "Evidence gets challenged", body: "Auto-captured images without integrity proof are weak in court under the new BSA 2023." },
  { icon: Eye, n: "04", title: "Privacy exposure", body: "Storing raw faces & plates of bystanders violates the DPDP Act 2023." },
];

export default function Problem() {
  return (
    <section id="problem" className="relative py-24 sm:py-32">
      <div className="section-pad">
        <SectionTitle
          kicker="The reality on Bengaluru roads"
          title={<>Detection is the easy part. <span className="text-slate-400">Trust is the hard part.</span></>}
          sub="Every team can draw a bounding box. The reason enforcement programs stall is fairness, privacy and legal defensibility — that's exactly what SafeSight EN is built around."
        />

        <div className="mt-16 divide-y divide-white/[0.07] border-t border-white/[0.07]">
          {PAINS.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.05}>
              <div className="group grid gap-4 py-7 sm:grid-cols-[80px_1fr] sm:gap-8">
                <span className="font-mono text-sm text-slate-600">{p.n}</span>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-6">
                  <p.icon className="h-5 w-5 shrink-0 text-slate-500 transition group-hover:text-saffron" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">{p.title}</h3>
                    <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-400">{p.body}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}