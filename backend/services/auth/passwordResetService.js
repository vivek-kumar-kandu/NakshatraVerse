// ─────────────────────────────────────────────────────────────────────────
// Password Reset Service (BUG-04 fix)
//
// BEFORE: Used an in-memory Map — tokens lost on process restart, broken
//   in multi-instance deployments (each pod had its own isolated Map).
//
// AFTER: Persists reset tokens in MongoDB via PasswordReset.model.js.
//   Works correctly across restarts and multiple backend instances.
//   The MongoDB TTL index on `expiresAt` automatically purges expired
//   documents, so no application-level cleanup sweep is needed.
//
// Security design:
//   • The raw token (32 random bytes, hex-encoded) is ONLY sent to the user
//     via email/logged to console. Never stored.
//   • Only the SHA-256 hash of the raw token is stored in MongoDB.
//   • On verification, the hash is recomputed and looked up — a DB breach
//     never exposes usable reset links.
//   • Tokens are single-use: the document is deleted (consumed) immediately
//     on first successful verification.
//   • TTL: 15 minutes (enforced both by MongoDB TTL index and application check).
//
// Email delivery:
//   Currently logs the reset token to the server console (suitable for dev
//   and for demos where SMTP is not configured). To enable real email:
//   1. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM in .env
//   2. npm install nodemailer (or your preferred email SDK)
//   3. Uncomment the sendResetEmail() call in createPasswordResetToken()
// ─────────────────────────────────────────────────────────────────────────
import crypto from "node:crypto";
import PasswordReset from "../../models/PasswordReset.model.js";
import logger from "../utils/logger.js";

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Creates and persists a password reset token for the given userId.
 * Returns the raw token string to be included in the reset link/email.
 *
 * @param {string} userId
 * @returns {Promise<string>} rawToken
 */
export async function createPasswordResetToken(userId) {
  const rawToken  = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  // Remove any existing (unused, unexpired) tokens for this user so only
  // the most recent reset link is ever valid — prevents confusion when a
  // user clicks "resend" multiple times.
  await PasswordReset.deleteMany({ userId });

  await PasswordReset.create({ tokenHash, userId, expiresAt });

  // ── Email integration point ──────────────────────────────────────────
  // When SMTP is configured, replace this log line with your email call:
  //   await sendResetEmail({ to: userEmail, token: rawToken });
  //
  // The reset URL pattern is:
  //   ${FRONTEND_ORIGIN}/reset-password?token=${rawToken}
  //
  // For now, we log it so developers and demos can test the flow without
  // an SMTP server. In production, remove this log and send the email.
  logger.info(`[Password Reset] Token for user ${userId} (expires ${expiresAt.toISOString()}): ${rawToken}`);

  return rawToken;
}

/**
 * Verifies a raw reset token, marks it as consumed, and returns the userId.
 * Returns null if the token is invalid, expired, or already used.
 *
 * @param {string} rawToken
 * @returns {Promise<string|null>} userId or null
 */
export async function verifyAndConsumeResetToken(rawToken) {
  if (!rawToken) return null;

  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  // findOneAndDelete is atomic — prevents race conditions where two
  // simultaneous requests use the same token.
  const record = await PasswordReset.findOneAndDelete({
    tokenHash,
    used: false,
    expiresAt: { $gt: new Date() },
  });

  if (!record) return null;

  return record.userId;
}

export default { createPasswordResetToken, verifyAndConsumeResetToken };
