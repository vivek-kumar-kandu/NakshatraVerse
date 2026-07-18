// ─────────────────────────────────────────────────────────────────────────
// Password Service (Priority 5.2)
// Thin wrapper around bcryptjs so hashing/verification logic (and the
// configured cost factor) lives in exactly one place.
// ─────────────────────────────────────────────────────────────────────────
import bcrypt from "bcryptjs";
import config from "../../config/env.js";

export async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, config.BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(plainPassword, hash) {
  if (!hash) return false;
  return bcrypt.compare(plainPassword, hash);
}

export default { hashPassword, verifyPassword };
