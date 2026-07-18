import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExplorerTab from "../src/components/explorer/ExplorerTab.jsx";
import PlanetExplorerPanel from "../src/components/explorer/panels/PlanetExplorerPanel.jsx";
import HouseExplorerPanel from "../src/components/explorer/panels/HouseExplorerPanel.jsx";
import SignExplorerPanel from "../src/components/explorer/panels/SignExplorerPanel.jsx";
import YogaExplorerPanel from "../src/components/explorer/panels/YogaExplorerPanel.jsx";
import DoshaExplorerPanel from "../src/components/explorer/panels/DoshaExplorerPanel.jsx";
import NakshatraExplorerPanel from "../src/components/explorer/panels/NakshatraExplorerPanel.jsx";
import AscendantExplorerPanel from "../src/components/explorer/panels/AscendantExplorerPanel.jsx";
import AspectExplorerPanel from "../src/components/explorer/panels/AspectExplorerPanel.jsx";

// ─────────────────────────────────────────────────────────────────────────
// V5.0 Phase 5B — Explorer Infrastructure: Backend Integration
//
// Covers each detail panel rendering real backend data (planetStrength,
// predictions, yogas/doshas, nakshatraProfile, aspect influence), the
// empty-state branch when a selection has no matching backend data, and
// resilience when `report`/`planetary` are entirely absent (simulating an
// upstream insights failure — see astrology.controller.js's own
// try/catch around buildExplorerApiFields). Loading state is covered by
// the existing ExplorerTab.test.jsx Suspense-fallback test; this file
// focuses on what renders once a panel resolves.
// ─────────────────────────────────────────────────────────────────────────

const USER_DATA = { name: "Asha Verma", dob: "1990-05-14", tob: "10:30", pob: "Delhi", lagna: "Cancer" };
const PLANETARY = { "Sun ☀️": { house: 5, sign: "Leo" }, "Moon 🌙": { house: 1, sign: "Cancer" } };

const REPORT = {
  chart: {
    yogas: [{
      name: "Gaj Kesari Yoga",
      detail: "Moon and Jupiter in mutual kendra.",
      influence: "positive",
      explanationMeta: "Formed by a Moon-Jupiter kendra placement.",
    }],
    doshas: [{
      name: "Mangal Dosha",
      detail: "Mars placed in the 7th house.",
      severity: "Moderate",
      influence: "negative",
      remedies: ["Recite Hanuman Chalisa on Tuesdays"],
      explanationMeta: "Mars occupies a Kendra from the Lagna.",
    }],
  },
  nakshatraProfile: {
    nakshatra: "Rohini", lord: "Moon", pada: 2, deity: "Brahma", symbol: "Chariot",
    gana: "Manushya", nadi: "Aadi", yoni: "Sarpa", nature: "Fixed",
    personality: "Charming, creative, and deeply connected to beauty.",
    careerTendencies: "Suited for creative or luxury-facing industries.",
    relationshipTendencies: "Warm and loyal once committed.",
    spiritualTendencies: "Drawn to beauty as a spiritual path.",
  },
  planetStrength: {
    Sun: {
      sign: "Leo", dignity: { state: "ownSign", label: "Own Sign" }, retrograde: false,
      combustion: { combust: false }, friendship: { relation: "own" },
      functionalNature: { nature: "benefic" }, digBala: {}, shadbala: { total: 320 },
      aspectInfluence: { aspectedBy: [], housesAspected: [], beneficAspectCount: 0, maleficAspectCount: 0, netInfluence: 0 },
      adjustedScore: 72, explanation: "Sun is strong in its own sign of Leo.",
    },
    Moon: {
      sign: "Cancer", dignity: { state: "exalted", label: "Exalted" }, retrograde: false,
      combustion: { combust: false }, friendship: { relation: "own" },
      functionalNature: { nature: "benefic" }, digBala: {}, shadbala: { total: 410 },
      aspectInfluence: { aspectedBy: ["Saturn"], housesAspected: [11], beneficAspectCount: 0, maleficAspectCount: 1, netInfluence: -1 },
      adjustedScore: 88, explanation: "Moon is exalted in Cancer, granting deep emotional strength.",
    },
  },
  predictions: [{
    category: "Career", confidence: { label: "High", score: 82 },
    prediction: "Strong career growth expected in the coming years.",
    activeMahadasha: "Moon", activeAntardasha: "Sun",
    dominantPlanet: "Moon", supportingPlanets: ["Sun"], supportingHouses: [5, 10],
    supportingYogas: [{ name: "Gaj Kesari Yoga" }], supportingDoshas: [{ name: "Mangal Dosha" }],
    suggestedRemedies: [{ type: "Mantra", detail: "Chant Om Somaya Namaha 108 times." }],
  }],
};

