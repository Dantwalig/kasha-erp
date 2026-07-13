import { Module } from '@nestjs/common';
import { PurchaseRequestsService } from './purchase-requests.service';
import { PurchaseRequestsController } from './purchase-requests.controller';

@Module({
  controllers: [PurchaseRequestsController],
  providers: [PurchaseRequestsService],
  exports: [PurchaseRequestsService],
})
export class PurchaseRequestsModule {}
