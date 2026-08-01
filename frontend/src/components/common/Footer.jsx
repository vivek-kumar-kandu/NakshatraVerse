import { memo } from "react";
import { useTranslation } from "react-i18next";
import { GOLD_GRADIENT } from "../../constants/astrology.js";
import { scrollBehavior } from "../../utils/motionPreference.js";

// ─────────────────────────────────────────────────────────────────────────
// Footer (Priority 6.1) — professional closing section for the marketing
// HomePage. Purely presentational; links scroll to in-page sections that
// already exist rather than pointing at pages this priority doesn't build.
// ─────────────────────────────────────────────────────────────────────────
function scrollToId(id) {
  // Final V1.0 UI Polish Patch: respects prefers-reduced-motion instead of
  // always animating (see utils/motionPreference.js).
  document.getElementById(id)?.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
}

const COLUMN_LINK_STYLE = {
  display: "block", background: "none", border: "none", cursor: "pointer",
  color: "var(--nv-text-muted, rgba(200,160,255,0.65))", fontSize: 13, fontFamily: "Inter,sans-serif",
  padding: "4px 0", textAlign: "left",
};

function Footer() {
  const { t } = useTranslation(["common"]);
  const year = new Date().getFullYear();
  return (
    <footer style={{
      position: "relative", zIndex: 1, borderTop: "1px solid var(--nv-surface-border, rgba(180,120,255,0.15))",
      background: "rgba(6,0,15,0.6)", padding: "48px 20px 24px",
    }}>
      <div style={{
        maxWidth: 1180, margin: "0 auto",
        display: "grid", gap: 32,
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span aria-hidden="true" style={{ fontSize: 22 }}>🪐</span>
            <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "Cinzel,serif",
              background: GOLD_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {t("common:app.name")}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--nv-text-muted, rgba(200,160,255,0.55))", maxWidth: 260 }}>
            {t("common:app.tagline")}
          </p>
        </div>

        <div>
          <h3 style={{ margin: "0 0 10px", fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--nv-text-muted, rgba(200,160,255,0.5))" }}>{t("common:footer.product")}</h3>
          <button className="footer-link" style={COLUMN_LINK_STYLE} onClick={() => scrollToId("features")}>{t("common:footer.features")}</button>
          <button className="footer-link" style={COLUMN_LINK_STYLE} onClick={() => scrollToId("how-it-works")}>{t("common:footer.howItWorks")}</button>
          <button className="footer-link" style={COLUMN_LINK_STYLE} onClick={() => scrollToId("why-us")}>{t("common:footer.whyUs")}</button>
        </div>

        <div>
          <h3 style={{ margin: "0 0 10px", fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--nv-text-muted, rgba(200,160,255,0.5))" }}>{t("common:footer.company")}</h3>
          <button className="footer-link" style={COLUMN_LINK_STYLE} onClick={() => scrollToId("about")}>{t("common:footer.about")}</button>
          <button className="footer-link" style={COLUMN_LINK_STYLE} onClick={() => scrollToId("faq")}>{t("common:footer.faq")}</button>
        </div>

        <div>
          <h3 style={{ margin: "0 0 10px", fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--nv-text-muted, rgba(200,160,255,0.5))" }}>{t("common:footer.connect")}</h3>
          <div aria-hidden="true" style={{ display: "flex", gap: 12, fontSize: 18 }}>
            <span>✦</span><span>🌙</span><span>☀️</span><span>✨</span>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: 1180, margin: "32px auto 0", paddingTop: 20,
        borderTop: "1px solid var(--nv-accent-wash, rgba(180,120,255,0.1))",
        display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between",
        fontSize: 12, color: "rgba(180,130,255,0.4)",
      }}>
        <span>{t("common:footer.copyright", { year })}</span>
        <span>{t("common:footer.poweredBy")}</span>
      </div>

      {/* Phase 1 (Motion & Interactions): footer link buttons previously
          had no hover feedback beyond the cursor. */}
      <style>{`
        .footer-link { transition: color var(--nv-duration-fast) var(--nv-ease-standard), transform var(--nv-duration-fast) var(--nv-ease-standard); }
        .footer-link:hover { color: var(--nv-text-primary, #e8d5ff) !important; transform: translateX(2px); }
        .footer-link:active { transform: translateX(2px) scale(0.97); }
      `}</style>
    </footer>
  );
}

export default memo(Footer);
