import { Module, Injectable } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { ScheduleModule, Cron } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { ProvidersModule } from './providers/providers.module';
import { PackageModule } from './package/package.module';
import { BookingModule } from './booking/booking.module';
import { PaymentModule } from './payment/payment.module';
import { SyncModule } from './sync/sync.module';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { PricingModule } from './pricing/pricing.module';
import { SYNC_QUEUE } from './sync/sync.processor';
@Injectable()
class SyncScheduler {
  constructor(@InjectQueue(SYNC_QUEUE) private readonly syncQueue: Queue) {}

  @Cron('0 2 * * *')
  scheduleDailySync() {
    void this.syncQueue.add('daily-sync', { type: 'daily-sync' });
  }

  @Cron('*/15 * * * *')
  scheduleAvailabilityVerify() {
    void this.syncQueue.add('availability-verify', { type: 'availability-verify' });
  }

  @Cron('0 3 * * *')
  scheduleCleanupExpired() {
    void this.syncQueue.add('cleanup-expired', { type: 'cleanup-expired' });
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      },
    }),
    BullModule.registerQueue({ name: SYNC_QUEUE }),
    PrismaModule,
    RedisModule,
    PricingModule,
    AuthModule,
    HealthModule,
    ProvidersModule,
    PackageModule,
    BookingModule,
    PaymentModule,
    SyncModule,
    AdminModule,
    AiModule,
  ],
  providers: [SyncScheduler],
})
export class AppModule {}
