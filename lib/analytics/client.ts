import { logEvent as firebaseLogEvent } from 'firebase/analytics';
import type { CustomParams } from 'firebase/analytics';
import { analyticsReady } from '@/lib/firebase/client';
import { EntryType, Mood } from '@/types/journal';
import type { EntryType as ComposerEntryType } from '@/components/journal/EntryTypeSelector';

const isAnalyticsDebug = process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === 'true';

// Helper to safely log events only on the client
const logEvent = async (eventName: string, eventParams?: CustomParams) => {
  if (typeof window === 'undefined') {
    return;
  }

  const analytics = await analyticsReady;

  if (!analytics) {
    return;
  }

  firebaseLogEvent(analytics, eventName, {
    ...eventParams,
    ...(isAnalyticsDebug ? { debug_mode: 1 } : {}),
  });
};

// Journaling
export const logEntryCreated = (params: { entry_type?: EntryType | ComposerEntryType; has_mood: boolean; tag_count: number; word_count: number }) => {
  logEvent('entry_created', params);
};

export const logEntryEdited = () => {
  logEvent('entry_edited');
};

export const logEntryDeleted = () => {
  logEvent('entry_deleted');
};

export const logEntrySearched = (params: { search_type: 'full_text' | 'semantic' }) => {
  logEvent('entry_searched', params);
};

// AI & Insights
export const logYggiChatOpened = () => {
  logEvent('yggi_chat_opened');
};

export const logYggiMessageSent = (params: { conversation_turn_count: number }) => {
  logEvent('yggi_message_sent', params);
};

export const logInsightGenerated = () => {
  logEvent('insight_generated');
};

export const logInsightsTabViewed = () => {
  logEvent('insights_tab_viewed');
};

export const logHiddenConnectionsViewed = () => {
  logEvent('hidden_connections_viewed');
};

export const logHiddenConnectionsComputation = (params: { path: 'cirq' | 'fallback_knn' }) => {
  logEvent('hidden_connections_computation', params);
};

export const logKnowledgeGraphViewed = () => {
  logEvent('knowledge_graph_viewed');
};

export const logWeeklyWisdomGenerated = () => {
  logEvent('weekly_wisdom_generated');
};

// Goals & Growth
export const logGoalCreated = () => {
  logEvent('goal_created');
};

export const logGoalCompleted = () => {
  logEvent('goal_completed');
};

export const logGoalDeleted = () => {
  logEvent('goal_deleted');
};

export const logJourneyStarted = () => {
  logEvent('journey_started');
};

export const logJourneyCompleted = () => {
  logEvent('journey_completed');
};

export const logAchievementUnlocked = (params: { achievement_id: string }) => {
  logEvent('achievement_unlocked', params);
};

export const logLivingTreeViewed = () => {
  logEvent('living_tree_viewed');
};

// Onboarding & Retention
export const logOnboardingStarted = () => {
  logEvent('onboarding_started');
};

export const logOnboardingCompleted = () => {
  logEvent('onboarding_completed');
};

export const logSeedEntryAnalyzed = () => {
  logEvent('seed_entry_analyzed');
};

export const logStreakMilestone = (params: { streak_days: number }) => {
  logEvent('streak_milestone', params);
};

// Business
export const logSubscriptionStarted = (params: { plan: string }) => {
  logEvent('subscription_started', params);
};

export const logSubscriptionCancelled = () => {
  logEvent('subscription_cancelled');
};

export const logSubscriptionRenewed = () => {
  logEvent('subscription_renewed');
};

export const logPaywallViewed = () => {
  logEvent('paywall_viewed');
};

export const logSettingsOpened = () => {
  logEvent('settings_opened');
};

export const logDataExported = () => {
  logEvent('data_exported');
};
