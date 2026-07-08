import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLocationDto } from './dto';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.location.findMany({ orderBy: { name: 'asc' } });
  }

  create(dto: CreateLocationDto) {
    return this.prisma.location.create({ data: dto });
  }
}
