/**
 * Five-layer Drishaak pipeline definitions for the Pipeline Journey tab.
 */
import type { LucideIcon } from "lucide-react";
import {
  Camera, Sparkles, Brain, FileLock2, BarChart3,
} from "lucide-react";

export interface LayerDefinition {
  id: number;
  slug: string;
  short: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  /** Auto-play duration in ms */
  durationMs: number;
  architectureImage: string;
  tier: "edge" | "cloud";
  outputStatus: string;
}

export const LAYER_PIPELINE: LayerDefinition[] = [
  {
    id: 1,
    slug: "ingest",
    short: "L1",
    title: "Ingest & Frame Selection",
    subtitle: "RTSP ingest, motion-aware sampling, duplicate drop at the pole",
    icon: Camera,
    durationMs: 4000,
    architectureImage: "/architecture/LAYER1.png",
    tier: "edge",
    outputStatus: "READY_FOR_ENHANCEMENT",
  },
  {
    id: 2,
    slug: "enhancement",
    short: "L2",
    title: "Evidence Enhancement & ROI",
    subtitle: "Restormer + Real-ESRGAN super-resolution, ROI crops for ANPR & classifiers",
    icon: Sparkles,
    durationMs: 5000,
    architectureImage: "/architecture/Layer2.png",
    tier: "edge",
    outputStatus: "READY_FOR_VIOLATION_DETECTION",
  },
  {
    id: 3,
    slug: "validation",
    short: "L3",
    title: "AI Violation Detection",
    subtitle: "Multi-model ensemble + agentic validation — UVH-26 rule engine",
    icon: Brain,
    durationMs: 5500,
    architectureImage: "/architecture/Layer 3a.png",
    tier: "edge",
    outputStatus: "READY_FOR_REPORTING",
  },
  {
    id: 4,
    slug: "evidence",
    short: "L4",
    title: "Evidence Management",
    subtitle: "DPDP masking, SHA-256 seal, BSA S.63(4) certificate prep",
    icon: FileLock2,
    durationMs: 4000,
    architectureImage: "/architecture/Layer 4.png",
    tier: "edge",
    outputStatus: "EVIDENCE_SEALED",
  },
  {
    id: 5,
    slug: "analytics",
    short: "L5",
    title: "Reporting & Analytics",
    subtitle: "Officer review queue, e-Challan push, false-challan KPI dashboard",
    icon: BarChart3,
    durationMs: 4500,
    architectureImage: "/architecture/Layer 5.png",
    tier: "cloud",
    outputStatus: "CHALLAN_QUEUED",
  },
];

export const TOTAL_PIPELINE_MS = LAYER_PIPELINE.reduce((s, l) => s + l.durationMs, 0);

export function getLayer(id: number): LayerDefinition {
  return LAYER_PIPELINE.find((l) => l.id === id) ?? LAYER_PIPELINE[0];
}
