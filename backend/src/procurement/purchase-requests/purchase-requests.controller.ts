import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PurchaseRequestsService } from './purchase-requests.service';
import { CreatePurchaseRequestDto, RejectPurchaseRequestDto } from './dto';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../auth/decorators/current-user.decorator';

@Controller('procurement/requests')
export class PurchaseRequestsController {
  constructor(private purchaseRequestsService: PurchaseRequestsService) {}

  @RequirePermissions('procurement:read')
  @Get()
  findAll() {
    return this.purchaseRequestsService.findAll();
  }

  @RequirePermissions('procurement:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.purchaseRequestsService.findOne(id);
  }

  @RequirePermissions('procurement:write')
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePurchaseRequestDto,
  ) {
    return this.purchaseRequestsService.create(user.userId, dto);
  }

  @RequirePermissions('procurement:approve')
  @Patch(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.purchaseRequestsService.approve(id, user.userId);
  }

  @RequirePermissions('procurement:approve')
  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectPurchaseRequestDto) {
    return this.purchaseRequestsService.reject(id, dto);
  }
}
