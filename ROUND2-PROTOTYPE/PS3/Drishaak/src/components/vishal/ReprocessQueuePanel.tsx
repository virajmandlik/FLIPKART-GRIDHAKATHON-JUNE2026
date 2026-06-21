import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, Layers, RefreshCw } from "lucide-react";
import { REPROCESS_QUEUE, type ReviewQueueItem } from "../../data/reviewQueues";
import { Pill } from "../ui";

export default function ReprocessQueuePanel() {
  const [items, setItems] = useState<ReviewQueueItem[]>(REPROCESS_QUEUE);
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  const triggerReprocess = (id: string) => {
    setAnimatingId(id);
    setTimeout(() => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: "reprocessing" as const } : item))
      );
      setAnimatingId(null);
    }, 2200);
  };

  return (
    <div className="gov-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div>
          <div className="gov-label">Low confidence</div>
          <h4 className="font-semibold text-white">Reprocess queue · &lt;60%</h4>
        </div>
        <Pill tone="cyan">{items.filter((i) => i.status === "pending").length} awaiting</Pill>
      </div>

      <div className="divide-y divide-white/[0.04] p-2">
        {items.map((item) => (
          <div key={item.id} className="p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <span className="font-mono text-sm font-bold text-teal">{item.plate}</span>
                <div className="text-xs text-slate-400">{item.location}</div>
                <div className="font-mono text-[10px] text-slate-500">
                  {item.cameraId} · {(item.confidence * 100).toFixed(0)}% conf
                </div>
              </div>
              {item.status === "reprocessing" ? (
                <Pill tone="cyan">REPROCESSING</Pill>
              ) : (
                <button
                  type="button"
                  onClick={() => triggerReprocess(item.id)}
                  disabled={animatingId === item.id}
                  className="inline-flex items-center gap-1 rounded border border-teal/30 px-2.5 py-1 text-[11px] font-semibold text-teal transition hover:bg-teal/10 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${animatingId === item.id ? "animate-spin" : ""}`} />
                  L2 reprocess
                </button>
              )}
            </div>

            <AnimatePresence>
              {animatingId === item.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 overflow-hidden"
                >
                  <div className="flex items-center justify-center gap-2 rounded border border-teal/20 bg-teal/5 py-3 text-[10px]">
                    <Layers className="h-3.5 w-3.5 text-teal" />
                    <ArrowDown className="h-3 w-3 text-slate-500" />
                    <span className="font-mono text-teal">L2 Restormer</span>
                    <ArrowDown className="h-3 w-3 text-slate-500" />
                    <span className="font-mono text-ok">L3 re-validate</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {item.status === "reprocessing" && !animatingId && (
              <p className="mt-2 text-[10px] text-teal">Queued for L3 agentic re-validation.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
