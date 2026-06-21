import type { Scenario, Box, Region, ViolationType } from "../data/scenarios";

export type RoiIcon = "plate" | "helmet" | "rider" | "driver" | "seatbelt" | "vehicle";
export type Tone = "gold" | "green" | "red" | "muted";

export interface DerivedRoi {
  key: string;
  label: string;
  sub: string;
  icon: RoiIcon;
  region: Region;
  tone: Tone;
}

const boxRegion = (b: Box): Region => ({ x: b.x, y: b.y, w: b.w, h: b.h });
const topPart = (b: Box): Region => ({ x: b.x, y: b.y, w: b.w, h: Math.max(16, b.h * 0.55) });
/** Head/helmet sits at the top-centre of the rider box. */
const headPart = (b: Box): Region => ({
  x: b.x + b.w * 0.18,
  y: Math.max(0, b.y + b.h * 0.02),
  w: b.w * 0.64,
  h: Math.max(16, b.h * 0.34),
});
const driverPart = (b: Box): Region => ({ x: b.x + b.w * 0.06, y: b.y + b.h * 0.06, w: b.w * 0.55, h: b.h * 0.52 });
const torsoPart = (b: Box): Region => ({ x: b.x + b.w * 0.12, y: b.y + b.h * 0.16, w: b.w * 0.5, h: b.h * 0.46 });

export const HUMAN_VIOLATION: Record<ViolationType, string> = {
  NO_HELMET: "Helmet violation",
  NO_SEATBELT: "Seatbelt violation",
  TRIPLE_RIDING: "Triple riding",
  WRONG_SIDE: "Wrong-side driving",
  STOP_LINE: "Stop-line crossing",
  RED_LIGHT: "Red-light violation",
  ILLEGAL_PARKING: "Illegal parking",
  PAGDI_FAIR: "Cleared — culturally fair",
};

export function violatorBox(s: Scenario): Box {
  return s.boxes.find((b) => b.kind === "violator") ?? s.boxes[0];
}

export function vehicleType(s: Scenario): string {
  const v = violatorBox(s);
  return v.label.split("(")[0].split("×")[0].trim();
}

export function isTwoWheeler(s: Scenario): boolean {
  return Boolean(s.headBox) || /moto|motor|scoot|bike|rider/i.test(vehicleType(s));
}

/** Build accurate ROI crops from each scenario's own region data. */
export function getRois(s: Scenario): DerivedRoi[] {
  const v = violatorBox(s);
  const rois: DerivedRoi[] = [];
  const twoWheeler = isTwoWheeler(s);

  if (s.violatorPlate) {
    rois.push({
      key: "plate",
      label: "Number plate",
      sub: s.plate,
      icon: "plate",
      region: s.violatorPlate,
      tone: "gold",
    });
  }

  if (s.headBox) {
    const hw = s.headwear;
    rois.push({
      key: "helmet",
      label: hw === "Pagdi" ? "Headwear" : "Helmet",
      sub: hw === "None" ? "Not present" : hw === "Pagdi" ? "Pagdi · exempt" : "Helmet on",
      icon: "helmet",
      region: headPart(v),
      tone: hw === "None" ? "red" : "green",
    });
  }

  if (twoWheeler) {
    rois.push({
      key: "rider",
      label: "Rider",
      sub: s.violationType === "TRIPLE_RIDING" ? "3 riders" : "Rider",
      icon: "rider",
      region: topPart(v),
      tone: s.violationType === "TRIPLE_RIDING" ? "red" : "muted",
    });
  } else {
    rois.push({
      key: "driver",
      label: "Driver",
      sub: "Driver seat",
      icon: "driver",
      region: driverPart(v),
      tone: "muted",
    });
    rois.push({
      key: "seatbelt",
      label: "Seatbelt",
      sub: s.violationType === "NO_SEATBELT" ? "Not worn" : "Torso ROI",
      icon: "seatbelt",
      region: torsoPart(v),
      tone: s.violationType === "NO_SEATBELT" ? "red" : "muted",
    });
  }

  rois.push({
    key: "vehicle",
    label: "Vehicle",
    sub: vehicleType(s),
    icon: "vehicle",
    region: boxRegion(v),
    tone: "muted",
  });

  return rois;
}

export interface ContextFlag {
  label: string;
  value: boolean;
}

export function getContextFlags(s: Scenario): ContextFlag[] {
  return [
    { label: "Wrong side", value: s.violationType === "WRONG_SIDE" },
    { label: "Red light", value: s.violationType === "RED_LIGHT" },
    { label: "Illegal parking", value: s.violationType === "ILLEGAL_PARKING" },
    { label: "Stop line", value: s.violationType === "STOP_LINE" },
  ];
}

