import { m } from "framer-motion";
import { Video, Scissors, Workflow, Tags, CheckCircle2, ArrowRight } from "lucide-react";
import { SectionHead, Reveal, Chip } from "./_ui";
import { LAYER1_OUTPUT } from "../data/layerOutputs";

const STEPS = [
  { icon: Video, title: "RTSP feed", body: "Live pole-side camera stream ingested at the edge." },
  { icon: Scissors, title: "Frame extraction", body: "Motion-scored sampling — 30 fps down to the frames that matter." },
  { icon: Workflow, title: "Kafka event bus", body: "Each candidate frame becomes a durable, ordered event." },
  { icon: Tags, title: "Metadata", body: "Camera ID, junction, timestamp and GPS stamped on the frame." },
  { icon: CheckCircle2, title: "Output event", body: "A clean, de-duplicated frame, ready for enhancement." },
];

export default function Layer1Section() {
  const l1 = LAYER1_OUTPUT;
  return (
    <section id="ingest" className="ss-section border-t border-white/[0.05]">
      <div className="ss-pad">
        <SectionHead
          kicker="Layer 1 · Smart ingestion"
          title={<>From raw stream to a single, clean frame.</>}
          sub="The edge node decides which frames are worth keeping — cutting millions of redundant frames down to the few that carry a real event."
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          {/* Flow */}
          <Reveal>
            <div className="ss-card p-6 sm:p-8">
              <div className="flex flex-col gap-3">
                {STEPS.map((s, i) => (
                  <div key={s.title}>
                    <m.div
                      initial={{ opacity: 0, x: -16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08, duration: 0.5 }}
                      className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3.5"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-ss-gold/25 bg-ss-gold/10 text-ss-gold">
                        <s.icon className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="font-semibold text-white">{s.title}</div>
                        <div className="text-sm text-ss-muted">{s.body}</div>
                      </div>
                    </m.div>
                    {i < STEPS.length - 1 && (
                      <div className="flex justify-center py-1 text-ss-muted/40">
                        <ArrowRight className="h-4 w-4 rotate-90" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Output event card */}
          <Reveal delay={0.1}>
            <div className="ss-card-soft h-full overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
                <span className="ss-mono text-[11px] text-ss-muted">layer-1 output · event</span>
                <Chip tone="green">READY</Chip>
              </div>
              <div className="space-y-3 p-5">
                {[
                  ["event_id", l1.event_id],
                  ["camera_id", l1.camera_id],
                  ["junction", l1.junction_id],
                  ["resolution", l1.frame.resolution],
                  ["sampling", `${l1.selection.original_fps} → ${l1.selection.sampling_fps} fps`],
                  ["motion_score", l1.selection.motion_score.toString()],
                  ["gps", `${l1.location.latitude}, ${l1.location.longitude}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between border-b border-white/[0.04] pb-2.5 last:border-0">
                    <span className="ss-mono text-xs text-ss-muted">{k}</span>
                    <span className="ss-mono text-xs font-semibold text-white">{v}</span>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2 pt-1">
                  {l1.selection.reason.map((r) => (
                    <Chip key={r} tone="gold">
                      {r}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
