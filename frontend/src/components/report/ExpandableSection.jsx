import { memo, useState, useId } from "react";
import GlassCard from "../common/GlassCard.jsx";
import Badge from "../common/Badge.jsx";

// ─────────────────────────────────────────────────────────────────────────
// ExpandableSection (V3.0 Phase 3 — Interactive Report Experience)
//
// A single, reusable expand/collapse wrapper used across the report for
// long sections (Yogas, Doshas, Predictions, Remedies, Nakshatra Profile).
// Purely presentational — it renders whatever `children` already contain,
// it doesn't fetch, compute, or reshape backend data. `defaultOpen`
// defaults to true so the section is readable without an extra tap, per
// the Phase 3 spec ("Default state should remain readable").
// ─────────────────────────────────────────────────────────────────────────
function ExpandableSection({ icon, title, color = "#bf7fff", count, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <GlassCard style={{ padding: 0, overflow: "hidden", animation: "fadeIn 0.35s ease both" }}>
      <button
        type="button"
        className="tap-scale"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          padding: "16px 20px", background: "transparent", border: "none",
          cursor: "pointer", textAlign: "left", font: "inherit",
        }}
      >
        {icon && <span aria-hidden="true" style={{ fontSize: 20 }}>{icon}</span>}
        <h3 style={{ margin: 0, fontSize: 15, color, fontFamily: "Cinzel,serif", fontWeight: 600, flex: 1 }}>
          {title}
        </h3>
        {typeof count === "number" && <Badge color={color}>{count}</Badge>}
        <span
          aria-hidden="true"
          style={{
            display: "inline-block", fontSize: 13, color: "var(--nv-text-muted, rgba(200,160,255,0.55))",
            transition: "transform var(--nv-duration-base, 220ms) var(--nv-ease-standard, ease)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▾
        </span>
      </button>
      {open && (
        <div id={panelId} className="detail-panel-in" style={{ padding: "0 20px 20px" }}>
          {children}
        </div>
      )}
    </GlassCard>
  );
}

export default memo(ExpandableSection);
