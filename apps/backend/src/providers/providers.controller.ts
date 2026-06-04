import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('providers')
@Controller('providers')
export class ProvidersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  listActive() {
    return this.prisma.provider.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, name: true },
      orderBy: { name: 'asc' },
    });
  }
}
