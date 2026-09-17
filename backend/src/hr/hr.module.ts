import { Module } from '@nestjs/common';
import { EmployeesModule } from './employees/employees.module';
import { LeaveModule } from './leave/leave.module';
import { RecruitmentModule } from './recruitment/recruitment.module';
import { PayrollModule } from './payroll/payroll.module';

@Module({
  imports: [EmployeesModule, LeaveModule, RecruitmentModule, PayrollModule],
})
export class HrModule {}
