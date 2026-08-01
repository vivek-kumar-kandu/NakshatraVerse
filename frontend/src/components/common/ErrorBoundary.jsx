import { Component } from "react";
import { GOLD_GRADIENT } from "../../constants/astrology.js";
<<<<<<< HEAD
=======
// Multilingual Foundation Phase: this is a class component (React error
// boundaries have no hook equivalent), so it reads the shared i18next
// instance directly rather than useTranslation(). Every call below passes
// a `defaultValue` — the exact original English copy — so a crash that
// happens to occur *before* i18next has finished initializing (this
// component's entire job is handling the unexpected) still renders
// correct, readable text instead of a raw "common:errorBoundary.title"
// key.
import i18n from "../../i18n/index.js";
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)

// ─────────────────────────────────────────────────────────────────────────
// ErrorBoundary (Phase 5 — Performance & Production Optimization)
//
// Previously, an unhandled render error anywhere in the app tree (a bad
// backend payload, an unexpected data shape, a runtime bug) unmounted the
// whole React tree and left the visitor looking at a blank white page with
// no way forward except knowing to manually reload. This is a standard
// React error boundary (a class component is required — React has no hook
// equivalent) that catches exactly that case and renders a small, on-brand
// fallback with a way to recover, instead of a blank screen.
//
// Deliberately narrow in scope: it does not change what errors occur, how
// any existing try/catch or `error` state elsewhere in the app works (the
// results-stage error banner, auth form errors, etc. are all unrelated and
// untouched), or any data/business logic. It only replaces "blank white
// screen" with "graceful message" for the one case nothing already
// handled: a genuine render-time crash.
// ─────────────────────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Production error visibility: this is the one place in the app a
    // console.error for an unexpected crash is appropriate — everywhere
    // else, errors are already surfaced to the person via inline UI state
    // (see the file header above). Without this, a render crash would be
    // silently swallowed once the fallback UI below takes over.
    console.error("NakshatraVerse: unhandled UI error", error, info?.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", textAlign: "center",
          padding: "40px 20px", background: "#06000f", fontFamily: "Inter,sans-serif",
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 44, marginBottom: 16 }}>🪐</span>
        <h1 style={{
          margin: "0 0 10px", fontSize: "clamp(20px,4vw,28px)", fontFamily: "Cinzel,serif",
          background: GOLD_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
<<<<<<< HEAD
          Something went off course
        </h1>
        <p style={{ margin: "0 0 24px", maxWidth: 420, fontSize: 14, lineHeight: 1.6, color: "var(--nv-text-secondary, rgba(200,160,255,0.7))" }}>
          NakshatraVerse hit an unexpected error. Reloading usually fixes it — your saved reports
          aren't affected.
=======
          {i18n.t("common:errorBoundary.title", { defaultValue: "Something went off course" })}
        </h1>
        <p style={{ margin: "0 0 24px", maxWidth: 420, fontSize: 14, lineHeight: 1.6, color: "var(--nv-text-secondary, rgba(200,160,255,0.7))" }}>
          {i18n.t("common:errorBoundary.message", {
            defaultValue: "NakshatraVerse hit an unexpected error. Reloading usually fixes it — your saved reports aren't affected.",
          })}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
        </p>
        <button
          type="button"
          onClick={this.handleReload}
          className="submit-btn"
          style={{
            padding: "13px 28px", borderRadius: 30, border: "1px solid rgba(180,120,255,0.45)",
            background: "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))", color: "var(--nv-text-on-accent, #fff)", fontWeight: 600,
            fontSize: 14, cursor: "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1,
            boxShadow: "0 4px 28px rgba(123,47,255,0.38)",
          }}
        >
<<<<<<< HEAD
          ✦ Reload NakshatraVerse ✦
=======
          {i18n.t("common:errorBoundary.reload", { defaultValue: "✦ Reload NakshatraVerse ✦" })}
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
