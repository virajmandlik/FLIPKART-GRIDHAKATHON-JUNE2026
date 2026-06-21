import { useRef, useState } from "react";
import { m, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import {
  Radio,
  Sparkles,
  ScanSearch,
  FileCheck2,
  LayoutDashboard,
} from "lucide-react";
import { Kicker } from "./_ui";

const FRAME = "/scenarios/scenario-triple-riding.png";

const LAYERS = [
  {
    n: 1,
    icon: Radio,
    name: "Smart Ingestion",
    tag: "Layer 1",
    desc: "A frame is captured from the live RTSP feed — motion-scored, de-duplicated, stamped with time and GPS.",
  },
  {
    n: 2,
    icon: Sparkles,
    name: "Evidence Enhancement",
    tag: "Layer 2",
    desc: "Restormer + Real-ESRGAN restore the blurry frame. Quality jumps +116%, ready for analysis.",
  },
  {
    n: 3,
    icon: ScanSearch,
    name: "AI Violation Engine",
    tag: "Layer 3",
    desc: "Vehicle, riders, helmet and plate are detected. Rules + agentic validation confirm the violation.",
  },
  {
    n: 4,
    icon: FileCheck2,
    name: "Court-Ready Evidence",
    tag: "Layer 4",
    desc: "An annotated, hashed evidence packet is generated — timestamp, GPS, SHA-256, officer sign-off.",
  },
  {
    n: 5,
    icon: LayoutDashboard,
    name: "Command Intelligence",
    tag: "Layer 5",
    desc: "The violation feeds the city command center — heatmaps, repeat offenders, officer deployment.",
  },
];

/** Detection boxes (normalized %) shown from Layer 3 onward. */
const BOXES = [
  { x: 30, y: 30, w: 40, h: 55, label: "Motorcycle · 0.97", tone: "gold" },
  { x: 38, y: 14, w: 24, h: 30, label: "3 riders · 0.93", tone: "red" },
  { x: 40, y: 70, w: 20, h: 10, label: "KA01AB1234", tone: "green" },
];

export default function JourneySection() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const idx = Math.min(LAYERS.length - 1, Math.floor(v * LAYERS.length));
    setActive(idx);
  });

  // Frame visual transforms tied to scroll
  const brightness = useTransform(scrollYProgress, [0, 0.2, 0.4], [0.55, 0.6, 1.08]);
  const blur = useTransform(scrollYProgress, [0, 0.2, 0.4], [2.5, 2, 0]);
  const contrast = useTransform(scrollYProgress, [0, 0.4], [0.85, 1.12]);
  const filter = useTransform(
    [brightness, blur, contrast],
    ([b, bl, c]) => `brightness(${b}) blur(${bl}px) contrast(${c})`,
  );

  return (
    <section id="journey" ref={ref} className="relative" style={{ height: "520vh" }}>
      <div className="sticky top-0 flex min-h-[100svh] items-center overflow-hidden py-20">
        <div className="ss-pad w-full">
          <div className="mx-auto max-w-2xl text-center">
            <Kicker>One frame · end to end</Kicker>
            <h2 className="ss-display mt-5 text-3xl sm:text-5xl">
              Follow a single violation
              <br />
              through the <span className="ss-gold-text">entire pipeline.</span>
            </h2>
          </div>

          <div className="mt-12 grid items-center gap-10 lg:grid-cols-[1fr_1.15fr]">
            {/* Stepper */}
            <div className="order-2 lg:order-1">
              <div className="relative space-y-2">
                <div className="absolute bottom-3 left-[27px] top-3 w-px bg-white/10" />
                <m.div
                  className="absolute left-[27px] top-3 w-px bg-ss-gold"
                  style={{ height: useTransform(scrollYProgress, [0, 1], ["0%", "100%"]) }}
                />
                {LAYERS.map((l, i) => {
                  const on = i === active;
                  const done = i < active;
                  return (
                    <div
                      key={l.n}
                      className={`relative flex gap-4 rounded-2xl p-3 transition-colors duration-300 ${
                        on ? "bg-white/[0.04]" : ""
                      }`}
                    >
                      <span
                        className={`z-10 grid h-14 w-14 shrink-0 place-items-center rounded-xl border transition-all duration-300 ${
                          on
                            ? "border-ss-gold/50 bg-ss-gold/15 text-ss-gold shadow-[0_0_30px_-8px_rgba(245,184,74,0.6)]"
                            : done
                              ? "border-ss-green/30 bg-ss-green/10 text-ss-green"
                              : "border-white/10 bg-white/[0.02] text-ss-muted/60"
                        }`}
                      >
                        <l.icon className="h-6 w-6" />
                      </span>
                      <div className="min-w-0 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="ss-mono text-[11px] uppercase tracking-widest text-ss-muted/70">
                            {l.tag}
                          </span>
                        </div>
                        <div
                          className={`text-lg font-bold transition-colors ${
                            on ? "text-white" : "text-ss-muted"
                          }`}
                        >
                          {l.name}
                        </div>
                        <m.p
                          initial={false}
                          animate={{ opacity: on ? 1 : 0.45, height: "auto" }}
                          className="mt-1 text-sm leading-relaxed text-ss-muted"
                        >
                          {l.desc}
                        </m.p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Frame visual */}
            <div className="order-1 lg:order-2">
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/[0.06] bg-black/60 px-4 py-2.5">
                  <span className="ss-mono text-[11px] text-ss-muted/80">BLR_CAM_023 · Silk Board</span>
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-ss-red">
                    <span className="h-1.5 w-1.5 animate-pulseSoft rounded-full bg-ss-red" /> LIVE
                  </span>
                </div>

                <div className="relative aspect-[4/3]">
                  <m.img
                    src={FRAME}
                    alt="CCTV frame travelling through the pipeline"
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ filter }}
                    draggable={false}
                  />

                  {/* L1 scan line */}
                  {active === 0 && (
                    <m.div
                      className="absolute inset-x-0 h-px bg-ss-gold/80 shadow-[0_0_12px_2px_rgba(245,184,74,0.6)]"
                      animate={{ top: ["0%", "100%"] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
                    />
                  )}

                  {/* L2 enhancement badge */}
                  {active === 1 && (
                    <m.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-3 top-3 rounded-xl border border-ss-green/30 bg-black/70 px-3 py-2 text-right backdrop-blur"
                    >
                      <div className="text-lg font-extrabold text-ss-green">+116%</div>
                      <div className="text-[10px] uppercase tracking-wide text-ss-muted">quality restored</div>
                    </m.div>
                  )}

                  {/* L3+ detection boxes */}
                  {active >= 2 && (
                    <>
                      {BOXES.map((b, i) => (
                        <m.div
                          key={b.label}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.12 }}
                          className={`absolute rounded-md ${
                            b.tone === "red"
                              ? "border-2 border-ss-red"
                              : b.tone === "green"
                                ? "border-2 border-ss-green"
                                : "border-2 border-ss-gold"
                          }`}
                          style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
                        >
                          <span
                            className={`absolute -top-6 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold text-black ${
                              b.tone === "red" ? "bg-ss-red" : b.tone === "green" ? "bg-ss-green" : "bg-ss-gold"
                            }`}
                          >
                            {b.label}
                          </span>
                        </m.div>
                      ))}
                    </>
                  )}

                  {/* L3 violation verdict */}
                  {active === 2 && (
                    <m.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-3 left-3 rounded-xl border border-ss-red/30 bg-black/75 px-3 py-2 backdrop-blur"
                    >
                      <div className="text-[10px] uppercase tracking-wide text-ss-muted">Violation confirmed</div>
                      <div className="text-sm font-bold text-ss-red">Triple riding + No helmet · 96%</div>
                    </m.div>
                  )}

                  {/* L4 evidence stamp */}
                  {active === 3 && (
                    <m.div
                      initial={{ opacity: 0, rotate: -8, scale: 0.8 }}
                      animate={{ opacity: 1, rotate: -6, scale: 1 }}
                      className="absolute bottom-4 right-4 rounded-lg border-2 border-ss-green/70 px-3 py-1.5"
                    >
                      <div className="ss-mono text-[10px] font-bold uppercase tracking-widest text-ss-green">
                        Evidence sealed
                      </div>
                      <div className="ss-mono text-[8px] text-ss-muted">SHA-256 · b9f1…2a</div>
                    </m.div>
                  )}

                  {/* L5 command overlay */}
                  {active === 4 && (
                    <m.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 grid place-items-center bg-black/45 backdrop-blur-[2px]"
                    >
                      <div className="rounded-xl border border-ss-gold/30 bg-black/70 px-5 py-4 text-center">
                        <LayoutDashboard className="mx-auto h-7 w-7 text-ss-gold" />
                        <div className="mt-2 text-sm font-bold text-white">Routed to Command Center</div>
                        <div className="text-[11px] text-ss-muted">Silk Board · deploy 4 officers · 08:00–11:00</div>
                      </div>
                    </m.div>
                  )}

                  {/* progress dots */}
                  <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1.5 pb-2">
                    {LAYERS.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1 rounded-full transition-all ${
                          i === active ? "w-6 bg-ss-gold" : "w-1.5 bg-white/25"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-ss-muted/70">Scroll to advance the journey</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
