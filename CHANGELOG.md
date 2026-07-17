# Changelog

All notable changes to NakshatraVerse are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Entries below are grouped by development "Priority" milestones, listed in reverse chronological order.

---

## [V4.2 — Final Pass] — Family Profiles & Relationship Hub: Integration Completion

Closes out V4.2. Family Profiles & Relationship Hub CRUD, search/filter/
sort, ownership enforcement, Recently Opened tracking, and loading/empty/
error states were already complete; this pass adds the one missing piece
(Active Profile persistence), fixes an accessibility gap it surfaced, and
adds frontend test coverage for the feature. No backend logic, astrology/
report/AI logic, or existing component's public API changed.

### Added
- **Active Profile persistence** (`frontend/src/utils/settingsStorage.js`)
  — a new `activeProfileId` preference, following the exact same
  "written automatically, read once as an initial default" pattern as
  `lastOpenedReportId`. Written whenever a profile is opened
  (`FamilyProfilesPage`) or used in a comparison (`RelationshipHubPage`);
  read as the initial "Profile A" selection whenever Relationship Hub is
  reached without an explicit preset (Dashboard/ActionDock/CommandPalette,
  rather than a specific profile card's "Compare" button). A stale
  reference to a since-deleted profile is dropped once the real profile
  list loads.
- **`frontend/tests/FamilyRelationshipHub.test.jsx`** — new smoke-test
  coverage for `FamilyProfilesPage`/`RelationshipHubPage`: loading
  skeleton → list, empty state, error state, Recently Opened rail, opening
  a profile (touch + hand-off + persistence), comparing a profile
  (persistence + preset hand-off), the header Relationship Hub button's
  fallback, and every Active Profile persistence path (fallback selection,
  explicit-prop priority, stale-reference cleanup).

### Fixed
- **`RelationshipHubPage.jsx`'s "Profile A"/"Profile B" pickers** had a
  visible `<label>` with no programmatic association to their `<select>`
  (no `htmlFor`/`aria-label`), unlike every other input on this page and
  on `FamilyProfilesPage`. Added `aria-label={label}` to each `<select>`.

### Verified
- All backend `.js` files pass `node --check` (0 failures).
- All 125+ frontend `.js`/`.jsx` files (including every file touched this
  pass) pass a full TypeScript-parser syntax check (0 errors).
- Existing `Settings.test.jsx` does not assert an exact preferences shape,
  so the new `activeProfileId` field cannot break it; no other existing
  test references Family Profiles, Relationship Hub, or settingsStorage.
- See `VERIFICATION_REPORT_V4_2_FINAL.md` for full detail, including this
  sandbox's (pre-existing, project-wide) no-network-access constraint on
  running the real `vitest`/`vite` toolchains directly.

---

## [V4.0 — Phase 1] — Professional Kundli Matching

Adds a complete Vedic Kundli Matching (Ashtakoota / Guna Milan) module as a
new, additive feature. No existing report generation, authentication,
themes, AI Assistant, Horoscope, Calendar, or PDF generation code was
modified — every existing route, page, and test is untouched. Reuses the
existing birth chart engine, config-driven Rule Engine, Dosha/Advanced Dosha
engines, Planet Strength engine, Gemini service, and design system
throughout.

### Added — Backend
- **`rules/kundliMatching.json`** — new reference data for Varna, Vashya,
  Yoni, Gana, Graha Maitri, and Bhakoot scoring (Tara/Nadi are computed
  directly; Gana/Yoni/Nadi *facts* are read from the existing
  `rules/nakshatraProfile.json`, never duplicated).
- **`services/astrology/kundliMatchingEngine.js`** — computes the full
  8-Koota Ashtakoota (Guna Milan) score (36 max), Manglik analysis (reuses
  the existing Advanced Dosha Engine's Manglik severity detection) and
  Manglik compatibility verdict, major Dosha comparison (reuses the
  existing base + Advanced Dosha engines), strong/weak planet comparison
  (reuses the existing Planet Strength Engine), and Moon-sign/Nakshatra
  compatibility summaries. Performs no astrology calculation Gemini could
  instead be asked to do — deterministic and fully unit-tested.
- **`services/ai/matchingPromptBuilder.js`** — builds the Gemini prompt
  from already-computed matching facts only; Gemini is explicitly
  instructed to explain (Compatibility, Strengths, Weaknesses, Marriage
  Advice, Practical Guidance) and never invent a score, Guna, or Dosha.
- **`validators/matching.validator.js`** — reuses
  `birthData.validator.js`'s existing name/dob/tob/pob validation for both
  people, adding only a `gender` field.
- **`controllers/matching.controller.js`** + **`routes/matching.routes.js`**
  — three new endpoints, mounted at `/api/matching`:
  - `POST /api/matching/compute` — backend-only calculation, no Gemini.
  - `POST /api/matching/generate-report` — calculation + Gemini
    explanation.
  - `POST /api/matching/export-pdf` — ad hoc PDF export, no login
    required.
- **`services/pdf/matchingPdfService.js`** — a new, separate PDF renderer
  (mirrors `pdfReportService.js`'s visual language) so the existing
  single-person report PDF is untouched.
- **`middleware/security.js` / `config/env.js`** — one new, additive rate
  limiter (`matchingRateLimiter` / `RATE_LIMIT_MAX_MATCHING`), following
  the exact existing per-route-group limiter pattern.
- **`tests/unit/kundliMatchingEngine.test.js`** — new unit tests covering
  Koota max-point invariants, determinism, groom/bride resolution
  (including the documented default when genders aren't male+female),
  Nadi Dosha correctness, Manglik compatibility logic, and that Dosha/
  Planet-Strength comparisons only ever reuse the existing engines'
  output.

### Added — Frontend
- **`pages/MatchingPage.jsx`** — new, self-contained page (its own
  two-person form → loading → results flow); reuses `GlassCard`,
  `Badge`, `ScoreRing`, `AiText`, `ExpandableSection`, and `CosmicBg`
  unmodified.
- **`components/matching/PersonInputCard.jsx`** — two-person birth data
  form, styled identically to `LandingPage.jsx`'s existing input fields.
- **`components/matching/CompatibilityMeter.jsx`** — hero compatibility
  gauge for the overall Guna Milan score.
- **`utils/matchingApi.js`** — thin fetch client for the three new
  endpoints, mirroring `reportsApi.js`'s exact style.
- **Navigation** — a new `"matching"` app stage in `App.jsx`
  (additive `else if` branch + one new `lazy()` import), a new optional
  `onOpenMatching` button in `ActionDock.jsx`, a new Dashboard
  `QuickActionCard`, and a new Command Palette entry. No existing stage,
  button, or navigation behavior was changed.

### Verified
- Existing backend/frontend files show only additive diffs (new
  `import`/one new `else if`/one new optional prop/one new array entry) —
  no existing line was altered or removed.
- `kundliMatchingEngine.js` unit-verified: all 8 Kootas present with the
  correct classical max points (1/2/3/4/5/6/7/8, sum 36); fully
  deterministic; groom/bride resolution is symmetric under person-argument
  order for opposite-gender inputs and falls back to a documented,
  non-silent default otherwise; Nadi Dosha correctly triggers for a shared
  Nakshatra; Manglik compatibility verdict matches the shared/differing
  status rule; Dosha comparison and Planet Strength comparison values are
  drawn only from the existing, unmodified engines.
- All new backend JS files pass `node --check`; `rules/kundliMatching.json`
  is valid JSON and loads via the existing `ruleLoader.js`.
- New frontend JSX files pass a manual balanced-bracket/tag review (a full
  `vite build`/`vitest run` could not be executed in this sandbox — no
  network access to install `npm` dependencies for either package; see the
  Verification Report for exact commands to run locally).

---



Expands the deterministic astrology engine's Dosha/Yoga detection and Planet
Strength evaluation, using the same modular, config-driven Rule Engine
established in Priority 3.1/3.2. Backend architecture, all API shapes,
authentication, and Gemini's explanation-only role are unchanged; the
frontend was not touched.

### Added
- **Parivartana Yoga (basic support)** — a new `mutualSignExchange` Rule
  Engine operator, plus all 21 mutual-sign-exchange pairs among the 7
  classical planets, added to `rules/yogasAdvanced.json`.
- **Aspect (Drishti) influence** — a new `aspectRuleEvaluator.js` wires the
  previously-unused `rules/aspects.json` (7th-house default aspect, plus
  Mars/Jupiter/Saturn special aspects) into the Planet Strength evaluator.
  Each planet's profile now includes `aspectInfluence` (which planets aspect
  it, and a benefic/malefic tally using the existing natural-dignity
  classification).
- **Improved dignity scoring** — a new `adjustedScore` field (base dignity
  score plus the aspect-influence modifier above) is added alongside the
  original, untouched `dignity.score`.
- **Explanation metadata** — each planet's strength profile now includes a
  plain-English `explanation` sentence assembled from its dignity,
  retrograde, combustion, friendship, functional nature, and aspect facts,
  for Gemini to draw on directly.
- **Rich Yoga/Dosha output** — a new `rules/insightMetadata.json` +
  `insightEnrichmentEvaluator.js` attach `influence` (positive/negative/
  mixed), `severity` (where classically applicable), suggested `remedies`
  (where available), and `explanationMeta` to every detected Yoga and Dosha,
  across all four detection paths (`yogaRuleEvaluator.js`,
  `doshaRuleEvaluator.js`, `advancedYogaRuleEvaluator.js`,
  `advancedDoshaRuleEvaluator.js`). Purely additive: existing `name`/`detail`
  fields are unchanged, so `/api/chart`, `/api/generate-report`, and the
  frontend's existing consumption of the report text are unaffected.
- New backend unit tests (`tests/unit/phase6AdvancedEngine.test.js`)
  covering the new operator, aspect evaluator, enrichment fallback
  behavior, and a regression check that `computeChart()`'s top-level
  response shape is unchanged.

### Verified, not re-implemented
- Pitru Dosha, Guru Chandal Yoga, Grahan Yoga (Surya/Chandra), Shrapit
  Yoga, and Kemadruma Dosha already existed (Priority 3.2) and were
  re-verified rather than duplicated.
- Gajakesari Yoga and Budhaditya Yoga already existed in `rules/yogas.json`
  (Priority 2) and were likewise re-verified rather than duplicated, to
  avoid double-detection under two near-identical names.

### Out of scope (documented, not implemented)
- **Nadi Dosha** — classically a horoscope-*matching* (Kundli Milan) dosha
  compared between two people's charts; it has no valid single-birth-chart
  definition, and this application has no matchmaking feature. Left for a
  future dedicated Kundli-Matching phase rather than implemented
  incorrectly. See `rules/doshasAdvanced.json`'s `_priority6ScopeNote`.

---

## [Phase 3] — Premium AI Report Experience

Transforms how the existing AI-generated report text is *presented* across
every tab (Overview, Love, Career, Wealth, Health, Doshas & Yogas, Remedies,
Life Summary). No prompt, Gemini call, response shape, astrology engine, or
rule engine output changed — this pass is presentation only, reusing the
existing design system (`GlassCard`, `Badge`, `Skeleton`, existing color
tokens, the `fadeIn` keyframe, `Cinzel`/`Inter` fonts).

### Added
- `frontend/src/utils/aiText.js` — `splitSentences()`/`leadSentence()`:
  small, presentation-only helpers that split an AI report string into
  sentences so the UI can style an opening "lead" line and stagger the
  rest in. Never alters, summarizes, or regenerates the AI's actual words.
- **`KeyHighlights`** (`components/common/KeyHighlights.jsx`) — a new
  "quick glance" panel on the Overview tab: one small card per report
  section showing just its opening AI sentence, so the whole report's
  gist is scannable before opening any single tab. Tapping a card jumps to
  its full tab via a new optional `onNavigateTab` prop on `OverviewTab`
  (wired to `ResultsPage`'s existing `activeTab` state setter — no new
  state was introduced). Shows a matching skeleton state while the report
  is still loading, and renders nothing at all if the AI request has
  failed (so it never duplicates the per-tab "Unavailable" notice).
- `constants/astrology.js` → `REPORT_HIGHLIGHTS`: static icon/label/color/
  tab-id metadata (values already used elsewhere in `ResultsPage.jsx`) used
  only by `KeyHighlights`.
- **"AI Insight" badge** on every AI section's header (Overview's Life
  Summary card, every `TwoSectionTab`/`SingleTab` section, and the Life
  Summary tab), reusing the existing `Badge` component, to make the
  AI-generated vs. deterministic-data distinction visually explicit.

### Changed
- **`AiText`** — internals rewritten; **external prop contract unchanged**
  (`{ text, placeholder, failed }`, same as before):
  - Opening sentence now renders as a larger, brighter "lead" line; the
    remaining sentences form the body underneath.
  - The first time real text lands for a section, its sentences fade in
    with a small stagger (progressive reveal), instead of the whole block
    appearing at once. Plays once per mount; respects the existing global
    `prefers-reduced-motion` rule.
  - Long text (over ~260 characters) now collapses to ~3 lines behind a
    soft gradient fade with a "Read more"/"Show less" toggle
    (`aria-expanded`/`aria-controls`, smooth `max-height` transition,
    rotating chevron). Short text renders in full, no toggle.
  - Loading state now pairs the existing spinner+placeholder line with a
    shimmering paragraph-shaped skeleton (reusing `Skeleton.jsx`'s
    `SkeletonBlock` from Phase 1).
- `global.css` — one new rule, `.highlight-chip:hover`, for `KeyHighlights`
  card hover/lift feedback, matching the existing `.glass-card`/`.pill-btn`
  hover vocabulary. No existing rule changed.

### Unchanged
- Astrology engine, rule engine, Gemini integration, backend, auth —
  nothing under `/backend` was touched by this pass.
- The interactive birth chart (`KundliTab`/`ZodiacWheel`, Phase 2/2.1) —
  untouched; smoke-rendered alongside this pass's changes (same file,
  `ResultsTabs.jsx`) to confirm no regression.
- `AiText`'s external prop contract and every existing call site
  (`OverviewTab`, `TwoSectionTab`, `SingleTab`, `ResultsPage`'s Life
  Summary tab) — no call site needed updating.
- Component props/shapes elsewhere: every change is additive (one new
  optional prop, `onNavigateTab`, defaulting to `undefined`) — no existing
  prop was removed or repurposed.

---

## [Phase 2.1] — Premium SaaS Polish Pass

Further presentation-only polish on top of Phase 2's interactive birth chart,
aimed at making the astrology experience feel like a premium SaaS product.
No astrology calculations, business logic, data shapes, or component
contracts changed — every existing test (including the `ZodiacWheel` SVG
sizing/a11y regression guards) passes unmodified.

### Added
- **Richer, animated tooltips** (`ZodiacWheel`) — the planet/house tooltip now
  pops in with a quick scale+fade (`tooltipPop`), shows a colored accent dot
  matching the planet's chart color, and gets a soft glow shadow instead of a
  flat fade.
- **Touch parity for hover interactions** — planets and house wedges now
  respond to `onTouchStart` with the same tooltip preview a mouse hover gets
  (previously touch devices only got the click/select behavior, with no
  preview), plus a generous invisible touch target around each planet glyph
  so a fingertip reliably lands a tap.
- **Animated house highlighting** — the active house wedge now has a gentle
  breathing glow (`housePulse`) and the active planet gets a pulsing outer
  ring (`planetPulse`), instead of a static highlight color.
- **Synced detail panel entrance** — the selected-planet detail panel now
  uses a dedicated `panelIn` animation (fade + slight scale) instead of the
  generic `fadeIn`, so it reads as "arriving" from the planet that was tapped.
- **Tab bar polish** (`TabBar`) — the active tab now auto-scrolls into view
  (`scrollIntoView`) on change, so selecting a tab near either edge of the
  scrollable strip never leaves it partially hidden on mobile; the active
  tab and its icon also get a subtle scale-up.
- **Consistent tap/press feedback** (`.tap-scale` in `global.css`) — applied
  to the planetary-position rows and house-overview grid cells so every
  tappable surface in the Kundli tab gives the same quick scale-down
  confirmation on press, matching the existing `.pill-btn`/`.submit-btn`
  vocabulary.
- **Smoother tab/page transitions** (`PageTransition`) — the shared
  cross-fade now includes a subtle scale (0.99 → 1) alongside the existing
  translateY, for a slightly more premium feel switching between report tabs.
- Global touch ergonomics: `-webkit-tap-highlight-color: transparent` and
  `touch-action: manipulation` on all interactive elements, removing the
  default tap-flash and the ~300ms tap delay on mobile browsers.

### Unchanged
- Astrology engine, rule engine, Gemini integration, backend, auth — nothing
  in `/backend` was touched by this pass.
- `ZodiacWheel`'s SVG sizing contract (`width="100%"`, `viewBox="0 0 260 260"`,
  `maxWidth: 260px`) and accessible label — the exact contract covered by
  `tests/ZodiacWheel.test.jsx` — is preserved byte-for-byte.
