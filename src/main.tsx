import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { DevTools } from "jotai-devtools";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <DevTools />
    <React.Suspense fallback={<div>Initializing app...</div>}>
      <App />
    </React.Suspense>
  </React.StrictMode>
);
