import { jsPDF } from "jspdf";
import type { Scenario } from "../data/scenarios";
import { getVerdict, violatorBox, getReasoning, summaryFor } from "./scenarioDerive";

const GOLD = "#f5b84a";
const GREEN = "#34d399";
const RED = "#ef4444";
const INK = "#0d0d10";
const MUTED = "#9ca3af";

/** Load an image and return a canvas with the annotated violation box drawn on it. */
async function buildAnnotatedFrame(scenario: Scenario): Promise<string> {
  const verdict = getVerdict(scenario);
  const box = violatorBox(scenario);

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = scenario.image;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load evidence frame"));
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || 1280;
  canvas.height = img.naturalHeight || 720;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // violation bounding box (percent-based -> pixels)
  const x = (box.x / 100) * canvas.width;
  const y = (box.y / 100) * canvas.height;
  const w = (box.w / 100) * canvas.width;
  const h = (box.h / 100) * canvas.height;
  const color = verdict.cleared ? GREEN : RED;

  ctx.lineWidth = Math.max(3, canvas.width * 0.004);
  ctx.strokeStyle = color;
  ctx.strokeRect(x, y, w, h);

  // label chip
  const label = `${verdict.title} · ${Math.round(verdict.confidence * 100)}%`;
  const fontSize = Math.max(16, canvas.width * 0.018);
  ctx.font = `bold ${fontSize}px Arial`;
  const padX = fontSize * 0.5;
  const textW = ctx.measureText(label).width;
  const chipH = fontSize * 1.5;
  const chipY = Math.max(0, y - chipH);
  ctx.fillStyle = color;
  ctx.fillRect(x, chipY, textW + padX * 2, chipH);
  ctx.fillStyle = "#000000";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + padX, chipY + chipH / 2);

  return canvas.toDataURL("image/jpeg", 0.9);
}

export async function downloadEvidencePdf(scenario: Scenario): Promise<void> {
  const verdict = getVerdict(scenario);
  const sha = scenario.evidence.frameSha256;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentW = pageW - margin * 2;
  let cursorY = margin;

  // Header band
  doc.setFillColor(INK);
  doc.rect(0, 0, pageW, 70, "F");
  doc.setTextColor(GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Drishaak — Evidence Packet", margin, 38);
  doc.setTextColor("#ffffff");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(scenario.evidence.violationId, margin, 54);

  // Verified / Cleared stamp
  const stamp = verdict.cleared ? "CLEARED" : "VERIFIED";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(verdict.cleared ? GREEN : GOLD);
  doc.text(stamp, pageW - margin, 42, { align: "right" });

  cursorY = 92;

  // Annotated image
  try {
    const dataUrl = await buildAnnotatedFrame(scenario);
    const imgProps = doc.getImageProperties(dataUrl);
    const imgH = (imgProps.height / imgProps.width) * contentW;
    doc.addImage(dataUrl, "JPEG", margin, cursorY, contentW, imgH);
    cursorY += imgH + 8;
    doc.setFontSize(8);
    doc.setTextColor(MUTED);
    doc.text(
      `${scenario.evidence.facesBlurred} faces · ${scenario.evidence.platesBlurred} plates blurred · DPDP-minimised`,
      margin,
      cursorY,
    );
    cursorY += 18;
  } catch {
    cursorY += 4;
  }

  // Detail rows
  const rows: [string, string][] = [
    ["Violation", scenario.violationBadge],
    ["Timestamp", scenario.timestamp],
    ["GPS / Location", scenario.location],
    ["Camera ID", scenario.cameraId],
    ["Number plate", scenario.plate],
    ["Confidence", `${Math.round(verdict.confidence * 100)}%`],
    ["False-positive risk", verdict.fpRisk],
  ];

  doc.setDrawColor("#e5e7eb");
  doc.setFontSize(10);
  rows.forEach(([k, v]) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#111827");
    doc.text(k, margin, cursorY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#374151");
    doc.text(String(v), margin + 150, cursorY);
    cursorY += 18;
  });

  cursorY += 6;

  // SHA-256
  doc.setFont("helvetica", "bold");
  doc.setTextColor("#111827");
  doc.text("SHA-256 (original frame)", margin, cursorY);
  cursorY += 14;
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor("#374151");
  doc.text(doc.splitTextToSize(sha, contentW), margin, cursorY);
  cursorY += 24;

  // Reasoning / summary
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor("#111827");
  doc.text("Validation reasoning", margin, cursorY);
  cursorY += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#374151");
  const reasons = [summaryFor(scenario), ...getReasoning(scenario)];
  reasons.forEach((r) => {
    const lines = doc.splitTextToSize(`• ${r}`, contentW);
    doc.text(lines, margin, cursorY);
    cursorY += lines.length * 12 + 2;
  });

  cursorY += 10;

  // Footer / chain of custody
  doc.setDrawColor("#e5e7eb");
  doc.line(margin, cursorY, pageW - margin, cursorY);
  cursorY += 16;
  doc.setFontSize(8);
  doc.setTextColor(MUTED);
  doc.text("Officer reviewed · Insp. R. Kumar", margin, cursorY);
  doc.text("BSA 2023 S.63(4) · No auto-fines · Human-in-the-loop", margin, cursorY + 12);

  doc.save(`Drishaak-${scenario.evidence.violationId}.pdf`);
}
