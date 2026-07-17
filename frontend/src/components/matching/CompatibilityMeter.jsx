import { memo } from "react";

// A larger, semi-circular "gauge" version of the same visual language as
// ScoreRing.jsx (arc + gold/purple accents), sized for a hero placement at
// the top of the Kundli Matching results rather than a small per-item
// score. ScoreRing itself is reused as-is (unmodified) for the individual
// 8 Koota cards elsewhere on the page.
function CompatibilityMeter({ totalScore, maxScore, percentage, label, color = "#ffd700" }) {
  const r = 90;
  const circ = Math.PI * r; // half circle
  const pct = Math.max(0, Math.min(1, totalScore / maxScore));

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={240} height={140} viewBox="0 0 240 140" role="img" aria-label={`Compatibility score: ${totalScore} of ${maxScore}, ${percentage} percent, ${label}`}>
        <path
          d={`M 30 120 A ${r} ${r} 0 0 1 210 120`}
          fill="none" stroke="var(--nv-accent-wash, rgba(180,120,255,0.12))" strokeWidth={16} strokeLinecap="round"
        />
        <path
          d={`M 30 120 A ${r} ${r} 0 0 1 210 120`}
          fill="none" stroke={color} strokeWidth={16} strokeLinecap="round"
          strokeDasharray={`${pct * circ} ${circ}`}
          style={{ transition: "stroke-dasharray 1.1s cubic-bezier(0.22,1,0.36,1)" }}
        />
        <text x={120} y={95} textAnchor="middle" fontSize={34} fontWeight="bold" fill="#fff" fontFamily="Cinzel,serif">
          {totalScore}
        </text>
        <text x={120} y={116} textAnchor="middle" fontSize={13} fill="var(--nv-text-secondary, rgba(210,175,255,0.76))" fontFamily="Inter,sans-serif">
          out of {maxScore} Gunas
        </text>
      </svg>
      <div style={{ textAlign: "center", marginTop: -6 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: "Cinzel,serif", letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 13, color: "var(--nv-text-muted, rgba(200,160,255,0.6))", fontFamily: "Inter,sans-serif" }}>{percentage}% Compatible</div>
      </div>
    </div>
  );
}

export default memo(CompatibilityMeter);
