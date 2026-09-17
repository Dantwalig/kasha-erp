import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateBillDto } from './dto';

@Injectable()
export class BillsService {
  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
  ) {}

  findAll() {
    return this.prisma.bill.findMany({
      include: { supplier: true, payments: true, purchaseOrder: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(dto: CreateBillDto) {
    return this.prisma.bill.create({
      data: {
        supplierId: dto.supplierId,
        purchaseOrderId: dto.purchaseOrderId,
        amount: dto.amount,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        notes: dto.notes,
        status: 'APPROVED',
      },
    });
  }

  async cancel(id: string) {
    const bill = await this.prisma.bill.findUnique({ where: { id } });
    if (!bill) throw new NotFoundException('Bill not found');
    return this.prisma.bill.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  recordPayment(id: string, amount: number, method?: string, notes?: string) {
    return this.paymentsService.payBill(id, amount, method, notes);
  }
}
