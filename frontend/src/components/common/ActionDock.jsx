import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import * as reportsApi from "../../utils/reportsApi.js";

// ─────────────────────────────────────────────────────────────────────────
// ActionDock (Priority 5.2)
// Floating glass pill (bottom-right) with "Save Report" and "Download
// PDF" actions on the results stage. Rendered by App.jsx as an overlay
// sibling of ResultsPage — ResultsPage.jsx/ResultsTabs.jsx are never
// modified, so their existing look, tests, and behavior are fully
// preserved. Saving requires a signed-in session (offers to sign in
// inline if not); PDF export works for everyone.
// ─────────────────────────────────────────────────────────────────────────
function ActionDock({ userData, chart, report, onRequireLogin, onOpenAssistant, onOpenHoroscope, onOpenCalendar, onOpenLifeCoach, onOpenMatching, onOpenPanchang, onOpenFestivals, onOpenNotifications }) {
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState(null); // { kind: "saving"|"saved"|"downloading"|"error", message }

  if (!userData || !chart || !report) return null;

  const handleSave = async () => {
    if (!isAuthenticated) {
      onRequireLogin?.();
      return;
    }
    setStatus({ kind: "saving" });
    try {
      await reportsApi.saveReport({ title: `${userData.name}'s Reading`, userData, chart, report });
      setStatus({ kind: "saved", message: "Saved to your dashboard ✓" });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus({ kind: "error", message: err.message || "Could not save the report." });
    }
  };

  const handleDownload = async () => {
    setStatus({ kind: "downloading" });
    try {
      await reportsApi.exportAdHocPdf({ userData, chart, report, title: `${userData.name}'s Reading` });
      setStatus(null);
    } catch (err) {
      setStatus({ kind: "error", message: err.message || "Could not generate the PDF." });
    }
  };

  // V3.0 Phase 6: same PDF bytes as Download, opened in a new tab with the
  // browser print dialog triggered — no new backend endpoint.
  const handlePrint = async () => {
    setStatus({ kind: "printing" });
    try {
      await reportsApi.printAdHocPdf({ userData, chart, report, title: `${userData.name}'s Reading` });
      setStatus(null);
    } catch (err) {
      setStatus({ kind: "error", message: err.message || "Could not open the PDF for printing." });
    }
  };

  const btnStyle = (variant) => ({
    display: "flex", alignItems: "center", gap: 8, padding: "12px 18px",
    borderRadius: 30, fontSize: 13, fontWeight: 600, cursor: "pointer",
    fontFamily: "Inter,sans-serif", border: "1px solid var(--nv-accent-border, rgba(180,120,255,0.35))",
    background: variant === "primary" ? "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))" : "var(--nv-surface-strong, rgba(18,0,38,0.72))",
    color: variant === "primary" ? "var(--nv-text-on-accent, #fff)" : "var(--nv-text-primary, #fff)",
    boxShadow: "var(--nv-shadow-md, 0 4px 20px rgba(80,0,180,0.3))", backdropFilter: "blur(var(--nv-glass-blur-sm, 14px))",
  });

  return (
    <div style={{ position: "fixed", bottom: 18, right: 14, zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
      {status?.message && (
        <div role="status" style={{
          padding: "8px 14px", borderRadius: 10, fontSize: 12, fontFamily: "Inter,sans-serif",
          background: status.kind === "error" ? "rgba(120,20,20,0.85)" : "rgba(20,60,20,0.85)",
          color: status.kind === "error" ? "var(--nv-danger, #ffaaaa)" : "var(--nv-success, #c8ffc8)",
          border: `1px solid ${status.kind === "error" ? "rgba(255,80,80,0.35)" : "rgba(120,255,120,0.35)"}`,
        }}>
          {status.message}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
        {onOpenAssistant && (
          <button onClick={onOpenAssistant} className="pill-btn" style={btnStyle("secondary")}>
            ✨ Ask AI
          </button>
        )}
        {onOpenHoroscope && (
          <button onClick={onOpenHoroscope} className="pill-btn" style={btnStyle("secondary")}>
            🔮 Horoscope
          </button>
        )}
        {onOpenCalendar && (
          <button onClick={onOpenCalendar} className="pill-btn" style={btnStyle("secondary")}>
            📅 Calendar
          </button>
        )}
        {onOpenLifeCoach && (
          <button onClick={onOpenLifeCoach} className="pill-btn" style={btnStyle("secondary")}>
            🧭 Life Coach
          </button>
        )}
        {onOpenMatching && (
          <button onClick={onOpenMatching} className="pill-btn" style={btnStyle("secondary")}>
            💞 Kundli Matching
          </button>
        )}
        {onOpenPanchang && (
          <button onClick={onOpenPanchang} className="pill-btn" style={btnStyle("secondary")}>
            🕉️ Panchang
          </button>
        )}
        {onOpenFestivals && (
          <button onClick={onOpenFestivals} className="pill-btn" style={btnStyle("secondary")}>
            🎉 Festival Calendar
          </button>
        )}
        {onOpenNotifications && (
          <button onClick={onOpenNotifications} className="pill-btn" style={btnStyle("secondary")}>
            🔔 Notifications
          </button>
        )}
        <button onClick={handleSave} className="pill-btn" style={btnStyle("primary")} disabled={status?.kind === "saving"}>
          💾 {status?.kind === "saving" ? "Saving…" : "Save Report"}
        </button>
        <button onClick={handleDownload} className="pill-btn" style={btnStyle("secondary")} disabled={status?.kind === "downloading"}>
          📄 {status?.kind === "downloading" ? "Preparing…" : "Download PDF"}
        </button>
        <button onClick={handlePrint} className="pill-btn" style={btnStyle("secondary")} disabled={status?.kind === "printing"}>
          🖨️ {status?.kind === "printing" ? "Opening…" : "Print PDF"}
        </button>
      </div>
    </div>
  );
}

export default ActionDock;
