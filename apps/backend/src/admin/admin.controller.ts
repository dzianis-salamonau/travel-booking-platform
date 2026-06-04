import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@travel/shared-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { SyncService } from '../sync/sync.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly syncService: SyncService,
  ) {}

  @Get('providers')
  listProviders() {
    return this.adminService.listProviders();
  }

  @Patch('providers/:id')
  updateProvider(
    @Param('id') id: string,
    @Body() body: { isActive?: boolean; name?: string },
  ) {
    return this.adminService.updateProvider(id, body);
  }

  @Get('commission-rules')
  listCommissionRules() {
    return this.adminService.listCommissionRules();
  }

  @Post('commission-rules')
  createCommissionRule(@Body() body: { name: string; percentage: number; isDefault?: boolean }) {
    return this.adminService.createCommissionRule(body);
  }

  @Get('deposit-rules')
  listDepositRules() {
    return this.adminService.listDepositRules();
  }

  @Post('deposit-rules')
  createDepositRule(@Body() body: { name: string; percentage: number; isDefault?: boolean }) {
    return this.adminService.createDepositRule(body);
  }

  @Get('bookings')
  listBookings(@Query('limit') limit?: string) {
    return this.adminService.listBookings(limit ? parseInt(limit, 10) : 50);
  }

  @Post('bookings/:id/cancel')
  cancelBooking(@Param('id') id: string) {
    return this.adminService.cancelBooking(id);
  }

  @Post('sync/trigger')
  triggerSync(@Query('providerId') providerId?: string) {
    return this.adminService.triggerSync(providerId);
  }

  @Get('sync/runs')
  syncRuns(@Query('limit') limit?: string) {
    return this.syncService.listRecentRuns(limit ? parseInt(limit, 10) : 20);
  }

  @Get('analytics')
  analytics() {
    return this.adminService.getAnalytics();
  }
}
