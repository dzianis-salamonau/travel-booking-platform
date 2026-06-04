export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

export enum BookingStatus {
  PENDING = 'pending',
  RESERVED = 'reserved',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum BoardType {
  ROOM_ONLY = 'room_only',
  BED_AND_BREAKFAST = 'bed_and_breakfast',
  HALF_BOARD = 'half_board',
  FULL_BOARD = 'full_board',
  ALL_INCLUSIVE = 'all_inclusive',
}

export enum SyncJobType {
  DAILY_SYNC = 'daily_sync',
  AVAILABILITY_VERIFY = 'availability_verify',
  CLEANUP_EXPIRED = 'cleanup_expired',
}

export enum SyncJobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PackageSearchFilters {
  destinationSlug?: string;
  departureAirport?: string;
  departureDateFrom?: string;
  departureDateTo?: string;
  durationMin?: number;
  durationMax?: number;
  priceMin?: number;
  priceMax?: number;
  hotelRatingMin?: number;
  boardType?: BoardType;
  providerSlug?: string;
  availableOnly?: boolean;
  sortBy?: 'price' | 'date' | 'rating';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PackageSearchResult {
  id: string;
  providerSlug: string;
  destinationName: string;
  destinationSlug: string;
  hotelName: string;
  hotelStars: number;
  departureAirport: string;
  departureDate: string;
  returnDate: string;
  duration: number;
  boardType: BoardType;
  basePrice: number;
  displayedPrice: number;
  currency: string;
  availability: boolean;
  image?: string;
}

export interface PackageDetail extends PackageSearchResult {
  description?: string;
  amenities: string[];
  depositAmount: number;
  depositPercentage: number;
}

export interface SearchFacets {
  destinations: { slug: string; name: string; count: number }[];
  priceRange: { min: number; max: number };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AvailabilityCheckResult {
  available: boolean;
  latestBasePrice: number;
  displayedPrice: number;
  depositAmount: number;
  currency: string;
  alternativePackageIds?: string[];
}

export interface CreateBookingDto {
  packageId: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone?: string;
  payFullAmount?: boolean;
}

export interface BookingResponse {
  id: string;
  bookingReference: string;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  totalPrice: number;
  depositAmount: number;
  packageId: string;
  createdAt: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  amount: number;
  currency: string;
  bookingId: string;
}

export interface AiParseQueryDto {
  query: string;
}

export interface AiSearchFilters {
  destinationSlug?: string;
  departureDateFrom?: string;
  departureDateTo?: string;
  priceMax?: number;
  durationMin?: number;
  hotelRatingMin?: number;
  summary?: string;
}

export interface DestinationSummary {
  slug: string;
  overview: string;
  weather: string;
  attractions: string[];
  tips: string[];
}
