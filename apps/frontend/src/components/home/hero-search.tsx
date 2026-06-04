'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Search, MapPin, Plane, CalendarDays } from 'lucide-react';
import { api } from '@/lib/api';
import type { AiSearchFilters } from '@travel/shared-types';

interface DestinationOption {
  slug: string;
  name: string;
  country: string;
}

const DEPARTURE_AIRPORTS = [
  { code: '', label: 'Any airport' },
  { code: 'LHR', label: 'London Heathrow (LHR)' },
  { code: 'MAN', label: 'Manchester (MAN)' },
  { code: 'BHX', label: 'Birmingham (BHX)' },
];

export function HeroSearch() {
  const router = useRouter();
  const [tab, setTab] = useState<'packages' | 'ai'>('packages');
  const [destinations, setDestinations] = useState<DestinationOption[]>([]);
  const [destination, setDestination] = useState('');
  const [departureAirport, setDepartureAirport] = useState('');
  const [departureDateFrom, setDepartureDateFrom] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<DestinationOption[]>('/packages/destinations')
      .then((items) => {
        const unique = Array.from(new Map(items.map((d) => [d.slug, d])).values());
        setDestinations(unique);
      })
      .catch(() => setDestinations([]));
  }, []);

  const buildSearchUrl = (params: Record<string, string>) => {
    const q = new URLSearchParams(params);
    return `/search?${q.toString()}`;
  };

  const handlePackageSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params: Record<string, string> = { availableOnly: 'true' };
    if (destination) params.destinationSlug = destination;
    if (departureAirport) params.departureAirport = departureAirport;
    if (departureDateFrom) params.departureDateFrom = departureDateFrom;
    router.push(buildSearchUrl(params));
  };

  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return;
    setLoading(true);
    try {
      const filters = await api<AiSearchFilters>('/ai/parse-query', {
        method: 'POST',
        body: JSON.stringify({ query: aiQuery }),
      });
      const params: Record<string, string> = { availableOnly: 'true' };
      if (filters.destinationSlug) params.destinationSlug = filters.destinationSlug;
      if (filters.departureDateFrom) params.departureDateFrom = filters.departureDateFrom;
      if (filters.departureDateTo) params.departureDateTo = filters.departureDateTo;
      if (filters.priceMax) params.priceMax = String(filters.priceMax);
      router.push(buildSearchUrl(params));
    } catch {
      router.push('/search?availableOnly=true');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'linear-gradient(to bottom, rgba(12, 74, 110, 0.75), rgba(15, 23, 42, 0.85)), url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80)',
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 md:pb-24 md:pt-28">
        <div className="max-w-2xl text-white">
          <p className="text-sm font-medium uppercase tracking-widest text-brand-100">
            Package holidays · Multiple providers
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            Your next escape starts here
          </h1>
          <p className="mt-4 text-lg text-slate-200 md:text-xl">
            Compare beach breaks, city escapes and all-inclusive deals across Spain, Portugal and Cape Verde — with live availability before you book.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-900/20">
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setTab('packages')}
              className={`flex flex-1 items-center justify-center gap-2 px-4 py-4 text-sm font-semibold transition ${
                tab === 'packages'
                  ? 'border-b-2 border-brand-600 text-brand-700'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Search className="h-4 w-4" />
              Search packages
            </button>
            <button
              type="button"
              onClick={() => setTab('ai')}
              className={`flex flex-1 items-center justify-center gap-2 px-4 py-4 text-sm font-semibold transition ${
                tab === 'ai'
                  ? 'border-b-2 border-brand-600 text-brand-700'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              AI trip planner
            </button>
          </div>

          <div className="p-6 md:p-8">
            {tab === 'packages' ? (
              <form onSubmit={handlePackageSearch}>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="lg:col-span-2">
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                      <MapPin className="h-4 w-4 text-brand-600" />
                      Where to?
                    </label>
                    <select
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                    >
                      <option value="">Any destination</option>
                      {destinations.map((d) => (
                        <option key={d.slug} value={d.slug}>
                          {d.name}, {d.country}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                      <Plane className="h-4 w-4 text-brand-600" />
                      Departing from
                    </label>
                    <select
                      value={departureAirport}
                      onChange={(e) => setDepartureAirport(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                    >
                      {DEPARTURE_AIRPORTS.map((a) => (
                        <option key={a.code || 'any'} value={a.code}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                      <CalendarDays className="h-4 w-4 text-brand-600" />
                      From date
                    </label>
                    <input
                      type="date"
                      value={departureDateFrom}
                      onChange={(e) => setDepartureDateFrom(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="mt-6 w-full rounded-xl bg-brand-600 py-4 text-base font-semibold text-white transition hover:bg-brand-700 md:w-auto md:px-12"
                >
                  Search holidays
                </button>
              </form>
            ) : (
              <div>
                <p className="mb-4 text-sm text-slate-600">
                  Describe the trip you have in mind — we&apos;ll turn it into search filters.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                    placeholder="e.g. family beach holiday in August under €1500 from London"
                    className="flex-1 rounded-xl border border-slate-300 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                  <button
                    type="button"
                    onClick={handleAiSearch}
                    disabled={loading}
                    className="rounded-xl bg-brand-600 px-8 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    {loading ? 'Planning…' : 'Find trips'}
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['Beach break in Tenerife', 'All-inclusive under €1200', 'Cape Verde in July'].map(
                    (suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setAiQuery(suggestion)}
                        className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                      >
                        {suggestion}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
