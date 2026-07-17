import { memo } from "react";
import ExplorerHeader from "./ExplorerHeader.jsx";
import ExplorerSidePanel from "./ExplorerSidePanel.jsx";
import ExplorerMainPanel from "./ExplorerMainPanel.jsx";

// ─────────────────────────────────────────────────────────────────────────
// ExplorerLayout (V5.0 Phase 5A — Explorer Infrastructure)
//
// Pure layout shell: header on top, side panel + main panel below in a
// responsive two-column grid (stacks to one column on narrow viewports,
// same `auto-fit`/`minmax` responsive pattern already used throughout the
// report, e.g. OverviewTab's grid). No state of its own — everything it
// renders reads from ExplorerContext already.
// ─────────────────────────────────────────────────────────────────────────
function ExplorerLayout({ userData, planetary, report, chart }) {
  return (
    <div>
      <ExplorerHeader />
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(240px,320px) 1fr", alignItems: "start" }}
           className="explorer-grid">
        <ExplorerSidePanel userData={userData} planetary={planetary} report={report} />
        {/* V5.0 Phase 5C (Explorer AI): `chart` is additive, only consumed
            by ExplorerMainPanel's detail panels for AI explanations —
            ExplorerSidePanel's own props are unchanged. */}
        <ExplorerMainPanel userData={userData} planetary={planetary} report={report} chart={chart} />
      </div>
    </div>
  );
}

export default memo(ExplorerLayout);
