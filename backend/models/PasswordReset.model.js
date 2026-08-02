// ─────────────────────────────────────────────────────────────────────────
// PasswordReset Model (BUG-04 fix)
// Persists password reset tokens across multiple backend instances.
// Replaces the previous in-memory Map in passwordResetService.js, which
// was lost on every process restart and didn't work in multi-instance
// deployments.
//
// The tokenHash (SHA-256 of the raw token) is stored — never the raw token
// itself — so a MongoDB breach doesn't expose usable reset links.
//
// The TTL index on expiresAt makes MongoDB automatically delete expired
// documents (background, no application code needed). The expireAfterSeconds
// value of 0 means "delete the document when the current time exceeds
// the expiresAt field value", which is the standard MongoDB TTL pattern.
// ─────────────────────────────────────────────────────────────────────────
import mongoose from "mongoose";

const passwordResetSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    userId:    { type: String, required: true, index: true },
    expiresAt: { type: Date,   required: true },
    used:      { type: Boolean, default: false },
  },
  {
    versionKey: false,
    // No timestamps needed — expiresAt tracks creation implicitly (TTL = 15min).
  }
);

// MongoDB TTL index: automatically removes documents after expiresAt.
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.PasswordReset ||
  mongoose.model("PasswordReset", passwordResetSchema);
