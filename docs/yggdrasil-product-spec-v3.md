> ⚠️ **SUPERSEDED by yggdrasil-product-spec-v4.md.** Retained for history; every technical detail below may be wrong.

# Yggdrasil — Product Specification

**Version 3.0 · June 2026**
**Status: New stack scaffold started (minimal). Full rebuild in progress.**

---

> *Your journal, grown into a living map of you.*

---

## 1. Overview

Yggdrasil is an AI-powered semantic journaling web app. Users write journal entries; the app automatically extracts themes, emotions, people, and patterns from each one via a single Gemini call, then surfaces insights, goal suggestions, and a visual knowledge graph of connections across their entire journal history. An AI companion called Yggi has full context over the user's journal via Firestore KNN vector search and can reflect patterns, answer questions, and suggest goals in conversation.

Yggdrasil is entered in the **Build with Gemini XPRIZE hackathon** (Devpost, $2M prize pool, Education & Human Potential category). Submission deadline: **August 17, 2026**.

A functional prototype exists on Lovable (React + TypeScript + Supabase). That codebase is **reference material only** — the current effort is a full rebuild on a clean Google-native stack. No data migration, no legacy code carried over.

---

## 2. Users

### Primary persona — Reflective Rosa

Rosa is a self-aware adult in her late 20s to 40s doing active personal growth work. She journals regularly but has never found a tool that does anything with what she writes beyond storing it. She's tried apps like Day One and Notion; she left because journaling felt like archiving, not understanding. She's willing to pay for something that actually reflects her own patterns back to her.

**Goal:** Understand her emotional patterns across time, not just record individual events.

**Pain:** She journals 3–5 times a week and never connects the dots. She can't see her own themes.

**Key trait:** Spiritually oriented, not clinically oriented. She will disengage if the app feels like a diagnostic tool or a mood tracker for a therapist. The tone must be warm and reflective, not analytical.

**Behaviour:** Writes mostly late evenings. Premium-willing. Likely to share with friends who are also in therapy, journaling communities, or personal development circles.

**Adoption curve position:** Early adopter. Will tolerate rough edges if the core insight experience is compelling.

### Secondary persona — Therapy Tom

Tom is in his 30s and actively working with a therapist. His therapist has recommended journaling between sessions to track mood and notice patterns. Tom journals inconsistently (1–2x/week) because he can't remember what happened by the time his next session rolls around. He wants something simple to write in and optionally share or export for his therapist to reference.

**Goal:** Support his therapy work. Track his emotional arc between sessions. Have something concrete to bring to his next appointment.

**Pain:** Plain journaling apps don't help him see the arc. He forgets context. He can't easily share what matters.

**Key trait:** Will not explore advanced features on his own. Needs the simplest possible entry experience. The app's AI surface area only becomes visible to him once it proves useful in a low-friction way.

**Therapist relationship:** Tom uses Yggdrasil independently. His therapist does not have an account. The only therapist-side interaction is Tom exporting or screenshotting data to bring to sessions. A therapist portal is out of scope for XPRIZE — flagged as P2 future work.

**Tier:** Likely stays on free or monthly. Less likely to pay for annual or lifetime without a strong habit already established.

---

## 3. Features

### 3.1 Journal tab

Rich text entry composer. On save, triggers a single Gemini API call in the background: a two-phase process (depth scoring then comprehensive analysis) returning a JSON object with 13 structured fields covering entities, themes, emotions, keywords, summary, safety concerns, and a nested interpretation object.

**Mood tracking** is two steps, both optional, both appearing after the composer so they never block writing:
- **Polarity slider** — scale of 0–10, centred at 5 (neutral). Left = negative valence (sad, angry, numb); right = positive valence (happy, excited, calm).
- **Intensity slider** — scale of 0–10, centred at 5 (moderate). Low = mild; high = intense.

The two values combine to produce a derived label shown to the user, drawn from the **How We Feel** emotion vocabulary (e.g. polarity 8 + intensity 9 → "Ecstatic"; polarity 2 + intensity 8 → "Anguished"; polarity 4 + intensity 2 → "Melancholic"). Both raw values and the derived label are stored. The mood chart in Insights plots both dimensions over time.

- Entry type: Reflection / Gratitude / Dream / Event (optional)
- Tag support (AI-extracted; user can add manual tags)
- Subtle "Yggdrasil is thinking…" indicator post-save; not a blocking spinner

