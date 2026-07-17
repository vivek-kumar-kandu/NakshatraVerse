import { memo, useState, useCallback, useMemo, useId } from "react";
import { ZODIAC_SIGNS, SIGN_NAMES, PLANET_COLORS } from "../../constants/astrology.js";

// ─────────────────────────────────────────────────────────────────────────
// Priority 5.1 responsive fix (unchanged): this SVG previously had fixed
// width={260} height={260} attributes. On a 320px-wide phone, once you
// account for the KundliTab card's padding (24px each side) plus the
// page's own outer padding (16px each side), the available width drops
// well under 260px — the fixed-size SVG would refuse to shrink and force
// the whole page to scroll horizontally. `width="100%"` (with the
// viewBox unchanged) makes the wheel scale fluidly with its container on
// any screen, while `maxWidth: 260` keeps it at the exact original size
// on tablet/laptop/desktop. This contract is covered by
// tests/ZodiacWheel.test.jsx and is preserved byte-for-byte below.
//
// Phase 2 (Interactive Birth Chart) adds, without touching any of the
// above:
//   - Each sign wedge becomes a focusable/clickable hit-region so hovering
//     or selecting a house highlights it in the wheel.
//   - Each planet glyph becomes its own focusable/clickable hit-region
//     with a hover/focus tooltip and click-to-select.
//   - Whole-sign house numbers are derived client-side from the existing
//     lagna + sign data already being rendered (no new data source, no
//     astrology-engine involvement): house = ((signIndex - lagnaIndex +
//     12) % 12) + 1 — the same convention already implied by the
//     `planetary[planet].house` values passed in from the backend.
//   - Smooth CSS transitions on hover/select states; all purely visual.
// The component stays fully backward compatible: every new prop is
// optional and defaults to inert no-ops, so existing callers (and the
// existing test, which renders <ZodiacWheel lagna="Taurus" planetary={{}} />
// with no extra props) keep working unchanged.
// ─────────────────────────────────────────────────────────────────────────

function polar(cx, cy, radius, angleDeg) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
}

