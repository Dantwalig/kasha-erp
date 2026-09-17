import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { CreatePayrollRecordDto } from './dto';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

@Controller('hr/payroll')
export class PayrollController {
  constructor(private payrollService: PayrollService) {}

  @RequirePermissions('hr:read')
  @Get()
  findAll() {
    return this.payrollService.findAll();
  }

  @RequirePermissions('hr:write')
  @Post()
  create(@Body() dto: CreatePayrollRecordDto) {
    return this.payrollService.create(dto);
  }

  @RequirePermissions('hr:write')
  @Patch(':id/mark-paid')
  markPaid(@Param('id') id: string) {
    return this.payrollService.markPaid(id);
  }
}
