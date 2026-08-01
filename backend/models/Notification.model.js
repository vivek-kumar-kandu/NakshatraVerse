import mongoose from "mongoose";
import crypto from "node:crypto";

const notificationSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => crypto.randomUUID() },
    userId: { type: String, required: true, index: true },
    isRead: { type: Boolean, default: false },
    expiresAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
    strict: false,
  }
);

// ── Indexes (additive, migration-related — no schema/response shape
// change) ───────────────────────────────────────────────────────────────
// Every notification read in this codebase starts from `userId`, so a
// leading `userId` in every compound index below lets Mongo use a single
// index for each real query shape instead of a full per-user collection
// scan:
//   - findByUser(): userId + sort(createdAt desc)              -> idx 1
//   - unread-count / isRead filters: userId + isRead            -> idx 2
//   - findByUserAndDedupeKey(): userId + metadata.dedupeKey     -> idx 3
//   - removeStaleExpiredForUser(): userId + isRead + expiresAt  -> idx 4
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, "metadata.dedupeKey": 1 });
notificationSchema.index({ userId: 1, isRead: 1, expiresAt: 1 });

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
