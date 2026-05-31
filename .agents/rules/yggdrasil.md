# Yggdrasil — Agent Rules

## Stack
- TypeScript everywhere. No JavaScript files.
- Next.js App Router conventions for all pages and API routes.
- Firebase SDK v9+ modular imports only. Never use the compat layer.
- All AI calls go through the Gemini API. No other LLM providers.

## Models
- Default: gemini-2.0-flash
- Only upgrade to gemini-2.0-pro or gemini-embedding-exp if there is a documented reason.
- Batch Cloud Function calls where possible to minimize GCP costs.

## Google-first
- If a Google Cloud product covers the use case, use it over any third-party alternative.
- Firebase/GCP always wins over third-party equivalents.

## Code completeness
- Write complete implementations. No stubs, no TODOs, no scaffolding left for later.
- Every component needs loading and error states.
- Every Cloud Function needs full try/catch and proper logging.

## Analytics
- Every significant user action and every AI/backend process must fire the corresponding Firebase Analytics event.
- All events are typed in `lib/analytics.ts`. Use the typed functions — never call logEvent directly.

## Design
- Primary color: #1A3C2E (forest green)
- Palette: earthy tones, nature/tree metaphors, sacred geometry influences
- Tone: warm, spiritually intelligent — not clinical
- Do NOT introduce new color schemes, rounded-everything trends, or clinical UI patterns.
- Do NOT redesign established screens — match existing aesthetic.

## Scope
- Isabel (project lead) owns architecture decisions.
- Collaborators take scoped, self-contained tasks.
- If a task touches architecture or wiring between subsystems, flag it — don't decide.
- Deadline: August 17, 2026. Ship > perfect.

## Hidden Connections
- Always implement Cirq + Vertex AI fallback as a pair. Never implement one without the other.
- Log which path ran via the `hidden_connections_computation` analytics event every time.
- The UI must never expose which path ran.

## Environment
- Never hardcode API keys or credentials.
- Always use environment variables from `.env.local` (dev) or Secret Manager (prod).
- Stripe: use test keys locally. Never commit real keys.
