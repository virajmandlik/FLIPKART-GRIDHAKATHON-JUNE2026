import SiteNav from "./sections/SiteNav";
import HeroSection from "./sections/HeroSection";
import ProblemSection from "./sections/ProblemSection";
import JourneySection from "./sections/JourneySection";
import Layer1Section from "./sections/Layer1Section";
import Layer2Section from "./sections/Layer2Section";
import Layer3Section from "./sections/Layer3Section";
import ExplainabilitySection from "./sections/ExplainabilitySection";
import EvidenceSection from "./sections/EvidenceSection";
import CommandCenterSection from "./sections/CommandCenterSection";
import ArchitectureSection from "./sections/ArchitectureSection";
import ImpactSection from "./sections/ImpactSection";
import FinalSection from "./sections/FinalSection";
import { ScenarioStoreProvider } from "./sections/scenarioStore";
import CalibrationOverlay from "./sections/CalibrationOverlay";

export default function App() {
  if (typeof window !== "undefined" && window.location.hash.includes("calib")) {
    return <CalibrationOverlay />;
  }
  return (
    <ScenarioStoreProvider>
    <div className="ss-shell min-h-screen">
      <SiteNav />
      <main>
        <HeroSection />
        <ProblemSection />
        <JourneySection />
        <Layer1Section />
        <Layer2Section />
        <Layer3Section />
        <ExplainabilitySection />
        <EvidenceSection />
        <CommandCenterSection />
        <ArchitectureSection />
        <ImpactSection />
        <FinalSection />
      </main>
    </div>
    </ScenarioStoreProvider>
  );
}
