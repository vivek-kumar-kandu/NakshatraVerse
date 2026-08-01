// ─────────────────────────────────────────────────────────────────────────
// User Repository (Priority 5.2)
// Single responsibility: persistence for user accounts. No password
// hashing, token issuing, or HTTP concerns live here — see
// services/auth/* and controllers/auth.controller.js for that. Keeping
// this layer thin means the underlying store (currently a JSON file, see
// db/jsonFileStore.js) can be swapped for a real database later without
// touching auth/user business logic.
// ─────────────────────────────────────────────────────────────────────────
import User from "../models/User.model.js";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

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
    name,
    email: normalizeEmail(email),
    passwordHash,
    googleId,
    picture,
  });
}

export async function update(id, patch) {
  return await User.findByIdAndUpdate(
    id,
    patch,
    {
      new: true,
    }
  );
}

// Shape returned to the client — never includes passwordHash.
export function toPublicUser(user) {
  if (!user) return null;
  return {
  id: user.id,
  name: user.name,
  email: user.email,
  picture: user.picture,
  createdAt: user.createdAt,
  authProvider: user.googleId ? "google" : "password",
};  
}

export default { findById, findByEmail, findByGoogleId, create, update, toPublicUser };
