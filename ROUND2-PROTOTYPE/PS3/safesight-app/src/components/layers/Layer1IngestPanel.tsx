// Layer1IngestPanel.tsx
import { motion } from "framer-motion";
import { Activity, Film, MapPin, Timer } from "lucide-react";
import { useScenario } from "../../context/ScenarioContext";
import { GOLDEN_PATH_LOCATION, LAYER1_OUTPUT } from "../../data/layerOutputs";
import ScenarioFrame from "../shared/ScenarioFrame";
import { Pill } from "../ui";

export default function Layer1IngestPanel() {
  const { scenario } = useScenario();
  const data = LAYER1_OUTPUT;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative overflow-hidden rounded-xl ring-1 ring-white/10"
      >
        <ScenarioFrame scenario={scenario} className="aspect-video w-full" showLocation />
        <motion.div
          className="pointer-events-none absolute inset-x-0 h-1 bg-teal/80"
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Pill tone="cyan">{data.camera_id}</Pill>
          <Pill tone="amber">LIVE</Pill>
        </div>
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-ink-950/90 to-transparent p-4">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <MapPin className="h-3.5 w-3.5 text-teal" />
            {GOLDEN_PATH_LOCATION}
          </div>
        </div>
      </motion.div>


      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-4"
      >
        <div className="rounded-xl border border-white/[0.08] p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Film className="h-4 w-4 text-teal" /> Frame selection
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border border-white/[0.08]">
            <table className="w-full text-xs">
              <tbody>
                <MetricRow
                  label="Original FPS"
                  value={data.selection.original_fps}
                />
                <MetricRow
                  label="Sampling FPS"
                  value={data.selection.sampling_fps}
                />
                <MetricRow
                  label="Motion Score"
                  value={data.selection.motion_score.toFixed(2)}
                />
                <MetricRow
                  label="Duplicate Score"
                  value={data.selection.duplicate_score.toFixed(2)}
                />
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 border-t border-white/[0.06] pt-4">
            {data.selection.reason.map((r) => (
              <span key={r} className="text-[11px] font-medium text-teal">{r.replace(/_/g, " ")}</span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Activity className="h-4 w-4 text-saffron" /> Event metadata
          </div>
          <dl className="mt-3 space-y-2 font-mono text-xs">
            <Row k="event_id" v={data.event_id} />
            <Row k="frame_id" v={data.frame.frame_id} />
            <Row k="resolution" v={data.frame.resolution} />
            <Row k="junction" v={data.junction_id} />
            <Row k="status" v={data.status} />
          </dl>
        </div>

        <div className="flex items-start gap-2 border-t border-white/[0.08] pt-4">
          <Timer className="mt-0.5 h-4 w-4 shrink-0 text-saffron" />
          <p className="text-xs leading-relaxed text-slate-400">
            Edge ingest drops {Math.round((1 - data.selection.sampling_fps / data.selection.original_fps) * 100)}% of
            duplicate frames — only motion-qualified frames egress for enhancement. Raw video never leaves the pole (DPDP).
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${accent ? "text-teal" : "text-white"}`}>{value}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-right text-slate-200">{v}</dd>
    </div>
  );
}


function MetricRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <tr className="border-b border-white/[0.05]">
      <td className="px-3 py-2 text-slate-500">
        {label}
      </td>
      <td className="px-3 py-2 text-right text-white">
        {value}
      </td>
    </tr>
  );
}