import { m } from "framer-motion";
import { Trophy, Zap, Gauge, Cpu, Timer } from "lucide-react";
import { Reveal } from "./_ui";

/** Detection-model selection matrix: YOLO11 vs RT-DETR-L on the Helmet Detection Dataset. */

const MAP_BARS = [
  { label: "YOLO11", value: 89.5, display: "~89–90%", winner: true },
  { label: "RT-DETR-L", value: 84.5, display: "84.5%", winner: false },
] as const;

const ROWS = [
  { icon: Trophy, metric: "mAP@50", yolo: "~89–90%", detr: "84.5%" },
  { icon: Timer, metric: "Training time", yolo: "30–40 min", detr: "4.36 hrs" },
  { icon: Zap, metric: "Inference speed", yolo: "Fast", detr: "Moderate" },
  { icon: Gauge, metric: "Real-time suitability", yolo: "Excellent", detr: "Moderate" },
  { icon: Cpu, metric: "Resource consumption", yolo: "Lower", detr: "Higher" },
] as const;

const REASONS = [
  "Higher mAP@50 (~89–90% vs 84.5%)",
  "Faster training (30–40 min vs 4.36 hrs)",
  "Better real-time inference performance",
  "Lower computational requirements (edge-friendly)",
  "Already integrated into the full violation pipeline",
] as const;

export default function ModelMatrix() {
  return (
    <Reveal delay={0.15}>
      <div className="mt-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-ss-muted">
              Detection model selection
            </div>
            <h3 className="mt-1 text-xl font-bold text-white">
              Why <span className="ss-gold-text">YOLO11</span> over RT-DETR-L
            </h3>
          </div>
          <span className="ss-mono text-[11px] text-ss-muted">
            Helmet Detection Dataset · 30 epochs · 1024×1024 · Tesla T4
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          {/* mAP@50 bar comparison */}
          <div className="ss-card p-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-ss-muted">
              mAP@50 comparison
            </div>
            <div className="mt-5 space-y-5">
              {MAP_BARS.map((b, i) => (
                <div key={b.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className={b.winner ? "font-bold text-ss-gold" : "text-ss-muted"}>
                      {b.label}
                      {b.winner && <span className="ml-2 text-[10px] text-ss-green">★ selected</span>}
                    </span>
                    <span className={`ss-mono ${b.winner ? "text-ss-gold" : "text-ss-muted"}`}>
                      {b.display}
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <m.div
                      initial={{ width: "0%" }}
                      whileInView={{ width: `${b.value}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.3, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                      className={`h-full rounded-full ${
                        b.winner
                          ? "bg-gradient-to-r from-ss-gold to-ss-green"
                          : "bg-white/20"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-lg bg-ss-green/10 p-3 ring-1 ring-ss-green/20">
              <div className="text-xs font-semibold text-ss-green">Final decision: YOLO11</div>
              <ul className="mt-2 space-y-1">
                {REASONS.map((r) => (
                  <li key={r} className="flex gap-2 text-[11px] text-ss-muted">
                    <span className="text-ss-green">✓</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* full comparison matrix */}
          <div className="ss-card overflow-hidden p-0">
            <div className="grid grid-cols-[1.4fr_1fr_1fr] border-b border-white/[0.06] bg-white/[0.02] px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-ss-muted">
              <span>Metric</span>
              <span className="text-center text-ss-gold">YOLO11</span>
              <span className="text-center">RT-DETR-L</span>
            </div>
            {ROWS.map((row, i) => (
              <m.div
                key={row.metric}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
                className="grid grid-cols-[1.4fr_1fr_1fr] items-center border-b border-white/[0.04] px-5 py-3 text-sm last:border-b-0"
              >
                <span className="flex items-center gap-2 text-ss-muted">
                  <row.icon className="h-3.5 w-3.5 text-ss-gold" />
                  {row.metric}
                </span>
                <span className="text-center font-bold text-ss-gold">{row.yolo}</span>
                <span className="text-center text-ss-muted">{row.detr}</span>
              </m.div>
            ))}
            <div className="px-5 py-3 text-[11px] text-ss-muted">
              Both models learned the task; YOLO11 wins on accuracy, training time, inference speed,
              and edge resource cost — and is already integrated end-to-end.
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
