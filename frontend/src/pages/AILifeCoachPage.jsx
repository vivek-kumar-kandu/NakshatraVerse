import { useEffect, useState } from "react";
import CosmicBg from "../components/common/CosmicBg.jsx";
import GlassCard from "../components/common/GlassCard.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import Badge from "../components/common/Badge.jsx";
import { SkeletonBlock } from "../components/common/Skeleton.jsx";
import LifeCoachScoreCard from "../components/lifeCoach/LifeCoachScoreCard.jsx";
import LifeCoachListCard from "../components/lifeCoach/LifeCoachListCard.jsx";
import LifeCoachCategoryCard from "../components/lifeCoach/LifeCoachCategoryCard.jsx";
import LifeCoachConfidenceBadge from "../components/lifeCoach/LifeCoachConfidenceBadge.jsx";
import LifeCoachWhyNote from "../components/lifeCoach/LifeCoachWhyNote.jsx";
import LifeCoachLuckyElementsCard from "../components/lifeCoach/LifeCoachLuckyElementsCard.jsx";
import LifeCoachAffirmationCard from "../components/lifeCoach/LifeCoachAffirmationCard.jsx";
import LifeCoachOutlookCard from "../components/lifeCoach/LifeCoachOutlookCard.jsx";
import * as lifeCoachApi from "../utils/lifeCoachApi.js";
// V5.3 (Explainable Report Intelligence) — additive import only.
import ConfidenceExplanation from "../components/explanation/ConfidenceExplanation.jsx";

// ─────────────────────────────────────────────────────────────────────────
// AILifeCoachPage — V4.3 (AI Life Coach)
//
// A dedicated AI Life Coach page: Daily Guidance plus Career / Relationship
// / Finance / Health & Wellness / Personal Growth coaching, all built from
// a single POST /api/life-coach/guidance call scoped to whatever
// chart/report/userData the caller already has (same "scoped to whatever
// was passed in" contract as AIAssistantPage/HoroscopePage/CalendarPage).
//
// The AI Life Coach never calculates astrology — every planetary/Dasha/
// transit/Panchang/prediction fact it's grounded in was already computed
// by the existing backend engines; Gemini only converts those facts into
// practical guidance (see lifeCoachPromptBuilder.js). This page only
// renders whatever the backend already returned.
//
// Reuses the existing Design System exclusively (CosmicBg, GlassCard,
// EmptyState, Badge, ExpandableSection via the lifeCoach/* components,
// ScoreRing, Skeleton) — no new visual language is introduced.
// ─────────────────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "daily", label: "Daily", icon: "🌅" },
  { id: "weekly", label: "Weekly", icon: "📅" },
  { id: "monthly", label: "Monthly", icon: "🌕" },
  { id: "career", label: "Career", icon: "💼" },
  { id: "relationship", label: "Relationship", icon: "💞" },
  { id: "finance", label: "Finance", icon: "💰" },
  { id: "health", label: "Health", icon: "🧘" },
  { id: "growth", label: "Growth", icon: "🌱" },
];

// Formats the backend `generatedAt` ISO timestamp (V4.3 Enhancement Pass)
// into a short, local "Last Updated" time string. Falls back gracefully
// if the field is absent (e.g. an older cached shape).
function formatLastUpdated(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });
  } catch {
    return null;
  }
}

