// ─────────────────────────────────────────────────────────────────────────
// Family Profile Service (V4.2 — Family Profiles & Relationship Hub)
// Business logic for managing a user's saved family/relationship profiles:
// add/edit/delete/duplicate/archive/restore, plus search/filter/sort and
// "recently opened" tracking. Ownership enforcement (a user can only ever
// see/touch their own profiles) lives here, mirroring reportService.js's
// assertOwnership pattern exactly.
//
// This module does NOT calculate any astrology. It only stores/retrieves
// the birth-data fields (name/dob/tob/pob/gender/relationship) that the
// existing, unmodified birth chart workflow (computeChart /
// generateReport) already accepts as `userData` — generating a Birth
// Report, Horoscope, Calendar, Panchang, Muhurat, or AI Assistant session
// for a saved profile means handing this same shape to those existing,
// untouched flows, exactly as if it had been typed into the birth-data
// form directly.
// ─────────────────────────────────────────────────────────────────────────
import * as familyProfileRepository from "../../repositories/familyProfile.repository.js";

function assertOwnership(record, userId) {
  if (!record || record.userId !== userId) {
    const err = new Error("Family profile not found.");
    err.status = 404;
    throw err;
  }
}

function relationshipLabel(profile) {
  if (profile.relationship === "custom") return profile.customRelationshipLabel || "Custom";
  return profile.relationship.charAt(0).toUpperCase() + profile.relationship.slice(1);
}

// Shape returned to the client for every profile — a single, consistent
// projection used by list/get/create/update/duplicate so the frontend
// never has to guess which fields are present.
export function toPublicProfile(record) {
  if (!record) return null;
  const {
    id, name, relationship, customRelationshipLabel, gender, dob, tob, pob,
    archived, lastOpenedAt, createdAt, updatedAt,
  } = record;
  return {
    id, name, relationship, customRelationshipLabel, gender, dob, tob, pob,
    relationshipLabel: relationshipLabel(record),
    archived: Boolean(archived),
    lastOpenedAt: lastOpenedAt || null,
    createdAt, updatedAt,
  };
}

export async function createProfile(userId, profile) {
  const saved = await familyProfileRepository.create({
    userId,
    name: profile.name,
    relationship: profile.relationship,
    customRelationshipLabel: profile.relationship === "custom" ? profile.customRelationshipLabel : null,
    gender: profile.gender || null,
    dob: profile.dob,
    tob: profile.tob,
    pob: profile.pob,
    archived: false,
    lastOpenedAt: null,
  });
  return toPublicProfile(saved);
}

