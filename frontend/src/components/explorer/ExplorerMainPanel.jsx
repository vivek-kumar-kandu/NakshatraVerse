import { lazy, memo, Suspense } from "react";
import EmptyState from "../common/EmptyState.jsx";
import GlassCard from "../common/GlassCard.jsx";
import { useExplorer } from "../../context/ExplorerContext.jsx";

// ─────────────────────────────────────────────────────────────────────────
// ExplorerMainPanel (V5.0 Phase 5A — Explorer Infrastructure)
//
// Resolves the currently selected type to its own detail panel and lazy
// loads it (React.lazy + Suspense), so every one of the eight Explorer
// detail panels is its own code-split chunk — none of them are pulled
// into the initial report bundle until the person actually selects that
// type. Only the framework/placeholder panels exist yet; deep backend
// explorer logic and Gemini explanations are later phases.
// ─────────────────────────────────────────────────────────────────────────

const PANEL_LOADERS = {
  planet:    lazy(() => import("./panels/PlanetExplorerPanel.jsx")),
  house:     lazy(() => import("./panels/HouseExplorerPanel.jsx")),
  sign:      lazy(() => import("./panels/SignExplorerPanel.jsx")),
  yoga:      lazy(() => import("./panels/YogaExplorerPanel.jsx")),
  dosha:     lazy(() => import("./panels/DoshaExplorerPanel.jsx")),
  nakshatra: lazy(() => import("./panels/NakshatraExplorerPanel.jsx")),
  ascendant: lazy(() => import("./panels/AscendantExplorerPanel.jsx")),
  aspect:    lazy(() => import("./panels/AspectExplorerPanel.jsx")),
};

function PanelFallback() {
  return (
    <GlassCard style={{ padding: 24 }} role="status" aria-live="polite">
      <p style={{ margin: 0, fontSize: 13, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>
        Loading detail panel…
      </p>
    </GlassCard>
  );
}

function ExplorerMainPanel({ userData, planetary, report, chart }) {
  const { selectedType, selectedItem, focusRegion, setFocusRegion } = useExplorer();

  if (!selectedType) {
    return (
      <EmptyState
        icon="🧭"
        title="Nothing selected yet"
        message="Choose a planet, house, sign, yoga, dosha, nakshatra, ascendant, or aspect from the panel to explore it here."
      />
    );
  }

  const Panel = PANEL_LOADERS[selectedType];
  if (!Panel) return null;

  return (
    <div
      role="region"
      aria-label="Explorer detail panel"
      tabIndex={-1}
      onFocus={() => focusRegion !== "mainPanel" && setFocusRegion("mainPanel")}
    >
      <Suspense fallback={<PanelFallback />}>
        {/* V5.0 Phase 5B (Explorer Infrastructure — Backend Integration):
            userData/planetary/report are the same, already-loaded props
            ExplorerLayout/ExplorerSidePanel already receive — passed
            through so each detail panel can render real backend data
            instead of the Phase 5A placeholder body. No new fetch, no
            new prop source.
            V5.0 Phase 5C (Explorer AI): `chart` is additive, only used by
            each panel's new ExplorerAIPanel section. */}
        <Panel item={selectedItem} userData={userData} planetary={planetary} report={report} chart={chart} />
      </Suspense>
    </div>
  );
}

export default memo(ExplorerMainPanel);
