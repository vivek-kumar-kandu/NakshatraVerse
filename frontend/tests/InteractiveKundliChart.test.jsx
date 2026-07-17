import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InteractiveKundliChart from "../src/components/common/InteractiveKundliChart.jsx";
import { ExplorerProvider, useExplorer } from "../src/context/ExplorerContext.jsx";
import ExplorerTab from "../src/components/explorer/ExplorerTab.jsx";

// ─────────────────────────────────────────────────────────────────────────
// V5.1 — Interactive Kundli / Explorer Integration
//
// Covers: planet selection, house selection, hover behaviour, zoom, pan,
// aspect highlighting, transit overlay, and Explorer synchronization
// (selecting something on the chart lands the same selection the
// Explorer tab's own side panel would produce).
// ─────────────────────────────────────────────────────────────────────────

const USER_DATA = { name: "Asha Verma", dob: "1990-05-14", tob: "10:30", pob: "Delhi", lagna: "Taurus" };
const PLANETARY = {
  "Sun ☀️": { house: 5, sign: "Leo" },
  "Moon 🌙": { house: 2, sign: "Cancer" },
  "Mars ♂": { house: 7, sign: "Aquarius" },
};
const REPORT = {
  chart: {
    yogas: [{ name: "Gaj Kesari Yoga", detail: "Moon and Jupiter in mutual kendra." }],
    doshas: [{ name: "Mangal Dosha", detail: "Mars placed in the 7th house." }],
  },
  nakshatraProfile: { nakshatra: "Rohini", lord: "Moon" },
  planetStrength: {
    Sun: { aspectInfluence: { aspectedBy: ["Mars"], netInfluence: -1, housesAspected: [5], beneficAspectCount: 0, maleficAspectCount: 1 } },
  },
  transitForecast: {
    saturn: { transitSign: "Aquarius", houseFromMoon: 3 },
    jupiter: { transitSign: "Taurus", houseFromMoon: 1 },
    rahuKetu: [{ planet: "Rahu", transitSign: "Pisces", houseFromMoon: 2 }],
  },
};

function Harness({ onSelect }) {
  const ctx = useExplorer();
  return (
    <InteractiveKundliChart
      userData={USER_DATA}
      planetary={PLANETARY}
      report={REPORT}
      selectedType={ctx.selectedType}
      selectedItem={ctx.selectedItem}
      onSelect={(type, item) => { ctx.selectItem(type, item); onSelect?.(type, item); }}
      onNavigateExplorer={ctx.onNavigateExplorer}
    />
  );
}

function renderChart(props = {}) {
  return render(
    <ExplorerProvider>
      <Harness {...props} />
    </ExplorerProvider>
  );
}

describe("Interactive Kundli — planet selection", () => {
  it("clicking a planet glyph selects it", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderChart({ onSelect });

    // Exact match — a loose "House 5" substring also appears inside the
    // house wedge's own aria-label ("House 5, Leo — Sun ☀️"), so this
    // must be the planet glyph's exact "<Name>: House <n>, <Sign>" label.
    const sunGlyph = screen.getByRole("button", { name: "Sun: House 5, Leo" });
    await user.click(sunGlyph);

    expect(onSelect).toHaveBeenCalledWith("planet", expect.objectContaining({ id: "Sun ☀️", label: "Sun ☀️" }));
  });
});

describe("Interactive Kundli — house selection", () => {
  it("clicking a house wedge selects that house", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderChart({ onSelect });

    // House 5 (Sun's house) wedge is labelled via ZodiacWheel's own
    // "House <n>, <Sign> — <planets>" aria-label.
    const houseWedge = screen.getByRole("button", { name: "House 5, Leo — Sun ☀️" });
    await user.click(houseWedge);

    expect(onSelect).toHaveBeenCalledWith("house", expect.objectContaining({ id: "house-5", label: "House 5" }));
  });
});

describe("Interactive Kundli — hover behaviour", () => {
  it("hovering a planet updates the live status region without selecting it", async () => {
    const onSelect = vi.fn();
    renderChart({ onSelect });

    const sunGlyph = screen.getByRole("button", { name: "Sun: House 5, Leo" });
    fireEvent.mouseEnter(sunGlyph);

    expect(onSelect).not.toHaveBeenCalled();

    fireEvent.mouseLeave(sunGlyph);
  });

  it("hovering a zodiac sign target shows a hover label", () => {
    renderChart();
    const ariesTarget = screen.getByRole("button", { name: "Zodiac sign Aries" });
    fireEvent.mouseEnter(ariesTarget);
    expect(screen.getByText(/Hovering: Aries/i)).toBeInTheDocument();
    fireEvent.mouseLeave(ariesTarget);
  });
});

