import { memo, useCallback, useMemo, useState } from "react";
import GlassCard from "../components/common/GlassCard.jsx";
import Badge from "../components/common/Badge.jsx";
import InsightRow from "../components/common/InsightRow.jsx";
import AiText from "../components/common/AiText.jsx";
import InteractiveKundliChart from "../components/common/InteractiveKundliChart.jsx";
import KeyHighlights from "../components/common/KeyHighlights.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import PlanetCard from "../components/report/PlanetCard.jsx";
import HouseCard from "../components/report/HouseCard.jsx";
import NumerologyCard from "../components/report/NumerologyCard.jsx";
import NakshatraCard from "../components/report/NakshatraCard.jsx";
import PredictionCard from "../components/report/PredictionCard.jsx";
import TimelineCard from "../components/report/TimelineCard.jsx";
import ExpandableSection from "../components/report/ExpandableSection.jsx";
import { PLANET_COLORS, MULANK_DESC, SIGN_NAMES, ZODIAC_SIGNS, PLANET_SIGNIFICANCE, HOUSE_MEANINGS } from "../constants/astrology.js";
import { plainPlanetName } from "../utils/explorerData.js";
// V5.2 (AI Timeline) — additive imports only.
import AiTimelineEventCard from "../components/timeline/AiTimelineEventCard.jsx";
import AiTimelineFilters from "../components/timeline/AiTimelineFilters.jsx";
import AiTimelineAIPanel from "../components/timeline/AiTimelineAIPanel.jsx";
import { TIMELINE_SECTIONS, TIMELINE_FILTER_CATEGORIES } from "../constants/aiTimeline.js";
// V5.3 (Explainable Report Intelligence) — additive imports only.
import ConfidenceExplanation from "../components/explanation/ConfidenceExplanation.jsx";
import PredictionEvidencePanel from "../components/explanation/PredictionEvidencePanel.jsx";

// ─────────────────────────────────────────────────────────────────────────
// Priority 5.1 note: every panel below is wrapped in React.memo. Only one
// tab is ever visible at a time (ResultsPage renders just the active
// panel), so memoization mainly pays off when userData/report/planetary
// update via setState after the AI response lands — panels for tabs the
// user isn't currently viewing simply aren't mounted, and the active one
// only re-renders when its actual inputs change instead of on every
// unrelated parent re-render (e.g. the visible-fade-in timer).
// ─────────────────────────────────────────────────────────────────────────

