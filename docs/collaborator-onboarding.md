# Yggdrasil — Collaborator Onboarding Guide

**Last updated: July 2026**
**Deadline: August 17, 2026 — Build with Gemini XPRIZE**

---

## Table of Contents

1. [Welcome & Project Context](#1-welcome--project-context)
2. [The App & What's Actually Built](#2-the-app--whats-actually-built)
3. [Tech Stack](#3-tech-stack)
4. [Setup: Your Development Environment](#4-setup-your-development-environment)
5. [Codebase Structure](#5-codebase-structure)
6. [Architecture Patterns You Need to Know](#6-architecture-patterns-you-need-to-know)
7. [Coding Standards](#7-coding-standards)
8. [Analytics Instrumentation](#8-analytics-instrumentation)
9. [Firestore Data Model](#9-firestore-data-model)
10. [Admin Ops Dashboard](#10-admin-ops-dashboard)
11. [Working on a Task (Linear + SOPs)](#11-working-on-a-task-linear--sops)
12. [Communication (Discord)](#12-communication-discord)
13. [Git Workflow & Pull Requests](#13-git-workflow--pull-requests)
14. [Testing](#14-testing)
15. [Design System](#15-design-system)
16. [Deployment](#16-deployment)
17. [Things You Must Not Do](#17-things-you-must-not-do)
18. [Resources & Access Checklist](#18-resources--access-checklist)

---

## 1. Welcome & Project Context

Yggdrasil is an AI-powered semantic journaling web app. Users write (or dictate) journal entries; the app extracts themes, emotions, people, and patterns from each one via Gemini, then surfaces insights, a visual knowledge graph, and semantic clusters across their entire journal history.

We are building on a Google-native stack and submitting to the **Build with Gemini XPRIZE hackathon** (Education & Human Potential category, $2M prize pool). The submission deadline is **August 17, 2026**. Everything is scoped to that date.

There is an older prototype (React + Supabase, on Lovable). It is **reference material only** — do not copy code from it. It tells you what was built; we are building the new version on Firebase + Gemini.

**Why this matters for how you work:** XPRIZE judges on **Business Viability**, **AI-Native Operations**, and **Category Impact**. Every task exists in service of at least one. When in doubt about scope, ask: does this advance the submission? If not, flag it rather than building it.

> **New here?** Jump to the [Access Checklist](#18-resources--access-checklist) first — get into Linear, Discord, GitHub, and Firebase before anything else.

---

## 2. The App & What's Actually Built

The product vision is five tabs plus a floating AI companion. **Not all of it is built** — this section is the honest current state (July 2026). Check the "Status" column before you assume a feature exists. The canonical, always-updated version of this table is §13 of [`docs/yggdrasil-product-spec-v4.md`](yggdrasil-product-spec-v4.md).

| Tab / feature | What it does | Status |
|---|---|---|
| **Journal** | Rich composer: entry types, two-slider mood, tags, voice notes. On save, a Cloud Function runs two-phase Gemini analysis. | ✅ Live |
| **Entries** | Entry list + search bar. | ✅ Live (full-text; semantic search UI pending) |
| **Insights** | Streak calendar, mood charts, emotional patterns, cluster map, knowledge graph. | ✅ Live (5 of 6 sections) |
| **Living Tree** (`/roots`) | Roots = values & goals (one `Root` type, `kind: 'value' \| 'goal'`). Each Root nests its own journey timeline (linked journal entries + events), **Rings** (dated milestones), **Branches** (weekly practices; "Grow branches" AI generation is Pro-only), **Fruit** (measurable outcome), and micro-wins. Entries link to Roots via AI suggestions (confirm/dismiss) or manually. | ✅ Live (July 2026, PR #17) |
| **Settings** | 12 analytical-framework toggles. Data export + account deletion. | ⚠️ Framework toggles live; export/delete not built |
| **Yggi Chat** | Floating RAG companion over journal history. | 🔲 Backend `yggiChat` function exists; **no frontend caller yet** |
| **Hidden Connections** | Signature feature (see below). | 🔲 Backend exists (KNN only); no UI, Cirq is stubbed |
| **Marketing homepage** | Public landing page + live rate-limited demo + email capture. | ✅ Live (added June 2026) |
| **Admin ops dashboard** | Internal ops view (leads, demo activity, analysis logs). | ✅ Live — see [§10](#10-admin-ops-dashboard) |

If your task touches a 🔲 feature, you may be building it for the first time — confirm scope with Isa.

### Subscription tiers

Two tiers: **Free** and **Pro**. Pro is any active paid `billingPeriod` (monthly / yearly / lifetime).

| Feature | Free | Pro |
|---|---|---|
| Journal entries + AI extraction | ✅ | ✅ |
| Entry insights | 5 analyzed entries, then gated | Unlimited |
| Living Tree roots (each with its own journey) | 5 active | Unlimited |
| "Grow branches" AI action generation | ❌ | ✅ |
| Knowledge graph | Basic | Full |
| Yggi, Hidden Connections, weekly digest, data export | ❌ (planned) | ✅ (planned) |

Pricing: **$4.99/mo · $44.99/yr · $149 lifetime**. Two gates are enforced in code today: the **insight gate** (5 analyzed entries) in `functions/src/gemini/analyzeEntry.ts` (`FREE_INSIGHT_LIMIT` + the `insightGated` flag), and the **roots cap** (5 active) in `functions/src/roots/onRootWrite.ts` (`FREE_ROOTS_LIMIT` + a server-set `gated` flag Firestore rules stop clients clearing). "Grow branches" is Pro-gated both in the UI (`FeatureGate`) and server-side in `generateBranchActions`. Journeys have **no separate cap** — they're nested inside Roots.

### Hidden Connections — the signature feature (aspirational)

The intended pipeline: on save, Gemini embeds the entry → a batch runs **Google Cirq** (quantum-inspired graph analysis) to find non-obvious pairs → D3 renders them, with a silent **Firestore KNN cosine-similarity fallback**. Whichever path runs is logged via `hidden_connections_computation` (`path: 'cirq' | 'fallback_knn'`).

**Reality today:** `functions/src/insights/hiddenConnections.ts` exists, but the Cirq branch is a stub that always throws → it always runs the KNN fallback, nothing calls the function, and there's no UI. Treat this as unbuilt.

---

## 3. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 15.5 |
| UI | React | 19 |
| Styling | Tailwind CSS | v4 |
| Auth / DB / Storage | Firebase Auth, Firestore (+ KNN vector search), Storage | Firebase 12 |
| Backend | Firebase Cloud Functions (TypeScript) + Next.js API routes | Functions v2 |
| AI | Gemini API (`@google/generative-ai`) | ^0.24 |
| Graph analysis | Google Cirq (planned; KNN fallback today) | — |
| Graph visualisation | D3.js | v7 |
| Payments | Stripe | ^22 (functions) |
| Analytics | Firebase Analytics (client) + GA4 Measurement Protocol (server) | — |
| Hosting | Cloud Run (containerised Next.js), GitHub Actions deploy | — |

**Rule:** if a Google Cloud product covers the use case, use it. Don't introduce third-party alternatives for what Firebase/GCP already handles.

---

## 4. Setup: Your Development Environment

### Prerequisites

- **Node.js v20+** (`node -v`) — use [nvm](https://github.com/nvm-sh/nvm) to manage versions
- **npm v10+** (`npm -v`)
- **Git** (`git --version`)
- **Firebase CLI** — `npm install -g firebase-tools` (for the emulator suite)

### Clone and install

```bash
git clone https://github.com/astrayama/yggdrasil.git
cd yggdrasil
npm install
cd functions && npm install && cd ..   # functions is a separate package
```

### Environment variables

There is no committed `.env.local`. Start from the template (it already has the **public** Firebase client config; secrets are blank) and ask Isa for the secret values:

```bash
cp .env.production.example .env.local
```

**Never commit `.env.local` or `.env.production`.** Both are gitignored. Only the `*.example` templates are tracked. If you ever commit a real secret, tell Isa immediately so keys can be rotated.

> Note: the **public** Firebase web config is committed as in-code defaults in `lib/firebase/client.ts` (env vars override it). That's deliberate — it's public by design and it keeps clean-checkout builds (CI, Cloud Build) from crashing during prerender. It does **not** change the rule above for secrets.

Variables you'll set locally (see `.env.production.example` for the full list):

| Variable | For | In browser? |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase client config (7 vars) | Yes — safe, restricted by rules |
| `FIREBASE_ADMIN_PROJECT_ID` / `_CLIENT_EMAIL` / `_PRIVATE_KEY` | Admin SDK (server only) | No |
| `GEMINI_API_KEY` | Gemini (server only) | No |
| `GEMINI_MODEL_DEFAULT` / `_PRO` / `_EMBEDDING` | Model selection | No |
| `CIRQ_ENABLED` | Toggle Cirq path (KNN fallback otherwise) | No |
| `STRIPE_SECRET_KEY` / `_WEBHOOK_SECRET` / `_PUBLISHABLE_KEY` | Stripe | secret keys No; publishable Yes |
| `STRIPE_PRICE_ID_PRO` / `_ANNUAL` / `_LIFETIME` | Stripe price IDs | No |
| `GA4_MEASUREMENT_ID` / `GA4_API_SECRET` | Server-side analytics | No |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally | Yes |

> Anything prefixed `NEXT_PUBLIC_` is bundled into client JS and is **publicly visible**. Never put a secret behind a `NEXT_PUBLIC_` name.

**Cloud Functions have their own env** (`functions/.env.production.example`): `APP_URL`, the Stripe price IDs and secrets, etc. In production these come from **GCP Secret Manager**, not any file.

### Run it

```bash
npm run dev         # dev server, http://localhost:3000 (Turbopack)
npm run build       # production build — run before every PR
npm run start       # serve the production build
npm run lint        # ESLint
npm run type-check  # tsc --noEmit — run before every PR
npm test            # Jest
```

### (Optional) Firebase Emulator Suite

For testing rules/functions without touching prod data:

```bash
firebase login
firebase use yggdrasil-497923
firebase emulators:start   # UI at http://localhost:4000
```

Data doesn't persist between runs unless you pass `--export-on-exit` / `--import`. Ask Isa for a seed dataset if you need one.

---

## 5. Codebase Structure

This reflects the repo as it actually is today.

```
yggdrasil/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # login, signup (public)
│   ├── (dashboard)/                  # protected — layout.tsx guards on useAuth
│   │   ├── layout.tsx                # redirects to /login if no user; wraps SubscriptionProvider
│   │   ├── journal/                  # composer + entry detail ([entryId])
│   │   ├── entries/                  # list + search
│   │   ├── roots/                    # Living Tree page (roots + journeys + branches)
│   │   ├── insights/                 # insights dashboard
│   │   ├── settings/                 # framework toggles + billing
│   │   └── pricing/                  # plan selection / checkout entry
│   ├── admin/
│   │   ├── login/                    # admin sign-in → mints __session cookie (PUBLIC)
│   │   └── (protected)/              # gated by session cookie + admin claim
│   │       ├── layout.tsx            # verifies __session + decoded.admin
│   │       └── dashboard/            # the ops dashboard
│   ├── api/                          # Next.js API routes (server-side)
│   │   ├── auth/session/             # POST/DELETE admin session cookie
│   │   ├── reflect/                  # PUBLIC homepage demo (rate-limited, no auth)
│   │   ├── subscribe/                # PUBLIC email lead capture
│   │   ├── knowledge-graph/          # auth'd graph builder (Bearer ID token)
│   │   ├── backfill-denormalize/     # dev-only migration
│   │   └── health/
│   ├── layout.tsx                    # root layout (wraps AuthProvider)
│   └── page.tsx                      # marketing homepage
│
├── components/
│   ├── auth/                         # AuthForm
│   ├── billing/                      # FeatureGate, PlanCard, UpgradeCallout
│   ├── entries/                      # EntryList, SearchBar
│   ├── insights/                     # KnowledgeGraph, ClusterMap, MoodCharts, StreakCalendar,
│   │                                 #   EmotionalPatterns, InsightCard, FamiliarPatternToast
│   ├── journal/                      # Composer, MoodSliders, EntryTypeSelector, VoiceRecorder, ThinkingIndicator
│   ├── roots/                        # RootCard, BranchList, JourneyTimeline, CreateRootDialog,
│   │                                 #   SuggestionBanner, LinkRootPicker (Living Tree UI)
│   └── marketing/                    # homepage: Home, ComposerDemo, GraphDemo, canvases, PlanCard, etc.
│
├── context/                          # AuthContext, SubscriptionContext (React providers)
├── hooks/                            # useAuth, useSubscription, useFirestore
│                                     #   (note: there is NO useJournal — entries go through lib/entries.ts)
├── lib/
│   ├── analytics/client.ts           # client-side Firebase Analytics event helpers
│   ├── analytics/server.ts           # server-side analytics helper
│   ├── auth.ts                       # sign-in/out wrappers + friendly error messages
│   ├── entries.ts                    # createEntry / updateEntry / deleteEntry (client Firestore)
│   ├── roots.ts                      # Living Tree client data layer (roots, branches, rings, linking)
│   ├── rootsLogic.ts                 # pure helpers (week math, status cycling) — unit tested
│   ├── clustering.ts                 # K-Means (client cluster map)
│   ├── knowledgeGraph.ts             # buildKnowledgeGraph (used by the API route)
│   ├── moodLabel.ts                  # polarity×intensity → "How We Feel" label
│   ├── voiceNotes.ts                 # calls the transcribeAudio function
│   ├── firebase/{client,admin,converters}.ts
│   ├── gemini/client.ts
│   ├── vertex/client.ts              # Vertex client (migration target; mostly unused)
│   └── marketing/demoGuard.ts        # abuse guards for public endpoints
│
├── types/                            # journal, insights, goals, subscription, user
│
├── functions/                        # Cloud Functions (SEPARATE TypeScript package)
│   └── src/
│       ├── index.ts                  # all exports
│       ├── gemini/analyzeEntry.ts    # 2-phase analysis + embedding + edges + clusters
│       ├── gemini/transcribeAudio.ts # voice-note transcription
│       ├── gemini/computeConnections.ts, computeClusters.ts
│       ├── insights/hiddenConnections.ts
│       ├── roots/                    # onRootWrite (embedding + free cap), suggestRootLinks
│       │                             #   (entry↔root matching, hooked into analyzeEntry),
│       │                             #   generateBranchActions (Pro-only), scoring.ts (pure)
│       ├── yggi/chat.ts
│       ├── reports/weeklyReport.ts   # STUB
│       ├── auth/onUserCreate.ts      # seeds users/{uid} on signup
│       ├── admin/backfillEmbeddings.ts  # admin-claim gated HTTP fn
│       ├── stripe/                   # createCheckout, billingPortal, webhook, lifetimeUpgrade, shared, store
│       └── lib/                      # gemini.ts, analytics.ts (GA4 server), vectorSearch.ts
│
├── scripts/set-admin-claim.mjs       # grant/revoke the admin custom claim
├── docs/                             # specs, this guide, analysis schema, brand
├── Dockerfile, firebase.json, firestore.rules, firestore.indexes.json, storage.rules
└── .github/workflows/                # ci.yml (PR checks), deploy.yml (Cloud Run)
```

### Path alias

`@/*` resolves to the project root. Use it everywhere — never relative `../../` imports.

```ts
import { logEntryCreated } from '@/lib/analytics/client';
import { useAuth } from '@/hooks/useAuth';
import type { JournalEntry } from '@/types/journal';
```

---

## 6. Architecture Patterns You Need to Know

### Firebase: client SDK vs. Admin SDK

The most important distinction in the codebase. Two separate SDKs, not interchangeable.

| | Client SDK | Admin SDK |
|---|---|---|
| Init | `lib/firebase/client.ts` | `lib/firebase/admin.ts` |
| Used in | components, hooks, client code | API routes, Cloud Functions |
| Security rules | Enforced | **Bypassed entirely** |
| Package | `firebase` | `firebase-admin` |

`adminDb`/`adminAuth` can read/write anything and skip all rules — only use them server-side, and always check `request.auth` / verify a token first. Importing `firebase-admin` into a client component breaks the build.

### Next.js Server vs. Client Components

App Router defaults to **Server Components**. Add `'use client'` only when you need hooks, event handlers, browser APIs, or context. Keep `'use client'` as deep in the tree as possible — don't mark a whole page client just for one button.

### All AI calls go through the server

**Never call Gemini from the browser** — the key would be in the bundle. Journal analysis runs in the `analyzeEntry` Cloud Function (triggered by the Firestore write from `lib/entries.ts`). Callable functions (`yggiChat`, `transcribeAudio`) validate `request.auth` and check `userId === auth.uid`.

The one public AI surface is `POST /api/reflect` (the homepage demo). It is deliberately unauthenticated but **heavily guarded** — see abuse guards below. Don't copy its "no auth" shape into logged-in features.

### The entry analysis pipeline

A journal save writes `users/{uid}/entries/{id}` with `analysisStatus: 'pending'` (via `lib/entries.ts`). That write triggers `analyzeEntry`:

1. **Phase 1 — depth score** (1–11) decides how deep Phase 2 goes.
2. **Phase 2 — one Gemini call** returns the 13-field analysis JSON (see [`docs/analysis-schema.md`](analysis-schema.md)), plus an embedding.
3. The function computes similarity **edges** and **clusters**, then commits: it writes the analysis to the `analysis` subcollection **and denormalizes a copy onto the entry doc** (`entry.analysis`) so the knowledge-graph API doesn't have to fan out. Status flips to `complete`.

If you change the analysis shape, update **both** the subcollection write and the denormalized copy, plus `types/journal.ts` and `docs/analysis-schema.md`.

### AI model defaults

Read models from env/constants — **never hardcode a model string**.

| Setting | Model (current code default) |
|---|---|
| Default text | `gemini-3.5-flash` (`DEFAULT_MODEL` in `functions/src/lib/gemini.ts`) |
| Pro | `gemini-3.5-pro` — only with a documented reason (costs more) |
| Embeddings | `gemini-embedding-001`, truncated to **768 dims** (MRL) to match the Firestore vector index |

> ⚠️ **Known drift:** `deploy.yml` still injects `GEMINI_MODEL_DEFAULT=gemini-2.0-flash` for the Next.js service, which overrides the code default in production. The functions runtime uses the 3.5 default. If you touch model config, confirm the intended prod model with Isa rather than assuming.

### Subscriptions & feature gating

- Subscription state lives at `subscriptions/{uid}`, **written only by the Stripe webhook** (`functions/src/stripe/stripeWebhook.ts`), read client-side via `SubscriptionContext` → `useSubscription()`.
- Gate Pro-only UI with `<FeatureGate>` (`components/billing/`). `entitlement === 'PRO'` means active paid access.
- The free **insight gate** is enforced server-side in `analyzeEntry` (`FREE_INSIGHT_LIMIT = 5` → sets `insightGated` and persists a trimmed analysis). There is **no** `check-trial-status` function — don't look for one.
- The webhook resolves users by `stripeCustomerId`, so that field is **server-controlled**; Firestore rules block clients from writing it (and `tier`, `entryCount`, `analyticsClientId`).

### Abuse guards for public endpoints

`/api/reflect` and `/api/subscribe` are unauthenticated, so they use `lib/marketing/demoGuard.ts`: Firestore-backed sliding windows per **device cookie**, per **IP**, and a **global daily** circuit breaker, with an in-memory fast path. Notes if you work here:
- `getClientIp` takes the **last** `x-forwarded-for` hop (the infra-appended one) — the first hops are client-spoofable.
- `isCrossSite` rejects cross-origin browser calls.
- Guards **fail open** to the in-memory limiter if Firestore is down (availability over strictness for a demo).
- Entry **text is never stored** — only metadata (status, word count, hashed device).

### Prompt-injection hygiene

Journal content and user messages are **untrusted**. When you build a new prompt that includes user text, wrap it in delimiters and tell the model to treat the contents as data, not instructions — follow the pattern already in `analyzeEntry.ts`, `yggi/chat.ts`, and `/api/reflect`.

---

## 7. Coding Standards

- **TypeScript only**, `strict: true`. Use the domain types in `types/` — don't redefine them inline. If you genuinely need `any` (e.g. cross-platform Firestore `VectorValue`), add a comment saying why.
- **Complete implementations** — no stubs, TODOs, or "implement later". Ship error handling, loading, and empty states. If you hit something genuinely uncertain, stop and ask.
- **Firebase v9 modular imports only** (`import { doc, getDoc } from 'firebase/firestore'`).
- **async/await** with `try/catch`; don't mix `.then()` chains with `await` in one function.
- **Tailwind v4** for styling — no CSS modules, styled-components, or inline `style`. Check `components/` for an existing pattern before inventing one. The brand green is `bg-primary` / `text-primary` (`#1A3C2E`); the app also uses semantic tokens like `bg-surface`, `text-foreground`, `text-gold`, `text-sage` — reuse them.

---

## 8. Analytics Instrumentation

Analytics is split in two:

- **Client events** — `lib/analytics/client.ts` (Firebase Analytics). Import the typed helpers; never call `logEvent` directly or invent event names. The helper guards `typeof window` for you.
- **Server events** — `functions/src/lib/analytics.ts` sends via the **GA4 Measurement Protocol** (needs `GA4_MEASUREMENT_ID` + `GA4_API_SECRET`). Used for things that happen in Cloud Functions (`insight_generated`, `hidden_connections_computation`, subscription events, weekly report).

```ts
import { logEntryCreated, logYggiChatOpened } from '@/lib/analytics/client';

logEntryCreated({ entry_type, has_mood, tag_count, word_count });
```

The full event catalogue (names + required props) lives in §6 of [`docs/yggdrasil-product-spec-v4.md`](yggdrasil-product-spec-v4.md). **Reality check:** Living Tree events now fire (`goal_created`, `goal_completed`, `branch_actions_generated`, `root_entry_linked`, `branch_completed`, `branch_week_reset`, `living_tree_viewed`, …), but events for still-unbuilt features (onboarding, Yggi) are defined and idle. If your task builds one of those features, wire its events as part of the task.

---

## 9. Firestore Data Model

```
users/{userId}                        profile; server-controlled: stripeCustomerId, tier,
    │                                  entryCount, analyticsClientId (clients can't write these)
    ├── entries/{entryId}              JournalEntry (+ denormalized `analysis`, `embedding` vector)
    │     └── analysis/{analysisId}    EntryAnalysis — client READ only, server WRITE
    ├── roots/{rootId}                 Root (value|goal; branches, rings, fruit arrays;
    │     │                            server-set: gated, embedding — clients can't write those)
    │     └── events/{eventId}         JourneyEvent timeline — immutable (client create/delete, no update)
    ├── rootSuggestions/{rootId_entryId}  AI entry↔root link suggestions — server-created;
    │                                  clients may only flip status/resolvedAt
    ├── achievements/{achievementId}   Achievement
    ├── connections/{connectionId}     similarity edges — client READ only, server WRITE
    ├── weeklyReports/{reportId}       client READ only, server WRITE
    ├── settings/{settingId}           user settings (e.g. enabledFrameworks) — owner read/write
    └── graphMetadata/clusters         precomputed clusters — server WRITE

subscriptions/{userId}                 Stripe state — client READ only, server WRITE
feedback/{feedbackId}                  owner create/read/update/delete
processedEvents/{eventId}              Stripe webhook idempotency — server only
adminLogs/{logId}                      server only, no client access

# Server-only ops/marketing collections (no client access via rules):
leads/{hash}                           homepage email captures
demoReflections/{id}                   demo activity metadata (no entry text)
demoCounters/{collection-YYYY-MM-DD}   global daily circuit-breaker counts
demoRateLimits/{key}                   per-device/per-IP sliding windows
opsLogs/{id}                           entry-analysis run logs (shown on admin dashboard)
```

Rules summary: users read/write only their own `users/{uid}/**` (minus the protected fields above); `connections`, `weeklyReports`, `subscriptions`, and the `analysis` subcollection are client-read / server-write; ops/marketing collections are entirely server-side (the Admin SDK bypasses rules). After editing `firestore.rules`, test against the emulator before it ships.

### Key types (all in `types/`)

- `types/journal.ts` — `JournalEntry`, `EntryAnalysis` (6 top-level fields + nested `interpretation` with 7 sub-fields; framework/depth fields gated by `depthScore >= 3`), `EntryType`, `Mood`.
- `types/subscription.ts` — `SubscriptionTier` (`'FREE' | 'PRO'`), `SubscriptionStatus`, `BillingPeriod` (`'monthly' | 'yearly' | 'lifetime'`).
- `types/user.ts` — `UserProfile` (`tier`, `entitlement`, `billingPeriod`, `streakDays`, …).
- `types/goals.ts` — `Root` (+ `BranchAction`, `Ring`, `RootFruit`), `JourneyEvent`, `RootLinkSuggestion`, `Achievement`. (The old standalone `Goal`/`Journey` types are gone — journeys are nested inside Roots.)
- `types/insights.ts` — connection/cluster/report shapes.

---

## 10. Admin Ops Dashboard

The internal dashboard at **`/admin/dashboard`** shows email leads, homepage demo activity, and entry-analysis `opsLogs`. It's gated two ways (defense in depth):

1. A `__session` cookie (the only cookie Firebase Hosting/Cloud Run forwards), minted by `POST /api/auth/session`.
2. An `admin` **custom claim** on the Firebase user, re-verified by the `(protected)` layout on every request.

### Getting access (Isa or a delegated admin runs this)

```bash
# Grant admin to a user (by email or uid). Needs Firebase Admin creds in env
# (same vars as .env — or `gcloud auth application-default login`).
node scripts/set-admin-claim.mjs someone@example.com
# revoke:
node scripts/set-admin-claim.mjs someone@example.com --revoke
```

The user must **sign out and back in** for the claim to take effect, then sign in at **`/admin/login`** (email/password or Google). Signing in there exchanges a fresh ID token for the session cookie; non-admins get a clear "not authorized" message and are signed back out. "Sign out" on the dashboard clears the cookie.

Do **not** grant yourself admin unless Isa asks you to — it exposes other users' email leads.

---

## 11. Working on a Task (Linear + SOPs)

### Where tasks live

Tasks are tracked in **Linear**. Isa owns architecture and integration decisions; collaborators pick up clearly-scoped, self-contained issues.

> **Access:** ask Isa for a Linear invite to the Yggdrasil workspace (link in the [Access Checklist](#18-resources--access-checklist)). Some historical tickets referenced GitHub Issues and ticket IDs like `YGG-97` / `LAU-AI-01`; Linear is the source of truth going forward. The legacy backlog is archived in [`docs/ticket-backlog-v1.md`](ticket-backlog-v1.md) for reference only.

### Ticket lifecycle (SOP)

1. **Pick up** an issue from your assigned Linear cycle (or one Isa assigns). Move it to **In Progress** and assign it to yourself.
2. **Branch** off the default branch using the issue's Linear ID in the branch name (Linear auto-links branches/PRs that include the ID, e.g. `feat/ygg-123-hidden-connections-ui`).
3. **Build** within scope. Read the full description first; check `types/`, existing components, and the relevant analytics events before coding.
4. **Open a PR** (see §13), link the Linear issue, and move the ticket to **In Review**.
5. **Address review**, get approval, merge. Linear moves the issue to **Done** on merge when linked.

### Before you start a ticket

- Read the description fully.
- Check `types/` for the data shapes; check `components/` for existing UI patterns; check `lib/analytics/client.ts` for the events to fire.
- If anything is unclear — **ask in Discord before starting**, not after.

### Scope discipline

Tasks are scoped intentionally. Don't reach outside the boundaries. If you spot something adjacent that needs fixing, **flag it** (a comment on the Linear issue or a note in your PR, or open a new Linear ticket) — don't fix it silently. Isa handles integration between your work and the rest of the system.

---

## 12. Communication (Discord)

Day-to-day coordination happens in the project **Discord server** (ask Isa for the invite — see the [Access Checklist](#18-resources--access-checklist)).

**Conventions:**
- Keep it **async** — post a clear, complete question in one message rather than a trickle of follow-ups. You don't need a synchronous call to proceed.
- Use the **feature/task channel** for work discussion so it's searchable; DM Isa (`@isa23_`) only for private/blocking issues.
- Share your PR link in the relevant channel when you open it and when it's ready for review.
- Post a short update when you pick up, finish, or get blocked on a ticket so the board and chat stay in sync.
- **Never paste secrets, real user data, or `.env` contents** into Discord (or anywhere). If a secret leaks, say so immediately so it can be rotated.

---

## 13. Git Workflow & Pull Requests

### Branches

Branch off the default branch. Include the Linear issue ID so it auto-links.

| Type | Pattern | Example |
|---|---|---|
| Feature | `feat/<id>-<desc>` | `feat/ygg-123-hidden-connections-ui` |
| Fix | `fix/<id>-<desc>` | `fix/ygg-140-auth-redirect-loop` |
| Docs | `docs/<desc>` | `docs/update-onboarding` |
| Chore | `chore/<desc>` | `chore/upgrade-firebase-sdk` |

Lowercase, hyphens, no spaces. (Some contributors work in git **worktrees** under `.claude/worktrees/` — that's fine; just branch and PR as normal.)

### Commits — [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

```
<type>(<scope>): <imperative summary under 72 chars>

[optional body — explain why, not what]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.

### PR checklist

Before opening a PR, run the same gates CI runs:

```bash
npm run type-check    # zero errors
npm run lint          # zero errors
npm test              # green
npm run build         # production build succeeds
# if you touched functions/:
cd functions && npm run build && cd ..
```

CI (`.github/workflows/ci.yml`) runs type-check, lint, tests, and a functions build on every PR to `main`/`develop`.

Your PR description should cover: what changed and why (link the Linear issue), any new env vars or secrets (so Isa adds them to Secret Manager), anything to wire up after merge (e.g. "new Cloud Function needs deploying"), and screenshots/recordings for UI changes.

**PRs require approval — tag Isa. Do not merge your own PR.**

---

## 14. Testing

| Tool | Role |
|---|---|
| Jest (`jest.config.ts`) | Runner |
| @testing-library/react + jest-dom | Component tests + DOM matchers |
| Firebase Emulator Suite | Local Firestore/Auth/Functions for integration tests |

- **Co-locate** tests as `*.test.ts(x)` next to the code (e.g. `components/insights/emotionTimeline.test.ts`).
- **Always test** pure utilities in `lib/` and any calculation/scoring logic (mood label derivation, streak counting, cosine similarity, score thresholds). Test components with meaningful conditional rendering or interaction.
- **Test user-visible behaviour, not implementation details.**
- **Mock Firebase** in unit/component tests (it uses browser APIs jsdom lacks). Use the emulator for tests that need real Firestore/Auth behaviour.
- **Cloud Functions** have their own package under `functions/` — don't test them from the root Jest config.

No hard coverage target for the XPRIZE build (optimise for shipping), but new `lib/` utilities and calculation logic must have tests.

```bash
npm test                 # once
npm test -- --watch      # watch mode
npm test -- --coverage   # coverage
npm test -- emotionTimeline   # by pattern
```

---

## 15. Design System

The visual identity is established. **Do not redesign anything** — match the existing aesthetic.

| Element | Value |
|---|---|
| Primary colour | `#1A3C2E` forest green (`bg-primary` / `text-primary`) |
| Palette | Earthy tones, tree/roots metaphors, sacred geometry; semantic tokens `surface`, `foreground`, `gold`, `sage` |
| Voice | Warm, elegant, gentle |
| Tone | Spiritually intelligent — not clinical, not a mood tracker |

**Don't:** introduce new colour schemes, use clinical/dashboard patterns, pill-everything rounding, health-app language, or bright non-forest primaries.

**Responsive, mobile-first** — the primary persona journals late at night on her phone. Layouts must work at 375px and scale up. See `docs/brand.md` for more.

---

## 16. Deployment

**Only Isa deploys.** Don't deploy Cloud Run, deploy Cloud Functions, or push to the Firebase project unless explicitly asked.

Pipeline: PR merged to `main` → GitHub Actions (`deploy.yml`) builds the Docker image and deploys to Cloud Run with secrets from **GCP Secret Manager**; Cloud Functions deploy via `firebase deploy --only functions`. Production secrets (`FIREBASE_ADMIN_PRIVATE_KEY`, `GEMINI_API_KEY`, Stripe keys, `GA4_API_SECRET`) live in Secret Manager, never in a committed file. **When you add a new secret or env var, call it out in your PR** so Isa adds it before deploying.

If you want to be involved in the deployment side, tell Isa.

---

## 17. Things You Must Not Do

| Don't | Why |
|---|---|
| Call Gemini from client-side code | The API key would be exposed in the bundle |
| Import `firebase-admin` in a component/client code | Admin bypasses all Firestore rules |
| Hardcode a model string / bump to Pro without a documented reason | Cost control; read from env/constants |
| Let clients write `stripeCustomerId`, `tier`, or other server-controlled fields | Enables billing/entitlement hijacking |
| Return raw error stacks to clients | Info disclosure — log server-side, return a generic message |
| Store demo entry text, or log user journal content anywhere public | Privacy is core to the product |
| Create `.js` app files | TypeScript everywhere (functions is TS too) |
| Copy code from the Lovable prototype | Different stack/patterns — subtle bugs |
| Put secrets in `NEXT_PUBLIC_` vars, or commit `.env.local` / `.env.production` | Publicly visible / secret leak → rotate keys |
| Grant yourself the `admin` claim | Exposes other users' lead data |
| Merge your own PR | PRs require approval |
| Add a non-Google AI provider | Gemini only — XPRIZE requirement |
| Invent analytics event names | Use the typed helpers |
| Touch Stripe keys/products/account | Real customers and active subscriptions |
| Add a substantial npm dependency without asking | Bundle size + licence |
| Fix something outside your task scope silently | Flag it; Isa handles integration |

---

## 18. Resources & Access Checklist

**Get these before your first ticket** (ask Isa for invites where noted):

- [ ] **GitHub** — write access to [`astrayama/yggdrasil`](https://github.com/astrayama/yggdrasil)
- [ ] **Linear** — invite to the Yggdrasil workspace (task board) · *ask Isa for the link*
- [ ] **Discord** — server invite (day-to-day comms) · *ask Isa for the link*
- [ ] **Firebase** — reader access to project `yggdrasil-497923` (only if your task needs it) · *ask Isa*
- [ ] **Env secrets** — the non-public values for your `.env.local` · *ask Isa; never share these in chat*

### Project

| | |
|---|---|
| GitHub repo | https://github.com/astrayama/yggdrasil |
| Task board | Linear (ask Isa for the workspace link) |
| Comms | Discord server (ask Isa) · DM `@isa23_` for private/blocking issues |
| Firebase project | `yggdrasil-497923` |
| Production URL | https://yggdrasil-168739896450.us-central1.run.app/ |

### Docs in this repo

| File | Contents |
|---|---|
| [`docs/collaborator-onboarding.md`](collaborator-onboarding.md) | This guide |
| [`docs/yggdrasil-product-spec-v4.md`](yggdrasil-product-spec-v4.md) | Product spec + §13 implementation status + analytics catalogue |
| [`docs/yggdrasil-prd-v3.md`](yggdrasil-prd-v3.md) | PRD, objectives, success metrics |
| [`docs/analysis-schema.md`](analysis-schema.md) | Canonical `EntryAnalysis` schema |
| [`docs/brand.md`](brand.md) | Brand + design detail |
| [`docs/ticket-backlog-v1.md`](ticket-backlog-v1.md) | Legacy backlog (archived reference) |

### External docs

Next.js App Router · Firebase modular SDK · Firestore (+ vector search) · Cloud Functions v2 · Emulator Suite · Gemini API (`@google/generative-ai`) · Stripe Node SDK · Tailwind v4 · Conventional Commits · React Testing Library — all one search away; links in the framework docs.

---

*Yggdrasil · Build with Gemini XPRIZE · Education & Human Potential · August 17, 2026*