- Component props/shapes: every change is additive (new CSS classes, new
  optional touch handlers) — no existing prop was removed or repurposed.

---

## [Phase 2] — Interactive Birth Chart & Astrology Experience

Transforms the Kundli tab of the results report into an interactive, premium
experience while preserving all existing functionality, data flow, and every
other page/tab. Backend, APIs, authentication, the astrology engine, the rule
engine, Gemini, and business logic are untouched — this pass is presentation
only, reusing the existing design system (`GlassCard`, `Badge`, existing color
tokens, `Cinzel`/`Inter` fonts, existing `fadeIn` keyframe).

### Added
- `constants/astrology.js` — `PLANET_SIGNIFICANCE` and `HOUSE_MEANINGS`: short,
  static Vedic-astrology reference copy used only for tooltip/detail-card
  presentation text. No calculation; not sourced from or sent to the backend.

### Changed
- **`ZodiacWheel`**: the birth chart is now interactive. Each sign wedge is a
  focusable/clickable hit-region (hover or select a house to highlight it);
  each planet glyph is independently focusable/clickable with its own
  hover/focus tooltip and click-to-select; whole-sign house numbers are now
  labelled directly on the wheel (derived client-side from the same
  lagna/sign data already rendered — no new data source). All existing SVG
  attributes the regression test depends on (`width="100%"`, `height="100%"`,
  `viewBox`, `role`, `aria-label`, `style.maxWidth`) are unchanged.
