import { memo } from "react";
import { ExplorerProvider } from "../../context/ExplorerContext.jsx";
import ExplorerLayout from "./ExplorerLayout.jsx";

// ─────────────────────────────────────────────────────────────────────────
// ExplorerTab (V5.0 Phase 5A — Explorer Infrastructure)
//
// Entry point rendered by ResultsPage.jsx's tab switch, exactly like
// OverviewTab/KundliTab/etc. in ResultsTabs.jsx. Not a new page/route —
// it reuses the existing Report page (ResultsPage) and its existing
// TabBar; this is the "ONE new Explorer tab" the phase calls for.
//
// Scopes ExplorerProvider to just this tab's subtree so its selection/
// keyboard/focus state resets naturally whenever the tab unmounts
// (ResultsPage renders only the active tab), and never leaks into any
// other tab or page.
// ─────────────────────────────────────────────────────────────────────────
function ExplorerTab({ userData, planetary, report, chart }) {
  return (
    <ExplorerProvider>
      {/* V5.0 Phase 5C (Explorer AI): `chart` is additive — passed through
          unchanged so ExplorerLayout/ExplorerMainPanel/detail panels can
          reach it for AI explanations. Every existing prop is untouched. */}
      <ExplorerLayout userData={userData} planetary={planetary} report={report} chart={chart} />
    </ExplorerProvider>
  );
}

export default memo(ExplorerTab);
