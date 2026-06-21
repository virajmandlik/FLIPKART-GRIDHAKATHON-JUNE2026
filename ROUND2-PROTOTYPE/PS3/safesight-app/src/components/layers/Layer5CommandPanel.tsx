// PdfEvidenceMock.tsx
import { useMemo, useState } from "react";
import { m } from "framer-motion";
import { Download, FileText, Shield } from "lucide-react";
import { LAYER3_OUTPUT } from "../../data/layerOutputs";
import { AUTO_VERIFIED_EVENT } from "../../data/reviewQueues";

interface Props { compact?: boolean }

export default function PdfEvidenceMock({ compact }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const data = LAYER3_OUTPUT;
  const evidence = AUTO_VERIFIED_EVENT;

  const previewLines = useMemo(
    () => [
      "BENGALURU TRAFFIC POLICE — EVIDENCE CERTIFICATE",
      "Bharatiya Sakshya Adhiniyam 2023 · Section 63(4)",
      "────────────────────────────────────────",
      `Event ID: ${data.event_id}`,
      `Camera: ${data.camera_id} · ${data.junction_id}`,
      `Location: Silk Board → Marathahalli, Bengaluru Urban`,
      `Timestamp: ${data.timestamp}`,
      `Registration (KA): ${data.license_plate.plate_number}`,
      `Overall confidence: ${(data.overall_confidence * 100).toFixed(0)}%`,
      "",
      "Violations detected:",
      ...data.violations.map((v) => `  • ${v.type.replace(/_/g, " ")} (${(v.confidence * 100).toFixed(0)}%)`),
      "",
      "DPDP compliance:",
      `  • Faces blurred: ${evidence.facesBlurred}`,
      `  • Plates masked (non-violator): ${evidence.platesBlurred}`,
      "",
      `SHA-256: ${evidence.frameSha256.slice(0, 32)}...`,
      "",
      data.agentic_validation.summary,
      "",
      "Officer sign-off: _________________________  (BTP)",
      "SafeSight EN · UVH-26 · No auto-fines",
    ],
    [data, evidence]
  );

  const generatePdf = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 15;
    let y = margin;

    doc.setFillColor(255, 153, 51);
    doc.rect(0, 0, 210, 24, "F");
    doc.setTextColor(10, 11, 15);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("BENGALURU TRAFFIC POLICE", margin, 10);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Evidence Certificate · BSA 2023 S.63(4) · KA jurisdiction", margin, 17);

    y = 34;
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("EVIDENCE METADATA", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");

    const fields: [string, string][] = [
      ["Event ID", data.event_id],
      ["Camera", `${data.camera_id} · ${data.junction_id}`],
      ["Location", "Silk Board → Marathahalli, Bengaluru"],
      ["Timestamp (UTC)", data.timestamp],
      ["Registration (KA)", data.license_plate.plate_number],
      ["OCR Engine", data.license_plate.ocr_engine],
      ["Overall Confidence", `${(data.overall_confidence * 100).toFixed(0)}%`],
      ["Review Status", data.review_status.replace(/_/g, " ")],
    ];

    fields.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, margin + 45, y);
      y += 5;
    });

    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("VIOLATIONS", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    data.violations.forEach((v) => {
      doc.text(`• ${v.type.replace(/_/g, " ")} — ${(v.confidence * 100).toFixed(0)}%`, margin + 2, y);
      y += 5;
    });

    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("SHA-256 INTEGRITY SEAL", margin, y);
    y += 5;
    doc.setFont("courier", "normal");
    doc.setFontSize(7);
    doc.text(evidence.frameSha256, margin, y, { maxWidth: 180 });
    y += 14;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Officer sign-off required · Parivahan e-Challan on approval", margin, y);

    doc.save(`BTP-Evidence-${data.license_plate.plate_number}-${data.event_id}.pdf`);
  };

  return (
    <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-white/[0.08] overflow-hidden">
      <div className="border-b border-white/[0.06] px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-saffron" />
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Court exhibit</div>
              <h4 className="text-sm font-semibold text-white">BTP Evidence Certificate</h4>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!compact && (
              <button type="button" onClick={() => setPreviewOpen((o) => !o)} className="rounded border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white">
                {previewOpen ? "Hide" : "Preview"}
              </button>
            )}
            <button type="button" onClick={generatePdf} className="inline-flex items-center gap-1.5 rounded bg-saffron px-3 py-1.5 text-xs font-semibold text-ink-950 hover:brightness-105">
              <Download className="h-3.5 w-3.5" /> Download PDF
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-dashed border-white/[0.08] px-4 py-3">
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="font-semibold text-saffron">BSA S.63(4)</span>
          <span className="text-slate-500">DPDP blur confirmed</span>
          <span className="font-mono text-saffron">{data.license_plate.plate_number}</span>
          <span className="stamp-verified ml-auto">Court ready</span>
        </div>
      </div>

      {previewOpen && (
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4">
          <div className="rounded border border-white/[0.08] bg-ink-950 p-4">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <Shield className="h-3 w-3" /> Document preview
            </div>
            <pre className="max-h-56 overflow-auto font-mono text-[10px] leading-relaxed text-slate-400">{previewLines.join("\n")}</pre>
          </div>
        </m.div>
      )}
    </m.div>
  );
}