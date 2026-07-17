import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ─────────────────────────────────────────────────────────────────────────
// V5.2 — AI Timeline
// Covers AiTimelineAIPanel's own state machine, cloned from
// ExplorerAIPanel.test.jsx's established coverage: the initial "Explain
// with AI" prompt (no unnecessary requests), the loading state, a full
// structured success render (reusing ChatMessage), the error state +
// retry, and that a repeated request for the same selected event is
// served from the panel's own in-memory cache.
// ─────────────────────────────────────────────────────────────────────────

vi.mock("../src/utils/aiTimelineApi.js", () => ({
  fetchAiTimelineExplanation: vi.fn(),
}));

const { fetchAiTimelineExplanation } = await import("../src/utils/aiTimelineApi.js");
const { default: AiTimelineAIPanel } = await import("../src/components/timeline/AiTimelineAIPanel.jsx");

const SAMPLE_RESULT = {
  eventId: "nextMonth-0-career",
  section: "nextMonth",
  category: "career",
  summary: "This is a favorable period for career growth.",
  shortAnswer: "This is a favorable period for career growth.",
  detailedExplanation: "Jupiter's Antardasha strengthens the 10th house significations.",
  evidence: ["Jupiter: dominant planet, Gaj Kesari Yoga active"],
  confidence: { label: "High", score: 82 },
  suggestedNextQuestion: "What remedies support this period?",
};

const EVENT = { id: "nextMonth-0-career", section: "nextMonth", category: "career" };

function renderPanel(props = {}) {
  return render(<AiTimelineAIPanel event={EVENT} chart={{}} report={{}} {...props} />);
}

describe("AiTimelineAIPanel", () => {
  beforeEach(() => {
    fetchAiTimelineExplanation.mockReset();
  });

  it("shows the 'Explain with AI' prompt and does not fetch until tapped", () => {
    renderPanel();
    expect(screen.getByRole("button", { name: /^explain/i })).toBeInTheDocument();
    expect(fetchAiTimelineExplanation).not.toHaveBeenCalled();
  });

  it("shows a loading state while the request is in flight", async () => {
    let resolvePromise;
    fetchAiTimelineExplanation.mockReturnValue(new Promise((res) => { resolvePromise = res; }));
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: /^explain/i }));
    expect(screen.getByRole("status")).toBeInTheDocument();

    resolvePromise(SAMPLE_RESULT);
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
  });

  it("renders the full structured explanation on success", async () => {
    fetchAiTimelineExplanation.mockResolvedValue(SAMPLE_RESULT);
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: /^explain/i }));
    expect(await screen.findByText(/favorable period for career growth/i)).toBeInTheDocument();
    expect(screen.getByText(/10th house/i)).toBeInTheDocument();
    expect(screen.getByText(/gaj kesari yoga active/i)).toBeInTheDocument();
    expect(screen.getByText(/what remedies support this period/i)).toBeInTheDocument();
  });

  it("shows an error state with a retry action when the request fails", async () => {
    fetchAiTimelineExplanation.mockRejectedValue(new Error("The AI Timeline explanation is unavailable right now."));
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: /^explain/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/unavailable/i);
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("retries and recovers after a failed request", async () => {
    fetchAiTimelineExplanation
      .mockRejectedValueOnce(new Error("Temporary failure."))
      .mockResolvedValueOnce(SAMPLE_RESULT);
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: /^explain/i }));
    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: /try again/i }));

    expect(await screen.findByText(/favorable period for career growth/i)).toBeInTheDocument();
    expect(fetchAiTimelineExplanation).toHaveBeenCalledTimes(2);
  });

  it("reuses its own cache for a repeated request on the same event (cache reuse)", async () => {
    fetchAiTimelineExplanation.mockResolvedValue(SAMPLE_RESULT);
    const user = userEvent.setup();
    const { rerender } = renderPanel();

    await user.click(screen.getByRole("button", { name: /^explain/i }));
    await screen.findByText(/favorable period for career growth/i);
    expect(fetchAiTimelineExplanation).toHaveBeenCalledTimes(1);

    const OTHER_EVENT = { id: "nextMonth-1-finance", section: "nextMonth", category: "finance" };
    rerender(<AiTimelineAIPanel event={OTHER_EVENT} chart={{}} report={{}} />);
    expect(screen.getByRole("button", { name: /^explain/i })).toBeInTheDocument();

    rerender(<AiTimelineAIPanel event={EVENT} chart={{}} report={{}} />);
    expect(await screen.findByText(/favorable period for career growth/i)).toBeInTheDocument();
    expect(fetchAiTimelineExplanation).toHaveBeenCalledTimes(1); // no second network call
  });

  it("starts a fresh, un-fetched state for a genuinely new event selection", () => {
    renderPanel({ event: { id: "past-0-family", section: "past", category: "family" } });
    expect(screen.getByRole("button", { name: /^explain/i })).toBeInTheDocument();
    expect(screen.queryByText(/favorable period for career growth/i)).not.toBeInTheDocument();
  });
});
