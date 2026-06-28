import Stripe from 'stripe';

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is missing. Please set it in your environment variables.');
  }
  return new Stripe(key, {
    apiVersion: '2026-05-27.dahlia' as any, // Bypass strict type check
  });
}
