import { useState, useEffect, useRef, memo } from "react";
import CosmicBg from "../components/common/CosmicBg.jsx";
import { LOADING_MSGS, ZODIAC_SIGNS, GOLD_GRADIENT } from "../constants/astrology.js";

// ─────────────────────────────────────────────────────────────────────────
// Priority 5.1 performance note: the orbiting ring of zodiac glyphs is
// pure decoration animated entirely by CSS (@keyframes orbitSpin /
// orbitCounterSpin) — it never needs to re-render after its first paint.
// Before this change it was inline JSX inside LoadingPage's render
// function, so every progress-bar tick (every 120ms, for the whole
// duration of the backend request) re-rendered all 12 orbiting glyph
// <div>s for no visual benefit. Extracting it into its own memoized
// component means React skips re-rendering it on every tick — the
// animation itself is untouched (still 100% CSS-driven, GPU-composited).
// ─────────────────────────────────────────────────────────────────────────
const OrbitRing = memo(function OrbitRing() {
  return (
    <div aria-hidden="true" style={{ position:"relative", width:"clamp(160px, 45vw, 200px)", height:"clamp(160px, 45vw, 200px)" }}>
      <div style={{
        position:"absolute", inset:0,
        animation:"orbitSpin 18s linear infinite",
        transform:"translateZ(0)",
        willChange:"transform",
        backfaceVisibility:"hidden",
      }}>
        {ZODIAC_SIGNS.map((s, i) => {
          const a = i * 30; // 12 signs, evenly spaced every 30deg
          return (
            <div key={i} style={{
              position:"absolute", top:"50%", left:"50%",
              width:30, height:30, marginLeft:-15, marginTop:-15,
              transform:`rotate(${a}deg) translate(85px) rotate(${-a}deg)`,
            }}>
              <div style={{
                display:"flex", alignItems:"center", justifyContent:"center",
                width:"100%", height:"100%",
                animation:"orbitCounterSpin 18s linear infinite",
                transform:"translateZ(0)",
                willChange:"transform",
                fontSize:15, color:"rgba(180,120,255,0.6)",
              }}>
                {s}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
        <div style={{ fontSize:58, animation:"pulse 2s infinite" }}>🪐</div>
      </div>
    </div>
  );
});

// `ready` reflects whether the real backend call has actually settled
// (succeeded or failed) — the progress bar tracks real work instead of a
// fixed timer, so this screen and the actual AI report always finish
// together no matter how long a retry/fallback takes.
function LoadingPage({ userData, onComplete, ready }) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const readyRef = useRef(false);
  useEffect(() => { readyRef.current = ready; }, [ready]);
  useEffect(() => {
    const t1 = setInterval(() => setMsgIdx(i => (i+1) % LOADING_MSGS.length), 2200);
    // While still waiting on the real request, creep up to 90% and hold —
    // never claim "almost done" before the work is actually done. Once the
    // real call has settled, ramp quickly to 100% and hand off.
    const t2 = setInterval(() => setProgress(p => (
      readyRef.current ? Math.min(p + 5, 100) : Math.min(p + 0.6, 90)
    )), 120);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);
  useEffect(() => { if (progress >= 100) onComplete(); }, [progress, onComplete]);

  return (
    <div style={{ minHeight:"100vh", position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <CosmicBg animated />
      <div style={{ position:"relative", zIndex:1, display:"flex", flexDirection:"column",
        alignItems:"center", gap:30, textAlign:"center", padding:24 }}>
        <OrbitRing />
        <div>
          <h2 style={{ margin:"0 0 10px", fontSize:26, background:GOLD_GRADIENT,
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", fontFamily:"Cinzel,serif" }}>
            NakshatraVerse
          </h2>
          {/* aria-live: screen reader users hear each rotating status
              message as it changes, instead of silence for the whole
              request duration. */}
          <p aria-live="polite" style={{ margin:0, fontSize:15, color:"var(--nv-text-secondary, rgba(200,160,255,0.8))", animation:"fadeInOut 2.2s infinite" }}>
            {LOADING_MSGS[msgIdx]}
          </p>
        </div>
        <div style={{ width:300, maxWidth:"85vw" }}>
          <div
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Report generation progress"
            style={{ background:"rgba(180,120,255,0.08)", borderRadius:8, height:5, overflow:"hidden", border:"1px solid rgba(180,120,255,0.18)" }}
          >
            <div style={{ height:"100%", width:`${progress}%`, background:"linear-gradient(90deg,#7b2fff,#ffd700)", borderRadius:8, transition:"width 0.1s" }} />
          </div>
          <p style={{ margin:"9px 0 0", fontSize:12, color:"var(--nv-text-muted, rgba(200,160,255,0.45))", fontFamily:"Inter,sans-serif" }}>{Math.round(progress)}% complete</p>
          {/* Phase 1 (Loading & Feedback): discrete animated progress
              steps, complementing the continuous bar above. Each dot lights
              up as `progress` crosses its threshold, and the just-completed
              step gets a small "pop" — purely decorative, driven entirely
              by the same `progress` state the bar already uses, so it
              always stays in sync with real request completion. */}
          <div role="list" aria-label="Report generation steps" style={{ display:"flex", justifyContent:"space-between", marginTop:14, gap:4 }}>
            {LOADING_MSGS.map((step, i) => {
              const threshold = ((i + 1) / LOADING_MSGS.length) * 100;
              const done = progress >= threshold - 0.5;
              const current = !done && progress >= threshold - (100 / LOADING_MSGS.length);
              return (
                <div key={step} role="listitem" style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5, flex:1, minWidth:0 }}>
                  <div
                    aria-hidden="true"
                    style={{
                      width:9, height:9, borderRadius:"50%",
                      background: done ? "#ffd700" : current ? "#bf7fff" : "rgba(180,120,255,0.2)",
                      boxShadow: done ? "0 0 8px rgba(255,215,0,0.6)" : current ? "0 0 6px rgba(191,127,255,0.5)" : "none",
                      transition:"background var(--nv-duration-slow) var(--nv-ease-standard), box-shadow var(--nv-duration-slow) var(--nv-ease-standard)",
                      animation: current ? "pulse 1.2s ease-in-out infinite" : "none",
                    }}
                  />
                  <span style={{
                    fontSize:9.5, lineHeight:1.3, color: done || current ? "var(--nv-text-secondary, rgba(220,190,255,0.75))" : "var(--nv-text-faint, rgba(180,120,255,0.35))",
                    textAlign:"center", fontFamily:"Inter,sans-serif", overflow:"hidden", textOverflow:"ellipsis",
                    display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical",
                  }}>
                    {step.replace(/\.\.\.$/, "")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <p style={{ margin:0, fontSize:14, color:"var(--nv-text-muted, rgba(200,160,255,0.6))", fontStyle:"italic", fontFamily:"Inter,sans-serif" }}>
          {userData
            ? <>Preparing cosmic chart for <strong style={{ color:"#bf7fff" }}>{userData.name}</strong>…</>
            : <>Just a moment…</>}
        </p>
      </div>
    </div>
  );
}

export default LoadingPage;
