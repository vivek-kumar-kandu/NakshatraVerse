# 🪐 NakshatraVerse

**Discover Your Cosmic Blueprint** — a Vedic astrology web application that computes a complete, deterministic birth chart on the backend and uses Google Gemini purely to *explain* it in natural language.

[![Status](https://img.shields.io/badge/status-production--ready-brightgreen)]()
[![Frontend](https://img.shields.io/badge/frontend-Vite%20%2B%20React-blue)]()
[![Backend](https://img.shields.io/badge/backend-Node%20%2F%20Express-339933)]()
[![AI](https://img.shields.io/badge/AI-Google%20Gemini-orange)]()

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Features](#2-features)
3. [Screenshots](#3-screenshots)
4. [Demo](#4-demo)
5. [Architecture](#5-architecture)
6. [Tech Stack](#6-tech-stack)
7. [Folder Structure](#7-folder-structure)
8. [Installation](#8-installation)
9. [Environment Variables](#9-environment-variables)
10. [Google Sign-In Setup](#10-google-sign-in-setup)
11. [Deployment](#11-deployment)
12. [Testing](#12-testing)
13. [Project Status](#13-project-status)
14. [Roadmap](#14-roadmap)
15. [Version Information](#15-version-information)
16. [License](#16-license)
17. [Author](#17-author)

---

## 1. Project Overview

NakshatraVerse is a Vedic astrology app built with a **Vite + React** frontend and a **Node/Express** backend. The backend performs **all** astrology calculations — birth chart, planetary positions, house placements, numerology, yoga/dosha detection, and remedies — **deterministically**, and only the fully-computed, structured facts are sent to **Google Gemini** to be explained in natural language.

> **Gemini never calculates anything.** It only interprets backend-authoritative data. This guarantee is enforced end-to-end and has been verified across every release.

**Core pipeline:**

```
User Input → Birth Chart Calculation → Planet Positions → House Placement
  → Yoga Detection → Dosha Detection → Numerology → Structured JSON
  → AI Report Generation (explanation only) → Display Report
```

---

## 2. Features

### Astrology Engine (backend-authoritative)
- Birth chart computation: Lagna, planetary positions, house placement, Nakshatra, and numerology (Mulank/Bhagyank)
- Yoga and Dosha detection, including advanced variants (Panch Mahapurusha, Neecha Bhanga Raja Yoga, Viparita Raja Yoga, Kaal Sarp subtypes, Pitru Dosha, Guru Chandal Yoga, and more)
- Full **Planet Strength** profile: exaltation/debilitation/own sign, retrograde (Vakri), combustion (Asta), planetary friendship, natural & functional benefic/malefic status, directional strength (Dig Bala), and a composite Shadbala score
- **Nakshatra profile**: Lord, Gana, Yoni, Nadi, Symbol, Deity, and traditional personality/career/relationship/spiritual tendencies
- **Vimshottari Dasha** engine — full Mahadasha/Antardasha timeline and current active period
- **Transit (Gochar) engine** — Saturn/Jupiter/Rahu/Ketu transits vs. natal Moon, with Sade Sati / Kantaka Shani / Ashtama Shani detection
- **Divisional charts (Vargas)** — extensible D9/D10/D7/D12 foundation
- Personalized remedies
- All rules are config-driven (JSON rule files) and evaluated by a shared rule engine — new rules require no engine code changes

### AI Narrative Layer
- Google Gemini explains the structured chart data in natural language, with explicit context on *why* (contributing planets/yogas/doshas/strengths), never *what*
- Automatic retry with exponential backoff on transient upstream failures, plus automatic fallback to a secondary Gemini model
- Actionable, status-specific error diagnostics (invalid key, bad model, rate limit, timeout, blocked response) surfaced to both logs and the UI

### Accounts & Personalization
- Email/password authentication (bcrypt-hashed, 12 salt rounds) and optional **Sign in with Google**
- Secure sessions: short-lived access token + long-lived refresh token as `httpOnly`, `SameSite=Lax` cookies (never readable from client-side JS)
- Password reset request flow (account-enumeration-safe)
- User profile management (view/update profile, change password)

### Dashboard & Reports
- Premium dashboard: welcome section, user overview (avatar, stats), quick actions, recent reports strip, full saved-reports archive, profile summary, and an account-settings panel
- Save a generated report to your account, view it later, or delete it (ownership-checked — no user can access another user's data)
- **PDF export** of any report — available to signed-in users (saved reports) and anonymous visitors alike (immediate export, no account required)

### Frontend Experience
- Premium splash screen and a marketing Home/Landing page (auth-aware navigation and hero content)
- Fully responsive, mobile-safe layout (no horizontal scroll on narrow viewports, fluid SVGs, adaptive card padding)
- Accessibility: proper label associations, `aria-live` regions, `role="alert"`/`role="status"`/`role="progressbar"`, semantic landmarks, visible focus rings, `prefers-reduced-motion` support
- Code-split, lazy-loaded results page and memoized shared components for performance
- Loading screen synced to the real backend request (no premature "done" state)

---

## 3. Screenshots

> Screenshots are not included in the source documentation. Replace the placeholders below with real captures before publishing.

| Home Page | Birth Chart Results | Dashboard |
|---|---|---|
| _placeholder_ | _placeholder_ | _placeholder_ |

| Sign In | PDF Report Export |
|---|---|
| _placeholder_ | _placeholder_ |

---

## 4. Demo

> No live demo URL is documented in the source files. Once deployed (see [Deployment](#11-deployment)), add your live link here:

```
Live Demo: <add-your-deployed-url-here>
```

---

## 5. Architecture

```
User Input → Birth Chart Calculation → Planet Positions → House Placement
  → Yoga Detection → Dosha Detection → Numerology → Structured JSON
  → Prediction Engine (Category + Timeline + Profile Alignment + Confidence)
  → AI Report Generation (explanation only) → Display Report
```

**Key architectural guarantees:**

- **Backend-authoritative astrology, end to end.** The backend astrology engine is the sole source of truth for every computed fact. The frontend's own preliminary calculations are always overwritten by the backend's response once a report is generated.
- **Gemini is strictly interpretive.** The prompt explicitly forbids Gemini from inventing planetary positions, yogas, doshas, remedies, or predictions. The backend forcibly overrides these fields with mandated fallback text whenever the engine detects nothing usable — Gemini cannot override that behavior.
- **Config-driven rule engine.** Each astrological concern (retrograde, combustion, friendship, dignity, dasha, transits, advanced yogas/doshas, divisional charts, predictions, profile alignment) is its own focused rule evaluator, composed by a shared rule engine core (`services/rules/ruleEngine.js` + `ruleLoader.js`). Adding a new rule typically requires only a new JSON config file under `backend/rules/`.
- **Deterministic Prediction Engine (V2.0).** `predictionEngine.js` / `predictionTimelineEngine.js` produce the 7 life-area categories and the 1/5/10-year timeline purely from already-computed facts (Dasha, Planet Strength, Yogas/Doshas, Nakshatra Profile, Numerology, Transit Foundation) via the shared `predictionRuleEvaluator.js` — same inputs always produce the same prediction, confidence, and reasoning.
- **Persistence layer is swappable.** Saved users and reports are stored in a file-backed repository (`jsonFileStore.js`), but no controller or service code depends on the storage mechanism directly — it can be replaced with a real database without touching business logic.
- **Actionable diagnostics at every layer** — Gemini HTTP status codes map to specific hints, requests are logged with a per-request trace ID, and startup logs report masked configuration values.

### 5.1 Prediction Engine (V2.0, Phase 7)

`services/astrology/predictionEngine.js` returns one prediction object for each of the 7 required categories — Career, Finance, Marriage, Education, Health, Family, Spiritual Growth — for the current Mahadasha/Antardasha. `predictionTimelineEngine.js` reuses the same scoring logic to build "Next 1/5/10 Years" entries by walking the Dasha timeline. Both are thin wrappers over the single shared `services/rules/predictionRuleEvaluator.js#evaluatePrediction`, so category and timeline predictions can never drift into duplicate confidence math.

### 5.2 Nakshatra Profile & Profile Alignment (V2.0, Phase 7.2A/7.2B)

`services/astrology/nakshatraProfileEngine.js` looks up the classical profile (Lord, Gana, Yoni, Nadi, Symbol, Deity, Nature, Personality/Career/Relationship/Spiritual tendencies) for the natal Nakshatra from `rules/nakshatraProfile.json` — a pure, schema-stable lookup, unchanged since Phase 7.2A.

`services/rules/profileAlignmentRuleEvaluator.js` (Phase 7.2B) is a **separate** evaluator that scores how well that unchanged Nakshatra Profile agrees with the other facts behind a given prediction (dominant planet, current Dasha, Numerology, Transit Foundation), and derives four additional descriptive dimensions (Emotional Pattern, Learning Style, Leadership Style, Health Tendencies) from `rules/profileAlignment.json`, keyed by the Nakshatra's classical ruling planet. This keeps the original Nakshatra Profile schema completely untouched while still feeding richer reasoning into predictions via `supportingProfileFactors`, `profileAlignmentScore`, and `profileSummary`.

### 5.3 Confidence Engine (V2.0, Phase 7 + 7.2B)

`predictionRuleEvaluator.js#computeConfidence` produces a deterministic 5–95 score from `rules/predictionConfidence.json`'s weights. As of Phase 7.2B it also incorporates:

- **House Placement agreement** — does the dominant planet sit in one of the category's significator houses?
- **Numerology agreement** — does the Mulank/Bhagyank's classical ruling planet match the Nakshatra lord?
- **Current Dasha resonance** — does the dominant planet match the active Mahadasha/Antardasha lord?
- **Nakshatra Profile Alignment** — the 0–100 score from 5.2 above.
- **Transit Foundation conflict** — Sade Sati / Kantaka Shani / Ashtama Shani style flags reduce confidence; a clean transit picture adds a small bonus.

Every one of these is a read of a fact some other engine already computed — this file performs no new astrology calculation, only deterministic scoring.

---

## 6. Tech Stack

**Frontend**
- Vite + React
- Component/page/utils modular structure
- Accessibility-first UI patterns (ARIA roles, semantic HTML)
- Vitest + Testing Library for testing

**Backend**
- Node.js + Express
- Config-driven rule engine for astrology logic
- `bcryptjs` for password hashing
- `jsonwebtoken` for session tokens
- `cookie-parser` for httpOnly cookie sessions
- `google-auth-library` for Google ID token verification
- `pdfkit` for PDF report generation
- File-backed JSON persistence (`jsonFileStore.js`)
- Vitest + Supertest for backend testing

**AI**
- Google Gemini (native REST API, `x-goog-api-key` header — supports both classic `AIzaSy...` and newer `AQ....` key formats)

**Infrastructure**
- Docker (`backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml`)

---

## 7. Folder Structure

```
nakshatraverse/
├── backend/      Express server — astrology engine + Gemini integration
│   ├── controllers/
│   ├── routes/               /api/auth, /api/users, /api/reports, /api/chart, /api/generate-report
│   ├── services/
│   │   ├── astrology/        birth chart, planet strength, dasha, transit, divisional charts, etc.
│   │   ├── rules/            rule evaluators (one per astrological concern)
│   │   ├── ai/               Gemini integration (promptBuilder, geminiService)
│   │   ├── pdf/               PDF report generation (pdfkit)
│   │   └── utils/            cache, metrics, logger
│   ├── rules/                 JSON rule configuration files
│   ├── repositories/          user & report repositories (swappable storage layer)
│   ├── db/                    jsonFileStore.js — file-backed persistence
│   ├── middleware/             security, error handling, request logging
│   ├── validators/
│   ├── tests/                 unit + integration test suites
│   ├── Dockerfile
│   └── .env.example
└── frontend/     Vite + React app (the UI)
    ├── src/
    │   ├── components/common/  CosmicBg, GlassCard, Navbar, Footer, SplashScreen, auth components, etc.
    │   ├── pages/               HomePage, LoginPage, SignupPage, ForgotPasswordPage, DashboardPage,
    │   │                        LandingPage (birth form), LoadingPage, ResultsPage, ResultsTabs, SavedReportPage
    │   ├── context/             AuthContext
    │   ├── utils/                authApi, reportsApi, api, astroCalculations, authValidation
    │   ├── constants/
    │   └── styles/global.css
    ├── tests/                   Vitest + Testing Library suites
    ├── vite.config.js
    ├── Dockerfile
    └── .env.example
```

---

## 8. Installation

### Prerequisites
- Node.js and npm
- A Google Gemini API key ([get one here](https://aistudio.google.com/apikey))

### Ports

To avoid clashing with common local dev tools, this project intentionally avoids default ports:

| Service  | URL                      |
|----------|--------------------------|
| Backend  | http://localhost:8617    |
| Frontend | http://localhost:5187    |

Change these via `PORT` (backend `.env`) and `server.port` (`frontend/vite.config.js` + `VITE_API_BASE_URL` in frontend `.env`) if they conflict with something else on your machine.

### 1. Get a Gemini API key
1. Go to https://aistudio.google.com/apikey
2. Create an API key (free tier available).
3. Copy it — you'll paste it into `backend/.env`.

> Google issues keys in both the classic `AIzaSy...` format and a newer `AQ....` format. Both work — the backend sends the key via the `x-goog-api-key` header on Gemini's native REST endpoint, which accepts either format.

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

```
GOOGLE_API_KEY=your_actual_key_here
GEMINI_MODEL=gemini-2.5-flash-lite
PORT=8617
```

Run it:

```bash
npm start
```

Expected startup output:

```
NakshatraVerse backend starting up
  PORT              = 8617
  GEMINI_MODEL      = gemini-2.5-flash-lite
  GOOGLE_API_KEY    = AQ.Ab8…HhLg (len 53)
  FRONTEND_ORIGIN   = *
NakshatraVerse backend running on http://localhost:8617
```

Verify it's alive: `GET http://localhost:8617/api/health` should return
`{"ok":true,"port":8617,"model":"gemini-2.5-flash-lite","apiKeyConfigured":true}`.

### 3. Frontend setup

In a **new terminal**:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open the URL Vite prints (http://localhost:5187).

### 4. Use the app

Fill in name, date/time/place of birth, and submit. The backend computes the full chart (Lagna, planetary positions, houses, Nakshatra, Mulank, Bhagyank, yogas, doshas, remedies), sends that structured data to Gemini for narrative explanation only, and returns both the AI text and the authoritative chart to the frontend for display.

### Troubleshooting "AI report unavailable"

The backend logs a specific, actionable reason for every Gemini failure (check the terminal running `npm start`):

| Status | Likely cause | Fix |
|---|---|---|
| **401 / 403** | API key missing, invalid, restricted to a different API, or the Generative Language API isn't enabled on the associated Google Cloud project | Re-generate a key at https://aistudio.google.com/apikey; ensure `backend/.env` has no stray trailing space/newline after the key |
| **404** | `GEMINI_MODEL` isn't valid for `generateContent` | Check current model names at https://ai.google.dev/gemini-api/docs/models |
| **429** | Free-tier rate limit / quota hit | Wait, or check usage at https://aistudio.google.com |
| **502 (timeout)** | Gemini didn't respond within `GEMINI_TIMEOUT_MS` (default 25s) | Usually transient — retry |
| **502 (invalid JSON)** | Gemini's response couldn't be parsed even after fallback extraction | The backend logs the raw model output for inspection |

If this message is instead `AI report unavailable — Failed to fetch`, it's a **network-level** failure (backend not running, wrong `VITE_API_BASE_URL`, or a blocked CORS preflight) — not a Gemini/API-key problem. The frontend now reports the exact URL it tried plus the likely cause.

Never commit your real `.env` file — it contains your API key.

---

## 9. Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_API_KEY` (or `GEMINI_API_KEY`) | ✅ | Gemini API key. `GOOGLE_API_KEY` takes precedence if both are set. Trimmed automatically to strip accidental whitespace/newlines. |
| `GEMINI_MODEL` | Recommended | Gemini model name (e.g. `gemini-2.5-flash-lite`) |
| `GEMINI_FALLBACK_MODEL` | Optional | Model to fall back to if the primary model fails after retries (defaults to the non-lite sibling) |
| `GEMINI_TIMEOUT_MS` | Optional | Per-attempt request timeout (default 25000) |
| `GEMINI_MAX_RETRIES` | Optional | Retry attempts per model on transient failures (default 2) |
| `GEMINI_RETRY_BASE_MS` | Optional | Base backoff delay between retries (default 1000) |
| `GEMINI_TOTAL_BUDGET_MS` | Optional | Hard ceiling across all retries + fallback (default 45000) |
| `PORT` | Optional | Backend port (default 8617) |
| `FRONTEND_ORIGIN` | ✅ (production) | Exact frontend origin for CORS. Defaults to `*` locally — **must** be a specific origin in production (browsers reject `credentials: true` with a wildcard) |
| `JWT_SECRET` | ✅ (production) | Session-signing secret. **The server refuses to start in production if this is missing.** Generate with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `DATA_DIR` | ✅ (production) | Path to a persistent volume/disk for `users.json` / `reports.json` |
| `COOKIE_SECURE` | Optional | Defaults to `true` under `NODE_ENV=production`; leave unset or set explicitly |
| `GOOGLE_CLIENT_ID` | Optional | Enables "Sign in with Google". If unset, the feature returns a clear `501` response rather than crashing |
| `LOG_FORMAT` | Optional | Set to `json` for structured logging (default: plain text) |

### Frontend (`frontend/.env`, baked in at build time by Vite)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | ✅ | Backend origin URL |
| `VITE_GOOGLE_CLIENT_ID` | Optional | Same Google OAuth Client ID as the backend's `GOOGLE_CLIENT_ID`. Omit to hide the Google sign-in button |

> No existing environment variable has changed meaning or default behavior since the app's initial release — all additions listed above are purely additive.

---

## 10. Google Sign-In Setup

Google sign-in is **fully built into the app** (frontend button, backend token verification, account linking) but is switched off until you provide a **Google OAuth Client ID** tied to your own Google account. This is a one-time, ~5-minute setup every app offering "Sign in with Google" must do.

### Step 1 — Open Google Cloud Console
Go to: https://console.cloud.google.com/apis/credentials (sign in with your Gmail if asked)

### Step 2 — Create a project (skip if you already have one)
- Click **Create Project** if prompted.
- Name it anything, e.g. `NakshatraVerse`.
- Make sure it's selected at the top of the page.

### Step 3 — Configure the OAuth consent screen (one-time)
- Choose **External** user type (unless you have a Google Workspace org).
- Fill in the required fields only: App name (`NakshatraVerse`), your support/contact email.
- Click through **Save and Continue** — you can skip scopes and test users. "Testing" publish status is fine for local development.

### Step 4 — Create the OAuth Client ID
- Go to **Credentials** → **+ Create Credentials** → **OAuth client ID**.
- Application type: **Web application**.
- Name: anything, e.g. `NakshatraVerse Web`.
- Under **Authorized JavaScript origins**, click **Add URI** and add:
  ```
  http://localhost:5187
  ```
- Leave **Authorized redirect URIs** empty — this app uses Google Identity Services' button flow, which doesn't need one.
- Click **Create**.

### Step 5 — Copy your Client ID
A popup shows a Client ID that looks like:
```
123456789012-abcdef1234567890abcdefghijklmno.apps.googleusercontent.com
```

### Step 6 — Paste it into BOTH `.env` files

**`backend/.env`**
```
GOOGLE_CLIENT_ID=123456789012-abcdef...apps.googleusercontent.com
```

**`frontend/.env`**
```
VITE_GOOGLE_CLIENT_ID=123456789012-abcdef...apps.googleusercontent.com
```

Same value in both — required, since the backend verifies the token was issued for this exact client ID.

### Step 7 — Restart both servers
Env files are only read at startup:
```bash
cd backend && npm run dev
cd frontend && npm run dev
```

Refresh the Login/Signup page — the "Continue with Google" button now appears (it was only hidden because the client ID was blank), and clicking it lets you sign in with any Gmail account.

### Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| Button still not showing | Double-check `VITE_GOOGLE_CLIENT_ID` is set in `frontend/.env` and you restarted the frontend dev server (Vite only reads `.env` at startup) |
| `origin_mismatch` error on click | The URL you're running the frontend on doesn't exactly match an Authorized JavaScript origin. Add the exact origin (protocol + host + port, no trailing slash) shown in your browser's address bar to Step 4's list |
| "Google sign-in is not configured on the server" | The backend didn't pick up `GOOGLE_CLIENT_ID` — check `backend/.env` and restart the backend |

---

## 11. Deployment

### What changed for deployment

| Concern | Before deployment prep | Deployment-ready addition |
|---|---|---|
| Persistence | None (stateless request/response) | File-backed store at `DATA_DIR` (`users.json`, `reports.json`) |
| Session secret | N/A | `JWT_SECRET` — **required** in production |
| Third-party auth | N/A | `GOOGLE_CLIENT_ID` / `VITE_GOOGLE_CLIENT_ID` (optional) |
| Cookies | N/A | `httpOnly` session cookies; `COOKIE_SECURE` in production |
| Containers | None provided | `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml` |

All of the above is purely additive — no existing environment variable changed meaning or default behavior.

### Persistent data

Saved users and reports live in two JSON files under `DATA_DIR` (`users.json`, `reports.json`), written atomically (temp file + rename) by `backend/db/jsonFileStore.js`. This requires no external database service to run the app, but:

- **Mount a persistent volume at `DATA_DIR`** in any container/PaaS deployment, or user accounts and saved reports will be lost on redeploy/restart. The provided `docker-compose.yml` does this via a named volume (`nakshatraverse-data`).
- This store is safe for a **single backend instance**. To run multiple replicas behind a load balancer, replace the repository layer (`backend/repositories/user.repository.js` and `backend/repositories/report.repository.js`) with a real database — no controller or service code depends on the storage mechanism directly, making this a contained change.

### CORS & cookies

Session cookies require `credentials: true` on both the CORS configuration (already set in `backend/server.js`) and every frontend fetch call (already set in `frontend/src/utils/authApi.js` and `reportsApi.js`). If frontend and backend are on different domains:

- `FRONTEND_ORIGIN` on the backend must be the **exact** frontend origin (not `*` — browsers reject `credentials: true` with a wildcard origin).
- Cookies are `SameSite=Lax`, which works for same-site and most reverse-proxied setups. A fully cross-site deployment (unrelated domains, no shared parent domain) needs `SameSite=None` + `Secure` — adjust `backend/services/auth/tokenService.js` if that's your topology.

### Building & running

**Without Docker:**

```bash
# Backend
cd backend
npm install
npm start

# Frontend (separate terminal)
cd frontend
npm install
npm run build      # verifies the production build compiles
npm run preview    # serve the built bundle locally to sanity-check it
```

**With Docker Compose:**

```bash
cp backend/.env.example backend/.env    # fill in real values
docker compose up --build
```

This builds both images, mounts a named volume for `DATA_DIR`, and starts the backend on `:8617` and the frontend on `:5187`.

### Production checklist

- [ ] `JWT_SECRET` set to a real random value (not the dev fallback)
- [ ] `GOOGLE_API_KEY` set (existing requirement, unchanged)
- [ ] `FRONTEND_ORIGIN` set to your real frontend origin (not `*`)
- [ ] `DATA_DIR` points at a persistent volume/disk
- [ ] `COOKIE_SECURE` left unset (defaults to `true` under `NODE_ENV=production`) or explicitly `true`
- [ ] `VITE_API_BASE_URL` points at your real backend origin
- [ ] `npm run build` succeeds in `frontend/` with no errors
- [ ] `npm test` passes in both `backend/` and `frontend/`
- [ ] Google OAuth Client ID's authorized JavaScript origins include your real frontend domain (only if using Google sign-in)

### Rollback / backward compatibility

Every deployment-related change is additive — new files, new routes mounted under new path prefixes (`/api/auth`, `/api/users`, `/api/reports`), and new optional environment variables with safe defaults. `/api/chart`, `/api/generate-report`, `/api/health`, and `/api/metrics` are byte-for-byte unchanged. A deployment that only calls those existing endpoints and never sets any new environment variable behaves exactly as it did before these additions.

---

## 12. Testing

### Backend
- Vitest + Supertest test suites covering: the cache primitive, validators, rule engine, birth chart engine (determinism + caching), Gemini service (caching, mutation-safety, error handling with mocked `fetch`), authentication, and report ownership/authorization
- Full route-level integration suite hitting every real Express endpoint
- 55+ backend tests, all passing

```bash
cd backend
npm test
```

### Frontend
- Vitest + Testing Library covering the birth-data flow, authentication (login/signup/forgot-password), navigation, dashboard, and the responsive `ZodiacWheel` component
- Production build verification (`npm run build`) confirms code-split chunks and zero compile errors

```bash
cd frontend
npx vitest run
```

> Known, pre-existing `npm audit` findings in `frontend/`: 2 vulnerabilities (1 moderate — a dev-only esbuild advisory affecting `vite dev` only, not production builds — and 1 high). Fully clearing these requires a Vite 6 upgrade, which is intentionally deferred as a deliberate, called-out breaking change rather than silently applied.

---

## 13. Project Status

_Last updated: Priority 6.4 (Finalization Pass)_

| Priority | Scope | Status |
|---|---|---|
| 1 | Core Vedic astrology engine (Lagna, planetary positions/houses, Nakshatra, numerology) | ✅ Complete |
| 2 | Gemini AI integration for report narrative generation | ✅ Complete |
| 3 | Advanced engine: planet strength, Dasha, transits, yogas/doshas, divisional charts | ✅ Complete |
| 4 | Performance & production hardening (backend) | ✅ Complete |
| 5.1 | Frontend excellence & responsive UX (code-splitting, a11y, mobile fixes) | ✅ Complete |
| 5.2 | Authentication, Dashboard, saved reports, PDF export | ✅ Complete |
| 5.3 | Sign-in-first stabilization pass | ✅ Complete |
| 5.4 | LoginPage moved onto the critical initial-paint path (static import) | ✅ Complete |
| 5.5 | Logout clears ephemeral chart/report state | ✅ Complete |
| 6.1 | Premium splash screen + new marketing Home/Landing page | ✅ Complete |
| 6.2 | Premium authentication UX (Sign In / Create Account / Forgot Password), validation, loading states, animations | ✅ Complete |
| 6.2.1 | Authentication UI/UX + navigation bug-fix pass | ✅ Complete |
| 6.3 | Premium Dashboard redesign | ✅ Complete |
| 6.4 | Production-readiness bug-fix pass + finalization | ✅ Complete |
| 6.5+ | Not started | ⏳ Pending |
| **V2.0 – 7** | Prediction Engine (7 category predictions + 1/5/10-year timeline + Transit Forecast foundation) | ✅ Complete |
| **V2.0 – 7.1** | Prediction & Profile API Integration (`predictionApiMapper.js` contract) | ✅ Complete |
| **V2.0 – 7.2A** | Nakshatra Profile data-completion audit (schema hardening, null-safety) | ✅ Complete |
| **V2.0 – 7.2B** | Nakshatra Profile Intelligence (Profile Alignment Engine, expanded Confidence Engine, structured reasoning) | ✅ Complete |
| **V2.0 – 7.2C** | Production Readiness & Final Verification (this phase) | ✅ Complete |

See [`CHANGELOG.md`](./CHANGELOG.md) for the detailed version history.

**Environment note:** recent verification passes were run in a sandbox without outbound network/registry access, so results were confirmed via static analysis (esbuild/AST parsing, `diff -rq` audits, manual code tracing) rather than a live `npm run build` / `vitest run`. Run `npm install && npm run build && npx vitest run` locally before deploying to get a fully authoritative pass/fail.

---

## 14. Roadmap

Documented, not-yet-started or explicitly deferred items:

- **Priority 6.5+** — not yet started.
- **Guest-facing CTA to the birth form from the Home page** — the FAQ mentions guest usage, but there is currently no direct "Try as Guest" link from the marketing Home page (flagged in Priority 6.2.1, still open).
- **Real `POST /api/auth/forgot-password` backend route** — the frontend's Forgot Password flow already calls this conventional path and degrades gracefully (always shows a generic, account-enumeration-safe confirmation); it will start working end-to-end the moment a matching backend endpoint ships.
- **Vite 6 upgrade** — would fully clear the two known, dev-only `npm audit` findings in the frontend; intentionally deferred as a deliberate major-version change, planned for a future v1.1 release.
- **Multi-instance scaling** — replace the file-backed JSON store with a real database (Postgres, MongoDB, etc.) if running multiple backend replicas behind a load balancer.
- **Kaala Bala and Drik Bala** (finer ephemeris/aspect-based strength components) — intentionally out of scope for the current Planet Strength engine, which needs finer ephemeris/aspect data than it currently models.

---

## 15. Version Information

This project has progressed through the following major phases (see [Project Status](#13-project-status) and [`CHANGELOG.md`](./CHANGELOG.md) for full detail):

- **Priorities 1–3** — Core deterministic astrology engine, Gemini narrative integration, and advanced astrological modules (planet strength, Dasha, transits, divisional charts).
- **Priority 4** — Backend performance, caching, observability, and security hardening.
- **Priority 5.x** — Frontend modularization/accessibility, accounts, saved reports, PDF export, and deployment preparation.
- **Priority 6.x** — Premium UI/UX pass: splash screen, marketing home page, redesigned authentication flow, redesigned dashboard, and a final production-readiness bug-fix pass.
- **V2.0 – Phase 7** — Deterministic Prediction Engine (7 life-area categories + 1/5/10-year timeline + Transit Forecast foundation), plus the Prediction & Profile API contract (Phase 7.1).
- **V2.0 – Phase 7.2A/7.2B** — Nakshatra Profile data-completion audit, followed by the Nakshatra Profile Intelligence layer (Profile Alignment Engine, expanded Confidence Engine, structured reasoning metadata) — see [§5.1–5.3](#5-architecture).
- **V2.0 – Phase 7.2C** — Final production-readiness pass: full regression verification across multiple charts, sandbox-only verification scripts removed, a leaked local dev API key redacted from `.env`, and this documentation update.

Current state: **production-ready** (V2.0 complete), pending a final local `npm install && npm run build && npx vitest run` confirmation (see [Testing](#12-testing)).

---

## 16. License

No license file was included in the provided documentation. Add a `LICENSE` file (e.g. MIT, Apache-2.0) to clarify usage rights before publishing this project publicly.

---

## 17. Author

Author/maintainer information was not included in the provided documentation. Add your name, organization, or contact details here.
