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
    //
    // Vitest 4 removed the nested `poolOptions.threads.maxThreads` /
    // `poolOptions.forks.maxForks` shape this used to be written as (it
    // now logs "`test.poolOptions` was removed in Vitest 4" and silently
    // ignores the cap) — `maxWorkers` is the current top-level equivalent
    // and works for both the "threads" and "forks" pools.
    maxWorkers: 4,
  },
});
