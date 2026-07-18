import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TimelineTab } from "../src/pages/ResultsTabs.jsx";

// ─────────────────────────────────────────────────────────────────────────
// V5.1 — Prediction Timeline Integration
//
// TimelineTab already renders `report.predictionTimeline` (V3.0 Phase 3);
// V5.1 adds optional `selectedType`/`selectedItem` props so the Explorer
// selection can highlight the timeline entries it's relevant to. Passing
// neither prop (as any pre-V5.1 caller would) must render exactly as
// before — no highlighting, no crash.
// ─────────────────────────────────────────────────────────────────────────

const REPORT = {
  predictions: [{ activeMahadasha: "Jupiter", activeAntardasha: "Venus", dominantPlanet: "Jupiter" }],
  predictionTimeline: {
    oneYear: [
      {
        timePeriod: { startDate: "2026-01-01", endDate: "2026-06-01" },
        confidence: { label: "High", score: 82 },
        prediction: "A favorable period for career growth.",
        dominantPlanet: "Jupiter",
        supportingPlanets: ["Sun"],
        supportingHouses: [10],
        supportingYogas: [{ name: "Gaj Kesari Yoga" }],
        supportingDoshas: [],
      },
      {
        timePeriod: { startDate: "2026-06-02", endDate: "2026-12-01" },
        confidence: { label: "Medium", score: 60 },
        prediction: "A quieter period for relationships.",
        dominantPlanet: "Venus",
        supportingPlanets: ["Moon"],
        supportingHouses: [7],
        supportingYogas: [],
        supportingDoshas: [{ name: "Mangal Dosha" }],
      },
    ],
    fiveYear: [],
    tenYear: [],
  },
};

describe("TimelineTab — Prediction Timeline Integration", () => {
  it("renders with no highlighting when no selection is passed (backward compatible)", () => {
    const { container } = render(<TimelineTab report={REPORT} />);
    expect(screen.getByText(/favorable period for career growth/i)).toBeInTheDocument();
    expect(container.querySelectorAll('[data-highlighted="true"]').length).toBe(0);
  });

  it("highlights the entry whose dominant/supporting planet matches the selected planet", () => {
    const { container } = render(
      <TimelineTab report={REPORT} selectedType="planet" selectedItem={{ id: "Jupiter ♃", label: "Jupiter ♃" }} />
    );
    expect(container.querySelectorAll('[data-highlighted="true"]').length).toBe(1);
  });

  it("highlights the entry whose supportingHouses includes the selected house", () => {
    const { container } = render(
      <TimelineTab report={REPORT} selectedType="house" selectedItem={{ id: "house-7", label: "House 7" }} />
    );
    expect(container.querySelectorAll('[data-highlighted="true"]').length).toBe(1);
  });

  it("highlights the entry whose supportingYogas includes the selected yoga", () => {
    const { container } = render(
      <TimelineTab report={REPORT} selectedType="yoga" selectedItem={{ id: "yoga-0-Gaj Kesari Yoga", label: "Gaj Kesari Yoga" }} />
    );
    expect(container.querySelectorAll('[data-highlighted="true"]').length).toBe(1);
  });

  it("does not highlight anything for selection types with no matching timeline field (e.g. sign)", () => {
    const { container } = render(
      <TimelineTab report={REPORT} selectedType="sign" selectedItem={{ id: "Leo", label: "Leo" }} />
    );
    expect(container.querySelectorAll('[data-highlighted="true"]').length).toBe(0);
  });
});
