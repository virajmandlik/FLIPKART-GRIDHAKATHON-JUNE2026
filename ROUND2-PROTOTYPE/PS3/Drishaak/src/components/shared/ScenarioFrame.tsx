import { useState } from "react";
import { MapPin } from "lucide-react";
import type { Scenario } from "../../data/scenarios";
import CctvScene from "../CctvScene";

interface Props {
  scenario: Scenario;
  className?: string;
  filterClass?: string;
  showLocation?: boolean;
}

/** SVG junction scene with optional PNG overlay — PNG 404s fall back to CctvScene. */
export default function ScenarioFrame({
  scenario,
  className = "",
  filterClass = "",
  showLocation = false,
}: Props) {
  const [photoLoaded, setPhotoLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-gradient-to-b from-slate-800 to-ink-950 ${className}`}>
      <CctvScene scenario={scenario} />
      <img
        src={scenario.image}
        alt=""
        aria-hidden
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
          photoLoaded ? "opacity-100" : "opacity-0"
        } ${filterClass}`}
        onLoad={() => setPhotoLoaded(true)}
        onError={() => setPhotoLoaded(false)}
        draggable={false}
      />
      {!photoLoaded && filterClass && (
        <div className={`pointer-events-none absolute inset-0 ${filterClass}`} />
      )}
      {showLocation && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-ink-950/75 px-2 py-1 text-[10px] text-slate-300 backdrop-blur">
          <MapPin className="h-3 w-3 text-teal" />
          {scenario.location.split(",")[0]}
        </div>
      )}
    </div>
  );
}
