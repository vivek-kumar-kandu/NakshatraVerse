import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FamilyProfilesPage from "../src/pages/FamilyProfilesPage.jsx";
import RelationshipHubPage from "../src/pages/RelationshipHubPage.jsx";
import * as familyProfilesApi from "../src/utils/familyProfilesApi.js";
import * as relationshipHubApi from "../src/utils/relationshipHubApi.js";
import { readPreferences } from "../src/utils/settingsStorage.js";

// ─────────────────────────────────────────────────────────────────────────
// V4.2 (Family Profiles & Relationship Hub) smoke tests. Mocks
// utils/familyProfilesApi.js and utils/relationshipHubApi.js directly (same
// lightweight, component-level pattern as PanchangPage.test.jsx/
// ZodiacWheel.test.jsx) since both pages are fully self-contained and need
// no auth/report context to render. Also covers the "Active Profile"
// client-side persistence added alongside this pass (see
// utils/settingsStorage.js's `activeProfileId`).
// ─────────────────────────────────────────────────────────────────────────

const FATHER = {
  id: "profile-father", name: "Ramesh Sharma", relationship: "father",
  relationshipLabel: "Father", gender: "male", dob: "1965-04-12", tob: "06:30",
  pob: "Jaipur, India", archived: false, lastOpenedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
};
const MOTHER = {
  id: "profile-mother", name: "Sunita Sharma", relationship: "mother",
  relationshipLabel: "Mother", gender: "female", dob: "1968-09-02", tob: "11:15",
  pob: "Jaipur, India", archived: false, lastOpenedAt: "2026-07-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z",
};

