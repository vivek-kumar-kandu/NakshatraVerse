import { useEffect, useMemo, useState, useCallback } from "react";
import CosmicBg from "../components/common/CosmicBg.jsx";
import GlassCard from "../components/common/GlassCard.jsx";
import Badge from "../components/common/Badge.jsx";
import InsightRow from "../components/common/InsightRow.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { getTheme } from "../styles/themes.js";
import * as reportsApi from "../utils/reportsApi.js";
import { GOLD_GRADIENT, PURPLE_GRADIENT } from "../constants/astrology.js";
import SkeletonList from "../components/common/Skeleton.jsx";
import ReportCard from "../components/common/ReportCard.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import SectionHeader from "../components/common/dashboard/SectionHeader.jsx";
import StatCard from "../components/common/dashboard/StatCard.jsx";
import SummaryCard from "../components/common/dashboard/SummaryCard.jsx";
import QuickActionCard from "../components/common/dashboard/QuickActionCard.jsx";
import PanchangWidget from "../components/common/dashboard/PanchangWidget.jsx";
// V4.5 Phase 1B (Festival Frontend Integration): additive widget, same
// "own GlassCard section, own data fetch" shape as PanchangWidget above.
import FestivalWidget from "../components/common/dashboard/FestivalWidget.jsx";
import FamilyProfilesWidget from "../components/common/dashboard/FamilyProfilesWidget.jsx";
// V4.3 (AI Life Coach): additive widget, same "own GlassCard section, own
// data fetch" shape as PanchangWidget/FamilyProfilesWidget above.
import AILifeCoachWidget from "../components/common/dashboard/AILifeCoachWidget.jsx";
// V4.4 Phase 1 (Notification Infrastructure): additive widget, same "own
// GlassCard section, own data fetch" shape as PanchangWidget/
// FamilyProfilesWidget/AILifeCoachWidget above.
import NotificationsWidget from "../components/common/dashboard/NotificationsWidget.jsx";
import PersonalizedInsightsWidget from "../components/common/dashboard/PersonalizedInsightsWidget.jsx";
import { readPreferences } from "../utils/settingsStorage.js";

// ─────────────────────────────────────────────────────────────────────────
// DashboardPage — V3.0 Phase 2 (Dashboard 3.0 & Home Experience)
//
// Still exactly the productivity-workspace overview it was after the
// earlier "Dashboard & Navigation Cleanup" pass: Welcome/greeting, User
// summary, Statistics, Quick Actions, and a Recent Reports *preview*
// (max 3, view-only). This phase's changes are presentational/structural
// only, built entirely out of new shared widgets
// (components/common/dashboard/*):
//   - StatCard / SummaryCard / QuickActionCard / SectionHeader replace the
//     page's old inline StatTile/ActionCard/SectionHeading — same visual
//     language, now reusable elsewhere (Home's own overview panel uses
//     the same widgets).
//   - A new "Astrology Summary" card (Nakshatra, Dasha) and a "Current
//     Theme" indicator are added, per this phase's brief. Both are purely
//     presentational reads of data the backend already computes and
//     already exposes: `reportsApi.getReport(id)` (existing, unchanged
//     endpoint) for the most recent saved report's
//     `nakshatraProfile`/`predictions[0]` fields, and `useTheme()`
//     (existing ThemeContext) for the active theme. No new API, no new
//     calculation, nothing added to the astrology/rule/prediction
//     engines.
//
// Full Saved Reports archive lives in SavedReportsPage.jsx, full Profile
// in ProfilePage.jsx, Settings in SettingsPage.jsx — Dashboard still only
// links to them, never re-renders their content, so there remains exactly
// one implementation of each.
// ─────────────────────────────────────────────────────────────────────────

