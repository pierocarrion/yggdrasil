import { adminDb } from '@/lib/firebase/admin';

interface AnalyticsEventParams {
  [key: string]: string | number | boolean;
}

interface AnalyticsConfig {
  measurementId: string;
  apiSecret: string;
}

interface SendAnalyticsEventOptions {
  userId?: string;
  clientId?: string;
  eventParams?: AnalyticsEventParams;
}

const isAnalyticsDebug = process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === 'true';

function getAnalyticsConfig(): AnalyticsConfig | null {
  const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    return null;
  }

  return { measurementId, apiSecret };
}

async function getOrCreateClientId(userId: string): Promise<string> {
  const userRef = adminDb.doc(`users/${userId}`);
  const userDoc = await userRef.get();
  const userData = userDoc.data();

  if (userData?.analyticsClientId) {
    return userData.analyticsClientId;
  }

  const clientId = crypto.randomUUID();
  await userRef.set({ analyticsClientId: clientId }, { merge: true });
  return clientId;
}

async function sendAnalyticsEvent(
  eventName: string,
  options: SendAnalyticsEventOptions,
): Promise<void> {
  try {
    const config = getAnalyticsConfig();

    if (!config) {
      return;
    }

    const clientId = options.clientId
      ?? (options.userId ? await getOrCreateClientId(options.userId) : null);

    if (!clientId) {
      return;
    }

    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${config.measurementId}&api_secret=${config.apiSecret}`;

    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        ...(options.userId ? { user_id: options.userId } : {}),
        events: [
          {
            name: eventName,
            params: {
              ...options.eventParams,
              ...(isAnalyticsDebug ? { debug_mode: 1 } : {}),
              engagement_time_msec: 100,
            },
          },
        ],
      }),
    });
  } catch {
    return;
  }
}

export async function logSubscriptionStarted(userId: string, plan: string): Promise<void> {
  await sendAnalyticsEvent('subscription_started', {
    userId,
    eventParams: { plan },
  });
}

export async function logSubscriptionCancelled(userId: string): Promise<void> {
  await sendAnalyticsEvent('subscription_cancelled', {
    userId,
  });
}

export async function logSubscriptionRenewed(userId: string): Promise<void> {
  await sendAnalyticsEvent('subscription_renewed', {
    userId,
  });
}
