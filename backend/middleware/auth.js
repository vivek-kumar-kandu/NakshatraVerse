// ─────────────────────────────────────────────────────────────────────────
// Auth Middleware (Priority 5.2)
// Reads the session access token (httpOnly cookie, with an Authorization:
// Bearer header fallback for non-browser clients) and attaches the
// decoded identity to req.user.
//   - requireAuth: 401s if there is no valid token. Use on routes that
//     must never be reachable by an anonymous request (dashboard, saved
//     reports, profile).
//   - optionalAuth: never rejects; req.user is null if there's no/an
//     invalid token. Use on routes that behave the same for everyone but
//     can personalize behavior when a session happens to be present.
//
// BUG-02 fix: requireAuth now performs a DB tokenVersion check so that
// incrementing User.tokenVersion (on password change / account revocation)
// instantly invalidates all previously issued access tokens, regardless of
// their remaining JWT lifetime.
// ─────────────────────────────────────────────────────────────────────────
import { verifyToken, ACCESS_COOKIE } from "../services/auth/tokenService.js";
import User from "../models/User.model.js";
import logger from "../services/utils/logger.js";

function extractToken(req) {
  const cookieToken = req.cookies?.[ACCESS_COOKIE];
  if (cookieToken) return cookieToken;
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  return null;
}

function decodePayload(req) {
  const token = extractToken(req);
  if (!token) return null;
  try {
    const payload = verifyToken(token);
    if (payload.type === "refresh") return null; // refresh tokens never valid here
    return payload;
  } catch (err) {
    logger.debug("Auth token verification failed:", err.message);
    return null;
  }
}

// requireAuth — hard gate: 401 if no valid, non-revoked token.
// Performs a DB tokenVersion check (BUG-02) to enable instant revocation.
export async function requireAuth(req, res, next) {
  const payload = decodePayload(req);
  if (!payload) {
    return res.status(401).json({ error: req.t ? req.t("auth.authRequired") : "Authentication required. Please sign in." });
  }

  // Revocation check: compare embedded tokenVersion with current DB value.
  // A mismatch means the user changed their password or was explicitly
  // revoked after this token was issued.
  try {
    const user = await User.findById(payload.sub).lean();
    if (!user) {
      return res.status(401).json({ error: req.t ? req.t("auth.accountNoLongerExists") : "Account no longer exists." });
    }
    if (
      payload.tokenVersion !== undefined &&
      user.tokenVersion !== undefined &&
      payload.tokenVersion !== user.tokenVersion
    ) {
      return res.status(401).json({ error: req.t ? req.t("auth.sessionExpired") : "Session expired. Please sign in again." });
    }
  } catch (err) {
    // DB lookup failure — fail open to avoid a DB blip locking every user
    // out, but log a warning so it's visible in monitoring.
    logger.warn("requireAuth: DB tokenVersion check failed, proceeding without revocation check:", err.message);
  }

  req.user = { id: payload.sub, email: payload.email, name: payload.name };
  next();
}

// optionalAuth — soft gate: never rejects; req.user is null when absent/invalid.
// Does NOT perform a DB check — routes using optionalAuth degrade gracefully
// when unauthenticated, so the extra DB round-trip is not worth it.
export function optionalAuth(req, res, next) {
  const payload = decodePayload(req);
  req.user = payload ? { id: payload.sub, email: payload.email, name: payload.name } : null;
  next();
}

export default { requireAuth, optionalAuth };

