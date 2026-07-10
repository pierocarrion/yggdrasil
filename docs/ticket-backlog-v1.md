> ⚠️ **OBSOLETE — do not work from this file.** This is the original backlog import. The Linear board is the single source of truth for tickets, status, and scope: https://linear.app/yggdrasil-journal/team/YGG. Kept for historical reference only.

# Yggdrasil — XPRIZE Ticket Backlog

**Project:** Yggdrasil (semantic journaling app) · Screen Sage Studios
**Stack:** Next.js (App Router, TS) · Firebase (Auth, Firestore, Storage, Functions, Analytics) · Gemini API (`gemini-embedding-001` for embeddings) · Firestore KNN vector search · Google Cirq · Cloud Run · Stripe · D3.js
**Deadline:** August 17, 2026
### [Linear Tickets](https://linear.app/yggdrasil-journal/join/43e715acf1e134a359b68bcb0dca0b68?s=0)

---

## How to use this backlog

Tickets are **atomic** — each is 1–4 hours of focused work, scoped so a part-time collaborator can pick it up, build it without consulting Bel, and verify it's done against the acceptance criteria. Bel owns architecture; every ticket here assumes the architecture is already decided (it is, in the PRD + spec).

**Four release bands:**

| Band | Meaning | Target window |
|---|---|---|
| 🚀 **Launch** | Required to put the app in front of real paying users. Maps to PRD P0. | now → late June |
| 🏆 **XPRIZE-edge** | Differentiators that win judging criteria (Hidden Connections, ops dashboard, longitudinal view, NPS, weekly reports). Maps to PRD P1 + roadmap. | early → mid July |
| 🌱 **Stretch** | Nice-to-have, cut first if time runs short. Maps to PRD P2. | mid–late July, only if ahead |
| 📦 **Submission** | The Devpost package itself — video, narrative, evidence export. | August 1–17 |

**Ticket ID convention:** `BAND-AREA-NN` (e.g. `LAU-AUTH-01`). Areas: SCAF (scaffold), AUTH, JRNL (journal), AI, EMBED, YGGI, STRIPE, ANLY (analytics), DEPLOY, ONBRD (onboarding), ENTRY (entries tab), ROOTS, INSIGHT, HC (hidden connections), KG (knowledge graph), LONG (longitudinal), OPS (ops dashboard), NPS, REPORT, SHARE, COHORT, PRIV (privacy), SUB (submission).

**Effort key:** S = ~1–2hr · M = ~half day · L = ~full day · XL = multi-day (should be rare here; flag for splitting).

---

# 🚀 LAUNCH BAND

*Everything required to get real users writing entries, receiving insights, and paying. This is the critical path. Nothing in XPRIZE-edge matters until this band is shipped.*

---

## Scaffold & Infrastructure

## LAU-SCAF-01 — Initialize Next.js App Router project

**Problem**
There is no project skeleton on the new stack. Nothing can be built until the repo has a working Next.js App Router base with TypeScript.

**Feature description**
A bootable Next.js application that a developer can clone, `npm install`, and run locally, landing on a placeholder home page.

**Implementation Details**
- Next.js (App Router) + TypeScript. `npx create-next-app@latest` with TS, ESLint, App Router, `src/` dir, no Tailwind-only default (brand uses custom forest-green theme — see LAU-SCAF-05).
- Files: `package.json`, `tsconfig.json`, `next.config.js`, `src/app/layout.tsx`, `src/app/page.tsx`.
- Set `tsconfig.json` `strict: true`. No `.js` files anywhere (coding standard).
- Commit to `github.com/astrayama/yggdrasil` on a clean `main`.

**Acceptance criteria**
- [ ] `npm run dev` boots without errors on a fresh clone
- [ ] `npm run build` succeeds
- [ ] TypeScript strict mode is on
- [ ] Repo has a `.gitignore` excluding `node_modules`, `.env*`, `.next`
- [ ] Placeholder home page renders at `/`

**Effort estimate**
S — standard scaffold command plus config tweaks.

**Dependencies**
None.

**XPRIZE relevance**
Not applicable (foundational).

**Notes**
First ticket in the dependency chain. Everything else assumes this exists.

---

## LAU-SCAF-02 — Wire Firebase SDK (client) and env config

**Problem**
The app can't talk to Firebase without an initialized SDK and environment configuration. Every feature depends on this.

**Feature description**
Firebase is initialized once on the client and importable anywhere in the app.

**Implementation Details**
- Firebase SDK v9+ modular imports only.
- Files: `src/lib/firebase.ts` (initializeApp, exports `auth`, `db`, `storage`, `analytics` lazily — Analytics only in browser).
- Env vars in `.env.local` (and `.env.example` committed without values): `NEXT_PUBLIC_FIREBASE_*` keys for the `yggdrasil-497923` project.
- Guard Analytics init with `isSupported()` (it throws in SSR).

**Acceptance criteria**
- [ ] `src/lib/firebase.ts` exports `auth`, `db`, `storage`
- [ ] Analytics is only initialized client-side, guarded by `isSupported()`
- [ ] No Firebase config values are hardcoded — all from env
- [ ] `.env.example` documents every required key
- [ ] App still builds and boots with valid env values

**Effort estimate**
S — single config module.

**Dependencies**
LAU-SCAF-01.

**XPRIZE relevance**
Not applicable (foundational).

**Notes**
GCP project ID is `yggdrasil-497923`. Do not commit real keys.

---

## LAU-SCAF-03 — Initialize Firebase Admin SDK for Cloud Functions

**Problem**
Cloud Functions (analysis pipeline, Stripe webhook, backfill) need server-side Firebase access with elevated privileges.

**Feature description**
A Cloud Functions package with the Admin SDK initialized, ready for individual functions to be added.

**Implementation Details**
- `functions/` directory, TypeScript, Firebase Functions v2.
- Files: `functions/package.json`, `functions/tsconfig.json`, `functions/src/index.ts`, `functions/src/lib/admin.ts` (initializeApp with admin credentials, exports `db`, `auth`).
- Set Node runtime to a currently supported LTS in `functions/package.json`.

**Acceptance criteria**
- [ ] `functions/` builds with `npm run build`
- [ ] Admin SDK initializes once and is shared across functions
- [ ] `firebase deploy --only functions` succeeds with at least one no-op exported function
- [ ] Functions are TypeScript, no `.js`

**Effort estimate**
S — standard Functions init.

**Dependencies**
LAU-SCAF-02 (same Firebase project).

**XPRIZE relevance**
Not applicable (foundational).

**Notes**
Keep the Cirq pipeline OUT of this package — it lives in its own isolated Cloud Run container (see HC tickets).

---

## LAU-SCAF-04 — Firestore security rules: per-user data isolation

**Problem**
Without security rules, any authenticated user could read any other user's journal. This is a privacy and trust blocker, and a launch blocker.

**Feature description**
Each user can read and write only their own entries, goals, journeys, subscription, and feedback documents.

**Implementation Details**
- File: `firestore.rules`.
- Pattern: documents under collections keyed by `userId`; rule `allow read, write: if request.auth.uid == resource.data.userId` (and `request.resource.data.userId` on create).
- Cover collections: `entries`, `goals`, `journeys`, `subscriptions`, `feedback`, `connections`.
- Subscriptions: client read-only; writes only from Admin SDK (webhook). `allow write: if false` for clients.
- Deploy with `firebase deploy --only firestore:rules`.

**Acceptance criteria**
- [ ] A user cannot read another user's entries (verified in Rules Playground or emulator test)
- [ ] A user cannot write a document with a `userId` other than their own
- [ ] `subscriptions/{userId}` is not client-writable
- [ ] Rules deploy without errors

**Effort estimate**
M — rules plus emulator verification across collections.

**Dependencies**
LAU-SCAF-02, LAU-AUTH-01 (need auth to test).

**XPRIZE relevance**
Privacy/compliance — supports the credible data-handling story for judges.

**Notes**
Compliance roadmap item. Pairs with PRIV tickets in XPRIZE-edge.

---

## LAU-SCAF-05 — Apply brand theme tokens (forest green / earthy palette)

**Problem**
The visual identity is fixed and must not drift into clinical or default-template aesthetics. Developers need shared tokens so every component is on-brand without redesign decisions.

**Feature description**
A single source of truth for brand colors, typography, and spacing that all components consume.

**Implementation Details**
- Primary color `#1A3C2E` (forest green); earthy tones, nature/tree metaphors, sacred-geometry influences.
- Files: `src/styles/theme.css` (CSS custom properties) or `tailwind.config.ts` theme extension if Tailwind is used. Export tokens for primary, surface, text, accent, plus type scale.
- Brand voice note in a `README` or `docs/brand.md`: warm, elegant, gentle; spiritually intelligent, not clinical.

**Acceptance criteria**
- [ ] `#1A3C2E` is defined as a named token, not a magic string in components
- [ ] A type scale and earthy palette are defined as tokens
- [ ] At least the layout shell consumes the tokens
- [ ] No rounded-everything / default-template look in the shell

**Effort estimate**
S — token definitions plus shell application.

**Dependencies**
LAU-SCAF-01.

**XPRIZE relevance**
Not applicable (foundational).

**Notes**
Per spec §8: do NOT introduce new color schemes or clinical UI patterns. Reference the Lovable prototype for visual logic only.

---

## Authentication

## LAU-AUTH-01 — Email/password + Google sign-in

**Problem**
Users need accounts to have a private, persistent journal. No auth means no users.

**Feature description**
A user can sign up and log in with email/password or Google, and stay logged in across sessions.

