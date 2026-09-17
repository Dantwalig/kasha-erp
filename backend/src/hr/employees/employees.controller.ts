import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

@Controller('hr/employees')
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  @RequirePermissions('hr:read')
  @Get()
  findAll() {
    return this.employeesService.findAll();
  }

  @RequirePermissions('hr:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @RequirePermissions('hr:write')
  @Post()
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(dto);
  }

  @RequirePermissions('hr:write')
  @Patch(':id/status')
  setStatus(@Param('id') id: string, @Body('status') status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED') {
    return this.employeesService.setStatus(id, status);
  }
}
