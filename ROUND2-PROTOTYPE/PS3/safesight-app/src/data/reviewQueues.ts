/**
 * Mock human-review and reprocess queue items for Layer 4 demo.
 */

export type ReviewRoute = "auto_verify" | "human_review" | "reprocess";

export interface ReviewQueueItem {
  id: string;
  eventId: string;
  plate: string;
  cameraId: string;
  location: string;
  violationType: string;
  confidence: number;
  route: ReviewRoute;
  timestamp: string;
  facesBlurred: number;
  platesBlurred: number;
  frameSha256: string;
  status: "pending" | "approved" | "rejected" | "reprocessing";
}

export const HUMAN_REVIEW_QUEUE: ReviewQueueItem[] = [
  {
    id: "hr_001",
    eventId: "evt_7c2b91",
    plate: "KA03CD5678",
    cameraId: "BLR_CAM_012",
    location: "Silk Board Jn, Bengaluru",
    violationType: "triple_riding",
    confidence: 0.78,
    route: "human_review",
    timestamp: "2026-06-20T09:42:11Z",
    facesBlurred: 2,
    platesBlurred: 1,
    frameSha256: "b4e8f2a1c9d30756e1a8b4c2d5f6e7890abcdef1234567890abcdef12345678",
    status: "pending",
  },
  {
    id: "hr_002",
    eventId: "evt_3a9f44",
    plate: "KA04JK7788",
    cameraId: "BLR_CAM_041",
    location: "Hebbal Flyover, Bengaluru",
    violationType: "helmet_violation",
    confidence: 0.72,
    route: "human_review",
    timestamp: "2026-06-20T06:12:44Z",
    facesBlurred: 1,
    platesBlurred: 0,
    frameSha256: "c7d1e3f5a9b20846c2d4e6f8a0b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7",
    status: "pending",
  },
  {
    id: "hr_003",
    eventId: "evt_5d8e22",
    plate: "KA02EF9012",
    cameraId: "BLR_CAM_019",
    location: "Brigade Road, Bengaluru",
    violationType: "illegal_parking",
    confidence: 0.68,
    route: "human_review",
    timestamp: "2026-06-20T14:20:05Z",
    facesBlurred: 1,
    platesBlurred: 0,
    frameSha256: "d8e2f4a6b0c21468d4e6f8a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4",
    status: "pending",
  },
];

export const REPROCESS_QUEUE: ReviewQueueItem[] = [
  {
    id: "rp_001",
    eventId: "evt_1f6c88",
    plate: "KA05MJ4521",
    cameraId: "BLR_CAM_007",
    location: "Richmond Circle, Bengaluru",
    violationType: "wrong_side_violation",
    confidence: 0.52,
    route: "reprocess",
    timestamp: "2026-06-20T11:28:17Z",
    facesBlurred: 1,
    platesBlurred: 0,
    frameSha256: "e9f3a5b7c1d32579e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1",
    status: "pending",
  },
  {
    id: "rp_002",
    eventId: "evt_9b4d33",
    plate: "KA51MH8899",
    cameraId: "BLR_CAM_012",
    location: "Silk Board Signal, Bengaluru",
    violationType: "red_light_violation",
    confidence: 0.48,
    route: "reprocess",
    timestamp: "2026-06-20T18:55:41Z",
    facesBlurred: 1,
    platesBlurred: 0,
    frameSha256: "f0a4b6c8d2e42680f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2",
    status: "pending",
  },
];

/** Golden-path auto-verified event from L3 pipeline */
export const AUTO_VERIFIED_EVENT: ReviewQueueItem = {
  id: "av_golden",
  eventId: "evt_8f7a12",
  plate: "KA01AB1234",
  cameraId: "BLR_CAM_023",
  location: "Silk Board → Marathahalli corridor, Bengaluru",
  violationType: "helmet_violation + triple_riding",
  confidence: 0.95,
  route: "auto_verify",
  timestamp: "2026-06-20T10:15:23Z",
  facesBlurred: 2,
  platesBlurred: 1,
  frameSha256: "a3f1c08e9b27d41566e0b8c7a9d3f2e15c4b7a08d9e6f231b0c5a7e4d2f8916b",
  status: "approved",
};

export function routeFromConfidence(confidence: number): ReviewRoute {
  if (confidence >= 0.85) return "auto_verify";
  if (confidence >= 0.6) return "human_review";
  return "reprocess";
}
