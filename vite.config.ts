/**
 * Vite build settings.
 *
 * Local `npm run dev` serves the app at the site root (localhost:5173).
 * Production builds are published to GitHub Pages under /Booking-Software/,
 * so image and script URLs need that prefix — that is what `base` does.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/Booking-Software/" : "/",
}));
