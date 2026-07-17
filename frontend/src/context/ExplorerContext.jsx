import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { EXPLORER_DEFAULT_EXPANDED } from "../constants/explorer.js";

// ─────────────────────────────────────────────────────────────────────────
// V5.1 (Interactive Kundli / Explorer Integration) addition:
//
// ExplorerTab.jsx wraps its own <ExplorerProvider> so it keeps working
// standalone (own selection state resets when the tab unmounts — see its
// header comment). V5.1 needs the *Kundli* tab's clicks to land on the
// *same* selection the Explorer tab renders, which means both need to
// share one ExplorerProvider instance further up the tree (ResultsPage).
//
// Rather than remove ExplorerTab's own provider (which several existing
// tests instantiate standalone, with no outer provider, and expect to
// keep working), ExplorerProvider now checks whether it's already nested
// inside another ExplorerProvider. If so, it's a no-op passthrough that
// reuses the existing (outer) state instead of creating a second,
// disconnected copy. Standalone usage (no outer provider) is completely
// unaffected — `existing` is null and behavior is byte-for-byte unchanged.
// ─────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────
// ExplorerContext (V5.0 Phase 5A — Explorer Infrastructure)
//
// Owns the small piece of shared state every Explorer piece
// (ExplorerSidePanel / ExplorerMainPanel / ExplorerHeader / the future
// detail panels) needs to agree on:
//
//   - selectedType / selectedItem — what's currently open in the main panel
//   - expandedSections            — which side-panel categories are open
//   - keyboardIndex / focusRegion — enough to drive roving-tabindex
//                                   keyboard navigation and know which
//                                   region (side panel vs main panel)
//                                   currently owns focus
//
// This is presentation/UI state only — no astrology data, no backend
// calls, no computation. It's local, in-memory React state (a plain
// `createContext` + hooks, exactly like `ThemeContext`/`AuthContext`
// already in this folder), scoped to the Explorer tab only.
// ─────────────────────────────────────────────────────────────────────────

const ExplorerContext = createContext(null);

export function ExplorerProvider({ children }) {
  const existing = useContext(ExplorerContext);

  // Already inside an ExplorerProvider further up the tree — reuse that
  // shared state instead of shadowing it with a fresh, disconnected copy.
  // eslint-disable-next-line react-hooks/rules-of-hooks -- existing is
  // stable for the lifetime of a given render tree position.
  if (existing) {
    return children;
  }

  const [selectedType, setSelectedType] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [expandedSections, setExpandedSections] = useState(EXPLORER_DEFAULT_EXPANDED);
  const [keyboardIndex, setKeyboardIndex] = useState(-1);
  const [focusRegion, setFocusRegion] = useState(null); // "sidePanel" | "mainPanel" | null

  // Selecting an item always makes sure its own category is expanded, so
  // the highlighted row in the side panel is never hidden behind a
  // collapsed section.
  const selectItem = useCallback((type, item) => {
    setSelectedType(type);
    setSelectedItem(item);
    setExpandedSections((prev) => (prev[type] ? prev : { ...prev, [type]: true }));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedType(null);
    setSelectedItem(null);
  }, []);

  const toggleSection = useCallback((typeId) => {
    setExpandedSections((prev) => ({ ...prev, [typeId]: !prev[typeId] }));
  }, []);

  const isSectionExpanded = useCallback(
    (typeId) => Boolean(expandedSections[typeId]),
    [expandedSections]
  );

  const value = useMemo(() => ({
    selectedType,
    selectedItem,
    expandedSections,
    keyboardIndex,
    focusRegion,
    selectItem,
    clearSelection,
    toggleSection,
    isSectionExpanded,
    setKeyboardIndex,
    setFocusRegion,
  }), [selectedType, selectedItem, expandedSections, keyboardIndex, focusRegion,
      selectItem, clearSelection, toggleSection, isSectionExpanded]);

  return <ExplorerContext.Provider value={value}>{children}</ExplorerContext.Provider>;
}

export function useExplorer() {
  const ctx = useContext(ExplorerContext);
  if (!ctx) {
    throw new Error("useExplorer must be used within an ExplorerProvider");
  }
  return ctx;
}
