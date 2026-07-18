// ─────────────────────────────────────────────────────────────────────────
// Centralized configuration.
// All environment variables are read exactly once, here, with exactly the
// same names, defaults, and parsing rules as the original server.js so
// runtime behavior is byte-for-byte identical after the refactor.
// ─────────────────────────────────────────────────────────────────────────
import dotenv from "dotenv";
import path from "node:path";

dotenv.config();

// Unique, non-default port (avoid 3000/5000/5173/8000 collisions with other
// local dev tools). Override with PORT in backend/.env if needed.
const PORT = Number(process.env.PORT) || 8617;

// Accept either GOOGLE_API_KEY or GEMINI_API_KEY (both are common env var
// names in Gemini tutorials/SDKs). Trim to guard against trailing
// newlines/whitespace picked up from copy-paste, which silently break the
// Authorization header and cause confusing 400/401/403 errors.
const RAW_API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "";
const GOOGLE_API_KEY = RAW_API_KEY.trim();

// Current Gemini model. Configurable because Google periodically deprecates
// model names (see https://ai.google.dev/gemini-api/docs/deprecations).
const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-2.5-flash-lite").trim();

// Optional second model tried automatically if the primary one is
// overloaded (HTTP 503) or rate-limited (429) after retries are exhausted.
// The "-lite" models are the most prone to transient 503 "high demand"
// errors, so the non-lite sibling is a sensible default fallback.
const GEMINI_FALLBACK_MODEL = (
  process.env.GEMINI_FALLBACK_MODEL ||
  (GEMINI_MODEL.includes("-lite") ? GEMINI_MODEL.replace("-lite", "") : "")
).trim();

// How long to wait for Gemini before giving up (ms).
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 25000;

// Transient upstream failures (overloaded model, rate limit, gateway
// timeout) are retried automatically with exponential backoff before we
// give up or fall back to a different model.
const GEMINI_MAX_RETRIES = Number(process.env.GEMINI_MAX_RETRIES) || 2;
const GEMINI_RETRY_BASE_MS = Number(process.env.GEMINI_RETRY_BASE_MS) || 1000;
const RETRYABLE_STATUSES = new Set([429, 503, 504]);

// Hard ceiling on total time spent across ALL attempts (primary retries +
// fallback model retries) for a single /api/generate-report call. Without
// this, a sustained outage could chain up to (retries+1) attempts on the
// primary model AND the fallback model, each waiting up to
// GEMINI_TIMEOUT_MS — a multi-minute hang from the user's perspective.
// Once this budget is exhausted, we stop retrying/falling back and return
// the last real error immediately instead of continuing to wait.
const GEMINI_TOTAL_BUDGET_MS = Number(process.env.GEMINI_TOTAL_BUDGET_MS) || 45000;

// Restrict CORS to a specific frontend origin in production; defaults to
// allowing any origin, which is fine for local development.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";

// ── Priority 4 additions ────────────────────────────────────────────────
// Everything below is new, additive configuration for Performance &
// Production Hardening. Every value has a default that reproduces the
// exact current runtime behavior, so an existing backend/.env with none of
// these keys set behaves identically to before.

// Standard Node convention; controls verbose stack traces in error
// responses and enables a couple of production-only defaults below.
const NODE_ENV = (process.env.NODE_ENV || "development").trim();
const IS_PRODUCTION = NODE_ENV === "production";

// "text" (default, unchanged console.log-style output) or "json"
// (structured, one JSON object per line — easier to ingest into a log
// aggregator in production).
const LOG_FORMAT = (process.env.LOG_FORMAT || "text").trim();

// Cache TTLs (ms). Astrology facts for a given (name, dob, tob, pob) are
// deterministic and never change, so they could technically be cached
// forever; a bounded TTL just guards against unbounded memory growth if
// the process runs for a very long time. Gemini narratives depend on
// today's transits (see transitEngine.js), which change once per day, so
// a shorter TTL keeps them fresh without needing manual invalidation.
const CHART_CACHE_TTL_MS = Number(process.env.CHART_CACHE_TTL_MS) || 6 * 60 * 60 * 1000; // 6h
const CHART_CACHE_MAX_ENTRIES = Number(process.env.CHART_CACHE_MAX_ENTRIES) || 500;
const GEMINI_CACHE_TTL_MS = Number(process.env.GEMINI_CACHE_TTL_MS) || 60 * 60 * 1000; // 1h
const GEMINI_CACHE_MAX_ENTRIES = Number(process.env.GEMINI_CACHE_MAX_ENTRIES) || 200;