const MOCK_COMPARISON = {
  kundliMatching: {
    totalScore: 28, maxScore: 36, percentage: 78,
    compatibility: { label: "Very Good", color: "#7effb2" },
    ashtakoota: { varna: { name: "Varna", score: 1, max: 1 } },
    manglik: { personA: { isManglik: false }, personB: { isManglik: false } },
  },
  birthChartComparison: {
    chartA: { lagna: "Leo", moonSign: "Taurus", sunSign: "Aries", nakshatra: { name: "Rohini" }, yogas: [], doshas: [] },
    chartB: { lagna: "Libra", moonSign: "Cancer", sunSign: "Virgo", nakshatra: { name: "Pushya" }, yogas: [], doshas: [] },
  },
  planetStrengthComparison: { personA: {}, personB: {} },
  doshaComparison: {},
  nakshatraComparison: { profileA: {}, profileB: {}, sameNakshatra: false },
  predictionComparison: { personA: [], personB: [] },
};

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("FamilyProfilesPage", () => {
  it("shows a skeleton while loading, then the profile list", async () => {
    vi.spyOn(familyProfilesApi, "listProfiles").mockResolvedValue([FATHER, MOTHER]);
    vi.spyOn(familyProfilesApi, "getRecentlyOpened").mockResolvedValue([]);

    render(<FamilyProfilesPage onNavigate={() => {}} onGenerateReport={() => {}} onOpenRelationshipHub={() => {}} />);

    expect(await screen.findByText("Ramesh Sharma")).toBeInTheDocument();
    expect(screen.getByText("Sunita Sharma")).toBeInTheDocument();
  });

  it("shows the empty state with an Add Profile action when there are no profiles", async () => {
    vi.spyOn(familyProfilesApi, "listProfiles").mockResolvedValue([]);
    vi.spyOn(familyProfilesApi, "getRecentlyOpened").mockResolvedValue([]);

    render(<FamilyProfilesPage onNavigate={() => {}} onGenerateReport={() => {}} onOpenRelationshipHub={() => {}} />);

    expect(await screen.findByText(/No profiles yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Add your first family profile/i)).toBeInTheDocument();
  });

  it("shows a friendly error state if loading profiles fails", async () => {
    vi.spyOn(familyProfilesApi, "listProfiles").mockRejectedValue(new Error("Could not reach the backend."));
    vi.spyOn(familyProfilesApi, "getRecentlyOpened").mockResolvedValue([]);

    render(<FamilyProfilesPage onNavigate={() => {}} onGenerateReport={() => {}} onOpenRelationshipHub={() => {}} />);

    expect(await screen.findByText(/Could not reach the backend/i)).toBeInTheDocument();
  });

  it("shows a Recently Opened rail when recently opened profiles exist", async () => {
    vi.spyOn(familyProfilesApi, "listProfiles").mockResolvedValue([FATHER, MOTHER]);
    vi.spyOn(familyProfilesApi, "getRecentlyOpened").mockResolvedValue([MOTHER]);

    render(<FamilyProfilesPage onNavigate={() => {}} onGenerateReport={() => {}} onOpenRelationshipHub={() => {}} />);

    expect(await screen.findByText(/Recently Opened/i)).toBeInTheDocument();
  });

  it("opening a profile touches it, hands its birth data to onGenerateReport, and persists it as the active profile", async () => {
    vi.spyOn(familyProfilesApi, "listProfiles").mockResolvedValue([FATHER]);
    vi.spyOn(familyProfilesApi, "getRecentlyOpened").mockResolvedValue([]);
    const touchSpy = vi.spyOn(familyProfilesApi, "touchProfile").mockResolvedValue(FATHER);
    const onGenerateReport = vi.fn();
    const user = userEvent.setup();

    render(<FamilyProfilesPage onNavigate={() => {}} onGenerateReport={onGenerateReport} onOpenRelationshipHub={() => {}} />);
    await screen.findByText("Ramesh Sharma");

    await user.click(screen.getByRole("button", { name: /Open/i }));

    expect(touchSpy).toHaveBeenCalledWith("profile-father");
    expect(onGenerateReport).toHaveBeenCalledWith({ name: "Ramesh Sharma", dob: "1965-04-12", tob: "06:30", pob: "Jaipur, India" });
    expect(readPreferences().activeProfileId).toBe("profile-father");
  });

  it("clicking Compare on a profile card persists it as active and opens the Relationship Hub preset to that profile", async () => {
    vi.spyOn(familyProfilesApi, "listProfiles").mockResolvedValue([FATHER]);
    vi.spyOn(familyProfilesApi, "getRecentlyOpened").mockResolvedValue([]);
    const onOpenRelationshipHub = vi.fn();
    const user = userEvent.setup();

    render(<FamilyProfilesPage onNavigate={() => {}} onGenerateReport={() => {}} onOpenRelationshipHub={onOpenRelationshipHub} />);
    await screen.findByText("Ramesh Sharma");

    await user.click(screen.getByRole("button", { name: /Compare/i }));

    expect(onOpenRelationshipHub).toHaveBeenCalledWith("profile-father");
    expect(readPreferences().activeProfileId).toBe("profile-father");
  });

  it("the header Relationship Hub button falls back to the last-active profile when no card was clicked", async () => {
    window.localStorage.setItem("nv_preferences", JSON.stringify({ activeProfileId: "profile-mother" }));
    vi.spyOn(familyProfilesApi, "listProfiles").mockResolvedValue([FATHER, MOTHER]);
    vi.spyOn(familyProfilesApi, "getRecentlyOpened").mockResolvedValue([]);
    const onOpenRelationshipHub = vi.fn();
    const user = userEvent.setup();

    render(<FamilyProfilesPage onNavigate={() => {}} onGenerateReport={() => {}} onOpenRelationshipHub={onOpenRelationshipHub} />);
    await screen.findByText("Ramesh Sharma");

    await user.click(screen.getByRole("button", { name: /💞 Relationship Hub/i }));

    expect(onOpenRelationshipHub).toHaveBeenCalledWith("profile-mother");
  });
});

