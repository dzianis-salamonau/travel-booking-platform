import Link from 'next/link';
import { ShieldCheck, BadgePercent, Globe2, Headphones } from 'lucide-react';
import { HeroSearch } from '@/components/home/hero-search';
import { FeaturedDestinations } from '@/components/home/featured-destinations';
import { FeaturedDeals } from '@/components/home/featured-deals';
import { Footer } from '@/components/footer';

const TRUST_ITEMS = [
  { icon: ShieldCheck, title: 'Verified availability', text: 'We re-check with the provider before you pay.' },
  { icon: BadgePercent, title: 'Best-price search', text: 'Compare packages across multiple travel partners.' },
  { icon: Globe2, title: '200+ packages', text: 'Beach, city and all-inclusive options in one place.' },
  { icon: Headphones, title: 'Booking support', text: 'Help from search to confirmation, every step of the way.' },
];

const HOLIDAY_TYPES = [
  {
    label: 'Beach holidays',
    slug: 'tenerife',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
  },
  {
    label: 'All inclusive',
    query: 'boardType=all_inclusive',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600',
  },
  {
    label: 'Family breaks',
    slug: 'algarve',
    image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600',
  },
  {
    label: 'Winter sun',
    slug: 'sal',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600',
  },
];

const STEPS = [
  { step: '1', title: 'Search & compare', text: 'Filter by destination, dates, airport and budget.' },
  { step: '2', title: 'Check availability', text: 'See live price and availability before checkout.' },
  { step: '3', title: 'Book securely', text: 'Pay a deposit or full amount and get instant confirmation.' },
];

export default function HomePage() {
  return (
    <>
      <HeroSearch />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_ITEMS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm text-slate-600">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <FeaturedDestinations />
      <FeaturedDeals />

      <section className="bg-slate-100 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Browse by holiday type</h2>
          <p className="mt-2 text-slate-600">Not sure where to start? Pick a style and we&apos;ll show you matching trips.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HOLIDAY_TYPES.map((type) => {
              const href = type.query
                ? `/search?${type.query}&availableOnly=true`
                : `/search?destinationSlug=${type.slug}&availableOnly=true`;
              return (
                <Link
                  key={type.label}
                  href={href}
                  className="group relative overflow-hidden rounded-2xl shadow-md"
                  style={{
                    backgroundImage: `linear-gradient(to top, rgba(15,23,42,0.85), rgba(15,23,42,0.2)), url(${type.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="flex aspect-[3/4] flex-col justify-end p-5">
                    <h3 className="text-lg font-bold text-white group-hover:text-brand-100">{type.label}</h3>
                    <p className="mt-1 text-sm text-slate-300">Browse packages →</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 px-6 py-12 text-white md:px-12 md:py-16">
          <h2 className="text-2xl font-bold md:text-3xl">How booking works</h2>
          <p className="mt-2 max-w-xl text-brand-100">
            Simple, transparent and designed like the travel sites you already know.
          </p>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {STEPS.map(({ step, title, text }) => (
              <div key={step}>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg font-bold">
                  {step}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-brand-100">{text}</p>
              </div>
            ))}
          </div>
          <Link
            href="/search?availableOnly=true"
            className="mt-10 inline-block rounded-xl bg-white px-8 py-3 font-semibold text-brand-800 transition hover:bg-brand-50"
          >
            Start searching
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
