// ─────────────────────────────────────────────────────────────────────────
// Security Middleware (Priority 4 — Performance & Production Hardening)
//
// Two independent, additive pieces of hardening. Neither changes any
// existing route's behavior for a normal, well-formed request — they only
// add response headers and reject clearly-abusive traffic patterns.
//
//   1. securityHeaders — a small hand-rolled equivalent of the handful of
//      "helmet" defaults relevant to a JSON API (no templating/HTML here,
//      so most of helmet's browser-XSS-focused headers don't apply). Kept
//      dependency-free to match this project's minimal footprint.
//   2. rateLimiter — a fixed-window, in-memory limiter per client IP, used
//      only on the two POST endpoints that trigger real computation/paid
//      Gemini calls. Well under normal usage this never triggers; it exists
//      to stop accidental retry-storms or abuse from exhausting the Gemini
//      quota or pegging the CPU.
// ─────────────────────────────────────────────────────────────────────────
import config from "../config/env.js";
import logger from "../services/utils/logger.js";

export function securityHeaders(req, res, next) {
  // Prevent MIME-sniffing attacks.
  res.setHeader("X-Content-Type-Options", "nosniff");
  // This API is not meant to be framed.
  res.setHeader("X-Frame-Options", "DENY");
  // Don't leak the full referrer URL to third parties.
  res.setHeader("Referrer-Policy", "no-referrer");
  // Disable browser features this API never needs.
  res.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=()");
  next();
}

// Fixed-window rate limiter per IP.
//
// Storage strategy (chosen at startup, never changes):
//   • Redis (ioredis) — used when REDIS_URL env var is set. Counters are
//     stored in a shared Redis instance, so all backend pods/instances share
//     the same window. This is the correct production behaviour for
//     multi-instance deployments (fixes BUG-01).
//   • In-memory Map — fallback when REDIS_URL is absent. Correct for
//     single-process deployments (local dev, single container). Zero
//     breaking changes: existing code that doesn't set REDIS_URL keeps
//     working identically to before.
//
// Both paths expose the same factory signature:
//   createRateLimiter({ windowMs, max, name }) → Express middleware
// so all existing callers below are untouched.

let redisClient = null;

if (config.REDIS_URL) {
  // Lazy-import ioredis only when Redis is actually configured. This keeps
  // the package truly optional — the app starts fine even if ioredis is not
  // installed (npm install --omit=optional), which is the default for dev.
  try {
    const { default: Redis } = await import("ioredis").catch(() => ({ default: null }));
    if (Redis) {
      redisClient = new Redis(config.REDIS_URL, {
        maxRetriesPerRequest: 1,  // fail fast rather than blocking requests
        enableReadyCheck: false,
        lazyConnect: true,
      });
      redisClient.on("error", (err) => {
        logger.warn(`Redis rate-limiter error (falling back to in-memory): ${err.message}`);
        redisClient = null; // degrade gracefully on connection loss
      });
      await redisClient.connect().catch(() => { redisClient = null; });
      if (redisClient) logger.info("Rate limiter: Redis backend active.");
    }
  } catch {
    logger.warn("Rate limiter: ioredis not available, using in-memory fallback.");
  }
} else {
  logger.info("Rate limiter: in-memory backend (set REDIS_URL for multi-instance deployments).");
}

