// ─────────────────────────────────────────────────────────────────────────
// Gemini Service
// Single responsibility: talk to the Gemini generateContent API — auth,
// timeout, retry with exponential backoff, model fallback, and response
// parsing. This module NEVER calculates astrology; it only sends a prompt
// (built by promptBuilder.js from already-computed facts) and returns
// Gemini's parsed JSON explanation. Behavior (timings, retry counts,
// error messages/status codes) is unchanged from the original server.js.
// ─────────────────────────────────────────────────────────────────────────
import config from "../../config/env.js";
import logger from "../utils/logger.js";
import { TTLCache } from "../utils/cache.js";
import { timeAsync } from "../utils/metrics.js";
import crypto from "crypto";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Extract a JSON object from raw model text, tolerating markdown code fences
// or stray prose around the JSON (some models add these despite instructions).
function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
      try {
        return JSON.parse(fenced[1].trim());
      } catch {}
    }
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.substring(start, end + 1));
      } catch {}
    }
    return null;
  }
}

// Calls Gemini's generateContent endpoint. `useJsonMime` controls whether we
// ask Gemini for responseMimeType: "application/json" — some older/lite
// models or API versions reject that field with a 400, so on that specific
// failure we transparently retry once without it.
async function callGeminiOnce(prompt, useJsonMime, model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 4096,
      ...(useJsonMime ? { responseMimeType: "application/json" } : {}),
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.GEMINI_TIMEOUT_MS);

  let geminiResponse;
  try {
    geminiResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Sending the key as a header (rather than only a query string)
        // works for both classic "AIza…" keys and the newer "AQ…." auth-key
        // format on the native Gemini REST endpoint.
        "x-goog-api-key": config.GOOGLE_API_KEY,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (networkErr) {
    clearTimeout(timeout);
    if (networkErr.name === "AbortError") {
      const err = new Error(`Gemini request timed out after ${config.GEMINI_TIMEOUT_MS}ms.`);
      err.status = 504;
      throw err;
    }
    logger.error("Network error calling Gemini:", networkErr);
    const err = new Error(`Could not reach Gemini API: ${networkErr.message}`);
    err.status = 502;
    throw err;
  }
  clearTimeout(timeout);

  if (!geminiResponse.ok) {
    const errText = await geminiResponse.text();
    logger.error(`Gemini API error (model=${model}, status=${geminiResponse.status}):`, errText);

    // Give an actionable, specific message per HTTP status instead of a
    // generic "upstream error" — this is what actually lets a developer fix
    // the real problem instead of just seeing "AI report unavailable".
    if (geminiResponse.status === 400 && /response_mime_type|responseMimeType/i.test(errText) && useJsonMime) {
      const err = new Error("RETRY_WITHOUT_JSON_MIME");
      throw err;
    }

    let hint = "";
    if (geminiResponse.status === 401 || geminiResponse.status === 403) {
      hint =
        "This usually means GOOGLE_API_KEY/GEMINI_API_KEY is missing, invalid, restricted to a different API, " +
        "or the Generative Language API is not enabled for the associated Google Cloud project. " +
        "Generate/verify a key at https://aistudio.google.com/apikey.";
    } else if (geminiResponse.status === 404) {
      hint = `Model "${model}" was not found for generateContent. Check available model names at https://ai.google.dev/gemini-api/docs/models and update GEMINI_MODEL in backend/.env.`;
    } else if (geminiResponse.status === 429) {
      hint = "Gemini rate limit or quota exceeded for this key. Check your usage at https://aistudio.google.com.";
    } else if (geminiResponse.status === 503) {
      hint = `Model "${model}" is overloaded with traffic on Google's side right now (this is a Google outage, not a bug in this app).`;
    } else if (geminiResponse.status >= 500) {
      hint = "Gemini's servers returned an error. This is usually transient — try again shortly.";
    }

    const err = new Error(`Gemini API returned ${geminiResponse.status}.${hint ? " " + hint : ""}`);
    err.detail = errText;
    err.status = geminiResponse.status >= 500 ? 502 : geminiResponse.status;
    throw err;
  }

  const data = await geminiResponse.json();
  const finishReason = data?.candidates?.[0]?.finishReason;
  logger.info(`Gemini finishReason: ${finishReason}`);
  if (data?.promptFeedback?.blockReason) {
    logger.warn("Gemini promptFeedback blockReason:", data.promptFeedback.blockReason);
  }

  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";

  if (!text) {
    const err = new Error(
      `Gemini returned no text (finishReason: ${finishReason || "unknown"}). This can happen if the response was blocked by safety filters or hit the token limit before producing output.`
    );
    err.status = 502;
    throw err;
  }

  const parsed = extractJson(text);
  if (!parsed) {
    logger.error("Failed to parse Gemini JSON output. Raw text was:\n", text);
    const err = new Error("Gemini did not return valid JSON.");
    err.raw = text;
    err.status = 502;
    throw err;
  }
  return parsed;
}

