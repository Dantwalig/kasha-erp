import { Controller, Get } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('reporting')
export class ReportingController {
  constructor(private reportingService: ReportingService) {}

  @RequirePermissions('reporting:read')
  @Get('overview')
  getOverview() {
    return this.reportingService.getOverview();
  }
}
