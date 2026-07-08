import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.role.findMany({
      include: { permissions: { include: { permission: true } } },
    });
  }

  create(dto: CreateRoleDto) {
    return this.prisma.role.create({ data: dto });
  }

  async assignPermission(roleId: string, permissionId: string) {
    await this.prisma.role.findUniqueOrThrow({ where: { id: roleId } });
    await this.prisma.permission.findUniqueOrThrow({ where: { id: permissionId } });

    return this.prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId } },
      update: {},
      create: { roleId, permissionId },
    });
  }

  removePermission(roleId: string, permissionId: string) {
    return this.prisma.rolePermission.delete({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
  }
}
