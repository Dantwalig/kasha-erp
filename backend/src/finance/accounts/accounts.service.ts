import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAccountDto } from './dto';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.account.findMany({ orderBy: { code: 'asc' } });
  }

  create(dto: CreateAccountDto) {
    return this.prisma.account.create({ data: dto });
  }
}