- **`KundliTab`**: planetary position cards and the house overview grid are
  now interactive and stay in sync with the wheel (hovering/selecting any one
  highlights the other two); selecting a planet opens a detail panel with its
  house, sign, and a short significance blurb; house cells now also show their
  ruling sign and a short house meaning. Cards use a subtle staggered
  fade-in entrance.
- **`OverviewTab` / `TwoSectionTab` / `SingleTab`**: subtle staggered
  entrance animation on cards for visual consistency with the new Kundli tab
  (reuses the existing `fadeIn` keyframe; no layout or content changes).
- **`ResultsPage`**: tab-switch content now uses the existing
  `PageTransition` component (previously only used one level up, at the
  page/stage level, in `App.jsx`) instead of an ad hoc `slideIn` animation,
  so switching between report sections gets the same smooth, consistent
  transition used elsewhere in the app.

### Verification
- `npm run build` and `npm test` both run clean in this environment (network
  access to the npm registry was available, so dependencies were installed
  and the real Vite build / Vitest suite were executed directly — see
  `PROJECT_STATUS.md` for the full report).

---

## [Phase 1] — UI/UX Completion Pass (Loading & Feedback / Motion & Interactions / Visual Polish)

This pass reviewed the existing frontend end-to-end and completed the remaining
Phase 1 UI/UX items without touching backend, auth, the astrology/rule engines,
Gemini, routing, layouts, component hierarchy, or state management.

