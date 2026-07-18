// ─────────────────────────────────────────────────────────────────────────
// Performance Metrics (Priority 4 — Performance & Production Hardening)
//
// Single responsibility: collect lightweight, in-process counters and
// timing statistics for critical operations (HTTP requests, chart
// calculation, Gemini calls, cache hit rates) so operators have visibility
// into performance without needing an external APM.
//
// This is intentionally a simple in-memory rolling-window implementation
// (no Prometheus/StatsD dependency) — consistent with the project's
// minimal-dependency footprint. Swapping in a real metrics backend later
// (Priority 5) only means changing this one file.
// ─────────────────────────────────────────────────────────────────────────

const MAX_SAMPLES_PER_METRIC = 200; // rolling window, avoids unbounded memory growth

const counters = new Map(); // name -> count
const timings = new Map(); // name -> number[] (recent durations, ms)

export function incrementCounter(name, by = 1) {
  counters.set(name, (counters.get(name) || 0) + by);
}

export function recordTiming(name, ms) {
  if (!timings.has(name)) timings.set(name, []);
  const samples = timings.get(name);
  samples.push(ms);
  if (samples.length > MAX_SAMPLES_PER_METRIC) samples.shift();
}

function percentile(sortedArr, p) {
  if (sortedArr.length === 0) return null;
  const idx = Math.min(sortedArr.length - 1, Math.floor((p / 100) * sortedArr.length));
  return sortedArr[idx];
}

function summarizeTiming(samples) {
  if (!samples || samples.length === 0) {
    return { count: 0, avgMs: null, p50Ms: null, p95Ms: null, maxMs: null };
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    count: samples.length,
    avgMs: Number((sum / samples.length).toFixed(1)),
    p50Ms: percentile(sorted, 50),
    p95Ms: percentile(sorted, 95),
    maxMs: sorted[sorted.length - 1],
  };
}

/** Times an async operation and records it under `name`, returning fn's result untouched. */
export async function timeAsync(name, fn) {
  const start = process.hrtime.bigint();
  try {
    const result = await fn();
    incrementCounter(`${name}.success`);
    return result;
  } catch (err) {
    incrementCounter(`${name}.failure`);
    throw err;
  } finally {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    recordTiming(name, durationMs);
  }
}

/** Synchronous counterpart of timeAsync. */
export function timeSync(name, fn) {
  const start = process.hrtime.bigint();
  try {
    const result = fn();
    incrementCounter(`${name}.success`);
    return result;
  } catch (err) {
    incrementCounter(`${name}.failure`);
    throw err;
  } finally {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    recordTiming(name, durationMs);
  }
}

/** Returns a full snapshot for the /api/metrics endpoint. */
export function getMetricsSnapshot() {
  const timingsSummary = {};
  for (const [name, samples] of timings.entries()) {
    timingsSummary[name] = summarizeTiming(samples);
  }
  return {
    uptimeSeconds: Math.round(process.uptime()),
    memory: process.memoryUsage
      ? {
          rssMb: Number((process.memoryUsage().rss / 1024 / 1024).toFixed(1)),
          heapUsedMb: Number((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)),
        }
      : null,
    counters: Object.fromEntries(counters),
    timings: timingsSummary,
  };
}

// Exposed for tests only.
export function resetMetrics() {
  counters.clear();
  timings.clear();
}

export default { incrementCounter, recordTiming, timeAsync, timeSync, getMetricsSnapshot, resetMetrics };
