import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App.jsx";

// ─────────────────────────────────────────────────────────────────────────
// Priority 6.2.1: covers the navigation fixes made in this priority —
// "← Back to home" on Login/Signup/Forgot Password correctly reaching the
// marketing Home page (stage "home") instead of the old birth-details form
// (this codebase's internal "landing" stage — see App.jsx's Priority 6.2.1
// comments), plus the new "← Back to home" link added to Forgot Password.
// Follows the same splash -> Home -> Sign In navigation pattern already
// established by Auth.test.jsx / ForgotPassword.test.jsx.
// ─────────────────────────────────────────────────────────────────────────
function mockFetchByUrl(handlers) {
  return vi.fn((url) => {
    const path = typeof url === "string" ? url : url.toString();
    for (const [pattern, handler] of handlers) {
      if (pattern.test(path)) return Promise.resolve(handler());
    }
    return Promise.resolve({ ok: false, status: 404, json: async () => ({ error: "not mocked: " + path }) });
  });
}

const LOGGED_OUT = mockFetchByUrl([
  [/\/api\/auth\/me$/, () => ({ ok: false, status: 401, json: async () => ({ error: "Authentication required." }) })],
]);

async function getToLoginScreen(user) {
  const signInButtons = await screen.findAllByRole("button", { name: /^sign in$/i }, { timeout: 6000 });
  await user.click(signInButtons[0]);
  await screen.findByRole("heading", { name: /welcome back/i }, {}, { timeout: 4000 });
}

// The marketing Home page (stage "home") is uniquely identifiable by its
// "AI-Powered Vedic Astrology" eyebrow text (see the Auth.test.jsx fix
// above for why the shared tagline text isn't used for this).
async function expectOnHomePage() {
  await screen.findByText(/AI-Powered Vedic Astrology/i, {}, { timeout: 4000 });
}

// The old birth-details form (pages/LandingPage.jsx) — asserting its
// absence is exactly what proves "Back to home" no longer routes there.
function birthFormIsAbsent() {
  expect(screen.queryByText(/Reveal Your Cosmic Blueprint/i)).not.toBeInTheDocument();
}

describe("Priority 6.2.1: Back to Home navigation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("Login's ← Back to home reaches the marketing Home page, never the old birth form", async () => {
    vi.stubGlobal("fetch", LOGGED_OUT);
    const user = userEvent.setup();
    render(<App />);

    await getToLoginScreen(user);
    await user.click(screen.getByRole("button", { name: /back to home/i }));

    await expectOnHomePage();
    birthFormIsAbsent();
  });

  it("Signup's ← Back to home reaches the marketing Home page, never the old birth form", async () => {
    vi.stubGlobal("fetch", LOGGED_OUT);
    const user = userEvent.setup();
    render(<App />);

    await getToLoginScreen(user);
    await user.click(screen.getByRole("button", { name: /create an account/i }));
    await screen.findByRole("heading", { name: /create your account/i }, {}, { timeout: 4000 });

    await user.click(screen.getByRole("button", { name: /back to home/i }));

    await expectOnHomePage();
    birthFormIsAbsent();
  });

  it("Forgot Password now has its own ← Back to home link, reaching the marketing Home page", async () => {
    vi.stubGlobal("fetch", LOGGED_OUT);
    const user = userEvent.setup();
    render(<App />);

    await getToLoginScreen(user);
    await user.click(screen.getByRole("button", { name: /forgot password/i }));
    await screen.findByRole("heading", { name: /reset your password/i }, {}, { timeout: 4000 });

    await user.click(screen.getByRole("button", { name: /back to home/i }));

    await expectOnHomePage();
    birthFormIsAbsent();
  });

  it("Navbar's Home link and logo both reach/stay on the marketing Home page", async () => {
    vi.stubGlobal("fetch", LOGGED_OUT);
    const user = userEvent.setup();
    render(<App />);

    await expectOnHomePage();

    await user.click(screen.getByRole("button", { name: /nakshatraverse — home/i }));
    await expectOnHomePage();
    birthFormIsAbsent();

    const homeLinks = screen.getAllByRole("button", { name: /^home$/i });
    await user.click(homeLinks[0]);
    await expectOnHomePage();
    birthFormIsAbsent();
  });
});
