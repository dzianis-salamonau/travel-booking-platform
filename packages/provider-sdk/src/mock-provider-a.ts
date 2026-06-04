import { BoardType } from '@travel/shared-types';
import {
  AvailabilityParams,
  AvailabilityResult,
  ITravelProvider,
  NormalizedDestination,
  NormalizedHotel,
  NormalizedPackage,
  ReservationPayload,
  ReservationResult,
} from './types';
import { delay, slugify } from './utils';

const DESTINATIONS: NormalizedDestination[] = [
  {
    externalId: 'a-dest-1',
    name: 'Tenerife',
    slug: 'tenerife',
    country: 'Spain',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
    description: 'Volcanic island with beaches and year-round sunshine.',
  },
  {
    externalId: 'a-dest-2',
    name: 'Mallorca',
    slug: 'mallorca',
    country: 'Spain',
    image: 'https://images.unsplash.com/photo-1558642084-f57107ad7171?w=800',
    description: 'Mediterranean island known for coves and nightlife.',
  },
  {
    externalId: 'a-dest-3',
    name: 'Lisbon Coast',
    slug: 'lisbon-coast',
    country: 'Portugal',
    image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800',
    description: 'Atlantic coast near Portugal capital region.',
  },
];

const HOTELS: NormalizedHotel[] = [
  {
    externalId: 'a-hotel-1',
    destinationExternalId: 'a-dest-1',
    name: 'Ocean View Resort Tenerife',
    stars: 4,
    address: 'Playa de las Americas',
    amenities: ['pool', 'spa', 'wifi', 'restaurant'],
  },
  {
    externalId: 'a-hotel-2',
    destinationExternalId: 'a-dest-2',
    name: 'Palma Bay Hotel',
    stars: 5,
    address: 'Palma de Mallorca',
    amenities: ['pool', 'beach', 'wifi', 'gym'],
  },
  {
    externalId: 'a-hotel-3',
    destinationExternalId: 'a-dest-3',
    name: 'Cascais Marina Hotel',
    stars: 4,
    address: 'Cascais',
    amenities: ['pool', 'wifi', 'restaurant'],
  },
];

function generatePackagesA(): NormalizedPackage[] {
  const packages: NormalizedPackage[] = [];
  const airports = ['LHR', 'MAN', 'BHX'];
  let idx = 0;

  for (const hotel of HOTELS) {
    for (let month = 6; month <= 9; month++) {
      for (const airport of airports) {
        idx++;
        const departureDate = new Date(2026, month - 1, 10 + (idx % 14));
        const returnDate = new Date(departureDate);
        returnDate.setDate(returnDate.getDate() + 7);
        packages.push({
          externalId: `a-pkg-${idx}`,
          destinationExternalId: hotel.destinationExternalId,
          hotelExternalId: hotel.externalId,
          departureAirport: airport,
          departureDate,
          returnDate,
          duration: 7,
          boardType: idx % 2 === 0 ? BoardType.ALL_INCLUSIVE : BoardType.HALF_BOARD,
          basePrice: 800 + idx * 45,
          currency: 'EUR',
          availability: idx % 7 !== 0,
          description: `7 nights at ${hotel.name}`,
        });
      }
    }
  }
  return packages;
}

const PACKAGES_A = generatePackagesA();

export class MockProviderA implements ITravelProvider {
  readonly providerSlug = 'mock-provider-a';

  async syncDestinations(): Promise<NormalizedDestination[]> {
    await delay(50);
    return DESTINATIONS.map((d) => ({ ...d, slug: slugify(d.name) }));
  }

  async syncHotels(): Promise<NormalizedHotel[]> {
    await delay(50);
    return HOTELS;
  }

  async syncPackages(): Promise<NormalizedPackage[]> {
    await delay(100);
    return PACKAGES_A;
  }

  async getPackage(externalId: string): Promise<NormalizedPackage | null> {
    await delay(30);
    return PACKAGES_A.find((p) => p.externalId === externalId) ?? null;
  }

  async checkAvailability(
    externalId: string,
    _params: AvailabilityParams,
  ): Promise<AvailabilityResult> {
    await delay(80);
    const pkg = PACKAGES_A.find((p) => p.externalId === externalId);
    if (!pkg) {
      return { available: false, latestBasePrice: 0, currency: 'EUR' };
    }
    return {
      available: pkg.availability,
      latestBasePrice: pkg.basePrice,
      currency: pkg.currency,
    };
  }

  async createReservation(payload: ReservationPayload): Promise<ReservationResult> {
    await delay(120);
    const pkg = PACKAGES_A.find((p) => p.externalId === payload.packageExternalId);
    if (!pkg || !pkg.availability) {
      throw new Error('Package unavailable');
    }
    return {
      providerReference: `MOCKA-${Date.now()}`,
      confirmed: true,
      totalPrice: pkg.basePrice,
      currency: pkg.currency,
    };
  }
}
