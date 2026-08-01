// ─────────────────────────────────────────────────────────────────────────
// Supported languages (Multilingual Foundation Phase)
//
// The full target language list from the migration spec (Phase 12),
// defined once so the Settings language picker, LanguageContext's RTL
// logic, and i18n/index.js's fallback config all read from the same
// source of truth. Adding a language that HAS translated content is then
// just:
//   1. add its locale JSON files under src/locales/<code>/
//   2. flip `available: true` below
// No other code changes — this is what "adding a new language must
// require only one translation folder, no code changes" (Phase 12) means
// in practice for this codebase.
//
// Every language marked `available: true` below ships real translated
// locale JSON under src/locales/<code>/ (not just English) — this list
// is also the map for the centralized date/time/number formatting
// utility (utils/localeFormat.js), which is why each entry needs a
// correct BCP-47 `intlLocale`.
// ─────────────────────────────────────────────────────────────────────────

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", rtl: false, available: true, intlLocale: "en-IN" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", rtl: false, available: true, intlLocale: "hi-IN" },
  { code: "sa", name: "Sanskrit", nativeName: "संस्कृतम्", rtl: false, available: true, intlLocale: "en-IN" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", rtl: false, available: true, intlLocale: "mr-IN" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", rtl: false, available: true, intlLocale: "gu-IN" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", rtl: false, available: true, intlLocale: "pa-IN" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", rtl: false, available: true, intlLocale: "bn-IN" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", rtl: false, available: true, intlLocale: "ta-IN" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", rtl: false, available: true, intlLocale: "te-IN" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", rtl: false, available: true, intlLocale: "kn-IN" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", rtl: false, available: true, intlLocale: "ml-IN" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", rtl: false, available: true, intlLocale: "or-IN" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", rtl: false, available: true, intlLocale: "as-IN" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली", rtl: false, available: true, intlLocale: "ne-NP" },
  { code: "ur", name: "Urdu", nativeName: "اردو", rtl: true, available: true, intlLocale: "ur-IN" },
  { code: "es", name: "Spanish", nativeName: "Español", rtl: false, available: false },
  { code: "fr", name: "French", nativeName: "Français", rtl: false, available: false },
  { code: "de", name: "German", nativeName: "Deutsch", rtl: false, available: false },
  { code: "it", name: "Italian", nativeName: "Italiano", rtl: false, available: false },
  { code: "pt", name: "Portuguese", nativeName: "Português", rtl: false, available: false },
  { code: "ru", name: "Russian", nativeName: "Русский", rtl: false, available: false },
  { code: "ja", name: "Japanese", nativeName: "日本語", rtl: false, available: false },
  { code: "zh", name: "Chinese (Simplified)", nativeName: "简体中文", rtl: false, available: false },
  { code: "ar", name: "Arabic", nativeName: "العربية", rtl: true, available: false },
];

export const DEFAULT_LANGUAGE = "en";

export function getLanguageMeta(code) {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES.find((l) => l.code === DEFAULT_LANGUAGE);
}

export function isRtlLanguage(code) {
  return Boolean(getLanguageMeta(code)?.rtl);
}

export default SUPPORTED_LANGUAGES;
