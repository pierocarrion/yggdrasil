export type SubscriptionTier = 'FREE' | 'PRO';

export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'none';

export type BillingPeriod = 'monthly' | 'yearly' | 'lifetime';

export type RecurringBillingPeriod = Exclude<BillingPeriod, 'lifetime'>;