// Calls one specific model, transparently retrying transient failures
// (503 overloaded / 429 rate-limited / 504 timeout) with exponential
// backoff before giving up on that model. Stops early if `deadline`
// (a Date.now()-style timestamp) would be exceeded by the next attempt.
async function callGeminiModelWithRetry(prompt, model, deadline) {
  let lastErr;
  let attemptsMade = 0;
  for (let attempt = 0; attempt <= config.GEMINI_MAX_RETRIES; attempt++) {
    if (Date.now() >= deadline) break;
    attemptsMade++;
    try {
      try {
        lastErr = null;
        return await callGeminiOnce(prompt, true, model);
      } catch (err) {
        if (err.message === "RETRY_WITHOUT_JSON_MIME") {
          logger.warn(`Retrying Gemini call to "${model}" without responseMimeType (model rejected that field)...`);
          return await callGeminiOnce(prompt, false, model);
        }
        throw err;
      }
    } catch (err) {
      lastErr = err;
      const isRetryable = config.RETRYABLE_STATUSES.has(err.status) || err.status === 502; // 502 covers network/timeout errs above
      const backoff = config.GEMINI_RETRY_BASE_MS * 2 ** attempt;
      if (!isRetryable || attempt === config.GEMINI_MAX_RETRIES || Date.now() + backoff >= deadline) break;
      logger.warn(
        `Gemini call to "${model}" failed (${err.message}). Retrying attempt ${attempt + 1}/${config.GEMINI_MAX_RETRIES} in ${backoff}ms...`
      );
      await sleep(backoff);
    }
  }
  if (lastErr) lastErr.__attempts = attemptsMade;
  throw lastErr;
}

// Top-level entry point: tries the primary model (with retries), and if it
// is still failing due to overload/rate-limit, automatically falls back to
// GEMINI_FALLBACK_MODEL (if configured) before giving up entirely — all
// bounded by a single shared time budget (GEMINI_TOTAL_BUDGET_MS) so the
// caller never waits longer than that no matter how many attempts happen.
async function callGeminiUncached(prompt) {
  const deadline = Date.now() + config.GEMINI_TOTAL_BUDGET_MS;
  let primaryErr;
  try {
    return await callGeminiModelWithRetry(prompt, config.GEMINI_MODEL, deadline);
  } catch (err) {
    primaryErr = err;
    const shouldFallback =
      config.GEMINI_FALLBACK_MODEL &&
      config.GEMINI_FALLBACK_MODEL !== config.GEMINI_MODEL &&
      (config.RETRYABLE_STATUSES.has(err.status) || err.status === 502) &&
      Date.now() < deadline;
    if (!shouldFallback) {
      err.message = `${err.message} (tried "${config.GEMINI_MODEL}" ${err.__attempts || 1}x${config.GEMINI_FALLBACK_MODEL ? `; did not fall back to "${config.GEMINI_FALLBACK_MODEL}"` : ""})`;
      throw err;
    }

    logger.warn(
      `Primary model "${config.GEMINI_MODEL}" still failing after ${err.__attempts || 1} attempt(s) (${err.message}). Falling back to "${config.GEMINI_FALLBACK_MODEL}"...`
    );
    try {
      return await callGeminiModelWithRetry(prompt, config.GEMINI_FALLBACK_MODEL, deadline);
    } catch (fallbackErr) {
      // Build a final message that accurately states what was actually
      // tried, instead of pre-emptively claiming a fallback that may not
      // have run, or omitting it when it did.
      fallbackErr.message =
        `${fallbackErr.message} (tried "${config.GEMINI_MODEL}" ${primaryErr.__attempts || 1}x, ` +
        `then fallback "${config.GEMINI_FALLBACK_MODEL}" ${fallbackErr.__attempts || 1}x)`;
      throw fallbackErr;
    }
  }
}

