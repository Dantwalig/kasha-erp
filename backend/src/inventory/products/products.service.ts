import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string) {
    const products = await this.prisma.product.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: { category: true, stockItems: true },
      orderBy: { createdAt: 'desc' },
    });

    return products.map((p) => ({
      ...p,
      totalStock: p.stockItems.reduce((sum, si) => sum + si.quantity, 0),
      belowReorderPoint:
        p.stockItems.reduce((sum, si) => sum + si.quantity, 0) < p.reorderPoint,
    }));
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        stockItems: { include: { location: true } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.prisma.product.findUniqueOrThrow({ where: { id } });
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.prisma.product.findUniqueOrThrow({ where: { id } });
    // Soft delete: keep history intact (stock ledger, transfers) instead of
    // hard-deleting, since Procurement/Warehouse will reference products later.
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
