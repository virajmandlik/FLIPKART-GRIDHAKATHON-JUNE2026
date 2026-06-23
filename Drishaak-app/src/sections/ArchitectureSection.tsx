import { m } from "framer-motion";
import { Camera, Cpu, Brain, Building2, Landmark } from "lucide-react";
import { SectionHead, Reveal } from "./_ui";
import ArchitectureBlueprint from "./ArchitectureBlueprint";
import ModelMatrix from "./ModelMatrix";

const NODES = [
  { icon: Camera, title: "Camera", sub: "Pole-side CCTV / RTSP", tone: "muted" },
  { icon: Cpu, title: "Edge node", sub: "On-site frame selection", tone: "gold" },
  { icon: Brain, title: "AI pipeline", sub: "Enhance · detect · validate", tone: "gold" },
  { icon: Building2, title: "Enforcement center", sub: "BTP officer review", tone: "green" },
  { icon: Landmark, title: "Parivahan", sub: "e-Challan · DigiLocker", tone: "green" },
];

const toneMap: Record<string, string> = {
  muted: "border-white/10 bg-white/[0.02] text-ss-muted",
  gold: "border-ss-gold/30 bg-ss-gold/10 text-ss-gold",
  green: "border-ss-green/30 bg-ss-green/10 text-ss-green",
};

export default function ArchitectureSection() {
  return (
    <section id="architecture" className="ss-section border-t border-white/[0.05]">
      <div className="ss-pad">
        <SectionHead
          center
          kicker="Deployment architecture"
          title={
            <>
              Edge first. <span className="ss-gold-text">Cloud assisted.</span>
            </>
          }
          sub="Heavy lifting happens at the edge so only meaningful events travel upstream — keeping bandwidth low, privacy high, and the city in control."
        />

        {/* Horizontal flow */}
        <div className="mt-16">
          <div className="relative flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
            {NODES.map((n, i) => (
              <div key={n.title} className="flex flex-1 flex-col items-center lg:flex-row">
                <Reveal delay={i * 0.1}>
                  <m.div
                    whileHover={{ y: -4 }}
                    className="ss-card flex w-full min-w-[150px] flex-col items-center gap-3 px-5 py-6 text-center"
                  >
                    <span className={`grid h-14 w-14 place-items-center rounded-2xl border ${toneMap[n.tone]}`}>
                      <n.icon className="h-6 w-6" />
                    </span>
                    <div>
                      <div className="font-bold text-white">{n.title}</div>
                      <div className="text-xs text-ss-muted">{n.sub}</div>
                    </div>
                  </m.div>
                </Reveal>

                {i < NODES.length - 1 && (
                  <div className="flex items-center justify-center py-2 lg:px-1 lg:py-0">
                    {/* vertical on mobile, horizontal on desktop */}
                    <svg className="hidden h-2 w-10 lg:block" viewBox="0 0 40 8">
                      <line x1="0" y1="4" x2="40" y2="4" className="ss-flow-line animate-dashmove" />
                    </svg>
                    <svg className="h-8 w-2 lg:hidden" viewBox="0 0 8 32">
                      <line x1="4" y1="0" x2="4" y2="32" className="ss-flow-line animate-dashmove" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Full system architecture diagram */}
          <ArchitectureBlueprint />

          {/* Detection model selection matrix — YOLO11 vs RT-DETR-L */}
          <ModelMatrix />

          <Reveal delay={0.2}>
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {[
                ["Low bandwidth", "Only event frames leave the junction, not raw streams."],
                ["Privacy by design", "Faces and bystander plates blurred at the edge — DPDP-aligned."],
                ["Resilient", "Edge nodes keep working through network drops; events sync on reconnect."],
              ].map(([t, d]) => (
                <div key={t} className="ss-card-soft p-5">
                  <div className="font-semibold text-white">{t}</div>
                  <div className="mt-1 text-sm text-ss-muted">{d}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
