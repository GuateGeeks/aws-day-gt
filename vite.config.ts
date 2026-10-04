import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "AWS Community Day Guatemala 2026",
        short_name: "AWS Day GT",
        description: "Misiones y experiencias del AWS Community Day Guatemala 2026",
        theme_color: "#17233c",
        background_color: "#fff8ed",
        display: "standalone",
        start_url: "/",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }]
      }
    })
  ],
  resolve: { alias: { "@": "/src", "@shared": "/shared" } }
});
