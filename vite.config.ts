import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icon.svg", "brand/geek-eyes.png", "brand/aws-community-day-guatemala.png", "brand/guategeeks.png"],
      manifest: {
        name: "AWS Community Day Guatemala 2026",
        short_name: "AWS Day GT",
        description: "Desafíos, comunidad y créditos en AWS Community Day Guatemala 2026, con GuateGeeks",
        theme_color: "#075c69",
        background_color: "#f6fbf8",
        display: "standalone",
        start_url: "/",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }]
      }
    })
  ],
  resolve: { alias: { "@": "/src", "@shared": "/shared" } }
});
