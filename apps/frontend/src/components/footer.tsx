import Link from 'next/link';

const FOOTER_DESTINATIONS = [
  { slug: 'tenerife', name: 'Tenerife' },
  { slug: 'mallorca', name: 'Mallorca' },
  { slug: 'algarve', name: 'Algarve' },
  { slug: 'sal', name: 'Sal' },
  { slug: 'boa-vista', name: 'Boa Vista' },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <p className="text-xl font-bold text-white">TravelBook</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Compare package holidays from trusted providers. Search, check live availability, and book with confidence.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white">Destinations</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {FOOTER_DESTINATIONS.map((d) => (
                <li key={d.slug}>
                  <Link
                    href={`/search?destinationSlug=${d.slug}&availableOnly=true`}
                    className="hover:text-white"
                  >
                    {d.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white">Help & info</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/search" className="hover:text-white">
                  Search holidays
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white">
                  My account
                </Link>
              </li>
              <li>
                <span className="text-slate-500">Flexible deposits available</span>
              </li>
              <li>
                <span className="text-slate-500">24/7 booking support</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white">Contact</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li>0800 123 4567</li>
              <li>hello@travelbook.example</li>
              <li>Mon–Sat, 9am–6pm</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-slate-800 pt-8 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} TravelBook. Demo platform for portfolio purposes.</p>
          <p>Prices include taxes where applicable. Availability confirmed at booking.</p>
        </div>
      </div>
    </footer>
  );
}
