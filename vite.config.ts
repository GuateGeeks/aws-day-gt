import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icon.svg", "brand/geek-eyes.png", "brand/aws-cd-2026-blanco.png"],
      manifest: {
        name: "AWS Community Day Guatemala 2026",
        short_name: "AWS Day GT",
        description: "GuateGeeks Aura para AWS Community Day Guatemala 2026: Challenges, comunidad y progreso",
        theme_color: "#0e89af",
        background_color: "#f3f9fb",
        display: "standalone",
        start_url: "/",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }]
      }
    })
  ],
  resolve: { alias: { "@": "/src", "@shared": "/shared" } }
});
