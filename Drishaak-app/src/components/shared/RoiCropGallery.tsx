import { motion } from "framer-motion";
import { ZoomIn } from "lucide-react";
import type { Layer2Roi } from "../../data/layerOutputs";
import { Pill } from "../ui";

const ROI_GRADIENTS: Record<string, string> = {
  license_plate: "from-amber-500/40 to-amber-700/20",
  helmet: "from-danger/40 to-red-900/20",
  rider: "from-teal/40 to-cyan-900/20",
  driver: "from-violet-500/40 to-violet-900/20",
  seatbelt_region: "from-saffron/40 to-orange-900/20",
  vehicle: "from-slate-500/40 to-slate-800/20",
};

interface Props {
  regions: Layer2Roi[];
  frameImage: string;
  highlightTypes?: string[];
}

export default function RoiCropGallery({ regions, frameImage, highlightTypes }: Props) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <ZoomIn className="h-4 w-4 text-saffron" />
        <h4 className="text-sm font-bold text-white">ROI crops for downstream classifiers</h4>
        <Pill tone="amber">{regions.length} regions</Pill>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {regions.map((roi, i) => {
          const highlighted = highlightTypes?.includes(roi.type);
          return (
            <motion.div
              key={roi.roi_id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ scale: 1.04, y: -2 }}
              className={`overflow-hidden rounded-xl ring-1 ${highlighted ? "ring-teal/60" : "ring-white/10"}`}
            >
              <div
                className={`aspect-square bg-gradient-to-br ${ROI_GRADIENTS[roi.type] ?? "from-slate-600/40 to-slate-900/20"} relative`}
              >
                <img
                  src={frameImage}
                  alt={roi.type}
                  className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-overlay"
                  draggable={false}
                />
                <div
                  className={`absolute inset-2 rounded ring-2 ${highlighted ? "ring-teal animate-pulse" : "ring-saffron/60"}`}
                />
                {roi.enhancement_applied && (
                  <span className="absolute bottom-1 right-1 rounded bg-teal/80 px-1 py-0.5 text-[8px] font-bold text-white">
                    ENH
                  </span>
                )}
              </div>
              <div className="bg-ink-900/80 px-2 py-2">
                <div className="truncate text-[10px] font-bold uppercase text-slate-400">
                  {roi.type.replace(/_/g, " ")}
                </div>
                <div className="font-mono text-[9px] text-slate-500">{roi.roi_id}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
