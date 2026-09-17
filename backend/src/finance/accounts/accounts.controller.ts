import { Body, Controller, Get, Post } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

@Controller('finance/accounts')
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @RequirePermissions('finance:read')
  @Get()
  findAll() {
    return this.accountsService.findAll();
  }

  @RequirePermissions('finance:write')
  @Post()
  create(@Body() dto: CreateAccountDto) {
    return this.accountsService.create(dto);
  }
}
