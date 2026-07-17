import { memo } from "react";
import GlassCard from "../common/GlassCard.jsx";
import Badge from "../common/Badge.jsx";

// ─────────────────────────────────────────────────────────────────────────
// ProfileCard (V4.2 — Family Profiles & Relationship Hub)
// A single saved Family Profile, styled after ReportCard.jsx's "grid"
// variant (same Emblem-header / Badge-row / action-row layout language).
// Every action is a plain callback the caller supplies — this component
// owns no data and calls no API itself.
// ─────────────────────────────────────────────────────────────────────────

const RELATIONSHIP_ICONS = {
  father: "👨", mother: "👩", husband: "🤵", wife: "👰", son: "👦", daughter: "👧",
  brother: "🧑", sister: "👧", friend: "🤝", client: "💼", custom: "✦",
};

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

const actionBtnStyle = (variant) => ({
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
  padding: "8px 13px", borderRadius: 20, fontSize: 11.5, fontWeight: 600, cursor: "pointer",
  fontFamily: "Inter,sans-serif", whiteSpace: "nowrap",
  border: variant === "danger" ? "1px solid rgba(255,100,100,0.35)" : "1px solid rgba(180,120,255,0.35)",
  background: variant === "danger" ? "rgba(120,20,20,0.25)" : "rgba(123,47,255,0.15)",
  color: variant === "danger" ? "var(--nv-danger, #ff9d9d)" : "var(--nv-text-primary, #e8d5ff)",
});

function ProfileCard({ profile, onOpen, onEdit, onDuplicate, onArchive, onRestore, onDelete, onCompare }) {
  const p = profile;
  return (
    <GlassCard className="tap-scale" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{
        padding: "16px 20px", display: "flex", alignItems: "center", gap: 12,
        background: "linear-gradient(135deg, rgba(123,47,255,0.22), rgba(255,180,0,0.08))",
        borderBottom: "1px solid var(--nv-surface-border, rgba(180,120,255,0.16))",
      }}>
        <div aria-hidden="true" style={{
          width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, rgba(123,47,255,0.35), rgba(255,180,0,0.18))",
          border: "1px solid rgba(255,215,0,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 19, boxShadow: "0 0 16px rgba(123,47,255,0.35)",
        }}>
          {RELATIONSHIP_ICONS[p.relationship] || "✦"}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 15.5, color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Cinzel,serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.name}
          </h3>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>
            {p.lastOpenedAt ? `opened ${formatDate(p.lastOpenedAt)}` : `added ${formatDate(p.createdAt)}`}
          </p>
        </div>
      </div>

      <div style={{ padding: "14px 20px", display: "flex", flexWrap: "wrap", gap: 8, flex: 1 }}>
        <Badge color="#bf7fff">{p.relationshipLabel}</Badge>
        {p.dob && <Badge color="#9dc9ff">{formatDate(p.dob)}</Badge>}
        {p.pob && <Badge color="#ffd700">{p.pob}</Badge>}
        {p.archived && <Badge color="#ff9d9d">Archived</Badge>}
      </div>

      <div style={{ padding: "12px 20px 16px", display: "flex", gap: 8, flexWrap: "wrap", borderTop: "1px solid var(--nv-accent-wash, rgba(180,120,255,0.1))" }}>
        {!p.archived && onOpen && <button type="button" className="tap-scale" style={actionBtnStyle()} onClick={() => onOpen(p)}>✦ Open</button>}
        {!p.archived && onCompare && <button type="button" className="tap-scale" style={actionBtnStyle()} onClick={() => onCompare(p)}>💞 Compare</button>}
        {!p.archived && onEdit && <button type="button" className="tap-scale" style={actionBtnStyle()} onClick={() => onEdit(p)}>✎ Edit</button>}
        {onDuplicate && <button type="button" className="tap-scale" style={actionBtnStyle()} onClick={() => onDuplicate(p)}>⧉ Duplicate</button>}
        {!p.archived && onArchive && <button type="button" className="tap-scale" style={actionBtnStyle()} onClick={() => onArchive(p)}>🗄 Archive</button>}
        {p.archived && onRestore && <button type="button" className="tap-scale" style={actionBtnStyle()} onClick={() => onRestore(p)}>↺ Restore</button>}
        {onDelete && <button type="button" className="tap-scale" style={actionBtnStyle("danger")} onClick={() => onDelete(p)}>✕ Delete</button>}
      </div>
    </GlassCard>
  );
}

export default memo(ProfileCard);