### 3.2 Entries tab

- Chronological entry list
- Full-text search and semantic search (Firestore KNN)
- Tag browser for navigating by extracted topic
- Each entry links to its generated insight card

### 3.3 Roots tab — Goals & Growth

**Goals** and **Journeys** are distinct data types with separate schemas and UX:

- **Goals** — overarching achievements, end-result focused. AI suggests new goals based on detected journal patterns. Users create, track, and complete goals.
- **Journeys** — collections of journal entries along the way; process- and experience-focused, not destination-focused. Users start a Journey and add entries to it over time.
- **Living Tree** — gamified progression metaphor. The tree grows as the user journals consistently. Visual representation of habit strength.
- **Achievements** — milestone badges unlocked by streaks, goal completions, and usage depth.

### 3.4 Insights tab

Six-section dashboard:

- **Streak calendar** — journaling consistency heatmap
- **Frequency & mood charts** — entry cadence and 2D emotional distribution (polarity × intensity) over time
- **Semantic cluster map** — groups of entries by topic proximity
- **Emotional patterns** — longitudinal view of how emotions and themes evolve over time
- **Hidden Connections** — non-obvious entry relationships surfaced by quantum-inspired graph analysis (see 3.7)
- **Knowledge Graph** — interactive D3.js visualisation of semantic connections across all entries (see 3.6)

### 3.5 Yggi Chat — AI companion

- Floating action button (bottom-right), opens a right-side drawer
- Full-context RAG: Yggi has access to the user's complete journal history via Firestore KNN vector search
- Answers reflective questions, surfaces patterns, suggests goals
- Tone: warm, spiritually intelligent — not a clinical chatbot, not a mood tracker assistant
- Pre-loads entry context when opened from an entry or insight view

### 3.6 Knowledge Graph

A section within the Insights tab:

- D3.js force-directed visualisation of semantic connections across all entries
- Nodes: concepts, people, themes. Edges: semantic similarity via Firestore KNN.
- Interactive — users can explore clusters and drill into individual entries

### 3.7 Hidden Connections (signature feature)

Hidden Connections surfaces relationships between journal entries that classical similarity matching would miss. It is the primary XPRIZE technical differentiator.

**Pipeline:**

1. On entry save, Gemini generates an embedding stored as a Firestore vector field
2. Nightly batch: Google Cirq performs quantum-inspired graph analysis on the embedding space to find non-obvious connection pairs
3. Scored pairs are passed to D3 for visualisation in the Insights dashboard

**Fallback:** Cirq is not always reliable. If Cirq fails or is unavailable, the system silently falls back to Firestore KNN cosine similarity. The UI is identical either way — the user never knows which path ran. Which path executed is logged via the `hidden_connections_computation` Analytics event (`path: 'cirq' | 'fallback_knn'`) and to the admin operations dashboard.

### 3.8 Settings

- Analytical frameworks toggle: Jungian archetypes, attachment theory, etc. — changes how Gemini frames its insights. Opt-in only; off by default. Twelve frameworks available: Theravada Buddhist, Freudian, Jungian, Hermetic, Advaita Vedanta, Taoist, Attachment Theory, IFS, CBT, DBT, Stoic, Gnostic.
- Data export (Pro feature)
- Account deletion

### 3.9 Onboarding

- Guided first session designed to demonstrate Yggi's intelligence immediately
- Single prompt ("what's one thing on your mind right now?") — no setup screens, no configuration
- Goal: deliver a first AI insight within 60 seconds of signup via a seed entry
- `seed_entry_analyzed` Analytics event fires when first insight is delivered

### 3.10 AI-Native Operations Dashboard (admin)

Internal admin-facing dashboard. Required by the XPRIZE submission to demonstrate AI running the business, not just powering a feature.

- Automated insight generation logs (timestamped)
- Yggi conversation summaries (AI-generated)
- Pattern detection events
- Weekly report generation — all AI-executed, logged, and timestamped
- Hidden Connections path log (Cirq vs. fallback rate)

---

## 4. Subscription model

### Tiers

There are two user-facing tiers: Free and Pro. A future Studio tier is noted below but is not in scope for XPRIZE and is not marketed or built in v1.

