import { memo, useEffect, useState } from "react";
<<<<<<< HEAD
=======
import { useTranslation } from "react-i18next";
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
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
<<<<<<< HEAD
=======
  const { t } = useTranslation(["festival"]);
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
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
<<<<<<< HEAD
          setError(err.message || "Could not load family festival suggestions right now.");
=======
          setError(err.message || t("festival:familySuggestions.loadFailed"));
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [festival?.key, festival?.date, isAuthenticated]);

  if (!festival) return null;

  if (!isAuthenticated || needsAuth) {
    return (
      <GlassCard style={{ padding: "18px 20px", textAlign: "center" }}>
        <h3 style={{ margin: 0, fontFamily: "Cinzel,serif", fontSize: 15.5, color: "var(--nv-text-primary, #f1e4ff)" }}>
<<<<<<< HEAD
          👨‍👩‍👧‍👦 Family Festival Suggestions
        </h3>
        <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>
          Sign in and add Family Profiles to get shared celebration suggestions and reminders for the people you care about.
=======
          {t("festival:familySuggestions.title")}
        </h3>
        <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>
          {t("festival:familySuggestions.signInPrompt")}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
        </p>
      </GlassCard>
    );
  }

  if (error) return <p style={{ margin: 0, fontSize: 12.5, color: "#ff8f7e" }}>{error}</p>;
  if (!data) return <SkeletonList rows={2} />;

  return (
    <div style={{ display: "grid", gap: 10 }}>
<<<<<<< HEAD
      <ExpandableSection icon="🔔" title="Family Festival Reminders" defaultOpen={data.familyReminders?.length > 0}>
=======
      <ExpandableSection icon="🔔" title={t("festival:familySuggestions.remindersTitle")} defaultOpen={data.familyReminders?.length > 0}>
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
        {data.familyReminders?.length ? (
          <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
            {data.familyReminders.map((r) => <li key={r.profileId}>{r.message}</li>)}
          </ul>
        ) : (
          <p style={{ margin: 0 }}>
<<<<<<< HEAD
            No Family Profiles saved yet.{onOpenFamilyProfiles && (
=======
            {t("festival:familySuggestions.noProfiles")}{onOpenFamilyProfiles && (
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
              <button
                onClick={onOpenFamilyProfiles}
                className="tap-scale"
                style={{ marginLeft: 8, background: "transparent", border: "none", color: "#bf7fff", cursor: "pointer", textDecoration: "underline", font: "inherit" }}
              >
<<<<<<< HEAD
                Add one →
=======
                {t("festival:familySuggestions.addOne")}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
              </button>
            )}
          </p>
        )}
      </ExpandableSection>

<<<<<<< HEAD
      <ExpandableSection icon="🎊" title="Shared Celebration Suggestions">
=======
      <ExpandableSection icon="🎊" title={t("festival:familySuggestions.sharedCelebrationTitle")}>
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
        <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
          {(data.sharedCelebrationSuggestions || []).map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </ExpandableSection>

<<<<<<< HEAD
      <ExpandableSection icon="✨" title="Suggested Family Activities">
=======
      <ExpandableSection icon="✨" title={t("festival:familySuggestions.suggestedActivitiesTitle")}>
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
        <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
          {(data.suggestedFamilyActivities || []).map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </ExpandableSection>
    </div>
  );
}

export default memo(FestivalFamilySuggestions);
