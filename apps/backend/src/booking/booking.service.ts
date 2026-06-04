import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProviderRegistryService } from '../providers/provider-registry.service';
import { PricingService } from '../pricing/pricing.service';
import { CreateBookingDto } from './dto/booking.dto';
import * as crypto from 'crypto';

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providerRegistry: ProviderRegistryService,
    private readonly pricing: PricingService,
  ) {}

  async checkAvailability(packageId: string) {
    const pkg = await this.prisma.travelPackage.findUnique({
      where: { id: packageId },
      include: { provider: true, destination: true },
    });
    if (!pkg || pkg.isArchived) throw new NotFoundException('Package not found');

    const adapter = this.providerRegistry.getAdapterBySlug(pkg.provider.slug);
    if (!adapter) throw new NotFoundException('Provider adapter not found');

    const result = await adapter.checkAvailability(pkg.externalId, {
      departureDate: pkg.departureDate,
    });

    const displayedPrice = await this.pricing.getDisplayedPrice(result.latestBasePrice);
    const { depositAmount } = await this.pricing.getDepositAmount(displayedPrice);

    let alternativePackageIds: string[] | undefined;
    if (!result.available) {
      const alternatives = await this.prisma.travelPackage.findMany({
        where: {
          destinationId: pkg.destinationId,
          availability: true,
          isArchived: false,
          id: { not: packageId },
          departureDate: {
            gte: new Date(pkg.departureDate.getTime() - 7 * 86400000),
            lte: new Date(pkg.departureDate.getTime() + 7 * 86400000),
          },
        },
        take: 5,
        select: { id: true },
      });
      alternativePackageIds = alternatives.map((a) => a.id);
    }

    return {
      available: result.available,
      latestBasePrice: result.latestBasePrice,
      displayedPrice,
      depositAmount,
      currency: result.currency,
      alternativePackageIds,
    };
  }

  async create(
    dto: CreateBookingDto,
    customerId?: string,
    idempotencyKey?: string,
  ) {
    if (idempotencyKey) {
      const existing = await this.prisma.booking.findUnique({
        where: { idempotencyKey },
      });
      if (existing) return this.formatBooking(existing);
    }

    const availability = await this.checkAvailability(dto.packageId);
    if (!availability.available) {
      throw new ConflictException({
        message: 'Package is no longer available',
        alternativePackageIds: availability.alternativePackageIds,
      });
    }

    const pkg = await this.prisma.travelPackage.findUnique({
      where: { id: dto.packageId },
      include: { provider: true },
    });
    if (!pkg) throw new NotFoundException('Package not found');

    const adapter = this.providerRegistry.getAdapterBySlug(pkg.provider.slug);
    if (!adapter) throw new NotFoundException('Provider adapter not found');

    const reservation = await adapter.createReservation({
      packageExternalId: pkg.externalId,
      guestFirstName: dto.guestFirstName,
      guestLastName: dto.guestLastName,
      guestEmail: dto.guestEmail,
      guestPhone: dto.guestPhone,
      departureDate: pkg.departureDate,
    });

    const totalPrice = availability.displayedPrice;
    const depositAmount = dto.payFullAmount ? totalPrice : availability.depositAmount;
    const bookingReference = `TB-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const booking = await this.prisma.booking.create({
      data: {
        packageId: dto.packageId,
        customerId,
        bookingReference,
        providerReference: reservation.providerReference,
        bookingStatus: BookingStatus.reserved,
        paymentStatus: PaymentStatus.pending,
        totalPrice,
        depositAmount,
        currency: pkg.currency,
        guestFirstName: dto.guestFirstName,
        guestLastName: dto.guestLastName,
        guestEmail: dto.guestEmail,
        guestPhone: dto.guestPhone,
        idempotencyKey,
      },
    });

    return {
      ...this.formatBooking(booking),
      payAmount: depositAmount,
    };
  }

  async findByCustomer(customerId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { customerId },
      include: {
        package: {
          include: { destination: true, hotel: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return bookings.map((b) => ({
      ...this.formatBooking(b),
      package: {
        destinationName: b.package.destination.name,
        hotelName: b.package.hotel.name,
        departureDate: b.package.departureDate.toISOString().split('T')[0],
      },
    }));
  }

  async findById(id: string, customerId?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        package: {
          include: { destination: true, hotel: true, provider: true },
        },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (customerId && booking.customerId !== customerId) {
      throw new NotFoundException('Booking not found');
    }
    return {
      ...this.formatBooking(booking),
      package: {
        destinationName: booking.package.destination.name,
        hotelName: booking.package.hotel.name,
        departureDate: booking.package.departureDate.toISOString().split('T')[0],
        providerSlug: booking.package.provider.slug,
      },
    };
  }

  private formatBooking(booking: {
    id: string;
    bookingReference: string;
    bookingStatus: BookingStatus;
    paymentStatus: PaymentStatus;
    totalPrice: unknown;
    depositAmount: unknown;
    packageId: string;
    createdAt: Date;
  }) {
    return {
      id: booking.id,
      bookingReference: booking.bookingReference,
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.paymentStatus,
      totalPrice: Number(booking.totalPrice),
      depositAmount: Number(booking.depositAmount),
      packageId: booking.packageId,
      createdAt: booking.createdAt.toISOString(),
    };
  }
}
