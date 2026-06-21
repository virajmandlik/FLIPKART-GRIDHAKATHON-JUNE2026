import { m } from "framer-motion";
import { Users, Film, Hourglass, FileWarning } from "lucide-react";
import { SectionHead, Reveal } from "./_ui";

const STATS = [
  {
    icon: Users,
    stat: "1 : 1,400+",
    label: "Officer to citizen ratio",
    body: "A handful of traffic officers cannot watch every junction, every hour, across a city of millions.",
  },
  {
    icon: Film,
    stat: "Millions",
    label: "CCTV frames daily",
    body: "Bengaluru's cameras produce more footage in a day than any human team could ever review.",
  },
  {
    icon: Hourglass,
    stat: "Hours",
    label: "Manual review bottleneck",
    body: "Each violation is checked by hand — slow, inconsistent, and impossible to scale.",
  },
  {
    icon: FileWarning,
    stat: "Lost",
    label: "Evidence that doesn't hold",
    body: "Blurry frames and missing context mean genuine violations get dismissed in court.",
  },
];

export default function ProblemSection() {
  return (
    <section id="problem" className="ss-section">
      <div className="ss-pad">
        <SectionHead
          kicker="The problem"
          title={
            <>
              Enforcement can't keep pace
              <br className="hidden sm:block" /> with the city.
            </>
          }
          sub="The cameras already exist. What's missing is a way to turn endless footage into fair, reviewable, court-ready action — without burning out the officers behind it."
        />

        <div className="mt-16 grid gap-5 sm:grid-cols-2">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <m.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="ss-card group h-full p-7"
              >
                <div className="flex items-start gap-5">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-ss-gold transition group-hover:border-ss-gold/30 group-hover:bg-ss-gold/10">
                    <s.icon className="h-5.5 w-5.5" />
                  </span>
                  <div>
                    <div className="text-3xl font-extrabold tracking-tight text-white">{s.stat}</div>
                    <div className="mt-1 text-sm font-semibold uppercase tracking-wide text-ss-muted/80">
                      {s.label}
                    </div>
                    <p className="mt-3 text-[15px] leading-relaxed text-ss-muted">{s.body}</p>
                  </div>
                </div>
              </m.div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <p className="mx-auto mt-14 max-w-2xl text-center text-lg text-ss-muted">
            Drishaak starts where the footage ends —{" "}
            <span className="font-semibold text-white">following a single violation from camera to courtroom.</span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
