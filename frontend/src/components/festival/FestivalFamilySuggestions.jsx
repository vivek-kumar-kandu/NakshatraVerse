import { memo, useEffect, useState } from "react";
import GlassCard from "../common/GlassCard.jsx";
import ExpandableSection from "../common/ExpandableSection.jsx";
import SkeletonList from "../common/Skeleton.jsx";
import * as festivalIntelligenceApi from "../../utils/festivalIntelligenceApi.js";

// ─────────────────────────────────────────────────────────────────────────
// FestivalFamilySuggestions (V4.5 Phase 2 — Festival Intelligence)
//
// New, additive component. Reuses the signed-in user's own Family
// Profiles (via /api/festival-intelligence/family-suggestions, which
// itself reuses familyProfileService.listProfiles — see that route's own
// header) to surface Family Festival Reminders, Shared Celebration
// Suggestions, and Suggested Family Activities. Does not modify Family
// Profiles in any way — read-only.
// ─────────────────────────────────────────────────────────────────────────
function FestivalFamilySuggestions({ festival, isAuthenticated, onOpenFamilyProfiles }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
    if (!festival || !isAuthenticated) return;
    setData(null);
    setError(null);
    setNeedsAuth(false);
    festivalIntelligenceApi.getFamilyFestivalSuggestions(festival.key, { date: festival.date })
      .then(setData)
      .catch((err) => {
        if (String(err.message || "").includes("401") || String(err.message).toLowerCase().includes("unauthorized")) {
          setNeedsAuth(true);
        } else {
          setError(err.message || "Could not load family festival suggestions right now.");
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [festival?.key, festival?.date, isAuthenticated]);

  if (!festival) return null;

  if (!isAuthenticated || needsAuth) {
    return (
      <GlassCard style={{ padding: "18px 20px", textAlign: "center" }}>
        <h3 style={{ margin: 0, fontFamily: "Cinzel,serif", fontSize: 15.5, color: "var(--nv-text-primary, #f1e4ff)" }}>
          👨‍👩‍👧‍👦 Family Festival Suggestions
        </h3>
        <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>
          Sign in and add Family Profiles to get shared celebration suggestions and reminders for the people you care about.
        </p>
      </GlassCard>
    );
  }

  if (error) return <p style={{ margin: 0, fontSize: 12.5, color: "#ff8f7e" }}>{error}</p>;
  if (!data) return <SkeletonList rows={2} />;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <ExpandableSection icon="🔔" title="Family Festival Reminders" defaultOpen={data.familyReminders?.length > 0}>
        {data.familyReminders?.length ? (
          <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
            {data.familyReminders.map((r) => <li key={r.profileId}>{r.message}</li>)}
          </ul>
        ) : (
          <p style={{ margin: 0 }}>
            No Family Profiles saved yet.{onOpenFamilyProfiles && (
              <button
                onClick={onOpenFamilyProfiles}
                className="tap-scale"
                style={{ marginLeft: 8, background: "transparent", border: "none", color: "#bf7fff", cursor: "pointer", textDecoration: "underline", font: "inherit" }}
              >
                Add one →
              </button>
            )}
          </p>
        )}
      </ExpandableSection>

      <ExpandableSection icon="🎊" title="Shared Celebration Suggestions">
        <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
          {(data.sharedCelebrationSuggestions || []).map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </ExpandableSection>

      <ExpandableSection icon="✨" title="Suggested Family Activities">
        <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
          {(data.suggestedFamilyActivities || []).map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </ExpandableSection>
    </div>
  );
}

export default memo(FestivalFamilySuggestions);
