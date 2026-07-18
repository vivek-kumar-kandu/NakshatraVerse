// ─────────────────────────────────────────────────────────────────────────
// NakshatraVerse backend entrypoint.
// This file only wires the app together: config, middleware, routes,
// startup diagnostics. All business logic lives in services/, controllers/,
// validators/, and middleware/ — see those modules for behavior.
//
// Priority 4 additions (all additive — routes, JSON response shapes, and
// startup log lines are unchanged):
//   - compression: gzip API responses (bigger win for /api/chart and
//     /api/generate-report, whose payloads include the full planetary
//     JSON embedded in the Gemini narrative response).
//   - security headers + JSON body size cap (see middleware/security.js
//     and config/env.js MAX_REQUEST_BODY_SIZE).
//   - trust proxy: makes req.ip resolve correctly (and therefore the
//     rate limiter key correctly) when deployed behind a reverse proxy /
//     load balancer, which is the normal production topology.
//   - createApp()/app are exported (in addition to being run directly)
//     so integration tests can exercise real Express routing with
//     supertest without binding a network port.
//   - process-level unhandledRejection/uncaughtException logging, so a
//     bug can never fail silently in production — it's always logged
//     before the process is allowed to exit.
// ─────────────────────────────────────────────────────────────────────────
import express from "express";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import { pathToFileURL } from "url";
import config from "./config/env.js";
import logger, { maskKey } from "./services/utils/logger.js";
import requestLogger from "./middleware/requestLogger.js";
import { securityHeaders } from "./middleware/security.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import astrologyRoutes from "./routes/astrology.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
// V3.0 Phase 4 (AI Astrology Assistant): additive route group, mirrors
// reportsRoutes' mounting pattern exactly.
import assistantRoutes from "./routes/assistant.routes.js";
// V4.0 Phase 1 (Kundli Matching): additive route group, mirrors
// reportsRoutes' mounting pattern exactly.
import matchingRoutes from "./routes/matching.routes.js";
// V4.1 Phase 2 (Daily Panchang & Muhurat Finder): additive route group,
// mirrors matchingRoutes' mounting pattern exactly.
import panchangRoutes from "./routes/panchang.routes.js";
// V4.2 (Family Profiles & Relationship Hub): additive route groups,
// mirror matchingRoutes'/panchangRoutes' mounting pattern exactly.
import familyProfileRoutes from "./routes/familyProfile.routes.js";
import relationshipHubRoutes from "./routes/relationshipHub.routes.js";
// V4.3 (AI Life Coach): additive route group, mirrors assistantRoutes'
// mounting pattern exactly.
import lifeCoachRoutes from "./routes/lifeCoach.routes.js";
// V4.4 Phase 1 (Notification Infrastructure): additive route group,
// mirrors familyProfileRoutes'/lifeCoachRoutes' mounting pattern exactly.
import notificationRoutes from "./routes/notification.routes.js";
// V4.5 Phase 1A (Festival Backend Infrastructure): additive route group,
// mirrors panchangRoutes' mounting pattern exactly (public, no auth).
import festivalRoutes from "./routes/festival.routes.js";
// V4.5 Phase 2 (Festival Intelligence): additive, sibling route group —
// does not alter festivalRoutes/festival.routes.js above in any way.
import festivalIntelligenceRoutes from "./routes/festivalIntelligence.routes.js";
// V5.0 Phase 5C (Explorer AI): additive route group, mirrors
// assistantRoutes'/lifeCoachRoutes' mounting pattern exactly.
import explorerAiRoutes from "./routes/explorerAi.routes.js";
// V5.2 (AI Timeline) — additive only, mirrors explorerAiRoutes above.
import aiTimelineRoutes from "./routes/aiTimeline.routes.js";
// V5.3 (Explainable Report Intelligence) — additive only, mirrors
// aiTimelineRoutes/explorerAiRoutes above.
import explanationRoutes from "./routes/explanation.routes.js";
import personalizationRoutes from "./routes/personalization.routes.js";

