import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ScanService {
  constructor(private prisma: PrismaService) {}

  // Looks a product up by barcode first, falling back to SKU - simulates a
  // barcode/QR scanner feeding its decoded value straight into this lookup.
  async lookup(code: string) {
    const product = await this.prisma.product.findFirst({
      where: { OR: [{ barcode: code }, { sku: code }] },
      include: { stockItems: { include: { location: true } }, category: true },
    });
    if (!product) {
      throw new NotFoundException(`No product found for code "${code}"`);
    }
    return product;
  }
}
