import { m } from "framer-motion";
import { ScanLine, ShieldQuestion, User, Disc, Bike, Car, Images } from "lucide-react";
import { SectionHead, Reveal, Chip, Counter } from "./_ui";
import BeforeAfterSlider from "../components/shared/BeforeAfterSlider";
import { LAYER2_OUTPUT } from "../data/layerOutputs";
import { useScenarioStore } from "./scenarioStore";
import { getRois, type RoiIcon } from "./scenarioDerive";
import CropView from "./CropView";
import CaptureFrame from "./CaptureFrame";
import ScenarioPicker from "./ScenarioPicker";

const ICONS: Record<RoiIcon, typeof ScanLine> = {
  plate: ScanLine,
  helmet: ShieldQuestion,
  driver: User,
  seatbelt: Disc,
  vehicle: Car,
  rider: Bike,
};

const TONE_RING: Record<string, string> = {
  gold: "ring-ss-gold/40",
  green: "ring-ss-green/40",
  red: "ring-ss-red/50",
  muted: "ring-white/10",
};
const TONE_TEXT: Record<string, string> = {
  gold: "text-ss-gold",
  green: "text-ss-green",
  red: "text-ss-red",
  muted: "text-ss-muted",
};

export default function Layer2Section() {
  const { scenario } = useScenarioStore();
  const q = LAYER2_OUTPUT.quality_assessment;
  const rois = getRois(scenario);

  return (
    <section id="enhance" className="ss-section border-t border-white/[0.05]">
      <div className="ss-pad">
        <SectionHead
          kicker="Layer 2 · Evidence enhancement"
          title={
            <>
              A blurry frame is not a <span className="ss-gold-text">dead end.</span>
            </>
          }
          sub="Pick any of the nine real Bengaluru scenarios. Restormer removes blur and noise; Real-ESRGAN restores 4× detail — and every region of interest is cropped straight from that frame."
        />

        {/* Scenario selector */}
        <Reveal>
          <div className="mt-10">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <Images className="h-4 w-4 text-ss-gold" /> Choose a violation scenario
              <span className="ss-mono text-xs font-normal text-ss-muted">· {scenario.title}</span>
            </div>
            <ScenarioPicker />
          </div>
        </Reveal>

        {/* Before / after + metrics */}
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.4fr_1fr]">
          <Reveal>
            <BeforeAfterSlider
              key={scenario.id}
              beforeImage={scenario.image}
              afterImage={scenario.image}
              beforeLabel="Raw frame"
              afterLabel="Enhanced"
              beforeScore={q.quality_score_before}
              afterScore={q.quality_score_after}
            />
          </Reveal>

          <Reveal delay={0.1}>
            <div className="space-y-4">
              <div className="ss-card p-6">
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-extrabold tracking-tight text-ss-green">
                    +<Counter value={q.improvement_percent} decimals={0} />%
                  </span>
                  <span className="mb-2 text-sm text-ss-muted">quality gain</span>
                </div>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <m.div
                    initial={{ width: "0%" }}
                    whileInView={{ width: `${q.quality_score_after * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-ss-gold to-ss-green"
                  />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-ss-muted">
                  <span>before · {(q.quality_score_before * 100).toFixed(0)}%</span>
                  <span>after · {(q.quality_score_after * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div className="ss-card-soft p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-ss-muted">Pipeline applied</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Chip tone="gold">Restormer · deblur + denoise</Chip>
                  <Chip tone="gold">Real-ESRGAN · 4× super-res</Chip>
                </div>
                <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-ss-muted">Issues fixed</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {q.detected_issues.map((d) => (
                    <Chip key={d} tone="red">
                      {d.replace(/_/g, " ")}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Capture + ROI crops */}
        <Reveal delay={0.05}>
          <div className="mt-16 grid gap-8 lg:grid-cols-[1fr_1fr]">
            {/* annotated capture */}
            <div>
              <h3 className="mb-4 text-lg font-bold text-white">Detected in this frame</h3>
              <CaptureFrame key={scenario.id} scenario={scenario} />
            </div>

            {/* ROI crops from this scenario's real regions */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Regions of interest</h3>
                <span className="ss-mono text-xs text-ss-muted">{rois.length} crops · enhanced</span>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {rois.map((roi, i) => {
                  const Icon = ICONS[roi.icon];
                  return (
                    <m.div
                      key={`${scenario.id}-${roi.key}`}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.07, duration: 0.45 }}
                      whileHover={{ y: -4 }}
                      className="ss-card overflow-hidden"
                    >
                      <div className={`relative ring-1 ring-inset ${TONE_RING[roi.tone]}`}>
                        <CropView image={scenario.image} region={roi.region} />
                        <span className="absolute right-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[8px] font-bold text-ss-green">
                          ENH
                        </span>
                      </div>
                      <div className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <Icon className={`h-3.5 w-3.5 ${TONE_TEXT[roi.tone]}`} />
                          <span className="text-xs font-semibold text-white">{roi.label}</span>
                        </div>
                        <div className={`ss-mono mt-0.5 truncate text-[10px] ${TONE_TEXT[roi.tone]}`}>{roi.sub}</div>
                      </div>
                    </m.div>
                  );
                })}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
