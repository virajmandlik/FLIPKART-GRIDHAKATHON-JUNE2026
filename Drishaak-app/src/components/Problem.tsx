import { Reveal, SectionTitle } from "./ui";
import { Eye, Clock, Scale, AlertTriangle } from "lucide-react";

const PAINS = [
  { icon: Clock, title: "Manual & slow", body: "Officers eyeball thousands of frames daily. Inconsistent, fatiguing, unscalable." },
  { icon: AlertTriangle, title: "Wrong challans erode trust", body: "Generic detectors fine Sikh riders wearing a pagdi and misread plates — public backlash follows." },
  { icon: Scale, title: "Evidence gets challenged", body: "Auto-captured images without integrity proof are weak in court under the new BSA 2023." },
  { icon: Eye, title: "Privacy exposure", body: "Storing raw faces & plates of bystanders violates the DPDP Act 2023." },
];

export default function Problem() {
  return (
    <section id="problem" className="relative py-24 sm:py-32">
      <div className="section-pad">
        <SectionTitle
          kicker="The reality on Bengaluru roads"
          title={<>Detection is the easy part. <span className="text-slate-500">Trust is the hard part.</span></>}
          sub="Every team can draw a bounding box. The reason enforcement programs stall is fairness, privacy and legal defensibility. Drishaak is built around exactly those gaps."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PAINS.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08}>
              <div className="group h-full rounded-2xl glass p-6 transition hover:border-danger/30">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-danger/10 ring-1 ring-danger/30">
                  <p.icon className="h-5 w-5 text-danger" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-white">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
