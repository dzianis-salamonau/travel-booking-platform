import { Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SYNC_QUEUE } from '../sync/sync.processor';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(SYNC_QUEUE) private readonly syncQueue: Queue,
  ) {}

  listProviders() {
    return this.prisma.provider.findMany({ orderBy: { name: 'asc' } });
  }

  async updateProvider(id: string, data: { isActive?: boolean; name?: string; config?: object }) {
    return this.prisma.provider.update({ where: { id }, data });
  }

  listCommissionRules() {
    return this.prisma.commissionRule.findMany({ orderBy: { createdAt: 'desc' } });
  }

  createCommissionRule(data: { name: string; percentage: number; isDefault?: boolean }) {
    return this.prisma.commissionRule.create({
      data: {
        name: data.name,
        percentage: data.percentage,
        isDefault: data.isDefault ?? false,
      },
    });
  }

  listDepositRules() {
    return this.prisma.depositRule.findMany({ orderBy: { createdAt: 'desc' } });
  }

  createDepositRule(data: { name: string; percentage: number; isDefault?: boolean }) {
    return this.prisma.depositRule.create({
      data: {
        name: data.name,
        percentage: data.percentage,
        isDefault: data.isDefault ?? false,
      },
    });
  }

  listBookings(limit = 50) {
    return this.prisma.booking.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        package: { include: { destination: true, hotel: true } },
        customer: { select: { email: true } },
      },
    });
  }

  async cancelBooking(id: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    return this.prisma.booking.update({
      where: { id },
      data: { bookingStatus: BookingStatus.cancelled },
    });
  }

  async triggerSync(providerId?: string) {
    await this.syncQueue.add('daily-sync', { type: 'daily-sync', providerId });
    return { message: 'Sync queued' };
  }

  async getAnalytics() {
    const [bookingCount, confirmedCount, topDestinations, failedSyncs] = await Promise.all([
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { bookingStatus: 'confirmed' } }),
      this.prisma.booking.groupBy({
        by: ['packageId'],
        _count: true,
        orderBy: { _count: { packageId: 'desc' } },
        take: 5,
      }),
      this.prisma.syncJobRun.count({ where: { status: 'failed' } }),
    ]);

    const packageIds = topDestinations.map((t) => t.packageId);
    const packages = await this.prisma.travelPackage.findMany({
      where: { id: { in: packageIds } },
      include: { destination: true },
    });

    const destMap = new Map(packages.map((p) => [p.id, p.destination.name]));
    const topDest = topDestinations.map((t) => ({
      destination: destMap.get(t.packageId) ?? 'Unknown',
      bookings: t._count,
    }));

    return {
      totalBookings: bookingCount,
      confirmedBookings: confirmedCount,
      conversionRate: bookingCount ? (confirmedCount / bookingCount) * 100 : 0,
      failedSyncJobs: failedSyncs,
      topDestinations: topDest,
    };
  }
}
