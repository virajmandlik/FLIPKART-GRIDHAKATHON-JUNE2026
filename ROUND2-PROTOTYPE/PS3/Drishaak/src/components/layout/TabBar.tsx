import { useScenario, type AppTab } from "../../context/ScenarioContext";

const TABS: { id: AppTab; label: string; short: string }[] = [
  { id: "overview", label: "Overview", short: "Home" },
  { id: "live-demo", label: "Live Demo", short: "Demo" },
  { id: "pipeline-journey", label: "Pipeline Journey", short: "Journey" },
  { id: "architecture", label: "Architecture", short: "Arch" },
  { id: "command-center", label: "Command Center", short: "Command" },
  { id: "evidence-review", label: "Evidence & Review", short: "Evidence" },
];

export default function TabBar() {
  const { activeTab, setActiveTab, demoTourActive } = useScenario();

  return (
    <nav className="section-pad overflow-x-auto pb-2">
      <div className="flex min-w-max gap-1 rounded-xl bg-white/[0.03] p-1 ring-1 ring-white/10">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              disabled={demoTourActive}
              onClick={() => !demoTourActive && setActiveTab(tab.id)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                demoTourActive ? "cursor-not-allowed opacity-50" : ""
              } ${
                active
                  ? "bg-saffron text-ink-950 shadow-glow-saffron"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.short}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
