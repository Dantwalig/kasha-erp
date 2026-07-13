import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAdjustmentDto, CreateTransferDto } from './dto';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  // ---- Levels ----

  getLevels(locationId?: string) {
    return this.prisma.stockItem.findMany({
      where: locationId ? { locationId } : undefined,
      include: { product: true, location: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // Used by other modules (Procurement receiving, Warehouse putaway) to add
  // stock as part of a legitimate business event - not a manual correction,
  // so it doesn't go through the StockAdjustment ledger.
  async receiveStock(productId: string, locationId: string, quantity: number) {
    if (quantity <= 0) {
      throw new BadRequestException('Received quantity must be positive');
    }
    return this.prisma.$transaction((tx) =>
      this.upsertLevel(tx, productId, locationId, quantity),
    );
  }

  private async upsertLevel(
    tx: any,
    productId: string,
    locationId: string,
    delta: number,
  ) {
    const existing = await tx.stockItem.findUnique({
      where: { productId_locationId: { productId, locationId } },
    });

    const newQuantity = (existing?.quantity ?? 0) + delta;
    if (newQuantity < 0) {
      throw new BadRequestException(
        `Insufficient stock: only ${existing?.quantity ?? 0} available at this location`,
      );
    }

    return tx.stockItem.upsert({
      where: { productId_locationId: { productId, locationId } },
      update: { quantity: newQuantity },
      create: { productId, locationId, quantity: newQuantity },
    });
  }

  // ---- Adjustments ----

  findAllAdjustments() {
    return this.prisma.stockAdjustment.findMany({
      include: { product: true, location: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAdjustment(dto: CreateAdjustmentDto) {
    return this.prisma.$transaction(async (tx) => {
      await this.upsertLevel(tx, dto.productId, dto.locationId, dto.delta);
      return tx.stockAdjustment.create({ data: dto });
    });
  }

  // ---- Transfers ----

  findAllTransfers() {
    return this.prisma.stockTransfer.findMany({
      include: { product: true, fromLocation: true, toLocation: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  createTransfer(dto: CreateTransferDto) {
    if (dto.fromLocationId === dto.toLocationId) {
      throw new BadRequestException('Source and destination cannot be the same');
    }
    return this.prisma.stockTransfer.create({ data: dto });
  }

  async completeTransfer(id: string) {
    const transfer = await this.prisma.stockTransfer.findUnique({
      where: { id },
    });
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.status === 'COMPLETED') {
      throw new BadRequestException('Transfer already completed');
    }
    if (transfer.status === 'CANCELLED') {
      throw new BadRequestException('Cannot complete a cancelled transfer');
    }

    return this.prisma.$transaction(async (tx) => {
      await this.upsertLevel(
        tx,
        transfer.productId,
        transfer.fromLocationId,
        -transfer.quantity,
      );
      await this.upsertLevel(
        tx,
        transfer.productId,
        transfer.toLocationId,
        transfer.quantity,
      );
      return tx.stockTransfer.update({
        where: { id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    });
  }

  async cancelTransfer(id: string) {
    const transfer = await this.prisma.stockTransfer.findUnique({
      where: { id },
    });
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel a completed transfer');
    }
    return this.prisma.stockTransfer.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}
