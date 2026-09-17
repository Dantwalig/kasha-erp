import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateJobOpeningDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateCandidateDto {
  @IsString()
  jobOpeningId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export enum CandidateStageDto {
  APPLIED = 'APPLIED',
  SCREENING = 'SCREENING',
  INTERVIEW = 'INTERVIEW',
  OFFER = 'OFFER',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
}

export class UpdateCandidateStageDto {
  @IsEnum(CandidateStageDto)
  stage: CandidateStageDto;
}
