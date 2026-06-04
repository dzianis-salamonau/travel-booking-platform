'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

interface Destination {
  slug: string;
  name: string;
  country: string;
  image?: string;
}

const FALLBACK_DESTINATIONS: Destination[] = [
  {
    slug: 'tenerife',
    name: 'Tenerife',
    country: 'Spain',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
  },
  {
    slug: 'algarve',
    name: 'Algarve',
    country: 'Portugal',
    image: 'https://images.unsplash.com/photo-1590523277543-a94d6e4dbad2?w=800',
  },
  {
    slug: 'sal',
    name: 'Sal',
    country: 'Cape Verde',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
  },
  {
    slug: 'mallorca',
    name: 'Mallorca',
    country: 'Spain',
    image: 'https://images.unsplash.com/photo-1558642084-f57107ad7171?w=800',
  },
];

export function FeaturedDestinations() {
  const [destinations, setDestinations] = useState<Destination[]>([]);

  useEffect(() => {
    api<Destination[]>('/packages/destinations')
      .then((items) => {
        const unique = Array.from(new Map(items.map((d) => [d.slug, d])).values());
        setDestinations(unique.slice(0, 6));
      })
      .catch(() => setDestinations(FALLBACK_DESTINATIONS));
  }, []);

  const display = destinations.length > 0 ? destinations : FALLBACK_DESTINATIONS;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Popular destinations</h2>
          <p className="mt-2 text-slate-600">Sun-soaked favourites our travellers book again and again.</p>
        </div>
        <Link
          href="/search?availableOnly=true"
          className="hidden items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 sm:flex"
        >
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {display.map((dest) => (
          <Link
            key={dest.slug}
            href={`/search?destinationSlug=${dest.slug}&availableOnly=true`}
            className="group relative overflow-hidden rounded-2xl bg-slate-200 shadow-md transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="relative aspect-[4/3]">
              {dest.image ? (
                <Image
                  src={dest.image}
                  alt={dest.name}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-brand-500 to-brand-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
              <div className="absolute bottom-0 p-5 text-white">
                <p className="text-xs font-medium uppercase tracking-wider text-brand-100">{dest.country}</p>
                <h3 className="text-xl font-bold">{dest.name}</h3>
                <p className="mt-1 text-sm text-slate-200 opacity-0 transition group-hover:opacity-100">
                  Explore packages →
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
