import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PanchangPage from "../src/pages/PanchangPage.jsx";
import * as panchangApi from "../src/utils/panchangApi.js";

// ─────────────────────────────────────────────────────────────────────────
// V4.1 Phase 2 (Daily Panchang & Muhurat Finder) — PanchangPage smoke
// tests. Mocks utils/panchangApi.js directly (same lightweight,
// component-level pattern as ZodiacWheel.test.jsx) rather than going
// through the full App login flow, since PanchangPage is fully
// self-contained and needs no auth/report context to render.
// ─────────────────────────────────────────────────────────────────────────

const MOCK_PANCHANG = {
  date: "2026-07-11", weekday: "Saturday",
  tithi: { name: "Shukla Panchami", paksha: "Shukla Paksha", numberInPaksha: 5, percentComplete: 40 },
  paksha: "Shukla Paksha",
  nakshatra: { name: "Rohini", pada: 2 },
  yoga: { name: "Siddhi", isInauspicious: false },
  karana: { name: "Balava", isInauspicious: false },
  sunrise: "06:12 AM", sunset: "07:02 PM", moonrise: "10:40 AM", moonset: "11:55 PM",
  rahuKaal: { start: "09:00 AM", end: "10:30 AM" },
  gulikaKaal: { start: "05:30 AM", end: "07:00 AM" },
  yamaganda: { start: "01:30 PM", end: "03:00 PM" },
  abhijitMuhurat: { start: "11:58 AM", end: "12:46 PM" },
  brahmaMuhurat: { start: "04:36 AM", end: "05:24 AM" },
  auspiciousnessScore: 82, auspiciousnessLabel: "Highly Auspicious",
  bestTimeToday: "11:58 AM – 12:46 PM (Abhijit Muhurat)",
  thingsToAvoid: ["No major cautions today — proceed with your usual due diligence."],
  recommendedActivities: ["Shukla Panchami favors fresh starts, ceremonies, and important decisions."],
};

const MOCK_MUHURAT = {
  activity: "marriage", activityLabel: "Marriage",
  searchWindow: { startDate: "2026-08-01", rangeDays: 30, endDate: "2026-08-30" },
  bestDate: "2026-08-14", bestDateWeekday: "Friday",
  bestTimeWindow: { start: "11:58 AM", end: "12:46 PM" },
  auspiciousPeriod: { window: { start: "11:58 AM", end: "12:46 PM" }, tithi: "Shukla Panchami", nakshatra: "Rohini", note: "" },
  cautionPeriod: {
    rahuKaal: { start: "09:00 AM", end: "10:30 AM" },
    yamaganda: { start: "01:30 PM", end: "03:00 PM" },
    gulikaKaal: { start: "05:30 AM", end: "07:00 AM" },
    note: "",
  },
  confidenceLevel: "High", score: 88, topAlternatives: [{ date: "2026-08-20", score: 80 }],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("PanchangPage", () => {
  it("loads and shows Today's Summary by default", async () => {
    vi.spyOn(panchangApi, "getDailyPanchang").mockResolvedValue(MOCK_PANCHANG);
    vi.spyOn(panchangApi, "getMuhuratActivities").mockResolvedValue(["marriage", "travel"]);

    render(<PanchangPage onBack={() => {}} />);

    expect(await screen.findByText(/Highly Auspicious/i)).toBeInTheDocument();
    expect(screen.getByText(/Best Time Today/i)).toBeInTheDocument();
  });

  it("switches to the Daily Panchang tab and shows the five Panchang limbs", async () => {
    vi.spyOn(panchangApi, "getDailyPanchang").mockResolvedValue(MOCK_PANCHANG);
    vi.spyOn(panchangApi, "getMuhuratActivities").mockResolvedValue(["marriage"]);
    const user = userEvent.setup();

    render(<PanchangPage onBack={() => {}} />);
    await screen.findByText(/Highly Auspicious/i);

    await user.click(screen.getByRole("button", { name: /Daily Panchang/i }));
    expect((await screen.findAllByText(/Rohini/)).length).toBeGreaterThan(0);
    expect(screen.getByText(/Rahu Kaal/i)).toBeInTheDocument();
    expect(screen.getByText(/Abhijit Muhurat/i)).toBeInTheDocument();
  });

  it("finds and displays a Muhurat recommendation on the Muhurat Finder tab", async () => {
    vi.spyOn(panchangApi, "getDailyPanchang").mockResolvedValue(MOCK_PANCHANG);
    vi.spyOn(panchangApi, "getMuhuratActivities").mockResolvedValue(["marriage", "travel"]);
    vi.spyOn(panchangApi, "findMuhurat").mockResolvedValue(MOCK_MUHURAT);
    const user = userEvent.setup();

    render(<PanchangPage onBack={() => {}} />);
    await screen.findByText(/Highly Auspicious/i);

    await user.click(screen.getByRole("button", { name: /Muhurat Finder/i }));
    await screen.findByRole("button", { name: /Marriage/i });
    await user.click(screen.getByRole("button", { name: /Find Best Muhurat/i }));

    expect(await screen.findByText(/2026-08-14/)).toBeInTheDocument();
    expect(screen.getByText(/High Confidence/i)).toBeInTheDocument();
  });

  it("calls onBack when the back button is clicked", async () => {
    vi.spyOn(panchangApi, "getDailyPanchang").mockResolvedValue(MOCK_PANCHANG);
    vi.spyOn(panchangApi, "getMuhuratActivities").mockResolvedValue(["marriage"]);
    const onBack = vi.fn();
    const user = userEvent.setup();

    render(<PanchangPage onBack={onBack} />);
    await screen.findByText(/Highly Auspicious/i);
    await user.click(screen.getByRole("button", { name: /Back/i }));
    expect(onBack).toHaveBeenCalled();
  });

  it("shows a friendly error state if the daily Panchang fetch fails", async () => {
    vi.spyOn(panchangApi, "getDailyPanchang").mockRejectedValue(new Error("Could not reach the backend."));
    vi.spyOn(panchangApi, "getMuhuratActivities").mockResolvedValue(["marriage"]);

    render(<PanchangPage onBack={() => {}} />);
    expect(await screen.findByText(/Could not reach the backend/i)).toBeInTheDocument();
  });
});
