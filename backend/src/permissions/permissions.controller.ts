import { Body, Controller, Get, Post } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('permissions')
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) {}

  @RequirePermissions('roles:read')
  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }

  @RequirePermissions('roles:manage')
  @Post()
  create(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.create(dto);
  }
}
