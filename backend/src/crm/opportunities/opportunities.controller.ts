import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { OpportunitiesService } from './opportunities.service';
import { CreateOpportunityDto, UpdateStageDto } from './dto';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../auth/decorators/current-user.decorator';

@Controller('crm/opportunities')
export class OpportunitiesController {
  constructor(private opportunitiesService: OpportunitiesService) {}

  @RequirePermissions('crm:read')
  @Get()
  findAll() {
    return this.opportunitiesService.findAll();
  }

  @RequirePermissions('crm:write')
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOpportunityDto) {
    return this.opportunitiesService.create(user.userId, dto);
  }

  @RequirePermissions('crm:write')
  @Patch(':id/stage')
  updateStage(@Param('id') id: string, @Body() dto: UpdateStageDto) {
    return this.opportunitiesService.updateStage(id, dto);
  }
}
