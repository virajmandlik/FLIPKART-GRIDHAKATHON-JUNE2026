// VlmRecheckPanel.tsx
import { useState } from "react";
import { m } from "framer-motion";
import { Bot, CheckCircle2, Loader2, MessageSquareQuote } from "lucide-react";
import { useScenario } from "../../context/ScenarioContext";
import { Pill } from "../ui";

interface Props {
  confidence: number;
  onRouted?: () => void;
}

const RATIONALE: Record<string, string> = {
  "low-light-rain":
    "Qwen3-VL: Rider head region partially occluded by rain streaks and headlamp bloom. Helmet strap not visible but cranial silhouette suggests no rigid headwear. Recommend human review before challan — enhancement improved contrast but edge confidence remains borderline.",
  "illegal-parking":
    "Qwen3-VL: Vehicle stationary 3m+ in no-park ROI. Shop signage partially blocks rear plate; dwell-time tracker confident but classifier margin is thin. Officer should confirm spillover impact on carriageway.",
  default:
    "Qwen3-VL second opinion: Detection geometry aligns with violation hypothesis but lighting and occlusion reduce pixel-level certainty. Bounding box stable across 4/5 sampled frames. Routing to officer queue per UVH-26 60–85% policy — no auto-fine.",
};

export default function VlmRecheckPanel({ confidence, onRouted }: Props) {
  const { scenario } = useScenario();
  const [phase, setPhase] = useState<"idle" | "thinking" | "done">("idle");

  const rationale = RATIONALE[scenario.id] ?? RATIONALE.default;
  const pct = Math.round(confidence * 100);

  const runRecheck = () => {
    setPhase("thinking");
    setTimeout(() => {
      setPhase("done");
      onRouted?.();
    }, 2200);
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/[0.08] p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Bot className="h-4 w-4 text-violet-300" />
          <div>
            <h4 className="text-sm font-semibold text-white">Qwen3-VL second opinion</h4>
            <p className="text-xs text-slate-500">Borderline confidence · {pct}% · VLM recheck path</p>
          </div>
        </div>
        <Pill tone="amber">Human review queue</Pill>
      </div>

      {phase === "idle" && (
        <button
          type="button"
          onClick={runRecheck}
          className="mt-4 inline-flex items-center gap-2 border-t border-white/[0.06] pt-4 text-xs font-semibold text-violet-300 hover:text-violet-200"
        >
          <MessageSquareQuote className="h-3.5 w-3.5" />
          Run VLM recheck
        </button>
      )}

      {phase === "thinking" && (
        <div className="mt-4 flex items-center gap-2 border-t border-white/[0.06] pt-4 text-sm text-violet-200">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analysing frame crops with Qwen3-VL…
        </div>
      )}

      {phase === "done" && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 space-y-3 border-t border-white/[0.06] pt-4"
        >
          <p className="text-sm leading-relaxed text-slate-300">{rationale}</p>
          <div className="flex items-center gap-2 text-xs font-medium text-saffron">
            <CheckCircle2 className="h-4 w-4" />
            Routed to human review queue · officer sign-off required
          </div>
        </m.div>
      )}
    </m.div>
  );
}