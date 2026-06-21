/**
 * Mock police deployment recommendations for Vishal widgets.
 */

export interface DeploymentRecommendation {
  id: string;
  junction: string;
  cameraIds: string[];
  priority: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
  suggestedWindow: string;
  expectedImpact: string;
  officersRecommended: number;
  violationTypes: string[];
}

export const DEPLOYMENT_RECOMMENDATIONS: DeploymentRecommendation[] = [
  {
    id: "dep_001",
    junction: "Silk Board Jn",
    cameraIds: ["BLR_CAM_023", "BLR_CAM_012"],
    priority: "HIGH",
    reason: "7 repeat violations from KA01AB1234 in 14 days; triple riding + helmet cluster 08:00–11:00",
    suggestedWindow: "Today 09:00–12:00 IST",
    expectedImpact: "Est. 18% reduction in 2W violations this week",
    officersRecommended: 4,
    violationTypes: ["helmet_violation", "triple_riding"],
  },
  {
    id: "dep_002",
    junction: "Marathahalli Bridge",
    cameraIds: ["BLR_CAM_041", "BLR_CAM_038"],
    priority: "MEDIUM",
    reason: "Wrong-side driving spike after ASTraM diversion; 3 hot plates tracked",
    suggestedWindow: "Tomorrow 17:00–20:00 IST",
    expectedImpact: "Target wrong-side + stop-line combo violations",
    officersRecommended: 3,
    violationTypes: ["wrong_side_violation", "stop_line_violation"],
  },
  {
    id: "dep_003",
    junction: "Silk Board Signal (evening peak)",
    cameraIds: ["BLR_CAM_012"],
    priority: "MEDIUM",
    reason: "Red-light violations up 22% post-monsoon; RLVD phase sync verified",
    suggestedWindow: "Fri 18:00–21:00 IST",
    expectedImpact: "Deterrence at highest RL violation window",
    officersRecommended: 2,
    violationTypes: ["red_light_violation"],
  },
];

export const PRIMARY_DEPLOYMENT = DEPLOYMENT_RECOMMENDATIONS[0];

/** Map junction recommendation → CityCommandCenter node + zoom level */
export const JUNCTION_MAP_FOCUS: Record<string, { nodeId: string; zoomIdx: number }> = {
  dep_001: { nodeId: "silk-board", zoomIdx: 3 },
  dep_002: { nodeId: "electronic-city", zoomIdx: 2 },
  dep_003: { nodeId: "silk-board", zoomIdx: 3 },
};
