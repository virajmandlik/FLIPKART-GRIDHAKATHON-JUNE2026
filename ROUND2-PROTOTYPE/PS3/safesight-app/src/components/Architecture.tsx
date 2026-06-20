// Architecture.tsx
import { motion } from "framer-motion";
import { Cpu, Cloud, Camera, ArrowRight, Lock, ShieldCheck, Database, Activity } from "lucide-react";
import { Reveal, SectionTitle } from "./ui";
import { microservices } from "../data/mockApi";

const edge = microservices.filter((m) => m.tier === "edge");
const cloud = microservices.filter((m) => m.tier === "cloud");

function Node({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.06] py-2 text-xs">
      <span className="font-mono text-slate-300">{name}</span>
      <span className="text-slate-500">{desc}</span>
    </div>
  );
}

export default function Architecture() {
  return (
    <section id="architecture" className="relative border-t border-white/[0.07] py-20 sm:py-28">
      <div className="section-pad">
        <SectionTitle
          kicker="Deployment architecture"
          title={<>Edge-first. <span className="text-saffron">Cloud-assisted.</span></>}
          sub="Inference at the camera pole — Silk Board, Hebbal, KR Puram. Only signed violation packets egress to BTP Smart Enforcement Center."
        />

        <div className="mt-14 grid items-start gap-6 lg:grid-cols-[1fr_auto_1fr]">
          <Reveal>
            <div>
              <div className="flex items-center gap-3">
                <Cpu className="h-5 w-5 text-teal" />
                <div>
                  <h3 className="font-semibold text-white">Edge node</h3>
                  <p className="text-xs text-slate-500">NVIDIA Jetson Orin Nano · per junction</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <Camera className="h-3.5 w-3.5" /> RTSP 1080p in
              </div>
              <div className="mt-4">
                {edge.map((m) => <Node key={m.id} name={m.id} desc={m.desc} />)}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                TensorRT INT8 · ~28 FPS · raw video never leaves the pole
              </p>
            </div>
          </Reveal>

          <div className="flex flex-col items-center justify-center gap-3 py-4 lg:px-2">
            <div className="relative h-20 w-px overflow-hidden bg-white/10 lg:h-32">
              {[0, 1, 2].map((i) => (
                <motion.span key={i}
                  className="absolute left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-saffron"
                  animate={{ top: ["-10%", "110%"] }}
                  transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.5, ease: "linear" }}
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
              <Lock className="h-3 w-3" /> mTLS · signed packet
            </div>
          </div>

          <Reveal delay={0.1}>
            <div>
              <div className="flex items-center gap-3">
                <Cloud className="h-5 w-5 text-saffron" />
                <div>
                  <h3 className="font-semibold text-white">Smart Enforcement Center</h3>
                  <p className="text-xs text-slate-500">Kubernetes · cloud-agnostic / on-prem</p>
                </div>
              </div>
              <div className="mt-4">
                {cloud.map((m) => <Node key={m.id} name={m.id} desc={m.desc} />)}
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <ArrowRight className="h-3.5 w-3.5" /> Parivahan e-Challan · ASTraM analytics
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <div className="mt-14 grid gap-x-8 gap-y-6 border-t border-white/[0.07] pt-8 sm:grid-cols-4">
            {[
              { icon: ShieldCheck, t: "Auth / RBAC", d: "Keycloak · deny-by-default" },
              { icon: Lock, t: "Secrets", d: "Vault / KMS" },
              { icon: Database, t: "WORM evidence", d: "object-lock · 5-yr audit" },
              { icon: Activity, t: "Observability", d: "OTel · Prom · Grafana" },
            ].map((x) => (
              <div key={x.t} className="flex items-center gap-3">
                <x.icon className="h-4 w-4 text-slate-500" />
                <div>
                  <div className="text-xs font-semibold text-white">{x.t}</div>
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