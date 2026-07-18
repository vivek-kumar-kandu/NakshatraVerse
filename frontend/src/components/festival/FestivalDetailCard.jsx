import { memo } from "react";
import GlassCard from "../common/GlassCard.jsx";
import Badge from "../common/Badge.jsx";
import ExpandableSection from "../common/ExpandableSection.jsx";

// ─────────────────────────────────────────────────────────────────────────
// FestivalDetailCard (V4.5 Phase 1B — Festival Frontend Integration)
// Full detail view for a single festival occurrence — every field the
// Festival Backend's occurrence shape exposes (see festivalEngine.js's
// toPublicOccurrence): Importance, Description, Historical Background,
// Religious Significance, Recommended Activities, Rituals, Fasting
// Information, Region. All read-only rendering of already-computed
// backend data — no calculation happens here.
// ─────────────────────────────────────────────────────────────────────────
const IMPORTANCE_COLOR = { High: "#ffd700", Medium: "#bf7fff", Low: "#9dc9ff" };

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, {
      weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
    });
  } catch {
    return value;
  }
}

function List({ items }) {
  if (!items?.length) return <p style={{ margin: 0 }}>Not specified.</p>;
  return (
    <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

function FestivalDetailCard({ festival, onExplain, explaining, explanation }) {
  if (!festival) return null;
  const importanceColor = IMPORTANCE_COLOR[festival.importance] || "#bf7fff";

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <GlassCard style={{ padding: "22px 24px", animation: "fadeIn 0.35s ease both" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: "Cinzel,serif", fontSize: 19, color: "var(--nv-text-primary, #f1e4ff)" }}>{festival.name}</h2>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>
              {formatDate(festival.date)}{festival.endDate && festival.endDate !== festival.date ? ` – ${formatDate(festival.endDate)}` : ""}
            </p>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Badge color={importanceColor}>{festival.importance} Importance</Badge>
            <Badge color="#7effb2">{festival.type}</Badge>
          </div>
        </div>

        {festival.description && (
          <p style={{ margin: "16px 0 0", fontSize: 13, lineHeight: 1.65, color: "var(--nv-text-muted, rgba(200,160,255,0.75))" }}>
            {festival.description}
          </p>
        )}

        {festival.region?.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14 }}>
            {festival.region.map((r) => <Badge key={r} color="#9dc9ff">{r}</Badge>)}
          </div>
        )}

        {onExplain && (
          <button
            onClick={onExplain}
            disabled={explaining}
            className="pill-btn tap-scale"
            style={{
              marginTop: 16, padding: "10px 18px", borderRadius: 20, fontSize: 12.5, fontWeight: 600,
              cursor: explaining ? "default" : "pointer", border: "1px solid rgba(180,120,255,0.4)",
              background: "rgba(123,47,255,0.18)", color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif",
            }}
          >
            ✨ {explaining ? "Asking Gemini…" : "Explain This Festival"}
          </button>
        )}

        {explanation && (
          <p style={{ margin: "14px 0 0", fontSize: 12.5, lineHeight: 1.6, color: "#e8d5ff", padding: 14, borderRadius: 10, background: "rgba(123,47,255,0.1)", border: "1px solid rgba(180,120,255,0.2)" }}>
            {explanation}
          </p>
        )}
      </GlassCard>

      {festival.historicalBackground && (
        <ExpandableSection icon="📜" title="Historical Background">
          <p style={{ margin: 0 }}>{festival.historicalBackground}</p>
        </ExpandableSection>
      )}

      {festival.religiousSignificance && (
        <ExpandableSection icon="🕉️" title="Significance" defaultOpen>
          <p style={{ margin: 0 }}>{festival.religiousSignificance}</p>
        </ExpandableSection>
      )}

      <ExpandableSection icon="🪔" title="Rituals" defaultOpen>
        <List items={festival.rituals} />
      </ExpandableSection>

      <ExpandableSection icon="✨" title="Recommended Activities">
        <List items={festival.recommendedActivities} />
      </ExpandableSection>

      {festival.fastingInfo && (
        <ExpandableSection icon="🍽️" title="Fasting Information">
          <p style={{ margin: "0 0 8px", fontWeight: 600, color: "var(--nv-text-primary, #e8d5ff)" }}>
            {festival.fastingInfo.isFastObserved ? "Fasting observed" : "No fasting traditionally observed"}
            {festival.fastingInfo.fastType ? ` — ${festival.fastingInfo.fastType}` : ""}
          </p>
          <List items={festival.fastingInfo.guidelines} />
        </ExpandableSection>
      )}
    </div>
  );
}

export default memo(FestivalDetailCard);
