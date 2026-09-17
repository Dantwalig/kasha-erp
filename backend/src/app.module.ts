import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { InventoryModule } from './inventory/inventory.module';
import { ProcurementModule } from './procurement/procurement.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { FinanceModule } from './finance/finance.module';
import { CrmModule } from './crm/crm.module';
import { HrModule } from './hr/hr.module';
import { ReportingModule } from './reporting/reporting.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    InventoryModule,
    ProcurementModule,
    WarehouseModule,
    FinanceModule,
    CrmModule,
    HrModule,
    ReportingModule,
    // Future modules (Supply Chain, Customer Service, Marketing, Field
    // Service, Manufacturing, Commerce, Workflow Automation, Notifications,
    // Audit Logs, AI & Analytics, ...) will be added here.
  ],
})
export class AppModule {}
