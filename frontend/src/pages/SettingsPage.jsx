import { useCallback, useMemo, useState } from "react";
import CosmicBg from "../components/common/CosmicBg.jsx";
import GlassCard from "../components/common/GlassCard.jsx";
import Badge from "../components/common/Badge.jsx";
import ProfilePhotoManager from "../components/common/ProfilePhotoManager.jsx";
import ConfirmDialog from "../components/common/ConfirmDialog.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { getTheme } from "../styles/themes.js";
import { useToast } from "../components/common/Toast.jsx";
import * as reportsApi from "../utils/reportsApi.js";
import {
  readPreferences,
  writePreferences,
  resetPreferences,
  applyAnimationLevel,
  clearLocalCachedData,
  exportAccountData,
} from "../utils/settingsStorage.js";
import { GOLD_GRADIENT, PURPLE_GRADIENT, TABS } from "../constants/astrology.js";

// ─────────────────────────────────────────────────────────────────────────
// SettingsPage (V2.0 — Phase 6.4: Account Settings & Preferences)
//
// A dedicated, GitHub/Notion/ChatGPT-style settings experience — a persistent
// left-hand section nav (Account / Appearance / Preferences / Privacy /
// About) next to a single content panel — reached from AccountMenu's
// "Settings" item (previously a placeholder that just reopened Dashboard).
//
// Everything here is purely additive, frontend-only, and reuses what
// already exists rather than duplicating it:
//   - Account's "Edit Profile" IS `ProfilePhotoManager` (Phase 6.3) —
//     clicking the avatar opens its own existing upload/replace/remove
//     menu, exactly as it already does on Dashboard. No profile-editing
//     logic lives in this file.
//   - Reports used for "Export Account Data" come from the same
//     `reportsApi.listReports()` DashboardPage already calls — no new
//     backend endpoint.
//   - Theme state comes from `ThemeContext` (new, Phase 6.4); everything
//     else (preferences, privacy actions) is plain localStorage via
//     `utils/settingsStorage.js` (new, Phase 6.4) — same "no backend
//     changes" scope as Phase 6.3's photo storage.
//   - GlassCard, Badge, ConfirmDialog, Toast, CosmicBg, and the existing
//     Cinzel/Inter + gold/purple visual vocabulary are reused unchanged.
//
// No backend, auth, astrology engine, rule engine, Gemini, business logic,
// Dashboard, AccountMenu (beyond its one-line "Settings" destination — see
// AccountMenu.jsx), or ProfilePhotoManager code is modified by this file.
// ─────────────────────────────────────────────────────────────────────────

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

// Kept as plain constants (rather than importing package.json) so this
// page has no build-tool-specific import resolution to worry about.
// Update alongside frontend/package.json's own "version" field.
const APP_VERSION = "1.0.0";
const RELEASE_LABEL = "V2.0";
const BUILD_LABEL = `${APP_VERSION}-${import.meta.env.MODE}`;

const SECTIONS = [
  { key: "account", icon: "👤", label: "Account" },
  { key: "appearance", icon: "🎨", label: "Appearance" },
  { key: "preferences", icon: "⚙️", label: "Preferences" },
  { key: "privacy", icon: "🔒", label: "Privacy" },
  { key: "about", icon: "ℹ️", label: "About" },
];

// ── V3.0 Final Enhancement: User Preferences & Personalization ───────────
// Option lists for the new Preferences rows below, mirroring the exact
// same id/label/icon shape each source page already uses for its own
// switcher (HoroscopePage's PERIODS, CalendarPage's new view switcher) or
// reusing an existing constant outright (TABS, from constants/astrology.js
// — the same list ResultsPage's TabBar already renders).
const HOROSCOPE_VIEW_OPTIONS = [
  { value: "daily", label: "Daily", icon: "🌅" },
  { value: "weekly", label: "Weekly", icon: "🌓" },
  { value: "monthly", label: "Monthly", icon: "🌕" },
];
const CALENDAR_VIEW_OPTIONS = [
  { value: "full", label: "All Sections", icon: "📋" },
  { value: "timeline", label: "Timeline", icon: "🕓" },
];
const AI_RESPONSE_LENGTH_OPTIONS = [
  { value: "concise", label: "Concise" },
  { value: "balanced", label: "Balanced" },
  { value: "detailed", label: "Detailed" },
];

