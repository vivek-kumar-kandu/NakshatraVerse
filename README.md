# 🪐 NakshatraVerse

<div align="center">

![NakshatraVerse Banner](./docs/assets/nakshatraverse-infographic-banner.png)

### **Discover Your Cosmic Blueprint**
*AI-Powered Vedic Astrology Platform with Deterministic Ephemeris Engine, Kundli Matching, Panchang, Life Coach & Multilingual AI Insights.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![CI Pipeline](https://github.com/vivek-kumar-kandu/NakshatraVerse/actions/workflows/ci.yml/badge.svg)](https://github.com/vivek-kumar-kandu/NakshatraVerse/actions)
[![Build Status](https://img.shields.io/badge/status-production--ready-brightgreen.svg)]()
[![Backend Tests](https://img.shields.io/badge/backend%20tests-461%2F461%20passing-success.svg)]()
[![Frontend Tests](https://img.shields.io/badge/frontend%20tests-168%2F168%20passing-success.svg)]()
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react&logoColor=black)]()
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933.svg?logo=nodedotjs&logoColor=white)]()
[![Express](https://img.shields.io/badge/Express-4.21-000000.svg?logo=express&logoColor=white)]()
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248.svg?logo=mongodb&logoColor=white)]()
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-4285F4.svg?logo=googlegemini&logoColor=white)]()
[![Multilingual](https://img.shields.io/badge/i18n-15%20Languages%20%2B%20RTL-purple.svg)]()
[![Vercel](https://img.shields.io/badge/Vercel-Frontend-000000.svg?logo=vercel&logoColor=white)](https://vercel.com)
[![Render](https://img.shields.io/badge/Render-Backend-46E3B7.svg?logo=render&logoColor=white)](https://render.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?logo=docker&logoColor=white)]()

[Live Demo](https://nakshatra-verse.vercel.app) • [API Documentation](#6-api-reference--documentation) • [System Architecture](#2-architecture--system-design) • [Roadmap](#13-future-roadmap)

</div>

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & System Design](#2-architecture--system-design)
3. [Visual Showcase & Screenshots](#3-visual-showcase--screenshots)
4. [Core Features](#4-core-features)
5. [Technology Stack](#5-technology-stack)
6. [API Reference & Documentation](#6-api-reference--documentation)
7. [Local Development & Installation](#7-local-development--installation)
8. [Environment Configuration](#8-environment-configuration)
9. [Google Sign-In & OAuth Setup](#9-google-sign-in--oauth-setup)
10. [Security & Hardening](#10-security--hardening)
11. [Deployment Strategy](#11-deployment-strategy)
12. [Testing Suite](#12-testing-suite)
13. [Future Roadmap](#13-future-roadmap)
14. [Star History](#14-star-history)
15. [License & Author](#15-license--author)

---

## 1. Project Overview

**NakshatraVerse** is a state-of-the-art, full-stack Vedic Astrology platform engineered with a strict separation between **deterministic astronomical computation** and **generative AI narrative synthesis**.

### 🛡️ Core Guarantee: Gemini Never Calculates

Unlike naive AI applications that prompt an LLM to "calculate a birth chart" (which results in hallucinations and inaccurate planetary degrees), **NakshatraVerse computes 100% of astrological facts deterministically on the backend**.

```
User Birth Data (Date, Time, Location)
                │
                ▼
┌────────────────────────────────────────────────────────┐
│         Backend Ephemeris Engine (Deterministic)       │
│  - Planetary Longitudes, Lagna & House Placements       │
│  - Planet Strength (Shadbala, Dignity, Combustion)     │
│  - Yogas & Doshas Detection (Panch Mahapurusha, etc.)  │
│  - Vimshottari Dasha Timeline & Transits (Gochar)      │
│  - Numerology (Mulank & Bhagyank) & Remedies           │
└──────────────────────────┬─────────────────────────────┘
                           │ Evaluated Facts (JSON)
                           ▼
┌────────────────────────────────────────────────────────┐
│             Google Gemini Narrative AI                 │
│  - Explains AUTHORITATIVE backend facts in natural     │
│    language (15 Languages supported)                   │
│  - Strictly forbidden from inventing positions/facts   │
└──────────────────────────┬─────────────────────────────┘
                           │ AI Reading Narrative
                           ▼
              Interactive React Frontend
```

---

## 2. Architecture & System Design

### 2.1 High-Level Architecture Diagram

```mermaid
graph TD
    Client[React 18 SPA / Vite] <-->|HTTP / CORS / Cookies| Express[Express 4 Node.js API]
    
    subgraph Backend Infrastructure
        Express --> Auth[Auth Service / JWT + bcrypt]
        Express --> AstroEngine[Astrology Engine Core]
        Express --> RateLimiter[Redis / In-Memory Rate Limiter]
        
        AstroEngine --> RuleEngine[Config-Driven Rule Evaluators]
        RuleEngine --> Mongo[(MongoDB Atlas)]
        
        AstroEngine -->|Structured Facts Prompt| GeminiService[Google Gemini AI Service]
        GeminiService -->|Fallback & Retry| GeminiAPI[Google Gemini 2.5 Flash API]
    end
```

### 2.2 System Design Deep-Dive

#### A. Authentication & Session Security (BUG-02 Fix)
- **Stateful JWT Token Revocation**: JWTs embed a `tokenVersion` counter. Middleware checks MongoDB `user.tokenVersion === payload.tokenVersion` on protected endpoints. Changing a password or revoking account access increments `tokenVersion`, instantly invalidating all existing active sessions.
- **Dual Cookie Architecture**: Short-lived `nv_access_token` (15 min) and long-lived `nv_refresh_token` (30 days) stored as `HttpOnly`, `SameSite=Lax` / `None`, `Secure` cookies.

#### B. Dynamic Rate Limiting & Scaling (BUG-01 Fix)
- **Redis Multi-Instance Rate Limiter**: Rate limiters for Chart generation, AI Report, Auth, and Panchang endpoints query a shared Redis instance when `REDIS_URL` is set. When running in single-process mode, they automatically degrade to an in-memory `Map` counter.

#### C. Multilingual & Internationalization Pipeline
- **15-Language Support**: English, Hindi, Sanskrit, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Odia, Assamese, Urdu (RTL), and Spanish.
- **RTL Engine**: Full Right-to-Left layout adaptation and text direction management for Urdu.

---

## 3. Visual Showcase & Screenshots

### 🖼️ Platform Interface Showcase

| User Dashboard Welcome | Birth Report Overview | Interactive Kundli Chart |
|:---:|:---:|:---:|
| ![User Dashboard Welcome](./docs/assets/dashboard-welcome.png) | ![Birth Details & Numerology Overview](./docs/assets/birth-overview.png) | ![Interactive Birth Chart & Planetary Positions](./docs/assets/interactive-chart.png) |

| AI Astrology Assistant | Daily Panchang & Muhurat | Kundli Matching |
|:---:|:---:|:---:|
| ![AI Astrology Assistant Chat](./docs/assets/ai-assistant.png) | ![Daily Panchang & Muhurat Selection](./docs/assets/daily-panchang.png) | ![Kundli Ashta Koota Matching](./docs/assets/kundli-matching.png) |

---

## 4. Core Features

### 🌌 Deterministic Astrology Engine
- **Natal Chart Computation**: Lagna, planetary longitudes, house cusps, Nakshatras, and Numerology (Mulank & Bhagyank).
- **Planet Strength Profile**: Exaltation/debilitation, Vakri (retrograde), Asta (combustion), natural/functional benefics, Dig Bala (directional strength), and composite Shadbala.
- **Yoga & Dosha Engines**: Detects Panch Mahapurusha, Neecha Bhanga Raja Yoga, Viparita Raja Yoga, Kaal Sarp subtypes, Pitru Dosha, Guru Chandal Yoga, Manglik Dosha, and remedies.
- **Vimshottari Dasha & Gochar**: Complete Mahadasha/Antardasha timeline calculation and Saturn Sade Sati / Kantaka Shani transits.

### 🤖 Generative AI Narrative Integration
- **Context-Grounded Interpretations**: Gemini synthesizes natural language interpretations strictly based on verified backend JSON payloads.
- **Resilient AI Pipeline**: Automatic exponential backoff retries, multi-model fallbacks (`gemini-2.5-flash-lite` → `gemini-2.5-flash`), and structured error diagnostics.

### 💖 Kundli Matching & Relationship Hub
- Ashta Koota matching (36 Gunas calculation: Varna, Vashya, Tara, Yoni, Maitri, Gana, Bhakoot, Nadi) and Manglik compatibility scoring.

### 📅 Daily Panchang & Muhurat Finder
- Real-time Tithi, Vaar, Nakshatra, Yoga, Karana, Rahu Kalam, Abhijit Muhurat, and Sunrise/Sunset computations.

---

## 5. Technology Stack

### Frontend
- **Framework**: React 18.3 + Vite 5.4
- **State & Context**: Context API + `i18next` (15 languages + RTL support)
- **Styling**: Vanilla CSS3 + Modern Glassmorphism + Cosmic UI Design System
- **Testing**: Vitest + React Testing Library (168/168 tests passing)

### Backend
- **Runtime**: Node.js 20+ (ES Modules)
- **Server**: Express 4.21
- **Database**: MongoDB 8 (Mongoose 9 ODM)
- **Caching & Limiting**: Redis (`ioredis`) with in-memory fallback
- **Authentication**: JWT (`jsonwebtoken`) + Password Hashing (`bcryptjs` - 12 rounds)
- **PDF Generation**: PDFKit (Client-side and Server-side PDF export)
- **Testing**: Vitest + Supertest (461/461 integration & unit tests passing)

### Infrastructure
- **Hosting**: Vercel (Frontend SPA) + Render (Backend Web Service)
- **Containers**: Multi-stage Dockerfiles (`backend/Dockerfile`, `frontend/Dockerfile`) + Docker Compose

---

## 6. API Reference & Documentation

### Authentication Endpoints

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/google
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

#### Request: `POST /api/auth/login`
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

#### Response: `200 OK`
```json
{
  "user": {
    "id": "c1f7a8e2-9b34-4a11-8e3d-7a2b9e104f58",
    "name": "Vivek Kandu",
    "email": "user@example.com",
    "picture": null,
    "authProvider": "password"
  }
}
```

---

### Astrology & AI Endpoints

```http
POST /api/chart
POST /api/generate-report
POST /api/matching/compute
GET  /api/panchang
GET  /api/festivals
GET  /api/family-profiles
PATCH /api/users/me/photo
```

#### Request: `POST /api/chart`
```json
{
  "name": "Arjuna",
  "dob": "1995-10-15",
  "tob": "08:30",
  "pob": "New Delhi, India"
}
```

---

## 7. Local Development & Installation

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **MongoDB**: Local instance or MongoDB Atlas URI
- **Google Gemini API Key**: [Get a key at Google AI Studio](https://aistudio.google.com/apikey)

### 1. Clone the Repository
```bash
git clone https://github.com/vivek-kumar-kandu/NakshatraVerse.git
cd NakshatraVerse
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```
Edit `backend/.env` and supply your `MONGODB_URI` and `GOOGLE_API_KEY`:
```env
PORT=8617
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/nakshatraverse
GOOGLE_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_super_secret_jwt_key
FRONTEND_ORIGIN=http://localhost:5187
```
Start backend:
```bash
npm run dev
```

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Open your browser at `http://localhost:5187`.

---

## 8. Environment Configuration

### Backend Environment Variables (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `8617` | HTTP Server Port |
| `MONGODB_URI` | **Yes** | — | MongoDB Atlas Connection String |
| `REDIS_URL` | No | — | Optional Redis URL for shared rate limits & sessions |
| `GOOGLE_API_KEY` | **Yes** | — | Google Gemini API Key |
| `GEMINI_MODEL` | No | `gemini-2.5-flash-lite` | Primary AI Model |
| `JWT_SECRET` | **Yes** | — | Secret string for JWT signature verification |
| `FRONTEND_ORIGIN` | **Yes** | `*` | Allowed CORS Origin |

---

## 9. Google Sign-In & OAuth Setup

1. Navigate to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** (Web application).
3. Set **Authorized JavaScript Origins**: `http://localhost:5187` and `https://nakshatra-verse.vercel.app`.
4. Copy the Client ID and paste it into both `backend/.env` (`GOOGLE_CLIENT_ID`) and `frontend/.env` (`VITE_GOOGLE_CLIENT_ID`).

---

## 10. Security & Hardening

- **Protection Against Token Theft**: Access and Refresh tokens are stored in `HttpOnly` cookies, preventing XSS-based token theft.
- **Brute Force Defense**: IP-based rate limiting on sensitive routes (`/api/auth/*`, `/api/chart`, `/api/generate-report`).
- **Input Sanitization**: Mongoose strict schema enforcement (`strict: true`) and XSS string trimming.
- **MIME & Frame Protections**: Hand-rolled security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`).

---

## 11. Deployment Strategy

### Docker Compose
```bash
docker compose up --build -d
```

### Vercel & Render
- **Frontend (Vercel)**: Configured via root [`vercel.json`](./vercel.json) using `@vercel/static-build` targeting `frontend/dist`.
- **Backend (Render)**: Deployed as a Node Web Service running `npm start`.

---

## 12. Testing Suite

The repository features comprehensive automated test coverage:

```bash
# Run Backend Integration & Unit Tests (461 tests)
cd backend && npm test

# Run Frontend Component & E2E Tests (168 tests)
cd frontend && npm test
```

| Test Suite | Total Tests | Status |
|---|---|---|
| **Backend Suite** | **461 / 461** | ✅ **100% Passing** |
| **Frontend Suite** | **168 / 168** | ✅ **100% Passing** |

---

## 13. Future Roadmap

- [x] **Phase 1**: Core Astrological Engine & Ephemeris Calculation
- [x] **Phase 2**: Google Gemini Narrative Grounding
- [x] **Phase 3**: Kundli Matching & Ashta Koota Compatibility
- [x] **Phase 4**: Daily Panchang, Muhurat Finder & Festival Intelligence
- [x] **Phase 5**: Multilingual Engine (15 Languages + Urdu RTL)
- [x] **Phase 6**: MongoDB Migration, JWT Revocation & Redis Rate Limiting
- [ ] **Phase 7**: Mobile Native Application (React Native / Expo)
- [ ] **Phase 8**: AI Voice Assistant (Audio Consultation Synthesis)
- [ ] **Phase 9**: RAG Engine over Classical Vedic Texts (BPHS & Saravali)
- [ ] **Phase 10**: Admin & Analytics Dashboard
- [ ] **Phase 11**: Kubernetes Helm Chart & Multi-Region Deployment

---

## 14. Star History

[![Star History Chart](https://api.star-history.com/svg?repos=vivek-kumar-kandu/NakshatraVerse&type=Date)](https://star-history.com/#vivek-kumar-kandu/NakshatraVerse&Date)

---

## 15. License & Author

### License
This project is licensed under the **MIT License** — see the [`LICENSE`](./LICENSE) file for details.

### Author
**Vivek Kumar Kandu**  
*Computer Science & Information Technology Undergraduate*  
Ajay Kumar Garg Engineering College (AKGEC), Ghaziabad  

- **GitHub**: [@vivek-kumar-kandu](https://github.com/vivek-kumar-kandu)
- **LinkedIn**: [Vivek Kumar Kandu](https://www.linkedin.com/in/vivek-kumar-kandu/)
- **Email**: vk6073859@gmail.com

---

<div align="center">
  <sub>Built with ❤️ and Precision for Cosmic Explorers Worldwide.</sub>
</div>
