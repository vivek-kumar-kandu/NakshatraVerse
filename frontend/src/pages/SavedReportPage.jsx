import { useEffect, useState } from "react";
import ResultsPage from "./ResultsPage.jsx";
import CosmicBg from "../components/common/CosmicBg.jsx";
import * as reportsApi from "../utils/reportsApi.js";
import { SkeletonBlock } from "../components/common/Skeleton.jsx";

// ─────────────────────────────────────────────────────────────────────────
// SavedReportPage (Priority 5.2)
// Fetches a saved report by id and renders it through the existing,
// unmodified ResultsPage component — same tabs, same visuals, same
// component the person saw right after generating the reading. This
// reuse means "view a previous report" needed zero new UI code beyond
// mapping the saved record's shape onto ResultsPage's existing props.
// ─────────────────────────────────────────────────────────────────────────
function SavedReportPage({ reportId, onBack, onOpenAssistant, onOpenHoroscope, onOpenCalendar, onOpenLifeCoach }) {
  const [record, setRecord] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    reportsApi.getReport(reportId)
      .then((r) => { if (!cancelled) setRecord(r); })
      .catch((err) => { if (!cancelled) setError(err.message || "Could not load that report."); });
    return () => { cancelled = true; };
  }, [reportId]);

  if (error) {
    return (
      <div style={{ minHeight: "100vh", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter,sans-serif" }}>
        <CosmicBg />
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", color: "var(--nv-danger, #ffaaaa)" }}>
          <p>{error}</p>
          <button onClick={onBack} className="pill-btn" style={{ background: "none", border: "1px solid rgba(180,120,255,0.35)", color: "var(--nv-text-primary, #e8d5ff)", padding: "10px 20px", borderRadius: 20, cursor: "pointer" }}>
            ← Back to Saved Reports
          </button>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div style={{ minHeight: "100vh", position: "relative", fontFamily: "Inter,sans-serif" }}>
        <CosmicBg animated />
        <div style={{
          position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto",
          padding: "84px 16px 60px", display: "grid", gap: 20,
        }}>
          <p role="status" aria-live="polite" style={{ margin: 0, color: "var(--nv-text-muted, rgba(200,160,255,0.6))", fontSize: 13 }}>
            Loading your saved reading…
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <SkeletonBlock width={52} height={52} radius="50%" />
            <div style={{ display: "grid", gap: 8, flex: 1 }}>
              <SkeletonBlock width="35%" height={20} />
              <SkeletonBlock width="55%" height={12} />
            </div>
          </div>
          <SkeletonBlock width="100%" height={44} radius={40} />
          <SkeletonBlock width="100%" height={220} radius={16} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={onBack}
        className="pill-btn"
        style={{
          position: "fixed", top: 16, left: 16, zIndex: 998,
          background: "rgba(20,0,40,0.55)", border: "1px solid rgba(180,120,255,0.35)",
          color: "var(--nv-text-primary, #e8d5ff)", padding: "10px 18px", borderRadius: 20, cursor: "pointer",
          fontSize: 13, fontFamily: "Inter,sans-serif", backdropFilter: "blur(var(--nv-glass-blur-sm, 14px))",
        }}
      >
        ← Back to Saved Reports
      </button>
      {(onOpenAssistant || onOpenHoroscope || onOpenCalendar || onOpenLifeCoach) && (
        <div style={{ position: "fixed", bottom: 18, right: 14, zIndex: 998, display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {onOpenHoroscope && (
            <button
              onClick={() => onOpenHoroscope({ userData: record.userData, chart: record.chart, report: record.report })}
              className="pill-btn"
              style={{
                background: "var(--nv-surface-strong, rgba(18,0,38,0.72))", border: "1px solid var(--nv-surface-border, rgba(180,120,255,0.35))",
                color: "var(--nv-text-primary, #fff)", padding: "12px 18px", borderRadius: 30, cursor: "pointer",
                fontSize: 13, fontWeight: 600, fontFamily: "Inter,sans-serif", boxShadow: "var(--nv-shadow-md, 0 4px 20px rgba(80,0,180,0.3))",
                backdropFilter: "blur(var(--nv-glass-blur-sm, 14px))",
              }}
            >
              🔮 Horoscope
            </button>
          )}
          {onOpenCalendar && (
            <button
              onClick={() => onOpenCalendar({ userData: record.userData, chart: record.chart, report: record.report })}
              className="pill-btn"
              style={{
                background: "var(--nv-surface-strong, rgba(18,0,38,0.72))", border: "1px solid var(--nv-surface-border, rgba(180,120,255,0.35))",
                color: "var(--nv-text-primary, #fff)", padding: "12px 18px", borderRadius: 30, cursor: "pointer",
                fontSize: 13, fontWeight: 600, fontFamily: "Inter,sans-serif", boxShadow: "var(--nv-shadow-md, 0 4px 20px rgba(80,0,180,0.3))",
                backdropFilter: "blur(var(--nv-glass-blur-sm, 14px))",
              }}
            >
              📅 Calendar
            </button>
          )}
          {onOpenLifeCoach && (
            <button
              onClick={() => onOpenLifeCoach({ userData: record.userData, chart: record.chart, report: record.report })}
              className="pill-btn"
              style={{
                background: "var(--nv-surface-strong, rgba(18,0,38,0.72))", border: "1px solid var(--nv-surface-border, rgba(180,120,255,0.35))",
                color: "var(--nv-text-primary, #fff)", padding: "12px 18px", borderRadius: 30, cursor: "pointer",
                fontSize: 13, fontWeight: 600, fontFamily: "Inter,sans-serif", boxShadow: "var(--nv-shadow-md, 0 4px 20px rgba(80,0,180,0.3))",
                backdropFilter: "blur(var(--nv-glass-blur-sm, 14px))",
              }}
            >
              🧭 Life Coach
            </button>
          )}
          {onOpenAssistant && (
            <button
              onClick={() => onOpenAssistant({ userData: record.userData, chart: record.chart, report: record.report })}
              className="pill-btn"
              style={{
                background: "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))", border: "1px solid rgba(180,120,255,0.35)",
                color: "var(--nv-text-on-accent, #fff)", padding: "12px 18px", borderRadius: 30, cursor: "pointer",
                fontSize: 13, fontWeight: 600, fontFamily: "Inter,sans-serif", boxShadow: "0 4px 20px rgba(80,0,180,0.3)",
                backdropFilter: "blur(var(--nv-glass-blur-sm, 14px))",
              }}
            >
              ✨ Ask AI
            </button>
          )}
        </div>
      )}
      <ResultsPage
        userData={record.userData}
        report={record.report}
        planetary={record.chart?.planetary}
        numerology={record.chart?.numerology}
        error={null}
      />
    </div>
  );
}

export default SavedReportPage;
