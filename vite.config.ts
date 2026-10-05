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
        description: "Quetzi, tu compañero para el AWS Community Day Guatemala 2026: agenda, ruta personal y misiones",
        theme_color: "#0f7a4a",
        background_color: "#f3f7ee",
        display: "standalone",
        start_url: "/",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }]
      }
    })
  ],
  resolve: { alias: { "@": "/src", "@shared": "/shared" } }
});
