import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initTheme } from "@/hooks/useTheme";
import "@/styles/fonts.css";
import "@/styles/global.css";

initTheme();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);