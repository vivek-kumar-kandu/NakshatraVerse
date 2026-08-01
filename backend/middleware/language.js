// ─────────────────────────────────────────────────────────────────────────
// Language negotiation middleware (Multilingual Foundation Phase)
//
// Additive, mounted once in server.js (mirrors requestLogger/securityHeaders'
// mounting pattern) — attaches `req.language` (a resolved language code)
// and `req.t` (a translate function bound to that language, from
// services/localization/localizationService.js) to every request. Nothing
// downstream is required to use them yet; controllers opt in incrementally
// (see errorHandler.js/notFoundHandler.js for the first call sites).
//
// Priority order (highest wins), per the migration spec's Phase 6:
//   1. Query parameter          ?lang=hi
//   2. User Setting             X-User-Language header (sent by the
//                                frontend's LanguageContext on every
//                                request once a person has explicitly
//                                chosen a language — see
//                                frontend/src/utils/api.js)
//   3. JWT / User Profile       req.user.language, if authentication
//                                middleware has already run and the
//                                account has a stored language (not
//                                populated yet — User.model.js is
//                                intentionally left language-neutral for
//                                now; this branch is forward-compatible
//                                scaffolding for when it is)
//   4. Accept-Language header   standard browser negotiation
//   5. Default language         "en" (services/localization/localizationService.js)
//
// Only "en" is a real, populated language today (this phase is
// English-source-only) — translate() itself falls back to "en" for any
// language/key that isn't populated yet, so requesting an unimplemented
// language never breaks a response; it just returns the English text
// until that language's locale files are added (Phase 12).
// ─────────────────────────────────────────────────────────────────────────
import { createTranslator, DEFAULT_LANGUAGE } from "../services/localization/localizationService.js";

// Very small, dependency-free Accept-Language parser: good enough for our
// purposes (pick the highest-quality primary language subtag) without
// pulling in a new package for one middleware.
function parseAcceptLanguage(header) {
  if (!header || typeof header !== "string") return null;
  const first = header
    .split(",")
    .map((part) => {
      const [tag, qPart] = part.trim().split(";q=");
      return { tag: (tag || "").trim(), q: qPart ? parseFloat(qPart) : 1 };
    })
    .filter((entry) => entry.tag && entry.tag !== "*")
    .sort((a, b) => b.q - a.q)[0];
  if (!first) return null;
  // "en-US" -> "en"; we only negotiate on the primary subtag for now.
  return first.tag.split("-")[0].toLowerCase();
}

export function resolveLanguage(req) {
  const fromQuery = typeof req.query?.lang === "string" ? req.query.lang.trim().toLowerCase() : null;
  if (fromQuery) return fromQuery;

  const fromUserSetting = req.get?.("X-User-Language");
  if (fromUserSetting) return fromUserSetting.trim().toLowerCase();

  // Forward-compatible: populated once auth middleware + User.model.js
  // carry a language preference. Both req.user shapes (full profile doc,
  // or a decoded JWT payload) are checked defensively.
  const fromProfile = req.user?.language || req.auth?.language;
  if (fromProfile) return String(fromProfile).trim().toLowerCase();

  const fromHeader = parseAcceptLanguage(req.get?.("Accept-Language"));
  if (fromHeader) return fromHeader;

  return DEFAULT_LANGUAGE;
}

export function languageMiddleware(req, res, next) {
  req.language = resolveLanguage(req);
  req.t = createTranslator(req.language);
  next();
}

export default languageMiddleware;
