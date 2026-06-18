import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ZoomIn, ZoomOut, Building2, Radio, Shield, Users,
  ChevronRight, Activity,
} from "lucide-react";
import { Reveal, SectionTitle, Pill } from "./ui";
import {
  COMMAND_CENTER, EDGE_NODES, GOV_AGENCIES, AGENCY_LINKS, ZOOM_LEVELS,
  type MapNode,
} from "../data/bengaluruDeployment";

function nodeColor(k: MapNode["kind"]) {
  if (k === "command") return { ring: "ring-amber-brand", bg: "bg-amber-brand", text: "text-amber-brand" };
  if (k === "agency") return { ring: "ring-violet-400", bg: "bg-violet-400", text: "text-violet-300" };
  return { ring: "ring-cyan-tech", bg: "bg-cyan-tech", text: "text-cyan-tech" };
}

export default function CityCommandCenter() {
  const [zoomIdx, setZoomIdx] = useState(0);
  const [selected, setSelected] = useState<MapNode | null>(COMMAND_CENTER);
  const [autoTour, setAutoTour] = useState(true);

  const zoom = ZOOM_LEVELS[zoomIdx];
  const allNodes = [COMMAND_CENTER, ...EDGE_NODES, ...GOV_AGENCIES];

  useEffect(() => {
    if (!autoTour) return;
    const t = setInterval(() => setZoomIdx((i) => (i + 1) % ZOOM_LEVELS.length), 4500);
    return () => clearInterval(t);
  }, [autoTour]);

  const zoomIn = () => { setAutoTour(false); setZoomIdx((i) => Math.min(i + 1, ZOOM_LEVELS.length - 1)); };
  const zoomOut = () => { setAutoTour(false); setZoomIdx((i) => Math.max(i - 1, 0)); };

  const transformOrigin = `${zoom.focus.x}% ${zoom.focus.y}%`;

  return (
    <section id="deployment" className="relative border-t border-white/5 py-24 sm:py-32">
      <div className="section-pad">
        <SectionTitle
          kicker="Bengaluru city-wide deployment"
          title={<>One ecosystem. <span className="text-gradient">Every junction.</span></>}
          sub="BTP monitors violations from the Smart Enforcement Center, approves challans, and shares intelligence with Parivahan, ASTraM, BBMP, BMTC and DigiLocker — all on one secure platform."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-5">
          <div className="lg:col-span-3">
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl ring-1 ring-white/10">
              {/* Hero PNG base */}
              <img
                src="/bengaluru-deployment-hero.png"
                alt="Bengaluru city deployment"
                className="absolute inset-0 h-full w-full object-cover opacity-40"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-ink-950/60 via-ink-950/30 to-ink-950/80" />

              {/* Zoom controls */}
              <div className="absolute left-4 top-4 z-20 flex flex-wrap gap-2">
                <button onClick={zoomOut} disabled={zoomIdx === 0}
                  className="grid h-9 w-9 place-items-center rounded-lg glass hover:bg-white/10 disabled:opacity-30">
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button onClick={zoomIn} disabled={zoomIdx === ZOOM_LEVELS.length - 1}
                  className="grid h-9 w-9 place-items-center rounded-lg glass hover:bg-white/10 disabled:opacity-30">
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button onClick={() => setAutoTour((a) => !a)}
                  className={`rounded-lg px-3 py-1.5 text-[11px] font-bold ${autoTour ? "bg-amber-brand text-ink-950" : "glass text-slate-300"}`}>
                  {autoTour ? "Auto tour ON" : "Auto tour OFF"}
                </button>
              </div>

              <div className="absolute right-4 top-4 z-20 rounded-lg glass px-3 py-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Zoom</div>
                <div className="text-sm font-bold text-white">{zoom.label}</div>
              </div>

              {/* Animated map layer */}
              <div className="relative aspect-[16/10] overflow-hidden">
                <motion.div
                  className="absolute inset-0"
                  animate={{ scale: zoom.scale }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformOrigin }}
                >
                  {/* Connection lines SVG */}
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {EDGE_NODES.map((e) => (
                      <motion.line key={e.id}
                        x1={COMMAND_CENTER.x} y1={COMMAND_CENTER.y}
                        x2={e.x} y2={e.y}
                        stroke="rgba(34,211,238,0.35)" strokeWidth="0.15" strokeDasharray="1 0.8"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, delay: 0.2 }}
                      />
                    ))}
                    {AGENCY_LINKS.map((l) => {
                      const from = allNodes.find((n) => n.id === l.from)!;
                      const to = allNodes.find((n) => n.id === l.to)!;
                      return (
                        <motion.line key={l.label}
                          x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                          stroke="rgba(167,139,250,0.4)" strokeWidth="0.12" strokeDasharray="0.6 0.6"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      );
                    })}
                    {/* Animated packets edge → command */}
                    {EDGE_NODES.slice(0, 4).map((e, i) => (
                      <motion.circle key={`pkt-${e.id}`} r="0.5" fill="#FFC200"
                        animate={{
                          cx: [e.x, COMMAND_CENTER.x],
                          cy: [e.y, COMMAND_CENTER.y],
                        }}
                        transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.6, ease: "linear" }}
                      />
                    ))}
                  </svg>

                  {/* Nodes */}
                  {allNodes.map((n) => {
                    const c = nodeColor(n.kind);
                    const isSel = selected?.id === n.id;
                    return (
                      <button
                        key={n.id}
                        onClick={() => { setSelected(n); setAutoTour(false); }}
                        className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${n.x}%`, top: `${n.y}%` }}
                      >
                        <motion.span
                          className={`relative flex items-center justify-center rounded-full ${c.bg} ${isSel ? "ring-4 ring-white/30" : ""}`}
                          animate={n.kind === "edge" ? { scale: [1, 1.15, 1] } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                          style={{
                            width: n.kind === "command" ? 20 : n.kind === "agency" ? 12 : 14,
                            height: n.kind === "command" ? 20 : n.kind === "agency" ? 12 : 14,
                          }}
                        />
                        {n.kind === "edge" && (
                          <span className={`absolute -inset-2 rounded-full ring-2 ${c.ring} opacity-40 animate-ping`} />
                        )}
                        <span className={`absolute left-1/2 mt-2 -translate-x-1/2 whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] font-bold ${isSel ? "bg-white text-ink-950" : "bg-ink-950/80 text-slate-200"}`}>
                          {n.label}
                        </span>
                      </button>
                    );
                  })}
                </motion.div>
              </div>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 flex flex-wrap gap-3 rounded-lg glass px-3 py-2 text-[10px]">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan-tech" /> Edge node</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-brand" /> BTP command</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-400" /> Gov agency</span>
              </div>
            </div>

            {/* Zoom level pills */}
            <div className="mt-3 flex flex-wrap gap-2">
              {ZOOM_LEVELS.map((z, i) => (
                <button key={z.id} onClick={() => { setZoomIdx(i); setAutoTour(false); }}
                  className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${i === zoomIdx ? "bg-white/15 text-white" : "text-slate-500 hover:text-slate-300"}`}>
                  {z.label}
                </button>
              ))}
            </div>
          </Reveal>
          </div>

          <div className="lg:col-span-2">
          <Reveal delay={0.1}>
            <div className="flex h-full flex-col rounded-2xl glass p-6">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <Building2 className="h-3.5 w-3.5" /> Unified command &amp; control
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={selected?.id ?? "none"}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-4 flex-1">
                  {selected && (
                    <>
                      <h3 className="text-xl font-extrabold text-white">{selected.label}</h3>
                      <p className="mt-1 text-sm text-slate-400">{selected.sub}</p>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        {selected.cameras !== undefined && (
                          <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/[0.06]">
                            <div className="text-2xl font-extrabold text-cyan-tech">{selected.cameras}</div>
                            <div className="text-[10px] text-slate-500">CCTV poles</div>
                          </div>
                        )}
                        {selected.violations24h !== undefined && (
                          <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/[0.06]">
                            <div className="text-2xl font-extrabold text-amber-brand">{selected.violations24h}</div>
                            <div className="text-[10px] text-slate-500">Violations / 24h</div>
                          </div>
                        )}
                        {selected.kind === "command" && (
                          <>
                            <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/[0.06]">
                              <div className="text-2xl font-extrabold text-white">8</div>
                              <div className="text-[10px] text-slate-500">Edge zones live</div>
                            </div>
                            <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/[0.06]">
                              <div className="text-2xl font-extrabold text-ok">6</div>
                              <div className="text-[10px] text-slate-500">Agency integrations</div>
                            </div>
                          </>
                        )}
                      </div>

                      {selected.kind === "command" && (
                        <div className="mt-5 space-y-2">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Officer actions</div>
                          {["Review violation queue", "Approve / reject evidence", "Issue e-Challan via Parivahan", "Export ASTraM congestion report"].map((a) => (
                            <div key={a} className="flex items-center gap-2 rounded-lg bg-cyan-tech/[0.06] px-3 py-2 text-xs text-slate-200 ring-1 ring-cyan-tech/20">
                              <ChevronRight className="h-3 w-3 text-cyan-tech" /> {a}
                            </div>
                          ))}
                        </div>
                      )}

                      {selected.kind === "agency" && (
                        <div className="mt-5 rounded-xl bg-violet-500/[0.08] p-4 ring-1 ring-violet-400/30">
                          <div className="flex items-center gap-2 text-xs font-bold text-violet-300">
                            <Users className="h-4 w-4" /> Inter-agency collaboration
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-slate-400">
                            {AGENCY_LINKS.find((l) => l.to === selected.id)?.label ?? "Data sync"} via{" "}
                            {AGENCY_LINKS.find((l) => l.to === selected.id)?.protocol ?? "secure API"}.
                            Shared on need-to-know basis under DPDP 2023.
                          </p>
                        </div>
                      )}

                      {selected.kind === "edge" && (
                        <div className="mt-5 space-y-2">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Edge pipeline</div>
                          <div className="flex flex-wrap gap-1.5 text-[10px]">
                            {["Ingest", "Detect", "Track", "Classify", "ANPR", "Privacy", "Evidence"].map((s) => (
                              <span key={s} className="rounded bg-cyan-tech/10 px-2 py-1 font-mono text-cyan-tech">{s}</span>
                            ))}
                          </div>
                          <Pill tone="cyan"><Radio className="h-3 w-3" /> Jetson Orin · ~28 FPS · raw video local</Pill>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="mt-6 border-t border-white/10 pt-4">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <Shield className="h-3.5 w-3.5" /> Gov ecosystem
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {GOV_AGENCIES.map((a) => (
                    <button key={a.id} onClick={() => setSelected(a)}
                      className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-slate-300 ring-1 ring-white/10 hover:ring-violet-400/40">
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500">
                <Activity className="h-3 w-3 text-ok" />
                <span className="text-ok font-semibold">LIVE</span> · 581 edge nodes target · Phase 1 pilot: 8 junctions
              </div>
            </div>
          </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
