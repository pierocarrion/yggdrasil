# Yggdrasil

> *Turn your journal into a living map of your mind.*

Yggdrasil is an AI-powered semantic journaling web app. Users write or dictate entries; a two-phase Gemini analysis extracts themes, emotions, entities, and patterns from each one, then surfaces insights, a knowledge graph, and semantic clusters across the entire journal history. Built for the **Build with Gemini XPRIZE hackathon** (Education & Human Potential, deadline August 17, 2026).

Full product context lives in [docs/yggdrasil-product-spec-v4.md](docs/yggdrasil-product-spec-v4.md) (see §13 for the current implementation status) and [docs/yggdrasil-prd-v3.md](docs/yggdrasil-prd-v3.md).

## Key features

- **Intelligent journaling** — Rich composer with entry types (Reflection / Gratitude / Dream / Event), optional two-slider mood tracking (polarity × intensity → derived "How We Feel" label), and word counts. Saving triggers a background Cloud Function that depth-scores the entry (1–11) and runs a 13-field Gemini analysis (see [docs/analysis-schema.md](docs/analysis-schema.md)).
- **Voice notes & transcription** — In-browser recording uploaded to Firebase Storage and transcribed by Gemini multimodal (`transcribeAudio` callable).
- **Semantic embeddings & connections** — Each entry gets a 768-dim Gemini embedding stored as a Firestore vector. Similarity edges and entry clusters are computed server-side on every analysis.
- **Knowledge graph** — Interactive D3.js force-directed graph of themes, people, and concepts across all entries, served by `/api/knowledge-graph` (basic tier for free users, full for Pro).
- **Insights dashboard** — 52-week streak calendar with day/time heatmaps, frequency and mood charts, emotional-patterns scatter timeline, and a client-side K-Means cluster map.
- **Subscriptions (Stripe)** — Free vs Pro tiers. Checkout, billing portal, webhook-driven subscription sync, lifetime plan with prorated upgrade credit, and refund revocation. Free users get 5 fully-analyzed trial entries before insight gating.
- **Marketing homepage** — Public landing page with a live rate-limited Yggi demo (`/api/reflect`), abuse guards (device/IP/global sliding windows backed by Firestore), and email lead capture.
- **Analytical frameworks** — Twelve opt-in lenses (Jungian, IFS, CBT, Stoic, …) that shape how Gemini frames its insights.

In progress (backend exists, no UI yet): Yggi chat drawer, Hidden Connections (Cirq path is stubbed; KNN fallback implemented), Roots (Goals/Journeys/Living Tree), weekly AI reports, admin ops dashboard access.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router, Turbopack), React 19, Tailwind CSS 4 |
| Visualizations | D3.js (force-directed graphs, SVG) |
| Auth / DB / Storage | Firebase Auth, Firestore (incl. KNN vector search), Firebase Storage |
| Backend | Firebase Cloud Functions v2 (TypeScript, in `functions/`) + Next.js API routes |
| AI | Gemini API — `gemini-3.5-flash` default, `gemini-embedding-001` (768-dim) for embeddings |
| Payments | Stripe (checkout, billing portal, webhooks) |
| Analytics | Firebase Analytics (client) + GA4 Measurement Protocol (server) |
| Hosting | Cloud Run (containerised Next.js, deployed via GitHub Actions) |

## Repository layout

```
app/            Next.js App Router pages and API routes
  (auth)/       login, signup
  (dashboard)/  journal, entries, insights, roots, settings, pricing
  admin/        ops dashboard (session-cookie + admin-claim gated)
  api/          reflect (public demo), subscribe, knowledge-graph, health
components/     journal, entries, insights, billing, marketing, auth
context/        AuthContext, SubscriptionContext
hooks/          useAuth, useSubscription, useJournal, useFirestore
lib/            firebase clients, gemini client, knowledge graph, clustering,
                entries CRUD, demo abuse guards, analytics
functions/      Cloud Functions: analyzeEntry, transcribeAudio, yggiChat,
                computeHiddenConnections, stripe/*, weeklyReport, onUserCreate
types/          journal, insights, goals, subscription, user
docs/           product spec (v4), PRD (v3), analysis schema, brand,
                ticket backlog, collaborator onboarding
```

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Create `.env.local` with the Firebase client config, Firebase Admin credentials, `GEMINI_API_KEY`, and Stripe keys — see [.env.production.example](.env.production.example) for the full variable list. Cloud Functions use their own env file: [functions/.env.production.example](functions/.env.production.example).

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run type-check` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Jest (jsdom + Testing Library) |

CI runs type-check, lint, tests, and a functions build on every PR ([.github/workflows/ci.yml](.github/workflows/ci.yml)). Pushes to `main` build the Docker image and deploy to Cloud Run with secrets injected from GCP Secret Manager ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)).

## Changelog

- **v1.4.0 — Marketing homepage & ops**
  - Public homepage with live Yggi demo, Firestore-backed rate limiting (device/IP/global), honeypot-protected email capture, and safety flagging on demo reflections.
  - Admin ops dashboard page (leads, demo activity, `opsLogs` from entry analysis).
  - Knowledge Graph API hardening; Cloud Run env configuration and Firebase Admin ADC fallback.

- **v1.3.0 — Stripe billing & tier gating**
  - Checkout and billing-portal Cloud Functions; webhook sync of `subscriptions/{userId}` with idempotent event processing.
  - Lifetime plan with prorated upgrade credit and refund-based revocation.
  - Live subscription context, `<FeatureGate>` component, plan selection on `/pricing`, free-tier insight gating after 5 analyzed entries.
  - Entry-level emotion timeline and entries search bar.

- **v1.2.0 — UI enhancements & stability**
  - Stabilized D3 force-directed graph rendering with coordinate clamping (fixing `NaN` layout explosions).
  - Merged conflicting payload definitions for `wordCount` and `entryDate`; fixed strict type errors across `KnowledgeGraph.tsx` and `ClusterMap.tsx`.

- **v1.1.0 — Emotion timeline & clustering**
  - Emotional Patterns scatter timeline replacing the legacy line chart.
  - K-Means clustering of entries by semantic similarity; streak calendar day/time heatmaps.

- **v1.0.0 — Semantic search & voice**
  - Gemini embeddings for all new entries; interactive D3 knowledge graph.
  - In-browser voice recording with Cloud Function transcription; Firestore security rules.
