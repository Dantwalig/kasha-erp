import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmployeeDto } from './dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.employee.findMany({
      include: { manager: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { manager: true, reports: true, leaveRequests: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  create(dto: CreateEmployeeDto) {
    return this.prisma.employee.create({
      data: {
        ...dto,
        hireDate: dto.hireDate ? new Date(dto.hireDate) : undefined,
      },
    });
  }

  async setStatus(id: string, status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED') {
    await this.prisma.employee.findUniqueOrThrow({ where: { id } });
    return this.prisma.employee.update({ where: { id }, data: { status } });
  }
}
