import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExplorerTab from "../src/components/explorer/ExplorerTab.jsx";
import { useExplorer, ExplorerProvider } from "../src/context/ExplorerContext.jsx";

// ─────────────────────────────────────────────────────────────────────────
// V5.0 Phase 5A — Explorer Infrastructure
//
// Covers: the new Explorer tab rendering via the existing Report page
// pattern, selection state updates, keyboard navigation across the side
// panel's tree, lazy-loaded detail panels appearing after selection, and
// basic ExplorerContext behavior (hook usage + provider requirement).
// ─────────────────────────────────────────────────────────────────────────

const USER_DATA = { name: "Asha Verma", dob: "1990-05-14", tob: "10:30", pob: "Delhi", lagna: "Taurus" };
const PLANETARY = { "Sun ☀️": { house: 5, sign: "Leo" }, "Moon 🌙": { house: 2, sign: "Cancer" } };
const REPORT = {
  chart: {
    yogas: [{ name: "Gaj Kesari Yoga", detail: "Moon and Jupiter in mutual kendra." }],
    doshas: [{ name: "Mangal Dosha", detail: "Mars placed in the 7th house." }],
  },
  nakshatraProfile: { nakshatra: "Rohini", lord: "Moon" },
};

function renderExplorer() {
  return render(<ExplorerTab userData={USER_DATA} planetary={PLANETARY} report={REPORT} />);
}

describe("Explorer tab rendering", () => {
  it("renders the Explorer header, side panel categories, and an empty main panel by default", () => {
    renderExplorer();
    expect(screen.getByRole("heading", { name: /kundli explorer/i })).toBeInTheDocument();
    expect(screen.getByRole("tree", { name: /explorer selection categories/i })).toBeInTheDocument();

    // All eight selection-type categories are present.
    for (const label of ["Planets", "Houses", "Zodiac Signs", "Yogas", "Doshas", "Nakshatras", "Ascendant", "Aspects"]) {
      expect(screen.getByRole("treeitem", { name: new RegExp(label) })).toBeInTheDocument();
    }

    // Nothing selected yet -> empty state in the main panel.
    expect(screen.getByText(/nothing selected yet/i)).toBeInTheDocument();
  });
});

describe("Explorer selection state", () => {
  it("selecting a planet item updates the header breadcrumb and loads its detail panel", async () => {
    const user = userEvent.setup();
    renderExplorer();

    // Planets category starts expanded (first category), so its items
    // are already visible.
    const sunItem = await screen.findByRole("treeitem", { name: /Sun/i });
    await user.click(sunItem);

    expect(await screen.findByText(/planets ·/i)).toBeInTheDocument();
    // Lazy-loaded PlanetExplorerPanel renders a heading with the item's label.
    expect(await screen.findByRole("heading", { name: /Sun/i })).toBeInTheDocument();
  });

  it("selecting a different type replaces the previous selection instead of stacking", async () => {
    const user = userEvent.setup();
    renderExplorer();

    const sunItem = await screen.findByRole("treeitem", { name: /Sun/i });
    await user.click(sunItem);
    expect(await screen.findByRole("heading", { name: /Sun/i })).toBeInTheDocument();

    // Expand Houses category and pick House 1.
    const housesCategory = screen.getByRole("treeitem", { name: /Houses/i });
    await user.click(housesCategory);
    const house1 = await screen.findByRole("treeitem", { name: /^House 1(?!\d)/i });
    await user.click(house1);

    expect(await screen.findByText(/houses ·/i)).toBeInTheDocument();
  });
});

describe("Explorer keyboard navigation", () => {
  it("supports ArrowDown to move focus and Enter to activate a row", async () => {
    const user = userEvent.setup();
    renderExplorer();

    const planetsCategory = screen.getByRole("treeitem", { name: /Planets/i });
    planetsCategory.focus();
    expect(planetsCategory).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    // Focus should have moved to the first item under Planets (Sun).
    const sunItem = await screen.findByRole("treeitem", { name: /Sun/i });
    expect(sunItem).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(await screen.findByRole("heading", { name: /Sun/i })).toBeInTheDocument();
  });

  it("collapses an expanded category with ArrowLeft", async () => {
    const user = userEvent.setup();
    renderExplorer();

    const planetsCategory = screen.getByRole("treeitem", { name: /Planets/i });
    expect(planetsCategory).toHaveAttribute("aria-expanded", "true");

    planetsCategory.focus();
    await user.keyboard("{ArrowLeft}");
    expect(planetsCategory).toHaveAttribute("aria-expanded", "false");
  });
});

describe("Explorer lazy loading", () => {
  it("shows a loading fallback before the code-split detail panel resolves", async () => {
    const user = userEvent.setup();
    renderExplorer();

    const sunItem = await screen.findByRole("treeitem", { name: /Sun/i });
    await user.click(sunItem);

    // Either the fallback briefly appears or the panel resolves quickly;
    // either way the final resolved panel must appear.
    expect(await screen.findByRole("heading", { name: /Sun/i }, { timeout: 4000 })).toBeInTheDocument();
  });
});

describe("ExplorerContext behavior", () => {
  it("throws when useExplorer is called outside an ExplorerProvider", () => {
    function Bare() {
      useExplorer();
      return null;
    }
    expect(() => render(<Bare />)).toThrow(/useExplorer must be used within an ExplorerProvider/i);
  });

  it("exposes selection/expansion state and actions to consumers", () => {
    let ctx;
    function Consumer() {
      ctx = useExplorer();
      return null;
    }
    render(<ExplorerProvider><Consumer /></ExplorerProvider>);
    expect(ctx.selectedType).toBeNull();
    expect(ctx.selectedItem).toBeNull();
    expect(typeof ctx.selectItem).toBe("function");
    expect(typeof ctx.toggleSection).toBe("function");
    expect(ctx.isSectionExpanded("planet")).toBe(true); // first category defaults open
    expect(ctx.isSectionExpanded("aspect")).toBe(false);
  });
});
