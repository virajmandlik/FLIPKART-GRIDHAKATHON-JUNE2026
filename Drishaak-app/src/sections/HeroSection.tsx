import { m, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Play, ShieldCheck } from "lucide-react";
import { Chip } from "./_ui";

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.18]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section id="hero" ref={ref} className="relative flex min-h-[100svh] items-center overflow-hidden">
      {/* Background — slow Bengaluru aerial */}
      <m.div className="absolute inset-0" style={{ y: bgY, scale: bgScale }}>
        <img
          src="/hero-junction.png"
          alt="Bengaluru junction aerial"
          className="h-full w-full object-cover opacity-[0.62]"
          draggable={false}
        />
        {/* readability scrim — kept on the left where the text sits, lighter on the right */}
        <div className="absolute inset-0 bg-gradient-to-r from-ss-bg via-ss-bg/70 to-ss-bg/25" />
        <div className="absolute inset-0 bg-gradient-to-b from-ss-bg/50 via-transparent to-ss-bg" />
        <div className="absolute inset-0 bg-ss-bg/15" />
      </m.div>

      {/* Subtle moving grain line */}
      <div className="ss-dots pointer-events-none absolute inset-0 opacity-40" />

      <m.div style={{ opacity: fade }} className="ss-pad relative z-10 pt-24">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <Chip tone="gold">
            <ShieldCheck className="h-3.5 w-3.5" /> Responsible AI enforcement · Bengaluru
          </Chip>
        </m.div>

        <m.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="ss-display mt-7 max-w-4xl text-5xl leading-[1.02] sm:text-6xl lg:text-7xl"
        >
          Traffic violations,
          <br />
          <span className="ss-gold-text">caught fairly.</span>
        </m.h1>

        <m.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-ss-muted sm:text-xl"
        >
          Evidence that holds up in court. Drishaak transforms ordinary CCTV footage into
          explainable, court-ready traffic enforcement intelligence.
        </m.p>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.34 }}
          className="mt-10 flex flex-wrap items-center gap-3"
        >
          <button type="button" onClick={() => scrollToId("journey")} className="ss-btn-gold group">
            <Play className="h-4 w-4 fill-black" />
            Watch one violation journey
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <button type="button" onClick={() => scrollToId("problem")} className="ss-btn-ghost">
            See the problem
          </button>
        </m.div>

        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-16 flex flex-wrap items-center gap-x-8 gap-y-3 text-[13px] text-ss-muted/80"
        >
          {[
            "5-layer edge-to-court pipeline",
            "Explainable decisions",
            "BSA 2023 admissible evidence",
            "Officer-in-the-loop",
          ].map((t) => (
            <span key={t} className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-ss-green" />
              {t}
            </span>
          ))}
        </m.div>
      </m.div>

      {/* Scroll hint */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
      >
        <div className="flex h-9 w-5 items-start justify-center rounded-full border border-white/15 p-1">
          <m.span
            className="h-1.5 w-1 rounded-full bg-white/60"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
        </div>
      </m.div>
    </section>
  );
}