describe("PlanetExplorerPanel — real data rendering", () => {
  it("renders dignity, retrograde/combustion state, functional nature, and linked predictions/remedies", () => {
    render(<PlanetExplorerPanel item={{ id: "Moon 🌙", label: "Moon 🌙" }} planetary={PLANETARY} report={REPORT} />);
    expect(screen.getByText("Exalted")).toBeInTheDocument();
    expect(screen.getByText(/functionally benefic/i)).toBeInTheDocument();
    expect(screen.getByText(/exalted in cancer/i)).toBeInTheDocument();
    expect(screen.getByText("Career")).toBeInTheDocument(); // linked PredictionCard
    // Renders in both the linked PredictionCard's inline remedy note and
    // the separate "Related Remedies" RemedyCard section — both are
    // expected, so assert at least one instance rather than a unique one.
    expect(screen.getAllByText(/chant om somaya namaha/i).length).toBeGreaterThan(0);
  });

  it("shows an empty state when the selected planet has no backend data", () => {
    render(<PlanetExplorerPanel item={{ id: "Mars ♂", label: "Mars ♂" }} planetary={PLANETARY} report={REPORT} />);
    expect(screen.getByText(/planet data not available/i)).toBeInTheDocument();
  });

  it("does not throw when report/planetary are entirely absent (error/failure resilience)", () => {
    render(<PlanetExplorerPanel item={{ id: "Sun ☀️", label: "Sun ☀️" }} planetary={undefined} report={undefined} />);
    expect(screen.getByText(/planet data not available/i)).toBeInTheDocument();
  });
});

describe("HouseExplorerPanel — real data rendering", () => {
  it("derives the house's sign/lord and shows its occupant with dignity", () => {
    render(<HouseExplorerPanel item={{ id: "house-1", label: "House 1" }} userData={USER_DATA} planetary={PLANETARY} report={REPORT} />);
    expect(screen.getByText(/sign: cancer/i)).toBeInTheDocument();
    expect(screen.getByText(/lord: moon/i)).toBeInTheDocument();
    expect(screen.getByText(/moon 🌙 · exalted/i)).toBeInTheDocument();
  });

  it("shows linked predictions only for houses the backend actually supports", () => {
    render(<HouseExplorerPanel item={{ id: "house-5", label: "House 5" }} userData={USER_DATA} planetary={PLANETARY} report={REPORT} />);
    expect(screen.getByText("Career")).toBeInTheDocument();
  });

  it("shows an empty-predictions message for a house with no supporting predictions", () => {
    render(<HouseExplorerPanel item={{ id: "house-2", label: "House 2" }} userData={USER_DATA} planetary={PLANETARY} report={REPORT} />);
    expect(screen.getByText(/no category prediction currently names house 2/i)).toBeInTheDocument();
  });

  it("shows an empty state for a malformed house id", () => {
    render(<HouseExplorerPanel item={{ id: "house-abc", label: "House ?" }} userData={USER_DATA} planetary={PLANETARY} report={REPORT} />);
    expect(screen.getByText(/house data not available/i)).toBeInTheDocument();
  });
});