function AILifeCoachPage({ userData, chart, report, onBack }) {
  const [section, setSection] = useState("daily");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!chart) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    lifeCoachApi.getDailyGuidance({ chart, report })
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => { if (!cancelled) setError(err.message || "Could not load your AI Life Coach guidance."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [chart, report]);

  // Refresh Guidance action (UX Refinement, V4.3 Enhancement Pass) — just
  // re-issues the exact same request. It intentionally respects whatever
  // caching/rate-limiting the backend already applies (Gemini's response
  // cache in geminiService.js and lifeCoachRateLimiter in security.js) —
  // this is not a "force bypass" button, only a normal re-fetch.
  function handleRefresh() {
    if (!chart || refreshing) return;
    setRefreshing(true);
    setError(null);
    lifeCoachApi.getDailyGuidance({ chart, report })
      .then((res) => setData(res))
      .catch((err) => setError(err.message || "Could not refresh your AI Life Coach guidance."))
      .finally(() => setRefreshing(false));
  }

  if (!chart) {
    return (
      <div style={{ minHeight: "100vh", position: "relative", fontFamily: "Inter,sans-serif" }}>
        <CosmicBg />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto", padding: "84px 16px 60px" }}>
          <EmptyState
            icon="🧭"
            title="No reading available yet"
            message="Generate or open a report first to see your personalized AI Life Coach."
            actionLabel="← Back"
            onAction={onBack}
          />
        </div>
      </div>
    );
  }

  const guidance = data?.guidance;

  return (
    <div style={{ position: "relative", minHeight: "100vh", fontFamily: "Inter,sans-serif" }}>
      <CosmicBg animated />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 820, margin: "0 auto", padding: "84px 16px 100px", display: "grid", gap: 20 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={onBack}
            className="pill-btn tap-scale"
            style={{
              background: "rgba(20,0,40,0.55)", border: "1px solid rgba(180,120,255,0.35)",
              color: "var(--nv-text-primary, #e8d5ff)", padding: "10px 16px", borderRadius: 20, cursor: "pointer", fontSize: 13,
            }}
          >
            ← Back
          </button>
          <div>
            <h1 style={{ margin: 0, fontFamily: "Cinzel,serif", fontSize: 21, color: "var(--nv-text-primary, #f1e4ff)" }}>🧭 AI Life Coach</h1>
            {userData?.name && (
              <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>{userData.name}'s daily companion</p>
            )}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {data?.date && <Badge color="#9dc9ff">{data.date}</Badge>}
            {formatLastUpdated(data?.generatedAt) && (
              <span style={{ fontSize: 11, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>
                Updated {formatLastUpdated(data.generatedAt)}
              </span>
            )}
            {guidance && (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="pill-btn tap-scale"
                style={{
                  padding: "8px 14px", borderRadius: 20, fontSize: 12, cursor: refreshing ? "default" : "pointer",
                  border: "1px solid rgba(180,120,255,0.35)", background: "rgba(123,47,255,0.15)",
                  color: "var(--nv-text-primary, #e8d5ff)", opacity: refreshing ? 0.6 : 1,
                }}
              >
                {refreshing ? "Refreshing…" : "↻ Refresh Guidance"}
              </button>
            )}
          </div>
        </div>

        {error && (
          <GlassCard style={{ padding: "16px 20px", border: "1px solid rgba(255,100,100,0.3)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <p style={{ margin: 0, color: "var(--nv-danger, #ff8888)", fontSize: 13, flex: 1 }}>{error}</p>
            <button
              onClick={handleRefresh}
              className="pill-btn tap-scale"
              style={{
                padding: "8px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                border: "1px solid rgba(255,100,100,0.35)", background: "rgba(255,100,100,0.12)",
                color: "var(--nv-danger, #ff8888)",
              }}
            >
              Try Again
            </button>
          </GlassCard>
        )}

        {loading && !guidance && (
          <div style={{ display: "grid", gap: 16 }} role="status" aria-label="Loading your AI Life Coach guidance">
            <SkeletonBlock width="100%" height={110} radius={16} />
            <SkeletonBlock width="100%" height={44} radius={16} />
            <SkeletonBlock width="100%" height={140} radius={16} />
            <SkeletonBlock width="100%" height={90} radius={16} />
            <SkeletonBlock width="100%" height={90} radius={16} />
          </div>
        )}

        {guidance && (
          <>
            {/* Section switcher */}
            <GlassCard style={{ padding: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
              {SECTIONS.map((s) => {
                const active = s.id === section;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSection(s.id)}
                    className="tab-btn tap-scale"
                    style={{
                      flex: "1 1 auto", padding: "10px 12px", border: "none", borderRadius: 12, cursor: "pointer",
                      fontFamily: "Inter,sans-serif", fontSize: 12.5, fontWeight: active ? 700 : 500,
                      color: active ? "#ffd700" : "var(--nv-text-muted, rgba(200,160,255,0.65))",
                      background: active ? "rgba(255,215,0,0.12)" : "transparent",
                    }}
                  >
                    {s.icon} {s.label}
                  </button>
                );
              })}
            </GlassCard>

            {/* Daily */}
            {section === "daily" && (
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <LifeCoachScoreCard
                    dailyEnergyScore={guidance.dailyEnergyScore}
                    todaysFocus={guidance.todaysFocus}
                    motivationMessage={guidance.motivationMessage}
                  />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                    <LifeCoachConfidenceBadge confidence={data?.confidence?.overall} />
                  </div>
                  <LifeCoachWhyNote text={guidance.explainWhy?.todaysFocus} />
                </div>
                <LifeCoachListCard icon="🌟" title="Opportunities" color="#7effb2" items={guidance.opportunities} />
                <LifeCoachListCard icon="⚠️" title="Challenges" color="#ffb454" items={guidance.challenges} />
                <LifeCoachListCard icon="✅" title="Recommended Actions" color="#9dc9ff" items={guidance.recommendedActions} />
                <LifeCoachListCard icon="🚫" title="Things to Avoid" color="#ff8fa3" items={guidance.thingsToAvoid} />
                {guidance.spiritualGuidance && (
                  <GlassCard style={{ padding: "18px 20px" }}>
                    <p style={{ margin: "0 0 6px", fontSize: 13, fontFamily: "Cinzel,serif", color: "#bf7fff" }}>🕉️ Spiritual Guidance</p>
                    <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "var(--nv-text-primary, #e8d5ff)" }}>{guidance.spiritualGuidance}</p>
                  </GlassCard>
                )}
                <LifeCoachAffirmationCard affirmation={guidance.dailyAffirmation} spiritualPractice={guidance.spiritualPractice} />
                <LifeCoachLuckyElementsCard luckyElements={data?.luckyElements} />
              </div>
            )}

            {/* Weekly Outlook */}
            {section === "weekly" && (
              guidance.weeklyOutlook ? (
                <LifeCoachOutlookCard
                  icon="📅" title="This Week's Theme" energyScoreLabel="Weekly Energy"
                  energyScore={guidance.weeklyOutlook.weeklyEnergyScore}
                  theme={guidance.weeklyOutlook.weeklyTheme}
                  opportunities={guidance.weeklyOutlook.weeklyOpportunities}
                  challenges={guidance.weeklyOutlook.weeklyChallenges}
                  bestDay={guidance.weeklyOutlook.bestDay}
                  cautionDay={guidance.weeklyOutlook.cautionDay}
                  focusFields={[{ label: "Weekly Focus", value: guidance.weeklyOutlook.weeklyFocus }]}
                />
              ) : (
                <EmptyState icon="📅" title="Weekly Outlook unavailable" message="We couldn't compute this week's outlook right now — try refreshing." compact />
              )
            )}

            {/* Monthly Outlook */}
            {section === "monthly" && (
              guidance.monthlyOutlook ? (
                <LifeCoachOutlookCard
                  icon="🌕" title="This Month's Theme" energyScoreLabel="Monthly Energy"
                  energyScore={guidance.monthlyOutlook.monthlyEnergyScore}
                  theme={guidance.monthlyOutlook.monthlyTheme}
                  opportunities={guidance.monthlyOutlook.majorOpportunities}
                  challenges={guidance.monthlyOutlook.majorChallenges}
                  focusFields={[
                    { label: "Personal Growth Goal", value: guidance.monthlyOutlook.personalGrowthGoal },
                    { label: "Career Focus", value: guidance.monthlyOutlook.careerFocus },
                    { label: "Relationship Focus", value: guidance.monthlyOutlook.relationshipFocus },
                  ]}
                />
              ) : (
                <EmptyState icon="🌕" title="Monthly Outlook unavailable" message="We couldn't compute this month's outlook right now — try refreshing." compact />
              )
            )}

            {/* Career */}
            {section === "career" && (
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <LifeCoachConfidenceBadge confidence={data?.confidence?.career} />
                </div>
                <ConfidenceExplanation chart={chart} report={report} category="Career" />
                <LifeCoachCategoryCard
                  icon="💼" title="Career Coach" color="#9dc9ff" defaultOpen
                  fields={[
                    { label: "Career Progress", value: guidance.career?.progress },
                    { label: "Skill Development Advice", value: guidance.career?.skillDevelopmentAdvice },
                    { label: "Promotion Guidance", value: guidance.career?.promotionGuidance },
                    { label: "Business Suggestions", value: guidance.career?.businessSuggestions },
                    { label: "Best Time for Important Decisions", value: guidance.career?.bestTimeForDecisions },
                  ]}
                />
                <LifeCoachWhyNote text={guidance.explainWhy?.career} />
              </div>
            )}

            {/* Relationship */}
            {section === "relationship" && (
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <LifeCoachConfidenceBadge confidence={data?.confidence?.relationship} />
                </div>
                {/* "relationship" maps to the "Marriage" category prediction —
                    same mapping confidenceEngine.js's SECTION_TO_CATEGORY_LABEL uses. */}
                <ConfidenceExplanation chart={chart} report={report} category="Marriage" />
                <LifeCoachCategoryCard
                  icon="💞" title="Relationship Coach" color="#ff8fa3" defaultOpen
                  fields={[
                    { label: "Relationship Guidance", value: guidance.relationship?.guidance },
                    { label: "Marriage Advice", value: guidance.relationship?.marriageAdvice },
                    { label: "Family Harmony Tips", value: guidance.relationship?.familyHarmonyTips },
                    { label: "Communication Suggestions", value: guidance.relationship?.communicationSuggestions },
                    { label: "Emotional Wellbeing", value: guidance.relationship?.emotionalWellbeing },
                  ]}
                />
                <LifeCoachWhyNote text={guidance.explainWhy?.relationship} />
              </div>
            )}

            {/* Finance */}
            {section === "finance" && (
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <LifeCoachConfidenceBadge confidence={data?.confidence?.finance} />
                </div>
                <ConfidenceExplanation chart={chart} report={report} category="Finance" />
                <LifeCoachCategoryCard
                  icon="💰" title="Finance Coach" color="#ffd700" defaultOpen
                  fields={[
                    { label: "Financial Outlook", value: guidance.finance?.outlook },
                    { label: "Spending Suggestions", value: guidance.finance?.spendingSuggestions },
                    { label: "Saving Advice", value: guidance.finance?.savingAdvice },
                    { label: "Investment Awareness", value: guidance.finance?.investmentAwareness },
                    { label: "Business Opportunities", value: guidance.finance?.businessOpportunities },
                  ]}
                />
                <LifeCoachWhyNote text={guidance.explainWhy?.finance} />
              </div>
            )}

            {/* Health & Wellness */}
            {section === "health" && (
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <LifeCoachConfidenceBadge confidence={data?.confidence?.health} />
                </div>
                <ConfidenceExplanation chart={chart} report={report} category="Health" />
                <LifeCoachCategoryCard
                  icon="🧘" title="Health & Wellness" color="#7effb2" defaultOpen
                  fields={[
                    { label: "Energy Trends", value: guidance.health?.energyTrends },
                    { label: "Stress Awareness", value: guidance.health?.stressAwareness },
                    { label: "Meditation Suggestions", value: guidance.health?.meditationSuggestions },
                    { label: "Yoga Recommendations", value: guidance.health?.yogaRecommendations },
                    { label: "Spiritual Practices", value: guidance.health?.spiritualPractices },
                    { label: "Lifestyle Suggestions", value: guidance.health?.lifestyleSuggestions },
                  ]}
                />
                <LifeCoachWhyNote text={guidance.explainWhy?.health} />
              </div>
            )}

            {/* Personal Growth */}
            {section === "growth" && (
              <div style={{ display: "grid", gap: 16 }}>
                <LifeCoachListCard icon="🎯" title="Daily Goals" color="#9dc9ff" items={guidance.personalGrowth?.dailyGoals} />
                <LifeCoachListCard icon="📅" title="Weekly Goals" color="#bf7fff" items={guidance.personalGrowth?.weeklyGoals} />
                {guidance.personalGrowth?.monthlyFocus && (
                  <GlassCard style={{ padding: "18px 20px" }}>
                    <p style={{ margin: "0 0 6px", fontSize: 13, fontFamily: "Cinzel,serif", color: "#ffd700" }}>🌕 Monthly Focus</p>
                    <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "var(--nv-text-primary, #e8d5ff)" }}>{guidance.personalGrowth.monthlyFocus}</p>
                  </GlassCard>
                )}
                <LifeCoachListCard icon="🌱" title="Habit Suggestions" color="#7effb2" items={guidance.personalGrowth?.habitSuggestions} />
                <LifeCoachListCard icon="📚" title="Learning Recommendations" color="#ff8fa3" items={guidance.personalGrowth?.learningRecommendations} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AILifeCoachPage;
