import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';
import { PaymentService } from './payment.service';

class CreateIntentDto {
  @IsUUID()
  bookingId!: string;
}

class WebhookDto {
  @IsUUID()
  bookingId!: string;

  @IsString()
  status?: string;
}

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('intent')
  createIntent(@Body() dto: CreateIntentDto) {
    return this.paymentService.createIntent(dto.bookingId);
  }

  @Post('webhook')
  webhook(@Body() dto: WebhookDto) {
    return this.paymentService.handleWebhook(dto);
  }
}
