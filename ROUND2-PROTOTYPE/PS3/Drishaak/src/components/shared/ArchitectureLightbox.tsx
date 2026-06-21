import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, X, ZoomIn } from "lucide-react";

const FULL_DIAGRAM = {
  src: "/architecture/LAYER1.png",
  title: "Drishaak · UVH-26 full pipeline",
  caption: "Layer 1–5 edge-to-cloud architecture (detailed engineering view)",
};

interface Props {
  /** When true, render only the trigger link (no thumbnail grid). */
  linkOnly?: boolean;
}

export default function ArchitectureLightbox({ linkOnly = false }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {linkOnly ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-teal transition hover:text-teal-light"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View full diagram
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group flex w-full items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-left transition hover:border-white/[0.14]"
        >
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Engineering detail
            </div>
            <div className="text-sm font-medium text-white">{FULL_DIAGRAM.title}</div>
          </div>
          <ZoomIn className="h-4 w-4 text-slate-500 transition group-hover:text-white" />
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/95 p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              className="relative max-h-[92vh] max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute -right-2 -top-2 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-ink-900 hover:bg-ink-800"
              >
                <X className="h-4 w-4" />
              </button>
              <img
                src={FULL_DIAGRAM.src}
                alt={FULL_DIAGRAM.title}
                className="max-h-[85vh] w-full rounded-lg border border-white/[0.08] object-contain"
                draggable={false}
              />
              <div className="mt-3 text-center">
                <div className="text-sm font-semibold text-white">{FULL_DIAGRAM.title}</div>
                <div className="text-xs text-slate-500">{FULL_DIAGRAM.caption}</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
