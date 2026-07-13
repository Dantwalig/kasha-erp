import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSupplierDto } from './dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.supplier.findMany({ orderBy: { name: 'asc' } });
  }

  create(dto: CreateSupplierDto) {
    return this.prisma.supplier.create({ data: dto });
  }
}
