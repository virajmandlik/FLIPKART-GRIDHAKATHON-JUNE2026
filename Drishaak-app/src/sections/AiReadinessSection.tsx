import { m } from "framer-motion";
import { ScanEye, Brain, Lightbulb, FileCheck2, FlaskConical, Database, Target, Gauge, ArrowRight } from "lucide-react";
import { SectionHead, Reveal, Counter } from "./_ui";

/* Enterprise AI-readiness narrative: a research-grounded Chain-of-Thought
   validation flow, a readiness index, and the three adoption principles that
   keep outcomes at the centre. The four-stage CoT is adapted from CoT-VLM4Tar
   (Ren et al., 2025, arXiv:2503.01632). */

const COT_STAGES = [
  { icon: ScanEye, label: "Scene", desc: "Classify the violation type" },
  { icon: Brain, label: "Analysis", desc: "Reason over riders, ROI & MV-Act rules" },
  { icon: Lightbulb, label: "Solution", desc: "Propose a verdict + false-positive risk" },
  { icon: FileCheck2, label: "Formatting", desc: "Emit a court-ready evidence record" },
] as const;

const READINESS_DIMENSIONS = [
  { label: "Data hygiene", value: 96 },
  { label: "Model governance", value: 92 },
  { label: "Human oversight", value: 98 },
  { label: "Outcome alignment", value: 95 },
] as const;

const PRINCIPLES = [
  {
    icon: FlaskConical,
    tone: "gold",
    title: "Isolated AI pilot",
    body:
      "Every model ships first into a sandboxed pilot junction — never straight to production. Behaviour is measured on real Bengaluru traffic before any city-wide rollout.",
  },
  {
    icon: Database,
    tone: "green",
    title: "Better data hygiene",
    body:
      "Curated, de-duplicated, India-context data with edge-side privacy masking. Clean inputs in, defensible outputs out — no garbage-in-garbage-out surprises.",
  },
  {
    icon: Target,
    tone: "gold",
    title: "Outcome at the centre",
    body:
      "We optimise the metric the city cares about — false-challan rate and fair enforcement — not vanity accuracy. The outcome stays at the centre of every output.",
  },
] as const;

const TONE: Record<string, string> = {
  gold: "border-ss-gold/25 bg-ss-gold/10 text-ss-gold",
  green: "border-ss-green/25 bg-ss-green/10 text-ss-green",
};

export default function AiReadinessSection() {
  const indexScore = Math.round(
    READINESS_DIMENSIONS.reduce((s, d) => s + d.value, 0) / READINESS_DIMENSIONS.length,
  );

  return (
    <section id="ai-readiness" className="ss-section border-t border-white/[0.05]">
      <div className="ss-pad">
        <SectionHead
          center
          kicker="Enterprise AI readiness"
          title={
            <>
              Built to be <span className="ss-gold-text">adopted, not just demoed.</span>
            </>
          }
          sub="Capable models, governed responsibly and grounded in published research — so a government can deploy with confidence."
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* Chain-of-Thought validation — grounded in CoT-VLM4Tar (Ren et al., 2025) */}
          <Reveal>
            <div className="ss-card relative h-full overflow-hidden p-8">
              <span className="grid h-12 w-12 place-items-center rounded-xl border border-ss-gold/25 bg-ss-gold/10 text-ss-gold">
                <Brain className="h-6 w-6" />
              </span>
              <h3 className="mt-6 text-xl font-bold text-white">
                Chain-of-Thought validation
              </h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-ss-muted">
                Before any challan is proposed, the agentic validator reasons in four
                explicit steps — the same structured Chain-of-Thought shown to make
                vision-language models reliable on real traffic scenes. Each step is
                logged, so the verdict is auditable rather than a black box.
              </p>

              <div className="mt-6 space-y-2.5">
                {COT_STAGES.map((s, i) => (
                  <m.div
                    key={s.label}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5"
                  >
                    <span className="ss-mono text-[11px] text-ss-muted">{i + 1}</span>
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-ss-gold/20 bg-ss-gold/10 text-ss-gold">
                      <s.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                        {s.label}
                        {i < COT_STAGES.length - 1 && (
                          <ArrowRight className="h-3 w-3 text-ss-muted/50" />
                        )}
                      </div>
                      <div className="truncate text-[11px] text-ss-muted">{s.desc}</div>
                    </div>
                  </m.div>
                ))}
              </div>

              <p className="mt-5 text-[10px] leading-relaxed text-ss-muted/70">
                Four-stage reasoning adapted from <span className="text-ss-muted">CoT-VLM4Tar</span>,
                Ren et al., 2025 (arXiv:2503.01632) — Scene → Analysis → Solution → Formatting.
              </p>
            </div>
          </Reveal>

          {/* AI Readiness Index — composite gauge */}
          <Reveal delay={0.1}>
            <div className="ss-card h-full p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-ss-gold" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-ss-muted">
                    AI Readiness Index
                  </span>
                </div>
                <span className="ss-mono text-xs text-ss-green">Deployment-ready</span>
              </div>

              <div className="mt-5 flex items-end gap-2">
                <span className="text-6xl font-extrabold tracking-tight text-ss-green">
                  <Counter value={indexScore} />
                </span>
                <span className="mb-3 text-lg text-ss-muted">/ 100</span>
              </div>

              <div className="mt-6 space-y-4">
                {READINESS_DIMENSIONS.map((d, i) => (
                  <div key={d.label}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-ss-muted">{d.label}</span>
                      <span className="ss-mono text-white">{d.value}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <m.div
                        initial={{ width: "0%" }}
                        whileInView={{ width: `${d.value}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full bg-gradient-to-r from-ss-gold to-ss-green"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Three adoption principles */}
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08}>
              <div className="ss-card-soft h-full p-7">
                <span
                  className={`grid h-11 w-11 place-items-center rounded-xl border ${TONE[p.tone]}`}
                >
                  <p.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-base font-bold text-white">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ss-muted">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
