import { motion } from "framer-motion";

import { CloudRain, Moon, Sparkles } from "lucide-react";

import { useScenario } from "../../context/ScenarioContext";

import { GOLDEN_PATH_FRAME, LAYER2_OUTPUT } from "../../data/layerOutputs";

import BeforeAfterSlider from "../shared/BeforeAfterSlider";

import RoiCropGallery from "../shared/RoiCropGallery";

import { Pill } from "../ui";



export default function Layer2EnhancementPanel() {

  const { scenario } = useScenario();

  const data = LAYER2_OUTPUT;

  const qa = data.quality_assessment;



  const isLowLight = scenario.lowLight || scenario.id === "low-light-rain";

  const beforeScore = isLowLight ? 0.28 : qa.quality_score_before;

  const afterScore = isLowLight ? 0.82 : qa.quality_score_after;

  const improvement = isLowLight ? 192.8 : qa.improvement_percent;

  const frameImage = scenario.image || GOLDEN_PATH_FRAME;

  const issues = isLowLight

    ? ["low_light", "rain_streaks", "motion_blur", "compression_artifacts"]

    : qa.detected_issues;



  return (

    <div className="space-y-5">

      {isLowLight && (

        <motion.div

          initial={{ opacity: 0, y: -8 }}

          animate={{ opacity: 1, y: 0 }}

          className="flex flex-wrap items-center gap-2 rounded-xl bg-violet-500/10 p-4 ring-1 ring-violet-400/30"

        >

          <Moon className="h-4 w-4 text-violet-300" />

          <CloudRain className="h-4 w-4 text-cyan-tech" />

          <span className="text-sm font-bold text-white">Low-light + rain preprocessing path</span>

          <Pill tone="cyan">CLAHE · bilateral denoise · rain suppression</Pill>

          <p className="w-full text-xs text-slate-400">

            Hebbal flyover scenario — enhancement critical before L3 detection. Quality {Math.round(beforeScore * 100)}% → {Math.round(afterScore * 100)}%.

          </p>

        </motion.div>

      )}



      <BeforeAfterSlider

        scenario={scenario}

        beforeScore={beforeScore}

        afterScore={afterScore}

        beforeFilter={isLowLight ? "brightness-50 blur-[2px] contrast-75 saturate-50" : "brightness-75 blur-[1px] contrast-90"}

        afterFilter={isLowLight ? "brightness-125 contrast-115 saturate-110" : "brightness-110 contrast-110 saturate-110"}

      />



      <motion.div

        initial={{ opacity: 0, y: 12 }}

        animate={{ opacity: 1, y: 0 }}

        className="grid gap-4 sm:grid-cols-3"

      >

        <Metric

          label="Quality improvement"

          value={`+${improvement.toFixed(1)}%`}

          sub={`${beforeScore} → ${afterScore}`}

        />

        <Metric

          label="Restormer"

          value="Applied"

          sub={isLowLight ? "denoising, deraining, deblurring" : data.enhancement_pipeline.restormer.operations.join(", ")}

        />

        <Metric

          label="Real-ESRGAN"

          value={data.enhancement_pipeline.real_esrgan.scale_factor}

          sub={data.enhancement_pipeline.real_esrgan.operations.join(", ")}

        />

      </motion.div>



      <RoiCropGallery

        regions={data.roi_regions}

        frameImage={frameImage}

        highlightTypes={isLowLight ? ["helmet", "license_plate", "rider"] : undefined}

      />



      <div className="rounded-xl bg-teal/5 p-4 ring-1 ring-teal/20">

        <div className="flex items-center gap-2 text-xs font-bold text-teal">

          <Sparkles className="h-4 w-4" /> Layer 3 tasks queued

          {isLowLight && <Pill tone="cyan">SAHI boost enabled</Pill>}

        </div>

        <div className="mt-2 flex flex-wrap gap-2">

          {data.layer_3_tasks.map((t) => (

            <span key={t} className="rounded-md bg-white/5 px-2 py-1 text-[11px] text-slate-300">

              {t.replace(/_/g, " ")}

            </span>

          ))}

        </div>

      </div>

    </div>

  );

}



function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {

  return (

    <div className="rounded-xl glass p-4">

      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>

      <div className="mt-1 text-xl font-extrabold text-white">{value}</div>

      <div className="mt-1 text-[11px] text-slate-500">{sub}</div>

    </div>

  );

}

