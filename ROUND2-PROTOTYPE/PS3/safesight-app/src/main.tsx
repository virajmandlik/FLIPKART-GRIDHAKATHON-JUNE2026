import React from "react";
import ReactDOM from "react-dom/client";
import { LazyMotion, domAnimation } from "framer-motion";
import App from "./App";
import { ScenarioProvider } from "./context/ScenarioContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LazyMotion features={domAnimation}>
      <ScenarioProvider>
        <App />
      </ScenarioProvider>
    </LazyMotion>
  </React.StrictMode>
);
