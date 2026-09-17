import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadStatusDto } from './dto';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../auth/decorators/current-user.decorator';

@Controller('crm/leads')
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @RequirePermissions('crm:read')
  @Get()
  findAll() {
    return this.leadsService.findAll();
  }

  @RequirePermissions('crm:write')
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateLeadDto) {
    return this.leadsService.create(user.userId, dto);
  }

  @RequirePermissions('crm:write')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateLeadStatusDto) {
    return this.leadsService.updateStatus(id, dto);
  }

  @RequirePermissions('crm:write')
  @Post(':id/convert')
  convert(@Param('id') id: string) {
    return this.leadsService.convert(id);
  }
}
