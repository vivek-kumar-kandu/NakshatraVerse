import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import LandingPage from "./pages/LandingPage.jsx";
import LoadingPage from "./pages/LoadingPage.jsx";
// Priority 5.4 fix: LoginPage is now on the critical initial-paint path
// (Priority 5.3 made it the first screen an unauthenticated visitor sees,
// before the one-time GET /api/auth/me check even resolves), so it must be
// a static import, not lazy(). Lazy-loading it added avoidable dynamic-
// import latency to the very first screen unauthenticated visitors see,
// and is also what caused this flow's tests to occasionally time out
// waiting for the chunk to resolve. Signup/Dashboard/SavedReport are still
// genuinely off the first-paint path, so they remain lazy below.
import LoginPage from "./pages/LoginPage.jsx";
// Priority 6.2.1 regression fix: ForgotPasswordPage was previously lazy-
// loaded (see the removed `const ForgotPasswordPage = lazy(...)` line that
// used to sit below). It's reached by a single click straight off
// LoginPage, which itself is a static import on the critical path per the
// note above. Under the extra dynamic-import overhead introduced by Phase
// 5's chunk-splitting build config, the chunk fetch for this one screen
// could occasionally lose the race against the test's
// `findByRole(..., { timeout: 4000 })` for the "Reset Your Password"
// heading -- most visible when the whole suite runs back-to-back and the
// module graph is under heavier load. Matching LoginPage and making this a
// static import removes that avoidable async gap. Same component, same
// props, same render output -- import mechanism only.
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import { calcNumerology, calcPlanetaryPositions, getLagna } from "./utils/astroCalculations.js";
import { generateAstroReport } from "./utils/api.js";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
// Phase 6.4 (Account Settings & Preferences): mounted once at the app root,
// same level as AuthProvider/ToastProvider, so the persisted theme applies
// on every stage (splash/home/login/dashboard/etc.), not only while
// SettingsPage itself happens to be on screen. See its own file header.
import { ThemeProvider } from "./context/ThemeContext.jsx";
import AccountMenu from "./components/common/AccountMenu.jsx";
import ActionDock from "./components/common/ActionDock.jsx";
// V3.0 — Premium Command Palette: global Ctrl+K / Cmd+K launcher. Mounted
// once at the app root, same level as AccountMenu/ActionDock below — see
// its own file header for the full rationale. It renders nothing while
// signed out, so mounting it unconditionally here (rather than gating on
// `stage` the way showAccountMenu does) just means it's available from
// every authenticated stage, including ones AccountMenu itself doesn't
// cover (e.g. "assistant").
import CommandPalette from "./components/common/CommandPalette.jsx";
// Priority 6.1: splash screen + new marketing Home page, shown before the
// existing login/landing resolution below. Both are static imports (not
// lazy) since, like LoginPage, they sit on the very first paint any
// visitor sees.
import SplashScreen from "./components/common/SplashScreen.jsx";
import HomePage from "./pages/HomePage.jsx";
// Phase 1 (Loading & Feedback / Motion & Interactions): shared, additive
// Toast notification system and a stage-level PageTransition wrapper. See
// their own file headers for rationale — neither changes routing, stage
// logic, or state management; ToastProvider only mounts a new context +
// fixed-position viewport, and PageTransition only wraps existing render
// output to replay a CSS entrance animation on stage change.
import { ToastProvider, useToast } from "./components/common/Toast.jsx";
import PageTransition from "./components/common/PageTransition.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
// V3.0 Final Enhancement (User Preferences & Personalization): read/write
// helpers only — same module SettingsPage/SavedReportsPage/ResultsPage
// already use. No new storage mechanism, no backend.
import { readPreferences, writePreferences } from "./utils/settingsStorage.js";

// ─────────────────────────────────────────────────────────────────────────
// Priority 5.1 performance note: ResultsPage (plus its nine tab panels) is
// the largest single chunk of UI in this app, and it's never needed on
// first paint — a person always sees LandingPage first, then LoadingPage
// for as long as the backend request takes (typically several seconds).
// Lazy-loading it means:
//   1. The initial bundle downloaded/parsed before the birth-data form can
//      even render is smaller (faster first paint / Time to Interactive).
//   2. The ResultsPage chunk downloads *during* the loading-screen wait —
//      time that was previously spent doing nothing but animating — so by
//      the time the backend responds and `stage` flips to "results", the
//      chunk has very likely already finished loading and the Suspense
//      fallback is rarely even visible.
// No behavior changes: same props, same render output.
// ─────────────────────────────────────────────────────────────────────────
const ResultsPage = lazy(() => import("./pages/ResultsPage.jsx"));

