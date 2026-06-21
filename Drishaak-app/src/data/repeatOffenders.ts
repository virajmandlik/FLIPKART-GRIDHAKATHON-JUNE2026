/**
 * Mock repeat-offender data for Vishal deployment widgets.
 * Bengaluru corridor hotspots: Silk Board, Marathahalli, Hebbal.
 */

export interface RepeatOffender {
  plate: string;
  vehicleType: string;
  violationCount: number;
  lastSeen: string;
  lastCamera: string;
  lastLocation: string;
  topViolations: string[];
  riskScore: number;
  flaggedForDeployment: boolean;
}

export const REPEAT_OFFENDERS: RepeatOffender[] = [
  {
    plate: "KA01AB1234",
    vehicleType: "Motorcycle",
    violationCount: 7,
    lastSeen: "2026-06-20 10:15 IST",
    lastCamera: "BLR_CAM_023",
    lastLocation: "Silk Board Jn → Marathahalli",
    topViolations: ["helmet_violation", "triple_riding"],
    riskScore: 0.92,
    flaggedForDeployment: true,
  },
  {
    plate: "KA03CD5678",
    vehicleType: "Motorcycle",
    violationCount: 5,
    lastSeen: "2026-06-19 18:42 IST",
    lastCamera: "BLR_CAM_012",
    lastLocation: "Silk Board Signal",
    topViolations: ["triple_riding", "stop_line_violation"],
    riskScore: 0.84,
    flaggedForDeployment: true,
  },
  {
    plate: "KA05MJ4521",
    vehicleType: "Car",
    violationCount: 4,
    lastSeen: "2026-06-18 11:28 IST",
    lastCamera: "BLR_CAM_041",
    lastLocation: "Marathahalli Bridge",
    topViolations: ["wrong_side_violation", "red_light_violation"],
    riskScore: 0.78,
    flaggedForDeployment: false,
  },
  {
    plate: "KA51MH8899",
    vehicleType: "Car",
    violationCount: 3,
    lastSeen: "2026-06-17 18:55 IST",
    lastCamera: "BLR_CAM_023",
    lastLocation: "Silk Board Signal",
    topViolations: ["red_light_violation"],
    riskScore: 0.71,
    flaggedForDeployment: false,
  },
];

export const PRIMARY_OFFENDER = REPEAT_OFFENDERS[0];
