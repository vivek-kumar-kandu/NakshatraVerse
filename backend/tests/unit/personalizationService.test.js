import { describe, it, expect, beforeEach } from "vitest";
import { buildPersonalizationFromRecords, clearPersonalizationCache } from "../../services/personalization/personalizationService.js";

describe("Personalization Engine", () => {
  beforeEach(() => clearPersonalizationCache());
  it("builds summaries, recommendation cards, change comparison and history from saved backend data", () => {
    const records = [
      { id: "new", title: "New", createdAt: "2026-07-10", report: { predictions: [{ category: "Career", prediction: "A focused period.", confidence: { label: "High", score: 80 }, activeMahadasha: "Saturn" }], aiTimeline: { present: [{ id: "now", title: "Present", summary: "Use steady effort." }] } }, chart: { remedies: [{ type: "Practice", detail: "Keep a routine." }] } },
      { id: "old", title: "Old", createdAt: "2026-06-10", report: { predictions: [{ category: "Career", prediction: "Earlier outlook.", confidence: { label: "Medium", score: 60 }, activeMahadasha: "Jupiter" }] }, chart: {} },
    ];
    const result = buildPersonalizationFromRecords(records, "new", "daily");
    expect(result.summary.body).toContain("focused");
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.whatsChanged.available).toBe(true);
    expect(result.history).toHaveLength(2);
  });
});
