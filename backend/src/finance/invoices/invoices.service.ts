import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateInvoiceDto } from './dto';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
  ) {}

  findAll() {
    return this.prisma.invoice.findMany({
      include: { payments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(dto: CreateInvoiceDto) {
    return this.prisma.invoice.create({
      data: {
        customerName: dto.customerName,
        amount: dto.amount,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        notes: dto.notes,
        status: 'SENT',
      },
    });
  }

  async cancel(id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return this.prisma.invoice.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  recordPayment(id: string, amount: number, method?: string, notes?: string) {
    return this.paymentsService.payInvoice(id, amount, method, notes);
  }
}
