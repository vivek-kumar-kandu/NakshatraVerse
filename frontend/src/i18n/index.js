// ─────────────────────────────────────────────────────────────────────────
// i18n configuration (Multilingual Foundation Phase)
//
// Requirements this satisfies (migration spec, Phase 2):
//   - namespace-based translations       → NAMESPACES (i18n/namespaces.js)
//   - lazy loading + code splitting       → custom backend below: each
//                                            namespace is a dynamic
//                                            import(), which Vite turns
//                                            into its own chunk, fetched
//                                            only when a component that
//                                            uses it actually renders
//   - fallback language                   → fallbackLng: DEFAULT_LANGUAGE
//   - automatic language detection        → i18next-browser-language-
//                                            detector (localStorage, then
//                                            navigator)
//   - persistent language preference      → same detector, caches to
//                                            localStorage under
//                                            LANGUAGE_STORAGE_KEY (also
//                                            read/written directly by
//                                            context/LanguageContext.jsx,
//                                            which is the single source of
//                                            truth the rest of the app
//                                            reads from — see that file's
//                                            header)
//   - RTL-ready architecture              → context/LanguageContext.jsx
//                                            sets <html dir="rtl|ltr">
//                                            from i18n/languages.js's
//                                            per-language `rtl` flag
//   - no duplicated strings/no hardcoded  → every migrated component uses
//     user-facing text                      t("namespace.key") exclusively
//
// This app has no static file server for locale JSON (it's a Vite SPA
// with no backend "public" folder route for them), so rather than
// i18next-http-backend (which fetches over HTTP), namespaces are lazily
// imported as ES modules — the standard react-i18next pattern for bundler-
// based lazy loading, and what actually gives Vite something to code-split
// on.
// ─────────────────────────────────────────────────────────────────────────
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { DEFAULT_LANGUAGE } from "./languages.js";
import { NAMESPACES, DEFAULT_NAMESPACE } from "./namespaces.js";

export const LANGUAGE_STORAGE_KEY = "nv_language";

