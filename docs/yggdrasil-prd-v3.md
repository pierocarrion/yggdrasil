# Yggdrasil — Product Requirements Document

**Project:** Yggdrasil (full product — new stack)
**Author:** Isa
**Status:** In development — new stack scaffold started (minimal)
**Version:** 3.1

---

## Change history

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | June 2026 | Isa | First draft |
| 2.0 | June 2026 | Isa | Removed Studio tier from user-facing scope; added Studio future-state paragraph; updated mood tracking to 2-slider system (polarity × intensity, 0–10, derived label); removed company name references; corrected free tier to Free + Pro only |
| 3.0 | June 2026 | Isa | Switched vector search from Vertex AI to Firestore KNN to reduce infrastructure costs (Vertex AI remains migration target at scale); updated analytics fallback path value from `fallback_vertex` to `fallback_knn`; corrected analytics event count (25 → 29); fixed weekly AI reports target start date (July 26); added Knowledge Graph as explicit P1 requirement; clarified Gemini integration as single call with 2-phase process |
| 3.1 | July 2026 | Isa | Model defaults corrected to gemini-3.5-flash / gemini-embedding-001; tagline updated; Goals/Journeys replaced by the Living Tree model (see spec §3.3) |

---

## Overview

Yggdrasil is an AI-powered semantic journaling web app that transforms personal writing into a dynamic, evolving picture of the writer's inner world. Users write journal entries naturally; a single Gemini call runs a two-phase analysis on each entry, extracting themes, emotions, people, and patterns across 13 structured fields. The app surfaces these as insights, a visual knowledge graph, and non-obvious connections between entries discovered by quantum-inspired graph analysis.

We are rebuilding from scratch on a Google-native stack (Next.js + Firebase + Gemini API + Google Cirq + Cloud Run) and submitting to the Build with Gemini XPRIZE hackathon (Education & Human Potential, $2M prize pool, deadline August 17, 2026).

The prototype (Lovable, React + TypeScript + Supabase) is reference material only. Nothing is migrated.

---

## Objectives

**For the user:**
- Let people discover patterns in their own writing that they could not find manually
- Make journaling feel like understanding, not archiving
- Deliver an "aha" moment within the first session

**For the project:**
- Ship a production app with real users and real revenue before August 17, 2026
- Satisfy all three XPRIZE judging criteria: Business Viability, AI-Native Operations, Category Impact
- Establish a subscription revenue base that demonstrates growth potential

---

## Success metrics

| Metric | Target | How measured |
|---|---|---|
| Paying subscribers by Aug 17 | ≥5 | Stripe dashboard |
| MRR by Aug 17 | ≥$25 | Stripe dashboard |
| 7-day return rate after first insight | ≥50% | Firebase Analytics: % of users who fire `entry_created` again within 7 days of `seed_entry_analyzed` |
| Median time to first insight (onboarding) | ≤60 seconds | Time between `onboarding_started` and `seed_entry_analyzed` |
| Yggi average turn count per session | ≥3 | `yggi_message_sent.conversation_turn_count` |
| Hidden Connections Cirq path rate | ≥30% of computations | `hidden_connections_computation` where `path = 'cirq'` |
| AI-generated business reports by Aug 17 | ≥4 | Admin ops dashboard log (1/week from July 26) |

**Baseline (Lovable prototype):** 9 signups, 4 active users, 2 paying users, $0 recurring MRR. All new-stack metrics start from zero.

---

## Messaging

**Tagline:** Your journal, grown into a living map of you.

**One-sentence value prop:** Yggdrasil reads what you write, finds the patterns you can't see, and reflects your inner world back to you through AI-powered insights, a living knowledge graph, and a companion that knows your whole story.

**What makes it different:** Most journaling apps store what you write. Yggdrasil analyses it — automatically, on every save — and builds a growing picture of who you are and how you're changing.

---

## Timeline

