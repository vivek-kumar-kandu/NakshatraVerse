import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App.jsx";

// Priority 6.2: covers the new Forgot Password screen reached from
// LoginPage, plus the Priority 6.2 inline-validation additions to
// LoginPage/SignupPage. Follows the same splash -> Home -> Sign In
// navigation helper pattern introduced by Priority 6.1's Auth.test.jsx.
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
  const signInButtons = await screen.findAllByRole(
    "button", { name: /^sign in$/i }, { timeout: 6000 }
  );
  await user.click(signInButtons[0]);
  await screen.findByRole("heading", { name: /welcome back/i }, {}, { timeout: 4000 });
}

describe("Priority 6.2: Forgot Password + validation additions", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("navigates from Login to Forgot Password and shows the generic confirmation on submit", async () => {
    vi.stubGlobal("fetch", mockFetchByUrl([
      [/\/api\/auth\/me$/, () => ({ ok: false, status: 401, json: async () => ({ error: "Authentication required." }) })],
      [/\/api\/auth\/forgot-password$/, () => ({ ok: false, status: 404, json: async () => ({ error: "not found" }) })],
    ]));

    const user = userEvent.setup();
    render(<App />);
    await getToLoginScreen(user);

    await user.click(screen.getByRole("button", { name: /forgot password/i }));
    await screen.findByRole("heading", { name: /reset your password/i }, {}, { timeout: 4000 });

    await user.type(screen.getByLabelText(/email/i), "asha@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => expect(screen.getByText(/we've sent a/i)).toBeInTheDocument());
    expect(screen.getByText(/asha@example.com/i)).toBeInTheDocument();

    // Even though the backend returned 404 (no route yet), the UI never
    // reveals that — it always shows the same account-enumeration-safe
    // confirmation state.
    await user.click(screen.getByRole("button", { name: /back to sign in/i }));
    await screen.findByRole("heading", { name: /welcome back/i });
  });

  it("shows inline validation errors on Login before calling the API", async () => {
    vi.stubGlobal("fetch", mockFetchByUrl([
      [/\/api\/auth\/me$/, () => ({ ok: false, status: 401, json: async () => ({ error: "Authentication required." }) })],
    ]));

    const user = userEvent.setup();
    render(<App />);
    await getToLoginScreen(user);

    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.click(screen.getByLabelText(/^password$/i));
    await user.click(screen.getByRole("heading", { name: /welcome back/i })); // blur password field

    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByText(/valid email address/i)).toBeInTheDocument();
  });

  it("shows a password strength meter and confirm-password mismatch error on Signup", async () => {
    vi.stubGlobal("fetch", mockFetchByUrl([
      [/\/api\/auth\/me$/, () => ({ ok: false, status: 401, json: async () => ({ error: "Authentication required." }) })],
    ]));

    const user = userEvent.setup();
    render(<App />);
    await getToLoginScreen(user);

    await user.click(screen.getByRole("button", { name: /create an account/i }));
    await screen.findByRole("heading", { name: /create your account/i }, {}, { timeout: 4000 });

    await user.type(screen.getByLabelText(/full name/i), "Asha Verma");
    await user.type(screen.getByLabelText(/^password$/i), "Password123");
    expect(await screen.findByText(/strong|good|fair|weak/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^confirm password$/i), "Different123");
    await user.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText(/don't match/i)).toBeInTheDocument();
  });
});
