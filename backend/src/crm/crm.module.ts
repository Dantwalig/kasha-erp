import { Module } from '@nestjs/common';
import { LeadsModule } from './leads/leads.module';
import { CustomersModule } from './customers/customers.module';
import { OpportunitiesModule } from './opportunities/opportunities.module';

@Module({
  imports: [LeadsModule, CustomersModule, OpportunitiesModule],
})
export class CrmModule {}
