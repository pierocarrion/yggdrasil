# Yggdrasil — Entry Analysis Schema

**Canonical reference for `EntryAnalysis`. Do not improvise field names or types.**

The two-phase Gemini call in `functions/src/gemini/analyzeEntry.ts` produces this object and writes it to `users/{userId}/entries/{entryId}/analysis/{analysisId}` in Firestore. The TypeScript source of truth is `types/journal.ts`.

---

## Two-phase process

**Phase 1 — Depth scoring**

A lightweight Gemini call scores the entry on a 1–11 scale and returns a single integer. The score reflects the psychological and emotional richness of the entry:

| Score | Meaning |
|---|---|
| 1–2 | Very brief or surface-level (a one-liner, a grocery list accidentally saved) |
| 3–5 | Normal reflective entry — feelings mentioned, but not deeply explored |
| 6–8 | Substantive introspection — named emotions, personal patterns, self-questioning |
| 9–11 | Deep or crisis-level — strong emotional weight, shadow material, major life themes |

The score is stored as `depthScore` on the analysis document so it is queryable from the ops dashboard.

**Threshold:** `depthScore >= 3` unlocks `interpretation.frameworks_applied` and `interpretation.depth_analysis` in Phase 2. These fields are omitted (absent, not null) when `depthScore < 3`.

**Phase 2 — Comprehensive analysis**

A single Gemini prompt returns the 13-field JSON object below. The prompt instructs the model to return JSON only (no prose, no markdown fences). The function strips fences defensively before parsing.

---

## The 13 fields

The object has 6 top-level fields and 1 nested `interpretation` object with 7 sub-fields.

### Top-level fields (6)

#### 1. `entities`

```ts
entities: { type: 'person' | 'place' | 'event' | 'concept'; name: string }[]
```

Key people, places, events, and concepts mentioned in the entry. Every entity is categorised.

Examples:
```json
[
  { "type": "person", "name": "Sarah" },
  { "type": "place", "name": "the office" },
  { "type": "event", "name": "therapy session" },
  { "type": "concept", "name": "perfectionism" }
]
```

---

#### 2. `themes`

```ts
themes: string[]  // up to 5 items
```

Overarching topics of the entry. Maximum 5. Single-phrase labels, not sentences.

Examples: `["work stress", "self-doubt", "relationship conflict"]`

---

#### 3. `emotions`

```ts
emotions: { label: string; polarity: number; intensity: number }[]
```

Emotional tones detected in the entry. Each emotion carries two scores on the same 0–10 scale used by the user-facing mood sliders:

- `polarity` — `0–10`; `5` = neutral; lower = negative valence; higher = positive valence
- `intensity` — `0–10`; `5` = moderate; lower = mild; higher = intense

Examples:
```json
[
  { "label": "anxious", "polarity": 2, "intensity": 8 },
  { "label": "hopeful", "polarity": 7, "intensity": 4 }
]
```

Note: these scores are Gemini's read of the entry text. They are separate from the user's voluntary mood slider input (`JournalEntry.mood`).

---

#### 4. `keywords`

```ts
keywords: string[]
```

Significant terms from the entry — single words or short phrases that are meaningful for search, tagging, and the knowledge graph.

Examples: `["boundaries", "mother", "Sunday", "burnout"]`

---

#### 5. `summary`

```ts
summary: string
```

A 2–3 sentence neutral summary of what the entry is about. Written in third person. No interpretation — just what the user said.

---

#### 6. `safety_concerns`

```ts
safety_concerns: { flagged: boolean; concerns: string[] }
```

Crisis and harm detection output. `flagged` is `false` and `concerns` is empty for the vast majority of entries. When `flagged` is `true`, `concerns` contains plain-language descriptions of the detected risk — do not expose these raw strings in user-facing UI without review.

Examples:
```json
{ "flagged": false, "concerns": [] }
{ "flagged": true, "concerns": ["user expressed thoughts of self-harm"] }
```

---

### Nested `interpretation` object (7 sub-fields)

```ts
interpretation: Interpretation
```

#### 7. `interpretation.main_insight`

```ts
main_insight: string
```

The core psychological or spiritual interpretation of the entry. One or two sentences. Written in the warm, reflective tone of the Yggi persona — not clinical.

---

#### 8. `interpretation.questions`

```ts
questions: string[]  // 3–5 items
```

Reflective questions for the user to sit with after reading the insight. These are displayed on the insight card. Warm, open-ended, non-diagnostic.

---

#### 9. `interpretation.action_items`

```ts
action_items: string[]
```

Concrete, gentle suggestions for what the user might do next. Not prescriptive — phrased as invitations.

---

#### 10. `interpretation.patterns_identified`

```ts
patterns_identified: string[]
```

Named cognitive distortions, behavioural patterns, or recurring emotional dynamics detected in the entry. Examples: `"catastrophising"`, `"people-pleasing"`, `"avoidance of conflict"`.

---

#### 11. `interpretation.growth_connection`

```ts
growth_connection: string
```

A one or two sentence observation linking this entry's themes to the user's broader self-development journey — not a single session, but the arc visible across the journal history. Gemini uses available entry context to make this connection.

---

#### 12. `interpretation.frameworks_applied` *(depth ≥ 3 only)*

```ts
frameworks_applied?: string[]
```

