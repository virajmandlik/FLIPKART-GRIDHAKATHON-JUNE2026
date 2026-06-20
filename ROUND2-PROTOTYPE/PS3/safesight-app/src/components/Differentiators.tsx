// Differentiators.tsx
import { Reveal, SectionTitle } from "./ui";
import { EyeOff, Scale, Users, Package, UserCheck, Gauge } from "lucide-react";

const CARDS = [
  { icon: EyeOff, title: "Privacy by design", tag: "DPDP Act 2023",
    body: "Faces and bystander plates are blurred at the edge, before storage. Only the violation packet is ever transmitted." },
  { icon: Scale, title: "Legally admissible", tag: "BSA 2023 · S.63(4)",
    body: "Every frame is SHA-256 hashed and device-signed at capture; approval mints a Section 63(4) certificate for court." },
  { icon: Users, title: "Culturally fair", tag: "MV Act §129",
    body: "A Helmet / Pagdi / None classifier prevents wrongful challans to turban-wearing Sikh riders — a real trust failure of generic models." },
  { icon: Package, title: "Procurement-clean", tag: "Apache-2.0",
    body: "Built on RT-DETRv2 (Apache-2.0), avoiding the AGPL-3.0 trap that blocks most YOLO-based projects from government deployment." },
  { icon: UserCheck, title: "Human-in-the-loop", tag: "No auto-fines",
    body: "No challan is ever auto-issued. Low-confidence cases queue for an officer; an optional VLM gives a second opinion." },
  { icon: Gauge, title: "False-challan rate KPI", tag: "<2% target",
    body: "We optimise the metric BTP actually cares about — wrong fines erode public trust — not just an academic mAP score." },
] as const;

export default function Differentiators() {
  return (
    <section id="edge" className="relative border-t border-white/[0.07] py-24 sm:py-32">
      <div className="section-pad">
        <SectionTitle
          kicker="Why this wins, not just works"
          title={<>The edge over a <span className="text-slate-500">generic detection box</span></>}
          sub="Anyone can detect a violation. SafeSight EN is engineered for the six things that decide whether an enforcement system actually gets deployed in India."
        />

        <div className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c, i) => (
            <Reveal key={c.title} delay={(i % 3) * 0.06}>
              <div className="group">
                <c.icon className="h-5 w-5 text-slate-500 transition group-hover:text-saffron" />
                <h3 className="mt-4 text-base font-semibold text-white">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{c.body}</p>
                <span className="mt-3 inline-block font-mono text-[11px] tracking-wide text-slate-600">{c.tag}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}