describe("SignExplorerPanel — real data rendering", () => {
  it("shows the sign's lord and occupant planets", () => {
    render(<SignExplorerPanel item={{ id: "Cancer", label: "Cancer" }} userData={USER_DATA} planetary={PLANETARY} report={REPORT} />);
    expect(screen.getAllByText(/lord: moon/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/this chart's lagna/i)).toBeInTheDocument();
    expect(screen.getByText(/moon 🌙 · h1/i)).toBeInTheDocument();
  });
});

describe("YogaExplorerPanel — real data rendering", () => {
  it("shows the matched rule, contributing planets, and confidence via linked predictions", () => {
    render(<YogaExplorerPanel item={{ id: "yoga-0-Gaj Kesari Yoga", label: "Gaj Kesari Yoga" }} report={REPORT} />);
    expect(screen.getByText(/rule matched: gaj kesari yoga/i)).toBeInTheDocument();
    // "Moon"/"Sun" also appear in the linked PredictionCard's Mahadasha/
    // Antardasha rows, so assert presence via count rather than a single
    // exact match.
    expect(screen.getAllByText("Moon").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sun").length).toBeGreaterThan(0);
    expect(screen.getByText(/high · 82\/100/i)).toBeInTheDocument();
  });

  it("shows a not-found state for a yoga no longer in the chart's detected set", () => {
    render(<YogaExplorerPanel item={{ id: "yoga-9-Unknown Yoga", label: "Unknown Yoga" }} report={REPORT} />);
    expect(screen.getByText(/yoga not found/i)).toBeInTheDocument();
  });
});

describe("DoshaExplorerPanel — real data rendering", () => {
  it("shows severity, matching rule, affected houses, and remedies", () => {
    render(<DoshaExplorerPanel item={{ id: "dosha-0-Mangal Dosha", label: "Mangal Dosha" }} report={REPORT} />);
    expect(screen.getByText(/matching rule: mangal dosha/i)).toBeInTheDocument();
    expect(screen.getByText(/severity: moderate/i)).toBeInTheDocument();
    expect(screen.getByText("House 5")).toBeInTheDocument();
    expect(screen.getByText("House 10")).toBeInTheDocument();
    expect(screen.getByText(/recite hanuman chalisa/i)).toBeInTheDocument();
  });

  it("shows a not-found state for a dosha no longer in the chart's detected set", () => {
    render(<DoshaExplorerPanel item={{ id: "dosha-9-Unknown Dosha", label: "Unknown Dosha" }} report={REPORT} />);
    expect(screen.getByText(/dosha not found/i)).toBeInTheDocument();
  });
});

describe("NakshatraExplorerPanel — real data rendering", () => {
  it("renders the real nakshatra profile fields", () => {
    render(<NakshatraExplorerPanel report={REPORT} />);
    expect(screen.getByRole("heading", { name: /rohini/i })).toBeInTheDocument();
    expect(screen.getByText(/pada 2/i)).toBeInTheDocument();
    expect(screen.getByText("Brahma")).toBeInTheDocument();
    expect(screen.getByText("Chariot")).toBeInTheDocument();
    expect(screen.getByText(/charming, creative/i)).toBeInTheDocument();
  });

  it("shows an empty state when no nakshatra profile is present", () => {
    render(<NakshatraExplorerPanel report={{}} />);
    expect(screen.getByText(/nakshatra profile not available/i)).toBeInTheDocument();
  });
});

describe("AscendantExplorerPanel — real data rendering", () => {
  it("shows the Lagna, its lord, characteristics, and linked predictions", () => {
    render(<AscendantExplorerPanel userData={USER_DATA} report={REPORT} />);
    expect(screen.getByText(/lord: moon/i)).toBeInTheDocument();
    expect(screen.getByText("Exalted")).toBeInTheDocument();
    expect(screen.getByText(/exalted in cancer/i)).toBeInTheDocument();
    expect(screen.getByText("Career")).toBeInTheDocument();
  });

  it("shows an empty state when no Lagna is available", () => {
    render(<AscendantExplorerPanel userData={{}} report={REPORT} />);
    expect(screen.getByText(/ascendant not available/i)).toBeInTheDocument();
  });
});

describe("AspectExplorerPanel — real data rendering", () => {
  it("shows aspect source, target, strength, and an interpretation", () => {
    render(<AspectExplorerPanel item={{ id: "aspect-Moon", label: "Moon ← Saturn" }} report={REPORT} />);
    expect(screen.getByText("Saturn")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument(); // malefic aspect count
    expect(screen.getByText(/-1/)).toBeInTheDocument(); // net influence
    expect(screen.getByText(/challenging influence/i)).toBeInTheDocument();
  });

  it("shows an empty state for an aspect target with no data", () => {
    render(<AspectExplorerPanel item={{ id: "aspect-Ketu", label: "Ketu" }} report={REPORT} />);
    expect(screen.getByText(/aspect data not available/i)).toBeInTheDocument();
  });
});

describe("Explorer end-to-end wiring (Phase 5B)", () => {
  it("selecting Moon from the full Explorer tab renders its real dignity/strength data", async () => {
    const user = userEvent.setup();
    render(<ExplorerTab userData={USER_DATA} planetary={PLANETARY} report={REPORT} />);

    const moonItem = await screen.findByRole("treeitem", { name: /Moon/i });
    await user.click(moonItem);

    expect(await screen.findByText("Exalted")).toBeInTheDocument();
    expect(screen.getByText(/functionally benefic/i)).toBeInTheDocument();
  });
});
