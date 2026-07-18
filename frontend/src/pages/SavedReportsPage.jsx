import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";
import CosmicBg from "../components/common/CosmicBg.jsx";
import GlassCard from "../components/common/GlassCard.jsx";
import { useToast } from "../components/common/Toast.jsx";
import SkeletonList from "../components/common/Skeleton.jsx";
import ReportCard from "../components/common/ReportCard.jsx";
import SearchFilterBar from "../components/common/SearchFilterBar.jsx";
import ConfirmDialog from "../components/common/ConfirmDialog.jsx";
import ReportPreviewDrawer from "../components/common/ReportPreviewDrawer.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import * as reportsApi from "../utils/reportsApi.js";
import { filterReports, sortReports } from "../utils/reportDisplay.js";
import { GOLD_GRADIENT } from "../constants/astrology.js";
import { readPreferences } from "../utils/settingsStorage.js";

// ─────────────────────────────────────────────────────────────────────────
// SavedReportsPage (Dashboard & Navigation Cleanup)
//
// This is now the single, dedicated home for "Saved Reports" — the full
// search/filter/sort/list/open/delete/export archive that used to live
// embedded inside DashboardPage. Every piece of business logic below is
// copied verbatim from the previous DashboardPage implementation (same
// `reportsApi.listReports()` / `.deleteReport()` / `.exportSavedReportPdf()`
// calls, same client-side filter/sort helpers, same FLIP delete animation,
// same ConfirmDialog/ReportPreviewDrawer usage) — nothing about *how*
// Saved Reports behaves has changed, only *where* it lives. DashboardPage
// no longer renders any of this; it now only links here (via its "Saved
// Reports" Quick Action and "View All" link) and AccountMenu's "Saved
// Reports" item now lands here directly instead of on a scrolled-to
// section of the Dashboard.
//
// No backend, API, or business-logic file is touched — this page only
// reuses existing components and existing `utils/reportsApi.js` /
// `utils/reportDisplay.js` functions exactly as DashboardPage already did.
// ─────────────────────────────────────────────────────────────────────────

