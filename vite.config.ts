import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  // Served from a project page on GitHub Pages (nemezzizz.github.io/tradedash/)
  // in production; root in dev. Override with VITE_BASE if the repo is renamed.
  base: process.env.VITE_BASE ?? (process.env.NODE_ENV === "production" ? "/tradedash/" : "/"),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          klinecharts: ["react-klinecharts", "react-klinecharts-ui", "klinecharts"],
          ui: ["@base-ui-components/react", "lucide-react"],
        },
      },
    },
  },
});
