import React from "react";
import ReactDOM from "react-dom/client";
import DeployApp from "./DeployApp";
import "./deploy.css";
import "./brand.css";
import "./design-v2.css";
import "./theme-v3.css";
import "./stability-v4.css";

ReactDOM.createRoot(document.getElementById("deploy-root")!).render(
  <React.StrictMode>
    <DeployApp />
  </React.StrictMode>,
);
