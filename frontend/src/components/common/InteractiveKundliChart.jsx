import { memo, useCallback, useMemo, useRef, useState } from "react";
import ZodiacWheel from "./ZodiacWheel.jsx";
import { PLANET_COLORS, SIGN_NAMES, ZODIAC_SIGNS } from "../../constants/astrology.js";
import {
  WHEEL_CX, WHEEL_CY, WHEEL_R, WHEEL_INNER, TRANSIT_RING_RADIUS,
  polar, signAngle, computePlanetPositions,
} from "../../utils/chartGeometry.js";
import {
  fullPlanetName, buildPlanetItem, buildHouseItem, buildSignItem, buildAscendantItem,
  buildNakshatraItem, buildYogaItem, buildDoshaItem, buildAspectItems,
} from "../../utils/explorerItemBuilders.js";

// ─────────────────────────────────────────────────────────────────────────
// InteractiveKundliChart (V5.1 — Interactive Kundli / Explorer Integration)
//
// Wraps the existing, unmodified ZodiacWheel (Astrology Engine output is
// untouched — this only ever reads `planetary`/`userData`/`report`, the
// same props already flowing into KundliTab) and layers on top of it,
// purely for presentation:
//
//   - Smooth zoom + pan + reset (CSS transform on a wrapper div)
//   - A second, same-viewBox SVG overlay adding click/hover targets for
//     the selection types ZodiacWheel itself doesn't cover: zodiac sign,
//     ascendant, and backend-computed aspects (drawn as lines between the
//     already-computed planet positions)
//   - A transit-overlay ring (show/hide), placed from the existing
//     report.transitForecast fields — no new transit calculation
//   - Yoga / Dosha / Nakshatra quick-select chips (not spatial objects on
//     a wheel, so presented as a chip row) reusing report.chart.yogas /
//     report.chart.doshas / report.nakshatraProfile verbatim
//
// Every selection funnels through the single `onSelect(type, item)`
// callback (ResultsPage wires this to the shared ExplorerContext's
// `selectItem`), and `onNavigateExplorer()` (wired to switch ResultsPage's
// active tab to "explorer") completes the required flow: Interactive
// Kundli -> Explorer -> AI Explanation -> Prediction Timeline.
// ─────────────────────────────────────────────────────────────────────────

const MIN_SCALE = 1;
const MAX_SCALE = 3;
const ZOOM_STEP = 0.35;

function clampScale(s) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));
}

