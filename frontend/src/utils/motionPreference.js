// ─────────────────────────────────────────────────────────────────────────
// motionPreference (Final V1.0 UI Polish Patch — Accessibility)
//
// styles/global.css already forces every CSS animation/transition to be
// near-instant when the OS/browser reports `prefers-reduced-motion: reduce`.
// That override cannot reach one thing, though: calls like
// `element.scrollIntoView({ behavior: "smooth" })` are driven by JS, not
// CSS, so a handful of call sites (Navbar's nav-link scrolling, Footer's
// footer-link scrolling, TabBar's active-tab auto-scroll, Dashboard's
// "Saved Reports" jump) were still animating smoothly regardless of that
// preference.
//
// `scrollBehavior()` is a single, presentation-only helper those call sites
// use instead of the hardcoded string "smooth" — it does not change what
// scrolls where, only whether the scroll animates or jumps instantly.
// ─────────────────────────────────────────────────────────────────────────
export function prefersReducedMotion() {
  // Phase 6.4 (Account Settings & Preferences): the Settings page's
  // "Animation Level" preference sets a `data-motion="reduced"|"none"`
  // attribute on <html> (see utils/settingsStorage.js#applyAnimationLevel)
  // as an explicit, in-app override of the OS-level signal this function
  // already checked. Either one being true means "prefer reduced motion" —
  // the OS check below is completely unchanged.
  try {
    const motion = document?.documentElement?.dataset?.motion;
    if (motion === "reduced" || motion === "none") return true;
  } catch {
    // no-op outside a DOM environment
  }
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function scrollBehavior() {
  return prefersReducedMotion() ? "auto" : "smooth";
}
