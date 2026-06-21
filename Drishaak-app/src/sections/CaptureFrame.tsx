import { m } from "framer-motion";
import { MapPin, Clock, Camera } from "lucide-react";
import type { Scenario } from "../data/scenarios";

interface Props {
  scenario: Scenario;
  className?: string;
}

/** Annotated CCTV capture for the selected scenario — detection boxes + highlights. */
export default function CaptureFrame({ scenario: s, className = "" }: Props) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-white/10 bg-black ${className}`}>
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-black/60 px-4 py-2.5">
        <span className="ss-mono inline-flex items-center gap-1.5 text-[11px] text-ss-muted/80">
          <Camera className="h-3.5 w-3.5" /> {s.cameraId}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-ss-red">
          <span className="h-1.5 w-1.5 animate-pulseSoft rounded-full bg-ss-red" /> CAPTURE
        </span>
      </div>

      <div className="relative aspect-[3/2]">
        <img src={s.image} alt={s.title} className="absolute inset-0 h-full w-full object-cover" draggable={false} />

        {/* detection boxes */}
        {s.boxes.map((b, i) => {
          const violator = b.kind === "violator";
          return (
            <m.div
              key={b.key}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 + i * 0.12 }}
              className={`absolute rounded-md ${violator ? "border-2 border-ss-red" : "border border-white/45"}`}
              style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
            >
              <span
                className={`absolute -top-5 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] font-bold ${
                  violator ? "bg-ss-red text-black" : "bg-white/80 text-black"
                }`}
              >
                {b.label}
                {b.confidence ? ` · ${Math.round(b.confidence * 100)}%` : ""}
              </span>
            </m.div>
          );
        })}

        {/* plate highlight */}
        {s.violatorPlate && (
          <m.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="absolute rounded-sm border-2 border-ss-gold"
            style={{
              left: `${s.violatorPlate.x}%`,
              top: `${s.violatorPlate.y}%`,
              width: `${s.violatorPlate.w}%`,
              height: `${s.violatorPlate.h}%`,
            }}
          />
        )}

        {/* head highlight */}
        {s.headBox && (
          <m.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className={`absolute rounded-sm border-2 ${s.headwear === "None" ? "border-ss-red" : "border-ss-green"}`}
            style={{
              left: `${s.headBox.x}%`,
              top: `${s.headBox.y}%`,
              width: `${s.headBox.w}%`,
              height: `${s.headBox.h}%`,
            }}
          />
        )}

        {/* verdict badge */}
        <div
          className={`absolute left-3 top-3 rounded-lg border px-3 py-1.5 backdrop-blur ${
            s.isViolation ? "border-ss-red/40 bg-black/70" : "border-ss-green/40 bg-black/70"
          }`}
        >
          <div className="text-[9px] uppercase tracking-wide text-ss-muted">
            {s.isViolation ? "Violation" : "Cleared"}
          </div>
          <div className={`text-sm font-bold ${s.isViolation ? "text-ss-red" : "text-ss-green"}`}>
            {s.violationBadge}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/[0.06] px-4 py-2.5 text-[11px] text-ss-muted">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3 text-ss-gold" /> {s.location}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3 text-ss-gold" /> {s.timestamp}
        </span>
      </div>
    </div>
  );
}
