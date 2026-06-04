# Yggdrasil — Collaborator Onboarding Guide

**Last updated: June 2026**
**Deadline: August 17, 2026 — Build with Gemini XPRIZE**

---

## Table of Contents

1. [Welcome & Project Context](#1-welcome--project-context)
2. [The App](#2-the-app)
3. [Tech Stack](#3-tech-stack)
4. [Setup: Your Development Environment](#4-setup-your-development-environment)
5. [Codebase Structure](#5-codebase-structure)
6. [Architecture Patterns You Need to Know](#6-architecture-patterns-you-need-to-know)
7. [Coding Standards](#7-coding-standards)
8. [Analytics Instrumentation](#8-analytics-instrumentation)
9. [Firestore Data Model](#9-firestore-data-model)
10. [Working on a Task](#10-working-on-a-task)
11. [Git Workflow & Pull Requests](#11-git-workflow--pull-requests)
12. [Testing](#12-testing)
13. [Design System](#13-design-system)
14. [Deployment](#14-deployment)
15. [Things You Must Not Do](#15-things-you-must-not-do)
16. [Resources](#16-resources)

---

## 1. Welcome & Project Context

Yggdrasil is an AI-powered semantic journaling web app. Users write journal entries; the app automatically extracts themes, emotions, people, and patterns from each one, then surfaces insights, a visual knowledge graph, and non-obvious connections across their entire journal history.

We are rebuilding it from scratch on a Google-native stack and submitting it to the **Build with Gemini XPRIZE hackathon** (Education & Human Potential category, $2M prize pool). The submission deadline is **August 17, 2026**. Everything we do is scoped to that date.

**There is an existing prototype** at `github.com/lovable-isa23/yggdrasil-journal` (React + Supabase). The live prototype is at [https://yggdrasil-journal.lovable.app](https://yggdrasil-journal.lovable.app/). It is **reference material only** — do not copy code from it. It tells you what was built; you are building the new version. But if you want to test out the prototype, feel free to use it. [Sign In] -> [Sign Up] -> [Home] to bypass beta paywall.

### Why this matters for how you work

XPRIZE judges on three criteria: **Business Viability**, **AI-Native Operations**, and **Category Impact**. Every task you receive exists in service of at least one of those. When in doubt about scope, ask yourself: does this advance the submission? If not, flag it rather than building it.

---

## 2. The App

The app has five main tabs and a floating AI companion:

| Tab | What it does |
|---|---|
| **Journal** | Rich text composer. Users write entries with mood, tags, and entry type. On save, a single Gemini call runs a two-phase analysis in the background, returning 13 structured fields. |
| **Entries** | Entry list with full-text and semantic search (Firestore KNN), tag browser. |
| **Roots** | Goals, Journeys, gamification. A Living Tree grows as the user journals consistently. Achievements unlock at milestones. |
| **Insights** | 6-section dashboard: streak calendar, mood charts, semantic cluster map, emotional patterns, Hidden Connections, and Knowledge Graph. |
| **Settings** | Analytical framework toggles (e.g. Jungian archetypes), data export. |
| **Yggi Chat** | Floating AI companion (bottom-right FAB). Opens a right-side drawer. Full RAG access to user's journal history via Firestore KNN. Warm, reflective — not a chatbot. |

### Subscription tiers

| Feature | Free | Pro |
|---|---|---|
| Journal entries | Unlimited | Unlimited |
| AI extraction (themes, emotions, etc.) | ✅ | ✅ |
| Entry insights | 5 trial entries, then paywalled | Unlimited |
| Journeys | 3 | Unlimited |
| Goals | 5 | Unlimited |
| Knowledge graph | Basic | Full |
| Yggi Chat | ❌ | ✅ |
| Hidden Connections | ❌ | ✅ |
| Weekly digest | ❌ | ✅ |
| Data export | ❌ | ✅ |

After hitting any per-feature limit, Free users are shown `/pricing`. Pro plans: $4.99/month, $44.99/year, $149 lifetime.

### Hidden Connections — the signature feature

This is the primary XPRIZE technical differentiator. It surfaces non-obvious relationships between journal entries using **Google Cirq** (quantum-inspired graph analysis).

**Pipeline:**
1. On entry save, Gemini generates an embedding stored as a Firestore vector field
2. Nightly batch: Cirq performs quantum-inspired graph analysis on the embedding space to find non-obvious connection pairs
3. Scored pairs are rendered via D3.js in the Insights dashboard

**Fallback:** If Cirq fails or is unavailable, the system silently falls back to Firestore KNN cosine similarity. The UI is identical either way — users never see which path ran. Whichever path runs is logged via the `hidden_connections_computation` Analytics event (`path: 'cirq' | 'fallback_knn'`) and to the admin operations dashboard.

---

## 3. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router, TypeScript) | 15.5 |
| UI | React | 19 |
| Styling | Tailwind CSS | v4 |
| Auth | Firebase Auth (email/password + Google Sign-In) | Firebase 12 |
| Database | Firestore (incl. KNN vector search) | Firebase 12 |
| File storage | Firebase Storage | Firebase 12 |
| Backend | Firebase Cloud Functions (TypeScript) | v2 |
| AI | Gemini API (`@google/generative-ai`) | ^0.24 |
| Graph analysis | Google Cirq (via GCP — uses Firebase credentials) | — |
| Graph visualisation | D3.js | v7 |
| Payments | Stripe | ^22 |
| Hosting | Cloud Run (containerised Next.js) | — |
| Analytics | Firebase Analytics | Firebase 12 |

**Rule:** if a Google Cloud product covers the use case, use it. Do not introduce third-party alternatives for things Firebase/GCP already handles.

---

## 4. Setup: Your Development Environment

### Prerequisites

Make sure you have these installed before cloning:

- **Node.js** v20 or later — check with `node -v`. Use [nvm](https://github.com/nvm-sh/nvm) if you need to manage versions.
- **npm** v10 or later — check with `npm -v`
- **Git** — check with `git --version`
- **Firebase CLI** — `npm install -g firebase-tools`; used for the emulator suite

### Clone and install

```bash
git clone https://github.com/astrayama/yggdrasil.git
cd yggdrasil
npm install
```

### Environment variables

Copy the example file and fill in the values Isa provides to you directly:

```bash
cp .env.local.example .env.local
```

**Never commit `.env.local`.** It is in `.gitignore`. The file contains secrets that must never reach version control.

The variables you need locally:

| Variable | What it's for | Exposed to browser? |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase client config | Yes (safe — restricted by Firebase) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase client config | Yes |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase client config | Yes |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase client config | Yes |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase client config | Yes |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase client config | Yes |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Firebase Analytics | Yes |
| `FIREBASE_ADMIN_PROJECT_ID` | Firebase Admin — server-side only | No |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Firebase Admin service account | No |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Firebase Admin private key — keep this secret | No |
| `GEMINI_API_KEY` | Gemini API — server-side only | No |
| `GEMINI_MODEL_DEFAULT` | `gemini-2.0-flash` — do not change | No |
| `GEMINI_MODEL_PRO` | `gemini-2.0-pro` — used only where explicitly needed | No |
| `GEMINI_MODEL_EMBEDDING` | `gemini-embedding-exp` — for embeddings | No |
| `CIRQ_ENABLED` | `true` to enable Cirq; falls back to Firestore KNN if `false` or on failure | No |
| `STRIPE_SECRET_KEY` | Stripe API — server-side only | No |
| `STRIPE_PUBLISHABLE_KEY` | Stripe — safe for browser | Yes |
| `STRIPE_WEBHOOK_SECRET` | For verifying Stripe webhook signatures | No |
| `STRIPE_PRICE_ID_PRO` | Stripe price ID for Pro monthly | No |
| `STRIPE_PRICE_ID_ANNUAL` | Stripe price ID for Pro annual | No |
| `STRIPE_PRICE_ID_LIFETIME` | Stripe price ID for Lifetime one-time payment | No |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally | Yes |

> **Important:** Variables prefixed with `NEXT_PUBLIC_` are bundled into the client-side JavaScript bundle and are **publicly visible** in the browser. Never put secrets (API keys, private keys, Stripe secret keys) in a `NEXT_PUBLIC_` variable.

### Run the development server

```bash
npm run dev        # start dev server on http://localhost:3000 (uses Turbopack)
npm run build      # production build
npm run start      # start production build locally
npm run lint       # ESLint
npm run type-check # TypeScript check with no output — run this before every PR
```

### (Optional) Firebase Emulator Suite

For testing Firestore rules and Cloud Functions locally without touching production data:

```bash
# First-time setup
firebase login
firebase use yggdrasil-497923

# Start emulators
firebase emulators:start
```

The emulator UI runs at `http://localhost:4000`. Data does not persist between runs unless you pass `--export-on-exit` and `--import`. Ask Isa if you need a seed dataset.

---

## 5. Codebase Structure

```
yggdrasil/
├── app/                            # Next.js App Router — pages, layouts, API routes
│   ├── (auth)/                     # Unauthenticated routes (no layout auth guard)
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/                # Protected routes — all gated by layout.tsx
│   │   ├── layout.tsx              # Auth guard — redirects to /login if no user
│   │   ├── journal/
│   │   ├── entries/
│   │   ├── roots/
│   │   ├── insights/
│   │   └── settings/
│   ├── admin/                      # Internal admin operations dashboard (Isa-only)
│   ├── api/                        # Next.js API routes (server-side)
│   │   ├── health/
│   │   └── stripe/                 # Stripe webhook handler
│   ├── layout.tsx                  # Root layout — wraps everything
│   ├── page.tsx                    # Landing / root redirect
│   └── globals.css
│
├── components/                     # React components
│   ├── entries/                    # Entry list, search, tag browser
│   ├── insights/                   # Charts, cluster map, Hidden Connections, Knowledge Graph
│   ├── journal/                    # Entry composer, mood sliders
│   ├── roots/                      # Goals, journeys, Living Tree, achievements
│   ├── shared/                     # Cross-feature shared components
│   ├── ui/                         # Primitive UI: buttons, inputs, modals, cards
│   └── yggi/                       # Yggi Chat FAB + drawer
│
├── hooks/                          # Custom React hooks
│   ├── useAuth.ts                  # Auth state + sign-in/out helpers
│   ├── useFirestore.ts             # Generic Firestore data access
│   └── useJournal.ts               # Journal entry state and operations
│
├── lib/                            # Service clients and shared utilities
│   ├── analytics.ts                # All Analytics event functions — typed, use these
│   ├── firebase/
│   │   ├── client.ts               # Firebase client SDK init (auth, db, storage, analytics, KNN)
│   │   └── admin.ts                # Firebase Admin SDK init — server-side only
│   ├── gemini/
│   │   └── client.ts               # Gemini API client
│   └── stripe/
│       └── client.ts               # Stripe client
│
├── types/                          # TypeScript type definitions — use these everywhere
│   ├── journal.ts                  # JournalEntry, EntryAnalysis, EntryType, Mood
│   ├── user.ts                     # UserProfile
│   ├── goals.ts                    # Goal, Journey, Achievement
│   └── insights.ts                 # Connection, InsightCluster, WeeklyReport
│
├── functions/                      # Firebase Cloud Functions (separate TypeScript project)
│   └── src/
│       ├── index.ts                # All function exports
│       ├── gemini/
│       │   └── analyzeEntry.ts     # 2-phase entry analysis (depth scoring + 13-field JSON)
│       ├── insights/
│       │   └── hiddenConnections.ts  # Cirq quantum graph + Firestore KNN fallback
│       ├── yggi/
│       │   └── chat.ts             # Yggi companion chat (RAG + Gemini)
│       ├── reports/
│       │   └── weeklyReport.ts     # Scheduled weekly AI report generation
│       └── admin/
│           └── backfillEmbeddings.ts  # Admin utility — backfill embeddings
│
├── docs/                           # Project documentation
├── public/                         # Static assets
├── Dockerfile                      # Cloud Run container definition
├── firebase.json                   # Firebase project configuration
├── firestore.rules                 # Firestore security rules
├── firestore.indexes.json          # Firestore composite indexes
├── storage.rules                   # Firebase Storage security rules
├── jest.config.ts                  # Jest configuration
├── jest.setup.ts                   # Jest setup (imports @testing-library/jest-dom)
├── tsconfig.json                   # TypeScript config
└── package.json
```

### Path alias

`@/*` resolves to the project root. Use it everywhere — never use relative `../` imports:

```ts
// ✅ correct
import { logEntryCreated } from '@/lib/analytics';
import { useAuth } from '@/hooks/useAuth';
import type { JournalEntry } from '@/types/journal';

// ❌ wrong — will break if files move
import { logEntryCreated } from '../../../lib/analytics';
```

---

## 6. Architecture Patterns You Need to Know

### Firebase: client SDK vs. Admin SDK

This is the most important distinction in the codebase. There are **two separate Firebase SDKs** and they are not interchangeable.

| | Client SDK | Admin SDK |
|---|---|---|
| Initialised in | `lib/firebase/client.ts` | `lib/firebase/admin.ts` |
| Used in | React components, hooks, client-side code | API routes (`app/api/`), Cloud Functions |
| Security rules | Enforced | Bypassed entirely |
| Package | `firebase` (v12) | `firebase-admin` |
| Auth context | Logged-in user's session | Service account with full access |

**Client SDK** (`firebase/firestore`, `firebase/auth`, etc.):
```ts
import { db } from '@/lib/firebase/client';
import { collection, getDocs } from 'firebase/firestore';
```

**Admin SDK** (`firebase-admin`) — **only in server-side code**:
```ts
import { adminDb } from '@/lib/firebase/admin';
// adminDb can write to any document — it bypasses all security rules
```

> If you import `firebase-admin` in a React component, it will throw at build time. If you use the client SDK in a Cloud Function to write to a protected path, it will fail silently due to security rules. Both are bugs you will encounter if you mix them.

### Next.js App Router: Server Components vs. Client Components

Next.js App Router defaults to **Server Components** — they run on the server during render and cannot use browser APIs, React state, or event handlers.

Add `'use client'` only when you need:
- `useState`, `useEffect`, or other React hooks
- Event handlers (`onClick`, `onChange`, etc.)
- Browser APIs (`window`, `document`, `localStorage`)
- Context that requires a provider

**Keep `'use client'` as deep in the component tree as possible.** Don't mark a whole page as a client component just because one button needs an `onClick`. Extract the interactive part into its own small component.

```tsx
// app/(dashboard)/insights/page.tsx — Server Component (default, no 'use client')
// Fetches data server-side, renders a layout

// components/insights/HiddenConnectionsGraph.tsx — Client Component
'use client'; // needs D3 (browser API) and useState for interaction
```

### All AI calls go through Cloud Functions

**Never call the Gemini API directly from the browser.** The API key would be visible to anyone who opens DevTools.

All AI functionality is gated behind Firebase Cloud Functions, which run server-side and are authenticated — only signed-in users can call them.

```ts
// ✅ Correct — call the Cloud Function from client code
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase/client';

const functions = getFunctions(app);
const analyzeEntry = httpsCallable(functions, 'analyzeEntry');
const result = await analyzeEntry({ entryId, content, userId });

// ❌ Never do this from client-side code
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // key exposed in bundle
```

Cloud Functions validate the caller's auth token automatically via `request.auth`. If `request.auth` is null, the function throws `unauthenticated` — you can see this pattern in `functions/src/gemini/analyzeEntry.ts`.

### Gemini entry analysis pipeline

Each journal entry triggers a **single Gemini API call** in `analyzeEntry.ts` — not 13 separate calls. The process is two-phase:

**Phase 1 — Depth scoring:** A lightweight Gemini call scores the entry on a 1–11 scale. This score determines how deeply Phase 2 analyses the entry (lower depth = faster, cheaper; higher depth = more psychological/spiritual analysis).

**Phase 2 — Comprehensive analysis:** One prompt returns a JSON object with 13 structured fields:

| Field | Description |
|---|---|
| `entities` | Key people, places, events, and concepts mentioned |
| `themes` | Overarching topics (up to 5) |
| `emotions` | Emotional tones with intensity scores |
| `keywords` | Significant terms |
| `summary` | 2–3 sentence summary of the entry |
| `safety_concerns` | Crisis/harm detection flags — handle with care |
| `interpretation.main_insight` | Core psychological/spiritual interpretation |
| `interpretation.questions` | 3–5 reflective questions for the user |
| `interpretation.action_items` | Concrete suggested actions |
| `interpretation.patterns_identified` | Cognitive distortions, behavioural patterns |
| `interpretation.growth_connection` | Links to the user's larger self-development journey |
| `interpretation.frameworks_applied` | Which analytical frameworks were relevant *(depth ≥ 3 only)* |
| `interpretation.depth_analysis` | Deeper psychological/spiritual themes and unconscious material *(depth ≥ 3 only)* |

**4 optional outputs** are gated by user Settings and are not part of the core 13: `chakra_tags`, `tarot_tags`, `sacred_geometry`, `archetype_tags`.

**12 analytical frameworks** (toggled in Settings, applied when depth ≥ 3): Theravada Buddhist, Freudian, Jungian, Hermetic, Advaita Vedanta, Taoist, Attachment Theory, IFS, CBT, DBT, Stoic, Gnostic.

### AI model defaults

| Variable | Model | When to use |
|---|---|---|
| `GEMINI_MODEL_DEFAULT` | `gemini-2.0-flash` | Everything — default, fast, cost-effective |
| `GEMINI_MODEL_PRO` | `gemini-2.0-pro` | Only when `flash` produces noticeably worse results and you can justify the cost |
| `GEMINI_MODEL_EMBEDDING` | `gemini-embedding-exp` | Embeddings only |

Always read the model from environment variables. Do not hardcode model strings:

```ts
// ✅
const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL_DEFAULT || 'gemini-2.0-flash',
});

// ❌
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-pro' });
```

### Auth pattern

The `useAuth` hook (`hooks/useAuth.ts`) provides auth state. The `(dashboard)` layout uses it to guard all protected routes:

```ts
const { user, loading } = useAuth();
```

- `user` — a Firebase `User` object, or `null` if signed out
- `loading` — `true` while auth state resolves on first load

**Always handle the `loading` state.** A missing check causes flicker: the user briefly sees either a redirect or protected content before Firebase resolves. Show a spinner when `loading` is `true`.

```tsx
if (loading) return <LoadingSpinner />;
if (!user) return null; // layout handles the redirect
```

### Stripe paywall

Subscription status lives in Firestore at `subscriptions/{userId}`. It is only written by the server-side Stripe webhook handler — never by client code. Feature access is gated by a `<FeatureGate>` component. If you're building a Pro-only feature, wrap it in `<FeatureGate>`.

Free tier limits are enforced per-feature by `check-trial-status` — a function that counts the user's analyzed entries, journeys, goals, etc. against their tier limits (5 entry insights, 3 journeys, 5 goals) and triggers the `/pricing` paywall when a limit is hit. This is not a whole-app redirect — each feature is gated independently. Do not add paywall redirect logic yourself.

---

## 7. Coding Standards

### TypeScript everywhere

- No `.js` files — TypeScript only, including config files where possible
- `strict: true` is set in `tsconfig.json` — no implicit `any`, no unchecked `null`/`undefined`
- Use types from `types/` for all domain objects — do not redefine them inline

```ts
// ✅ Use the defined types
import type { JournalEntry, EntryType } from '@/types/journal';

// ❌ Don't reinvent domain types
const entry: { id: string; content: string; type: string } = ...
```

If you genuinely need `any` (e.g. for cross-platform Firestore types, as seen in `JournalEntry.embedding`), add a comment explaining why.

### Write complete implementations

No stubs. No TODOs. No `// implement later`. If your task says to build a function or component, it must ship with:

- Error handling (`try/catch` for async, error boundaries for components)
- Loading state (while async operations are in flight)
- Empty state (when data exists but has zero items)
- Full TypeScript types with no unexplained `any`

If you hit something genuinely uncertain mid-task, stop and ask rather than leaving a placeholder.

### Firebase SDK — modular imports only

Use the v9+ modular import style. The old namespaced style (`firebase.firestore()`) does not exist in this codebase.

```ts
// ✅ v9 modular
import { getDoc, doc, collection, query, where, orderBy } from 'firebase/firestore';

// ❌ Old namespaced — will throw an import error
import firebase from 'firebase/app';
firebase.firestore().collection('entries');
```

### Async/await

Use `async`/`await`. Don't mix `.then()`/`.catch()` chains with `await` in the same function. Use `try/catch` blocks for error handling.

```ts
// ✅
async function saveEntry(entry: Partial<JournalEntry>): Promise<string> {
  try {
    const ref = await addDoc(collection(db, 'users', userId, 'entries'), entry);
    return ref.id;
  } catch (error) {
    console.error('Failed to save entry:', error);
    throw error; // re-throw so the caller can handle it
  }
}
```

### Tailwind CSS

- Tailwind v4 for all styling — no CSS Modules, no styled-components, no inline `style` props
- The primary brand colour is available as `bg-primary` / `text-primary` (maps to `#1A3C2E`)
- Mobile-first: write base styles for small screens, override with `sm:`, `md:`, `lg:` breakpoints
- Check `components/ui/` before building a new primitive — it may already exist

---

## 8. Analytics Instrumentation

Firebase Analytics is wired throughout the app. **All 29 events are typed** in `lib/analytics.ts`. Use those functions. Never call `logEvent` from `firebase/analytics` directly, and never invent new event names.

### How to fire an event

```ts
import { logEntryCreated, logYggiChatOpened } from '@/lib/analytics';

// After entry is successfully saved to Firestore
logEntryCreated({
  entry_type: entryType,   // EntryType enum value
  has_mood: hasMood,       // boolean
  tag_count: tags.length,  // number
  word_count: wordCount,   // number
});

// When the Yggi drawer opens
logYggiChatOpened();
```

Analytics only fires client-side. The helper in `analytics.ts` already guards for `typeof window !== 'undefined'` — you don't need to add that check yourself.

### Event reference by feature area

**Journaling**

| Function | When |
|---|---|
| `logEntryCreated({ entry_type, has_mood, tag_count, word_count })` | After entry is saved to Firestore |
| `logEntryEdited()` | After an existing entry is updated |
| `logEntryDeleted()` | After an entry is deleted |
| `logEntrySearched({ search_type: 'full_text' \| 'semantic' })` | When a search is performed |

**AI & Insights**

| Function | When |
|---|---|
| `logYggiChatOpened()` | When the Yggi drawer opens |
| `logYggiMessageSent({ conversation_turn_count })` | On each user message sent |
| `logInsightGenerated()` | When a per-entry analysis completes (Cloud Function) |
| `logInsightsTabViewed()` | When the Insights tab mounts |
| `logHiddenConnectionsViewed()` | When Hidden Connections section is in view |
| `logHiddenConnectionsComputation({ path: 'cirq' \| 'fallback_knn' })` | On every Hidden Connections run |
| `logKnowledgeGraphViewed()` | When the D3 knowledge graph renders |
| `logWeeklyWisdomGenerated()` | When a weekly report is generated |

**Goals & Growth**

| Function | When |
|---|---|
| `logGoalCreated()` | After a goal is saved |
| `logGoalCompleted()` | When a goal is marked complete |
| `logGoalDeleted()` | When a goal is deleted |
| `logJourneyStarted()` | When a journey is started |
| `logJourneyCompleted()` | When a journey is completed |
| `logAchievementUnlocked({ achievement_id })` | When an achievement fires |
| `logLivingTreeViewed()` | When the Living Tree component renders |

**Onboarding & Retention**

| Function | When |
|---|---|
| `logOnboardingStarted()` | On the user's first session |
| `logOnboardingCompleted()` | When the onboarding flow finishes |
| `logSeedEntryAnalyzed()` | When the first AI insight is delivered |
| `logStreakMilestone({ streak_days })` | When a streak milestone is reached |

**Business**

| Function | When |
|---|---|
| `logSubscriptionStarted({ plan })` | After successful Stripe checkout |
| `logSubscriptionCancelled()` | On cancellation webhook |
| `logSubscriptionRenewed()` | On renewal webhook |
| `logPaywallViewed()` | When `/pricing` is shown after the free limit |
| `logSettingsOpened()` | When Settings tab mounts |
| `logDataExported()` | When user exports their data |

---

## 9. Firestore Data Model

The Firestore security rules define what collections exist and who can access them. Here is the full data model:

```
users/{userId}
    ├── entries/{entryId}               user's journal entries (JournalEntry)
    │     └── analysis/{analysisId}     Gemini analysis output (EntryAnalysis)
    ├── goals/{goalId}                  user's goals (Goal)
    ├── journeys/{journeyId}            user's journeys (Journey)
    ├── achievements/{achievementId}    unlocked achievements (Achievement)
    ├── connections/{connectionId}      Hidden Connections — READ only for user; WRITE server only
    └── weeklyReports/{reportId}        weekly AI reports — READ only for user; WRITE server only

subscriptions/{userId}                  Stripe subscription status — WRITE server only

adminLogs/{logId}                       operations dashboard log — server only, NO client access
```

**Access rules:**
- All `users/{userId}/**` paths: the authenticated owner can read and write their own data only
- `connections/` and `weeklyReports/`: users can read; only the server (Admin SDK via Cloud Functions) can write
- `adminLogs/`: completely off-limits to client code — Admin SDK only
- `subscriptions/`: written by the Stripe webhook API route; read by subscription hooks

### Key TypeScript types (all in `types/`)

```ts
// types/journal.ts
JournalEntry        id, userId, title, content (rich text), mood, entryType, tags,
                    wordCount, createdAt, updatedAt, embedding?, embeddingGeneratedAt?

EntryAnalysis       // Top-level fields (6):
                    entities[], themes[], emotions[], keywords[], summary,
                    safety_concerns,
                    // Nested interpretation object (7 sub-fields):
                    interpretation: {
                      main_insight,
                      questions[],
                      action_items[],
                      patterns_identified[],
                      growth_connection,
                      frameworks_applied[],  // populated only when depth >= 3
                      depth_analysis         // populated only when depth >= 3
                    }
                    // Optional — gated by user Settings:
                    chakra_tags?, tarot_tags?, sacred_geometry?, archetype_tags?

EntryType enum      REFLECTION | GRATITUDE | DREAM | EVENT

Mood                { polarity: number,      // 0–10; 5 = neutral; lower = negative, higher = positive
                      intensity: number,     // 0–10; 5 = moderate; lower = mild, higher = intense
                      derivedLabel: string } // label from How We Feel vocabulary
                                             // e.g. polarity 8 + intensity 9 → "Ecstatic"
                                             //      polarity 2 + intensity 8 → "Anguished"
                                             //      polarity 4 + intensity 2 → "Melancholic"

// types/user.ts
UserProfile         id, displayName, email, plan ('FREE' | 'PRO' | 'ANNUAL' | 'LIFETIME'),
                    streakDays, lastEntryAt

// types/goals.ts
Goal                id, userId, title, description, status, aiSuggested, sourceEntryId?
Journey             id, userId, title, steps[], status, startedAt, completedAt?
Achievement         id, userId, achievementId, unlockedAt, metadata

// types/insights.ts
Connection          id, entryIdA, entryIdB, score (0–1), reason,
                    computedVia ('cirq' | 'fallback_knn'), computedAt
InsightCluster      id, entryIds[], label, centroidTheme
WeeklyReport        id, userId, weekStarting, summary, topThemes,
                    moodTrend, goalProgress, aiNarrative
```

---

## 10. Working on a Task

### How tasks are assigned

Tasks are tracked in **GitHub Issues**. Isa owns all architecture and integration decisions. Collaborators implement clearly scoped, self-contained tasks.

When you receive a task, it will specify:
- Exactly what to build
- Which files to touch or create
- What "done" looks like

### Before you start

- Read the task description fully before writing any code
- Check `types/` to understand the data shapes involved
- Check `components/ui/` to see if you need to build any primitives or if they exist
- Check `lib/analytics.ts` to know which events to fire
- If anything is unclear — **ask before starting**, not after

### Scope discipline

Tasks are scoped intentionally. Do not reach outside the task boundaries. If you notice something adjacent that needs fixing, **flag it in your PR description or as a comment on the issue** — do not fix it silently. Isa handles the wiring between your work and the rest of the system.

### Communication

Reach out to Isa via **Discord DM** (`@isa23_`) for questions. Keep it async — ask clearly in one message rather than sending follow-ups. You don't need to wait for a synchronous call to proceed.

---

## 11. Git Workflow & Pull Requests

### Branch naming

Create branches off `main`. Use the following prefixes:

| Type | Pattern | Example |
|---|---|---|
| New feature | `feat/<short-description>` | `feat/hidden-connections-ui` |
| Bug fix | `fix/<short-description>` | `fix/auth-redirect-loop` |
| Documentation | `docs/<short-description>` | `docs/update-onboarding` |
| Chores (deps, config) | `chore/<short-description>` | `chore/upgrade-firebase-sdk` |

Use lowercase and hyphens. No spaces, no camelCase.

### Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

```
<type>(<scope>): <short summary in imperative mood>

[optional body — explain why, not what]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Keep the summary line under 72 characters. Use the imperative mood ("add", "fix", "update" — not "added", "fixed", "updating").

```
feat(insights): add Hidden Connections D3 visualisation

fix(auth): handle loading state before redirect in dashboard layout

test(analytics): add unit tests for logEntryCreated

chore(deps): upgrade firebase to 12.14.0
```

### Pull request checklist

Before opening a PR:

```bash
npm run type-check   # zero TypeScript errors
npm run lint         # zero lint errors
npm run build        # successful production build — catches issues Turbopack misses in dev
```

Your PR description should include:
- What changed and why (reference the GitHub Issue)
- Any new environment variables added
- Anything Isa needs to wire up after merge (e.g. "new Cloud Function needs deploying")
- Screenshots or screen recordings for any UI changes

**PRs require approval before merge.** Tag Isa as reviewer. Do not merge your own PR.

---

## 12. Testing

### Testing stack

| Tool | Role |
|---|---|
| Jest | Test runner (configured in `jest.config.ts`) |
| @testing-library/react | Component tests — render, query, assert on DOM |
| @testing-library/jest-dom | Extended DOM matchers (`.toBeInTheDocument()`, `.toHaveValue()`, etc.) |
| Firebase Emulator Suite | Local Firestore/Auth/Functions for integration tests |

### Test file location

Co-locate test files with the code they test, using the `.test.ts` / `.test.tsx` suffix:

```
components/journal/EntryComposer.tsx
components/journal/EntryComposer.test.tsx

lib/analytics.ts
lib/analytics.test.ts

hooks/useAuth.ts
hooks/useAuth.test.ts
```

### Running tests

```bash
npm test                    # run all tests once
npm test -- --watch         # watch mode — re-runs on file change
npm test -- --coverage      # coverage report
npm test -- EntryComposer   # run tests matching a pattern
```

### What to write tests for

**Always test:**
- Utility functions in `lib/` — pure functions are the easiest to test and have the highest value
- Any calculation logic (mood score derivation, streak counting, word count, score thresholds)
- Custom hooks — state changes and side effects

**Write tests for components when:**
- The component has meaningful conditional rendering (loading/error/empty states)
- The component handles user interaction that changes state

**Test user-visible behaviour, not implementation details:**

```ts
// ✅ Testing what the user sees
it('shows an error message when entry save fails', async () => {
  // Arrange: mock Firestore addDoc to throw
  // Act: render <EntryComposer />, fill in content, click Save
  // Assert: error message text is present in the document
});

// ❌ Testing implementation detail — don't do this
it('sets hasError to true when save fails', () => { ... });
```

### Mocking Firebase

Firebase modules need to be mocked in unit and component tests because they use browser APIs unavailable in jsdom:

```ts
jest.mock('@/lib/firebase/client', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'test-uid', email: 'test@example.com' },
  },
  storage: {},
  analytics: null,
}));

// Also mock specific Firestore functions you use:
jest.mock('firebase/firestore', () => ({
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
}));
```

For tests that require real Firestore or Auth behaviour, use the **Firebase Emulator Suite** — start it with `firebase emulators:start` and point the test environment at it.

### Cloud Functions tests

Cloud Functions live in `functions/src/`. They have their own `package.json` and test setup inside the `functions/` directory. Do not try to test Cloud Functions from the root Jest config.

### Coverage expectations

There is no hard coverage target for the XPRIZE build — we are optimising for shipping. That said:
- Any utility function you add to `lib/` must have tests
- Any calculation or scoring logic must be tested
- If you're unsure whether to test something, err on the side of writing a test

---

## 13. Design System

The visual identity is established. **Do not redesign anything.** Match the existing aesthetic when building UI.

| Element | Value |
|---|---|
| Primary colour | `#1A3C2E` (forest green) — use `bg-primary` / `text-primary` |
| Palette | Earthy tones, nature and tree metaphors, sacred geometry influences |
| Brand voice | Warm, elegant, gentle |
| App tone | Spiritually intelligent — not clinical, not a mood tracker |
| Metaphors | Trees, roots, growth, the Norse world-tree Yggdrasil |

**Do not:**
- Introduce new colour schemes
- Use clinical or dashboard-style UI patterns
- Apply rounded-everything trends (pill buttons everywhere, etc.)
- Use language that sounds like a health or diagnostic app
- Use cheerful primary colours (blues, greens that aren't forest tones, bright oranges)

### Responsive design

Build mobile-first. Rosa journals late at night — often on her phone. Layouts must work at 375px and scale up cleanly.

```tsx
// Mobile-first with Tailwind
<div className="flex flex-col md:flex-row gap-4">
```

### Figma

Figma designs are in progress — available soon. Until then:
- Reference the Lovable prototype (`github.com/lovable-isa23/yggdrasil-journal`) for visual reference only
- Do not copy code from the prototype

---

## 14. Deployment

**Only Isa deploys.** Do not attempt to deploy to Cloud Run, deploy Cloud Functions, or push to the Firebase project directly unless Isa has explicitly asked you to handle it.

The deployment pipeline:
1. PR merged to `main`
2. Isa builds the Docker container and pushes to Cloud Run
3. Cloud Functions are deployed via `firebase deploy --only functions`

If you're interested in the deployment side of the project, tell Isa — she's happy to bring you in on it.

### Environment variables in production

Production secrets live in **GCP Secret Manager** — not in any committed file. The `FIREBASE_ADMIN_PRIVATE_KEY`, `GEMINI_API_KEY`, and Stripe secret keys are all pulled from Secret Manager at runtime. When you add a new secret, note it in your PR description so Isa knows to add it to Secret Manager before deploying.

---

## 15. Things You Must Not Do

| Don't | Why |
|---|---|
| Call Gemini directly from client-side code | The API key would be exposed in the browser bundle |
| Import `firebase-admin` in a React component or client code | Admin bypasses all Firestore security rules |
| Hardcode `gemini-2.0-pro` without documenting why | It costs significantly more than `flash`; we are managing GCP costs |
| Create `.js` files | TypeScript everywhere |
| Copy code from the Lovable prototype | Different stack, different patterns — it will cause subtle bugs |
| Put secrets in `NEXT_PUBLIC_` variables | These are visible in the browser bundle |
| Commit `.env.local` | It is in `.gitignore` for a reason. If you accidentally commit it, tell Isa immediately so keys can be rotated |
| Merge your own PR | PRs require approval |
| Add a non-Google AI provider | Gemini API only — it is an XPRIZE requirement |
| Invent new analytics event names | Use the typed functions in `lib/analytics.ts` exactly as defined |
| Modify Stripe keys, products, or the Stripe account | The existing account has real customers and active subscriptions |
| Add a new npm dependency without checking first | Ask Isa before adding anything substantial — bundle size and licence matter |
| Fix something outside your task scope silently | Flag it. Isa handles integration. |

---

## 16. Resources

### Project

| | |
|---|---|
| **GitHub repo** | [https://github.com/astrayama/yggdrasil](https://github.com/astrayama/yggdrasil) |
| **Issues / task board** | GitHub Issues on the repo |
| **Reference prototype** | `github.com/lovable-isa23/yggdrasil-journal` (read-only reference, no code copying) |
| **Questions** | Discord DM `@isa23_` |

### Documentation in this repo

| File | Contents |
|---|---|
| `docs/collaborator-onboarding.md` | This document |
| `docs/product-spec.md` | Full product specification, personas, and feature detail |

### Key external documentation

| Resource | URL |
|---|---|
| Next.js App Router | https://nextjs.org/docs/app |
| Firebase SDK v9+ (modular) | https://firebase.google.com/docs/web/modular-upgrade |
| Firebase Auth | https://firebase.google.com/docs/auth/web/start |
| Firestore | https://firebase.google.com/docs/firestore/quickstart |
| Firestore vector search | https://firebase.google.com/docs/firestore/vector-search |
| Firebase Cloud Functions v2 | https://firebase.google.com/docs/functions/get-started |
| Firebase Emulator Suite | https://firebase.google.com/docs/emulator-suite |
| Gemini API (`@google/generative-ai`) | https://ai.google.dev/api |
| Stripe Node.js SDK | https://stripe.com/docs/api?lang=node |
| Tailwind CSS v4 | https://tailwindcss.com/docs |
| TypeScript Handbook | https://www.typescriptlang.org/docs/ |
| Conventional Commits | https://www.conventionalcommits.org/en/v1.0.0/ |
| React Testing Library | https://testing-library.com/docs/react-testing-library/intro |

---

*Yggdrasil · Build with Gemini XPRIZE · Education & Human Potential · August 17, 2026*
