import { Module } from '@nestjs/common';
import { SuppliersModule } from './suppliers/suppliers.module';
import { PurchaseRequestsModule } from './purchase-requests/purchase-requests.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';

@Module({
  imports: [SuppliersModule, PurchaseRequestsModule, PurchaseOrdersModule],
})
export class ProcurementModule {}
