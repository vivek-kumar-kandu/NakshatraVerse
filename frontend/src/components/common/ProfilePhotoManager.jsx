import { useEffect, useRef, useState } from "react";
import { PURPLE_GRADIENT } from "../../constants/astrology.js";
import { useToast } from "./Toast.jsx";
import {
  isSupportedPhotoFile,
  isPhotoFileTooLarge,
  fileToResizedDataUrl,
  saveStoredPhoto,
  clearStoredPhoto,
} from "../../utils/profilePhoto.js";

// ─────────────────────────────────────────────────────────────────────────
// ProfilePhotoManager (Phase 6.3 — Profile Management)
//
// A self-contained avatar + photo-management control. Reads `user.picture`
// (already populated for Google sign-in, or by a previous local upload —
// see AuthContext.jsx) and `user.name` for the initials fallback, exactly
// as AccountMenu's own Avatar already does — same fallback rule, no new
// visual language.
//
// Upload / Replace / Remove / Preview-before-save are all handled locally:
// picking a file resizes+compresses it client-side (utils/profilePhoto.js)
// and shows an inline preview with explicit Save/Cancel before anything is
// persisted. "Saving" writes to localStorage (no backend call — Phase 6.3
// is scoped to no backend API changes) and calls `onUpdate()` so the
// caller's `user` state (and therefore every other place that reads
// `user.picture`) reflects it immediately.
//
// Every interactive element here is a real <button> or <input>, so Tab/
// Enter/Space/Escape all work without extra key handling; the menu and
// preview panel additionally close on outside-click and Escape, matching
// AccountMenu.jsx's own dismissal pattern.
// ─────────────────────────────────────────────────────────────────────────

function initials(name) {
  if (!name) return "✦";
  const parts = name.trim().split(/\s+/);
  const value = ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
  return value || "✦";
}

// Small inline spinner — same visual as ConfirmDialog.jsx's ButtonSpinner,
// reusing the existing global `spin` keyframe (styles/global.css).
function Spinner({ size = 14 }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block", width: size, height: size, borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "currentColor",
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
}

const menuItemStyle = {
  display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left",
  padding: "9px 10px", background: "none", border: "none", color: "var(--nv-text-primary, #e8d5ff)",
  fontSize: 12.5, cursor: "pointer", borderRadius: 8, minHeight: 38,
  fontFamily: "Inter,sans-serif",
};

function pillStyle(variant) {
  return {
    padding: "7px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer",
    border: variant === "primary" ? "1px solid rgba(180,120,255,0.45)" : "1px solid rgba(180,120,255,0.28)",
    background: variant === "primary" ? "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))" : "rgba(123,47,255,0.12)",
    color: "#fff", fontFamily: "Inter,sans-serif", minWidth: 64,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  };
}

