import { memo } from "react";

function ScoreRing({ value, max = 9, label, color = "#bf7fff" }) {
  const pct = value / max;
  const r = 30, circ = 2 * Math.PI * r;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
      <svg width={80} height={80} role="img" aria-label={`${label}: ${value}`}>
        <circle cx={40} cy={40} r={r} fill="none" stroke="var(--nv-accent-wash, rgba(180,120,255,0.1))" strokeWidth={5} />
        <circle cx={40} cy={40} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${pct*circ} ${circ}`} strokeLinecap="round"
          strokeDashoffset={circ/4} style={{ transition:"stroke-dasharray 1s ease" }} />
        <text x={40} y={45} textAnchor="middle" fontSize={18} fill={color} fontWeight="bold" fontFamily="Cinzel,serif">{value}</text>
      </svg>
      <span style={{ fontSize:11, color:"var(--nv-text-muted, rgba(200,160,255,0.6))", fontFamily:"Inter,sans-serif", textAlign:"center" }}>{label}</span>
    </div>
  );
}

export default memo(ScoreRing);
