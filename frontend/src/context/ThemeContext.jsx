import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { applyAnimationLevel, readPreferences } from "../utils/settingsStorage.js";

// ─────────────────────────────────────────────────────────────────────────
// ThemeContext (Phase 6.4 — Account Settings & Preferences: Appearance)
//
// Adds Light / Dark / System theme selection, persisted client-side (no
// backend endpoint — same "settings-only, no new API" scope as the rest of
// this phase) and applied app-wide via a single `data-theme="light"|"dark"`
// attribute on <html>. `styles/global.css` defines the actual color tokens
// for each mode (new, additive `:root` / `[data-theme="light"]` custom
// properties); this file only ever decides *which* mode is active.
//
// "Applied consistently throughout the application" is honored via two
// small, additive changes to the shared design-system primitives every
// page already renders through — CosmicBg's background wash and
// GlassCard's surface — which now read these CSS variables instead of
// hardcoded hex values, with the dark-mode value identical to the
// original hardcoded one. Nothing else (Dashboard's own layout/logic,
// AccountMenu, ProfilePhotoManager, any page's bespoke inline colors) is
// touched, per this phase's "preserve the existing design language, don't
// redesign unrelated pages" scope — see PHASE_6_4_NOTES for the full
// rationale.
//
// This module also applies the persisted Animation Level preference once
// on first mount (see utils/settingsStorage.js#applyAnimationLevel) so it
// takes effect app-wide on every load, not only while the Settings page
// happens to be open.
// ─────────────────────────────────────────────────────────────────────────

const THEME_KEY = "nv_theme";
const VALID_MODES = ["light", "dark", "system"];

function readStoredMode() {
  try {
    const raw = window.localStorage.getItem(THEME_KEY);
    return VALID_MODES.includes(raw) ? raw : "system";
  } catch {
    return "system";
  }
}

function systemPrefersDark() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function resolve(mode) {
  if (mode === "system") return systemPrefersDark() ? "dark" : "light";
  return mode;
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(readStoredMode);
  const [resolvedTheme, setResolvedTheme] = useState(() => resolve(mode));

  // Apply the resolved theme to <html> whenever it changes, and persist an
  // explicit (non-"system") choice. "system" itself is still written so
  // the choice of *following* the OS is remembered, not just its result.
  useEffect(() => {
    const next = resolve(mode);
    setResolvedTheme(next);
    try {
      document.documentElement.setAttribute("data-theme", next);
    } catch {
      // no-op outside a DOM environment
    }
    try {
      window.localStorage.setItem(THEME_KEY, mode);
    } catch {
      // Storage unavailable — theme still applies for this session, it
      // just won't be remembered on the next visit.
    }
  }, [mode]);

  // Live-follow the OS setting while "system" is selected.
  useEffect(() => {
    if (mode !== "system" || typeof window.matchMedia !== "function") return undefined;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => setResolvedTheme(resolve("system"));
    mq.addEventListener?.("change", handleChange);
    return () => mq.removeEventListener?.("change", handleChange);
  }, [mode]);

  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-theme", resolvedTheme);
    } catch {
      // no-op outside a DOM environment
    }
  }, [resolvedTheme]);

  // Animation Level preference (Preferences section) — independent of
  // theme, but applied once at the same app-root mount point so it's
  // active on every page from the very first load, not just after a
  // visit to Settings.
  useEffect(() => {
    applyAnimationLevel(readPreferences().animationLevel);
  }, []);

  const setTheme = useCallback((next) => {
    if (!VALID_MODES.includes(next)) return;
    setMode(next);
  }, []);

  const value = useMemo(() => ({ theme: mode, resolvedTheme, setTheme }), [mode, resolvedTheme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

export default ThemeContext;
