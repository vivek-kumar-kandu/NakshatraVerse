// ─────────────────────────────────────────────────────────────────────────
// Centralized logger.
// Every module logs through here instead of calling console.* directly, so
// log format/level handling lives in exactly one place. Default behavior
// (LOG_FORMAT unset/"text") matches the original inline
// console.log/warn/error calls exactly (same messages, same streams).
//
// Priority 4 addition: setting LOG_FORMAT=json in the environment switches
// every log line to a single-line structured JSON object (level, time,
// message, and any extra fields) — easier for a log aggregator (CloudWatch,
// Datadog, ELK, etc.) to parse in production. This is opt-in and additive;
// nothing calls it unless LOG_FORMAT=json is explicitly set, so existing
// deployments see byte-identical console output unless they opt in.
// ─────────────────────────────────────────────────────────────────────────

import { recordTiming, incrementCounter } from "./metrics.js";

// Read lazily (not at module load) so tests can toggle process.env.LOG_FORMAT.
function isJsonFormat() {
  return (process.env.LOG_FORMAT || "text").trim() === "json";
}

function timestamp() {
  return new Date().toISOString();
}

function emit(stream, level, args) {
  if (isJsonFormat()) {
    // First arg is treated as the message; remaining args are attached
    // under `meta` for context (mirrors how the text formatter simply
    // space-joins everything).
    const [message, ...rest] = args;
    const line = {
      level,
      time: timestamp(),
      message: typeof message === "string" ? message : JSON.stringify(message),
    };
    if (rest.length) {
      line.meta = rest.map((r) => (r instanceof Error ? { message: r.message, stack: r.stack } : r));
    }
    stream(JSON.stringify(line));
    return;
  }
  stream(`[${timestamp()}]`, ...args);
}

export const logger = {
  info(...args) {
    emit(console.log, "info", args);
  },
  warn(...args) {
    emit(console.warn, "warn", args);
  },
  error(...args) {
    emit(console.error, "error", args);
  },
  debug(...args) {
    if (!process.env.DEBUG) return;
    if (isJsonFormat()) {
      emit(console.log, "debug", args);
    } else {
      console.log(`[${timestamp()}] [debug]`, ...args);
    }
  },
};

// Mask an API key for safe logging (e.g. "AQ.Ab8…HhLg (len 53)").
export function maskKey(key) {
  if (!key) return "(none)";
  if (key.length <= 8) return "*".repeat(key.length);
  return `${key.slice(0, 6)}…${key.slice(-4)} (len ${key.length})`;
}

// Wraps an async function and logs how long it took plus success/failure —
// used for astrology calculation, AI requests, and full request handling so
// execution time is always visible without duplicating try/catch/timing
// code at every call site.
//
// Priority 4: also feeds services/utils/metrics.js so the same timing is
// available in aggregate (avg/p50/p95) via GET /api/metrics, not just as
// individual log lines. Import is deferred (require-on-call via dynamic
// import is avoided for simplicity — metrics.js has no dependency on
// logger.js, so a static import is safe and cannot create a cycle).
export async function withTiming(label, fn) {
  const start = Date.now();
  try {
    const result = await fn();
    const ms = Date.now() - start;
    logger.info(`${label} completed in ${ms}ms`);
    recordTiming(label, ms);
    incrementCounter(`${label}.success`);
    return result;
  } catch (err) {
    const ms = Date.now() - start;
    logger.error(`${label} failed after ${ms}ms:`, err.message);
    recordTiming(label, ms);
    incrementCounter(`${label}.failure`);
    throw err;
  }
}

export default logger;
