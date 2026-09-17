import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { CreateLeaveRequestDto } from './dto';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../auth/decorators/current-user.decorator';

@Controller('hr/leave')
export class LeaveController {
  constructor(private leaveService: LeaveService) {}

  @RequirePermissions('hr:read')
  @Get()
  findAll() {
    return this.leaveService.findAll();
  }

  @RequirePermissions('hr:write')
  @Post()
  create(@Body() dto: CreateLeaveRequestDto) {
    return this.leaveService.create(dto);
  }

  @RequirePermissions('hr:approve')
  @Patch(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.leaveService.approve(id, user.userId);
  }

  @RequirePermissions('hr:approve')
  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.leaveService.reject(id);
  }
}
