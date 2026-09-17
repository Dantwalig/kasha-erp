import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeaveRequestDto } from './dto';

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.leaveRequest.findMany({
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(dto: CreateLeaveRequestDto) {
    return this.prisma.leaveRequest.create({
      data: {
        employeeId: dto.employeeId,
        type: dto.type,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        reason: dto.reason,
      },
    });
  }

  async approve(id: string, approverId: string) {
    const request = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Leave request not found');
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Only pending requests can be approved');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.leaveRequest.update({
        where: { id },
        data: { status: 'APPROVED', approvedById: approverId },
      });
      // Reflect on the employee record too, so it's visible at a glance.
      await tx.employee.update({
        where: { id: request.employeeId },
        data: { status: 'ON_LEAVE' },
      });
      return updated;
    });
  }

  async reject(id: string) {
    const request = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Leave request not found');
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Only pending requests can be rejected');
    }
    return this.prisma.leaveRequest.update({ where: { id }, data: { status: 'REJECTED' } });
  }
}
