import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

@Controller('inventory/categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @RequirePermissions('inventory:read')
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @RequirePermissions('inventory:write')
  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @RequirePermissions('inventory:write')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
