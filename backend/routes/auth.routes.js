// ─────────────────────────────────────────────────────────────────────────
// Auth routes (Priority 5.2 — new, additive)
// Mounted at /api/auth in server.js. Does not alter any existing route.
// ─────────────────────────────────────────────────────────────────────────
import { Router } from "express";
import { register, login, googleLogin, refresh, logout, me } from "../controllers/auth.controller.js";
import { authRateLimiter } from "../middleware/security.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);
router.post("/google", authRateLimiter, googleLogin);
router.post("/refresh", authRateLimiter, refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

export default router;