function SectionHeading({ children }) {
  return (
    <h2 style={{
      margin: "0 0 14px", fontSize: 14, letterSpacing: 1.5, textTransform: "uppercase",
      color: "var(--nv-text-muted, rgba(200,160,255,0.55))", fontWeight: 500,
    }}>
      {children}
    </h2>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0",
      borderBottom: "1px solid rgba(180,120,255,0.1)", fontSize: 13,
    }}>
      <span style={{ color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>{label}</span>
      <span style={{ color: "var(--nv-text-primary, #e8d5ff)", fontWeight: 600, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function Spinner({ size = 13 }) {
  return (
    <span aria-hidden="true" style={{
      display: "inline-block", width: size, height: size, borderRadius: "50%",
      border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "currentColor",
      animation: "spin 0.8s linear infinite",
    }} />
  );
}

// A small on/off switch built from a real <button role="switch">, so it's
// fully keyboard/screen-reader operable (Space/Enter toggle it, no custom
// key handling needed).
function ToggleSwitch({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="settings-focusable"
      style={{
        width: 44, height: 24, borderRadius: 999, border: "1px solid rgba(180,120,255,0.35)",
        background: checked ? PURPLE_GRADIENT : "rgba(255,255,255,0.08)",
        position: "relative", cursor: disabled ? "default" : "pointer", flexShrink: 0,
        opacity: disabled ? 0.5 : 1, transition: "background var(--nv-duration-base) var(--nv-ease-standard)",
        padding: 0,
      }}
    >
      <span aria-hidden="true" style={{
        position: "absolute", top: 2, left: checked ? 22 : 2, width: 18, height: 18,
        borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
        transition: "left var(--nv-duration-base) var(--nv-ease-standard)",
      }} />
    </button>
  );
}

// A row of mutually-exclusive pill options — used for Theme, Dashboard
// View, and Animation Level. `role="radiogroup"`/`role="radio"` so
// assistive tech announces it as one choice among several, not a set of
// independent buttons.
function SegmentedControl({ options, value, onChange, ariaLabel, disabled }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className="settings-focusable"
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 20,
              fontSize: 12.5, fontFamily: "Inter,sans-serif", fontWeight: active ? 600 : 400,
              cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1,
              color: active ? "#ffd700" : "var(--nv-text-muted, rgba(200,160,255,0.65))",
              background: active ? "rgba(255,215,0,0.12)" : "rgba(255,255,255,0.03)",
              border: active ? "1px solid rgba(255,215,0,0.35)" : "1px solid rgba(180,120,255,0.18)",
              transition: "background var(--nv-duration-base) var(--nv-ease-standard), color var(--nv-duration-base) var(--nv-ease-standard), border-color var(--nv-duration-base) var(--nv-ease-standard)",
            }}
          >
            {opt.icon && <span aria-hidden="true">{opt.icon}</span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function PreferenceRow({ title, desc, children }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
      padding: "14px 0", borderBottom: "1px solid rgba(180,120,255,0.1)", flexWrap: "wrap",
    }}>
      <div style={{ minWidth: 200, flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--nv-text-primary, #e8d5ff)", marginBottom: 3 }}>{title}</div>
        {desc && <div style={{ fontSize: 11.5, color: "var(--nv-text-muted, rgba(200,160,255,0.55))", lineHeight: 1.4 }}>{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function SettingsPage({ onNavigate, initialSection }) {
  const { user, updateUser } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const toast = useToast();

  const [preferences, setPreferences] = useState(() => readPreferences());
  // `initialSection` (e.g. from the Command Palette's "Settings → Privacy"
  // style deep links) always wins over the remembered section — it's an
  // explicit "take me here" request, not the passive "reopen where I left
  // off" behavior `rememberLastSection` provides. Falls back to the
  // existing remembered-section/"account" behavior exactly as before when
  // no deep link was requested.
  const [activeSection, setActiveSection] = useState(() => {
    if (initialSection && SECTIONS.some((s) => s.key === initialSection)) return initialSection;
    return preferences.rememberLastSection && SECTIONS.some((s) => s.key === preferences.lastSection)
      ? preferences.lastSection
      : "account";
  });

  const [reports, setReports] = useState(null); // lazily fetched only when Export is used
  const [exporting, setExporting] = useState(false);
  // "clear-cache" | "reset-prefs" | null — which destructive action's
  // confirmation dialog (if any) is currently open.
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const goBack = useCallback(() => onNavigate?.("dashboard"), [onNavigate]);

  const selectSection = useCallback((key) => {
    setActiveSection(key);
    setPreferences((prev) => {
      if (!prev.rememberLastSection) return prev;
      return writePreferences({ lastSection: key });
    });
  }, []);

  const updatePreference = useCallback((patch) => {
    try {
      const next = writePreferences(patch);
      setPreferences(next);
      return next;
    } catch (err) {
      toast.error(err.message || "Could not save that preference.");
      return null;
    }
  }, [toast]);

  const handleThemeChange = useCallback((mode) => {
    setTheme(mode);
    // V3.0 Phase 1: display names now come from styles/themes.js (the
    // design-system theme registry) instead of a hardcoded "Light"/"Dark"
    // — the underlying `mode` value ("light"/"dark"/"system") and
    // ThemeContext behavior are unchanged.
    const labels = { light: getTheme("light").name, dark: getTheme("dark").name, system: "System" };
    toast.success(`Theme set to ${labels[mode] || mode}.`);
  }, [setTheme, toast]);

  const handleDashboardViewChange = useCallback((value) => {
    if (updatePreference({ dashboardView: value })) {
      toast.success(`Default dashboard view set to ${value === "grid" ? "Grid" : "List"}. Applies next time you open the Dashboard.`);
    }
  }, [updatePreference, toast]);

  const handleAnimationLevelChange = useCallback((value) => {
    if (updatePreference({ animationLevel: value })) {
      applyAnimationLevel(value);
      const labels = { full: "Full", reduced: "Reduced", none: "None" };
      toast.success(`Animation level set to ${labels[value] || value}.`);
    }
  }, [updatePreference, toast]);

  const handleCompactModeChange = useCallback((checked) => {
    updatePreference({ compactMode: checked });
  }, [updatePreference]);

  const handleRememberSectionChange = useCallback((checked) => {
    updatePreference({ rememberLastSection: checked, ...(checked ? { lastSection: activeSection } : {}) });
  }, [updatePreference, activeSection]);

  // ── V3.0 Final Enhancement: User Preferences & Personalization ────────
  // Same shape as the handlers above: each just persists one field via
  // the existing `updatePreference`/`writePreferences` helper and shows a
  // confirmation toast. None of these call a new API or touch any page's
  // actual astrology/report/AI logic — each preference is only ever read
  // as an initial default by the page that already owned that piece of
  // state (see settingsStorage.js's DEFAULT_PREFERENCES comments).
  const handleReportTabChange = useCallback((value) => {
    const tab = TABS.find((t) => t.id === value);
    if (updatePreference({ reportTab: value })) {
      toast.success(`Default report tab set to ${tab?.label || value}. Applies next time you open a report.`);
    }
  }, [updatePreference, toast]);

  const handleHoroscopeViewChange = useCallback((value) => {
    const opt = HOROSCOPE_VIEW_OPTIONS.find((o) => o.value === value);
    if (updatePreference({ horoscopeView: value })) {
      toast.success(`Default Horoscope view set to ${opt?.label || value}.`);
    }
  }, [updatePreference, toast]);

  const handleCalendarViewChange = useCallback((value) => {
    const opt = CALENDAR_VIEW_OPTIONS.find((o) => o.value === value);
    if (updatePreference({ calendarView: value })) {
      toast.success(`Default Calendar view set to ${opt?.label || value}.`);
    }
  }, [updatePreference, toast]);

  const handleAiResponseLengthChange = useCallback((value) => {
    const opt = AI_RESPONSE_LENGTH_OPTIONS.find((o) => o.value === value);
    if (updatePreference({ aiResponseLength: value })) {
      toast.success(`AI response length set to ${opt?.label || value}.`);
    }
  }, [updatePreference, toast]);

  const handleRememberLastReportChange = useCallback((checked) => {
    updatePreference({ rememberLastReport: checked, ...(checked ? {} : { lastOpenedReportId: null }) });
  }, [updatePreference]);

  const handleShowWelcomeAnimationChange = useCallback((checked) => {
    updatePreference({ showWelcomeAnimation: checked });
  }, [updatePreference]);

  const handleCommandPaletteHintChange = useCallback((checked) => {
    updatePreference({ commandPaletteHint: checked });
  }, [updatePreference]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const list = reports ?? await reportsApi.listReports();
      setReports(list);
      exportAccountData({ user, reports: list, theme, preferences });
      toast.success("Your account data export has started downloading.");
    } catch (err) {
      toast.error(err.message || "Could not export your account data right now.");
    } finally {
      setExporting(false);
    }
  }, [reports, user, theme, preferences, toast]);

  const openConfirm = useCallback((action) => setConfirmAction(action), []);
  const closeConfirm = useCallback(() => { if (!confirmBusy) setConfirmAction(null); }, [confirmBusy]);

  const runConfirmedAction = useCallback(async () => {
    setConfirmBusy(true);
    try {
      if (confirmAction === "clear-cache") {
        const cleared = clearLocalCachedData();
        toast.success(cleared.length ? "Local cached data cleared." : "There was no local cached data to clear.");
      } else if (confirmAction === "reset-prefs") {
        const defaults = resetPreferences();
        setPreferences(defaults);
        applyAnimationLevel(defaults.animationLevel);
        setTheme("system");
        toast.success("Preferences and theme have been reset to their defaults.");
      }
      setConfirmAction(null);
    } catch (err) {
      toast.error(err.message || "That action could not be completed.");
    } finally {
      setConfirmBusy(false);
    }
  }, [confirmAction, toast, setTheme]);

  const confirmCopy = useMemo(() => ({
    "clear-cache": {
      title: "Clear local cached data?",
      message: "Clears cached, session-only app state on this device (e.g. the one-time welcome splash). Your account, profile photo, saved reports, and preferences are not affected.",
      confirmLabel: "Clear Cache",
      loadingLabel: "Clearing…",
    },
    "reset-prefs": {
      title: "Reset application preferences?",
      message: "Resets Appearance and Preferences (theme, dashboard view, animation level, compact mode, and all personalization defaults below) back to their defaults on this device. Your account, profile photo, and saved reports are not affected.",
      confirmLabel: "Reset",
      loadingLabel: "Resetting…",
    },
  }), []);

  const compact = preferences.compactMode;
  const cardPadding = compact ? 18 : 26;
  const rowGap = compact ? 10 : 16;

  return (
    <div style={{ position: "relative", minHeight: "100vh", padding: "90px 20px 60px" }}>
      <CosmicBg />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 980, margin: "0 auto", display: "grid", gap: 22 }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <button
              type="button"
              onClick={goBack}
              className="settings-focusable"
              style={{
                background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 6,
                color: "var(--nv-text-secondary, rgba(200,160,255,0.7))", fontSize: 12.5, fontFamily: "Inter,sans-serif",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              ← Back to Dashboard
            </button>
            <h1 style={{
              margin: 0, fontSize: 26, fontFamily: "Cinzel,serif", fontWeight: 700,
              background: GOLD_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Settings
            </h1>
          </div>
        </div>

        <div className="settings-shell" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20, alignItems: "start" }}>
          {/* ── Section nav ─────────────────────────────────────────── */}
          <nav aria-label="Settings sections" className="settings-nav-scroll">
            <div role="tablist" aria-orientation="vertical" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {SECTIONS.map((s) => {
                const active = s.key === activeSection;
                return (
                  <button
                    key={s.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls={`settings-panel-${s.key}`}
                    id={`settings-tab-${s.key}`}
                    onClick={() => selectSection(s.key)}
                    className="settings-focusable settings-nav-item"
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 12,
                      fontSize: 13, fontFamily: "Inter,sans-serif", fontWeight: active ? 600 : 400,
                      cursor: "pointer", textAlign: "left", whiteSpace: "nowrap",
                      color: active ? "#ffd700" : "var(--nv-text-muted, rgba(200,160,255,0.65))",
                      background: active ? "rgba(255,215,0,0.1)" : "transparent",
                      border: active ? "1px solid rgba(255,215,0,0.3)" : "1px solid transparent",
                      transition: "background var(--nv-duration-base) var(--nv-ease-standard), color var(--nv-duration-base) var(--nv-ease-standard), border-color var(--nv-duration-base) var(--nv-ease-standard)",
                    }}
                  >
                    <span aria-hidden="true">{s.icon}</span> {s.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* ── Active section panel ────────────────────────────────── */}
          <div
            key={activeSection}
            role="tabpanel"
            id={`settings-panel-${activeSection}`}
            aria-labelledby={`settings-tab-${activeSection}`}
            style={{ animation: "fadeIn 0.3s ease both", minWidth: 0 }}
          >
            {activeSection === "account" && (
              <div>
                <SectionHeading>Account</SectionHeading>
                <GlassCard style={{ padding: cardPadding }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: rowGap + 6, flexWrap: "wrap" }}>
                    <ProfilePhotoManager user={user} onUpdate={updateUser} size={compact ? 68 : 88} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: "var(--nv-text-muted, rgba(200,160,255,0.5))", marginBottom: 2 }}>
                        Click your photo to edit — upload, replace, or remove it.
                      </div>
                      <Badge color={user?.authProvider === "google" ? "#9dc9ff" : "#bf7fff"}>
                        {user?.authProvider === "google" ? "Signed in with Google" : "Email & Password"}
                      </Badge>
                    </div>
                  </div>
                  <InfoRow label="Full Name" value={user?.name || "—"} />
                  <InfoRow label="Email Address" value={user?.email || "—"} />
                  <InfoRow label="Member Since" value={formatDate(user?.createdAt)} />
                </GlassCard>
              </div>
            )}

            {activeSection === "appearance" && (
              <div>
                <SectionHeading>Appearance</SectionHeading>
                <GlassCard style={{ padding: cardPadding }}>
                  <PreferenceRow
                    title="Theme"
                    desc={`Currently using ${resolvedTheme === "dark" ? getTheme("dark").name : getTheme("light").name}${theme === "system" ? " (following your system setting)" : ""}.`}
                  >
                    <SegmentedControl
                      ariaLabel="Theme"
                      value={theme}
                      onChange={handleThemeChange}
                      options={[
                        { value: "light", label: getTheme("light").name, icon: getTheme("light").icon },
                        { value: "dark", label: getTheme("dark").name, icon: getTheme("dark").icon },
                        { value: "system", label: "System", icon: "🖥️" },
                      ]}
                    />
                  </PreferenceRow>
                  <p style={{ margin: "14px 0 0", fontSize: 11.5, color: "var(--nv-text-muted, rgba(200,160,255,0.45))", lineHeight: 1.5 }}>
                    Your choice is saved to this device and applied every time you open NakshatraVerse.
                  </p>
                </GlassCard>
              </div>
            )}

            {activeSection === "preferences" && (
              <div>
                <SectionHeading>Preferences</SectionHeading>
                <GlassCard style={{ padding: cardPadding }}>
                  <PreferenceRow title="Default Dashboard View" desc="Grid or list layout for Saved Reports on your Dashboard.">
                    <SegmentedControl
                      ariaLabel="Default Dashboard View"
                      value={preferences.dashboardView}
                      onChange={handleDashboardViewChange}
                      options={[
                        { value: "grid", label: "Grid", icon: "▦" },
                        { value: "list", label: "List", icon: "☰" },
                      ]}
                    />
                  </PreferenceRow>
                  <PreferenceRow title="Animation Level" desc="Reduce or disable motion effects throughout the app.">
                    <SegmentedControl
                      ariaLabel="Animation Level"
                      value={preferences.animationLevel}
                      onChange={handleAnimationLevelChange}
                      options={[
                        { value: "full", label: "Full" },
                        { value: "reduced", label: "Reduced" },
                        { value: "none", label: "None" },
                      ]}
                    />
                  </PreferenceRow>
                  <PreferenceRow title="Compact Mode" desc="Tighter spacing on this Settings page.">
                    <ToggleSwitch checked={preferences.compactMode} onChange={handleCompactModeChange} label="Compact Mode" />
                  </PreferenceRow>
                  <PreferenceRow title="Remember Last Opened Section" desc="Reopen Settings on the section you were last viewing.">
                    <ToggleSwitch checked={preferences.rememberLastSection} onChange={handleRememberSectionChange} label="Remember Last Opened Section" />
                  </PreferenceRow>
                  <PreferenceRow title="Default Report Tab" desc="Which report tab opens first when you view a reading.">
                    <SegmentedControl
                      ariaLabel="Default Report Tab"
                      value={preferences.reportTab}
                      onChange={handleReportTabChange}
                      options={TABS.map((t) => ({ value: t.id, label: t.label, icon: t.icon }))}
                    />
                  </PreferenceRow>
                  <PreferenceRow title="Default Horoscope View" desc="Which period the Horoscope Dashboard opens on.">
                    <SegmentedControl
                      ariaLabel="Default Horoscope View"
                      value={preferences.horoscopeView}
                      onChange={handleHoroscopeViewChange}
                      options={HOROSCOPE_VIEW_OPTIONS}
                    />
                  </PreferenceRow>
                  <PreferenceRow title="Default Calendar View" desc="Whether the Astrology Calendar opens showing every section, or just the merged Timeline.">
                    <SegmentedControl
                      ariaLabel="Default Calendar View"
                      value={preferences.calendarView}
                      onChange={handleCalendarViewChange}
                      options={CALENDAR_VIEW_OPTIONS}
                    />
                  </PreferenceRow>
                  <PreferenceRow title="AI Response Length" desc="How detailed the AI Assistant's answers are.">
                    <SegmentedControl
                      ariaLabel="AI Response Length"
                      value={preferences.aiResponseLength}
                      onChange={handleAiResponseLengthChange}
                      options={AI_RESPONSE_LENGTH_OPTIONS}
                    />
                  </PreferenceRow>
                  <PreferenceRow title="Remember Last Opened Report" desc="Let the Dashboard offer to reopen the last report you viewed.">
                    <ToggleSwitch checked={preferences.rememberLastReport} onChange={handleRememberLastReportChange} label="Remember Last Opened Report" />
                  </PreferenceRow>
                  <PreferenceRow title="Show Welcome Animation" desc="Show the one-time splash animation each time you open NakshatraVerse.">
                    <ToggleSwitch checked={preferences.showWelcomeAnimation} onChange={handleShowWelcomeAnimationChange} label="Show Welcome Animation" />
                  </PreferenceRow>
                  <PreferenceRow title="Command Palette Shortcut Hint" desc="Show a one-time tip about the ⌘K / Ctrl+K Command Palette shortcut after signing in.">
                    <ToggleSwitch checked={preferences.commandPaletteHint} onChange={handleCommandPaletteHintChange} label="Command Palette Shortcut Hint" />
                  </PreferenceRow>
                </GlassCard>
              </div>
            )}

            {activeSection === "privacy" && (
              <div>
                <SectionHeading>Privacy</SectionHeading>
                <GlassCard style={{ padding: cardPadding, display: "grid", gap: 14 }}>
                  <PreferenceRow title="Export Account Data" desc="Download a JSON file of your profile, saved reports, and settings on this device.">
                    <button
                      type="button"
                      onClick={handleExport}
                      disabled={exporting}
                      aria-busy={exporting}
                      className="pill-btn tap-scale settings-focusable"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 20,
                        fontSize: 12.5, cursor: exporting ? "default" : "pointer", opacity: exporting ? 0.7 : 1,
                        border: "1px solid rgba(180,120,255,0.35)", background: "rgba(123,47,255,0.15)",
                        color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif",
                      }}
                    >
                      {exporting && <Spinner />}
                      {exporting ? "Preparing…" : "Export Data"}
                    </button>
                  </PreferenceRow>
                  <PreferenceRow title="Clear Local Cached Data" desc="Clears transient, session-only app state stored on this device.">
                    <button
                      type="button"
                      onClick={() => openConfirm("clear-cache")}
                      className="pill-btn tap-scale settings-focusable"
                      style={{
                        padding: "9px 16px", borderRadius: 20, fontSize: 12.5, cursor: "pointer",
                        border: "1px solid rgba(180,120,255,0.35)", background: "rgba(123,47,255,0.15)",
                        color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif",
                      }}
                    >
                      Clear Cache
                    </button>
                  </PreferenceRow>
                  <PreferenceRow title="Reset Application Preferences" desc="Resets Appearance and Preferences back to defaults on this device.">
                    <button
                      type="button"
                      onClick={() => openConfirm("reset-prefs")}
                      className="pill-btn tap-scale settings-focusable"
                      style={{
                        padding: "9px 16px", borderRadius: 20, fontSize: 12.5, cursor: "pointer",
                        border: "1px solid rgba(255,100,100,0.35)", background: "rgba(120,20,20,0.25)",
                        color: "var(--nv-danger, #ff9d9d)", fontFamily: "Inter,sans-serif",
                      }}
                    >
                      Reset Preferences
                    </button>
                  </PreferenceRow>
                </GlassCard>
              </div>
            )}

            {activeSection === "about" && (
              <div>
                <SectionHeading>About</SectionHeading>
                <GlassCard style={{ padding: cardPadding }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <span aria-hidden="true" style={{ fontSize: 22 }}>🪐</span>
                    <span style={{
                      fontSize: 16, fontWeight: 700, fontFamily: "Cinzel,serif",
                      background: GOLD_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    }}>
                      NakshatraVerse
                    </span>
                  </div>
                  <InfoRow label="Current Release" value={RELEASE_LABEL} />
                  <InfoRow label="Application Version" value={APP_VERSION} />
                  <InfoRow label="Build" value={BUILD_LABEL} />
                  <InfoRow label="Developer" value="NakshatraVerse Team" />
                  <p style={{ margin: "14px 0 0", fontSize: 11.5, color: "var(--nv-text-muted, rgba(200,160,255,0.5))", lineHeight: 1.5 }}>
                    Authentic Vedic astrology, explained by AI — your cosmic blueprint, made clear.
                  </p>
                  <p style={{ margin: "16px 0 0", fontSize: 11, color: "rgba(180,130,255,0.4)" }}>
                    © {new Date().getFullYear()} NakshatraVerse. All rights reserved.
                  </p>
                  <h3 style={{ margin: "20px 0 8px", fontSize: 11.5, letterSpacing: 1, textTransform: "uppercase", color: "var(--nv-text-muted, rgba(200,160,255,0.5))" }}>
                    Open Source Libraries
                  </h3>
                  <InfoRow label="React" value="MIT" />
                  <InfoRow label="React DOM" value="MIT" />
                  <p style={{ margin: "10px 0 0", fontSize: 11, color: "rgba(180,130,255,0.4)", lineHeight: 1.5 }}>
                    This build does not yet bundle a full third-party license audit.
                  </p>
                </GlassCard>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction ? confirmCopy[confirmAction].title : ""}
        message={confirmAction ? confirmCopy[confirmAction].message : ""}
        confirmLabel={confirmAction ? confirmCopy[confirmAction].confirmLabel : "Confirm"}
        loadingLabel={confirmAction ? confirmCopy[confirmAction].loadingLabel : "Working…"}
        cancelLabel="Cancel"
        danger
        loading={confirmBusy}
        onConfirm={runConfirmedAction}
        onCancel={closeConfirm}
      />
    </div>
  );
}

export default SettingsPage;
