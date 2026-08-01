<<<<<<< HEAD
import { useState } from "react";
=======
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
import { useAuth } from "../../context/AuthContext.jsx";
import * as reportsApi from "../../utils/reportsApi.js";

// ─────────────────────────────────────────────────────────────────────────
<<<<<<< HEAD
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
=======
// ActionDock (Priority 5.2, revised)
// Was: 10 free-floating pill buttons pinned with position:fixed +
// flex-wrap. On narrow screens they wrapped into several rows that sat
// ON TOP of the scrollable page underneath (position:fixed never reserves
// layout space), overlapping cards like ReportSummaryCard/AI Life Summary.
//
// Now: a single round FAB (bottom-right) that expands into a solid,
// blurred bottom sheet listing every action in a tidy 2-column grid, with
// a dimmed backdrop behind it. Nothing overlaps page content unless the
// sheet is deliberately open, and the backdrop makes the boundary between
// dock and page unambiguous. Rendered by App.jsx as an overlay sibling of
// ResultsPage — ResultsPage.jsx/ResultsTabs.jsx are never modified, so
// their existing look, tests, and behavior are fully preserved. Saving
// requires a signed-in session (offers to sign in inline if not); PDF
// export works for everyone.
// ─────────────────────────────────────────────────────────────────────────
function ActionDock({ userData, chart, report, onRequireLogin, onOpenAssistant, onOpenHoroscope, onOpenCalendar, onOpenLifeCoach, onOpenMatching, onOpenPanchang, onOpenFestivals, onOpenNotifications }) {
  const { t } = useTranslation(["navigation"]);
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState(null); // { kind: "saving"|"saved"|"downloading"|"error", message }
  const [open, setOpen] = useState(false);

  // Lock page scroll while the sheet is open so the backdrop reads as a
  // real modal boundary instead of more content peeking out behind it.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!userData || !chart || !report) return null;

  const run = async (kind, fn) => {
    setStatus({ kind });
    try {
      await fn();
    } catch (err) {
      setStatus({ kind: "error", message: err.message || t("navigation:actionDock.somethingWentWrong") });
      return;
    }
  };

  const handleSave = () => {
    if (!isAuthenticated) {
      onRequireLogin?.();
      setOpen(false);
      return;
    }
    run("saving", async () => {
      await reportsApi.saveReport({ title: `${userData.name}'s Reading`, userData, chart, report });
      setStatus({ kind: "saved", message: "Saved to your dashboard ✓" });
      setOpen(false);
      setTimeout(() => setStatus(null), 3000);
    });
  };

  const handleDownload = () => run("downloading", async () => {
    await reportsApi.exportAdHocPdf({ userData, chart, report, title: `${userData.name}'s Reading` });
    setStatus(null);
    setOpen(false);
  });

  // V3.0 Phase 6: same PDF bytes as Download, opened in a new tab with the
  // browser print dialog triggered — no new backend endpoint.
  const handlePrint = () => run("printing", async () => {
    await reportsApi.printAdHocPdf({ userData, chart, report, title: `${userData.name}'s Reading` });
    setStatus(null);
    setOpen(false);
  });

  const openThen = (fn) => () => { setOpen(false); fn?.(); };

  const items = [
    onOpenAssistant && { icon: "✨", label: t("navigation:actionDock.askAi"), onClick: openThen(onOpenAssistant) },
    onOpenHoroscope && { icon: "🔮", label: t("navigation:actionDock.horoscope"), onClick: openThen(onOpenHoroscope) },
    onOpenCalendar && { icon: "📅", label: t("navigation:actionDock.calendar"), onClick: openThen(onOpenCalendar) },
    onOpenLifeCoach && { icon: "🧭", label: t("navigation:actionDock.lifeCoach"), onClick: openThen(onOpenLifeCoach) },
    onOpenMatching && { icon: "💞", label: t("navigation:actionDock.kundliMatching"), onClick: openThen(onOpenMatching) },
    onOpenPanchang && { icon: "🕉️", label: t("navigation:actionDock.panchang"), onClick: openThen(onOpenPanchang) },
    onOpenFestivals && { icon: "🎉", label: t("navigation:actionDock.festivalCalendar"), onClick: openThen(onOpenFestivals) },
    onOpenNotifications && { icon: "🔔", label: t("navigation:actionDock.notifications"), onClick: openThen(onOpenNotifications) },
    { icon: "💾", label: status?.kind === "saving" ? t("navigation:actionDock.saving") : t("navigation:actionDock.saveReport"), onClick: handleSave, primary: true, disabled: status?.kind === "saving" },
    { icon: "📄", label: status?.kind === "downloading" ? t("navigation:actionDock.preparing") : t("navigation:actionDock.downloadPdf"), onClick: handleDownload, disabled: status?.kind === "downloading" },
    { icon: "🖨️", label: status?.kind === "printing" ? t("navigation:actionDock.opening") : t("navigation:actionDock.printPdf"), onClick: handlePrint, disabled: status?.kind === "printing" },
  ].filter(Boolean);

  const itemBtnStyle = (variant, disabled) => ({
    display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
    borderRadius: 14, fontSize: 13, fontWeight: 600, cursor: disabled ? "default" : "pointer",
    fontFamily: "Inter,sans-serif", border: "1px solid var(--nv-accent-border, rgba(180,120,255,0.35))",
    background: variant === "primary" ? "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))" : "var(--nv-surface-strong, rgba(30,10,50,0.9))",
    color: variant === "primary" ? "var(--nv-text-on-accent, #fff)" : "var(--nv-text-primary, #fff)",
    opacity: disabled ? 0.6 : 1, width: "100%", textAlign: "left",
  });

  return (
    <>
      {/* Dimmed backdrop — only present while the sheet is open, so it's
          visually obvious the dock is a distinct overlay and not part of
          the page flow underneath it. */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          aria-hidden="true"
          style={{ position: "fixed", inset: 0, background: "rgba(5,0,15,0.55)", backdropFilter: "blur(2px)", zIndex: 999 }}
        />
      )}

      {status?.message && (
        <div role="status" style={{
          position: "fixed", bottom: open ? "auto" : 92, top: open ? 18 : "auto", insetInlineEnd: 14, zIndex: 1001,
          padding: "8px 14px", borderRadius: 10, fontSize: 12, fontFamily: "Inter,sans-serif",
          background: status.kind === "error" ? "rgba(120,20,20,0.92)" : "rgba(20,60,20,0.92)",
          color: status.kind === "error" ? "var(--nv-danger, #ffaaaa)" : "var(--nv-success, #c8ffc8)",
          border: `1px solid ${status.kind === "error" ? "rgba(255,80,80,0.35)" : "rgba(120,255,120,0.35)"}`,
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)", maxWidth: "min(320px, calc(100vw - 28px))",
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
        }}>
          {status.message}
        </div>
      )}