// Every namespace is imported as its own dynamic import() within each
// language's map below — the map itself is only touched (so the import()
// only fires) when that language is actually requested, which is what
// makes this lazy per-language. All 15 languages ship real locale JSON,
// not just "en".
const LOADERS = {
  en: {
    common: () => import("../locales/en/common.json"),
    auth: () => import("../locales/en/auth.json"),
    dashboard: () => import("../locales/en/dashboard.json"),
    reports: () => import("../locales/en/reports.json"),
    results: () => import("../locales/en/results.json"),
    home: () => import("../locales/en/home.json"),
    family: () => import("../locales/en/family.json"),
    notifications: () => import("../locales/en/notifications.json"),
    settings: () => import("../locales/en/settings.json"),
    festival: () => import("../locales/en/festival.json"),
    explorer: () => import("../locales/en/explorer.json"),
    timeline: () => import("../locales/en/timeline.json"),
    lifeCoach: () => import("../locales/en/lifeCoach.json"),
    validation: () => import("../locales/en/validation.json"),
    errors: () => import("../locales/en/errors.json"),
    profile: () => import("../locales/en/profile.json"),
    navigation: () => import("../locales/en/navigation.json"),
  },
  hi: {
    common: () => import("../locales/hi/common.json"),
    auth: () => import("../locales/hi/auth.json"),
    dashboard: () => import("../locales/hi/dashboard.json"),
    reports: () => import("../locales/hi/reports.json"),
    results: () => import("../locales/hi/results.json"),
    home: () => import("../locales/hi/home.json"),
    family: () => import("../locales/hi/family.json"),
    notifications: () => import("../locales/hi/notifications.json"),
    settings: () => import("../locales/hi/settings.json"),
    festival: () => import("../locales/hi/festival.json"),
    explorer: () => import("../locales/hi/explorer.json"),
    timeline: () => import("../locales/hi/timeline.json"),
    lifeCoach: () => import("../locales/hi/lifeCoach.json"),
    validation: () => import("../locales/hi/validation.json"),
    errors: () => import("../locales/hi/errors.json"),
    profile: () => import("../locales/hi/profile.json"),
    navigation: () => import("../locales/hi/navigation.json"),
  },
  sa: {
    common: () => import("../locales/sa/common.json"),
    auth: () => import("../locales/sa/auth.json"),
    dashboard: () => import("../locales/sa/dashboard.json"),
    reports: () => import("../locales/sa/reports.json"),
    results: () => import("../locales/sa/results.json"),
    home: () => import("../locales/sa/home.json"),
    family: () => import("../locales/sa/family.json"),
    notifications: () => import("../locales/sa/notifications.json"),
    settings: () => import("../locales/sa/settings.json"),
    festival: () => import("../locales/sa/festival.json"),
    explorer: () => import("../locales/sa/explorer.json"),
    timeline: () => import("../locales/sa/timeline.json"),
    lifeCoach: () => import("../locales/sa/lifeCoach.json"),
    validation: () => import("../locales/sa/validation.json"),
    errors: () => import("../locales/sa/errors.json"),
    profile: () => import("../locales/sa/profile.json"),
    navigation: () => import("../locales/sa/navigation.json"),
  },
  mr: {
    common: () => import("../locales/mr/common.json"),
    auth: () => import("../locales/mr/auth.json"),
    dashboard: () => import("../locales/mr/dashboard.json"),
    reports: () => import("../locales/mr/reports.json"),
    results: () => import("../locales/mr/results.json"),
    home: () => import("../locales/mr/home.json"),
    family: () => import("../locales/mr/family.json"),
    notifications: () => import("../locales/mr/notifications.json"),
    settings: () => import("../locales/mr/settings.json"),
    festival: () => import("../locales/mr/festival.json"),
    explorer: () => import("../locales/mr/explorer.json"),
    timeline: () => import("../locales/mr/timeline.json"),
    lifeCoach: () => import("../locales/mr/lifeCoach.json"),
    validation: () => import("../locales/mr/validation.json"),
    errors: () => import("../locales/mr/errors.json"),
    profile: () => import("../locales/mr/profile.json"),
    navigation: () => import("../locales/mr/navigation.json"),
  },
  gu: {
    common: () => import("../locales/gu/common.json"),
    auth: () => import("../locales/gu/auth.json"),
    dashboard: () => import("../locales/gu/dashboard.json"),
    reports: () => import("../locales/gu/reports.json"),
    results: () => import("../locales/gu/results.json"),
    home: () => import("../locales/gu/home.json"),
    family: () => import("../locales/gu/family.json"),
    notifications: () => import("../locales/gu/notifications.json"),
    settings: () => import("../locales/gu/settings.json"),
    festival: () => import("../locales/gu/festival.json"),
    explorer: () => import("../locales/gu/explorer.json"),
    timeline: () => import("../locales/gu/timeline.json"),
    lifeCoach: () => import("../locales/gu/lifeCoach.json"),
    validation: () => import("../locales/gu/validation.json"),
    errors: () => import("../locales/gu/errors.json"),
    profile: () => import("../locales/gu/profile.json"),
    navigation: () => import("../locales/gu/navigation.json"),
  },
  pa: {
    common: () => import("../locales/pa/common.json"),
    auth: () => import("../locales/pa/auth.json"),
    dashboard: () => import("../locales/pa/dashboard.json"),
    reports: () => import("../locales/pa/reports.json"),
    results: () => import("../locales/pa/results.json"),
    home: () => import("../locales/pa/home.json"),
    family: () => import("../locales/pa/family.json"),
    notifications: () => import("../locales/pa/notifications.json"),
    settings: () => import("../locales/pa/settings.json"),
    festival: () => import("../locales/pa/festival.json"),
    explorer: () => import("../locales/pa/explorer.json"),
    timeline: () => import("../locales/pa/timeline.json"),
    lifeCoach: () => import("../locales/pa/lifeCoach.json"),
    validation: () => import("../locales/pa/validation.json"),
    errors: () => import("../locales/pa/errors.json"),
    profile: () => import("../locales/pa/profile.json"),
    navigation: () => import("../locales/pa/navigation.json"),
  },
  bn: {
    common: () => import("../locales/bn/common.json"),
    auth: () => import("../locales/bn/auth.json"),
    dashboard: () => import("../locales/bn/dashboard.json"),
    reports: () => import("../locales/bn/reports.json"),
    results: () => import("../locales/bn/results.json"),
    home: () => import("../locales/bn/home.json"),
    family: () => import("../locales/bn/family.json"),
    notifications: () => import("../locales/bn/notifications.json"),
    settings: () => import("../locales/bn/settings.json"),
    festival: () => import("../locales/bn/festival.json"),
    explorer: () => import("../locales/bn/explorer.json"),
    timeline: () => import("../locales/bn/timeline.json"),
    lifeCoach: () => import("../locales/bn/lifeCoach.json"),
    validation: () => import("../locales/bn/validation.json"),
    errors: () => import("../locales/bn/errors.json"),
    profile: () => import("../locales/bn/profile.json"),
    navigation: () => import("../locales/bn/navigation.json"),
  },
  ta: {
    common: () => import("../locales/ta/common.json"),
    auth: () => import("../locales/ta/auth.json"),
    dashboard: () => import("../locales/ta/dashboard.json"),
    reports: () => import("../locales/ta/reports.json"),
    results: () => import("../locales/ta/results.json"),
    home: () => import("../locales/ta/home.json"),
    family: () => import("../locales/ta/family.json"),
    notifications: () => import("../locales/ta/notifications.json"),
    settings: () => import("../locales/ta/settings.json"),
    festival: () => import("../locales/ta/festival.json"),
    explorer: () => import("../locales/ta/explorer.json"),
    timeline: () => import("../locales/ta/timeline.json"),
    lifeCoach: () => import("../locales/ta/lifeCoach.json"),
    validation: () => import("../locales/ta/validation.json"),
    errors: () => import("../locales/ta/errors.json"),
    profile: () => import("../locales/ta/profile.json"),
    navigation: () => import("../locales/ta/navigation.json"),
  },
  te: {
    common: () => import("../locales/te/common.json"),
    auth: () => import("../locales/te/auth.json"),
    dashboard: () => import("../locales/te/dashboard.json"),
    reports: () => import("../locales/te/reports.json"),
    results: () => import("../locales/te/results.json"),
    home: () => import("../locales/te/home.json"),
    family: () => import("../locales/te/family.json"),
    notifications: () => import("../locales/te/notifications.json"),
    settings: () => import("../locales/te/settings.json"),
    festival: () => import("../locales/te/festival.json"),
    explorer: () => import("../locales/te/explorer.json"),
    timeline: () => import("../locales/te/timeline.json"),
    lifeCoach: () => import("../locales/te/lifeCoach.json"),
    validation: () => import("../locales/te/validation.json"),
    errors: () => import("../locales/te/errors.json"),
    profile: () => import("../locales/te/profile.json"),
    navigation: () => import("../locales/te/navigation.json"),
  },
  kn: {
    common: () => import("../locales/kn/common.json"),
    auth: () => import("../locales/kn/auth.json"),
    dashboard: () => import("../locales/kn/dashboard.json"),
    reports: () => import("../locales/kn/reports.json"),
    results: () => import("../locales/kn/results.json"),
    home: () => import("../locales/kn/home.json"),
    family: () => import("../locales/kn/family.json"),
    notifications: () => import("../locales/kn/notifications.json"),
    settings: () => import("../locales/kn/settings.json"),
    festival: () => import("../locales/kn/festival.json"),
    explorer: () => import("../locales/kn/explorer.json"),
    timeline: () => import("../locales/kn/timeline.json"),
    lifeCoach: () => import("../locales/kn/lifeCoach.json"),
    validation: () => import("../locales/kn/validation.json"),
    errors: () => import("../locales/kn/errors.json"),
    profile: () => import("../locales/kn/profile.json"),
    navigation: () => import("../locales/kn/navigation.json"),
  },
  ml: {
    common: () => import("../locales/ml/common.json"),
    auth: () => import("../locales/ml/auth.json"),
    dashboard: () => import("../locales/ml/dashboard.json"),
    reports: () => import("../locales/ml/reports.json"),
    results: () => import("../locales/ml/results.json"),
    home: () => import("../locales/ml/home.json"),
    family: () => import("../locales/ml/family.json"),
    notifications: () => import("../locales/ml/notifications.json"),
    settings: () => import("../locales/ml/settings.json"),
    festival: () => import("../locales/ml/festival.json"),
    explorer: () => import("../locales/ml/explorer.json"),
    timeline: () => import("../locales/ml/timeline.json"),
    lifeCoach: () => import("../locales/ml/lifeCoach.json"),
    validation: () => import("../locales/ml/validation.json"),
    errors: () => import("../locales/ml/errors.json"),
    profile: () => import("../locales/ml/profile.json"),
    navigation: () => import("../locales/ml/navigation.json"),
  },
  or: {
    common: () => import("../locales/or/common.json"),
    auth: () => import("../locales/or/auth.json"),
    dashboard: () => import("../locales/or/dashboard.json"),
    reports: () => import("../locales/or/reports.json"),
    results: () => import("../locales/or/results.json"),
    home: () => import("../locales/or/home.json"),
    family: () => import("../locales/or/family.json"),
    notifications: () => import("../locales/or/notifications.json"),
    settings: () => import("../locales/or/settings.json"),
    festival: () => import("../locales/or/festival.json"),
    explorer: () => import("../locales/or/explorer.json"),
    timeline: () => import("../locales/or/timeline.json"),
    lifeCoach: () => import("../locales/or/lifeCoach.json"),
    validation: () => import("../locales/or/validation.json"),
    errors: () => import("../locales/or/errors.json"),
    profile: () => import("../locales/or/profile.json"),
    navigation: () => import("../locales/or/navigation.json"),
  },
  as: {
    common: () => import("../locales/as/common.json"),
    auth: () => import("../locales/as/auth.json"),
    dashboard: () => import("../locales/as/dashboard.json"),
    reports: () => import("../locales/as/reports.json"),
    results: () => import("../locales/as/results.json"),
    home: () => import("../locales/as/home.json"),
    family: () => import("../locales/as/family.json"),
    notifications: () => import("../locales/as/notifications.json"),
    settings: () => import("../locales/as/settings.json"),
    festival: () => import("../locales/as/festival.json"),
    explorer: () => import("../locales/as/explorer.json"),
    timeline: () => import("../locales/as/timeline.json"),
    lifeCoach: () => import("../locales/as/lifeCoach.json"),
    validation: () => import("../locales/as/validation.json"),
    errors: () => import("../locales/as/errors.json"),
    profile: () => import("../locales/as/profile.json"),
    navigation: () => import("../locales/as/navigation.json"),
  },
  ne: {
    common: () => import("../locales/ne/common.json"),
    auth: () => import("../locales/ne/auth.json"),
    dashboard: () => import("../locales/ne/dashboard.json"),
    reports: () => import("../locales/ne/reports.json"),
    results: () => import("../locales/ne/results.json"),
    home: () => import("../locales/ne/home.json"),
    family: () => import("../locales/ne/family.json"),
    notifications: () => import("../locales/ne/notifications.json"),
    settings: () => import("../locales/ne/settings.json"),
    festival: () => import("../locales/ne/festival.json"),
    explorer: () => import("../locales/ne/explorer.json"),
    timeline: () => import("../locales/ne/timeline.json"),
    lifeCoach: () => import("../locales/ne/lifeCoach.json"),
    validation: () => import("../locales/ne/validation.json"),
    errors: () => import("../locales/ne/errors.json"),
    profile: () => import("../locales/ne/profile.json"),
    navigation: () => import("../locales/ne/navigation.json"),
  },
  ur: {
    common: () => import("../locales/ur/common.json"),
    auth: () => import("../locales/ur/auth.json"),
    dashboard: () => import("../locales/ur/dashboard.json"),
    reports: () => import("../locales/ur/reports.json"),
    results: () => import("../locales/ur/results.json"),
    home: () => import("../locales/ur/home.json"),
    family: () => import("../locales/ur/family.json"),
    notifications: () => import("../locales/ur/notifications.json"),
    settings: () => import("../locales/ur/settings.json"),
    festival: () => import("../locales/ur/festival.json"),
    explorer: () => import("../locales/ur/explorer.json"),
    timeline: () => import("../locales/ur/timeline.json"),
    lifeCoach: () => import("../locales/ur/lifeCoach.json"),
    validation: () => import("../locales/ur/validation.json"),
    errors: () => import("../locales/ur/errors.json"),
    profile: () => import("../locales/ur/profile.json"),
    navigation: () => import("../locales/ur/navigation.json"),
  },
};

