import { useEffect, useRef } from "react";
import Badge from "./Badge.jsx";
import { zodiacSymbol } from "../../utils/reportDisplay.js";

// ─────────────────────────────────────────────────────────────────────────
// ReportPreviewDrawer (Phase 4 — Dashboard & Report Management)
//
// A quick "peek" at a saved report's metadata (title, birth name, date of
// birth, lagna) without leaving the Dashboard or firing a new API call —
// every field it shows already exists on the same lightweight record
// `reportsApi.listReports()` returns (`{ id, title, name, dob, lagna,
// createdAt }`). "View Full Report" still hands off to the exact same
// `onViewReport(id)` → `SavedReportPage` flow as the existing View button;
// this drawer only adds a faster way to sanity-check *which* report you're
// about to open when you have several saved.
// ─────────────────────────────────────────────────────────────────────────

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

function ReportPreviewDrawer({ report, onClose, onView, onDownload, downloading }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!report) return;
    panelRef.current?.focus();
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [report, onClose]);

  if (!report) return null;
  const r = report;

  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 2500,
        background: "var(--nv-overlay-scrim, rgba(5,0,15,0.55))", backdropFilter: "blur(var(--nv-scrim-blur, 4px))", WebkitBackdropFilter: "blur(var(--nv-scrim-blur, 4px))",
        animation: "fadeIn 0.18s ease both",
      }}
    >
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Preview of ${r.title}`}
        className="report-preview-drawer"
        style={{
          position: "absolute", top: 0, right: 0, bottom: 0, width: "min(360px, 100%)",
          background: "rgba(14,0,32,0.96)", borderLeft: "1px solid rgba(180,120,255,0.25)",
          boxShadow: "-16px 0 50px rgba(0,0,0,0.45)",
          // V1.0 RC polish: paddingTop now adds the device's safe-area
          // inset (notches / dynamic islands on mobile) on top of the
          // original 28px, instead of the header row sitting flush under
          // it. `env()` falls back to 0px on devices/browsers that don't
          // support it, so this is a strict no-op everywhere else.
          padding: "calc(28px + env(safe-area-inset-top, 0px)) 24px 28px",
          display: "flex", flexDirection: "column", gap: 18, overflowY: "auto",
        }}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 14, flexShrink: 0,
        }}>
          <div
            aria-hidden="true"
            style={{
              width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, var(--nv-accent-wash-strong, rgba(123,47,255,0.4)), rgba(255,180,0,0.2))",
              border: "1px solid rgba(255,215,0,0.35)", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 22, color: "var(--nv-color-brand-gold, #ffd700)",
              boxShadow: "0 0 20px var(--nv-accent-wash-strong, rgba(123,47,255,0.4))",
            }}
          >
            {zodiacSymbol(r.lagna)}
          </div>
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="tap-scale icon-btn"
            style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(180,120,255,0.25)",
              color: "var(--nv-text-primary, #e8d5ff)", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 14,
              flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>


        <div>
          <h2 style={{ margin: "0 0 6px", fontSize: 19, color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Cinzel,serif" }}>{r.title}</h2>
          <p style={{ margin: 0, fontSize: 12, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>saved {formatDate(r.createdAt)}</p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {r.name && <Badge color="#9dc9ff">👤 {r.name}</Badge>}
          {r.dob && <Badge color="#bf7fff">🎂 {formatDate(r.dob)}</Badge>}
          {r.lagna && <Badge color="#ffd700">{zodiacSymbol(r.lagna)} {r.lagna} Lagna</Badge>}
          {!r.name && !r.dob && !r.lagna && (
            <p style={{
              margin: 0, display: "flex", alignItems: "center", gap: 8,
              fontSize: 12, color: "var(--nv-text-muted, rgba(200,160,255,0.5))",
            }}>
              <span aria-hidden="true">✦</span> No additional details saved for this report.
            </p>
          )}
        </div>

        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>
          This is a quick preview of your saved reading's details. Open the full report to read every
          section — Love, Career, Wealth, Health, Doshas &amp; Yogas, Remedies, and your Life Summary.
        </p>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={() => onView(r.id)}
            className="submit-btn tap-scale"
            style={{
              padding: "13px 20px", borderRadius: 30, border: "1px solid rgba(180,120,255,0.45)",
              background: "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))", color: "var(--nv-text-on-accent, #fff)", fontWeight: 600,
              fontSize: 13.5, cursor: "pointer", fontFamily: "Cinzel,serif",
            }}
          >
            ✦ View Full Report
          </button>
          <button
            onClick={() => onDownload(r.id, r.title)}
            disabled={downloading}
            className="pill-btn tap-scale"
            style={{
              padding: "12px 20px", borderRadius: 30, cursor: downloading ? "default" : "pointer",
              border: "1px solid var(--nv-accent-border, rgba(180,120,255,0.35))", background: "var(--nv-accent-wash, rgba(123,47,255,0.15))",
              color: "var(--nv-text-primary, #e8d5ff)", fontSize: 13, fontFamily: "Inter,sans-serif",
            }}
          >
            {downloading ? "Preparing PDF…" : "⭳ Download PDF"}
          </button>
        </div>
      </aside>
    </div>
  );
}

export default ReportPreviewDrawer;
