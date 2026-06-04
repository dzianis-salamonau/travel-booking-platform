'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import type { PackageDetail, AvailabilityCheckResult } from '@travel/shared-types';

export default function BookPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pkg, setPkg] = useState<PackageDetail | null>(null);
  const [availability, setAvailability] = useState<AvailabilityCheckResult | null>(null);
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [payFull, setPayFull] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api<PackageDetail>(`/packages/${id}`).then(setPkg).catch(console.error);
    api<AvailabilityCheckResult>('/bookings/check-availability', {
      method: 'POST',
      body: JSON.stringify({ packageId: id }),
    })
      .then(setAvailability)
      .catch((e) => setError(e.message));
  }, [id]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const booking = await api<{ id: string; payAmount: number }>('/bookings', {
        method: 'POST',
        headers: { 'Idempotency-Key': `${id}-${Date.now()}` },
        body: JSON.stringify({
          packageId: id,
          guestFirstName,
          guestLastName,
          guestEmail,
          payFullAmount: payFull,
        }),
      });

      const intent = await api<{ clientSecret: string }>('/payments/intent', {
        method: 'POST',
        body: JSON.stringify({ bookingId: booking.id }),
      });

      await api('/payments/webhook', {
        method: 'POST',
        body: JSON.stringify({ bookingId: booking.id, status: 'paid' }),
      });

      router.push(`/confirmation/${booking.id}?ref=${intent.clientSecret.slice(-8)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  if (!pkg) return <div className="p-8">Loading...</div>;

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <p className="mt-2 text-slate-600">{pkg.destinationName} — {pkg.hotelName}</p>

      {availability && (
        <div className="mt-4 rounded-lg bg-slate-100 p-4 text-sm">
          <p>Price: {formatPrice(availability.displayedPrice, availability.currency)}</p>
          <p>Deposit: {formatPrice(availability.depositAmount, availability.currency)}</p>
          {!availability.available && (
            <p className="text-red-600">Package may no longer be available</p>
          )}
        </div>
      )}

      <form onSubmit={handleBook} className="mt-6 space-y-4 rounded-xl border bg-white p-6">
        <input
          placeholder="First name"
          value={guestFirstName}
          onChange={(e) => setGuestFirstName(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
          required
        />
        <input
          placeholder="Last name"
          value={guestLastName}
          onChange={(e) => setGuestLastName(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={guestEmail}
          onChange={(e) => setGuestEmail(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
          required
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={payFull} onChange={(e) => setPayFull(e.target.checked)} />
          Pay full amount now
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading || availability?.available === false}
          className="w-full rounded-lg bg-brand-600 py-3 text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Confirm & Pay'}
        </button>
      </form>
    </div>
  );
}
