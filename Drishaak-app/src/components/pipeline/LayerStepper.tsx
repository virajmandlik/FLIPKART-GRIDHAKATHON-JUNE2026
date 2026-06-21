import { motion } from "framer-motion";
import { Check, Circle } from "lucide-react";
import { LAYER_PIPELINE } from "../../data/layerPipeline";

interface Props {
  activeLayer: number;
  onSelect: (layer: number) => void;
  completedLayers: number[];
}

export default function LayerStepper({ activeLayer, onSelect, completedLayers }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {LAYER_PIPELINE.map((layer, idx) => {
        const done = completedLayers.includes(layer.id);
        const active = activeLayer === layer.id;
        const Icon = layer.icon;

        return (
          <div key={layer.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelect(layer.id)}
              className={`group flex items-center gap-2 rounded-xl px-3 py-2 ring-1 transition ${
                active
                  ? "bg-teal/15 ring-teal/50"
                  : done
                    ? "bg-ok/10 ring-ok/30"
                    : "glass ring-white/10 hover:ring-white/20"
              }`}
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-lg ${
                  active ? "bg-teal/20 text-teal" : done ? "bg-ok/20 text-ok" : "bg-white/5 text-slate-400"
                }`}
              >
                {done && !active ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {layer.short}
                </span>
                <span className={`block text-xs font-semibold ${active ? "text-white" : "text-slate-400"}`}>
                  {layer.title.split(" ")[0]}…
                </span>
              </span>
            </button>
            {idx < LAYER_PIPELINE.length - 1 && (
              <Circle className={`hidden h-1.5 w-1.5 sm:block ${done ? "text-ok" : "text-slate-600"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Progress bar for current layer auto-play */
export function LayerProgressBar({ progress }: { progress: number }) {
  return (
    <div className="h-1 overflow-hidden rounded-full bg-white/10">
      <motion.div
        className="h-full bg-gradient-to-r from-saffron to-teal"
        initial={{ width: "0%" }}
        animate={{ width: `${Math.min(100, progress * 100)}%` }}
        transition={{ ease: "linear", duration: 0.1 }}
      />
    </div>
  );
}
