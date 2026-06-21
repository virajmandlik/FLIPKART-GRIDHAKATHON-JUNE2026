import { useState } from "react";
import { m } from "framer-motion";
import { Download, ShieldCheck, MapPin, Clock, Hash, FileText, Stamp, Loader2 } from "lucide-react";
import { SectionHead, Reveal, Chip } from "./_ui";
import { useScenarioStore } from "./scenarioStore";
import { getVerdict, violatorBox } from "./scenarioDerive";
import { downloadEvidencePdf } from "./evidencePdf";

export default function EvidenceSection() {
  const { scenario } = useScenarioStore();
  const verdict = getVerdict(scenario);
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      await downloadEvidencePdf(scenario);
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      setGenerating(false);
    }
  };
  const box = violatorBox(scenario);
  const sha = scenario.evidence.frameSha256;
  const shaShort = `${sha.slice(0, 6)}…${sha.slice(-6)}`;

  const meta = [
    { icon: FileText, k: "Violation", v: scenario.violationBadge },
    { icon: Clock, k: "Timestamp", v: scenario.timestamp },
    { icon: MapPin, k: "GPS", v: scenario.location.split(",")[0] },
    { icon: Hash, k: "SHA-256", v: shaShort },
  ];

  return (
    <section id="evidence" className="ss-section border-t border-white/[0.05]">
      <div className="ss-pad">
        <SectionHead
          kicker="Layer 4 · Court-ready evidence"
          title={
            <>
              A sealed packet, <span className="ss-gold-text">not a screenshot.</span>
            </>
          }
          sub="Each confirmed violation becomes a tamper-evident evidence packet — admissible under BSA 2023, reviewed and signed off by an officer before any challan is issued."
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.05fr_1fr]">
          {/* PDF mock */}
          <Reveal>
            <m.div
              key={scenario.id}
              initial={{ rotateX: 8, opacity: 0 }}
              whileInView={{ rotateX: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d10] shadow-2xl"
            >
              {/* Doc header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-ss-gold/15 text-ss-gold">
                    <ShieldCheck className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <div className="text-sm font-bold text-white">Evidence packet</div>
                    <div className="ss-mono text-[10px] text-ss-muted">{scenario.evidence.violationId}</div>
                  </div>
                </div>
                <span
                  className={`ss-mono inline-block -rotate-6 rounded border-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                    verdict.cleared ? "border-ss-green/60 text-ss-green" : "border-ss-gold/60 text-ss-gold"
                  }`}
                >
                  {verdict.cleared ? "Cleared" : "Verified"}
                </span>
              </div>

              {/* Annotated image */}
              <div className="relative aspect-video">
                <img src={scenario.image} alt="Annotated evidence" className="h-full w-full object-cover" draggable={false} />
                <div
                  className={`absolute rounded-md border-2 ${verdict.cleared ? "border-ss-green" : "border-ss-red"}`}
                  style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%` }}
                >
                  <span
                    className={`absolute -top-5 left-0 rounded px-1.5 py-0.5 text-[10px] font-bold text-black ${
                      verdict.cleared ? "bg-ss-green" : "bg-ss-red"
                    }`}
                  >
                    {verdict.title} · {Math.round(verdict.confidence * 100)}%
                  </span>
                </div>
                <div className="ss-mono absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-[10px] text-ss-muted">
                  {scenario.evidence.facesBlurred} faces · {scenario.evidence.platesBlurred} plates blurred · DPDP
                </div>
              </div>

              {/* Meta rows */}
              <div className="grid grid-cols-2 gap-px bg-white/[0.05]">
                {meta.map((m2) => (
                  <div key={m2.k} className="bg-[#0d0d10] px-5 py-3">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-ss-muted">
                      <m2.icon className="h-3 w-3" /> {m2.k}
                    </div>
                    <div className="ss-mono mt-1 truncate text-xs font-semibold text-white">{m2.v}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-3.5">
                <span className="inline-flex items-center gap-1.5 text-xs text-ss-muted">
                  <Stamp className="h-3.5 w-3.5 text-ss-green" /> Officer reviewed · Insp. R. Kumar
                </span>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={generating}
                  className="ss-btn-gold !px-4 !py-2 !text-xs disabled:opacity-60"
                >
                  {generating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  {generating ? "Generating…" : "PDF"}
                </button>
              </div>
            </m.div>
          </Reveal>

          {/* Components list */}
          <Reveal delay={0.1}>
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white">What's inside the packet</h3>
              {[
                ["Annotated image", "Violation boxed and labelled on the enhanced frame"],
                ["Violation details", "Type, vehicle, plate, rider count and rule citations"],
                ["Timestamp & GPS", "Camera-synced time and geolocation"],
                ["SHA-256 hash", "Tamper-evident fingerprint of the original frame"],
                ["Officer review status", "Human sign-off recorded before any challan"],
                ["Chain of custody", "Every transform from raw frame to packet is logged"],
              ].map(([t, d], i) => (
                <m.div
                  key={t}
                  initial={{ opacity: 0, x: 14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.015] p-4"
                >
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ss-green/15 text-ss-green">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-white">{t}</div>
                    <div className="text-xs text-ss-muted">{d}</div>
                  </div>
                </m.div>
              ))}
              <div className="flex flex-wrap gap-2 pt-1">
                <Chip tone="green">BSA 2023 S.63(4)</Chip>
                <Chip tone="gold">DPDP-minimised</Chip>
                <Chip>No auto-fines</Chip>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
