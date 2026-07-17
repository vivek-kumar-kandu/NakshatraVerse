import { memo } from "react";
import GlassCard from "../../common/GlassCard.jsx";
import Badge from "../../common/Badge.jsx";

// ─────────────────────────────────────────────────────────────────────────
// ExplorerDetailShell (V5.0 Phase 5B — Explorer Infrastructure: Backend
// Integration)
//
// Shared header chrome (icon + title + "Explorer" badge) reused by all
// eight detail panels, replacing the Phase 5A `ExplorerPlaceholderPanel`'s
// role now that each panel renders its own real backend-driven body as
// `children` instead of the old placeholder paragraph. Keeps the exact
// same heading contract Phase 5A shipped (`<h3>{item?.label ?? label}</h3>`)
// so the existing Explorer test suite (which asserts a heading matching
// the selected item's label, e.g. "Sun ☀️" or "House 1") keeps passing
// unchanged.
// ─────────────────────────────────────────────────────────────────────────
function ExplorerDetailShell({ icon, label, color, item, children }) {
  return (
    <div style={{ display: "grid", gap: 16, animation: "fadeIn 0.3s ease both" }}>
      <GlassCard style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
          <span aria-hidden="true" style={{ fontSize: 22 }}>{icon}</span>
          <h3 style={{ margin: 0, fontSize: 16, color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Cinzel,serif", fontWeight: 700 }}>
            {item?.label ?? label}
          </h3>
          <Badge color={color} style={{ marginLeft: "auto" }}>{label}</Badge>
        </div>
      </GlassCard>
      {children}
    </div>
  );
}

export default memo(ExplorerDetailShell);
