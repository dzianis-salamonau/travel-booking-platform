import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BookingService } from './booking.service';
import { CheckAvailabilityDto, CreateBookingDto } from './dto/booking.dto';

@ApiTags('bookings')
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post('check-availability')
  checkAvailability(@Body() dto: CheckAvailabilityDto) {
    return this.bookingService.checkAvailability(dto.packageId);
  }

  @Post()
  create(
    @Body() dto: CreateBookingDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Request() req: { user?: { id: string } },
  ) {
    return this.bookingService.create(dto, req.user?.id, idempotencyKey);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('my')
  myBookings(@Request() req: { user: { id: string } }) {
    return this.bookingService.findByCustomer(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.bookingService.findById(id, req.user.id);
  }
}
