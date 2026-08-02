// ─────────────────────────────────────────────────────────────────────────
// App Providers (BUG-10 refactor)
// Extracts all context provider wrappers from App.jsx into a dedicated
// file. Wrapping order matters:
//   ErrorBoundary  — outermost, catches crashes from any provider below
//   ToastProvider  — available to all providers and pages
//   LanguageProvider — i18n, must wrap ThemeProvider (reads lang prefs)
//   ThemeProvider  — reads preferences (needs language for i18n keys)
//   AuthProvider   — needs toast + language, wraps app content
// ─────────────────────────────────────────────────────────────────────────
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
import { ToastProvider } from "./components/common/Toast.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

/**
 * AppProviders — wraps children in all application-wide context providers.
 * Render this once at the app root; no other file should re-declare these.
 *
 * @param {{ children: React.ReactNode }} props
 */
export default function AppProviders({ children }) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
