import { memo, useMemo, useRef, useCallback } from "react";
import GlassCard from "../common/GlassCard.jsx";
import ExplorerCard from "./ExplorerCard.jsx";
import { EXPLORER_SELECTION_TYPES } from "../../constants/explorer.js";
import { PLANETS, PLANET_COLORS, SIGN_NAMES, HOUSE_MEANINGS } from "../../constants/astrology.js";
import { useExplorer } from "../../context/ExplorerContext.jsx";

// ─────────────────────────────────────────────────────────────────────────
// ExplorerSidePanel (V5.0 Phase 5A — Explorer Infrastructure)
//
// Renders the eight selection-type categories as an expandable, keyboard
// navigable tree (role="tree" / role="group" / role="treeitem"), each
// holding a flat item list built from data the report already computed —
// no new astrology math:
//
//   planet     -> PLANETS (existing constant)
//   house      -> HOUSE_MEANINGS (existing constant)
//   sign       -> SIGN_NAMES (existing constant)
//   yoga       -> report.chart.yogas (existing Rule Engine output)
//   dosha      -> report.chart.doshas (existing Rule Engine output)
//   nakshatra  -> report.nakshatraProfile (existing Nakshatra Intelligence)
//   ascendant  -> userData.lagna (existing birth-chart field)
//   aspect     -> placeholder only (no existing static/computed source yet;
//                 deep aspect logic is explicitly out of scope for 5A)
//
// Keyboard support: ArrowDown/ArrowUp move a roving-tabindex cursor across
// every visible (category + item) row; ArrowRight/Enter/Space expands a
// category or selects an item; ArrowLeft collapses an expanded category.
// Home/End jump to the first/last visible row. This is the same "single
// tab-stop, arrow keys move a virtual cursor" pattern recommended for
// tree/listbox widgets, kept intentionally simple since 5A ships the
// framework only.
// ─────────────────────────────────────────────────────────────────────────

function buildItems(typeId, { userData, planetary, report }) {
  switch (typeId) {
    case "planet":
      return PLANETS.map((p) => ({
        id: p,
        label: p,
        sublabel: planetary?.[p] ? `H${planetary[p].house}` : undefined,
        color: PLANET_COLORS[p],
      }));
    case "house":
      return Object.entries(HOUSE_MEANINGS).map(([num, meaning]) => ({
        id: `house-${num}`,
        label: `House ${num}`,
        sublabel: meaning,
      }));
    case "sign":
      return SIGN_NAMES.map((s) => ({ id: s, label: s }));
    case "yoga":
      return (report?.chart?.yogas ?? []).map((y, idx) => ({
        id: `yoga-${idx}-${y.name}`, label: y.name, sublabel: y.detail,
      }));
    case "dosha":
      return (report?.chart?.doshas ?? []).map((d, idx) => ({
        id: `dosha-${idx}-${d.name}`, label: d.name, sublabel: d.detail,
      }));
    case "nakshatra":
      return report?.nakshatraProfile
        ? [{
            id: "nakshatra-profile",
            label: report.nakshatraProfile.nakshatra || report.nakshatraProfile.name,
            sublabel: report.nakshatraProfile.lord ? `Lord: ${report.nakshatraProfile.lord}` : undefined,
          }]
        : [];
    case "ascendant":
      return userData?.lagna ? [{ id: "ascendant", label: userData.lagna }] : [];
    case "aspect": {
      // V5.0 Phase 5B (Explorer Infrastructure — Backend Integration):
      // report.planetStrength[<plainName>].aspectInfluence is the real,
      // already-computed Aspect (Drishti) Rule Evaluator output (see
      // backend/services/rules/aspectRuleEvaluator.js via
      // planetStrengthRuleEvaluator.js) — this only reads it, exactly the
      // "later phase connects the real aspect engine here" this comment
      // used to point at. One list item per planet that currently
      // receives at least one aspect.
      const strength = report?.planetStrength;
      if (!strength) return [];
      return Object.entries(strength)
        .filter(([, profile]) => (profile?.aspectInfluence?.aspectedBy || []).length > 0)
        .map(([plainName, profile]) => {
          const { aspectedBy, netInfluence } = profile.aspectInfluence;
          return {
            id: `aspect-${plainName}`,
            label: `${plainName} ← ${aspectedBy.join(", ")}`,
            sublabel: `${aspectedBy.length} aspect${aspectedBy.length === 1 ? "" : "s"} · net ${netInfluence >= 0 ? "+" : ""}${netInfluence}`,
          };
        });
    }
    default:
      return [];
  }
}

