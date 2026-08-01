import { useEffect, useState } from "react";
<<<<<<< HEAD
=======
import { useTranslation } from "react-i18next";
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
import CosmicBg from "../components/common/CosmicBg.jsx";
import GlassCard from "../components/common/GlassCard.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import Badge from "../components/common/Badge.jsx";
import { SkeletonBlock } from "../components/common/Skeleton.jsx";
<<<<<<< HEAD
=======
import { useLanguage } from "../context/LanguageContext.jsx";
import { formatDateTime as formatDateTimeIntl } from "../utils/localeFormat.js";
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
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
<<<<<<< HEAD
  { id: "daily", label: "Daily", icon: "🌅" },
  { id: "weekly", label: "Weekly", icon: "📅" },
  { id: "monthly", label: "Monthly", icon: "🌕" },
  { id: "career", label: "Career", icon: "💼" },
  { id: "relationship", label: "Relationship", icon: "💞" },
  { id: "finance", label: "Finance", icon: "💰" },
  { id: "health", label: "Health", icon: "🧘" },
  { id: "growth", label: "Growth", icon: "🌱" },
=======
  {id: "daily", icon: "🌅" },
  { id: "weekly", icon: "📅" },
  { id: "monthly", icon: "🌕" },
  { id: "career", icon: "💼" },
  { id: "relationship", icon: "💞" },
  { id: "finance", icon: "💰" },
  { id: "health", icon: "🧘" },
  { id: "growth", icon: "🌱" },
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
];

