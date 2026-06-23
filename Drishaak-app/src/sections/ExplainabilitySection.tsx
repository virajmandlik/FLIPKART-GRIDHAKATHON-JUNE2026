import { m } from "framer-motion";
import { Lightbulb, ArrowRight } from "lucide-react";
import { SectionHead, Reveal, Chip } from "./_ui";
import { useScenarioStore } from "./scenarioStore";
import { getVerdict, getReasoning, summaryFor, vehicleType, isTwoWheeler, pct } from "./scenarioDerive";

export default function ExplainabilitySection() {
  const { scenario } = useScenarioStore();
  const verdict = getVerdict(scenario);
  const reasoning = getReasoning(scenario);
  const twoWheeler = isTwoWheeler(scenario);

  const facts = [
    { k: "Vehicle", v: scenario.plate, note: `${vehicleType(scenario)} · ${pct(scenario.violationConfidence)}` },
    twoWheeler
      ? {
          k: "Riders detected",
          v: scenario.violationType === "TRIPLE_RIDING" ? "3" : "1–2",
          note: "From rider ROI",
          alert: scenario.violationType === "TRIPLE_RIDING",
        }
      : { k: "Occupants", v: "Driver", note: "Front-seat ROI" },
    scenario.headBox
      ? {
          k: "Headwear",
          v: scenario.headwear === "None" ? "Not present" : scenario.headwear ?? "—",
          note: scenario.headwear === "Pagdi" ? "MV Act §129 exempt" : "Helmet ROI",
          alert: scenario.headwear === "None",
        }
      : {
          k: "Seatbelt",
          v: scenario.violationType === "NO_SEATBELT" ? "Not worn" : "Worn",
          note: "Torso ROI",
          alert: scenario.violationType === "NO_SEATBELT",
        },
  ];

  return (
    <section id="explainable" className="ss-section border-t border-white/[0.05]">
      <div className="ss-pad">
        <SectionHead
          kicker="Explainable AI"
          title={
            <>
              Not just <span className="ss-muted line-through decoration-ss-red/50">confidence&nbsp;{pct(scenario.violationConfidence)}.</span>
              <br />A reason a court can read.
            </>
          }
          sub="Every decision is broken down into the exact observations that produced it — in plain, court-friendly language, with no AI buzzwords."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {/* Structured facts */}
          <Reveal>
            <div className="ss-card overflow-hidden">
              <div className="border-b border-white/[0.06] px-6 py-4">
                <span className="ss-mono text-[11px] uppercase tracking-widest text-ss-muted">Decision breakdown</span>
              </div>
              <div className="divide-y divide-white/[0.05]">
                {facts.map((f, i) => (
                  <m.div
                    key={f.k}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center justify-between px-6 py-4"
                  >
                    <div>
                      <div className="text-sm text-ss-muted">{f.k}</div>
                      <div className="text-[11px] text-ss-muted/60">{f.note}</div>
                    </div>
                    <span className={`text-lg font-bold ${"alert" in f && f.alert ? "text-ss-red" : "text-white"}`}>
                      {f.v}
                    </span>
                  </m.div>
                ))}
              </div>
              <div
                className={`flex items-center justify-between px-6 py-4 ${
                  verdict.cleared ? "bg-ss-green/[0.06]" : "bg-ss-red/[0.06]"
                }`}
              >
                <div>
                  <div className="text-xs uppercase tracking-wide text-ss-muted">
                    {verdict.cleared ? "Outcome" : "Violation"}
                  </div>
                  <div className="font-bold text-white">{verdict.cleared ? "Cleared — no challan" : verdict.title}</div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-extrabold ${verdict.cleared ? "text-ss-green" : "text-white"}`}>
                    {pct(verdict.confidence)}
                  </div>
                  <Chip tone={verdict.fpRisk === "LOW" ? "green" : "gold"}>FP risk · {verdict.fpRisk}</Chip>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Narrative explanation */}
          <Reveal delay={0.1}>
            <div className="ss-card-soft h-full p-7">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-ss-gold/25 bg-ss-gold/10 text-ss-gold">
                <Lightbulb className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-white">
                {verdict.cleared ? "Why this was cleared" : "Why this is a violation"}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ss-muted">{summaryFor(scenario)}</p>

              <ol className="mt-6 space-y-3">
                {reasoning.map((e, i) => (
                  <m.li
                    key={e}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className="flex gap-3 text-sm text-ss-muted"
                  >
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-ss-green/30 bg-ss-green/10 text-[11px] font-bold text-ss-green">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{e}</span>
                  </m.li>
                ))}
              </ol>

              <div className="mt-6 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3 text-sm text-ss-muted">
                <ArrowRight className="h-4 w-4 text-ss-gold" />
                Every claim is traceable to a frame and an ROI — no black-box scores.
              </div>
            </div>
          </Reveal>
        </div>

        <p className="mt-8 text-center text-[11px] leading-relaxed text-ss-muted/70">
          Reasoning follows a structured Chain-of-Thought — Scene → Analysis → Solution → Formatting —
          shown to make vision-language models reliable on real traffic scenes
          (<span className="text-ss-muted">CoT-VLM4Tar, Ren et al., 2025, arXiv:2503.01632</span>).
        </p>
      </div>
    </section>
  );
}
