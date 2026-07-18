import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App.jsx";

const MOCK_REPORT = {
  loveLife: "a", career: "b", finance: "c", health: "d", marriage: "e",
  doshas: "f", yogas: "g", remedies: "h", lifeSummary: "i",
  chart: {
    numerology: { mulank: 5, bhagyank: 11 },
    planetary: {
      "Sun ☀️": { house: 1, sign: "Aries" }, "Moon 🌙": { house: 2, sign: "Taurus" },
      "Mars ♂": { house: 3, sign: "Gemini" }, "Mercury ☿": { house: 4, sign: "Cancer" },
      "Jupiter ♃": { house: 5, sign: "Leo" }, "Venus ♀": { house: 6, sign: "Virgo" },
      "Saturn ♄": { house: 7, sign: "Libra" }, "Rahu 🌑": { house: 8, sign: "Scorpio" },
      "Ketu 🌕": { house: 9, sign: "Sagittarius" },
    },
    lagna: "Aries",
  },
};

async function fillAndSubmitForm(user) {
  await user.type(screen.getByLabelText(/Full Name/i), "Asha Verma");
  fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: "1990-05-14" } });
  fireEvent.change(screen.getByLabelText(/Time of Birth/i), { target: { value: "08:30" } });
  await user.type(screen.getByLabelText(/Place of Birth/i), "Lucknow");
  fireEvent.click(screen.getByRole("button", { name: /Generate My Kundli/i }));
}

const MOCK_USER = { id: "u1", name: "Asha Verma", email: "asha@example.com", authProvider: "password" };

function mockFetchByUrl(handlers) {
  return vi.fn((url, options) => {
    const path = typeof url === "string" ? url : url.toString();
    for (const [pattern, handler] of handlers) {
      if (pattern.test(path)) return Promise.resolve(handler(options));
    }
    return Promise.resolve({ ok: false, status: 404, json: async () => ({ error: "not mocked: " + path }) });
  });
}

// Priority 6.1: every app load now shows the splash screen (~3.2s, its own
// fixed timer) and then the new marketing Home page, before any
// authentication screen is reached. This app-level test previously started
// its assertions from the Login screen directly (Priority 5.3 behavior);
// it now first waits out the splash, then uses Home's "Sign In" affordance
// (present both in the navbar and the hero for a guest) to reach the
// pre-existing, unmodified Login page the rest of this test exercises.
async function getToLoginScreen(user) {
  const signInButtons = await screen.findAllByRole(
    "button", { name: /^sign in$/i }, { timeout: 6000 }
  );
  await user.click(signInButtons[0]);
  await screen.findByRole("heading", { name: /welcome back/i }, {}, { timeout: 8000 });
}

// Priority 6.2.1: previously this test reached the birth-details form
// (pages/LandingPage.jsx, stage "landing") via LoginPage's "← Back to
// home" link — which was actually a mislabeled-navigation bug: "landing"
// is this codebase's internal name for the old birth form, not the
// marketing Home page, so that link was silently skipping sign-in
// entirely. Priority 6.2.1 fixes "← Back to home" to correctly reach the
// marketing Home page (stage "home") instead. The birth-details form's
// real, intended entry point — unchanged by this priority — is the
// Dashboard's primary CTA button, so this test signs in first and reaches
// the form that way, preserving full coverage of the landing -> loading
// -> results pipeline below.
// Priority 6.3: the Dashboard redesign relabels this button from
// "✦ New Reading" to "✦ Generate New Report" (per this priority's explicit
// requirement) — it still calls the exact same onNavigate("landing"), so
// only the accessible-name match below needed updating.
async function getToBirthForm(user) {
  await getToLoginScreen(user);
  await user.type(screen.getByLabelText(/email/i), "asha@example.com");
  await user.type(screen.getByLabelText(/^password$/i), "password123");
  await user.click(screen.getByRole("button", { name: /sign in/i }));
  await screen.findByText(/your dashboard/i, {}, { timeout: 30000 });
  await user.click(screen.getAllByRole("button", { name: /generate new report/i })[0]);
  await screen.findByText(/Reveal Your Cosmic Blueprint/i, {}, { timeout: 4000 });
}

describe("App (full flow, Priority 5.1 regression)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("goes landing -> loading -> results (lazy-loaded) without throwing, and renders the tab bar", async () => {
    let loggedIn = false;
    vi.stubGlobal("fetch", mockFetchByUrl([
      [/\/api\/auth\/me$/, () => (loggedIn
        ? { ok: true, json: async () => ({ user: MOCK_USER }) }
        : { ok: false, status: 401, json: async () => ({ error: "Authentication required." }) })],
      [/\/api\/auth\/login$/, () => { loggedIn = true; return { ok: true, json: async () => ({ user: MOCK_USER }) }; }],
      [/\/api\/reports$/, () => ({ ok: true, json: async () => ({ reports: [] }) })],
      [/\/api\/generate-report$/, () => ({ ok: true, json: async () => MOCK_REPORT })],
    ]));
    const user = userEvent.setup();
    render(<App />);

    await getToBirthForm(user);

    await fillAndSubmitForm(user);

    // Loading stage (immediately after submit)
    expect(await screen.findByText(/Preparing cosmic chart for/i)).toBeInTheDocument();

    // Results stage: the lazy-loaded ResultsPage chunk resolves and the
    // tablist (Priority 5.1 a11y addition) renders.
    await waitFor(
      () => expect(screen.getByRole("tablist", { name: /Report sections/i })).toBeInTheDocument(),
      { timeout: 10000 }
    );

    // Backend-authoritative data made it into the UI.
    expect(screen.getAllByText(/Asha Verma/i).length).toBeGreaterThan(0);
  });

  it("shows a dismissable-by-navigation error banner if the backend call fails, without crashing", async () => {
    let loggedIn = false;
    vi.stubGlobal("fetch", mockFetchByUrl([
      [/\/api\/auth\/me$/, () => (loggedIn
        ? { ok: true, json: async () => ({ user: MOCK_USER }) }
        : { ok: false, status: 401, json: async () => ({ error: "Authentication required." }) })],
      [/\/api\/auth\/login$/, () => { loggedIn = true; return { ok: true, json: async () => ({ user: MOCK_USER }) }; }],
      [/\/api\/reports$/, () => ({ ok: true, json: async () => ({ reports: [] }) })],
      [/\/api\/generate-report$/, () => ({ ok: false, status: 502, json: async () => ({ error: "Gemini is unavailable right now." }) })],
    ]));
    const user = userEvent.setup();
    render(<App />);

    await getToBirthForm(user);
    await fillAndSubmitForm(user);

    await waitFor(
      () => expect(screen.getByText(/AI report unavailable.*Gemini is unavailable right now/i)).toBeInTheDocument(),
      { timeout: 10000 }
    );
    // The rest of the results UI should still render around the error,
    // once the loading screen's own minimum-duration timer finishes and
    // the stage transitions to "results" (same pattern as the success
    // test above — the error can arrive before that transition does).
    await waitFor(
      () => expect(screen.getByRole("tablist", { name: /Report sections/i })).toBeInTheDocument(),
      { timeout: 10000 }
    );
  });
});
