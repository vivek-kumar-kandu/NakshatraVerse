import { memo } from "react";
import { PLANET_COLORS, HOUSE_MEANINGS } from "../../constants/astrology.js";

// ─────────────────────────────────────────────────────────────────────────
// HouseCard (V3.0 Phase 3 — reusable report component)
//
// Renders one house (1-12) and whichever planets already-computed
// `planetary` data placed there. No calculation — `planets` and
// `houseSign` are passed in exactly as derived from the existing
// `planetary` prop the Kundli tab already grouped by house.
// ─────────────────────────────────────────────────────────────────────────
function HouseCard({ house, planets = [], houseSign, active, onHover, onLeave, onClick }) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="tap-scale"
      aria-pressed={active}
      aria-label={`House ${house}: ${HOUSE_MEANINGS[house] || ""}${planets.length ? " — " + planets.join(", ") : ""}`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onFocus={onHover}
      onBlur={onLeave}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } }}
      style={{
        padding: "10px 12px",
        background: active ? "rgba(255,215,0,0.08)" : "rgba(255,255,255,0.03)",
        borderRadius: 10,
        border: active ? "1px solid rgba(255,215,0,0.4)" : "1px solid rgba(180,120,255,0.12)",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: active ? "#ffd700" : "var(--nv-text-muted, rgba(200,160,255,0.45))", fontFamily: "Inter,sans-serif", fontWeight: 600 }}>
          House {house}
        </span>
        {houseSign && <span style={{ fontSize: 10, color: "var(--nv-text-faint, rgba(200,160,255,0.35))", fontFamily: "Inter,sans-serif" }}>{houseSign}</span>}
      </div>
      <div style={{ fontSize: 9.5, color: "var(--nv-text-muted, rgba(200,160,255,0.4))", fontFamily: "Inter,sans-serif", marginBottom: 4 }}>
        {HOUSE_MEANINGS[house] || ""}
      </div>
      {planets.length > 0
        ? planets.map((p) => <div key={p} style={{ fontSize: 11, color: PLANET_COLORS[p] || "#bf7fff", fontFamily: "Inter,sans-serif" }}>{p}</div>)
        : <div style={{ fontSize: 11, color: "rgba(180,120,255,0.25)", fontFamily: "Inter,sans-serif" }}>—</div>}
    </div>
  );
}

export default memo(HouseCard);
