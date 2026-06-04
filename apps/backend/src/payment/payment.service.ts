import { Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async createIntent(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    const amount = Number(booking.depositAmount);
    const clientSecret = `mock_secret_${crypto.randomBytes(16).toString('hex')}`;

    return {
      clientSecret,
      amount,
      currency: booking.currency,
      bookingId: booking.id,
    };
  }

  async handleWebhook(payload: { bookingId: string; status?: string }) {
    const booking = await this.prisma.booking.findUnique({ where: { id: payload.bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    if (payload.status === 'failed') {
      return this.prisma.booking.update({
        where: { id: booking.id },
        data: { paymentStatus: PaymentStatus.failed },
      });
    }

    return this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: PaymentStatus.paid,
        bookingStatus: BookingStatus.confirmed,
      },
    });
  }
}
