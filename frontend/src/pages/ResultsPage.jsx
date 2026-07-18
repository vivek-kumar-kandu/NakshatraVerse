import { useState, useEffect, useCallback } from "react";
import CosmicBg from "../components/common/CosmicBg.jsx";
import GlassCard from "../components/common/GlassCard.jsx";
import Badge from "../components/common/Badge.jsx";
import TabBar from "../components/common/TabBar.jsx";
import AiText from "../components/common/AiText.jsx";
import PageTransition from "../components/common/PageTransition.jsx";
import { OverviewTab, KundliTab, TwoSectionTab, SingleTab, PredictionsTab, TimelineTab } from "./ResultsTabs.jsx";
import InsightRow from "../components/common/InsightRow.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import ExpandableSection from "../components/report/ExpandableSection.jsx";
import RuleResultCard from "../components/report/RuleResultCard.jsx";
import RemedyCard from "../components/report/RemedyCard.jsx";
import ExplorerTab from "../components/explorer/ExplorerTab.jsx";
import { ExplorerProvider, useExplorer } from "../context/ExplorerContext.jsx";
import { PLANET_COLORS, GOLD_GRADIENT, TABS } from "../constants/astrology.js";
import { readPreferences } from "../utils/settingsStorage.js";
// V5.3 (Explainable Report Intelligence) — additive only, new Explanation
// Engine components. Neither of these replaces or restyles anything
// already rendered on this page; they are appended alongside it.
import ReportSummaryCard from "../components/explanation/ReportSummaryCard.jsx";
import RemedyExplanationCard from "../components/explanation/RemedyExplanationCard.jsx";

// V3.0 Final Enhancement (User Preferences & Personalization): which tab
// this report opens on is now the "Default Report Tab" preference instead
// of always "overview" — read once as this state's initial value, exactly
// like SavedReportsPage already does for its own `viewMode` default (see
// that file's `useState(() => readPreferences().dashboardView)`). Falls
// back to "overview" if the stored value isn't a real tab id.
function initialReportTab() {
  const tab = readPreferences().reportTab;
  return TABS.some((t) => t.id === tab) ? tab : "overview";
}

function ResultsPage(props) {
  return (
    <ExplorerProvider>
      <ResultsPageInner {...props} />
    </ExplorerProvider>
  );
}

