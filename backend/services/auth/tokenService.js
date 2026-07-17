// ─────────────────────────────────────────────────────────────────────────
// Token Service (Priority 5.2)
// Issues and verifies the two JWTs used for session management:
//   - access token:  short-lived (default 15m), sent on every request,
//     proves who the current request is from.
//   - refresh token: long-lived (default 30d), used only to mint a new
//     access token via POST /api/auth/refresh once the access token
//     expires, without forcing the person to log in again.
// Both are set as httpOnly cookies (see cookieOptions below) so they are
// never readable/stealable from client-side JavaScript (mitigates XSS
// token theft) — this is the "secure session management" requirement.
// ─────────────────────────────────────────────────────────────────────────
import jwt from "jsonwebtoken";
import config from "../../config/env.js";

const ACCESS_COOKIE_NAME = "nv_access_token";
const REFRESH_COOKIE_NAME = "nv_refresh_token";

function requireSecret() {
  if (!config.JWT_SECRET) {
    // Fails loudly instead of signing tokens with an empty/undefined
    // secret, which would make every session forgeable.
    const err = new Error("Server auth is misconfigured: JWT_SECRET is not set.");
    err.status = 500;
    throw err;
  }
  return config.JWT_SECRET;
}

export function signAccessToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name }, requireSecret(), {
    expiresIn: config.JWT_ACCESS_EXPIRES_IN,
  });
}

export function signRefreshToken(user) {
  return jwt.sign({ sub: user.id, type: "refresh" }, requireSecret(), {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, requireSecret());
}

function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: config.COOKIE_SECURE,
    // The frontend (Vercel) and backend (Render) live on different
    // registrable domains, which makes every fetch() from the frontend a
    // cross-site request. Browsers only attach "lax" cookies to top-level
    // navigations, never to cross-site fetch/XHR calls — so with "lax"
    // here the login response would set the cookie, but every subsequent
    // request (GET /api/auth/me, POST /api/auth/refresh, any protected
    // API) silently failed to send it back, producing exactly the
    // "login succeeds, then 401 everywhere" symptom.
    //
    // "none" is required to allow the cookie on cross-site requests, and
    // browsers mandate `secure: true` (HTTPS-only) whenever sameSite is
    // "none". config.COOKIE_SECURE is already true in production (Render
    // serves HTTPS) and false in local dev, where frontend/backend share
    // the "localhost" site and plain HTTP is used — so tying sameSite to
    // the same flag keeps both environments correct automatically.
    sameSite: config.COOKIE_SECURE ? "none" : "lax",
    path: "/",
  };
}

export function accessCookieOptions() {
  // No explicit maxAge: this is a session cookie tied to the access
  // token's own short expiry, which is checked on every verifyToken call.
  return baseCookieOptions();
}

export function refreshCookieOptions() {
  return { ...baseCookieOptions(), maxAge: config.REFRESH_COOKIE_MAX_AGE_MS };
}

export const ACCESS_COOKIE = ACCESS_COOKIE_NAME;
export const REFRESH_COOKIE = REFRESH_COOKIE_NAME;

export default {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  accessCookieOptions,
  refreshCookieOptions,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
};
