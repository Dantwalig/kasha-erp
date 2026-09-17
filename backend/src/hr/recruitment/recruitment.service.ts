import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCandidateDto, CreateJobOpeningDto, UpdateCandidateStageDto } from './dto';

@Injectable()
export class RecruitmentService {
  constructor(private prisma: PrismaService) {}

  findAllJobs() {
    return this.prisma.jobOpening.findMany({
      include: { candidates: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  createJob(dto: CreateJobOpeningDto) {
    return this.prisma.jobOpening.create({ data: dto });
  }

  async closeJob(id: string) {
    await this.prisma.jobOpening.findUniqueOrThrow({ where: { id } });
    return this.prisma.jobOpening.update({ where: { id }, data: { status: 'CLOSED' } });
  }

  createCandidate(dto: CreateCandidateDto) {
    return this.prisma.candidate.create({ data: dto });
  }

  async updateCandidateStage(id: string, dto: UpdateCandidateStageDto) {
    const candidate = await this.prisma.candidate.findUnique({ where: { id } });
    if (!candidate) throw new NotFoundException('Candidate not found');
    return this.prisma.candidate.update({ where: { id }, data: { stage: dto.stage } });
  }
}
