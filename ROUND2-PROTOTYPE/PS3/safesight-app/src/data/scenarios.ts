/**
 * All PS3 violation scenarios + culturally-fair edge cases.
 * Each scenario has its own CCTV scene layout, detection boxes, and pipeline copy.
 */
import type { OverlayKey } from "./pipeline";

export type ViolationType =
  | "NO_HELMET"
  | "NO_SEATBELT"
  | "TRIPLE_RIDING"
  | "WRONG_SIDE"
  | "STOP_LINE"
  | "RED_LIGHT"
  | "ILLEGAL_PARKING"
  | "PAGDI_FAIR"; // edge case: NOT a violation

export type SceneLayout =
  | "junction_day"
  | "junction_signal"
  | "junction_night"
  | "commercial_parking"
  | "divider_wrongway";

export interface Box {
  key: string;
  label: string;
  track: string;
  x: number; y: number; w: number; h: number;
  kind: "violator" | "ok";
  confidence?: number;
}

export interface Region {
  x: number; y: number; w: number; h: number;
}

export interface Scenario {
  id: string;
  violationType: ViolationType;
  title: string;
  subtitle: string;
  ps3Task: string;
  cameraId: string;
  location: string;
  timestamp: string;
  layout: SceneLayout;
  isViolation: boolean;
  violationBadge: string;
  violationConfidence: number;
  headwear?: "Helmet" | "Pagdi" | "None";
  headwearFair?: boolean;
  plate: string;
  plateValid: boolean;
  plateType: "classic" | "bharat";
  boxes: Box[];
  headBox?: Region;
  violatorPlate?: Region;
  blurFaces: Region[];
  blurPlates: Region[];
  stoplineY?: number;
  redLightOn?: boolean;
  parkingZone?: Region;
  wrongWayArrow?: boolean;
  lowLight?: boolean;
  rain?: boolean;
  /** Real CCTV frame PNG in /public/scenarios/scenario-{id}.png */
  image: string;
  stepOverrides: Partial<Record<string, { front: string; back: string }>>;
  evidence: {
    violationId: string;
    facesBlurred: number;
    platesBlurred: number;
    frameSha256: string;
  };
}

const sha = (seed: string) =>
  Array.from({ length: 64 }, (_, i) =>
    ((seed.charCodeAt(i % seed.length) * 17 + i * 31) % 16).toString(16)
  ).join("");

const img = (id: string) => `/scenarios/scenario-${id}.png`;

