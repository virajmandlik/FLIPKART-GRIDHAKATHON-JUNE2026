// CityCommandCenter.tsx
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ZoomIn, ZoomOut, Building2, Radio, Shield, Users,
  ChevronRight, Activity,
} from "lucide-react";
import { Reveal, SectionTitle } from "./ui";
import BengaluruMapSvg from "./shared/BengaluruMapSvg";
import {
  COMMAND_CENTER, EDGE_NODES, GOV_AGENCIES, AGENCY_LINKS, ZOOM_LEVELS,
  type MapNode,
} from "../data/bengaluruDeployment";

export interface MapFocusRequest {
  nodeId: string;
  zoomIdx: number;
}

interface Props {
  focusRequest?: MapFocusRequest | null;
}

export default function CityCommandCenter({ focusRequest }: Props) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const [selected, setSelected] = useState<MapNode | null>(COMMAND_CENTER);
  const [autoTour, setAutoTour] = useState(true);

  const zoom = ZOOM_LEVELS[zoomIdx];
  const allNodes = useMemo(() => [COMMAND_CENTER, ...EDGE_NODES, ...GOV_AGENCIES], []);

  useEffect(() => {
    if (!focusRequest) return;
    const node = allNodes.find((n) => n.id === focusRequest.nodeId);
    if (node) {
      setSelected(node);
      setZoomIdx(focusRequest.zoomIdx);
      setAutoTour(false);
    }
  }, [focusRequest, allNodes]);

  useEffect(() => {
    if (!autoTour) return;
    const t = setInterval(() => setZoomIdx((i) => (i + 1) % ZOOM_LEVELS.length), 4500);
    return () => clearInterval(t);
  }, [autoTour]);

  const zoomIn = () => { setAutoTour(false); setZoomIdx((i) => Math.min(i + 1, ZOOM_LEVELS.length - 1)); };
  const zoomOut = () => { setAutoTour(false); setZoomIdx((i) => Math.max(i - 1, 0)); };

  const transformOrigin = `${zoom.focus.x}% ${zoom.focus.y}%`;

  return (
    <section id="deployment" className="relative border-t border-white/[0.07] py-16 sm:py-24">
      <div className="section-pad">
        <SectionTitle
          kicker="Bengaluru city deployment"
          title={<>BTP command · <span className="text-saffron">9 junctions + ASTraM</span></>}
          sub="Silk Board, Marathahalli, Hebbal, KR Puram — edge inference at pole, signed packets to Smart Enforcement Center. Parivahan e-Challan on officer approval."
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
          <Reveal>
            <div className="relative overflow-hidden rounded-md border border-white/[0.07] bg-ink-900/60">
              <div className="absolute left-4 top-4 z-20 flex flex-wrap gap-2">
                <button type="button" onClick={zoomOut} disabled={zoomIdx === 0}
                  className="grid h-8 w-8 place-items-center rounded border border-white/[0.08] bg-ink-950/80 text-slate-400 hover:text-white disabled:opacity-30">
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={zoomIn} disabled={zoomIdx === ZOOM_LEVELS.length - 1}
                  className="grid h-8 w-8 place-items-center rounded border border-white/[0.08] bg-ink-950/80 text-slate-400 hover:text-white disabled:opacity-30">
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => setAutoTour((a) => !a)}
                  className={`rounded px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${autoTour ? "bg-saffron text-ink-950" : "border border-white/[0.08] text-slate-400"}`}>
                  {autoTour ? "Tour on" : "Tour off"}
                </button>
              </div>

              <div className="absolute right-4 top-4 z-20 text-right">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Zoom</div>
                <div className="text-xs font-semibold text-white">{zoom.label}</div>
              </div>

              <div className="relative aspect-[16/10] overflow-hidden">
                <motion.div
                  className="absolute inset-0 p-3"
                  animate={{ scale: zoom.scale }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformOrigin }}
                >
                  <BengaluruMapSvg
                    selectedId={selected?.id}
                    onNodeClick={(n) => { setSelected(n); setAutoTour(false); }}
                    showConnections
                  />
                </motion.div>
              </div>

              <div className="absolute bottom-3 left-3 flex flex-wrap gap-3 text-[10px] text-slate-500">
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-teal" /> Edge</span>
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-saffron" /> BTP HQ</span>
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-violet-400" /> Agency</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {ZOOM_LEVELS.map((z, i) => (
                <button key={z.id} type="button" onClick={() => { setZoomIdx(i); setAutoTour(false); }}
                  className={`rounded px-2.5 py-1 text-[10px] font-medium transition ${i === zoomIdx ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"}`}>
                  {z.label}
                </button>
              ))}
            </div>
          </Reveal>
          </div>

          <div className="lg:col-span-2">
          <Reveal delay={0.1}>
            <div className="flex h-full flex-col border-l border-white/[0.07] pl-6">
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-saffron" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Unified command</span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={selected?.id ?? "none"}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-4 flex-1">
                  {selected && (
                    <>
                      <h3 className="text-lg font-semibold text-white">{selected.label}</h3>
                      <p className="mt-0.5 font-mono text-xs text-slate-500">{selected.sub}</p>

                      <div className="mt-5 grid grid-cols-2 gap-y-4">
                        {selected.cameras !== undefined && (
                          <StatBox value={String(selected.cameras)} label="CCTV poles" accent="text-teal" />
                        )}
                        {selected.violations24h !== undefined && (
                          <StatBox value={String(selected.violations24h)} label="Violations / 24h" accent="text-saffron" />
                        )}
                        {selected.kind === "command" && (
                          <>
                            <StatBox value="9" label="Edge zones" accent="text-white" />
                            <StatBox value="6" label="Agency links" accent="text-ok" />
                          </>
                        )}
                      </div>

                      {selected.kind === "command" && (
                        <div className="mt-6 space-y-1">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Officer actions</div>
                          {["Review violation queue", "Approve evidence · KA plate", "Issue e-Challan · Parivahan", "Export ASTraM report"].map((a) => (
                            <div key={a} className="flex items-center gap-2 py-1.5 text-xs text-slate-300">
                              <ChevronRight className="h-3 w-3 shrink-0 text-teal" /> {a}
                            </div>
                          ))}
                        </div>
                      )}

                      {selected.kind === "agency" && (
                        <div className="mt-5">
                          <div className="flex items-center gap-2 text-xs font-medium text-violet-300">
                            <Users className="h-3.5 w-3.5" /> Inter-agency
                          </div>
                          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                            {AGENCY_LINKS.find((l) => l.to === selected.id)?.label ?? "Data sync"} via{" "}
                            {AGENCY_LINKS.find((l) => l.to === selected.id)?.protocol ?? "secure API"} · DPDP 2023.
                          </p>
                        </div>
                      )}

                      {selected.kind === "edge" && (
                        <div className="mt-5 space-y-2">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Edge pipeline</div>
                          <div className="flex flex-wrap gap-2 text-[10px]">
                            {["Ingest", "Enhance", "Detect", "OCR", "Evidence"].map((s) => (
                              <span key={s} className="font-mono text-teal">{s}</span>
                            ))}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Radio className="h-3.5 w-3.5 text-teal" /> Jetson Orin · raw video local
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="mt-6 border-t border-white/[0.07] pt-5">
                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Gov ecosystem</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-3">
                  {GOV_AGENCIES.map((a) => (
                    <button key={a.id} type="button" onClick={() => setSelected(a)}
                      className={`text-[10px] font-medium transition ${selected?.id === a.id ? "text-violet-300" : "text-slate-500 hover:text-slate-300"}`}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500">
                <Activity className="h-3 w-3 text-ok" />
                <span className="font-semibold text-ok">LIVE</span> · Phase 1 pilot · ASTraM sync
              </div>
            </div>
          </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatBox({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <div>
      <div className={`text-xl font-semibold ${accent}`}>{value}</div>
      <div className="text-[10px] text-slate-500">{label}</div>
    </div>
  );
}