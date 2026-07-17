import { memo } from "react";
import { SORT_OPTIONS } from "../../utils/reportDisplay.js";

// ─────────────────────────────────────────────────────────────────────────
// SearchFilterBar (Phase 4 — Dashboard & Report Management)
//
// Fully controlled — owns no state of its own. The caller (DashboardPage)
// holds `query`/`sort`/`view` in its own state and passes them straight
// through, exactly like every existing form field in this codebase
// (LoginPage/SignupPage/LandingPage all follow the same controlled-input
// pattern). Filtering/sorting the `reports` array itself happens in the
// caller via `utils/reportDisplay.js` — this component only renders the
// controls and reports what the person typed/picked.
// ─────────────────────────────────────────────────────────────────────────

const selectStyle = {
  padding: "10px 14px", borderRadius: 20, fontSize: 12.5, cursor: "pointer",
  border: "1px solid var(--nv-accent-border, rgba(180,120,255,0.3))", background: "var(--nv-surface, rgba(18,0,38,0.6))",
  color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif", appearance: "none",
};

function ViewToggle({ view, onChange }) {
  return (
    <div
      role="group"
      aria-label="Report layout"
      style={{
        display: "flex", border: "1px solid var(--nv-accent-border, rgba(180,120,255,0.3))", borderRadius: 20,
        overflow: "hidden", flexShrink: 0,
      }}
    >
      {[{ id: "grid", icon: "▦", label: "Grid view" }, { id: "list", icon: "☰", label: "List view" }].map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          aria-pressed={view === opt.id}
          aria-label={opt.label}
          title={opt.label}
          className="tap-scale"
          style={{
            padding: "9px 14px", border: "none", cursor: "pointer", fontSize: 13,
            background: view === opt.id ? "var(--nv-accent-wash-strong, rgba(123,47,255,0.4))" : "transparent",
            color: view === opt.id ? "#fff" : "var(--nv-text-secondary, rgba(200,160,255,0.7))",
          }}
        >
          <span aria-hidden="true">{opt.icon}</span>
        </button>
      ))}
    </div>
  );
}

function SearchFilterBar({ query, onQueryChange, sort, onSortChange, view, onViewChange, resultCount, totalCount }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
        <span aria-hidden="true" style={{
          position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
          fontSize: 13, color: "var(--nv-text-muted, rgba(200,160,255,0.5))", pointerEvents: "none",
        }}>
          🔍
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by title, name, or lagna…"
          aria-label="Search saved reports"
          style={{
            width: "100%", padding: "10px 14px 10px 36px", borderRadius: 20, fontSize: 13,
            border: "1px solid var(--nv-accent-border, rgba(180,120,255,0.3))", background: "var(--nv-surface, rgba(18,0,38,0.6))",
            color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif",
          }}
        />
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 0 }}>
        <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
          Sort saved reports
        </span>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          aria-label="Sort saved reports"
          className="select-input"
          style={selectStyle}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </label>

      <ViewToggle view={view} onChange={onViewChange} />

      <span aria-live="polite" style={{ fontSize: 11.5, color: "var(--nv-text-muted, rgba(200,160,255,0.5))", flexShrink: 0 }}>
        {resultCount === totalCount ? `${totalCount} report${totalCount === 1 ? "" : "s"}` : `${resultCount} of ${totalCount}`}
      </span>
    </div>
  );
}

export default memo(SearchFilterBar);