### Note on scope discrepancy
The task brief referenced an "existing Toast system" and "existing PageTransition
component." Neither existed in the codebase prior to this pass (confirmed by a
full-text search — the only prior hits were an inline `<p role="alert">` error
banner in `App.jsx`'s "results" stage, tagged "toast" only in a comment, and an
ad-hoc status pill inside `ActionDock`). No `alert()` calls existed anywhere
either, so there was nothing to replace on that front. Both systems were built
fresh this pass as small, additive components and wired into the specific spots
that benefit most — see "Added" / "Changed" below.

### Added
- `components/common/Toast.jsx` — `ToastProvider` + `useToast()` hook + a
  fixed, stacked, auto-dismissing toast viewport (`success` / `error` / `info`),
  mounted once at the app root. Field-level validation errors on Login/Signup/
  Landing intentionally remain inline next to their field — only transient,
  page-independent async errors were moved to toasts.
- `components/common/PageTransition.jsx` — wraps `App.jsx`'s stage `content` in
  a fade/slide entrance that replays on every `stage` change, via React's `key`
  remount behavior. Read-only with respect to `stage`; does not touch routing.
- `components/common/Skeleton.jsx` — reusable shimmer-based skeleton primitives
  (`SkeletonBlock`, plus composed report-row/report-card skeletons), using the
  project's pre-existing but previously-unused `shimmer` keyframe from
  `global.css`.