// Basic abuse protection on the two POST endpoints. Defaults are generous
// enough that no legitimate interactive user should ever see a 429.
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_CHART = Number(process.env.RATE_LIMIT_MAX_CHART) || 60;
const RATE_LIMIT_MAX_REPORT = Number(process.env.RATE_LIMIT_MAX_REPORT) || 20;

// Birth-data JSON bodies are tiny (a handful of short strings), but several
// endpoints (AI Report Chat, AI Life Coach, Explorer AI) echo the full
// backend-generated `chart`/`report` objects back as part of their request
// body so Gemini can be grounded in them — and since V5.0 Phase 5B added
// the Explorer's planetStrength/advancedYogas/advancedDoshas fields to
// that payload, a real chart response now regularly exceeds the original
// 100kb cap on its own. Raised to keep rejecting genuinely oversized/
// abusive payloads while comfortably fitting a real chart+report pair.
const MAX_REQUEST_BODY_SIZE = process.env.MAX_REQUEST_BODY_SIZE || "1mb";

// ── Priority 5.2 additions ──────────────────────────────────────────────
// Everything below is new, additive configuration for Product Features &
// Deployment Preparation (Authentication, User Management, Saved Reports,
// PDF Export). None of it is read by any Priority ≤5.1 code path, so an
// existing deployment that never sets these keeps behaving exactly as
// before; only the new auth/user/report routes consult them.

// Secret used to sign session JWTs. There is no safe default in
// production — a guessable/shared secret would let anyone forge a valid
// session for any user, so we deliberately leave it empty and fail fast
// (see server.js startup check) rather than silently running insecurely.
// In development a fixed fallback is fine since nothing real is at stake.
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : "dev-only-insecure-secret-change-me");
const JWT_ACCESS_EXPIRES_IN = (process.env.JWT_ACCESS_EXPIRES_IN || "15m").trim();
const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN || "30d").trim();
// Approximate ms mirror of JWT_REFRESH_EXPIRES_IN, used for the refresh
// cookie's maxAge (jsonwebtoken parses the string form for the token
// itself; the cookie needs a plain millisecond number).
const REFRESH_COOKIE_MAX_AGE_MS = Number(process.env.REFRESH_COOKIE_MAX_AGE_MS) || 30 * 24 * 60 * 60 * 1000; // 30d

// Optional: enables "Sign in with Google". If unset, the Google login
// endpoint responds with a clear, curated 501 instead of a confusing crash
// — email/password auth keeps working either way.
const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || "").trim();

// Where the file-backed user/report store lives. A real deployment can
// point this at a persistent volume/disk; see DEPLOYMENT.md. The
// repository layer (backend/repositories/*) is the only code that reads
// this, so swapping in a real database later never touches controllers.
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");

// Cookies are only marked `Secure` (HTTPS-only) by default in production,
// since local HTTP dev would otherwise silently drop them.
const COOKIE_SECURE = process.env.COOKIE_SECURE !== undefined
  ? process.env.COOKIE_SECURE === "true"
  : NODE_ENV === "production";

const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

// Looser than the report limiter (auth is cheap to compute) but still
// protective against credential-stuffing/brute-force attempts.
const RATE_LIMIT_MAX_AUTH = Number(process.env.RATE_LIMIT_MAX_AUTH) || 30;

// ── V3.0 Phase 4 addition (AI Astrology Assistant) ─────────────────────
// Chat is naturally higher-frequency than generating a whole report (a
// person may send many short questions in one sitting), so this gets its
// own, more generous limit rather than reusing RATE_LIMIT_MAX_REPORT.
const RATE_LIMIT_MAX_ASSISTANT = Number(process.env.RATE_LIMIT_MAX_ASSISTANT) || 40;
// Hard cap on how many prior turns of a conversation are sent back to
// Gemini as context on each new question — keeps prompt size (and cost)
// bounded regardless of how long a single chat session runs. Older turns
// simply fall out of the window; this is a context-length control only,
// not a retention/storage policy (nothing is persisted server-side).
const ASSISTANT_MAX_HISTORY_TURNS = Number(process.env.ASSISTANT_MAX_HISTORY_TURNS) || 10;
const ASSISTANT_MAX_QUESTION_LENGTH = Number(process.env.ASSISTANT_MAX_QUESTION_LENGTH) || 600;

// ── V4.0 Phase 1 addition (Kundli Matching) ──────────────────────────────
// Slightly more conservative than RATE_LIMIT_MAX_REPORT since each request
// computes two full charts.
const RATE_LIMIT_MAX_MATCHING = Number(process.env.RATE_LIMIT_MAX_MATCHING) || 15;

