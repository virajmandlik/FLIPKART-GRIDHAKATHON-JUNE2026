import { m, useInView } from "framer-motion";
import { useRef } from "react";

interface Props {
  value: number; // 0..1
  size?: number;
  label?: string;
  tone?: "green" | "gold" | "red";
}

const TONE: Record<string, string> = {
  green: "#7ED957",
  gold: "#F5B84A",
  red: "#FF5A5A",
};

export default function ConfidenceRing({ value, size = 116, label = "confidence", tone = "green" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.round(value * 100);

  return (
    <div ref={ref} className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <m.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={TONE[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={inView ? { strokeDashoffset: c - value * c } : {}}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-extrabold text-white">{pct}%</div>
        <div className="text-[10px] uppercase tracking-wide text-ss-muted">{label}</div>
      </div>
    </div>
  );
}