function wedgePath(cx, cy, r1, r2, a1, a2) {
  const p1 = polar(cx, cy, r2, a1);
  const p2 = polar(cx, cy, r2, a2);
  const p3 = polar(cx, cy, r1, a2);
  const p4 = polar(cx, cy, r1, a1);
  return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r2} ${r2} 0 0 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)} A ${r1} ${r1} 0 0 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)} Z`;
}

function ZodiacWheel({
  lagna,
  planetary,
  // Phase 2 interactivity (all optional — safe no-ops if omitted)
  activePlanet = null,
  activeHouse = null,
  onPlanetHover,
  onPlanetClick,
  onHouseHover,
  onHouseClick,
}) {
  const cx = 130, cy = 130, r = 100, inner = 60, mid = 82;
  const outer = r + 20; // 120 — matches the existing outer ring circle radius
  const lagnaIdx = SIGN_NAMES.indexOf(lagna);
  const uid = useId();

  // Local hover/focus state purely for the tooltip bubble — selection
  // state itself is owned by the parent (KundliTab) so the wheel, the
  // planetary-position cards, and the house grid all stay in sync.
  // `color`/`kind` let the tooltip render a small planet-colored accent
  // without needing a second piece of state.
  const [tooltip, setTooltip] = useState(null); // { x, y, title, subtitle, color, kind }

  const planetInSign = useMemo(() => {
    const map = {};
    if (planetary) {
      Object.entries(planetary).forEach(([pname, info]) => {
        const sign = info?.sign;
        if (!sign) return;
        const emoji = pname.match(/[☀️🌙♂☿♃♀♄🌑🌕]/u)?.[0] || "·";
        if (!map[sign]) map[sign] = [];
        map[sign].push({ name: pname, emoji, house: info.house, sign });
      });
    }
    return map;
  }, [planetary]);

  const houseOfSignIndex = useCallback(
    (i) => (lagnaIdx >= 0 ? ((i - lagnaIdx + 12) % 12) + 1 : null),
    [lagnaIdx]
  );

  const showTooltip = useCallback((x, y, title, subtitle, color, kind) => {
    setTooltip({ x, y, title, subtitle, color, kind });
  }, []);
  const hideTooltip = useCallback(() => setTooltip(null), []);

  // Touch devices don't fire mouseenter/mouseleave, so a tap alone would
  // select a planet/house with no preview — this gives a tap a brief
  // "preview" pop of the same tooltip a mouse hover gets, before the
  // click handler's selection logic runs.
  const touchPreview = useCallback((x, y, title, subtitle, color, kind) => {
    showTooltip(x, y, title, subtitle, color, kind);
  }, [showTooltip]);

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 260, margin: "0 auto" }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 260 260"
        role="img"
        aria-label={`Vedic birth chart wheel with Lagna (ascendant) in ${lagna || "an unknown sign"}`}
        style={{ display:"block", width:"100%", maxWidth:260, height:"auto", margin:"0 auto", filter:"drop-shadow(0 0 24px rgba(150,80,255,0.35))", overflow:"visible" }}
      >
        <defs>
          <radialGradient id={`wg-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(100,40,200,0.25)" />
            <stop offset="100%" stopColor="rgba(10,0,25,0.95)" />
          </radialGradient>
          <radialGradient id={`cg-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(40,0,80,0.9)" />
            <stop offset="100%" stopColor="rgba(15,0,35,0.95)" />
          </radialGradient>
        </defs>
        {/* Outer ring */}
        <circle cx={cx} cy={cy} r={outer} fill={`url(#wg-${uid})`} stroke="var(--nv-accent-border, rgba(180,120,255,0.2))" strokeWidth={1} />

        {/* Divider lines, sign glyphs, planet glyphs, and (new) interactive
            house wedges + house numbers */}
        {ZODIAC_SIGNS.map((sign, i) => {
          const angle = i * 30 - 90;
          const sx = cx + r * Math.cos((angle * Math.PI) / 180), sy = cy + r * Math.sin((angle * Math.PI) / 180);
          const lx1p = polar(cx, cy, mid - 8, angle), lx2p = polar(cx, cy, outer - 5, angle);
          const isLagna = i === lagnaIdx;
          const signName = SIGN_NAMES[i];
          const planetsHere = planetInSign[signName] || [];
          const houseNum = planetsHere.length ? planetsHere[0].house : houseOfSignIndex(i);
          const isHouseActive = activeHouse != null && houseNum === activeHouse;
          const wedgeD = wedgePath(cx, cy, inner + 1, outer - 1, angle - 15, angle + 15);
          const houseLabelPos = polar(cx, cy, inner + 10, angle);

          return (
            <g key={i}>
              {/* Interactive house wedge (behind everything else in this sign) */}
              <path
                d={wedgeD}
                className={isHouseActive ? "house-wedge-active" : undefined}
                fill={isHouseActive ? "rgba(255,215,0,0.16)" : "rgba(255,255,255,0.001)"}
                stroke={isHouseActive ? "rgba(255,215,0,0.4)" : "transparent"}
                strokeWidth={1}
                style={{ cursor: houseNum ? "pointer" : "default", transition: "fill var(--nv-duration-base) var(--nv-ease-standard), stroke var(--nv-duration-base) var(--nv-ease-standard)" }}
                role={houseNum ? "button" : undefined}
                tabIndex={houseNum ? 0 : undefined}
                aria-label={houseNum ? `House ${houseNum}, ${signName} — ${planetsHere.length ? planetsHere.map(p => p.name).join(", ") : "no planets"}` : undefined}
                onMouseEnter={() => { onHouseHover?.(houseNum); showTooltip(sx, sy - 10, `House ${houseNum} · ${signName}`, planetsHere.length ? planetsHere.map(p => p.name.replace(/\s?[☀️🌙♂☿♃♀♄🌑🌕]/u,"")).join(", ") : "No planets here", "var(--nv-color-brand-gold, #ffd700)", "house"); }}
                onMouseLeave={() => { onHouseHover?.(null); hideTooltip(); }}
                onFocus={() => { onHouseHover?.(houseNum); showTooltip(sx, sy - 10, `House ${houseNum} · ${signName}`, planetsHere.length ? planetsHere.map(p => p.name.replace(/\s?[☀️🌙♂☿♃♀♄🌑🌕]/u,"")).join(", ") : "No planets here", "var(--nv-color-brand-gold, #ffd700)", "house"); }}
                onBlur={() => { onHouseHover?.(null); hideTooltip(); }}
                onTouchStart={() => { if (houseNum) touchPreview(sx, sy - 10, `House ${houseNum} · ${signName}`, planetsHere.length ? planetsHere.map(p => p.name.replace(/\s?[☀️🌙♂☿♃♀♄🌑🌕]/u,"")).join(", ") : "No planets here", "var(--nv-color-brand-gold, #ffd700)", "house"); }}
                onClick={() => houseNum && onHouseClick?.(houseNum)}
                onKeyDown={(e) => { if (houseNum && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onHouseClick?.(houseNum); } }}
              />
              <line x1={lx1p.x} y1={lx1p.y} x2={lx2p.x} y2={lx2p.y} stroke="var(--nv-surface-border, rgba(180,120,255,0.15))" strokeWidth={0.7} />
              {isLagna && <circle cx={sx} cy={sy} r={12} fill="rgba(255,215,0,0.15)" stroke="rgba(255,215,0,0.5)" strokeWidth={1} />}
              <text x={sx} y={sy+5} textAnchor="middle" fontSize={isLagna ? 15 : 12} pointerEvents="none"
                fill={isLagna ? "var(--nv-color-brand-gold, #ffd700)" : "var(--nv-text-secondary, rgba(200,160,255,0.75))"} fontWeight={isLagna ? "bold" : "normal"}>{sign}</text>
              {houseNum && (
                <text x={houseLabelPos.x} y={houseLabelPos.y + 3} textAnchor="middle" fontSize={7.5} pointerEvents="none"
                  fill={isHouseActive ? "var(--nv-color-brand-gold, #ffd700)" : "var(--nv-accent-wash-strong, rgba(180,120,255,0.4))"} fontFamily="Inter,sans-serif" style={{ transition:"fill var(--nv-duration-base) var(--nv-ease-standard)" }}>
                  {houseNum}
                </text>
              )}

              {/* Individual, independently-interactive planet glyphs */}
              {planetsHere.map((p, pi) => {
                const spread = 9; // degrees between stacked planets in the same sign
                const pAngle = angle + (pi - (planetsHere.length - 1) / 2) * spread;
                const pRadius = mid + 12;
                const pos = polar(cx, cy, pRadius, pAngle);
                const isActive = activePlanet === p.name;
                const color = PLANET_COLORS[p.name] || "#bf7fff";
                return (
                  <g
                    key={p.name}
                    role="button"
                    tabIndex={0}
                    aria-label={`${p.name.replace(/[☀️🌙♂☿♃♀♄🌑🌕\uFE0F]/gu,"").trim()}: House ${p.house}, ${p.sign}`}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => { onPlanetHover?.(p.name); showTooltip(pos.x, pos.y - 10, p.name, `House ${p.house} · ${p.sign}`, color, "planet"); }}
                    onMouseLeave={() => { onPlanetHover?.(null); hideTooltip(); }}
                    onFocus={() => { onPlanetHover?.(p.name); showTooltip(pos.x, pos.y - 10, p.name, `House ${p.house} · ${p.sign}`, color, "planet"); }}
                    onBlur={() => { onPlanetHover?.(null); hideTooltip(); }}
                    onTouchStart={() => touchPreview(pos.x, pos.y - 10, p.name, `House ${p.house} · ${p.sign}`, color, "planet")}
                    onClick={(e) => { e.stopPropagation(); onPlanetClick?.(p.name); }}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onPlanetClick?.(p.name); } }}
                  >
                    {/* Invisible, generously-sized touch target — a fingertip
                        needs far more than the ~7px visual glyph radius to
                        reliably land a tap; a mouse cursor doesn't need it,
                        so it stays fully transparent either way. */}
                    <circle cx={pos.x} cy={pos.y} r={16} fill="transparent" />
                    {isActive && (
                      <circle cx={pos.x} cy={pos.y} r={13} fill="none" stroke={color} strokeWidth={0.75}
                        opacity={0.5} style={{ animation: "planetPulse 1.6s ease-in-out infinite" }} />
                    )}
                    <circle cx={pos.x} cy={pos.y} r={isActive ? 9 : 7.5} fill={isActive ? `${color}33` : "transparent"}
                      stroke={isActive ? color : "transparent"} strokeWidth={1}
                      style={{ transition: "r var(--nv-duration-base) var(--nv-ease-standard), fill var(--nv-duration-base) var(--nv-ease-standard), stroke var(--nv-duration-base) var(--nv-ease-standard)" }} />
                    <text x={pos.x} y={pos.y + 3} textAnchor="middle" fontSize={isActive ? 10 : 8.5} pointerEvents="none"
                      fill="var(--nv-text-primary, rgba(200,160,255,0.9))" style={{ transition: "font-size var(--nv-duration-base) var(--nv-ease-standard)" }}>{p.emoji}</text>
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Inner circle */}
        <circle cx={cx} cy={cy} r={inner} fill={`url(#cg-${uid})`} stroke="rgba(180,120,255,0.25)" strokeWidth={1} />
        <text x={cx} y={cy-10} textAnchor="middle" fontSize={10} fill="var(--nv-text-muted, rgba(200,160,255,0.5))" fontFamily="Inter,sans-serif">LAGNA</text>
        <text x={cx} y={cy+8} textAnchor="middle" fontSize={14} fill="var(--nv-color-brand-gold, #ffd700)" fontWeight="bold" fontFamily="Cinzel,serif">{lagna}</text>
        <text x={cx} y={cy+24} textAnchor="middle" fontSize={10} fill="rgba(180,120,255,0.6)" fontFamily="Inter,sans-serif">{ZODIAC_SIGNS[SIGN_NAMES.indexOf(lagna)]}</text>
      </svg>

      {/* Hover/focus tooltip — percentage-positioned so it tracks the
          scaled SVG coordinate system at any container width. */}
      {tooltip && (
        <div role="tooltip" aria-hidden="false" style={{
          position: "absolute",
          left: `${Math.min(82, Math.max(18, (tooltip.x / 260) * 100))}%`,
          top: `${Math.max(6, (tooltip.y / 260) * 100)}%`,
          transform: "translate(-50%, -100%)",
          pointerEvents: "none",
          background: "rgba(15,0,35,0.96)",
          border: `1px solid ${tooltip.color || "rgba(191,127,255,0.4)"}66`,
          borderRadius: 8,
          padding: "7px 11px",
          fontFamily: "Inter,sans-serif",
          fontSize: 11,
          color: "var(--nv-color-brand-gold, #ffd700)",
          whiteSpace: "nowrap",
          boxShadow: `0 4px 18px rgba(0,0,0,0.45), 0 0 14px ${tooltip.color || "rgba(150,80,255,0.35)"}22`,
          zIndex: 2,
          animation: "tooltipPop 0.2s cubic-bezier(0.22,1,0.36,1) both",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: tooltip.kind === "planet" ? tooltip.color : "var(--nv-color-brand-gold, #ffd700)" }}>
            {tooltip.kind === "planet" && (
              <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: tooltip.color, flexShrink: 0, boxShadow: `0 0 6px ${tooltip.color}` }} />
            )}
            {tooltip.title}
          </div>
          {tooltip.subtitle && <div style={{ color: "var(--nv-text-secondary, rgba(200,160,255,0.75))", marginTop: 2 }}>{tooltip.subtitle}</div>}
        </div>
      )}
    </div>
  );
}

export default memo(ZodiacWheel);
