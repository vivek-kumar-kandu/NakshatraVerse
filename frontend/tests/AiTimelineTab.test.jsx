import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ─────────────────────────────────────────────────────────────────────────
// V5.2 — AI Timeline
//
// Covers the transformed TimelineTab (ResultsTabs.jsx): rendering the
// seven AI Timeline sections, filtering by life area, Explorer-selection
// synchronization (highlighting), the empty/loading states, and the full
// "select an event -> Explain with AI" flow end-to-end (mocking only the
// network boundary, aiTimelineApi.js, same isolation
// AiTimelineAIPanel.test.jsx already uses).
// ─────────────────────────────────────────────────────────────────────────

vi.mock("../src/utils/aiTimelineApi.js", () => ({
  fetchAiTimelineExplanation: vi.fn(),
}));

const { fetchAiTimelineExplanation } = await import("../src/utils/aiTimelineApi.js");
const { TimelineTab } = await import("../src/pages/ResultsTabs.jsx");

function makeEvent(overrides = {}) {
  return {
    id: "nextMonth-0-career",
    section: "nextMonth",
    filterCategory: "career",
    category: "Career",
    timePeriod: { startDate: "2026-08-01", endDate: "2026-08-31" },
    prediction: "A favorable period for career growth.",
    confidence: { label: "High", score: 82 },
    activeMahadasha: "Jupiter",
    activeAntardasha: "Venus",
    dominantPlanet: "Jupiter",
    supportingPlanets: ["Sun"],
    supportingHouses: [10],
    supportingYogas: [{ name: "Gaj Kesari Yoga" }],
    supportingDoshas: [],
    suggestedRemedies: ["Chant the Guru mantra on Thursdays."],
    relatedTransit: null,
    ...overrides,
  };
}

const AI_TIMELINE = {
  past: [],
  present: [makeEvent({ id: "present-0-family", section: "present", filterCategory: "family", category: "Family", dominantPlanet: "Moon", supportingYogas: [] })],
  nearFuture: [],
  nextMonth: [
    makeEvent(),
    makeEvent({ id: "nextMonth-0-finance", filterCategory: "finance", category: "Finance", dominantPlanet: "Mercury", supportingHouses: [2], supportingYogas: [] }),
  ],
  next3Months: [],
  next6Months: [],
  nextYear: [],
};

const REPORT = {
  predictions: [{ activeMahadasha: "Jupiter", activeAntardasha: "Venus", dominantPlanet: "Jupiter" }],
  predictionTimeline: { oneYear: [], fiveYear: [], tenYear: [] },
  aiTimeline: AI_TIMELINE,
};

describe("TimelineTab — AI Timeline rendering", () => {
  beforeEach(() => {
    fetchAiTimelineExplanation.mockReset();
  });

  it("renders every non-empty AI Timeline section with its events", () => {
    render(<TimelineTab report={REPORT} chart={{}} />);
    expect(screen.getByText(/Present/i)).toBeInTheDocument();
    expect(screen.getByText(/Next Month/i)).toBeInTheDocument();
    expect(screen.getByText(/favorable period for career growth/i)).toBeInTheDocument();
  });

  it("does not render sections that have no events", () => {
    render(<TimelineTab report={REPORT} chart={{}} />);
    expect(screen.queryByText(/^Past$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Next 3 Months/i)).not.toBeInTheDocument();
  });
});

describe("TimelineTab — AI Timeline filtering", () => {
  beforeEach(() => {
    fetchAiTimelineExplanation.mockReset();
  });

  it("shows only events matching the selected life-area filter", async () => {
    const user = userEvent.setup();
    render(<TimelineTab report={REPORT} chart={{}} />);

    expect(screen.getByText(/favorable period for career growth/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /finance/i }));
    expect(screen.queryByText(/favorable period for career growth/i)).not.toBeInTheDocument();
  });

  it("toggling the same filter back off restores every event", async () => {
    const user = userEvent.setup();
    render(<TimelineTab report={REPORT} chart={{}} />);

    const financeChip = screen.getByRole("button", { name: /finance/i });
    await user.click(financeChip);
    await user.click(financeChip);

    expect(screen.getByText(/favorable period for career growth/i)).toBeInTheDocument();
  });

  it("shows an empty-filter state when no event matches the selected category", async () => {
    const user = userEvent.setup();
    render(<TimelineTab report={REPORT} chart={{}} />);

    await user.click(screen.getByRole("button", { name: /^Love$/i }));
    expect(screen.getByText(/no events for this filter/i)).toBeInTheDocument();
  });
});

