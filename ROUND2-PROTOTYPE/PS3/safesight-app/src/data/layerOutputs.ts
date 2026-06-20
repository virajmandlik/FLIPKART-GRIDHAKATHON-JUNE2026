/**
 * Typed layer pipeline outputs — adapted from PS3/outputs/L1.json, L2.json, L3.json
 */

export interface Layer1Output {
  event_id: string;
  camera_id: string;
  junction_id: string;
  timestamp: string;
  frame: {
    frame_id: string;
    frame_url: string;
    resolution: string;
  };
  selection: {
    original_fps: number;
    sampling_fps: number;
    motion_score: number;
    duplicate_score: number;
    reason: string[];
  };
  location: {
    latitude: number;
    longitude: number;
  };
  status: string;
  pipeline: { version: string };
}

export interface Layer2Detection {
  detection_id: string;
  class: string;
  confidence: number;
  bbox: [number, number, number, number];
}

export interface Layer2Roi {
  roi_id: string;
  type: string;
  source_detection: string;
  crop_url: string;
  bbox: [number, number, number, number];
  enhancement_applied: boolean;
}

export interface Layer2Output {
  event_id: string;
  camera_id: string;
  junction_id: string;
  timestamp: string;
  gps: { latitude: number; longitude: number };
  pipeline_version: string;
  raw_frame: { frame_id: string; frame_url: string };
  enhanced_frame: { frame_id: string; frame_url: string };
  quality_assessment: {
    quality_score_before: number;
    quality_score_after: number;
    improvement_percent: number;
    detected_issues: string[];
  };
  enhancement_pipeline: {
    restormer: { applied: boolean; operations: string[] };
    real_esrgan: { applied: boolean; operations: string[]; scale_factor: string };
  };
  object_detections: Layer2Detection[];
  roi_regions: Layer2Roi[];
  evidence_assets: {
    raw_image_available: boolean;
    enhanced_image_available: boolean;
    roi_crops_available: boolean;
  };
  status: string;
  next_layer: string;
  layer_3_tasks: string[];
}

export interface Layer3Violation {
  violation_id: string;
  type: string;
  confidence: number;
  severity: "HIGH" | "MEDIUM" | "LOW";
}

export interface Layer3Output {
  event_id: string;
  camera_id: string;
  junction_id: string;
  timestamp: string;
  gps: { latitude: number; longitude: number };
  pipeline_version: string;
  raw_frame: { frame_id: string; frame_url: string };
  enhanced_frame: { frame_id: string; frame_url: string };
  annotated_evidence: { annotated_image_url: string };
  vehicle: { type: string; confidence: number };
  license_plate: {
    plate_number: string;
    confidence: number;
    ocr_engine: string;
    crop_url: string;
  };
  detected_persons: { rider_count: number; driver_count: number };
  roi_regions: Array<{
    roi_id: string;
    type: string;
    crop_url: string;
    bbox: [number, number, number, number];
  }>;
  model_outputs: {
    helmet_detection: { helmet_present: boolean | null; confidence: number | null };
    seatbelt_detection: { seatbelt_present: boolean | null; confidence: number | null };
    rider_counting: { rider_count: number; confidence: number };
    vehicle_classification: { vehicle_type: string; confidence: number };
    ocr: { plate_number: string; confidence: number };
  };
  context_analysis: {
    wrong_side_driving: boolean;
    red_light_crossed: boolean;
    stop_line_crossed: boolean;
    illegal_parking: boolean;
  };
  rule_engine_results: Record<string, boolean>;
  violations: Layer3Violation[];
  agentic_validation: {
    validated: boolean;
    consistency_score: number;
    false_positive_risk: "LOW" | "MEDIUM" | "HIGH";
    summary: string;
    explanation: string[];
  };
  evidence_package: {
    raw_frame_url: string;
    enhanced_frame_url: string;
    annotated_image_url: string;
    roi_references: string[];
  };
  overall_confidence: number;
  review_status: string;
  evidence_assets: {
    raw_image_available: boolean;
    enhanced_image_available: boolean;
    roi_crops_available: boolean;
    annotated_image_available: boolean;
  };
  status: string;
  next_layer: string;
}

