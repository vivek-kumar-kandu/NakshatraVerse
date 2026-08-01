import mongoose from "mongoose";
import crypto from "node:crypto";

const reportSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => crypto.randomUUID() },
    userId: { type: String, required: true, index: true },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
    strict: false,
  }
);

// ── Indexes (additive) ──────────────────────────────────────────────────
// findByUser() sorts by createdAt desc for every list/personalization
// read, so a compound index on exactly that shape avoids an in-memory
// sort once a user has many saved reports.
reportSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Report || mongoose.model("Report", reportSchema);
