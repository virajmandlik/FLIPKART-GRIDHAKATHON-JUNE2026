import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, RefreshCw, X } from "lucide-react";
import { HUMAN_REVIEW_QUEUE, type ReviewQueueItem } from "../../data/reviewQueues";
import { Pill } from "../ui";

export default function HumanReviewQueue() {
  const [items, setItems] = useState<ReviewQueueItem[]>(HUMAN_REVIEW_QUEUE);

  const updateStatus = (id: string, status: ReviewQueueItem["status"]) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const pending = items.filter((i) => i.status === "pending");

  return (
    <div className="gov-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div>
          <div className="gov-label">Officer queue</div>
          <h4 className="font-semibold text-white">Human review · 60–85%</h4>
        </div>
        <Pill tone="amber">{pending.length} pending</Pill>
      </div>

      <div className="space-y-0 divide-y divide-white/[0.04] p-2">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`p-3 ${
                item.status === "approved"
                  ? "bg-ok/[0.04]"
                  : item.status === "rejected"
                    ? "bg-danger/[0.04]"
                    : ""
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded border border-saffron/30 bg-saffron/10 px-1.5 py-0.5 font-mono text-xs font-bold text-saffron">
                      {item.plate}
                    </span>
                    {item.status !== "pending" && (
                      <span className={`stamp-verified ${item.status === "rejected" ? "border-danger/60 text-danger" : ""}`}>
                        {item.status}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">{item.location}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-slate-500">
                    {item.cameraId} · {(item.confidence * 100).toFixed(0)}% · {item.violationType.replace(/_/g, " ")}
                  </div>
                </div>
              </div>

              {item.status === "pending" && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <ActionBtn tone="ok" onClick={() => updateStatus(item.id, "approved")} icon={Check} label="Approve" />
                  <ActionBtn tone="danger" onClick={() => updateStatus(item.id, "rejected")} icon={X} label="Reject" />
                  <ActionBtn tone="teal" onClick={() => updateStatus(item.id, "reprocessing")} icon={RefreshCw} label="Recheck" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <p className="border-t border-white/[0.06] px-4 py-2 text-[10px] text-slate-500">
        BTP policy: no auto-fines · officer signs every e-Challan via Parivahan
      </p>
    </div>
  );
}

function ActionBtn({
  tone,
  onClick,
  icon: Icon,
  label,
}: {
  tone: "ok" | "danger" | "teal";
  onClick: () => void;
  icon: typeof Check;
  label: string;
}) {
  const styles = {
    ok: "border-ok/30 text-ok hover:bg-ok/10",
    danger: "border-danger/30 text-danger hover:bg-danger/10",
    teal: "border-teal/30 text-teal hover:bg-teal/10",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded border px-2.5 py-1 text-[11px] font-semibold transition ${styles[tone]}`}
    >
      <Icon className="h-3 w-3" /> {label}
    </button>
  );
}
