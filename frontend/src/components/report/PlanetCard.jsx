import { memo } from "react";
import Badge from "../common/Badge.jsx";
import { PLANET_COLORS } from "../../constants/astrology.js";

// ─────────────────────────────────────────────────────────────────────────
// PlanetCard (V3.0 Phase 3 — reusable report component)
//
// Renders one planet's already-computed house/sign placement
// (`report.chart.planetary[planet]` — unchanged shape, unchanged source).
// No astrology math here, only display. Supports the same
// hover/select/click affordances the Kundli tab already used inline, so
// it's a drop-in replacement rather than a new interaction model.
// ─────────────────────────────────────────────────────────────────────────
function PlanetCard({ planet, house, sign, active, selected, onHover, onLeave, onClick, dominantFor }) {
  const color = PLANET_COLORS[planet] || "#bf7fff";
  return (
    <button
      type="button"
      className="tap-scale"
      aria-pressed={selected}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onFocus={onHover}
      onBlur={onLeave}
      onTouchStart={onHover}
      onClick={onClick}
      style={{
        display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: 8,
        padding: "10px 12px", width: "100%",
        background: active ? `${color}14` : "rgba(255,255,255,0.03)",
        borderRadius: 10, border: `1px solid ${selected ? color : `${color}20`}`,
        boxShadow: selected ? `0 0 0 1px ${color}55` : "none",
        cursor: "pointer", textAlign: "left", font: "inherit",
        transition: "background var(--nv-duration-base) var(--nv-ease-standard), border-color var(--nv-duration-base) var(--nv-ease-standard), transform var(--nv-duration-fast) var(--nv-ease-standard)",
        transform: active ? "translateX(2px)" : "none",
      }}
    >
      <span style={{ fontSize: 13, color, fontWeight: 500, fontFamily: "Inter,sans-serif" }}>{planet}</span>
      <Badge color={color}>H{house}</Badge>
      <span style={{ fontSize: 12, color: "var(--nv-text-muted, rgba(200,160,255,0.6))", fontFamily: "Inter,sans-serif", minWidth: 70, textAlign: "right" }}>
        {sign}
      </span>
      {dominantFor?.length > 0 && (
        <span style={{ gridColumn: "1/-1", fontSize: 10.5, color: "var(--nv-text-muted, rgba(200,160,255,0.45))", fontFamily: "Inter,sans-serif", marginTop: 2 }}>
          Dominant in: {dominantFor.join(", ")}
        </span>
      )}
    </button>
  );
}

export default memo(PlanetCard);
