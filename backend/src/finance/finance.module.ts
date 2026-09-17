import { Module } from '@nestjs/common';
import { AccountsModule } from './accounts/accounts.module';
import { PaymentsModule } from './payments/payments.module';
import { InvoicesModule } from './invoices/invoices.module';
import { BillsModule } from './bills/bills.module';

@Module({
  imports: [AccountsModule, PaymentsModule, InvoicesModule, BillsModule],
})
export class FinanceModule {}
