import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Plain single-page app. The same build runs:
//  - inside the Android app (Capacitor copies dist/ into the APK)
//  - on Vercel as a website, next to the small API in /api
export default defineConfig({
  base: "./",
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  plugins: [react(), tailwindcss()],
  build: { outDir: "dist", sourcemap: false },
});