function ExplorerSidePanel({ userData, planetary, report }) {
  const { selectedType, selectedItem, isSectionExpanded, toggleSection, selectItem,
          keyboardIndex, setKeyboardIndex, setFocusRegion } = useExplorer();
  const rowRefs = useRef([]);

  const data = useMemo(() => ({ userData, planetary, report }), [userData, planetary, report]);

  // Flatten categories + (if expanded) their items into one list of rows,
  // so arrow-key navigation can move through a single linear sequence.
  const rows = useMemo(() => {
    const out = [];
    EXPLORER_SELECTION_TYPES.forEach((type) => {
      const items = buildItems(type.id, data);
      out.push({ kind: "category", type, itemCount: items.length });
      if (isSectionExpanded(type.id)) {
        items.forEach((item) => out.push({ kind: "item", type, item }));
      }
    });
    return out;
  }, [data, isSectionExpanded]);

  rowRefs.current = rowRefs.current.slice(0, rows.length);

  const focusRow = useCallback((idx) => {
    const clamped = Math.max(0, Math.min(idx, rows.length - 1));
    setKeyboardIndex(clamped);
    rowRefs.current[clamped]?.focus();
  }, [rows.length, setKeyboardIndex]);

  const handleActivate = useCallback((idx) => {
    const row = rows[idx];
    if (!row) return;
    if (row.kind === "category") {
      toggleSection(row.type.id);
    } else {
      selectItem(row.type.id, row.item);
    }
  }, [rows, toggleSection, selectItem]);

  const handleKeyDown = useCallback((e, idx) => {
    const row = rows[idx];
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusRow(idx + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusRow(idx - 1);
        break;
      case "Home":
        e.preventDefault();
        focusRow(0);
        break;
      case "End":
        e.preventDefault();
        focusRow(rows.length - 1);
        break;
      case "ArrowRight":
        e.preventDefault();
        if (row?.kind === "category" && !isSectionExpanded(row.type.id)) toggleSection(row.type.id);
        else focusRow(idx + 1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        if (row?.kind === "category" && isSectionExpanded(row.type.id)) toggleSection(row.type.id);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        handleActivate(idx);
        break;
      default:
        break;
    }
  }, [rows, focusRow, toggleSection, isSectionExpanded, handleActivate]);

  return (
    <GlassCard
      style={{ padding: 12, display: "flex", flexDirection: "column", gap: 4, maxHeight: 560, overflowY: "auto" }}
      role="tree"
      aria-label="Explorer selection categories"
      onFocus={() => setFocusRegion("sidePanel")}
    >
      {rows.map((row, idx) => {
        const isFocusStop = idx === (keyboardIndex === -1 ? 0 : keyboardIndex);
        if (row.kind === "category") {
          const expanded = isSectionExpanded(row.type.id);
          return (
            <button
              key={row.type.id}
              ref={(el) => { rowRefs.current[idx] = el; }}
              type="button"
              role="treeitem"
              aria-expanded={expanded}
              aria-label={`${row.type.label} (${row.itemCount})`}
              tabIndex={isFocusStop ? 0 : -1}
              onFocus={() => setKeyboardIndex(idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              onClick={() => handleActivate(idx)}
              className="tap-scale"
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "8px 10px", background: "transparent", border: "none",
                borderRadius: 8, cursor: "pointer", textAlign: "left", font: "inherit",
                color: "var(--nv-text-primary, #e8d5ff)",
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 15 }}>{row.type.icon}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, fontFamily: "Inter,sans-serif" }}>
                {row.type.label}
              </span>
              <span style={{ fontSize: 11, color: "var(--nv-text-muted, rgba(200,160,255,0.5))" }}>{row.itemCount}</span>
              <span aria-hidden="true" style={{
                fontSize: 11, color: "var(--nv-text-muted, rgba(200,160,255,0.5))",
                transition: "transform var(--nv-duration-base) var(--nv-ease-standard)",
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              }}>▾</span>
            </button>
          );
        }

        const isSelected = selectedType === row.type.id
          && (selectedItem?.id ?? selectedItem) === (row.item.id ?? row.item);

        return (
          <div key={row.item.id} style={{ paddingLeft: 22 }} role="group">
            <ExplorerCard
              ref={(el) => { rowRefs.current[idx] = el; }}
              role="treeitem"
              label={row.item.label}
              sublabel={row.item.sublabel}
              color={row.item.color || row.type.color}
              selected={isSelected}
              tabIndex={isFocusStop ? 0 : -1}
              onClick={() => handleActivate(idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              onFocus={() => setKeyboardIndex(idx)}
            />
          </div>
        );
      })}
    </GlassCard>
  );
}

export default memo(ExplorerSidePanel);
