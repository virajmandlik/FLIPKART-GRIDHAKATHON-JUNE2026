import { SectionHead, Reveal, Counter } from "./_ui";
import { Timer, ShieldX, ImageUp, Gauge } from "lucide-react";

const METRICS = [
  { icon: Timer, value: 73, suffix: "%", label: "Review time reduced", note: "Officers review packets, not raw footage" },
  { icon: ShieldX, value: 64, suffix: "%", label: "False positives reduced", note: "Agentic validation before any challan" },
  { icon: ImageUp, value: 116, suffix: "%", label: "Evidence quality improved", note: "Restormer + Real-ESRGAN restoration" },
  { icon: Gauge, value: 4, suffix: "×", label: "Enforcement efficiency", note: "More junctions covered per officer" },
];

export default function ImpactSection() {
  return (
    <section id="impact" className="ss-section border-t border-white/[0.05]">
      <div className="ss-pad">
        <SectionHead
          center
          kicker="Impact"
          title={
            <>
              Measurable change for <span className="ss-gold-text">a fairer city.</span>
            </>
          }
          sub="Drishaak doesn't just detect more — it makes enforcement faster, fairer and easier to defend."
        />

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((m2, i) => (
            <Reveal key={m2.label} delay={i * 0.08}>
              <div className="ss-card h-full p-7 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-ss-gold/25 bg-ss-gold/10 text-ss-gold">
                  <m2.icon className="h-5.5 w-5.5" />
                </span>
                <div className="mt-5 text-5xl font-extrabold tracking-tight text-white">
                  <Counter value={m2.value} suffix={m2.suffix} />
                </div>
                <div className="mt-2 text-sm font-semibold text-white">{m2.label}</div>
                <div className="mt-1.5 text-xs leading-relaxed text-ss-muted">{m2.note}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