/** Golden-path event: Silk Board → Marathahalli corridor, BLR_CAM_023 */
export const LAYER1_OUTPUT: Layer1Output = {
  event_id: "evt_8f7a12",
  camera_id: "BLR_CAM_023",
  junction_id: "JN_023",
  timestamp: "2026-06-20T10:15:23Z",
  frame: {
    frame_id: "frm_001245",
    frame_url: "s3://safesight-evidence/2026/06/20/frm_001245.jpg",
    resolution: "1920x1080",
  },
  selection: {
    original_fps: 30,
    sampling_fps: 3,
    motion_score: 0.87,
    duplicate_score: 0.04,
    reason: ["motion_detected", "unique_frame"],
  },
  location: {
    latitude: 12.9716,
    longitude: 77.5946,
  },
  status: "READY_FOR_ENHANCEMENT",
  pipeline: { version: "1.0" },
};

export const LAYER2_OUTPUT: Layer2Output = {
  event_id: "evt_8f7a12",
  camera_id: "BLR_CAM_023",
  junction_id: "JN_023",
  timestamp: "2026-06-20T10:15:23Z",
  gps: { latitude: 12.9716, longitude: 77.5946 },
  pipeline_version: "2.1",
  raw_frame: { frame_id: "frm_001245", frame_url: "s3://raw/frame_001245.jpg" },
  enhanced_frame: { frame_id: "enh_001245", frame_url: "s3://enhanced/enh_001245.jpg" },
  quality_assessment: {
    quality_score_before: 0.42,
    quality_score_after: 0.91,
    improvement_percent: 116.6,
    detected_issues: ["motion_blur", "low_resolution", "compression_artifacts"],
  },
  enhancement_pipeline: {
    restormer: { applied: true, operations: ["denoising", "deblurring", "deraining"] },
    real_esrgan: {
      applied: true,
      operations: ["super_resolution", "detail_recovery", "edge_sharpening"],
      scale_factor: "4x",
    },
  },
  object_detections: [
    { detection_id: "det_vehicle_01", class: "motorcycle", confidence: 0.97, bbox: [100, 50, 900, 700] },
    { detection_id: "det_rider_01", class: "rider", confidence: 0.95, bbox: [320, 70, 620, 650] },
    { detection_id: "det_driver_01", class: "driver", confidence: 0.94, bbox: [350, 80, 600, 420] },
    { detection_id: "det_plate_01", class: "license_plate", confidence: 0.98, bbox: [125, 310, 260, 355] },
  ],
  roi_regions: [
    { roi_id: "roi_plate_01", type: "license_plate", source_detection: "det_plate_01", crop_url: "s3://roi/license_plate_01.jpg", bbox: [125, 310, 260, 355], enhancement_applied: true },
    { roi_id: "roi_helmet_01", type: "helmet", source_detection: "det_rider_01", crop_url: "s3://roi/helmet_01.jpg", bbox: [410, 120, 520, 240], enhancement_applied: true },
    { roi_id: "roi_driver_01", type: "driver", source_detection: "det_driver_01", crop_url: "s3://roi/driver_01.jpg", bbox: [350, 80, 600, 420], enhancement_applied: true },
    { roi_id: "roi_seatbelt_01", type: "seatbelt_region", source_detection: "det_driver_01", crop_url: "s3://roi/seatbelt_01.jpg", bbox: [420, 180, 560, 320], enhancement_applied: true },
    { roi_id: "roi_vehicle_01", type: "vehicle", source_detection: "det_vehicle_01", crop_url: "s3://roi/vehicle_01.jpg", bbox: [100, 50, 900, 700], enhancement_applied: true },
    { roi_id: "roi_rider_01", type: "rider", source_detection: "det_rider_01", crop_url: "s3://roi/rider_01.jpg", bbox: [320, 70, 620, 650], enhancement_applied: true },
  ],
  evidence_assets: {
    raw_image_available: true,
    enhanced_image_available: true,
    roi_crops_available: true,
  },
  status: "READY_FOR_VIOLATION_DETECTION",
  next_layer: "Layer_3_AI_Violation_Detection",
  layer_3_tasks: [
    "helmet_detection",
    "seatbelt_detection",
    "vehicle_classification",
    "rider_counting",
    "number_plate_ocr",
    "traffic_violation_classification",
  ],
};

