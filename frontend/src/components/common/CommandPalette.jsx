import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GlassCard from "./GlassCard.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { listReports, getReport } from "../../utils/reportsApi.js";
import { zodiacSymbol } from "../../utils/reportDisplay.js";
import { fuzzyFilter } from "../../utils/fuzzySearch.js";
import { PLANETS, PLANET_SIGNIFICANCE, HOUSE_MEANINGS } from "../../constants/astrology.js";

// ─────────────────────────────────────────────────────────────────────────
// CommandPalette — V3.0 Premium Command Palette (+ Global Search upgrade)
//
// A global, keyboard-first launcher (Ctrl+K / Cmd+K) for jumping straight
// to any existing page, opening a recent report, or switching themes —
// the same category of feature as Raycast/Linear/Cursor/VS Code/Arc's
// command palettes. Purely additive UI: every destination it links to
// already exists (App.jsx's `stage` switch), every report it lists
// already comes from the existing `reportsApi.listReports()`/`getReport()`,
// and every theme it applies goes through the existing, unmodified
// ThemeContext. Nothing here calls a new backend endpoint, changes an
// API, touches auth, or alters any astrology/report/AI-assistant logic —
// it only triggers the same navigation callbacks (`onNavigate`,
// `onViewReport`, `onOpenAssistant`, `onOpenHoroscope`, `onOpenCalendar`,
// `onOpenSettingsSection`) App.jsx already passes to
// AccountMenu/ActionDock/SavedReportPage/SettingsPage.
//
// Global Search upgrade: searchable results now also include Settings
// sections, Planets & Houses (static Vedic reference copy, see
// constants/astrology.js), and — once each recent report's full record
// loads in the background — that report's own already-computed Yogas,
// Doshas, Remedies, and Nakshatra (report.chart.yogas/doshas/remedies,
// report.nakshatraProfile). All of it is existing backend-generated data
// read through the existing `getReport` endpoint; no new API.
//
// Self-contained like AccountMenu/ConfirmDialog: mounted once at the app
// root (see App.jsx), it owns its own open/closed state, listens for the
// keyboard shortcut globally, and renders `null` while signed out (its
// commands — Dashboard/Profile/Settings/Saved Reports/etc. — are all
// authenticated-only destinations, same gating AccountMenu already uses).
//
// Design: reuses GlassCard, the existing `--nv-*` tokens, and the
// existing `fadeIn`/`dialogPop` keyframes (styles/global.css) already
// used by ConfirmDialog — no new CSS file changes, no new visual
// language.
// ─────────────────────────────────────────────────────────────────────────

const RECENT_KEY = "nv_command_palette_recent";
const MAX_RECENT = 5;

