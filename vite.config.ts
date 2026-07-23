import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In production builds the app is served from GitHub Pages at
// https://elliottmkinsley.github.io/Booking-Software/, hence the base path.
// Local dev stays at the root (http://localhost:5173/).
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/Booking-Software/" : "/",
}));
