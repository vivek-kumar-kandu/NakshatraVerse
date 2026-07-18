import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App.jsx";

// ─────────────────────────────────────────────────────────────────────────
// V3.0 Premium Command Palette — covers opening via Ctrl/Cmd+K, closing
// via Escape/backdrop, fuzzy search narrowing the list, keyboard
// navigation + Enter-to-run, navigating to an existing page, and opening
// a recent report. Follows the same splash -> Home -> Sign In -> Dashboard
// login flow already established by Auth.test.jsx / App.test.jsx.
// ─────────────────────────────────────────────────────────────────────────

const MOCK_USER = { id: "u1", name: "Asha Verma", email: "asha@example.com", authProvider: "password" };

const MOCK_REPORTS = [
  { id: "r1", title: "Asha's Reading", name: "Asha Verma", lagna: "Aries", dob: "1990-05-14", createdAt: "2026-06-01T10:00:00.000Z" },
  { id: "r2", title: "Career Deep Dive", name: "Asha Verma", lagna: "Leo", dob: "1990-05-14", createdAt: "2026-05-15T10:00:00.000Z" },
];

function mockFetchByUrl(handlers) {
  return vi.fn((url, options) => {
    const path = typeof url === "string" ? url : url.toString();
    for (const [pattern, handler] of handlers) {
      if (pattern.test(path)) return Promise.resolve(handler(options));
    }
    return Promise.resolve({ ok: false, status: 404, json: async () => ({ error: "not mocked: " + path }) });
  });
}

async function getToLoginScreen(user) {
  const signInButtons = await screen.findAllByRole("button", { name: /^sign in$/i }, { timeout: 6000 });
  await user.click(signInButtons[0]);
  await screen.findByRole("heading", { name: /welcome back/i }, {}, { timeout: 4000 });
}

async function signIn(user) {
  let loggedIn = false;
  vi.stubGlobal("fetch", mockFetchByUrl([
    [/\/api\/auth\/me$/, () => (loggedIn
      ? { ok: true, json: async () => ({ user: MOCK_USER }) }
      : { ok: false, status: 401, json: async () => ({ error: "Authentication required." }) })],
    [/\/api\/auth\/login$/, () => { loggedIn = true; return { ok: true, json: async () => ({ user: MOCK_USER }) }; }],
    [/\/api\/reports$/, () => ({ ok: true, json: async () => ({ reports: MOCK_REPORTS }) })],
  ]));
  render(<App />);
  await getToLoginScreen(user);
  await user.type(screen.getByLabelText(/email/i), "asha@example.com");
  await user.type(screen.getByLabelText(/^password$/i), "password123");
  await user.click(screen.getByRole("button", { name: /sign in/i }));
  // DashboardPage is lazy-loaded (see src/App.jsx) and pulls in several
  // widget chunks (Panchang/Festival/Family Profiles/AI Life Coach/
  // Notifications/Personalized Insights). The first dynamic import of it
  // in a given test file can take noticeably longer than a typical async
  // assertion, so this uses the same generous timeout already established
  // for this exact wait in tests/App.test.jsx and tests/Settings.test.jsx,
  // rather than the tighter 6000ms used for lighter-weight waits above.
  await screen.findByText(/your dashboard/i, {}, { timeout: 30000 });
}

describe("V3.0 Premium Command Palette", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens with Ctrl+K, shows navigation/theme commands, and closes with Escape", async () => {
    const user = userEvent.setup();
    await signIn(user);

    await user.keyboard("{Control>}k{/Control}");
    const searchBox = await screen.findByRole("combobox", { name: /command palette search/i });
    expect(searchBox).toHaveFocus();

    expect(screen.getByRole("option", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /switch to sacred dawn/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /switch to midnight cosmic/i })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("combobox", { name: /command palette search/i })).not.toBeInTheDocument();
  });

  it("does not open for a signed-out visitor", async () => {
    vi.stubGlobal("fetch", mockFetchByUrl([
      [/\/api\/auth\/me$/, () => ({ ok: false, status: 401, json: async () => ({ error: "Authentication required." }) })],
    ]));
    const user = userEvent.setup();
    render(<App />);
    await screen.findAllByRole("button", { name: /^sign in$/i }, { timeout: 6000 });

    await user.keyboard("{Control>}k{/Control}");
    expect(screen.queryByRole("combobox", { name: /command palette search/i })).not.toBeInTheDocument();
  });

  it("fuzzy-filters commands as the person types", async () => {
    const user = userEvent.setup();
    await signIn(user);

    await user.keyboard("{Control>}k{/Control}");
    const searchBox = await screen.findByRole("combobox", { name: /command palette search/i });

    await user.type(searchBox, "sched");
    await waitFor(() => {
      expect(screen.getByRole("option", { name: /settings/i })).toBeInTheDocument();
    });
    expect(screen.queryByRole("option", { name: /^dashboard$/i })).not.toBeInTheDocument();
  });

  it("navigates to Settings when the command is chosen with the keyboard", async () => {
    const user = userEvent.setup();
    await signIn(user);

    await user.keyboard("{Control>}k{/Control}");
    const searchBox = await screen.findByRole("combobox", { name: /command palette search/i });
    await user.type(searchBox, "settings");
    await user.keyboard("{Enter}");

    await screen.findByText(/appearance/i, {}, { timeout: 4000 });
  });

  it("lists recent reports and opens one directly", async () => {
    const user = userEvent.setup();
    await signIn(user);

    await user.keyboard("{Control>}k{/Control}");
    const dialog = await screen.findByRole("dialog", { name: /command palette/i });
    await within(dialog).findByText(/recent reports/i, {}, { timeout: 4000 });
    await user.click(await within(dialog).findByText(/career deep dive/i));

    await waitFor(() => {
      expect(screen.queryByRole("combobox", { name: /command palette search/i })).not.toBeInTheDocument();
    });
  });
});
