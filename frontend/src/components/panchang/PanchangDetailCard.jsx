import { memo } from "react";
import GlassCard from "../common/GlassCard.jsx";
import Badge from "../common/Badge.jsx";
import InsightRow from "../common/InsightRow.jsx";

// ─────────────────────────────────────────────────────────────────────────
// PanchangDetailCard (V4.1 Phase 2 — Daily Panchang & Muhurat Finder)
//
// Pure presentation of an already-backend-computed Panchang object (see
// utils/panchangApi.js's getDailyPanchang / backend panchangEngine.js).
// Renders every field the spec calls for: Tithi, Nakshatra, Yoga, Karana,
// Paksha, Sunrise, Sunset, Moonrise, Moonset, Rahu Kaal, Gulika Kaal,
// Yamaganda, Abhijit Muhurat, Brahma Muhurat. No calculation happens here.
// ─────────────────────────────────────────────────────────────────────────
function TimeRow({ icon, label, value, color = "#bf7fff" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--nv-accent-wash, rgba(180,120,255,0.1))", gap: 12 }}>
      <span style={{ fontSize: 13, color: "var(--nv-text-muted, rgba(200,160,255,0.6))", fontFamily: "Inter,sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
        <span aria-hidden="true">{icon}</span>{label}
      </span>
      <span style={{ fontSize: 13, color, fontWeight: 600, fontFamily: "Inter,sans-serif" }}>{value}</span>
    </div>
  );
}

function PanchangDetailCard({ panchang }) {
  if (!panchang) return null;
  const { tithi, nakshatra, yoga, karana, paksha } = panchang;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {/* Five Panchang limbs */}
      <GlassCard style={{ padding: "22px 24px" }}>
        <h3 style={{ margin: "0 0 14px", fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--nv-text-muted, rgba(200,160,255,0.55))", fontFamily: "Inter,sans-serif" }}>
          Panchang — {panchang.date} ({panchang.weekday})
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          <Badge color="#ffd700">{tithi.name}</Badge>
          <Badge color="#bf7fff">{paksha}</Badge>
          <Badge color="#9dc9ff">{nakshatra.name} · Pada {nakshatra.pada}</Badge>
          <Badge color={yoga.isInauspicious ? "#ff8f7e" : "#7effb2"}>{yoga.name} Yoga</Badge>
          <Badge color={karana.isInauspicious ? "#ff8f7e" : "#7effb2"}>{karana.name} Karana</Badge>
        </div>
        <InsightRow label="Tithi" value={`${tithi.name} (${tithi.percentComplete}% complete)`} />
        <InsightRow label="Nakshatra" value={`${nakshatra.name} · Pada ${nakshatra.pada}`} color="#9dc9ff" />
        <InsightRow label="Yoga" value={yoga.name} color={yoga.isInauspicious ? "#ff8f7e" : "#7effb2"} />
        <InsightRow label="Karana" value={karana.name} color={karana.isInauspicious ? "#ff8f7e" : "#7effb2"} />
        <InsightRow label="Paksha" value={paksha} color="#bf7fff" />
      </GlassCard>

      {/* Sun / Moon timings */}
      <GlassCard style={{ padding: "22px 24px" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--nv-text-muted, rgba(200,160,255,0.55))", fontFamily: "Inter,sans-serif" }}>
          Sun & Moon Timings
        </h3>
        <TimeRow icon="🌅" label="Sunrise" value={panchang.sunrise} color="#ffd700" />
        <TimeRow icon="🌇" label="Sunset" value={panchang.sunset} color="#ff9ed8" />
        <TimeRow icon="🌙" label="Moonrise" value={panchang.moonrise} color="#9dc9ff" />
        <TimeRow icon="🌘" label="Moonset" value={panchang.moonset} color="#bf7fff" />
      </GlassCard>

      {/* Caution periods */}
      <GlassCard style={{ padding: "22px 24px" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--nv-text-muted, rgba(200,160,255,0.55))", fontFamily: "Inter,sans-serif" }}>
          ⚠ Caution Periods
        </h3>
        <TimeRow icon="🔴" label="Rahu Kaal" value={`${panchang.rahuKaal.start} – ${panchang.rahuKaal.end}`} color="#ff8f7e" />
        <TimeRow icon="🟠" label="Gulika Kaal" value={`${panchang.gulikaKaal.start} – ${panchang.gulikaKaal.end}`} color="#ff8f7e" />
        <TimeRow icon="🟡" label="Yamaganda" value={`${panchang.yamaganda.start} – ${panchang.yamaganda.end}`} color="#ff8f7e" />
      </GlassCard>

      {/* Auspicious windows */}
      <GlassCard style={{ padding: "22px 24px" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--nv-text-muted, rgba(200,160,255,0.55))", fontFamily: "Inter,sans-serif" }}>
          ✓ Auspicious Windows
        </h3>
        <TimeRow icon="🕉️" label="Abhijit Muhurat" value={`${panchang.abhijitMuhurat.start} – ${panchang.abhijitMuhurat.end}`} color="#7effb2" />
        <TimeRow icon="🌌" label="Brahma Muhurat" value={`${panchang.brahmaMuhurat.start} – ${panchang.brahmaMuhurat.end}`} color="#7effb2" />
      </GlassCard>
    </div>
  );
}

export default memo(PanchangDetailCard);
