<<<<<<< HEAD
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
=======
import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/global.css";
// Multilingual Foundation Phase: must be imported before <App> renders so
// i18next is initialized (namespaces start loading) before any component
// calls useTranslation(). See i18n/index.js's own header for the full
// lazy-loading/namespace/fallback design.
import "./i18n/index.js";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* react-i18next's useSuspense:true (i18n/index.js) means a component
        calling useTranslation() before its namespace has loaded suspends
        — this top-level boundary is what it suspends into, showing
        nothing (a heartbeat, not a visible flash) for the brief moment
        before the "common"/first-needed namespace resolves. Individual
        pages' own <Suspense> boundaries (App.jsx's lazy-loaded stages)
        are unaffected — this is purely additive, one level higher. */}
    <Suspense fallback={null}>
      <App />
    </Suspense>
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  </React.StrictMode>
);
