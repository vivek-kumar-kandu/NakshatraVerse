// ─────────────────────────────────────────────────────────────────────────
// Google Auth Service (Priority 5.2)
// Verifies a Google Identity Services ID token (sent by the frontend after
// a successful "Sign in with Google" button interaction) and extracts the
// user's Google profile. Verification (signature, audience, expiry) is
// delegated entirely to google-auth-library — this file never trusts a
// client-supplied payload without it passing verifyIdToken first.
// ─────────────────────────────────────────────────────────────────────────
import { OAuth2Client } from "google-auth-library";
import config from "../../config/env.js";

let client = null;
function getClient() {
  if (!client) client = new OAuth2Client(config.GOOGLE_CLIENT_ID);
  return client;
}

export function isGoogleAuthConfigured() {
  return Boolean(config.GOOGLE_CLIENT_ID);
}

/**
 * Verifies a Google ID token and returns { googleId, email, name, picture }.
 * Throws a curated error (with .status) on any failure — missing config,
 * invalid/expired token, audience mismatch, etc.
 */
export async function verifyGoogleIdToken(idToken) {
  if (!isGoogleAuthConfigured()) {
    const err = new Error("Google sign-in is not configured on the server. Set GOOGLE_CLIENT_ID in backend/.env.");
    err.status = 501;
    throw err;
  }
  if (!idToken || typeof idToken !== "string") {
    const err = new Error("Missing Google ID token.");
    err.status = 400;
    throw err;
  }

  let ticket;
  try {
    ticket = await getClient().verifyIdToken({ idToken, audience: config.GOOGLE_CLIENT_ID });
  } catch (err) {
    const wrapped = new Error("Google sign-in failed: invalid or expired token.");
    wrapped.status = 401;
    throw wrapped;
  }

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload?.email) {
    const err = new Error("Google sign-in failed: incomplete profile returned.");
    err.status = 401;
    throw err;
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name || payload.email.split("@")[0],
    picture: payload.picture || null,
  };
}

export default { isGoogleAuthConfigured, verifyGoogleIdToken };