| Milestone | Date |
|---|---|
| P0 complete (scaffold, auth, Gemini, Stripe, Analytics, Cloud Run) | June 21, 2026 |
| P1 design complete (onboarding, core UI, Yggi) | July 4, 2026 |
| P1 engineering complete (Hidden Connections, Insights, Living Tree, Longitudinal view) | July 18, 2026 |
| AI-native ops dashboard live | July 26, 2026 |
| Real users active, revenue evidence accumulating | August 10, 2026 |
| Submission package assembled | August 17, 2026 |

---

## Personas

### Primary — Reflective Rosa

Rosa is a self-aware adult in her late 20s to 40s doing active personal growth work. She journals 3–5x/week, mostly late evenings. She's tried other journaling apps and left because the experience felt like archiving, not understanding. She's willing to pay for something that reflects her patterns back to her.

**Key product decision this persona drives:** The app's tone must be warm and spiritually intelligent, not clinical. Yggi must feel like a reflective companion, not a diagnostic assistant. The analytical frameworks toggle (Jungian, attachment theory) must be opt-in and off by default.

### Secondary — Therapy Tom

Tom is in his 30s and journals to support active therapy work. He writes 1–2x/week. His primary use is capturing what happened between sessions and optionally exporting or sharing insights to bring to his therapist. He will not explore features on his own — the simplest path to value must be obvious from the first screen.

**Key product decision this persona drives:** The entry composer must be the first thing a new user sees, with zero configuration required before writing. Export functionality (Pro) must be easy to find. The therapist-side experience is limited to data export in v1 — no therapist portal.

---

## User scenarios

### Scenario 1 — Rosa's first hidden connection

Rosa is six weeks into using Yggdrasil and has written 18 entries across a rough stretch at work and a breakup. It's 11pm and she opens the Insights tab. In the Hidden Connections section she sees a line connecting two entries three weeks apart — one about her manager's tone in a meeting, one about her ex. The label reads "both triggered the same shame response."

She taps the connection and reads both entries side by side for the first time. She opens Yggi and asks why these entries are linked. Yggi explains the shared emotional fingerprint and gently asks if this pattern shows up elsewhere. Rosa screenshots it to share with her therapist. She opens a new entry to write about the realisation. Before closing the app, she upgrades to the annual plan.

### Scenario 2 — Tom's pre-session export

Tom has a therapy session tomorrow. He opens Yggdrasil to review the last two weeks. He goes to Entries, scans his entries with the tag browser, and finds a cluster tagged "work stress." He opens the Insights tab, looks at the mood chart for the period, and takes a screenshot of the emotional pattern view to show his therapist. He briefly opens Yggi to ask what the main theme has been lately. Yggi summarises the last fortnight in two sentences. Tom copies the summary and pastes it into his notes app to bring to the session.

### Scenario 3 — Rosa's onboarding

Rosa downloads Yggdrasil on a Saturday morning. She has five minutes. The onboarding screen asks: "what's one thing on your mind right now?" She writes a short paragraph about feeling stuck at work. Within 45 seconds, the insight card appears: Yggdrasil has detected a "transition anxiety" theme and surfaces a relevant observation. Yggi says: "when you're ready, I'll watch for how this evolves." Rosa doesn't configure anything. She returns that evening to write her second entry.

### Scenario 4 — Goal suggestion from journal patterns

Rosa has been journaling for three weeks. On a Wednesday, she opens the Living Tree tab and sees a suggested goal: "Establish a boundary at work." Below it: "Suggested based on patterns in 4 of your recent entries." She taps it and reads the reasoning — Yggdrasil found a recurring theme of overcommitment in her recent writing. She accepts the goal with one tap. That week, two of her entries are automatically linked to the goal by Yggdrasil. At the end of the month, she marks it complete.

---

## Requirements

### P0 — Blockers

These must be done before anything else ships.

**P0-1: Stack scaffold**
As any user, I want to be able to sign up, log in, and reach the main app so that I can begin using Yggdrasil.
- Firebase Auth: email/password + Google Sign-In
- Firestore database initialised
- `/(dashboard)/layout.tsx` auth gate
- Cloud Run deployment: containerised Next.js, production domain, HTTPS

