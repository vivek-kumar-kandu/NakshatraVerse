import { useState, useEffect, memo } from "react";
import { useTranslation } from "react-i18next";
import CosmicBg from "../components/common/CosmicBg.jsx";
import GlassCard from "../components/common/GlassCard.jsx";
import Navbar from "../components/common/Navbar.jsx";
import Footer from "../components/common/Footer.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { GOLD_GRADIENT } from "../constants/astrology.js";
import * as reportsApi from "../utils/reportsApi.js";
import { formatDate as formatDateIntl } from "../utils/localeFormat.js";
import StatCard from "../components/common/dashboard/StatCard.jsx";
import ActivityCard from "../components/common/dashboard/ActivityCard.jsx";
import QuickActionCard from "../components/common/dashboard/QuickActionCard.jsx";
import SectionHeader from "../components/common/dashboard/SectionHeader.jsx";

// ─────────────────────────────────────────────────────────────────────────
// HomePage (Priority 6.1) — the new premium marketing/landing experience
// shown right after SplashScreen, for every visitor (guest or already
// signed in). It is intentionally a *different* component from the
// existing pages/LandingPage.jsx (the birth-details form, still reached
// exactly as before via LoginPage/SignupPage's unchanged "← Back to home"
// link, or via the "New Reading" button on Dashboard) — nothing about
// that existing guest flow, Login, Signup, Dashboard, or Results changes.
//
// Adapts to auth state:
//   Guest:      Hero → "Get Started" / "Sign In"; Navbar → Sign In / Get Started
//   Logged-in:  Hero → "Welcome Back" / "Go to Dashboard"; Navbar → Dashboard/Reports/Profile/Logout
// (Reports/Profile both route to the existing Dashboard — see Navbar.jsx.)
//
// Same visual vocabulary as the rest of the app: CosmicBg, GlassCard,
// GOLD_GRADIENT text, the existing fadeIn/glow/floatUp keyframes from
// global.css — no new dependencies, no changes to global.css.
// ─────────────────────────────────────────────────────────────────────────

const FEATURE_ICONS = ["🪐", "🔭", "🔢", "💼", "💕", "🌿", "💰", "✨", "🧿", "🪬"];
const WHY_US_ICONS = ["🕉️", "🤖", "🔒", "💾", "📄", "📱"];

