import { memo } from "react";
import GlassCard from "./GlassCard.jsx";

// ─────────────────────────────────────────────────────────────────────────
// Timeline (V4.5 Phase 1B — Festival Frontend Integration)
//
// A small, generic vertical timeline primitive: a dot-and-line rail with
// a date/label/detail per entry. Built the same way GlassCard/Badge/
// EmptyState/Skeleton already are — no data fetching, no business logic,
// purely presentational — so it can be reused anywhere a chronological
// list needs to render (first user: the Festival Page's Festival
// Timeline). Visually it mirrors CalendarTimeline.jsx's existing dot/line
// styling so the app doesn't gain a second, differently-styled timeline
// language.
// ─────────────────────────────────────────────────────────────────────────
function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "numeric", timeZone: "UTC",
    });
  } catch {
    return value;
  }
}

function Timeline({ items = [], emptyLabel = "Nothing to show yet.", onItemClick }) {
  if (!items.length) {
    return (
      <GlassCard style={{ padding: 20, textAlign: "center", fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>
        {emptyLabel}
      </GlassCard>
    );
  }

  return (
    <div style={{ display: "grid", gap: 0 }}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const Wrapper = onItemClick ? "button" : "div";
        return (
          <div key={item.id ?? `${item.date}-${i}`} style={{ display: "flex", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 18, flexShrink: 0 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 12, height: 12, borderRadius: "50%", flexShrink: 0, marginTop: 4,
                  background: item.color || "var(--nv-color-brand-gold, #ffd700)",
                  boxShadow: `0 0 10px ${item.color || "rgba(255,215,0,0.6)"}`,
                }}
              />
              {!isLast && <span aria-hidden="true" style={{ flex: 1, width: 2, background: "var(--nv-accent-wash, rgba(180,120,255,0.18))", marginTop: 4 }} />}
            </div>
            <Wrapper
              onClick={onItemClick ? () => onItemClick(item) : undefined}
              className={onItemClick ? "tap-scale" : undefined}
              style={{
                flex: 1, textAlign: "left", background: "transparent", border: "none", padding: 0,
                marginBottom: isLast ? 0 : 18, cursor: onItemClick ? "pointer" : "default", font: "inherit",
              }}
            >
              <GlassCard style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif" }}>
                    {item.title}
                  </span>
                  <span style={{ fontSize: 11.5, color: "var(--nv-text-muted, rgba(200,160,255,0.55))", fontFamily: "Inter,sans-serif" }}>
                    {formatDate(item.date)}
                  </span>
                </div>
                {item.subtitle && (
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--nv-text-muted, rgba(200,160,255,0.6))", lineHeight: 1.5 }}>
                    {item.subtitle}
                  </p>
                )}
                {item.badge}
              </GlassCard>
            </Wrapper>
          </div>
        );
      })}
    </div>
  );
}

export default memo(Timeline);