function readRecentIds() {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRecentIds(ids) {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, MAX_RECENT)));
  } catch {
    // Storage unavailable — recent commands just won't be remembered.
  }
}

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function CommandPalette({ onNavigate, onViewReport, onOpenAssistant, onOpenHoroscope, onOpenCalendar, onOpenLifeCoach, onOpenSettingsSection }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { setTheme } = useTheme();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentReports, setRecentReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [recentIds, setRecentIds] = useState(() => readRecentIds());
  // Global Search upgrade — full chart detail (yogas/doshas/remedies/
  // nakshatra) for the same up-to-5 recent reports above. `listReports`
  // only ever returns lightweight summaries (id/title/name/lagna/date —
  // see backend reportService.listReports), so finding a specific Yoga or
  // Remedy by name also means reading each report's full record. This
  // reuses the existing, unmodified `getReport(id)` endpoint (already
  // used by SavedReportPage) — no new API, no new backend logic — just
  // called for a few more ids, in parallel, best-effort.
  const [reportDetails, setReportDetails] = useState({}); // { [id]: fullReportRecord }

  const inputRef = useRef(null);
  const listRef = useRef(null);
  const previouslyFocused = useRef(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  // Global Ctrl+K / Cmd+K toggle — registered once, independent of `open`
  // (reads/writes via the functional setState form so this effect never
  // needs `open` in its dependency array, matching the "no new render per
  // keystroke elsewhere in the app" cost of the other global listeners in
  // this codebase, e.g. AccountMenu's click-outside handler).
  useEffect(() => {
    const handleKey = (e) => {
      const key = (e.key || "").toLowerCase();
      if (key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((wasOpen) => !wasOpen);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Autofocus the search field the moment the palette opens, and restore
  // focus to whatever had it beforehand once it closes — same pattern as
  // ConfirmDialog.jsx.
  useEffect(() => {
    if (open) {
      previouslyFocused.current = document.activeElement;
      inputRef.current?.focus();
    } else if (previouslyFocused.current?.focus) {
      previouslyFocused.current.focus();
    }
  }, [open]);

  // Fetch recent reports fresh every time the palette opens, so a report
  // saved/deleted since the last time it was opened is reflected — same
  // "always current" expectation as Dashboard/SavedReportsPage, just
  // scoped to a short top-N list instead of the full archive.
  useEffect(() => {
    if (!open || !isAuthenticated) return;
    let cancelled = false;
    setReportsLoading(true);
    listReports()
      .then((reports) => {
        if (cancelled) return;
        const sorted = [...(reports || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRecentReports(sorted.slice(0, 5));
      })
      .catch(() => { if (!cancelled) setRecentReports([]); })
      .finally(() => { if (!cancelled) setReportsLoading(false); });
    return () => { cancelled = true; };
  }, [open, isAuthenticated]);

  // Once the recent-reports summaries are in, fetch each one's full record
  // in the background so Yogas/Doshas/Remedies/Nakshatra become
  // searchable a moment later. Deliberately not blocking: the palette is
  // already usable (nav/theme/report-title search) the instant it opens;
  // this section of results just fills in shortly after, same
  // progressive-disclosure pattern as `reportsLoading` above.
  useEffect(() => {
    if (!open || !isAuthenticated || recentReports.length === 0) return;
    let cancelled = false;
    recentReports.forEach((r) => {
      if (reportDetails[r.id]) return; // already have it
      getReport(r.id)
        .then((full) => {
          if (cancelled || !full) return;
          setReportDetails((prev) => (prev[r.id] ? prev : { ...prev, [r.id]: full }));
        })
        .catch(() => {}); // best-effort — missing detail just means that report's Yogas/Doshas/Remedies stay unsearchable this session
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isAuthenticated, recentReports]);

  const runCommand = useCallback((command) => {
    setRecentIds((prev) => {
      const next = [command.id, ...prev.filter((id) => id !== command.id)].slice(0, MAX_RECENT);
      writeRecentIds(next);
      return next;
    });
    close();
    // Deferred one tick so the palette's own unmount/close doesn't race
    // the stage change it's about to trigger (e.g. App.jsx's Suspense
    // fallback swapping in as `stage` changes).
    command.run();
  }, [close]);

  const navCommands = useMemo(() => ([
    { id: "nav-dashboard", section: "Navigate", icon: "📊", label: "Dashboard", keywords: "overview home", run: () => onNavigate("dashboard") },
    { id: "nav-generate", section: "Navigate", icon: "🔮", label: "Generate Report", keywords: "new reading kundli birth chart", run: () => onNavigate("landing") },
    { id: "nav-reports", section: "Navigate", icon: "📜", label: "Saved Reports", keywords: "archive history saved", run: () => onNavigate("reports") },
    { id: "nav-profile", section: "Navigate", icon: "👤", label: "Profile", keywords: "account my", run: () => onNavigate("profile") },
    { id: "nav-settings", section: "Navigate", icon: "⚙️", label: "Settings", keywords: "preferences appearance", run: () => onNavigate("settings") },
    { id: "nav-horoscope", section: "Navigate", icon: "🌅", label: "Horoscope", keywords: "daily weekly monthly prediction", run: () => onOpenHoroscope() },
    { id: "nav-calendar", section: "Navigate", icon: "🗓️", label: "Calendar", keywords: "dasha transit astrology", run: () => onOpenCalendar() },
    { id: "nav-assistant", section: "Navigate", icon: "💬", label: "AI Assistant", keywords: "ask chat question gemini", run: () => onOpenAssistant() },
    { id: "nav-life-coach", section: "Navigate", icon: "🧭", label: "AI Life Coach", keywords: "daily career relationship finance health wellness personal growth coach guidance", run: () => onOpenLifeCoach() },
    { id: "nav-matching", section: "Navigate", icon: "💞", label: "Kundli Matching", keywords: "compatibility guna milan ashtakoota marriage manglik", run: () => onNavigate("matching") },
    { id: "nav-panchang", section: "Navigate", icon: "🕉️", label: "Daily Panchang & Muhurat", keywords: "tithi nakshatra yoga karana rahu kaal muhurat auspicious timing", run: () => onNavigate("panchang") },
    // V4.5 Phase 1B (Festival Frontend Integration): additive commands,
    // same pattern as nav-matching/nav-panchang above.
    { id: "nav-festivals", section: "Navigate", icon: "🎉", label: "Festival Calendar", keywords: "festivals vrat holidays hindu calendar", run: () => onNavigate("festivals") },
    { id: "nav-today-festival", section: "Navigate", icon: "📍", label: "Today's Festival", keywords: "today festival vrat", run: () => onNavigate("festivals") },
    { id: "nav-upcoming-festivals", section: "Navigate", icon: "🔜", label: "Upcoming Festivals", keywords: "upcoming festivals vrat next", run: () => onNavigate("festivals") },
    { id: "nav-notifications", section: "Navigate", icon: "🔔", label: "Notification Center", keywords: "notifications alerts inbox bell", run: () => onNavigate("notifications") },
    { id: "nav-unread-notifications", section: "Navigate", icon: "🔴", label: "Unread Notifications", keywords: "unread notifications new alerts", run: () => onNavigate("notifications") },
    // V4.2 (Family Profiles & Relationship Hub): additive commands, same
    // pattern as nav-matching/nav-panchang above.
    { id: "nav-family-profiles", section: "Navigate", icon: "👨‍👩‍👧‍👦", label: "Family Profiles", keywords: "family profiles saved profiles father mother husband wife son daughter relatives", run: () => onNavigate("family-profiles") },
    { id: "nav-relationship-hub", section: "Navigate", icon: "💞", label: "Relationship Hub", keywords: "compare profiles relationship hub kundli matching birth chart comparison", run: () => onNavigate("relationship-hub") },
    { id: "nav-help", section: "Navigate", icon: "❓", label: "Help", keywords: "about support", run: () => onNavigate("dashboard") },
  ]), [onNavigate, onOpenAssistant, onOpenHoroscope, onOpenCalendar, onOpenLifeCoach]);

  const themeCommands = useMemo(() => ([
    { id: "theme-light", section: "Theme", icon: "☀️", label: "Switch to Sacred Dawn", keywords: "light white theme", run: () => setTheme("light") },
    { id: "theme-dark", section: "Theme", icon: "🌙", label: "Switch to Midnight Cosmic", keywords: "dark theme", run: () => setTheme("dark") },
    { id: "theme-system", section: "Theme", icon: "🖥️", label: "Switch to System Theme", keywords: "auto os theme", run: () => setTheme("system") },
  ]), [setTheme]);

  const reportCommands = useMemo(() => recentReports.map((r) => ({
    id: `report-${r.id}`,
    section: "Recent Reports",
    icon: zodiacSymbol(r.lagna),
    label: r.title || r.name || "Untitled Report",
    sublabel: [r.name, formatDate(r.createdAt)].filter(Boolean).join(" · "),
    keywords: [r.title, r.name, r.lagna].filter(Boolean).join(" "),
    run: () => onViewReport(r.id),
  })), [recentReports, onViewReport]);

  // Settings — deep links into SettingsPage's existing sections
  // (Account/Appearance/Preferences/Privacy/About), same list SettingsPage
  // itself already renders in its left-hand nav (see SettingsPage.jsx
  // SECTIONS). No new settings/pages are introduced — this only saves a
  // click by opening straight to the right one.
  const settingsCommands = useMemo(() => ([
    { id: "settings-account", section: "Settings", icon: "👤", label: "Settings · Account", keywords: "profile email password name", run: () => onOpenSettingsSection("account") },
    { id: "settings-appearance", section: "Settings", icon: "🎨", label: "Settings · Appearance", keywords: "theme dark light color", run: () => onOpenSettingsSection("appearance") },
    { id: "settings-preferences", section: "Settings", icon: "⚙️", label: "Settings · Preferences", keywords: "dashboard view animation compact", run: () => onOpenSettingsSection("preferences") },
    { id: "settings-privacy", section: "Settings", icon: "🔒", label: "Settings · Privacy", keywords: "export data storage reset delete", run: () => onOpenSettingsSection("privacy") },
    { id: "settings-about", section: "Settings", icon: "ℹ️", label: "Settings · About", keywords: "version app info", run: () => onOpenSettingsSection("about") },
  ]), [onOpenSettingsSection]);

  // Planets & Houses — standard Vedic reference copy already defined in
  // constants/astrology.js (PLANET_SIGNIFICANCE/HOUSE_MEANINGS), the same
  // static text already shown in tooltips/detail cards elsewhere in the
  // app. Selecting one jumps to the most recent report's Kundli tab where
  // that planet/house is actually placed on the person's own chart; with
  // no saved report yet, it offers to generate one instead — mirroring
  // how Horoscope/Calendar/AI Assistant nav commands already fall back
  // when nothing is loaded.
  const mostRecentReportId = recentReports[0]?.id;
  const openChartReference = useCallback(() => {
    if (mostRecentReportId) onViewReport(mostRecentReportId);
    else onNavigate("landing");
  }, [mostRecentReportId, onViewReport, onNavigate]);

  const planetCommands = useMemo(() => PLANETS.map((p) => ({
    id: `planet-${p}`,
    section: "Planets",
    icon: "🪐",
    label: p,
    sublabel: PLANET_SIGNIFICANCE[p],
    keywords: `planet ${p} ${PLANET_SIGNIFICANCE[p] || ""}`,
    run: openChartReference,
  })), [openChartReference]);

  const houseCommands = useMemo(() => Object.entries(HOUSE_MEANINGS).map(([num, meaning]) => ({
    id: `house-${num}`,
    section: "Houses",
    icon: "🏠",
    label: `House ${num}`,
    sublabel: meaning,
    keywords: `house ${num} ${meaning}`,
    run: openChartReference,
  })), [openChartReference]);

  // Yogas / Doshas / Remedies / Nakshatra — read straight from each recent
  // report's own already-computed `chart.yogas[]` / `chart.doshas[]` /
  // `chart.remedies[]` / `nakshatraProfile` (unchanged Astrology/Rule
  // Engine output, see ResultsTabs.jsx/ResultsPage.jsx for the same
  // fields). Populated once `reportDetails` finishes loading in the
  // background; before that, these sections just aren't in the list yet
  // (no placeholder/fake rows).
  const chartFindingCommands = useMemo(() => {
    const out = [];
    recentReports.forEach((r) => {
      const full = reportDetails[r.id];
      const chart = full?.chart;
      if (!chart) return;
      const label = r.title || r.name || "Untitled Report";
      (chart.yogas || []).forEach((y, i) => out.push({
        id: `yoga-${r.id}-${i}`, section: "Yogas", icon: "⭐", label: y.name,
        sublabel: `In ${label}`, keywords: `yoga ${y.name} ${y.detail || ""}`,
        run: () => onViewReport(r.id),
      }));
      (chart.doshas || []).forEach((d, i) => out.push({
        id: `dosha-${r.id}-${i}`, section: "Doshas", icon: "🧿", label: d.name,
        sublabel: `In ${label}`, keywords: `dosha ${d.name} ${d.detail || ""}`,
        run: () => onViewReport(r.id),
      }));
      (chart.remedies || []).forEach((rem, i) => out.push({
        id: `remedy-${r.id}-${i}`, section: "Remedies", icon: "🪬", label: rem.type,
        sublabel: `In ${label}`, keywords: `remedy ${rem.type} ${rem.detail || ""}`,
        run: () => onViewReport(r.id),
      }));
      const nakshatraName = full?.report?.nakshatraProfile?.name || full?.report?.nakshatraProfile?.nakshatra;
      if (nakshatraName) out.push({
        id: `nakshatra-${r.id}`, section: "Nakshatras", icon: "✨", label: nakshatraName,
        sublabel: `${label}'s birth Nakshatra`, keywords: `nakshatra ${nakshatraName}`,
        run: () => onViewReport(r.id),
      });
    });
    return out;
  }, [recentReports, reportDetails, onViewReport]);

  const allCommands = useMemo(
    () => [...navCommands, ...reportCommands, ...chartFindingCommands, ...settingsCommands, ...planetCommands, ...houseCommands, ...themeCommands],
    [navCommands, reportCommands, chartFindingCommands, settingsCommands, planetCommands, houseCommands, themeCommands]
  );

  // The default (no-query) browse list stays exactly as compact as
  // before — Navigate/Recent Reports/Theme only. Settings sections,
  // Planets, Houses, and each report's Yogas/Doshas/Remedies/Nakshatra
  // are real commands and fully searchable (`allCommands`, below), but
  // dumping all of them into the palette the instant it opens with no
  // query typed would bury the handful of things people actually want on
  // first glance under dozens of reference/finding rows.
  const defaultBrowseCommands = useMemo(
    () => [...navCommands, ...reportCommands, ...themeCommands],
    [navCommands, reportCommands, themeCommands]
  );

  const trimmedQuery = query.trim();

  // Empty query: lead with "Recent" (commands the person has actually run
  // before, most-recent-first), then the full grouped list underneath so
  // Recent Reports/Theme options are still reachable without typing.
  const recentCommands = useMemo(() => {
    if (trimmedQuery) return [];
    return recentIds
      .map((id) => allCommands.find((c) => c.id === id))
      .filter(Boolean)
      .map((c) => ({ ...c, section: "Recent" }));
  }, [trimmedQuery, recentIds, allCommands]);

  const filteredCommands = useMemo(() => {
    if (!trimmedQuery) return defaultBrowseCommands;
    return fuzzyFilter(trimmedQuery, allCommands, (c) => `${c.label} ${c.keywords || ""}`);
  }, [trimmedQuery, allCommands, defaultBrowseCommands]);

  const visibleCommands = trimmedQuery ? filteredCommands : [...recentCommands, ...defaultBrowseCommands];

  // De-dupe (a command can legitimately appear once under "Recent" and
  // again under its normal section when the query is empty) while
  // preserving each item's own section label, so "Recent" still renders
  // as its own group above the rest.
  const seen = new Set();
  const dedupedCommands = [];
  visibleCommands.forEach((c, i) => {
    const key = `${c.section}:${c.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    dedupedCommands.push({ ...c, _key: `${c.id}-${i}` });
  });

  // Group consecutively for section headers.
  const groups = [];
  dedupedCommands.forEach((c) => {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.section === c.section) {
      lastGroup.items.push(c);
    } else {
      groups.push({ section: c.section, items: [c] });
    }
  });

  useEffect(() => {
    setActiveIndex(0);
  }, [trimmedQuery, open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector(`[data-cmd-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, dedupedCommands.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const command = dedupedCommands[activeIndex];
      if (command) runCommand(command);
    }
  };

  if (authLoading || !isAuthenticated || !open) return null;

  let runningIndex = -1;

  return (
    <div
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 3000, display: "flex",
        alignItems: "flex-start", justifyContent: "center", padding: "min(12vh, 96px) 16px 16px",
        background: "var(--nv-overlay-scrim, rgba(5,0,15,0.6))", backdropFilter: "blur(var(--nv-scrim-blur, 4px))", WebkitBackdropFilter: "blur(var(--nv-scrim-blur, 4px))",
        animation: "fadeIn 0.15s ease both", fontFamily: "var(--nv-font-body, Inter,sans-serif)",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
        className="confirm-dialog-pop"
        style={{ width: "min(560px, 100%)" }}
        onKeyDown={handleKeyDown}
      >
        <GlassCard style={{ padding: 0, overflow: "hidden", boxShadow: "var(--nv-elevation-4, var(--nv-shadow-xl))" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: "1px solid var(--nv-surface-border, rgba(180,120,255,0.16))" }}>
            <span aria-hidden="true" style={{ fontSize: 15, color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages, reports, yogas, doshas, remedies…"
              aria-label="Command Palette search"
              role="combobox"
              aria-expanded="true"
              aria-controls="command-palette-list"
              aria-activedescendant={dedupedCommands[activeIndex] ? `cmd-${dedupedCommands[activeIndex]._key}` : undefined}
              autoComplete="off"
              style={{
                flex: 1, border: "none", outline: "none", background: "transparent",
                color: "var(--nv-text-primary, #e8d5ff)", fontSize: 15, fontFamily: "var(--nv-font-body, Inter,sans-serif)",
              }}
            />
            <kbd style={{
              fontSize: 11, padding: "3px 7px", borderRadius: 6, color: "var(--nv-text-muted, rgba(200,160,255,0.55))",
              border: "1px solid var(--nv-surface-border, rgba(180,120,255,0.25))", background: "var(--nv-surface, rgba(18,0,38,0.6))",
              fontFamily: "var(--nv-font-body, Inter,sans-serif)",
            }}>
              Esc
            </kbd>
          </div>

          <div
            id="command-palette-list"
            role="listbox"
            aria-label="Commands"
            ref={listRef}
            style={{ maxHeight: "min(60vh, 420px)", overflowY: "auto", padding: "8px" }}
          >
            {dedupedCommands.length === 0 && (
              <div style={{ padding: "34px 18px", textAlign: "center" }}>
                <div aria-hidden="true" style={{ fontSize: 22, marginBottom: 8, opacity: 0.7 }}>✦</div>
                <div style={{ fontSize: 13.5, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>
                  No matching commands{trimmedQuery ? ` for "${trimmedQuery}"` : ""}.
                </div>
              </div>
            )}

            {groups.map((group) => (
              <div key={`${group.section}-${group.items[0]._key}`} style={{ marginBottom: 6 }}>
                <div style={{
                  padding: "8px 10px 4px", fontSize: 10.5, letterSpacing: 0.8, textTransform: "uppercase",
                  color: "var(--nv-text-faint, rgba(200,160,255,0.45))", fontWeight: 700,
                }}>
                  {group.section === "Recent Reports" && reportsLoading ? "Recent Reports · loading…" : group.section}
                </div>
                {group.items.map((c) => {
                  runningIndex += 1;
                  const index = runningIndex;
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={c._key}
                      id={`cmd-${c._key}`}
                      data-cmd-index={index}
                      role="option"
                      aria-selected={isActive}
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => runCommand(c)}
                      className="tap-scale"
                      style={{
                        display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                        padding: "10px 12px", border: "none", cursor: "pointer", borderRadius: 10, minHeight: 44,
                        background: isActive ? "var(--nv-accent-wash, rgba(123,47,255,0.18))" : "transparent",
                        color: "var(--nv-text-primary, #e8d5ff)", fontSize: 13.5, fontFamily: "var(--nv-font-body, Inter,sans-serif)",
                      }}
                    >
                      <span aria-hidden="true" style={{ fontSize: 15, width: 20, textAlign: "center", flexShrink: 0 }}>{c.icon}</span>
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.label}</span>
                        {c.sublabel && (
                          <span style={{ display: "block", fontSize: 11.5, color: "var(--nv-text-muted, rgba(200,160,255,0.55))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {c.sublabel}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default CommandPalette;