function SectionEyebrow({ children }) {
  return (
    <div style={{ fontSize: 13, letterSpacing: 3, textTransform: "uppercase", color: "var(--nv-text-muted, rgba(200,160,255,0.55))", marginBottom: 10, fontWeight: 600, textAlign: "center" }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 className="nv-heading-glow" style={{
      margin: "0 0 14px", fontSize: "clamp(24px,4.5vw,36px)", fontWeight: 700, textAlign: "center",
      background: GOLD_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      fontFamily: "Cinzel,serif",
    }}>
      {children}
    </h2>
  );
}

function FaqItem({ item, open, onToggle }) {
  return (
    <GlassCard style={{ padding: 0, overflow: "hidden" }}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        style={{
          width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer",
          padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, color: "var(--nv-text-primary, #e8d5ff)", fontSize: 15, fontWeight: 600, fontFamily: "Inter,sans-serif",
        }}
      >
        <span>{item.q}</span>
        <span aria-hidden="true" style={{ color: "#ffd700", fontSize: 18, flexShrink: 0, transform: open ? "rotate(45deg)" : "none", transition: "transform var(--nv-duration-base) var(--nv-ease-standard)" }}>+</span>
      </button>
      {open && (
        <p style={{ margin: 0, padding: "0 22px 18px", fontSize: 14, lineHeight: 1.6, color: "var(--nv-text-secondary, rgba(200,160,255,0.75))", animation: "fadeIn 0.25s ease both" }}>
          {item.a}
        </p>
      )}
    </GlassCard>
  );
}

function formatDate(value, lang) {
  if (!value) return "—";
  return formatDateIntl(value, lang, { year: "numeric", month: "short", day: "numeric" });
}

function HomePage({ onNavigate, onLogout }) {
  const { t } = useTranslation(["home"]);
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const [openFaq, setOpenFaq] = useState(0);

  const featureItems = t("home:features.items", { returnObjects: true });
  const features = FEATURE_ICONS.map((icon, i) => ({ icon, ...featureItems[i] }));
  const flowSteps = t("home:howItWorks.steps", { returnObjects: true });
  const whyUsItems = t("home:whyUs.items", { returnObjects: true });
  const whyUs = WHY_US_ICONS.map((icon, i) => ({ icon, ...whyUsItems[i] }));
  const faqs = t("home:faq.items", { returnObjects: true });

  // Quick Summary (Reports Generated / Last Generated Report) — the
  // logged-in Home overview's only data need. Reuses the exact same
  // `reportsApi.listReports()` call Dashboard already makes (existing,
  // unchanged endpoint) — no new API, no astrology calculation here, just
  // a lightweight read of report metadata (id/title/createdAt/...) for a
  // one-line "Welcome Back" summary. Guests never trigger this (it only
  // runs once `isAuthenticated` is true).
  const [reports, setReports] = useState(null);
  useEffect(() => {
    if (!isAuthenticated) { setReports(null); return undefined; }
    let cancelled = false;
    reportsApi.listReports()
      .then((r) => { if (!cancelled) setReports(r); })
      .catch(() => { if (!cancelled) setReports([]); });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const lastReport = reports?.length
    ? [...reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
    : null;

  return (
    <div style={{ minHeight: "100vh", position: "relative", fontFamily: "Inter,sans-serif" }}>
      <CosmicBg animated />

      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar
          isAuthenticated={isAuthenticated}
          userName={user?.name}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section id="home-hero" style={{ padding: "clamp(60px,10vw,110px) 20px 70px", textAlign: "center" }}>
          <div className="nv-hero-glow-wrap"><div aria-hidden="true" style={{ fontSize: 60, marginBottom: 16, animation: "glow 3s infinite", display: "inline-block" }}>🪐</div></div>

          {isAuthenticated ? (
            <>
              <h1 className="nv-heading-glow" style={{ margin: "0 0 14px", fontSize: "clamp(32px,6vw,58px)", fontWeight: 700, letterSpacing: 1,
                background: GOLD_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "Cinzel,serif" }}>
                {user?.name ? t("home:hero.welcomeBackNamed", { name: user.name.split(" ")[0] }) : t("home:hero.welcomeBack")}
              </h1>
              <p style={{ margin: "0 auto 30px", maxWidth: 560, fontSize: "clamp(15px,2.5vw,18px)", color: "var(--nv-text-secondary, rgba(200,160,255,0.75))" }}>
                {t("home:hero.welcomeBackSubtitle")}
              </p>

              {/* ── Quick Summary ─────────────────────────────────────── */}
              <div style={{ maxWidth: 640, margin: "0 auto 30px", textAlign: "left" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: reports === null || lastReport ? 14 : 0 }}>
                  <StatCard icon="🗓️" label={t("home:quickSummary.memberSince")} value={formatDate(user?.createdAt, language)} accent="#9dc9ff" />
                  <StatCard icon="📜" label={t("home:quickSummary.reportsGenerated")} value={reports === null ? "…" : reports.length} accent="#bf7fff" />
                </div>
                {lastReport && (
                  <ActivityCard
                    icon="🌙"
                    title={lastReport.title || t("home:quickSummary.latestReading")}
                    subtitle={t("home:quickSummary.lastGeneratedReport", { date: formatDate(lastReport.createdAt, language) })}
                    onClick={() => onNavigate("reports")}
                  />
                )}
              </div>

              {/* ── Quick Actions ─────────────────────────────────────── */}
              <div style={{ maxWidth: 640, margin: "0 auto 34px", textAlign: "left" }}>
                <SectionHeader style={{ justifyContent: "center", textAlign: "center" }}>{t("home:quickActions.heading")}</SectionHeader>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
                  <QuickActionCard icon="✦" label={t("home:quickActions.generateNew")} onClick={() => onNavigate("landing")} primary />
                  <QuickActionCard icon="📚" label={t("home:quickActions.savedReports")} onClick={() => onNavigate("reports")} />
                  <QuickActionCard icon="👤" label={t("home:quickActions.myProfile")} onClick={() => onNavigate("profile")} />
                </div>
              </div>

              <button
                onClick={() => onNavigate("dashboard")}
                className="submit-btn"
                style={{
                  padding: "16px 34px", borderRadius: 50, border: "1px solid rgba(180,120,255,0.45)",
                  background: "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))", color: "var(--nv-text-on-accent, #fff)", fontWeight: 700,
                  fontSize: 16, cursor: "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1,
                  boxShadow: "0 4px 28px rgba(123,47,255,0.4)",
                }}
              >
                {t("home:hero.continueToDashboard")}
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, letterSpacing: 3, textTransform: "uppercase", color: "var(--nv-text-muted, rgba(200,160,255,0.55))", marginBottom: 14, fontWeight: 600 }}>
                {t("home:hero.eyebrow")}
              </div>
              <h1 className="nv-heading-glow" style={{ margin: "0 0 14px", fontSize: "clamp(32px,6.5vw,58px)", fontWeight: 700, letterSpacing: 1,
                background: GOLD_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "Cinzel,serif" }}>
                {t("home:hero.guestTitle")}
              </h1>
              <p style={{ margin: "0 auto 34px", maxWidth: 560, fontSize: "clamp(15px,2.5vw,18px)", color: "var(--nv-text-secondary, rgba(200,160,255,0.75))" }}>
                {t("home:hero.guestSubtitle")}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
                <button
                  onClick={() => onNavigate("signup")}
                  className="submit-btn"
                  style={{
                    padding: "16px 34px", borderRadius: 50, border: "1px solid rgba(180,120,255,0.45)",
                    background: "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))", color: "var(--nv-text-on-accent, #fff)", fontWeight: 700,
                    fontSize: 16, cursor: "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1,
                    boxShadow: "0 4px 28px rgba(123,47,255,0.4)",
                  }}
                >
                  {t("home:hero.getStarted")}
                </button>
                <button
                  onClick={() => onNavigate("login")}
                  style={{
                    padding: "16px 34px", borderRadius: 50, border: "1px solid rgba(180,120,255,0.35)",
                    background: "transparent", color: "var(--nv-text-primary, rgba(220,190,255,0.9))", fontWeight: 600,
                    fontSize: 16, cursor: "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1,
                  }}
                >
                  {t("home:hero.signIn")}
                </button>
              </div>
            </>
          )}
        </section>

        {/* ── About ────────────────────────────────────────────────── */}
        <section id="about" style={{ padding: "50px 20px", maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
          <SectionEyebrow>{t("home:about.eyebrow")}</SectionEyebrow>
          <SectionTitle>{t("home:about.title")}</SectionTitle>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.8, color: "var(--nv-text-secondary, rgba(200,160,255,0.75))" }}>
            {t("home:about.body")}
          </p>
        </section>

        {/* ── Features ─────────────────────────────────────────────── */}
        <section id="features" style={{ padding: "50px 20px", maxWidth: 1100, margin: "0 auto" }}>
          <SectionEyebrow>{t("home:features.eyebrow")}</SectionEyebrow>
          <SectionTitle>{t("home:features.title")}</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginTop: 30 }}>
            {features.map(f => (
              <GlassCard key={f.label} style={{ padding: 20 }}>
                <div aria-hidden="true" style={{ fontSize: 26, marginBottom: 10 }}>{f.icon}</div>
                <h3 style={{ margin: "0 0 6px", fontSize: 15, color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Cinzel,serif" }}>{f.label}</h3>
                <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>{f.desc}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* ── How It Works ─────────────────────────────────────────── */}
        <section id="how-it-works" style={{ padding: "50px 20px", maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <SectionEyebrow>{t("home:howItWorks.eyebrow")}</SectionEyebrow>
          <SectionTitle>{t("home:howItWorks.title")}</SectionTitle>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 24 }}>
            {flowSteps.map((step, i) => (
              <div key={step} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  padding: "16px 20px", borderRadius: 14, minWidth: 130,
                  background: "rgba(123,47,255,0.12)", border: "1px solid rgba(180,120,255,0.25)",
                  color: "var(--nv-text-primary, #e8d5ff)", fontSize: 14, fontWeight: 600, fontFamily: "Inter,sans-serif",
                }}>
                  {step}
                </div>
                {i < flowSteps.length - 1 && (
                  <span aria-hidden="true" style={{ color: "#ffd700", fontSize: 20 }}>→</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Why Choose Us ────────────────────────────────────────── */}
        <section id="why-us" style={{ padding: "50px 20px", maxWidth: 1100, margin: "0 auto" }}>
          <SectionEyebrow>{t("home:whyUs.eyebrow")}</SectionEyebrow>
          <SectionTitle>{t("home:whyUs.title")}</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 30 }}>
            {whyUs.map(f => (
              <GlassCard key={f.label} style={{ padding: 20, display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span aria-hidden="true" style={{ fontSize: 24, flexShrink: 0 }}>{f.icon}</span>
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: 14, color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Cinzel,serif" }}>{f.label}</h3>
                  <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>{f.desc}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <section id="faq" style={{ padding: "50px 20px", maxWidth: 780, margin: "0 auto" }}>
          <SectionEyebrow>{t("home:faq.eyebrow")}</SectionEyebrow>
          <SectionTitle>{t("home:faq.title")}</SectionTitle>
          <div style={{ display: "grid", gap: 12, marginTop: 24 }}>
            {faqs.map((item, i) => (
              <FaqItem key={item.q} item={item} open={openFaq === i} onToggle={() => setOpenFaq(o => (o === i ? -1 : i))} />
            ))}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <section style={{ padding: "60px 20px" }}>
          <GlassCard style={{ maxWidth: 700, margin: "0 auto", padding: "clamp(32px,6vw,48px)", textAlign: "center" }}>
            <h2 style={{ margin: "0 0 12px", fontSize: "clamp(22px,4vw,30px)", fontFamily: "Cinzel,serif",
              background: GOLD_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {isAuthenticated ? t("home:cta.titleAuth") : t("home:cta.titleGuest")}
            </h2>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--nv-text-secondary, rgba(200,160,255,0.7))" }}>
              {isAuthenticated ? t("home:cta.bodyAuth") : t("home:cta.bodyGuest")}
            </p>
            <button
              onClick={() => onNavigate(isAuthenticated ? "dashboard" : "signup")}
              style={{
                padding: "15px 32px", borderRadius: 50, border: "1px solid rgba(180,120,255,0.45)",
                background: "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))", color: "var(--nv-text-on-accent, #fff)", fontWeight: 700,
                fontSize: 15, cursor: "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1,
                boxShadow: "0 4px 28px rgba(123,47,255,0.4)",
              }}
            >
              {isAuthenticated ? t("home:cta.ctaAuth") : t("home:cta.ctaGuest")}
            </button>
          </GlassCard>
        </section>

        <Footer />
      </div>
    </div>
  );
}

export default memo(HomePage);
