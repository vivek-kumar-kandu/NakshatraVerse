// ─────────────────────────────────────────────────────────────────────────
// settingsStorage (Phase 6.4 — Account Settings & Preferences)
//
// Client-side persistence for everything the new Settings page owns:
// user preferences (dashboard view, animation level, compact mode, "remember
// last opened section") and the small set of Privacy actions (export /
// clear-cache / reset). No backend endpoint exists or is added for any of
// this — same "persist client-side, keyed under the app's existing `nv_`
// localStorage prefix" pattern already established by utils/profilePhoto.js
// (`nv_profile_photo_<id>`) and LoginPage's `nv_remember_me`. Theme itself
// lives in its own small module (context/ThemeContext.jsx) since it needs a
// reactive React context; everything here is plain read/write helpers.
// ─────────────────────────────────────────────────────────────────────────

const PREFS_KEY = "nv_preferences";

export const DEFAULT_PREFERENCES = {
  dashboardView: "grid", // "grid" | "list" — read once by SavedReportsPage as its initial Saved Reports view
  animationLevel: "full", // "full" | "reduced" | "none"
  compactMode: false,
  rememberLastSection: true,
  lastSection: "account", // only meaningful when rememberLastSection is true

  // ── V3.0 Final Enhancement: User Preferences & Personalization ────────
  // Every field below follows the exact same "read once as an initial
  // default, frontend-only, no backend" pattern as the fields above —
  // each is only ever consulted by an existing page as the starting
  // value for a piece of state that page already owned (activeTab,
  // period, etc.). No new astrology/report/AI-assistant logic is added
  // anywhere; these only decide what already-existing UI shows first.
  reportTab: "overview", // read once by ResultsPage as its initial report tab (see constants/astrology.js TABS)
  horoscopeView: "daily", // "daily" | "weekly" | "monthly" — read once by HoroscopePage as its initial period
  calendarView: "full", // "full" | "timeline" — read once by CalendarPage as its initial view
  aiResponseLength: "balanced", // "concise" | "balanced" | "detailed" — appended as a phrasing hint on outgoing AI Assistant questions only; never changes the assistant endpoint, history shape, or displayed chat text
  rememberLastReport: false, // when true, opening a saved report is remembered so Dashboard can offer to reopen it
  lastOpenedReportId: null, // written automatically (not a direct toggle) whenever rememberLastReport is on and a report is opened
  showWelcomeAnimation: true, // when false, skips the one-time SplashScreen on app load (same per-tab "only once" semantics either way)
  commandPaletteHint: true, // when true, shows a single dismissible one-time tip about the ⌘K / Ctrl+K shortcut after first reaching the Dashboard

  // ── V4.2 — Family Profiles & Relationship Hub ──────────────────────────
  // Same "written automatically, read once as an initial default" pattern
  // as lastOpenedReportId above — no toggle of its own (always tracked,
  // mirroring how the backend's own lastOpenedAt/"Recently Opened" tracking
  // is always-on). Written whenever a saved Family Profile is opened
  // (FamilyProfilesPage) or used as one side of a comparison
  // (RelationshipHubPage), and read once as the initial "Profile A"
  // selection the next time Relationship Hub is reached without an
  // explicit preset (e.g. via Dashboard/ActionDock/CommandPalette rather
  // than a specific profile card's "Compare" button), so picking up where
  // you left off doesn't require re-selecting the same profile.
  activeProfileId: null,
};

function safeParse(raw) {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

// Always returns a complete, valid preferences object — merges whatever is
// actually in storage over the defaults, so a partial/older/corrupt value
// never leaves a field `undefined` for a caller to trip over.
export function readPreferences() {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    return { ...DEFAULT_PREFERENCES, ...safeParse(raw) };
  } catch {
    // Storage unavailable (private browsing lockdown, etc.) — behave as if
    // nothing has been customized yet rather than throwing.
    return { ...DEFAULT_PREFERENCES };
  }
}

export function writePreferences(patch) {
  const next = { ...readPreferences(), ...patch };
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  } catch {
    throw new Error("Could not save your preferences — your browser storage may be full or unavailable.");
  }
  return next;
}

export function resetPreferences() {
  try {
    window.localStorage.removeItem(PREFS_KEY);
  } catch {
    // no-op — nothing to clean up if storage isn't reachable
  }
  return { ...DEFAULT_PREFERENCES };
}

