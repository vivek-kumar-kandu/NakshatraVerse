// ─────────────────────────────────────────────────────────────────────────
// User Controller (Priority 5.2)
// Profile management for the currently authenticated user. All routes
// require a valid session (see middleware/auth.js requireAuth).
// ─────────────────────────────────────────────────────────────────────────
import { asyncHandler } from "../middleware/errorHandler.js";
import * as userRepository from "../repositories/user.repository.js";
import { hashPassword, verifyPassword } from "../services/auth/passwordService.js";
import { sanitizeAuthFields, validateRegisterFields } from "../validators/auth.validator.js";

export const getProfile = asyncHandler(async (req, res) => {
  const user = await userRepository.findById(req.user.id);
  if (!user) return res.status(404).json({ error: req.t("auth.accountNoLongerExists") });
  res.json({ user: userRepository.toPublicUser(user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name } = sanitizeAuthFields({ name: req.body?.name });
  if (!name || !name.trim()) {
    return res.status(400).json({ error: req.t("validation.nameRequired") });
  }
  const updated = await userRepository.update(req.user.id, { name });
  res.json({ user: userRepository.toPublicUser(updated) });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await userRepository.findById(req.user.id);
  if (!user) return res.status(404).json({ error: req.t("auth.accountNoLongerExists") });
  if (!user.passwordHash) {
    return res.status(400).json({ error: req.t("auth.googleAccountNoPassword") });
  }

  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !(await verifyPassword(currentPassword, user.passwordHash))) {
    return res.status(401).json({ error: req.t("auth.currentPasswordIncorrect") });
  }
  const errors = validateRegisterFields({ name: user.name, email: user.email, password: newPassword });
  if (errors.some((e) => e.includes("password"))) {
    return res.status(400).json({ error: req.t("auth.newPasswordRequirements") });
  }

  const passwordHash = await hashPassword(newPassword);
  await userRepository.update(user.id, { passwordHash });
  res.json({ ok: true });
});

export default { getProfile, updateProfile, changePassword };
