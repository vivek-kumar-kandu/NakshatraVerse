// ─────────────────────────────────────────────────────────────────────────
// localeFormat.js (Phase 3.6 — Full Multilingual Completion, Section 2)
//
// Problem this fixes: components throughout the app called
// `date.toLocaleDateString(undefined, {...})` / `toLocaleTimeString([], {...})`
// directly. Passing `undefined`/`[]` as the locale argument means the
// BROWSER/OS locale controls formatting, not the language the user picked
// inside NakshatraVerse (LanguageContext / i18next). On a phone set to
// en-US being used in Hindi, dates rendered American-English-style even
// though every other string on the page was in Hindi.
//
// Fix: every user-facing date/time/number format in the app should route
// through the helpers below, which map the app's own language code (from
// i18n/languages.js's SUPPORTED_LANGUAGES — the single source of truth
// LanguageContext already reads) to a concrete BCP-47 Intl locale via
// each entry's `intlLocale` field, then call the standard Intl APIs with
// that explicit locale instead of `undefined`.
//
// Sanskrit ("sa") has no meaningful independent ICU date/number locale
// data in most JS engines (Node/V8, browser Intl implementations), so per
// the spec's "handle Sanskrit safely with an appropriate fallback", it is
// mapped to "en-IN" in i18n/languages.js — Indian date conventions and
// digits, via a locale every environment actually implements, rather than
// risking a RangeError or silent en-US fallback from an unsupported tag.
//
// This module does NOT change any stored date value, API contract, or
// astrology calculation — it only changes how an already-known JS Date
// (or ISO/date-like string) is *displayed*.
// ─────────────────────────────────────────────────────────────────────────

import { getLanguageMeta, DEFAULT_LANGUAGE } from "../i18n/languages.js";

// Resolves an app language code ("hi", "sa", "ur", ...) to the BCP-47 tag
// Intl.* APIs should actually be called with. Unknown/unavailable codes
// fall back to the same DEFAULT_LANGUAGE's locale i18next itself falls
// back to, so this never throws on a language that isn't fully wired up.
export function resolveIntlLocale(langCode) {
  const meta = getLanguageMeta(langCode);
  return meta?.intlLocale || getLanguageMeta(DEFAULT_LANGUAGE).intlLocale;
}

function toDate(value) {
  if (value instanceof Date) return value;
  const d = new Date(value);
  return d;
}

// formatDate(value, langCode, options?) — replaces
// `date.toLocaleDateString(undefined, options)`.
export function formatDate(value, langCode, options = { year: "numeric", month: "short", day: "numeric" }) {
  if (!value) return "—";
  try {
    const d = toDate(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(resolveIntlLocale(langCode), options);
  } catch {
    return "—";
  }
}

// formatTime(value, langCode, options?) — replaces
// `date.toLocaleTimeString([], options)`.
export function formatTime(value, langCode, options = { hour: "2-digit", minute: "2-digit" }) {
  if (!value) return "—";
  try {
    const d = toDate(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString(resolveIntlLocale(langCode), options);
  } catch {
    return "—";
  }
}

// formatDateTime(value, langCode, options?) — a single combined
// date+time string, for places that previously chained both calls.
export function formatDateTime(value, langCode, options = { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) {
  if (!value) return "—";
  try {
    const d = toDate(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(resolveIntlLocale(langCode), options);
  } catch {
    return "—";
  }
}

// formatNumber(value, langCode, options?) — replaces bare
// `number.toLocaleString()` / template-literal number interpolation where
// locale-appropriate digit grouping matters (e.g. Indian 12,34,567 vs
// Western 1,234,567 comma placement).
export function formatNumber(value, langCode, options) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  try {
    return Number(value).toLocaleString(resolveIntlLocale(langCode), options);
  } catch {
    return String(value);
  }
}
