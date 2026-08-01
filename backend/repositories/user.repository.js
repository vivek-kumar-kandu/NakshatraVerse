// ─────────────────────────────────────────────────────────────────────────
// User Repository (Priority 5.2)
// Single responsibility: persistence for user accounts. No password
// hashing, token issuing, or HTTP concerns live here — see
// services/auth/* and controllers/auth.controller.js for that. Keeping
// this layer thin means the underlying store (currently a JSON file, see
// db/jsonFileStore.js) can be swapped for a real database later without
// touching auth/user business logic.
// ─────────────────────────────────────────────────────────────────────────
<<<<<<< HEAD
import path from "node:path";
import config from "../config/env.js";
import JsonFileStore from "../db/jsonFileStore.js";

const store = new JsonFileStore(path.join(config.DATA_DIR, "users.json"));
=======
import User from "../models/User.model.js";
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

<<<<<<< HEAD
export function findById(id) {
  return store.findById(id);
}

export function findByEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  return store.findOne((u) => u.email === normalized);
}

export function findByGoogleId(googleId) {
  if (!googleId) return null;
  return store.findOne((u) => u.googleId === googleId);
}

export async function create({ name, email, passwordHash = null, googleId = null, picture = null }) {
  const now = new Date().toISOString();
  return store.insert({
=======
export async function findById(id) {
    return await User.findById(id);
}

export async function findByEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  return await User.findOne({
  email: normalized,
});
}

export async function findByGoogleId(googleId) {
  if (!googleId) return null;
  return await User.findOne({
    googleId: googleId
  });
}

export async function create({
  name,
  email,
  passwordHash = null,
  googleId = null,
  picture = null,
}) {
  return await User.create({
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
    name,
    email: normalizeEmail(email),
    passwordHash,
    googleId,
    picture,
<<<<<<< HEAD
    createdAt: now,
    updatedAt: now,
=======
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  });
}

export async function update(id, patch) {
<<<<<<< HEAD
  return store.update(id, { ...patch, updatedAt: new Date().toISOString() });
=======
  return await User.findByIdAndUpdate(
    id,
    patch,
    {
      new: true,
    }
  );
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
}

// Shape returned to the client — never includes passwordHash.
export function toPublicUser(user) {
  if (!user) return null;
<<<<<<< HEAD
  const { id, name, email, picture, createdAt, googleId } = user;
  return { id, name, email, picture, createdAt, authProvider: googleId ? "google" : "password" };
=======
  return {
  id: user.id,
  name: user.name,
  email: user.email,
  picture: user.picture,
  createdAt: user.createdAt,
  authProvider: user.googleId ? "google" : "password",
};  
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
}

export default { findById, findByEmail, findByGoogleId, create, update, toPublicUser };
