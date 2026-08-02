// ─────────────────────────────────────────────────────────────────────────
// App.jsx — application entry point (BUG-10 refactor)
//
// This file is intentionally thin. All routing / stage logic lives in
// src/router.jsx; all provider wiring lives in src/providers.jsx.
// Keeping this file small eliminates merge-conflict risk when adding new
// pages or changing providers.
// ─────────────────────────────────────────────────────────────────────────
import AppProviders from "./providers.jsx";
import { AppContent } from "./router.jsx";

export default function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}
