import { memo } from "react";
import GlassCard from "../common/GlassCard.jsx";
import { activityMeta } from "./panchangUiConstants.js";

// ─────────────────────────────────────────────────────────────────────────
// MuhuratFinderForm (V4.1 Phase 2)
// Pure input form — activity choice, search-window start date, and how
// many days ahead to search. Submitting calls `onSearch({ activity,
// startDate, rangeDays })`; the actual Muhurat calculation happens
// entirely on the backend (see muhuratEngine.js) via
// utils/panchangApi.js's findMuhurat.
// ─────────────────────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function MuhuratFinderForm({ activities, activity, setActivity, startDate, setStartDate, rangeDays, setRangeDays, onSearch, searching }) {
  return (
    <GlassCard style={{ padding: "22px 24px" }}>
      <h3 style={{ margin: "0 0 14px", fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--nv-text-muted, rgba(200,160,255,0.55))", fontFamily: "Inter,sans-serif" }}>
        🔍 Find an Auspicious Muhurat
      </h3>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, color: "var(--nv-text-muted, rgba(200,160,255,0.6))", marginBottom: 8, fontFamily: "Inter,sans-serif" }}>
          Choose an activity
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
          {(activities || []).map((key) => {
            const meta = activityMeta(key);
            const active = key === activity;
            return (
              <button
                key={key}
                onClick={() => setActivity(key)}
                className="tap-scale"
                style={{
                  padding: "10px 12px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                  border: active ? "1px solid rgba(255,215,0,0.45)" : "1px solid var(--nv-surface-border, rgba(180,120,255,0.18))",
                  background: active ? "rgba(255,215,0,0.14)" : "rgba(20,0,40,0.35)",
                  color: active ? "#ffd700" : "var(--nv-text-secondary, rgba(200,160,255,0.8))",
                  fontFamily: "Inter,sans-serif", fontSize: 12.5, fontWeight: active ? 700 : 500,
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                <span aria-hidden="true">{meta.icon}</span>{meta.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 18 }}>
        <div style={{ flex: "1 1 160px" }}>
          <label style={{ display: "block", fontSize: 12, color: "var(--nv-text-muted, rgba(200,160,255,0.6))", marginBottom: 6, fontFamily: "Inter,sans-serif" }}>
            Search from
          </label>
          <input
            type="date"
            value={startDate}
            min={todayStr()}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--nv-surface-border, rgba(180,120,255,0.25))",
              background: "rgba(20,0,40,0.5)", color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif", fontSize: 13,
            }}
          />
        </div>
        <div style={{ flex: "1 1 160px" }}>
          <label style={{ display: "block", fontSize: 12, color: "var(--nv-text-muted, rgba(200,160,255,0.6))", marginBottom: 6, fontFamily: "Inter,sans-serif" }}>
            Search window (days)
          </label>
          <select
            value={rangeDays}
            onChange={(e) => setRangeDays(Number(e.target.value))}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--nv-surface-border, rgba(180,120,255,0.25))",
              background: "rgba(20,0,40,0.5)", color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif", fontSize: 13,
            }}
          >
            {[15, 30, 60, 90].map((n) => <option key={n} value={n}>{n} days</option>)}
          </select>
        </div>
      </div>

      <button
        onClick={onSearch}
        disabled={searching || !activity || !startDate}
        className="pill-btn tap-scale"
        style={{
          width: "100%", padding: "12px 18px", borderRadius: 14, fontSize: 13.5, fontWeight: 700,
          cursor: searching ? "default" : "pointer", border: "none",
          background: "linear-gradient(135deg, rgba(123,47,255,0.55), rgba(74,0,160,0.55))",
          color: "#fff", fontFamily: "Inter,sans-serif", opacity: (!activity || !startDate) ? 0.6 : 1,
        }}
      >
        {searching ? "Searching…" : "Find Best Muhurat"}
      </button>
    </GlassCard>
  );
}

export default memo(MuhuratFinderForm);
