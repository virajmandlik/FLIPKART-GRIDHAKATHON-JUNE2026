import { m } from "framer-motion";
import {
  Maximize,
  Crop,
  CornerDownRight,
  Layers3,
  Scale,
  Bot,
  Combine,
  Check,
  X as XIcon,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { SectionHead, Reveal, Chip } from "./_ui";
import ConfidenceRing from "./ConfidenceRing";
import { useScenarioStore } from "./scenarioStore";
import { getContextFlags, getRoiAnalysis, getVerdict, pct } from "./scenarioDerive";

const STAGES = [
  { icon: Layers3, name: "Results aggregator", desc: "Full-frame + ROI signals fused" },
  { icon: Scale, name: "Rule engine", desc: "MV Act + BTP rules applied" },
  { icon: Bot, name: "Agentic validation", desc: "Cross-checks for false positives" },
  { icon: Combine, name: "Evidence fusion", desc: "Single verified violation record" },
];

export default function Layer3Section() {
  const { scenario } = useScenarioStore();
  const flags = getContextFlags(scenario);
  const roi = getRoiAnalysis(scenario);
  const verdict = getVerdict(scenario);

  return (
    <section id="engine" className="ss-section border-t border-white/[0.05]">
      <div className="ss-pad">
        <SectionHead
          kicker="Layer 3 · AI violation engine"
          title={
            <>
              Two views of the scene,
              <br className="hidden sm:block" /> one <span className="ss-gold-text">verified verdict.</span>
            </>
          }
          sub="The full frame answers “what is happening on the road,” the cropped ROIs answer “who and what exactly.” Both streams merge through a rule engine and agentic validation before any violation is confirmed."
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          {/* LEFT — full frame */}
          <Reveal>
            <div className="ss-card h-full p-6">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg border border-ss-gold/25 bg-ss-gold/10 text-ss-gold">
                  <Maximize className="h-4.5 w-4.5" />
                </span>
                <div>
                  <div className="font-bold text-white">Full-frame analysis</div>
                  <div className="text-xs text-ss-muted">Scene-level context</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {flags.map((f) => (
                  <div
                    key={f.label}
                    className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3"
                  >
                    <span className="text-sm font-medium text-white">{f.label}</span>
                    {f.value ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-ss-red">
                        <Check className="h-3.5 w-3.5" /> yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-ss-muted/70">
                        <XIcon className="h-3.5 w-3.5" /> no
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* RIGHT — ROI */}
          <Reveal delay={0.08}>
            <div className="ss-card h-full p-6">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg border border-ss-green/25 bg-ss-green/10 text-ss-green">
                  <Crop className="h-4.5 w-4.5" />
                </span>
                <div>
                  <div className="font-bold text-white">ROI analysis</div>
                  <div className="text-xs text-ss-muted">Object-level detection</div>
                </div>
              </div>
              <div className="space-y-2.5">
                {roi.map((r) => (
                  <div
                    key={r.label}
                    className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3"
                  >
                    <span className="text-sm font-medium text-white">{r.label}</span>
                    <span className="flex items-center gap-2">
                      <span className={`ss-mono text-xs font-semibold ${r.alert ? "text-ss-red" : "text-ss-muted"}`}>
                        {r.value}
                      </span>
                      <span className="ss-mono text-[10px] text-ss-muted/60">{pct(r.conf)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Merge arrows */}
        <div className="flex justify-center gap-24 py-2 text-ss-gold/50 sm:gap-40">
          <CornerDownRight className="h-6 w-6 -scale-x-100" />
          <CornerDownRight className="h-6 w-6" />
        </div>

        {/* Fusion pipeline */}
        <Reveal>
          <div className="ss-card-soft p-6 sm:p-8">
            <div className="grid gap-3 sm:grid-cols-4">
              {STAGES.map((s, i) => (
                <m.div
                  key={s.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.5 }}
                  className="relative rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-lg border border-ss-gold/25 bg-ss-gold/10 text-ss-gold">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <div className="mt-3 font-semibold text-white">{s.name}</div>
                  <div className="text-xs text-ss-muted">{s.desc}</div>
                  {i < STAGES.length - 1 && (
                    <span className="absolute -right-2 top-1/2 hidden h-px w-4 -translate-y-1/2 bg-ss-gold/40 sm:block" />
                  )}
                </m.div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Verdict — clean, designed result strip */}
        <Reveal delay={0.05}>
          <m.div
            key={scenario.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-ss-card"
          >
            <div className="grid items-center gap-6 p-6 sm:grid-cols-[auto_1fr_auto] sm:p-8">
              {/* status icon */}
              <div className="flex items-center gap-4">
                <span
                  className={`grid h-14 w-14 place-items-center rounded-2xl border ${
                    verdict.cleared
                      ? "border-ss-green/30 bg-ss-green/10 text-ss-green"
                      : "border-ss-red/30 bg-ss-red/10 text-ss-red"
                  }`}
                >
                  {verdict.cleared ? <ShieldCheck className="h-7 w-7" /> : <AlertTriangle className="h-7 w-7" />}
                </span>
              </div>

              {/* detail */}
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ss-muted">
                  {verdict.cleared ? "Final verdict · no challan" : "Final verdict"}
                </div>
                <div className="mt-1 text-xl font-bold text-white sm:text-2xl">{verdict.title}</div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {verdict.cleared ? (
                    <Chip tone="green">Culturally fair · auto-cleared</Chip>
                  ) : (
                    verdict.violations.map((v) => (
                      <Chip key={v.label} tone="red">
                        {v.label} · {pct(v.conf)}
                      </Chip>
                    ))
                  )}
                  <Chip tone={verdict.fpRisk === "LOW" ? "green" : "gold"}>FP risk · {verdict.fpRisk}</Chip>
                </div>
              </div>

              {/* confidence ring */}
              <div className="justify-self-start sm:justify-self-end">
                <ConfidenceRing
                  value={verdict.confidence}
                  tone={verdict.cleared ? "green" : verdict.confidence >= 0.85 ? "gold" : "red"}
                  label="confidence"
                />
              </div>
            </div>

            {/* footer strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] bg-white/[0.015] px-6 py-3 text-[11px] text-ss-muted sm:px-8">
              <span className="ss-mono">{scenario.cameraId} · {scenario.location.split(",")[0]}</span>
              <span>Severity · {verdict.severity} · officer review required before any challan</span>
            </div>
          </m.div>
        </Reveal>
      </div>
    </section>
  );
}
