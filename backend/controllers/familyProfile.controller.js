// ─────────────────────────────────────────────────────────────────────────
// Family Profiles Controller (V4.2 — Family Profiles & Relationship Hub)
// HTTP layer for the Family Profiles module. Mirrors reports.controller.js's
// structure exactly — validate, delegate to the service layer, shape the
// JSON response. No astrology calculation and no Gemini calling happens
// here.
// ─────────────────────────────────────────────────────────────────────────
import logger from "../services/utils/logger.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import * as familyProfileService from "../services/family/familyProfileService.js";
import { sanitizeFamilyProfile, validateFamilyProfile } from "../validators/familyProfile.validator.js";

export const createProfile = asyncHandler(async (req, res) => {
  const profile = sanitizeFamilyProfile(req.body || {});
  const errors = validateFamilyProfile(profile);
  if (errors.length) {
    logger.warn(`Validation failed for POST /api/family-profiles: ${errors.join(", ")}`);
<<<<<<< HEAD
    return res.status(400).json({ error: `Invalid profile: ${errors.join(", ")}` });
=======
    return res.status(400).json({ error: req.t("errors.invalidProfile", { errors: errors.join(", ") }) });
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  }
  const saved = await familyProfileService.createProfile(req.user.id, profile);
  res.status(201).json({ profile: saved });
});

export const listProfiles = asyncHandler(async (req, res) => {
  const { search, relationship, sort, includeArchived } = req.query;
<<<<<<< HEAD
  const profiles = familyProfileService.listProfiles(req.user.id, {
    search,
    relationship,
    sort,
    includeArchived: includeArchived === "true",
  });
=======
const profiles = await familyProfileService.listProfiles(req.user.id, {
  search,
  relationship,
  sort,
  includeArchived: includeArchived === "true",
});
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  res.json({ profiles });
});

export const getStats = asyncHandler(async (req, res) => {
<<<<<<< HEAD
  res.json(familyProfileService.profileStats(req.user.id));
=======
  const stats = await familyProfileService.profileStats(req.user.id);

  res.json(stats);
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
});

export const getRecentlyOpened = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 5;
<<<<<<< HEAD
  res.json({ profiles: familyProfileService.recentlyOpenedProfiles(req.user.id, limit) });
});

export const getProfile = asyncHandler(async (req, res) => {
  res.json({ profile: familyProfileService.getProfile(req.user.id, req.params.id) });
=======
  const profiles = await familyProfileService.recentlyOpenedProfiles(
  req.user.id,
  limit
);

  res.json({ profiles });

});

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await familyProfileService.getProfile(
  req.user.id,
  req.params.id
);

res.json({ profile });
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
});

export const updateProfile = asyncHandler(async (req, res) => {
  const profile = sanitizeFamilyProfile(req.body || {});
  const errors = validateFamilyProfile(profile);
  if (errors.length) {
    logger.warn(`Validation failed for PUT /api/family-profiles/${req.params.id}: ${errors.join(", ")}`);
<<<<<<< HEAD
    return res.status(400).json({ error: `Invalid profile: ${errors.join(", ")}` });
=======
    return res.status(400).json({ error: req.t("errors.invalidProfile", { errors: errors.join(", ") }) });
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  }
  const updated = await familyProfileService.updateProfile(req.user.id, req.params.id, profile);
  res.json({ profile: updated });
});

export const deleteProfile = asyncHandler(async (req, res) => {
  await familyProfileService.deleteProfile(req.user.id, req.params.id);
  res.json({ ok: true });
});

export const duplicateProfile = asyncHandler(async (req, res) => {
  const saved = await familyProfileService.duplicateProfile(req.user.id, req.params.id);
  res.status(201).json({ profile: saved });
});

export const archiveProfile = asyncHandler(async (req, res) => {
  res.json({ profile: await familyProfileService.archiveProfile(req.user.id, req.params.id) });
});

export const restoreProfile = asyncHandler(async (req, res) => {
  res.json({ profile: await familyProfileService.restoreProfile(req.user.id, req.params.id) });
});

export const touchProfile = asyncHandler(async (req, res) => {
  res.json({ profile: await familyProfileService.touchProfile(req.user.id, req.params.id) });
});

export default {
  createProfile, listProfiles, getStats, getRecentlyOpened, getProfile,
  updateProfile, deleteProfile, duplicateProfile, archiveProfile, restoreProfile, touchProfile,
};
