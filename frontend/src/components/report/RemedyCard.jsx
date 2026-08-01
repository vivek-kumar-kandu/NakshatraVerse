import { memo } from "react";
import { useTranslation } from "react-i18next";
import GlassCard from "../common/GlassCard.jsx";
import Badge from "../common/Badge.jsx";

const REMEDY_ICONS = {
  Mantra: "🕉️", Gemstone: "💎", Fasting: "🌙", Charity: "🤲", Deity: "🛕",
};

function iconFor(type) {
  const key = Object.keys(REMEDY_ICONS).find((k) => type?.toLowerCase().includes(k.toLowerCase()));
  return REMEDY_ICONS[key] || "🪬";
}

function RemedyCard({ type, detail, idx = 0 }) {
  const { t } = useTranslation(["results"]);
  const localizedType = type ? t(`results:remedies.types.${type}`, type) : "";
  return (
    <GlassCard style={{ padding: 16, animation: `fadeIn 0.35s ease ${idx * 0.05}s both` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span aria-hidden="true" style={{ fontSize: 16 }}>{iconFor(type)}</span>
        <Badge color="#ffb347">{localizedType}</Badge>
      </div>
      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: "var(--nv-text-secondary, rgba(230,220,255,0.8))", fontFamily: "Inter,sans-serif" }}>
        {detail}
      </p>
    </GlassCard>
  );
}

export default memo(RemedyCard);
