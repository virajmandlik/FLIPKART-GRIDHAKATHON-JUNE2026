import { CheckCircle2, RefreshCw, UserCheck } from "lucide-react";
import { routeFromConfidence, type ReviewRoute } from "../../data/reviewQueues";
import { Pill } from "../ui";

interface Props {
  confidence: number;
  activeRoute?: ReviewRoute;
}

const ROUTES = [
  {
    id: "auto_verify" as const,
    label: "Auto-verify",
    threshold: "≥85%",
    icon: CheckCircle2,
    accent: "border-ok/30 bg-ok/5",
    activeAccent: "border-ok/40 bg-ok/10",
    iconColor: "text-ok",
    desc: "BSA certificate queued · optional officer review",
  },
  {
    id: "human_review" as const,
    label: "Human review",
    threshold: "60–85%",
    icon: UserCheck,
    accent: "border-white/[0.06] bg-ink-900/30",
    activeAccent: "border-saffron/30 bg-saffron/5",
    iconColor: "text-saffron",
    desc: "BTP officer queue · approve / reject / recheck",
  },
  {
    id: "reprocess" as const,
    label: "Reprocess",
    threshold: "<60%",
    icon: RefreshCw,
    accent: "border-white/[0.06] bg-ink-900/30",
    activeAccent: "border-teal/30 bg-teal/5",
    iconColor: "text-teal",
    desc: "Return to L2 enhancement · VLM path",
  },
];

export default function ConfidenceRouter({ confidence, activeRoute }: Props) {
  const route = activeRoute ?? routeFromConfidence(confidence);
  const pct = Math.round(confidence * 100);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="gov-label">Confidence router · UVH-26</div>
          <div className="mt-1 font-mono text-3xl font-bold text-white">{pct}<span className="text-lg text-slate-500">%</span></div>
        </div>
        <Pill tone={route === "auto_verify" ? "ok" : route === "human_review" ? "amber" : "cyan"}>
          → {ROUTES.find((r) => r.id === route)?.label}
        </Pill>
      </div>

      <div className="relative h-2 overflow-hidden rounded-full bg-ink-900 ring-1 ring-white/[0.06]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-saffron/80 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
        <div className="absolute inset-y-0 w-px bg-white/20" style={{ left: "60%" }} />
        <div className="absolute inset-y-0 w-px bg-white/20" style={{ left: "85%" }} />
      </div>
      <div className="flex justify-between font-mono text-[10px] text-slate-500">
        <span>0</span>
        <span>60</span>
        <span>85</span>
        <span>100</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {ROUTES.map((r) => {
          const Icon = r.icon;
          const isActive = route === r.id;
          return (
            <div
              key={r.id}
              className={`rounded-md border p-3 transition ${isActive ? r.activeAccent : r.accent}`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${isActive ? r.iconColor : "text-slate-500"}`} />
                <div>
                  <div className={`text-sm font-semibold ${isActive ? "text-white" : "text-slate-400"}`}>
                    {r.label}
                  </div>
                  <div className="font-mono text-[10px] text-slate-500">{r.threshold}</div>
                </div>
              </div>
              <p className="mt-2 text-[11px] leading-snug text-slate-500">{r.desc}</p>
              {isActive && (
                <div className={`mt-2 h-0.5 w-full rounded-full ${r.id === "auto_verify" ? "bg-ok" : r.id === "human_review" ? "bg-saffron" : "bg-teal"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
