import { useCallback, useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────
// useExplanation — V5.3 (Explainable Report Intelligence)
//
// The ONE shared hook every new Explanation Engine surface (Explorer,
// Timeline, Reports, AI Life Coach) uses to call the five
// /api/explanation/* endpoints. Generalizes the lazy-load + per-selection
// cache pattern ExplorerAIPanel.jsx/AiTimelineAIPanel.jsx each already
// hand-roll with their own local `cacheRef` — instead of a sixth/seventh
// copy of that logic, every new component below composes this hook.
//
// Two cache layers, matching the backend's own two-layer design
// (explanationCache.js sitting above geminiService.js's cache):
//   1. A MODULE-LEVEL Map (`sharedExplanationCache`), so an identical
//      request (same cacheKey) issued from two different surfaces/
//      components — e.g. the same category's Confidence Explanation
//      opened from both the Predictions tab and the AI Life Coach page —
//      never re-fetches even across unrelated component trees.
//   2. Nothing is fetched until `request()` is called — an Explorer/
//      Timeline/Report/Life Coach selection never triggers a network call
//      by itself, exactly like ExplorerAIPanel.jsx's existing contract.
//
// Switching `cacheKey` (e.g. selecting a different prediction category)
// always starts from whatever is already cached for the NEW key, mirroring
// ExplorerAIPanel.jsx's own `useEffect` reset behavior exactly.
// ─────────────────────────────────────────────────────────────────────────
const sharedExplanationCache = new Map();

export function clearSharedExplanationCache() {
  sharedExplanationCache.clear();
}

/**
 * @param {object} params
 * @param {string} params.cacheKey - a stable, unique key for this request
 *   (e.g. `confidence:${chart.userData.name}:${category}`). Changing this
 *   resets state to whatever (if anything) is already cached for the new key.
 * @param {() => Promise<any>} params.fetcher - performs the actual network
 *   call; should be memoized (useCallback) by the caller so it only changes
 *   when its real inputs change.
 * @param {boolean} [params.enabled=true] - set false to disable entirely
 *   (e.g. while required props are still loading).
 */
export function useExplanation({ cacheKey, fetcher, enabled = true }) {
  const [data, setData] = useState(() => sharedExplanationCache.get(cacheKey) ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Identifies the "current" request. Bumped whenever cacheKey changes or
  // the component unmounts, so a still-in-flight fetch from a superseded
  // selection (or from after unmount) can recognize it's stale and skip
  // its setState calls instead of overwriting newer state / warning about
  // updating an unmounted component.
  const requestIdRef = useRef(0);

  // A new cacheKey always starts from whatever is already cached for it
  // (possibly nothing yet) — never shows a previous selection's stale
  // explanation while switching, same contract ExplorerAIPanel.jsx's own
  // effect already establishes.
  useEffect(() => {
    requestIdRef.current += 1;
    setData(sharedExplanationCache.get(cacheKey) ?? null);
    setError(null);
    setLoading(false);
  }, [cacheKey]);

  // Invalidate on unmount too, so a request still in flight when this
  // component tree goes away never calls setState afterwards.
  useEffect(() => () => {
    requestIdRef.current += 1;
  }, []);

  const request = useCallback(async () => {
    if (!enabled) return;
    const cached = sharedExplanationCache.get(cacheKey);
    if (cached) {
      setData(cached);
      return cached;
    }
    const myRequestId = requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      sharedExplanationCache.set(cacheKey, result);
      if (requestIdRef.current === myRequestId) setData(result);
      return result;
    } catch (err) {
      if (requestIdRef.current === myRequestId) {
        setError(err.message || "This explanation is unavailable right now.");
      }
      return null;
    } finally {
      if (requestIdRef.current === myRequestId) setLoading(false);
    }
  }, [cacheKey, fetcher, enabled]);

  const retry = useCallback(() => {
    sharedExplanationCache.delete(cacheKey);
    return request();
  }, [cacheKey, request]);

  return { data, loading, error, request, retry, hasRequested: data !== null || loading || error !== null };
}

export default useExplanation;
