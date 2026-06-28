# Yggdrasil

Yggdrasil is a modern, AI-powered journaling application designed to help users reflect deeply and uncover patterns in their thoughts, emotions, and habits over time. It goes beyond a simple text editor by incorporating semantic search, mood tracking, and visual analytics.

## Key Features

- **Intelligent Journaling:** Write or dictate entries. Yggdrasil automatically extracts themes, calculates word counts, and tracks your daily reflections.
- **Voice Notes & Transcription:** Record voice notes directly in the app. Yggdrasil uses Google Gemini for accurate speech-to-text transcription.
- **Knowledge Graph & Clustering:** Visualize the connections between your journal entries. Using D3.js and K-Means clustering, the app groups semantically similar entries together, allowing you to visually explore recurring themes.
- **Emotional Patterns:** Track how your mood fluctuates over time with an interactive Scatter Timeline, highlighting emotional trends.
- **Streak Calendar & Heatmaps:** Build consistency with a 52-week streak calendar and day/time heatmaps that show when you are most reflective.
- **AI-Powered Insights (Gemini):** Yggdrasil's backend uses Google Gemini to generate semantic embeddings for entries, perform emotional sentiment analysis, and uncover deep personal insights.

## Tech Stack

- **Frontend:** Next.js (App Router, Turbopack), React, Tailwind CSS
- **Visualizations:** D3.js (Force-directed graphs, SVGs)
- **Backend/Database:** Firebase (Firestore, Cloud Functions, Authentication)
- **AI Integration:** Google Gemini API
- **Payments:** Stripe

## Getting Started

First, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Make sure you have your `.env.local` configured with the necessary Firebase and Stripe credentials.

## Historical Changelog

- **v1.2.0 - UI Enhancements & Stability**
  - Resolved merge conflicts and stabilized D3 force-directed graph rendering.
  - Implemented bulletproof coordinate clamping (preventing `NaN` layout explosion bugs in the Knowledge Graph).
  - Merged conflicting payload definitions for `wordCount` and `entryDate` in Firestore creation endpoints.
  - Fixed linting and strict type errors across `KnowledgeGraph.tsx` and `ClusterMap.tsx`.

- **v1.1.0 - Emotion Timeline & Clustering**
  - Added the new Emotional Patterns Scatter Timeline, replacing the legacy line chart.
  - Implemented K-Means clustering for grouping entries by semantic similarity on the dashboard.
  - Refined Streak Calendar to include daily and time-of-day heatmaps.

- **v1.0.0 - Semantic Search & Voice**
  - Integrated Gemini API to generate semantic embeddings for all new journal entries.
  - Built out the interactive Knowledge Graph using D3 force simulations.
  - Added in-browser voice recording with automatic transcription via Firebase Cloud Functions.
  - Added robust Firestore security rules.
