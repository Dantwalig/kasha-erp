import { Body, Controller, Get, Post } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

@Controller('inventory/locations')
export class LocationsController {
  constructor(private locationsService: LocationsService) {}

  @RequirePermissions('inventory:read')
  @Get()
  findAll() {
    return this.locationsService.findAll();
  }

  @RequirePermissions('inventory:write')
  @Post()
  create(@Body() dto: CreateLocationDto) {
    return this.locationsService.create(dto);
  }
}
