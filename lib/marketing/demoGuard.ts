import { createHash, randomUUID } from 'crypto';
import { adminDb } from '@/lib/firebase/admin';

/**
 * Abuse guards for the public (unauthenticated) homepage endpoints.
 *
 * Firestore-backed sliding windows so limits survive Cloud Run restarts and
 * apply across instances, with an in-memory fast path that short-circuits
 * repeat abusers without a Firestore read. If Firestore is unavailable the
 * guards fail open to the in-memory limiter rather than taking the demo down.
 */

export const DEVICE_COOKIE = 'ygg_did';

const HOUR_MS = 60 * 60 * 1000;

type WindowRule = { key: string; max: number; windowMs: number };

const memory = new Map<string, number[]>();

function memoryCheck(rule: WindowRule, now: number): boolean {
  const events = (memory.get(rule.key) ?? []).filter((t) => now - t < rule.windowMs);
  memory.set(rule.key, events);
  if (memory.size > 10_000) memory.clear();
  return events.length >= rule.max;
}

function memoryRecord(key: string, now: number) {
  const events = memory.get(key) ?? [];
  events.push(now);
  memory.set(key, events);
}

export function hashKey(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 24);
}

export function getClientIp(request: Request): string {
  // X-Forwarded-For is a client-controllable list: the caller can prepend fake
  // entries, but cannot control the hop appended by the trusted infrastructure
  // in front of us (Cloud Run / the load balancer). Take the LAST entry so an
  // abuser can't rotate spoofed IPs to dodge the per-IP window. Falls back to
  // Cloud Run's x-forwarded-for; if absent, all callers share the 'unknown'
  // bucket (fails safe toward over-limiting rather than unlimited).
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const hops = forwarded.split(',').map((h) => h.trim()).filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1];
  }
  return 'unknown';
}

export function getDeviceId(request: Request): { id: string; isNew: boolean } {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${DEVICE_COOKIE}=([\\w-]{8,64})`));
  if (match) return { id: match[1], isNew: false };
  return { id: randomUUID(), isNew: true };
}

/** Reject cross-site browser calls; same-origin pages and non-browser callers pass. */
export function isCrossSite(request: Request): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

export type LimitResult =
  | { limited: false }
  | { limited: true; scope: 'device' | 'ip' | 'global'; retryAfterMinutes: number };

/**
 * Check all windows, and if none are exceeded, record the hit atomically.
 * `globalDailyMax` uses a per-day counter document as a spend circuit breaker.
 */
export async function checkAndRecord(opts: {
  collection: string;
  deviceId: string;
  ip: string;
  devicePerHour: number;
  ipPerHour: number;
  globalDailyMax?: number;
}): Promise<LimitResult> {
  const now = Date.now();
  const day = new Date().toISOString().slice(0, 10);
  const deviceKey = `${opts.collection}_d_${hashKey(opts.deviceId)}`;
  const ipKey = `${opts.collection}_ip_${hashKey(opts.ip)}`;
  const rules: WindowRule[] = [
    { key: deviceKey, max: opts.devicePerHour, windowMs: HOUR_MS },
    { key: ipKey, max: opts.ipPerHour, windowMs: HOUR_MS },
  ];

  // In-memory fast path: no Firestore read for callers already over the line.
  for (const rule of rules) {
    if (memoryCheck(rule, now)) {
      const scope = rule.key === deviceKey ? 'device' : 'ip';
      return { limited: true, scope, retryAfterMinutes: retryMinutes(memory.get(rule.key) ?? [], rule, now) };
    }
  }

  try {
    const result = await adminDb.runTransaction(async (tx) => {
      const refs = rules.map((r) => adminDb.collection('demoRateLimits').doc(r.key));
      const globalRef = opts.globalDailyMax
        ? adminDb.collection('demoCounters').doc(`${opts.collection}-${day}`)
        : null;

      const snaps = await Promise.all(refs.map((ref) => tx.get(ref)));
      const globalSnap = globalRef ? await tx.get(globalRef) : null;

      for (let i = 0; i < rules.length; i++) {
        const events = ((snaps[i].data()?.events as number[]) ?? []).filter(
          (t) => now - t < rules[i].windowMs,
        );
        if (events.length >= rules[i].max) {
          // Sync the memory cache so the fast path holds until the window frees up.
          memory.set(rules[i].key, events);
          return {
            limited: true,
            scope: (i === 0 ? 'device' : 'ip') as 'device' | 'ip',
            retryAfterMinutes: retryMinutes(events, rules[i], now),
          };
        }
      }

      const globalCount = (globalSnap?.data()?.count as number) ?? 0;
      if (opts.globalDailyMax && globalCount >= opts.globalDailyMax) {
        return { limited: true, scope: 'global' as const, retryAfterMinutes: minutesToMidnightUtc() };
      }

      for (let i = 0; i < rules.length; i++) {
        const events = ((snaps[i].data()?.events as number[]) ?? []).filter(
          (t) => now - t < rules[i].windowMs,
        );
        events.push(now);
        tx.set(refs[i], { events, updatedAt: now });
      }
      if (globalRef) tx.set(globalRef, { count: globalCount + 1, day }, { merge: true });
      return { limited: false as const };
    });
    if (!result.limited) rules.forEach((r) => memoryRecord(r.key, now));
    return result;
  } catch (error) {
    // Firestore unavailable: fall back to the in-memory limiter alone.
    console.warn('demoGuard: Firestore limiter unavailable, using in-memory only', error);
    rules.forEach((r) => memoryRecord(r.key, now));
    return { limited: false };
  }
}

function retryMinutes(events: number[], rule: WindowRule, now: number): number {
  const oldest = Math.min(...events);
  return Math.max(1, Math.ceil((rule.windowMs - (now - oldest)) / 60000));
}

function minutesToMidnightUtc(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);
  return Math.max(1, Math.ceil((midnight.getTime() - now.getTime()) / 60000));
}

/** Fire-and-forget ops log; never stores entry text. */
export function logDemoEvent(collection: string, data: Record<string, unknown>) {
  adminDb
    .collection(collection)
    .add({ ...data, createdAt: new Date() })
    .catch((error) => console.warn('demoGuard: failed to log event', error));
}
