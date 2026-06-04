import { Injectable, Logger } from '@nestjs/common';
import { SyncJobStatus, SyncJobType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProviderRegistryService } from '../providers/provider-registry.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerRegistry: ProviderRegistryService,
    private readonly redis: RedisService,
  ) {}

  async runDailySync(providerId?: string) {
    const providers = providerId
      ? [await this.prisma.provider.findUnique({ where: { id: providerId } })].filter(Boolean)
      : await this.prisma.provider.findMany({ where: { isActive: true } });

    for (const provider of providers) {
      if (!provider) continue;
      const run = await this.prisma.syncJobRun.create({
        data: {
          providerId: provider.id,
          jobType: SyncJobType.daily_sync,
          status: SyncJobStatus.running,
        },
      });

      try {
        const adapter = this.providerRegistry.getAdapterBySlug(provider.slug);
        if (!adapter) throw new Error(`No adapter for ${provider.slug}`);

        let count = 0;
        const destinations = await adapter.syncDestinations();
        const destMap = new Map<string, string>();

        for (const dest of destinations) {
          const upserted = await this.prisma.destination.upsert({
            where: {
              providerId_externalId: { providerId: provider.id, externalId: dest.externalId },
            },
            create: {
              providerId: provider.id,
              externalId: dest.externalId,
              name: dest.name,
              slug: dest.slug,
              country: dest.country,
              image: dest.image,
              description: dest.description,
            },
            update: {
              name: dest.name,
              slug: dest.slug,
              country: dest.country,
              image: dest.image,
              description: dest.description,
            },
          });
          destMap.set(dest.externalId, upserted.id);
          count++;
        }

        const hotels = await adapter.syncHotels();
        const hotelMap = new Map<string, string>();

        for (const hotel of hotels) {
          const destinationId = destMap.get(hotel.destinationExternalId);
          if (!destinationId) continue;
          const upserted = await this.prisma.hotel.upsert({
            where: {
              providerId_externalId: { providerId: provider.id, externalId: hotel.externalId },
            },
            create: {
              providerId: provider.id,
              externalId: hotel.externalId,
              destinationId,
              name: hotel.name,
              stars: hotel.stars,
              address: hotel.address,
              description: hotel.description,
              amenities: hotel.amenities,
            },
            update: {
              name: hotel.name,
              stars: hotel.stars,
              address: hotel.address,
              description: hotel.description,
              amenities: hotel.amenities,
            },
          });
          hotelMap.set(hotel.externalId, upserted.id);
          count++;
        }

        const packages = await adapter.syncPackages();
        for (const pkg of packages) {
          const destinationId = destMap.get(pkg.destinationExternalId);
          const hotelId = hotelMap.get(pkg.hotelExternalId);
          if (!destinationId || !hotelId) continue;
          await this.prisma.travelPackage.upsert({
            where: {
              providerId_externalId: { providerId: provider.id, externalId: pkg.externalId },
            },
            create: {
              providerId: provider.id,
              externalId: pkg.externalId,
              destinationId,
              hotelId,
              departureAirport: pkg.departureAirport,
              departureDate: pkg.departureDate,
              returnDate: pkg.returnDate,
              duration: pkg.duration,
              boardType: pkg.boardType,
              basePrice: pkg.basePrice,
              currency: pkg.currency,
              availability: pkg.availability,
              description: pkg.description,
            },
            update: {
              departureAirport: pkg.departureAirport,
              departureDate: pkg.departureDate,
              returnDate: pkg.returnDate,
              duration: pkg.duration,
              boardType: pkg.boardType,
              basePrice: pkg.basePrice,
              currency: pkg.currency,
              availability: pkg.availability,
              description: pkg.description,
            },
          });
          count++;
        }

        await this.prisma.syncJobRun.update({
          where: { id: run.id },
          data: {
            status: SyncJobStatus.completed,
            itemsSynced: count,
            completedAt: new Date(),
          },
        });
        await this.redis.del('search:*');
        this.logger.log(`Daily sync completed for ${provider.slug}: ${count} items`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        await this.prisma.syncJobRun.update({
          where: { id: run.id },
          data: {
            status: SyncJobStatus.failed,
            errorMessage: message,
            completedAt: new Date(),
          },
        });
        this.logger.error(`Daily sync failed for ${provider.slug}: ${message}`);
      }
    }
  }

  async runAvailabilityVerify() {
    const run = await this.prisma.syncJobRun.create({
      data: {
        jobType: SyncJobType.availability_verify,
        status: SyncJobStatus.running,
      },
    });

    try {
      const packages = await this.prisma.travelPackage.findMany({
        where: { isArchived: false },
        include: { provider: true },
      });

      let count = 0;
      for (const pkg of packages) {
        const adapter = this.providerRegistry.getAdapterBySlug(pkg.provider.slug);
        if (!adapter) continue;
        const result = await adapter.checkAvailability(pkg.externalId, {
          departureDate: pkg.departureDate,
        });
        await this.prisma.travelPackage.update({
          where: { id: pkg.id },
          data: {
            availability: result.available,
            basePrice: result.latestBasePrice,
          },
        });
        count++;
      }

      await this.prisma.syncJobRun.update({
        where: { id: run.id },
        data: {
          status: SyncJobStatus.completed,
          itemsSynced: count,
          completedAt: new Date(),
        },
      });
      await this.redis.del('search:*');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await this.prisma.syncJobRun.update({
        where: { id: run.id },
        data: { status: SyncJobStatus.failed, errorMessage: message, completedAt: new Date() },
      });
    }
  }

  async runCleanupExpired() {
    const run = await this.prisma.syncJobRun.create({
      data: {
        jobType: SyncJobType.cleanup_expired,
        status: SyncJobStatus.running,
      },
    });

    try {
      const result = await this.prisma.travelPackage.updateMany({
        where: { returnDate: { lt: new Date() }, isArchived: false },
        data: { isArchived: true, availability: false },
      });

      await this.prisma.syncJobRun.update({
        where: { id: run.id },
        data: {
          status: SyncJobStatus.completed,
          itemsSynced: result.count,
          completedAt: new Date(),
        },
      });
      await this.redis.del('search:*');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await this.prisma.syncJobRun.update({
        where: { id: run.id },
        data: { status: SyncJobStatus.failed, errorMessage: message, completedAt: new Date() },
      });
    }
  }

  async listRecentRuns(limit = 20) {
    return this.prisma.syncJobRun.findMany({
      take: limit,
      orderBy: { startedAt: 'desc' },
      include: { provider: { select: { slug: true, name: true } } },
    });
  }
}