### Changed
- **Dashboard**: delete/download failures now surface as toasts instead of
  overwriting the same page-level `error` banner used for the initial reports
  fetch (previously a failed single PDF download was visually indistinguishable
  from "your whole reports list failed to load"); both the Recent Reports strip
  and the full Saved Reports archive now show skeleton loaders instead of plain
  "Loading…" text while `reports === null`; pill-shaped action buttons (View /
  PDF / Delete / Log Out) gained hover/active feedback (`.pill-btn` in
  `global.css`).
- **SavedReportPage**: the loading state is now a skeleton (avatar circle, title
  bar, tab bar, content block) matching the shape of the real report, instead of
  a single line of plain text.
- **LoadingPage**: added a discrete, animated step indicator (five dots + short
  labels, derived from the existing `LOADING_MSGS`) beneath the progress bar,
  complementing the existing continuous bar and rotating message — both stay
  driven by the same real `progress` state, so nothing here can imply "done"
  before the actual request has settled.
- **Navbar / Footer / AccountMenu**: nav links, footer links, and dropdown menu
  items previously had zero hover feedback beyond the default cursor — added
  scoped hover treatments consistent with the rest of the app's existing
  `.submit-btn` / `.tab-btn` / `.glass-card` hover vocabulary. AccountMenu's
  dropdown panel and HomePage's FAQ accordion answers now fade in on open
  (reusing the existing `fadeIn` keyframe) instead of appearing abruptly.
- `App.jsx`: mounted `ToastProvider` at the root and wrapped stage `content` in
  `PageTransition`. No other logic in `App.jsx` changed.

### Notes
- No backend, API, authentication logic, astrology/rule engines, or Gemini
  integration changes.
- No dependency versions were changed; the pre-existing `vite`/`vitest`
  peer-dependency mismatch (see [6.4]) is still deferred, and — separately —
  this sandboxed environment's bundled `node_modules` only contains Windows
  native bindings for `@rollup`/`esbuild`/`lightningcss`, with no network
  access available here to fetch Linux equivalents, so `npm run build` /
  `npm test` could not be executed in *this* environment. All new/edited files
  were instead verified with a full-project Babel/JSX parse (0 failures across
  49 source + test files) and manual line-by-line review against every
  existing test file's assertions. See `PROJECT_STATUS.md` for the full
  verification report and a recommendation to re-run `npm run build` / `npm
  test` in a normal (networked) environment before deploying.

---

## [6.4] — Production-Readiness Bug-Fix Pass & Finalization

### Fixed
- Dashboard "Saved Reports" section now shows a loading state while the initial fetch is in flight (previously only "Recent Reports" did).
- Deleting a saved report now requires confirmation (`window.confirm`) before the delete call fires, preventing accidental permanent deletion.
- Per-report action buttons (View / PDF / Delete, including the Recent Reports strip) now have distinguishing `aria-label`s for screen-reader users, instead of identical, undifferentiated labels across every row.
- Google Sign-In button now measures its container's real available width (capped at 280px) instead of using a hardcoded 280px, fixing overflow/clipping on narrow phones.
- `AccountMenu`'s Logout now navigates to the marketing Home page (`"home"`) instead of the birth-details form (`"landing"`), matching the behavior of every other logout affordance in the app.
- Fixed the one remaining failing frontend test (`Auth.test.jsx`): switched a singular `findByText` assertion to `findAllByText(...).length > 0` to correctly account for the Priority 6.3 Dashboard's intentional dual display of each report title (Recent Reports strip + full archive).

