import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SyncModule } from '../sync/sync.module';
import { SYNC_QUEUE } from '../sync/sync.processor';

@Module({
  imports: [SyncModule, BullModule.registerQueue({ name: SYNC_QUEUE })],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
