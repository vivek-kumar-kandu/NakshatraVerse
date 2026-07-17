// V5.4 Personalization Engine.  This module intentionally only reads saved,
// backend-produced report data.  It does not run astrology, prediction, rule,
// chat, or life-coach engines.
import * as reportRepository from "../../repositories/report.repository.js";
import { TTLCache, memoizeSync } from "../utils/cache.js";

export const personalizationCache = new TTLCache({ name: "personalizationCache", maxEntries: 200, ttlMs: 15 * 60 * 1000 });

const PERIODS = new Set(["daily", "weekly", "monthly"]);

function compact(value, max = 180) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;
}

function predictionsFor(record) {
  return record?.report?.predictions || record?.chart?.predictions || [];
}

function sortByConfidence(predictions) {
  return [...predictions].sort((a, b) => (b?.confidence?.score || 0) - (a?.confidence?.score || 0));
}

function selectedPeriod(period) {
  return PERIODS.has(period) ? period : "daily";
}

function activeTimeline(record, period) {
  const timeline = record?.report?.aiTimeline || record?.chart?.aiTimeline || {};
  const key = period === "daily" ? "present" : period === "weekly" ? "nearFuture" : "nextMonth";
  return Array.isArray(timeline[key]) ? timeline[key].slice(0, 2) : [];
}

function buildCards(record, period) {
  const predictions = sortByConfidence(predictionsFor(record));
  const focus = predictions[0];
  const timeline = activeTimeline(record, period);
  const remedies = record?.chart?.remedies || record?.report?.remediesList || [];
  const cards = [];
  if (focus) cards.push({ id: `focus-${focus.category}`, type: "focus", title: `${focus.category} focus`, body: compact(focus.prediction), confidence: focus.confidence || null, category: focus.category });
  for (const event of timeline) cards.push({ id: `timeline-${event.id || event.title}`, type: "timeline", title: event.title || "Timeline insight", body: compact(event.summary || event.description || event.detail), confidence: event.confidence || focus?.confidence || null });
  const remedy = remedies[0];
  if (remedy) cards.push({ id: `remedy-${remedy.type}`, type: "remedy", title: remedy.type || "Suggested remedy", body: compact(remedy.detail || remedy.description), confidence: focus?.confidence || null });
  return cards.slice(0, 4);
}

function comparison(current, previous) {
  if (!previous) return { available: false, message: "Your first saved reading establishes the baseline for future changes.", changes: [] };
  const currentPredictions = predictionsFor(current);
  const previousPredictions = predictionsFor(previous);
  const changes = currentPredictions.map((item) => {
    const old = previousPredictions.find((candidate) => candidate.category === item.category);
    const delta = (item?.confidence?.score || 0) - (old?.confidence?.score || 0);
    return old && delta !== 0 ? { category: item.category, confidenceDelta: delta, previousConfidence: old.confidence || null, currentConfidence: item.confidence || null } : null;
  }).filter(Boolean).slice(0, 3);
  const currentDasha = currentPredictions[0]?.activeMahadasha || currentPredictions[0]?.dasha;
  const previousDasha = previousPredictions[0]?.activeMahadasha || previousPredictions[0]?.dasha;
  if (currentDasha && currentDasha !== previousDasha) changes.unshift({ category: "Dasha", previous: previousDasha || "Not available", current: currentDasha });
  return { available: true, message: changes.length ? "These are the meaningful changes between your two latest saved readings." : "Your core report signals remain consistent with your previous saved reading.", changes: changes.slice(0, 3) };
}

export function buildPersonalizationFromRecords(records, reportId, period) {
  const current = reportId ? records.find((record) => record.id === reportId) : records[0];
  if (!current) return { period: selectedPeriod(period), generatedAt: new Date().toISOString(), insightCards: [], summary: null, recommendations: [], whatsChanged: { available: false, message: "Save a reading to unlock personalized insights.", changes: [] }, history: [] };
  const currentIndex = records.findIndex((record) => record.id === current.id);
  const primary = sortByConfidence(predictionsFor(current))[0];
  const cards = buildCards(current, selectedPeriod(period));
  return {
    reportId: current.id,
    period: selectedPeriod(period),
    generatedAt: new Date().toISOString(),
    summary: { title: `${selectedPeriod(period)[0].toUpperCase()}${selectedPeriod(period).slice(1)} summary`, body: compact(primary?.prediction || current.report?.lifeSummary || "Your saved reading is ready for personalized guidance."), confidence: primary?.confidence || null },
    insightCards: cards,
    recommendations: cards.filter((card) => card.type === "focus" || card.type === "remedy"),
    whatsChanged: comparison(current, records[currentIndex + 1]),
    history: records.slice(0, 8).map((record) => ({ reportId: record.id, title: record.title, createdAt: record.createdAt, topCategory: sortByConfidence(predictionsFor(record))[0]?.category || null, confidence: sortByConfidence(predictionsFor(record))[0]?.confidence || null })),
  };
}

function buildPersonalization(userId, reportId, period) {
  return buildPersonalizationFromRecords(reportRepository.findByUser(userId), reportId, period);
}

export const getPersonalization = memoizeSync(buildPersonalization, {
  cache: personalizationCache,
  keyFn: (userId, reportId, period) => `${userId}|${reportId || "latest"}|${selectedPeriod(period)}`,
});

export function clearPersonalizationCache() { personalizationCache.clear(); }
export default { getPersonalization, clearPersonalizationCache, personalizationCache };
