import { useState } from "react";
import { SCENARIOS } from "../data/scenarios";

/**
 * DEV-ONLY calibration overlay (visit /#calib).
 * Shows each real frame with a percentage grid + the current box coords,
 * so bounding boxes can be re-measured against the actual photos.
 */
export default function CalibrationOverlay() {
  const [idx, setIdx] = useState(0);
  const s = SCENARIOS[idx];

  const major = Array.from({ length: 11 }, (_, i) => i * 10); // 0,10,...100

  return (
    <div className="min-h-screen bg-black p-4 text-white">
      <div className="mb-3 flex flex-wrap gap-2">
        {SCENARIOS.map((sc, i) => (
          <button
            key={sc.id}
            type="button"
            onClick={() => setIdx(i)}
            className={`rounded px-3 py-1.5 text-xs font-bold ${i === idx ? "bg-ss-gold text-black" : "bg-white/10 text-white"}`}
          >
            {sc.id}
          </button>
        ))}
      </div>

      <div className="text-sm font-bold">
        {s.id} — {s.title}
      </div>

      <div className="relative mt-2 h-[62vh] w-[93vh] max-w-full">
        <img src={s.image} alt={s.id} className="absolute inset-0 h-full w-full object-cover" draggable={false} />

        {/* grid */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {Array.from({ length: 21 }, (_, i) => i * 5).map((p) => (
            <g key={`v${p}`}>
              <line x1={p} y1={0} x2={p} y2={100} stroke={p % 10 === 0 ? "rgba(255,255,0,0.5)" : "rgba(255,255,0,0.18)"} strokeWidth={0.15} />
              <line x1={0} y1={p} x2={100} y2={p} stroke={p % 10 === 0 ? "rgba(0,255,255,0.5)" : "rgba(0,255,255,0.18)"} strokeWidth={0.15} />
            </g>
          ))}
        </svg>

        {/* axis labels */}
        {major.map((p) => (
          <span key={`tx${p}`} className="absolute -top-4 text-[9px] text-yellow-300" style={{ left: `${p}%` }}>
            {p}
          </span>
        ))}
        {major.map((p) => (
          <span key={`ty${p}`} className="absolute -left-5 text-[9px] text-cyan-300" style={{ top: `${p}%` }}>
            {p}
          </span>
        ))}

        {/* current boxes */}
        {s.boxes.map((b) => (
          <div
            key={b.key}
            className={`absolute border ${b.kind === "violator" ? "border-red-500" : "border-white/70"}`}
            style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
          >
            <span className="absolute -top-4 left-0 bg-red-500/80 px-1 text-[8px] text-black">{b.label}</span>
          </div>
        ))}
        {s.headBox && (
          <div className="absolute border-2 border-green-400" style={{ left: `${s.headBox.x}%`, top: `${s.headBox.y}%`, width: `${s.headBox.w}%`, height: `${s.headBox.h}%` }}>
            <span className="absolute -bottom-4 left-0 bg-green-400 px-1 text-[8px] text-black">head</span>
          </div>
        )}
        {s.violatorPlate && (
          <div className="absolute border-2 border-amber-400" style={{ left: `${s.violatorPlate.x}%`, top: `${s.violatorPlate.y}%`, width: `${s.violatorPlate.w}%`, height: `${s.violatorPlate.h}%` }}>
            <span className="absolute -bottom-4 left-0 bg-amber-400 px-1 text-[8px] text-black">plate</span>
          </div>
        )}
      </div>

      <pre className="mt-6 max-w-[960px] overflow-auto rounded bg-white/5 p-3 text-[10px] text-green-300">
        {JSON.stringify(
          { boxes: s.boxes.map((b) => ({ key: b.key, x: b.x, y: b.y, w: b.w, h: b.h })), headBox: s.headBox, violatorPlate: s.violatorPlate },
          null,
          1,
        )}
      </pre>
    </div>
  );
}
