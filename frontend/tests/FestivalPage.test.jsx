import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FestivalPage from "../src/pages/FestivalPage.jsx";
import * as festivalApi from "../src/utils/festivalApi.js";

// ─────────────────────────────────────────────────────────────────────────
// V4.5 Phase 1B (Festival Frontend Integration) — FestivalPage smoke
// tests. Mocks utils/festivalApi.js directly (same lightweight,
// component-level pattern as PanchangPage.test.jsx) rather than going
// through the full App login flow, since FestivalPage is fully
// self-contained and needs no auth/report context to render.
// ─────────────────────────────────────────────────────────────────────────

const MOCK_TODAY = [
  { key: "ekadashi", name: "Ekadashi", date: "2026-07-13", endDate: "2026-07-13", type: "Vrat", importance: "High", description: "A day of fasting and devotion." },
];

const MOCK_UPCOMING = [
  { key: "ekadashi", name: "Ekadashi", date: "2026-07-13", type: "Vrat", importance: "High", description: "A day of fasting and devotion." },
  { key: "purnima", name: "Purnima", date: "2026-07-20", type: "Festival", importance: "Medium", description: "The full moon day." },
];

const MOCK_YEAR = [
  { key: "ekadashi", name: "Ekadashi", date: "2026-07-13", type: "Vrat", importance: "High", description: "A day of fasting and devotion." },
  { key: "diwali", name: "Diwali", date: "2026-11-08", type: "Festival", importance: "High", description: "The festival of lights." },
];

const MOCK_DETAIL = {
  key: "ekadashi", name: "Ekadashi", date: "2026-07-13", endDate: "2026-07-13", type: "Vrat", importance: "High",
  description: "A day of fasting and devotion.", historicalBackground: "Referenced across the Puranas.",
  religiousSignificance: "A day for devotion and reflection.",
  recommendedActivities: ["Chanting Vishnu Sahasranama"], rituals: ["Waking before sunrise"],
  fastingInfo: { isFastObserved: true, fastType: "Full or partial fast", guidelines: ["Many observe a full fast"] },
  region: ["Pan-India"],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("FestivalPage", () => {
  it("loads and shows Today's Festival by default", async () => {
    vi.spyOn(festivalApi, "getTodaysFestivals").mockResolvedValue(MOCK_TODAY);
    vi.spyOn(festivalApi, "getUpcomingFestivals").mockResolvedValue(MOCK_UPCOMING);
    vi.spyOn(festivalApi, "getFestivalsForYear").mockResolvedValue(MOCK_YEAR);

    render(<FestivalPage onBack={() => {}} />);

    expect((await screen.findAllByText(/Ekadashi/i)).length).toBeGreaterThan(0);
    expect(screen.getByText(/Next Up/i)).toBeInTheDocument();
  });

  it("shows an empty state when there's no festival today", async () => {
    vi.spyOn(festivalApi, "getTodaysFestivals").mockResolvedValue([]);
    vi.spyOn(festivalApi, "getUpcomingFestivals").mockResolvedValue(MOCK_UPCOMING);
    vi.spyOn(festivalApi, "getFestivalsForYear").mockResolvedValue(MOCK_YEAR);

    render(<FestivalPage onBack={() => {}} />);
    expect(await screen.findByText(/No festival today/i)).toBeInTheDocument();
  });

  it("switches to the Upcoming tab and shows a festival timeline", async () => {
    vi.spyOn(festivalApi, "getTodaysFestivals").mockResolvedValue(MOCK_TODAY);
    vi.spyOn(festivalApi, "getUpcomingFestivals").mockResolvedValue(MOCK_UPCOMING);
    vi.spyOn(festivalApi, "getFestivalsForYear").mockResolvedValue(MOCK_YEAR);
    const user = userEvent.setup();

    render(<FestivalPage onBack={() => {}} />);
    await screen.findByText(/Next Up/i);

    await user.click(screen.getByRole("button", { name: /Upcoming/i }));
    expect((await screen.findAllByText(/Purnima/i)).length).toBeGreaterThan(0);
  });

  it("switches to Browse All, filters by search, and opens a festival's detail", async () => {
    vi.spyOn(festivalApi, "getTodaysFestivals").mockResolvedValue(MOCK_TODAY);
    vi.spyOn(festivalApi, "getUpcomingFestivals").mockResolvedValue(MOCK_UPCOMING);
    vi.spyOn(festivalApi, "getFestivalsForYear").mockResolvedValue(MOCK_YEAR);
    vi.spyOn(festivalApi, "explainFestival").mockResolvedValue("A gentle, reflective day.");
    const user = userEvent.setup();

    render(<FestivalPage onBack={() => {}} />);
    await screen.findByText(/Next Up/i);

    await user.click(screen.getByRole("button", { name: /Browse All/i }));
    expect(await screen.findByText(/Diwali/i)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/Search festivals/i), "Diwali");
    expect(await screen.findByText(/Diwali/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Ekadashi$/i)).not.toBeInTheDocument();

    await user.click(screen.getByText(/Diwali/i));
    expect(await screen.findByRole("heading", { name: /Diwali/i })).toBeInTheDocument();
  });

  it("deep-links straight to a festival's detail view when opened with initialFestivalKey", async () => {
    vi.spyOn(festivalApi, "getTodaysFestivals").mockResolvedValue([]);
    vi.spyOn(festivalApi, "getUpcomingFestivals").mockResolvedValue([]);
    vi.spyOn(festivalApi, "getFestivalsForYear").mockResolvedValue([]);
    vi.spyOn(festivalApi, "getFestivalByKey").mockResolvedValue({ definition: {}, occurrences: [MOCK_DETAIL] });

    render(<FestivalPage onBack={() => {}} initialFestivalKey="ekadashi" initialDate="2026-07-13" />);

    expect(await screen.findByRole("heading", { name: /Ekadashi/i })).toBeInTheDocument();
    // Significance is defaultOpen; Historical Background is collapsed by
    // default (see ExpandableSection), so assert on the visible section.
    expect(screen.getByText(/A day for devotion and reflection/i)).toBeInTheDocument();
  });

  it("calls onBack when the back button is clicked from the top level", async () => {
    vi.spyOn(festivalApi, "getTodaysFestivals").mockResolvedValue(MOCK_TODAY);
    vi.spyOn(festivalApi, "getUpcomingFestivals").mockResolvedValue(MOCK_UPCOMING);
    vi.spyOn(festivalApi, "getFestivalsForYear").mockResolvedValue(MOCK_YEAR);
    const onBack = vi.fn();
    const user = userEvent.setup();

    render(<FestivalPage onBack={onBack} />);
    await screen.findByText(/Next Up/i);
    await user.click(screen.getByRole("button", { name: /Back/i }));
    expect(onBack).toHaveBeenCalled();
  });

  it("shows a friendly error state if today's festival fetch fails", async () => {
    vi.spyOn(festivalApi, "getTodaysFestivals").mockRejectedValue(new Error("Could not reach the backend."));
    vi.spyOn(festivalApi, "getUpcomingFestivals").mockResolvedValue([]);
    vi.spyOn(festivalApi, "getFestivalsForYear").mockResolvedValue([]);

    render(<FestivalPage onBack={() => {}} />);
    expect(await screen.findByText(/Could not reach the backend/i)).toBeInTheDocument();
  });
});
