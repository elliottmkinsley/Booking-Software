import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// HashRouter (URLs like /#/labs) so GitHub Pages static hosting can serve
// deep links and refreshes without a server-side fallback.
import { HashRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  </StrictMode>
);
