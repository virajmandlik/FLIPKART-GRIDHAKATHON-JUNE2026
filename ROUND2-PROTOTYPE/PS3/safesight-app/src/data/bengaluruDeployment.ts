/** Bengaluru city-wide SafeSight EN deployment map data (normalized 0–100 coords). */

export type NodeKind = "edge" | "command" | "agency";

export interface MapNode {
  id: string;
  kind: NodeKind;
  label: string;
  sub: string;
  x: number;
  y: number;
  cameras?: number;
  violations24h?: number;
  status: "live" | "sync" | "idle";
}

export interface AgencyLink {
  from: string;
  to: string;
  label: string;
  protocol: string;
}

export const COMMAND_CENTER: MapNode = {
  id: "btp-sec",
  kind: "command",
  label: "Smart Enforcement Center",
  sub: "BTP · Bengaluru City HQ",
  x: 52,
  y: 48,
  violations24h: 1240,
  status: "live",
};

export const EDGE_NODES: MapNode[] = [
  { id: "mg-road", kind: "edge", label: "M.G. Road", sub: "KA-MGRoad-07", x: 48, y: 58, cameras: 4, violations24h: 89, status: "live" },
  { id: "silk-board", kind: "edge", label: "Silk Board", sub: "KA-Silk-12", x: 55, y: 72, cameras: 6, violations24h: 142, status: "live" },
  { id: "kr-puram", kind: "edge", label: "KR Puram", sub: "KA-KRPuram-03", x: 72, y: 42, cameras: 3, violations24h: 67, status: "live" },
  { id: "hebbal", kind: "edge", label: "Hebbal Flyover", sub: "KA-Hebbal-11", x: 42, y: 28, cameras: 5, violations24h: 54, status: "live" },
  { id: "richmond", kind: "edge", label: "Richmond Circle", sub: "KA-Richmond-05", x: 38, y: 52, cameras: 2, violations24h: 31, status: "live" },
  { id: "brigade", kind: "edge", label: "Brigade Road", sub: "KA-Brigade-09", x: 50, y: 54, cameras: 3, violations24h: 48, status: "live" },
  { id: "indiranagar", kind: "edge", label: "Indiranagar", sub: "KA-Indiranagar-04", x: 62, y: 50, cameras: 4, violations24h: 38, status: "live" },
  { id: "electronic-city", kind: "edge", label: "Electronic City", sub: "KA-ECity-02", x: 58, y: 88, cameras: 8, violations24h: 112, status: "live" },
];

export const GOV_AGENCIES: MapNode[] = [
  { id: "parivahan", kind: "agency", label: "Parivahan", sub: "e-Challan API", x: 78, y: 22, status: "sync" },
  { id: "astram", kind: "agency", label: "ASTraM", sub: "BTP analytics", x: 68, y: 18, status: "sync" },
  { id: "bbmp", kind: "agency", label: "BBMP", sub: "Parking & civic", x: 22, y: 38, status: "sync" },
  { id: "bmtc", kind: "agency", label: "BMTC", sub: "Bus lane intel", x: 28, y: 62, status: "sync" },
  { id: "digilocker", kind: "agency", label: "DigiLocker", sub: "Citizen notices", x: 82, y: 58, status: "sync" },
  { id: "ncrb", kind: "agency", label: "NCRB / VAHAN", sub: "Vehicle registry", x: 85, y: 38, status: "idle" },
];

export const AGENCY_LINKS: AgencyLink[] = [
  { from: "btp-sec", to: "parivahan", label: "Challan issue", protocol: "REST/mTLS" },
  { from: "btp-sec", to: "astram", label: "Congestion feed", protocol: "Kafka" },
  { from: "btp-sec", to: "bbmp", label: "Illegal parking", protocol: "API" },
  { from: "btp-sec", to: "bmtc", label: "Bus-priority", protocol: "API" },
  { from: "btp-sec", to: "digilocker", label: "Notices", protocol: "REST" },
  { from: "btp-sec", to: "ncrb", label: "Plate lookup", protocol: "mTLS" },
];

export const ZOOM_LEVELS = [
  { id: "city", label: "City view", scale: 1, focus: { x: 50, y: 50 } },
  { id: "central", label: "Central BLR", scale: 1.65, focus: { x: 50, y: 55 } },
  { id: "sec", label: "Command center", scale: 2.4, focus: { x: 52, y: 48 } },
  { id: "silk", label: "Silk Board edge", scale: 3.2, focus: { x: 55, y: 72 } },
] as const;
