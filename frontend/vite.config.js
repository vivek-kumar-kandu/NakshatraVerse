import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5187,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:8617",
        changeOrigin: true,
      },
    },
  },
  // Phase 5 (Bundle Optimization): production-only build settings.
  // - `sourcemap: false` is Vite's default already, made explicit so a
  //   production build never accidentally ships source maps.
  // - `manualChunks` splits react/react-dom into their own chunk, separate
  //   from application code. They change far less often than the app
  //   itself, so returning visitors' browsers (and any CDN in front of
  //   this build) can keep serving the cached vendor chunk across app
  //   deploys instead of re-downloading it every time. Pure build-output
  //   change — no effect on what renders or how the app behaves.
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
        },
      },
    },
  },
});