// Formats the backend `generatedAt` ISO timestamp (V4.3 Enhancement Pass)
// into a short, local "Last Updated" time string. Falls back gracefully
// if the field is absent (e.g. an older cached shape).
<<<<<<< HEAD
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
=======
function formatLastUpdated(iso, lang) {
  if (!iso) return null;
  const result = formatDateTimeIntl(iso, lang, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
  return result === "—" ? null : result;
}

function AILifeCoachPage({ userData, chart, report, onBack }) {
  const { t } = useTranslation(["lifeCoach"]);
  const { language } = useLanguage();
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
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
<<<<<<< HEAD
      .catch((err) => { if (!cancelled) setError(err.message || "Could not load your AI Life Coach guidance."); })
=======
      .catch((err) => { if (!cancelled) setError(err.message || t("lifeCoach:page.loadFailed")); })
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
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
<<<<<<< HEAD
      .catch((err) => setError(err.message || "Could not refresh your AI Life Coach guidance."))
=======
      .catch((err) => setError(err.message || t("lifeCoach:page.refreshFailed")))
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
      .finally(() => setRefreshing(false));
  }

  if (!chart) {
    return (
      <div style={{ minHeight: "100vh", position: "relative", fontFamily: "Inter,sans-serif" }}>
        <CosmicBg />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto", padding: "84px 16px 60px" }}>
          <EmptyState
            icon="🧭"
<<<<<<< HEAD
            title="No reading available yet"
            message="Generate or open a report first to see your personalized AI Life Coach."
            actionLabel="← Back"
=======
            title={t("lifeCoach:page.noReadingTitle")}
            message={t("lifeCoach:page.noReadingMessage")}
            actionLabel={t("lifeCoach:page.backAction")}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
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
<<<<<<< HEAD
            ← Back
          </button>
          <div>
            <h1 style={{ margin: 0, fontFamily: "Cinzel,serif", fontSize: 21, color: "var(--nv-text-primary, #f1e4ff)" }}>🧭 AI Life Coach</h1>
            {userData?.name && (
              <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>{userData.name}'s daily companion</p>
=======
            {t("lifeCoach:page.back")}
          </button>
          <div>
            <h1 style={{ margin: 0, fontFamily: "Cinzel,serif", fontSize: 21, color: "var(--nv-text-primary, #f1e4ff)" }}>{t("lifeCoach:page.title")}</h1>
            {userData?.name && (
              <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>{t("lifeCoach:page.dailyCompanion", { name: userData.name })}</p>
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
            )}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {data?.date && <Badge color="#9dc9ff">{data.date}</Badge>}
<<<<<<< HEAD
            {formatLastUpdated(data?.generatedAt) && (
              <span style={{ fontSize: 11, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>
                Updated {formatLastUpdated(data.generatedAt)}
=======
            {formatLastUpdated(data?.generatedAt, language) && (
              <span style={{ fontSize: 11, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>
                {t("lifeCoach:page.updated", { time: formatLastUpdated(data.generatedAt, language) })}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
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
<<<<<<< HEAD
                {refreshing ? "Refreshing…" : "↻ Refresh Guidance"}
=======
                {refreshing ? t("lifeCoach:page.refreshing") : t("lifeCoach:page.refreshGuidance")}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
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
<<<<<<< HEAD
              Try Again
=======
              {t("lifeCoach:page.tryAgain")}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
            </button>
          </GlassCard>
        )}

        {loading && !guidance && (
<<<<<<< HEAD
          <div style={{ display: "grid", gap: 16 }} role="status" aria-label="Loading your AI Life Coach guidance">
=======
          <div style={{ display: "grid", gap: 16 }} role="status" aria-label={t("lifeCoach:page.loadingAriaLabel")}>
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
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
<<<<<<< HEAD
                    {s.icon} {s.label}
=======
                    {s.icon} {t(`lifeCoach:sections.${s.id}`)}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
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
<<<<<<< HEAD
                <LifeCoachListCard icon="🌟" title="Opportunities" color="#7effb2" items={guidance.opportunities} />
                <LifeCoachListCard icon="⚠️" title="Challenges" color="#ffb454" items={guidance.challenges} />
                <LifeCoachListCard icon="✅" title="Recommended Actions" color="#9dc9ff" items={guidance.recommendedActions} />
                <LifeCoachListCard icon="🚫" title="Things to Avoid" color="#ff8fa3" items={guidance.thingsToAvoid} />
                {guidance.spiritualGuidance && (
                  <GlassCard style={{ padding: "18px 20px" }}>
                    <p style={{ margin: "0 0 6px", fontSize: 13, fontFamily: "Cinzel,serif", color: "#bf7fff" }}>🕉️ Spiritual Guidance</p>
=======
                <LifeCoachListCard icon="🌟" title={t("lifeCoach:daily.opportunities")} color="#7effb2" items={guidance.opportunities} />
                <LifeCoachListCard icon="⚠️" title={t("lifeCoach:daily.challenges")} color="#ffb454" items={guidance.challenges} />
                <LifeCoachListCard icon="✅" title={t("lifeCoach:daily.recommendedActions")} color="#9dc9ff" items={guidance.recommendedActions} />
                <LifeCoachListCard icon="🚫" title={t("lifeCoach:daily.thingsToAvoid")} color="#ff8fa3" items={guidance.thingsToAvoid} />
                {guidance.spiritualGuidance && (
                  <GlassCard style={{ padding: "18px 20px" }}>
                    <p style={{ margin: "0 0 6px", fontSize: 13, fontFamily: "Cinzel,serif", color: "#bf7fff" }}>{t("lifeCoach:daily.spiritualGuidance")}</p>
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
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
<<<<<<< HEAD
                  icon="📅" title="This Week's Theme" energyScoreLabel="Weekly Energy"
=======
                  icon="📅" title={t("lifeCoach:outlook.weeklyThemeTitle")} energyScoreLabel={t("lifeCoach:outlook.weeklyEnergyLabel")}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
                  energyScore={guidance.weeklyOutlook.weeklyEnergyScore}
                  theme={guidance.weeklyOutlook.weeklyTheme}
                  opportunities={guidance.weeklyOutlook.weeklyOpportunities}
                  challenges={guidance.weeklyOutlook.weeklyChallenges}
                  bestDay={guidance.weeklyOutlook.bestDay}
                  cautionDay={guidance.weeklyOutlook.cautionDay}
<<<<<<< HEAD
                  focusFields={[{ label: "Weekly Focus", value: guidance.weeklyOutlook.weeklyFocus }]}
                />
              ) : (
                <EmptyState icon="📅" title="Weekly Outlook unavailable" message="We couldn't compute this week's outlook right now — try refreshing." compact />
=======
                  focusFields={[{ label: t("lifeCoach:outlook.weeklyFocus"), value: guidance.weeklyOutlook.weeklyFocus }]}
                />
              ) : (
                <EmptyState icon="📅" title={t("lifeCoach:outlook.weeklyUnavailableTitle")} message={t("lifeCoach:outlook.weeklyUnavailableMessage")} compact />
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
              )
            )}

            {/* Monthly Outlook */}
            {section === "monthly" && (
              guidance.monthlyOutlook ? (
                <LifeCoachOutlookCard
<<<<<<< HEAD
                  icon="🌕" title="This Month's Theme" energyScoreLabel="Monthly Energy"
=======
                  icon="🌕" title={t("lifeCoach:outlook.monthlyThemeTitle")} energyScoreLabel={t("lifeCoach:outlook.monthlyEnergyLabel")}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
                  energyScore={guidance.monthlyOutlook.monthlyEnergyScore}
                  theme={guidance.monthlyOutlook.monthlyTheme}
                  opportunities={guidance.monthlyOutlook.majorOpportunities}
                  challenges={guidance.monthlyOutlook.majorChallenges}
                  focusFields={[
<<<<<<< HEAD
                    { label: "Personal Growth Goal", value: guidance.monthlyOutlook.personalGrowthGoal },
                    { label: "Career Focus", value: guidance.monthlyOutlook.careerFocus },
                    { label: "Relationship Focus", value: guidance.monthlyOutlook.relationshipFocus },
                  ]}
                />
              ) : (
                <EmptyState icon="🌕" title="Monthly Outlook unavailable" message="We couldn't compute this month's outlook right now — try refreshing." compact />
=======
                    { label: t("lifeCoach:outlook.personalGrowthGoal"), value: guidance.monthlyOutlook.personalGrowthGoal },
                    { label: t("lifeCoach:outlook.careerFocus"), value: guidance.monthlyOutlook.careerFocus },
                    { label: t("lifeCoach:outlook.relationshipFocus"), value: guidance.monthlyOutlook.relationshipFocus },
                  ]}
                />
              ) : (
                <EmptyState icon="🌕" title={t("lifeCoach:outlook.monthlyUnavailableTitle")} message={t("lifeCoach:outlook.monthlyUnavailableMessage")} compact />
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
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
<<<<<<< HEAD
                  icon="💼" title="Career Coach" color="#9dc9ff" defaultOpen
                  fields={[
                    { label: "Career Progress", value: guidance.career?.progress },
                    { label: "Skill Development Advice", value: guidance.career?.skillDevelopmentAdvice },
                    { label: "Promotion Guidance", value: guidance.career?.promotionGuidance },
                    { label: "Business Suggestions", value: guidance.career?.businessSuggestions },
                    { label: "Best Time for Important Decisions", value: guidance.career?.bestTimeForDecisions },
=======
                  icon="💼" title={t("lifeCoach:career.cardTitle")} color="#9dc9ff" defaultOpen
                  fields={[
                    { label: t("lifeCoach:career.progress"), value: guidance.career?.progress },
                    { label: t("lifeCoach:career.skillDevelopmentAdvice"), value: guidance.career?.skillDevelopmentAdvice },
                    { label: t("lifeCoach:career.promotionGuidance"), value: guidance.career?.promotionGuidance },
                    { label: t("lifeCoach:career.businessSuggestions"), value: guidance.career?.businessSuggestions },
                    { label: t("lifeCoach:career.bestTimeForDecisions"), value: guidance.career?.bestTimeForDecisions },
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
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
<<<<<<< HEAD
                  icon="💞" title="Relationship Coach" color="#ff8fa3" defaultOpen
                  fields={[
                    { label: "Relationship Guidance", value: guidance.relationship?.guidance },
                    { label: "Marriage Advice", value: guidance.relationship?.marriageAdvice },
                    { label: "Family Harmony Tips", value: guidance.relationship?.familyHarmonyTips },
                    { label: "Communication Suggestions", value: guidance.relationship?.communicationSuggestions },
                    { label: "Emotional Wellbeing", value: guidance.relationship?.emotionalWellbeing },
=======
                  icon="💞" title={t("lifeCoach:relationship.cardTitle")} color="#ff8fa3" defaultOpen
                  fields={[
                    { label: t("lifeCoach:relationship.guidance"), value: guidance.relationship?.guidance },
                    { label: t("lifeCoach:relationship.marriageAdvice"), value: guidance.relationship?.marriageAdvice },
                    { label: t("lifeCoach:relationship.familyHarmonyTips"), value: guidance.relationship?.familyHarmonyTips },
                    { label: t("lifeCoach:relationship.communicationSuggestions"), value: guidance.relationship?.communicationSuggestions },
                    { label: t("lifeCoach:relationship.emotionalWellbeing"), value: guidance.relationship?.emotionalWellbeing },
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
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
<<<<<<< HEAD
                  icon="💰" title="Finance Coach" color="#ffd700" defaultOpen
                  fields={[
                    { label: "Financial Outlook", value: guidance.finance?.outlook },
                    { label: "Spending Suggestions", value: guidance.finance?.spendingSuggestions },
                    { label: "Saving Advice", value: guidance.finance?.savingAdvice },
                    { label: "Investment Awareness", value: guidance.finance?.investmentAwareness },
                    { label: "Business Opportunities", value: guidance.finance?.businessOpportunities },
=======
                  icon="💰" title={t("lifeCoach:finance.cardTitle")} color="#ffd700" defaultOpen
                  fields={[
                    { label: t("lifeCoach:finance.outlook"), value: guidance.finance?.outlook },
                    { label: t("lifeCoach:finance.spendingSuggestions"), value: guidance.finance?.spendingSuggestions },
                    { label: t("lifeCoach:finance.savingAdvice"), value: guidance.finance?.savingAdvice },
                    { label: t("lifeCoach:finance.investmentAwareness"), value: guidance.finance?.investmentAwareness },
                    { label: t("lifeCoach:finance.businessOpportunities"), value: guidance.finance?.businessOpportunities },
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
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
<<<<<<< HEAD
                  icon="🧘" title="Health & Wellness" color="#7effb2" defaultOpen
                  fields={[
                    { label: "Energy Trends", value: guidance.health?.energyTrends },
                    { label: "Stress Awareness", value: guidance.health?.stressAwareness },
                    { label: "Meditation Suggestions", value: guidance.health?.meditationSuggestions },
                    { label: "Yoga Recommendations", value: guidance.health?.yogaRecommendations },
                    { label: "Spiritual Practices", value: guidance.health?.spiritualPractices },
                    { label: "Lifestyle Suggestions", value: guidance.health?.lifestyleSuggestions },
=======
                  icon="🧘" title={t("lifeCoach:health.cardTitle")} color="#7effb2" defaultOpen
                  fields={[
                    { label: t("lifeCoach:health.energyTrends"), value: guidance.health?.energyTrends },
                    { label: t("lifeCoach:health.stressAwareness"), value: guidance.health?.stressAwareness },
                    { label: t("lifeCoach:health.meditationSuggestions"), value: guidance.health?.meditationSuggestions },
                    { label: t("lifeCoach:health.yogaRecommendations"), value: guidance.health?.yogaRecommendations },
                    { label: t("lifeCoach:health.spiritualPractices"), value: guidance.health?.spiritualPractices },
                    { label: t("lifeCoach:health.lifestyleSuggestions"), value: guidance.health?.lifestyleSuggestions },
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
                  ]}
                />
                <LifeCoachWhyNote text={guidance.explainWhy?.health} />
              </div>
            )}

            {/* Personal Growth */}
            {section === "growth" && (
              <div style={{ display: "grid", gap: 16 }}>
<<<<<<< HEAD
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
=======
                <LifeCoachListCard icon="🎯" title={t("lifeCoach:growth.dailyGoals")} color="#9dc9ff" items={guidance.personalGrowth?.dailyGoals} />
                <LifeCoachListCard icon="📅" title={t("lifeCoach:growth.weeklyGoals")} color="#bf7fff" items={guidance.personalGrowth?.weeklyGoals} />
                {guidance.personalGrowth?.monthlyFocus && (
                  <GlassCard style={{ padding: "18px 20px" }}>
                    <p style={{ margin: "0 0 6px", fontSize: 13, fontFamily: "Cinzel,serif", color: "#ffd700" }}>{t("lifeCoach:growth.monthlyFocus")}</p>
                    <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "var(--nv-text-primary, #e8d5ff)" }}>{guidance.personalGrowth.monthlyFocus}</p>
                  </GlassCard>
                )}
                <LifeCoachListCard icon="🌱" title={t("lifeCoach:growth.habitSuggestions")} color="#7effb2" items={guidance.personalGrowth?.habitSuggestions} />
                <LifeCoachListCard icon="📚" title={t("lifeCoach:growth.learningRecommendations")} color="#ff8fa3" items={guidance.personalGrowth?.learningRecommendations} />
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AILifeCoachPage;