// ── Priority 4: caching ──────────────────────────────────────────────────
// The prompt built by promptBuilder.js is a deterministic function of the
// backend-computed chart (see birthChartEngine.js) plus today's transits,
// so an identical prompt string means an identical astrological situation
// — safe to cache the narrative Gemini produced for it. This is a pure
// latency/cost optimization: it lets a user regenerate the same report (or
// two users request the same birth data) without paying for a second
// Gemini call, while transit-driven prompts naturally roll over to a fresh
// cache key once the date changes. Failures are never cached (see
// memoizeAsync/TTLCache usage below), so a transient Gemini outage cannot
// "poison" the cache — the next call always retries against the real API.
const geminiCache = new TTLCache({
  name: "geminiCache",
  maxEntries: config.GEMINI_CACHE_MAX_ENTRIES,
  ttlMs: config.GEMINI_CACHE_TTL_MS,
});

function promptCacheKey(prompt) {
  // Hash rather than store the raw prompt as the key: prompts can be a few
  // KB (they embed the full planetary JSON), and a fixed-length key keeps
  // Map lookups cheap regardless of prompt size.
  return crypto.createHash("sha256").update(config.GEMINI_MODEL).update(prompt).digest("hex");
}

// Tracks prompts currently in flight so two concurrent callGemini() calls
// for the identical prompt (same cache key) share one upstream request
// instead of both missing the cache and both hitting the real Gemini API.
// Only ever holds pending promises — resolved values still live solely in
// geminiCache, so getGeminiCacheStats()/hit-miss counting is unaffected.
const geminiInFlight = new Map();

export async function callGemini(prompt) {
  const key = promptCacheKey(prompt);
  const cached = geminiCache.get(key);
  if (cached !== undefined) {
    logger.info("Gemini cache hit — skipping upstream call.");
    // Return a shallow copy: formatGenerateReportResponse() mutates the
    // report object it receives (e.g. `report.doshas = ...`) to enforce
    // backend authority over Gemini's narrative. Handing out the cached
    // object by reference would let that mutation silently corrupt the
    // cache for every future hit — a shallow clone is cheap (flat object
    // of strings) and keeps the cache immutable from the caller's side.
    return { ...cached };
  }

  const pending = geminiInFlight.get(key);
  if (pending) return { ...(await pending) };

  const promise = (async () => {
    try {
      const result = await timeAsync("geminiRequest", () => callGeminiUncached(prompt));
      geminiCache.set(key, result);
      return result;
    } finally {
      geminiInFlight.delete(key);
    }
  })();
  geminiInFlight.set(key, promise);
  return { ...(await promise) };
}

// Exposed for diagnostics/tests only — not used by any production code path.
export function getGeminiCacheStats() {
  return geminiCache.getStats();
}

export function clearGeminiCache() {
  geminiCache.clear();
}

export default { callGemini, getGeminiCacheStats, clearGeminiCache };
