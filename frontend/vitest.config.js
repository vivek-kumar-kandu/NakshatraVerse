import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.js"],
    include: ["tests/**/*.test.jsx"],
    testTimeout: 45000,
    hookTimeout: 45000,
    // Cap how many test files Vitest runs concurrently. By default it
    // spins up one worker per CPU core, which on a modest/loaded machine
    // means 20+ animated app instances (each with its own looping
    // starfield background) competing for CPU at once — that's what
    // produced the 170s "environment" setup time and the sporadic
    // timeouts in App.test.jsx/Settings.test.jsx/ExplorerTab.test.jsx,
    // not an actual app regression (the same login flow passed fine in
    // Auth.test.jsx in the same run). 4 is a reasonable ceiling that
    // still parallelizes on capable machines without starving slower ones.
    poolOptions: {
      threads: { maxThreads: 4 },
      forks: { maxForks: 4 },
    },
  },
});
