import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ─────────────────────────────────────────────────────────────────────────
// V5.0 Phase 5C — Explorer AI
// Covers ExplorerAIPanel's own state machine: the initial "Explain with
// AI" prompt (nothing fetched yet — no unnecessary requests), the loading
// state, a full structured success render (reusing ChatMessage), the
// error state + retry, and — most importantly — that a second request for
// the *same* Explorer selection is served from the panel's own in-memory
// cache without a second network call, while a *different* selection
// (new cacheKey) always starts a fresh request.
// ─────────────────────────────────────────────────────────────────────────

vi.mock("../src/utils/explorerAiApi.js", () => ({
  fetchExplorerExplanation: vi.fn(),
}));

const { fetchExplorerExplanation } = await import("../src/utils/explorerAiApi.js");
const { default: ExplorerAIPanel } = await import("../src/components/explorer/ExplorerAIPanel.jsx");

const SAMPLE_RESULT = {
  itemType: "planet",
  itemId: "Sun ☀️",
  itemLabel: "Sun ☀️",
  summary: "The Sun is your soul planet.",
  shortAnswer: "The Sun is your soul planet.",
  detailedExplanation: "Placed in House 1, it gives strong leadership qualities.",
  evidence: ["Sun: House 1, Aries"],
  confidence: { label: "High", score: 80 },
  suggestedNextQuestion: "How does the Sun affect my career?",
};

function renderPanel(props = {}) {
  return render(
    <ExplorerAIPanel
      cacheKey="planet-Sun"
      itemType="planet"
      itemId="Sun ☀️"
      itemLabel="Sun ☀️"
      chart={{}}
      report={{}}
      contextFacts={{ position: { house: 1 } }}
      {...props}
    />
  );
}

describe("ExplorerAIPanel", () => {
  beforeEach(() => {
    fetchExplorerExplanation.mockReset();
  });

  it("shows the 'Explain with AI' prompt and does not fetch until tapped (no unnecessary requests)", () => {
    renderPanel();
    expect(screen.getByRole("button", { name: /explain sun/i })).toBeInTheDocument();
    expect(fetchExplorerExplanation).not.toHaveBeenCalled();
  });

  it("shows a loading state while the request is in flight", async () => {
    let resolvePromise;
    fetchExplorerExplanation.mockReturnValue(new Promise((res) => { resolvePromise = res; }));
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: /explain sun/i }));
    expect(screen.getByLabelText(/generating an ai explanation for sun/i)).toBeInTheDocument();

    resolvePromise(SAMPLE_RESULT);
    await waitFor(() => expect(screen.queryByLabelText(/generating an ai explanation/i)).not.toBeInTheDocument());
  });

  it("renders the full structured explanation on success (Summary/Detailed/Evidence/Confidence/Next Question)", async () => {
    fetchExplorerExplanation.mockResolvedValue(SAMPLE_RESULT);
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: /explain sun/i }));
    expect(await screen.findByText(/the sun is your soul planet/i)).toBeInTheDocument();
    expect(screen.getByText(/leadership qualities/i)).toBeInTheDocument();
    expect(screen.getByText(/sun: house 1, aries/i)).toBeInTheDocument();
    expect(screen.getByText(/how does the sun affect my career/i)).toBeInTheDocument();
  });

  it("shows an error state with a retry action when the request fails", async () => {
    fetchExplorerExplanation.mockRejectedValue(new Error("The Explorer AI is unavailable right now."));
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: /explain sun/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/unavailable/i);
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("retries and recovers after a failed request", async () => {
    fetchExplorerExplanation
      .mockRejectedValueOnce(new Error("Temporary failure."))
      .mockResolvedValueOnce(SAMPLE_RESULT);
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: /explain sun/i }));
    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: /try again/i }));

    expect(await screen.findByText(/the sun is your soul planet/i)).toBeInTheDocument();
    expect(fetchExplorerExplanation).toHaveBeenCalledTimes(2);
  });

  it("reuses its own cache for a repeated request on the same selection (cache reuse)", async () => {
    fetchExplorerExplanation.mockResolvedValue(SAMPLE_RESULT);
    const user = userEvent.setup();
    const { rerender } = renderPanel();

    await user.click(screen.getByRole("button", { name: /explain sun/i }));
    await screen.findByText(/the sun is your soul planet/i);
    expect(fetchExplorerExplanation).toHaveBeenCalledTimes(1);

    // Switch away to a different selection, then back to the same one —
    // still the same cacheKey/component instance's cache Map.
    rerender(
      <ExplorerAIPanel cacheKey="planet-Moon" itemType="planet" itemId="Moon" itemLabel="Moon" chart={{}} report={{}} />
    );
    expect(screen.getByRole("button", { name: /explain moon/i })).toBeInTheDocument();

    rerender(
      <ExplorerAIPanel cacheKey="planet-Sun" itemType="planet" itemId="Sun ☀️" itemLabel="Sun ☀️" chart={{}} report={{}} />
    );
    expect(await screen.findByText(/the sun is your soul planet/i)).toBeInTheDocument();
    expect(fetchExplorerExplanation).toHaveBeenCalledTimes(1); // no second network call
  });

  it("starts a fresh, un-fetched state for a genuinely new Explorer selection", () => {
    renderPanel({ cacheKey: "dosha-Mangal", itemType: "dosha", itemId: "Mangal Dosha", itemLabel: "Mangal Dosha" });
    expect(screen.getByRole("button", { name: /explain mangal dosha/i })).toBeInTheDocument();
    expect(screen.queryByText(/the sun is your soul planet/i)).not.toBeInTheDocument();
  });
});
