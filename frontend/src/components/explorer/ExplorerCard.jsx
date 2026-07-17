import { memo, forwardRef } from "react";

// ─────────────────────────────────────────────────────────────────────────
// ExplorerCard (V5.0 Phase 5A — Explorer Infrastructure)
//
// Generic, reusable selectable row used inside the Explorer side panel for
// every selection type (Planet/House/Sign/Yoga/Dosha/Nakshatra/Ascendant/
// Aspect). Deliberately modeled on the existing `PlanetCard` interaction
// pattern (hover/select/focus styling, `tap-scale` class, design tokens)
// so the Explorer feels native to the rest of the report rather than
// introducing a new visual language.
//
// Pure presentation: no astrology data, no fetching. `ref` is forwarded so
// ExplorerSidePanel can manage roving-tabindex keyboard focus.
// ─────────────────────────────────────────────────────────────────────────
const ExplorerCard = forwardRef(function ExplorerCard(
  { label, sublabel, icon, color = "#bf7fff", selected, tabIndex = -1, onClick, onKeyDown, onFocus, id, role = "option" },
  ref
) {
  return (
    <button
      ref={ref}
      id={id}
      type="button"
      role={role}
      aria-selected={selected}
      tabIndex={tabIndex}
      className="tap-scale"
      onClick={onClick}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      style={{
        display: "grid", gridTemplateColumns: icon ? "auto 1fr auto" : "1fr auto",
        alignItems: "center", gap: 8, width: "100%",
        padding: "9px 12px", textAlign: "left", font: "inherit", cursor: "pointer",
        borderRadius: 10, border: `1px solid ${selected ? color : `${color}20`}`,
        background: selected ? `${color}1c` : "rgba(255,255,255,0.03)",
        boxShadow: selected ? `0 0 0 1px ${color}55` : "none",
        transition: "background var(--nv-duration-base) var(--nv-ease-standard), border-color var(--nv-duration-base) var(--nv-ease-standard), transform var(--nv-duration-fast) var(--nv-ease-standard)",
      }}
    >
      {icon && <span aria-hidden="true" style={{ fontSize: 15 }}>{icon}</span>}
      <span style={{ fontSize: 13, color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif", fontWeight: selected ? 600 : 400 }}>
        {label}
      </span>
      {sublabel && (
        <span style={{ fontSize: 11.5, color: "var(--nv-text-muted, rgba(200,160,255,0.55))", fontFamily: "Inter,sans-serif" }}>
          {sublabel}
        </span>
      )}
    </button>
  );
});

export default memo(ExplorerCard);
