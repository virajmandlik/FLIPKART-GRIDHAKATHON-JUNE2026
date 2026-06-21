import { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Menu, X, ShieldCheck } from "lucide-react";

const LINKS = [
  { id: "problem", label: "Problem" },
  { id: "journey", label: "Journey" },
  { id: "enhance", label: "Enhancement" },
  { id: "engine", label: "AI Engine" },
  { id: "explainable", label: "Explainable" },
  { id: "evidence", label: "Evidence" },
  { id: "command", label: "Command" },
  { id: "impact", label: "Impact" },
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function SiteNav() {
  const [active, setActive] = useState("hero");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const ids = ["hero", ...LINKS.map((l) => l.id)];
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <header className="ss-nav fixed inset-x-0 top-0 z-50">
      <nav className="ss-pad flex h-16 items-center justify-between">
        <button
          type="button"
          onClick={() => scrollToId("hero")}
          className="flex items-center gap-2.5"
          aria-label="Drishaak home"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-ss-gold/30 bg-ss-gold/10">
            <ShieldCheck className="h-4.5 w-4.5 text-ss-gold" />
          </span>
          <span className="text-[15px] font-bold tracking-tight text-white">
            Drish<span className="text-ss-gold">aak</span>
          </span>
        </button>

        <div className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => scrollToId(l.id)}
              className={`relative rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
                active === l.id ? "text-white" : "text-ss-muted/70 hover:text-white"
              }`}
            >
              {active === l.id && (
                <m.span
                  layoutId="nav-pill"
                  className="absolute inset-0 -z-10 rounded-full border border-white/10 bg-white/[0.05]"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              {l.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => scrollToId("final")}
            className="hidden rounded-full bg-ss-gold px-4 py-2 text-[13px] font-bold text-black transition hover:brightness-110 sm:inline-flex"
          >
            Built for BTP
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-white lg:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-white/[0.06] lg:hidden"
          >
            <div className="ss-pad grid grid-cols-2 gap-1 py-4">
              {LINKS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => {
                    scrollToId(l.id);
                    setOpen(false);
                  }}
                  className={`rounded-lg px-3 py-2.5 text-left text-sm font-medium ${
                    active === l.id ? "bg-white/[0.06] text-white" : "text-ss-muted"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
}
