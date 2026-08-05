import React from "react";
import ReactDOM from "react-dom/client";
import LifecycleApp from "./LifecycleApp";
import "./lifecycle.css";
import "./brand.css";
import "./design-v2.css";
import "./theme-v3.css";

ReactDOM.createRoot(document.getElementById("lifecycle-root")!).render(
  <React.StrictMode>
    <LifecycleApp />
  </React.StrictMode>,
);
