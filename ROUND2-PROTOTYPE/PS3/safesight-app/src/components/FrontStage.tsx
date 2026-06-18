import { AnimatePresence, motion } from "framer-motion";
import { Circle, ShieldCheck, Lock, BadgeCheck, Send, ShieldAlert } from "lucide-react";
import type { OverlayKey } from "../data/pipeline";
import type { Scenario } from "../data/scenarios";

const has = (r: OverlayKey[], k: OverlayKey) => r.includes(k);
const pct = (b: { x: number; y: number; w: number; h: number }) => ({
  left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%`,
});

export default function FrontStage({
  reveal,
  stepId,
  scenario,
  compact = false,
}: {
  reveal: OverlayKey[];
  stepId: string;
  scenario: Scenario;
  compact?: boolean;
}) {
  const badgeColor = scenario.isViolation ? "bg-danger glow-danger" : "bg-ok glow-cyan";
  const BadgeIcon = scenario.isViolation ? ShieldCheck : ShieldAlert;

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl ring-1 ring-white/10 ${compact ? "aspect-[16/10]" : "aspect-[3/2]"}`}>
      <img
        src={scenario.image}
        alt={`CCTV — ${scenario.title}`}
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      {/* CCTV film grain + vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.45)_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.15) 2px,rgba(255,255,255,0.15) 4px)" }} />
      <div className="absolute inset-0 bg-ink-950/5" />

      {/* HUD */}
      <div className="absolute left-3 top-3 flex items-center gap-2 rounded-lg bg-ink-950/70 px-2.5 py-1.5 backdrop-blur">
        <Circle className="h-2.5 w-2.5 animate-pulseSoft fill-danger text-danger" />
        <span className="font-mono text-[11px] font-semibold text-white">REC · {scenario.cameraId}</span>
      </div>
      <div className="absolute right-3 top-3 rounded-lg bg-ink-950/70 px-2.5 py-1.5 font-mono text-[11px] text-slate-300 backdrop-blur">
        {scenario.timestamp}
      </div>
      {!compact && (
        <div className="absolute bottom-3 left-3 rounded-lg bg-ink-950/70 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-cyan-tech backdrop-blur">
          Front-stage · what the officer sees
        </div>
      )}

      {/* stop line */}
      <AnimatePresence>
        {has(reveal, "violation") && scenario.stoplineY !== undefined && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute left-[28%] right-[8%] border-t-2 border-dashed border-amber-brand"
            style={{ top: `${scenario.stoplineY}%` }}
          >
            <span className="absolute -top-5 left-0 rounded bg-amber-brand/90 px-1.5 py-0.5 text-[9px] font-bold text-ink-950">
              STOP LINE
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* parking zone overlay */}
      <AnimatePresence>
        {has(reveal, "violation") && scenario.parkingZone && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute rounded border-2 border-dashed border-danger/80"
            style={pct(scenario.parkingZone)}
          >
            <span className="absolute -top-5 left-0 rounded bg-danger/90 px-1.5 py-0.5 text-[9px] font-bold text-white">
              NO PARK · 3m 14s
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* red light indicator */}
      <AnimatePresence>
        {has(reveal, "violation") && scenario.redLightOn && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute right-4 top-14 flex items-center gap-1.5 rounded-lg bg-danger/90 px-2 py-1">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
            <span className="text-[10px] font-bold text-white">SIGNAL RED</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* detection boxes */}
      <AnimatePresence>
        {has(reveal, "boxes") && scenario.boxes.map((b, i) => (
          <motion.div
            key={b.key}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ delay: i * 0.12, duration: 0.35 }}
            className={`absolute rounded-md border-2 ${b.kind === "violator" ? "border-danger glow-danger" : "border-cyan-tech/70"}`}
            style={pct(b)}
          >
            <span className={`absolute -top-[18px] left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] font-bold ${b.kind === "violator" ? "bg-danger text-white" : "bg-cyan-tech/90 text-ink-950"}`}>
              {b.label}{has(reveal, "track") && ` · ${b.track}`}
              {b.confidence !== undefined && b.kind === "violator" && ` · ${b.confidence.toFixed(2)}`}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* headwear classifier */}
      <AnimatePresence>
        {has(reveal, "helmet") && scenario.headBox && scenario.headwear && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute" style={pct(scenario.headBox)}>
            <div className={`absolute inset-0 rounded border ${scenario.headwearFair ? "border-ok" : "border-danger"}`} />
            <span className={`absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] font-bold ${scenario.headwearFair ? "bg-ok text-ink-950" : "bg-danger text-white"}`}>
              {scenario.headwear === "Pagdi" ? "Pagdi ✓ (exempt)" :
               scenario.headwear === "Helmet" ? "Helmet ✓ (fair)" : "No helmet ✗"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* violation badge */}
      <AnimatePresence>
        {has(reveal, "violation") && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className={`absolute right-3 flex items-center gap-2 rounded-lg px-3 py-2 text-white ${badgeColor} ${scenario.redLightOn ? "top-24" : "top-16"}`}>
            <BadgeIcon className="h-4 w-4" />
            <div className="leading-tight">
              <div className="text-xs font-extrabold">{scenario.violationBadge}</div>
              <div className="text-[10px] opacity-90">confidence {(scenario.violationConfidence * 100).toFixed(0)}%</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ANPR */}
      <AnimatePresence>
        {has(reveal, "plate") && scenario.violatorPlate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute" style={pct(scenario.violatorPlate)}>
            <div className="absolute inset-0 rounded border-2 border-amber-brand" />
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-amber-brand px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink-950">
              {scenario.plate} {scenario.plateValid ? "✓" : "?"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* privacy blur */}
      <AnimatePresence>
        {has(reveal, "blur") && (
          <>
            {[...scenario.blurFaces, ...scenario.blurPlates].map((b, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute rounded backdrop-blur-md bg-ink-950/30 ring-1 ring-cyan-tech/50" style={pct(b)}>
                <Lock className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 text-cyan-tech" />
              </motion.div>
            ))}
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute bottom-3 right-3 rounded bg-cyan-tech/15 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-cyan-tech ring-1 ring-cyan-tech/40">
              DPDP · faces + bystander plates blurred
            </motion.span>
          </>
        )}
      </AnimatePresence>

      {/* hash strip */}
      <AnimatePresence>
        {has(reveal, "hash") && !compact && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute inset-x-3 bottom-12 rounded-lg bg-ink-950/85 p-2.5 backdrop-blur ring-1 ring-amber-brand/30">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-brand">
              <Lock className="h-3 w-3" /> SHA-256 sealed
            </div>
            <div className="mt-1 break-all font-mono text-[9px] leading-tight text-slate-400">
              {scenario.evidence.frameSha256}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* approve */}
      <AnimatePresence>
        {has(reveal, "approve") && scenario.isViolation && (
          <motion.div initial={{ opacity: 0, rotate: -12, scale: 1.4 }} animate={{ opacity: 1, rotate: -8, scale: 1 }} exit={{ opacity: 0 }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="flex items-center gap-2 rounded-xl border-2 border-ok px-4 py-2 text-ok glow-cyan">
              <BadgeCheck className="h-6 w-6" />
              <span className="text-lg font-black uppercase tracking-widest">Approved</span>
            </div>
          </motion.div>
        )}
        {has(reveal, "approve") && !scenario.isViolation && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="flex items-center gap-2 rounded-xl border-2 border-ok px-4 py-2 text-ok glow-cyan">
              <BadgeCheck className="h-6 w-6" />
              <span className="text-lg font-black uppercase tracking-widest">Auto-cleared</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* challan */}
      <AnimatePresence>
        {has(reveal, "challan") && scenario.isViolation && (
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="absolute right-3 bottom-12 flex items-center gap-2 rounded-lg bg-ok px-3 py-2 text-ink-950">
            <Send className="h-4 w-4" />
            <span className="text-xs font-extrabold">e-Challan sent · Parivahan</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* preprocessing badge (low-light scenario) */}
      {scenario.lowLight && stepId === "ingest" && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-cyan-tech/20 px-4 py-2 ring-1 ring-cyan-tech/50 backdrop-blur">
          <span className="text-sm font-bold text-cyan-tech">CLAHE + denoise active</span>
        </div>
      )}
    </div>
  );
}
