import { Reveal, SectionTitle } from "./ui";
import { EyeOff, Scale, Users, Package, UserCheck, Gauge } from "lucide-react";

const CARDS = [
  { icon: EyeOff, tone: "cyan", title: "Privacy by design", tag: "DPDP Act 2023",
    body: "Faces and bystander plates are blurred at the edge, before storage. Only the violation packet is ever transmitted." },
  { icon: Scale, tone: "amber", title: "Legally admissible", tag: "BSA 2023 · S.63(4)",
    body: "Every frame is SHA-256 hashed and device-signed at capture; approval mints a Section 63(4) certificate for court." },
  { icon: Users, tone: "ok", title: "Culturally fair", tag: "MV Act §129",
    body: "A Helmet / Pagdi / None classifier prevents wrongful challans to turban-wearing Sikh riders — a real trust failure of generic models." },
  { icon: Package, tone: "cyan", title: "Procurement-clean", tag: "Apache-2.0",
    body: "Built on RT-DETRv2 (Apache-2.0), avoiding the AGPL-3.0 trap that blocks most YOLO-based projects from government deployment." },
  { icon: UserCheck, tone: "amber", title: "Human-in-the-loop", tag: "No auto-fines",
    body: "No challan is ever auto-issued. Low-confidence cases queue for an officer; an optional VLM gives a second opinion." },
  { icon: Gauge, tone: "danger", title: "False-challan rate KPI", tag: "<2% target",
    body: "We optimise the metric BTP actually cares about — wrong fines erode public trust — not just an academic mAP score." },
] as const;

const TONE: Record<string, string> = {
  cyan: "bg-cyan-tech/10 ring-cyan-tech/30 text-cyan-tech",
  amber: "bg-amber-brand/10 ring-amber-brand/30 text-amber-brand",
  ok: "bg-ok/10 ring-ok/30 text-ok",
  danger: "bg-danger/10 ring-danger/30 text-danger",
};

export default function Differentiators() {
  return (
    <section id="edge" className="relative py-24 sm:py-32">
      <div className="section-pad">
        <SectionTitle
          kicker="Why this wins, not just works"
          title={<>The edge over a <span className="text-slate-500">generic YOLO box</span></>}
          sub="Anyone can detect a violation. Drishaak is engineered for the six things that decide whether an enforcement system actually gets deployed in India."
        />

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c, i) => (
            <Reveal key={c.title} delay={(i % 3) * 0.08}>
              <div className="group h-full rounded-2xl glass p-6 transition hover:-translate-y-1 hover:bg-white/[0.05]">
                <div className="flex items-center justify-between">
                  <span className={`grid h-11 w-11 place-items-center rounded-xl ring-1 ${TONE[c.tone]}`}>
                    <c.icon className="h-5 w-5" />
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${TONE[c.tone]}`}>{c.tag}</span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-white">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{c.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
