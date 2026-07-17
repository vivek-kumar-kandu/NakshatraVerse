// ─────────────────────────────────────────────────────────────────────────
// profilePhoto (Phase 6.3 — Profile Management)
//
// The backend's user model already has a `picture` field (Priority 5.2 —
// populated for Google sign-in, see backend/repositories/user.repository.js
// and toPublicUser()), but there is no upload endpoint for it and Phase 6.3
// is explicitly scoped to not add or modify any backend API. So a custom
// uploaded photo is persisted client-side only, keyed by user id, and
// merged onto the in-memory `user` object (see AuthContext.jsx) so every
// existing consumer that already reads `user.picture` — AccountMenu's
// Avatar, Dashboard's Profile Summary — picks it up for free with no
// changes to their own rendering logic.
//
// Photos are resized/compressed client-side before being stored so a
// multi-megabyte phone photo doesn't blow past localStorage's per-origin
// quota (~5MB in most browsers) or make the UI sluggish.
// ─────────────────────────────────────────────────────────────────────────

const STORAGE_PREFIX = "nv_profile_photo_";
const MAX_DIMENSION = 480; // px — plenty for any avatar size this UI renders
const OUTPUT_MIME = "image/jpeg";
const OUTPUT_QUALITY = 0.86;
const MAX_SOURCE_FILE_BYTES = 8 * 1024 * 1024; // 8MB, before client-side resize

export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function isSupportedPhotoFile(file) {
  return !!file && ACCEPTED_PHOTO_TYPES.includes(file.type);
}

export function isPhotoFileTooLarge(file) {
  return !!file && file.size > MAX_SOURCE_FILE_BYTES;
}

export function readStoredPhoto(userId) {
  if (!userId) return null;
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + userId) || null;
  } catch {
    // Storage may be unavailable (private browsing, disabled storage, etc.)
    // — treat exactly like "no photo saved" rather than throwing.
    return null;
  }
}

export function saveStoredPhoto(userId, dataUrl) {
  if (!userId) throw new Error("No account to save this photo to.");
  try {
    window.localStorage.setItem(STORAGE_PREFIX + userId, dataUrl);
  } catch {
    throw new Error("Could not save your photo — your browser storage may be full or unavailable.");
  }
}

export function clearStoredPhoto(userId) {
  if (!userId) return;
  try {
    window.localStorage.removeItem(STORAGE_PREFIX + userId);
  } catch {
    // no-op — nothing to clean up if storage isn't reachable
  }
}

// Reads an image file, downsizes it to at most MAX_DIMENSION on its longest
// edge (upscaling never happens — smaller sources are left as-is aside
// from re-encoding), and resolves a compact JPEG data URL suitable for
// both an in-memory preview and localStorage persistence.
export function fileToResizedDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that image file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file doesn't look like a valid image."));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Your browser can't process images right now."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        try {
          resolve(canvas.toDataURL(OUTPUT_MIME, OUTPUT_QUALITY));
        } catch {
          reject(new Error("Could not process that image."));
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
