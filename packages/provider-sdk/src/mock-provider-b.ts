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
    externalId: 'b-dest-1',
    name: 'Sal',
    slug: 'sal',
    country: 'Cape Verde',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    description: 'Sandy beaches and turquoise waters on Sal island.',
  },
  {
    externalId: 'b-dest-2',
    name: 'Boa Vista',
    slug: 'boa-vista',
    country: 'Cape Verde',
    image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800',
    description: 'Dunes and desert landscapes with pristine coastline.',
  },
  {
    externalId: 'b-dest-3',
    name: 'Algarve',
    slug: 'algarve',
    country: 'Portugal',
    image: 'https://images.unsplash.com/photo-1590523277543-a94d6e4dbad2?w=800',
    description: 'Cliff-lined beaches in southern Portugal.',
  },
];

const HOTELS: NormalizedHotel[] = [
  {
    externalId: 'b-hotel-1',
    destinationExternalId: 'b-dest-1',
    name: 'Praia Dourada Resort',
    stars: 4,
    amenities: ['pool', 'beach', 'wifi'],
  },
  {
    externalId: 'b-hotel-2',
    destinationExternalId: 'b-dest-2',
    name: 'Riu Touareg',
    stars: 5,
    amenities: ['pool', 'spa', 'all-inclusive', 'wifi'],
  },
  {
    externalId: 'b-hotel-3',
    destinationExternalId: 'b-dest-3',
    name: 'Vilamoura Beach Hotel',
    stars: 4,
    amenities: ['pool', 'golf', 'wifi'],
  },
];

function generatePackagesB(): NormalizedPackage[] {
  const packages: NormalizedPackage[] = [];
  const airports = ['LGW', 'STN', 'BRS'];
  let idx = 0;

  for (const hotel of HOTELS) {
    for (let month = 7; month <= 10; month++) {
      for (const airport of airports) {
        idx++;
        const departureDate = new Date(2026, month - 1, 5 + (idx % 20));
        const returnDate = new Date(departureDate);
        returnDate.setDate(returnDate.getDate() + 10);
        packages.push({
          externalId: `b-pkg-${idx}`,
          destinationExternalId: hotel.destinationExternalId,
          hotelExternalId: hotel.externalId,
          departureAirport: airport,
          departureDate,
          returnDate,
          duration: 10,
          boardType: BoardType.ALL_INCLUSIVE,
          basePrice: 950 + idx * 38,
          currency: 'EUR',
          availability: idx % 5 !== 0,
          description: `10 nights at ${hotel.name}`,
        });
      }
    }
  }
  return packages;
}

const PACKAGES_B = generatePackagesB();

export class MockProviderB implements ITravelProvider {
  readonly providerSlug = 'mock-provider-b';

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
    return PACKAGES_B;
  }

  async getPackage(externalId: string): Promise<NormalizedPackage | null> {
    await delay(30);
    return PACKAGES_B.find((p) => p.externalId === externalId) ?? null;
  }

  async checkAvailability(
    externalId: string,
    _params: AvailabilityParams,
  ): Promise<AvailabilityResult> {
    await delay(80);
    const pkg = PACKAGES_B.find((p) => p.externalId === externalId);
    if (!pkg) {
      return { available: false, latestBasePrice: 0, currency: 'EUR' };
    }
    if (externalId.endsWith('3')) {
      return { available: false, latestBasePrice: pkg.basePrice, currency: pkg.currency };
    }
    return {
      available: pkg.availability,
      latestBasePrice: pkg.basePrice,
      currency: pkg.currency,
    };
  }

  async createReservation(payload: ReservationPayload): Promise<ReservationResult> {
    await delay(120);
    const pkg = PACKAGES_B.find((p) => p.externalId === payload.packageExternalId);
    if (!pkg || !pkg.availability) {
      throw new Error('Package unavailable');
    }
    return {
      providerReference: `MOCKB-${Date.now()}`,
      confirmed: true,
      totalPrice: pkg.basePrice,
      currency: pkg.currency,
    };
  }
}
