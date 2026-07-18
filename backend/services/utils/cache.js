// ─────────────────────────────────────────────────────────────────────────
// In-memory TTL + LRU Cache (Priority 4 — Performance & Production Hardening)
//
// Single responsibility: a small, dependency-free cache primitive that any
// service can use to avoid recomputing/refetching something expensive for
// the same input. Used by:
//   - birthChartEngine.js  (cache reusable astrology calculations)
//   - geminiService.js     (cache reusable Gemini narratives)
//
// Design notes:
//   - Pure in-memory Map, no external dependency (no redis/memcached) —
//     consistent with this project's minimal-dependency architecture and
//     single-process deployment model.
//   - TTL (time-to-live) entries expire automatically so stale data (e.g.
//     yesterday's transit-dependent Gemini narrative) is never served past
//     its useful lifetime.
//   - LRU (least-recently-used) eviction caps memory usage so an
//     unbounded stream of distinct inputs (e.g. scraping/abuse) cannot
//     grow the cache without limit.
//   - Every cache exposes hit/miss/eviction counters via getStats() for
//     the /api/metrics endpoint (see services/utils/metrics.js).
// ─────────────────────────────────────────────────────────────────────────

export class TTLCache {
  /**
   * @param {object} opts
   * @param {number} [opts.maxEntries=500] - max entries before LRU eviction
   * @param {number} [opts.ttlMs=3600000]  - default time-to-live per entry (ms)
   * @param {string} [opts.name="cache"]   - label used in metrics/logging
   */
  constructor({ maxEntries = 500, ttlMs = 60 * 60 * 1000, name = "cache" } = {}) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
    this.name = name;
    this.store = new Map(); // key -> { value, expiresAt }
    this.stats = { hits: 0, misses: 0, sets: 0, evictions: 0, expirations: 0 };
  }

  /** Returns the cached value, or undefined if missing/expired (and records stats). */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.stats.misses++;
      return undefined;
    }
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      this.stats.misses++;
      this.stats.expirations++;
      return undefined;
    }
    // Refresh recency for LRU: delete + re-insert moves the key to the end
    // of Map's iteration order, which we treat as "most recently used".
    this.store.delete(key);
    this.store.set(key, entry);
    this.stats.hits++;
    return entry.value;
  }

  /** Stores a value, evicting the least-recently-used entry if at capacity. */
  set(key, value, ttlMs = this.ttlMs) {
    if (this.store.has(key)) this.store.delete(key);
    else if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      this.store.delete(oldestKey);
      this.stats.evictions++;
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
    this.stats.sets++;
    return value;
  }

  has(key) {
    return this.get(key) !== undefined;
  }

  delete(key) {
    return this.store.delete(key);
  }

  /** Cache invalidation hook — clears every entry (used by tests/diagnostics). */
  clear() {
    this.store.clear();
  }

  getStats() {
    return {
      name: this.name,
      size: this.store.size,
      maxEntries: this.maxEntries,
      ttlMs: this.ttlMs,
      ...this.stats,
      hitRate:
        this.stats.hits + this.stats.misses > 0
          ? Number((this.stats.hits / (this.stats.hits + this.stats.misses)).toFixed(3))
          : null,
    };
  }
}

/**
 * Wraps an async function with memoization: identical `keyFn(...args)`
 * results in the cached value being returned instead of calling `fn`
 * again, as long as the entry hasn't expired. Rejected promises are never
 * cached, so a transient failure (e.g. Gemini 503) doesn't poison the
 * cache for subsequent, possibly-successful calls.
 *
 * De-dupes concurrent calls: `cache.get()` is only populated once `fn()`
 * resolves, so two calls with the same key that both land before the
 * first has resolved would previously both miss the cache and both run
 * `fn()` (a "cache stampede"). An in-flight map (keyed the same way as
 * `cache`, but tracking pending promises only — never itself read as a
 * cache hit/miss) lets the second caller await the first's already-running
 * call instead. `cache`'s own get/set/stats semantics are untouched: it
 * still only ever stores resolved values, exactly as before.
 */
export function memoizeAsync(fn, { cache, keyFn }) {
  const inFlight = new Map();
  return async function memoized(...args) {
    const key = keyFn(...args);
    const cached = cache.get(key);
    if (cached !== undefined) return cached;

    const pending = inFlight.get(key);
    if (pending) return pending;

    const promise = (async () => {
      try {
        const result = await fn(...args);
        cache.set(key, result);
        return result;
      } finally {
        inFlight.delete(key);
      }
    })();
    inFlight.set(key, promise);
    return promise;
  };
}

/** Synchronous counterpart of memoizeAsync, used for computeChart(). */
export function memoizeSync(fn, { cache, keyFn }) {
  return function memoized(...args) {
    const key = keyFn(...args);
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

export default { TTLCache, memoizeAsync, memoizeSync };