**Implementation Details**
- Firebase Auth: email/password provider + Google provider.
- Files: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`, `src/lib/auth.ts` (sign-in/up/out helpers), `src/components/auth/AuthForm.tsx`.
- Use `onAuthStateChanged` to maintain session; expose via context (LAU-AUTH-02).
- NEVER enter credentials programmatically — standard Firebase UI flows only.

**Acceptance criteria**
- [ ] A new user can sign up with email/password
- [ ] A user can sign in with Google
- [ ] A user can log out
- [ ] Session persists across page reload
- [ ] Auth errors (wrong password, email in use) show a friendly message, not a raw error

**Effort estimate**
M — two providers, three flows, error handling.

**Dependencies**
LAU-SCAF-02.

**XPRIZE relevance**
Not applicable (foundational).

**Notes**
Google Sign-In is the lower-friction path; make it visually primary.

---

## LAU-AUTH-02 — Auth context provider + `useAuth()` hook

**Problem**
Components throughout the app need to know who the current user is without each one re-subscribing to auth state.

**Feature description**
A React context that exposes the current user and loading state app-wide via a hook.

**Implementation Details**
- Files: `src/context/AuthContext.tsx` (provider wrapping `onAuthStateChanged`), `src/hooks/useAuth.ts`.
- Provider mounted in `src/app/layout.tsx`.
- Expose `{ user, loading }`.

**Acceptance criteria**
- [ ] `useAuth()` returns the current user when logged in, `null` when not
- [ ] `loading` is `true` until the first auth state resolves
- [ ] Provider wraps the whole app
- [ ] No duplicate `onAuthStateChanged` listeners elsewhere in the codebase

**Effort estimate**
S — single context + hook.

**Dependencies**
LAU-AUTH-01.

**XPRIZE relevance**
Not applicable (foundational).

**Notes**
Everything gated behind login reads from this.

---

## LAU-AUTH-03 — Dashboard auth gate

**Problem**
The main app must be inaccessible to logged-out users; they should be redirected to login.

**Feature description**
Visiting any dashboard route while logged out redirects to `/login`; logged-in users pass through.

**Implementation Details**
- File: `src/app/(dashboard)/layout.tsx` — reads `useAuth()`, redirects to `/login` if `!user && !loading`.
- Show a loading state while `loading` is true (avoid redirect flash).

**Acceptance criteria**
- [ ] Logged-out user visiting a dashboard route is redirected to `/login`
- [ ] Logged-in user reaches the dashboard
- [ ] No redirect flash for an already-authenticated user on reload
- [ ] Loading state shown while auth resolves

**Effort estimate**
S — single layout guard.

**Dependencies**
LAU-AUTH-02.

**XPRIZE relevance**
Not applicable (foundational).

**Notes**
Route-group `(dashboard)` keeps the gate in one place.

---

## LAU-AUTH-04 — User document creation on first sign-in

**Problem**
The app needs a `users/{uid}` document to hang profile data, consent timestamps, and tier defaults on. Without it, downstream features have nowhere to write.

**Feature description**
On a user's first sign-in, a user document is created with sensible defaults.

**Implementation Details**
- Files: extend `src/lib/auth.ts` or a small Cloud Function trigger (`functions/src/onUserCreate.ts` via Auth `onCreate`).
- Default fields: `createdAt`, `email`, `displayName`, `tier: 'free'`, `entryCount: 0`.
- Prefer the Auth trigger so it's race-free.

**Acceptance criteria**
- [ ] A `users/{uid}` doc exists after first sign-in
- [ ] Defaults include `tier: 'free'` and `createdAt`
- [ ] Re-login does not overwrite or duplicate the doc
- [ ] Works for both email and Google sign-up

**Effort estimate**
S — one trigger function.

**Dependencies**
LAU-SCAF-03, LAU-AUTH-01.

**XPRIZE relevance**
Not applicable (foundational).

**Notes**
Consent timestamp field is added by PRIV-01 later; leave room for it.

---

## Journal Entry & AI Analysis Pipeline

## LAU-JRNL-01 — Rich text entry composer (default view)

**Problem**
Writing an entry is the core action of the app and must be the first thing a user sees, with zero configuration before writing (Therapy Tom can't be made to set anything up).

**Feature description**
When the app opens, the user sees a composer and can immediately start typing an entry.

**Implementation Details**
- Files: `src/app/(dashboard)/journal/page.tsx`, `src/components/journal/Composer.tsx`.
- Rich text: a lightweight editor (e.g. a contenteditable wrapper or a small editor lib). Keep it simple — bold/italic/lists is enough for v1.
- Composer is the default dashboard landing view.
- Save button writes to Firestore (LAU-JRNL-04 handles the write/analysis trigger).

**Acceptance criteria**
- [ ] Composer is the first thing shown on the dashboard
- [ ] User can type and apply basic formatting (bold/italic/list)
- [ ] No setup, mood, or type selection is required before writing
- [ ] Composer is keyboard-accessible
- [ ] On-brand styling (uses theme tokens)

**Effort estimate**
M — editor integration plus styling.

**Dependencies**
LAU-AUTH-03, LAU-SCAF-05.

**XPRIZE relevance**
Category Impact — frictionless reflection is the human-potential entry point.

**Notes**
Mood and entry type appear AFTER the composer and never block writing (separate tickets).

---

## LAU-JRNL-02 — Entry type selector (optional, post-composer)

**Problem**
Some users want to categorize entries (Reflection / Gratitude / Dream / Event), but forcing the choice adds friction.

**Feature description**
After writing, the user can optionally tag the entry with a type; skipping is fine.

**Implementation Details**
- File: `src/components/journal/EntryTypeSelector.tsx`.
- Options: Reflection / Gratitude / Dream / Event. Stored as `entryType` on the entry doc; nullable.
- Appears below/after the composer, not before.

**Acceptance criteria**
- [ ] Four types are selectable
- [ ] Selection is optional — entry saves with no type
- [ ] Chosen type is stored on the entry doc
- [ ] Selector appears after the composer, never blocking writing

**Effort estimate**
S — small controlled component.

**Dependencies**
LAU-JRNL-01.

**XPRIZE relevance**
Not applicable.

**Notes**
Feeds `entry_type` property on the `entry_created` analytics event.

---

## LAU-JRNL-03 — Two-slider mood capture with derived label

**Problem**
Mood matters for the longitudinal story, but single-emotion pickers are reductive. The product uses a polarity × intensity model with a derived human-readable label.

**Feature description**
After writing, the user can optionally set two sliders (polarity, intensity); the app shows a derived emotion label live.

**Implementation Details**
- File: `src/components/journal/MoodSliders.tsx`, `src/lib/moodLabel.ts` (lookup function).
- Polarity slider 0–10 (5 = neutral); intensity slider 0–10 (5 = moderate).
- `moodLabel.ts` maps (polarity, intensity) → label using the How We Feel vocabulary (e.g. 8/9 → "Ecstatic", 2/8 → "Anguished", 4/2 → "Melancholic").
- Store `moodPolarity`, `moodIntensity`, `moodLabel` on the entry. Optional — entry saves without mood.

**Acceptance criteria**
- [ ] Two independent 0–10 sliders render, centered at 5
- [ ] Derived label updates live as sliders move
- [ ] Mood is optional — entry saves with no mood and `has_mood: false`
- [ ] Raw values AND derived label are stored
- [ ] Sliders appear after the composer, never blocking writing

**Effort estimate**
M — sliders plus the label lookup logic.

**Dependencies**
LAU-JRNL-01.

**XPRIZE relevance**
Category Impact — two-dimensional mood feeds the longitudinal growth view.

**Notes**
**Open question (PRD):** the full polarity × intensity → label lookup table isn't finalized. This ticket needs the complete table from Bel before the label logic is correct for all 121 combinations. Ship with a documented partial map + nearest-cell fallback if the table isn't ready, and flag it.

---

## LAU-JRNL-04 — Save entry to Firestore + trigger analysis

**Problem**
Writing must persist and kick off the AI analysis that is the product's whole point.

**Feature description**
Saving an entry writes it to Firestore and starts background analysis without blocking the UI.

**Implementation Details**
- Files: `src/lib/entries.ts` (createEntry), wire to composer.
- Entry doc shape: `{ userId, content, entryType?, moodPolarity?, moodIntensity?, moodLabel?, tags: [], createdAt, analysisStatus: 'pending' }`.
- Write triggers the analysis Cloud Function (LAU-AI-02) via a Firestore `onCreate` trigger (preferred — decouples client from analysis).
- Show the subtle "Yggdrasil is thinking…" indicator (LAU-AI-04), NOT a blocking spinner.

**Acceptance criteria**
- [ ] Saving writes a complete entry doc to Firestore under the user
- [ ] `analysisStatus` starts as `pending`
- [ ] The analysis function is triggered on create
- [ ] The UI is not blocked while analysis runs
- [ ] Save fails gracefully with a retry option on network error

**Effort estimate**
M — write path plus trigger wiring.

**Dependencies**
LAU-JRNL-01, LAU-SCAF-03, LAU-SCAF-04.

**XPRIZE relevance**
AI-Native Operations — the auto-on-save analysis is AI acting without a human prompt.

**Notes**
Fires `entry_created` (ANLY ticket) with `entry_type`, `has_mood`, `tag_count`, `word_count`.

---

## LAU-AI-01 — Gemini API client wrapper

**Problem**
Every AI feature calls Gemini; without a shared, typed client, calls will be inconsistent and the model default will drift.

**Feature description**
A single server-side module that all Gemini calls go through.

**Implementation Details**
- File: `functions/src/lib/gemini.ts`.
- Default model `gemini-3.5-flash`; expose helpers for text generation and embeddings (`gemini-embedding-001` for embedding generation — see LAU-EMBED-01).
- Centralize API key/credential handling via GCP service account, not inline keys.
- Typed request/response wrappers; throw typed errors.

**Acceptance criteria**
- [ ] All Gemini calls in the codebase route through this module
- [ ] Default model is `gemini-3.5-flash`
- [ ] Embedding calls use `gemini-embedding-001`
- [ ] Model override requires an explicit argument (documented reason)
- [ ] Errors are typed and catchable

**Effort estimate**
M — client wrapper plus auth setup.

**Dependencies**
LAU-SCAF-03.

**XPRIZE relevance**
AI-Native Operations — all AI routes through Google's Gemini API.

**Notes**
Only upgrade off flash with a documented reason (coding standard). Embeddings use `gemini-embedding-001` specifically.

---

## LAU-AI-02 — Two-phase entry analysis function (13-field JSON)

**Problem**
Each entry must be analyzed into structured insight data — the core of every downstream feature (insights, graph, search, Yggi context).

**Feature description**
On entry save, a Cloud Function runs a single Gemini call performing depth scoring then comprehensive analysis, writing a 13-field structured result back to the entry.

**Implementation Details**
- File: `functions/src/analyzeEntry.ts` (Firestore `onCreate` on `entries`).
- Single Gemini call, two-phase prompt: (1) depth score 1–11, (2) one comprehensive prompt returning a 13-field JSON object (entities, themes, emotions, keywords, summary, safety concerns, nested interpretation object, etc.).
- Prompt the model to return JSON ONLY (no prose, no markdown fences); parse defensively, strip fences if present.
- Write result to `entries/{id}.analysis`; set `analysisStatus: 'complete'`.
- Respect the analytical-frameworks toggle (LAU-AI-03 / settings) when framing interpretation.

**Acceptance criteria**
- [ ] A saved entry receives a 13-field analysis object within seconds
- [ ] The result is valid parsed JSON every time (defensive parsing handles fenced output)
- [ ] `analysisStatus` flips to `complete` on success, `error` on failure
- [ ] A failed analysis is retryable and does not lose the entry
- [ ] Fires `insight_generated` on completion

**Effort estimate**
L — prompt engineering + robust JSON handling + error states.

**Dependencies**
LAU-AI-01, LAU-JRNL-04.

**XPRIZE relevance**
AI-Native Operations — automated per-entry analysis with timestamped logs is core agent-execution evidence.

**Notes**
The exact 13-field schema and depth-scoring rubric should be pinned in a shared `docs/analysis-schema.md` so collaborators don't improvise field names.

---

## LAU-AI-03 — Insight card rendering

**Problem**
The analysis is worthless to the user if it isn't surfaced. The insight card is the "aha" moment.

**Feature description**
After analysis completes, the user sees a card summarizing themes, emotions, and a reflective observation for that entry.

**Implementation Details**
- Files: `src/components/insights/InsightCard.tsx`, view at `src/app/(dashboard)/journal/[entryId]/page.tsx`.
- Render from `entries/{id}.analysis`. Warm, spiritually-intelligent copy tone — not clinical.
- Live-update when `analysisStatus` flips to `complete` (Firestore listener).

**Acceptance criteria**
- [ ] Card appears automatically when analysis completes
- [ ] Shows themes, emotions, and a reflective summary
- [ ] Tone is warm/reflective, not diagnostic
- [ ] Handles the still-analyzing and error states distinctly
- [ ] On-brand styling

**Effort estimate**
M — component plus live state handling.

**Dependencies**
LAU-AI-02.

**XPRIZE relevance**
Category Impact — this is the moment that demonstrates self-awareness as a learnable skill.

**Notes**
Reused by onboarding (ONBRD) to deliver the first insight.

---

## LAU-AI-04 — "Yggdrasil is thinking…" non-blocking indicator

**Problem**
Analysis takes a few seconds; users need feedback that something is happening without being blocked from writing more.

**Feature description**
A subtle, non-blocking indicator shows while an entry is being analyzed.

**Implementation Details**
- File: `src/components/journal/ThinkingIndicator.tsx`.
- Driven by `analysisStatus === 'pending'`. Subtle (not a modal/overlay spinner). Disappears on `complete`.

**Acceptance criteria**
- [ ] Indicator shows while analysis is pending
- [ ] It does NOT block writing or navigation
- [ ] It disappears when analysis completes
- [ ] Accessible (announced to screen readers)

**Effort estimate**
S — small status component.

**Dependencies**
LAU-JRNL-04.

**XPRIZE relevance**
Not applicable.

**Notes**
Onboarding reuses this; if analysis exceeds 60s, onboarding shows a holding screen instead of an error (ONBRD-03).

---

## Embeddings & Semantic Search

## LAU-EMBED-01 — Generate Gemini embedding on entry save

**Problem**
Semantic search, RAG, the knowledge graph, and Hidden Connections all need a vector representation of each entry.

**Feature description**
When an entry is analyzed, an embedding vector is generated via the Gemini API and stored on the entry document.

**Implementation Details**
- Extend `functions/src/analyzeEntry.ts` or a paired function.
- Generate embedding via Gemini API (`gemini-embedding-001`). Store as a Firestore `VectorValue` field `embedding` on the entry doc.
- Embedding dim per the model output.

**Acceptance criteria**
- [ ] Every newly analyzed entry has an `embedding` VectorValue field
- [ ] Embedding is generated via Gemini API (`gemini-embedding-001`)
- [ ] Dimensionality is consistent across all entries
- [ ] Failure to embed sets a flag but does not lose the entry

**Effort estimate**
M — Gemini embedding call + VectorValue write.

**Dependencies**
LAU-AI-02.

**XPRIZE relevance**
AI-Native Operations — all AI including embeddings routes through Gemini API.

**Notes**
Vertex AI is not used anywhere in the stack. Embeddings are generated by `gemini-embedding-001` and stored in Firestore. All search and RAG uses Firestore KNN `findNearest()`.

---

## LAU-EMBED-02 — Firestore KNN composite indexes

**Problem**
Firestore `findNearest()` KNN queries require composite vector indexes; without them, semantic search and RAG fail at query time.

**Feature description**
The Firestore vector indexes that make KNN queries possible exist and are deployed.

**Implementation Details**
- File: `firestore.indexes.json`.
- Add composite KNN index on `entries.embedding` scoped per user (filter on `userId` + vector). Set dimension and distance measure (COSINE).
- Deploy via `firebase deploy --only firestore:indexes`.

**Acceptance criteria**
- [ ] A KNN composite index on `entries.embedding` is defined in `firestore.indexes.json`
- [ ] Distance measure is COSINE
- [ ] Index deploys and reaches "Enabled" state
- [ ] A `findNearest()` query returns results without an index error

**Effort estimate**
S — index definition + deploy + wait.

**Dependencies**
LAU-EMBED-01.

**XPRIZE relevance**
Not applicable (infrastructure; cost-driven choice).

**Notes**
Firestore KNN is the correct vector search choice at Yggdrasil's scale (per-user journals of hundreds to low thousands of entries). Vertex AI Vector Search is optimized for millions of vectors and bills hourly per node regardless of usage — wrong fit entirely. This is the cost-justified architecture decision.

---

## LAU-EMBED-03 — `findNearest()` semantic search helper

**Problem**
Multiple features (Entries semantic search, Yggi RAG, Hidden Connections fallback) need a shared KNN query helper so the query logic isn't duplicated and divergent.

**Feature description**
A reusable function that returns the N nearest entries to a query embedding for a given user.

**Implementation Details**
- File: `functions/src/lib/vectorSearch.ts` (and/or a callable for the client).
- Implements `findNearest()` against `entries`, filtered by `userId`, COSINE, top-K parameterized.

**Acceptance criteria**
- [ ] Helper returns top-K nearest entries for a given query vector + userId
- [ ] Results are scoped to the requesting user only
- [ ] K is a parameter
- [ ] No references to Vertex AI anywhere in vector search code

**Effort estimate**
S — single query helper.

**Dependencies**
LAU-EMBED-02.

**XPRIZE relevance**
Not applicable.

**Notes**
Used by LAU-ENTRY-03 (semantic search), XPE-YGGI-02 (RAG), XPE-HC-05 (fallback).

---

## Entries Tab

## LAU-ENTRY-01 — Chronological entry list

**Problem**
Users need to find and revisit what they've written.

**Feature description**
A reverse-chronological list of the user's entries with previews.

**Implementation Details**
- Files: `src/app/(dashboard)/entries/page.tsx`, `src/components/entries/EntryList.tsx`.
- Query `entries` by `userId` ordered by `createdAt desc`. Paginate/limit for performance.
- Each row links to the entry's insight view.

**Acceptance criteria**
- [ ] Entries render newest-first
- [ ] Each row shows a preview, date, and (if set) mood label/type
- [ ] Tapping a row opens the entry insight view
- [ ] Paginates or lazy-loads beyond an initial batch
- [ ] Empty state shown when the user has no entries

**Effort estimate**
M — list + pagination + empty state.

**Dependencies**
LAU-JRNL-04.

**XPRIZE relevance**
Not applicable.

**Notes**
Tom's pre-session review flow lives here.

---

## LAU-ENTRY-02 — Full-text search

**Problem**
Users want to find entries by remembered words, not just scroll.

**Feature description**
A search box filters entries by text content.

**Implementation Details**
- File: extend `EntryList` / add `src/components/entries/SearchBar.tsx`.
- v1: client-side substring/keyword filter over the user's loaded entries (sufficient at per-user scale). Document the scaling limit.
- Fires `entry_searched` with `search_type: 'full_text'`.

**Acceptance criteria**
- [ ] Typing filters the entry list by content match
- [ ] Search is case-insensitive
- [ ] Clearing the box restores the full list
- [ ] Fires `entry_searched` with `search_type: 'full_text'`

**Effort estimate**
S — client-side filter.

**Dependencies**
LAU-ENTRY-01.

**XPRIZE relevance**
Not applicable.

**Notes**
Semantic search is a separate toggle (next ticket).

---

## LAU-ENTRY-03 — Semantic search (Firestore KNN)

**Problem**
Users often remember the *feeling* or *topic* of an entry, not its exact words. Semantic search finds by meaning.

**Feature description**
A semantic search mode returns entries closest in meaning to the query.

**Implementation Details**
- Embed the query via Gemini (`gemini-embedding-001`), call `findNearest()` (LAU-EMBED-03), render ranked results.
- Toggle between full-text and semantic in the search UI.
- Fires `entry_searched` with `search_type: 'semantic'`.

**Acceptance criteria**
- [ ] A semantic query returns meaning-relevant entries, not just keyword matches
- [ ] Results are ranked by similarity
- [ ] Mode toggle between full-text and semantic works
- [ ] Fires `entry_searched` with `search_type: 'semantic'`
- [ ] Scoped to the current user

**Effort estimate**
M — query embedding + KNN wiring + ranked UI.

**Dependencies**
LAU-EMBED-03, LAU-ENTRY-02.

**XPRIZE relevance**
AI-Native Operations — semantic retrieval over Gemini embeddings + Firestore KNN.

**Notes**
Reuses the shared `findNearest()` helper.

---

## LAU-ENTRY-04 — Tag browser (AI-extracted topics)

**Problem**
Users want to navigate their journal by theme without manual tagging.

**Feature description**
A browsable list of AI-extracted tags/topics; selecting one filters entries.

**Implementation Details**
- File: `src/components/entries/TagBrowser.tsx`.
- Tags come from `entries.analysis` (themes/keywords). Aggregate across the user's entries; selecting filters the list.
- Allow user-added manual tags too (optional).

**Acceptance criteria**
- [ ] Tags are aggregated from AI analysis across entries
- [ ] Selecting a tag filters the entry list
- [ ] Tag counts are shown
- [ ] Works alongside full-text/semantic search

**Effort estimate**
M — aggregation + filter UI.

**Dependencies**
LAU-AI-02, LAU-ENTRY-01.

**XPRIZE relevance**
Not applicable.

**Notes**
Tom's "work stress" cluster scenario depends on this.

---

## Subscriptions (Stripe)

## LAU-STRIPE-01 — Stripe products & price config

**Problem**
The three offers must exist in Stripe before any checkout can reference them.

**Feature description**
Pro Monthly, Pro Annual, and Lifetime products exist in the live Stripe account with correct prices.

**Implementation Details**
- In the existing live Stripe account "Yggdrasil xprize": Pro Monthly $4.99/mo, Pro Annual $44.99/yr, Lifetime $149 one-time.
- Record price IDs in a committed `src/lib/stripe/prices.ts` (IDs are not secret).
- Live mode throughout (no test mode).

**Acceptance criteria**
- [ ] Three products with correct prices exist in live Stripe
- [ ] Price IDs are referenced from one config module
- [ ] Annual is structured for the "3 months free / save 25%" framing
- [ ] Lifetime is a one-time price, not recurring

**Effort estimate**
S — Stripe dashboard config + ID file.

**Dependencies**
None (Stripe account exists).

**XPRIZE relevance**
Business Viability — real revenue requires real products.

**Notes**
Live mode is intentional per project standard; ensure test keys aren't accidentally used.

---

## LAU-STRIPE-02 — `create-checkout` Cloud Function

**Problem**
Users need a way to start a paid subscription from the app.

**Feature description**
A function that creates a Stripe Checkout session for a chosen plan and returns its URL.

**Implementation Details**
- File: `functions/src/createCheckout.ts` (callable or HTTPS).
- Accepts `plan_type: 'monthly' | 'yearly' | 'lifetime'`. Creates a Stripe Customer lazily (on first checkout, not signup). Returns Checkout session URL.
- Subscription mode for monthly/yearly; payment mode for lifetime.
- NEVER handle raw card data — Stripe Checkout only.

**Acceptance criteria**
- [ ] Returns a valid Checkout URL for each of the three plan types
- [ ] Creates a Stripe Customer lazily and stores the mapping
- [ ] Lifetime uses one-time payment mode
- [ ] No card data ever touches our servers

**Effort estimate**
M — function + Stripe SDK + customer mapping.

**Dependencies**
LAU-STRIPE-01, LAU-SCAF-03.

**XPRIZE relevance**
Business Viability.

**Notes**
Store `stripeCustomerId` on the user doc on first checkout.

---

## LAU-STRIPE-03 — `stripe-webhook` Cloud Function

**Problem**
Subscription status must reflect real payment events; the app can't trust the client to report payment.

**Feature description**
A webhook updates the user's subscription status in Firestore when Stripe events occur.

**Implementation Details**
- File: `functions/src/stripeWebhook.ts` (HTTPS).
- Verify the Stripe signature. Handle `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
- Write to `subscriptions/{userId}` (Admin SDK only; clients can't write — see LAU-SCAF-04).
- Fires `subscription_started` (with `plan`), and supports `subscription_renewed` / `subscription_cancelled`.

**Acceptance criteria**
- [ ] Webhook signature is verified; unsigned requests rejected
- [ ] All four event types update `subscriptions/{userId}` correctly
- [ ] A completed checkout flips the user to Pro
- [ ] A cancellation/deletion reverts tier appropriately
- [ ] Idempotent on duplicate event delivery

**Effort estimate**
L — signature verification + four handlers + idempotency.

**Dependencies**
LAU-STRIPE-02, LAU-SCAF-04.

**XPRIZE relevance**
Business Viability — this is what makes the Stripe revenue real and trustworthy.

**Notes**
Webhook secret in env, never committed.

---

## LAU-STRIPE-04 — `useSubscription()` hook + tier context

**Problem**
The UI needs to know the user's tier to gate features without each component querying Firestore.

**Feature description**
A hook exposes the current user's subscription tier app-wide.

**Implementation Details**
- Files: `src/hooks/useSubscription.ts`, `src/context/SubscriptionContext.tsx`.
- Live Firestore listener on `subscriptions/{userId}`; exposes `{ tier, status, loading }`.

**Acceptance criteria**
- [ ] `useSubscription()` returns the live tier
- [ ] Updates within seconds of a webhook-driven change
- [ ] Defaults to `free` when no subscription doc exists
- [ ] Loading state exposed

**Effort estimate**
S — hook + context.

**Dependencies**
LAU-STRIPE-03.

**XPRIZE relevance**
Not applicable.

**Notes**
Consumed by `<FeatureGate>`.

---

## LAU-STRIPE-05 — `<FeatureGate>` component

**Problem**
Pro-only features must be blocked for free users and route them to upgrade.

**Feature description**
A wrapper component that shows content to entitled users and a paywall prompt to others.

**Implementation Details**
- File: `src/components/billing/FeatureGate.tsx`.
- Props: required tier / feature key. Reads `useSubscription()`. Renders children if entitled, else an upgrade prompt that links to `/pricing`.
- Fires `paywall_viewed` when the gate blocks.

**Acceptance criteria**
- [ ] Pro feature is visible to Pro users
- [ ] Free user sees an upgrade prompt instead
- [ ] Prompt links to `/pricing`
- [ ] Fires `paywall_viewed` when blocking

**Effort estimate**
S — single wrapper.

**Dependencies**
LAU-STRIPE-04.

**XPRIZE relevance**
Business Viability — gates the upgrade conversion.

**Notes**
Gates Yggi, Hidden Connections, data export, full knowledge graph.

---

## LAU-STRIPE-06 — `check-trial-status` (free-tier per-feature caps)

**Problem**
Free tier is limited by usage (5 trial insights, 3 journeys, 5 goals), and limits must be enforced server-side, not just hidden in the UI.

**Feature description**
A function/logic that counts a user's usage against tier caps and triggers the paywall when a cap is hit.

**Implementation Details**
- File: `functions/src/checkTrialStatus.ts` or shared lib used at gate points.
- Counts analyzed entries (5 trial), journeys (3), goals (5) against free caps. Returns whether the action is allowed.
- Insight gating: first 5 analyzed entries free, then paywalled (entry still saves; insight is gated).

**Acceptance criteria**
- [ ] Free user gets insights on first 5 entries, paywall on the 6th
- [ ] Free user blocked from creating a 4th journey / 6th goal
- [ ] Counts are server-authoritative, not client-spoofable
- [ ] Hitting a cap surfaces the paywall

**Effort estimate**
M — counting logic across three resources + enforcement points.

**Dependencies**
LAU-STRIPE-05, LAU-AI-02.

**XPRIZE relevance**
Business Viability — entry-count gating converts users who've felt real value (per PRD rationale).

**Notes**
Entries themselves stay unlimited; only the *insight* is gated past 5.

---

## LAU-STRIPE-07 — `/pricing` page (three plan cards)

**Problem**
Users need a place to see plans and start checkout.

**Feature description**
A pricing page with three plan cards that launch checkout.

**Implementation Details**
- File: `src/app/(dashboard)/pricing/page.tsx`, `src/components/billing/PlanCard.tsx`.
- Three cards: Monthly, Annual ("Most Popular" badge), Lifetime ("Founding Member" label). Each calls `create-checkout` and redirects to the returned URL.

**Acceptance criteria**
- [ ] Three plan cards render with correct prices
- [ ] Annual shows "Most Popular"; Lifetime shows "Founding Member"
- [ ] Each card launches the correct Checkout session
- [ ] On-brand styling
- [ ] Reachable from the paywall and from settings/nav

**Effort estimate**
M — page + cards + checkout wiring.

**Dependencies**
LAU-STRIPE-02.

**XPRIZE relevance**
Business Viability — the conversion surface.

**Notes**
Confirm a real purchase requires explicit user action — never auto-initiate checkout.

---

## Analytics

## LAU-ANLY-01 — Typed analytics module (all 29 events)

**Problem**
The XPRIZE submission needs clean usage evidence, and event names/properties must be exact and stable once the ops dashboard is wired to them.

**Feature description**
A single typed module defines every analytics event and its properties; the app logs only through it.

**Implementation Details**
- File: `src/lib/analytics.ts`.
- Define all 29 events across 5 categories (Journaling, AI & Insights, Goals & Growth, Onboarding & Retention, Business) with exact names and typed property payloads per the spec §6.
- Wrap `logEvent`; no-op safely in SSR/unsupported environments.
- Event names are FROZEN once the dashboard depends on them.

**Acceptance criteria**
- [ ] All 29 events are defined with exact names from the spec
- [ ] Each event's properties are typed
- [ ] Logging anywhere else in the app imports from this module (no raw `logEvent` strings)
- [ ] Safe no-op when Analytics is unavailable

**Effort estimate**
M — full typed event surface.

**Dependencies**
LAU-SCAF-02.

**XPRIZE relevance**
AI-Native Operations + Business Viability — this is the usage-evidence backbone.

**Notes**
Event names are FROZEN once the dashboard depends on them. `hidden_connections_computation` uses `path: 'fallback_knn'` (not `fallback_vertex` — that was the old Vertex-era value). Do NOT rename events after the dashboard is wired.

---

## LAU-ANLY-02 — Wire journaling & onboarding events

**Problem**
Defined events are useless until fired at the right moments.

**Feature description**
Journaling and onboarding events fire at their correct trigger points.

**Implementation Details**
- Wire `entry_created` (with `entry_type`, `has_mood`, `tag_count`, `word_count`), `entry_edited`, `entry_deleted`, `entry_searched`, `onboarding_started`, `onboarding_completed`, `seed_entry_analyzed`, `streak_milestone`.
- Each fires from the action's success path.

**Acceptance criteria**
- [ ] Each listed event fires exactly once per triggering action
- [ ] `entry_created` carries all four required properties with correct values
- [ ] No event fires on failure paths
- [ ] Verified in Firebase DebugView

**Effort estimate**
M — many wiring points.

**Dependencies**
LAU-ANLY-01 and the relevant feature tickets.

**XPRIZE relevance**
Business Viability — retention metrics depend on these.

**Notes**
Onboarding events may land after ONBRD tickets; wire opportunistically.

---

## LAU-ANLY-03 — Wire AI, Goals, and Business events

**Problem**
The remaining event categories need wiring to complete the usage picture.

**Feature description**
AI/Insights, Goals & Growth, and Business events fire at their trigger points.

**Implementation Details**
- AI: `yggi_chat_opened`, `yggi_message_sent` (`conversation_turn_count`), `insight_generated`, `insights_tab_viewed`, `hidden_connections_viewed`, `hidden_connections_computation` (`path`), `knowledge_graph_viewed`, `weekly_wisdom_generated`.
- Goals: `goal_created`, `goal_completed`, `goal_deleted`, `journey_started`, `journey_completed`, `achievement_unlocked` (`achievement_id`), `living_tree_viewed`.
- Business: `subscription_started` (`plan`), `subscription_cancelled`, `subscription_renewed`, `paywall_viewed`, `settings_opened`, `data_exported`.

**Acceptance criteria**
- [ ] Every listed event fires at its correct point with required properties
- [ ] `hidden_connections_computation` logs the correct `path` value
- [ ] Verified in DebugView
- [ ] No duplicate or missing fires

**Effort estimate**
M — broad wiring across features.

**Dependencies**
LAU-ANLY-01 plus the respective feature tickets (some land in XPRIZE-edge).

**XPRIZE relevance**
AI-Native Operations — these feed the ops dashboard and weekly reports.

**Notes**
Some events can only be wired once their feature exists; track partial completion.

---

## Deployment

## LAU-DEPLOY-01 — Dockerize Next.js for Cloud Run

**Problem**
Cloud Run needs a container image of the app.

**Feature description**
The app builds into a production container that runs on Cloud Run.

**Implementation Details**
- Files: `Dockerfile`, `.dockerignore`.
- Multi-stage build; Next.js standalone output. Expose the port Cloud Run provides via `$PORT`.

**Acceptance criteria**
- [ ] `docker build` produces a runnable image
- [ ] Container serves the app locally on the mapped port
- [ ] Image uses the Next.js standalone output (small image)
- [ ] Reads `$PORT` from the environment

**Effort estimate**
M — Dockerfile + standalone config.

**Dependencies**
LAU-SCAF-01.

**XPRIZE relevance**
Not applicable (infrastructure).

**Notes**
Cirq service is a SEPARATE container (HC tickets); this is the web app only.

---

## LAU-DEPLOY-02 — Deploy to Cloud Run with production domain + HTTPS

**Problem**
Real users need a stable public URL over HTTPS.

**Feature description**
The app is live on Cloud Run at a production domain with HTTPS enforced.

**Implementation Details**
- Deploy the image to Cloud Run in `yggdrasil-497923`. Map a custom domain; HTTPS enforced (managed cert).
- Set runtime env (Firebase config, Stripe keys, Gemini API credentials) via Cloud Run secrets/env.

**Acceptance criteria**
- [ ] App is reachable at a production domain over HTTPS
- [ ] HTTP redirects to HTTPS
- [ ] Runtime env is configured (no missing-key errors)
- [ ] A real signup → entry → insight flow works in production

**Effort estimate**
M — deploy + domain + secrets.

**Dependencies**
LAU-DEPLOY-01, LAU-SCAF-02.

**XPRIZE relevance**
Business Viability — required to have real users at all.

**Notes**
Secrets via Cloud Run / Secret Manager, never baked into the image.

---

## LAU-DEPLOY-03 — CI: build + deploy pipeline

**Problem**
Manual deploys are error-prone and slow for a small async team.

**Feature description**
Pushing to `main` builds and deploys automatically.

**Implementation Details**
- File: `.github/workflows/deploy.yml` (or Cloud Build trigger).
- On push to `main`: build image, deploy to Cloud Run, deploy functions/rules/indexes as appropriate.
- Use a GCP service-account secret for auth.

**Acceptance criteria**
- [ ] Push to `main` triggers an automated build
- [ ] Successful build deploys to Cloud Run
- [ ] Failed build blocks deploy and reports status
- [ ] Functions/rules/indexes deploy as part of or alongside the pipeline

**Effort estimate**
M — pipeline config + auth.

**Dependencies**
LAU-DEPLOY-02.

**XPRIZE relevance**
AI-Native Operations — clean deploy logs support the operations story.

**Notes**
Reduces Bel-as-bottleneck risk for async collaborators.

---

---

# 🏆 XPRIZE-EDGE BAND

*Differentiators that move the three judging criteria. Build after Launch is shipping to real users. Order roughly: onboarding (retention) → Yggi (engagement) → Hidden Connections (technical signature) → ops/reports (AI-Native Operations) → the rest.*

---

## Onboarding

## XPE-ONBRD-01 — Seed-entry onboarding prompt

**Problem**
New users don't understand what makes Yggdrasil different until they feel the insight. The first session must deliver value in under 60 seconds with zero setup.

**Feature description**
On first session, the user is asked one question ("what's one thing on your mind right now?") and writes a seed entry — no setup screens.

**Implementation Details**
- Files: `src/app/(dashboard)/onboarding/page.tsx`, `src/components/onboarding/SeedPrompt.tsx`.
- Single prompt, single text area, one CTA. No config/toggles.
- On submit, create the seed entry and trigger analysis (reusing LAU-AI-02).
- Fires `onboarding_started`.

**Acceptance criteria**
- [ ] First-time users land on the seed prompt
- [ ] Only one prompt + text area + CTA is shown (no setup)
- [ ] Submitting creates a real analyzed entry
- [ ] Fires `onboarding_started`
- [ ] Returning users skip onboarding

**Effort estimate**
M — flow + first-run detection.

**Dependencies**
LAU-AI-02, LAU-AUTH-04.

**XPRIZE relevance**
Category Impact — the 60-second "aha" is the human-potential hook for judges.

**Notes**
**Open question:** exact onboarding prompt copy isn't finalized (PRD open issue). Ship with a placeholder and flag for Bel's final copy.

---

## XPE-ONBRD-02 — First insight delivered + `seed_entry_analyzed`

**Problem**
The seed entry's insight is the payoff; it must surface fast and be measured for the time-to-first-insight metric.

**Feature description**
The first insight card appears as soon as the seed entry is analyzed, completing onboarding.

**Implementation Details**
- Reuse `InsightCard` (LAU-AI-03). On analysis complete, show it and fire `seed_entry_analyzed`, then `onboarding_completed`.
- Yggi line: "when you're ready, I'll watch for how this evolves."

**Acceptance criteria**
- [ ] First insight appears automatically on seed analysis completion
- [ ] Fires `seed_entry_analyzed` then `onboarding_completed`
- [ ] Median time `onboarding_started` → `seed_entry_analyzed` is ≤60s in practice
- [ ] Flows into the main app afterward

**Effort estimate**
S — reuse + event wiring.

**Dependencies**
XPE-ONBRD-01, LAU-AI-03.

**XPRIZE relevance**
Category Impact + measurable success metric (≤60s to first insight).

**Notes**
This pair of events powers the onboarding time metric in the PRD.

---

## XPE-ONBRD-03 — >60s holding screen (no error)

**Problem**
If analysis is slow, showing an error on the very first experience kills the impression. A calm holding screen preserves the magic.

**Feature description**
If the seed analysis exceeds 60 seconds, the user sees a gentle holding screen rather than an error.

**Implementation Details**
- After 60s pending, swap the thinking indicator for a brief reassuring holding screen; surface the insight when ready.
- Never show a raw error during onboarding.

**Acceptance criteria**
- [ ] At 60s pending, a holding screen replaces the indicator
- [ ] No error is shown to the user during onboarding
- [ ] The insight still appears when analysis completes
- [ ] On hard failure, a graceful retry (not a stack trace)

**Effort estimate**
S — timeout + screen.

**Dependencies**
XPE-ONBRD-02.

**XPRIZE relevance**
Category Impact — protects the first impression.

**Notes**
Edge case only; low effort, high impression value.

---

## Yggi (AI Companion)

## XPE-YGGI-01 — Yggi FAB + right-side drawer shell

**Problem**
Yggi must be reachable from anywhere without navigating away from what the user is reading.

**Feature description**
A floating action button opens a right-side chat drawer over the current view.

**Implementation Details**
- Files: `src/components/yggi/YggiFab.tsx`, `src/components/yggi/YggiDrawer.tsx`.
- FAB bottom-right, present across dashboard. Drawer slides from the right. Pro-gated via `<FeatureGate>`.
- Fires `yggi_chat_opened` on open.

**Acceptance criteria**
- [ ] FAB is visible bottom-right across the dashboard
- [ ] Clicking opens a right-side drawer over the current view
- [ ] Drawer is dismissible and doesn't lose the underlying view
- [ ] Pro-gated; free users see the upgrade prompt
- [ ] Fires `yggi_chat_opened`

**Effort estimate**
M — FAB + drawer + gating.

**Dependencies**
LAU-STRIPE-05.

**XPRIZE relevance**
Category Impact — the companion is central to the mirror-for-the-mind story.

**Notes**
Chat logic is the next ticket; this is the shell.

---

## XPE-YGGI-02 — Yggi RAG chat (full journal context)

**Problem**
Yggi is only valuable if it actually knows the user's journal; a generic chatbot doesn't reflect anyone's patterns back.

**Feature description**
Yggi answers questions grounded in the user's relevant past entries.

**Implementation Details**
- File: `functions/src/yggiChat.ts`.
- RAG: embed the user message, `findNearest()` (LAU-EMBED-03) to retrieve relevant entries, pass as context to Gemini with the Yggi persona prompt.
- Persona: warm, reflective, spiritually intelligent, grounded mystic — NOT a yes-woman; goes straight to insight; not a clinical/mood-tracker assistant.
- Fires `yggi_message_sent` with `conversation_turn_count`.

**Acceptance criteria**
- [ ] Yggi's answers reference the user's actual entries when relevant
- [ ] Retrieval is scoped to the current user only
- [ ] Persona tone matches the brief (not clinical, not sycophantic)
- [ ] Fires `yggi_message_sent` with correct `conversation_turn_count`
- [ ] Handles "no relevant entries yet" gracefully

**Effort estimate**
L — RAG pipeline + persona prompt + turn tracking.

**Dependencies**
XPE-YGGI-01, LAU-EMBED-03, LAU-AI-01.

**XPRIZE relevance**
AI-Native Operations + Category Impact — the signature conversational reflection.

**Notes**
Target metric: ≥3 turns/session average. Pin the persona prompt in `docs/yggi-persona.md`.

---

## XPE-YGGI-03 — Pre-load entry/insight context into Yggi

**Problem**
When a user opens Yggi from a specific entry or connection, it should already be talking about that thing.

**Feature description**
Opening Yggi from an entry or insight view pre-loads that content as context.

**Implementation Details**
- Pass the originating entry/connection ID into the drawer; prepend it to the RAG context for the first turn.
- Used by Hidden Connections "explain this connection" (XPE-HC-07).

**Acceptance criteria**
- [ ] Opening Yggi from an entry pre-loads that entry as context
- [ ] Opening from a connection pre-loads both linked entries
- [ ] Opening from the FAB (no context) starts a general chat
- [ ] Pre-loaded context visibly informs the first response

**Effort estimate**
S — context passing.

**Dependencies**
XPE-YGGI-02.

**XPRIZE relevance**
Category Impact — deepens the "explain my pattern" moment.

**Notes**
Directly enables Rosa's hidden-connection scenario.

---

## Roots (Goals, Journeys, Living Tree, Achievements)

## XPE-ROOTS-01 — Goals data model + CRUD

**Problem**
Users need destination-focused goals with completion tracking, distinct from open-ended Journeys.

**Feature description**
Users can create, view, track, and complete goals.

**Implementation Details**
- Files: `src/app/(dashboard)/roots/page.tsx`, `src/lib/goals.ts`, `src/components/roots/GoalList.tsx`.
- Goal schema (distinct from Journey): `{ userId, title, description, targetState, progress, status: 'active'|'complete', createdAt, completedAt? }`.
- Free cap = 5 goals (enforced via LAU-STRIPE-06).
- Fires `goal_created`, `goal_completed`, `goal_deleted`.

**Acceptance criteria**
- [ ] User can create a goal with a target/end-state
- [ ] User can mark a goal complete (records `completedAt`)
- [ ] User can delete a goal
- [ ] Free tier blocked at 6th goal
- [ ] Fires the three goal events

**Effort estimate**
M — schema + CRUD + cap.

**Dependencies**
LAU-STRIPE-06.

**XPRIZE relevance**
Category Impact — measurable growth via goal completion.

**Notes**
Goals ≠ Journeys: separate schema, separate UX. Do not conflate (PRD enforced).

---

## XPE-ROOTS-02 — AI goal suggestions from journal patterns

**Problem**
Users don't always know what to work on; the journal already contains the signal. AI-suggested goals turn patterns into action.

**Feature description**
The Roots tab suggests goals derived from recurring themes in recent entries, with reasoning, acceptable in one tap.

**Implementation Details**
- File: `functions/src/suggestGoals.ts`.
- Gemini over recent entry analyses → candidate goal + "suggested based on patterns in N of your recent entries" + reasoning.
- One-tap accept creates a real goal (XPE-ROOTS-01).

**Acceptance criteria**
- [ ] At least one suggested goal appears once enough entries exist
- [ ] Suggestion shows reasoning and the count of supporting entries
- [ ] One-tap accept creates a tracked goal
- [ ] Suggestions are dismissible
- [ ] Scoped to the user's own entries

**Effort estimate**
M — Gemini suggestion + accept flow.

**Dependencies**
XPE-ROOTS-01, LAU-AI-02.

**XPRIZE relevance**
AI-Native Operations + Category Impact — AI converts reflection into growth actions.

**Notes**
Powers Rosa's "Establish a boundary at work" scenario.

---

## XPE-ROOTS-03 — Journeys data model + CRUD

**Problem**
Some growth is a process, not a destination; Journeys collect entries over time with no "done" state.

**Feature description**
Users can start a Journey and add entries to it over time.

**Implementation Details**
- Files: `src/lib/journeys.ts`, `src/components/roots/JourneyList.tsx`.
- Journey schema (distinct from Goal): `{ userId, title, description, entryIds: [], createdAt }` — no completion/target fields.
- Free cap = 3 journeys.
- Fires `journey_started`, `journey_completed` (completion optional/soft).

**Acceptance criteria**
- [ ] User can start a Journey (no target/end-state required)
- [ ] User can attach entries to a Journey
- [ ] Journey schema has no completion-state requirement
- [ ] Free tier blocked at 4th journey
- [ ] Fires `journey_started`

**Effort estimate**
M — schema + CRUD + cap.

**Dependencies**
LAU-STRIPE-06.

**XPRIZE relevance**
Category Impact — process-focused growth.

**Notes**
Open-ended by design; do not add a destination model.

---

## XPE-ROOTS-04 — Auto-link entries to goals/journeys

**Problem**
Manually linking every entry is friction; the AI can connect new entries to relevant active goals/journeys.

**Feature description**
New entries are automatically associated with relevant active goals or journeys.

**Implementation Details**
- Extend analysis (LAU-AI-02): match entry themes/embedding against active goals/journeys; link when similarity passes a threshold.
- Show links on the goal/journey detail view.

**Acceptance criteria**
- [ ] A relevant new entry is auto-linked to an active goal/journey
- [ ] Irrelevant entries are not linked
- [ ] Links are visible on the goal/journey view
- [ ] User can remove an auto-link

**Effort estimate**
M — matching logic + UI.

**Dependencies**
XPE-ROOTS-01, XPE-ROOTS-03, LAU-EMBED-01.

**XPRIZE relevance**
AI-Native Operations — automatic organization without user effort.

**Notes**
Rosa's scenario: two entries auto-linked to her accepted goal that week.

---

## XPE-ROOTS-05 — Living Tree visualization

**Problem**
Consistency is hard to feel; a growing tree makes habit strength tangible and on-brand (Yggdrasil = world-tree).

**Feature description**
A tree visual grows as the user journals consistently.

**Implementation Details**
- File: `src/components/roots/LivingTree.tsx`.
- Map streak/consistency metrics to growth stages (SVG or D3). On-brand earthy/forest aesthetic.
- Fires `living_tree_viewed`.

**Acceptance criteria**
- [ ] Tree reflects journaling consistency (more = more growth)
- [ ] Visual is on-brand (forest/earthy, not clinical)
- [ ] Updates as the user journals
- [ ] Fires `living_tree_viewed`

**Effort estimate**
M — visualization tied to streak data.

**Dependencies**
XPE-INSIGHT-01 (streak data) or compute inline.

**XPRIZE relevance**
Category Impact — embodies growth-as-visible-progress.

**Notes**
Keep performant; it's decorative, not critical-path.

---

## XPE-ROOTS-06 — Achievements / milestone badges

**Problem**
Milestones reinforce the habit loop and give users a sense of progress.

**Feature description**
Users unlock badges for streaks, goal completions, and usage depth.

**Implementation Details**
- Files: `src/lib/achievements.ts`, `src/components/roots/Achievements.tsx`.
- Define achievement set with IDs and unlock conditions. Check on relevant actions; unlock once.
- Fires `achievement_unlocked` with `achievement_id`.

**Acceptance criteria**
- [ ] Defined achievements unlock when conditions are met
- [ ] Each unlocks at most once
- [ ] Unlocked badges are displayed
- [ ] Fires `achievement_unlocked` with the correct `achievement_id`

**Effort estimate**
M — definitions + checks + display.

**Dependencies**
XPE-ROOTS-01.

**XPRIZE relevance**
Not applicable (engagement).

**Notes**
Keep the achievement ID list in a shared doc so it's stable for analytics.

---

## Insights Dashboard

## XPE-INSIGHT-01 — Streak calendar

**Problem**
Consistency is the habit; users need to see it as a heatmap to feel and maintain it.

**Feature description**
A calendar heatmap shows journaling consistency over time.

**Implementation Details**
- Files: `src/app/(dashboard)/insights/page.tsx`, `src/components/insights/StreakCalendar.tsx`.
- Aggregate entry dates per user; render a heatmap. Compute current/longest streak.
- Fires `streak_milestone` (with `streak_days`) at thresholds; `insights_tab_viewed` on tab open.

**Acceptance criteria**
- [ ] Heatmap shows entry frequency by day
- [ ] Current and longest streak are computed correctly
- [ ] Fires `insights_tab_viewed` on open
- [ ] Fires `streak_milestone` at defined thresholds
- [ ] On-brand styling

**Effort estimate**
M — aggregation + heatmap.

**Dependencies**
LAU-ENTRY-01.

**XPRIZE relevance**
Category Impact — visible consistency supports habit formation.

**Notes**
Feeds the Living Tree (XPE-ROOTS-05).

---

## XPE-INSIGHT-02 — Frequency & 2D mood charts

**Problem**
Users want to see emotional patterns over time, across both mood dimensions, not a single line.

**Feature description**
Charts show entry cadence and the polarity × intensity distribution over time.

**Implementation Details**
- File: `src/components/insights/MoodCharts.tsx`.
- Plot entry frequency over time, and a 2D plot of polarity × intensity (scatter or binned heatmap) across the period.
- Use D3 or a charting lib consistent with the rest of the app.

**Acceptance criteria**
- [ ] Frequency chart renders entries over time
- [ ] Mood chart plots BOTH polarity and intensity dimensions
- [ ] Handles entries with no mood gracefully
- [ ] Date-range selectable or sensible default window
- [ ] On-brand styling

**Effort estimate**
M — two charts + 2D mood handling.

**Dependencies**
XPE-INSIGHT-01, LAU-JRNL-03.

**XPRIZE relevance**
Category Impact — the emotional-arc evidence.

**Notes**
Two-dimensional mood is a product differentiator; don't collapse it to one axis.

---

## XPE-INSIGHT-03 — Semantic cluster map

**Problem**
Users want to see their entries grouped by topic proximity to understand their dominant themes.

**Feature description**
Entries are visualized as clusters grouped by semantic similarity.

**Implementation Details**
- File: `src/components/insights/ClusterMap.tsx`.
- Use entry embeddings; reduce/cluster (e.g. group by nearest-neighbor topics from analysis). Render clusters; click drills into entries.

**Acceptance criteria**
- [ ] Entries are grouped into visible topic clusters
- [ ] Clusters are labeled by dominant theme
- [ ] Clicking a cluster shows its entries
- [ ] Scoped to the user

**Effort estimate**
M — clustering + render.

**Dependencies**
LAU-EMBED-01, LAU-AI-02.

**XPRIZE relevance**
Category Impact — self-understanding via thematic structure.

**Notes**
Can share rendering primitives with the Knowledge Graph.

---

## XPE-INSIGHT-04 — Emotional patterns (longitudinal section)

**Problem**
Users want to see how emotions and themes evolve, not just a snapshot.

**Feature description**
A section shows how emotions/themes shift across the journal history.

**Implementation Details**
- File: `src/components/insights/EmotionalPatterns.tsx`.
- Aggregate dominant emotions/themes over time windows; render trend lines/bands.

**Acceptance criteria**
- [ ] Shows emotion/theme evolution across time
- [ ] Handles sparse history gracefully
- [ ] Readable at a glance
- [ ] On-brand styling

**Effort estimate**
M — aggregation + trend render.

**Dependencies**
XPE-INSIGHT-02.

**XPRIZE relevance**
Category Impact — the human-growth story for judges.

**Notes**
Overlaps with the dedicated Longitudinal view (XPE-LONG-01); coordinate to avoid duplication.

---

## Hidden Connections (Cirq + Firestore KNN fallback)

## XPE-HC-01 — Cirq service scaffold (isolated Cloud Run, scale-to-zero)

**Problem**
Cirq runs Python quantum kernel computation that must be isolated from the web app and must not cost money when idle.

**Feature description**
A standalone Cloud Run service that exposes a Cirq computation endpoint and scales to zero.

**Implementation Details**
- Separate repo dir / service: `cirq-service/` (Python, FastAPI or Flask), own `Dockerfile`.
- `cirq.Simulator()` on CPU; min instances = 0 (scale to zero); concurrency tuned for batch.
- Endpoint accepts vector pairs, returns kernel similarity scores.

**Acceptance criteria**
- [ ] Cirq service deploys as its own Cloud Run service
- [ ] Min instances = 0 (no idle cost)
- [ ] Endpoint returns a kernel score for a pair of input vectors
- [ ] Service is isolated from the Next.js app and Functions

**Effort estimate**
L — separate service + container + deploy.

**Dependencies**
LAU-DEPLOY-02 (GCP project set up).

**XPRIZE relevance**
AI-Native Operations — Cirq is the technical signature differentiator.

**Notes**
~20ms/kernel pair at 8 qubits on CPU is viable for batch/async. Real quantum hardware is NOT used. Collaborator: stealthy (Cirq/Python).

---

## XPE-HC-02 — Per-user PCA reduction (768 → 8 dims)

**Problem**
Cirq's 8-qubit kernel needs 8-dimensional inputs; raw 768-dim embeddings must be reduced, fitted per user.

**Feature description**
Each user's embeddings are reduced to 8 dimensions via PCA fitted on their own corpus.

**Implementation Details**
- In `cirq-service/` or a paired function: fit PCA on the individual user's journal embeddings, reduce 768→8, normalize to rotation-angle range for qubit encoding.
- Refit periodically as the corpus grows.

**Acceptance criteria**
- [ ] PCA is fitted per user (not globally)
- [ ] Output is 8-dimensional, normalized to the rotation-angle range
- [ ] Retains a documented variance fraction (40–65% expected)
- [ ] Refit logic exists as the corpus grows

**Effort estimate**
M — PCA fit + normalization per user.

**Dependencies**
XPE-HC-01, LAU-EMBED-01.

**XPRIZE relevance**
AI-Native Operations — part of the quantum pipeline narrative.

**Notes**
Per-user fit is intentional; do not fit a global PCA.

---

## XPE-HC-03 — Nightly Hidden Connections batch job

**Problem**
Connections should be discovered automatically without real-time cost; a nightly batch is sufficient and cost-appropriate.

**Feature description**
A scheduled job computes connection pairs for each active user nightly.

**Implementation Details**
- File: `functions/src/hiddenConnectionsBatch.ts` (scheduled function).
- For each user with enough entries: classical cosine KNN pre-filter → send candidate pairs to Cirq service → store scored pairs in `connections/{userId}`.
- Two-stage: KNN pre-filter narrows pairs before the O(n²)-ish Cirq step.

**Acceptance criteria**
- [ ] Job runs on a nightly schedule
- [ ] Only users above a minimum entry count are processed
- [ ] KNN pre-filter runs before Cirq re-ranking
- [ ] Scored pairs are written to `connections/{userId}`
- [ ] Job completes without timing out for normal corpus sizes

**Effort estimate**
L — scheduling + two-stage pipeline + storage.

**Dependencies**
XPE-HC-01, XPE-HC-02, LAU-EMBED-03.

**XPRIZE relevance**
AI-Native Operations — autonomous nightly AI computation, logged.

**Notes**
**Open question:** minimum entry count for meaningful Cirq results, and max pairs to surface before UX gets noisy — both PRD open issues. Ship with documented defaults, flag for tuning.

---

## XPE-HC-04 — `hidden_connections_computation` path logging

**Problem**
The XPRIZE submission must show Cirq actually ran (≥30% target); every computation must log which path executed.

**Feature description**
Every Hidden Connections computation logs whether Cirq or the fallback ran.

**Implementation Details**
- In the batch job, fire `hidden_connections_computation` with `path: 'cirq' | 'fallback_knn'` per run, and log to the ops dashboard store.

**Acceptance criteria**
- [ ] Every computation fires the event with the correct `path`
- [ ] `path` is `'cirq'` when Cirq succeeded, `'fallback_knn'` when it didn't
- [ ] Path is also written to the ops dashboard log
- [ ] Cirq-path rate is queryable

**Effort estimate**
S — event + log wiring.

**Dependencies**
XPE-HC-03, LAU-ANLY-01.

**XPRIZE relevance**
AI-Native Operations — direct evidence for the ≥30% Cirq-path metric.

**Notes**
Value is `'fallback_knn'`, not `'fallback_vertex'`. The event name and both path values are frozen — do not change them after the ops dashboard is wired.

---

## XPE-HC-05 — Silent KNN fallback

**Problem**
Cirq isn't always reliable; the feature must still produce connections, and the user must never see a difference.

**Feature description**
If Cirq fails or is unavailable, the batch falls back to Firestore KNN cosine similarity, producing identical-looking results.

**Implementation Details**
- In the batch job: try Cirq; on failure/unavailability, score pairs via `findNearest()` cosine (LAU-EMBED-03). Output schema identical either way.
- UI never indicates which path ran.

**Acceptance criteria**
- [ ] Cirq failure does not break the feature
- [ ] Fallback produces scored pairs in the same schema
- [ ] UI is identical regardless of path
- [ ] Fallback path logs `fallback_knn`

**Effort estimate**
M — fallback branch + parity.

**Dependencies**
XPE-HC-03, XPE-HC-04.

**XPRIZE relevance**
AI-Native Operations — resilience keeps the feature live for judges.

**Notes**
If Cirq can't reach 30% before submission, investigate (PRD Q&A).

---

## XPE-HC-06 — D3 connection visualization

**Problem**
Scored pairs are meaningless until visualized; users need to see and explore the connections.

**Feature description**
Hidden Connections are rendered as an interactive D3 visualization in the Insights tab.

**Implementation Details**
- File: `src/components/insights/HiddenConnections.tsx`.
- D3 rendering of scored pairs from `connections/{userId}`; each connection shows a label (e.g. shared emotional fingerprint).
- Pro-gated. Fires `hidden_connections_viewed`.

**Acceptance criteria**
- [ ] Scored connection pairs render as an interactive D3 visual
- [ ] Each connection has a human-readable label
- [ ] Pro-gated; free users see upgrade prompt
- [ ] Fires `hidden_connections_viewed`
- [ ] On-brand styling

**Effort estimate**
L — D3 viz + labels + gating.

**Dependencies**
XPE-HC-03, LAU-STRIPE-05.

**XPRIZE relevance**
AI-Native Operations + Category Impact — the visible payoff of the signature feature.

**Notes**
Rosa's "two entries, same shame response" scenario renders here.

---

## XPE-HC-07 — Side-by-side connection view + "explain" via Yggi

**Problem**
Seeing a connection isn't enough; users want to read both entries and understand why they're linked.

**Feature description**
Tapping a connection shows both entries side by side and offers a Yggi explanation.

**Implementation Details**
- File: `src/components/insights/ConnectionDetail.tsx`.
- Render both linked entries side by side. "Explain this connection" opens Yggi pre-loaded with both entries (XPE-YGGI-03).

**Acceptance criteria**
- [ ] Tapping a connection shows both entries side by side
- [ ] "Explain" opens Yggi with both entries as context
- [ ] Yggi's explanation references both entries
- [ ] Back returns to the connection visual

**Effort estimate**
M — detail view + Yggi handoff.

**Dependencies**
XPE-HC-06, XPE-YGGI-03.

**XPRIZE relevance**
Category Impact — turns a detected pattern into understanding.

**Notes**
Completes Rosa's hidden-connection scenario end to end.

---

## Knowledge Graph

## XPE-KG-01 — Build graph data (nodes + edges)

**Problem**
The knowledge graph needs a node/edge dataset derived from entries before it can be drawn.

**Feature description**
A data structure of concept/person/theme nodes and semantic-similarity edges is built from the user's entries.

**Implementation Details**
- File: `src/lib/knowledgeGraph.ts` (or a function).
- Nodes: concepts, people, themes from `entries.analysis`. Edges: semantic similarity via KNN between related items.
- Output a graph JSON consumable by D3.

**Acceptance criteria**
- [ ] Nodes are built from extracted concepts/people/themes
- [ ] Edges represent semantic similarity
- [ ] Output is valid graph data (nodes + edges)
- [ ] Scoped to the user
- [ ] Handles small graphs gracefully

**Effort estimate**
M — extraction + edge computation.

**Dependencies**
LAU-AI-02, LAU-EMBED-03.

**XPRIZE relevance**
Category Impact — spatial self-exploration.

**Notes**
Free tier = "Basic" graph; Pro = "Full" — **open question:** exact Basic/Full distinction is a PRD open issue; flag for Bel.

---

## XPE-KG-02 — D3 force-directed graph render

**Problem**
The graph data must become an interactive visual users can explore.

**Feature description**
A force-directed D3 graph lets users explore concept connections and drill into entries.

**Implementation Details**
- File: `src/components/insights/KnowledgeGraph.tsx`.
- D3 force simulation over the graph data. Interactive: zoom/pan, click a node to drill into related entries. On-brand colors.
- Fires `knowledge_graph_viewed`.

**Acceptance criteria**
- [ ] Force-directed graph renders nodes and edges
- [ ] User can zoom/pan and click nodes
- [ ] Clicking a node drills into related entries
- [ ] Fires `knowledge_graph_viewed`
- [ ] Performant for typical per-user node counts

**Effort estimate**
L — D3 force sim + interactivity.

**Dependencies**
XPE-KG-01.

**XPRIZE relevance**
Category Impact — the "living map of you" made literal.

**Notes**
Lives inside the Insights tab. Shares D3 primitives with Hidden Connections.

---

## Longitudinal Growth View

## XPE-LONG-01 — Longitudinal timeline view

**Problem**
The clearest evidence of human potential is change over time: themes, mood, and goal completions across the whole history. This is the human-impact story for judges.

**Feature description**
A timeline shows dominant themes, mood trajectory, and goal completions across the full journal history.

**Implementation Details**
- File: `src/components/insights/Longitudinal.tsx`.
- Combine theme aggregation, mood trajectory, and goal-completion markers on one timeline. Accessible from Insights.

**Acceptance criteria**
- [ ] Timeline shows dominant themes over time
- [ ] Mood trajectory is plotted across history
- [ ] Goal completions appear as markers
- [ ] Readable across short and long histories
- [ ] On-brand styling

**Effort estimate**
L — multi-source timeline composition.

**Dependencies**
XPE-INSIGHT-02, XPE-ROOTS-01.

**XPRIZE relevance**
Category Impact — THE growth-evidence view for the submission narrative.

**Notes**
Coordinate with XPE-INSIGHT-04 to avoid duplicating emotion-trend logic.

---

## AI-Native Operations Dashboard

## XPE-OPS-01 — Admin-only ops dashboard route

**Problem**
The XPRIZE submission requires demonstrating AI running the business, via an admin dashboard not visible to end users.

**Feature description**
An admin-only route that hosts the AI operations evidence.

**Implementation Details**
- File: `src/app/(admin)/ops/page.tsx` + an admin guard (allowlist of admin UIDs).
- Not linked from the user nav; blocked for non-admins.

**Acceptance criteria**
- [ ] Route is reachable only by allowlisted admin UIDs
- [ ] Non-admins are blocked/redirected
- [ ] Route is not present in end-user navigation
- [ ] Renders a dashboard shell for the panels below

**Effort estimate**
S — route + admin guard.

**Dependencies**
LAU-AUTH-02.

**XPRIZE relevance**
AI-Native Operations — the home for all agent-execution evidence.

**Notes**
Keep admin UIDs in config, not hardcoded inline.

---

## XPE-OPS-02 — Automated insight generation log panel

**Problem**
Judges need timestamped evidence that AI analyzed entries autonomously.

**Feature description**
A panel lists automated insight generations with timestamps.

**Implementation Details**
- Log each `analyzeEntry` run (timestamp, entry ref, model, status) to an `opsLogs` collection; render newest-first.

**Acceptance criteria**
- [ ] Each automated analysis appears with a timestamp
- [ ] Shows model used and success/failure
- [ ] Newest-first, paginated
- [ ] Admin-only

**Effort estimate**
M — logging + panel.

**Dependencies**
XPE-OPS-01, LAU-AI-02.

**XPRIZE relevance**
AI-Native Operations — core agent-execution log evidence.

**Notes**
This is literally the "agent execution logs" submission deliverable.

---

## XPE-OPS-03 — Hidden Connections path-rate panel

**Problem**
The submission claims quantum-inspired analysis; judges need to see the Cirq-vs-fallback rate over time.

**Feature description**
A panel charts the Cirq vs. fallback path rate over time.

**Implementation Details**
- Read the path logs (XPE-HC-04); chart Cirq% over time and show the running rate vs. the 30% target.

**Acceptance criteria**
- [ ] Panel shows Cirq vs. fallback counts over time
- [ ] Current Cirq-path rate is displayed against the 30% target
- [ ] Admin-only
- [ ] Updates as nightly batches run

**Effort estimate**
S — read logs + chart.

**Dependencies**
XPE-OPS-01, XPE-HC-04.

**XPRIZE relevance**
AI-Native Operations — direct evidence for the Cirq-path success metric.

**Notes**
If the rate is under 30% near submission, this is the early-warning surface.

---

## XPE-OPS-04 — Yggi conversation summaries panel

**Problem**
The ops story includes AI summarizing its own interactions; weekly Yggi summaries demonstrate this.

**Feature description**
A panel shows AI-generated weekly summaries of Yggi conversations.

**Implementation Details**
- Scheduled function: Gemini summarizes the week's Yggi activity (aggregate, privacy-safe) → store → render in ops.

**Acceptance criteria**
- [ ] Weekly Yggi summaries are generated automatically
- [ ] Summaries are timestamped and listed
- [ ] Generation is AI-executed (logged)
- [ ] Admin-only; privacy-safe aggregation

**Effort estimate**
M — scheduled summary + panel.

**Dependencies**
XPE-OPS-01, XPE-YGGI-02.

**XPRIZE relevance**
AI-Native Operations — AI reflecting on operations.

**Notes**
Aggregate only; do not expose individual users' private content in admin summaries beyond what's necessary.

---

## NPS + Feedback System

## XPE-NPS-01 — In-app NPS + freeform feedback prompt

**Problem**
Real testimonials and satisfaction signal are required for the submission, and feedback feeds the AI business reports. The prompt must appear at meaningful moments, not randomly.

**Feature description**
At meaningful moments, the user is asked an NPS score and an optional freeform comment.

**Implementation Details**
- Files: `src/components/feedback/NpsPrompt.tsx`, `src/lib/feedback.ts`.
- Trigger at meaningful moments (e.g. after first hidden connection, after Nth entry). 0–10 score + optional text. Store in `feedback/{id}` (`{ userId, score, comment?, trigger, createdAt }`).
- Throttle so it isn't repetitive.

**Acceptance criteria**
- [ ] Prompt appears at defined meaningful moments, not randomly
- [ ] Captures a 0–10 score and optional freeform text
- [ ] Throttled (won't re-prompt too soon)
- [ ] Stored under the user with the triggering context
- [ ] Dismissible without penalty

**Effort estimate**
M — prompt + triggers + throttle.

**Dependencies**
LAU-AUTH-02.

**XPRIZE relevance**
Business Viability — source of testimonials and satisfaction evidence.

**Notes**
Mirrors the Lovable prototype's feedback feature. Feedback feeds weekly reports (XPE-REPORT-01).

---

## XPE-NPS-02 — Feedback admin panel

**Problem**
Bel needs to read raw feedback to pull testimonials and spot issues.

**Feature description**
An admin panel lists NPS scores and comments.

**Implementation Details**
- Read `feedback`; render with score, comment, trigger, date; filter by score band. In the ops/admin area.

**Acceptance criteria**
- [ ] All feedback is listed with score, comment, trigger, date
- [ ] Filterable by score band (detractor/passive/promoter)
- [ ] Admin-only
- [ ] Exportable or copy-friendly for testimonials

**Effort estimate**
S — read + render + filter.

**Dependencies**
XPE-NPS-01, XPE-OPS-01.

**XPRIZE relevance**
Business Viability — testimonial sourcing for the submission.

**Notes**
Promoter comments are testimonial candidates (with consent).

---

## Automated Weekly Business Reports

## XPE-REPORT-01 — Scheduled Gemini weekly business report

**Problem**
The strongest AI-Native Operations evidence is AI generating the business's own narrative reports on a schedule, unprompted.

**Feature description**
Once a week, Gemini generates a narrative business report from analytics + feedback, stored and timestamped.

**Implementation Details**
- File: `functions/src/weeklyReport.ts` (scheduled, from July 26).
- Pull the week's analytics aggregates + NPS/feedback; Gemini writes a narrative report (usage, revenue signal, satisfaction, notable patterns). Store in `reports/{weekId}`.
- Fires `weekly_wisdom_generated`.

**Acceptance criteria**
- [ ] A report is generated automatically each week
- [ ] Report draws on real analytics + feedback data
- [ ] Report is stored with a timestamp
- [ ] Generation is AI-executed and logged
- [ ] Fires `weekly_wisdom_generated`

**Effort estimate**
M — scheduled aggregation + Gemini narrative + storage.

**Dependencies**
LAU-ANLY-01, XPE-NPS-01.

**XPRIZE relevance**
AI-Native Operations — the centerpiece "AI runs the business" evidence (target ≥4 reports by Aug 17).

**Notes**
First report should run by July 26 to hit the ≥4-reports target.

---

## XPE-REPORT-02 — Weekly report panel in ops dashboard

**Problem**
Generated reports need to be readable in the admin dashboard for demo and submission screenshots.

**Feature description**
A panel lists generated weekly reports, newest first, readable in full.

**Implementation Details**
- Read `reports`; list by week; expand to read the full narrative. In ops/admin.

**Acceptance criteria**
- [ ] All generated reports are listed by week
- [ ] Full report text is readable
- [ ] Newest-first
- [ ] Admin-only

**Effort estimate**
S — read + render.

**Dependencies**
XPE-REPORT-01, XPE-OPS-01.

**XPRIZE relevance**
AI-Native Operations — the demo-ready surface for the reports.

**Notes**
Screenshot source for the submission's product evidence.

---

## Settings & Privacy/Compliance

## XPE-SET-01 — Analytical frameworks toggle (12 frameworks, off by default)

**Problem**
Some users want their insights framed through a specific lens (Jungian, Stoic, etc.), but it must be opt-in so the default tone stays warm, not clinical.

**Feature description**
Users can optionally enable one or more interpretive frameworks that change how Gemini frames insights.

**Implementation Details**
- File: `src/app/(dashboard)/settings/page.tsx`, framework list in config.
- Twelve frameworks: Theravada Buddhist, Freudian, Jungian, Hermetic, Advaita Vedanta, Taoist, Attachment Theory, IFS, CBT, DBT, Stoic, Gnostic. Off by default. Selected frameworks are passed into the analysis/Yggi prompts.
- Fires `settings_opened`.

**Acceptance criteria**
- [ ] All twelve frameworks are listed, off by default
- [ ] Enabling a framework changes how insights are framed
- [ ] Setting persists per user
- [ ] Fires `settings_opened`

**Effort estimate**
M — settings UI + prompt integration.

**Dependencies**
LAU-AI-02, XPE-YGGI-02.

**XPRIZE relevance**
Category Impact — supports diverse self-understanding lenses.

**Notes**
Default OFF is a deliberate persona decision (Rosa disengages if it feels clinical).

---

## XPE-PRIV-01 — Explicit consent with logged Firestore timestamp

**Problem**
A credible privacy story for judges (and basic compliance) requires explicit, logged user consent.

**Feature description**
Users give explicit consent at signup; the consent and its timestamp are recorded.

**Implementation Details**
- At signup, present consent; on agree, write `consentGiven: true` + `consentTimestamp` to the user doc.
- This is an "accept terms" action — only the user can confirm it; never auto-accept.

**Acceptance criteria**
- [ ] Consent is presented at signup
- [ ] Consent + timestamp are written to the user doc
- [ ] User cannot proceed without explicit consent
- [ ] Consent is never auto-accepted programmatically

**Effort estimate**
S — consent UI + write.

**Dependencies**
LAU-AUTH-04.

**XPRIZE relevance**
Business Viability — credible data handling strengthens the submission.

**Notes**
Explicit consent + timestamped logging is the primary privacy/compliance lever for XPRIZE. Pairs with keeping all AI calls within the Gemini API for the clean "Google-native" data-handling story.

---

## XPE-PRIV-02 — Full data deletion pipeline

**Problem**
Account deletion must remove all user data (Firestore + Storage + embeddings/connections), both for compliance and trust.

**Feature description**
Deleting an account permanently removes all of the user's data across every store.

**Implementation Details**
- File: `functions/src/deleteUserData.ts`.
- On account deletion request: delete the user's entries (incl. embeddings), goals, journeys, connections, feedback, subscription record, Storage files, and the auth user.
- This is a destructive action: require explicit user confirmation in the UI; the deletion runs server-side via Admin SDK.

**Acceptance criteria**
- [ ] Deletion removes entries, embeddings, goals, journeys, connections, feedback
- [ ] Storage files for the user are removed
- [ ] The auth user is deleted
- [ ] Requires explicit user confirmation before running
- [ ] No orphaned user data remains in any store

**Effort estimate**
M — multi-store deletion + confirmation.

**Dependencies**
LAU-SCAF-03, all data-model tickets.

**XPRIZE relevance**
Business Viability — completeness of the privacy/compliance story.

**Notes**
Verify nothing is left behind in vectors/connections — easy to miss.

---

## XPE-SET-02 — Data export (Pro)

**Problem**
Therapy Tom needs to export data to bring to sessions; export is a Pro value driver.

**Feature description**
Pro users can export their journal data.

**Implementation Details**
- File: `src/components/settings/DataExport.tsx`.
- Export entries + analyses (+ optionally insights) to a downloadable file (JSON/Markdown). Pro-gated.
- Fires `data_exported`.

**Acceptance criteria**
- [ ] Pro user can export their data to a downloadable file
- [ ] Export includes entries and their analyses
- [ ] Free user sees the upgrade prompt
- [ ] Fires `data_exported`

**Effort estimate**
S — serialize + download + gate.

**Dependencies**
LAU-STRIPE-05.

**XPRIZE relevance**
Business Viability — a concrete Pro upgrade reason (Tom's scenario).

**Notes**
Download is the user's own data to their own device — low risk.

---

---

# 🌱 STRETCH BAND

*Cut these first if time runs short. They expand growth and business surface area but are not required to submit.*

---

## STR-SHARE-01 — Anonymized shareable insight card

**Problem**
Organic acquisition needs a shareable artifact, but users won't share raw journal content.

**Feature description**
Users can generate an anonymized insight card to share on social, exposing no private text.

**Implementation Details**
- File: `src/components/share/ShareCard.tsx`.
- Render an on-brand card from an insight's *abstract* signal (theme/pattern, not raw content). Export as image. Verify no private content leaks.
- Publishing/posting is the user's action — provide the image; never auto-post.

**Acceptance criteria**
- [ ] Card shows an anonymized insight (no raw entry text)
- [ ] Card is on-brand and image-exportable
- [ ] No private content is exposed in the output
- [ ] Sharing is user-initiated, not automatic

**Effort estimate**
M — card render + image export + privacy review.

**Dependencies**
LAU-AI-03.

**XPRIZE relevance**
Business Viability — organic acquisition mechanic.

**Notes**
Privacy review is mandatory before this ships — anonymization must be real.

---

## STR-COHORT-01 — Shared space data model (Studio foundation)

**Problem**
A future Studio tier (therapist + client / cohorts) needs a data model that doesn't get foreclosed now — but nothing should be built or marketed for XPRIZE.

**Feature description**
A minimal shared-space schema exists so future cohort journaling is possible, without building the feature.

**Implementation Details**
- Define a `spaces` schema (owner, members, shared-insight refs) in `docs/` only, or a non-wired schema. NO UI, NO marketing.
- Ensure entry/insight schemas don't block later sharing.

**Acceptance criteria**
- [ ] A documented shared-space schema exists
- [ ] No user-facing cohort feature is shipped
- [ ] Existing schemas don't foreclose future sharing
- [ ] Nothing about Studio is marketed

**Effort estimate**
S — schema/doc only.

**Dependencies**
None.

**XPRIZE relevance**
Business Viability — signals roadmap/expansion to judges without scope creep.

**Notes**
Explicitly out of build scope for XPRIZE per PRD; this is design-only insurance.

---

# 📦 SUBMISSION BAND

*The Devpost package. Most are not code; assign as scoped tasks August 1–17. Scope freeze ~3 weeks before Aug 17.*

---

## SUB-01 — Repo prepared + shared with judges

**Problem**
The submission requires the GitHub repo shared with specific judging addresses.

**Feature description**
The repo is clean, documented, and shared with the required accounts.

**Implementation Details**
- README with setup, architecture overview, stack. Share `github.com/astrayama/yggdrasil` with `testing@devpost.com` and `judging@hacker.fund`.
- Sharing a repo is an access-control change — Bel performs the actual share; this ticket prepares everything and stages the action.

**Acceptance criteria**
- [ ] README documents setup and architecture
- [ ] Repo is clean (no secrets, no dead scaffolding)
- [ ] Repo shared with both required addresses
- [ ] Build instructions verified on a fresh clone

**Effort estimate**
M — README + cleanup + share.

**Dependencies**
Launch band complete.

**XPRIZE relevance**
Required submission deliverable.

**Notes**
Verify no API keys or secrets are committed before sharing.

---

## SUB-02 — 3-minute demo video (AI live in production)

**Problem**
The submission requires a 3-minute video showing AI executing key decisions in production.

**Feature description**
A 3-minute video demonstrating the live app and its AI-native operations.

**Implementation Details**
- Script: onboarding → first insight → Yggi → Hidden Connections → ops dashboard (weekly report + Cirq path rate). Record against the live production app.

**Acceptance criteria**
- [ ] Video is ≤3 minutes
- [ ] Shows AI live in production (not mocked)
- [ ] Covers insight generation, Yggi, Hidden Connections, ops dashboard
- [ ] Clear audio and legible screen capture

**Effort estimate**
L — scripting + recording + editing.

**Dependencies**
XPE-OPS-02, XPE-OPS-03, XPE-REPORT-02, XPE-HC-06.

**XPRIZE relevance**
Required submission deliverable — the primary judging artifact.

**Notes**
Record after scope freeze so nothing changes underneath the demo.

---

## SUB-03 — Written narrative (500–1000 words)

**Problem**
The submission requires a narrative on AI vs. human roles and the opportunities created.

**Feature description**
A 500–1000 word narrative framed around Education & Human Potential.

**Implementation Details**
- Cover: AI vs. human division of labor, jobs/opportunities created, the Hidden Connections technical differentiator, and the longitudinal growth human-impact story.

**Acceptance criteria**
- [ ] 500–1000 words
- [ ] Addresses AI vs. human roles
- [ ] Addresses jobs/opportunities created
- [ ] Frames Yggdrasil within Education & Human Potential

**Effort estimate**
M — drafting + revision.

**Dependencies**
None (can draft early).

**XPRIZE relevance**
Required submission deliverable.

**Notes**
Bel owns voice; can draft early and finalize after the demo.

---

## SUB-04 — Revenue + expenses evidence export

**Problem**
The submission requires real revenue evidence and an expenses disclosure.

**Feature description**
A packaged export of Stripe revenue and a marketing/CAC expense disclosure.

**Implementation Details**
- Export the Stripe dashboard revenue evidence. Compile marketing + customer-acquisition spend into a disclosure doc.

**Acceptance criteria**
- [ ] Stripe revenue export is included
- [ ] Shows real paying subscribers (target ≥5, ≥$25 MRR)
- [ ] Marketing/CAC expenses are disclosed
- [ ] Figures are consistent with the live dashboard

**Effort estimate**
S — export + compile.

**Dependencies**
LAU-STRIPE-03 + real users.

**XPRIZE relevance**
Required submission deliverable — Business Viability evidence.

**Notes**
Depends on real revenue accruing; start user acquisition early.

---

## SUB-05 — Product + customer evidence package

**Problem**
The submission requires agent execution logs, API usage records, screenshots, and real customer testimonials.

**Feature description**
A compiled package of operational evidence and customer testimonials.

**Implementation Details**
- Export ops-dashboard logs (insight generations, weekly reports, Cirq path rate), API usage records, key screenshots. Gather customer contact info + testimonials (from NPS promoters, with consent).

**Acceptance criteria**
- [ ] Agent execution logs are exported (from the ops dashboard)
- [ ] API usage records and screenshots are included
- [ ] At least the required real customer contacts + testimonials are gathered (with consent)
- [ ] Everything is consistent with the live product

**Effort estimate**
M — compile logs + gather testimonials.

**Dependencies**
XPE-OPS-02, XPE-REPORT-02, XPE-NPS-02.

**XPRIZE relevance**
Required submission deliverable — AI-Native Operations + Business Viability evidence.

**Notes**
Testimonials need explicit customer consent before inclusion.

---

# Appendix A — Critical path (build order)

The fastest route to a paying user, in dependency order:

1. **Scaffold:** LAU-SCAF-01 → 02 → 03 → (04 rules, 05 theme in parallel)
2. **Auth:** LAU-AUTH-01 → 02 → 03 → 04
3. **Journal + AI loop:** LAU-JRNL-01 → 04 → LAU-AI-01 → 02 → 03 (this is the core "aha")
4. **Embeddings/search:** LAU-EMBED-01 → 02 → 03 (unblocks search, RAG, HC)
5. **Monetization:** LAU-STRIPE-01 → 02 → 03 → 04 → 05 → 06 → 07
6. **Analytics:** LAU-ANLY-01 (early, so events exist as features land) → 02, 03
7. **Ship:** LAU-DEPLOY-01 → 02 → 03

Once that's live with real users, XPRIZE-edge in roughly this order: **Onboarding → Yggi → Hidden Connections → Ops dashboard + Weekly reports + NPS → Knowledge Graph / Longitudinal / Insights polish → Privacy hardening.**

# Appendix B — Parallelizable tracks (for collaborators)

These have few cross-dependencies and can run alongside the critical path once scaffold + auth + theme exist. Assign as self-contained tickets (no synchronous coordination needed):

- **UI components track:** LAU-JRNL-02, LAU-JRNL-03, LAU-ANLY-01, XPE-ROOTS-05, XPE-ROOTS-06, XPE-SET-01
- **Cirq/Python track (e.g. stealthy):** XPE-HC-01, XPE-HC-02 — isolated service, minimal app coupling
- **Analytics wiring track:** LAU-ANLY-02, LAU-ANLY-03 — wire as features land
- **Data/AI track (e.g. pplljjhhbkl):** XPE-ROOTS-02, XPE-KG-01, XPE-INSIGHT-03
- **Insights viz track:** XPE-INSIGHT-01, 02, 04, XPE-KG-02, XPE-LONG-01 (after data tickets)
- **Submission docs track:** SUB-03 can start early; SUB-01 README anytime after scaffold

# Appendix C — Open questions blocking specific tickets

These are unresolved per the PRD; the tickets above ship with documented defaults but need Bel's calls:

| Question | Blocks |
|---|---|
| Full polarity × intensity → label lookup table (How We Feel vocab) | LAU-JRNL-03 |
| Exact Yggi onboarding prompt copy | XPE-ONBRD-01 |
| Minimum entry count before Cirq produces meaningful results | XPE-HC-03 |
| Max connection pairs to surface before UX gets noisy | XPE-HC-03, XPE-HC-06 |
| "Basic" vs "Full" Knowledge Graph on free tier | XPE-KG-01 |
| Whether to surface Cirq vs. fallback distinction in the demo | SUB-02 |
| Cirq cost per call at scale | XPE-HC-03 (flag if unit economics break) |

---

*Yggdrasil · Screen Sage Studios · Build with Gemini XPRIZE · Education & Human Potential · Deadline August 17, 2026*
---

## Change history

| Version | Date | Change |
|---|---|---|
| 1.0 | June 2026 | Initial backlog import |
| 1.1 | July 2026 | Marked OBSOLETE (Linear board is the source of truth); stale tagline and gemini-2.0-era model strings updated to current so they can't be copied from here |
