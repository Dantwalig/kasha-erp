import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { BillsService } from './bills.service';
import { CreateBillDto } from './dto';
import { RecordBillPaymentDto } from '../payments/dto';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

@Controller('finance/bills')
export class BillsController {
  constructor(private billsService: BillsService) {}

  @RequirePermissions('finance:read')
  @Get()
  findAll() {
    return this.billsService.findAll();
  }

  @RequirePermissions('finance:write')
  @Post()
  create(@Body() dto: CreateBillDto) {
    return this.billsService.create(dto);
  }

  @RequirePermissions('finance:write')
  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.billsService.cancel(id);
  }

  @RequirePermissions('finance:write')
  @Post(':id/payments')
  recordPayment(@Param('id') id: string, @Body() dto: RecordBillPaymentDto) {
    return this.billsService.recordPayment(id, dto.amount, dto.method, dto.notes);
  }
}
