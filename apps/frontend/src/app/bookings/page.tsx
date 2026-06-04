'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getToken } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import type { BookingResponse } from '@travel/shared-types';

interface BookingWithPackage extends BookingResponse {
  package?: {
    destinationName: string;
    hotelName: string;
    departureDate: string;
  };
}

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingWithPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    api<BookingWithPackage[]>('/bookings/my')
      .then(setBookings)
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">My bookings</h1>
      {bookings.length === 0 ? (
        <p className="mt-4 text-slate-600">No bookings yet. <Link href="/search" className="text-brand-600">Search trips</Link></p>
      ) : (
        <div className="mt-6 space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="rounded-xl border bg-white p-4">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">{b.bookingReference}</p>
                  {b.package && (
                    <p className="text-sm text-slate-600">
                      {b.package.destinationName} — {b.package.hotelName}
                    </p>
                  )}
                  <p className="text-sm">{b.bookingStatus} · {b.paymentStatus}</p>
                </div>
                <p className="font-bold">{formatPrice(b.totalPrice)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
