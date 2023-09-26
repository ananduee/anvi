import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { RecoilRoot } from "recoil";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RecoilRoot>
      <React.Suspense fallback={<div>Initializing app...</div>}>
        <App />
      </React.Suspense>
    </RecoilRoot>
  </React.StrictMode>
);
