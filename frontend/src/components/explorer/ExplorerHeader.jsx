import { memo } from "react";
import Badge from "../common/Badge.jsx";
import { GOLD_GRADIENT } from "../../constants/astrology.js";
import { EXPLORER_TYPE_MAP } from "../../constants/explorer.js";
import { useExplorer } from "../../context/ExplorerContext.jsx";

// ─────────────────────────────────────────────────────────────────────────
// ExplorerHeader (V5.0 Phase 5A — Explorer Infrastructure)
//
// Title + a small breadcrumb reflecting the current selection, read
// straight from ExplorerContext. Purely presentational, reusing the same
// gold-gradient heading treatment and Badge component already used
// throughout the report.
// ─────────────────────────────────────────────────────────────────────────
function ExplorerHeader() {
  const { selectedType, selectedItem } = useExplorer();
  const typeMeta = selectedType ? EXPLORER_TYPE_MAP[selectedType] : null;

  return (
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <span aria-hidden="true" style={{ fontSize: 26 }}>🧭</span>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: "clamp(16px,3vw,20px)", background: GOLD_GRADIENT,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "Cinzel,serif", fontWeight: 700 }}>
            Kundli Explorer
          </h2>
          <p style={{ margin: 0, fontSize: 12, color: "var(--nv-text-muted, rgba(200,160,255,0.5))", fontFamily: "Inter,sans-serif" }}
             aria-live="polite">
            {typeMeta ? `${typeMeta.label} · ${selectedItem?.label ?? selectedItem ?? "—"}` : "Select an item to begin exploring"}
          </p>
        </div>
      </div>
      {typeMeta && (
        <Badge color={typeMeta.color}>
          <span aria-hidden="true">{typeMeta.icon} </span>{typeMeta.label}
        </Badge>
      )}
    </header>
  );
}

export default memo(ExplorerHeader);
