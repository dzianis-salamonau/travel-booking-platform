import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PackageService } from './package.service';
import { PackageSearchQueryDto } from './dto/search.dto';

@ApiTags('packages')
@Controller('packages')
export class PackageController {
  constructor(private readonly packageService: PackageService) {}

  @Get('search')
  search(@Query() query: PackageSearchQueryDto) {
    return this.packageService.search(query);
  }

  @Get('destinations')
  listDestinations() {
    return this.packageService.listDestinations();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.packageService.findById(id);
  }
}
