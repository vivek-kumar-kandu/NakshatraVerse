import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PersonalizedInsightsWidget from "../src/components/common/dashboard/PersonalizedInsightsWidget.jsx";

describe("PersonalizedInsightsWidget", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("loads backend-computed cards and requests another period without local astrology calculations", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ summary: { body: "Career is in focus." }, insightCards: [{ id: "career", title: "Career focus", body: "Stay steady.", confidence: { label: "High", score: 80 } }], whatsChanged: { available: true, message: "Confidence changed." } }) });
    vi.stubGlobal("fetch", fetch);
    render(<PersonalizedInsightsWidget reportId="report-1" />);
    expect(await screen.findByText("Career focus")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "weekly" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(screen.getByText(/What’s changed/)).toBeInTheDocument();
  });
});
