---
name: gemini-call
description: How to make Gemini API calls in the Yggdrasil codebase
---

## Client

Import from `@/lib/gemini/client`:

```typescript
import { generateContent, generateJSON, generateEmbedding } from '@/lib/gemini/client';
```

## Text generation

```typescript
const result = await generateContent('Your prompt here');
```

## JSON extraction (structured output)

```typescript
interface MyOutput { field: string; score: number; }
const result = await generateJSON<MyOutput>(`
  Return ONLY valid JSON matching this shape: { "field": string, "score": number }
  
  Input: ${userContent}
`);
```

## Embeddings

```typescript
const embedding = await generateEmbedding(entryContent);
// Returns number[] — store in Vertex AI
```

## Model selection

- Default: gemini-2.0-flash (fast, cheap, good for 13-analysis pipeline)
- gemini-2.0-pro: deep reasoning, weekly reports, complex summaries
- gemini-embedding-exp: embeddings only

## Cost rules

- Batch analysis calls in Cloud Functions where possible.
- Never call Gemini in a render loop or on every keystroke.
- For the 13-analysis pipeline, run one batched prompt requesting all 13 fields as JSON.