describe("RelationshipHubPage", () => {
  it("shows an empty state when fewer than two profiles are saved", async () => {
    vi.spyOn(familyProfilesApi, "listProfiles").mockResolvedValue([FATHER]);

    render(<RelationshipHubPage onBack={() => {}} initialProfileIdA={null} />);

    expect(await screen.findByText(/Add at least two profiles/i)).toBeInTheDocument();
  });

  it("compares two chosen profiles and shows the Kundli Matching tab", async () => {
    vi.spyOn(familyProfilesApi, "listProfiles").mockResolvedValue([FATHER, MOTHER]);
    vi.spyOn(relationshipHubApi, "compareProfiles").mockResolvedValue(MOCK_COMPARISON);
    const user = userEvent.setup();

    render(<RelationshipHubPage onBack={() => {}} initialProfileIdA={null} />);
    await screen.findByLabelText(/Profile A/i);

    await user.selectOptions(screen.getByLabelText(/Profile A/i), "profile-father");
    await user.selectOptions(screen.getByLabelText(/Profile B/i), "profile-mother");
    await user.click(screen.getByRole("button", { name: /Compare/i }));

    expect(await screen.findByText(/Very Good/i)).toBeInTheDocument();
    expect(readPreferences().activeProfileId).toBe("profile-father");
  });

  it("shows a friendly error state when the comparison request fails", async () => {
    vi.spyOn(familyProfilesApi, "listProfiles").mockResolvedValue([FATHER, MOTHER]);
    vi.spyOn(relationshipHubApi, "compareProfiles").mockRejectedValue(new Error("Could not compare these two profiles."));
    const user = userEvent.setup();

    render(<RelationshipHubPage onBack={() => {}} initialProfileIdA={null} />);
    await screen.findByLabelText(/Profile A/i);

    await user.selectOptions(screen.getByLabelText(/Profile A/i), "profile-father");
    await user.selectOptions(screen.getByLabelText(/Profile B/i), "profile-mother");
    await user.click(screen.getByRole("button", { name: /Compare/i }));

    expect(await screen.findByText(/Could not compare these two profiles/i)).toBeInTheDocument();
  });

  it("preselects Profile A from the persisted active profile when reached without an explicit preset", async () => {
    window.localStorage.setItem("nv_preferences", JSON.stringify({ activeProfileId: "profile-mother" }));
    vi.spyOn(familyProfilesApi, "listProfiles").mockResolvedValue([FATHER, MOTHER]);

    render(<RelationshipHubPage onBack={() => {}} initialProfileIdA={null} />);

    expect(await screen.findByLabelText(/Profile A/i)).toHaveValue("profile-mother");
  });

  it("an explicit initialProfileIdA prop takes priority over the persisted active profile", async () => {
    window.localStorage.setItem("nv_preferences", JSON.stringify({ activeProfileId: "profile-mother" }));
    vi.spyOn(familyProfilesApi, "listProfiles").mockResolvedValue([FATHER, MOTHER]);

    render(<RelationshipHubPage onBack={() => {}} initialProfileIdA="profile-father" />);

    expect(await screen.findByLabelText(/Profile A/i)).toHaveValue("profile-father");
  });

  it("drops a persisted active profile that no longer exists rather than leaving a ghost selection", async () => {
    window.localStorage.setItem("nv_preferences", JSON.stringify({ activeProfileId: "profile-deleted" }));
    vi.spyOn(familyProfilesApi, "listProfiles").mockResolvedValue([FATHER, MOTHER]);

    render(<RelationshipHubPage onBack={() => {}} initialProfileIdA={null} />);

    expect(await screen.findByLabelText(/Profile A/i)).toHaveValue("");
  });

  it("calls onBack when the back button is clicked", async () => {
    vi.spyOn(familyProfilesApi, "listProfiles").mockResolvedValue([FATHER, MOTHER]);
    const onBack = vi.fn();
    const user = userEvent.setup();

    render(<RelationshipHubPage onBack={onBack} initialProfileIdA={null} />);
    await screen.findByLabelText(/Profile A/i);
    await user.click(screen.getByRole("button", { name: /Back/i }));

    expect(onBack).toHaveBeenCalled();
  });
});