export const LAYER3_OUTPUT: Layer3Output = {
  event_id: "evt_8f7a12",
  camera_id: "BLR_CAM_023",
  junction_id: "JN_023",
  timestamp: "2026-06-20T10:15:23Z",
  gps: { latitude: 12.9716, longitude: 77.5946 },
  pipeline_version: "3.0",
  raw_frame: { frame_id: "frm_001245", frame_url: "s3://raw/frame_001245.jpg" },
  enhanced_frame: { frame_id: "enh_001245", frame_url: "s3://enhanced/frame_001245.jpg" },
  annotated_evidence: { annotated_image_url: "s3://evidence/annotated_001245.jpg" },
  vehicle: { type: "motorcycle", confidence: 0.97 },
  license_plate: {
    plate_number: "KA01AB1234",
    confidence: 0.98,
    ocr_engine: "PaddleOCR",
    crop_url: "s3://roi/license_plate_01.jpg",
  },
  detected_persons: { rider_count: 3, driver_count: 1 },
  roi_regions: [
    { roi_id: "roi_plate_01", type: "license_plate", crop_url: "s3://roi/license_plate_01.jpg", bbox: [125, 310, 260, 355] },
    { roi_id: "roi_helmet_01", type: "helmet", crop_url: "s3://roi/helmet_01.jpg", bbox: [410, 120, 520, 240] },
    { roi_id: "roi_driver_01", type: "driver", crop_url: "s3://roi/driver_01.jpg", bbox: [350, 80, 600, 420] },
    { roi_id: "roi_seatbelt_01", type: "seatbelt_region", crop_url: "s3://roi/seatbelt_01.jpg", bbox: [420, 180, 560, 320] },
    { roi_id: "roi_vehicle_01", type: "vehicle", crop_url: "s3://roi/vehicle_01.jpg", bbox: [100, 50, 900, 700] },
    { roi_id: "roi_rider_01", type: "rider", crop_url: "s3://roi/rider_01.jpg", bbox: [320, 70, 620, 650] },
  ],
  model_outputs: {
    helmet_detection: { helmet_present: false, confidence: 0.96 },
    seatbelt_detection: { seatbelt_present: null, confidence: null },
    rider_counting: { rider_count: 3, confidence: 0.93 },
    vehicle_classification: { vehicle_type: "motorcycle", confidence: 0.97 },
    ocr: { plate_number: "KA01AB1234", confidence: 0.98 },
  },
  context_analysis: {
    wrong_side_driving: false,
    red_light_crossed: false,
    stop_line_crossed: false,
    illegal_parking: false,
  },
  rule_engine_results: {
    helmet_violation: true,
    seatbelt_violation: false,
    triple_riding: true,
    wrong_side_violation: false,
    red_light_violation: false,
    stop_line_violation: false,
    illegal_parking_violation: false,
  },
  violations: [
    { violation_id: "vio_001", type: "helmet_violation", confidence: 0.96, severity: "HIGH" },
    { violation_id: "vio_002", type: "triple_riding", confidence: 0.94, severity: "HIGH" },
  ],
  agentic_validation: {
    validated: true,
    consistency_score: 0.95,
    false_positive_risk: "LOW",
    summary: "Motorcycle KA01AB1234 observed with three riders. Helmet not detected. Triple riding and helmet violation confirmed.",
    explanation: [
      "Vehicle classified as motorcycle.",
      "Three riders detected.",
      "Helmet ROI analyzed and no helmet detected.",
      "OCR successfully extracted registration number.",
      "Traffic rules confirm helmet and triple riding violations.",
    ],
  },
  evidence_package: {
    raw_frame_url: "s3://raw/frame_001245.jpg",
    enhanced_frame_url: "s3://enhanced/frame_001245.jpg",
    annotated_image_url: "s3://evidence/annotated_001245.jpg",
    roi_references: ["roi_plate_01", "roi_helmet_01", "roi_driver_01", "roi_vehicle_01", "roi_rider_01"],
  },
  overall_confidence: 0.95,
  review_status: "AUTO_VERIFIED",
  evidence_assets: {
    raw_image_available: true,
    enhanced_image_available: true,
    roi_crops_available: true,
    annotated_image_available: true,
  },
  status: "READY_FOR_REPORTING",
  next_layer: "Layer_4_Evidence_Management_Reporting_Analytics",
};

/** Demo frame image for golden-path pipeline (triple riding @ Silk Board) */
export const GOLDEN_PATH_FRAME = "/scenarios/scenario-triple-riding.png";

/** Junction display labels for golden path */
export const GOLDEN_PATH_LOCATION = "Silk Board → Marathahalli corridor, Bengaluru";
