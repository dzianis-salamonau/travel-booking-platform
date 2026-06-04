import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { RedisService } from '../redis/redis.service';
import { PackageSearchQueryDto } from './dto/search.dto';

@Injectable()
export class PackageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
    private readonly redis: RedisService,
  ) {}

  private cacheKey(query: PackageSearchQueryDto): string {
    const hash = crypto.createHash('md5').update(JSON.stringify(query)).digest('hex');
    return `search:${hash}`;
  }

  async search(query: PackageSearchQueryDto) {
    const cacheKey = this.cacheKey(query);
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const skip = (page - 1) * limit;
    const commission = await this.pricing.getDefaultCommissionPercentage();

    const where: Prisma.TravelPackageWhereInput = {
      isArchived: false,
      ...(query.availableOnly !== false && { availability: true }),
      ...(query.departureAirport && { departureAirport: query.departureAirport }),
      ...(query.boardType && { boardType: query.boardType }),
      ...(query.durationMin && { duration: { gte: query.durationMin } }),
      ...(query.durationMax && { duration: { lte: query.durationMax } }),
      ...(query.departureDateFrom || query.departureDateTo
        ? {
            departureDate: {
              ...(query.departureDateFrom && { gte: new Date(query.departureDateFrom) }),
              ...(query.departureDateTo && { lte: new Date(query.departureDateTo) }),
            },
          }
        : {}),
      destination: query.destinationSlug ? { slug: query.destinationSlug } : undefined,
      provider: query.providerSlug ? { slug: query.providerSlug } : undefined,
      hotel: query.hotelRatingMin ? { stars: { gte: query.hotelRatingMin } } : undefined,
    };

    const orderBy: Prisma.TravelPackageOrderByWithRelationInput[] = [];
    const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';
    if (query.sortBy === 'date') orderBy.push({ departureDate: sortOrder });
    else if (query.sortBy === 'rating') orderBy.push({ hotel: { stars: sortOrder } });
    else orderBy.push({ basePrice: sortOrder });

    const [packages, total] = await Promise.all([
      this.prisma.travelPackage.findMany({
        where,
        include: {
          destination: true,
          hotel: true,
          provider: { select: { slug: true } },
        },
        orderBy: orderBy.length ? orderBy : [{ basePrice: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.travelPackage.count({ where }),
    ]);

    let results = await Promise.all(
      packages.map(async (pkg) => {
        const basePrice = Number(pkg.basePrice);
        const displayedPrice = this.pricing.applyCommission(basePrice, commission);
        return {
          id: pkg.id,
          providerSlug: pkg.provider.slug,
          destinationName: pkg.destination.name,
          destinationSlug: pkg.destination.slug,
          hotelName: pkg.hotel.name,
          hotelStars: pkg.hotel.stars,
          departureAirport: pkg.departureAirport,
          departureDate: pkg.departureDate.toISOString().split('T')[0],
          returnDate: pkg.returnDate.toISOString().split('T')[0],
          duration: pkg.duration,
          boardType: pkg.boardType,
          basePrice,
          displayedPrice,
          currency: pkg.currency,
          availability: pkg.availability,
          image: pkg.destination.image,
        };
      }),
    );

    if (query.priceMin !== undefined) {
      results = results.filter((r) => r.displayedPrice >= query.priceMin!);
    }
    if (query.priceMax !== undefined) {
      results = results.filter((r) => r.displayedPrice <= query.priceMax!);
    }

    const facets = await this.getFacets(where, commission);
    const response = {
      data: results,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      facets,
    };

    await this.redis.set(cacheKey, JSON.stringify(response), 300);
    return response;
  }

  private async getFacets(where: Prisma.TravelPackageWhereInput, commission: number) {
    const packages = await this.prisma.travelPackage.findMany({
      where,
      include: { destination: true },
      take: 500,
    });

    const destCounts = new Map<string, { slug: string; name: string; count: number }>();
    let minPrice = Infinity;
    let maxPrice = 0;

    for (const pkg of packages) {
      const displayed = this.pricing.applyCommission(Number(pkg.basePrice), commission);
      minPrice = Math.min(minPrice, displayed);
      maxPrice = Math.max(maxPrice, displayed);
      const key = pkg.destination.slug;
      const existing = destCounts.get(key);
      if (existing) existing.count++;
      else destCounts.set(key, { slug: pkg.destination.slug, name: pkg.destination.name, count: 1 });
    }

    return {
      destinations: Array.from(destCounts.values()),
      priceRange: {
        min: minPrice === Infinity ? 0 : minPrice,
        max: maxPrice,
      },
    };
  }

  async findById(id: string) {
    const pkg = await this.prisma.travelPackage.findUnique({
      where: { id },
      include: { destination: true, hotel: true, provider: { select: { slug: true } } },
    });
    if (!pkg || pkg.isArchived) throw new NotFoundException('Package not found');

    const basePrice = Number(pkg.basePrice);
    const displayedPrice = await this.pricing.getDisplayedPrice(basePrice);
    const { depositAmount, depositPercentage } = await this.pricing.getDepositAmount(displayedPrice);

    return {
      id: pkg.id,
      providerSlug: pkg.provider.slug,
      destinationName: pkg.destination.name,
      destinationSlug: pkg.destination.slug,
      hotelName: pkg.hotel.name,
      hotelStars: pkg.hotel.stars,
      departureAirport: pkg.departureAirport,
      departureDate: pkg.departureDate.toISOString().split('T')[0],
      returnDate: pkg.returnDate.toISOString().split('T')[0],
      duration: pkg.duration,
      boardType: pkg.boardType,
      basePrice,
      displayedPrice,
      currency: pkg.currency,
      availability: pkg.availability,
      image: pkg.destination.image,
      description: pkg.description ?? pkg.destination.description,
      amenities: pkg.hotel.amenities,
      depositAmount,
      depositPercentage,
    };
  }

  async listDestinations() {
    return this.prisma.destination.findMany({
      select: { slug: true, name: true, country: true, image: true },
      distinct: ['slug'],
      orderBy: { name: 'asc' },
    });
  }
}
