import { memo } from "react";
import ExpandableSection from "../report/ExpandableSection.jsx";

// ─────────────────────────────────────────────────────────────────────────
// LifeCoachCategoryCard — V4.3 (AI Life Coach)
// Renders one coach category (Career / Relationship / Finance / Health) as
// a stack of label + short-paragraph rows inside the existing
// ExpandableSection. Unlike InsightRow (a tight two-column label:value
// row meant for short values), each guidance field here is a 1-2 sentence
// string, so rows stack vertically instead. Purely presentational — reads
// exactly the fields the backend-returned guidance object already has.
// ─────────────────────────────────────────────────────────────────────────
function LifeCoachCategoryCard({ icon, title, color = "#bf7fff", fields, defaultOpen = false }) {
  const entries = (fields || []).filter((f) => f.value);
  if (!entries.length) return null;
  return (
    <ExpandableSection icon={icon} title={title} color={color} defaultOpen={defaultOpen}>
      <div style={{ display: "grid", gap: 14 }}>
        {entries.map(({ label, value }) => (
          <div key={label}>
            <p style={{ margin: "0 0 3px", fontSize: 11, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>
              {label}
            </p>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif" }}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </ExpandableSection>
  );
}

export default memo(LifeCoachCategoryCard);