function createRateLimiter({ windowMs, max, name }) {
  // ── Redis-backed (multi-instance safe) ───────────────────────────────
  if (redisClient) {
    return async function rateLimiter(req, res, next) {
      const ip = req.ip || req.connection?.remoteAddress || "unknown";
      const key = `rl:${name}:${ip}`;
      try {
        const count = await redisClient.incr(key);
        if (count === 1) {
          // First hit in this window — set the TTL (atomic with INCR+EXPIRE)
          await redisClient.pexpire(key, windowMs);
        }
        if (count > max) {
          const ttl = await redisClient.pttl(key);
          logger.warn(`Rate limit exceeded for ${ip} on ${name} (${count}/${max}).`);
          res.setHeader("Retry-After", Math.ceil(Math.max(ttl, 0) / 1000));
          return res.status(429).json({
            error: req.t ? req.t("errors.tooManyRequests") : "Too many requests. Please slow down and try again shortly.",
          });
        }
      } catch (err) {
        // Redis blip — fail open (let the request through) rather than
        // taking the whole endpoint down.
        logger.warn(`Rate limiter Redis error on ${name}: ${err.message} — allowing request`);
      }
      next();
    };
  }

  // ── In-memory fallback (single-process) ─────────────────────────────
  const hits = new Map(); // ip -> { count, windowStart }

  // Periodically sweep expired windows so the Map can't grow unbounded
  // across long-running processes with many distinct clients.
  const sweeper = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits.entries()) {
      if (now - entry.windowStart > windowMs) hits.delete(ip);
    }
  }, Math.max(windowMs, 60000));
  sweeper.unref?.();

  return function rateLimiter(req, res, next) {
    const ip = req.ip || req.connection?.remoteAddress || "unknown";
    const now = Date.now();
    let entry = hits.get(ip);
    if (!entry || now - entry.windowStart > windowMs) {
      entry = { count: 0, windowStart: now };
      hits.set(ip, entry);
    }
    entry.count++;
    if (entry.count > max) {
      logger.warn(`Rate limit exceeded for ${ip} on ${name} (${entry.count}/${max} in ${windowMs}ms window).`);
      res.setHeader("Retry-After", Math.ceil((entry.windowStart + windowMs - now) / 1000));
      return res.status(429).json({ error: req.t ? req.t("errors.tooManyRequests") : "Too many requests. Please slow down and try again shortly." });
    }
    next();
  };
}


// Generous limits — sized to stop abuse/runaway loops, not to constrain a
// legitimate user filling out the birth-data form a few times in a row.
export const chartRateLimiter = createRateLimiter({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_CHART,
  name: "/api/chart",
});

export const reportRateLimiter = createRateLimiter({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REPORT,
  name: "/api/generate-report",
});

// ── Priority 5.2 addition ────────────────────────────────────────────────
// Protects the new auth endpoints (register/login/google/refresh) from
// credential-stuffing / brute-force attempts. Reuses the same factory as
// the existing limiters above — no new pattern introduced.
export const authRateLimiter = createRateLimiter({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_AUTH,
  name: "/api/auth",
});

// ── V3.0 Phase 4 addition (AI Astrology Assistant) ──────────────────────
// Same factory, own limit — chat messages are shorter/cheaper than a full
// report but sent more frequently in a single sitting.
export const assistantRateLimiter = createRateLimiter({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_ASSISTANT,
  name: "/api/assistant/chat",
});

// ── V4.0 Phase 1 addition (Kundli Matching) ──────────────────────────────
// Same factory, own limit — matching computes two full charts per request
// (roughly double the work of /api/chart), so it gets its own, slightly
// more conservative limit rather than reusing chartRateLimiter/
// reportRateLimiter.
export const matchingRateLimiter = createRateLimiter({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_MATCHING,
  name: "/api/matching",
});

// ── V4.1 Phase 2 addition (Daily Panchang & Muhurat Finder) ─────────────
// Panchang/Muhurat calculation is cheaper per-request than a full chart
// (no birth-data engine involved), but the Calendar month view can issue
// up to ~31 internal computations per request, so this gets its own
// moderate limit rather than reusing chartRateLimiter's.
export const panchangRateLimiter = createRateLimiter({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_PANCHANG,
  name: "/api/panchang",
});

// ── V4.2 addition (Family Profiles & Relationship Hub) ───────────────────
// Same factory as every limiter above. Family Profile CRUD is cheap (a
// JSON-file read/write, no astrology engine involved), so it gets a
// generous limit. Relationship Hub comparisons compute two full charts
// plus Kundli Matching per request — the same cost profile as
// /api/matching/compute — so it gets its own limiter rather than reusing
// matchingRateLimiter (kept separate so tuning one never affects the
// other).
export const familyProfileRateLimiter = createRateLimiter({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_FAMILY_PROFILES,
  name: "/api/family-profiles",
});

export const relationshipHubRateLimiter = createRateLimiter({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_RELATIONSHIP_HUB,
  name: "/api/relationship-hub",
});