function InteractiveKundliChart({
  userData,
  planetary,
  report,
  selectedType = null,
  selectedItem = null,
  onSelect,
  onNavigateExplorer,
}) {
  const lagna = userData?.lagna;

  // ── Zoom / pan state ────────────────────────────────────────────────
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null); // { startX, startY, originX, originY } | null
  const [isDragging, setIsDragging] = useState(false);

  const resetView = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const zoomBy = useCallback((delta) => {
    setScale((s) => clampScale(s + delta));
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? ZOOM_STEP / 2 : -ZOOM_STEP / 2);
  }, [zoomBy]);

  const handlePointerDown = useCallback((e) => {
    if (scale <= 1) return; // nothing to pan at rest scale
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: translate.x, originY: translate.y };
    setIsDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }, [scale, translate]);

  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current) return;
    const { startX, startY, originX, originY } = dragRef.current;
    setTranslate({ x: originX + (e.clientX - startX), y: originY + (e.clientY - startY) });
  }, []);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    setIsDragging(false);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomBy(ZOOM_STEP); }
    else if (e.key === "-" || e.key === "_") { e.preventDefault(); zoomBy(-ZOOM_STEP); }
    else if (e.key === "0") { e.preventDefault(); resetView(); }
  }, [zoomBy, resetView]);

  // ── Overlay toggles ──────────────────────────────────────────────────
  const [showAspects, setShowAspects] = useState(true);
  const [showTransits, setShowTransits] = useState(false);

  // ── Selection plumbing ───────────────────────────────────────────────
  const [hoveredLabel, setHoveredLabel] = useState(null);

  const select = useCallback((type, item) => {
    if (!item) return;
    onSelect?.(type, item);
    onNavigateExplorer?.();
  }, [onSelect, onNavigateExplorer]);

  // Local (hover-only) wheel highlighting, plus whatever is currently
  // selected in the shared Explorer context — so returning to this tab
  // after selecting something in the Explorer side panel still shows it
  // highlighted here too.
  const [hoveredPlanet, setHoveredPlanet] = useState(null);
  const [hoveredHouse, setHoveredHouse] = useState(null);

  const selectedPlanet = selectedType === "planet" ? selectedItem?.id : null;
  const selectedHouseNum = selectedType === "house" && selectedItem?.id
    ? Number(String(selectedItem.id).replace("house-", ""))
    : null;

  const activePlanet = hoveredPlanet || selectedPlanet || null;
  const activeHouse = hoveredHouse ?? (activePlanet ? planetary?.[activePlanet]?.house : null) ?? selectedHouseNum;

  const handlePlanetClick = useCallback((planetName) => {
    select("planet", buildPlanetItem(planetName, planetary));
    setHoveredLabel(null);
  }, [select, planetary]);

  const handleHouseClick = useCallback((houseNum) => {
    if (!houseNum) return;
    select("house", buildHouseItem(houseNum));
    setHoveredLabel(null);
  }, [select]);

  // ── Sign + Ascendant hit targets (overlay) ─────────────────────────
  const signTargets = useMemo(() => SIGN_NAMES.map((sign, i) => {
    const pos = polar(WHEEL_CX, WHEEL_CY, WHEEL_R, signAngle(i));
    return { sign, glyph: ZODIAC_SIGNS[i], x: pos.x, y: pos.y };
  }), []);

  const isSignSelected = useCallback((sign) => selectedType === "sign" && selectedItem?.id === sign, [selectedType, selectedItem]);
  const isAscendantSelected = selectedType === "ascendant";

  // ── Aspect lines (overlay) ───────────────────────────────────────────
  const planetPositions = useMemo(() => computePlanetPositions(planetary), [planetary]);
  const aspectItems = useMemo(() => buildAspectItems(report), [report]);

  const aspectLines = useMemo(() => {
    if (!showAspects) return [];
    const lines = [];
    aspectItems.forEach((item) => {
      const targetFull = fullPlanetName(item.targetPlain);
      const targetPos = planetPositions[targetFull];
      if (!targetPos) return;
      (item.aspectedBy || []).forEach((sourcePlain) => {
        const sourceFull = fullPlanetName(sourcePlain);
        const sourcePos = planetPositions[sourceFull];
        if (!sourcePos) return;
        lines.push({
          id: `${item.id}-from-${sourcePlain}`,
          aspectId: item.id,
          item,
          x1: sourcePos.x, y1: sourcePos.y, x2: targetPos.x, y2: targetPos.y,
          color: PLANET_COLORS[sourceFull] || "#7effb2",
        });
      });
    });
    return lines;
  }, [showAspects, aspectItems, planetPositions]);

  // ── Transit overlay markers ──────────────────────────────────────────
  const transitMarkers = useMemo(() => {
    if (!showTransits) return [];
    const forecast = report?.transitForecast;
    if (!forecast) return [];
    const markers = [];
    const pushMarker = (label, planetKey, transitSign) => {
      const i = SIGN_NAMES.indexOf(transitSign);
      if (i < 0) return;
      const pos = polar(WHEEL_CX, WHEEL_CY, TRANSIT_RING_RADIUS, signAngle(i));
      markers.push({ id: `transit-${planetKey}`, label, x: pos.x, y: pos.y, sign: transitSign });
    };
    if (forecast.saturn?.transitSign) pushMarker("Sa", "saturn", forecast.saturn.transitSign);
    if (forecast.jupiter?.transitSign) pushMarker("Ju", "jupiter", forecast.jupiter.transitSign);
    (forecast.rahuKetu || []).forEach((t) => {
      if (t.transitSign) pushMarker(t.planet?.[0] || "?", t.planet, t.transitSign);
    });
    return markers;
  }, [showTransits, report]);

  // ── Yoga / Dosha / Nakshatra quick-select chips ─────────────────────
  const yogas = report?.chart?.yogas || [];
  const doshas = report?.chart?.doshas || [];
  const nakshatraItem = buildNakshatraItem(report?.nakshatraProfile);

  const selectionSummary = selectedItem?.label
    ? `Selected: ${selectedItem.label}`
    : "Tap a planet, house, sign, or aspect to explore it";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: "100%" }}>
      {/* Toolbar */}
      <div role="toolbar" aria-label="Chart view controls" style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
        <button type="button" className="pill-btn" onClick={() => zoomBy(ZOOM_STEP)} aria-label="Zoom in"
          style={toolbarBtnStyle}>➕ Zoom In</button>
        <button type="button" className="pill-btn" onClick={() => zoomBy(-ZOOM_STEP)} aria-label="Zoom out"
          style={toolbarBtnStyle}>➖ Zoom Out</button>
        <button type="button" className="pill-btn" onClick={resetView} aria-label="Reset view"
          style={toolbarBtnStyle}>🎯 Reset View</button>
        <button type="button" className="pill-btn" onClick={() => setShowAspects((v) => !v)}
          aria-pressed={showAspects} aria-label={`${showAspects ? "Hide" : "Show"} aspects`}
          style={{ ...toolbarBtnStyle, borderColor: showAspects ? "rgba(126,255,178,0.5)" : toolbarBtnStyle.border }}>
          🔗 {showAspects ? "Hide" : "Show"} Aspects
        </button>
        <button type="button" className="pill-btn" onClick={() => setShowTransits((v) => !v)}
          aria-pressed={showTransits} aria-label={`${showTransits ? "Hide" : "Show"} transits`}
          style={{ ...toolbarBtnStyle, borderColor: showTransits ? "rgba(255,215,0,0.5)" : toolbarBtnStyle.border }}>
          🪐 {showTransits ? "Hide" : "Show"} Transits
        </button>
      </div>

      {/* Pan/zoom viewport */}
      <div
        role="application"
        aria-label="Interactive birth chart. Use the toolbar or plus, minus, and zero keys to zoom and reset. Tap or click a planet, house, sign, or aspect line to explore it."
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          position: "relative", width: "100%", maxWidth: 260, margin: "0 auto",
          overflow: "visible", touchAction: "none",
          cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
        }}
      >
        <div
          data-testid="kundli-zoom-pan-layer"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform var(--nv-duration-base, 0.25s) var(--nv-ease-standard, ease)",
          }}
        >
          <ZodiacWheel
            lagna={lagna}
            planetary={planetary}
            activePlanet={activePlanet}
            activeHouse={activeHouse}
            onPlanetHover={setHoveredPlanet}
            onPlanetClick={handlePlanetClick}
            onHouseHover={setHoveredHouse}
            onHouseClick={handleHouseClick}
          />

          {/* Overlay: sign / ascendant / aspect / transit hit-targets and
              lines, sharing the exact same 0 0 260 260 viewBox as
              ZodiacWheel so every coordinate lines up. `pointerEvents:
              "none"` at the root lets the ZodiacWheel layer beneath keep
              receiving its own planet/house clicks; individual overlay
              elements opt back in with `pointerEvents: "auto"`. */}
          <svg
            viewBox="0 0 260 260"
            width="100%"
            height="100%"
            aria-hidden={false}
            style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}
          >
            {/* Aspect lines */}
            {aspectLines.map((line) => {
              const isActive = selectedType === "aspect" && selectedItem?.id === line.aspectId;
              return (
                <line
                  key={line.id}
                  x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                  stroke={line.color}
                  strokeWidth={isActive ? 2.5 : 1}
                  strokeOpacity={isActive ? 0.9 : 0.35}
                  strokeDasharray={isActive ? undefined : "3 3"}
                  role="button"
                  tabIndex={0}
                  aria-label={`Aspect: ${line.item.label}`}
                  style={{ pointerEvents: "auto", cursor: "pointer" }}
                  onClick={() => select("aspect", line.item)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select("aspect", line.item); } }}
                  onMouseEnter={() => setHoveredLabel(line.item.label)}
                  onMouseLeave={() => setHoveredLabel(null)}
                />
              );
            })}

            {/* Zodiac sign hit-targets */}
            {signTargets.map(({ sign, x, y }) => (
              <circle
                key={sign}
                cx={x} cy={y} r={13}
                fill={isSignSelected(sign) ? "rgba(255,179,71,0.18)" : "transparent"}
                stroke={isSignSelected(sign) ? "rgba(255,179,71,0.6)" : "transparent"}
                strokeWidth={1.5}
                role="button"
                tabIndex={0}
                aria-label={`Zodiac sign ${sign}`}
                style={{ pointerEvents: "auto", cursor: "pointer" }}
                onClick={() => select("sign", buildSignItem(sign))}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select("sign", buildSignItem(sign)); } }}
                onMouseEnter={() => setHoveredLabel(sign)}
                onMouseLeave={() => setHoveredLabel(null)}
              />
            ))}

            {/* Ascendant hit-target (inner circle) */}
            {lagna && (
              <circle
                cx={WHEEL_CX} cy={WHEEL_CY} r={WHEEL_INNER - 4}
                fill={isAscendantSelected ? "rgba(255,158,216,0.12)" : "transparent"}
                stroke={isAscendantSelected ? "rgba(255,158,216,0.6)" : "transparent"}
                strokeWidth={1.5}
                role="button"
                tabIndex={0}
                aria-label={`Ascendant, Lagna in ${lagna}`}
                style={{ pointerEvents: "auto", cursor: "pointer" }}
                onClick={() => select("ascendant", buildAscendantItem(lagna))}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select("ascendant", buildAscendantItem(lagna)); } }}
                onMouseEnter={() => setHoveredLabel(`Ascendant · ${lagna}`)}
                onMouseLeave={() => setHoveredLabel(null)}
              />
            )}

            {/* Transit markers */}
            {transitMarkers.map((m) => (
              <g key={m.id}>
                <circle cx={m.x} cy={m.y} r={7} fill="rgba(255,215,0,0.18)" stroke="rgba(255,215,0,0.7)" strokeWidth={1} />
                <text x={m.x} y={m.y + 3} textAnchor="middle" fontSize={7.5} fill="var(--nv-color-brand-gold, #ffd700)" pointerEvents="none">
                  {m.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Status / live region */}
      <div aria-live="polite" style={{ fontSize: 11, color: "var(--nv-text-muted, rgba(200,160,255,0.55))", fontFamily: "Inter,sans-serif", textAlign: "center", minHeight: 14 }}>
        {hoveredLabel ? `Hovering: ${hoveredLabel}` : selectionSummary}
      </div>

      {/* Quick-select chips: Ascendant / Nakshatra / Yogas / Doshas — not
          spatial objects on the wheel itself, so surfaced as a clickable
          chip row that funnels into the same select() -> Explorer flow. */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
        {nakshatraItem && (
          <Chip color="#ffd700" active={selectedType === "nakshatra"}
            onClick={() => select("nakshatra", nakshatraItem)}>
            🌟 {nakshatraItem.label}
          </Chip>
        )}
        {yogas.map((y, idx) => (
          <Chip key={`yoga-${idx}-${y.name}`} color="#c9ff7e"
            active={selectedType === "yoga" && selectedItem?.id === `yoga-${idx}-${y.name}`}
            onClick={() => select("yoga", buildYogaItem(y, idx))}>
            ⭐ {y.name}
          </Chip>
        ))}
        {doshas.map((d, idx) => (
          <Chip key={`dosha-${idx}-${d.name}`} color="#ff7b7b"
            active={selectedType === "dosha" && selectedItem?.id === `dosha-${idx}-${d.name}`}
            onClick={() => select("dosha", buildDoshaItem(d, idx))}>
            🧿 {d.name}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function Chip({ color, active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap-scale"
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "5px 12px", borderRadius: 20, cursor: "pointer", font: "inherit",
        fontSize: 11, fontFamily: "Inter,sans-serif", fontWeight: 600,
        color, background: active ? `${color}22` : `${color}10`,
        border: `1px solid ${active ? `${color}80` : `${color}30`}`,
      }}
    >
      {children}
    </button>
  );
}

const toolbarBtnStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(180,120,255,0.25)",
  color: "var(--nv-text-secondary, rgba(200,160,255,0.7))",
  borderRadius: 20,
  padding: "5px 12px",
  fontSize: 11,
  cursor: "pointer",
  fontFamily: "Inter,sans-serif",
};

export default memo(InteractiveKundliChart);
