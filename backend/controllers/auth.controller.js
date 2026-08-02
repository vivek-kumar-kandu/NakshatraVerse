// ─────────────────────────────────────────────────────────────────────────
// Auth Controller (Priority 5.2)
// Orchestrates registration/login/session-refresh/logout. Follows the same
// pattern as astrology.controller.js: validate → call services → shape
// the HTTP response. No password hashing, token signing, or persistence
// logic lives here directly.
// ─────────────────────────────────────────────────────────────────────────
import logger from "../services/utils/logger.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { sanitizeAuthFields, validateRegisterFields, validateLoginFields } from "../validators/auth.validator.js";
import * as userRepository from "../repositories/user.repository.js";
import { hashPassword, verifyPassword } from "../services/auth/passwordService.js";
import { verifyGoogleIdToken } from "../services/auth/googleAuthService.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  accessCookieOptions,
  refreshCookieOptions,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
} from "../services/auth/tokenService.js";

function issueSession(res, user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  res.cookie(ACCESS_COOKIE, accessToken, accessCookieOptions());
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  return accessToken;
}

export const register = asyncHandler(async (req, res) => {
  const fields = sanitizeAuthFields(req.body || {});
  const errors = validateRegisterFields(fields, req.t);
  if (errors.length) {
    return res.status(400).json({ error: req.t("auth.invalidRegistration", { errors: errors.join(", ") }) });
  }

  const existing =  await userRepository.findByEmail(fields.email);
  if (existing) {
    return res.status(409).json({ error: req.t("auth.emailAlreadyExists") });
  }

  const passwordHash = await hashPassword(fields.password);
  const user = await userRepository.create({ name: fields.name, email: fields.email, passwordHash });
  issueSession(res, user);
  logger.info(`New account registered: ${user.email}`);
  res.status(201).json({ user: userRepository.toPublicUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const fields = sanitizeAuthFields(req.body || {});
  const errors = validateLoginFields(fields, req.t);
  if (errors.length) {
    return res.status(400).json({ error: req.t("auth.invalidLogin", { errors: errors.join(", ") }) });
  }

  const user =  await userRepository.findByEmail(fields.email);
  // Deliberately identical error for "no such account" and "wrong
  // password" so the response can never be used to enumerate registered
  // emails.
  const invalidMsg = req.t("auth.invalidCredentials");
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: invalidMsg });
  }
  const ok = await verifyPassword(fields.password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: invalidMsg });
  }

  issueSession(res, user);
  res.json({ user: userRepository.toPublicUser(user) });
});

export const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body || {};
  const profile = await verifyGoogleIdToken(idToken); // throws curated errors on failure

  let user = await userRepository.findByGoogleId(profile.googleId);

  if (!user) {
    user = await userRepository.findByEmail(profile.email);
  }
  if (!user) {
    user = await userRepository.create({
      name: profile.name,
      email: profile.email,
      googleId: profile.googleId,
      picture: profile.picture,
    });
  } else if (!user.googleId) {
    // Existing password account signing in with Google for the first time
    // — link the accounts rather than creating a duplicate.
    user = await userRepository.update(user.id, { googleId: profile.googleId, picture: profile.picture || user.picture });
  }

  issueSession(res, user);
  res.json({ user: userRepository.toPublicUser(user) });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  if (email) {
    const user = await userRepository.findByEmail(email);
    if (user && user.passwordHash) {
      const { createPasswordResetToken } = await import("../services/auth/passwordResetService.js");
      const token = createPasswordResetToken(user.id);
      logger.info(`Password reset token generated for user ${user.id} (${user.email}): ${token}`);
    }
  }
  // Account enumeration safe response - always respond with success
  res.json({ ok: true, message: req.t ? req.t("auth.passwordResetSent") : "If an account with that email exists, a password reset link has been sent." });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) {
    return res.status(400).json({ error: req.t ? req.t("auth.missingResetToken") : "Reset token and new password are required." });
  }
  const { verifyAndConsumeResetToken } = await import("../services/auth/passwordResetService.js");
  const userId = await verifyAndConsumeResetToken(token);
  if (!userId) {
    return res.status(400).json({ error: req.t ? req.t("auth.invalidResetToken") : "Password reset token is invalid or has expired." });
  }
  const user = await userRepository.findById(userId);
  if (!user) {
    return res.status(404).json({ error: req.t ? req.t("auth.accountNoLongerExists") : "Account no longer exists." });
  }

  const passwordHash = await hashPassword(newPassword);
  // Increment tokenVersion on password reset to invalidate previous sessions (BUG-02)
  const newTokenVersion = (user.tokenVersion || 0) + 1;
  await userRepository.update(user.id, { passwordHash, tokenVersion: newTokenVersion });
  logger.info(`Password reset successfully for user ${user.id}`);
  res.json({ ok: true, message: req.t ? req.t("auth.passwordResetSuccess") : "Password has been reset successfully." });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    return res.status(401).json({ error: req.t("auth.noActiveSession") });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    return res.status(401).json({ error: req.t("auth.sessionExpired") });
  }
  if (payload.type !== "refresh") {
    return res.status(401).json({ error: req.t("auth.invalidRefreshToken") });
  }

  const user = await userRepository.findById(payload.sub);
  if (!user) {
    return res.status(401).json({ error: req.t("auth.accountNoLongerExists") });
  }
  // Token revocation check (BUG-02)
  if (payload.tokenVersion !== undefined && user.tokenVersion !== undefined && payload.tokenVersion !== user.tokenVersion) {
    return res.status(401).json({ error: req.t("auth.sessionExpired") });
  }

  issueSession(res, user);
  res.json({ user: userRepository.toPublicUser(user) });
});

export const logout = (req, res) => {
  const { maxAge: _accessMaxAge, ...accessOpts } = accessCookieOptions();
  const { maxAge: _refreshMaxAge, ...refreshOpts } = refreshCookieOptions();
  res.clearCookie(ACCESS_COOKIE, accessOpts);
  res.clearCookie(REFRESH_COOKIE, refreshOpts);
  res.json({ ok: true });
};

export const me = asyncHandler(async (req, res) => {
  const user = await userRepository.findById(req.user.id);
  if (!user) return res.status(401).json({ error: req.t("auth.accountNoLongerExists") });
  res.json({ user: userRepository.toPublicUser(user) });
});

export default { register, login, googleLogin, forgotPassword, resetPassword, refresh, logout, me };
