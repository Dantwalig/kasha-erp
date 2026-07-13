import { Body, Controller, Get, Post } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

@Controller('procurement/suppliers')
export class SuppliersController {
  constructor(private suppliersService: SuppliersService) {}

  @RequirePermissions('procurement:read')
  @Get()
  findAll() {
    return this.suppliersService.findAll();
  }

  @RequirePermissions('procurement:write')
  @Post()
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(dto);
  }
}