### Notes
- No backend, authentication logic, astrology/rule engines, or Gemini integration changes.
- No dependency versions were changed; the pre-existing `vite`/`vitest` peer-dependency mismatch is explicitly deferred to a future v1.1 release.

---

## [6.3] — Premium Dashboard Redesign

### Added
- Complete `DashboardPage.jsx` redesign: Welcome section, User Overview (avatar, stats), Quick Actions grid, Recent Reports strip, full Saved Reports archive, Profile Summary, and an expandable Account Settings panel.
- Section entrance animations (staggered `fadeIn`) and fully responsive grid layouts (`auto-fit`/`minmax`).

### Changed
- Dashboard's primary call-to-action relabeled from "✦ New Reading" to "✦ Generate New Report" (same underlying navigation action, unchanged).

### Notes
- Same props (`onNavigate`, `onViewReport`), same three API calls, and same data shapes as before — no prop or API contract changes. `App.jsx` was not modified.

---

## [6.2.1] — Authentication UI/UX & Navigation Bug-Fix Pass

### Fixed
- "← Back to Home" links on Login/Signup previously navigated to the old birth-details form instead of the marketing Home page; now correctly route Home.
- Added a "← Back to Home" link to the Forgot Password page (previously had no way back to Home).
- Navbar's Home link and logo now explicitly navigate Home before scrolling, rather than relying on an implicit assumption about where Navbar is mounted.
- Google Sign-In button now reads "Continue with Google" on both Login and Signup (previously always read "Sign in with Google"); the button and its accompanying divider now only render when Google auth is actually configured.
- Splash screen now plays once per browser session (via a `sessionStorage` flag) instead of on every stage reset.

### Added
- `Navigation.test.jsx` regression suite covering all five fixes above.

---

## [6.2] — Premium Authentication Experience

### Added
- Forgot Password flow (`ForgotPasswordPage.jsx`) with an account-enumeration-safe, always-generic confirmation message.
- Real-time inline field validation (email format, required fields, password length, confirm-password match) via a new validation utility.
- Password show/hide toggle and a live password-strength meter on Signup.
- In-button loading spinners and mutual disabling of the Google button/email form during submission to prevent double-submits.
- Staggered entrance animations across auth form elements.
- "Keep me signed in" preference checkbox with an explanatory caption about the existing 30-day session behavior.

### Notes
- Authentication logic (`AuthContext.jsx`, existing `authApi.js` exports) is unchanged; only one new, additive, non-throwing API export (`requestPasswordReset`) was added.
- No backend changes.

---

## [6.1] — Premium Splash Screen & Marketing Home Page

### Added
- Full-screen animated splash screen (logo, tagline, twinkling stars, orbiting rings) shown on app load, cross-fading into a new marketing Home page.
- New marketing Home/Landing page (`HomePage.jsx`) with an auth-aware Navbar, hero section, About, Features, How It Works, Why Choose Us, FAQ, closing CTA, and a professional Footer.

### Notes
- The pre-existing birth-details form (`pages/LandingPage.jsx`) is untouched and remains reachable via its existing entry points.
- No backend, authentication logic, Dashboard, astrology engine, or Gemini integration changes.

---

## [5.5] — Logout State Cleanup

### Fixed
- Logging out now clears ephemeral chart/report state.

---

## [5.4] — Initial Load Path Optimization

### Changed
- `LoginPage` moved onto the critical initial-paint path via a static import.

---

## [5.3] — Sign-In-First Stabilization Pass

### Fixed
- The app previously always opened on the guest birth-data form regardless of session state; it now resolves the initial screen based on session status — a logged-out visitor lands on `LoginPage`, a logged-in visitor lands on the birth-data form.
- Clarified the "AI report unavailable — Failed to fetch" error: this is a network-level failure (backend unreachable, wrong `VITE_API_BASE_URL`, or blocked CORS preflight), not a Gemini/API-key error. The frontend now reports the exact URL attempted and the likely cause.
- Removed a stale `backend/package-lock.json` that predated Priority 5.2 dependencies (`bcryptjs`, `cookie-parser`, `google-auth-library`, `jsonwebtoken`, `pdfkit`), which was causing `npm ci` to silently fall back to `npm install` in Docker builds.

