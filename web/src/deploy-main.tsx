import React from "react";
import ReactDOM from "react-dom/client";
import DeployApp from "./DeployApp";
import "./deploy.css";

ReactDOM.createRoot(document.getElementById("deploy-root")!).render(
  <React.StrictMode>
    <DeployApp />
  </React.StrictMode>,
);
