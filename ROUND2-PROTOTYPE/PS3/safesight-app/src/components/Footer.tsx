// Footer.tsx
import { Radar } from "lucide-react";

const STACK = ["React", "TypeScript", "Tailwind", "Framer Motion", "RT-DETRv2 (Apache-2.0)", "BoT-SORT", "Kafka", "Kubernetes", "Jetson Orin"];

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.07] py-14">
      <div className="section-pad">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <Radar className="h-5 w-5 text-saffron" />
              <span className="text-lg font-semibold text-white">SafeSight<span className="text-saffron"> EN</span></span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
              Responsible edge enforcement for Bengaluru Traffic Police — a privacy-first,
              legally-admissible computer-vision pipeline. Built by Team SHASHWAT for
              Flipkart Gridlock Hackathon 2.0, Problem Statement 3.
            </p>
            <p className="mt-5 text-xs text-slate-500">
              Prototype UI · detections simulated · evidence &amp; privacy logic is real.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Tech stack</h4>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400">
              {STACK.map((t) => <span key={t}>{t}</span>)}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-white/[0.07] pt-6 text-xs text-slate-500 sm:flex-row sm:items-center">
          <span>© 2026 SafeSight EN · Team SHASHWAT</span>
          <span className="font-mono">Edge-first · Human-in-the-loop · DPDP + BSA compliant</span>
        </div>
      </div>
    </footer>
  );
}