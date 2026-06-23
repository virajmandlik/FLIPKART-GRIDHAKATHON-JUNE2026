import { Radar, Cpu } from "lucide-react";

const STACK = ["React", "TypeScript", "Tailwind", "Framer Motion", "YOLO11", "BoT-SORT", "Kafka", "Kubernetes", "Jetson Orin"];

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.08] py-14">
      <div className="section-pad">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-brand/15 ring-1 ring-amber-brand/40">
                <Radar className="h-5 w-5 text-amber-brand" />
              </span>
              <span className="text-lg font-extrabold text-white">Drish<span className="text-amber-brand">aak</span></span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
              Responsible Edge Enforcement for Bengaluru Traffic Police. A privacy-first,
              legally-admissible computer-vision pipeline. Built for Flipkart Gridlock
              Hackathon 2.0 · Problem Statement 3.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-lg glass px-3 py-2 text-xs text-slate-400">
              <Cpu className="h-4 w-4 text-cyan-tech" />
              Prototype UI · detections simulated · evidence/privacy logic is real
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Tech stack</h4>
            <div className="mt-4 flex flex-wrap gap-2">
              {STACK.map((t) => (
                <span key={t} className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-xs text-slate-300 ring-1 ring-white/[0.06]">{t}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-white/[0.06] pt-6 text-xs text-slate-500 sm:flex-row sm:items-center">
          <span>© 2026 Drishaak · Viraj's Team</span>
          <span className="font-mono">Edge-first · Human-in-the-loop · DPDP + BSA compliant</span>
        </div>
      </div>
    </footer>
  );
}