**P0-2: Gemini integration**
As Rosa, I want my entries to be analysed automatically on save so that I receive insights without having to do anything manually.
- Single Gemini API call per entry on save (async, background); two-phase: depth scoring (1–11) then one comprehensive prompt returning a 13-field JSON object
- `gemini-3.5-flash` default; upgrade only with documented reason
- `insight_generated` Analytics event fires on completion
- Subtle "Yggdrasil is thinking…" indicator shown to user post-save; not a blocking spinner

**P0-3: Stripe subscription flow**
As a user who has used their 5 free entries, I want to be able to subscribe to Pro so that I can continue using the full product.
- Two user-facing tiers: Free and Pro
- Three Stripe products: Pro Monthly ($4.99/mo), Pro Annual ($44.99/yr), Lifetime ($149 one-time)
- `/pricing` page: three plan cards; Annual has "Most Popular" badge; Lifetime has "Founding Member" label
- `create-checkout` Cloud Function accepts `plan_type: 'monthly' | 'yearly' | 'lifetime'`
- `stripe-webhook` handles: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- Subscription status stored in Firestore `subscriptions/{userId}`; enforced by `<FeatureGate>` component
- Free tier limits enforced per-feature by `check-trial-status` (counts analyzed entries and Living Tree roots against tier caps; the trunk is nested in its root, so there is no separate journey cap)
- `paywall_viewed`, `subscription_started` Analytics events fire at the appropriate steps

**P0-4: Firebase Analytics**
As Isa, I want all significant user actions instrumented so that I have usage evidence for the XPRIZE submission.
- All 29 events across 5 categories typed in `lib/analytics.ts` and wired throughout the app
- See full event reference in the product spec

**P0-5: Cloud Run deployment**
As Isa, I want the app running on Cloud Run with a production domain and HTTPS so that real users can access it.
- Containerised Next.js deployed to Cloud Run
- Production domain configured, HTTPS enforced

---

### P1 — XPRIZE differentiators

**P1-1: Onboarding flow**
As a new user, I want to receive my first AI insight within 60 seconds of signing up so that I immediately understand what makes Yggdrasil different from a plain journaling app.
- Single prompt on first session ("what's one thing on your mind right now?") — no setup screens
- Gemini analysis runs immediately on seed entry
- Insight card surfaces within 60 seconds
- `onboarding_started`, `onboarding_completed`, `seed_entry_analyzed` Analytics events
- If analysis exceeds 60 seconds: show a brief holding screen, do not surface an error

**P1-2: Journal tab**
As Rosa, I want to write a journal entry with optional mood and entry type so that I can capture what I'm feeling without friction.
- Rich text composer is the default view when the app opens
- Entry type: Reflection / Gratitude / Dream / Event (optional, appears after composer)
- **Mood tracking** (optional, appears after composer — never blocks writing):
  - Polarity slider: 0–10, centre 5 = neutral. Lower = negative valence; higher = positive valence.
  - Intensity slider: 0–10, centre 5 = moderate. Lower = mild; higher = intense.
  - Derived label shown to user, computed from both values using the How We Feel vocabulary (e.g. polarity 8 + intensity 9 → "Ecstatic"; polarity 2 + intensity 8 → "Anguished"; polarity 4 + intensity 2 → "Melancholic")
  - Both raw values and derived label stored in Firestore
- `entry_created` Analytics event fires on save with `has_mood: boolean`

**P1-3: Entries tab**
As Rosa, I want to browse and search my entries so that I can find what I've written by topic or date.
- Chronological entry list
- Full-text search
- Semantic search via Firestore KNN
- Tag browser by AI-extracted topic
- `entry_searched` Analytics event with `search_type: 'full_text' | 'semantic'`

**P1-4: Yggi Chat**
As Rosa, I want to ask Yggi about my journal so that I can explore my patterns in conversation.
- Floating action button (bottom-right); opens right-side drawer
- RAG: Yggi has full access to user's journal history via Firestore KNN vector search
- When opened from an entry or insight view: drawer pre-loads that entry as context
- Tone: warm, reflective, spiritually intelligent — not clinical, not a mood tracker assistant
- `yggi_chat_opened`, `yggi_message_sent` (with `conversation_turn_count`) Analytics events

