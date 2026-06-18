import { useEffect, useState } from "react";
import { Radar, Github } from "lucide-react";

const LINKS = [
  ["Problem", "problem"],
  ["Scenarios", "scenarios"],
  ["Live Pipeline", "pipeline"],
  ["Architecture", "architecture"],
  ["Deployment", "deployment"],
  ["Edge", "edge"],
  ["Analytics", "analytics"],
  ["Scale", "scale"],
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", f);
    return () => window.removeEventListener("scroll", f);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? "py-2" : "py-4"}`}>
      <nav className={`section-pad flex items-center justify-between rounded-2xl ${scrolled ? "glass-strong py-2.5" : "py-1"} transition-all`}>
        <a href="#top" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-brand/15 ring-1 ring-amber-brand/40">
            <Radar className="h-5 w-5 text-amber-brand" />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-extrabold tracking-wide text-white">SafeSight<span className="text-amber-brand"> EN</span></div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Edge Enforcement</div>
          </div>
        </a>

        <div className="hidden items-center gap-7 lg:flex">
          {LINKS.map(([label, id]) => (
            <a key={id} href={`#${id}`} className="text-sm font-medium text-slate-400 transition hover:text-white">
              {label}
            </a>
          ))}
        </div>

        <a href="#pipeline"
          className="group inline-flex items-center gap-2 rounded-xl bg-amber-brand px-4 py-2 text-sm font-bold text-ink-950 transition hover:brightness-110">
          <Github className="h-4 w-4" /> See it run
        </a>
      </nav>
    </header>
  );
}