<<<<<<< HEAD
export function getProfile(userId, id) {
  const record = familyProfileRepository.findById(id);
  assertOwnership(record, userId);
=======
export async function getProfile(userId, id) {
  const record = await familyProfileRepository.findById(id);

  assertOwnership(record, userId);

>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  return toPublicProfile(record);
}

// Internal helper (not exposed over HTTP) — returns the raw stored record
// (not the public projection) for callers, like Relationship Hub, that
// need the actual birth-data fields to feed into the existing astrology
// pipeline.
<<<<<<< HEAD
export function getProfileRecord(userId, id) {
  const record = familyProfileRepository.findById(id);
  assertOwnership(record, userId);
=======
export async function getProfileRecord(userId, id) {
  const record = await familyProfileRepository.findById(id);

  assertOwnership(record, userId);

>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  return record;
}

export async function updateProfile(userId, id, patch) {
<<<<<<< HEAD
  const existing = familyProfileRepository.findById(id);
=======
  const existing =  await familyProfileRepository.findById(id);
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  assertOwnership(existing, userId);
  const updated = await familyProfileRepository.update(id, {
    name: patch.name,
    relationship: patch.relationship,
    customRelationshipLabel: patch.relationship === "custom" ? patch.customRelationshipLabel : null,
    gender: patch.gender || null,
    dob: patch.dob,
    tob: patch.tob,
    pob: patch.pob,
  });
  return toPublicProfile(updated);
}

export async function deleteProfile(userId, id) {
<<<<<<< HEAD
  const existing = familyProfileRepository.findById(id);
  assertOwnership(existing, userId);
  return familyProfileRepository.remove(id);
}

export async function duplicateProfile(userId, id) {
  const existing = familyProfileRepository.findById(id);
=======
  const existing = await familyProfileRepository.findById(id);

  assertOwnership(existing, userId);

  return await familyProfileRepository.remove(id);
}

export async function duplicateProfile(userId, id) {
  const existing =  await familyProfileRepository.findById(id);
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  assertOwnership(existing, userId);
  const saved = await familyProfileRepository.create({
    userId,
    name: `${existing.name} (Copy)`,
    relationship: existing.relationship,
    customRelationshipLabel: existing.customRelationshipLabel,
    gender: existing.gender,
    dob: existing.dob,
    tob: existing.tob,
    pob: existing.pob,
    archived: false,
    lastOpenedAt: null,
  });
  return toPublicProfile(saved);
}

export async function archiveProfile(userId, id) {
<<<<<<< HEAD
  const existing = familyProfileRepository.findById(id);
=======
  const existing = await familyProfileRepository.findById(id);
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  assertOwnership(existing, userId);
  const updated = await familyProfileRepository.update(id, { archived: true });
  return toPublicProfile(updated);
}

export async function restoreProfile(userId, id) {
<<<<<<< HEAD
  const existing = familyProfileRepository.findById(id);
=======
  const existing = await familyProfileRepository.findById(id);
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  assertOwnership(existing, userId);
  const updated = await familyProfileRepository.update(id, { archived: false });
  return toPublicProfile(updated);
}

// Marks a profile as "recently opened" — called whenever a profile is
// actually opened for a Birth Report/Horoscope/Calendar/Panchang/Muhurat/
// AI Assistant session (not on every list/get read), so "Recently Opened"
// reflects genuine usage rather than incidental page loads.
export async function touchProfile(userId, id) {
<<<<<<< HEAD
  const existing = familyProfileRepository.findById(id);
=======
  const existing =  await familyProfileRepository.findById(id);
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  assertOwnership(existing, userId);
  const updated = await familyProfileRepository.update(id, { lastOpenedAt: new Date().toISOString() });
  return toPublicProfile(updated);
}

// List with search/filter/sort, all applied server-side so the frontend
// can render a single "Family Profiles" list view directly from the
// response. `includeArchived` defaults to false (archived profiles are
// hidden from the main list — see restoreProfile/archiveProfile above for
// how they move between the two).
<<<<<<< HEAD
export function listProfiles(userId, { search, relationship, sort, includeArchived } = {}) {
  let profiles = familyProfileRepository.findByUser(userId).map(toPublicProfile);
=======
export async function listProfiles(
  userId,
  { search, relationship, sort, includeArchived } = {}
) {
  let profiles = (await familyProfileRepository.findByUser(userId))
    .map(toPublicProfile);
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)

  if (!includeArchived) {
    profiles = profiles.filter((p) => !p.archived);
  }

  if (search && String(search).trim()) {
    const q = String(search).trim().toLowerCase();
    profiles = profiles.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.relationshipLabel.toLowerCase().includes(q) ||
      (p.pob || "").toLowerCase().includes(q)
    );
  }

  if (relationship && relationship !== "all") {
    profiles = profiles.filter((p) => p.relationship === relationship);
  }

  const sorters = {
    recent: (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    name: (a, b) => a.name.localeCompare(b.name),
    relationship: (a, b) => a.relationshipLabel.localeCompare(b.relationshipLabel),
    dob: (a, b) => new Date(a.dob) - new Date(b.dob),
  };
<<<<<<< HEAD
=======

>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  profiles.sort(sorters[sort] || sorters.recent);

  return profiles;
}
<<<<<<< HEAD

// Recently Opened — top N profiles with a lastOpenedAt, most recent first.
// Used by the Dashboard Family Profiles widget and the Family Profiles
// page's own "Recently Opened" rail.
export function recentlyOpenedProfiles(userId, limit = 5) {
  return familyProfileRepository.findByUser(userId)
=======
// Recently Opened — top N profiles with a lastOpenedAt, most recent first.
// Used by the Dashboard Family Profiles widget and the Family Profiles
// page's own "Recently Opened" rail.
export async function recentlyOpenedProfiles(userId, limit = 5) {
  return (await familyProfileRepository.findByUser(userId))
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
    .map(toPublicProfile)
    .filter((p) => !p.archived && p.lastOpenedAt)
    .sort((a, b) => new Date(b.lastOpenedAt) - new Date(a.lastOpenedAt))
    .slice(0, limit);
}
<<<<<<< HEAD

export function profileStats(userId) {
  const all = familyProfileRepository.findByUser(userId).map(toPublicProfile);
  const active = all.filter((p) => !p.archived);
  return {
    total: active.length,
    archived: all.length - active.length,
  };
=======
export async function profileStats(userId) {
    const all = (await familyProfileRepository.findByUser(userId))
        .map(toPublicProfile);

    const active = all.filter((p) => !p.archived);

    return {
        total: active.length,
        archived: all.length - active.length,
    };
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
}

export default {
  toPublicProfile,
  createProfile,
  getProfile,
  getProfileRecord,
  updateProfile,
  deleteProfile,
  duplicateProfile,
  archiveProfile,
  restoreProfile,
  touchProfile,
  listProfiles,
  recentlyOpenedProfiles,
  profileStats,
};
