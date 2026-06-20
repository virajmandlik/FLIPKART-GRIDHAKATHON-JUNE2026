// BackStage.tsx
import { motion } from "framer-motion";
import { STEPS } from "../data/pipeline";
import { Cpu, Cloud } from "lucide-react";

const TONE = {
  edge: { bg: "bg-teal/10", text: "text-teal", dot: "bg-teal" },
  cloud: { bg: "bg-saffron/10", text: "text-saffron", dot: "bg-saffron" },
} as const;

export default function BackStage({ active }: { active: number }) {
  return (
    <div className="border-t border-white/[0.07] pt-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Back-stage · what the system does
        </span>
        <div className="flex items-center gap-3 text-[10px] font-medium">
          <span className="inline-flex items-center gap-1 text-teal"><Cpu className="h-3 w-3" /> Edge node</span>
          <span className="inline-flex items-center gap-1 text-saffron"><Cloud className="h-3 w-3" /> Cloud</span>
        </div>
      </div>

      <div className="flex items-stretch gap-1 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const done = i < active;
          const isActive = i === active;
          const t = TONE[s.tier];
          const boundary = i === 7;

          return (
            <div key={s.id} className="flex items-stretch">
              {boundary && (
                <div className="mx-1 flex flex-col items-center justify-center px-1">
                  <div className="h-full w-px bg-white/15" />
                </div>
              )}
              <motion.div
                animate={{ opacity: done || isActive ? 1 : 0.4 }}
                transition={{ duration: 0.3 }}
                className={`relative flex w-[90px] shrink-0 flex-col items-center rounded-lg px-2 py-3 text-center ${isActive ? t.bg : ""}`}
              >
                <s.icon className={`h-4 w-4 ${isActive ? t.text : done ? "text-slate-300" : "text-slate-600"}`} />
                <span className="mt-2 text-[10px] font-semibold leading-tight text-white">{s.short}</span>
                <span className="mt-0.5 text-[8px] leading-tight text-slate-500">{s.service.split(" ")[0]}</span>
                {isActive && (
                  <motion.span layoutId="active-dot" className={`absolute -bottom-1 h-1.5 w-1.5 rounded-full ${t.dot}`} />
                )}
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}