import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { AiService } from './ai.service';

class ParseQueryDto {
  @IsString()
  @MinLength(3)
  query!: string;
}

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('status')
  status() {
    return { enabled: this.aiService.isEnabled() };
  }

  @Post('parse-query')
  parseQuery(@Body() dto: ParseQueryDto) {
    return this.aiService.parseQuery(dto.query);
  }

  @Get('destination-summary/:slug')
  destinationSummary(@Param('slug') slug: string) {
    return this.aiService.getDestinationSummary(slug);
  }
}
