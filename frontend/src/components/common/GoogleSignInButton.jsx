import { useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────
// GoogleSignInButton (Priority 5.2, label fixed in Priority 6.2.1)
// Loads the Google Identity Services script on demand and renders the
// official Google button. Entirely optional/self-hiding: if
// VITE_GOOGLE_CLIENT_ID isn't set, this renders nothing (and
// isGoogleAuthAvailable() below reports that) — the email/password flow
// works standalone either way. No new backend logic: same
// google.accounts.id.initialize/renderButton call, same onCredential(idToken)
// contract as Priority 5.2.
//
// Priority 6.2.1: was previously left at the GIS default button text
// ("Sign in with Google" on both Login AND Signup, which read oddly on the
// signup screen). `text: "continue_with"` renders Google's own "Continue
// with Google" copy — still 100% the official button, just the requested
// label — identical on both pages, as asked.
//
// Priority 6.4 fix: the Google Identity Services button is rendered as a
// fixed-size iframe — the `width` option below is a hard pixel value, not
// a CSS max-width, so it cannot shrink on its own. It was previously
// hardcoded to 280px, which is wider than the space actually available
// inside the Login/Signup GlassCard on common narrow phones (e.g. a
// 360px-wide viewport leaves ~256px there once the page and card padding
// are subtracted), causing the button to visually overflow/get clipped by
// its container instead of resizing to fit. It now measures the
// container's real available width on mount and on resize, and passes
// that (capped at the original 280px) to `renderButton`, so the button
// always fits — no visual/behavioral change on screens where 280px
// already fit.
// ─────────────────────────────────────────────────────────────────────────
const SCRIPT_ID = "google-identity-services-script";
const MAX_BUTTON_WIDTH = 280;

// Priority 6.2.1: shared helper so LoginPage/SignupPage know whether to
// render the "or continue with email" divider (only meaningful when a
// Google button actually renders above it — see AuthDivider usage).
export function isGoogleAuthAvailable() {
  return Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
}

function GoogleSignInButton({ onCredential }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const containerRef = useRef(null);

  // Bugfix (July 2026): LoginPage/SignupPage pass an inline arrow function
  // as `onCredential`, so a brand-new function reference is created on
  // *every* render of the parent (e.g. every keystroke in the email/name/
  // password fields, since those live in the same component's state).
  // The main effect below used to list `onCredential` in its dependency
  // array, so each keystroke re-ran the whole effect. `loadAndRender()`
  // would find the GIS script tag already present and call
  // `renderButton()` -> `ensureInitialized()`, but because the effect had
  // re-run, `initialized` was a *fresh* `false` in the new closure — so it
  // called `google.accounts.id.initialize()` again anyway, over and over,
  // once per keystroke. Each re-initialization kicks off GIS's own
  // background auth checks against Google, so on a page where the origin
  // isn't authorized for the Client ID, every keystroke produced another
  // wave of "origin not allowed" / 403 console spam — not one error, but
  // dozens as the user typed.
  //
  // Fix: keep the latest `onCredential` in a ref that's updated every
  // render (cheap, doesn't trigger the effect), and have the main effect
  // depend only on `clientId`. Now `initialize()` truly runs once per
  // mount, exactly as the code already intended.
  const onCredentialRef = useRef(onCredential);
  useEffect(() => {
    onCredentialRef.current = onCredential;
  });

  useEffect(() => {
    if (!clientId) return;

    // Priority 6.4 fix: measure the container instead of assuming 280px
    // always fits — see the comment above.
    function currentWidth() {
      const measured = containerRef.current?.offsetWidth;
      return measured ? Math.min(MAX_BUTTON_WIDTH, Math.floor(measured)) : MAX_BUTTON_WIDTH;
    }

    // Bugfix: initialize() must only ever be called once per page load —
    // calling it again (e.g. from the resize handler below) triggers GIS's
    // "initialize() is called multiple times" warning and can lead to
    // inconsistent button state. renderButton() itself is safe to call
    // repeatedly (that's how the width-on-resize behavior works), so we
    // split the one-time init out from the repeatable render.
    let initialized = false;

    function ensureInitialized() {
      if (initialized || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => onCredentialRef.current(response.credential),
      });
      initialized = true;
    }

    function renderButton() {
      if (!window.google?.accounts?.id || !containerRef.current) return;
      ensureInitialized();
      containerRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "filled_black",
        size: "large",
        shape: "pill",
        width: currentWidth(),
        text: "continue_with",
      });
    }

    function loadAndRender() {
      if (document.getElementById(SCRIPT_ID)) {
        renderButton();
        return;
      }
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = renderButton;
      document.head.appendChild(script);
    }

    loadAndRender();

    // Re-render on viewport/orientation changes so the button keeps
    // matching its container's width (e.g. rotating a phone, or resizing
    // a desktop window) instead of staying locked to whatever width was
    // available on first paint. Debounced lightly via rAF to avoid
    // thrashing the GIS re-render on every resize event.
    let rafId = null;
    const handleResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(renderButton);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [clientId]);

  if (!clientId) return null;

  return <div ref={containerRef} style={{ display: "flex", justifyContent: "center", margin: "18px 0" }} />;
}

export default GoogleSignInButton;
