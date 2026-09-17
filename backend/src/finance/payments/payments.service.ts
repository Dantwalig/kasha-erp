import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.payment.findMany({
      include: { invoice: true, bill: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Records an incoming payment against an Invoice and rolls its status to
  // PAID once the sum of payments meets or exceeds the invoice amount.
  async payInvoice(invoiceId: string, amount: number, method?: string, notes?: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Cannot record a payment on a cancelled invoice');
    }

    const payment = await this.prisma.payment.create({
      data: { direction: 'INCOMING', amount, method, notes, invoiceId },
    });

    const totalPaid =
      invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0) + amount;

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: totalPaid >= Number(invoice.amount) ? 'PAID' : invoice.status },
    });

    return payment;
  }

  // Same idea for outgoing payments against a Bill (AP).
  async payBill(billId: string, amount: number, method?: string, notes?: string) {
    const bill = await this.prisma.bill.findUnique({
      where: { id: billId },
      include: { payments: true },
    });
    if (!bill) throw new NotFoundException('Bill not found');
    if (bill.status === 'CANCELLED') {
      throw new BadRequestException('Cannot record a payment on a cancelled bill');
    }

    const payment = await this.prisma.payment.create({
      data: { direction: 'OUTGOING', amount, method, notes, billId },
    });

    const totalPaid =
      bill.payments.reduce((sum, p) => sum + Number(p.amount), 0) + amount;

    await this.prisma.bill.update({
      where: { id: billId },
      data: { status: totalPaid >= Number(bill.amount) ? 'PAID' : bill.status },
    });

    return payment;
  }
}
