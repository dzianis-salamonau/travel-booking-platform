'use client';

import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function ConfirmationContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="rounded-2xl border bg-white p-8 shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-green-800">Booking confirmed!</h1>
        <p className="mt-4 text-slate-600">Your payment was processed successfully.</p>
        <p className="mt-2 font-mono text-sm">Booking ID: {id}</p>
        {ref && <p className="text-xs text-slate-500">Payment ref: ...{ref}</p>}
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/bookings"
            className="rounded-lg bg-brand-600 py-2 text-white hover:bg-brand-700"
          >
            View my bookings
          </Link>
          <Link href="/search" className="text-brand-600 hover:underline">
            Search more trips
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense>
      <ConfirmationContent />
    </Suspense>
  );
}
