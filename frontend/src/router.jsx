// ─────────────────────────────────────────────────────────────────────────
// App Router (BUG-10 refactor)
// Previously lived inline in App.jsx (~850 lines). Extracted here to keep
// App.jsx readable and to allow routing/stage logic to evolve independently
// of provider wiring (providers.jsx) and entry point (main.jsx).
//
// All lazy imports, stage constants, and the AppContent controller
// component live here. Providers are in src/providers.jsx.
// ─────────────────────────────────────────────────────────────────────────
import { useTranslation } from "react-i18next";
import { useState, useCallback, useEffect, lazy, Suspense } from "react";

// ── Static imports (on the critical first-paint path) ────────────────────
import LandingPage      from "./pages/LandingPage.jsx";
import LoadingPage      from "./pages/LoadingPage.jsx";
// LoginPage is static: unauthenticated visitors see it immediately.
// See the Priority 5.4 comment in the original App.jsx for full rationale.
import LoginPage        from "./pages/LoginPage.jsx";
// ForgotPasswordPage is static: reached with one click from LoginPage
// (itself on the critical path), so lazy-loading it can lose the race
// against test timeouts. See Priority 6.2.1 comment in original App.jsx.
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import SplashScreen     from "./components/common/SplashScreen.jsx";
import HomePage         from "./pages/HomePage.jsx";
import AccountMenu      from "./components/common/AccountMenu.jsx";
import ActionDock       from "./components/common/ActionDock.jsx";
import CommandPalette   from "./components/common/CommandPalette.jsx";
import PageTransition   from "./components/common/PageTransition.jsx";

import { calcNumerology, calcPlanetaryPositions, getLagna } from "./utils/astroCalculations.js";
import { generateAstroReport } from "./utils/api.js";
import { useAuth }             from "./context/AuthContext.jsx";
import { useToast }            from "./components/common/Toast.jsx";
import { readPreferences, writePreferences } from "./utils/settingsStorage.js";

// ── Lazy imports (off the first-paint path) ──────────────────────────────
// Each page chunk downloads in parallel with the loading screen animation,
// so by the time a stage transition is needed the chunk is usually ready.
const ResultsPage             = lazy(() => import("./pages/ResultsPage.jsx"));
const SignupPage               = lazy(() => import("./pages/SignupPage.jsx"));
const DashboardPage            = lazy(() => import("./pages/DashboardPage.jsx"));
const SavedReportPage          = lazy(() => import("./pages/SavedReportPage.jsx"));
const SavedReportsPage         = lazy(() => import("./pages/SavedReportsPage.jsx"));
const SettingsPage             = lazy(() => import("./pages/SettingsPage.jsx"));
const ProfilePage              = lazy(() => import("./pages/ProfilePage.jsx"));
const AIAssistantPage          = lazy(() => import("./pages/AIAssistantPage.jsx"));
const HoroscopePage            = lazy(() => import("./pages/HoroscopePage.jsx"));
const CalendarPage             = lazy(() => import("./pages/CalendarPage.jsx"));
const MatchingPage             = lazy(() => import("./pages/MatchingPage.jsx"));
const PanchangPage             = lazy(() => import("./pages/PanchangPage.jsx"));
const FamilyProfilesPage       = lazy(() => import("./pages/FamilyProfilesPage.jsx"));
const RelationshipHubPage      = lazy(() => import("./pages/RelationshipHubPage.jsx"));
const AILifeCoachPage          = lazy(() => import("./pages/AILifeCoachPage.jsx"));
const NotificationCenterPage   = lazy(() => import("./pages/NotificationCenterPage.jsx"));
const FestivalPage             = lazy(() => import("./pages/FestivalPage.jsx"));
const FestivalIntelligencePage = lazy(() => import("./pages/FestivalIntelligencePage.jsx"));

// ── Session constants ────────────────────────────────────────────────────
const SPLASH_SEEN_KEY              = "nv_splash_seen";
const COMMAND_PALETTE_HINT_SEEN_KEY = "nv_cmdk_hint_seen";

// Suspense fallback reused across all lazy stages
const SuspenseFallback = <LoadingPage userData={null} onComplete={() => {}} ready={false} />;

