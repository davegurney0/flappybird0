import { defineConfig } from "vite";

export default defineConfig({
  base: '/flappybird0/',
  appType: "spa",
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
  },
  preview: {
    host: "0.0.0.0",
  },
  build: {
    target: "es2022",
    sourcemap: true,
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          return id.includes("/node_modules/phaser/") ? "phaser" : undefined;
        },
      },
    },
  },
});