<<<<<<< HEAD
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
=======

      {/* Bottom sheet — solid, contained, and only ever occupies the strip
          it explicitly reserves, so it can never overlap page text. */}
      {open && (
        <div
          role="dialog"
          aria-label={t("navigation:actionDock.reportActions")}
          style={{
            position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1000,
            maxHeight: "70vh", overflowY: "auto",
            background: "var(--nv-surface-strong, rgba(18,0,38,0.97))",
            backdropFilter: "blur(var(--nv-glass-blur-sm, 14px))",
            borderTop: "1px solid var(--nv-accent-border, rgba(180,120,255,0.35))",
            borderRadius: "18px 18px 0 0",
            boxShadow: "0 -8px 30px rgba(0,0,0,0.45)",
            padding: "14px 16px calc(16px + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5, color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif" }}>
              {t("navigation:actionDock.reportActions")}
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label={t("navigation:actionDock.close")}
              style={{ border: "none", background: "transparent", color: "var(--nv-text-secondary, rgba(230,220,255,0.75))", fontSize: 18, cursor: "pointer", lineHeight: 1, padding: 4 }}
            >
              ✕
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
            {items.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                disabled={item.disabled}
                className="pill-btn tap-scale"
                style={itemBtnStyle(item.primary ? "primary" : "secondary", item.disabled)}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Collapsed FAB — the only thing on screen until tapped. */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label={t("navigation:actionDock.openReportActions")}
          aria-expanded={open}
          className="tap-scale"
          style={{
            position: "fixed", bottom: 18, insetInlineEnd: 14, zIndex: 1000,
            width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid var(--nv-accent-border, rgba(180,120,255,0.35))",
            background: "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))",
            color: "var(--nv-text-on-accent, #fff)", fontSize: 22, cursor: "pointer",
            boxShadow: "var(--nv-shadow-md, 0 4px 20px rgba(80,0,180,0.4))",
          }}
        >
          ✨
        </button>
      )}
    </>
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  );
}

export default ActionDock;
