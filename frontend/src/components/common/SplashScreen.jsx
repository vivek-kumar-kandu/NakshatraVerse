import { useEffect, useMemo, useState, memo } from "react";
import CosmicBg from "./CosmicBg.jsx";
import { GOLD_GRADIENT } from "../../constants/astrology.js";

// ─────────────────────────────────────────────────────────────────────────
// Priority 6.1: Premium splash screen.
//
// Shown once at the very start of every app load (before the auth check
// even needs to resolve), for ~2.6s, then cross-fades into the new
// marketing Home page (decided by the parent — this component only
// reports when its own timer is done).
//
// Reuses the existing visual vocabulary already established by
// LandingPage/LoadingPage (CosmicBg starfield, GOLD_GRADIENT text, the
// 🪐 glyph, the existing `glow`/`spin`/`floatUp`/`fadeIn` keyframes from
// global.css) instead of introducing new animation primitives — so no
// changes to global.css are needed at all.
//
// Performance: every moving piece here is a plain CSS animation (GPU
// composited transform/opacity), no JS-driven animation loop, no extra
// libraries.
// ─────────────────────────────────────────────────────────────────────────

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  x: (i * 27.1 + 8) % 100,
  y: (i * 41.7 + 12) % 100,
  size: 3 + (i % 4) * 2,
  delay: (i * 0.27) % 3,
  dur: 3 + (i % 3),
  gold: i % 3 === 0,
}));

function SplashScreen({ onComplete, duration = 2600 }) {
  const [fadingOut, setFadingOut] = useState(false);

  const particles = useMemo(() => PARTICLES, []);

  useEffect(() => {
    const fadeStart = setTimeout(() => setFadingOut(true), duration);
    // Give the 0.6s fade transition below time to actually finish before
    // handing control back to the parent, so there's no visual snap.
    const handoff = setTimeout(() => onComplete(), duration + 600);
    return () => { clearTimeout(fadeStart); clearTimeout(handoff); };
  }, [duration, onComplete]);

  return (
    <div
      role="status"
      aria-label="Loading NakshatraVerse"
      style={{
        position: "fixed", inset: 0, zIndex: 3000,
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: fadingOut ? 0 : 1,
        transition: "opacity 0.6s ease",
        pointerEvents: fadingOut ? "none" : "auto",
      }}
    >
      <CosmicBg animated />

      {/* Glowing particles — purely decorative, own floaty/pulse motion */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        {particles.map(p => (
          <div key={p.id} style={{
            position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size, borderRadius: "50%",
            background: p.gold ? "var(--nv-color-brand-gold, #ffd700)" : "#bf7fff",
            boxShadow: p.gold ? "0 0 10px 2px rgba(255,215,0,0.55)" : "0 0 10px 2px rgba(191,127,255,0.55)",
            animation: `floatUp ${p.dur}s ${p.delay}s ease-in-out infinite alternate`,
            opacity: 0.75,
          }} />
        ))}
      </div>

      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: 24, animation: "fadeIn 0.9s ease both" }}>
        {/* Slow orbit ring around the logo */}
        <div aria-hidden="true" style={{
          position: "relative", width: "clamp(140px, 40vw, 180px)", height: "clamp(140px, 40vw, 180px)",
          margin: "0 auto 28px",
        }}>
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: "1px solid rgba(191,127,255,0.35)",
            animation: "spin 14s linear infinite",
            transform: "translateZ(0)", willChange: "transform",
          }}>
            <div style={{ position: "absolute", top: -4, left: "50%", marginLeft: -4, width: 8, height: 8, borderRadius: "50%", background: "var(--nv-color-brand-gold, #ffd700)", boxShadow: "0 0 12px 3px rgba(255,215,0,0.7)" }} />
          </div>
          <div style={{
            position: "absolute", inset: 14, borderRadius: "50%",
            border: "1px solid rgba(255,215,0,0.25)",
            animation: "spin 22s linear infinite reverse",
            transform: "translateZ(0)", willChange: "transform",
          }}>
            <div style={{ position: "absolute", bottom: -3, left: "50%", marginLeft: -3, width: 6, height: 6, borderRadius: "50%", background: "#bf7fff", boxShadow: "0 0 10px 3px rgba(191,127,255,0.7)" }} />
          </div>
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ fontSize: "clamp(46px, 12vw, 62px)", animation: "glow 3s infinite" }}>🪐</div>
          </div>
        </div>

        <h1 className="nv-heading-glow" style={{
          margin: "0 0 10px", fontSize: "clamp(30px, 7vw, 50px)", fontWeight: 700,
          letterSpacing: 3, background: GOLD_GRADIENT, WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent", fontFamily: "Cinzel,serif",
        }}>
          NakshatraVerse
        </h1>
        <p style={{
          margin: 0, fontSize: "clamp(13px, 3vw, 16px)", color: "var(--nv-text-secondary, rgba(200,160,255,0.75))",
          letterSpacing: 2, fontStyle: "italic", fontFamily: "Inter,sans-serif",
        }}>
          Discover Your Cosmic Blueprint
        </p>
      </div>
    </div>
  );
}

export default memo(SplashScreen);
