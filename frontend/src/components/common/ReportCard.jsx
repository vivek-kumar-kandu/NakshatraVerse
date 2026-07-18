import { memo } from "react";
import GlassCard from "./GlassCard.jsx";
import Badge from "./Badge.jsx";
import { zodiacSymbol } from "../../utils/reportDisplay.js";

// ─────────────────────────────────────────────────────────────────────────
// ReportCard (Phase 4 — Dashboard & Report Management)
//
// A single, reusable presentation of a saved-report record
// (`{ id, title, name, dob, lagna, createdAt }` — the exact shape
// `reportsApi.listReports()` has always returned; no field added, removed,
// or renamed) in three layouts:
//   - "recent" — compact strip card, used by Dashboard's Recent Reports rail
//   - "grid"   — full card, used by Saved Reports' grid view
//   - "row"    — horizontal list row, used by Saved Reports' list view
//     (visually replaces the old inline row markup that used to live
//     directly in DashboardPage.jsx — same actions, same handlers, same
//     backend calls, just componentized and restyled)
//
// Every action (`onView`/`onDownload`/`onDelete`/`onPreview`) is a plain
// callback supplied by the caller — this component never calls
// `reportsApi` itself and never owns any report data. Purely presentational
// and reusable, exactly like `GlassCard`/`Badge` already are.
// ─────────────────────────────────────────────────────────────────────────

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

const iconBtnStyle = (variant) => ({
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
  padding: "8px 14px", borderRadius: "var(--nv-radius-pill, 20px)", fontSize: 12, fontWeight: 600, cursor: "pointer",
  fontFamily: "var(--nv-font-body, Inter,sans-serif)", whiteSpace: "nowrap",
  border: variant === "danger" ? "1px solid var(--nv-danger-border, rgba(255,100,100,0.35))" : "1px solid var(--nv-accent-border, rgba(180,120,255,0.35))",
  background: variant === "danger" ? "var(--nv-danger-bg, rgba(120,20,20,0.25))" : "var(--nv-accent-wash, rgba(123,47,255,0.15))",
  color: variant === "danger" ? "var(--nv-danger, #ff9d9d)" : "var(--nv-text-primary, #e8d5ff)",
});

function MiniSpinner() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block", width: 11, height: 11, borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "currentColor",
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
}

function ActionButton({ variant, busy, onClick, label, icon, disabled, busyLabel = "…" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      aria-label={busy ? busyLabel : label}
      aria-busy={busy || undefined}
      title={busy ? busyLabel : label}
      className="pill-btn tap-scale"
      style={iconBtnStyle(variant)}
    >
      {busy ? <MiniSpinner /> : <span aria-hidden="true">{icon}</span>}
      <span className="report-card-action-label">{busy ? busyLabel : label}</span>
    </button>
  );
}

function Emblem({ lagna, size = 44 }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        background: "linear-gradient(135deg, rgba(123,47,255,0.35), rgba(255,180,0,0.18))",
        border: "1px solid rgba(255,215,0,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.42, color: "var(--nv-color-brand-gold, #ffd700)",
        boxShadow: "0 0 16px rgba(123,47,255,0.35)",
      }}
    >
      {zodiacSymbol(lagna)}
    </div>
  );
}