export const OverviewTab = memo(function OverviewTab({ userData, planetary, numerology, report, failed, onNavigateTab }) {
  const infoItems = useMemo(() => [
    { label:"Date of Birth", value: userData.dob },
    { label:"Time of Birth", value: userData.tob },
    { label:"Place of Birth", value: userData.pob },
    { label:"Lagna (Ascendant)", value: userData.lagna, color:"#bf7fff" },
    { label:"Mulank (Life Path)", value: `${numerology.mulank} · ${MULANK_DESC[numerology.mulank]||""}`, color:"#ffd700" },
    { label:"Bhagyank (Destiny)", value: numerology.bhagyank, color:"#ffd700" },
  ], [userData.dob, userData.tob, userData.pob, userData.lagna, numerology.mulank, numerology.bhagyank]);

  return (
    <div style={{ display:"grid", gap:16, gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))" }}>
      {/* Profile card */}
      <GlassCard style={{ padding:24, gridColumn:"1/-1", animation:"fadeIn 0.35s ease both" }}>
        <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
          <div aria-hidden="true" style={{ width:60, height:60, borderRadius:"50%", background:"var(--nv-accent-gradient, linear-gradient(135deg,#7b2fff,#4a00a0))",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>
            🪐
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <h2 style={{ margin:"0 0 4px", fontSize:"clamp(18px,3vw,22px)", background:"linear-gradient(135deg, #ffd700 0%, #ffb347 50%, #ffd700 100%)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", fontFamily:"Cinzel,serif", wordBreak:"break-word" }}>
              {userData.name}
            </h2>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:6 }}>
              <Badge color="#ffd700">Lagna: {userData.lagna}</Badge>
              <Badge color="#bf7fff">Mulank: {numerology.mulank}</Badge>
              <Badge color="#9dc9ff">Bhagyank: {numerology.bhagyank}</Badge>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Birth details */}
      <GlassCard style={{ padding:24, animation:"fadeIn 0.35s ease 0.05s both" }}>
        <h3 style={{ margin:"0 0 16px", fontSize:14, letterSpacing:1.5, textTransform:"uppercase",
          color:"var(--nv-text-muted, rgba(200,160,255,0.55))", fontFamily:"Inter,sans-serif", fontWeight:500 }}>BIRTH DETAILS</h3>
        {infoItems.map(r => <InsightRow key={r.label} {...r} />)}
      </GlassCard>

      {/* Numerology rings — Phase 3: extracted into the reusable
          NumerologyCard so Numerology reads as its own clear report
          section (same computation, same values, only reused presentation). */}
      <NumerologyCard numerology={numerology} />

      {/* Key highlights — Phase 3: scannable one-line gist of every AI
          section, so a reader can take in the whole report at a glance
          before opening any single tab. Tapping a card jumps straight to
          its full tab via the tab-switch handler ResultsPage already owns. */}
      <KeyHighlights report={report} failed={failed} onNavigate={onNavigateTab} />

      {/* Quick AI glimpse */}
      <GlassCard style={{ padding:24, gridColumn:"1/-1", borderColor:"rgba(255,215,0,0.25)", animation:"fadeIn 0.35s ease 0.15s both" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, marginBottom:12, flexWrap:"wrap" }}>
          <h3 style={{ margin:0, fontSize:14, letterSpacing:1.5, textTransform:"uppercase",
            color:"rgba(255,215,0,0.6)", fontFamily:"Inter,sans-serif", fontWeight:500 }}>✨ AI LIFE SUMMARY</h3>
          <Badge color="#ffd700" style={{ animation:"aiGlowPulse 2.6s ease-in-out infinite" }}>AI Insight</Badge>
        </div>
        <AiText text={report?.lifeSummary} placeholder="Weaving your cosmic story…" failed={failed} />
      </GlassCard>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────
// Phase 2 — Interactive Birth Chart & Astrology Experience.
//
// KundliTab now owns a small piece of local state (hoveredPlanet /
// hoveredHouse / selectedPlanet) so the zodiac wheel, the planetary
// position cards, and the house overview grid all highlight each other in
// sync — hover any one of them and the other two respond; click a planet
// (in the wheel or in its card) to pin a detailed info panel.
//
// This is presentation-only: it reads the same `planetary`/`userData`
// props as before (unchanged shape, unchanged source — the astrology
// engine / backend), and derives nothing new except which sign a house
// number maps to (whole-sign houses, computed the same way the wheel
// does), purely to render house→sign labels.
// ─────────────────────────────────────────────────────────────────────────
export const KundliTab = memo(function KundliTab({
  userData, planetary,
  // V5.1 (Interactive Kundli / Explorer Integration) — all optional and
  // default to safe no-ops, so any existing caller passing only
  // userData/planetary (e.g. this component rendered in isolation)
  // behaves exactly as before.
  report, selectedType = null, selectedItem = null, onSelect, onNavigateExplorer,
}) {
  const [hoveredPlanet, setHoveredPlanet] = useState(null);
  const [hoveredHouse, setHoveredHouse] = useState(null);
  const [selectedPlanet, setSelectedPlanet] = useState(null);

  const togglePlanet = (planet) => {
    setSelectedPlanet(cur => (cur === planet ? null : planet));
    onSelect?.("planet", { id: planet, label: planet, sublabel: planetary[planet] ? `H${planetary[planet].house}` : undefined, color: PLANET_COLORS[planet] });
    onNavigateExplorer?.();
  };

  const activePlanet = hoveredPlanet || selectedPlanet;
  const activeHouse = hoveredHouse ?? (activePlanet ? planetary[activePlanet]?.house : null);

  const selectedInfo = selectedPlanet ? planetary[selectedPlanet] : null;
  const selectedColor = selectedPlanet ? (PLANET_COLORS[selectedPlanet] || "#bf7fff") : "#bf7fff";

  // Phase 5 (Performance): the house-overview grid below previously ran
  // `Object.entries(planetary).filter(...)` once per house (12x) on every
  // render — and this component re-renders on every planet/house hover,
  // not just once. `planetary` itself never changes while this tab is
  // mounted (it's the same chart data passed down for the whole results
  // view), so grouping it by house once here and reusing that grouping on
  // every render removes a real, repeated, unnecessary recomputation
  // without changing what's displayed.
  const planetsByHouse = useMemo(() => {
    const grouped = {};
    Object.entries(planetary).forEach(([planet, info]) => {
      if (!grouped[info.house]) grouped[info.house] = [];
      grouped[info.house].push(planet);
    });
    return grouped;
  }, [planetary]);

  return (
    <div style={{ display:"grid", gap:16, gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))" }}>
      {/* Zodiac wheel */}
      <GlassCard style={{ padding:24, display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
        <h3 style={{ margin:0, fontSize:14, letterSpacing:1.5, textTransform:"uppercase",
          color:"var(--nv-text-muted, rgba(200,160,255,0.55))", fontFamily:"Inter,sans-serif", fontWeight:500 }}>BIRTH CHART</h3>
        <InteractiveKundliChart
          userData={userData}
          planetary={planetary}
          report={report}
          selectedType={selectedType}
          selectedItem={selectedItem}
          onSelect={onSelect}
          onNavigateExplorer={onNavigateExplorer}
        />
        <div style={{ textAlign:"center", display:"flex", flexWrap:"wrap", justifyContent:"center", gap:8 }}>
          <Badge color="#ffd700" style={{ fontSize:12, padding:"5px 14px" }}>
            Lagna: {userData.lagna} {ZODIAC_SIGNS[SIGN_NAMES.indexOf(userData.lagna)]}
          </Badge>
          <span style={{ fontSize:11, color:"var(--nv-text-muted, rgba(200,160,255,0.4))", fontFamily:"Inter,sans-serif", alignSelf:"center" }}>
            Tap a planet or house to explore
          </span>
        </div>
      </GlassCard>

      {/* Planetary position cards */}
      <GlassCard style={{ padding:24 }}>
        <h3 style={{ margin:"0 0 16px", fontSize:14, letterSpacing:1.5, textTransform:"uppercase",
          color:"var(--nv-text-muted, rgba(200,160,255,0.55))", fontFamily:"Inter,sans-serif", fontWeight:500 }}>PLANETARY POSITIONS</h3>
        <div style={{ display:"grid", gap:8 }}>
          {Object.entries(planetary).map(([planet, { house, sign }], idx) => (
            <div key={planet} style={{ animation:`fadeIn 0.35s ease ${idx * 0.04}s both` }}>
              <PlanetCard
                planet={planet}
                house={house}
                sign={sign}
                active={activePlanet === planet}
                selected={selectedPlanet === planet}
                onHover={() => setHoveredPlanet(planet)}
                onLeave={() => setHoveredPlanet(null)}
                onClick={() => togglePlanet(planet)}
              />
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Selected-planet detail panel */}
      {selectedPlanet && selectedInfo && (
        <GlassCard className="detail-panel-in" style={{ padding:24, gridColumn:"1/-1", borderColor:`${selectedColor}45` }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, marginBottom:12, flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span aria-hidden="true" style={{ width:36, height:36, borderRadius:"50%",
                background:`${selectedColor}22`, border:`1px solid ${selectedColor}55`,
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>
                {selectedPlanet.match(/[☀️🌙♂☿♃♀♄🌑🌕]/u)?.[0] || "✦"}
              </span>
              <h3 style={{ margin:0, fontSize:16, color:selectedColor, fontFamily:"Cinzel,serif", fontWeight:600 }}>{selectedPlanet}</h3>
            </div>
            <button type="button" onClick={() => setSelectedPlanet(null)} aria-label="Close planet detail"
              className="pill-btn" style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(180,120,255,0.25)",
                color:"var(--nv-text-secondary, rgba(200,160,255,0.7))", borderRadius:20, padding:"5px 12px", fontSize:12, cursor:"pointer",
                fontFamily:"Inter,sans-serif" }}>Close ✕</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:8, marginBottom:14 }}>
            <div style={{ padding:"10px 12px", background:`${selectedColor}10`, borderRadius:10, border:`1px solid ${selectedColor}30`, textAlign:"center" }}>
              <div style={{ fontSize:18, fontWeight:700, color:selectedColor, fontFamily:"Cinzel,serif" }}>House {selectedInfo.house}</div>
              <div style={{ fontSize:10, color:"var(--nv-text-muted, rgba(200,160,255,0.55))", marginTop:2, fontFamily:"Inter,sans-serif" }}>{HOUSE_MEANINGS[selectedInfo.house] || ""}</div>
            </div>
            <div style={{ padding:"10px 12px", background:`${selectedColor}10`, borderRadius:10, border:`1px solid ${selectedColor}30`, textAlign:"center" }}>
              <div style={{ fontSize:18, fontWeight:700, color:selectedColor, fontFamily:"Cinzel,serif" }}>{selectedInfo.sign}</div>
              <div style={{ fontSize:10, color:"var(--nv-text-muted, rgba(200,160,255,0.55))", marginTop:2, fontFamily:"Inter,sans-serif" }}>Zodiac Sign</div>
            </div>
          </div>
          <p style={{ margin:0, fontSize:13, color:"var(--nv-text-primary, rgba(220,190,255,0.8))", lineHeight:1.7, fontFamily:"Inter,sans-serif" }}>
            {PLANET_SIGNIFICANCE[selectedPlanet] || "A key influence in this chart."}
          </p>
        </GlassCard>
      )}

      {/* House overview grid */}
      <GlassCard style={{ padding:24, gridColumn:"1/-1" }}>
        <h3 style={{ margin:"0 0 16px", fontSize:14, letterSpacing:1.5, textTransform:"uppercase",
          color:"var(--nv-text-muted, rgba(200,160,255,0.55))", fontFamily:"Inter,sans-serif", fontWeight:500 }}>HOUSE OVERVIEW</h3>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:8 }}>
          {Array.from({length:12},(_,i)=>i+1).map(h => {
            const planets = planetsByHouse[h] || [];
            const houseSign = planets[0] ? planetary[planets[0]]?.sign : undefined;
            return (
              <HouseCard
                key={h}
                house={h}
                planets={planets}
                houseSign={houseSign}
                active={activeHouse === h}
                onHover={() => setHoveredHouse(h)}
                onLeave={() => setHoveredHouse(null)}
                onClick={() => {
                  setHoveredHouse(cur => (cur === h ? null : h));
                  onSelect?.("house", { id: `house-${h}`, label: `House ${h}`, sublabel: HOUSE_MEANINGS[h] });
                  onNavigateExplorer?.();
                }}
              />
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
});

export const TwoSectionTab = memo(function TwoSectionTab({ sections, failed }) {
  return (
    <div style={{ display:"grid", gap:16, gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))" }}>
      {sections.map(({ title, icon, color, text, placeholder, extras }, idx) => (
        <GlassCard key={title} style={{ padding:24, borderLeft:`3px solid ${color}`, borderTopLeftRadius:4, borderBottomLeftRadius:4,
          animation:`fadeIn 0.4s ease ${idx * 0.06}s both` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
            <span aria-hidden="true" style={{ fontSize:22 }}>{icon}</span>
            <h3 style={{ margin:0, fontSize:16, color, fontFamily:"Cinzel,serif", fontWeight:600 }}>{title}</h3>
            <Badge color={color} style={{ marginLeft:"auto", animation:"aiGlowPulse 2.6s ease-in-out infinite" }}>AI Insight</Badge>
          </div>
          {extras && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))", gap:8, marginBottom:16 }}>
              {extras.map(e => (
                <div key={e.label} style={{ padding:"10px 12px", background:`${e.color||color}12`,
                  borderRadius:10, border:`1px solid ${e.color||color}30`, textAlign:"center" }}>
                  <div style={{ fontSize:20, fontWeight:700, color:e.color||color, fontFamily:"Cinzel,serif" }}>{e.value}</div>
                  <div style={{ fontSize:10, color:"var(--nv-text-muted, rgba(200,160,255,0.55))", marginTop:2, fontFamily:"Inter,sans-serif" }}>{e.label}</div>
                </div>
              ))}
            </div>
          )}
          <AiText text={text} placeholder={placeholder} failed={failed} />
        </GlassCard>
      ))}
    </div>
  );
});

export const SingleTab = memo(function SingleTab({ icon, title, color, text, placeholder, failed, children }) {
  return (
    <div style={{ display:"grid", gap:16 }}>
      <GlassCard style={{ padding:24, borderLeft:`3px solid ${color}`, borderTopLeftRadius:4, borderBottomLeftRadius:4,
        animation:"fadeIn 0.4s ease both" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          <span aria-hidden="true" style={{ fontSize:24 }}>{icon}</span>
          <h3 style={{ margin:0, fontSize:18, color, fontFamily:"Cinzel,serif", fontWeight:600 }}>{title}</h3>
          <Badge color={color} style={{ marginLeft:"auto", animation:"aiGlowPulse 2.6s ease-in-out infinite" }}>AI Insight</Badge>
        </div>
        <AiText text={text} placeholder={placeholder} failed={failed} />
      </GlassCard>
      {children}
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────
// PredictionsTab (V2.0 Phase 7.1 — Prediction & Profile Integration;
// V3.0 Phase 3 — Interactive Report Experience)
//
// Renders directly from the backend-authoritative `report.predictions` /
// `report.nakshatraProfile` fields (see backend/services/astrology/
// predictionApiMapper.js) — no calculation happens here, only display.
// Phase 3: the Nakshatra Profile block and the per-prediction card are now
// the reusable NakshatraCard / PredictionCard components (src/components/
// report/), and the predictions grid is wrapped in ExpandableSection so a
// long category list can be collapsed — matching the Phase 3 "reusable
// report components" + "expandable sections" requirements. No data or
// calculation changed, only presentation/reuse.
//
// This tab renders whenever `predictions`/`nakshatraProfile` are present
// on `report`, regardless of whether the AI narrative fields (loveLife,
// career, ...) are — i.e. it works identically whether `report` came from
// /api/generate-report (with Gemini) or /api/chart (Gemini disabled),
// since both endpoints now expose these same backend-computed fields.
// ─────────────────────────────────────────────────────────────────────────
export const PredictionsTab = memo(function PredictionsTab({ report }) {
  const predictions = report?.predictions;
  const nakshatraProfile = report?.nakshatraProfile;
  const transitForecast = report?.transitForecast;
  // V5.3 (Explainable Report Intelligence): the same backend chart object
  // Explorer AI/AI Timeline already ground their explanations in.
  const chart = report?.chart;

  if (!predictions?.length && !nakshatraProfile) {
    return (
      <EmptyState
        icon="🔮"
        title="Predictions not available yet"
        message="Backend-computed predictions will appear here once your chart has been calculated."
      />
    );
  }

  return (
    <div style={{ display:"grid", gap:16 }}>
      <NakshatraCard nakshatraProfile={nakshatraProfile} />

      {predictions?.length > 0 && (
        <ExpandableSection icon="🔮" title="Category Predictions" color="#ffd700" count={predictions.length}>
          <div style={{ display:"grid", gap:16, gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))" }}>
            {predictions.map((p, idx) => (
              <div key={p.category}>
                <PredictionCard prediction={p} idx={idx} />
                {/* V5.3 (Explainable Report Intelligence): additive,
                    beneath the existing, unmodified PredictionCard. */}
                {chart && (
                  <>
                    <ConfidenceExplanation chart={chart} report={report} category={p.category} />
                    <PredictionEvidencePanel chart={chart} report={report} category={p.category} />
                  </>
                )}
              </div>
            ))}
          </div>
        </ExpandableSection>
      )}

      {transitForecast && (
        <GlassCard style={{ padding:24 }}>
          <h3 style={{ margin:"0 0 16px", fontSize:14, letterSpacing:1.5, textTransform:"uppercase",
            color:"var(--nv-text-muted, rgba(200,160,255,0.55))", fontFamily:"Inter,sans-serif", fontWeight:500 }}>TRANSIT FORECAST</h3>
          {transitForecast.saturn && <InsightRow label="Saturn" value={`${transitForecast.saturn.transitSign} (House ${transitForecast.saturn.houseFromMoon ?? "?"} from Moon)`} />}
          {transitForecast.jupiter && <InsightRow label="Jupiter" value={`${transitForecast.jupiter.transitSign} (House ${transitForecast.jupiter.houseFromMoon ?? "?"} from Moon)`} />}
          {transitForecast.rahuKetu?.map((t) => (
            <InsightRow key={t.planet} label={t.planet} value={`${t.transitSign} (House ${t.houseFromMoon ?? "?"} from Moon)`} />
          ))}
        </GlassCard>
      )}
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────
// TimelineTab (V3.0 Phase 3 — Interactive Report Experience;
// transformed into the AI-Powered Interactive Timeline in V5.2)
//
// V5.2 (AI Timeline): this tab now renders `report.aiTimeline` — the seven
// Past/Present/Near Future/Next Month/Next 3 Months/Next 6 Months/Next
// Year sections computed by aiTimelineEngine.js and shaped by
// predictionApiMapper.js#mapAiTimeline — instead of the three
// oneYear/fiveYear/tenYear horizons this tab previously showed. Every
// event is the same backend-computed prediction shape PredictionCard/the
// old TimelineCard already rendered (see AiTimelineEventCard.jsx), so
// nothing here performs or duplicates any astrology calculation; this file
// only adds sectioning, filtering, selection, and the "Explain with AI"
// entry point (AiTimelineAIPanel.jsx), reusing existing AI Report Chat
// infrastructure end-to-end.
//
// Backward compatibility: a report computed before this phase shipped
// (no `aiTimeline` field yet, e.g. a cached page load) falls back to the
// original oneYear/fiveYear/tenYear horizon rendering below so nothing
// breaks for it.
// ─────────────────────────────────────────────────────────────────────────
const TIMELINE_HORIZONS = [
  { key: "oneYear", label: "Next 1 Year", icon: "🌒" },
  { key: "fiveYear", label: "Next 5 Years", icon: "🌓" },
  { key: "tenYear", label: "Next 10 Years", icon: "🌕" },
];

// V5.4 fix — duplicate AI Timeline text. The Dasha windows behind
// nearby/overlapping periods can legitimately produce the exact same
// backend-authored prediction sentence attached to more than one
// section/category (e.g. the same Jupiter-Venus window driving both a
// "career" and a "family" entry). Showing that identical sentence
// verbatim in every section it's attached to reads as a rendering bug, so
// each distinct prediction sentence is only ever shown once — on
// whichever of its events sits first in TIMELINE_FILTER_CATEGORIES'
// existing display-priority order (already the single source of truth
// this app uses for life-area ordering, see AiTimelineFilters.jsx). Every
// event is still rendered as its own card (badges, category, highlighting,
// selection, and the "Explain with AI" flow are untouched) — only the
// repeated prediction paragraph itself is deduplicated.
const CATEGORY_PRIORITY = Object.fromEntries(TIMELINE_FILTER_CATEGORIES.map((c, i) => [c.key, i]));

function buildPredictionTextOwners(aiTimeline) {
  const owners = new Map(); // prediction text -> { id, priority }
  TIMELINE_SECTIONS.forEach(({ key }) => {
    (aiTimeline?.[key] || []).forEach((event) => {
      const text = event?.prediction;
      if (!text) return;
      const priority = CATEGORY_PRIORITY[event.filterCategory] ?? Number.MAX_SAFE_INTEGER;
      const current = owners.get(text);
      if (!current || priority < current.priority) {
        owners.set(text, { id: event.id, priority });
      }
    });
  });
  return owners;
}

// V5.1 (Interactive Kundli / Explorer Integration) — is this timeline
// entry relevant to whatever is currently selected in the Explorer? Every
// field read here (dominantPlanet/supportingPlanets/supportingHouses/
// supportingYogas/supportingDoshas) already exists on the entry verbatim
// (see backend/services/astrology/predictionApiMapper.js#mapPredictionToApiShape
// — the same shape used for report.predictions, and, as of V5.2, for
// every report.aiTimeline event too). Sign/ascendant/nakshatra/aspect
// selections have no matching field on a timeline entry, so they simply
// never highlight anything here — no invented association.
function isEntryRelevant(entry, selectedType, selectedItem) {
  if (!entry || !selectedType || !selectedItem) return false;
  switch (selectedType) {
    case "planet": {
      const plain = plainPlanetName(selectedItem.id);
      return entry.dominantPlanet === plain || (entry.supportingPlanets || []).includes(plain);
    }
    case "house": {
      const houseNum = Number(String(selectedItem.id).replace("house-", ""));
      return (entry.supportingHouses || []).includes(houseNum);
    }
    case "yoga":
      return (entry.supportingYogas || []).some((y) => selectedItem.label && y.name === selectedItem.label);
    case "dosha":
      return (entry.supportingDoshas || []).some((d) => selectedItem.label && d.name === selectedItem.label);
    default:
      return false;
  }
}

export const TimelineTab = memo(function TimelineTab({ report, chart, selectedType = null, selectedItem = null }) {
  const aiTimeline = report?.aiTimeline;
  const legacyTimeline = report?.predictionTimeline;
  const currentDasha = report?.predictions?.[0];

  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const hasAiTimeline = TIMELINE_SECTIONS.some((s) => aiTimeline?.[s.key]?.length > 0);
  const hasLegacyHorizon = TIMELINE_HORIZONS.some((h) => legacyTimeline?.[h.key]?.length > 0);

  // Computed from the full, unfiltered aiTimeline so the "owning" event for
  // a given prediction sentence never changes as the life-area filter is
  // toggled — only which events pass the filter changes.
  const predictionTextOwners = useMemo(
    () => (hasAiTimeline ? buildPredictionTextOwners(aiTimeline) : new Map()),
    [aiTimeline, hasAiTimeline]
  );

  const filteredSections = useMemo(() => {
    if (!hasAiTimeline) return [];
    return TIMELINE_SECTIONS.map(({ key, label, icon }) => {
      const events = (aiTimeline?.[key] || []).filter(
        (e) => !activeCategory || e.filterCategory === activeCategory
      );
      return { key, label, icon, events };
    });
  }, [aiTimeline, activeCategory, hasAiTimeline]);

  const hasAnyFilteredEvent = filteredSections.some((s) => s.events.length > 0);

  const handleSelect = useCallback((event) => {
    setSelectedEvent((prev) => (prev?.id === event.id ? null : event));
  }, []);

  // Loading state — the report itself hasn't arrived from the parent yet
  // (ResultsPage passes `report` down only once its own fetch resolves;
  // this guards the tab defensively in case it's ever reached earlier).
  if (!report) {
    return (
      <div role="status" aria-live="polite" style={{ display: "grid", gap: 12, justifyItems: "center", padding: 40 }}>
        <span aria-hidden="true" style={{ fontSize: 28 }}>🕓</span>
        <p style={{ margin: 0, fontSize: 13, color: "var(--nv-text-muted, rgba(200,160,255,0.6))", fontFamily: "Inter,sans-serif" }}>
          Building your AI Timeline…
        </p>
      </div>
    );
  }

  // Empty state — the report has finished computing but produced no
  // Dasha-based timeline data at all (e.g. an unavailable Dasha window).
  if (!hasAiTimeline && !hasLegacyHorizon && !currentDasha) {
    return (
      <EmptyState
        icon="🕓"
        title="Timeline not available yet"
        message="Your Mahadasha/Antardasha timeline will appear here once your chart has been calculated."
      />
    );
  }

  return (
    <div style={{ display:"grid", gap:16 }}>
      {currentDasha && (
        <GlassCard style={{ padding:24, animation:"fadeIn 0.35s ease both" }}>
          <h3 style={{ margin:"0 0 16px", fontSize:14, letterSpacing:1.5, textTransform:"uppercase",
            color:"var(--nv-text-muted, rgba(200,160,255,0.55))", fontFamily:"Inter,sans-serif", fontWeight:500 }}>CURRENT DASHA</h3>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            <Badge color="#bf7fff">Mahadasha: {currentDasha.activeMahadasha || "—"}</Badge>
            <Badge color="#bf7fff">Antardasha: {currentDasha.activeAntardasha || "—"}</Badge>
            {currentDasha.dominantPlanet && (
              <Badge color={PLANET_COLORS[currentDasha.dominantPlanet] || "#ffd700"}>Dominant: {currentDasha.dominantPlanet}</Badge>
            )}
          </div>
        </GlassCard>
      )}

      {hasAiTimeline && (
        <>
          <GlassCard style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase",
              color: "var(--nv-text-muted, rgba(200,160,255,0.55))", fontFamily: "Inter,sans-serif", fontWeight: 500 }}>
              FILTER BY LIFE AREA
            </h3>
            <AiTimelineFilters activeCategory={activeCategory} onChange={setActiveCategory} />
          </GlassCard>

          {selectedEvent && (
            <AiTimelineAIPanel event={selectedEvent} chart={chart} report={report} />
          )}

          {!hasAnyFilteredEvent && (
            <EmptyState
              compact
              icon="🔍"
              title="No events for this filter"
              message="No AI Timeline events match the selected life area yet. Try a different filter or select All."
            />
          )}

          {filteredSections.map(({ key, label, icon, events }) => {
            if (!events.length) return null;
            return (
              <ExpandableSection key={key} icon={icon} title={label} color="#ffd700" count={events.length}>
                <div style={{ marginTop:8 }} role="list" aria-label={`${label} timeline events`}>
                  {events.map((event, idx) => (
                    <div key={event.id} role="listitem">
                      <AiTimelineEventCard
                        event={event}
                        isLast={idx === events.length - 1}
                        highlighted={isEntryRelevant(event, selectedType, selectedItem)}
                        selected={selectedEvent?.id === event.id}
                        onSelect={handleSelect}
                        hidePrediction={
                          !!event.prediction && predictionTextOwners.get(event.prediction)?.id !== event.id
                        }
                      />
                    </div>
                  ))}
                </div>
              </ExpandableSection>
            );
          })}
        </>
      )}

      {/* Backward compatibility — legacy horizons, only shown if this
          report predates the aiTimeline field. */}
      {!hasAiTimeline && hasLegacyHorizon && TIMELINE_HORIZONS.map(({ key, label, icon }) => {
        const entries = legacyTimeline?.[key];
        if (!entries?.length) return null;
        return (
          <ExpandableSection key={key} icon={icon} title={label} color="#ffd700" count={entries.length}>
            <div style={{ marginTop:8 }}>
              {entries.map((entry, idx) => (
                <TimelineCard
                  key={`${key}-${idx}`}
                  entry={entry}
                  isLast={idx === entries.length - 1}
                  highlighted={isEntryRelevant(entry, selectedType, selectedItem)}
                />
              ))}
            </div>
          </ExpandableSection>
        );
      })}
    </div>
  );
});
