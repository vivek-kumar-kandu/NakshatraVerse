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
// ─────────────────────────────────────────────────────────────────────────
import { verifyToken, ACCESS_COOKIE } from "../services/auth/tokenService.js";
import logger from "../services/utils/logger.js";

function extractToken(req) {
  const cookieToken = req.cookies?.[ACCESS_COOKIE];
  if (cookieToken) return cookieToken;
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  return null;
}

function decode(req) {
  const token = extractToken(req);
  if (!token) return null;
  try {
    const payload = verifyToken(token);
    if (payload.type === "refresh") return null; // refresh tokens are never valid here
    return { id: payload.sub, email: payload.email, name: payload.name };
  } catch (err) {
    logger.debug("Auth token verification failed:", err.message);
    return null;
  }
}

export function requireAuth(req, res, next) {
  const user = decode(req);
  if (!user) {
    return res.status(401).json({ error: "Authentication required. Please sign in." });
  }
  req.user = user;
  next();
}

export function optionalAuth(req, res, next) {
  req.user = decode(req);
  next();
}

export default { requireAuth, optionalAuth };
