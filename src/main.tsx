import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Provider } from "jotai";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Provider>
      <React.Suspense fallback={<div>Initializing app...</div>}>
        <App />
      </React.Suspense>
    </Provider>
  </React.StrictMode>
);
