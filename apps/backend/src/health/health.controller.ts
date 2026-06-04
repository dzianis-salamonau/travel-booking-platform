import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  async check() {
    let db = 'ok';
    let cache = 'ok';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'error';
    }

    try {
      await this.redis.getClient().ping();
    } catch {
      cache = 'error';
    }

    const status = db === 'ok' && cache === 'ok' ? 'ok' : 'degraded';
    return { status, db, cache, timestamp: new Date().toISOString() };
  }
}
