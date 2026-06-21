import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { MapPin } from "lucide-react";
import {
  DEPLOYMENT_RECOMMENDATIONS,
  JUNCTION_MAP_FOCUS,
  type DeploymentRecommendation,
} from "../../data/enforcementRecommendations";
import { EDGE_NODES } from "../../data/bengaluruDeployment";
import BengaluruMapSvg, { violationHeat } from "../shared/BengaluruMapSvg";
import { Pill } from "../ui";
import PoliceDeploymentWidget from "../vishal/PoliceDeploymentWidget";

const PEAK_HOURS = [
  { hour: "06", violations: 42 },
  { hour: "08", violations: 128 },
  { hour: "09", violations: 186 },
  { hour: "10", violations: 164 },
  { hour: "11", violations: 142 },
  { hour: "17", violations: 198 },
  { hour: "18", violations: 224 },
  { hour: "19", violations: 176 },
  { hour: "20", violations: 98 },
];

const HEAT_NODES = EDGE_NODES.filter((n) =>
  ["silk-board", "marathahalli", "hebbal", "kr-puram", "electronic-city"].includes(n.id)
).map((n) => ({ ...n, heat: violationHeat(n.violations24h) }));

const tooltipStyle = {
  background: "#0E1016",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  color: "#fff",
  fontSize: 11,
};

interface Props {
  onJunctionFocus?: (nodeId: string, zoomIdx: number) => void;
}

export default function Layer5CommandPanel({ onJunctionFocus }: Props) {
  const handleDeploymentClick = (rec: DeploymentRecommendation) => {
    const focus = JUNCTION_MAP_FOCUS[rec.id];
    if (focus && onJunctionFocus) {
      onJunctionFocus(focus.nodeId, focus.zoomIdx);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Challans issued (7d)" value="847" sub="Parivahan · officer signed" />
        <KpiCard label="False-challan rate" value="<2%" sub="Down from 4% baseline" highlight />
        <KpiCard label="Auto-cleared (Pagdi etc.)" value="58" sub="Cultural fairness path" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="gov-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="gov-label">Violation heatmap</div>
              <h4 className="font-semibold text-white">Bengaluru junction intensity</h4>
            </div>
            <Pill tone="danger">Silk Board peak</Pill>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-white/[0.06] bg-ink-950">
            <BengaluruMapSvg nodes={HEAT_NODES} heatmapMode showConnections={false} />
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded border border-white/[0.08] bg-ink-950/90 px-2 py-1 text-[10px] text-slate-400">
              <MapPin className="h-3 w-3 text-saffron" />
              BLR_CAM_023 · Marathahalli → Silk Board corridor
            </div>
            <div className="absolute right-2 top-2 rounded border border-white/[0.08] bg-ink-950/90 px-2 py-1 text-[10px]">
              <span className="text-slate-500">ASTraM</span>
              <span className="ml-1 font-semibold text-teal">sync</span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Node size ∝ 24h violations · Hebbal, KR Puram, Electronic City on pilot mesh.
          </p>
        </div>

        <div className="gov-card p-4">
          <div className="gov-label">Peak hours · IST</div>
          <h4 className="mb-3 font-semibold text-white">Silk Board & Marathahalli windows</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={PEAK_HOURS} margin={{ left: -16, right: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" tick={{ fill: "#64748b", fontSize: 10 }} tickFormatter={(h) => `${h}:00`} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(h) => `${h}:00 IST`} />
              <Line type="monotone" dataKey="violations" stroke="#FF9933" strokeWidth={2} dot={{ fill: "#FF9933", r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-slate-500">
            Deploy 09:00–12:00 & 17:00–20:00 · BTP recommendation to ASTraM.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <PoliceDeploymentWidget onJunctionFocus={onJunctionFocus} />
        <div className="gov-card p-4">
          <div className="gov-label">Deployment queue</div>
          <h4 className="font-semibold text-white">AI-suggested enforcement windows</h4>
          <p className="mt-0.5 text-xs text-slate-500">Click row to zoom city map</p>
          <div className="mt-3 space-y-1.5">
            {DEPLOYMENT_RECOMMENDATIONS.map((rec) => (
              <button
                key={rec.id}
                type="button"
                onClick={() => handleDeploymentClick(rec)}
                className="flex w-full items-center justify-between rounded-md border border-white/[0.06] bg-ink-900/30 px-3 py-2.5 text-left transition hover:border-teal/25 hover:bg-ink-900/50"
              >
                <div>
                  <div className="text-sm font-medium text-white">{rec.junction}</div>
                  <div className="text-[10px] text-slate-500">{rec.suggestedWindow}</div>
                </div>
                <Pill tone={rec.priority === "HIGH" ? "danger" : "amber"}>{rec.priority}</Pill>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-md border border-white/[0.06] bg-ink-900/40 px-4 py-3 text-center text-[11px] text-slate-500">
        Target &lt;2% false-challan · UVH-26 · DPDP reporting · No auto-fines — BTP officer approval required
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div className={`gov-card p-4 ${highlight ? "border-ok/25" : ""}`}>
      <div className={`text-2xl font-bold ${highlight ? "text-ok" : "text-white"}`}>{value}</div>
      <div className="mt-0.5 text-xs text-slate-400">{label}</div>
      <div className="mt-1 text-[10px] text-slate-500">{sub}</div>
    </div>
  );
}
