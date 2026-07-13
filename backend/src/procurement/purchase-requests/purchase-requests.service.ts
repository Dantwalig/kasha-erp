import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePurchaseRequestDto, RejectPurchaseRequestDto } from './dto';

@Injectable()
export class PurchaseRequestsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.purchaseRequest.findMany({
      include: {
        requestedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const pr = await this.prisma.purchaseRequest.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, requestedBy: true },
    });
    if (!pr) throw new NotFoundException('Purchase request not found');
    return pr;
  }

  // Created directly as SUBMITTED - a simple flow. If you need a save-as-draft
  // step later, add a `submit()` action that flips DRAFT -> SUBMITTED.
  create(userId: string, dto: CreatePurchaseRequestDto) {
    return this.prisma.purchaseRequest.create({
      data: {
        requestedById: userId,
        status: 'SUBMITTED',
        notes: dto.notes,
        items: {
          create: dto.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            notes: i.notes,
          })),
        },
      },
      include: { items: true },
    });
  }

  async approve(id: string, approverId: string) {
    const pr = await this.prisma.purchaseRequest.findUnique({ where: { id } });
    if (!pr) throw new NotFoundException('Purchase request not found');
    if (pr.status !== 'SUBMITTED') {
      throw new BadRequestException('Only submitted requests can be approved');
    }
    return this.prisma.purchaseRequest.update({
      where: { id },
      data: { status: 'APPROVED', approvedById: approverId, approvedAt: new Date() },
    });
  }

  async reject(id: string, dto: RejectPurchaseRequestDto) {
    const pr = await this.prisma.purchaseRequest.findUnique({ where: { id } });
    if (!pr) throw new NotFoundException('Purchase request not found');
    if (pr.status !== 'SUBMITTED') {
      throw new BadRequestException('Only submitted requests can be rejected');
    }
    return this.prisma.purchaseRequest.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: dto.reason },
    });
  }
}
