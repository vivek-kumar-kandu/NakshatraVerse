import { memo, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────
// ExpandableSection (V4.5 Phase 1B — Festival Frontend Integration)
//
// A minimal collapsible "title row + body" primitive — same category of
// component as the accordion rows already used ad hoc in ResultsTabs.jsx,
// generalized into one reusable piece (like GlassCard/Badge/EmptyState/
// Skeleton). Purely presentational and self-contained: owns its own
// open/closed state, renders whatever `children` the caller passes.
// First user: Festival Detail's Rituals/Significance/Activities/Fasting
// Information sections, so the Festival Page doesn't have to render every
// section fully expanded at once.
// ─────────────────────────────────────────────────────────────────────────
function ExpandableSection({ icon, title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{
      border: "1px solid var(--nv-accent-wash, rgba(180,120,255,0.12))", borderRadius: 12,
      overflow: "hidden", background: "var(--nv-surface-subtle, rgba(18,0,38,0.4))",
    }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="tap-scale"
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
          padding: "13px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left",
          fontFamily: "Inter,sans-serif", color: "var(--nv-text-primary, #e8d5ff)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}>
          {icon && <span aria-hidden="true">{icon}</span>}
          {title}
        </span>
        <span aria-hidden="true" style={{ fontSize: 12, color: "var(--nv-text-muted, rgba(200,160,255,0.6))", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}>
          ▾
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 16px 16px", fontSize: 12.5, lineHeight: 1.6, color: "var(--nv-text-muted, rgba(200,160,255,0.7))", animation: "fadeIn 0.25s ease both" }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default memo(ExpandableSection);
