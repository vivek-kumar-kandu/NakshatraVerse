// ─────────────────────────────────────────────────────────────────────────
// localizationService (Multilingual Foundation Phase)
//
// Centralized backend message resolver. Mirrors the frontend's namespaced
// react-i18next setup (frontend/src/i18n) so both sides speak the same
// "namespace + dotted key" vocabulary — e.g. "errors.notFound" resolves to
// backend/locales/<lang>/errors.json's { "notFound": "..." }.
//
// Design goals (per the multilingual migration spec):
//   - Centralized: every backend module that needs a user-facing message
//     goes through `t()` here instead of hardcoding its own string.
//   - No duplicated logic: one cache, one fallback rule, one interpolation
//     implementation, reused by every route/controller/middleware.
//   - Language-neutral storage: this module never touches MongoDB — it
//     only reads static JSON files from backend/locales/<lang>/.
//   - Fallback: any language missing a key (or missing entirely) falls
//     back to DEFAULT_LANGUAGE ("en") for that key, so a partially
//     translated language never renders a blank/undefined message.
//
// Currently only backend/locales/en/*.json has real content (this phase is
// English-only source content) — additional languages are added purely by
// dropping a new backend/locales/<lang>/<namespace>.json file next to it;
// no code changes required (Phase 12 of the migration spec).
// ─────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import logger from "../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.join(__dirname, "..", "..", "locales");

export const DEFAULT_LANGUAGE = "en";

// namespace -> language -> resolved JSON object. Loaded lazily and cached
// for the life of the process (locale files are static deploy-time
// assets, never written to at runtime, so there's no cache-invalidation
// concern — same "read once, cache forever" pattern the astrology engine's
// static reference data already uses elsewhere in this codebase).
const cache = new Map();

function loadNamespace(language, namespace) {
  const cacheKey = `${language}::${namespace}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const filePath = path.join(LOCALES_DIR, language, `${namespace}.json`);
  let data = null;
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    data = JSON.parse(raw);
  } catch {
    data = null; // missing file / bad JSON — caller falls back to default language
  }
  cache.set(cacheKey, data);
  return data;
}

export function listAvailableLanguages() {
  try {
    return fs
      .readdirSync(LOCALES_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [DEFAULT_LANGUAGE];
  }
}

function getByPath(obj, dottedKey) {
  if (!obj) return undefined;
  return dottedKey.split(".").reduce((acc, part) => (acc && typeof acc === "object" ? acc[part] : undefined), obj);
}

function interpolate(template, vars) {
  if (typeof template !== "string" || !vars) return template;
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, name) => {
    const value = vars[name];
    return value === undefined || value === null ? match : String(value);
  });
}

/**
 * Resolve a translation. `key` is "namespace.dotted.key", e.g.
 * "errors.notFound". Falls back to DEFAULT_LANGUAGE when the requested
 * language is missing the namespace/key entirely, then to `key` itself
 * (so a genuinely missing key is visible/debuggable instead of throwing).
 */
export function translate(language, key, vars) {
  const [namespace, ...rest] = key.split(".");
  const dottedKey = rest.join(".");
  if (!namespace || !dottedKey) {
    logger.warn(`localizationService: malformed key "${key}" (expected "namespace.key")`);
    return key;
  }

  const requestedLang = language || DEFAULT_LANGUAGE;
  const primary = loadNamespace(requestedLang, namespace);
  let resolved = getByPath(primary, dottedKey);

  if (resolved === undefined && requestedLang !== DEFAULT_LANGUAGE) {
    const fallback = loadNamespace(DEFAULT_LANGUAGE, namespace);
    resolved = getByPath(fallback, dottedKey);
  }

  if (resolved === undefined) return key; // last resort: surface the key, never throw
  return interpolate(resolved, vars);
}

/** Returns a `t(key, vars)` function bound to one language — handed to
 * request handlers via req.t (see middleware/language.js). */
export function createTranslator(language) {
  return (key, vars) => translate(language, key, vars);
}

export default { DEFAULT_LANGUAGE, translate, createTranslator, listAvailableLanguages };
