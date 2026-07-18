import { memo, useCallback, useState } from "react";
import TypingIndicator from "../assistant/TypingIndicator.jsx";
import { fetchCrossLinks } from "../../utils/explanationApi.js";
import { useExplanation } from "../../hooks/useExplanation.js";

// ─────────────────────────────────────────────────────────────────────────
// CrossLinkPanel — V5.3 (Explainable Report Intelligence)
//
// Cross-linking between Explorer and Timeline: given one Explorer
// selection (a planet, a category, etc.), shows the already-computed AI
// Timeline events (aiTimelineEngine.js output — unmodified) and category
// predictions that share the same dominant planet/category — purely
// derived data, no Gemini call (explanationEngine.js#getCrossLinks).
//
// Deliberately does NOT reuse ExpandableSection.jsx (which owns its open/
// closed state internally and has no hook for "fetch on first open") —
// rather than modify that shared primitive, this is a small, self-
// contained collapsible using the exact same visual language.
//
// `onSelectTimelineEvent` is an optional callback so a host page (e.g.
// ResultsTabs.jsx) can jump the person from an Explorer panel straight to
// the matching Timeline event — additive wiring only, this component never
// owns navigation/routing itself.
// ─────────────────────────────────────────────────────────────────────────
function CrossLinkPanel({ chart, itemType, itemId, itemLabel, planet, category, onSelectTimelineEvent }) {
  const [open, setOpen] = useState(false);
  const cacheKey = `cross-link:${chart?.userData?.name || "?"}:${itemType || "?"}:${itemId || itemLabel || "?"}:${planet || ""}:${category || ""}`;

  const fetcher = useCallback(
    () => fetchCrossLinks({ chart, itemType, itemId, itemLabel, planet, category }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chart, itemType, itemId, itemLabel, planet, category]
  );

  const enabled = Boolean(chart && (itemLabel || planet || category));
  const { data, loading, error, request } = useExplanation({ cacheKey, fetcher, enabled });

  if (!enabled) return null;

  const hasLinks = data && ((data.relatedTimelineEvents || []).length > 0 || (data.relatedPredictions || []).length > 0);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) request();
  };

  return (
    <div style={{ border: "1px solid var(--nv-accent-wash, rgba(180,120,255,0.12))", borderRadius: 12,
      overflow: "hidden", background: "var(--nv-surface-subtle, rgba(18,0,38,0.4))" }}>
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        className="tap-scale"
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
          padding: "13px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left",
          fontFamily: "Inter,sans-serif", color: "var(--nv-text-primary, #e8d5ff)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}>
          <span aria-hidden="true">🔗</span> Related Timeline Events
        </span>
        <span aria-hidden="true" style={{ fontSize: 12, color: "var(--nv-text-muted, rgba(200,160,255,0.6))", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}>
          ▾
        </span>
      </button>

      {open && (
        <div style={{ padding: "0 16px 16px", display: "grid", gap: 10 }}>
          {loading && <TypingIndicator label="Finding related Timeline events" />}
          {error && !loading && (
            <p role="alert" style={{ margin: 0, fontSize: 12, color: "var(--nv-danger, #ffaaaa)", fontFamily: "Inter,sans-serif" }}>
              {error}
            </p>
          )}
          {data && !loading && !hasLinks && (
            <p style={{ margin: 0, fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.5))", fontFamily: "Inter,sans-serif" }}>
              No related Timeline events found for this item yet.
            </p>
          )}
          {data && !loading && hasLinks && (data.relatedTimelineEvents || []).map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => onSelectTimelineEvent?.(event)}
              className="tap-scale"
              style={{
                textAlign: "left", padding: "10px 12px", borderRadius: 12, cursor: onSelectTimelineEvent ? "pointer" : "default",
                background: "var(--nv-glass-bg-soft, rgba(255,255,255,0.03))", border: "1px solid var(--nv-glass-border, rgba(200,160,255,0.12))",
                display: "grid", gap: 4,
              }}
            >
              <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--nv-text-muted, rgba(200,160,255,0.5))", fontFamily: "Inter,sans-serif" }}>
                {event.section} · {event.category}
              </span>
              <span style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--nv-text-secondary, rgba(230,220,255,0.75))", fontFamily: "Inter,sans-serif" }}>
                {event.prediction}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(CrossLinkPanel);
