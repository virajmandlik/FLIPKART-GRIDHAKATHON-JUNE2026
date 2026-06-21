// Layer3ValidationPanel.tsx
import { motion } from "framer-motion";
import { AlertTriangle, Bot, CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import { useScenario } from "../../context/ScenarioContext";
import { LAYER3_OUTPUT } from "../../data/layerOutputs";
import { Pill } from "../ui";
import ExplainabilityPanel from "../vishal/ExplainabilityPanel";
import ScenarioFrame from "../shared/ScenarioFrame";

const VIOLATION_LABELS: Record<string, string> = {
  helmet_violation: "No helmet",
  triple_riding: "Triple riding",
  seatbelt_violation: "No seatbelt",
  wrong_side_violation: "Wrong-side driving",
  red_light_violation: "Red-light violation",
  stop_line_violation: "Stop-line violation",
  illegal_parking_violation: "Illegal parking",
};

export default function Layer3ValidationPanel() {
  const { scenario } = useScenario();
  const data = LAYER3_OUTPUT;

  const isPagdi = scenario.id === "pagdi-fair";
  const isLowLight = scenario.lowLight || scenario.id === "low-light-rain";
  const violations = isPagdi ? [] : data.violations;
  const explanation = isPagdi
    ? [
        "Headwear classified as Pagdi — culturally fair 3-class model.",
        "MV Act §129 exemption applies to turban-wearing riders.",
        "No helmet violation flagged. Case auto-cleared.",
        "False-positive prevention KPI preserved — no wrongful challan.",
        "Evidence logged for audit trail under DPDP 2023.",
      ]
    : data.agentic_validation.explanation;

  const summary = isPagdi
    ? "Pagdi detected on rider. MV Act §129 exemption — case auto-cleared. No challan generated."
    : data.agentic_validation.summary;

  const overallConfidence = isPagdi ? scenario.violationConfidence : data.overall_confidence;
  const falsePositiveRisk = isPagdi ? "LOW" as const : data.agentic_validation.false_positive_risk;
  const reviewStatus = isPagdi ? "AUTO_CLEARED" : data.review_status;
  const plate = isPagdi ? scenario.plate.replace(/\s/g, "") : data.license_plate.plate_number;

  return (
    <div className="space-y-5">
      {isLowLight && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-white/[0.08] p-4">
          <Pill tone="cyan">L2 enhancement path used</Pill>
          <p className="mt-2 text-sm text-slate-300">
            Low-light frame enhanced via Restormer + Real-ESRGAN before detection. SAHI tiling maintained recall at {(scenario.violationConfidence * 100).toFixed(0)}% confidence.
          </p>
        </motion.div>
      )}

      {isPagdi && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl border border-ok/30 p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-ok" />
            <span className="font-semibold text-ok">AUTO-CLEARED · Pagdi exempt</span>
          </div>
          <p className="mt-2 text-sm text-slate-300">
            MV Act §129 — turban-wearing riders correctly exempted. Helmet / Pagdi / None classifier prevents culturally unfair challans.
          </p>
        </motion.div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`relative overflow-hidden rounded-xl ring-1 ${isPagdi ? "ring-ok/30" : "ring-danger/30"}`}
        >
          <ScenarioFrame scenario={scenario} className="aspect-video w-full" />
          {violations.map((v, i) => (
            <motion.div
              key={v.violation_id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.2 }}
              className="absolute left-3 flex items-center gap-2 rounded-lg bg-danger/90 px-3 py-1.5 text-xs font-bold text-white"
              style={{ top: `${12 + i * 36}px` }}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              {VIOLATION_LABELS[v.type] ?? v.type}
              <span className="opacity-80">{(v.confidence * 100).toFixed(0)}%</span>
            </motion.div>
          ))}
          {isPagdi && (
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-lg bg-ok/90 px-3 py-1.5 text-xs font-bold text-white">
              <ShieldCheck className="h-3.5 w-3.5" /> PAGDI DETECTED · CLEARED
            </div>
          )}
          <div className="absolute bottom-3 right-3">
            <Pill tone={isPagdi ? "ok" : "danger"}>{isPagdi ? "0 violations" : `${violations.length} violations`}</Pill>
          </div>
        </motion.div>

        <div className="space-y-4">
          <div className="rounded-xl border border-white/[0.08] p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Vehicle & plate</div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-lg font-semibold capitalize text-white">{data.vehicle.type}</span>
              {!isPagdi && <Pill tone="cyan">{(data.vehicle.confidence * 100).toFixed(0)}% conf</Pill>}
            </div>
            <div className="mt-4 border-t border-white/[0.06] pt-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-saffron">ANPR · PaddleOCR</div>
              <div className="mt-1 font-mono text-2xl font-semibold tracking-widest text-white">{plate}</div>
              <div className="mt-1 text-xs text-slate-400">BLR_CAM_023 · Silk Board → Marathahalli</div>
            </div>
            {!isPagdi && (
              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-4">
                <MiniStat label="Riders" value={String(data.detected_persons.rider_count)} warn={data.detected_persons.rider_count > 2} />
                <MiniStat label="Helmet" value={data.model_outputs.helmet_detection.helmet_present ? "Present" : "Absent"} warn={!data.model_outputs.helmet_detection.helmet_present} />
              </div>
            )}
            {isPagdi && (
              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-4">
                <MiniStat label="Headwear" value="Pagdi" />
                <MiniStat label="Helmet rule" value="Exempt" />
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/[0.08] p-5">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-teal" />
              <span className="text-sm font-semibold text-white">Agentic validation</span>
              {(data.agentic_validation.validated || isPagdi) && <CheckCircle2 className="ml-auto h-5 w-5 text-ok" />}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {!isPagdi && <Pill tone="ok">Consistency {(data.agentic_validation.consistency_score * 100).toFixed(0)}%</Pill>}
              <Pill tone={isPagdi ? "ok" : "cyan"}>FP risk: {falsePositiveRisk}</Pill>
              <Pill tone={isPagdi ? "ok" : "amber"}>{reviewStatus.replace(/_/g, " ")}</Pill>
            </div>
          </div>
        </div>
      </div>

      <ExplainabilityPanel explanation={explanation} falsePositiveRisk={falsePositiveRisk} overallConfidence={overallConfidence} />

      {!isPagdi && (
        <div className="border-t border-white/[0.08] pt-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-danger">
            <ShieldAlert className="h-4 w-4" /> UVH-26 rule engine
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
            {Object.entries(data.rule_engine_results)
              .filter(([, v]) => v)
              .map(([k]) => (
                <span key={k} className="text-[11px] font-medium text-danger">{VIOLATION_LABELS[k] ?? k.replace(/_/g, " ")}</span>
              ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Pagdi exemption path active — culturally fair Helmet/Pagdi/None classifier prevents wrongful challans (MV Act §129).
          </p>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase text-slate-500">{label}</div>
      <div className={`text-sm font-semibold ${warn ? "text-danger" : "text-white"}`}>{value}</div>
    </div>
  );
}