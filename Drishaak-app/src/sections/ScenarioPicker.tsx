import { m } from "framer-motion";
import { useScenarioStore } from "./scenarioStore";
import { HUMAN_VIOLATION } from "./scenarioDerive";

export default function ScenarioPicker() {
  const { all, id, setId } = useScenarioStore();
  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-3 [scrollbar-width:thin]">
      {all.map((s) => {
        const on = s.id === id;
        return (
          <m.button
            key={s.id}
            type="button"
            onClick={() => setId(s.id)}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            className={`group relative w-40 shrink-0 overflow-hidden rounded-2xl border text-left transition ${
              on ? "border-ss-gold/60 ring-1 ring-ss-gold/40" : "border-white/10 hover:border-white/25"
            }`}
          >
            <div className="relative aspect-video overflow-hidden">
              <img
                src={s.image}
                alt={s.title}
                draggable={false}
                className={`h-full w-full object-cover transition duration-500 ${
                  on ? "scale-105" : "opacity-80 group-hover:opacity-100"
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
              <span
                className={`absolute left-2 top-2 h-2 w-2 rounded-full ${
                  s.isViolation ? "bg-ss-red" : "bg-ss-green"
                }`}
              />
              {on && (
                <span className="absolute right-2 top-2 rounded-full bg-ss-gold px-2 py-0.5 text-[9px] font-bold text-black">
                  SELECTED
                </span>
              )}
            </div>
            <div className="absolute inset-x-0 bottom-0 p-2.5">
              <div className="text-[11px] font-bold leading-tight text-white">{s.title}</div>
              <div className="text-[9px] text-ss-muted">{HUMAN_VIOLATION[s.violationType]}</div>
            </div>
          </m.button>
        );
      })}
    </div>
  );
}
