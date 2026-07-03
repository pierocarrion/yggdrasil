import { adminDb } from '@/lib/firebase/admin';
import { AdminSignOutButton } from './SignOutButton';

export const dynamic = 'force-dynamic';

type Lead = {
  email: string;
  source?: string;
  createdAt?: Date;
  lastSeenAt?: Date;
  hits?: number;
};

type DemoEvent = {
  status: string;
  wordCount?: number;
  device?: string;
  createdAt?: Date;
};

function toDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && 'toDate' in (value as object)) {
    return (value as { toDate: () => Date }).toDate();
  }
  return undefined;
}

async function getData() {
  const day = new Date().toISOString().slice(0, 10);
  const [leadsSnap, eventsSnap, reflectCounterSnap, opsSnap] = await Promise.all([
    adminDb.collection('leads').orderBy('createdAt', 'desc').limit(100).get(),
    adminDb.collection('demoReflections').orderBy('createdAt', 'desc').limit(50).get(),
    adminDb.collection('demoCounters').doc(`reflect-${day}`).get(),
    adminDb.collection('opsLogs').orderBy('timestamp', 'desc').limit(25).get(),
  ]);

  const leads: Lead[] = leadsSnap.docs.map((d) => {
    const data = d.data();
    return {
      email: data.email,
      source: data.source,
      createdAt: toDate(data.createdAt),
      lastSeenAt: toDate(data.lastSeenAt),
      hits: data.hits,
    };
  });

  const events: DemoEvent[] = eventsSnap.docs.map((d) => {
    const data = d.data();
    return {
      status: data.status,
      wordCount: data.wordCount,
      device: data.device,
      createdAt: toDate(data.createdAt),
    };
  });

  const opsLogs = opsSnap.docs.map((d) => {
    const data = d.data();
    return {
      status: data.status as string,
      model: data.model as string | undefined,
      depthScore: data.depthScore as number | undefined,
      error: data.error as string | undefined,
      timestamp: toDate(data.timestamp),
    };
  });

  return {
    leads,
    events,
    reflectToday: (reflectCounterSnap.data()?.count as number) ?? 0,
    opsLogs,
  };
}

function fmt(date?: Date): string {
  if (!date) return '—';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const STATUS_COLORS: Record<string, string> = {
  ok: 'text-sage',
  flagged: 'text-red-400',
  blocked: 'text-red-400',
  error: 'text-yellow-400',
  success: 'text-sage',
};

export default async function AdminDashboardPage() {
  let data: Awaited<ReturnType<typeof getData>>;
  try {
    data = await getData();
  } catch (error) {
    console.error('admin dashboard: failed to load ops data', error);
    return (
      <div className="p-8">
        <h1 className="font-display text-3xl text-foreground mb-4">Ops Dashboard</h1>
        <p className="text-sm text-foreground/60">
          Couldn&apos;t load ops data from Firestore. Check the server logs and Firebase Admin credentials.
        </p>
      </div>
    );
  }

  const flaggedCount = data.events.filter((e) => e.status === 'flagged' || e.status === 'blocked').length;

  return (
    <div className="mx-auto max-w-6xl p-8 space-y-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/80 mb-2">Admin</p>
          <h1 className="font-display text-3xl text-foreground">Ops Dashboard</h1>
        </div>
        <AdminSignOutButton />
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-surface-2 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Email leads</p>
          <p className="text-3xl text-foreground">{data.leads.length}</p>
          <p className="text-xs text-foreground/50 mt-1">latest 100 shown below</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-surface-2 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Demo reflections today</p>
          <p className="text-3xl text-foreground">{data.reflectToday}<span className="text-base text-foreground/50"> / 500</span></p>
          <p className="text-xs text-foreground/50 mt-1">daily circuit breaker</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-surface-2 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Flagged / blocked (recent)</p>
          <p className={`text-3xl ${flaggedCount > 0 ? 'text-red-400' : 'text-foreground'}`}>{flaggedCount}</p>
          <p className="text-xs text-foreground/50 mt-1">of last {data.events.length} demo events</p>
        </div>
      </div>

      {/* Email leads */}
      <section>
        <h2 className="font-display text-xl text-foreground mb-4">Homepage email capture</h2>
        <div className="rounded-xl border border-border/60 bg-surface-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left text-xs uppercase tracking-[0.15em] text-muted-foreground">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">First seen</th>
                <th className="px-4 py-3 font-medium">Last seen</th>
                <th className="px-4 py-3 font-medium">Submits</th>
              </tr>
            </thead>
            <tbody>
              {data.leads.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-foreground/50">
                    No leads captured yet.
                  </td>
                </tr>
              )}
              {data.leads.map((lead) => (
                <tr key={lead.email} className="border-b border-border/20 last:border-0">
                  <td className="px-4 py-3 text-foreground">{lead.email}</td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground/60">{fmt(lead.createdAt)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground/60">{fmt(lead.lastSeenAt)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground/60">{lead.hits ?? 1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Demo usage */}
      <section>
        <h2 className="font-display text-xl text-foreground mb-4">Homepage demo activity</h2>
        <p className="text-xs text-foreground/50 mb-3">
          Metadata only — entry text is never stored.
        </p>
        <div className="rounded-xl border border-border/60 bg-surface-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left text-xs uppercase tracking-[0.15em] text-muted-foreground">
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Words</th>
                <th className="px-4 py-3 font-medium">Device</th>
              </tr>
            </thead>
            <tbody>
              {data.events.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-foreground/50">
                    No demo activity yet.
                  </td>
                </tr>
              )}
              {data.events.map((event, i) => (
                <tr key={i} className="border-b border-border/20 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-foreground/60">{fmt(event.createdAt)}</td>
                  <td className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${STATUS_COLORS[event.status] ?? 'text-foreground/70'}`}>
                    {event.status}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground/60">{event.wordCount ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground/40">{event.device ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Entry analysis ops logs */}
      <section>
        <h2 className="font-display text-xl text-foreground mb-4">Entry analysis (opsLogs)</h2>
        <div className="rounded-xl border border-border/60 bg-surface-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left text-xs uppercase tracking-[0.15em] text-muted-foreground">
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="px-4 py-3 font-medium">Depth</th>
                <th className="px-4 py-3 font-medium">Error</th>
              </tr>
            </thead>
            <tbody>
              {data.opsLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-foreground/50">
                    No analysis runs logged yet.
                  </td>
                </tr>
              )}
              {data.opsLogs.map((log, i) => (
                <tr key={i} className="border-b border-border/20 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-foreground/60">{fmt(log.timestamp)}</td>
                  <td className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${STATUS_COLORS[log.status] ?? 'text-foreground/70'}`}>
                    {log.status}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground/60">{log.model ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground/60">{log.depthScore ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-foreground/50 max-w-[280px] truncate">{log.error ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
