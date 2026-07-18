// ─────────────────────────────────────────────────────────────────────────
// Horoscope & Astrology Calendar helpers (V3.0 Phase 5)
//
// Every function here is a pure, presentation-layer read of data the
// backend has ALREADY computed (report.dasha, report.transits,
// report.predictions, report.predictionTimeline). Nothing in this file
// performs astrology calculation, scoring, or rule evaluation — it only
// filters/sorts/labels already-authoritative backend objects so the
// Horoscope and Calendar pages can render them as "Today" / "This Week" /
// "This Month" / calendar events. Mirrors the same separation
// predictionApiMapper.js and predictionDisplay.js already use on the
// backend/frontend respectively.
// ─────────────────────────────────────────────────────────────────────────

const CATEGORY_META = {
  career: { label: "Career", icon: "💼", color: "#7eb8ff" },
  finance: { label: "Finance", icon: "💰", color: "#ffd700" },
  marriage: { label: "Love & Marriage", icon: "💞", color: "#ff7eb3" },
  education: { label: "Education", icon: "📚", color: "#9dc9ff" },
  health: { label: "Health", icon: "🌿", color: "#7effb2" },
  family: { label: "Family", icon: "🏡", color: "#ffb347" },
  spiritualGrowth: { label: "Spiritual Growth", icon: "🕉️", color: "#bf7fff" },
  general: { label: "General Guidance", icon: "✨", color: "var(--nv-text-primary, #f1e4ff)" },
};

export function categoryMeta(categoryKey) {
  return CATEGORY_META[categoryKey] || { label: categoryKey || "General", icon: "✨", color: "#bf7fff" };
}

// report.predictions[] entries carry `category` as the *display* label
// already ("Career", "Finance", ...) per predictionApiMapper.js — this
// maps that label back to a lookup key for icon/color only.
export function categoryMetaFromLabel(label) {
  const entry = Object.entries(CATEGORY_META).find(([, v]) => v.label === label);
  return entry ? entry[1] : { label: label || "General", icon: "✨", color: "#bf7fff" };
}

const TRANSIT_PLANET_COLORS = {
  Saturn: "#9dc9ff",
  Jupiter: "#ffb347",
  Rahu: "#bf7fff",
  Ketu: "#ffec8b",
};

export function transitPlanetColor(planet) {
  return TRANSIT_PLANET_COLORS[planet] || "#bf7fff";
}

// A transit "belongs" to caution if the backend already flagged it
// (Sade Sati / Kantaka Shani / Ashtama Shani come straight from
// transitRuleEvaluator.js) — this is a direct read of an existing flag,
// never a new judgment about the transit's effect.
export function isCautionTransit(transit) {
  return Boolean(transit?.flags?.length);
}

// Splits the backend's flat `report.transits` array (transitEngine.js
// output) into "auspicious" (no caution flag raised) vs "caution"
// (already flagged) groups, for the Calendar's two day-type lists.
export function splitTransitsByTone(transits) {
  const list = transits || [];
  return {
    caution: list.filter(isCautionTransit),
    auspicious: list.filter((t) => !isCautionTransit(t)),
  };
}

function toDate(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`);
}

// All Antardasha segments of the CURRENT Mahadasha (from report.dasha's
// own full `timeline`) whose start date is today or later — i.e. the
// Dasha changes still ahead, exactly as already computed by
// dashaEngine.js/dashaRuleEvaluator.js. Nothing here recalculates a
// Dasha; it only walks the existing nested timeline array.
export function upcomingDashaChanges(dasha, asOf = new Date()) {
  if (!dasha?.available) return [];
  const events = [];
  for (const maha of dasha.timeline || []) {
    for (const antar of maha.antardashas || []) {
      if (toDate(antar.startDate) >= asOf) {
        events.push({
          type: "antardasha",
          mahaLord: maha.lord,
          lord: antar.lord,
          startDate: antar.startDate,
          endDate: antar.endDate,
        });
      }
    }
  }
  events.sort((a, b) => toDate(a.startDate) - toDate(b.startDate));
  if (dasha.nextMahadasha) {
    events.unshift({
      type: "mahadasha",
      mahaLord: dasha.nextMahadasha.lord,
      lord: dasha.nextMahadasha.lord,
      startDate: dasha.nextMahadasha.startDate,
      endDate: dasha.nextMahadasha.endDate,
    });
  }
  return events.slice(0, 12);
}

// predictionTimeline.oneYear entries (predictionTimelineEngine.js output,
// already windowed to the next 12 months) that overlap the current
// calendar month — presented as "This Month's Focus". Pure date-range
// filtering over data the backend already produced.
export function currentMonthPredictions(predictionTimeline, asOf = new Date()) {
  const entries = predictionTimeline?.oneYear || [];
  const monthStart = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth() + 1, 1));
  return entries.filter((e) => {
    if (!e.timePeriod?.startDate) return false;
    const s = toDate(e.timePeriod.startDate);
    const en = e.timePeriod.endDate ? toDate(e.timePeriod.endDate) : s;
    return s < monthEnd && en >= monthStart;
  });
}

// Builds a single, reverse-chronological (soonest first) merged event feed
// for CalendarTimeline: upcoming Dasha changes + transit flag events (Sade
// Sati/Kantaka Shani/Ashtama Shani, already dated `asOf` by the backend).
// Every field displayed is a direct read of report.dasha/report.transits.
export function buildCalendarEvents(dasha, transits, asOf = new Date()) {
  const events = [];

  for (const change of upcomingDashaChanges(dasha, asOf)) {
    events.push({
      id: `dasha-${change.type}-${change.lord}-${change.startDate}`,
      kind: change.type === "mahadasha" ? "Mahadasha Change" : "Antardasha Change",
      title: `${change.lord} ${change.type === "mahadasha" ? "Mahadasha" : "Antardasha"} begins`,
      date: change.startDate,
      tone: "dasha",
    });
  }

  for (const t of transits || []) {
    for (const flag of t.flags || []) {
      events.push({
        id: `transit-${t.planet}-${flag.name}`,
        kind: "Transit Event",
        title: `${t.planet}: ${flag.name}`,
        detail: flag.note,
        date: t.asOf,
        tone: "caution",
      });
    }
  }

  events.sort((a, b) => toDate(a.date) - toDate(b.date));
  return events;
}

export default {
  categoryMeta,
  categoryMetaFromLabel,
  transitPlanetColor,
  isCautionTransit,
  splitTransitsByTone,
  upcomingDashaChanges,
  currentMonthPredictions,
  buildCalendarEvents,
};
