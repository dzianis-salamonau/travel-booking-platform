'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';

export default function AdminPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [providers, setProviders] = useState<Array<{ id: string; name: string; slug: string; isActive: boolean }>>([]);
  const [syncRuns, setSyncRuns] = useState<Array<Record<string, unknown>>>([]);
  const [bookings, setBookings] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [a, p, s, b] = await Promise.all([
        api('/admin/analytics'),
        api('/admin/providers'),
        api('/admin/sync/runs?limit=10'),
        api('/admin/bookings?limit=10'),
      ]);
      setAnalytics(a as Record<string, unknown>);
      setProviders(p as typeof providers);
      setSyncRuns(s as typeof syncRuns);
      setBookings(b as typeof bookings);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Access denied — login as admin');
    }
  };

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    load();
  }, [router]);

  const triggerSync = async () => {
    await api('/admin/sync/trigger', { method: 'POST' });
    alert('Sync queued');
    load();
  };

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-red-600">{error}</p>
        <p className="mt-2 text-sm">Use admin@travel.com / admin123</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={triggerSync}
          className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
        >
          Trigger sync
        </button>
      </div>

      {analytics && (
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <StatCard label="Total bookings" value={String(analytics.totalBookings)} />
          <StatCard label="Confirmed" value={String(analytics.confirmedBookings)} />
          <StatCard label="Conversion %" value={Number(analytics.conversionRate).toFixed(1)} />
          <StatCard label="Failed syncs" value={String(analytics.failedSyncJobs)} />
        </div>
      )}

      <section className="mt-8">
        <h2 className="font-semibold">Providers</h2>
        <div className="mt-2 overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left">
                <th className="p-3">Name</th>
                <th className="p-3">Slug</th>
                <th className="p-3">Active</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="p-3">{p.name}</td>
                  <td className="p-3">{p.slug}</td>
                  <td className="p-3">{p.isActive ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-semibold">Recent sync runs</h2>
        <div className="mt-2 space-y-2">
          {syncRuns.map((r) => (
            <div key={String(r.id)} className="rounded border bg-white p-3 text-sm">
              {String(r.jobType)} — {String(r.status)} — {String(r.itemsSynced)} items
              {r.errorMessage ? <span className="text-red-600"> — {String(r.errorMessage)}</span> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-semibold">Recent bookings</h2>
        <div className="mt-2 space-y-2">
          {bookings.map((b) => (
            <div key={String(b.id)} className="rounded border bg-white p-3 text-sm">
              {String((b as { bookingReference?: string }).bookingReference)} —{' '}
              {String((b as { bookingStatus?: string }).bookingStatus)}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
