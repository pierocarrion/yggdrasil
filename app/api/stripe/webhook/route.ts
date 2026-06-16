import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/client';
import { adminDb } from '@/lib/firebase/admin';
import type { UserProfile } from '@/types/user';
import { logSubscriptionCancelled, logSubscriptionRenewed, logSubscriptionStarted } from '@/lib/analytics/server';

// In App Router the raw body is always accessible via req.arrayBuffer() —
// no bodyParser config required (that was a Pages Router concept).

function planFromPriceId(priceId: string): UserProfile['plan'] {
  if (priceId === process.env.STRIPE_ANNUAL_PRICE_ID) return 'ANNUAL';
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'PRO';
  return 'PRO'; // fallback for any paid price we don't recognise
}

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const raw = await req.arrayBuffer();
    const body = Buffer.from(raw);
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook verification failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const uid = session.metadata?.uid ?? session.client_reference_id;
        const priceId = session.metadata?.priceId;
        const plan = priceId ? planFromPriceId(priceId) : null;

        if (uid && plan) {
          await adminDb.doc(`users/${uid}`).update({ plan });
          await logSubscriptionStarted(uid, plan);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const uid = subscription.metadata?.uid;
        const priceId = subscription.items.data[0]?.price.id;
        const plan = priceId ? planFromPriceId(priceId) : null;

        if (uid && plan) {
          await adminDb.doc(`users/${uid}`).update({ plan });
          await logSubscriptionRenewed(uid);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const uid = subscription.metadata?.uid;

        if (uid) {
          await adminDb.doc(`users/${uid}`).update({ plan: 'FREE' });
          await logSubscriptionCancelled(uid);
        }
        break;
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Handler error';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
