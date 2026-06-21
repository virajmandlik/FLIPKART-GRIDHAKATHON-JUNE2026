import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Maximize2, X, Layers } from "lucide-react";
import { Reveal } from "./_ui";

const SRC = "/architecture/system-architecture.png";

export default function ArchitectureBlueprint() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Reveal>
        <div className="mx-auto mt-12 max-w-5xl">
          <m.div
            whileHover={{ y: -3 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white p-2 shadow-[0_40px_120px_-50px_rgba(245,184,74,0.5)] sm:p-3"
          >
            {/* gold accent ring */}
            <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-ss-gold/15" />

            {/* diagram */}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="relative block w-full cursor-zoom-in overflow-hidden rounded-xl"
              aria-label="Expand architecture diagram"
            >
              <img
                src={SRC}
                alt="Drishaak 5-layer edge-to-command architecture"
                className="block w-full"
                draggable={false}
              />
            </button>

            {/* floating expand pill */}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-black/75 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur transition hover:bg-black/90"
            >
              <Maximize2 className="h-3.5 w-3.5" /> Expand
            </button>
          </m.div>

          <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-ss-muted/80">
            <Layers className="h-3.5 w-3.5 text-ss-gold" />
            Full 5-layer blueprint · privacy-first · human-in-the-loop · click to zoom
          </p>
        </div>
      </Reveal>

      {/* Lightbox */}
      <AnimatePresence>
        {open && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[80] flex items-center justify-center overflow-auto bg-black/92 p-3 backdrop-blur-sm sm:p-8"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="fixed right-5 top-5 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/60 text-white transition hover:border-ss-gold/50 hover:text-ss-gold"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <m.img
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              src={SRC}
              alt="Drishaak architecture — full view"
              className="h-auto w-full max-w-6xl rounded-xl border border-white/10 bg-white"
              draggable={false}
            />
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
