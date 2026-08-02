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
  // Increment tokenVersion (BUG-02): immediately invalidates all existing
  // access and refresh tokens, forcing re-login after a password change.
  const newTokenVersion = (user.tokenVersion || 0) + 1;
  await userRepository.update(user.id, { passwordHash, tokenVersion: newTokenVersion });
  res.json({ ok: true });
});

export const updatePhoto = asyncHandler(async (req, res) => {
  const { picture } = req.body || {};
  if (!picture || typeof picture !== "string") {
    return res.status(400).json({ error: req.t ? req.t("validation.pictureRequired") : "A picture URL or data URI is required." });
  }
  // Accept https:// URLs or data URIs (base64 images). Reject anything else
  // to prevent storing arbitrary string data in the picture field.
  const isValidUrl = picture.startsWith("https://") || picture.startsWith("http://");
  const isDataUri = picture.startsWith("data:image/");
  if (!isValidUrl && !isDataUri) {
    return res.status(400).json({ error: req.t ? req.t("validation.pictureInvalid") : "Picture must be a valid https:// URL or data:image/ URI." });
  }
  // Enforce a reasonable size cap for data URIs (1 MB base64 ≈ 750 KB image).
  if (picture.length > 1_400_000) {
    return res.status(413).json({ error: req.t ? req.t("validation.pictureTooLarge") : "Picture data is too large (max ~1 MB)." });
  }
  const updated = await userRepository.update(req.user.id, { picture });
  res.json({ user: userRepository.toPublicUser(updated) });
});

export default { getProfile, updateProfile, changePassword, updatePhoto };
