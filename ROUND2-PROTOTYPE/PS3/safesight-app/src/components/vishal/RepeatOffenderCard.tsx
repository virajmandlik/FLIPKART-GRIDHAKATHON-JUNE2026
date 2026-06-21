// RepeatOffenderCard.tsx
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
      className="rounded-xl border border-white/[0.08] p-5"
    >
      <div className="flex items-start gap-3">
        <AlertOctagon className="h-4 w-4 text-danger" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-white">Repeat offender</h4>
            {offender.flaggedForDeployment && <Pill tone="danger">Deploy flag</Pill>}
          </div>
          <p className="mt-1 text-xs text-slate-500">Corridor hotlist · auto-flagged</p>
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between border-t border-white/[0.06] pt-4">
        <div>
          <div className="font-mono text-xl font-semibold tracking-wide text-white">{offender.plate}</div>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
            <Car className="h-3.5 w-3.5" /> {offender.vehicleType}
          </div>
        </div>
        <span className="text-sm font-semibold text-danger">{offender.violationCount} violations</span>
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-teal" />
          {offender.lastLocation}
        </div>
        <div className="font-mono text-slate-500">
          {offender.lastCamera} · {offender.lastSeen}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-3">
        {offender.topViolations.map((v) => (
          <span key={v} className="text-[11px] text-slate-400">
            {VIOLATION_LABELS[v] ?? v}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">Risk score</span>
        <span className="font-mono text-sm font-semibold text-danger">{(offender.riskScore * 100).toFixed(0)}</span>
      </div>
    </motion.div>
  );
}