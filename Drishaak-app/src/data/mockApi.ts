/**
 * Plug-and-play data layer. Today it returns mock data; later, point these
 * functions at the real microservice REST/gRPC endpoints with zero UI changes.
 */

export interface EvidencePacket {
  violationId: string;
  cameraId: string;
  location: string;
  capturedAt: string;
  violationType: string;
  violationLabel: string;
  confidence: number;
  plate: string;
  plateValid: boolean;
  plateType: string;
  headwear: string;
  facesBlurred: number;
  platesBlurred: number;
  frameSha256: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export const DEMO_EVIDENCE: EvidencePacket = {
  violationId: "BLR-KA-MGRoad-07-20260619-000412",
  cameraId: "KA-MGRoad-07",
  location: "M.G. Road Jn, Bengaluru",
  capturedAt: "2026-06-19T08:14:22+05:30",
  violationType: "STOP_LINE",
  violationLabel: "Stop-line violation",
  confidence: 0.89,
  plate: "KA 05 MJ 4521",
  plateValid: true,
  plateType: "classic",
  headwear: "Helmet (present)",
  facesBlurred: 1,
  platesBlurred: 2,
  frameSha256: "a3f1c08e9b27d41566e0b8c7a9d3f2e15c4b7a08d9e6f231b0c5a7e4d2f8916b",
  status: "PENDING",
};

export const microservices = [
  { id: "edge-ingest", tier: "edge", desc: "RTSP frame sampling" },
  { id: "detector", tier: "edge", desc: "RT-DETRv2-S INT8" },
  { id: "tracker", tier: "edge", desc: "BoT-SORT" },
  { id: "violation-engine", tier: "edge", desc: "rule + geometry" },
  { id: "anpr", tier: "edge", desc: "OCR + RTO regex" },
  { id: "privacy-masker", tier: "edge", desc: "DPDP blur" },
  { id: "evidence-packer", tier: "edge", desc: "SHA-256 + sign" },
  { id: "review-svc", tier: "cloud", desc: "human queue" },
  { id: "evidence-svc", tier: "cloud", desc: "BSA certificate" },
  { id: "challan-svc", tier: "cloud", desc: "Parivahan API" },
  { id: "analytics-svc", tier: "cloud", desc: "KPIs + trends" },
  { id: "notify-svc", tier: "cloud", desc: "SMS / DigiLocker" },
] as const;

export const heroStats = [
  { label: "Bengaluru avg peak speed", value: 18, suffix: " km/h" },
  { label: "Signalised junctions", value: 1000, suffix: "+" },
  { label: "Manual review cut", value: 70, suffix: "%" },
  { label: "Target false-challan rate", value: 2, prefix: "<", suffix: "%" },
];

export const violationsByType = [
  { type: "No helmet", count: 412 },
  { type: "Triple riding", count: 188 },
  { type: "No seatbelt", count: 156 },
  { type: "Stop-line", count: 143 },
  { type: "Red-light", count: 97 },
  { type: "Wrong-side", count: 64 },
  { type: "Illegal parking", count: 51 },
];

export const reviewTrend = [
  { day: "Mon", auto: 240, reviewed: 64 },
  { day: "Tue", auto: 290, reviewed: 71 },
  { day: "Wed", auto: 261, reviewed: 58 },
  { day: "Thu", auto: 322, reviewed: 77 },
  { day: "Fri", auto: 398, reviewed: 90 },
  { day: "Sat", auto: 351, reviewed: 82 },
  { day: "Sun", auto: 214, reviewed: 49 },
];

export const confidenceSplit = [
  { name: "Auto-approve ≥0.9", value: 58, fill: "#22C55E" },
  { name: "Human review 0.6–0.9", value: 34, fill: "#FFC200" },
  { name: "VLM recheck <0.6", value: 8, fill: "#22D3EE" },
];

export const scaleStages = [
  { stage: "Demo", cameras: "0 (mock)", edge: "₹0", cloud: "₹0 free tier" },
  { stage: "Pilot", cameras: "1–5 junctions", edge: "₹20k/node", cloud: "₹5k/mo" },
  { stage: "City phase", cameras: "~500 junctions", edge: "edge fleet", cloud: "HPA + GPU scale-to-zero" },
  { stage: "Full Bengaluru", cameras: "~9,000 cameras", edge: "edge fleet", cloud: "multi-AZ, data-localised" },
];
