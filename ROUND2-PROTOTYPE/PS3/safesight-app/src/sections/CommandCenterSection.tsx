import { m } from "framer-motion";
import { Flame, UserSearch, Clock4, Users, MapPin, ArrowUpRight } from "lucide-react";
import { SectionHead, Reveal, Chip } from "./_ui";
import { EDGE_NODES } from "../data/bengaluruDeployment";
import { REPEAT_OFFENDERS } from "../data/repeatOffenders";
import { PRIMARY_DEPLOYMENT } from "../data/enforcementRecommendations";

const PEAK_HOURS = [
  { h: "6", v: 18 },
  { h: "8", v: 92 },
  { h: "10", v: 64 },
  { h: "12", v: 38 },
  { h: "14", v: 30 },
  { h: "16", v: 48 },
  { h: "18", v: 86 },
  { h: "20", v: 54 },
  { h: "22", v: 22 },
];

function heat(v: number) {
  if (v >= 90) return "bg-ss-red";
  if (v >= 50) return "bg-ss-gold";
  return "bg-ss-green";
}

export default function CommandCenterSection() {
  const topNodes = [...EDGE_NODES].sort((a, b) => (b.violations24h ?? 0) - (a.violations24h ?? 0)).slice(0, 6);
  const maxV = Math.max(...topNodes.map((n) => n.violations24h ?? 0));
  const dep = PRIMARY_DEPLOYMENT;

  return (
    <section id="command" className="ss-section border-t border-white/[0.05]">
      <div className="ss-pad">
        <SectionHead
          kicker="Layer 5 · Command center"
          title={
            <>
              From one violation to <span className="ss-gold-text">city-wide action.</span>
            </>
          }
          sub="Violations roll up into operational intelligence — junction heatmaps, repeat-offender scores, peak windows and concrete deployment recommendations for the BTP."
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-12">
          {/* Heatmap */}
          <Reveal className="lg:col-span-7">
            <div className="ss-card h-full p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Flame className="h-5 w-5 text-ss-red" />
                  <h3 className="font-bold text-white">Junction heatmap · 24h</h3>
                </div>
                <span className="ss-mono text-xs text-ss-muted">live edge nodes</span>
              </div>
              <div className="space-y-3">
                {topNodes.map((n, i) => (
                  <m.div
                    key={n.id}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-3"
                  >
                    <span className="w-28 shrink-0 text-sm font-medium text-white">{n.label}</span>
                    <div className="h-6 flex-1 overflow-hidden rounded-md bg-white/[0.04]">
                      <m.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${((n.violations24h ?? 0) / maxV) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                        className={`h-full rounded-md ${heat(((n.violations24h ?? 0) / maxV) * 100)}`}
                      />
                    </div>
                    <span className="ss-mono w-10 text-right text-sm font-bold text-white">{n.violations24h}</span>
                  </m.div>
                ))}
              </div>

              {/* Peak hours */}
              <div className="mt-7 border-t border-white/[0.06] pt-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                  <Clock4 className="h-4 w-4 text-ss-gold" /> Peak violation hours
                </div>
                <div className="flex items-end gap-2">
                  {PEAK_HOURS.map((p, i) => (
                    <div key={p.h} className="flex flex-1 flex-col items-center gap-1.5">
                      <m.div
                        initial={{ height: 4 }}
                        whileInView={{ height: `${p.v}px` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: i * 0.04 }}
                        className={`w-full rounded-t ${heat(p.v)}`}
                      />
                      <span className="ss-mono text-[10px] text-ss-muted">{p.h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Right column */}
          <div className="space-y-5 lg:col-span-5">
            {/* Deployment recommendation */}
            <Reveal delay={0.08}>
              <div className="ss-card overflow-hidden">
                <div className="flex items-center justify-between bg-ss-red/[0.08] px-5 py-3">
                  <span className="flex items-center gap-2 text-sm font-bold text-white">
                    <MapPin className="h-4 w-4 text-ss-red" /> {dep.junction}
                  </span>
                  <Chip tone="red">{dep.priority} risk</Chip>
                </div>
                <div className="p-5">
                  <p className="text-sm leading-relaxed text-ss-muted">{dep.reason}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-ss-muted">
                        <Users className="h-3 w-3" /> Officers
                      </div>
                      <div className="mt-1 text-2xl font-extrabold text-white">{dep.officersRecommended}</div>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-ss-muted">
                        <Clock4 className="h-3 w-3" /> Window
                      </div>
                      <div className="mt-1 text-sm font-bold text-white">08:00–11:00</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-ss-green/20 bg-ss-green/[0.06] px-3 py-2 text-xs text-ss-green">
                    <ArrowUpRight className="h-3.5 w-3.5" /> {dep.expectedImpact}
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Repeat offenders */}
            <Reveal delay={0.14}>
              <div className="ss-card p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                  <UserSearch className="h-4 w-4 text-ss-gold" /> Repeat offender scores
                </div>
                <div className="space-y-2.5">
                  {REPEAT_OFFENDERS.slice(0, 3).map((o) => (
                    <div
                      key={o.plate}
                      className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-2.5"
                    >
                      <div>
                        <div className="ss-mono text-sm font-bold text-white">{o.plate}</div>
                        <div className="text-[11px] text-ss-muted">
                          {o.violationCount} violations · {o.vehicleType}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={`h-full rounded-full ${o.riskScore >= 0.85 ? "bg-ss-red" : "bg-ss-gold"}`}
                            style={{ width: `${o.riskScore * 100}%` }}
                          />
                        </div>
                        <span className="ss-mono w-8 text-right text-xs font-bold text-white">
                          {Math.round(o.riskScore * 100)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
