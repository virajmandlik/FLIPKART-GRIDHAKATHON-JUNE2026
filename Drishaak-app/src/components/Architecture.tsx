import { motion } from "framer-motion";
import { Cpu, Cloud, Camera, ArrowRight, Lock, ShieldCheck, Database, Activity } from "lucide-react";
import { Reveal, SectionTitle, Pill } from "./ui";
import { microservices } from "../data/mockApi";

const edge = microservices.filter((m) => m.tier === "edge");
const cloud = microservices.filter((m) => m.tier === "cloud");

function Node({ name, desc, tone }: { name: string; desc: string; tone: "edge" | "cloud" }) {
  const c = tone === "edge" ? "text-cyan-tech" : "text-amber-brand";
  return (
    <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 ring-1 ring-white/[0.06]">
      <span className={`font-mono text-xs font-semibold ${c}`}>{name}</span>
      <span className="text-[10px] text-slate-500">{desc}</span>
    </div>
  );
}

export default function Architecture() {
  return (
    <section id="architecture" className="relative border-t border-white/[0.06] py-20 sm:py-28">
      <div className="section-pad">
        <SectionTitle
          kicker="Deployment architecture"
          title={<>Edge-first. <span className="text-gradient">Cloud-assisted.</span></>}
          sub="Inference at the camera pole — Silk Board, Hebbal, KR Puram. Only signed violation packets egress to BTP Smart Enforcement Center."
        />

        <div className="mt-12 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr]">
          {/* EDGE */}
          <Reveal>
            <div className="h-full gov-card p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-tech/15 ring-1 ring-cyan-tech/40"><Cpu className="h-5 w-5 text-cyan-tech" /></span>
                <div>
                  <h3 className="font-extrabold text-white">Edge node</h3>
                  <p className="text-xs text-slate-500">NVIDIA Jetson Orin Nano · per junction</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <Camera className="h-4 w-4 text-cyan-tech" /> RTSP 1080p in
              </div>
              <div className="mt-3 space-y-1.5">
                {edge.map((m) => <Node key={m.id} name={m.id} desc={m.desc} tone="edge" />)}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Pill tone="cyan">TensorRT INT8</Pill>
                <Pill tone="cyan">~28 FPS</Pill>
                <Pill tone="ok">raw video stays local</Pill>
              </div>
            </div>
          </Reveal>

          {/* egress connector */}
          <div className="flex flex-col items-center justify-center gap-3 lg:px-2">
            <div className="relative h-24 w-1 overflow-hidden rounded-full bg-white/10">
              {[0, 1, 2].map((i) => (
                <motion.span key={i}
                  className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-amber-brand"
                  animate={{ top: ["-10%", "110%"] }}
                  transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.5, ease: "linear" }}
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-[10px] font-bold text-slate-300">
              <Lock className="h-3 w-3 text-amber-brand" /> mTLS · signed packet
            </div>
          </div>

          {/* CLOUD */}
          <Reveal delay={0.1}>
            <div className="h-full gov-card p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-brand/15 ring-1 ring-amber-brand/40"><Cloud className="h-5 w-5 text-amber-brand" /></span>
                <div>
                  <h3 className="font-extrabold text-white">Cloud · Smart Enforcement Center</h3>
                  <p className="text-xs text-slate-500">Kubernetes · cloud-agnostic / on-prem</p>
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                {cloud.map((m) => <Node key={m.id} name={m.id} desc={m.desc} tone="cloud" />)}
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <ArrowRight className="h-4 w-4 text-amber-brand" /> Parivahan e-Challan · ASTraM analytics
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Pill tone="amber">Kafka backbone</Pill>
                <Pill tone="amber">HPA autoscale</Pill>
              </div>
            </div>
          </Reveal>
        </div>

        {/* cross-cutting */}
        <Reveal delay={0.15}>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {[
              { icon: ShieldCheck, t: "Auth / RBAC", d: "Keycloak · deny-by-default" },
              { icon: Lock, t: "Secrets", d: "Vault / KMS" },
              { icon: Database, t: "WORM evidence", d: "object-lock · 5-yr audit" },
              { icon: Activity, t: "Observability", d: "OTel · Prom · Grafana" },
            ].map((x) => (
              <div key={x.t} className="flex items-center gap-3 gov-card px-4 py-3">
                <x.icon className="h-4 w-4 text-slate-300" />
                <div>
                  <div className="text-xs font-bold text-white">{x.t}</div>
                  <div className="text-[10px] text-slate-500">{x.d}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
