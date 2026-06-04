'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import type { PackageSearchResult, PaginatedResponse, SearchFacets } from '@travel/shared-types';

type SearchResponse = PaginatedResponse<PackageSearchResult> & { facets: SearchFacets };

function SearchContent() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    searchParams.forEach((v, k) => params.set(k, v));
    if (!params.has('availableOnly')) params.set('availableOnly', 'true');

    setLoading(true);
    api<SearchResponse>(`/packages/search?${params.toString()}`)
      .then(setResults)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [searchParams]);

  if (loading) return <div className="p-8 text-center">Searching...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">Search results</h1>
      <p className="mt-1 text-slate-600">
        {results?.total ?? 0} packages found
      </p>

      {results?.facets && (
        <div className="mt-4 flex flex-wrap gap-2">
          {results.facets.destinations.map((d) => (
            <span key={d.slug} className="rounded-full bg-brand-100 px-3 py-1 text-sm text-brand-800">
              {d.name} ({d.count})
            </span>
          ))}
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">
            €{results.facets.priceRange.min} – €{results.facets.priceRange.max}
          </span>
        </div>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {results?.data.map((pkg) => (
          <Link
            key={pkg.id}
            href={`/packages/${pkg.id}`}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
          >
            {pkg.image && (
              <div className="relative h-40 w-full">
                <Image src={pkg.image} alt={pkg.destinationName} fill className="object-cover" />
              </div>
            )}
            <div className="p-4">
              <h3 className="font-semibold">{pkg.destinationName}</h3>
              <p className="text-sm text-slate-600">{pkg.hotelName} · {'★'.repeat(pkg.hotelStars)}</p>
              <p className="mt-2 text-sm">
                {pkg.departureDate} · {pkg.duration} nights · {pkg.departureAirport}
              </p>
              <p className="mt-2 text-lg font-bold text-brand-700">
                {formatPrice(pkg.displayedPrice, pkg.currency)}
              </p>
              <p className="text-xs text-slate-500">{pkg.providerSlug}</p>
            </div>
          </Link>
        ))}
      </div>

      {results && results.totalPages > 1 && (
        <p className="mt-6 text-center text-sm text-slate-500">
          Page {results.page} of {results.totalPages}
        </p>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
