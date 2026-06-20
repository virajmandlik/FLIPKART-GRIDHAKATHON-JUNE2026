// ui.tsx
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

export function Reveal({ children, delay = 0, y = 28 }: { children: ReactNode; delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
      <span className="h-px w-4 bg-saffron/70" />
      {children}
    </span>
  );
}

export function SectionTitle({ kicker, title, sub }: { kicker: string; title: ReactNode; sub?: string }) {
  return (
    <div className="max-w-3xl">
      <Reveal><Eyebrow>{kicker}</Eyebrow></Reveal>
      <Reveal delay={0.05}>
        <h2 className="mt-5 text-3xl sm:text-4xl lg:text-[3.25rem] font-bold leading-[1.08] tracking-tight text-white">
          {title}
        </h2>
      </Reveal>
      {sub && (
        <Reveal delay={0.1}>
          <p className="mt-5 text-base sm:text-lg text-slate-400/90 leading-relaxed">{sub}</p>
        </Reveal>
      )}
    </div>
  );
}

export function Counter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: 1600, bounce: 0 });

  useEffect(() => { if (inView) mv.set(value); }, [inView, value, mv]);
  useEffect(() =>
    spring.on("change", (v) => {
      if (ref.current) ref.current.textContent = `${prefix}${Math.round(v).toLocaleString()}${suffix}`;
    }), [spring, prefix, suffix]);

  return <span ref={ref}>{prefix}0{suffix}</span>;
}

export function Pill({ children, tone = "cyan" }: { children: ReactNode; tone?: "cyan" | "amber" | "ok" | "danger" }) {
  const map = {
    cyan: "text-teal-light bg-teal/[0.08]",
    amber: "text-saffron-light bg-saffron/[0.08]",
    ok: "text-ok bg-ok/[0.08]",
    danger: "text-danger bg-danger/[0.08]",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide ${map[tone]}`}>
      {children}
    </span>
  );
}