// ExplainabilityPanel.tsx
import { motion } from "framer-motion";
import { Brain, Gauge, ListChecks } from "lucide-react";
import { Pill } from "../ui";

interface Props {
  explanation: string[];
  falsePositiveRisk: "LOW" | "MEDIUM" | "HIGH";
  overallConfidence: number;
}

const RISK_TONE: Record<string, "ok" | "amber" | "danger"> = {
  LOW: "ok",
  MEDIUM: "amber",
  HIGH: "danger",
};

export default function ExplainabilityPanel({ explanation, falsePositiveRisk, overallConfidence }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/[0.08] p-5"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Brain className="h-4 w-4 text-teal" />
        <div>
          <h4 className="text-sm font-semibold text-white">Explainability</h4>
          <p className="text-xs text-slate-500">Agentic chain-of-thought for officer review</p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Pill tone="cyan">
            <Gauge className="mr-1 inline h-3 w-3" />
            {(overallConfidence * 100).toFixed(0)}% overall
          </Pill>
          <Pill tone={RISK_TONE[falsePositiveRisk]}>
            False-challan risk: {falsePositiveRisk}
          </Pill>
        </div>
      </div>

      <ul className="mt-4 space-y-2 border-t border-white/[0.06] pt-4">
        {explanation.map((step, i) => (
          <motion.li
            key={step}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-start gap-3 text-sm text-slate-300"
          >
            <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <span>{step}</span>
          </motion.li>
        ))}
      </ul>

      <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
        Target &lt;2% false-challan rate KPI — explainability supports BSA S.63(4) admissibility and DPDP audit trails.
      </p>
    </motion.div>
  );
}