### Security
- Removed a real Gemini API key that had been accidentally committed in `backend/.env`; replaced with a placeholder. (If this affected you, rotate your key at https://aistudio.google.com/apikey.)

---

## [5.2] — Product Features & Deployment Preparation

### Added
- **Authentication** — email/password (bcrypt-hashed, 12 salt rounds) and optional "Sign in with Google" (Google Identity Services + server-side ID token verification). Sessions use two JWTs (short-lived access, long-lived refresh) as `httpOnly`, `SameSite=Lax` cookies, with `Secure` enforced automatically in production. `POST /api/auth/refresh` rotates the access token. Login/register are rate-limited and return identical errors for "wrong password" vs. "no such account" (no email enumeration).
- **User management & dashboard** — `GET/PATCH /api/users/me`, `POST /api/users/me/password`, and a new `DashboardPage` showing profile plus report history.
- **Saved reports** — `POST/GET /api/reports`, `GET/DELETE /api/reports/:id`, all authenticated and ownership-checked. Persisted via a new file-backed repository layer, swappable for a real database later.
- **PDF report export** — `POST /api/reports/export-pdf` (anonymous, no save required) and `GET /api/reports/:id/pdf` (saved reports, auth + ownership checked), rendered via `pdfkit`.
- **Frontend integration** — new `AuthContext`, `LoginPage`/`SignupPage` matching the existing visual language, a fixed `AccountMenu` and `ActionDock` (Save Report/Download PDF) as overlay siblings — existing pages (`LandingPage`, `LoadingPage`, `ResultsPage`, `ResultsTabs`) untouched.
- **Deployment preparation** — `DEPLOYMENT.md`, `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml`, and expanded `.env.example` files documenting every new variable (`JWT_SECRET`, `GOOGLE_CLIENT_ID`, `DATA_DIR`, `COOKIE_SECURE`, etc.). The backend now fails fast at startup if `JWT_SECRET` is unset in production.
- **Testing** — new backend integration/unit suites for auth and reports, plus a new frontend suite covering the login → dashboard flow.

### Notes
- Everything in this release is additive; `/api/chart` and `/api/generate-report` are unchanged.

---

## [5.1] — Frontend Excellence & Responsive User Experience

### Added
- Modularized the previously-monolithic 912-line `App.jsx` into a proper component/page/utils structure.
- New 10-test frontend suite (Vitest + Testing Library).

### Fixed
- Fixed a horizontal-scroll bug: `ZodiacWheel`'s fixed-size SVG now scales fluidly via `viewBox`, preventing overflow on narrow phones.
- Fixed a fixed-position error toast that could push past the left edge on very narrow viewports.
- Birth-data form is now a real `<form>` (previously a bare `onClick` button), enabling Enter-to-submit.

### Changed
- Accessibility: proper `<label htmlFor>`/`id` associations, `aria-invalid`/`aria-describedby`/`role="alert"` on validation errors, `role="status"`/`aria-live="polite"` on loading states, `role="progressbar"`, `role="tablist"`/`"tab"`/`aria-selected` on report tabs, semantic landmarks, `aria-hidden` on decorative emoji, visible `:focus-visible` ring, and `prefers-reduced-motion` support.
- Performance: `ResultsPage` is now lazy-loaded via `React.lazy`/`Suspense`; `CosmicBg` and shared primitives are memoized; global CSS is now a real imported stylesheet instead of being re-injected on every page mount; fonts load via `<link>`/`preconnect` instead of a render-blocking `@import`.

### Notes
- No visual redesign — colors, gradients, animations, fonts, and copy are unchanged; this release is spacing, structure, and behavior work only.

---

## [4.0] — Performance & Production Hardening

### Added
- TTL+LRU cache primitive; `computeChart()` and Gemini's `callGemini()` are now memoized.
- Gzip/br response compression, request body size cap, and `Vary: Accept-Encoding`.
- Request/timing metrics (avg/p50/p95) and cache hit rates via new `GET /api/metrics`; per-request `X-Request-Id` header; optional `LOG_FORMAT=json` structured logging.
- Defensive response headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) and a per-IP rate limiter on POST endpoints.
- `sanitizeBirthFields()` as a new, non-breaking pre-validation step.
- `backend/.env.example` and `.gitignore` (root and backend).
- New backend test suite (Vitest + Supertest): 55 tests covering cache, validators, rule engine, birth chart engine, Gemini service, and full route integration.
- `server.js` now exports `createApp()` for testability; sets `trust proxy`; disables `X-Powered-By`; graceful shutdown on `SIGTERM`/`SIGINT`.

### Fixed
- A cache mutation bug where the Gemini cache could be silently corrupted by a downstream formatter mutating the report object; fixed by returning a shallow clone on every cache read.

### Changed
- `middleware/errorHandler.js` now returns a generic, safe message for unexpected errors in production, while all existing curated error messages are unchanged. Added process-level `unhandledRejection`/`uncaughtException` logging.

### Security
- Flagged a live API key previously shipped in `backend/.env` with no `.gitignore` protection — **rotate this key.**

### Notes
- No route, request/response shape, or astrology calculation changed (aside from the two new, purely additive `/api/metrics` endpoints).

---

## [3.0] — Professional Vedic Astrology Engine

