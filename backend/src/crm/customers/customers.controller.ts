import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

@Controller('crm/customers')
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @RequirePermissions('crm:read')
  @Get()
  findAll() {
    return this.customersService.findAll();
  }

  @RequirePermissions('crm:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @RequirePermissions('crm:write')
  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }
}