// Priority 6.2.1: sessionStorage key used to ensure SplashScreen is only
// ever shown once per app launch (per browser tab) — see the `stage`
// initializer and handleSplashComplete below.
const SPLASH_SEEN_KEY = "nv_splash_seen";
// V3.0 Final Enhancement: sessionStorage key ensuring the Command Palette
// shortcut hint toast (see the effect below) is shown at most once per
// browser tab, same "once per launch" pattern as SPLASH_SEEN_KEY above.
const COMMAND_PALETTE_HINT_SEEN_KEY = "nv_cmdk_hint_seen";

// Priority 5.2: new stages (signup/dashboard/saved-report) are lazy-loaded
// the same way — none of them are needed on first paint. (LoginPage itself
// is a static import above — see the Priority 5.4 note — since Priority
// 5.3 put it on the first-paint path for logged-out visitors.)
const SignupPage = lazy(() => import("./pages/SignupPage.jsx"));
const DashboardPage = lazy(() => import("./pages/DashboardPage.jsx"));
const SavedReportPage = lazy(() => import("./pages/SavedReportPage.jsx"));
// Dashboard & Navigation Cleanup: "Saved Reports" now has its own
// dedicated destination — the full search/filter/sort/delete/export
// archive that used to live embedded inside DashboardPage. Same
// lazy-loading rationale as every other post-auth stage.
const SavedReportsPage = lazy(() => import("./pages/SavedReportsPage.jsx"));
// Phase 6.4: same lazy-loading rationale as the stages above — never
// needed on first paint, only reached deliberately via AccountMenu's
// "Settings" item.
const SettingsPage = lazy(() => import("./pages/SettingsPage.jsx"));
// Account Menu Navigation Improvement: "My Profile" previously routed to
// the same "dashboard" stage as "Dashboard"/"Saved Reports". Same
// lazy-loading rationale as every other post-auth stage — only reached
// deliberately via AccountMenu's "My Profile" item.
const ProfilePage = lazy(() => import("./pages/ProfilePage.jsx"));
// V3.0 Phase 4 (AI Astrology Assistant): same lazy-loading rationale as
// every other post-first-paint stage above — only reached deliberately
// from ActionDock ("Ask AI") or SavedReportPage.
const AIAssistantPage = lazy(() => import("./pages/AIAssistantPage.jsx"));
// V3.0 Phase 5 (Personalized Horoscope & Astrology Calendar): same
// lazy-loading rationale as every other post-first-paint stage above —
// only reached deliberately from ActionDock ("Horoscope"/"Calendar") or
// SavedReportPage.
const HoroscopePage = lazy(() => import("./pages/HoroscopePage.jsx"));
const CalendarPage = lazy(() => import("./pages/CalendarPage.jsx"));
// V4.0 Phase 1 (Kundli Matching): additive, same lazy-loading pattern as
// every other post-landing page.
const MatchingPage = lazy(() => import("./pages/MatchingPage.jsx"));
// V4.1 Phase 2 (Daily Panchang & Muhurat Finder): additive, same
// lazy-loading pattern as MatchingPage above — fully self-contained, no
// existing chart/report context required to open.
const PanchangPage = lazy(() => import("./pages/PanchangPage.jsx"));
// V4.2 (Family Profiles & Relationship Hub): additive, same lazy-loading
// pattern as MatchingPage/PanchangPage above — both are fully
// self-contained, no existing chart/report context required to open.
const FamilyProfilesPage = lazy(() => import("./pages/FamilyProfilesPage.jsx"));
const RelationshipHubPage = lazy(() => import("./pages/RelationshipHubPage.jsx"));
// V4.3 (AI Life Coach): additive, same lazy-loading pattern as
// HoroscopePage/CalendarPage above — only reached deliberately from
// ActionDock ("AI Life Coach"), Dashboard, SavedReportPage, or CommandPalette.
const AILifeCoachPage = lazy(() => import("./pages/AILifeCoachPage.jsx"));
// V4.4 Phase 1 (Notification Infrastructure): additive, same lazy-loading
// pattern as MatchingPage/PanchangPage above — fully self-contained, no
// existing chart/report context required to open.
const NotificationCenterPage = lazy(() => import("./pages/NotificationCenterPage.jsx"));
// V4.5 Phase 1B (Festival Frontend Integration): additive, same
// lazy-loading pattern as MatchingPage/PanchangPage above — fully
// self-contained, no existing chart/report context required to open.
const FestivalPage = lazy(() => import("./pages/FestivalPage.jsx"));
// V4.5 Phase 2 (Festival Intelligence): additive, same lazy-loading
// pattern as FestivalPage above — a new, separate page, reached from the
// Dashboard/Calendar's additive Festival Intelligence entry points. Does
// not replace or alter FestivalPage in any way.
const FestivalIntelligencePage = lazy(() => import("./pages/FestivalIntelligencePage.jsx"));
// ─── App Controller ───────────────────────────────────────────────────────────
function AppContent() {
  // Priority 5.3 fix: the app used to always open on LandingPage (the birth-
  // data form), regardless of whether a session existed, so sign-in was
  // effectively hidden behind the account menu. `stage` now starts as
  // `null` ("still determining the initial screen") and is resolved to
  // either "login" (no session) or "landing" (existing session) by the
  // effect below, once the one-time GET /api/auth/me check finishes. This
  // does not change the guest flow — LoginPage's existing "← Back to home"
  // link still drops straight into LandingPage with no account required.
  // Priority 6.1: the very first stage of every app load is now "splash"
  // (previously this started as `null`). Once SplashScreen's own timer
  // finishes it hands control to handleSplashComplete below, which moves
  // straight to the new "home" marketing page — shown to every visitor,
  // guest or already signed in (HomePage itself adapts its hero/nav via
  // useAuth()). The pre-existing `stage === null` resolution effect
  // further below is untouched and still exists for the protected-route
  // bounce it also handles (dashboard/saved-report -> login when signed
  // out), it's just no longer reached from the initial splash handoff.
  // Priority 6.2.1 fix: SplashScreen was being treated as part of the
  // resolved `stage` state, which is fine for the very first render of a
  // browser tab but has no memory of "have we already shown it" — so
  // anything that re-mounted AppContent (e.g. a test re-render, or in
  // principle any future remount within the same tab) would show the
  // splash again. SPLASH_SEEN_KEY is a sessionStorage flag (cleared when
  // the tab closes, matching "first launch" rather than "first ever
  // visit") so the splash genuinely only appears once per app launch —
  // every stage transition after that reads/writes `stage` exactly as
  // before.
  const [stage, setStage] = useState(() => {
    try {
      // V3.0 Final Enhancement: "Show Welcome Animation" preference — when
      // explicitly turned off, skip straight to "home" exactly as if the
      // splash had already been seen this session. The existing
      // SPLASH_SEEN_KEY per-tab "only once" behavior is untouched either
      // way; this just adds a second, user-controlled reason to skip it.
      if (sessionStorage.getItem(SPLASH_SEEN_KEY)) return "home";
      return readPreferences().showWelcomeAnimation === false ? "home" : "splash";
    } catch {
      // Storage unavailable (private browsing lockdown, etc.) — fall back
      // to always showing the splash rather than crashing.
      return "splash";
    }
  });
  const [userData, setUserData] = useState(null);
  const [report, setReport] = useState(null);
  const [planetary, setPlanetary] = useState(null);
  const [numerology, setNumerology] = useState(null);
  // V4.2 (Family Profiles & Relationship Hub): which profile (if any) to
  // pre-select as "Profile A" when Relationship Hub is opened via a
  // Family Profile card's "Compare" action. null means "open blank".
  const [relationshipHubPresetId, setRelationshipHubPresetId] = useState(null);
  const [error, setError] = useState(null);
  // True once the real backend call has settled (succeeded OR failed).
  // The loading screen watches this instead of running on its own fixed
  // timer, so it never finishes before — or long after — the actual work.
  const [aiReady, setAiReady] = useState(false);
  // Priority 5.2: which saved report (if any) SavedReportPage should load.
  const [viewingReportId, setViewingReportId] = useState(null);
  // V3.0 Phase 4 (AI Astrology Assistant): which chart/report the
  // assistant chat should be scoped to, plus which stage "← Back" should
  // return to (results, straight from a freshly generated reading, or
  // saved-report, opened from a previously saved one). Set right before
  // navigating to the "assistant" stage — see handleOpenAssistant below.
  const [assistantContext, setAssistantContext] = useState(null);
  // V3.0 Phase 5 (Personalized Horoscope & Astrology Calendar): same
  // pattern as assistantContext above — which chart/report the Horoscope
  // Dashboard / Astrology Calendar should be scoped to, plus which stage
  // "← Back" should return to. Set right before navigating to the
  // "horoscope"/"calendar" stage (see ActionDock and SavedReportPage).
  const [horoscopeContext, setHoroscopeContext] = useState(null);
  const [calendarContext, setCalendarContext] = useState(null);
  // V4.3 (AI Life Coach): same pattern as horoscopeContext/calendarContext
  // above — which chart/report/userData the AI Life Coach page should be
  // scoped to, plus which stage "← Back" should return to.
  const [lifeCoachContext, setLifeCoachContext] = useState(null);
  // V4.5 Phase 1B (Festival Frontend Integration): FestivalPage is fully
  // self-contained like PanchangPage (no chart/report needed to open), so
  // this only ever holds an optional { festivalKey, date } deep link —
  // set when a Festival notification is clicked (see the "notifications"
  // stage below) so FestivalPage can open straight to the correct
  // festival on the correct date instead of its default "Today" tab.
  const [festivalContext, setFestivalContext] = useState(null);
  // V4.5 Phase 2 (Festival Intelligence): same pattern as festivalContext
  // above — holds { festivalKey, date, year, chart, report, returnStage }
  // for the new FestivalIntelligencePage. chart/report are optional (the
  // page degrades gracefully to non-personalized content when absent).
  const [festivalIntelligenceContext, setFestivalIntelligenceContext] = useState(null);
  // Priority 5.4 fix: where to send someone once they finish signing in.
  // Defaults to "dashboard" (the normal post-login destination), but is
  // set to "results" first when ActionDock's "Save Report" button forces
  // an anonymous visitor through the login screen — otherwise a person
  // who generates a reading, clicks Save, signs in, and previously landed
  // on an empty Dashboard would silently lose the very report they were
  // trying to save (it only ever existed in this component's state, never
  // persisted). Sending them back to "results" instead means their report
  // is still on screen and the Save button (now enabled, since they're
  // authenticated) works on the next click.
  const [postLoginTarget, setPostLoginTarget] = useState("dashboard");

  const { loading: authLoading, isAuthenticated, logout } = useAuth();
  const toast = useToast();

  // V3.0 Final Enhancement (User Preferences & Personalization):
  // "Auto-open Command Palette Shortcut Hint" — a single, dismissible,
  // one-time tip pointing at the already-existing ⌘K/Ctrl+K shortcut
  // (see CommandPalette.jsx's own global keydown listener, unchanged).
  // This effect never opens the palette itself; it only informs. Fires
  // at most once per browser tab (sessionStorage flag, same "once per
  // launch" pattern as SPLASH_SEEN_KEY) the first time an authenticated
  // visitor reaches the Dashboard.
  useEffect(() => {
    if (stage !== "dashboard" || !isAuthenticated) return;
    try {
      if (sessionStorage.getItem(COMMAND_PALETTE_HINT_SEEN_KEY)) return;
      if (!readPreferences().commandPaletteHint) return;
      sessionStorage.setItem(COMMAND_PALETTE_HINT_SEEN_KEY, "1");
      toast.info("💡 Tip: Press ⌘K (or Ctrl+K) to open the Command Palette.");
    } catch {
      // Storage unavailable — the hint just won't show this session.
    }
  }, [stage, isAuthenticated, toast]);

  // Priority 5.5 fix: AccountMenu's Logout button previously called the
  // raw context `logout()` directly, which only clears the session cookie
  // — it left userData/report/planetary/numerology sitting in this
  // component's state. On a shared/public machine that meant a stale
  // reading could still be present in memory after signing out. Logout
  // now always wipes the ephemeral chart/report state too, in addition to
  // ending the session.
  const handleLogout = useCallback(async () => {
    await logout();
    setUserData(null);
    setReport(null);
    setPlanetary(null);
    setNumerology(null);
    setError(null);
    setAiReady(false);
    setViewingReportId(null);
  }, [logout]);

  // Priority 5.2: protected routes. Dashboard and saved-report views
  // require a session — if someone lands on either stage without one
  // (e.g. a stale bookmark-like state after logging out in another tab),
  // bounce them to sign-in instead of showing an empty/erroring page.
  useEffect(() => {
    if (authLoading) return;
    // First resolution of the initial screen (stage is still null): send
    // an unauthenticated visitor to the sign-in page, and an already-signed-
    // in visitor straight to the birth-data form as before.
    if (stage === null) {
      setStage(isAuthenticated ? "landing" : "login");
      return;
    }
    if (!isAuthenticated && (stage === "dashboard" || stage === "saved-report" || stage === "settings" || stage === "profile" || stage === "reports" || stage === "notifications")) {
      setStage("login");
    }
  }, [authLoading, isAuthenticated, stage]);

  const handleFormSubmit = useCallback((form) => {
    const num = calcNumerology(form.name, form.dob);
    const planets = calcPlanetaryPositions(form.dob, form.tob);
    const lagna = getLagna(form.dob, form.tob);
    const enriched = { ...form, lagna };
    setNumerology(num); setPlanetary(planets); setUserData(enriched);
    setStage("loading"); setError(null); setAiReady(false);
    // Kick off both the real report request AND (implicitly, via the
    // lazy() call above) the ResultsPage chunk download in parallel — the
    // loading screen's minimum-perceived-duration animation gives the
    // chunk plenty of time to arrive before it's actually needed.
    generateAstroReport(enriched, planets, num)
      .then(r => {
        setReport(r);
        if (r?.chart) {
          setNumerology(r.chart.numerology);
          setPlanetary(r.chart.planetary);
          setUserData(prev => ({ ...prev, lagna: r.chart.lagna }));
        }
      })
      .catch((err) => {
        console.error("NakshatraVerse: AI report generation failed:", err);
        // Surface the specific backend-provided reason (invalid key, model
        // overloaded, quota exceeded, timeout, etc.) instead of a generic
        // message, so the real cause is visible instead of a dead end.
        const reason = err?.message || "Unknown error.";
        setError(`AI report unavailable — ${reason}`);
      })
      .finally(() => setAiReady(true));
  }, []);

  const handleLoadingComplete = useCallback(() => setStage("results"), []);

  // Priority 6.1: SplashScreen calls this once its own display timer has
  // finished — hands off to the new marketing Home page.
  // Priority 6.2.1: also records that the splash has now been shown for
  // this browser tab/session, so it isn't shown again (see the `stage`
  // initializer above).
  const handleSplashComplete = useCallback(() => {
    try { sessionStorage.setItem(SPLASH_SEEN_KEY, "1"); } catch {
      // Storage unavailable — non-fatal, splash just may show again.
    }
    setStage("home");
  }, []);

  // Priority 5.2: single navigation entry point used by AccountMenu,
  // LoginPage, SignupPage, and DashboardPage. Kept intentionally simple
  // (a stage-string switch, matching the existing architecture) rather
  // than introducing a routing library, so the rest of the app's
  // structure is untouched.
  const handleNavigate = useCallback((nextStage) => {
    setError(null);
    // Sentinel used by LoginPage/SignupPage after a successful sign-in —
    // resolves to wherever the visitor was trying to go before they were
    // asked to authenticate (see postLoginTarget above), then resets to
    // the normal default so unrelated future logins still land on the
    // Dashboard.
    if (nextStage === "post-auth") {
      setStage(postLoginTarget);
      setPostLoginTarget("dashboard");
      return;
    }
    setStage(nextStage);
  }, [postLoginTarget]);

  // Priority 5.4 fix: used by ActionDock's "Save Report" button instead of
  // navigating to "login" directly, so the redirect target is recorded
  // first (see postLoginTarget above).
  const handleRequireLogin = useCallback(() => {
    setPostLoginTarget("results");
    setError(null);
    setStage("login");
  }, []);

  const handleViewReport = useCallback((reportId) => {
    setViewingReportId(reportId);
    setStage("saved-report");
    // V3.0 Final Enhancement (User Preferences & Personalization): when
    // "Remember Last Opened Report" is on, remember which report this
    // was so DashboardPage can offer a "Continue Reading" quick action.
    // Purely a localStorage write via the existing settingsStorage
    // helpers — no new API, no change to how reports are fetched/viewed.
    try {
      if (readPreferences().rememberLastReport) {
        writePreferences({ lastOpenedReportId: reportId });
      }
    } catch {
      // Storage unavailable — non-fatal, "Continue Reading" just won't appear.
    }
  }, []);

  // V3.0 Phase 4 (AI Astrology Assistant): single entry point used by both
  // ActionDock (results stage) and SavedReportPage — each just supplies
  // which chart/report/userData to scope the chat to and which stage to
  // return to on "← Back".
  const handleOpenAssistant = useCallback((ctx) => {
    setAssistantContext(ctx);
    setStage("assistant");
  }, []);

  // V3.0 Phase 5 (Personalized Horoscope & Astrology Calendar): single
  // entry points used by ActionDock (results stage) and SavedReportPage —
  // each just supplies which chart/report/userData to scope the page to.
  const handleOpenHoroscope = useCallback((ctx) => {
    setHoroscopeContext(ctx);
    setStage("horoscope");
  }, []);

  const handleOpenCalendar = useCallback((ctx) => {
    setCalendarContext(ctx);
    setStage("calendar");
  }, []);

  // V4.3 (AI Life Coach): single entry point used by ActionDock (results
  // stage), SavedReportPage, DashboardPage's widget/Quick Action, and
  // CommandPalette — each just supplies which chart/report/userData to
  // scope the page to.
  const handleOpenLifeCoach = useCallback((ctx) => {
    setLifeCoachContext(ctx);
    setStage("ai-life-coach");
  }, []);

  // V3.0 — Premium Command Palette: which chart/report the palette's
  // Horoscope/Calendar/AI Assistant commands should act on, if any is
  // currently on screen. Mirrors `showActionDock`'s own guard exactly, so
  // the palette's version of those three commands behaves identically to
  // clicking the equivalent ActionDock button when a reading is already
  // loaded. When nothing is loaded (e.g. invoked from Dashboard), each
  // command instead falls back to the plain nav stage — every one of
  // those three pages already renders safely with no chart/report,
  // showing its own existing empty state (see HoroscopePage/CalendarPage/
  // AIAssistantPage) — so no new business logic is needed either way.
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

  // V3.0 — Command Palette "Settings → <section>" deep links (Global
  // Search upgrade). Purely a UI convenience: SettingsPage already renders
  // every one of these sections from its own SECTIONS list, this just
  // pre-selects one instead of always landing on "Account".
  const [settingsInitialSection, setSettingsInitialSection] = useState(null);
  const paletteOpenSettingsSection = useCallback((sectionKey) => {
    setSettingsInitialSection(sectionKey);
    handleNavigate("settings");
  }, [handleNavigate]);

  const showAccountMenu = !authLoading && ["landing", "results", "dashboard", "settings", "profile", "reports", "horoscope", "calendar", "ai-life-coach", "notifications"].includes(stage);
  const showActionDock = stage === "results" && report?.chart && userData && !error;

  let content = null;
  if (stage === "splash") {
    // Priority 6.1: shown for every app load, independent of the auth
    // check happening in the background — it has its own fixed timer.
    content = <SplashScreen onComplete={handleSplashComplete} />;
  } else if (stage === "home") {
    // Priority 6.1: new marketing/landing experience — shown to every
    // visitor after the splash screen. Guest CTAs lead into the existing,
    // untouched Login/Signup pages; a signed-in visitor's hero/nav instead
    // lead to the existing Dashboard. handleLogout is reused as-is (same
    // one AccountMenu uses) so logging out from here also clears ephemeral
    // report state exactly as it already does elsewhere.
    content = <HomePage onNavigate={handleNavigate} onLogout={handleLogout} />;
  } else if (stage === null) {
    // Same visual used for every other Suspense fallback in this file —
    // avoids a blank white flash while the one-time session check resolves.
    content = <LoadingPage userData={null} onComplete={() => {}} ready={false} />;
  } else if (stage === "landing") {
    content = <LandingPage onSubmit={handleFormSubmit} />;
  } else if (stage === "loading") {
    content = <LoadingPage userData={userData} onComplete={handleLoadingComplete} ready={aiReady} />;
  } else if (stage === "results") {
    content = (
      <>
        {error && (
          <div
            role="alert"
            style={{
              // V1.0 RC bugfix: this banner previously sat at top:16,
              // right:16, zIndex:999 — nearly the exact same fixed
              // top-right corner AccountMenu (App.jsx's global, always-on
              // profile pill + Dashboard/Logout dropdown) occupies at
              // top:14, right:14, zIndex:1000. Since AccountMenu's
              // z-index was higher, its pill (and, worse, its open
              // dropdown panel) rendered directly on top of this banner,
              // visually chopping up or hiding the error text whenever
              // both were on screen at once (e.g. a Gemini failure while
              // the account menu happened to be open). Dropping the
              // banner below AccountMenu's collapsed-pill height (~40px)
              // plus a small gap keeps them side-by-side instead of
              // stacked in the same corner, and raising this banner's own
              // z-index just above AccountMenu's means that even if the
              // dropdown is open at the same moment, the alert — which
              // the person actively needs to read — still renders on top
              // and stays legible instead of being partially hidden.
              position:"fixed", top:70, right:16, left:16, zIndex:1001, padding:"12px 18px",
              background:"rgba(120,20,20,0.85)", border:"1px solid rgba(255,80,80,0.35)",
              borderRadius:10, color:"var(--nv-danger, #ffaaaa)", fontSize:13, fontFamily:"Inter,sans-serif",
              backdropFilter:"blur(var(--nv-glass-blur-sm, 14px))",
              // Priority 5.1 fix: this toast previously used a fixed
              // `maxWidth:340` with only `right:16` (no `left`), which on a
              // ~320-375px phone viewport could push past the left edge of
              // the screen and force the page to scroll horizontally. Adding
              // `left:16` plus `marginLeft:"auto"` and capping width with
              // `min(340px, 100%)` keeps the toast fully on-screen at every
              // viewport while rendering at the exact original 340px on
              // tablet/desktop.
              width:"min(340px, 100%)", marginLeft:"auto",
              lineHeight:1.4,
            }}
          >
            ⚠️ {error}
          </div>
        )}
        <Suspense fallback={<LoadingPage userData={userData} onComplete={() => {}} ready={false} />}>
          <ResultsPage userData={userData} report={report} planetary={planetary} numerology={numerology} error={error} />
        </Suspense>
      </>
    );
  } else if (stage === "login") {
    content = <LoginPage onNavigate={handleNavigate} />;
  } else if (stage === "signup") {
    content = (
      <Suspense fallback={<LoadingPage userData={null} onComplete={() => {}} ready={false} />}>
        <SignupPage onNavigate={handleNavigate} />
      </Suspense>
    );
  } else if (stage === "forgot-password") {
    content = <ForgotPasswordPage onNavigate={handleNavigate} />;
  } else if (stage === "dashboard") {
    content = (
      <Suspense fallback={<LoadingPage userData={null} onComplete={() => {}} ready={false} />}>
        <DashboardPage
          onNavigate={handleNavigate}
          onViewReport={handleViewReport}
          onOpenLifeCoach={(ctx) => handleOpenLifeCoach({ ...ctx, returnStage: "dashboard" })}
          onOpenFestivalIntelligence={(festival, reportCtx) => {
            setFestivalIntelligenceContext({
              festivalKey: festival.key,
              date: festival.date,
              year: Number(festival.date.slice(0, 4)),
              chart: reportCtx?.chart,
              report: reportCtx?.report,
              returnStage: "dashboard",
            });
            setStage("festival-intelligence");
          }}
        />
      </Suspense>
    );
  } else if (stage === "reports") {
    // Dashboard & Navigation Cleanup: AccountMenu's "Saved Reports" (and
    // Dashboard's own "Saved Reports" Quick Action) now land on this
    // dedicated page instead of a scrolled-to section of the Dashboard.
    // This is the single implementation of Saved Reports — DashboardPage
    // itself only shows a preview and links here.
    content = (
      <Suspense fallback={<LoadingPage userData={null} onComplete={() => {}} ready={false} />}>
        <SavedReportsPage onNavigate={handleNavigate} onViewReport={handleViewReport} />
      </Suspense>
    );
  } else if (stage === "profile") {
    // Account Menu Navigation Improvement: AccountMenu's "My Profile" now
    // has its own dedicated destination instead of also landing on
    // "dashboard". Same lazy/Suspense pattern as every other stage here.
    content = (
      <Suspense fallback={<LoadingPage userData={null} onComplete={() => {}} ready={false} />}>
        <ProfilePage onNavigate={handleNavigate} />
      </Suspense>
    );
  } else if (stage === "saved-report") {
    content = (
      <Suspense fallback={<LoadingPage userData={null} onComplete={() => {}} ready={false} />}>
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
    // V3.0 Phase 4 (AI Astrology Assistant): scoped to whatever chart/
    // report handleOpenAssistant was last called with (see ActionDock and
    // SavedReportPage). "← Back" returns to wherever the person opened
    // the chat from, and — since this stage is unmounted on any stage
    // change — the conversation is always fresh next time it's opened.
    content = (
      <Suspense fallback={<LoadingPage userData={null} onComplete={() => {}} ready={false} />}>
        <AIAssistantPage
          userData={assistantContext?.userData}
          chart={assistantContext?.chart}
          report={assistantContext?.report}
          initialQuestion={assistantContext?.initialQuestion}
          onBack={() => setStage(assistantContext?.returnStage || "results")}
          onNavigate={handleNavigate}
        />
      </Suspense>
    );
  } else if (stage === "horoscope") {
    // V3.0 Phase 5 (Personalized Horoscope & Astrology Calendar): scoped
    // to whatever chart/report handleOpenHoroscope was last called with
    // (ActionDock or SavedReportPage). "Explain..." buttons on this page
    // open the existing AI Assistant with a pre-filled question, scoped
    // back to this same stage on "← Back".
    content = (
      <Suspense fallback={<LoadingPage userData={null} onComplete={() => {}} ready={false} />}>
        <HoroscopePage
          userData={horoscopeContext?.userData}
          chart={horoscopeContext?.chart}
          report={horoscopeContext?.report}
          onBack={() => setStage(horoscopeContext?.returnStage || "results")}
          onOpenAssistant={(question) =>
            handleOpenAssistant({
              userData: horoscopeContext?.userData,
              chart: horoscopeContext?.chart,
              report: horoscopeContext?.report,
              returnStage: "horoscope",
              initialQuestion: question,
            })
          }
        />
      </Suspense>
    );
  } else if (stage === "calendar") {
    content = (
      <Suspense fallback={<LoadingPage userData={null} onComplete={() => {}} ready={false} />}>
        <CalendarPage
          userData={calendarContext?.userData}
          chart={calendarContext?.chart}
          report={calendarContext?.report}
          onBack={() => setStage(calendarContext?.returnStage || "results")}
          onOpenAssistant={(question) =>
            handleOpenAssistant({
              userData: calendarContext?.userData,
              chart: calendarContext?.chart,
              report: calendarContext?.report,
              returnStage: "calendar",
              initialQuestion: question,
            })
          }
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
    // V4.3 (AI Life Coach): scoped to whatever chart/report
    // handleOpenLifeCoach was last called with (ActionDock, SavedReportPage,
    // DashboardPage, or CommandPalette). "← Back" returns to wherever the
    // person opened it from, defaulting to Dashboard when opened directly
    // (e.g. Dashboard's widget/Quick Action, or CommandPalette with no
    // active reading).
    content = (
      <Suspense fallback={<LoadingPage userData={null} onComplete={() => {}} ready={false} />}>
        <AILifeCoachPage
          userData={lifeCoachContext?.userData}
          chart={lifeCoachContext?.chart}
          report={lifeCoachContext?.report}
          onBack={() => setStage(lifeCoachContext?.returnStage || (isAuthenticated ? "dashboard" : "landing"))}
        />
      </Suspense>
    );
  } else if (stage === "notifications") {
    // V4.4 Phase 1 (Notification Infrastructure): fully self-contained
    // page, same rationale as MatchingPage/PanchangPage above — no
    // existing report/chart context needed, reachable from Dashboard,
    // ActionDock, and CommandPalette with nothing more than a stage
    // change.
    content = (
      <Suspense fallback={<LoadingPage userData={null} onComplete={() => {}} ready={false} />}>
        <NotificationCenterPage
          onBack={() => setStage(isAuthenticated ? "dashboard" : "landing")}
          // V4.5 Phase 1B (Festival Frontend Integration): a Festival
          // notification's stored `destination` is "panchang" (backend
          // notification data is untouched — see
          // notificationGenerationService.js), but clicking one should
          // now open the Festival Page to the correct festival on the
          // correct date. `metadata` is only ever passed for this
          // frontend-only override; every other notification type
          // navigates exactly as before. The date is recovered from
          // `dedupeKey` ("festival:<key>:<date>:<today|tomorrow>") since
          // that's the only place the backend already put it.
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
    // Phase 6.4: reached from AccountMenu's "Settings" item. Same
    // Suspense/lazy pattern as every other post-auth stage above.
    content = (
      <Suspense fallback={<LoadingPage userData={null} onComplete={() => {}} ready={false} />}>
        <SettingsPage onNavigate={handleNavigate} initialSection={settingsInitialSection} />
      </Suspense>
    );
  } else if (stage === "matching") {
    // V4.0 Phase 1 (Kundli Matching): fully self-contained page (its own
    // two-person form/loading/results flow) — unlike Horoscope/Calendar it
    // needs no existing report/chart context to open, so it can be reached
    // from anywhere (Dashboard, ActionDock, CommandPalette) with nothing
    // more than a stage change.
    content = (
      <Suspense fallback={<LoadingPage userData={null} onComplete={() => {}} ready={false} />}>
        <MatchingPage onBack={() => setStage(isAuthenticated ? "dashboard" : "landing")} />
      </Suspense>
    );
  } else if (stage === "panchang") {
    // V4.1 Phase 2 (Daily Panchang & Muhurat Finder): fully self-contained
    // page, same rationale as MatchingPage above — no existing report/
    // chart context needed, reachable from Dashboard, ActionDock,
    // Calendar, and CommandPalette with nothing more than a stage change.
    content = (
      <Suspense fallback={<LoadingPage userData={null} onComplete={() => {}} ready={false} />}>
        <PanchangPage onBack={() => setStage(isAuthenticated ? "dashboard" : "landing")} />
      </Suspense>
    );
  } else if (stage === "festivals") {
    // V4.5 Phase 1B (Festival Frontend Integration): fully self-contained
    // page, same rationale as PanchangPage above — no existing report/
    // chart context needed, reachable from Dashboard, ActionDock,
    // Calendar, CommandPalette, and clicked Festival notifications with
    // nothing more than a stage change. `festivalContext` (set only when
    // opened via a Festival notification) is cleared once consumed so a
    // later, non-deep-linked visit to this stage lands on "Today" again.
    content = (
      <Suspense fallback={<LoadingPage userData={null} onComplete={() => {}} ready={false} />}>
        <FestivalPage
          onBack={() => { setFestivalContext(null); setStage(isAuthenticated ? "dashboard" : "landing"); }}
          initialFestivalKey={festivalContext?.festivalKey}
          initialDate={festivalContext?.date}
        />
      </Suspense>
    );
  } else if (stage === "festival-intelligence") {
    // V4.5 Phase 2 (Festival Intelligence): new, additive stage — does not
    // alter the "festivals" stage/FestivalPage above in any way. Reached
    // from the Dashboard's enhanced Festival Widget or the Calendar's
    // Festival strip (both explicitly allowed additive Festival
    // Intelligence entry points per this phase's spec). `returnStage`
    // defaults back to wherever the person opened it from.
    content = (
      <Suspense fallback={<LoadingPage userData={null} onComplete={() => {}} ready={false} />}>
        <FestivalIntelligencePage
          onBack={() => { setStage(festivalIntelligenceContext?.returnStage || (isAuthenticated ? "dashboard" : "landing")); setFestivalIntelligenceContext(null); }}
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
    // V4.2 (Family Profiles & Relationship Hub): fully self-contained page,
    // same rationale as MatchingPage/PanchangPage above. "Open"-ing a saved
    // profile hands its birth data to the exact same, completely
    // unmodified handleFormSubmit already used by LandingPage — so Birth
    // Report/Horoscope/Calendar/AI Assistant/PDF Export for a profile run
    // through the identical pipeline as a freshly-typed reading.
    content = (
      <Suspense fallback={<LoadingPage userData={null} onComplete={() => {}} ready={false} />}>
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
    // V4.2 (Family Profiles & Relationship Hub): fully self-contained page,
    // same rationale as MatchingPage above — reuses computeChart/
    // computeMatching/predictions entirely via /api/relationship-hub,
    // never touching Gemini or any astrology engine directly.
    content = (
      <Suspense fallback={<LoadingPage userData={null} onComplete={() => {}} ready={false} />}>
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

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