Which of the 12 analytical frameworks were relevant to this entry's interpretation. Only populated when `depthScore >= 3` AND the user has enabled at least one framework in Settings. Absent (not `null`) otherwise.

The 12 available frameworks: Theravada Buddhist, Freudian, Jungian, Hermetic, Advaita Vedanta, Taoist, Attachment Theory, IFS, CBT, DBT, Stoic, Gnostic.

Examples: `["Jungian", "Attachment Theory"]`

---

#### 13. `interpretation.depth_analysis` *(depth ≥ 3 only)*

```ts
depth_analysis?: string
```

Deeper psychological or spiritual themes, including unconscious material, shadow elements, or archetypal dynamics. A short paragraph. Only populated when `depthScore >= 3`. Absent (not `null`) otherwise.

---

## Optional fields (gated by user Settings — not part of the 13)

These 4 fields exist on the `EntryAnalysis` type for when the corresponding settings are enabled. They are not part of the core 13-field object and must never be treated as required. **Note (verified July 2026):** the current `analyzeEntry.ts` prompt does not request these fields, so they are never populated today — treat them as reserved.

```ts
chakra_tags?: string[]
tarot_tags?: string[]
sacred_geometry?: string[]
archetype_tags?: string[]
```

---

## Full TypeScript interface

```ts
// From types/journal.ts — use these types everywhere; do not redefine inline

export interface AnalysisEntity {
  type: 'person' | 'place' | 'event' | 'concept';
  name: string;
}

export interface AnalysisEmotion {
  label: string;
  polarity: number; // 0–10; 5 = neutral
  intensity: number; // 0–10; 5 = moderate
}

export interface SafetyConcerns {
  flagged: boolean;
  concerns: string[];
}

export interface Interpretation {
  main_insight: string;
  questions: string[];            // 3–5 items
  action_items: string[];
  patterns_identified: string[];
  growth_connection: string;
  frameworks_applied?: string[];  // depth >= 3 only
  depth_analysis?: string;        // depth >= 3 only
}

export interface EntryAnalysis {
  id?: string;
  entryId?: string;
  depthScore: number;             // 1–11; phase 1 output
  entities: AnalysisEntity[];
  themes: string[];               // up to 5
  emotions: AnalysisEmotion[];
  keywords: string[];
  summary: string;                // 2–3 sentences
  safety_concerns: SafetyConcerns;
  interpretation: Interpretation;
  chakra_tags?: string[];
  tarot_tags?: string[];
  sacred_geometry?: string[];
  archetype_tags?: string[];
}
```

---

## Firestore document structure

```
users/{userId}/entries/{entryId}/analysis/{analysisId}
  depthScore: number
  entities: [{ type, name }, ...]
  themes: string[]
  emotions: [{ label, polarity, intensity }, ...]
  keywords: string[]
  summary: string
  safety_concerns: { flagged: boolean, concerns: string[] }
  interpretation: {
    main_insight: string
    questions: string[]
    action_items: string[]
    patterns_identified: string[]
    growth_connection: string
    frameworks_applied?: string[]   // omitted when depthScore < 3
    depth_analysis?: string         // omitted when depthScore < 3
  }
  entryId: string
  createdAt: Timestamp
```

Two behaviours to know (verified against `analyzeEntry.ts`, July 2026):

- **Denormalized copy** — the same analysis object is also written onto the parent entry doc as `entry.analysis`, so graph/API reads don't fan out to the subcollection. If you change the shape, update both writes.
- **Free insight gate** — when the free-tier gate applies (`insightGated: true`), the persisted analysis is trimmed to `depthScore` plus the 6 top-level fields only; the `interpretation` object is omitted entirely.

## `analysisStatus` on the parent entry

The parent `entries/{entryId}` document tracks analysis state via `analysisStatus`:

| Value | Meaning |
|---|---|
| `'pending'` | Entry saved; analysis not yet complete |
| `'complete'` | Analysis written successfully |
| `'error'` | Analysis failed; safe to retry |

The entry is never deleted on failure — only `analysisStatus` changes to `'error'`.

---

## Prompt requirements for `analyzeEntry.ts`

- Instruct the model to return **JSON only** — no prose, no markdown fences — and request `responseMimeType: 'application/json'`.
- Parse defensively before `JSON.parse()`: Phase 1 strips fences (`text.replace(/^```json\n?/i, '').replace(/```$/i, '').trim()`); Phase 2 extracts the first `{…}` block via `response.match(/\{[\s\S]*\}/)`.
- Phase 2 prompt must specify exact field names as listed above.
- Pass `depthScore` into the Phase 2 prompt so the model knows whether to populate `frameworks_applied` and `depth_analysis`.
- Pass the list of user-enabled frameworks (from Settings) when `depthScore >= 3`; omit those fields from the prompt entirely when `depthScore < 3`.

---

*Last updated: June 2026 · Owner: Isa · Do not edit field names after `analyzeEntry.ts` is wired to downstream features.*

---

## Change history

| Version | Date | Change |
|---|---|---|
| 1.0 | June 2026 | Initial schema doc |
| 1.1 | July 2026 | Changelog added; verified against analyzeEntry.ts — corrected drift: Phase 2 JSON extraction (regex block match, not fence strip), gated-analysis trimming, denormalized `entry.analysis` copy, optional chakra/tarot/geometry/archetype fields marked reserved (not requested by the current prompt) |
