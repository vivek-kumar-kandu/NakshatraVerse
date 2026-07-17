import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App.jsx";

// ─────────────────────────────────────────────────────────────────────────
// V2.0 — Phase 6.4: Account Settings & Preferences
//
// Covers the one new user-facing flow this phase adds: reaching the new
// Settings page from AccountMenu, its five sections rendering, Appearance
// (theme) selection persisting to localStorage and applying via
// `data-theme` on <html>, and a Preferences change persisting to
// localStorage — using the exact same login → dashboard mocked-fetch
// pattern already established in Auth.test.jsx.
// ─────────────────────────────────────────────────────────────────────────

const MOCK_USER = {
  id: "u1", name: "Asha Verma", email: "asha@example.com",
  authProvider: "password", createdAt: "2024-01-15T00:00:00.000Z",
};

function mockFetchByUrl(handlers) {
  return vi.fn((url, options) => {
    const path = typeof url === "string" ? url : url.toString();
    for (const [pattern, handler] of handlers) {
      if (pattern.test(path)) return Promise.resolve(handler(options));
    }
    return Promise.resolve({ ok: false, status: 404, json: async () => ({ error: "not mocked: " + path }) });
  });
}

const LOGGED_IN = mockFetchByUrl([
  [/\/api\/auth\/me$/, () => ({ ok: true, json: async () => ({ user: MOCK_USER }) })],
  [/\/api\/reports$/, () => ({ ok: true, json: async () => ({ reports: [] }) })],
]);

// Priority 6.1 (Splash + marketing Home page) note, mirrored from
// Auth.test.jsx's own `getToLoginScreen`: every app load — including an
// already-authenticated session, which is what these Settings tests mock
// via a `LOGGED_IN` GET /api/auth/me — now shows Splash then the Home page
// first. An authenticated visitor lands on Home's "Welcome Back" hero, not
// straight on the Dashboard, and reaches Dashboard only via an explicit
// "Go to Dashboard" click (see HomePage.jsx). This helper waits out
// Splash + Home (findAllByRole, same 6000ms allowance used elsewhere in
// this suite for Splash's ~3200ms timer) and performs that click.
//
// HomePage renders a "✦ Go to Dashboard ✦" button twice for an
// authenticated visitor — once in the hero, once in the lower "Ready to
// explore more?" CTA — so this deliberately uses `findAllByRole` (not the
// singular `findByRole`, which throws on multiple matches) and clicks
// whichever one resolves first, exactly like Auth.test.jsx's
// `getToLoginScreen` already does for Home's guest "Sign In" buttons.
async function getToDashboard(user) {
  const dashboardButtons = await screen.findAllByRole(
    "button", { name: /go to dashboard/i }, { timeout: 6000 }
  );
  await user.click(dashboardButtons[0]);
  await waitFor(() => expect(screen.getByText(/your dashboard/i)).toBeInTheDocument(), { timeout: 30000 });
}

// Used after navigating *within* the already-authenticated app (e.g.
// Settings' "Back to Dashboard" button) — at that point Home's "Go to
// Dashboard" button no longer exists on screen, so this just waits for the
// Dashboard heading directly rather than re-running the Home-page flow.
async function confirmOnDashboard() {
  await waitFor(() => expect(screen.getByText(/your dashboard/i)).toBeInTheDocument(), { timeout: 30000 });
}

async function openAccountMenuAndGoToSettings(user) {
  const trigger = await screen.findByRole("button", { name: /account menu for asha verma/i }, { timeout: 8000 });
  await user.click(trigger);
  await user.click(await screen.findByRole("menuitem", { name: /settings/i }));
  await screen.findByRole("heading", { name: /^settings$/i }, {}, { timeout: 8000 });
}

describe("V2.0 Phase 6.4: Account Settings & Preferences", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-motion");
  });

  it("reaches Settings from AccountMenu and shows the Account section by default", async () => {
    vi.stubGlobal("fetch", LOGGED_IN);
    const user = userEvent.setup();
    render(<App />);

    await getToDashboard(user);
    await openAccountMenuAndGoToSettings(user);

    // Account section (the default) shows the signed-in profile fields.
    expect(screen.getByText(/asha@example.com/i)).toBeInTheDocument();
    expect(screen.getAllByText(/asha verma/i).length).toBeGreaterThan(0);

    // All five section tabs are present.
    for (const label of [/account/i, /appearance/i, /preferences/i, /privacy/i, /about/i]) {
      expect(screen.getByRole("tab", { name: label })).toBeInTheDocument();
    }
  });

  it("selecting a theme persists it and applies data-theme to <html>", async () => {
    vi.stubGlobal("fetch", LOGGED_IN);
    const user = userEvent.setup();
    render(<App />);

    await getToDashboard(user);
    await openAccountMenuAndGoToSettings(user);

    await user.click(screen.getByRole("tab", { name: /appearance/i }));
    await user.click(await screen.findByRole("radio", { name: /sacred dawn/i }));

    await waitFor(() => expect(document.documentElement.getAttribute("data-theme")).toBe("light"));
    expect(localStorage.getItem("nv_theme")).toBe("light");
  });

  it("changing the Default Dashboard View preference persists to localStorage", async () => {
    vi.stubGlobal("fetch", LOGGED_IN);
    const user = userEvent.setup();
    render(<App />);

    await getToDashboard(user);
    await openAccountMenuAndGoToSettings(user);

    await user.click(screen.getByRole("tab", { name: /preferences/i }));
    await user.click(await screen.findByRole("radio", { name: /list/i }));

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem("nv_preferences") || "{}");
      expect(saved.dashboardView).toBe("list");
    });
  });

  it("Back to Dashboard returns to the Dashboard stage", async () => {
    vi.stubGlobal("fetch", LOGGED_IN);
    const user = userEvent.setup();
    render(<App />);

    await getToDashboard(user);
    await openAccountMenuAndGoToSettings(user);

    await user.click(screen.getByRole("button", { name: /back to dashboard/i }));
    // Already past Home at this point (this is an in-app "settings" ->
    // "dashboard" stage change, not a fresh app load), so Home's "Go to
    // Dashboard" button is no longer on screen — just confirm the
    // Dashboard heading itself, rather than re-running the Home-page flow.
    await confirmOnDashboard();
  });
});
