import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App.jsx";

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

// Priority 6.1: every app load now shows the splash screen and then the
// new marketing Home page before any authentication screen. This helper
// waits out the splash and uses Home's "Sign In" affordance (present in
// both the navbar and the guest hero) to reach the pre-existing,
// unmodified Login page the rest of these tests exercise.
async function getToLoginScreen(user) {
  const signInButtons = await screen.findAllByRole(
    "button", { name: /^sign in$/i }, { timeout: 6000 }
  );
  await user.click(signInButtons[0]);
  await screen.findByRole("heading", { name: /welcome back/i }, {}, { timeout: 4000 });
}

describe("Priority 5.2: Authentication + Dashboard flow", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the marketing Home page first for a logged-out visitor, with Sign In reaching the existing Login screen", async () => {
    vi.stubGlobal("fetch", mockFetchByUrl([
      [/\/api\/auth\/me$/, () => ({ ok: false, status: 401, json: async () => ({ error: "Authentication required." }) })],
    ]));

    const user = userEvent.setup();
    render(<App />);

    // Priority 6.1: unauthenticated visitors now land on the new marketing
    // Home page first (splash → Home), with its guest hero offering
    // "Get Started" / "Sign In".
    // Priority 6.2.1 test fix: SplashScreen and HomePage's hero both use
    // the exact tagline "Discover Your Cosmic Blueprint" — asserting on
    // that text alone could resolve while the splash (not Home) is still
    // showing. The "AI-Powered Vedic Astrology" eyebrow is unique to
    // HomePage's guest hero, so wait on that instead to know Home has
    // actually mounted before checking for its Sign In / Get Started CTAs.
    expect(await screen.findByText(/AI-Powered Vedic Astrology/i, {}, { timeout: 6000 })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^sign in$/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /get started/i }).length).toBeGreaterThan(0);

    // Sign In still reaches the pre-existing, unmodified Login screen.
    await getToLoginScreen(user);
    expect(screen.getByRole("button", { name: /back to home/i })).toBeInTheDocument();
  });

  it("logs in successfully and reaches the dashboard with saved reports", async () => {
    let loggedIn = false;
    vi.stubGlobal("fetch", mockFetchByUrl([
      [/\/api\/auth\/me$/, () => (loggedIn
        ? { ok: true, json: async () => ({ user: MOCK_USER }) }
        : { ok: false, status: 401, json: async () => ({ error: "Authentication required." }) })],
      [/\/api\/auth\/login$/, () => { loggedIn = true; return { ok: true, json: async () => ({ user: MOCK_USER }) }; }],
      [/\/api\/reports$/, () => ({ ok: true, json: async () => ({ reports: [
        { id: "r1", title: "Asha's Reading", createdAt: new Date().toISOString(), name: "Asha Verma", dob: "1990-05-14", lagna: "Aries" },
      ] }) })],
    ]));

    const user = userEvent.setup();
    render(<App />);

    await getToLoginScreen(user);

    await user.type(screen.getByLabelText(/email/i), "asha@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(screen.getByText(/your dashboard/i)).toBeInTheDocument());
    // Priority 6.4: the Dashboard redesign (Priority 6.3) shows each saved
    // report in two places at once — the "Recent Reports" strip (most
    // recent 3) and the full "Saved Reports" archive below it — both
    // rendering the same report title. With a single saved report, that's
    // two on-screen matches for "Asha's Reading", so the singular
    // `findByText` used here previously threw ("Found multiple elements
    // with the text..."). `findAllByText` + a length assertion mirrors the
    // same "appears somewhere on screen" check without assuming there's
    // exactly one match, matching the pattern already used elsewhere in
    // this suite (e.g. App.test.jsx's `getAllByText(/Asha Verma/i)`).
    const readingMatches = await screen.findAllByText(/Asha's Reading/i);
    expect(readingMatches.length).toBeGreaterThan(0);
  });

  it("shows an error message for invalid login credentials without crashing", async () => {
    vi.stubGlobal("fetch", mockFetchByUrl([
      [/\/api\/auth\/me$/, () => ({ ok: false, status: 401, json: async () => ({ error: "Authentication required." }) })],
      [/\/api\/auth\/login$/, () => ({ ok: false, status: 401, json: async () => ({ error: "Invalid email or password." }) })],
    ]));

    const user = userEvent.setup();
    render(<App />);

    await getToLoginScreen(user);

    await user.type(screen.getByLabelText(/email/i), "asha@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/invalid email or password/i);
  });
});
