import Stripe from 'stripe';

export type SubscriptionTier = 'FREE' | 'PRO';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'none';
export type BillingPeriod = 'monthly' | 'yearly' | 'lifetime';
export type RecurringBillingPeriod = Exclude<BillingPeriod, 'lifetime'>;

export const FREE_INSIGHT_LIMIT = 5;

let stripeClient: Stripe | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(requireEnv('STRIPE_SECRET_KEY'));
  }

  return stripeClient;
}

export function getAppUrl(): string {
  return requireEnv('APP_URL');
}

export function getPriceIdByBillingPeriod(): Record<BillingPeriod, string> {
  return {
    monthly: requireEnv('STRIPE_PRICE_ID_PRO'),
    yearly: requireEnv('STRIPE_PRICE_ID_ANNUAL'),
    lifetime: requireEnv('STRIPE_PRICE_ID_LIFETIME'),
  };
}

export function getBillingPeriodByPriceId(): Record<string, BillingPeriod> {
  const priceIdByBillingPeriod = getPriceIdByBillingPeriod();

  return {
    [priceIdByBillingPeriod.monthly]: 'monthly',
    [priceIdByBillingPeriod.yearly]: 'yearly',
    [priceIdByBillingPeriod.lifetime]: 'lifetime',
  };
}

export function billingPeriodFromPriceId(priceId: string): BillingPeriod {
  const billingPeriod = getBillingPeriodByPriceId()[priceId];
  if (billingPeriod) {
    return billingPeriod;
  }

  throw new Error(`Unknown Stripe price ID: ${priceId}`);
}

export function isRecurringBillingPeriod(billingPeriod: BillingPeriod): billingPeriod is RecurringBillingPeriod {
  return billingPeriod !== 'lifetime';
}