function SavedReportsPage({ onNavigate, onViewReport }) {
  const [reports, setReports] = useState(null);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  // Delete confirmation: `deleteTarget` holds the `{ id, title }` of the
  // report the ConfirmDialog is currently confirming, or `null` when closed.
  const [deleteTarget, setDeleteTarget] = useState(null);
  // Id of a report currently playing its fade+slide exit animation after
  // being deleted, still rendered for that brief window so the animation
  // has something to animate — removed from `reports` only once it finishes.
  const [exitingId, setExitingId] = useState(null);
  // Guards handleConfirmDelete against a second invocation firing before
  // the disabled-button re-render commits.
  const isDeletingRef = useRef(false);
  // The report currently open in the quick-peek preview drawer, or `null`.
  const [previewReport, setPreviewReport] = useState(null);
  // Search / sort / layout — all client-side over the same `reports` array,
  // no new API calls.
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState("newest");
  // Initial value comes from the Settings page's "Default Dashboard View"
  // preference (utils/settingsStorage.js) — falls back to "grid" if unset.
  const [viewMode, setViewMode] = useState(() => readPreferences().dashboardView);
  const toast = useToast();

  // Matches the `report-card-exit` keyframe duration in global.css.
  const EXIT_ANIMATION_MS = 280;
  // Container for the cards, used to measure each card's position
  // before/after a delete so remaining cards can be FLIP-animated into
  // their new spot instead of silently snapping there.
  const gridRef = useRef(null);
  const flipPositions = useRef(new Map());

  const loadReports = useCallback(() => {
    let cancelled = false;
    setError(null);
    reportsApi.listReports()
      .then((r) => { if (!cancelled) setReports(r); })
      .catch((err) => { if (!cancelled) setError(err.message || "Could not load your saved reports."); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => loadReports(), [loadReports]);

  const handleDelete = (id, title) => setDeleteTarget({ id, title });

  const handleCancelDelete = () => setDeleteTarget(null);

  const handleConfirmDelete = async () => {
    const target = deleteTarget;
    if (!target || isDeletingRef.current) return;
    isDeletingRef.current = true;
    setDeletingId(target.id);
    try {
      await reportsApi.deleteReport(target.id);
      setDeleteTarget(null);
      setTimeout(() => toast.success(`"${target.title || "Report"}" deleted.`), 0);
      setExitingId(target.id);
      setTimeout(() => {
        setReports((prev) => prev.filter((r) => r.id !== target.id));
        setExitingId(null);
      }, EXIT_ANIMATION_MS);
    } catch (err) {
      toast.error(err.message || "Could not delete that report.");
    } finally {
      setDeletingId(null);
      isDeletingRef.current = false;
    }
  };

  const handleDownload = async (id, name) => {
    setDownloadingId(id);
    try {
      await reportsApi.exportSavedReportPdf(id, `${name || "report"}.pdf`);
      toast.success("PDF downloaded.");
    } catch (err) {
      toast.error(err.message || "Could not generate the PDF.");
    } finally {
      setDownloadingId(null);
    }
  };

  const visibleReports = useMemo(() => {
    if (!reports) return [];
    return sortReports(filterReports(reports, searchQuery), sortKey);
  }, [reports, searchQuery, sortKey]);

  // FLIP: runs after every render of the grid. For each card still on
  // screen, compares its position now to its position last time this ran;
  // if a deleted card's removal shifted it, it's given an inverse transform
  // back to its old spot with transitions switched off, then (next frame)
  // the transform is cleared with a transition switched on.
  useLayoutEffect(() => {
    const container = gridRef.current;
    if (!container) return;
    const cards = container.querySelectorAll("[data-flip-id]");
    const seen = new Set();
    cards.forEach((el) => {
      const id = el.getAttribute("data-flip-id");
      seen.add(id);
      const rect = el.getBoundingClientRect();
      const prev = flipPositions.current.get(id);
      if (prev) {
        const dx = prev.left - rect.left;
        const dy = prev.top - rect.top;
        if (dx || dy) {
          el.style.transition = "none";
          el.style.transform = `translate(${dx}px, ${dy}px)`;
          // eslint-disable-next-line no-unused-expressions
          el.offsetHeight;
          el.style.transition = "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)";
          el.style.transform = "";
        }
      }
      flipPositions.current.set(id, rect);
    });
    for (const id of flipPositions.current.keys()) {
      if (!seen.has(id)) flipPositions.current.delete(id);
    }
  });

  return (
    <div style={{ minHeight: "100vh", position: "relative", fontFamily: "Inter,sans-serif" }}>
      <CosmicBg animated />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1080, margin: "0 auto", padding: "84px 16px 70px" }}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <header style={{ marginBottom: 30, animation: "fadeIn 0.5s ease both" }}>
          <button
            type="button"
            onClick={() => onNavigate?.("dashboard")}
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 10,
              color: "var(--nv-text-secondary, rgba(200,160,255,0.7))", fontSize: 12.5, fontFamily: "Inter,sans-serif",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}
          >
            ← Back to Dashboard
          </button>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
            <h1 style={{
              margin: 0, fontSize: "clamp(22px,4vw,30px)", background: GOLD_GRADIENT,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "Cinzel,serif", fontWeight: 700,
            }}>
              Saved Reports {reports ? `(${reports.length})` : ""}
            </h1>
            <button
              onClick={() => onNavigate?.("landing")}
              className="submit-btn"
              style={{
                padding: "13px 24px", borderRadius: 30, border: "1px solid rgba(180,120,255,0.45)",
                background: "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))", color: "var(--nv-text-on-accent, #fff)", fontWeight: 600,
                fontSize: 14, cursor: "pointer", fontFamily: "Cinzel,serif", boxShadow: "0 4px 20px rgba(123,47,255,0.35)",
              }}
            >
              ✦ Generate New Report
            </button>
          </div>
        </header>

        {error && (
          <GlassCard
            role="alert"
            style={{
              padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center",
              justifyContent: "space-between", gap: 14, flexWrap: "wrap",
              border: "1px solid rgba(255,100,100,0.3)",
            }}
          >
            <p style={{ margin: 0, color: "var(--nv-danger, #ff8888)", fontSize: 13 }}>{error}</p>
            <button
              onClick={loadReports}
              className="pill-btn tap-scale"
              style={{
                padding: "8px 16px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                border: "1px solid rgba(255,100,100,0.35)", background: "rgba(120,20,20,0.25)",
                color: "var(--nv-danger, #ff9d9d)", fontFamily: "Inter,sans-serif", flexShrink: 0,
              }}
            >
              ↻ Try again
            </button>
          </GlassCard>
        )}

        {reports === null && !error && <SkeletonList rows={viewMode === "grid" ? 6 : 3} variant={viewMode} />}

        {reports?.length === 0 && (
          <EmptyState
            icon="🗂️"
            title="No saved reports yet"
            message="Generate a reading and tap Save Report to build your archive here."
            actionLabel="✦ Generate New Report"
            onAction={() => onNavigate?.("landing")}
          />
        )}

        {reports?.length > 0 && (
          <>
            <SearchFilterBar
              query={searchQuery}
              onQueryChange={setSearchQuery}
              sort={sortKey}
              onSortChange={setSortKey}
              view={viewMode}
              onViewChange={setViewMode}
              resultCount={visibleReports.length}
              totalCount={reports.length}
            />

            {visibleReports.length === 0 ? (
              <EmptyState
                icon="🔍"
                title="No matches found"
                message={`No saved reports match "${searchQuery}". Try a different title, name, or lagna.`}
                actionLabel="Clear search"
                onAction={() => setSearchQuery("")}
                compact
              />
            ) : (
              <div
                ref={gridRef}
                style={
                  viewMode === "grid"
                    ? { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, animation: "fadeIn 0.35s ease both" }
                    : { display: "grid", gap: 14, animation: "fadeIn 0.35s ease both" }
                }
              >
                {visibleReports.map((r) => (
                  <ReportCard
                    key={r.id}
                    report={r}
                    variant={viewMode === "grid" ? "grid" : "row"}
                    onView={onViewReport}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                    onPreview={setPreviewReport}
                    downloading={downloadingId === r.id}
                    deleting={deletingId === r.id}
                    exiting={exitingId === r.id}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this report?"
        message={`"${deleteTarget?.title || "This report"}" will be permanently removed. This can't be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        loading={!!deleteTarget && deletingId === deleteTarget.id}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <ReportPreviewDrawer
        report={previewReport}
        onClose={() => setPreviewReport(null)}
        onView={onViewReport}
        onDownload={handleDownload}
        downloading={!!previewReport && downloadingId === previewReport.id}
      />
    </div>
  );
}

export default SavedReportsPage;
