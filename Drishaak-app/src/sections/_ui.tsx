import { m, useInView, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

/* ----------------------------------------------------------------- */
/* Scroll reveal — subtle Apple-style fade + rise                     */
/* ----------------------------------------------------------------- */
export function Reveal({
  children,
  delay = 0,
  y = 26,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-90px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}

/* ----------------------------------------------------------------- */
/* Kicker / eyebrow label                                             */
/* ----------------------------------------------------------------- */
export function Kicker({ children }: { children: ReactNode }) {
  return (
    <span className="ss-kicker">
      <span className="ss-kicker-dot" />
      {children}
    </span>
  );
}

/* ----------------------------------------------------------------- */
/* Section header                                                     */
/* ----------------------------------------------------------------- */
export function SectionHead({
  kicker,
  title,
  sub,
  center = false,
}: {
  kicker: string;
  title: ReactNode;
  sub?: ReactNode;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <Reveal>
        <Kicker>{kicker}</Kicker>
      </Reveal>
      <Reveal delay={0.05}>
        <h2 className="ss-display mt-5 text-3xl leading-[1.05] sm:text-4xl lg:text-5xl">{title}</h2>
      </Reveal>
      {sub && (
        <Reveal delay={0.1}>
          <p className={`mt-5 text-base leading-relaxed text-ss-muted sm:text-lg ${center ? "mx-auto" : ""}`}>
            {sub}
          </p>
        </Reveal>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- */
/* Animated number counter                                            */
/* ----------------------------------------------------------------- */
export function Counter({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: 1700, bounce: 0 });

  useEffect(() => {
    if (inView) mv.set(value);
  }, [inView, value, mv]);

  useEffect(
    () =>
      spring.on("change", (v) => {
        if (ref.current) {
          const n = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString();
          ref.current.textContent = `${prefix}${n}${suffix}`;
        }
      }),
    [spring, prefix, suffix, decimals],
  );

  return (
    <span ref={ref}>
      {prefix}0{suffix}
    </span>
  );
}

/* ----------------------------------------------------------------- */
/* Small status chip                                                  */
/* ----------------------------------------------------------------- */
export function Chip({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "gold" | "green" | "red";
}) {
  const map: Record<string, string> = {
    muted: "border-white/10 bg-white/[0.03] text-ss-muted",
    gold: "border-ss-gold/30 bg-ss-gold/10 text-ss-gold",
    green: "border-ss-green/30 bg-ss-green/10 text-ss-green",
    red: "border-ss-red/30 bg-ss-red/10 text-ss-red",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${map[tone]}`}>
      {children}
    </span>
  );
}
