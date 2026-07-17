// ─────────────────────────────────────────────────────────────────────────
// User Repository (Priority 5.2)
// Single responsibility: persistence for user accounts. No password
// hashing, token issuing, or HTTP concerns live here — see
// services/auth/* and controllers/auth.controller.js for that. Keeping
// this layer thin means the underlying store (currently a JSON file, see
// db/jsonFileStore.js) can be swapped for a real database later without
// touching auth/user business logic.
// ─────────────────────────────────────────────────────────────────────────
import path from "node:path";
import config from "../config/env.js";
import JsonFileStore from "../db/jsonFileStore.js";

const store = new JsonFileStore(path.join(config.DATA_DIR, "users.json"));

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

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
    name,
    email: normalizeEmail(email),
    passwordHash,
    googleId,
    picture,
    createdAt: now,
    updatedAt: now,
  });
}

export async function update(id, patch) {
  return store.update(id, { ...patch, updatedAt: new Date().toISOString() });
}

// Shape returned to the client — never includes passwordHash.
export function toPublicUser(user) {
  if (!user) return null;
  const { id, name, email, picture, createdAt, googleId } = user;
  return { id, name, email, picture, createdAt, authProvider: googleId ? "google" : "password" };
}

export default { findById, findByEmail, findByGoogleId, create, update, toPublicUser };
