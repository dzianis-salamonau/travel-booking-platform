import { BoardType } from '@travel/shared-types';

export interface NormalizedDestination {
  externalId: string;
  name: string;
  slug: string;
  country: string;
  image?: string;
  description?: string;
}

export interface NormalizedHotel {
  externalId: string;
  destinationExternalId: string;
  name: string;
  stars: number;
  address?: string;
  description?: string;
  amenities: string[];
}

export interface NormalizedPackage {
  externalId: string;
  destinationExternalId: string;
  hotelExternalId: string;
  departureAirport: string;
  departureDate: Date;
  returnDate: Date;
  duration: number;
  boardType: BoardType;
  basePrice: number;
  currency: string;
  availability: boolean;
  description?: string;
}

export interface AvailabilityParams {
  departureDate?: Date;
  adults?: number;
  children?: number;
}

export interface AvailabilityResult {
  available: boolean;
  latestBasePrice: number;
  currency: string;
}

export interface ReservationPayload {
  packageExternalId: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone?: string;
  departureDate: Date;
}

export interface ReservationResult {
  providerReference: string;
  confirmed: boolean;
  totalPrice: number;
  currency: string;
}

export interface ITravelProvider {
  readonly providerSlug: string;
  syncDestinations(): Promise<NormalizedDestination[]>;
  syncHotels(): Promise<NormalizedHotel[]>;
  syncPackages(): Promise<NormalizedPackage[]>;
  getPackage(externalId: string): Promise<NormalizedPackage | null>;
  checkAvailability(
    externalId: string,
    params: AvailabilityParams,
  ): Promise<AvailabilityResult>;
  createReservation(payload: ReservationPayload): Promise<ReservationResult>;
}
