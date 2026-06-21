import { motion } from "framer-motion";
import { STEPS } from "../data/pipeline";
import { Cpu, Cloud } from "lucide-react";

// Literal class maps (Tailwind JIT cannot see interpolated class names).
const TONE = {
  edge: {
    border: "border-cyan-tech", bgSoft: "bg-cyan-tech/10", bgIcon: "bg-cyan-tech/20",
    text: "text-cyan-tech", dot: "bg-cyan-tech", line: "bg-cyan-tech",
  },
  cloud: {
    border: "border-amber-brand", bgSoft: "bg-amber-brand/10", bgIcon: "bg-amber-brand/20",
    text: "text-amber-brand", dot: "bg-amber-brand", line: "bg-amber-brand",
  },
} as const;

export default function BackStage({ active }: { active: number }) {
  return (
    <div className="rounded-2xl glass p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-amber-brand">
          Back-stage · what the system does
        </span>
        <div className="flex items-center gap-3 text-[10px] font-semibold">
          <span className="inline-flex items-center gap-1 text-cyan-tech"><Cpu className="h-3 w-3" /> Edge node</span>
          <span className="inline-flex items-center gap-1 text-amber-brand"><Cloud className="h-3 w-3" /> Cloud</span>
        </div>
      </div>

      <div className="flex items-stretch gap-1 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const done = i < active;
          const isActive = i === active;
          const t = TONE[s.tier];
          const boundary = i === 7; // edge -> cloud egress

          return (
            <div key={s.id} className="flex items-stretch">
              {boundary && (
                <div className="mx-1 flex flex-col items-center justify-center px-1">
                  <div className="h-full w-px bg-gradient-to-b from-transparent via-white/30 to-transparent" />
                </div>
              )}
              <motion.div
                animate={{ scale: isActive ? 1.04 : 1, opacity: done || isActive ? 1 : 0.45 }}
                transition={{ duration: 0.3 }}
                className={`relative flex w-[94px] shrink-0 flex-col items-center rounded-xl border px-2 py-3 text-center
                  ${isActive ? `${t.border} ${t.bgSoft}` : done ? "border-white/15 bg-white/5" : "border-white/[0.08] bg-transparent"}`}
              >
                <span className={`grid h-9 w-9 place-items-center rounded-lg ${isActive ? t.bgIcon : "bg-white/5"}`}>
                  <s.icon className={`h-4 w-4 ${isActive ? t.text : done ? "text-slate-200" : "text-slate-500"}`} />
                </span>
                <span className="mt-2 text-[10px] font-bold leading-tight text-white">{s.short}</span>
                <span className="mt-0.5 text-[8px] leading-tight text-slate-500">{s.service.split(" ")[0]}</span>
                {isActive && (
                  <motion.span layoutId="active-dot" className={`absolute -bottom-1 h-1.5 w-1.5 rounded-full ${t.dot}`} />
                )}
                {i < STEPS.length - 1 && (
                  <span className={`absolute right-[-5px] top-1/2 h-px w-[6px] ${done ? t.line : "bg-white/10"}`} />
                )}
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
