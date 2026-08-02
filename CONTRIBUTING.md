# Contributing to NakshatraVerse

Thank you for your interest in contributing to **NakshatraVerse**! We welcome contributions from developers, astrologers, UI/UX designers, and open-source enthusiasts.

---

## 📜 Code of Conduct

- **Respect**: Maintain a respectful, inclusive, and collaborative environment.
- **Accuracy**: Astrological logic must remain **backend-authoritative and deterministic**. Generative AI models are strictly reserved for narrative explanations.
- **Testing**: Every bug fix or feature must be backed by unit/integration tests (`backend/tests/` or `frontend/tests/`).

---

## 🛠️ Development Setup

1. **Fork & Clone**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/NakshatraVerse.git
   cd NakshatraVerse
   ```

2. **Setup Backend**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Add MONGODB_URI & GOOGLE_API_KEY to .env
   npm run dev
   ```

3. **Setup Frontend**:
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   npm run dev
   ```

4. **Verify Tests**:
   ```bash
   # Backend Tests (461 tests)
   cd backend && npm test

   # Frontend Tests (168 tests)
   cd frontend && npm test
   ```

---

## 🔀 Branching Strategy & Pull Requests

1. **Branch Naming**:
   - `feature/short-description` (for new features)
   - `fix/short-description` (for bug fixes)
   - `docs/short-description` (for documentation updates)

2. **Commit Messages**:
   Follow conventional commits:
   - `feat: add voice reading support`
   - `fix: resolve tokenVersion mismatch in auth middleware`
   - `docs: update API endpoints`

3. **Submitting a Pull Request**:
   - Ensure all tests pass locally.
   - Fill out the PR template with context and screenshots (if applicable).
   - Link the relevant GitHub Issue.

Thank you for helping make NakshatraVerse the best open-source Vedic Astrology platform! 🪐
