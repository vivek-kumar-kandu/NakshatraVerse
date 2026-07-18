import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../src/utils/explanationApi.js", () => ({
  fetchReportSummary: vi.fn(),
  fetchConfidenceExplanation: vi.fn(),
  fetchPredictionEvidence: vi.fn(),
  fetchRemedyExplanation: vi.fn(),
  fetchCrossLinks: vi.fn(),
}));

const explanationApi = await import("../src/utils/explanationApi.js");
const { default: ReportSummaryCard } = await import("../src/components/explanation/ReportSummaryCard.jsx");
const { default: ConfidenceExplanation } = await import("../src/components/explanation/ConfidenceExplanation.jsx");
const { default: RemedyExplanationCard } = await import("../src/components/explanation/RemedyExplanationCard.jsx");
const { clearSharedExplanationCache } = await import("../src/hooks/useExplanation.js");

const SAMPLE_CHART = { userData: { name: "Test User", dob: "1990-01-01", tob: "10:00" } };

describe("ReportSummaryCard", () => {
  beforeEach(() => {
    explanationApi.fetchReportSummary.mockReset();
    clearSharedExplanationCache();
  });

  it("shows the summarize prompt and does not fetch until tapped", () => {
    render(<ReportSummaryCard chart={SAMPLE_CHART} report={{}} />);
    expect(screen.getByRole("button", { name: /summarize with ai/i })).toBeInTheDocument();
    expect(explanationApi.fetchReportSummary).not.toHaveBeenCalled();
  });

  it("renders the summary through ChatMessage on success", async () => {
    explanationApi.fetchReportSummary.mockResolvedValue({
      summary: "This is a pivotal period.",
      shortAnswer: "This is a pivotal period.",
      detailedExplanation: "A longer synthesis.",
      evidence: ["Current Mahadasha: Saturn"],
      confidence: { label: "High", score: 78 },
      suggestedNextQuestion: "What about my career?",
    });
    const user = userEvent.setup();
    render(<ReportSummaryCard chart={SAMPLE_CHART} report={{}} />);

    await user.click(screen.getByRole("button", { name: /summarize with ai/i }));
    expect(await screen.findByText(/this is a pivotal period/i)).toBeInTheDocument();
    expect(screen.getByText(/what about my career/i)).toBeInTheDocument();
  });

  it("shows an error state when the request fails", async () => {
    explanationApi.fetchReportSummary.mockRejectedValue(new Error("The AI Report Summary is unavailable right now."));
    const user = userEvent.setup();
    render(<ReportSummaryCard chart={SAMPLE_CHART} report={{}} />);

    await user.click(screen.getByRole("button", { name: /summarize with ai/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/unavailable/i);
  });

  it("renders nothing when no chart is available", () => {
    const { container } = render(<ReportSummaryCard chart={null} report={{}} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("ConfidenceExplanation", () => {
  beforeEach(() => {
    explanationApi.fetchConfidenceExplanation.mockReset();
    clearSharedExplanationCache();
  });

  it("shows deterministic evidence even when there is no AI narrative", async () => {
    explanationApi.fetchConfidenceExplanation.mockResolvedValue({
      category: "Career",
      confidence: { label: "High", score: 78 },
      evidence: ["Confidence: High [78/100]", "Active Mahadasha: Saturn"],
      narrative: null,
      narrativeError: "AI narrative unavailable.",
    });
    const user = userEvent.setup();
    render(<ConfidenceExplanation chart={SAMPLE_CHART} report={{}} category="Career" />);

    await user.click(screen.getByRole("button", { name: /why this confidence/i }));
    expect(await screen.findByText(/active mahadasha: saturn/i)).toBeInTheDocument();
    expect(screen.getByText(/ai narrative unavailable/i)).toBeInTheDocument();
  });

  it("renders nothing without a category", () => {
    const { container } = render(<ConfidenceExplanation chart={SAMPLE_CHART} report={{}} category={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("RemedyExplanationCard", () => {
  beforeEach(() => {
    explanationApi.fetchRemedyExplanation.mockReset();
    clearSharedExplanationCache();
  });

  it("shows a not-found message without inventing a remedy", async () => {
    explanationApi.fetchRemedyExplanation.mockResolvedValue({ type: "Nonexistent", found: false, detail: null, narrative: null });
    const user = userEvent.setup();
    render(<RemedyExplanationCard chart={SAMPLE_CHART} report={{}} remedyType="Nonexistent" />);

    await user.click(screen.getByRole("button", { name: /why this remedy/i }));
    expect(await screen.findByText(/isn't part of this chart/i)).toBeInTheDocument();
  });

  it("renders the narrative for an existing remedy", async () => {
    explanationApi.fetchRemedyExplanation.mockResolvedValue({
      type: "Gemstone", found: true, detail: "Wear a red coral.", narrative: "It addresses the Mangal Dosha.",
    });
    const user = userEvent.setup();
    render(<RemedyExplanationCard chart={SAMPLE_CHART} report={{}} remedyType="Gemstone" />);

    await user.click(screen.getByRole("button", { name: /why this remedy/i }));
    expect(await screen.findByText(/addresses the mangal dosha/i)).toBeInTheDocument();
  });
});