### Added
- **Planet Strength profile**: retrograde (Vakri), combustion (Asta), planetary friendship (Naisargika Maitri), natural benefic/malefic status, functional benefic/malefic status (derived algorithmically from house lordship, including Yogakaraka detection), directional strength (Dig Bala), and a composite Shadbala score.
- **Nakshatra profile engine**: Lord, Gana, Yoni, Nadi, Symbol, Deity, Nature, and traditional tendencies.
- **Vimshottari Dasha engine**: full Mahadasha/Antardasha timeline, current active Dasha, and remaining balance.
- **Transit (Gochar) engine**: Saturn/Jupiter/Rahu/Ketu transits vs. natal Moon, with Sade Sati / Kantaka Shani / Ashtama Shani flags.
- **Advanced Yoga engine**: Panch Mahapurusha, Neecha Bhanga Raja Yoga, Viparita Raja Yoga, Chandra Mangal Yoga, Lakshmi Yoga, Saraswati Yoga, Adhi Yoga, and others.
- **Advanced Dosha engine**: detailed Manglik severity, Kaal Sarp Dosha subtypes, Pitru Dosha, Guru Chandal Yoga, Grahan Yoga, Kemadruma Yoga, Shrapit Yoga.
- **Divisional chart (Varga) foundation**: registry-driven computation supporting D9/D10/D7/D12, extensible via config only.
- **AI Report Intelligence**: a structured insights object (with explicit contributing factors) optionally passed to the prompt builder so Gemini can explain *why*, never *what*.

### Notes
- All new data is computed internally but deliberately **not** merged into the public API response — `/api/chart`, `/api/generate-report`, the Gemini prompt schema, and the frontend remain byte-identical, verified by diffing response key sets across sample charts.
- Kaala Bala and Drik Bala are intentionally out of scope, pending finer ephemeris/aspect data.

---

## [2.0] — Reliability, Diagnostics & Core Architecture Fixes

### Added
- Automatic retry with exponential backoff for transient Gemini failures (`GEMINI_MAX_RETRIES`, `GEMINI_RETRY_BASE_MS`).
- Automatic fallback Gemini model (`GEMINI_FALLBACK_MODEL`) if the primary model fails after all retries.
- A shared total time budget across all Gemini attempts (`GEMINI_TOTAL_BUDGET_MS`, default 45s) to prevent indefinite hangs.
- Status-specific Gemini error diagnostics (401/403 key/permission issues, 404 bad model name, 429 rate limit, timeout, blocked/empty response).
- Request timeout (`AbortController`, default 25s, configurable via `GEMINI_TIMEOUT_MS`).
- Markdown-fence-aware JSON extraction fallback for Gemini responses, with full raw-text logging on parse failure.
- Regex validation for `dob`/`tob`/`pob`/`name` on `/api/chart` and `/api/generate-report`.
- Structured request logging middleware and masked-key/model/port startup diagnostics.
- Centralized JSON error and 404 handlers.
- `FRONTEND_ORIGIN` environment variable for configurable CORS.
- `.env.example` files for both `backend/` and `frontend/`.
- `GET /api/health` now reports configured port, model, and whether an API key is present.

### Fixed
- Frontend `.catch()` previously discarded the real error object before showing a generic banner; the actual backend-provided reason is now surfaced in the UI.
- Frontend date-parsing bug: `calcNumerology` destructured date fields in the wrong order, producing incorrect Mulank/Bhagyank; fixed to match the `YYYY-MM-DD` format actually emitted by native date inputs.
- Frontend previously displayed its own preliminary chart data instead of the backend's authoritative response after report generation; the backend's `chart` object now always overwrites local preview state.
- Loading screen previously ran on a fixed ~9.5s timer independent of the real API call, sometimes handing off to the results page before the request had actually resolved; it now tracks the real backend call and only completes once that call settles.
- A misleading retry/fallback log message that falsely claimed a retry/fallback had already happened on the very first failure; the final error now reports an accurate count of what was actually attempted.
- Frontend previously showed a perpetual "still working" spinner even after a permanent failure; sections now show a plain "Unavailable" state once the request has definitively failed.
- Backend now accepts either `GOOGLE_API_KEY` or `GEMINI_API_KEY` (with `GOOGLE_API_KEY` taking precedence), trimmed to strip accidental whitespace.
- API key is now sent via the `x-goog-api-key` header (previously a `?key=` query parameter), supporting both classic and newer Google key formats.
- Backend and frontend ports moved off common defaults (backend → `8617`, frontend → `5187`) to avoid local conflicts; a `/api` dev proxy was added as a CORS-free fallback.

### Changed
- `responseMimeType: "application/json"` failures on some models/API versions are now detected and transparently retried once without that field.

---

## [1.0] — Initial Release: Core Astrology Engine & Gemini Integration

### Added
- Deterministic backend astrology engine: Lagna, planetary positions/houses, Nakshatra, numerology (Mulank/Bhagyank), yoga/dosha detection, and remedies.
- Google Gemini integration as a strictly interpretive narrative layer — the engine computes all facts; Gemini only explains them.
- `/api/chart` and `/api/generate-report` endpoints.

### Notes
- This is the architectural foundation on which all subsequent priorities (2 through 6.4) were built without ever changing its core guarantee: **Gemini never calculates anything.**
