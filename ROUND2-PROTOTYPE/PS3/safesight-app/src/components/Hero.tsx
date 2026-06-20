import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, ShieldCheck, ChevronDown } from "lucide-react";
import { Counter, Eyebrow } from "./ui";
import { heroStats } from "../data/mockApi";

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  return (
    <section
      id="top"
      ref={ref}
      className="relative min-h-screen w-full overflow-hidden"
    >
      <motion.div style={{ y, scale }} className="absolute inset-0">
        <img
          src="/hero-junction.png"
          alt="Bengaluru junction under CCTV"
          className="h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/75 via-ink-950/55 to-ink-950" />

        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/85 via-ink-950/30 to-transparent" />
      </motion.div>

      <motion.div
        style={{ opacity: fade }}
        className="relative z-10 section-pad flex min-h-screen flex-col justify-center pt-28 pb-16"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Eyebrow>SHASHWAT · Bengaluru Traffic Police</Eyebrow>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="mt-7 max-w-4xl text-4xl font-semibold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-7xl"
        >
          Every violation, seen fairly.
          <br />
          <span className="text-saffron">
            Every challan, defensible.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16 }}
          className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300/90"
        >
          SafeSight EN turns ordinary CCTV into a privacy-first enforcement
          pipeline — detection at the edge, an officer in the loop, evidence
          that holds up in court.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24 }}
          className="mt-10 flex flex-wrap items-center gap-5"
        >
          <a
            href="#pipeline"
            className="inline-flex items-center gap-2 rounded-full bg-saffron px-6 py-3 text-sm font-semibold text-ink-950 transition hover:brightness-105"
          >
            Watch the pipeline
            <ArrowRight className="h-4 w-4" />
          </a>

          <a
            href="#edge"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white"
          >
            <ShieldCheck className="h-4 w-4 text-teal" />
            Why it&apos;s admissible
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.32 }}
          className="mt-16 flex max-w-2xl flex-wrap gap-x-10 gap-y-6 border-t border-white/[0.08] pt-8"
        >
          {heroStats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-semibold text-white">
                <Counter
                  value={s.value}
                  prefix={s.prefix}
                  suffix={s.suffix}
                />
              </div>

              <div className="mt-1 text-xs text-slate-500">
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-slate-500/70">
        <ChevronDown className="h-5 w-5" />
      </div>
    </section>
  );
}