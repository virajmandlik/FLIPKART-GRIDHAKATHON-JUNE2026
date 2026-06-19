import { useState } from "react";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Problem from "./components/Problem";
import ViolationGallery from "./components/ViolationGallery";
import LivePipeline from "./components/LivePipeline";
import Architecture from "./components/Architecture";
import CityCommandCenter from "./components/CityCommandCenter";
import Differentiators from "./components/Differentiators";
import Analytics from "./components/Analytics";
import Scale from "./components/Scale";
import Footer from "./components/Footer";
import { DEFAULT_SCENARIO_ID } from "./data/scenarios";

export default function App() {
  const [scenarioId, setScenarioId] = useState(DEFAULT_SCENARIO_ID);

  return (
    <div className="relative min-h-screen">
      <Nav />
      <main>
        <Hero />
        <Problem />
        <ViolationGallery selectedId={scenarioId} onSelect={setScenarioId} />
        <LivePipeline scenarioId={scenarioId} onScenarioChange={setScenarioId} />
        <Architecture />
        <CityCommandCenter />
        <Differentiators />
        <Analytics />
        <Scale />
      </main>
      <Footer />
    </div>
  );
}