export function createApp() {
  const app = express();

  // Needed so req.ip reflects the real client (not the proxy) when run
  // behind nginx/a load balancer/a PaaS router in production — without
  // this, every request behind a proxy would appear to come from the same
  // IP and the rate limiter would misbehave.
  app.set("trust proxy", true);
  app.disable("x-powered-by");

  app.use(compression());
  app.use(
    cors({
      origin: config.FRONTEND_ORIGIN === "*" ? true : config.FRONTEND_ORIGIN.split(",").map((s) => s.trim()),
      // Priority 5.2: session cookies (access/refresh tokens) must be
      // allowed to travel with cross-origin fetch() calls from the
      // frontend's own origin — credentials:true plus a reflected/specific
      // origin (never "*") is required for browsers to accept the cookie.
      credentials: true,
    })
  );
  app.use(securityHeaders);
  app.use(express.json({ limit: config.MAX_REQUEST_BODY_SIZE }));
  app.use(cookieParser());
  app.use(requestLogger);

  app.use("/api", astrologyRoutes);
  // Priority 5.2: Authentication, User Management, Saved Reports, PDF
  // Export. All new, additive route groups — none of the paths above
  // (/api/chart, /api/generate-report, /api/health, /api/metrics) change.
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/reports", reportsRoutes);
  // V3.0 Phase 4 (AI Astrology Assistant): additive, new route group.
  app.use("/api/assistant", assistantRoutes);
  // V4.0 Phase 1 (Kundli Matching): additive, new route group.
  app.use("/api/matching", matchingRoutes);
  // V4.1 Phase 2 (Daily Panchang & Muhurat Finder): additive, new route group.
  app.use("/api/panchang", panchangRoutes);
  // V4.2 (Family Profiles & Relationship Hub): additive, new route groups.
  app.use("/api/family-profiles", familyProfileRoutes);
  app.use("/api/relationship-hub", relationshipHubRoutes);
  // V4.3 (AI Life Coach): additive, new route group.
  app.use("/api/life-coach", lifeCoachRoutes);
  // V4.4 Phase 1 (Notification Infrastructure): additive, new route group.
  app.use("/api/notifications", notificationRoutes);
  // V4.5 Phase 1A (Festival Backend Infrastructure): additive, new route group.
  app.use("/api/festivals", festivalRoutes);
  // V4.5 Phase 2 (Festival Intelligence): additive, new route group.
  app.use("/api/festival-intelligence", festivalIntelligenceRoutes);
  // V5.0 Phase 5C (Explorer AI): additive, new route group.
  app.use("/api/explorer-ai", explorerAiRoutes);
  app.use("/api/ai-timeline", aiTimelineRoutes);
  // V5.3 (Explainable Report Intelligence): additive, new route group.
  app.use("/api/explanation", explanationRoutes);
  // V5.4 (Intelligence & Personalization Engine): authenticated, additive.
  app.use("/api/personalization", personalizationRoutes);

  // Fallback 404 handler with a helpful JSON message instead of Express's
  // default HTML page.
  app.use(notFoundHandler);

  // Centralized error handler (catches JSON body-parser errors, etc.)
  app.use(errorHandler);

  return app;
}

const app = createApp();

// Catch anything that would otherwise crash the process silently/without
// context — always log with full detail before the process potentially
// exits, so a production incident is never a total mystery.
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception:", err);
});

// ── Startup diagnostics ──────────────────────────────────────────────────
logger.info("──────────────────────────────────────────────");
logger.info("NakshatraVerse backend starting up");
logger.info(`  PORT              = ${config.PORT}`);
logger.info(`  NODE_ENV          = ${config.NODE_ENV}`);
logger.info(`  GEMINI_MODEL      = ${config.GEMINI_MODEL}`);
logger.info(`  GEMINI_FALLBACK   = ${config.GEMINI_FALLBACK_MODEL || "(none)"}`);
logger.info(`  GEMINI_MAX_RETRIES= ${config.GEMINI_MAX_RETRIES} (base backoff ${config.GEMINI_RETRY_BASE_MS}ms, total budget ${config.GEMINI_TOTAL_BUDGET_MS}ms)`);
logger.info(`  GOOGLE_API_KEY    = ${maskKey(config.GOOGLE_API_KEY)}`);
logger.info(`  FRONTEND_ORIGIN   = ${config.FRONTEND_ORIGIN}`);
logger.info(`  GOOGLE_CLIENT_ID  = ${config.GOOGLE_CLIENT_ID ? "(configured)" : "(not set — Google sign-in disabled)"}`);
logger.info(`  DATA_DIR          = ${config.DATA_DIR}`);
logger.info("──────────────────────────────────────────────");

if (!config.GOOGLE_API_KEY) {
  logger.warn(
    "⚠️  No API key found. Set GOOGLE_API_KEY (or GEMINI_API_KEY) in backend/.env (see backend/.env.example).\n" +
      "    Get a free key at https://aistudio.google.com/apikey"
  );
}

// Priority 5.2: a missing JWT secret in production would mean every
// session token is unsigned/forgeable. Fail fast and loud instead of
// starting an insecure server. (Development has a fixed insecure fallback
// so local setup has one less required step — see config/env.js.)
if (config.IS_PRODUCTION && !config.JWT_SECRET) {
  logger.error("FATAL: JWT_SECRET is not set. Refusing to start in production without a real session secret.");
  process.exit(1);
}

// Only actually bind a port when this file is run directly (`node
// server.js` / `npm start`) — not when it's imported by a test file, which
// only needs the `app` export to drive with supertest.
const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
  const server = app.listen(config.PORT, () => {
    logger.info(`NakshatraVerse backend running on http://localhost:${config.PORT}`);
  });

  // Graceful shutdown: stop accepting new connections and let in-flight
  // requests (e.g. a slow Gemini call) finish before the process exits,
  // instead of dropping them mid-response.
  const shutdown = (signal) => {
    logger.info(`${signal} received — shutting down gracefully...`);
    server.close(() => {
      logger.info("Server closed. Goodbye.");
      process.exit(0);
    });
    // Don't hang forever waiting for stubborn connections.
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

export default app;
