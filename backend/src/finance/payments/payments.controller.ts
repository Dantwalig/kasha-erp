import { Controller, Get } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

@Controller('finance/payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @RequirePermissions('finance:read')
  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }
}