describe("TimelineTab — Explorer synchronization", () => {
  it("highlights the event whose dominant/supporting planet matches the Explorer selection", () => {
    const { container } = render(
      <TimelineTab report={REPORT} chart={{}} selectedType="planet" selectedItem={{ id: "Jupiter ♃", label: "Jupiter ♃" }} />
    );
    expect(container.querySelectorAll('[data-highlighted="true"]').length).toBeGreaterThanOrEqual(1);
  });

  it("does not highlight anything for a selection type with no matching timeline field", () => {
    const { container } = render(
      <TimelineTab report={REPORT} chart={{}} selectedType="sign" selectedItem={{ id: "Leo", label: "Leo" }} />
    );
    expect(container.querySelectorAll('[data-highlighted="true"]').length).toBe(0);
  });
});

describe("TimelineTab — AI explanation generation (select an event)", () => {
  beforeEach(() => {
    fetchAiTimelineExplanation.mockReset();
  });

  it("selecting an event reveals its 'Explain with AI' panel, and a second click on the same event deselects it", async () => {
    const user = userEvent.setup();
    render(<TimelineTab report={REPORT} chart={{}} />);

    const eventCard = screen.getByText(/favorable period for career growth/i).closest('[role="button"]');
    expect(screen.queryByText(/AI EXPLANATION/i)).not.toBeInTheDocument();

    await user.click(eventCard);
    expect(screen.getByText(/AI EXPLANATION/i)).toBeInTheDocument();

    await user.click(eventCard);
    expect(screen.queryByText(/AI EXPLANATION/i)).not.toBeInTheDocument();
  });

  it("requesting an explanation for the selected event calls the AI Timeline API and renders the result", async () => {
    fetchAiTimelineExplanation.mockResolvedValue({
      eventId: "nextMonth-0-career",
      section: "nextMonth",
      category: "Career",
      shortAnswer: "Strong growth ahead.",
      detailedExplanation: "Jupiter's dasha strengthens career significations.",
      evidence: [],
      confidence: { label: "High", score: 82 },
      suggestedNextQuestion: null,
    });
    const user = userEvent.setup();
    render(<TimelineTab report={REPORT} chart={{}} />);

    const eventCard = screen.getByText(/favorable period for career growth/i).closest('[role="button"]');
    await user.click(eventCard);
    await user.click(screen.getByRole("button", { name: /^explain/i }));

    expect(await screen.findByText(/strong growth ahead/i)).toBeInTheDocument();
    expect(fetchAiTimelineExplanation).toHaveBeenCalledWith(
      expect.objectContaining({ event: expect.objectContaining({ id: "nextMonth-0-career" }) })
    );
  });

  it("shows an error state (via AiTimelineAIPanel) if the AI explanation request fails", async () => {
    fetchAiTimelineExplanation.mockRejectedValue(new Error("The AI Timeline explanation is unavailable right now."));
    const user = userEvent.setup();
    render(<TimelineTab report={REPORT} chart={{}} />);

    const eventCard = screen.getByText(/favorable period for career growth/i).closest('[role="button"]');
    await user.click(eventCard);
    await user.click(screen.getByRole("button", { name: /^explain/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/unavailable/i);
  });
});

describe("TimelineTab — empty state", () => {
  it("shows the empty state when neither aiTimeline, predictionTimeline, nor a current Dasha are present", () => {
    render(<TimelineTab report={{}} chart={{}} />);
    expect(screen.getByText(/timeline not available yet/i)).toBeInTheDocument();
  });
});

describe("TimelineTab — loading state", () => {
  it("shows a loading indicator when the report itself hasn't arrived yet", () => {
    render(<TimelineTab report={null} chart={{}} />);
    expect(screen.getByRole("status")).toHaveTextContent(/building your ai timeline/i);
  });
});

describe("TimelineTab — backward compatibility (pre-V5.2 reports)", () => {
  it("falls back to legacy oneYear/fiveYear/tenYear rendering when aiTimeline is absent", () => {
    const legacyReport = {
      predictions: [{ activeMahadasha: "Jupiter", activeAntardasha: "Venus", dominantPlanet: "Jupiter" }],
      predictionTimeline: {
        oneYear: [{
          timePeriod: { startDate: "2026-01-01", endDate: "2026-06-01" },
          confidence: { label: "High", score: 82 },
          prediction: "A legacy-era favorable prediction.",
          dominantPlanet: "Jupiter", supportingPlanets: [], supportingHouses: [], supportingYogas: [], supportingDoshas: [],
        }],
        fiveYear: [], tenYear: [],
      },
    };
    render(<TimelineTab report={legacyReport} chart={{}} />);
    expect(screen.getByText(/legacy-era favorable prediction/i)).toBeInTheDocument();
  });
});