// ── V4.3 addition (AI Life Coach) ────────────────────────────────────────
// Same factory, own limit — one Gemini call per daily-guidance request,
// same cost profile as assistantRateLimiter, so it reuses that shape
// rather than reusing the same limiter instance (kept separate so tuning
// one never affects the other, same rationale as every limiter above).
export const lifeCoachRateLimiter = createRateLimiter({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_LIFE_COACH,
  name: "/api/life-coach",
});

// ── V4.4 Phase 1 addition (Notification Infrastructure) ─────────────────
// Same factory, own limit — notification reads/mark-read/delete are cheap
// (a JSON-file read/write, no astrology engine involved) and can be
// polled fairly often by the Dashboard widget/Notification Center, so
// this gets a generous limit, same rationale as familyProfileRateLimiter.
export const notificationRateLimiter = createRateLimiter({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_NOTIFICATIONS,
  name: "/api/notifications",
});

// ── V4.5 Phase 1A addition (Festival Backend Infrastructure) ────────────
// Same factory, own limit — a cache-miss year lookup scans up to 366 days
// of Tithi via panchangEngine, a similar cost profile to
// panchangRateLimiter, so it reuses that shape rather than sharing the
// same limiter instance (kept separate so tuning one never affects the
// other, same rationale as every limiter above).
export const festivalRateLimiter = createRateLimiter({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_FESTIVALS,
  name: "/api/festivals",
});

// ── V4.5 Phase 2 addition (Festival Intelligence) ────────────────────────
// Same factory, own limit — /explain and /personalized each make one
// Gemini call (same cost profile as lifeCoachRateLimiter/assistantRateLimiter),
// while /preparation and /timeline are cheap deterministic reads. Kept as
// one limiter across all five Festival Intelligence routes, same
// granularity festivalRateLimiter already uses for /api/festivals.
export const festivalIntelligenceRateLimiter = createRateLimiter({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_FESTIVAL_INTELLIGENCE,
  name: "/api/festival-intelligence",
});

// ── V5.0 Phase 5C addition (Explorer AI) ─────────────────────────────────
// Same factory, own limit — /api/explorer-ai/explain makes one Gemini call
// per request (same cost profile as assistantRateLimiter/
// lifeCoachRateLimiter), reusing RATE_LIMIT_MAX_EXPLORER_AI's default
// rather than sharing an existing limiter instance (kept separate so
// tuning one never affects the other, same rationale as every limiter
// above).
export const explorerAiRateLimiter = createRateLimiter({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_EXPLORER_AI,
  name: "/api/explorer-ai",
});

// ── V5.2 addition (AI Timeline) ───────────────────────────────────────────
// Same factory, own limit — /api/ai-timeline/explain makes one Gemini call
// per request (same cost profile as explorerAiRateLimiter/
// assistantRateLimiter), reusing RATE_LIMIT_MAX_AI_TIMELINE's default
// rather than sharing an existing limiter instance.
export const aiTimelineRateLimiter = createRateLimiter({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_AI_TIMELINE,
  name: "/api/ai-timeline",
});

// ── V5.3 addition (Explainable Report Intelligence) ───────────────────────
// Same factory, own limit — shared by all five /api/explanation/* endpoints
// (report summary, confidence, prediction evidence, remedy, cross-link).
// Cross-link lookups are pure data (no Gemini call), but sharing one
// limiter for the whole Explanation Engine surface keeps this consistent
// with how explorerAiRateLimiter/aiTimelineRateLimiter each cover their
// entire feature, not each individual sub-capability.
export const explanationRateLimiter = createRateLimiter({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_EXPLANATION,
  name: "/api/explanation",
});

export default {
  securityHeaders,
  chartRateLimiter,
  reportRateLimiter,
  authRateLimiter,
  assistantRateLimiter,
  matchingRateLimiter,
  panchangRateLimiter,
  familyProfileRateLimiter,
  relationshipHubRateLimiter,
  lifeCoachRateLimiter,
  notificationRateLimiter,
  festivalRateLimiter,
  festivalIntelligenceRateLimiter,
  explorerAiRateLimiter,
  aiTimelineRateLimiter,
  explanationRateLimiter,
};
