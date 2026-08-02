import mongoose from "mongoose";
import crypto from "node:crypto";

// _id is a String UUID (not the default ObjectId) so it behaves exactly
// like the "id" field the old JsonFileStore generated with
// crypto.randomUUID(). Mongoose exposes `.id` as an alias for `._id` by
// default, so existing code that reads `user.id` keeps working unchanged.
const userSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => crypto.randomUUID() },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, default: null },
    googleId: { type: String, default: null, index: true },
    picture: { type: String, default: null },
    tokenVersion: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