function ProfilePhotoManager({ user, onUpdate, size = 96 }) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const menuButtonRef = useRef(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [preview, setPreview] = useState(null); // resized data URL awaiting confirmation
  const [reading, setReading] = useState(false); // processing a just-picked file
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const hasPhoto = Boolean(user?.picture);
  const busy = reading || saving || removing;

  // Outside-click / Escape to close the action menu — same pattern as
  // AccountMenu.jsx.
  useEffect(() => {
    if (!menuOpen) return;
    const handlePointer = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setMenuOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("touchstart", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("touchstart", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  // Escape also cancels an open preview, returning focus to the trigger.
  useEffect(() => {
    if (!preview) return;
    const handleKey = (e) => {
      if (e.key === "Escape" && !busy) {
        setPreview(null);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [preview, busy]);

  const openFilePicker = () => {
    setMenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so picking the same file again still fires onChange
    if (!file) return;

    if (!isSupportedPhotoFile(file)) {
      toast.error("Please choose a JPG, PNG, or WEBP image.");
      return;
    }
    if (isPhotoFileTooLarge(file)) {
      toast.error("That image is too large. Please choose a file under 8MB.");
      return;
    }

    setReading(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setPreview(dataUrl);
    } catch (err) {
      toast.error(err.message || "Could not process that image.");
    } finally {
      setReading(false);
    }
  };

  const handleSavePreview = async () => {
    if (!preview || !user?.id) return;
    setSaving(true);
    try {
      saveStoredPhoto(user.id, preview);
      onUpdate({ picture: preview });
      toast.success("Profile photo updated.");
      setPreview(null);
    } catch (err) {
      toast.error(err.message || "Could not save your photo.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelPreview = () => {
    if (saving) return;
    setPreview(null);
    menuButtonRef.current?.focus();
  };

  const handleRemove = () => {
    if (!user?.id) return;
    setMenuOpen(false);
    setRemoving(true);
    try {
      clearStoredPhoto(user.id);
      onUpdate({ picture: null });
      toast.success("Profile photo removed.");
    } catch {
      toast.error("Could not remove your photo.");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
      <div
        style={{
          width: size, height: size, borderRadius: "50%", flexShrink: 0, position: "relative",
          background: PURPLE_GRADIENT, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: Math.round(size * 0.32), fontWeight: 700, color: "#fff", fontFamily: "Cinzel,serif",
          boxShadow: "0 0 28px rgba(123,47,255,0.5)", overflow: "hidden",
        }}
      >
        {preview ? (
          <img src={preview} alt="" aria-hidden="true" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: busy ? 0.55 : 1 }} />
        ) : hasPhoto ? (
          <img src={user.picture} alt="" aria-hidden="true" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: busy ? 0.55 : 1 }} />
        ) : (
          <span aria-hidden="true">{initials(user?.name)}</span>
        )}
        {busy && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(10,0,20,0.45)", color: "#fff",
            }}
          >
            <Spinner size={Math.round(size * 0.2)} />
          </span>
        )}
      </div>

      {!preview && (
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          disabled={busy}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label={hasPhoto ? "Change profile photo" : "Upload profile photo"}
          className="pill-btn tap-scale"
          style={{
            position: "absolute", bottom: -2, right: -2, width: 32, height: 32, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--nv-surface-strong, rgba(18,0,38,0.92))", border: "1px solid var(--nv-surface-border-hover, rgba(180,120,255,0.45))",
            color: "var(--nv-color-brand-gold, #ffd700)", fontSize: 14, cursor: busy ? "default" : "pointer", opacity: busy ? 0.5 : 1,
          }}
        >
          <span aria-hidden="true">📷</span>
        </button>
      )}

      {menuOpen && !preview && (
        <div
          role="menu"
          aria-label="Profile photo options"
          style={{
            position: "absolute", top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
            width: 190, background: "var(--nv-surface-strong, rgba(18,0,38,0.96))", border: "1px solid var(--nv-surface-border, rgba(180,120,255,0.25))",
            borderRadius: 12, padding: 6, boxShadow: "var(--nv-shadow-xl, 0 12px 40px rgba(0,0,0,0.45))", zIndex: 5,
            animation: "fadeIn 0.15s ease both",
          }}
        >
          <button role="menuitem" onClick={openFilePicker} className="menu-item" style={menuItemStyle}>
            <span aria-hidden="true">🖼️</span> {hasPhoto ? "Replace Photo" : "Upload Photo"}
          </button>
          {hasPhoto && (
            <button role="menuitem" onClick={handleRemove} className="menu-item" style={{ ...menuItemStyle, color: "var(--nv-danger, #ff9d9d)" }}>
              <span aria-hidden="true">🗑️</span> Remove Photo
            </button>
          )}
        </div>
      )}

      {preview && (
        <div
          role="dialog"
          aria-label="Preview new profile photo"
          style={{
            position: "absolute", top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
            width: 210, background: "var(--nv-surface-strong, rgba(18,0,38,0.96))", border: "1px solid var(--nv-surface-border, rgba(180,120,255,0.25))",
            borderRadius: 12, padding: 12, boxShadow: "var(--nv-shadow-xl, 0 12px 40px rgba(0,0,0,0.45))", zIndex: 5,
            display: "grid", gap: 10, animation: "fadeIn 0.15s ease both",
          }}
        >
          <p style={{ margin: 0, fontSize: 11.5, color: "var(--nv-text-secondary, rgba(200,160,255,0.7))", textAlign: "center" }}>
            Preview your new photo
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button type="button" onClick={handleCancelPreview} disabled={saving} className="pill-btn tap-scale" style={pillStyle()}>
              Cancel
            </button>
            <button type="button" onClick={handleSavePreview} disabled={saving} className="pill-btn tap-scale" style={pillStyle("primary")}>
              {saving ? <Spinner size={12} /> : "Save"}
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        style={{ display: "none" }}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}

export default ProfilePhotoManager;
