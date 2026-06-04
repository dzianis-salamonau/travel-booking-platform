import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { UserRole } from '@travel/shared-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SyncService } from './sync.service';
import { SYNC_QUEUE } from './sync.processor';

@ApiTags('sync')
@Controller('sync')
export class SyncController {
  constructor(
    private readonly syncService: SyncService,
    @InjectQueue(SYNC_QUEUE) private readonly syncQueue: Queue,
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('trigger/daily')
  async triggerDaily(@Query('providerId') providerId?: string) {
    await this.syncQueue.add('daily-sync', { type: 'daily-sync', providerId });
    return { message: 'Daily sync queued' };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('trigger/availability')
  async triggerAvailability() {
    await this.syncQueue.add('availability-verify', { type: 'availability-verify' });
    return { message: 'Availability verify queued' };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('runs')
  listRuns(@Query('limit') limit?: string) {
    return this.syncService.listRecentRuns(limit ? parseInt(limit, 10) : 20);
  }
}