function ResultsPageInner({ userData, report, planetary, numerology, error }) {
  const [activeTab, setActiveTab] = useState(initialReportTab);
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 80); }, []);

  // Once the AI request has definitively failed, sections should say so
  // instead of spinning forever as if still loading.
  const failed = Boolean(error);

  const handleTabChange = useCallback((id) => setActiveTab(id), []);

  // V5.1 (Interactive Kundli / Explorer Integration): this component
  // renders inside the <ExplorerProvider> above, so it shares exactly one
  // selection with the Explorer tab. `navigateToExplorer` completes the
  // required flow — Interactive Kundli -> Explorer -> AI Explanation ->
  // Prediction Timeline — by switching the active tab after a selection.
  const { selectedType, selectedItem, selectItem } = useExplorer();
  const navigateToExplorer = useCallback(() => setActiveTab("explorer"), []);

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div style={{ display: "grid", gap: 16 }}>
            <OverviewTab userData={userData} planetary={planetary} numerology={numerology} report={report} failed={failed} onNavigateTab={setActiveTab} />
            {/* V5.3 (Explainable Report Intelligence): additive — a
                whole-report AI synthesis distinct from report.lifeSummary
                above (which OverviewTab already renders unchanged). */}
            {!failed && report?.chart && <ReportSummaryCard chart={report.chart} report={report} />}
          </div>
        );
      case "kundli":
        return (
          <KundliTab
            userData={userData}
            planetary={planetary}
            report={report}
            selectedType={selectedType}
            selectedItem={selectedItem}
            onSelect={selectItem}
            onNavigateExplorer={navigateToExplorer}
          />
        );
      case "love":
        return (
          <TwoSectionTab failed={failed} sections={[
            { title:"Love Life", icon:"💕", color:"#ff7eb3", text:report?.loveLife, placeholder:"Reading Venus and Moon alignments…" },
            { title:"Marriage", icon:"💍", color:"#ffb07e", text:report?.marriage, placeholder:"Consulting Jupiter and the 7th house…" },
          ]} />
        );
      case "career":
        return (
          <SingleTab icon="💼" title="Career" color="#7eb8ff" text={report?.career} placeholder="Analyzing Saturn, Sun, and the 10th house…" failed={failed}>
            <GlassCard style={{ padding:20 }}>
              <h3 style={{ margin:"0 0 12px", fontSize:13, letterSpacing:1.5, textTransform:"uppercase",
                color:"var(--nv-text-muted, rgba(200,160,255,0.5))", fontFamily:"Inter,sans-serif", fontWeight:500 }}>KEY PLANETARY INFLUENCES</h3>
              {["Sun ☀️","Saturn ♄","Mercury ☿"].map(p => (
                <InsightRow key={p} label={p} value={`House ${planetary[p]?.house} · ${planetary[p]?.sign}`} color={PLANET_COLORS[p]} />
              ))}
            </GlassCard>
          </SingleTab>
        );
      case "wealth":
        return (
          <SingleTab icon="💰" title="Finance & Wealth" color="#ffd700" text={report?.finance} placeholder="Consulting Jupiter and the 2nd house…" failed={failed}>
            <GlassCard style={{ padding:20 }}>
              <h3 style={{ margin:"0 0 12px", fontSize:13, letterSpacing:1.5, textTransform:"uppercase",
                color:"var(--nv-text-muted, rgba(200,160,255,0.5))", fontFamily:"Inter,sans-serif", fontWeight:500 }}>WEALTH INDICATORS</h3>
              {["Jupiter ♃","Venus ♀","Moon 🌙"].map(p => (
                <InsightRow key={p} label={p} value={`House ${planetary[p]?.house} · ${planetary[p]?.sign}`} color={PLANET_COLORS[p]} />
              ))}
            </GlassCard>
          </SingleTab>
        );
      case "health":
        return (
          <SingleTab icon="🌿" title="Health" color="#7effb2" text={report?.health} placeholder="Analyzing Sun, Mars, and the 6th house…" failed={failed}>
            <GlassCard style={{ padding:20 }}>
              <h3 style={{ margin:"0 0 12px", fontSize:13, letterSpacing:1.5, textTransform:"uppercase",
                color:"var(--nv-text-muted, rgba(200,160,255,0.5))", fontFamily:"Inter,sans-serif", fontWeight:500 }}>HEALTH PLANETS</h3>
              {["Sun ☀️","Mars ♂","Saturn ♄"].map(p => (
                <InsightRow key={p} label={p} value={`House ${planetary[p]?.house} · ${planetary[p]?.sign}`} color={PLANET_COLORS[p]} />
              ))}
            </GlassCard>
          </SingleTab>
        );
      case "doshas":
        return (
          <div style={{ display:"grid", gap:16 }}>
            <TwoSectionTab failed={failed} sections={[
              { title:"Doshas", icon:"🧿", color:"#ff7b7b", text:report?.doshas, placeholder:"Checking Mangal Dosha, Kaal Sarp Dosha…" },
              { title:"Yogas", icon:"⭐", color:"#c9ff7e", text:report?.yogas, placeholder:"Identifying Raj Yoga, Gaj Kesari Yoga…" },
            ]} />
            {/* V3.0 Phase 3: the backend Rule Engine's own structured
                findings (report.chart.yogas / report.chart.doshas —
                unchanged shape/source), shown as expandable, individually
                readable cards alongside the AI narrative above. */}
            <ExpandableSection icon="⭐" title="Detected Yogas" color="#c9ff7e" count={report?.chart?.yogas?.length ?? 0}>
              {report?.chart?.yogas?.length > 0 ? (
                <div style={{ display:"grid", gap:10, gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))" }}>
                  {report.chart.yogas.map((y, idx) => <RuleResultCard key={y.name} name={y.name} detail={y.detail} kind="yoga" idx={idx} />)}
                </div>
              ) : (
                <EmptyState compact icon="⭐" title="No yogas detected" message="No major yoga was found based on the calculated chart." />
              )}
            </ExpandableSection>
            <ExpandableSection icon="🧿" title="Detected Doshas" color="#ff8f7e" count={report?.chart?.doshas?.length ?? 0}>
              {report?.chart?.doshas?.length > 0 ? (
                <div style={{ display:"grid", gap:10, gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))" }}>
                  {report.chart.doshas.map((d, idx) => <RuleResultCard key={d.name} name={d.name} detail={d.detail} kind="dosha" idx={idx} />)}
                </div>
              ) : (
                <EmptyState compact icon="🧿" title="No doshas detected" message="No major dosha was found based on the calculated chart." />
              )}
            </ExpandableSection>
          </div>
        );
      case "remedies":
        return (
          <div style={{ display:"grid", gap:16 }}>
            <SingleTab icon="🪬" title="Remedies & Recommendations" color="#ffb347" text={report?.remedies} placeholder="Preparing personalised Vedic remedies…" failed={failed} />
            {/* V3.0 Phase 3: the actual backend-computed remedies
                (report.chart.remedies — { type, detail } from
                remedyRuleEvaluator.js) replace the previous static
                placeholder category list, which never reflected real
                chart data. */}
            <ExpandableSection icon="🪬" title="Suggested Remedies" color="#ffb347" count={report?.chart?.remedies?.length ?? 0}>
              {report?.chart?.remedies?.length > 0 ? (
                <div style={{ display:"grid", gap:10, gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))" }}>
                  {report.chart.remedies.map((r, idx) => (
                    <div key={`${r.type}-${idx}`}>
                      <RemedyCard type={r.type} detail={r.detail} idx={idx} />
                      {/* V5.3 (Explainable Report Intelligence): additive
                          "Why this remedy?" explanation beneath the
                          existing, unmodified RemedyCard. */}
                      <RemedyExplanationCard chart={report.chart} report={report} remedyType={r.type} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState compact icon="🪬" title="No specific remedies" message="No traditional remedy is suggested based on the currently calculated chart." />
              )}
            </ExpandableSection>
          </div>
        );
      case "predictions":
        return <PredictionsTab report={report} />;
      case "timeline":
        {/* V5.2 (AI Timeline) — additive `chart` prop, same rationale as
            ExplorerTab's `chart` prop below: grounds AI Timeline's
            "Explain with AI" panel in the same backend chart object AI
            Report Chat/Explorer AI already use. No other prop changes. */}
        return <TimelineTab report={report} chart={report?.chart} selectedType={selectedType} selectedItem={selectedItem} />;
      case "summary":
        return (
          <GlassCard style={{ padding:32, borderColor:"rgba(255,215,0,0.3)", background:"var(--nv-spotlight-bg, rgba(30,5,60,0.7))" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, flexWrap:"wrap" }}>
              <span aria-hidden="true" style={{ fontSize:28 }}>✨</span>
              <h3 style={{ margin:0, fontSize:20, background:GOLD_GRADIENT,
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", fontFamily:"Cinzel,serif" }}>
                AI-Generated Life Summary
              </h3>
              <Badge color="#ffd700" style={{ marginLeft:"auto", animation:"aiGlowPulse 2.6s ease-in-out infinite" }}>AI Insight</Badge>
            </div>
            <AiText text={report?.lifeSummary} placeholder="Weaving your complete cosmic story…" failed={failed} />
            {report?.lifeSummary && (
              <div style={{ marginTop:20, paddingTop:20, borderTop:"1px solid rgba(255,215,0,0.15)" }}>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  <Badge color="#ffd700">{userData.name}</Badge>
                  <Badge color="#bf7fff">Lagna: {userData.lagna}</Badge>
                  <Badge color="#9dc9ff">Mulank: {numerology.mulank}</Badge>
                  <Badge color="#ff7eb3">Bhagyank: {numerology.bhagyank}</Badge>
                </div>
              </div>
            )}
          </GlassCard>
        );
      case "explorer":
        // V5.0 Phase 5A (Explorer Infrastructure): reuses this same
        // Report page + TabBar — no new page, no new dashboard. Backend
        // engines/APIs are untouched; this renders the new Explorer
        // framework only.
        {/* V5.0 Phase 5C (Explorer AI): additive `chart` prop — the same
            report.chart (raw backend chart object) AI Report Chat already
            uses via ActionDock's onOpenAssistant, forwarded through so
            Explorer AI's detail panels can ground Gemini explanations in
            it. No other prop changes; every existing Explorer prop is
            unchanged. */}
        return <ExplorerTab userData={userData} planetary={planetary} report={report} chart={report?.chart} />;
      default: return null;
    }
  };

  return (
    <div style={{ minHeight:"100vh", position:"relative", fontFamily:"Inter,sans-serif" }}>
      <CosmicBg />

      <div style={{ position:"relative", zIndex:1, maxWidth:960, margin:"0 auto",
        padding:"0 16px 60px", opacity:visible?1:0, transition:"opacity 0.5s" }}>

        {/* Top header */}
        <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"20px 0 0", flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, minWidth:0 }}>
            <span aria-hidden="true" style={{ fontSize:36, flexShrink:0 }}>🪐</span>
            <div style={{ minWidth:0 }}>
              <h1 style={{ margin:0, fontSize:"clamp(18px,4vw,26px)", background:GOLD_GRADIENT,
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", fontFamily:"Cinzel,serif", fontWeight:700,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {userData.name}
              </h1>
              <p style={{ margin:0, fontSize:12, color:"var(--nv-text-muted, rgba(200,160,255,0.5))", fontFamily:"Inter,sans-serif" }}>
                {userData.dob} · {userData.tob} · {userData.pob}
              </p>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <Badge color="#ffd700">{userData.lagna}</Badge>
            <Badge color="#bf7fff">♾ Mulank {numerology.mulank}</Badge>
            <Badge color="#9dc9ff">⚡ Bhagyank {numerology.bhagyank}</Badge>
          </div>
        </header>

        {/* Divider */}
        <div aria-hidden="true" style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(180,120,255,0.3),transparent)", margin:"16px 0" }} />

        {/* Tab bar */}
        <nav aria-label="Report sections">
          <GlassCard style={{ padding:"8px 12px", marginBottom:20, borderRadius:40 }}>
            <TabBar active={activeTab} onChange={handleTabChange} />
          </GlassCard>
        </nav>

        {/* Tab content — reuses the shared PageTransition wrapper (already
            used one level up, at the page/stage level, in App.jsx) so tab
            switches inside a report get the same smooth cross-fade +
            slide instead of the previous plain slideIn. */}
        <main>
          <PageTransition stageKey={activeTab}>
            {renderTab()}
          </PageTransition>
        </main>

        {/* Footer */}
        <footer style={{ textAlign:"center", marginTop:40, color:"rgba(180,130,255,0.3)", fontSize:12, fontFamily:"Inter,sans-serif" }}>
          NakshatraVerse · Ancient Wisdom meets Gemini AI · For guidance purposes only
        </footer>
      </div>
    </div>
  );
}

export default ResultsPage;