export interface RoiSignal {
  label: string;
  value: string;
  conf?: number;
  alert?: boolean;
}

export function getRoiAnalysis(s: Scenario): RoiSignal[] {
  const twoWheeler = isTwoWheeler(s);
  const hw = s.headwear;
  return [
    { label: "Plate OCR", value: s.plate, conf: 0.98 },
    {
      label: "Helmet",
      value: hw === "None" ? "Not present" : hw === "Pagdi" ? "Pagdi · exempt" : hw === "Helmet" ? "Present" : "N/A · 4-wheeler",
      conf: hw ? s.violationConfidence : undefined,
      alert: hw === "None",
    },
    {
      label: "Seatbelt",
      value: s.violationType === "NO_SEATBELT" ? "Not worn" : twoWheeler ? "N/A · 2-wheeler" : "Worn",
      conf: s.violationType === "NO_SEATBELT" ? s.violationConfidence : undefined,
      alert: s.violationType === "NO_SEATBELT",
    },
    {
      label: "Rider count",
      value: s.violationType === "TRIPLE_RIDING" ? "3 riders" : twoWheeler ? "1–2 riders" : "—",
      conf: twoWheeler ? 0.93 : undefined,
      alert: s.violationType === "TRIPLE_RIDING",
    },
    { label: "Vehicle", value: vehicleType(s), conf: violatorBox(s).confidence ?? 0.95 },
  ];
}

export interface Verdict {
  cleared: boolean;
  title: string;
  detail: string;
  confidence: number;
  fpRisk: "LOW" | "MEDIUM" | "HIGH";
  severity: "HIGH" | "MEDIUM" | "LOW";
  violations: { label: string; conf: number }[];
}

export function getVerdict(s: Scenario): Verdict {
  const conf = s.violationConfidence;
  const fpRisk = conf >= 0.85 ? "LOW" : "MEDIUM";
  if (!s.isViolation) {
    return {
      cleared: true,
      title: "No violation",
      detail: s.violationBadge,
      confidence: conf,
      fpRisk: "LOW",
      severity: "LOW",
      violations: [],
    };
  }
  const violations: { label: string; conf: number }[] = [
    { label: HUMAN_VIOLATION[s.violationType], conf },
  ];
  if (s.violationType === "TRIPLE_RIDING" && s.headwear === "None") {
    violations.push({ label: "Helmet violation", conf: Math.min(0.97, conf + 0.06) });
  }
  return {
    cleared: false,
    title: HUMAN_VIOLATION[s.violationType],
    detail: s.subtitle,
    confidence: conf,
    fpRisk,
    severity: conf >= 0.85 ? "HIGH" : "MEDIUM",
    violations,
  };
}

export function getReasoning(s: Scenario): string[] {
  const vt = vehicleType(s).toLowerCase();
  const base = [`Vehicle classified as ${vt}.`, `Registration read as ${s.plate} via OCR.`];
  const byType: Record<ViolationType, string[]> = {
    NO_HELMET: ["Head region analysed — no helmet detected.", "Rider is bare-headed, not wearing a turban (Pagdi)."],
    NO_SEATBELT: ["Driver torso ROI analysed — seatbelt strap absent across the shoulder.", "Front-seat occupancy confirmed."],
    TRIPLE_RIDING: ["Three riders detected on a single motorcycle.", "Legal limit for a two-wheeler is two riders."],
    WRONG_SIDE: ["Vehicle motion vector opposes the lane direction.", "Track displacement checked against the ASTraM lane map."],
    STOP_LINE: ["Vehicle centroid crossed the painted stop line.", "Signal phase and stop-line geometry verified."],
    RED_LIGHT: ["Signal phase was RED when the vehicle entered the junction.", "Stop-line crossing timing matched the red phase."],
    ILLEGAL_PARKING: ["Vehicle dwelled inside a no-parking zone beyond the allowed time.", "Carriageway obstruction confirmed by dwell-time tracker."],
    PAGDI_FAIR: ["Headwear classified as a turban (Pagdi).", "MV Act §129 exemption applies — case auto-cleared, no challan."],
  };
  return [...base, ...byType[s.violationType]];
}

export function summaryFor(s: Scenario): string {
  if (!s.isViolation) {
    return `${vehicleType(s)} ${s.plate} reviewed at ${s.location.split(",")[0]}. Headwear correctly identified as a turban — the system exempts it under MV Act §129 and issues no challan.`;
  }
  return `${vehicleType(s)} ${s.plate} observed at ${s.location.split(",")[0]}. ${HUMAN_VIOLATION[s.violationType]} confirmed after rule checks and agentic cross-validation.`;
}

export function pct(n?: number | null): string {
  return n == null ? "—" : `${Math.round(n * 100)}%`;
}
