import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { ProvidersModule } from '../providers/providers.module';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [ProvidersModule, PricingModule],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
