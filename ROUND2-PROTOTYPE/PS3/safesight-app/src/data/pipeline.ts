/**
 * Single source of truth for the SafeSight EN pipeline story.
 * Components are data-driven from here so swapping mock -> real API is trivial.
 */
import type { LucideIcon } from "lucide-react";
import {
  Camera, ScanSearch, Workflow, Tags, ScanLine, ShieldOff,
  FileLock2, UserCheck, Send,
} from "lucide-react";

export type Tier = "edge" | "cloud";

export interface PipelineStep {
  id: string;
  short: string;
  title: string;
  tier: Tier;
  service: string; // microservice name
  icon: LucideIcon;
  frontText: string; // what the user/officer sees (front-stage)
  backText: string; // what the system does (back-stage)
  /** overlay keys to reveal on the CCTV frame at this step */
  reveal: OverlayKey[];
}

export type OverlayKey =
  | "boxes" | "track" | "violation" | "helmet" | "plate" | "blur"
  | "hash" | "approve" | "challan";

export const STEPS: PipelineStep[] = [
  {
    id: "ingest", short: "Ingest", title: "Frame ingest", tier: "edge",
    service: "edge-ingest", icon: Camera,
    frontText: "Live CCTV frame pulled from the junction pole (RTSP, 1080p).",
    backText: "edge-ingest samples frames, drops duplicates. Nothing leaves the pole yet.",
    reveal: [],
  },
  {
    id: "detect", short: "Detect", title: "Object detection", tier: "edge",
    service: "detector (RT-DETRv2-S)", icon: ScanSearch,
    frontText: "Vehicles, riders and pedestrians are localised in the frame.",
    backText: "RT-DETRv2-S (Apache-2.0, TensorRT INT8) runs on Jetson — ~28 FPS at the edge.",
    reveal: ["boxes"],
  },
  {
    id: "track", short: "Track", title: "Multi-object tracking", tier: "edge",
    service: "tracker (BoT-SORT)", icon: Workflow,
    frontText: "Each road user gets a stable ID so a violation is counted once.",
    backText: "BoT-SORT assigns track IDs across frames — prevents duplicate challans.",
    reveal: ["boxes", "track"],
  },
  {
    id: "classify", short: "Classify", title: "Violation classification", tier: "edge",
    service: "violation-engine", icon: Tags,
    frontText: "Stop-line crossing flagged. Helmet correctly detected as PRESENT.",
    backText: "Rule + geometry + small classifiers. Helmet / Pagdi / None — culturally fair.",
    reveal: ["boxes", "track", "violation", "helmet"],
  },
  {
    id: "anpr", short: "ANPR", title: "Plate recognition", tier: "edge",
    service: "anpr (OCR + RTO regex)", icon: ScanLine,
    frontText: "Number plate read and validated against the Indian RTO format.",
    backText: "fast-plate-ocr + temporal voting + KA/BH regex correction (O->0, I->1).",
    reveal: ["boxes", "track", "violation", "helmet", "plate"],
  },
  {
    id: "privacy", short: "Privacy", title: "DPDP privacy masking", tier: "edge",
    service: "privacy-masker", icon: ShieldOff,
    frontText: "Faces and non-violator plates are blurred before anything is stored.",
    backText: "Data minimisation at the edge (DPDP 2023, Rule 6). Only the violation packet egresses.",
    reveal: ["boxes", "violation", "plate", "blur"],
  },
  {
    id: "evidence", short: "Evidence", title: "Tamper-evident package", tier: "edge",
    service: "evidence-packer", icon: FileLock2,
    frontText: "An evidence package is sealed with a SHA-256 fingerprint + device signature.",
    backText: "SHA-256(frame) + ECDSA-P256 sign. This is what makes it court-admissible.",
    reveal: ["violation", "plate", "blur", "hash"],
  },
  {
    id: "review", short: "Review", title: "Human-in-the-loop", tier: "cloud",
    service: "review-svc", icon: UserCheck,
    frontText: "An officer reviews and approves. No fine is ever auto-issued.",
    backText: "review-svc queues low-confidence cases; approval triggers a BSA S.63(4) certificate.",
    reveal: ["violation", "plate", "blur", "hash", "approve"],
  },
  {
    id: "challan", short: "Challan", title: "e-Challan issued", tier: "cloud",
    service: "challan-svc -> Parivahan", icon: Send,
    frontText: "Verified challan is pushed to Parivahan and the citizen is notified.",
    backText: "challan-svc -> e-Challan API; event logged immutably for audit (5-yr retention).",
    reveal: ["violation", "plate", "blur", "hash", "approve", "challan"],
  },
];

/** Bounding boxes positioned over /cctv-frame.png (percent of container). */
export interface Box {
  key: string;
  label: string;
  track: string;
  x: number; y: number; w: number; h: number; // %
  kind: "violator" | "ok";
}

export const BOXES: Box[] = [
  { key: "auto", label: "Auto-rickshaw", track: "T-02", x: 6, y: 50, w: 33, h: 46, kind: "ok" },
  { key: "moto", label: "Motorcycle", track: "T-01", x: 41, y: 45, w: 18, h: 47, kind: "violator" },
  { key: "car", label: "Car", track: "T-03", x: 60, y: 50, w: 36, h: 46, kind: "ok" },
];

/** sub-regions on the frame */
export const HEAD_BOX = { x: 46.5, y: 44, w: 7, h: 11 };       // rider helmet (classifier)
export const VIOLATOR_PLATE = { x: 45, y: 80, w: 11, h: 8 };   // motorcycle rear plate -> ANPR read
export const BLUR_FACE = { x: 47, y: 45, w: 6, h: 8 };         // rider head -> privacy blur
export const BLUR_PLATE = { x: 79, y: 84, w: 11, h: 7 };       // innocent car plate -> privacy blur
export const STOPLINE_Y = 70;                                   // % from top (stop line)

export const VEHICLE_CLASSES = ["2W", "auto", "car", "bus", "truck", "person"];
