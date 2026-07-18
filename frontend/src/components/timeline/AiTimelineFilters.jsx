import { memo } from "react";
import { TIMELINE_FILTER_CATEGORIES } from "../../constants/aiTimeline.js";

// ─────────────────────────────────────────────────────────────────────────
// AiTimelineFilters — V5.2 (AI Timeline)
// The "Timeline Filters" chip row (Career/Finance/Love/Marriage/Health/
// Education/Family/Spiritual + All). Purely a client-side filter over
// events already fetched with the report — selecting a chip never
// triggers a new backend request. `role="group"` + one `aria-pressed`
// toggle button per chip, all reachable via Tab, matches the same
// accessible-toggle-group pattern ExplorerTab's own item-type selector
// already uses.
// ─────────────────────────────────────────────────────────────────────────
function AiTimelineFilters({ activeCategory, onChange }) {
  const chipStyle = (isActive) => ({
    padding: "8px 14px", borderRadius: 18, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
    border: isActive ? "1px solid rgba(255,215,0,0.55)" : "1px solid rgba(180,120,255,0.25)",
    background: isActive ? "rgba(255,215,0,0.14)" : "rgba(123,47,255,0.08)",
    color: isActive ? "#ffd700" : "var(--nv-text-secondary, rgba(230,220,255,0.75))",
    fontFamily: "Inter,sans-serif", whiteSpace: "nowrap",
  });

  return (
    <div
      role="group"
      aria-label="Filter AI Timeline events by life area"
      style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
    >
      <button
        type="button"
        role="button"
        aria-pressed={activeCategory === null}
        onClick={() => onChange(null)}
        className="tap-scale"
        style={chipStyle(activeCategory === null)}
      >
        All
      </button>
      {TIMELINE_FILTER_CATEGORIES.map(({ key, label, icon }) => (
        <button
          key={key}
          type="button"
          role="button"
          aria-pressed={activeCategory === key}
          onClick={() => onChange(activeCategory === key ? null : key)}
          className="tap-scale"
          style={chipStyle(activeCategory === key)}
        >
          <span aria-hidden="true">{icon}</span> {label}
        </button>
      ))}
    </div>
  );
}

export default memo(AiTimelineFilters);