// ── V4.1 Phase 2 addition (Daily Panchang & Muhurat Finder) ──────────────
// More generous than matching (no birth-chart computation involved), but
// the month overview endpoint does up to ~31 internal computations per
// call, so it isn't as generous as a single-day lookup would warrant.
const RATE_LIMIT_MAX_PANCHANG = Number(process.env.RATE_LIMIT_MAX_PANCHANG) || 40;

// ── V4.2 addition (Family Profiles & Relationship Hub) ───────────────────
// Family Profile CRUD is cheap (JSON-file reads/writes, no astrology
// engine involved), so it gets a generous limit, matching the general
// shape of RATE_LIMIT_MAX_REPORT. Relationship Hub comparisons compute two
// full charts plus Kundli Matching per request (the same cost as
// /api/matching/compute), so it reuses RATE_LIMIT_MAX_MATCHING's value as
// its own default rather than inventing a different number.
const RATE_LIMIT_MAX_FAMILY_PROFILES = Number(process.env.RATE_LIMIT_MAX_FAMILY_PROFILES) || 60;
const RATE_LIMIT_MAX_RELATIONSHIP_HUB = Number(process.env.RATE_LIMIT_MAX_RELATIONSHIP_HUB) || 15;

// ── V4.3 addition (AI Life Coach) ─────────────────────────────────────────
// Daily guidance is one Gemini call per request, same cost shape as
// /api/assistant/chat, so this reuses RATE_LIMIT_MAX_ASSISTANT's default
// value rather than inventing a different number.
const RATE_LIMIT_MAX_LIFE_COACH = Number(process.env.RATE_LIMIT_MAX_LIFE_COACH) || 40;

// ── V4.4 Phase 1 addition (Notification Infrastructure) ──────────────────
// Notification CRUD is cheap (a JSON-file read/write, no astrology engine
// involved) and can be polled fairly often by the Dashboard widget/
// Notification Center, so this reuses RATE_LIMIT_MAX_FAMILY_PROFILES'
// generous default rather than inventing a different number.
const RATE_LIMIT_MAX_NOTIFICATIONS = Number(process.env.RATE_LIMIT_MAX_NOTIFICATIONS) || 60;

// ── V4.5 Phase 1A addition (Festival Backend Infrastructure) ────────────
// A full-year Festival lookup can trigger a ~365-day Tithi scan on a
// cache miss (see festival.repository.js's yearCache), a similar cost
// profile to /api/panchang/month's up-to-31-day scan, so this reuses
// RATE_LIMIT_MAX_PANCHANG's moderate default rather than inventing a
// different number. Repeat requests for the same year are served from
// cache, so this is conservative.
const RATE_LIMIT_MAX_FESTIVALS = Number(process.env.RATE_LIMIT_MAX_FESTIVALS) || 40;
// V4.5 Phase 2 (Festival Intelligence) — own limiter, own config value,
// same rationale as every RATE_LIMIT_MAX_* above (kept separate so tuning
// one never affects another).
const RATE_LIMIT_MAX_FESTIVAL_INTELLIGENCE = Number(process.env.RATE_LIMIT_MAX_FESTIVAL_INTELLIGENCE) || 30;

// ── V5.0 Phase 5C addition (Explorer AI) ─────────────────────────────────
// Same factory, own limit — one Gemini call per explanation request, same
// cost profile as assistantRateLimiter/lifeCoachRateLimiter, so it reuses
// that default rather than inventing a different number. Kept as its own
// limiter (not a shared instance) for the same "tuning one never affects
// another" rationale as every RATE_LIMIT_MAX_* above.
const RATE_LIMIT_MAX_EXPLORER_AI = Number(process.env.RATE_LIMIT_MAX_EXPLORER_AI) || 40;
// A selected item's display label (e.g. a planet/yoga/dosha name) is always
// short — this bound only exists to reject clearly-abusive payloads, same
// role ASSISTANT_MAX_QUESTION_LENGTH plays for the chat question field.
const EXPLORER_AI_MAX_LABEL_LENGTH = Number(process.env.EXPLORER_AI_MAX_LABEL_LENGTH) || 120;

// ── V5.2 addition (AI Timeline) ──────────────────────────────────────────
// Same factory/rationale as RATE_LIMIT_MAX_EXPLORER_AI/EXPLORER_AI_MAX_LABEL_LENGTH
// directly above — one Gemini call per explanation request, same cost
// profile, so it reuses that default rather than inventing a different
// number. Kept as its own config value (not shared) for the same "tuning
// one never affects another" rationale as every RATE_LIMIT_MAX_*/*_MAX_*
// value in this file.
const RATE_LIMIT_MAX_AI_TIMELINE = Number(process.env.RATE_LIMIT_MAX_AI_TIMELINE) || 40;
const AI_TIMELINE_MAX_LABEL_LENGTH = Number(process.env.AI_TIMELINE_MAX_LABEL_LENGTH) || 120;

