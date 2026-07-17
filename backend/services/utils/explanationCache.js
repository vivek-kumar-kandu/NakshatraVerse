// ─────────────────────────────────────────────────────────────────────────
// Explanation Cache — V5.3 (Explainable Report Intelligence)
//
// Single responsibility: the ONE shared cache instance every
// explanationEngine.js function memoizes against. Reuses the existing
// TTLCache/memoizeAsync primitives from services/utils/cache.js (UNCHANGED
// — this file adds no new caching mechanism, only a new named instance of
// the one that already exists, exactly the way geminiService.js's own
// `geminiCache` already does for raw Gemini calls).
//
// Why a second cache layer on top of geminiService's prompt-hash cache?
// geminiCache is keyed on the exact prompt string, so it already gives
// cross-session reuse for identical Gemini calls. This cache sits ABOVE
// that: it memoizes the whole normalized explanation *result* (already
// stripped of code fences, already shaped into the response contract) per
// (kind, subject-key), so a repeated request for "the Career prediction's
// confidence explanation" from Explorer, Timeline, Reports, or AI Life
// Coach — all four surfaces this Explanation Engine powers — is served
// instantly without re-running normalization, and without even needing to
// re-hash/re-render the prompt. A cache miss here still safely falls
// through to geminiService's own cache/dedup logic underneath.
// ─────────────────────────────────────────────────────────────────────────
import config from "../../config/env.js";
import { TTLCache, memoizeAsync } from "./cache.js";

export const explanationCache = new TTLCache({
  name: "explanationCache",
  maxEntries: config.EXPLANATION_CACHE_MAX_ENTRIES,
  ttlMs: config.EXPLANATION_CACHE_TTL_MS,
});

/**
 * Wraps an explanation-producing async function with the shared cache.
 * `keyFn` must return a short, deterministic string built from the
 * explanation kind + subject identity + whatever chart facts actually
 * affect the answer (never the whole raw chart object, to keep keys
 * cheap) — see explanationEngine.js call sites for the exact shape.
 */
export function memoizeExplanation(fn, keyFn) {
  return memoizeAsync(fn, { cache: explanationCache, keyFn });
}

export function getExplanationCacheStats() {
  return explanationCache.getStats();
}

export function clearExplanationCache() {
  explanationCache.clear();
}

export default { explanationCache, memoizeExplanation, getExplanationCacheStats, clearExplanationCache };
