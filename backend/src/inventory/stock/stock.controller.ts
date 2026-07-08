import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { StockService } from './stock.service';
import { CreateAdjustmentDto, CreateTransferDto } from './dto';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

@Controller('inventory/stock')
export class StockController {
  constructor(private stockService: StockService) {}

  @RequirePermissions('inventory:read')
  @Get('levels')
  getLevels(@Query('locationId') locationId?: string) {
    return this.stockService.getLevels(locationId);
  }

  @RequirePermissions('inventory:read')
  @Get('adjustments')
  findAllAdjustments() {
    return this.stockService.findAllAdjustments();
  }

  @RequirePermissions('inventory:write')
  @Post('adjustments')
  createAdjustment(@Body() dto: CreateAdjustmentDto) {
    return this.stockService.createAdjustment(dto);
  }

  @RequirePermissions('inventory:read')
  @Get('transfers')
  findAllTransfers() {
    return this.stockService.findAllTransfers();
  }

  @RequirePermissions('inventory:write')
  @Post('transfers')
  createTransfer(@Body() dto: CreateTransferDto) {
    return this.stockService.createTransfer(dto);
  }

  @RequirePermissions('inventory:write')
  @Post('transfers/:id/complete')
  completeTransfer(@Param('id') id: string) {
    return this.stockService.completeTransfer(id);
  }

  @RequirePermissions('inventory:write')
  @Post('transfers/:id/cancel')
  cancelTransfer(@Param('id') id: string) {
    return this.stockService.cancelTransfer(id);
  }
}
