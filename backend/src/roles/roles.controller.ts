import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @RequirePermissions('roles:read')
  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @RequirePermissions('roles:manage')
  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @RequirePermissions('roles:manage')
  @Post(':id/permissions/:permissionId')
  assignPermission(
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rolesService.assignPermission(id, permissionId);
  }
}
