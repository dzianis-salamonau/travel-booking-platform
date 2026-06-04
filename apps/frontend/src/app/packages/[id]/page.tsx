'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import type { PackageDetail, DestinationSummary } from '@travel/shared-types';

export default function PackageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pkg, setPkg] = useState<PackageDetail | null>(null);
  const [summary, setSummary] = useState<DestinationSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api<PackageDetail>(`/packages/${id}`)
      .then(async (p) => {
        setPkg(p);
        const s = await api<DestinationSummary>(`/ai/destination-summary/${p.destinationSlug}`).catch(() => null);
        setSummary(s);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!pkg) return <div className="p-8">Package not found</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {pkg.image && (
        <div className="relative mb-6 h-64 w-full overflow-hidden rounded-xl">
          <Image src={pkg.image} alt={pkg.destinationName} fill className="object-cover" />
        </div>
      )}

      <h1 className="text-3xl font-bold">{pkg.destinationName}</h1>
      <p className="text-lg text-slate-600">{pkg.hotelName} · {'★'.repeat(pkg.hotelStars)}</p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold">Trip details</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>Departure: {pkg.departureDate} from {pkg.departureAirport}</li>
            <li>Return: {pkg.returnDate}</li>
            <li>Duration: {pkg.duration} nights</li>
            <li>Board: {pkg.boardType.replace(/_/g, ' ')}</li>
            <li>Provider: {pkg.providerSlug}</li>
          </ul>
          {pkg.amenities?.length > 0 && (
            <p className="mt-4 text-sm">Amenities: {pkg.amenities.join(', ')}</p>
          )}
        </div>

        <div className="rounded-xl border bg-white p-6">
          <p className="text-3xl font-bold text-brand-700">
            {formatPrice(pkg.displayedPrice, pkg.currency)}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Deposit ({pkg.depositPercentage}%): {formatPrice(pkg.depositAmount, pkg.currency)}
          </p>
          <button
            onClick={() => router.push(`/book/${pkg.id}`)}
            disabled={!pkg.availability}
            className="mt-6 w-full rounded-lg bg-brand-600 py-3 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {pkg.availability ? 'Book now' : 'Unavailable'}
          </button>
        </div>
      </div>

      {summary && (
        <div className="mt-8 rounded-xl border bg-brand-50 p-6">
          <h2 className="font-semibold text-brand-900">Destination guide</h2>
          <p className="mt-2 text-sm">{summary.overview}</p>
          <p className="mt-2 text-sm"><strong>Weather:</strong> {summary.weather}</p>
          {summary.attractions?.length > 0 && (
            <p className="mt-2 text-sm"><strong>Attractions:</strong> {summary.attractions.join(', ')}</p>
          )}
        </div>
      )}
    </div>
  );
}
