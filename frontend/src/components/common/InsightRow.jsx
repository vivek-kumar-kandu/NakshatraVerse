import { memo } from "react";

function InsightRow({ label, value, color = "#bf7fff" }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
      padding:"10px 0", borderBottom:"1px solid var(--nv-accent-wash, rgba(180,120,255,0.1))", gap:12 }}>
      <span style={{ fontSize:13, color:"var(--nv-text-muted, rgba(200,160,255,0.6))", fontFamily:"Inter,sans-serif" }}>{label}</span>
      <span style={{ fontSize:13, color, fontWeight:600, fontFamily:"Inter,sans-serif", textAlign:"right", maxWidth:"60%" }}>{value}</span>
    </div>
  );
}

export default memo(InsightRow);
