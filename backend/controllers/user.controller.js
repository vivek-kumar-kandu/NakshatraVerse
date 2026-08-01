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
<<<<<<< HEAD
  const user = userRepository.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "Account not found." });
=======
  const user = await userRepository.findById(req.user.id);
  if (!user) return res.status(404).json({ error: req.t("auth.accountNoLongerExists") });
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  res.json({ user: userRepository.toPublicUser(user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name } = sanitizeAuthFields({ name: req.body?.name });
  if (!name || !name.trim()) {
<<<<<<< HEAD
    return res.status(400).json({ error: "name is required" });
=======
    return res.status(400).json({ error: req.t("validation.nameRequired") });
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  }
  const updated = await userRepository.update(req.user.id, { name });
  res.json({ user: userRepository.toPublicUser(updated) });
});

export const changePassword = asyncHandler(async (req, res) => {
<<<<<<< HEAD
  const user = userRepository.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "Account not found." });
  if (!user.passwordHash) {
    return res.status(400).json({ error: "This account signs in with Google and has no password to change." });
=======
  const user = await userRepository.findById(req.user.id);
  if (!user) return res.status(404).json({ error: req.t("auth.accountNoLongerExists") });
  if (!user.passwordHash) {
    return res.status(400).json({ error: req.t("auth.googleAccountNoPassword") });
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  }

  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !(await verifyPassword(currentPassword, user.passwordHash))) {
<<<<<<< HEAD
    return res.status(401).json({ error: "Current password is incorrect." });
  }
  const errors = validateRegisterFields({ name: user.name, email: user.email, password: newPassword });
  if (errors.some((e) => e.includes("password"))) {
    return res.status(400).json({ error: "New password must be at least 8 characters and contain a number." });
=======
    return res.status(401).json({ error: req.t("auth.currentPasswordIncorrect") });
  }
  const errors = validateRegisterFields({ name: user.name, email: user.email, password: newPassword });
  if (errors.some((e) => e.includes("password"))) {
    return res.status(400).json({ error: req.t("auth.newPasswordRequirements") });
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  }

  const passwordHash = await hashPassword(newPassword);
  await userRepository.update(user.id, { passwordHash });
  res.json({ ok: true });
});

export default { getProfile, updateProfile, changePassword };