| Feature | Free | Pro |
|---|---|---|
| Journal entries | Unlimited | Unlimited |
| AI extraction (themes, emotions, etc.) | ✅ | ✅ |
| Entry insights | 5 trial entries, then paywalled | Unlimited |
| Journeys | 3 | Unlimited |
| Goals (Roots) | 5 | Unlimited |
| Knowledge graph | Basic | Full |
| Yggi companion | ❌ | ✅ |
| Hidden Connections | ❌ | ✅ |
| Weekly digest | ❌ | ✅ |
| Data export | ❌ | ✅ |

Free tier limits are enforced per-feature by `check-trial-status`, a function that counts the user's analyzed entries, journeys, goals, etc. against their tier caps and triggers the `/pricing` paywall when a limit is hit.

### Pricing

| Plan | Price | Notes |
|---|---|---|
| Pro monthly | $4.99/month | |
| Pro annual | $44.99/year | Save 25% — "3 months free" framing |
| Lifetime | $149 one-time | "Founding member" pricing — will increase post-launch |

### Future: Studio tier

A Studio tier is planned for a future release. It is not marketed, priced, or built for XPRIZE. The most likely use case is a therapist-facing offering: a practitioner could create a shared space with clients, view exported data, or manage multiple journaling users. The secondary persona (Therapy Tom) is the client side of that relationship; the therapist is the Studio customer. No architecture decisions for Studio should be made during the XPRIZE build — the data model should just not foreclose it.

### Stripe architecture

- Three Stripe products: Pro Monthly, Pro Annual, Lifetime (one-time payment)
- Subscription status stored in Firestore `subscriptions/{userId}`
- Tier read via `useSubscription()` hook, stored in context, enforced by `<FeatureGate>` component
- Stripe Customer created lazily — on first checkout initiation, not on signup
- Webhook handles: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

---

## 5. Technical stack

Everything is Google-native. Nothing is carried over from the Lovable prototype.

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js (App Router, TypeScript) | Server components + API routes |
| Auth | Firebase Auth | Email/password + Google Sign-In |
| Database | Firestore (incl. KNN vector search) | Replaces Supabase Postgres; KNN used for embeddings, semantic search, and RAG |
| File storage | Firebase Storage | |
| AI | Gemini API | `gemini-3.5-flash` default; `gemini-3.5-pro` / `gemini-embedding-001` where needed |
| Knowledge graph | Google Cirq | Quantum-inspired graph analysis for Hidden Connections |
| Backend | Firebase Cloud Functions (TypeScript) | All new |
| Hosting | Cloud Run | Containerised Next.js |
| Analytics | Firebase Analytics | All events typed in `lib/analytics.ts` |
| Payments | Stripe | Existing Stripe account — keep keys |
| Graph visualisation | D3.js | Force-directed knowledge graph and Hidden Connections |

**Rule:** If a Google Cloud product covers the use case, use it over a third-party alternative.

---

## 6. Analytics events

All events are typed in `lib/analytics.ts`. Event names and required properties are exact — do not improvise.

### Journaling

| Event | Properties |
|---|---|
| `entry_created` | `entry_type`, `has_mood`, `tag_count`, `word_count` |
| `entry_edited` | — |
| `entry_deleted` | — |
| `entry_searched` | `search_type: 'full_text' \| 'semantic'` |

### AI & Insights

| Event | Properties |
|---|---|
| `yggi_chat_opened` | — |
| `yggi_message_sent` | `conversation_turn_count` |
| `insight_generated` | — |
| `insights_tab_viewed` | — |
| `hidden_connections_viewed` | — |
| `hidden_connections_computation` | `path: 'cirq' \| 'fallback_knn'` |
| `knowledge_graph_viewed` | — |
| `weekly_wisdom_generated` | — |

### Goals & Growth

| Event | Properties |
|---|---|
| `goal_created` | — |
| `goal_completed` | — |
| `goal_deleted` | — |
| `journey_started` | — |
| `journey_completed` | — |
| `achievement_unlocked` | `achievement_id` |
| `living_tree_viewed` | — |

### Onboarding & Retention

| Event | Properties |
|---|---|
| `onboarding_started` | — |
| `onboarding_completed` | — |
| `seed_entry_analyzed` | — |
| `streak_milestone` | `streak_days` |

### Business

