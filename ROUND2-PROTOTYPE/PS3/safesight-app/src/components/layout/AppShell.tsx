import { Shield } from "lucide-react";
import TabBar from "./TabBar";
import DemoTourMode from "../demo/DemoTourMode";
import { useScenario } from "../../context/ScenarioContext";
import { Pill } from "../ui";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { activeTab } = useScenario();

  return (
    <div className="relative min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-ink-950/95">
        <div className="section-pad flex items-center justify-between py-3">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2.5 text-left"
          >
            <span className="grid h-9 w-9 place-items-center rounded-lg border border-saffron/25 bg-saffron/10">
              <Shield className="h-5 w-5 text-saffron" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-wide text-white">
                Drish<span className="text-saffron">aak</span>
              </div>
              <div className="gov-label normal-case tracking-[0.16em]">
                BTP · Bengaluru Urban
              </div>
            </div>
          </button>
          <div className="hidden items-center gap-3 sm:flex">
            <Pill tone="amber">ASTraM</Pill>
            <div className="text-right">
              <div className="gov-label">UVH-26 pipeline</div>
              <div className="text-[11px] text-slate-500">DPDP · BSA · &lt;2% false-challan</div>
            </div>
          </div>
        </div>
        <TabBar />
      </header>

      <main key={activeTab} className="min-h-[calc(100vh-8rem)]">
        {children}
      </main>
      <DemoTourMode />
    </div>
  );
}
