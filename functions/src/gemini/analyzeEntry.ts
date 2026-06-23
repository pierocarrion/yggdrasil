import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { logInsightGenerated } from '../lib/analytics';
import { generateText, generateEmbedding, geminiapikey } from '../lib/gemini';



export const analyzeEntry = onDocumentWritten(
  {
    document: 'users/{userId}/entries/{entryId}',
    secrets: [geminiapikey],
  },
  async (event) => {
    const { userId, entryId } = event.params;
    const entryData = event.data?.after?.data();

    if (!entryData?.content) {
      logger.warn('analyzeEntry: entry has no content', { userId, entryId });
      return;
    }

    const db = admin.firestore();
    const entryRef = db.doc(`users/${userId}/entries/${entryId}`);

    // Prevent redundant work by checking if it's already analyzed
    if (entryData.analysisStatus !== 'pending') {
      logger.info(`Entry ${entryId} analysisStatus is ${entryData.analysisStatus}, skipping.`);
      return;
    }

    try {
      logger.info(`[analyzeEntry] Starting analysis for entry: ${entryId} (User: ${userId})`);

      // --- Phase 1: depth scoring ---
      logger.info(`[analyzeEntry] Phase 1: Generating depth score...`);
      const depthPrompt = `Rate the psychological and emotional richness of this journal entry on a scale of 1 to 11. Return ONLY a JSON object with a single key "depthScore" containing an integer.

Score guide:
1–2: Very brief or surface-level (a one-liner, a grocery list accidentally saved)
3–5: Normal reflective entry — feelings mentioned, but not deeply explored
6–8: Substantive introspection — named emotions, personal patterns, self-questioning
9–11: Deep or crisis-level — strong emotional weight, shadow material, major life themes

Entry:
"${entryData.content}"`;

      const depthResponse = await generateText(depthPrompt, {
        responseMimeType: 'application/json',
      });
      const depthText = depthResponse
        .replace(/^```json\n?/i, '')
        .replace(/```$/i, '')
        .trim();
      const { depthScore } = JSON.parse(depthText) as { depthScore: number };
      logger.info(`[analyzeEntry] Phase 1 Complete. Depth score: ${depthScore}`);

      // --- Phase 2: comprehensive analysis ---
      logger.info(`[analyzeEntry] Phase 2: Fetching user frameworks...`);
      let enabledFrameworks: string[] = [];
      if (depthScore >= 3) {
        try {
          const settingsSnap = await db.doc(`users/${userId}/settings/preferences`).get();
          enabledFrameworks = settingsSnap.data()?.enabledFrameworks ?? [];
          logger.info(`[analyzeEntry] Enabled frameworks: ${enabledFrameworks.join(', ') || 'None'}`);
        } catch (error) {
          logger.warn(`[analyzeEntry] Failed to fetch frameworks:`, error);
          enabledFrameworks = [];
        }
      }

      const depthFieldsSpec = depthScore >= 3 && enabledFrameworks.length > 0
        ? `,
    "frameworks_applied": string[] — which of these frameworks were relevant: [${enabledFrameworks.join(', ')}],
    "depth_analysis": string — a short paragraph on deeper psychological/spiritual themes, shadow elements, or archetypal dynamics`
        : (depthScore >= 3 ? `,
    "depth_analysis": string — a short paragraph on deeper psychological/spiritual themes, shadow elements, or archetypal dynamics` : '');

      const analysisPrompt = `Analyze this journal entry and return ONLY a JSON object. No prose, no markdown fences — raw JSON only.

Required fields:
- "entities": [{ "type": "person"|"place"|"event"|"concept", "name": string }, ...]
- "themes": string[] — up to 5 overarching topic phrases
- "emotions": [{ "label": string, "polarity": number (0–10; 5=neutral; lower=more negative, higher=more positive), "intensity": number (0–10; 5=moderate) }, ...]
- "keywords": string[] — significant single words or short phrases for search and tagging
- "summary": string — 2–3 sentence neutral third-person summary of what the entry is about; no interpretation
- "safety_concerns": { "flagged": boolean, "concerns": string[] } — set flagged to true if the entry contains self-harm, suicidal ideation, violence, severe depression, or acute crisis
- "interpretation": {
    "main_insight": string — core psychological/spiritual insight in 1–2 sentences; warm, reflective tone,
    "questions": string[] — 3 to 5 reflective open-ended questions for the writer,
    "action_items": string[] — gentle concrete suggestions phrased as invitations,
    "patterns_identified": string[] — named cognitive distortions or behavioural/emotional patterns,
    "growth_connection": string — 1–2 sentences linking this entry to the writer's broader self-development arc${depthFieldsSpec}
  }${depthScore < 3 ? '\n\nDepthScore is below 3 — do NOT include frameworks_applied or depth_analysis.' : ''}

Entry (depthScore: ${depthScore}):
"${entryData.content}"`;

      logger.info(`[analyzeEntry] Phase 2: Generating comprehensive analysis and embedding concurrently...`);
      const analysisPromise = generateText(analysisPrompt, {
        responseMimeType: 'application/json',
      });
      
      const embeddingPromise = generateEmbedding(entryData.content).catch((e) => {
        logger.error('[analyzeEntry] Failed to generate embedding', { userId, entryId, error: e });
        return null;
      });

      const [analysisResponse, embeddingValues] = await Promise.all([
        analysisPromise,
        embeddingPromise,
      ]);
      logger.info(`[analyzeEntry] Phase 2 Complete. Both Gemini calls returned successfully.`);

      logger.info(`[analyzeEntry] Parsing Gemini JSON response...`);
      const match = analysisResponse.match(/\{[\s\S]*\}/);
      const analysisText = match ? match[0] : analysisResponse;
      const analysisFields = JSON.parse(analysisText);

      logger.info(`[analyzeEntry] Saving analysis to Firestore...`);
      const batch = db.batch();

      const analysisRef = db.collection(`users/${userId}/entries/${entryId}/analysis`).doc();
      batch.set(analysisRef, {
        entryId,
        depthScore,
        ...analysisFields,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const entryUpdateData: any = {
        analysisStatus: 'complete',
      };
      
      if (embeddingValues) {
        entryUpdateData.embedding = admin.firestore.FieldValue.vector(embeddingValues);
        entryUpdateData.embeddingGeneratedAt = admin.firestore.FieldValue.serverTimestamp();
        entryUpdateData.embeddingError = admin.firestore.FieldValue.delete();
      } else {
        entryUpdateData.embeddingError = true;
      }

      batch.update(entryRef, entryUpdateData);

      await batch.commit();
      logger.info(`[analyzeEntry] Analysis successfully saved to Firestore.`);

      logger.info('insight_generated', { userId, entryId, depthScore });
      await logInsightGenerated(userId, entryId, depthScore);
      
      // Write to opsLogs collection for admin visibility
      await db.collection('opsLogs').add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userId,
        entryId,
        model: 'gemini-3.5-flash',
        status: 'success',
        depthScore
      });
      logger.info(`[analyzeEntry] Logged to opsLogs collection.`);

    } catch (error) {
      logger.error('analyzeEntry failed', { userId, entryId, error });
      const errorMessage = error instanceof Error ? error.message : String(error);
      await entryRef.update({ 
        analysisStatus: 'error',
        analysisError: errorMessage
      }).catch(() => {});
      
      // Write failure to opsLogs collection
      await admin.firestore().collection('opsLogs').add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userId,
        entryId,
        model: 'gemini-3.5-flash',
        status: 'error',
        error: errorMessage
      }).catch(() => {});
    }
  }
);