function ReportCard({
  report,
  variant = "grid",
  onView,
  onDownload,
  onDelete,
  onPreview,
  downloading = false,
  deleting = false,
  // Phase 4 polish: true for the brief window between a successful delete
  // and the report actually being removed from the list, so the card can
  // play its fade+slide exit animation before it disappears. Ignored by
  // the "recent" variant, which never offers delete.
  exiting = false,
}) {
  const r = report;
  const metaLine = [r.name, r.dob, r.lagna].filter(Boolean).join(" · ");
  // `data-flip-id` lets DashboardPage's FLIP position measurement find
  // this exact card across renders so the *remaining* cards can animate
  // smoothly into their new spot once a deleted one is gone — purely a
  // measurement hook, no visual effect on its own.
  const flipProps = { "data-flip-id": r.id };
  const exitClass = exiting ? " report-card-exit" : "";

  if (variant === "recent") {
    return (
      <GlassCard
        className="tap-scale report-card-recent"
        style={{ padding: 16, minWidth: 232, flex: "0 0 auto", display: "grid", gap: 10 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Emblem lagna={r.lagna} size={36} />
          <div style={{ minWidth: 0 }}>
            <h3 style={{
              margin: 0, fontSize: 14, color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Cinzel,serif",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {r.title}
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>
              saved {formatDate(r.createdAt)}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <ActionButton label="View" icon="👁" onClick={() => onView(r.id)} />
          {onDownload && (
            <ActionButton label="PDF" icon="⭳" busy={downloading} onClick={() => onDownload(r.id, r.title)} />
          )}
        </div>
      </GlassCard>
    );
  }

  if (variant === "row") {
    return (
      <GlassCard
        {...flipProps}
        className={`tap-scale${exitClass}`}
        style={{
          padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 16, flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, flex: 1 }}>
          <Emblem lagna={r.lagna} />
          <div style={{ minWidth: 0 }}>
            <h3 style={{
              margin: "0 0 4px", fontSize: 16, color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Cinzel,serif",
              overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {r.title}
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: "var(--nv-text-muted, rgba(200,160,255,0.55))", overflow: "hidden", textOverflow: "ellipsis" }}>
              {metaLine} · saved {formatDate(r.createdAt)}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
          {onPreview && <ActionButton label="Preview" icon="◎" onClick={() => onPreview(r)} />}
          <ActionButton label="View" icon="👁" onClick={() => onView(r.id)} />
          <ActionButton label="PDF" icon="⭳" busy={downloading} onClick={() => onDownload(r.id, r.title)} />
          <ActionButton variant="danger" label="Delete" busyLabel="Deleting…" icon="✕" busy={deleting} onClick={() => onDelete(r.id, r.title)} />
        </div>
      </GlassCard>
    );
  }

  // "grid" (default) — full premium card.
  return (
    <GlassCard {...flipProps} className={`tap-scale report-card-grid${exitClass}`} style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{
        padding: "16px 20px", display: "flex", alignItems: "center", gap: 12,
        background: "linear-gradient(135deg, rgba(123,47,255,0.22), rgba(255,180,0,0.08))",
        borderBottom: "1px solid var(--nv-surface-border, rgba(180,120,255,0.16))",
      }}>
        <Emblem lagna={r.lagna} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 style={{
            margin: 0, fontSize: 15.5, color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Cinzel,serif",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {r.title}
          </h3>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>
            saved {formatDate(r.createdAt)}
          </p>
        </div>
      </div>

      <div style={{ padding: "16px 20px", display: "flex", flexWrap: "wrap", gap: 8, flex: 1 }}>
        {r.name && <Badge color="#9dc9ff">{r.name}</Badge>}
        {r.dob && <Badge color="#bf7fff">{formatDate(r.dob)}</Badge>}
        {r.lagna && <Badge color="#ffd700">{zodiacSymbol(r.lagna)} {r.lagna}</Badge>}
      </div>

      <div style={{ padding: "14px 20px 18px", display: "flex", gap: 8, flexWrap: "wrap", borderTop: "1px solid var(--nv-accent-wash, rgba(180,120,255,0.1))" }}>
        {onPreview && <ActionButton label="Preview" icon="◎" onClick={() => onPreview(r)} />}
        <ActionButton label="View" icon="👁" onClick={() => onView(r.id)} />
        <ActionButton label="PDF" icon="⭳" busy={downloading} onClick={() => onDownload(r.id, r.title)} />
        <ActionButton variant="danger" label="Delete" busyLabel="Deleting…" icon="✕" busy={deleting} onClick={() => onDelete(r.id, r.title)} />
      </div>
    </GlassCard>
  );
}

export default memo(ReportCard);