// ── V5.3 addition (Explainable Report Intelligence — Explanation Engine) ──
// Same factory/rationale as RATE_LIMIT_MAX_EXPLORER_AI/RATE_LIMIT_MAX_AI_TIMELINE
// above — one Gemini call per explanation request for the same cost
// profile, so it reuses that default rather than inventing a different
// number. One shared limiter covers all five explanation endpoints (report
// summary, confidence, prediction evidence, remedy, cross-link) since they
// are all facets of the same new Explanation Engine service, mirroring how
// a single geminiCache already serves every existing AI surface.
const RATE_LIMIT_MAX_EXPLANATION = Number(process.env.RATE_LIMIT_MAX_EXPLANATION) || 60;
// A subject label (prediction category, remedy type, Explorer item label)
// is always short — this bound only exists to reject clearly-abusive
// payloads, same role EXPLORER_AI_MAX_LABEL_LENGTH/AI_TIMELINE_MAX_LABEL_LENGTH
// already play.
const EXPLANATION_MAX_LABEL_LENGTH = Number(process.env.EXPLANATION_MAX_LABEL_LENGTH) || 120;
// The Explanation Engine's own result-level cache (services/utils/explanationCache.js)
// sits above geminiService's existing prompt-hash cache — same TTL/size
// shape as GEMINI_CACHE_TTL_MS/GEMINI_CACHE_MAX_ENTRIES, kept as its own
// config value so tuning one cache never affects the other.
const EXPLANATION_CACHE_TTL_MS = Number(process.env.EXPLANATION_CACHE_TTL_MS) || 60 * 60 * 1000; // 1h
const EXPLANATION_CACHE_MAX_ENTRIES = Number(process.env.EXPLANATION_CACHE_MAX_ENTRIES) || 300;

export const config = {
  PORT,
  GOOGLE_API_KEY,
  GEMINI_MODEL,
  GEMINI_FALLBACK_MODEL,
  GEMINI_TIMEOUT_MS,
  GEMINI_MAX_RETRIES,
  GEMINI_RETRY_BASE_MS,
  GEMINI_TOTAL_BUDGET_MS,
  RETRYABLE_STATUSES,
  FRONTEND_ORIGIN,
  NODE_ENV,
  IS_PRODUCTION,
  LOG_FORMAT,
  CHART_CACHE_TTL_MS,
  CHART_CACHE_MAX_ENTRIES,
  GEMINI_CACHE_TTL_MS,
  GEMINI_CACHE_MAX_ENTRIES,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_CHART,
  RATE_LIMIT_MAX_REPORT,
  MAX_REQUEST_BODY_SIZE,
  JWT_SECRET,
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
  REFRESH_COOKIE_MAX_AGE_MS,
  GOOGLE_CLIENT_ID,
  DATA_DIR,
  COOKIE_SECURE,
  BCRYPT_SALT_ROUNDS,
  RATE_LIMIT_MAX_AUTH,
  RATE_LIMIT_MAX_ASSISTANT,
  ASSISTANT_MAX_HISTORY_TURNS,
  ASSISTANT_MAX_QUESTION_LENGTH,
  RATE_LIMIT_MAX_MATCHING,
  RATE_LIMIT_MAX_PANCHANG,
  RATE_LIMIT_MAX_FAMILY_PROFILES,
  RATE_LIMIT_MAX_RELATIONSHIP_HUB,
  RATE_LIMIT_MAX_LIFE_COACH,
  RATE_LIMIT_MAX_NOTIFICATIONS,
  RATE_LIMIT_MAX_FESTIVALS,
  RATE_LIMIT_MAX_FESTIVAL_INTELLIGENCE,
  RATE_LIMIT_MAX_EXPLORER_AI,
  EXPLORER_AI_MAX_LABEL_LENGTH,
  RATE_LIMIT_MAX_AI_TIMELINE,
  AI_TIMELINE_MAX_LABEL_LENGTH,
  RATE_LIMIT_MAX_EXPLANATION,
  EXPLANATION_MAX_LABEL_LENGTH,
  EXPLANATION_CACHE_TTL_MS,
  EXPLANATION_CACHE_MAX_ENTRIES,
};

export default config;