// ── Appearance: animation level ─────────────────────────────────────────
// Mirrors the app's existing `prefers-reduced-motion` handling (see
// utils/motionPreference.js and the matching @media block in
// styles/global.css) via a `data-motion` attribute on <html>, so both the
// OS-level preference and this explicit in-app override land on the same
// CSS. "full" removes the attribute entirely (default, unchanged
// behavior); "reduced" and "none" both map onto the app's existing
// near-instant-animation CSS rule — "none" additionally disables
// JS-driven smooth scrolling (see utils/motionPreference.js).
export function applyAnimationLevel(level) {
  try {
    const root = document.documentElement;
    if (level === "reduced" || level === "none") {
      root.setAttribute("data-motion", level);
    } else {
      root.removeAttribute("data-motion");
    }
  } catch {
    // no-op in non-DOM environments (SSR/tests without jsdom `document`)
  }
}

// ── AI Response Length ───────────────────────────────────────────────────
// A short, natural-language phrasing hint appended to the *outgoing*
// question text AIAssistantPage sends to POST /api/assistant/chat — never
// to the message shown in the chat thread. This does not touch the
// assistant endpoint, its request shape, or any AI Assistant logic; it
// only adjusts the wording of the question itself, the same way the
// app's own "Explain this" buttons already build question text (see
// HoroscopePage/CalendarPage's `explain*` helpers). "balanced" (the
// default) adds nothing, preserving today's exact behavior.
const RESPONSE_LENGTH_HINTS = {
  concise: "Please answer concisely, in a few short sentences.",
  balanced: "",
  detailed: "Please answer in detail, with thorough explanation.",
};

export function getAiResponseLengthHint(level) {
  return RESPONSE_LENGTH_HINTS[level] || "";
}

// ── Privacy actions ──────────────────────────────────────────────────────

// Clears only genuinely transient/cached client state — never the account
// itself, never saved reports (server-side), and deliberately never the
// locally-stored profile photo (Phase 6.3), which is real user data
// standing in for a not-yet-existing upload endpoint, not a cache.
// Currently this is the splash-screen "seen this launch" flag; written as
// a small allowlist so any future purely-decorative/session cache added
// under the `nv_` prefix has one obvious place to be registered.
const CLEARABLE_SESSION_KEYS = ["nv_splash_seen", "nv_cmdk_hint_seen"];

export function clearLocalCachedData() {
  const cleared = [];
  try {
    for (const key of CLEARABLE_SESSION_KEYS) {
      if (window.sessionStorage.getItem(key) !== null) {
        window.sessionStorage.removeItem(key);
        cleared.push(key);
      }
    }
  } catch {
    // Storage unavailable — nothing to report as cleared.
  }
  return cleared;
}

// Builds a downloadable JSON export of everything this account has that
// the frontend can already see: profile fields off the existing `user`
// object (from GET /api/auth/me, no new call), saved reports (the exact
// same array DashboardPage already lists via reportsApi.listReports() —
// callers pass it in rather than this module re-fetching), and this
// device's local settings. No new backend endpoint — purely a client-side
// snapshot of already-fetched data.
export function exportAccountData({ user, reports, theme, preferences } = {}) {
  const payload = {
    exportedAt: new Date().toISOString(),
    account: user
      ? {
          name: user.name ?? null,
          email: user.email ?? null,
          authProvider: user.authProvider ?? null,
          memberSince: user.createdAt ?? null,
        }
      : null,
    savedReports: Array.isArray(reports)
      ? reports.map((r) => ({
          id: r.id,
          title: r.title,
          createdAt: r.createdAt,
          lagna: r.lagna,
        }))
      : [],
    settings: {
      theme: theme ?? "system",
      preferences: preferences ?? DEFAULT_PREFERENCES,
    },
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const datePart = payload.exportedAt.slice(0, 10);
  link.download = `nakshatraverse-account-data-${datePart}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  return payload;
}

export default {
  DEFAULT_PREFERENCES,
  readPreferences,
  writePreferences,
  resetPreferences,
  applyAnimationLevel,
  getAiResponseLengthHint,
  clearLocalCachedData,
  exportAccountData,
};
