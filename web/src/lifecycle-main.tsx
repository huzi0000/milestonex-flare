import React from "react";
import ReactDOM from "react-dom/client";
import LifecycleApp from "./LifecycleApp";
import "./lifecycle.css";

ReactDOM.createRoot(document.getElementById("lifecycle-root")!).render(
  <React.StrictMode>
    <LifecycleApp />
  </React.StrictMode>,
);
