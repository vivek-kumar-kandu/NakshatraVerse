import { memo, useMemo } from "react";
import GlassCard from "./GlassCard.jsx";
import { SkeletonBlock } from "./Skeleton.jsx";
import { REPORT_HIGHLIGHTS } from "../../constants/astrology.js";
import { leadSentence } from "../../utils/aiText.js";

// ─────────────────────────────────────────────────────────────────────────
// KeyHighlights — Phase 3: Premium AI Report Presentation
//
// A "quick glance" panel for the Overview tab: one small card per report
// section (Love, Career, Wealth, Health, Doshas & Yogas, Remedies) showing
// just its opening AI sentence, so a reader can scan the gist of the whole
// report before diving into any single tab. Purely presentational —
// reads the same `report` object every tab already receives, computes
// nothing, and (optionally) just calls back into the existing tab-switch
// handler (`onNavigate`) that ResultsPage already owns.
//
// If `onNavigate` isn't passed, chips render as plain (non-interactive)
// summary cards instead of buttons — still fully valid without it.
// ─────────────────────────────────────────────────────────────────────────
function KeyHighlights({ report, failed, onNavigate }) {
  const items = useMemo(
    () => REPORT_HIGHLIGHTS.map((h) => ({ ...h, lead: leadSentence(report?.[h.key]) })),
    [report]
  );

  // Once the AI request has definitively failed, the individual section
  // cards on each tab already show the "Unavailable" notice — avoid
  // duplicating that message a second time here.
  if (failed) return null;

  const isLoading = items.every((i) => !i.lead);

  return (
    <GlassCard style={{ padding: 24, gridColumn: "1/-1", animation: "fadeIn 0.35s ease 0.18s both" }}>
      <h3 style={{ margin: "0 0 16px", fontSize: 14, letterSpacing: 1.5, textTransform: "uppercase",
        color: "var(--nv-text-muted, rgba(200,160,255,0.55))", fontFamily: "Inter,sans-serif", fontWeight: 500 }}>
        ✨ KEY HIGHLIGHTS
      </h3>
      <div role={isLoading ? "status" : undefined} aria-label={isLoading ? "Loading highlights" : undefined}
        style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} aria-hidden="true" style={{ padding: "14px 16px", borderRadius: 12,
                border: "1px solid var(--nv-accent-wash, rgba(180,120,255,0.12))", background: "rgba(255,255,255,0.02)", display: "grid", gap: 8 }}>
                <SkeletonBlock width="50%" height={12} />
                <SkeletonBlock width="90%" height={10} />
                <SkeletonBlock width="70%" height={10} />
              </div>
            ))
          : items.map((item, idx) => {
              const interactive = typeof onNavigate === "function";
              return (
                <div
                  key={item.key}
                  role={interactive ? "button" : undefined}
                  tabIndex={interactive ? 0 : undefined}
                  aria-label={interactive ? `View ${item.label} — ${item.lead || "no insight yet"}` : undefined}
                  className={interactive ? "tap-scale highlight-chip" : undefined}
                  onClick={interactive ? () => onNavigate(item.tabId) : undefined}
                  onKeyDown={interactive ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onNavigate(item.tabId); } } : undefined}
                  style={{
                    padding: "14px 16px", borderRadius: 12,
                    background: `${item.color}0f`, border: `1px solid ${item.color}30`,
                    cursor: interactive ? "pointer" : "default", display: "grid", gap: 6,
                    animation: `fadeIn 0.35s ease ${idx * 0.05}s both`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span aria-hidden="true" style={{ fontSize: 15 }}>{item.icon}</span>
                    <span style={{ fontSize: 11.5, letterSpacing: 0.5, textTransform: "uppercase",
                      color: item.color, fontWeight: 700, fontFamily: "Inter,sans-serif" }}>{item.label}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: "var(--nv-text-secondary, rgba(220,190,255,0.75))",
                    fontFamily: "Inter,sans-serif", display: "-webkit-box", WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {item.lead || "Being prepared…"}
                  </p>
                </div>
              );
            })}
      </div>
    </GlassCard>
  );
}

export default memo(KeyHighlights);
