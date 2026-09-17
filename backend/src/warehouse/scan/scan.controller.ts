import { Controller, Get, Query } from '@nestjs/common';
import { ScanService } from './scan.service';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

@Controller('warehouse/scan')
export class ScanController {
  constructor(private scanService: ScanService) {}

  @RequirePermissions('warehouse:read')
  @Get()
  lookup(@Query('code') code: string) {
    return this.scanService.lookup(code);
  }
}
