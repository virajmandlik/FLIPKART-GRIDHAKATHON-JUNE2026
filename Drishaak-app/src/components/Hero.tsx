import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ShieldCheck, ScanEye, ChevronDown } from "lucide-react";
import { Counter, Pill } from "./ui";
import { heroStats } from "../data/mockApi";

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section id="top" ref={ref} className="relative min-h-screen w-full overflow-hidden">
      {/* background image */}
      <motion.div style={{ y, scale }} className="absolute inset-0">
        <img src="/hero-junction.png" alt="Bengaluru junction under CCTV" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/70 via-ink-950/50 to-ink-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/80 to-transparent" />
      </motion.div>

      {/* scanning line */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
        <div className="absolute left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-tech to-transparent animate-scan" />
      </div>

      <motion.div style={{ opacity: fade }} className="relative z-10 section-pad flex min-h-screen flex-col justify-center pt-28 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="ok"><span className="h-1.5 w-1.5 rounded-full bg-ok animate-pulseSoft" /> System online</Pill>
            <Pill tone="amber">Flipkart Gridlock 2.0 · PS3</Pill>
            <Pill tone="cyan">Bengaluru Traffic Police</Pill>
          </div>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-6 max-w-4xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
          Traffic violations, caught fairly.<br />
          <span className="text-gradient">Evidence that holds up in court.</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
          Drishaak turns ordinary CCTV into a <span className="text-white font-semibold">privacy-first, legally-admissible</span> enforcement
          pipeline — detection at the edge, a human in the loop, and a tamper-proof evidence trail. Watch the full journey, front-stage and back-stage.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-9 flex flex-wrap gap-3">
          <a href="#pipeline" className="inline-flex items-center gap-2 rounded-xl bg-amber-brand px-6 py-3 text-base font-bold text-ink-950 transition hover:brightness-110 glow-amber">
            <ScanEye className="h-5 w-5" /> Watch the pipeline
          </a>
          <a href="#edge" className="inline-flex items-center gap-2 rounded-xl glass px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10">
            <ShieldCheck className="h-5 w-5 text-cyan-tech" /> Why it is admissible
          </a>
        </motion.div>

        {/* stat strip */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl glass sm:grid-cols-4">
          {heroStats.map((s) => (
            <div key={s.label} className="bg-ink-900/40 px-5 py-5">
              <div className="text-3xl font-extrabold text-white">
                <Counter value={s.value} prefix={s.prefix} suffix={s.suffix} />
              </div>
              <div className="mt-1 text-xs text-slate-400">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-slate-500">
        <ChevronDown className="h-6 w-6 animate-bounce" />
      </div>
    </section>
  );
}
