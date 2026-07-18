import { memo } from "react";
import GlassCard from "../common/GlassCard.jsx";
import Badge from "../common/Badge.jsx";
import { PLANET_COLORS } from "../../constants/astrology.js";
import { confidenceColor } from "../report/predictionDisplay.js";
import { TIMELINE_FILTER_CATEGORIES } from "../../constants/aiTimeline.js";

const CATEGORY_ICON = Object.fromEntries(TIMELINE_FILTER_CATEGORIES.map((c) => [c.key, c.icon]));
const CATEGORY_LABEL = Object.fromEntries(TIMELINE_FILTER_CATEGORIES.map((c) => [c.key, c.label]));

// ─────────────────────────────────────────────────────────────────────────
// AiTimelineEventCard — V5.2 (AI Timeline)
//
// One AI Timeline event node — visually modeled on TimelineCard.jsx (V3.0
// Phase 3) with the same rail/GlassCard/Badge/confidenceColor language,
// extended with the fields the V5.2 spec adds: Category, Related Transit,
// and Related Remedies (Supporting planets/yogas/doshas, Related dasha,
// Confidence, and the Date/Time Range were already exactly what
// TimelineCard rendered).
//
// Selectable + keyboard accessible: the whole card is a single
// `role="button"` region (Enter/Space activates it, same convention
// ExplorerMainPanel's own selectable items already use), so choosing an
// event to explain never requires a mouse.
// ─────────────────────────────────────────────────────────────────────────
function AiTimelineEventCard({ event, isLast, highlighted = false, selected = false, onSelect, hidePrediction = false }) {
  const color = confidenceColor(event.confidence?.label);
  const planetColor = PLANET_COLORS[event.dominantPlanet] || "#bf7fff";
  const categoryLabel = CATEGORY_LABEL[event.filterCategory] || event.category || "General";
  const categoryIcon = CATEGORY_ICON[event.filterCategory] || "✨";

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect?.(event);
    }
  };

  return (
    <div style={{ display: "flex", gap: 14 }}>
      {/* Rail */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <span aria-hidden="true" style={{
          width: 12, height: 12, borderRadius: "50%", background: planetColor,
          boxShadow: `0 0 0 4px ${planetColor}22`, marginTop: 6,
        }} />
        {!isLast && <span aria-hidden="true" style={{ flex: 1, width: 2, background: "rgba(180,120,255,0.18)", marginTop: 4 }} />}
      </div>

      {/* Content */}
      <GlassCard
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        aria-label={`AI Timeline entry for ${event.timePeriod?.startDate || "an upcoming period"}${event.timePeriod?.endDate ? ` to ${event.timePeriod.endDate}` : ""}. Select to explain with AI.`}
        onClick={() => onSelect?.(event)}
        onKeyDown={handleKeyDown}
        data-highlighted={highlighted ? "true" : undefined}
        data-selected={selected ? "true" : undefined}
        style={{
          padding: 16, marginBottom: 16, flex: 1, cursor: "pointer",
          borderColor: selected ? "rgba(191,127,255,0.75)" : highlighted ? "rgba(255,215,0,0.6)" : undefined,
          boxShadow: selected
            ? "0 0 0 2px rgba(191,127,255,0.55), 0 4px 30px rgba(80,0,180,0.25)"
            : highlighted
              ? "0 0 0 1px rgba(255,215,0,0.35), 0 4px 30px rgba(80,0,180,0.18)"
              : undefined,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "#ffd700", fontFamily: "Inter,sans-serif" }}>
            <span aria-hidden="true">{categoryIcon}</span>
            {categoryLabel}
            <span style={{ color: "var(--nv-text-muted, rgba(200,160,255,0.55))", fontWeight: 400 }}>
              · {event.timePeriod?.startDate ? `${event.timePeriod.startDate} → ${event.timePeriod.endDate}` : "Upcoming period"}
            </span>
          </span>
          <Badge color={color}>{event.confidence?.label} · {event.confidence?.score}/100</Badge>
        </div>

        {!hidePrediction && event.prediction && (
          <p style={{ margin: "0 0 10px", fontSize: 13, lineHeight: 1.6, color: "var(--nv-text-secondary, rgba(230,220,255,0.85))", fontFamily: "Inter,sans-serif" }}>
            {event.prediction}
          </p>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: (event.suggestedRemedies?.length || event.relatedTransit) ? 10 : 0 }}>
          {event.activeMahadasha && <Badge color="#bf7fff">Mahadasha: {event.activeMahadasha}</Badge>}
          {event.activeAntardasha && <Badge color="#bf7fff">Antardasha: {event.activeAntardasha}</Badge>}
          {event.dominantPlanet && <Badge color={planetColor}>{event.dominantPlanet}</Badge>}
          {(event.supportingYogas || []).map((y, i) => <Badge key={`yoga-${i}`} color="#7effb2">{y.name}</Badge>)}
          {(event.supportingDoshas || []).map((d, i) => <Badge key={`dosha-${i}`} color="#ff8f7e">{d.name}</Badge>)}
        </div>

        {event.suggestedRemedies?.length > 0 && (
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "var(--nv-text-muted, rgba(200,160,255,0.65))", fontFamily: "Inter,sans-serif" }}>
            🪬 {event.suggestedRemedies[0].detail}
          </p>
        )}
      </GlassCard>
    </div>
  );
}

export default memo(AiTimelineEventCard);