**P1-5: Living Tree tab**
As Rosa, I want my values and goals to grow out of my journal so that my growth work is grounded in what I'm actually experiencing.
- The Living Tree has five sections: **Roots** — the foundational units, values and goals the user is growing (one entity, distinguished by `kind`; AI suggests new roots from detected journal patterns); **Trunk** — the journey, a timeline of journal entries linked to a root plus events like milestones reached and weekly wins (there is no standalone "Journey" type); **Rings** — dated milestones the root grows toward; **Branches** — this week's practices/habits toward the root (Pro-only "Grow branches" generator; free users add branches manually); **Fruit** — the measurable proof of progress.
- Achievements: milestone badges unlocked by streaks, completions, and usage depth
- `goal_created`, `goal_completed`, `journey_started`, `achievement_unlocked`, `living_tree_viewed` Analytics events (event names are frozen literals)
- Authoritative model: product spec §3.3.

**P1-6: Insights tab**
As Rosa, I want to see how my themes, emotions, and patterns have changed over time so that I can understand my own growth.
- Streak calendar
- Frequency & mood charts — plots both mood dimensions (polarity × intensity) over time
- Semantic cluster map
- Emotional patterns (longitudinal view)
- Hidden Connections section (see P1-7)
- Knowledge Graph section (see P1-8)
- `insights_tab_viewed` Analytics event

**P1-7: Hidden Connections**
As Rosa, I want to discover non-obvious connections between my journal entries so that I can find patterns I could never have found on my own.
- Nightly batch: Cirq quantum graph analysis on the Firestore KNN embedding space
- Silent fallback to Firestore KNN cosine similarity if Cirq fails or is unavailable
- UI is identical regardless of which path ran; user is never shown which path executed
- D3 visualisation of scored connection pairs in the Insights dashboard
- Tapping a connection shows both entries side by side
- Yggi can explain a connection when asked (pre-loads both entries as context)
- `hidden_connections_viewed` Analytics event
- `hidden_connections_computation` Analytics event with `path: 'cirq' | 'fallback_knn'` — logged on every run
- Path also logged to the admin operations dashboard

**P1-8: Knowledge Graph**
As Rosa, I want to see a visual map of how my journal concepts connect so that I can explore my inner world spatially.
- D3.js force-directed visualisation of semantic connections across all entries, accessible from the Insights tab
- Nodes: concepts, people, themes. Edges: semantic similarity via Firestore KNN.
- Interactive — users can explore clusters and drill into individual entries
- `knowledge_graph_viewed` Analytics event

**P1-9: Longitudinal growth view**
As Rosa, I want to see how my themes and emotional patterns have shifted over time so that I can see evidence of my own growth.
- Timeline view of dominant themes, mood trajectory, and goal completions across the full journal history
- Accessible from the Insights tab

**P1-10: AI-native operations dashboard**
As Isa, I want an admin dashboard that shows AI running the business so that the XPRIZE submission can demonstrate AI-native operations.
- Automated insight generation logs (timestamped, per-entry)
- Yggi conversation summaries (Gemini-generated, weekly)
- Pattern detection events
- Weekly report generation — AI-executed, timestamped
- Hidden Connections path log (Cirq vs. fallback rate over time)
- Admin-only route; not visible to end users

---

### P2 — Stretch

**P2-1: Referral / share**
As Rosa, I want to share an anonymised insight card to social media so that I can show what Yggdrasil discovered without exposing my journal content.

**P2-2: Group/cohort journaling and Studio tier foundation**
As a therapist, I want to create a shared space where my client can journal and optionally share insights with me so that I can better support their progress between sessions. This is the foundation for a future Studio tier targeting practitioners.

---

## Features out

