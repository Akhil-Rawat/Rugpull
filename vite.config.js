import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "robots.txt"],
      manifest: {
        name: "ShieldFi",
        short_name: "ShieldFi",
        description: "Decentralized rug pull insurance on Monad",
        theme_color: "#6C47FF",
        background_color: "#0a0a0f",
        display: "standalone",
        scope: "/",
        start_url: "/",
        orientation: "portrait-primary",
        icons: [
          {
            src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect fill='%236C47FF' width='192' height='192'/><text x='50%' y='50%' font-size='120' fill='white' text-anchor='middle' dominant-baseline='middle' font-weight='bold'>S</text></svg>",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><rect fill='%236C47FF' width='512' height='512'/><text x='50%' y='50%' font-size='320' fill='white' text-anchor='middle' dominant-baseline='middle' font-weight='bold'>S</text></svg>",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/testnet-rpc\.monad\.xyz/,
            handler: "NetworkFirst",
            options: {
              cacheName: "monad-rpc",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 300,
              },
            },
          },
        ],
      },
    }),
  ],
  build: {
    outDir: "dist",
    sourcemap: false,
  },
  server: {
    port: 5173,
    open: true,
  },
});