export const SCENARIOS: Scenario[] = [
  {
    id: "no-helmet",
    image: img("no-helmet"),
    violationType: "NO_HELMET",
    title: "Helmet non-compliance",
    subtitle: "Rider without ISI helmet — M.G. Road",
    ps3Task: "PS3 §3 — Helmet non-compliance",
    cameraId: "KA-MGRoad-07",
    location: "M.G. Road Jn, Bengaluru",
    timestamp: "08:14:22 IST",
    layout: "junction_day",
    isViolation: true,
    violationBadge: "NO HELMET",
    violationConfidence: 0.91,
    headwear: "None",
    headwearFair: false,
    plate: "KA 01 AB 1234",
    plateValid: true,
    plateType: "classic",
    boxes: [
      { key: "moto", label: "Motorcycle", track: "T-01", x: 47, y: 39, w: 15, h: 43, kind: "violator", confidence: 0.91 },
      { key: "car", label: "Car", track: "T-02", x: 0, y: 42, w: 36, h: 37, kind: "ok" },
    ],
    headBox: { x: 52, y: 39, w: 6, h: 9 },
    violatorPlate: { x: 50, y: 72, w: 8, h: 6 },
    blurFaces: [{ x: 68, y: 52, w: 6, h: 8 }],
    blurPlates: [{ x: 78, y: 84, w: 11, h: 7 }],
    stepOverrides: {
      classify: {
        front: "Rider flagged: no helmet detected. Head region shows bare head — not Pagdi.",
        back: "3-class headwear classifier: Helmet / Pagdi / None. MV Act §129 applies only to None.",
      },
    },
    evidence: {
      violationId: "BLR-KA-MGRoad-07-20260619-000101",
      facesBlurred: 1, platesBlurred: 1,
      frameSha256: sha("no-helmet-mg-road"),
    },
  },
  {
    id: "triple-riding",
    image: img("triple-riding"),
    violationType: "TRIPLE_RIDING",
    title: "Triple riding",
    subtitle: "Three occupants on one motorcycle — Silk Board",
    ps3Task: "PS3 §3 — Triple riding",
    cameraId: "KA-Silk-12",
    location: "Silk Board Jn, Bengaluru",
    timestamp: "17:42:08 IST",
    layout: "junction_day",
    isViolation: true,
    violationBadge: "TRIPLE RIDING",
    violationConfidence: 0.87,
    headwear: "Helmet",
    headwearFair: true,
    plate: "KA 03 CD 5678",
    plateValid: true,
    plateType: "classic",
    boxes: [
      { key: "moto", label: "Motorcycle ×3", track: "T-01", x: 43, y: 51, w: 14, h: 40, kind: "violator", confidence: 0.87 },
      { key: "auto", label: "Car", track: "T-02", x: 0, y: 63, w: 30, h: 37, kind: "ok" },
    ],
    headBox: { x: 49, y: 56, w: 6, h: 8 },
    violatorPlate: { x: 43, y: 81, w: 8, h: 6 },
    blurFaces: [{ x: 46, y: 42, w: 5, h: 7 }, { x: 50, y: 46, w: 5, h: 7 }],
    blurPlates: [{ x: 18, y: 86, w: 10, h: 6 }],
    stepOverrides: {
      classify: {
        front: "Three riders detected on a single 2W. Rider-count geometry exceeds legal limit (2).",
        back: "Person-count on motorcycle bbox + temporal consistency across 5 frames.",
      },
    },
    evidence: {
      violationId: "BLR-KA-Silk-12-20260619-000203",
      facesBlurred: 2, platesBlurred: 1,
      frameSha256: sha("triple-silk-board"),
    },
  },
  {
    id: "no-seatbelt",
    image: img("no-seatbelt"),
    violationType: "NO_SEATBELT",
    title: "Seatbelt non-compliance",
    subtitle: "Driver without seatbelt — KR Puram flyover",
    ps3Task: "PS3 §3 — Seatbelt non-compliance",
    cameraId: "KA-KRPuram-03",
    location: "KR Puram Jn, Bengaluru",
    timestamp: "09:05:33 IST",
    layout: "junction_day",
    isViolation: true,
    violationBadge: "NO SEATBELT",
    violationConfidence: 0.82,
    plate: "22 BH 1234 AA",
    plateValid: true,
    plateType: "bharat",
    boxes: [
      { key: "car", label: "Car", track: "T-01", x: 22, y: 42, w: 33, h: 44, kind: "violator", confidence: 0.82 },
      { key: "bus", label: "Bus", track: "T-02", x: 58, y: 20, w: 42, h: 58, kind: "ok" },
    ],
    violatorPlate: { x: 37, y: 82, w: 10, h: 6 },
    blurFaces: [{ x: 36, y: 50, w: 6, h: 8 }],
    blurPlates: [{ x: 74, y: 82, w: 12, h: 7 }],
    stepOverrides: {
      classify: {
        front: "Driver torso ROI: seatbelt strap not detected across shoulder diagonal.",
        back: "Torso-region classifier on driver window; validated against MV Act Rule 138.",
      },
    },
    evidence: {
      violationId: "BLR-KA-KRPuram-03-20260619-000305",
      facesBlurred: 1, platesBlurred: 1,
      frameSha256: sha("seatbelt-kr-puram"),
    },
  },
  {
    id: "wrong-side",
    image: img("wrong-side"),
    violationType: "WRONG_SIDE",
    title: "Wrong-side driving",
    subtitle: "Vehicle against lane flow — Richmond Circle",
    ps3Task: "PS3 §3 — Wrong-side driving",
    cameraId: "KA-Richmond-05",
    location: "Richmond Circle, Bengaluru",
    timestamp: "11:28:17 IST",
    layout: "divider_wrongway",
    isViolation: true,
    violationBadge: "WRONG-SIDE DRIVING",
    violationConfidence: 0.85,
    plate: "KA 05 MJ 4521",
    plateValid: true,
    plateType: "classic",
    boxes: [
      { key: "car", label: "Car (wrong way)", track: "T-01", x: 35, y: 59, w: 19, h: 26, kind: "violator", confidence: 0.85 },
      { key: "moto", label: "Car", track: "T-02", x: 13, y: 50, w: 18, h: 18, kind: "ok" },
    ],
    violatorPlate: { x: 48, y: 77, w: 9, h: 6 },
    blurFaces: [{ x: 16, y: 52, w: 5, h: 7 }],
    blurPlates: [],
    wrongWayArrow: true,
    stepOverrides: {
      classify: {
        front: "Vehicle motion vector opposes lane direction. Wrong-side entry detected.",
        back: "Optical-flow / track displacement vs lane polyline from ASTraM map layer.",
      },
    },
    evidence: {
      violationId: "BLR-KA-Richmond-05-20260619-000407",
      facesBlurred: 1, platesBlurred: 0,
      frameSha256: sha("wrong-side-richmond"),
    },
  },
  {
    id: "stop-line",
    image: img("stop-line"),
    violationType: "STOP_LINE",
    title: "Stop-line violation",
    subtitle: "Motorcycle past stop line — M.G. Road",
    ps3Task: "PS3 §3 — Stop-line violation",
    cameraId: "KA-MGRoad-07",
    location: "M.G. Road Jn, Bengaluru",
    timestamp: "08:14:22 IST",
    layout: "junction_day",
    isViolation: true,
    violationBadge: "STOP-LINE VIOLATION",
    violationConfidence: 0.89,
    headwear: "Helmet",
    headwearFair: true,
    plate: "KA 05 MJ 4521",
    plateValid: true,
    plateType: "classic",
    boxes: [
      { key: "auto", label: "Auto-rickshaw", track: "T-02", x: 0, y: 66, w: 23, h: 34, kind: "ok" },
      { key: "moto", label: "Motorcycle", track: "T-01", x: 62, y: 74, w: 17, h: 26, kind: "violator", confidence: 0.89 },
      { key: "car", label: "Car", track: "T-03", x: 32, y: 81, w: 29, h: 19, kind: "ok" },
    ],
    headBox: { x: 66, y: 74, w: 7, h: 9 },
    violatorPlate: { x: 69, y: 86, w: 8, h: 6 },
    blurFaces: [{ x: 47, y: 45, w: 6, h: 8 }],
    blurPlates: [{ x: 79, y: 84, w: 11, h: 7 }],
    stoplineY: 70,
    stepOverrides: {
      classify: {
        front: "Stop-line crossing flagged. Helmet correctly detected as PRESENT.",
        back: "Rule + geometry + small classifiers. Helmet / Pagdi / None — culturally fair.",
      },
    },
    evidence: {
      violationId: "BLR-KA-MGRoad-07-20260619-000412",
      facesBlurred: 1, platesBlurred: 2,
      frameSha256: sha("stop-line-mg-road"),
    },
  },
  {
    id: "red-light",
    image: img("red-light"),
    violationType: "RED_LIGHT",
    title: "Red-light violation",
    subtitle: "Car crosses on red — Silk Board signal",
    ps3Task: "PS3 §3 — Red-light violation",
    cameraId: "KA-Silk-12",
    location: "Silk Board Signal, Bengaluru",
    timestamp: "18:55:41 IST",
    layout: "junction_signal",
    isViolation: true,
    violationBadge: "RED-LIGHT VIOLATION",
    violationConfidence: 0.93,
    plate: "KA 51 MH 8899",
    plateValid: true,
    plateType: "classic",
    boxes: [
      { key: "car", label: "Car", track: "T-01", x: 49, y: 42, w: 24, h: 25, kind: "violator", confidence: 0.93 },
      { key: "moto", label: "Motorcycle", track: "T-02", x: 29, y: 78, w: 12, h: 22, kind: "ok" },
    ],
    violatorPlate: { x: 55, y: 57, w: 9, h: 6 },
    blurFaces: [{ x: 10, y: 56, w: 5, h: 7 }],
    blurPlates: [],
    stoplineY: 68,
    redLightOn: true,
    stepOverrides: {
      classify: {
        front: "Signal phase = RED. Vehicle centroid crossed stop-line during red phase.",
        back: "RLVD phase input + stop-line geometry + vehicle track intersection timing.",
      },
    },
    evidence: {
      violationId: "BLR-KA-Silk-12-20260619-000509",
      facesBlurred: 1, platesBlurred: 0,
      frameSha256: sha("red-light-silk"),
    },
  },
  {
    id: "illegal-parking",
    image: img("illegal-parking"),
    violationType: "ILLEGAL_PARKING",
    title: "Illegal parking",
    subtitle: "Car in no-park zone > 3 min — Brigade Road",
    ps3Task: "PS3 §3 — Illegal parking",
    cameraId: "KA-Brigade-09",
    location: "Brigade Road (commercial), Bengaluru",
    timestamp: "14:20:05 IST",
    layout: "commercial_parking",
    isViolation: true,
    violationBadge: "ILLEGAL PARKING",
    violationConfidence: 0.78,
    plate: "KA 02 EF 9012",
    plateValid: true,
    plateType: "classic",
    boxes: [
      { key: "car", label: "Car (dwelling)", track: "T-01", x: 30, y: 35, w: 29, h: 47, kind: "violator", confidence: 0.78 },
      { key: "person", label: "Pedestrian", track: "T-02", x: 14, y: 52, w: 11, h: 33, kind: "ok" },
    ],
    violatorPlate: { x: 43, y: 71, w: 9, h: 6 },
    blurFaces: [{ x: 19, y: 60, w: 5, h: 8 }],
    blurPlates: [],
    parkingZone: { x: 42, y: 48, w: 50, h: 46 },
    stepOverrides: {
      classify: {
        front: "Vehicle stationary in no-parking ROI for 3m 14s. Spillover blocking carriageway.",
        back: "Dwell-time tracker on no-park polygon; ASTraM congestion impact score attached.",
      },
    },
    evidence: {
      violationId: "BLR-KA-Brigade-09-20260619-000611",
      facesBlurred: 1, platesBlurred: 0,
      frameSha256: sha("parking-brigade"),
    },
  },
  {
    id: "pagdi-fair",
    image: img("pagdi-fair"),
    violationType: "PAGDI_FAIR",
    title: "Pagdi — culturally fair (NO challan)",
    subtitle: "Sikh rider with turban correctly exempted",
    ps3Task: "Edge case — MV Act §129 exemption",
    cameraId: "KA-Indiranagar-04",
    location: "100 Ft Road, Indiranagar",
    timestamp: "10:33:50 IST",
    layout: "junction_day",
    isViolation: false,
    violationBadge: "CLEARED — PAGDI DETECTED",
    violationConfidence: 0.94,
    headwear: "Pagdi",
    headwearFair: true,
    plate: "KA 03 GH 2211",
    plateValid: true,
    plateType: "classic",
    boxes: [
      { key: "moto", label: "Motorcycle", track: "T-01", x: 43, y: 42, w: 14, h: 42, kind: "ok", confidence: 0.94 },
    ],
    headBox: { x: 46, y: 42, w: 7, h: 10 },
    violatorPlate: { x: 48, y: 77, w: 8, h: 6 },
    blurFaces: [],
    blurPlates: [],
    stepOverrides: {
      classify: {
        front: "Headwear classified as PAGDI — MV Act §129 exemption applies. Case auto-cleared.",
        back: "Helmet / Pagdi / None classifier prevents wrongful challans. Trust-preserving by design.",
      },
      review: {
        front: "No human review needed. System correctly exempted turban-wearing rider.",
        back: "False-positive prevention is a first-class KPI — not an afterthought.",
      },
    },
    evidence: {
      violationId: "BLR-KA-Indiranagar-04-20260619-000701",
      facesBlurred: 0, platesBlurred: 0,
      frameSha256: sha("pagdi-fair-indiranagar"),
    },
  },
  {
    id: "low-light-rain",
    image: img("low-light-rain"),
    violationType: "NO_HELMET",
    title: "Low-light + rain (preprocessing)",
    subtitle: "CLAHE + denoise before detection — Hebbal",
    ps3Task: "PS3 §1 — Image preprocessing",
    cameraId: "KA-Hebbal-11",
    location: "Hebbal Flyover, Bengaluru",
    timestamp: "06:12:44 IST",
    layout: "junction_night",
    isViolation: true,
    violationBadge: "NO HELMET (low-light)",
    violationConfidence: 0.76,
    headwear: "None",
    plate: "KA 04 JK 7788",
    plateValid: true,
    plateType: "classic",
    boxes: [
      { key: "moto", label: "Motorcycle", track: "T-01", x: 65, y: 68, w: 11, h: 25, kind: "violator", confidence: 0.76 },
    ],
    headBox: { x: 67, y: 67, w: 6, h: 8 },
    violatorPlate: { x: 67, y: 85, w: 7, h: 6 },
    blurFaces: [],
    blurPlates: [],
    lowLight: true,
    rain: true,
    stepOverrides: {
      ingest: {
        front: "Low-light rainy frame received. Preprocessing pipeline engaged.",
        back: "CLAHE contrast boost, bilateral denoise, rain-streak suppression before detector.",
      },
      detect: {
        front: "Despite poor conditions, rider localised with SAHI small-object boost.",
        back: "SAHI tiling + RT-DETRv2-S maintains recall in rain/shadow/motion-blur.",
      },
    },
    evidence: {
      violationId: "BLR-KA-Hebbal-11-20260619-000811",
      facesBlurred: 0, platesBlurred: 0,
      frameSha256: sha("lowlight-hebbal"),
    },
  },
];

export const DEFAULT_SCENARIO_ID = "stop-line";

export function getScenario(id: string): Scenario {
  return SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[4]; // stop-line default
}

export function scenarioThumbReveal(): OverlayKey[] {
  return ["boxes", "track", "violation", "helmet", "plate"];
}
