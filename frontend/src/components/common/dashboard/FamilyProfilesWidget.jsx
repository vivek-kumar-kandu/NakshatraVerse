import { useEffect, useState } from "react";
import GlassCard from "../GlassCard.jsx";
import SkeletonList from "../Skeleton.jsx";
import * as familyProfilesApi from "../../../utils/familyProfilesApi.js";

// ─────────────────────────────────────────────────────────────────────────
// FamilyProfilesWidget (V4.2 — Family Profiles & Relationship Hub)
// Dashboard widget mirroring PanchangWidget.jsx's exact shape (self-
// fetching, GlassCard shell, header + body + footer link). Shows total
// profile count, up to 3 recently opened profiles, and quick actions
// (Add Profile, Relationship Hub, view all).
// ─────────────────────────────────────────────────────────────────────────

function FamilyProfilesWidget({ onOpenFamilyProfiles, onAddProfile, onOpenRelationshipHub }) {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([familyProfilesApi.getStats(), familyProfilesApi.getRecentlyOpened(3)])
      .then(([s, r]) => { setStats(s); setRecent(r); })
      .catch(() => setError(true));
  }, []);

  return (
    <GlassCard style={{ padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 15, color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Cinzel,serif" }}>
          👨‍👩‍👧‍👦 Family Profiles
        </h3>
        {stats && (
          <span style={{ fontSize: 12, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>
            {stats.total} profile{stats.total === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {error && <p style={{ fontSize: 12.5, color: "var(--nv-danger, #ff8888)" }}>Could not load Family Profiles.</p>}

      {!error && recent === null && <SkeletonList rows={2} variant="row" />}

      {!error && recent?.length === 0 && (
        <p style={{ fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.6))", margin: "0 0 14px" }}>
          No profiles yet — add family, friends, or clients to start comparing charts.
        </p>
      )}

      {!error && recent?.length > 0 && (
        <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
          {recent.map((p) => (
            <button
              key={p.id}
              onClick={() => onOpenFamilyProfiles()}
              className="tap-scale"
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "9px 12px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(180,120,255,0.16)",
                color: "var(--nv-text-primary, #e8d5ff)", font: "inherit", fontSize: 13,
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
              <span style={{ fontSize: 11, color: "var(--nv-text-muted, rgba(200,160,255,0.55))", flexShrink: 0, marginLeft: 8 }}>{p.relationshipLabel}</span>
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={onAddProfile}
          className="pill-btn tap-scale"
          style={{ flex: "1 1 auto", padding: "8px 12px", borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid rgba(180,120,255,0.3)", background: "rgba(123,47,255,0.15)", color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif" }}
        >
          + Add Profile
        </button>
        <button
          onClick={onOpenRelationshipHub}
          className="pill-btn tap-scale"
          style={{ flex: "1 1 auto", padding: "8px 12px", borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid rgba(180,120,255,0.3)", background: "rgba(123,47,255,0.15)", color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif" }}
        >
          💞 Relationship Hub
        </button>
        <button
          onClick={onOpenFamilyProfiles}
          className="pill-btn tap-scale"
          style={{ flex: "1 1 100%", padding: "8px 12px", borderRadius: 16, fontSize: 12, cursor: "pointer", border: "1px solid transparent", background: "transparent", color: "var(--nv-text-secondary, rgba(210,175,255,0.76))", fontFamily: "Inter,sans-serif" }}
        >
          View All Profiles →
        </button>
      </div>
    </GlassCard>
  );
}

export default FamilyProfilesWidget;
