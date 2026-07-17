import { useEffect, useState } from "react";
import CosmicBg from "../components/common/CosmicBg.jsx";
import GlassCard from "../components/common/GlassCard.jsx";
import Badge from "../components/common/Badge.jsx";
import ProfilePhotoManager from "../components/common/ProfilePhotoManager.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import * as reportsApi from "../utils/reportsApi.js";
import { GOLD_GRADIENT } from "../constants/astrology.js";

// ─────────────────────────────────────────────────────────────────────────
// ProfilePage (Account Menu Navigation Improvement / Dashboard & Navigation
// Cleanup)
//
// The single, dedicated destination for "My Profile" — profile information
// only, no Dashboard widgets. Built entirely out of pieces that already
// exist elsewhere in the app:
//   - CosmicBg, GlassCard, Badge — the same primitives SettingsPage and
//     DashboardPage already use.
//   - ProfilePhotoManager (Phase 6.3) — the exact same avatar edit control
//     SettingsPage's Account section already uses. No photo-editing logic
//     lives in this file.
//   - "Change Password" reuses the existing, unmodified "forgot-password"
//     stage/flow (ForgotPasswordPage + authApi.requestPasswordReset) —
//     there is no dedicated change-password backend endpoint, so this
//     deliberately does not invent one; it's the same reset-by-email
//     mechanism already reachable from LoginPage, only shown here for
//     email/password accounts (a Google account has no password to
//     change).
//   - Profile Activity Summary reuses the same `reportsApi.listReports()`
//     call as Dashboard/SavedReportsPage — no new endpoint, no duplicated
//     business logic, just a read-only count/date derived client-side.
//
// No backend, auth, astrology engine, prediction/rule engine, or API file
// is touched by this page.
// ─────────────────────────────────────────────────────────────────────────

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

function InfoRow({ label, value }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0",
      borderBottom: "1px solid rgba(180,120,255,0.1)", fontSize: 13.5,
    }}>
      <span style={{ color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>{label}</span>
      <span style={{ color: "var(--nv-text-primary, #e8d5ff)", fontWeight: 600, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <h2 style={{
      margin: "0 0 14px", fontSize: 14, letterSpacing: 1.5, textTransform: "uppercase",
      color: "var(--nv-text-muted, rgba(200,160,255,0.55))", fontWeight: 500,
    }}>
      {children}
    </h2>
  );
}

// Compact stat cell for the Profile Activity Summary — same glass/gold
// vocabulary as GlassCard/Badge, no new colors, fonts, or primitives.
function StatCell({ icon, label, value }) {
  return (
    <div style={{
      padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(180,120,255,0.14)", minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span aria-hidden="true" style={{ fontSize: 13 }}>{icon}</span>
        <span style={{ fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase", color: "var(--nv-text-muted, rgba(200,160,255,0.5))" }}>{label}</span>
      </div>
      <div style={{
        fontSize: 14.5, fontWeight: 700, color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Cinzel,serif",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {value}
      </div>
    </div>
  );
}

function ProfilePage({ onNavigate }) {
  const { user, updateUser } = useAuth();
  const isGoogleAccount = user?.authProvider === "google";
  // Profile Activity Summary — a small, read-only view of the person's own
  // saved-reports activity. Reuses the exact same `reportsApi.listReports()`
  // call DashboardPage/SavedReportsPage already make; no new endpoint, no
  // business logic duplicated (just derived counts/dates from the same
  // list-record shape).
  const [reports, setReports] = useState(null);

  useEffect(() => {
    let cancelled = false;
    reportsApi.listReports()
      .then((r) => { if (!cancelled) setReports(r); })
      .catch(() => { if (!cancelled) setReports([]); });
    return () => { cancelled = true; };
  }, []);

  const lastReport = reports?.length
    ? [...reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
    : null;

  return (
    <div style={{ position: "relative", minHeight: "100vh", padding: "90px 20px 60px" }}>
      <CosmicBg />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto", display: "grid", gap: 22 }}>

        <div>
          <button
            type="button"
            onClick={() => onNavigate?.("dashboard")}
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 6,
              color: "var(--nv-text-secondary, rgba(200,160,255,0.7))", fontSize: 12.5, fontFamily: "Inter,sans-serif",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}
          >
            ← Back to Dashboard
          </button>
          <h1 style={{
            margin: 0, fontSize: 26, fontFamily: "Cinzel,serif", fontWeight: 700,
            background: GOLD_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            My Profile
          </h1>
        </div>

        <GlassCard style={{ padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 22, flexWrap: "wrap" }}>
            <ProfilePhotoManager user={user} onUpdate={updateUser} size={92} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "Cinzel,serif", color: "var(--nv-text-primary, #e8d5ff)", marginBottom: 4 }}>
                {user?.name || "—"}
              </div>
              <div style={{ fontSize: 12, color: "var(--nv-text-muted, rgba(200,160,255,0.5))", marginBottom: 8 }}>
                Click your photo to edit — upload, replace, or remove it.
              </div>
              <Badge color={isGoogleAccount ? "#9dc9ff" : "#bf7fff"}>
                {isGoogleAccount ? "Signed in with Google" : "Email & Password"}
              </Badge>
            </div>
          </div>

          <SectionHeading>Account Information</SectionHeading>
          <InfoRow label="Full Name" value={user?.name || "—"} />
          <InfoRow label="Email" value={user?.email || "—"} />
          <InfoRow label="Member Since" value={formatDate(user?.createdAt)} />
          <InfoRow label="Account Type" value={isGoogleAccount ? "Google" : "Email & Password"} />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
            {!isGoogleAccount && (
              <button
                type="button"
                onClick={() => onNavigate?.("forgot-password")}
                className="pill-btn tap-scale"
                style={{
                  padding: "10px 18px", borderRadius: 20, fontSize: 12.5, cursor: "pointer",
                  border: "1px solid rgba(180,120,255,0.35)", background: "rgba(123,47,255,0.15)",
                  color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif",
                }}
              >
                Change Password
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate?.("settings")}
              className="pill-btn tap-scale"
              style={{
                padding: "10px 18px", borderRadius: 20, fontSize: 12.5, cursor: "pointer",
                border: "1px solid rgba(180,120,255,0.35)", background: "rgba(255,255,255,0.03)",
                color: "var(--nv-text-secondary, rgba(200,160,255,0.85))", fontFamily: "Inter,sans-serif",
              }}
            >
              Edit Profile in Settings →
            </button>
          </div>
        </GlassCard>

        {/* ── Profile Activity Summary ─────────────────────────────────── */}
        <div>
          <SectionHeading>Profile Activity Summary</SectionHeading>
          <GlassCard style={{ padding: 22 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
              <StatCell icon="📜" label="Total Reports" value={reports ? reports.length : "…"} />
              <StatCell icon="🕐" label="Last Generated" value={lastReport ? formatDate(lastReport.createdAt) : "—"} />
            </div>
            {reports?.length > 0 && (
              <button
                type="button"
                onClick={() => onNavigate?.("reports")}
                className="pill-btn tap-scale"
                style={{
                  marginTop: 16, padding: "9px 16px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                  border: "1px solid rgba(180,120,255,0.35)", background: "rgba(123,47,255,0.15)",
                  color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif",
                }}
              >
                View Saved Reports →
              </button>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
