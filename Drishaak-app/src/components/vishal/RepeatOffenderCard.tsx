import { motion } from "framer-motion";
import { AlertOctagon, Car, MapPin } from "lucide-react";
import { PRIMARY_OFFENDER, type RepeatOffender } from "../../data/repeatOffenders";
import { Pill } from "../ui";

const VIOLATION_LABELS: Record<string, string> = {
  helmet_violation: "No helmet",
  triple_riding: "Triple riding",
  stop_line_violation: "Stop-line",
  wrong_side_violation: "Wrong-side",
  red_light_violation: "Red-light",
};

interface Props {
  offender?: RepeatOffender;
}

export default function RepeatOffenderCard({ offender = PRIMARY_OFFENDER }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl glass p-5 ring-1 ring-danger/25"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-danger/15 ring-1 ring-danger/40">
          <AlertOctagon className="h-5 w-5 text-danger" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-bold text-white">Repeat offender</h4>
            {offender.flaggedForDeployment && <Pill tone="danger">Deploy flag</Pill>}
          </div>
          <p className="mt-1 text-xs text-slate-500">Vishal intelligence · corridor hotlist</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-saffron/10 px-4 py-3 ring-1 ring-saffron/30">
        <div className="font-mono text-xl font-extrabold tracking-wider text-white">{offender.plate}</div>
        <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
          <Car className="h-3.5 w-3.5" /> {offender.vehicleType}
          <span>·</span>
          <span className="font-bold text-danger">{offender.violationCount} violations</span>
        </div>
      </div>

      <div className="mt-3 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <MapPin className="h-3.5 w-3.5 text-teal" />
          {offender.lastLocation}
        </div>
        <div className="font-mono text-slate-500">
          {offender.lastCamera} · {offender.lastSeen}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {offender.topViolations.map((v) => (
          <span key={v} className="rounded-md bg-white/5 px-2 py-1 text-[11px] font-semibold text-slate-300">
            {VIOLATION_LABELS[v] ?? v}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">Risk score</span>
        <span className="font-mono text-sm font-bold text-danger">{(offender.riskScore * 100).toFixed(0)}</span>
      </div>
    </motion.div>
  );
}
