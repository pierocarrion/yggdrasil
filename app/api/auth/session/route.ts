import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';

/**
 * Admin session cookie management.
 *
 * The admin ops dashboard is gated on a `__session` cookie (the only cookie
 * Firebase Hosting/Cloud Run forwards) plus an `admin` custom claim. Normal app
 * auth is client-side Firebase and never mints this cookie, so admins establish
 * it here: sign in, then POST a fresh ID token. We only issue the cookie to
 * users who already carry the `admin` claim, and the layout re-verifies on every
 * request — defense in depth.
 */

const SESSION_COOKIE = '__session';
const EXPIRES_IN_MS = 60 * 60 * 24 * 5 * 1000; // 5 days

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { idToken?: unknown } | null;
    const idToken = typeof body?.idToken === 'string' ? body.idToken : '';
    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    // checkRevoked: true rejects tokens from disabled/revoked sessions.
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    if (decoded.admin !== true) {
      return NextResponse.json({ error: 'Not authorized for admin access.' }, { status: 403 });
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: EXPIRES_IN_MS });
    const store = await cookies();
    store.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: EXPIRES_IN_MS / 1000,
      path: '/',
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('admin session route failed', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
