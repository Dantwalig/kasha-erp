import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StockService } from '../../inventory/stock/stock.service';
import { CreatePickListDto, PickItemDto, ShipDto } from './dto';

@Injectable()
export class PickListsService {
  constructor(
    private prisma: PrismaService,
    private stockService: StockService,
  ) {}

  findAll() {
    return this.prisma.pickList.findMany({
      include: { location: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const pl = await this.prisma.pickList.findUnique({
      where: { id },
      include: { location: true, items: { include: { product: true } } },
    });
    if (!pl) throw new NotFoundException('Pick list not found');
    return pl;
  }

  create(dto: CreatePickListDto) {
    return this.prisma.pickList.create({
      data: {
        locationId: dto.locationId,
        destination: dto.destination,
        notes: dto.notes,
        items: {
          create: dto.items.map((i) => ({
            productId: i.productId,
            quantityRequested: i.quantity,
          })),
        },
      },
      include: { items: true },
    });
  }

  // Picking a quantity for a line item immediately removes it from stock at
  // the pick list's location - mirrors a warehouse worker physically pulling
  // it off the shelf and scanning it.
  async pickItem(pickListId: string, dto: PickItemDto) {
    const pl = await this.prisma.pickList.findUnique({
      where: { id: pickListId },
      include: { items: true },
    });
    if (!pl) throw new NotFoundException('Pick list not found');
    if (pl.status === 'CANCELLED' || pl.status === 'SHIPPED') {
      throw new BadRequestException(`Cannot pick items on a ${pl.status.toLowerCase()} pick list`);
    }

    const item = pl.items.find((i) => i.id === dto.itemId);
    if (!item) throw new NotFoundException('Item not found on this pick list');

    const remaining = item.quantityRequested - item.quantityPicked;
    if (dto.quantity > remaining) {
      throw new BadRequestException(
        `Cannot pick ${dto.quantity} - only ${remaining} remaining on this line`,
      );
    }

    await this.stockService.pickStock(item.productId, pl.locationId, dto.quantity);

    await this.prisma.pickListItem.update({
      where: { id: item.id },
      data: { quantityPicked: item.quantityPicked + dto.quantity },
    });

    return this.prisma.pickList.update({
      where: { id: pickListId },
      data: { status: 'PICKING' },
      include: { items: { include: { product: true } }, location: true },
    });
  }

  async pack(id: string) {
    const pl = await this.prisma.pickList.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!pl) throw new NotFoundException('Pick list not found');

    const fullyPicked = pl.items.every((i) => i.quantityPicked >= i.quantityRequested);
    if (!fullyPicked) {
      throw new BadRequestException('All items must be fully picked before packing');
    }

    return this.prisma.pickList.update({
      where: { id },
      data: { status: 'PACKED' },
    });
  }

  async ship(id: string, dto: ShipDto) {
    const pl = await this.prisma.pickList.findUnique({ where: { id } });
    if (!pl) throw new NotFoundException('Pick list not found');
    if (pl.status !== 'PACKED') {
      throw new BadRequestException('Only packed orders can be shipped');
    }

    return this.prisma.pickList.update({
      where: { id },
      data: {
        status: 'SHIPPED',
        shippedAt: new Date(),
        trackingNumber: dto.trackingNumber,
      },
    });
  }

  async cancel(id: string) {
    const pl = await this.prisma.pickList.findUnique({ where: { id } });
    if (!pl) throw new NotFoundException('Pick list not found');
    if (pl.status === 'SHIPPED') {
      throw new BadRequestException('Cannot cancel a shipped order');
    }
    return this.prisma.pickList.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}
