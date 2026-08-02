import mongoose from "mongoose";
import crypto from "node:crypto";

// Family profile documents vary in shape (birth data, relationship
// metadata, computed chart snippets, etc.), so the body is stored as a
// Mixed blob rather than a rigid schema — this mirrors the old
// JsonFileStore, which imposed no shape at all beyond `userId`/timestamps.
const familyProfileSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => crypto.randomUUID() },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    dob: { type: String, required: true, trim: true },
    tob: { type: String, default: "", trim: true },
    pob: { type: String, default: "", trim: true },
    gender: { type: String, default: "", trim: true },
    relationship: { type: String, default: "", trim: true },
    archived: { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
    strict: true,
  }
);

// ── Indexes (additive) ──────────────────────────────────────────────────
// findByUser() sorts by updatedAt desc for every list/recently-opened
// read, so a compound index on exactly that shape avoids an in-memory
// sort once a user has many saved profiles.
familyProfileSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.models.FamilyProfile || mongoose.model("FamilyProfile", familyProfileSchema);
