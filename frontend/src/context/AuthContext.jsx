import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../utils/authApi.js";
import { readStoredPhoto } from "../utils/profilePhoto.js";

// ─────────────────────────────────────────────────────────────────────────
// AuthContext (Priority 5.2)
// Centralizes session state so any page (landing, results, dashboard,
// login) can know who's signed in without prop-drilling. Session state
// itself lives in an httpOnly cookie set by the backend — this context
// only mirrors "who does that cookie belong to" for the UI, via
// GET /api/auth/me on mount.
//
// Phase 6.3 addition (Profile Management): a locally-uploaded profile
// photo has no backend endpoint (out of scope for this phase — see
// utils/profilePhoto.js), so it's persisted client-side and merged onto
// the fetched `user` object here, once, right after the existing
// GET /api/auth/me call resolves. Every existing consumer of `user.picture`
// (AccountMenu's Avatar, Dashboard's Profile card) keeps reading the same
// field and needs no changes of its own. `updateUser()` is the only other
// addition — a small local-state merge so the UI can reflect a photo
// upload/removal instantly without a page refresh. Neither change touches
// login, registration, Google sign-in, logout, or session/cookie handling.
// ─────────────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    authApi
      .fetchCurrentUser()
      .then((u) => {
        if (cancelled) return;
        if (u) {
          const localPhoto = readStoredPhoto(u.id);
          setUser(localPhoto ? { ...u, picture: localPhoto } : u);
        } else {
          setUser(u);
        }
      })
      .catch(() => { if (!cancelled) setUser(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Shallow-merges a patch (e.g. `{ picture: dataUrl }` or `{ picture: null }`)
  // into the current user in local state only. Does not call any backend
  // endpoint — callers that do persist something (e.g. profilePhoto.js's
  // localStorage helpers) call this afterwards purely to refresh the UI.
  const updateUser = useCallback((patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const login = useCallback(async (credentials) => {
    const { user: loggedInUser } = await authApi.login(credentials);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (fields) => {
    const { user: newUser } = await authApi.register(fields);
    setUser(newUser);
    return newUser;
  }, []);

  const loginWithGoogle = useCallback(async (idToken) => {
    const { user: loggedInUser } = await authApi.googleLogin(idToken);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, isAuthenticated: Boolean(user), login, register, loginWithGoogle, logout, updateUser }),
    [user, loading, login, register, loginWithGoogle, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export default AuthContext;
