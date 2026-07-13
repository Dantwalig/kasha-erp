import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StockService } from '../../inventory/stock/stock.service';
import { CreateFromRequestDto, CreatePurchaseOrderDto, ReceiveItemDto } from './dto';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private prisma: PrismaService,
    private stockService: StockService,
  ) {}

  findAll() {
    return this.prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { supplier: true, items: { include: { product: true } } },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }

  create(dto: CreatePurchaseOrderDto) {
    return this.prisma.purchaseOrder.create({
      data: {
        supplierId: dto.supplierId,
        expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
        notes: dto.notes,
        items: {
          create: dto.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitCost: i.unitCost ?? 0,
          })),
        },
      },
      include: { items: true },
    });
  }

  async createFromRequest(requestId: string, dto: CreateFromRequestDto) {
    const pr = await this.prisma.purchaseRequest.findUnique({
      where: { id: requestId },
      include: { items: true },
    });
    if (!pr) throw new NotFoundException('Purchase request not found');
    if (pr.status !== 'APPROVED') {
      throw new BadRequestException('Only approved requests can become a purchase order');
    }

    return this.prisma.purchaseOrder.create({
      data: {
        supplierId: dto.supplierId,
        purchaseRequestId: pr.id,
        expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
        items: {
          create: pr.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitCost: 0, // fill in real supplier pricing on the PO afterward
          })),
        },
      },
      include: { items: true },
    });
  }

  async send(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new NotFoundException('Purchase order not found');
    if (po.status !== 'DRAFT') {
      throw new BadRequestException('Only draft orders can be sent');
    }
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'SENT' },
    });
  }

  async cancel(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new NotFoundException('Purchase order not found');
    if (po.status === 'RECEIVED') {
      throw new BadRequestException('Cannot cancel a fully received order');
    }
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  // Records receipt of (part of) a line item and adds the received quantity
  // straight into Inventory stock at the given location. Also rolls the
  // parent PO's status up to PARTIALLY_RECEIVED / RECEIVED.
  async receiveItem(orderId: string, dto: ReceiveItemDto) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    if (po.status === 'CANCELLED') {
      throw new BadRequestException('Cannot receive against a cancelled order');
    }

    const item = po.items.find((i) => i.id === dto.itemId);
    if (!item) throw new NotFoundException('Order item not found on this order');

    const remaining = item.quantity - item.receivedQuantity;
    if (dto.quantity > remaining) {
      throw new BadRequestException(
        `Cannot receive ${dto.quantity} - only ${remaining} remaining on this line`,
      );
    }

    await this.stockService.receiveStock(item.productId, dto.locationId, dto.quantity);

    await this.prisma.purchaseOrderItem.update({
      where: { id: item.id },
      data: { receivedQuantity: item.receivedQuantity + dto.quantity },
    });

    const refreshed = await this.prisma.purchaseOrder.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true },
    });
    const fullyReceived = refreshed.items.every(
      (i) => i.receivedQuantity >= i.quantity,
    );
    const partiallyReceived = refreshed.items.some((i) => i.receivedQuantity > 0);

    return this.prisma.purchaseOrder.update({
      where: { id: orderId },
      data: {
        status: fullyReceived
          ? 'RECEIVED'
          : partiallyReceived
            ? 'PARTIALLY_RECEIVED'
            : refreshed.status,
      },
      include: { items: { include: { product: true } }, supplier: true },
    });
  }
}
