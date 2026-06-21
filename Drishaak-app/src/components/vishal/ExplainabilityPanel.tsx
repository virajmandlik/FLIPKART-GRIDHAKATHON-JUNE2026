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
      className="rounded-2xl glass p-5 ring-1 ring-teal/20"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal/15 ring-1 ring-teal/40">
          <Brain className="h-5 w-5 text-teal" />
        </span>
        <div>
          <h4 className="font-bold text-white">Vishal · Explainability</h4>
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

      <ul className="mt-4 space-y-2">
        {explanation.map((step, i) => (
          <motion.li
            key={step}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-start gap-3 rounded-lg bg-white/[0.02] px-3 py-2"
          >
            <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
            <span className="text-sm text-slate-300">{step}</span>
          </motion.li>
        ))}
      </ul>

      <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
        Target &lt;2% false-challan rate KPI — explainability supports BSA S.63(4) admissibility and DPDP audit trails.
      </p>
    </motion.div>
  );
}
