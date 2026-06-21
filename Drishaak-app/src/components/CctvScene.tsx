import type { Scenario } from "../data/scenarios";

/** SVG CCTV background — unique layout per violation scenario (no external images). */
export default function CctvScene({ scenario }: { scenario: Scenario }) {
  const { layout, lowLight, rain, redLightOn, parkingZone, wrongWayArrow, stoplineY } = scenario;

  const sky = lowLight ? "#1a1f2e" : "#4a5568";
  const road = lowLight ? "#1e2433" : "#2d3748";
  const lane = lowLight ? "#9ca3af" : "#e2e8f0";

  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 960 540" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={sky} />
          <stop offset="100%" stopColor={road} />
        </linearGradient>
        <filter id="rainBlur">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
          <feDisplacementMap in="SourceGraphic" scale="3" />
        </filter>
      </defs>

      {/* sky */}
      <rect width="960" height="280" fill="url(#skyGrad)" />
      {/* road surface */}
      <polygon points="0,540 960,540 720,280 240,280" fill={road} />

      {/* layout-specific road markings */}
      {layout === "junction_day" || layout === "junction_signal" || layout === "junction_night" ? (
        <>
          {/* centre lane dashes */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x="475" y={300 + i * 28} width="10" height="16" rx="2" fill="#d4a017" opacity="0.85" />
          ))}
          {stoplineY !== undefined && (
            <>
              <line x1="280" y1={stoplineY * 5.4} x2="680" y2={stoplineY * 5.4}
                stroke="#f8fafc" strokeWidth="4" strokeDasharray="12 8" opacity="0.9" />
            </>
          )}
        </>
      ) : null}

      {layout === "divider_wrongway" && (
        <>
          <rect x="470" y="280" width="20" height="260" fill="#64748b" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <rect key={i} x="476" y={300 + i * 32} width="8" height="18" fill="#fbbf24" />
          ))}
          {wrongWayArrow && (
            <g transform="translate(520, 380)">
              <path d="M0,0 L-40,0 L-40,-20 L-70,10 L-40,40 L-40,20 L0,20 Z" fill="#ef4444" opacity="0.9" />
              <text x="-35" y="55" fill="#ef4444" fontSize="14" fontWeight="bold">WRONG WAY</text>
            </g>
          )}
        </>
      )}

      {layout === "commercial_parking" && parkingZone && (
        <g>
          <rect
            x={parkingZone.x * 9.6} y={parkingZone.y * 5.4}
            width={parkingZone.w * 9.6} height={parkingZone.h * 5.4}
            fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray="10 6" opacity="0.7"
          />
          <text x={parkingZone.x * 9.6 + 8} y={parkingZone.y * 5.4 + 22}
            fill="#ef4444" fontSize="16" fontWeight="bold">NO PARKING</text>
          {/* shop front */}
          <rect x="40" y="120" width="200" height="160" fill="#374151" rx="4" />
          <rect x="60" y="140" width="50" height="70" fill="#4b5563" />
          <rect x="130" y="140" width="50" height="70" fill="#4b5563" />
        </g>
      )}

      {/* traffic signal (red-light scenario) */}
      {layout === "junction_signal" && (
        <g transform="translate(820, 100)">
          <rect x="0" y="0" width="36" height="100" rx="6" fill="#1f2937" stroke="#374151" />
          <circle cx="18" cy="22" r="10" fill={redLightOn ? "#ef4444" : "#374151"} className={redLightOn ? "animate-pulse" : ""} />
          <circle cx="18" cy="50" r="10" fill="#374151" />
          <circle cx="18" cy="78" r="10" fill="#374151" />
          {redLightOn && (
            <text x="-60" y="30" fill="#ef4444" fontSize="14" fontWeight="bold">SIGNAL RED</text>
          )}
        </g>
      )}

      {/* vehicles (schematic silhouettes under overlay boxes) */}
      {scenario.boxes.map((b) => {
        const x = b.x * 9.6;
        const y = b.y * 5.4;
        const w = b.w * 9.6;
        const h = b.h * 5.4;
        const fill = b.kind === "violator"
          ? (lowLight ? "#7f1d1d" : "#991b1b")
          : (lowLight ? "#1e3a5f" : "#1e40af");
        const is2W = b.label.toLowerCase().includes("motorcycle") || b.label.includes("2W");
        const isPerson = b.label.toLowerCase().includes("pedestrian");

        if (isPerson) {
          return (
            <g key={b.key}>
              <ellipse cx={x + w / 2} cy={y + h * 0.15} rx={w * 0.35} ry={h * 0.12} fill="#d4a574" />
              <rect x={x + w * 0.2} y={y + h * 0.25} width={w * 0.6} height={h * 0.75} rx="4" fill="#64748b" />
            </g>
          );
        }
        if (is2W) {
          return (
            <g key={b.key}>
              <ellipse cx={x + w * 0.25} cy={y + h * 0.92} rx={w * 0.22} ry={h * 0.08} fill="#111" />
              <ellipse cx={x + w * 0.75} cy={y + h * 0.92} rx={w * 0.22} ry={h * 0.08} fill="#111" />
              <rect x={x + w * 0.15} y={y + h * 0.35} width={w * 0.7} height={h * 0.55} rx="6" fill={fill} />
              <ellipse cx={x + w * 0.5} cy={y + h * 0.28} rx={w * 0.2} ry={h * 0.15} fill="#d4a574" />
            </g>
          );
        }
        return (
          <g key={b.key}>
            <rect x={x} y={y} width={w} height={h} rx="10" fill={fill} />
            <rect x={x + w * 0.1} y={y + h * 0.12} width={w * 0.8} height={h * 0.35} rx="4" fill="#93c5fd" opacity="0.5" />
            <rect x={x + w * 0.35} y={y + h * 0.88} width={w * 0.3} height={h * 0.08} rx="2" fill="#f8fafc" />
          </g>
        );
      })}

      {/* rain overlay */}
      {rain && (
        <g opacity="0.25" filter="url(#rainBlur)">
          {Array.from({ length: 80 }).map((_, i) => (
            <line key={i}
              x1={(i * 47) % 960} y1={(i * 23) % 540}
              x2={(i * 47 + 8) % 960} y2={(i * 23 + 18) % 540}
              stroke="#94a3b8" strokeWidth="1" />
          ))}
        </g>
      )}

      {/* low-light vignette */}
      {lowLight && (
        <rect width="960" height="540" fill="url(#skyGrad)" opacity="0.35" />
      )}

      {/* scanline subtle CCTV effect */}
      <g opacity="0.04">
        {Array.from({ length: 27 }).map((_, i) => (
          <line key={i} x1="0" y1={i * 20} x2="960" y2={i * 20} stroke="#fff" strokeWidth="1" />
        ))}
      </g>
    </svg>
  );
}
