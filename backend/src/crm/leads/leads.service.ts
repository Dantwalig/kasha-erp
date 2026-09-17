import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeadDto, UpdateLeadStatusDto } from './dto';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.lead.findMany({
      include: { owner: { select: { id: true, email: true, firstName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(userId: string, dto: CreateLeadDto) {
    return this.prisma.lead.create({
      data: { ...dto, ownerId: userId },
    });
  }

  async updateStatus(id: string, dto: UpdateLeadStatusDto) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');
    if (lead.status === 'CONVERTED') {
      throw new BadRequestException('Cannot change status of a converted lead');
    }
    return this.prisma.lead.update({ where: { id }, data: { status: dto.status } });
  }

  // Turns a qualified lead into a real Customer record - a one-way action,
  // mirroring how a sales pipeline typically works.
  async convert(id: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');
    if (lead.status === 'CONVERTED') {
      throw new BadRequestException('Lead already converted');
    }

    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          name: lead.company || lead.name,
          email: lead.email,
          phone: lead.phone,
        },
      });
      await tx.lead.update({
        where: { id },
        data: { status: 'CONVERTED', convertedCustomerId: customer.id },
      });
      return customer;
    });
  }
}
