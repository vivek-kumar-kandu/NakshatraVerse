import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";
import { configure } from "@testing-library/react";

// Testing Library's default async timeout for findBy*/waitFor calls that
// don't pass their own explicit `timeout` option is 1000ms. That's tight
// enough on a fast machine but flaky on a CPU-constrained one — e.g.
// ExplorerTab.test.jsx's `findByRole("heading", { name: /Sun/i })` waits on
// a React.lazy()-loaded chunk, which is normally near-instant but can
// legitimately take longer than 1s when many test files are running in
// parallel and competing for CPU. Raising the shared default here (rather
// than hand-patching every call site) makes the whole suite more robust to
// slower hardware without masking real bugs — a genuinely broken render
// still fails, just after a more realistic wait.
configure({ asyncUtilTimeout: 8000 });

// Priority 6.2.1: App.jsx now remembers (via sessionStorage) whether the
// splash screen has already been shown this "launch", so it only appears
// once. Tests in this suite share a single jsdom `window` across cases in
// the same file, so without this reset the flag set by an earlier test
// would leak into later ones and skip the splash unexpectedly. Clearing it
// before every test keeps each test's initial render behaving like a
// genuinely fresh app launch.
//
// localStorage is cleared for the same reason: ThemeContext.jsx,
// settingsStorage.js, and profilePhoto.js all persist to localStorage, and
// jsdom's `window` (and its storage) persists across every test in the
// same file, not just sessionStorage. Without this, a theme switch or
// settings change made by an earlier test (e.g. CommandPalette.test.jsx's
// "switch to sacred dawn"/"switch to midnight cosmic" commands) leaks into
// later tests in that file instead of each test starting from a clean
// launch.
beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

// jsdom doesn't implement Element.scrollIntoView at all (throws "not a
// function"). Navbar.jsx's scrollToId() calls it for in-page section
// navigation (Home/Features/About/FAQ) — harmless and correct in every
// real browser, but needs a no-op stand-in here so tests that click those
// links don't crash on an environment gap that has nothing to do with the
// app's own behavior.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
