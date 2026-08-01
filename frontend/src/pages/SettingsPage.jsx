import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../context/LanguageContext.jsx";
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
import { formatDate as formatDateIntl } from "../utils/localeFormat.js";
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

function formatDate(value, lang) {
  if (!value) return "—";
  return formatDateIntl(value, lang, { year: "numeric", month: "short", day: "numeric" });
}

// Kept as plain constants (rather than importing package.json) so this
// page has no build-tool-specific import resolution to worry about.
// Update alongside frontend/package.json's own "version" field.
const APP_VERSION = "1.0.0";
const RELEASE_LABEL = "V2.0";
const BUILD_LABEL = `${APP_VERSION}-${import.meta.env.MODE}`;

const SECTIONS = [
  { key: "account", icon: "👤", labelKey: "settings:sections.account" },
  { key: "appearance", icon: "🎨", labelKey: "settings:sections.appearance" },
  { key: "preferences", icon: "⚙️", labelKey: "settings:sections.preferences" },
  { key: "privacy", icon: "🔒", labelKey: "settings:sections.privacy" },
  { key: "about", icon: "ℹ️", labelKey: "settings:sections.about" },
];

// ── V3.0 Final Enhancement: User Preferences & Personalization ───────────
// Option lists for the new Preferences rows below, mirroring the exact
// same id/label/icon shape each source page already uses for its own
// switcher (HoroscopePage's PERIODS, CalendarPage's new view switcher) or
// reusing an existing constant outright (TABS, from constants/astrology.js
// — the same list ResultsPage's TabBar already renders).
const HOROSCOPE_VIEW_OPTIONS = [
  {value: "daily", label: "Daily", icon: "🌅" },
  { value: "weekly", label: "Weekly", icon: "🌓" },
  {value: "monthly", label: "Monthly", icon: "🌕" },
];
const CALENDAR_VIEW_OPTIONS = [
  {value: "full", label: "All Sections", icon: "📋" },
  { value: "timeline", label: "Timeline", icon: "🕓" },
];
const AI_RESPONSE_LENGTH_OPTIONS = [
  {value: "concise", label: "Concise" },
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
  const { t } = useTranslation(["settings", "common", "profile"]);
  const { language, setLanguage, supportedLanguages } = useLanguage();
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
    const labels = { light: getTheme("light").name, dark: getTheme("dark").name, system: t("settings:appearance.theme.system") };
    toast.success(t("settings:toast.themeSet", { theme: labels[mode] || mode }));
  }, [setTheme, toast, t]);

  const handleDashboardViewChange = useCallback((value) => {
    if (updatePreference({ dashboardView: value })) {
      toast.success(t("settings:toast.dashboardViewSet", { view: value === "grid" ? t("settings:preferences.grid") : t("settings:preferences.list") }));
    }
  }, [updatePreference, toast, t]);

  const handleAnimationLevelChange = useCallback((value) => {
    if (updatePreference({ animationLevel: value })) {
      applyAnimationLevel(value);
      const labels = { full: t("settings:preferences.animationOptions.full"), reduced: t("settings:preferences.animationOptions.reduced"), none: t("settings:preferences.animationOptions.none") };
      toast.success(t("settings:toast.animationLevelSet", { level: labels[value] || value }));
    }
  }, [updatePreference, toast, t]);

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
      toast.success(t("settings:messages.exportStarted"));
    } catch (err) {
      toast.error(err.message || t("settings:messages.exportFailed"));
    } finally {
      setExporting(false);
    }
  }, [reports, user, theme, preferences, toast, t]);

  const openConfirm = useCallback((action) => setConfirmAction(action), []);
  const closeConfirm = useCallback(() => { if (!confirmBusy) setConfirmAction(null); }, [confirmBusy]);

  const runConfirmedAction = useCallback(async () => {
    setConfirmBusy(true);
    try {
      if (confirmAction === "clear-cache") {
        const cleared = clearLocalCachedData();
        toast.success(cleared.length ? t("settings:messages.cacheCleared") : t("settings:messages.noCacheToClear"));
      } else if (confirmAction === "reset-prefs") {
        const defaults = resetPreferences();
        setPreferences(defaults);
        applyAnimationLevel(defaults.animationLevel);
        setTheme("system");
        toast.success(t("settings:messages.prefsReset"));
      }
      setConfirmAction(null);
    } catch (err) {
      toast.error(err.message || t("settings:confirmDialogs.genericError"));
    } finally {
      setConfirmBusy(false);
    }
  }, [confirmAction, toast, setTheme, t]);

  const confirmCopy = useMemo(() => ({
    "clear-cache": {
      title: t("settings:confirmDialogs.clearCache.title"),
      message: t("settings:confirmDialogs.clearCache.message"),
      confirmLabel: t("settings:confirmDialogs.clearCache.confirmLabel"),
      loadingLabel: t("settings:confirmDialogs.clearCache.loadingLabel"),
    },
    "reset-prefs": {
      title: t("settings:confirmDialogs.resetPrefs.title"),
      message: t("settings:confirmDialogs.resetPrefs.message"),
      confirmLabel: t("settings:confirmDialogs.resetPrefs.confirmLabel"),
      loadingLabel: t("settings:confirmDialogs.resetPrefs.loadingLabel"),
    },
  }), [t]);

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
              {t("settings:pageTitle")}
            </h1>
          </div>
        </div>

        <div className="settings-shell" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20, alignItems: "start" }}>
          {/* ── Section nav ─────────────────────────────────────────── */}
          <nav aria-label={t("settings:sections.navAriaLabel")} className="settings-nav-scroll">
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
                    <span aria-hidden="true">{s.icon}</span> {t(s.labelKey)}
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
                <SectionHeading>{t("settings:sections.account")}</SectionHeading>
                <GlassCard style={{ padding: cardPadding }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: rowGap + 6, flexWrap: "wrap" }}>
                    <ProfilePhotoManager user={user} onUpdate={updateUser} size={compact ? 68 : 88} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: "var(--nv-text-muted, rgba(200,160,255,0.5))", marginBottom: 2 }}>
                        {t("profile:page.photoHint")}
                      </div>
                      <Badge color={user?.authProvider === "google" ? "#9dc9ff" : "#bf7fff"}>
                        {user?.authProvider === "google" ? t("profile:page.authProviderGoogle") : t("profile:page.authProviderEmail")}
                      </Badge>
                    </div>
                  </div>
                  <InfoRow label={t("profile:page.fullName")} value={user?.name || "—"} />
                  <InfoRow label={t("profile:page.email")} value={user?.email || "—"} />
                  <InfoRow label={t("profile:page.memberSince")} value={formatDate(user?.createdAt, language)} />
                </GlassCard>
              </div>
            )}

            {activeSection === "appearance" && (
              <div>
                <SectionHeading>{t("settings:sections.appearance")}</SectionHeading>
                <GlassCard style={{ padding: cardPadding }}>
                  <PreferenceRow
                    title={t("settings:appearance.theme.title")}
                    desc={t("settings:appearance.theme.descCurrentlyUsing", {
                      themeName: resolvedTheme === "dark" ? getTheme("dark").name : getTheme("light").name,
                      systemSuffix: theme === "system" ? t("settings:appearance.theme.systemSuffix") : "",
                    })}
                  >
                    <SegmentedControl
                      ariaLabel={t("settings:appearance.theme.title")}
                      value={theme}
                      onChange={handleThemeChange}
                      options={[
                        { value: "light", label: getTheme("light").name, icon: getTheme("light").icon },
                        { value: "dark", label: getTheme("dark").name, icon: getTheme("dark").icon },
                        { value: "system", label: t("settings:appearance.theme.system"), icon: "🖥️" },
                      ]}
                    />
                  </PreferenceRow>
                  <p style={{ margin: "14px 0 0", fontSize: 11.5, color: "var(--nv-text-muted, rgba(200,160,255,0.45))", lineHeight: 1.5 }}>
                    {t("settings:appearance.persistNote")}
                  </p>
                </GlassCard>

                {/* Multilingual Foundation Phase — Language preference.
                    Switching applies instantly (no page refresh: it flows
                    through context/LanguageContext.jsx -> i18next's
                    changeLanguage(), which re-renders every mounted
                    useTranslation() consumer in place) and persists to
                    this device, same posture as Theme above. Selecting a
                    language whose UI translations aren't shipped yet
                    (see i18n/languages.js's `available` flags) is allowed
                    — it's saved and sent to the backend for future AI
                    localization — but shows an inline note instead of
                    silently doing nothing, since the interface itself
                    stays in English until that language's content ships
                    (Phase 12). */}
                <GlassCard style={{ padding: cardPadding, marginTop: 16 }}>
                  <PreferenceRow title={t("settings:language.title")} desc={t("settings:language.desc")}>
                    <select
                      aria-label={t("settings:language.title")}
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="settings-focusable"
                      style={{
                        padding: "8px 12px", borderRadius: 10, fontSize: 13, fontFamily: "Inter,sans-serif",
                        background: "var(--nv-surface, rgba(255,255,255,0.05))", color: "var(--nv-text-primary, #e8d5ff)",
                        border: "1px solid var(--nv-accent-border, rgba(180,120,255,0.3))", cursor: "pointer",
                        maxWidth: 220,
                      }}
                    >
                      {supportedLanguages.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.nativeName}{l.nativeName !== l.name ? ` (${l.name})` : ""}{!l.available ? " …" : ""}
                        </option>
                      ))}
                    </select>
                  </PreferenceRow>
                  {!supportedLanguages.find((l) => l.code === language)?.available && (
                    <p style={{ margin: "14px 0 0", fontSize: 11.5, color: "var(--nv-text-muted, rgba(200,160,255,0.45))", lineHeight: 1.5 }}>
                      {t("settings:language.comingSoon", {
                        language: supportedLanguages.find((l) => l.code === language)?.name || language,
                      })}
                    </p>
                  )}
                </GlassCard>
              </div>
            )}

            {activeSection === "preferences" && (
              <div>
                <SectionHeading>{t("settings:sections.preferences")}</SectionHeading>
                <GlassCard style={{ padding: cardPadding }}>
                  <PreferenceRow title={t("settings:preferences.dashboardView.title")} desc={t("settings:preferences.dashboardView.desc")}>
                    <SegmentedControl
                      ariaLabel={t("settings:preferences.dashboardView.title")}
                      value={preferences.dashboardView}
                      onChange={handleDashboardViewChange}
                      options={[
                        { value: "grid", label: t("settings:preferences.grid"), icon: "▦" },
                        { value: "list", label: t("settings:preferences.list"), icon: "☰" },
                      ]}
                    />
                  </PreferenceRow>
                  <PreferenceRow title={t("settings:preferences.animationLevel.title")} desc={t("settings:preferences.animationLevel.desc")}>
                    <SegmentedControl
                      ariaLabel={t("settings:preferences.animationLevel.title")}
                      value={preferences.animationLevel}
                      onChange={handleAnimationLevelChange}
                      options={[
                        { value: "full", label: t("settings:preferences.animationOptions.full") },
                        { value: "reduced", label: t("settings:preferences.animationOptions.reduced") },
                        { value: "none", label: t("settings:preferences.animationOptions.none") },
                      ]}
                    />
                  </PreferenceRow>
                  <PreferenceRow title={t("settings:preferences.compactMode.title")} desc={t("settings:preferences.compactMode.desc")}>
                    <ToggleSwitch checked={preferences.compactMode} onChange={handleCompactModeChange} label={t("settings:preferences.compactMode.title")} />
                  </PreferenceRow>
                  <PreferenceRow title={t("settings:preferences.rememberLastSection.title")} desc={t("settings:preferences.rememberLastSection.desc")}>
                    <ToggleSwitch checked={preferences.rememberLastSection} onChange={handleRememberSectionChange} label={t("settings:preferences.rememberLastSection.title")} />
                  </PreferenceRow>
                  <PreferenceRow title={t("settings:preferences.reportTab.title")} desc={t("settings:preferences.reportTab.desc")}>
                    <SegmentedControl
                      ariaLabel={t("settings:preferences.reportTab.title")}
                      value={preferences.reportTab}
                      onChange={handleReportTabChange}
                      options={TABS.map((t) => ({ value: t.id, label: t.label, icon: t.icon }))}
                    />
                  </PreferenceRow>
                  <PreferenceRow title={t("settings:preferences.horoscopeView.title")} desc={t("settings:preferences.horoscopeView.desc")}>
                    <SegmentedControl
                      ariaLabel={t("settings:preferences.horoscopeView.title")}
                      value={preferences.horoscopeView}
                      onChange={handleHoroscopeViewChange}
                      options={HOROSCOPE_VIEW_OPTIONS.map((o) => ({ ...o, label: t(`settings:periods.${o.value}`) }))}
                    />
                  </PreferenceRow>
                  <PreferenceRow title={t("settings:preferences.calendarView.title")} desc={t("settings:preferences.calendarView.desc")}>
                    <SegmentedControl
                      ariaLabel={t("settings:preferences.calendarView.title")}
                      value={preferences.calendarView}
                      onChange={handleCalendarViewChange}
                      options={CALENDAR_VIEW_OPTIONS.map((o) => ({ ...o, label: o.value === "full" ? t("settings:preferences.calendarOptions.allSections") : t("settings:preferences.calendarOptions.timeline") }))}
                    />
                  </PreferenceRow>
                  <PreferenceRow title={t("settings:preferences.aiResponseLength.title")} desc={t("settings:preferences.aiResponseLength.desc")}>
                    <SegmentedControl
                      ariaLabel={t("settings:preferences.aiResponseLength.title")}
                      value={preferences.aiResponseLength}
                      onChange={handleAiResponseLengthChange}
                      options={AI_RESPONSE_LENGTH_OPTIONS.map((o) => ({ ...o, label: t(`settings:preferences.aiResponseOptions.${o.value}`) }))}
                    />
                  </PreferenceRow>
                  <PreferenceRow title={t("settings:preferences.rememberLastReport.title")} desc={t("settings:preferences.rememberLastReport.desc")}>
                    <ToggleSwitch checked={preferences.rememberLastReport} onChange={handleRememberLastReportChange} label={t("settings:preferences.rememberLastReport.title")} />
                  </PreferenceRow>
                  <PreferenceRow title={t("settings:preferences.showWelcomeAnimation.title")} desc={t("settings:preferences.showWelcomeAnimation.desc")}>
                    <ToggleSwitch checked={preferences.showWelcomeAnimation} onChange={handleShowWelcomeAnimationChange} label={t("settings:preferences.showWelcomeAnimation.title")} />
                  </PreferenceRow>
                  <PreferenceRow title={t("settings:preferences.commandPaletteHint.title")} desc={t("settings:preferences.commandPaletteHint.desc")}>
                    <ToggleSwitch checked={preferences.commandPaletteHint} onChange={handleCommandPaletteHintChange} label={t("settings:preferences.commandPaletteHint.title")} />
                  </PreferenceRow>
                </GlassCard>
              </div>
            )}

            {activeSection === "privacy" && (
              <div>
                <SectionHeading>{t("settings:sections.privacy")}</SectionHeading>
                <GlassCard style={{ padding: cardPadding, display: "grid", gap: 14 }}>
                  <PreferenceRow title={t("settings:privacy.exportData.title")} desc={t("settings:privacy.exportData.desc")}>
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
                      {exporting ? t("settings:privacy.exportData.preparing") : t("settings:privacy.exportData.button")}
                    </button>
                  </PreferenceRow>
                  <PreferenceRow title={t("settings:privacy.clearCache.title")} desc={t("settings:privacy.clearCache.desc")}>
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
                      {t("settings:privacy.clearCache.button")}
                    </button>
                  </PreferenceRow>
                  <PreferenceRow title={t("settings:privacy.resetPrefs.title")} desc={t("settings:privacy.resetPrefs.desc")}>
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
                      {t("settings:privacy.resetPrefs.button")}
                    </button>
                  </PreferenceRow>
                </GlassCard>
              </div>
            )}

            {activeSection === "about" && (
              <div>
                <SectionHeading>{t("settings:sections.about")}</SectionHeading>
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
                  <InfoRow label={t("settings:about.currentRelease", "Current Release")} value={RELEASE_LABEL} />
                  <InfoRow label={t("settings:about.applicationVersion", "Application Version")} value={APP_VERSION} />
                  <InfoRow label={t("settings:about.build", "Build")} value={BUILD_LABEL} />
                  <InfoRow label={t("settings:about.developer", "Developer")} value="NakshatraVerse Team" />
                  <p style={{ margin: "14px 0 0", fontSize: 11.5, color: "var(--nv-text-muted, rgba(200,160,255,0.5))", lineHeight: 1.5 }}>
                    {t("common:app.tagline", "Authentic Vedic astrology, explained by AI — your cosmic blueprint, made clear.")}
                  </p>
                  <p style={{ margin: "16px 0 0", fontSize: 11, color: "rgba(180,130,255,0.4)" }}>
                    {t("common:footer.copyright", { year: new Date().getFullYear(), defaultValue: `© ${new Date().getFullYear()} NakshatraVerse. All rights reserved.` })}
                  </p>
                  <h3 style={{ margin: "20px 0 8px", fontSize: 11.5, letterSpacing: 1, textTransform: "uppercase", color: "var(--nv-text-muted, rgba(200,160,255,0.5))" }}>
                    {t("settings:about.openSourceLibraries", "Open Source Libraries")}
                  </h3>
                  <InfoRow label="React" value="MIT" />
                  <InfoRow label="React DOM" value="MIT" />
                  <p style={{ margin: "10px 0 0", fontSize: 11, color: "rgba(180,130,255,0.4)", lineHeight: 1.5 }}>
                    {t("settings:about.licenseNotice", "This build does not yet bundle a full third-party license audit.")}
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
        confirmLabel={confirmAction ? confirmCopy[confirmAction].confirmLabel : t("common:confirmDialog.confirm")}
        loadingLabel={confirmAction ? confirmCopy[confirmAction].loadingLabel : undefined}
        cancelLabel={t("common:confirmDialog.cancel")}
        danger
        loading={confirmBusy}
        onConfirm={runConfirmedAction}
        onCancel={closeConfirm}
      />
    </div>
  );
}

export default SettingsPage;