function initials(name) {
  if (!name) return "✦";
  const parts = name.trim().split(/\s+/);
  const value = ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
  return value || "✦";
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

// Current Theme indicator label: "system" isn't itself an entry in the
// THEMES registry (styles/themes.js only lists the two actual palettes,
// "dark"/"light" — see that file's header), so it's handled here as
// "System (Light)"/"System (Dark)" depending on what it currently
// resolves to, while an explicit choice just shows that theme's name.
function themeLabel(mode, resolvedTheme) {
  if (mode === "system") return `System (${getTheme(resolvedTheme).name})`;
  return getTheme(mode).name;
}

function DashboardPage({ onNavigate, onViewReport, onOpenLifeCoach, onOpenFestivalIntelligence }) {
  const { user } = useAuth();
  const { theme, resolvedTheme } = useTheme();
  const [reports, setReports] = useState(null);
  const [error, setError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  // Astrology Summary (Nakshatra / Dasha) — a single, best-effort read of
  // the most recent saved report's full detail. `listReports()` only ever
  // returns lightweight metadata (id/title/createdAt/name/dob/lagna — see
  // backend/services/reports/reportService.js#listReports), so the
  // Nakshatra/Dasha fields need one `getReport(id)` call, exactly like
  // SavedReportPage already does when opening a single report. Failure
  // here is silent (the card itself just doesn't render) — it must never
  // block or error out the rest of the Dashboard.
  const [astroSummary, setAstroSummary] = useState(null);
  // V4.3 (AI Life Coach): the same `getReport(latestId)` call below already
  // fetches the latest saved report's full userData/chart/report — this
  // just also keeps that around so AILifeCoachWidget has a chart to ground
  // its guidance in, without a second/duplicate fetch.
  const [latestFullReport, setLatestFullReport] = useState(null);
  // V3.0 Final Enhancement (User Preferences & Personalization): "Remember
  // Last Opened Report" — read once (like every other preference-driven
  // default in this codebase), so the Quick Actions grid below can offer
  // a "Continue Reading" shortcut straight to it. Purely a presentational
  // read of an existing localStorage value; no new API, no change to how
  // reports are fetched.
  const [lastOpenedReportId] = useState(() => {
    const prefs = readPreferences();
    return prefs.rememberLastReport ? prefs.lastOpenedReportId : null;
  });

  const loadReports = useCallback(() => {
    let cancelled = false;
    setError(null);
    reportsApi.listReports()
      .then((r) => { if (!cancelled) setReports(r); })
      .catch((err) => { if (!cancelled) setError(err.message || "Could not load your saved reports."); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => loadReports(), [loadReports]);

  // Recent Reports is a client-side, preview-only view (top 3) of the same
  // `reports` array — no additional API call, no search/sort/delete here.
  const recentReports = useMemo(() => {
    if (!reports) return [];
    return [...reports]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);
  }, [reports]);

  useEffect(() => {
    let cancelled = false;
    const latestId = recentReports[0]?.id;
    if (!latestId) { setAstroSummary(null); setLatestFullReport(null); return undefined; }
    reportsApi.getReport(latestId)
      .then((full) => {
        if (cancelled) return;
        const prediction = full?.report?.predictions?.[0];
        const nakshatraProfile = full?.report?.nakshatraProfile;
        setLatestFullReport(full?.chart ? { userData: full.userData, chart: full.chart, report: full.report } : null);
        if (!prediction && !nakshatraProfile) { setAstroSummary(null); return; }
        setAstroSummary({
          nakshatra: nakshatraProfile?.nakshatra,
          pada: nakshatraProfile?.pada,
          lord: nakshatraProfile?.lord,
          mahadasha: prediction?.activeMahadasha,
          antardasha: prediction?.activeAntardasha,
        });
      })
      .catch(() => { if (!cancelled) { setAstroSummary(null); setLatestFullReport(null); } });
    return () => { cancelled = true; };
  }, [recentReports]);

  const handleDownload = async (id, name) => {
    setDownloadingId(id);
    try {
      await reportsApi.exportSavedReportPdf(id, `${name || "report"}.pdf`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", position: "relative", fontFamily: "Inter,sans-serif" }}>
      <CosmicBg animated />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1080, margin: "0 auto", padding: "84px 16px 70px" }}>

        {/* ── Welcome section / personalized greeting ────────────────── */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap",
          gap: 14, marginBottom: 30, animation: "fadeIn 0.5s ease both",
        }}>
          <div>
            <h1 style={{
              margin: 0, fontSize: "clamp(22px,4vw,30px)", background: GOLD_GRADIENT,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "Cinzel,serif", fontWeight: 700,
            }}>
              Your Dashboard
            </h1>
            <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "var(--nv-text-muted, rgba(200,160,255,0.65))" }}>
              Welcome back, {user?.name?.split(" ")[0] || "traveler"} ✦
            </p>
          </div>
          <button
            onClick={() => onNavigate("landing")}
            className="submit-btn"
            style={{
              padding: "13px 24px", borderRadius: 30, border: "1px solid rgba(180,120,255,0.45)",
              background: "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))", color: "var(--nv-text-on-accent, #fff)", fontWeight: 600,
              fontSize: 14, cursor: "pointer", fontFamily: "Cinzel,serif", boxShadow: "0 4px 20px rgba(123,47,255,0.35)",
            }}
          >
            ✦ Generate New Report
          </button>
        </header>

        {error && (
          <GlassCard
            role="alert"
            style={{
              padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center",
              justifyContent: "space-between", gap: 14, flexWrap: "wrap",
              border: "1px solid rgba(255,100,100,0.3)",
            }}
          >
            <p style={{ margin: 0, color: "var(--nv-danger, #ff8888)", fontSize: 13 }}>{error}</p>
            <button
              onClick={loadReports}
              className="pill-btn tap-scale"
              style={{
                padding: "8px 16px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                border: "1px solid rgba(255,100,100,0.35)", background: "rgba(120,20,20,0.25)",
                color: "var(--nv-danger, #ff9d9d)", fontFamily: "Inter,sans-serif", flexShrink: 0,
              }}
            >
              ↻ Try again
            </button>
          </GlassCard>
        )}

        {/* ── User summary ───────────────────────────────────────────── */}
        <section style={{ marginBottom: 34, animation: "fadeIn 0.6s ease 0.05s both" }}>
          <GlassCard style={{ padding: "24px 26px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            {/* Small UX fix: this previously always rendered initials, even
                when the account has an uploaded/Google profile photo — the
                same `user.picture` AccountMenu's Avatar already reads (see
                context/AuthContext.jsx, which merges a locally stored or
                Google photo onto `user.picture` before any consumer ever
                renders). Mirroring that same read here (photo when
                present, initials fallback otherwise) keeps this card in
                sync with the Account Menu with no changes to auth,
                storage, or how the photo gets onto `user` in the first
                place. */}
            {user?.picture ? (
              <img
                src={user.picture}
                alt=""
                aria-hidden="true"
                style={{
                  width: 60, height: 60, borderRadius: "50%", flexShrink: 0,
                  objectFit: "cover", border: "1px solid rgba(255,255,255,0.25)",
                  boxShadow: "0 0 24px rgba(123,47,255,0.5)",
                }}
              />
            ) : (
              <div aria-hidden="true" style={{
                width: 60, height: 60, borderRadius: "50%", flexShrink: 0,
                background: PURPLE_GRADIENT, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, fontWeight: 700, color: "var(--nv-text-on-accent, #fff)", fontFamily: "Cinzel,serif",
                boxShadow: "0 0 24px rgba(123,47,255,0.5)",
              }}>
                {initials(user?.name)}
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <h2 style={{ margin: "0 0 4px", fontSize: 18, color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Cinzel,serif" }}>{user?.name}</h2>
              <p style={{ margin: 0, fontSize: 13, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>{user?.email}</p>
            </div>
            <Badge color={user?.authProvider === "google" ? "#9dc9ff" : "#bf7fff"}>
              {user?.authProvider === "google" ? "Signed in with Google" : "Email & Password"}
            </Badge>
            <button
              type="button"
              onClick={() => onNavigate("profile")}
              className="pill-btn tap-scale"
              style={{
                padding: "9px 16px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                border: "1px solid rgba(180,120,255,0.35)", background: "rgba(123,47,255,0.15)",
                color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif", flexShrink: 0,
              }}
            >
              View Full Profile →
            </button>
          </GlassCard>
        </section>

        {/* ── Statistics ──────────────────────────────────────────────── */}
        <section style={{ marginBottom: 34, animation: "fadeIn 0.6s ease 0.1s both" }}>
          <SectionHeader icon="📊">Statistics</SectionHeader>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
            <StatCard icon="📜" label="Saved Reports" value={reports ? reports.length : "…"} accent="#bf7fff" />
            <StatCard icon="🗓️" label="Member Since" value={formatDate(user?.createdAt)} accent="#9dc9ff" />
            <StatCard icon="🕐" label="Latest Reading" value={recentReports[0] ? formatDate(recentReports[0].createdAt) : "—"} accent="#ffd700" />
            <StatCard
              icon={resolvedTheme === "light" ? "☀️" : "🌙"}
              label="Current Theme"
              value={themeLabel(theme, resolvedTheme)}
              accent="#ff9ed8"
            />
          </div>
        </section>

        {/* ── Astrology Summary ───────────────────────────────────────── */}
        {astroSummary && (astroSummary.nakshatra || astroSummary.mahadasha) && (
          <section style={{ marginBottom: 34, animation: "fadeIn 0.6s ease 0.12s both" }}>
            <SectionHeader icon="🔮">Astrology Summary</SectionHeader>
            <SummaryCard icon="✨" title="From Your Latest Reading">
              {astroSummary.nakshatra && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  <Badge color="#ffd700">{astroSummary.nakshatra}{astroSummary.pada ? ` · Pada ${astroSummary.pada}` : ""}</Badge>
                  {astroSummary.lord && <Badge color="#bf7fff">Lord: {astroSummary.lord}</Badge>}
                </div>
              )}
              {astroSummary.mahadasha && <InsightRow label="Current Mahadasha" value={astroSummary.mahadasha} color="#bf7fff" />}
              {astroSummary.antardasha && <InsightRow label="Current Antardasha" value={astroSummary.antardasha} color="#9dc9ff" />}
            </SummaryCard>
          </section>
        )}

        <section style={{ marginBottom: 34, animation: "fadeIn 0.6s ease 0.125s both" }}>
          <PersonalizedInsightsWidget reportId={recentReports[0]?.id} />
        </section>

        {/* ── Today's Panchang (V4.1 Phase 2 — additive widget) ──────── */}
        <section style={{ marginBottom: 34, animation: "fadeIn 0.6s ease 0.13s both" }}>
          <PanchangWidget onViewFull={() => onNavigate("panchang")} />
        </section>

        {/* ── Today's Festival (V4.5 Phase 1B — additive widget) ──────── */}
        <section style={{ marginBottom: 34, animation: "fadeIn 0.6s ease 0.131s both" }}>
          <FestivalWidget
            onViewFull={() => onNavigate("festivals")}
            onOpenIntelligence={onOpenFestivalIntelligence && ((festival) => onOpenFestivalIntelligence(festival, latestFullReport))}
          />
        </section>

        {/* ── AI Life Coach (V4.3 — additive widget) ──────────────────
            Same "own GlassCard section, own data fetch" shape as
            PanchangWidget above, scoped to the latest saved report's
            chart/report already fetched for Astrology Summary. */}
        {latestFullReport && (
          <section style={{ marginBottom: 34, animation: "fadeIn 0.6s ease 0.135s both" }}>
            <AILifeCoachWidget
              reportData={latestFullReport}
              onOpenFull={() => onOpenLifeCoach?.(latestFullReport)}
            />
          </section>
        )}

        {/* ── Notifications (V4.4 Phase 1 — additive widget) ──────────
            Same "own GlassCard section, own data fetch" shape as
            PanchangWidget/FamilyProfilesWidget above. */}
        <section style={{ marginBottom: 34, animation: "fadeIn 0.6s ease 0.132s both" }}>
          <NotificationsWidget onOpenNotifications={() => onNavigate("notifications")} />
        </section>

        {/* ── Family Profiles (V4.2 — additive widget) ────────────────
            Same "own GlassCard section, own data fetch" shape as
            PanchangWidget above. */}
        <section style={{ marginBottom: 34, animation: "fadeIn 0.6s ease 0.14s both" }}>
          <FamilyProfilesWidget
            onOpenFamilyProfiles={() => onNavigate("family-profiles")}
            onAddProfile={() => onNavigate("family-profiles")}
            onOpenRelationshipHub={() => onNavigate("relationship-hub")}
          />
        </section>

        {/* ── Quick Actions ──────────────────────────────────────────── */}
        <section style={{ marginBottom: 34, animation: "fadeIn 0.6s ease 0.15s both" }}>
          <SectionHeader icon="⚡">Quick Actions</SectionHeader>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14 }}>
            <QuickActionCard icon="✦" label="Generate New Report" desc="Start a fresh Vedic reading" onClick={() => onNavigate("landing")} primary />
            {lastOpenedReportId && (
              <QuickActionCard icon="↩️" label="Continue Reading" desc="Reopen your last viewed report" onClick={() => onViewReport(lastOpenedReportId)} />
            )}
            <QuickActionCard icon="👤" label="My Profile" desc="View your profile details" onClick={() => onNavigate("profile")} />
            <QuickActionCard icon="📚" label="Saved Reports" desc="Browse your full archive" onClick={() => onNavigate("reports")} />
            {/* Small UX addition: surfaces the existing AI Astrology
                Assistant (V3.0 Phase 4 — AIAssistantPage.jsx, reached via
                the "assistant" stage) directly from Dashboard, the same
                way the Command Palette's "AI Assistant" command already
                does when no report is currently open (see
                paletteOpenAssistant in App.jsx: falls back to plain
                onNavigate("assistant") outside of an active reading, and
                AIAssistantPage already renders safely with no
                chart/report in that case). No new page, no AI logic here —
                just another QuickActionCard, same as every action above. */}
            <QuickActionCard icon="🔮" label="Ask AI" desc="Chat with your Astrology Assistant" onClick={() => onNavigate("assistant")} />
            {/* V4.3 (AI Life Coach): same pattern as the "Ask AI" card
                above — if a reading is already loaded (latestFullReport),
                open it scoped to that; otherwise fall back to the plain
                stage nav, and AILifeCoachPage renders its own EmptyState
                with no chart, same contract as HoroscopePage/CalendarPage. */}
            <QuickActionCard
              icon="🧭"
              label="AI Life Coach"
              desc="Daily, career, relationship, finance & wellness guidance"
              onClick={() => (latestFullReport ? onOpenLifeCoach?.(latestFullReport) : onNavigate("ai-life-coach"))}
            />
            <QuickActionCard icon="💞" label="Kundli Matching" desc="Check Vedic compatibility for two people" onClick={() => onNavigate("matching")} />
            <QuickActionCard icon="🕉️" label="Panchang & Muhurat" desc="Daily Panchang and auspicious timing finder" onClick={() => onNavigate("panchang")} />
            <QuickActionCard icon="👨‍👩‍👧‍👦" label="Family Profiles" desc="Manage every birth chart in your circle" onClick={() => onNavigate("family-profiles")} />
            <QuickActionCard icon="💞" label="Relationship Hub" desc="Compare any two saved profiles" onClick={() => onNavigate("relationship-hub")} />
            <QuickActionCard icon="⚙️" label="Settings" desc="Manage your account" onClick={() => onNavigate("settings")} />
          </div>
        </section>


        {/* ── Recent Reports (preview only) ──────────────────────────── */}
        <section style={{ marginBottom: 6, animation: "fadeIn 0.6s ease 0.2s both" }}>
          <SectionHeader
            icon="🕑"
            actionLabel={recentReports.length ? "View All →" : undefined}
            onAction={recentReports.length ? () => onNavigate("reports") : undefined}
          >
            Recent Reports
          </SectionHeader>

          {reports === null && !error && (
            <div style={{ display: "flex", gap: 14, overflowX: "hidden" }}>
              <SkeletonList rows={3} variant="card" />
            </div>
          )}

          {reports?.length === 0 && (
            <EmptyState
              icon="🌙"
              title="No readings yet"
              message="Generate your first Vedic reading to see it appear here."
              actionLabel="✦ Generate New Report"
              onAction={() => onNavigate("landing")}
              compact
            />
          )}

          {recentReports.length > 0 && (
            <div className="tab-scroll-region" style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 6, animation: "fadeIn 0.35s ease both" }}>
              {recentReports.map((r) => (
                <ReportCard
                  key={r.id}
                  report={r}
                  variant="recent"
                  onView={onViewReport}
                  onDownload={handleDownload}
                  downloading={downloadingId === r.id}
                />
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

export default DashboardPage;
