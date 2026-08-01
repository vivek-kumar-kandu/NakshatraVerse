import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, isRtlLanguage } from "../i18n/languages.js";
import { LANGUAGE_STORAGE_KEY } from "../i18n/index.js";
import i18nInstance from "../i18n/index.js";
import { setActiveLanguage } from "../utils/api.js";

// ─────────────────────────────────────────────────────────────────────────
// LanguageContext (Multilingual Foundation Phase)
//
// Same shape/rationale as ThemeContext.jsx (see that file's header): one
// small, additive React context mounted once at the app root, persisted
// client-side under its own `nv_`-prefixed localStorage key, applied
// app-wide via a single pair of attributes on <html> (`lang` + `dir`),
// with no backend schema change required.
//
// This is the ONE place the rest of the app should read/change the active
// language from — components call `useLanguage()`, never i18next directly
// for the *selected* language (they still call `useTranslation()` to
// render translated strings, same as always). Centralizing it here is
// what Phase 7 ("Global Language State" / "Never duplicate language
// state — Frontend, Backend, AI, Reports, Notifications must always stay
// synchronized") means in practice on the frontend side:
//   - it drives i18next's active language (UI text)
//   - it sets <html lang>/<html dir> (accessibility + RTL layout)
//   - it is read by utils/api.js's authFetch/generateAstroReport and sent
//     as the `X-User-Language` header on every backend request, which is
//     exactly what middleware/language.js's negotiation priority (Query >
//     User Setting > JWT > Accept-Language > Default) treats as the
//     "User Setting" tier — so a backend AI response and the frontend UI
//     never disagree about which language is active.
//
// All 15 languages in i18n/languages.js's `available: true` set now ship
// real translated UI content — choosing any of them updates this
// context/persists/sends the header, driving both the UI text (via
// i18next) and the AI's response language (via the X-User-Language
// header — see backend/services/localization/aiLanguageInstruction.js).
// Only a language with `available: false` (the aspirational future-
// language list) falls back to English, exactly like i18next's own
// fallbackLng.
// ─────────────────────────────────────────────────────────────────────────

function readStoredLanguage() {
  try {
    const raw = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return raw && SUPPORTED_LANGUAGES.some((l) => l.code === raw) ? raw : null;
  } catch {
    return null;
  }
}

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState(() => readStoredLanguage() || i18n.language?.split("-")[0] || DEFAULT_LANGUAGE);

  // Apply <html lang>/<html dir>, persist, and keep utils/api.js's outgoing
  // X-User-Language header in sync whenever the selected language changes
  // — including on first mount, so a persisted choice from a previous
  // visit is honored (and sent to the backend) before any request fires.
  useEffect(() => {
    try {
      document.documentElement.setAttribute("lang", language);
      document.documentElement.setAttribute("dir", isRtlLanguage(language) ? "rtl" : "ltr");
    } catch {
      // no-op outside a DOM environment
    }
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Storage unavailable — language still applies for this session, it
      // just won't be remembered on the next visit (same posture as
      // ThemeContext's own localStorage write).
    }
    setActiveLanguage(language);
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  const setLanguage = useCallback((next) => {
    if (!SUPPORTED_LANGUAGES.some((l) => l.code === next)) return;
    setLanguageState(next);
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      supportedLanguages: SUPPORTED_LANGUAGES,
      isRtl: isRtlLanguage(language),
    }),
    [language, setLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (ctx) return ctx;
  // No LanguageProvider ancestor (e.g. a component under test is rendered
  // in isolation, the same situation useTranslation() already handles by
  // quietly falling back to the shared i18next singleton instead of
  // throwing). Mirror that: read the app's real current language directly
  // off the same i18n instance every useTranslation() call already uses,
  // rather than a hardcoded default, so this fallback still reflects
  // reality if i18next has already been initialized/changed elsewhere.
  // setLanguage becomes a no-op with a dev-time warning — there is no
  // Provider here to persist the change to, so silently doing nothing
  // would be more confusing than saying so.
  const lang = (i18nInstance.language || DEFAULT_LANGUAGE).split("-")[0];
  return {
    language: lang,
    setLanguage: () => {
      if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
        // eslint-disable-next-line no-console
        console.warn("useLanguage(): no LanguageProvider ancestor found; setLanguage() is a no-op here.");
      }
    },
    supportedLanguages: SUPPORTED_LANGUAGES,
    isRtl: isRtlLanguage(lang),
  };
}

export default LanguageContext;