| Feature | Decision | Date |
|---|---|---|
| Studio tier (user-facing) | Future tier; out of scope for XPRIZE. Data model should not foreclose it, but nothing is built or marketed. | June 2026 |
| Therapist portal (therapist-side account, client data access) | Export-only therapist interaction in v1. Flagged as P2. | June 2026 |
| Data migration from Lovable prototype | No user data worth migrating. New stack starts fresh. | May 2026 |
| Real-time Hidden Connections on entry save | Nightly batch is sufficient for v1. Cost-appropriate. | June 2026 |
| Manual connection tagging by user | AI discovers, users don't curate. Reduces friction. | June 2026 |
| Vertex AI Vector Search | Replaced with Firestore KNN for cost reasons. Vertex AI remains the target for migration when user scale justifies per-node-hour charges. | June 2026 |

---

## Designs

Lo-fi wireframes for the three core screens (journal composer, entry insight view, Hidden Connections) are in `docs/wireframes/`. Figma designs in progress — link when available.

---

## Open issues

| Issue | Owner | Status |
|---|---|---|
| Minimum entry count before Cirq analysis produces meaningful results | Isa | Open |
| Maximum number of connection pairs to surface before UX becomes noisy | Isa | Open |
| Cirq cost per call at scale — flag if unit economics are problematic | Isa | Open |
| Exact copy for the Yggi onboarding prompt | Isa | Open |
| Derived mood label mapping — full lookup table for all polarity × intensity combinations (using How We Feel vocabulary) | Isa | Open |
| Whether to surface Cirq vs. fallback path distinction in the XPRIZE demo | Isa | Open |
| Definition of "Basic" vs "Full" Knowledge Graph on free tier | Isa | Open |
| Studio tier pricing and feature set | Isa | Deferred post-XPRIZE |

---

## Q&A

**Q: Why not use the Lovable prototype as the base?**
The Lovable stack (Supabase, React without App Router) is incompatible with the XPRIZE requirement to demonstrate Google-native AI integration. The rebuild uses Firebase + Gemini + Cirq + Firestore KNN throughout.

**Q: Why does the free trial use entry count rather than time?**
Time-limited trials create pressure that drives unqualified upgrades and high churn. Entry count gates upgrade intent to users who have actually experienced the product's core value — the AI insight moment — rather than users who just ran out the clock.

**Q: Can collaborators make architecture decisions?**
No. Isa owns all architecture, integration, and technical decisions. If a task spec is unclear, ask before starting. Flag adjacent issues rather than fixing them.

**Q: What happens if Cirq is never reliable enough to run?**
The fallback to Firestore KNN cosine similarity is silent and produces identical UI. The XPRIZE submission needs to show Cirq ran at least some of the time — hence the 30% target. If Cirq cannot reach 30% by submission, we investigate before the deadline.

**Q: Why aren't Goals and Journeys separate data types?**
Earlier versions of this PRD modelled them separately. The Living Tree consolidates them: a root — a value or goal, distinguished by `kind` — is the single foundational unit, and each root carries its own trunk (the journey timeline of linked entries and events). One entity powers AI suggestions cleanly and avoids two parallel UX surfaces. Authoritative model: product spec §3.3.

**Q: What is Studio and when will it be built?**
Studio is a future tier, likely targeting therapists or other practitioners who want to create shared spaces with clients or manage multiple journaling users. Therapy Tom is the client side of that relationship. Nothing is built for Studio during the XPRIZE sprint — the only constraint is that the data model should not actively prevent it later.

**Q: Why switch from Vertex AI to Firestore KNN for vector search?**
Vertex AI Vector Search operates on a per-node-hour pricing model that is cost-effective at scale but expensive during early user acquisition. Firestore KNN vector search is built into the Firebase SDK, carries no additional per-node charges, and is sufficient for the user volumes expected during the XPRIZE build. When the product scales to a point where dedicated vector infrastructure is justified, migrating to Vertex AI (or equivalent) is the plan.

---

## Other considerations

The XPRIZE judging panel reviews submissions against three criteria: Business Viability, AI-Native Operations, and Category Impact. Every feature and milestone in this PRD exists in direct service of at least one of those three criteria. Scope decisions that do not advance at least one criterion should be deferred.

---

*Yggdrasil · Deadline: August 17, 2026*
