import { memo } from "react";
import ExpandableSection from "../report/ExpandableSection.jsx";

// ─────────────────────────────────────────────────────────────────────────
// LifeCoachListCard — V4.3 (AI Life Coach)
// A single, reusable "icon + title + bullet list" card built entirely on
// the existing ExpandableSection (V3.0 Phase 3) — no new visual language.
// Used for every list-shaped section of the AI Life Coach guidance object
// (Opportunities, Challenges, Recommended Actions, Things to Avoid, and
// each category's own list fields). Purely presentational: it renders
// whatever `items` the backend-returned guidance object already contains.
// ─────────────────────────────────────────────────────────────────────────
function LifeCoachListCard({ icon, title, color = "#bf7fff", items, defaultOpen = true }) {
  if (!items?.length) return null;
  return (
    <ExpandableSection icon={icon} title={title} color={color} count={items.length} defaultOpen={defaultOpen}>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              display: "flex", gap: 10, alignItems: "flex-start",
              fontSize: 13.5, lineHeight: 1.55, color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif",
            }}
          >
            <span aria-hidden="true" style={{ color, flexShrink: 0, marginTop: 1 }}>✦</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </ExpandableSection>
  );
}

export default memo(LifeCoachListCard);
