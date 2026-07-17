import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AILifeCoachPage from "../src/pages/AILifeCoachPage.jsx";
import * as lifeCoachApi from "../src/utils/lifeCoachApi.js";

// ─────────────────────────────────────────────────────────────────────────
// V4.3 (AI Life Coach) — AILifeCoachPage smoke tests. Mocks
// utils/lifeCoachApi.js directly (same lightweight, component-level
// pattern as PanchangPage.test.jsx) rather than going through the full
// App/auth flow, since this page only needs userData/chart/report props.
// ─────────────────────────────────────────────────────────────────────────

const MOCK_CHART = {
  userData: { name: "Asha Rao", dob: "1990-06-15", tob: "08:30", pob: "Mumbai, India" },
  planetary: { "Sun ☀️": { sign: "Gemini", house: 3 } },
  numerology: { mulank: 6, bhagyank: 3 },
  lagna: "Leo", moonSign: "Cancer", sunSign: "Gemini",
  nakshatra: { name: "Punarvasu", pada: 3 },
};

const MOCK_GUIDANCE_RESPONSE = {
  date: "2026-07-12",
  generatedAt: "2026-07-12T09:00:00.000Z",
  confidence: {
    overall: { score: 82, label: "High" },
    career: { score: 88, label: "Very High" },
    relationship: { score: 45, label: "Moderate" },
    finance: { score: 55, label: "Moderate" },
    health: { score: 30, label: "Low" },
  },
  luckyElements: {
    luckyColor: "White / Silver",
    luckyNumber: 6,
    luckyDirection: "North-West",
    favorableTimeWindow: "11:48 – 12:36 (Abhijit Muhurat)",
  },
  guidance: {
    dailyEnergyScore: 78,
    todaysFocus: "Focus on finishing what you already started.",
    opportunities: ["A good day to have that overdue conversation."],
    challenges: ["Avoid overcommitting your afternoon."],
    recommendedActions: ["Take fifteen quiet minutes before your first meeting."],
    thingsToAvoid: ["Avoid signing anything during Rahu Kaal."],
    spiritualGuidance: "A short morning prayer can steady your day.",
    motivationMessage: "Steady effort today builds tomorrow's confidence.",
    explainWhy: {
      todaysFocus: "Mercury is strong in your birth chart and today favors conversations.",
      career: "Jupiter supports your career house this Antardasha.",
      relationship: "Venus is well-placed for partnership matters today.",
      finance: "Today's Panchang favors cautious financial planning.",
      health: "Saturn's current placement calls for extra rest.",
    },
    dailyAffirmation: "I trust my steady preparation to carry me through today.",
    spiritualPractice: {
      activity: "Meditation",
      significance: "A few quiet minutes align well with today's Moon-ruled energy.",
    },
    weeklyOutlook: {
      weeklyEnergyScore: 64,
      bestDay: { weekday: "Thursday", date: "2026-07-16", score: 82 },
      cautionDay: { weekday: "Tuesday", date: "2026-07-14", score: 40 },
      weeklyTheme: "A week of steady, quiet progress.",
      weeklyOpportunities: ["Good week to finish a lingering task."],
      weeklyChallenges: ["Watch for overcommitting mid-week."],
      weeklyFocus: "Prioritize consistency over intensity this week.",
    },
    monthlyOutlook: {
      monthlyEnergyScore: 58,
      monthlyTheme: "A steady month of laying groundwork.",
      majorOpportunities: ["A good month to deepen one key relationship."],
      majorChallenges: ["Avoid rushing any major financial decision."],
      personalGrowthGoal: "Build one small daily habit that lasts all month.",
      careerFocus: "Focus on consistency over a single big win.",
      relationshipFocus: "Prioritize quality time over quantity this month.",
    },
    career: {
      progress: "Your current role is showing steady, quiet progress.",
      skillDevelopmentAdvice: "Consider revisiting a skill you've been putting off.",
      promotionGuidance: "Patience serves you better than pushing right now.",
      businessSuggestions: "Research before you commit to anything new.",
      bestTimeForDecisions: "Favorable during your current Antardasha.",
    },
    relationship: {
      guidance: "Direct, gentle communication goes further today.",
      marriageAdvice: "No major decisions needed — let things settle.",
      familyHarmonyTips: "A small gesture of appreciation helps today.",
      communicationSuggestions: "Listen fully before responding.",
      emotionalWellbeing: "Give yourself permission to rest this evening.",
    },
    finance: {
      outlook: "Generally stable with room for cautious planning.",
      spendingSuggestions: "Track discretionary spending this week.",
      savingAdvice: "Even a small consistent habit compounds well.",
      investmentAwareness: "Research thoroughly before committing anywhere new.",
      businessOpportunities: "Worth exploring, not yet worth committing to.",
    },
    health: {
      energyTrends: "Energy is steady with a dip mid-afternoon.",
      stressAwareness: "Watch for tension building around midday.",
      meditationSuggestions: "A short breathing practice can help you reset.",
      yogaRecommendations: "Gentle stretching suits today's energy.",
      spiritualPractices: "A few minutes of quiet gratitude practice.",
      lifestyleSuggestions: "Prioritize a consistent sleep schedule.",
    },
    personalGrowth: {
      dailyGoals: ["Write down three priorities this morning."],
      weeklyGoals: ["Reconnect with one old friend or mentor."],
      monthlyFocus: "Building a steadier daily routine.",
      habitSuggestions: ["Start a five-minute journaling habit."],
      learningRecommendations: ["Read one article on a topic you're curious about."],
    },
  },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AILifeCoachPage", () => {
  it("shows an EmptyState with no chart, and never calls the API", () => {
    const getSpy = vi.spyOn(lifeCoachApi, "getDailyGuidance");
    render(<AILifeCoachPage userData={null} chart={null} report={null} onBack={() => {}} />);

    expect(screen.getByText(/No reading available yet/i)).toBeInTheDocument();
    expect(getSpy).not.toHaveBeenCalled();
  });

  it("loads and shows the Daily Energy Score, Today's Focus, and Motivation Message by default", async () => {
    vi.spyOn(lifeCoachApi, "getDailyGuidance").mockResolvedValue(MOCK_GUIDANCE_RESPONSE);

    render(<AILifeCoachPage userData={MOCK_CHART.userData} chart={MOCK_CHART} report={{}} onBack={() => {}} />);

    expect(await screen.findByText(/Focus on finishing what you already started/i)).toBeInTheDocument();
    expect(screen.getByText(/Steady effort today builds tomorrow's confidence/i)).toBeInTheDocument();
    expect(screen.getByText(/A good day to have that overdue conversation/i)).toBeInTheDocument();
  });

  it("switches to the Career section and shows career guidance fields", async () => {
    vi.spyOn(lifeCoachApi, "getDailyGuidance").mockResolvedValue(MOCK_GUIDANCE_RESPONSE);
    const user = userEvent.setup();

    render(<AILifeCoachPage userData={MOCK_CHART.userData} chart={MOCK_CHART} report={{}} onBack={() => {}} />);
    await screen.findByText(/Focus on finishing what you already started/i);

    await user.click(screen.getByRole("button", { name: /Career/i }));

    await waitFor(() => {
      expect(screen.getByText(/Your current role is showing steady, quiet progress/i)).toBeInTheDocument();
    });
  });

  it("calls onBack when the back button is clicked", async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(<AILifeCoachPage userData={null} chart={null} report={null} onBack={onBack} />);

    await user.click(screen.getByRole("button", { name: /Back/i }));
    expect(onBack).toHaveBeenCalled();
  });

  // ── V4.3 Enhancement Pass ─────────────────────────────────────────────
  it("shows the overall confidence badge, Daily Affirmation, and Spiritual Practice on the Daily section", async () => {
    vi.spyOn(lifeCoachApi, "getDailyGuidance").mockResolvedValue(MOCK_GUIDANCE_RESPONSE);

    render(<AILifeCoachPage userData={MOCK_CHART.userData} chart={MOCK_CHART} report={{}} onBack={() => {}} />);
    await screen.findByText(/Focus on finishing what you already started/i);

    expect(screen.getByText(/Confidence: High \(82\/100\)/i)).toBeInTheDocument();
    expect(screen.getByText(/I trust my steady preparation to carry me through today/i)).toBeInTheDocument();
    expect(screen.getByText(/A few quiet minutes align well with today's Moon-ruled energy/i)).toBeInTheDocument();
    expect(screen.getByText(/Mercury is strong in your birth chart/i)).toBeInTheDocument();
  });

  it("shows Lucky Elements on the Daily section", async () => {
    vi.spyOn(lifeCoachApi, "getDailyGuidance").mockResolvedValue(MOCK_GUIDANCE_RESPONSE);

    render(<AILifeCoachPage userData={MOCK_CHART.userData} chart={MOCK_CHART} report={{}} onBack={() => {}} />);
    await screen.findByText(/Focus on finishing what you already started/i);

    expect(screen.getByText(/Lucky Elements Today/i)).toBeInTheDocument();
    expect(screen.getByText("White / Silver")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
  });

  it("switches to the Weekly section and shows the backend-computed Best/Caution Day plus the AI theme", async () => {
    vi.spyOn(lifeCoachApi, "getDailyGuidance").mockResolvedValue(MOCK_GUIDANCE_RESPONSE);
    const user = userEvent.setup();

    render(<AILifeCoachPage userData={MOCK_CHART.userData} chart={MOCK_CHART} report={{}} onBack={() => {}} />);
    await screen.findByText(/Focus on finishing what you already started/i);

    await user.click(screen.getByRole("button", { name: /Weekly/i }));

    await waitFor(() => {
      expect(screen.getByText(/A week of steady, quiet progress/i)).toBeInTheDocument();
      expect(screen.getByText(/Best Day: Thursday/i)).toBeInTheDocument();
      expect(screen.getByText(/Caution Day: Tuesday/i)).toBeInTheDocument();
    });
  });

  it("switches to the Monthly section and shows the AI monthly narrative", async () => {
    vi.spyOn(lifeCoachApi, "getDailyGuidance").mockResolvedValue(MOCK_GUIDANCE_RESPONSE);
    const user = userEvent.setup();

    render(<AILifeCoachPage userData={MOCK_CHART.userData} chart={MOCK_CHART} report={{}} onBack={() => {}} />);
    await screen.findByText(/Focus on finishing what you already started/i);

    await user.click(screen.getByRole("button", { name: /Monthly/i }));

    await waitFor(() => {
      expect(screen.getByText(/A steady month of laying groundwork/i)).toBeInTheDocument();
      expect(screen.getByText(/Build one small daily habit that lasts all month/i)).toBeInTheDocument();
    });
  });

  it("shows a Refresh Guidance button once loaded, and re-fetches guidance when clicked", async () => {
    const getSpy = vi.spyOn(lifeCoachApi, "getDailyGuidance").mockResolvedValue(MOCK_GUIDANCE_RESPONSE);
    const user = userEvent.setup();

    render(<AILifeCoachPage userData={MOCK_CHART.userData} chart={MOCK_CHART} report={{}} onBack={() => {}} />);
    await screen.findByText(/Focus on finishing what you already started/i);

    expect(getSpy).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: /Refresh Guidance/i }));

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledTimes(2);
    });
  });
});