| Event | Properties |
|---|---|
| `subscription_started` | `plan` |
| `subscription_cancelled` | — |
| `subscription_renewed` | — |
| `paywall_viewed` | — |
| `settings_opened` | — |
| `data_exported` | — |

---

## 7. Feature priorities

Scope decisions always favour shipping over perfection. 80% functional in production beats 100% functional in development.

### P0 — Must ship to submit

1. New stack scaffold — Next.js, Firebase Auth, Firestore, Cloud Functions, Cloud Run pipeline
2. Gemini integration — single two-phase call per entry: depth scoring + 13-field JSON; Yggi chat, weekly wisdom, goal suggestions, embeddings
3. Stripe — wire existing account to new stack; subscription flow working end-to-end in production
4. Firebase Analytics — all 29 events across all 5 categories instrumented
5. Cloud Run deployment — containerised Next.js, production domain, HTTPS

### P1 — XPRIZE differentiators

6. AI-native operations dashboard — insight generation logs, Yggi summaries, pattern detection events, weekly AI reports — all timestamped
7. Hidden Connections — Cirq quantum graph analysis + Firestore KNN fallback, D3 visualisation, path logging
8. Knowledge Graph — D3 force-directed visualisation of semantic connections, inside Insights tab
9. Longitudinal growth view — themes, emotions, goals over time
10. Onboarding flow — first AI insight within 60 seconds of signup

### P2 — Stretch

11. Referral / share — anonymised public insight cards for social
12. Group/cohort journaling — shared growth spaces; Studio tier foundation; therapist portal

---

## 8. Design & brand

The visual identity is established. Do not redesign anything.

| Element | Value |
|---|---|
| Primary colour | `#1A3C2E` (forest green) |
| Palette | Earthy tones, nature/tree metaphors, sacred geometry influences |
| Brand voice | Warm, elegant, gentle |
| App tone | Spiritually intelligent, not clinical |
| Metaphors | Trees, roots, growth, the Norse world-tree Yggdrasil |

Do not introduce new colour schemes, clinical UI patterns, or rounded-everything design trends.

---

## 9. Team & working model

Isa leads and owns all architecture, integration, and technical decisions. Collaborators are part-time and variable in number. Tasks are designed to be self-contained and completable without synchronous coordination.

| Role | Responsibilities |
|---|---|
| Isa (lead) | Architecture, system design, all integration work, API wiring, deployment, scope decisions |
| Collaborators | Self-contained implementation tasks: UI components, Cloud Functions, analytics wiring, testing |

**When you receive a task:** It will specify exactly what to build, which files to touch, and what done looks like. If something is unclear, ask before starting. Do not reach outside the task scope. If you spot something adjacent that needs fixing, flag it rather than fixing it.

---

## 10. Coding standards

- TypeScript everywhere — no `.js` files
- Next.js App Router conventions for all pages and API routes
- Firebase SDK v9+ modular imports only
- Write complete implementations — no stubs, no TODOs, no scaffolding
- All AI calls through the Gemini API — no other LLM providers
- Default model: `gemini-3.5-flash` — only upgrade if there is a documented reason

---

## 11. XPRIZE submission requirements

**Deadline: August 17, 2026**

| Deliverable | Notes |
|---|---|
| GitHub repo | Share with `testing@devpost.com` and `judging@hacker.fund` |
| 3-minute demo video | AI live in production executing key decisions |
| Written narrative (500–1000 words) | AI vs. human roles; jobs/opportunities created |
| Revenue evidence | Stripe dashboard export |
| Expenses disclosure | Marketing + customer acquisition spend |
| Product evidence | Agent execution logs, API usage records, screenshots |
| Customer evidence | Real customer contact info + testimonials |

**Judging criteria:** Business Viability · AI-Native Operations · Category Impact

---

## 12. Baseline data (Lovable prototype)

At time of rebuild start:

- 9 total signups
- 4 users made at least one entry
- 2 paying users

All growth metrics on the new stack are measured from zero.

---

*Yggdrasil · Next.js + Firebase + Gemini API + Google Cirq + Cloud Run · Education & Human Potential · Deadline: August 17, 2026*

---

## Change history

| Version | Date | Change |
|---|---|---|
| 3.0 | June 2026 | Final v3 edition |
| 3.0.1 | July 2026 | Marked SUPERSEDED by yggdrasil-product-spec-v4.md; stale tagline and gemini-2.0-era model strings updated to current |
