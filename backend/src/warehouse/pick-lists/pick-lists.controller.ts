import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PickListsService } from './pick-lists.service';
import { CreatePickListDto, PickItemDto, ShipDto } from './dto';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

@Controller('warehouse/pick-lists')
export class PickListsController {
  constructor(private pickListsService: PickListsService) {}

  @RequirePermissions('warehouse:read')
  @Get()
  findAll() {
    return this.pickListsService.findAll();
  }

  @RequirePermissions('warehouse:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pickListsService.findOne(id);
  }

  @RequirePermissions('warehouse:write')
  @Post()
  create(@Body() dto: CreatePickListDto) {
    return this.pickListsService.create(dto);
  }

  @RequirePermissions('warehouse:write')
  @Post(':id/pick')
  pickItem(@Param('id') id: string, @Body() dto: PickItemDto) {
    return this.pickListsService.pickItem(id, dto);
  }

  @RequirePermissions('warehouse:write')
  @Patch(':id/pack')
  pack(@Param('id') id: string) {
    return this.pickListsService.pack(id);
  }

  @RequirePermissions('warehouse:write')
  @Patch(':id/ship')
  ship(@Param('id') id: string, @Body() dto: ShipDto) {
    return this.pickListsService.ship(id, dto);
  }

  @RequirePermissions('warehouse:write')
  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.pickListsService.cancel(id);
  }
}
