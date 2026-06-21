import { m } from "framer-motion";
import { Check, ArrowRight, ShieldCheck } from "lucide-react";
import { Reveal } from "./_ui";

const PILLARS = [
  "AI detection",
  "Explainable decisions",
  "Court-ready evidence",
  "Officer deployment intelligence",
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function FinalSection() {
  return (
    <section id="final" className="relative overflow-hidden border-t border-white/[0.06] py-28 sm:py-36">
      <div className="absolute inset-0">
        <img
          src="/bengaluru-deployment-hero.png"
          alt=""
          className="h-full w-full object-cover opacity-[0.14]"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ss-bg via-ss-bg/85 to-ss-bg" />
      </div>
      <div className="ss-dots pointer-events-none absolute inset-0 opacity-30" />

      <div className="ss-pad relative z-10 text-center">
        <Reveal>
          <span className="ss-kicker justify-center">
            <span className="ss-kicker-dot" /> Drishaak
          </span>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="ss-display mx-auto mt-6 max-w-4xl text-4xl leading-[1.05] sm:text-6xl">
            From detection
            <br />
            to <span className="ss-gold-text">enforcement intelligence.</span>
          </h2>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-3">
            {PILLARS.map((p, i) => (
              <m.span
                key={p}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-white"
              >
                <Check className="h-4 w-4 text-ss-green" />
                {p}
              </m.span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-ss-gold/30 bg-ss-gold/10 px-5 py-2.5 text-sm font-bold text-ss-gold">
              <ShieldCheck className="h-4.5 w-4.5" />
              Built for Bengaluru Traffic Police
            </div>
            <button type="button" onClick={() => scrollToId("journey")} className="ss-btn-ghost group">
              Replay the violation journey
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </Reveal>

        <div className="mx-auto mt-20 max-w-5xl border-t border-white/[0.06] pt-8">
          <div className="flex flex-col items-center justify-between gap-3 text-xs text-ss-muted/70 sm:flex-row">
            <span>Drishaak · Responsible edge enforcement · PS3 prototype</span>
            <span className="ss-mono">5 layers · edge to court · officer-in-the-loop</span>
          </div>
        </div>
      </div>
    </section>
  );
}
