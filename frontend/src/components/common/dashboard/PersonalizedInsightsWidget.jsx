import { useEffect, useState } from "react";
import GlassCard from "../GlassCard.jsx";
import Badge from "../Badge.jsx";
import { fetchPersonalization } from "../../../utils/personalizationApi.js";

function score(confidence) { return confidence?.score != null ? `${confidence.label || "Confidence"} · ${confidence.score}/100` : null; }

export default function PersonalizedInsightsWidget({ reportId }) {
  const [period, setPeriod] = useState("daily");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!reportId) { setData(null); return undefined; }
    let cancelled = false;
    setError(null);
    fetchPersonalization({ reportId, period }).then((value) => !cancelled && setData(value)).catch((err) => !cancelled && setError(err.message));
    return () => { cancelled = true; };
  }, [reportId, period]);
  if (!reportId) return null;
  return <GlassCard style={{ padding: "22px 24px" }} aria-label="Personalized insights">
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
      <div><h3 style={{ margin: 0, fontFamily: "Cinzel,serif", color: "var(--nv-text-primary, #e8d5ff)" }}>✦ Your personalized guidance</h3><p style={{ margin: "6px 0 0", color: "var(--nv-text-muted)", fontSize: 13 }}>{data?.summary?.body || "Loading guidance from your latest saved reading…"}</p></div>
      <div role="group" aria-label="Insight period">{["daily", "weekly", "monthly"].map((item) => <button key={item} type="button" onClick={() => setPeriod(item)} style={{ marginLeft: 6, border: 0, borderRadius: 14, padding: "6px 10px", cursor: "pointer", background: period === item ? "rgba(191,127,255,.35)" : "transparent", color: "var(--nv-text-primary)" }}>{item}</button>)}</div>
    </div>
    {error && <p role="alert" style={{ color: "#ff9e9e" }}>{error}</p>}
    {data?.insightCards?.length > 0 && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginTop: 16 }}>{data.insightCards.map((card) => <div key={card.id} style={{ border: "1px solid rgba(180,120,255,.22)", borderRadius: 12, padding: 12 }}><strong>{card.title}</strong><p style={{ fontSize: 13, margin: "7px 0", color: "var(--nv-text-muted)" }}>{card.body}</p>{score(card.confidence) && <Badge color="#bf7fff">{score(card.confidence)}</Badge>}</div>)}</div>}
    {data?.whatsChanged?.available && <p style={{ margin: "14px 0 0", fontSize: 13, color: "var(--nv-text-muted)" }}><strong>What’s changed:</strong> {data.whatsChanged.message}</p>}
  </GlassCard>;
}