// ─────────────────────────────────────────────────────────────────────────
// AppContent — stage machine + all page renders
// ─────────────────────────────────────────────────────────────────────────
export function AppContent() {
  const { t } = useTranslation(); // eslint-disable-line no-unused-vars

  const [stage, setStage] = useState(() => {
    try {
      if (sessionStorage.getItem(SPLASH_SEEN_KEY)) return "home";
      return readPreferences().showWelcomeAnimation === false ? "home" : "splash";
    } catch {
      return "splash";
    }
  });

  const [userData, setUserData]                               = useState(null);
  const [report, setReport]                                   = useState(null);
  const [planetary, setPlanetary]                             = useState(null);
  const [numerology, setNumerology]                           = useState(null);
  const [relationshipHubPresetId, setRelationshipHubPresetId] = useState(null);
  const [error, setError]                                     = useState(null);
  const [aiReady, setAiReady]                                 = useState(false);
  const [viewingReportId, setViewingReportId]                 = useState(null);
  const [assistantContext, setAssistantContext]               = useState(null);
  const [horoscopeContext, setHoroscopeContext]               = useState(null);
  const [calendarContext, setCalendarContext]                 = useState(null);
  const [lifeCoachContext, setLifeCoachContext]               = useState(null);
  const [festivalContext, setFestivalContext]                 = useState(null);
  const [festivalIntelligenceContext, setFestivalIntelligenceContext] = useState(null);
  const [postLoginTarget, setPostLoginTarget]                 = useState("dashboard");
  const [settingsInitialSection, setSettingsInitialSection]   = useState(null);

  const { loading: authLoading, isAuthenticated, logout } = useAuth();
  const toast = useToast();

  // Command palette shortcut hint — fires once per session on first dashboard visit
  useEffect(() => {
    if (stage !== "dashboard" || !isAuthenticated) return;
    try {
      if (sessionStorage.getItem(COMMAND_PALETTE_HINT_SEEN_KEY)) return;
      if (!readPreferences().commandPaletteHint) return;
      sessionStorage.setItem(COMMAND_PALETTE_HINT_SEEN_KEY, "1");
      toast.info("💡 Tip: Press ⌘K (or Ctrl+K) to open the Command Palette.");
    } catch { /* Storage unavailable — non-fatal */ }
  }, [stage, isAuthenticated, toast]);

  // Logout: wipes ephemeral chart/report state in addition to ending session
  const handleLogout = useCallback(async () => {
    await logout();
    setUserData(null); setReport(null); setPlanetary(null);
    setNumerology(null); setError(null); setAiReady(false);
    setViewingReportId(null);
  }, [logout]);

  // Protected-route enforcement: bounce unauthenticated visitors to login
  useEffect(() => {
    if (authLoading) return;
    if (stage === null) { setStage(isAuthenticated ? "landing" : "login"); return; }
    const protectedStages = ["dashboard", "saved-report", "settings", "profile", "reports", "notifications"];
    if (!isAuthenticated && protectedStages.includes(stage)) setStage("login");
  }, [authLoading, isAuthenticated, stage]);

  const handleFormSubmit = useCallback((form) => {
    const num     = calcNumerology(form.name, form.dob);
    const planets = calcPlanetaryPositions(form.dob, form.tob);
    const lagna   = getLagna(form.dob, form.tob);
    const enriched = { ...form, lagna };
    setNumerology(num); setPlanetary(planets); setUserData(enriched);
    setStage("loading"); setError(null); setAiReady(false);
    generateAstroReport(enriched, planets, num)
      .then(r => {
        setReport(r);
        if (r?.chart) {
          setNumerology(r.chart.numerology);
          setPlanetary(r.chart.planetary);
          setUserData(prev => ({ ...prev, lagna: r.chart.lagna }));
        }
      })
      .catch(err => {
        console.error("NakshatraVerse: AI report generation failed:", err);
        setError(`AI report unavailable — ${err?.message || "Unknown error."}`);
      })
      .finally(() => setAiReady(true));
  }, []);

  const handleLoadingComplete = useCallback(() => setStage("results"), []);

  const handleSplashComplete = useCallback(() => {
    try { sessionStorage.setItem(SPLASH_SEEN_KEY, "1"); } catch { /* non-fatal */ }
    setStage("home");
  }, []);

  const handleNavigate = useCallback((nextStage) => {
    setError(null);
    if (nextStage === "post-auth") {
      setStage(postLoginTarget);
      setPostLoginTarget("dashboard");
      return;
    }
    setStage(nextStage);
  }, [postLoginTarget]);

  const handleRequireLogin = useCallback(() => {
    setPostLoginTarget("results"); setError(null); setStage("login");
  }, []);

  const handleViewReport = useCallback((reportId) => {
    setViewingReportId(reportId);
    setStage("saved-report");
    try {
      if (readPreferences().rememberLastReport) writePreferences({ lastOpenedReportId: reportId });
    } catch { /* Storage unavailable */ }
  }, []);

  const handleOpenAssistant = useCallback((ctx) => { setAssistantContext(ctx); setStage("assistant"); }, []);
  const handleOpenHoroscope = useCallback((ctx) => { setHoroscopeContext(ctx); setStage("horoscope"); }, []);
  const handleOpenCalendar  = useCallback((ctx) => { setCalendarContext(ctx);  setStage("calendar");  }, []);
  const handleOpenLifeCoach = useCallback((ctx) => { setLifeCoachContext(ctx); setStage("ai-life-coach"); }, []);

  const activeReportContext = (stage === "results" && report?.chart && userData && !error)
    ? { userData, chart: report.chart, report, returnStage: "results" }
    : null;

  const paletteOpenAssistant = () =>
    activeReportContext ? handleOpenAssistant(activeReportContext) : handleNavigate("assistant");
  const paletteOpenHoroscope = () =>
    activeReportContext ? handleOpenHoroscope(activeReportContext) : handleNavigate("horoscope");
  const paletteOpenCalendar = () =>
    activeReportContext ? handleOpenCalendar(activeReportContext) : handleNavigate("calendar");
  const paletteOpenLifeCoach = () =>
    activeReportContext ? handleOpenLifeCoach(activeReportContext) : handleNavigate("ai-life-coach");

  const paletteOpenSettingsSection = useCallback((sectionKey) => {
    setSettingsInitialSection(sectionKey);
    handleNavigate("settings");
  }, [handleNavigate]);

  const showAccountMenu = !authLoading && [
    "landing", "results", "dashboard", "settings", "profile",
    "reports", "horoscope", "calendar", "ai-life-coach", "notifications",
  ].includes(stage);
  const showActionDock = stage === "results" && report?.chart && userData && !error;

  // ── Stage → content ────────────────────────────────────────────────────
  let content = null;

  if (stage === "splash") {
    content = <SplashScreen onComplete={handleSplashComplete} />;
  } else if (stage === "home") {
    content = <HomePage onNavigate={handleNavigate} onLogout={handleLogout} />;
  } else if (stage === null) {
    content = SuspenseFallback;
  } else if (stage === "landing") {
    content = <LandingPage onSubmit={handleFormSubmit} />;
  } else if (stage === "loading") {
    content = <LoadingPage userData={userData} onComplete={handleLoadingComplete} ready={aiReady} />;
  } else if (stage === "results") {
    content = (
      <>
        {error && (
          <div role="alert" style={{
            position: "fixed", top: 70, right: 16, left: 16, zIndex: 1001, padding: "12px 18px",
            background: "rgba(120,20,20,0.85)", border: "1px solid rgba(255,80,80,0.35)",
            borderRadius: 10, color: "var(--nv-danger, #ffaaaa)", fontSize: 13,
            fontFamily: "Inter,sans-serif", backdropFilter: "blur(var(--nv-glass-blur-sm, 14px))",
            width: "min(340px, 100%)", marginLeft: "auto", lineHeight: 1.4,
          }}>
            ⚠️ {error}
          </div>
        )}
        <Suspense fallback={SuspenseFallback}>
          <ResultsPage userData={userData} report={report} planetary={planetary} numerology={numerology} error={error} />
        </Suspense>
      </>
    );
  } else if (stage === "login") {
    content = <LoginPage onNavigate={handleNavigate} />;
  } else if (stage === "signup") {
    content = <Suspense fallback={SuspenseFallback}><SignupPage onNavigate={handleNavigate} /></Suspense>;
  } else if (stage === "forgot-password") {
    content = <ForgotPasswordPage onNavigate={handleNavigate} />;
  } else if (stage === "dashboard") {
    content = (
      <Suspense fallback={SuspenseFallback}>
        <DashboardPage
          onNavigate={handleNavigate}
          onViewReport={handleViewReport}
          onOpenLifeCoach={(ctx) => handleOpenLifeCoach({ ...ctx, returnStage: "dashboard" })}
          onOpenFestivalIntelligence={(festival, reportCtx) => {
            setFestivalIntelligenceContext({
              festivalKey: festival.key, date: festival.date,
              year: Number(festival.date.slice(0, 4)),
              chart: reportCtx?.chart, report: reportCtx?.report, returnStage: "dashboard",
            });
            setStage("festival-intelligence");
          }}
        />
      </Suspense>
    );
  } else if (stage === "reports") {
    content = (
      <Suspense fallback={SuspenseFallback}>
        <SavedReportsPage onNavigate={handleNavigate} onViewReport={handleViewReport} />
      </Suspense>
    );
  } else if (stage === "profile") {
    content = <Suspense fallback={SuspenseFallback}><ProfilePage onNavigate={handleNavigate} /></Suspense>;
  } else if (stage === "saved-report") {
    content = (
      <Suspense fallback={SuspenseFallback}>
        <SavedReportPage
          reportId={viewingReportId}
          onBack={() => handleNavigate("reports")}
          onOpenAssistant={(ctx) => handleOpenAssistant({ ...ctx, returnStage: "saved-report" })}
          onOpenHoroscope={(ctx) => handleOpenHoroscope({ ...ctx, returnStage: "saved-report" })}
          onOpenCalendar={(ctx) => handleOpenCalendar({ ...ctx, returnStage: "saved-report" })}
          onOpenLifeCoach={(ctx) => handleOpenLifeCoach({ ...ctx, returnStage: "saved-report" })}
        />
      </Suspense>
    );
  } else if (stage === "assistant") {
    content = (
      <Suspense fallback={SuspenseFallback}>
        <AIAssistantPage
          userData={assistantContext?.userData}
          chart={assistantContext?.chart}
          report={assistantContext?.report}
          initialQuestion={assistantContext?.initialQuestion}
          onBack={() => setStage(assistantContext?.returnStage || (isAuthenticated ? "dashboard" : "landing"))}
          onNavigate={handleNavigate}
        />
      </Suspense>
    );
  } else if (stage === "horoscope") {
    content = (
      <Suspense fallback={SuspenseFallback}>
        <HoroscopePage
          userData={horoscopeContext?.userData}
          chart={horoscopeContext?.chart}
          report={horoscopeContext?.report}
          onBack={() => setStage(horoscopeContext?.returnStage || "results")}
          onOpenAssistant={(question) => handleOpenAssistant({
            userData: horoscopeContext?.userData, chart: horoscopeContext?.chart,
            report: horoscopeContext?.report, returnStage: "horoscope", initialQuestion: question,
          })}
        />
      </Suspense>
    );
  } else if (stage === "calendar") {
    content = (
      <Suspense fallback={SuspenseFallback}>
        <CalendarPage
          userData={calendarContext?.userData}
          chart={calendarContext?.chart}
          report={calendarContext?.report}
          onBack={() => setStage(calendarContext?.returnStage || "results")}
          onOpenAssistant={(question) => handleOpenAssistant({
            userData: calendarContext?.userData, chart: calendarContext?.chart,
            report: calendarContext?.report, returnStage: "calendar", initialQuestion: question,
          })}
          onOpenPanchang={() => setStage("panchang")}
          onOpenFestivals={() => setStage("festivals")}
          onOpenFestivalIntelligence={({ chart, report } = {}) => {
            setFestivalIntelligenceContext({ chart, report, returnStage: "calendar" });
            setStage("festival-intelligence");
          }}
        />
      </Suspense>
    );
  } else if (stage === "ai-life-coach") {
    content = (
      <Suspense fallback={SuspenseFallback}>
        <AILifeCoachPage
          userData={lifeCoachContext?.userData}
          chart={lifeCoachContext?.chart}
          report={lifeCoachContext?.report}
          onBack={() => setStage(lifeCoachContext?.returnStage || (isAuthenticated ? "dashboard" : "landing"))}
        />
      </Suspense>
    );
  } else if (stage === "notifications") {
    content = (
      <Suspense fallback={SuspenseFallback}>
        <NotificationCenterPage
          onBack={() => setStage(isAuthenticated ? "dashboard" : "landing")}
          onNavigate={(destination, metadata) => {
            if (!destination) return;
            if (metadata?.festivalKey) {
              const dateMatch = /^festival:[^:]+:(\d{4}-\d{2}-\d{2}):/.exec(metadata.dedupeKey || "");
              setFestivalContext({ festivalKey: metadata.festivalKey, date: dateMatch?.[1] });
              setStage("festivals");
              return;
            }
            setStage(destination);
          }}
        />
      </Suspense>
    );
  } else if (stage === "settings") {
    content = (
      <Suspense fallback={SuspenseFallback}>
        <SettingsPage onNavigate={handleNavigate} initialSection={settingsInitialSection} />
      </Suspense>
    );
  } else if (stage === "matching") {
    content = (
      <Suspense fallback={SuspenseFallback}>
        <MatchingPage onBack={() => setStage(isAuthenticated ? "dashboard" : "landing")} />
      </Suspense>
    );
  } else if (stage === "panchang") {
    content = (
      <Suspense fallback={SuspenseFallback}>
        <PanchangPage onBack={() => setStage(isAuthenticated ? "dashboard" : "landing")} />
      </Suspense>
    );
  } else if (stage === "festivals") {
    content = (
      <Suspense fallback={SuspenseFallback}>
        <FestivalPage
          onBack={() => { setFestivalContext(null); setStage(isAuthenticated ? "dashboard" : "landing"); }}
          initialFestivalKey={festivalContext?.festivalKey}
          initialDate={festivalContext?.date}
        />
      </Suspense>
    );
  } else if (stage === "festival-intelligence") {
    content = (
      <Suspense fallback={SuspenseFallback}>
        <FestivalIntelligencePage
          onBack={() => {
            setStage(festivalIntelligenceContext?.returnStage || (isAuthenticated ? "dashboard" : "landing"));
            setFestivalIntelligenceContext(null);
          }}
          festivalKey={festivalIntelligenceContext?.festivalKey}
          date={festivalIntelligenceContext?.date}
          year={festivalIntelligenceContext?.year}
          chart={festivalIntelligenceContext?.chart}
          report={festivalIntelligenceContext?.report}
          isAuthenticated={isAuthenticated}
          onOpenFamilyProfiles={() => setStage("family-profiles")}
          onOpenReading={() => setStage(isAuthenticated ? "dashboard" : "landing")}
        />
      </Suspense>
    );
  } else if (stage === "family-profiles") {
    content = (
      <Suspense fallback={SuspenseFallback}>
        <FamilyProfilesPage
          onNavigate={handleNavigate}
          onGenerateReport={handleFormSubmit}
          onOpenRelationshipHub={(presetProfileId) => {
            setRelationshipHubPresetId(presetProfileId || null);
            setStage("relationship-hub");
          }}
        />
      </Suspense>
    );
  } else if (stage === "relationship-hub") {
    content = (
      <Suspense fallback={SuspenseFallback}>
        <RelationshipHubPage
          onBack={() => setStage(isAuthenticated ? "family-profiles" : "landing")}
          initialProfileIdA={relationshipHubPresetId}
        />
      </Suspense>
    );
  }

  return (
    <>
      <PageTransition stageKey={stage}>{content}</PageTransition>
      <CommandPalette
        onNavigate={handleNavigate}
        onViewReport={handleViewReport}
        onOpenAssistant={paletteOpenAssistant}
        onOpenHoroscope={paletteOpenHoroscope}
        onOpenCalendar={paletteOpenCalendar}
        onOpenLifeCoach={paletteOpenLifeCoach}
        onOpenSettingsSection={paletteOpenSettingsSection}
      />
      {showAccountMenu && <AccountMenu onNavigate={handleNavigate} onLogout={handleLogout} />}
      {showActionDock && (
        <ActionDock
          userData={userData}
          chart={report.chart}
          report={report}
          onRequireLogin={handleRequireLogin}
          onOpenAssistant={() => handleOpenAssistant({ userData, chart: report.chart, report, returnStage: "results" })}
          onOpenHoroscope={() => handleOpenHoroscope({ userData, chart: report.chart, report, returnStage: "results" })}
          onOpenCalendar={() => handleOpenCalendar({ userData, chart: report.chart, report, returnStage: "results" })}
          onOpenLifeCoach={() => handleOpenLifeCoach({ userData, chart: report.chart, report, returnStage: "results" })}
          onOpenMatching={() => setStage("matching")}
          onOpenPanchang={() => setStage("panchang")}
          onOpenFestivals={() => setStage("festivals")}
          onOpenNotifications={() => setStage("notifications")}
        />
      )}
    </>
  );
}

export default AppContent;
