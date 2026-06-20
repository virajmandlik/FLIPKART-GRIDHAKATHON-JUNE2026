import { COMMAND_CENTER, EDGE_NODES, type MapNode } from "../../data/bengaluruDeployment";

/** Simplified Bengaluru outline (normalized 0–100 viewBox). */
const CITY_OUTLINE =
  "M28,22 L38,18 L52,16 L68,18 L78,26 L82,38 L84,52 L80,68 L72,82 L58,90 L42,88 L30,78 L22,62 L20,44 Z";

interface HeatNode extends MapNode {
  heat?: number;
}

interface Props {
  nodes?: HeatNode[];
  selectedId?: string;
  onNodeClick?: (node: MapNode) => void;
  showAgencies?: boolean;
  showConnections?: boolean;
  heatmapMode?: boolean;
  className?: string;
}

function heatColor(intensity: number) {
  const a = Math.min(0.85, 0.15 + intensity * 0.7);
  return `rgba(239, 68, 68, ${a})`;
}

export default function BengaluruMapSvg({
  nodes = EDGE_NODES,
  selectedId,
  onNodeClick,
  showConnections = true,
  heatmapMode = false,
  className = "",
}: Props) {
  const allNodes = heatmapMode ? nodes : [COMMAND_CENTER, ...nodes];

  return (
    <svg
      viewBox="0 0 100 100"
      className={`h-full w-full ${className}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Bengaluru deployment map"
    >
      <defs>
        <pattern id="mapGrid" width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M 4 0 L 0 0 0 4" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.15" />
        </pattern>
      </defs>

      <rect width="100" height="100" fill="#0A0B0F" />
      <rect width="100" height="100" fill="url(#mapGrid)" />

      <path
        d={CITY_OUTLINE}
        fill="rgba(20, 184, 166, 0.04)"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="0.4"
      />

      {showConnections &&
        EDGE_NODES.map((e) => (
          <line
            key={`link-${e.id}`}
            x1={COMMAND_CENTER.x}
            y1={COMMAND_CENTER.y}
            x2={e.x}
            y2={e.y}
            stroke="rgba(20, 184, 166, 0.2)"
            strokeWidth="0.2"
            strokeDasharray="0.8 0.6"
          />
        ))}

      {allNodes.map((n) => {
        const heatNode = n as HeatNode;
        const heat = heatNode.heat;
        const isCmd = n.kind === "command";
        const isSel = selectedId === n.id;
        const r = isCmd ? 2.2 : heatmapMode ? 2.8 : 1.8;

        return (
          <g key={n.id}>
            {heatmapMode && typeof heat === "number" && (
              <circle cx={n.x} cy={n.y} r={6} fill={heatColor(heat)} />
            )}
            <circle
              cx={n.x}
              cy={n.y}
              r={r}
              fill={
                isCmd
                  ? "#FF9933"
                  : heatmapMode
                    ? "#EF4444"
                    : n.status === "live"
                      ? "#14B8A6"
                      : "#64748b"
              }
              stroke={isSel ? "#fff" : "rgba(255,255,255,0.3)"}
              strokeWidth={isSel ? 0.5 : 0.25}
              className={onNodeClick ? "cursor-pointer" : undefined}
              onClick={() => onNodeClick?.(n)}
            />
            <text
              x={n.x}
              y={n.y + (isCmd ? 4.5 : 4)}
              textAnchor="middle"
              fill={isSel ? "#fff" : "rgba(226,232,240,0.85)"}
              fontSize="2.2"
              fontWeight="600"
              style={{ pointerEvents: "none" }}
            >
              {n.label.split(" ")[0]}
            </text>
          </g>
        );
      })}

      {!heatmapMode && (
        <text x="50" y="96" textAnchor="middle" fill="rgba(148,163,184,0.35)" fontSize="2">
          ನಮ್ಮ ಬೆಂಗಳೂರು
        </text>
      )}
    </svg>
  );
}

/** Heat intensity from violation count (normalized). */
export function violationHeat(violations24h = 0): number {
  return Math.min(1, violations24h / 150);
}