// A minimal i18next backend plugin: i18next calls read(language, namespace,
// callback) whenever a namespace it doesn't have cached yet is requested
// (on init, and again on every language switch) — this is the actual
// lazy-loading hook. Missing language/namespace combinations resolve to
// {} (empty) rather than erroring, so requesting an unimplemented
// language never crashes the app — react-i18next's fallback logic then
// serves the fallbackLng's (English's) strings for any key that comes
// back empty.
const dynamicImportBackend = {
  type: "backend",
  init() {},
  read(language, namespace, callback) {
    const loader = LOADERS[language]?.[namespace];
    if (!loader) {
      callback(null, {});
      return;
    }
    loader()
      .then((mod) => callback(null, mod.default || mod))
      .catch((err) => callback(err, null));
  },
};

i18n
  .use(dynamicImportBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: DEFAULT_LANGUAGE,
    ns: NAMESPACES,
    defaultNS: DEFAULT_NAMESPACE,
    // Every namespace referenced above is preloaded for the fallback
    // language only, so a missing translation in a non-English language
    // always has real English text to fall back to rather than a blank
    // string, without eagerly loading every namespace for every language.
    preload: [DEFAULT_LANGUAGE],
    partialBundledLanguages: true,

    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ["localStorage"],
    },

    interpolation: {
      escapeValue: false, // React already escapes; double-escaping breaks e.g. "&" in copy
    },

    // react-i18next's <Suspense>-based loading is used at the app root
    // (see main.jsx) while the first namespace batch loads, rather than
    // returning key strings as a flash-of-untranslated-content fallback.
    react: {
      useSuspense: true,
    },

    // Never blank in production due to a genuinely missing key — always
    // fall back to the key name itself so it's visibly obvious/debuggable
    // (mirrors backend/services/localization/localizationService.js's
    // same "surface the key, never throw" philosophy) rather than a
    // blank UI a person can't screenshot-and-report.
    returnEmptyString: false,
  });

export default i18n;
