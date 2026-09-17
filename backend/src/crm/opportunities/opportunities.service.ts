import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOpportunityDto, UpdateStageDto } from './dto';

@Injectable()
export class OpportunitiesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.opportunity.findMany({
      include: {
        customer: true,
        owner: { select: { id: true, email: true, firstName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(userId: string, dto: CreateOpportunityDto) {
    return this.prisma.opportunity.create({
      data: {
        customerId: dto.customerId,
        name: dto.name,
        amount: dto.amount,
        expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined,
        notes: dto.notes,
        ownerId: userId,
      },
    });
  }

  async updateStage(id: string, dto: UpdateStageDto) {
    const opp = await this.prisma.opportunity.findUnique({ where: { id } });
    if (!opp) throw new NotFoundException('Opportunity not found');
    return this.prisma.opportunity.update({ where: { id }, data: { stage: dto.stage } });
  }
}