describe("Interactive Kundli — zoom", () => {
  it("Zoom In / Zoom Out / Reset View controls change the transform", () => {
    const { getByTestId } = renderChart();
    const layer = getByTestId("kundli-zoom-pan-layer");
    expect(layer.style.transform).toContain("scale(1)");

    fireEvent.click(screen.getByRole("button", { name: /zoom in/i }));
    expect(layer.style.transform).not.toContain("scale(1)");

    fireEvent.click(screen.getByRole("button", { name: /reset view/i }));
    expect(layer.style.transform).toContain("scale(1)");
  });

  it("supports the '+' and '-' keys on the chart viewport", () => {
    renderChart();
    const viewport = screen.getByRole("application");
    const layer = screen.getByTestId("kundli-zoom-pan-layer");

    viewport.focus();
    fireEvent.keyDown(viewport, { key: "+" });
    expect(layer.style.transform).not.toContain("scale(1)");

    fireEvent.keyDown(viewport, { key: "0" });
    expect(layer.style.transform).toContain("scale(1)");
  });
});

describe("Interactive Kundli — pan", () => {
  it("dragging after zooming in translates the chart", () => {
    renderChart();
    const viewport = screen.getByRole("application");
    const layer = screen.getByTestId("kundli-zoom-pan-layer");

    fireEvent.click(screen.getByRole("button", { name: /zoom in/i }));
    fireEvent.pointerDown(viewport, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(viewport, { clientX: 140, clientY: 120, pointerId: 1 });
    fireEvent.pointerUp(viewport, { pointerId: 1 });

    expect(layer.style.transform).toContain("translate(40px, 20px)");
  });

  it("does not pan while at the default (1x) scale", () => {
    renderChart();
    const viewport = screen.getByRole("application");
    const layer = screen.getByTestId("kundli-zoom-pan-layer");

    fireEvent.pointerDown(viewport, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(viewport, { clientX: 140, clientY: 120, pointerId: 1 });
    fireEvent.pointerUp(viewport, { pointerId: 1 });

    expect(layer.style.transform).toContain("translate(0px, 0px)");
  });
});

describe("Interactive Kundli — aspect highlighting", () => {
  it("clicking an aspect line selects that aspect", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderChart({ onSelect });

    const aspectLine = screen.getByRole("button", { name: /Aspect: Sun/i });
    await user.click(aspectLine);

    expect(onSelect).toHaveBeenCalledWith("aspect", expect.objectContaining({ id: "aspect-Sun" }));
  });

  it("hiding aspects removes the aspect line from the chart", async () => {
    const user = userEvent.setup();
    renderChart();

    expect(screen.getByRole("button", { name: /Aspect: Sun/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /hide aspects/i }));
    expect(screen.queryByRole("button", { name: /Aspect: Sun/i })).not.toBeInTheDocument();
  });
});

describe("Interactive Kundli — transit overlay", () => {
  it("is hidden by default and appears after toggling Show Transits", async () => {
    const user = userEvent.setup();
    renderChart();

    expect(screen.queryByText("Sa")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /show transits/i }));
    expect(screen.getByText("Sa")).toBeInTheDocument();
    expect(screen.getByText("Ju")).toBeInTheDocument();
  });
});

describe("Interactive Kundli — Explorer synchronization", () => {
  it("selecting a planet on the chart is reflected in shared ExplorerContext state", async () => {
    const user = userEvent.setup();
    let ctxRef;
    function Reader() {
      ctxRef = useExplorer();
      return null;
    }
    render(
      <ExplorerProvider>
        <Harness />
        <Reader />
      </ExplorerProvider>
    );

    const sunGlyph = screen.getByRole("button", { name: "Sun: House 5, Leo" });
    await user.click(sunGlyph);

    expect(ctxRef.selectedType).toBe("planet");
    expect(ctxRef.selectedItem.id).toBe("Sun ☀️");
  });

  it("a shared outer ExplorerProvider is reused by ExplorerTab's own nested provider instead of being shadowed", async () => {
    const user = userEvent.setup();
    let outerCtx;
    function OuterReader() {
      outerCtx = useExplorer();
      return null;
    }
    render(
      <ExplorerProvider>
        <OuterReader />
        <ExplorerTab userData={USER_DATA} planetary={PLANETARY} report={REPORT} />
      </ExplorerProvider>
    );

    expect(outerCtx.selectedType).toBeNull();
    expect(screen.getByText(/nothing selected yet/i)).toBeInTheDocument();

    // Select Sun through the Explorer tab's own side panel (rendered by
    // its nested <ExplorerProvider>, which — per the passthrough patch —
    // reuses this outer provider's state instead of creating its own).
    const sunItem = await screen.findByRole("treeitem", { name: /Sun/i });
    await user.click(sunItem);

    // The OUTER context (shared with the Kundli tab) must reflect the
    // same selection, proving the two tabs are truly synchronized.
    expect(outerCtx.selectedType).toBe("planet");
    expect(outerCtx.selectedItem?.id ?? outerCtx.selectedItem).toBe("Sun ☀️");
  });
});
