import { motion } from "framer-motion";

import { Calendar, MapPin, Shield, Users } from "lucide-react";

import {

  DEPLOYMENT_RECOMMENDATIONS,

  JUNCTION_MAP_FOCUS,

  PRIMARY_DEPLOYMENT,

  type DeploymentRecommendation,

} from "../../data/enforcementRecommendations";

import { Pill } from "../ui";



const PRIORITY_TONE: Record<string, "danger" | "amber" | "cyan"> = {

  HIGH: "danger",

  MEDIUM: "amber",

  LOW: "cyan",

};



interface Props {

  recommendation?: DeploymentRecommendation;

  onJunctionFocus?: (nodeId: string, zoomIdx: number) => void;

  showAllRows?: boolean;

}



export default function PoliceDeploymentWidget({

  recommendation = PRIMARY_DEPLOYMENT,

  onJunctionFocus,

  showAllRows = false,

}: Props) {

  const handleRowClick = (rec: DeploymentRecommendation) => {

    const focus = JUNCTION_MAP_FOCUS[rec.id];

    if (focus && onJunctionFocus) {

      onJunctionFocus(focus.nodeId, focus.zoomIdx);

    }

  };



  const displayRecs = showAllRows ? DEPLOYMENT_RECOMMENDATIONS : [recommendation];



  return (

    <motion.div

      initial={{ opacity: 0, y: 12 }}

      animate={{ opacity: 1, y: 0 }}

      className="rounded-2xl glass p-5 ring-1 ring-teal/15"

    >

      <div className="flex items-start gap-3">

        <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal/15 ring-1 ring-teal/40">

          <Shield className="h-5 w-5 text-teal" />

        </span>

        <div>

          <h4 className="font-bold text-white">Police deployment</h4>

          <p className="text-xs text-slate-500">AI-recommended enforcement window</p>

        </div>

        <Pill tone={PRIORITY_TONE[recommendation.priority]}>{recommendation.priority}</Pill>

      </div>



      {displayRecs.map((rec) => (

        <button

          key={rec.id}

          type="button"

          data-tour={rec.id === recommendation.id ? "deployment-row" : undefined}

          onClick={() => handleRowClick(rec)}

          className={`mt-4 w-full text-left transition ${onJunctionFocus ? "cursor-pointer rounded-xl hover:bg-white/[0.03] hover:ring-1 hover:ring-teal/30 p-2 -m-2" : ""}`}

        >

          <div className="flex items-center gap-2">

            <MapPin className="h-4 w-4 text-saffron" />

            <span className="text-lg font-bold text-white">{rec.junction}</span>

          </div>



          <p className="mt-2 text-sm leading-relaxed text-slate-400">{rec.reason}</p>



          <div className="mt-4 grid grid-cols-2 gap-3">

            <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/[0.06]">

              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500">

                <Calendar className="h-3 w-3" /> Window

              </div>

              <div className="mt-1 text-xs font-semibold text-white">{rec.suggestedWindow}</div>

            </div>

            <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/[0.06]">

              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500">

                <Users className="h-3 w-3" /> Officers

              </div>

              <div className="mt-1 text-xs font-semibold text-white">{rec.officersRecommended} recommended</div>

            </div>

          </div>



          <div className="mt-3 font-mono text-[10px] text-slate-500">

            Cameras: {rec.cameraIds.join(", ")}

          </div>



          <div className="mt-4 rounded-lg bg-teal/10 px-3 py-2 text-xs text-teal">

            {rec.expectedImpact}

          </div>



          {onJunctionFocus && (

            <p className="mt-2 text-[10px] text-slate-500">Click to zoom map → {rec.junction}</p>

          )}

        </button>

      ))}

    </motion.div>

  );

}

