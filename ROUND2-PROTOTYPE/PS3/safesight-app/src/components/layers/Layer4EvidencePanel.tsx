// Layer4EvidencePanel.tsx
import { Fingerprint, Lock, ShieldCheck } from "lucide-react";
import { useScenario } from "../../context/ScenarioContext";
import { LAYER3_OUTPUT } from "../../data/layerOutputs";
import { AUTO_VERIFIED_EVENT, routeFromConfidence } from "../../data/reviewQueues";
import ConfidenceRouter from "../shared/ConfidenceRouter";
import { Pill } from "../ui";
import HumanReviewQueue from "../vishal/HumanReviewQueue";
import PdfEvidenceMock from "../vishal/PdfEvidenceMock";
import ReprocessQueuePanel from "../vishal/ReprocessQueuePanel";
import VlmRecheckPanel from "../vishal/VlmRecheckPanel";

const GOLDEN_PATH_SCENARIOS = new Set(["stop-line", "triple-riding", "no-helmet"]);

export default function Layer4EvidencePanel() {
  const { scenario } = useScenario();
  const data = LAYER3_OUTPUT;
  const evidence = AUTO_VERIFIED_EVENT;

  const isPagdiClear = scenario.id === "pagdi-fair";
  const confidence = isPagdiClear
    ? 0.94
    : GOLDEN_PATH_SCENARIOS.has(scenario.id)
      ? data.overall_confidence
      : scenario.violationConfidence;
  const route = isPagdiClear ? ("auto_verify" as const) : routeFromConfidence(confidence);
  const showVlmRecheck =
    !isPagdiClear &&
    route === "human_review" &&
    (confidence >= 0.6 && confidence < 0.85 || scenario.id === "low-light-rain");

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <ComplianceCard icon={Lock} title="DPDP minimisation" detail={`${evidence.facesBlurred} faces blurred · ${evidence.platesBlurred} non-violator plates masked`} />
        <ComplianceCard icon={Fingerprint} title="SHA-256 integrity" detail={evidence.frameSha256} mono />
        <ComplianceCard icon={ShieldCheck} title="BSA 2023 S.63(4)" detail="Electronic record admissibility · certificate path for Karnataka courts" />
      </div>

      {isPagdiClear && (
        <div className="border-t border-white/[0.08] pt-4">
          <Pill tone="ok">AUTO-CLEARED · PAGDI EXEMPT</Pill>
          <p className="mt-2 text-sm text-slate-300">
            Headwear classified as Pagdi — MV Act §129 exemption. No challan. Culturally fair classifier.
          </p>
        </div>
      )}

      <section className="rounded-xl border border-white/[0.08] overflow-hidden">
        <div className="flex border-b border-white/[0.06]">
          <span className="folder-tab folder-tab-active">Confidence routing</span>
          <span className="folder-tab opacity-50">Audit trail</span>
        </div>
        <div className="p-5">
          <ConfidenceRouter confidence={confidence} activeRoute={route} />
        </div>
      </section>

      {showVlmRecheck && <VlmRecheckPanel confidence={confidence} />}

      <PdfEvidenceMock />

      <div className="grid gap-5 lg:grid-cols-2">
        <HumanReviewQueue />
        <ReprocessQueuePanel />
      </div>

      <div className="rounded-xl border border-white/[0.08] p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Sealed event record</div>
        <dl className="mt-3 space-y-2 border-l-2 border-saffron/30 pl-4 font-mono text-xs">
          <Row label="event_id" value={data.event_id} />
          <Row label="camera" value={data.camera_id} />
          <Row label="plate (KA)" value={data.license_plate.plate_number} highlight />
          <Row label="junction" value="Silk Board → Marathahalli" />
          <Row label="review_status" value={isPagdiClear ? "AUTO_CLEARED_PAGDI" : data.review_status} />
        </dl>
      </div>
    </div>
  );
}

function ComplianceCard({ icon: Icon, title, detail, mono }: { icon: typeof Lock; title: string; detail: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-white/[0.08] p-4">
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2">
        <Icon className="h-4 w-4 text-teal" />
        <span className="text-xs font-semibold text-white">{title}</span>
      </div>
      <p className={`mt-2 text-[11px] leading-relaxed text-slate-400 ${mono ? "font-mono break-all text-[10px]" : ""}`}>
        {mono ? `${detail.slice(0, 20)}…${detail.slice(-12)}` : detail}
      </p>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/[0.04] pb-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`text-right ${highlight ? "font-semibold text-saffron" : "text-slate-300"}`}>{value}</dd>
    </div>
  );
}