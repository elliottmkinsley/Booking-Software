/**
 * App entry point. Wraps the UI in:
 * - StrictMode (React development checks)
 * - HashRouter so GitHub Pages can refresh deep links (URLs look like /#/labs)
 * - AuthProvider so every screen can read who is signed in
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./presentation/App";
import { AuthProvider } from "./presentation/context/AuthContext";
import "./presentation/styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  </StrictMode>
);
