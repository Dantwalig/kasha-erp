import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto';
import { RecordInvoicePaymentDto } from '../payments/dto';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

@Controller('finance/invoices')
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @RequirePermissions('finance:read')
  @Get()
  findAll() {
    return this.invoicesService.findAll();
  }

  @RequirePermissions('finance:write')
  @Post()
  create(@Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(dto);
  }

  @RequirePermissions('finance:write')
  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.invoicesService.cancel(id);
  }

  @RequirePermissions('finance:write')
  @Post(':id/payments')
  recordPayment(@Param('id') id: string, @Body() dto: RecordInvoicePaymentDto) {
    return this.invoicesService.recordPayment(id, dto.amount, dto.method, dto.notes);
  }
}
