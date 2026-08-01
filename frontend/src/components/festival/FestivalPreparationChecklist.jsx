import { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ExpandableSection from "../common/ExpandableSection.jsx";
import SkeletonList from "../common/Skeleton.jsx";
import * as festivalIntelligenceApi from "../../utils/festivalIntelligenceApi.js";

// ─────────────────────────────────────────────────────────────────────────
// FestivalPreparationChecklist (V4.5 Phase 2 — Festival Intelligence)
//
// New, additive component. Fetches the deterministic (no-Gemini-required)
// preparation checklist from /api/festival-intelligence/preparation and
// renders it as seven checkable sections: Preparation, Shopping, Puja
// Materials, Fasting Preparation, Morning Routine, Evening Ritual, and
// Post-Festival Reflection. Checked state is local-only (component state,
// per festival key) — this is a session convenience, not a saved user
// record, so it never needs a backend write.
// ─────────────────────────────────────────────────────────────────────────
const SECTIONS = [
  {key: "preparationChecklist", icon: "📝" },
  { key: "shoppingChecklist", icon: "🛍️" },
  { key: "pujaMaterials", icon: "🪔" },
  { key: "fastingPreparation", icon: "🍽️" },
  { key: "morningRoutine", icon: "🌅" },
  { key: "eveningRitual", icon: "🌆" },
  { key: "postFestivalReflection", icon: "🙏" },
];

function ChecklistItems({ items, sectionKey, checked, onToggle, t }) {
  if (!items?.length) return <p style={{ margin: 0 }}>{t("festival:preparationChecklist.nothingSpecified")}</p>;
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {items.map((item, i) => {
        const id = `${sectionKey}-${i}`;
        const isChecked = Boolean(checked[id]);
        return (
          <label key={id} style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: 12.5, lineHeight: 1.5 }}>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => onToggle(id)}
              style={{ marginTop: 3, accentColor: "#bf7fff", flexShrink: 0 }}
            />
            <span style={{ textDecoration: isChecked ? "line-through" : "none", opacity: isChecked ? 0.6 : 1 }}>{item}</span>
          </label>
        );
      })}
    </div>
  );
}

function FestivalPreparationChecklist({ festival }) {
  const { t } = useTranslation(["festival"]);
  const [preparation, setPreparation] = useState(null);
  const [error, setError] = useState(null);
  const [checked, setChecked] = useState({});

  useEffect(() => {
    if (!festival) return;
    setPreparation(null);
    setError(null);
    setChecked({});
    festivalIntelligenceApi.getFestivalPreparation(festival)
      .then(setPreparation)
      .catch((err) => setError(err.message || t("festival:preparationChecklist.loadFailed")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [festival?.key, festival?.date]);

  if (!festival) return null;
  if (error) return <p style={{ margin: 0, fontSize: 12.5, color: "#ff8f7e" }}>{error}</p>;
  if (!preparation) return <SkeletonList rows={2} />;

  const toggle = (id) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {SECTIONS.map((sec) => (
        <ExpandableSection key={sec.key} icon={sec.icon} title={t(`festival:preparationChecklist.sections.${sec.key}`)}>
          <ChecklistItems items={preparation[sec.key]} sectionKey={sec.key} checked={checked} onToggle={toggle} t={t} />
        </ExpandableSection>
      ))}
    </div>
  );
}

export default memo(FestivalPreparationChecklist);
