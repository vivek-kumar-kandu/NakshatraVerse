// ─────────────────────────────────────────────────────────────────────────
// Request logging middleware
// Lightweight logger (no extra dependency) so every request/response is
// traceable in the console — essential for diagnosing "AI report
// unavailable" style failures without guessing. The original per-request
// console line (`METHOD url -> status (Nms)`) is unchanged.
//
// Priority 4 additions (both additive, neither changes the line above):
//   - a per-request id, attached to `req.id` and returned as the
//     `X-Request-Id` response header, so a single request can be traced
//     across multiple log lines (e.g. "chart calc" + "Gemini call" +
//     final response) — very handy when diagnosing a slow/failed report.
//   - request timing is fed into services/utils/metrics.js so
//     GET /api/metrics can report aggregate p50/p95 latency per route,
//     not just per-request numbers scrolling by in the console.
// ─────────────────────────────────────────────────────────────────────────
import crypto from "crypto";
import logger from "../services/utils/logger.js";
import { recordTiming, incrementCounter } from "../services/utils/metrics.js";

export function requestLogger(req, res, next) {
  const start = Date.now();
  req.id = req.headers["x-request-id"] || crypto.randomUUID();
  res.setHeader("X-Request-Id", req.id);

  res.on("finish", () => {
    const ms = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`);
    // Route-level metric, e.g. "POST /api/generate-report" — keeps
    // per-route stats distinct without needing a full APM.
    const routeLabel = `http.${req.method}.${req.route?.path || req.path}`;
    recordTiming(routeLabel, ms);
    incrementCounter(`http.status.${res.statusCode}`);
  });
  next();
}

export default requestLogger;
