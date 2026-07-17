import { memo, useEffect, useId, useMemo, useRef, useState } from "react";
import { SkeletonBlock } from "./Skeleton.jsx";
import { splitSentences } from "../../utils/aiText.js";

// ─────────────────────────────────────────────────────────────────────────
// AiText — Phase 3: Premium AI Report Presentation
//
// Same external contract as before: `text`, `placeholder`, `failed`. All
// changes below are purely presentational — no prop was added/removed/
// renamed, so every existing call site (OverviewTab, TwoSectionTab,
// SingleTab, ResultsPage's Life Summary tab) keeps working unmodified.
//
// What changed:
//   - Loading state: the single spinner line is now paired with a
//     shimmering paragraph-shaped skeleton (reusing the existing
//     `Skeleton.jsx` primitive from Phase 1), so it reads as "the report
//     is being written" rather than a generic spinner.
//   - Information hierarchy: the first sentence is styled as a short
//     "lead" line (larger, brighter) and the remaining sentences form the
//     body — the same visual pattern used in print/editorial design to
//     let a reader scan the gist before committing to the full text.
//   - Progressive reveal: the first time real text lands (placeholder →
//     content), each sentence fades in with a small stagger instead of
//     the whole block appearing at once. It only plays once per mount
//     (tracked via a ref) and is automatically shortened to ~0ms by the
//     existing global `prefers-reduced-motion` rule in global.css.
//   - Expandable/collapsible: long sections (the multi-sentence fields
//     like lifeSummary/career/finance) collapse to ~3 lines behind a
//     soft gradient fade with a "Read more" toggle, so a tab doesn't open
//     with a wall of text. Short fields (2-3 sentence doshas/yogas, or
//     the single-word strings used in this app's own test fixtures) are
//     rendered in full, no toggle shown.
// ─────────────────────────────────────────────────────────────────────────

const COLLAPSE_CHAR_THRESHOLD = 260;

function AiText({ text, placeholder = "Consulting the stars…", failed = false }) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const hasAnimatedRef = useRef(false);

  const sentences = useMemo(() => splitSentences(text), [text]);
  const [lead, ...rest] = sentences;
  const isLong = (text?.length || 0) > COLLAPSE_CHAR_THRESHOLD && rest.length > 0;

  // Only stagger-animate the very first time this instance receives real
  // text (e.g. when the AI response first lands). Later re-renders of the
  // same mounted component (unrelated parent state changes) won't replay it.
  const shouldAnimate = !hasAnimatedRef.current;
  useEffect(() => {
    if (text) hasAnimatedRef.current = true;
  }, [text]);

  if (!text) {
    if (failed) {
      return (
        <div role="alert" style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 0", color: "var(--nv-danger, rgba(255,150,150,0.55))", fontStyle: "italic", fontSize: 14 }}>
          <span aria-hidden="true" style={{ fontSize: 14, flexShrink: 0 }}>⚠</span>
          Unavailable right now — see the notice above.
        </div>
      );
    }
    return (
      <div role="status" aria-live="polite" style={{ display: "grid", gap: 12, padding: "6px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--nv-text-faint, rgba(200,160,255,0.45))", fontStyle: "italic", fontSize: 13, fontFamily: "Inter,sans-serif" }}>
          <div aria-hidden="true" style={{ width: 14, height: 14, border: "2px solid var(--nv-accent-border, rgba(180,120,255,0.3))", borderTopColor: "#bf7fff", borderRadius: "50%", animation: "spin 1s linear infinite", flexShrink: 0 }} />
          {placeholder}
        </div>
        <div aria-hidden="true" style={{ display: "grid", gap: 8 }}>
          <SkeletonBlock height={11} width="94%" />
          <SkeletonBlock height={11} width="82%" />
          <SkeletonBlock height={11} width="63%" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <p style={{ margin: "0 0 10px", lineHeight: 1.65, fontSize: 15, fontWeight: 600,
        color: "var(--nv-text-primary, #f1e4ff)", fontFamily: "Inter,sans-serif", letterSpacing: 0.1,
        animation: shouldAnimate ? "fadeIn 0.4s ease both" : "none" }}>
        {lead}
      </p>
      {rest.length > 0 && (
        <div
          id={contentId}
          style={{
            maxHeight: !isLong || expanded ? 999 : "3.4em",
            overflow: "hidden",
            position: "relative",
            transition: "max-height 0.45s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <p style={{ margin: 0, lineHeight: 1.8, fontSize: 14, color: "var(--nv-text-primary, rgba(220,190,255,0.82))", fontFamily: "Inter,sans-serif" }}>
            {rest.map((sentence, i) => (
              <span key={i} style={{ animation: shouldAnimate ? `fadeIn 0.4s ease ${0.06 * (i + 1)}s both` : "none" }}>
                {sentence}{" "}
              </span>
            ))}
          </p>
          {isLong && !expanded && (
            <div aria-hidden="true" style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2.4em",
              background: "linear-gradient(rgba(0,0,0,0), var(--nv-surface-strong, rgba(15,0,35,0.92)))" }} />
          )}
        </div>
      )}
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          aria-controls={contentId}
          className="pill-btn tap-scale"
          style={{ marginTop: 10, background: "rgba(191,127,255,0.08)", border: "1px solid var(--nv-accent-border, rgba(180,120,255,0.3))",
            color: "#bf7fff", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: "Inter,sans-serif", display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          {expanded ? "Show less" : "Read more"}
          <span aria-hidden="true" style={{ display: "inline-block", fontSize: 10, transition: "transform var(--nv-duration-base) var(--nv-ease-standard)", transform: expanded ? "rotate(180deg)" : "none" }}>▼</span>
        </button>
      )}
    </div>
  );
}

export default memo(AiText);
