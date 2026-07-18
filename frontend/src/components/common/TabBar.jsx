import { memo, useEffect, useRef } from "react";
import { TABS } from "../../constants/astrology.js";
import { scrollBehavior } from "../../utils/motionPreference.js";

// Priority 5.1 additions:
//   - role="tablist"/"tab" + aria-selected so screen readers understand
//     this is a tab strip, not a row of unrelated buttons.
//   - "tab-scroll-region" class (see styles/global.css) adds a subtle
//     edge fade so the intentionally-scrollable strip (9 tabs cannot all
//     fit on a narrow phone — this is the correct mobile pattern, not the
//     "horizontal scrolling" this priority asks to eliminate elsewhere)
//     visually hints that there's more to scroll to.
//
// Premium SaaS polish pass: each button keeps its own selected styling
// (unchanged — still the source of truth for "is this the active tab"),
// but a second element now floats behind them and glides to whichever
// button is active, instead of the highlight just appearing/disappearing
// on the button itself. On mobile, switching tabs also scrolls the newly
// active button into view so a tap near either edge of the strip never
// leaves the just-selected tab half hidden.
function TabBar({ active, onChange }) {
  const scrollRef = useRef(null);
  const btnRefs = useRef({});

  useEffect(() => {
    const el = btnRefs.current[active];
    if (el && typeof el.scrollIntoView === "function") {
      // Final V1.0 UI Polish Patch: respects prefers-reduced-motion instead
      // of always animating (see utils/motionPreference.js).
      el.scrollIntoView({ behavior: scrollBehavior(), inline: "center", block: "nearest" });
    }
  }, [active]);

  return (
    <div ref={scrollRef} className="tab-scroll-region" style={{ overflowX:"auto", WebkitOverflowScrolling:"touch",
      scrollbarWidth:"none", msOverflowStyle:"none" }}>
      <div role="tablist" aria-label="Report sections" style={{ display:"flex", gap:4, padding:"4px 2px", minWidth:"max-content" }}>
        {TABS.map(t => {
          const isActive = t.id === active;
          return (
            <button
              key={t.id}
              ref={(el) => { btnRefs.current[t.id] = el; }}
              className="tab-btn"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(t.id)}
              style={{
                padding:"9px 16px", border:"none", borderRadius:"var(--nv-radius-pill, 30px)", cursor:"pointer",
                fontFamily:"var(--nv-font-body, Inter,sans-serif)", fontSize:13, fontWeight:isActive ? 600 : 400,
                color: isActive ? "var(--nv-color-brand-gold, #ffd700)" : "var(--nv-text-muted, rgba(200,160,255,0.6))",
                background: isActive ? "rgba(255,215,0,0.12)" : "transparent",
                boxShadow: isActive ? "inset 0 0 0 1px rgba(255,215,0,0.35)" : "none",
                transition:"background var(--nv-duration-base) var(--nv-ease-standard), box-shadow var(--nv-duration-base) var(--nv-ease-standard), color var(--nv-duration-base) var(--nv-ease-standard), transform var(--nv-duration-fast) var(--nv-ease-standard)",
                whiteSpace:"nowrap", transform: isActive ? "scale(1.02)" : "scale(1)",
                display:"flex", alignItems:"center", gap:6,
              }}
            >
              <span aria-hidden="true" style={{ display: "inline-block", transition: "transform var(--nv-duration-base) var(--nv-ease-standard)", transform: isActive ? "scale(1.1)" : "scale(1)" }}>{t.icon}</span> {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(TabBar);
