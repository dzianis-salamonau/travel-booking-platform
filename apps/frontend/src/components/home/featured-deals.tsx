'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import type { PackageSearchResult, PaginatedResponse, SearchFacets } from '@travel/shared-types';

type SearchResponse = PaginatedResponse<PackageSearchResult> & { facets: SearchFacets };

export function FeaturedDeals() {
  const [deals, setDeals] = useState<PackageSearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<SearchResponse>(
      '/packages/search?availableOnly=true&limit=6&sortBy=price&sortOrder=asc',
    )
      .then((res) => setDeals(res.data))
      .catch(() => setDeals([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Top deals this week</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (deals.length === 0) return null;

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Top deals this week</h2>
        <p className="mt-2 text-slate-600">Hand-picked value packages with confirmed availability.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {deals.map((pkg) => (
            <Link
              key={pkg.id}
              href={`/packages/${pkg.id}`}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-brand-200 hover:shadow-lg"
            >
              <div className="relative h-44 bg-slate-100">
                {pkg.image ? (
                  <Image src={pkg.image} alt={pkg.destinationName} fill className="object-cover" sizes="400px" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-100 to-brand-500 text-brand-900">
                    {pkg.destinationName}
                  </div>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-brand-700 shadow">
                  {pkg.duration} nights
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-900">{pkg.destinationName}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {pkg.hotelName} · {'★'.repeat(pkg.hotelStars)}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {pkg.departureDate} · {pkg.departureAirport} ·{' '}
                  {pkg.boardType.replace(/_/g, ' ')}
                </p>
                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <p className="text-xs text-slate-500">From</p>
                    <p className="text-xl font-bold text-brand-700">
                      {formatPrice(pkg.displayedPrice, pkg.currency)}
                    </p>
                    <p className="text-xs text-slate-500">per person</p>
                  </div>
                  <span className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">
                    View deal
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
