import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportingService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const [
      products,
      openPurchaseRequests,
      openPurchaseOrders,
      openPickLists,
      invoicesOutstanding,
      billsOutstanding,
      opportunities,
      openLeads,
      activeEmployees,
      pendingLeave,
      openJobOpenings,
    ] = await Promise.all([
      this.prisma.product.findMany({
        where: { isActive: true },
        include: { stockItems: true },
      }),
      this.prisma.purchaseRequest.count({ where: { status: 'SUBMITTED' } }),
      this.prisma.purchaseOrder.count({
        where: { status: { in: ['SENT', 'PARTIALLY_RECEIVED'] } },
      }),
      this.prisma.pickList.count({
        where: { status: { in: ['PENDING', 'PICKING', 'PACKED'] } },
      }),
      this.prisma.invoice.findMany({
        where: { status: { notIn: ['PAID', 'CANCELLED'] } },
        include: { payments: true },
      }),
      this.prisma.bill.findMany({
        where: { status: { notIn: ['PAID', 'CANCELLED'] } },
        include: { payments: true },
      }),
      this.prisma.opportunity.groupBy({
        by: ['stage'],
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.lead.count({
        where: { status: { in: ['NEW', 'CONTACTED', 'QUALIFIED'] } },
      }),
      this.prisma.employee.count({ where: { status: 'ACTIVE' } }),
      this.prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.jobOpening.count({ where: { status: 'OPEN' } }),
    ]);

    // Sum of (quantity * unit cost) across all products currently on hand.
    const totalStockValue = products.reduce((sum, p) => {
      const totalQty = p.stockItems.reduce((s, si) => s + si.quantity, 0);
      return sum + totalQty * Number(p.costPrice);
    }, 0);
    const lowStockCount = products.filter((p) => {
      const totalQty = p.stockItems.reduce((s, si) => s + si.quantity, 0);
      return totalQty < p.reorderPoint;
    }).length;

    const arOutstanding = invoicesOutstanding.reduce((sum, inv) => {
      const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
      return sum + (Number(inv.amount) - paid);
    }, 0);
    const apOutstanding = billsOutstanding.reduce((sum, bill) => {
      const paid = bill.payments.reduce((s, p) => s + Number(p.amount), 0);
      return sum + (Number(bill.amount) - paid);
    }, 0);

    const pipelineByStage = opportunities.map((o) => ({
      stage: o.stage,
      count: o._count,
      value: Number(o._sum.amount ?? 0),
    }));
    const openPipelineValue = pipelineByStage
      .filter((s) => s.stage !== 'WON' && s.stage !== 'LOST')
      .reduce((sum, s) => sum + s.value, 0);

    return {
      inventory: {
        activeProducts: products.length,
        lowStockCount,
        totalStockValue,
      },
      procurement: {
        openRequests: openPurchaseRequests,
        openOrders: openPurchaseOrders,
      },
      warehouse: {
        openPickLists,
      },
      finance: {
        arOutstanding,
        apOutstanding,
      },
      crm: {
        openLeads,
        pipelineByStage,
        openPipelineValue,
      },
      hr: {
        activeEmployees,
        pendingLeave,
        openJobOpenings,
      },
    };
  }
}
