import { useCallback, useRef, useState } from "react";
import { m } from "framer-motion";
import { GripVertical } from "lucide-react";
import type { Scenario } from "../../data/scenarios";
import ScenarioFrame from "./ScenarioFrame";

interface Props {
  beforeImage?: string;
  afterImage?: string;
  scenario?: Scenario;
  beforeLabel?: string;
  afterLabel?: string;
  beforeScore?: number;
  afterScore?: number;
  beforeFilter?: string;
  afterFilter?: string;
}

export default function BeforeAfterSlider({
  beforeImage = "",
  afterImage = "",
  scenario,
  beforeLabel = "Before · raw",
  afterLabel = "After · enhanced",
  beforeScore,
  afterScore,
  beforeFilter = "brightness-75 blur-[1px] contrast-90",
  afterFilter = "brightness-110 contrast-110 saturate-110",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const dragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    setPosition(pct);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    updatePosition(e.clientX);
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
      <div
        ref={containerRef}
        className="relative aspect-video cursor-ew-resize select-none"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* After (full width, underneath) */}
        {scenario ? (
          <ScenarioFrame scenario={scenario} className="absolute inset-0 h-full w-full" filterClass={afterFilter} />
        ) : (
          <img
            src={afterImage}
            alt={afterLabel}
            className={`absolute inset-0 h-full w-full object-cover ${afterFilter}`}
            draggable={false}
          />
        )}
        {/* Before (clipped) */}
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
          {scenario ? (
            <div className="h-full" style={{ width: containerRef.current?.offsetWidth ?? "100%" }}>
              <ScenarioFrame scenario={scenario} className="h-full w-full" filterClass={beforeFilter} />
            </div>
          ) : (
            <img
              src={beforeImage}
              alt={beforeLabel}
              className={`h-full w-full object-cover ${beforeFilter}`}
              style={{ width: containerRef.current?.offsetWidth ?? "100%" }}
              draggable={false}
            />
          )}
        </div>

        {/* Divider handle */}
        <div
          className="absolute inset-y-0 z-10 w-1 -translate-x-1/2 bg-white shadow-lg"
          style={{ left: `${position}%` }}
        >
          <m.button
            type="button"
            onPointerDown={onPointerDown}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-ink-950 shadow-xl ring-2 ring-teal/50"
            aria-label="Drag to compare before and after"
          >
            <GripVertical className="h-5 w-5" />
          </m.button>
        </div>

        <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-ink-950/80 px-2 py-1 text-[10px] font-bold text-traffic-amber">
          {beforeLabel}
          {beforeScore !== undefined && ` · ${(beforeScore * 100).toFixed(0)}%`}
        </div>
        <div className="pointer-events-none absolute right-3 top-3 rounded-lg bg-ink-950/80 px-2 py-1 text-[10px] font-bold text-ok">
          {afterLabel}
          {afterScore !== undefined && ` · ${(afterScore * 100).toFixed(0)}%`}
        </div>
      </div>
      <p className="border-t border-white/5 px-4 py-2 text-center text-[10px] text-slate-500">
        Drag slider · Restormer + Real-ESRGAN enhancement path
      </p>
    </div>
  );
}
