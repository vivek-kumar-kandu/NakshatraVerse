import { memo } from "react";
import GlassCard from "../common/GlassCard.jsx";
import Badge from "../common/Badge.jsx";

// ─────────────────────────────────────────────────────────────────────────
// FestivalCard (V4.5 Phase 1B — Festival Frontend Integration)
// A single festival occurrence card: name, date, type/importance badges,
// and a one-line description — the "Festival Card" building block used by
// FestivalPage's grid and by TodayFestivalCard/upcoming lists. Purely
// presentational, built on the existing GlassCard/Badge exactly like
// ReportCard already is.
// ─────────────────────────────────────────────────────────────────────────
const IMPORTANCE_COLOR = { High: "#ffd700", Medium: "#bf7fff", Low: "#9dc9ff" };

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, {
      weekday: "short", year: "numeric", month: "short", day: "numeric", timeZone: "UTC",
    });
  } catch {
    return value;
  }
}

function FestivalCard({ festival, onOpen, compact = false }) {
  if (!festival) return null;
  const importanceColor = IMPORTANCE_COLOR[festival.importance] || "#bf7fff";

  const Wrapper = onOpen ? "button" : "div";
  return (
    <Wrapper
      onClick={onOpen ? () => onOpen(festival) : undefined}
      className={onOpen ? "tap-scale" : undefined}
      style={{ display: "block", width: "100%", textAlign: "left", background: "transparent", border: "none", padding: 0, cursor: onOpen ? "pointer" : "default", font: "inherit" }}
    >
      <GlassCard style={{ padding: compact ? "14px 16px" : "18px 20px", animation: "fadeIn 0.3s ease both" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: compact ? 14 : 15.5, fontFamily: "Cinzel,serif", color: "var(--nv-text-primary, #f1e4ff)" }}>
              {festival.name}
            </h3>
            <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>
              {formatDate(festival.date)}{festival.endDate && festival.endDate !== festival.date ? ` – ${formatDate(festival.endDate)}` : ""}
            </p>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
            <Badge color={importanceColor}>{festival.importance}</Badge>
            <Badge color="#7effb2">{festival.type}</Badge>
          </div>
        </div>
        {!compact && festival.description && (
          <p style={{ margin: "10px 0 0", fontSize: 12.5, lineHeight: 1.55, color: "var(--nv-text-muted, rgba(200,160,255,0.65))" }}>
            {festival.description}
          </p>
        )}
      </GlassCard>
    </Wrapper>
  );
}

export default memo(FestivalCard);
