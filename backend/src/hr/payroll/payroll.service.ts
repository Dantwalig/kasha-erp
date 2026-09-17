import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePayrollRecordDto } from './dto';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.payrollRecord.findMany({
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(dto: CreatePayrollRecordDto) {
    const deductions = dto.deductions ?? 0;
    return this.prisma.payrollRecord.create({
      data: {
        employeeId: dto.employeeId,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        grossPay: dto.grossPay,
        deductions,
        netPay: dto.grossPay - deductions,
      },
    });
  }

  async markPaid(id: string) {
    const record = await this.prisma.payrollRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Payroll record not found');
    return this.prisma.payrollRecord.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date() },
    });
  }
}
