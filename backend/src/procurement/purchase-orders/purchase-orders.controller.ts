import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import {
  CreateFromRequestDto,
  CreatePurchaseOrderDto,
  ReceiveItemDto,
} from './dto';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

@Controller('procurement/orders')
export class PurchaseOrdersController {
  constructor(private purchaseOrdersService: PurchaseOrdersService) {}

  @RequirePermissions('procurement:read')
  @Get()
  findAll() {
    return this.purchaseOrdersService.findAll();
  }

  @RequirePermissions('procurement:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.purchaseOrdersService.findOne(id);
  }

  @RequirePermissions('procurement:write')
  @Post()
  create(@Body() dto: CreatePurchaseOrderDto) {
    return this.purchaseOrdersService.create(dto);
  }

  @RequirePermissions('procurement:write')
  @Post('from-request/:requestId')
  createFromRequest(
    @Param('requestId') requestId: string,
    @Body() dto: CreateFromRequestDto,
  ) {
    return this.purchaseOrdersService.createFromRequest(requestId, dto);
  }

  @RequirePermissions('procurement:write')
  @Patch(':id/send')
  send(@Param('id') id: string) {
    return this.purchaseOrdersService.send(id);
  }

  @RequirePermissions('procurement:write')
  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.purchaseOrdersService.cancel(id);
  }

  @RequirePermissions('inventory:write')
  @Post(':id/receive')
  receiveItem(@Param('id') id: string, @Body() dto: ReceiveItemDto) {
    return this.purchaseOrdersService.receiveItem(id, dto);
  }
}
