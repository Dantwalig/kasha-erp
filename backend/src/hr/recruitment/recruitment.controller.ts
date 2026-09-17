import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { RecruitmentService } from './recruitment.service';
import { CreateCandidateDto, CreateJobOpeningDto, UpdateCandidateStageDto } from './dto';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

@Controller('hr/recruitment')
export class RecruitmentController {
  constructor(private recruitmentService: RecruitmentService) {}

  @RequirePermissions('hr:read')
  @Get('jobs')
  findAllJobs() {
    return this.recruitmentService.findAllJobs();
  }

  @RequirePermissions('hr:write')
  @Post('jobs')
  createJob(@Body() dto: CreateJobOpeningDto) {
    return this.recruitmentService.createJob(dto);
  }

  @RequirePermissions('hr:write')
  @Patch('jobs/:id/close')
  closeJob(@Param('id') id: string) {
    return this.recruitmentService.closeJob(id);
  }

  @RequirePermissions('hr:write')
  @Post('candidates')
  createCandidate(@Body() dto: CreateCandidateDto) {
    return this.recruitmentService.createCandidate(dto);
  }

  @RequirePermissions('hr:write')
  @Patch('candidates/:id/stage')
  updateCandidateStage(@Param('id') id: string, @Body() dto: UpdateCandidateStageDto) {
    return this.recruitmentService.updateCandidateStage(id, dto);
  }
}
