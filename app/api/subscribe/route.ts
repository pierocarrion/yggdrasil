import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';
import {
  checkAndRecord,
  getClientIp,
  getDeviceId,
  hashKey,
  isCrossSite,
} from '@/lib/marketing/demoGuard';

const MAX_BODY_BYTES = 2048;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  try {
    if (isCrossSite(request)) {
      return NextResponse.json({ code: 'forbidden', error: 'Forbidden' }, { status: 403 });
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ code: 'bad_request', error: 'Invalid request.' }, { status: 400 });
    }
    let body: { email?: unknown; website?: unknown };
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ code: 'bad_request', error: 'Invalid request.' }, { status: 400 });
    }

    // Honeypot: real visitors never fill this hidden field. Pretend success.
    if (typeof body.website === 'string' && body.website.trim() !== '') {
      return NextResponse.json({ ok: true });
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { code: 'invalid_email', error: 'That email address doesn’t look right — check it and try again.' },
        { status: 400 },
      );
    }

    const ip = getClientIp(request);
    const limit = await checkAndRecord({
      collection: 'subscribe',
      deviceId: getDeviceId(request).id,
      ip,
      devicePerHour: 5,
      ipPerHour: 15,
      globalDailyMax: 2000,
    });
    if (limit.limited) {
      return NextResponse.json(
        { code: 'rate_limited', error: 'Too many signups from here just now — please try again in a little while.' },
        { status: 429 },
      );
    }

    const ref = adminDb.collection('leads').doc(hashKey(email));
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists) {
        tx.update(ref, {
          lastSeenAt: admin.firestore.FieldValue.serverTimestamp(),
          hits: admin.firestore.FieldValue.increment(1),
        });
      } else {
        tx.set(ref, {
          email,
          source: 'homepage',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastSeenAt: admin.firestore.FieldValue.serverTimestamp(),
          hits: 1,
          userAgent: (request.headers.get('user-agent') || '').slice(0, 200),
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('subscribe route failed', error);
    return NextResponse.json(
      { code: 'unavailable', error: 'We couldn’t save your email just now — please try again in a moment.' },
      { status: 503 },
    );
  }
}
