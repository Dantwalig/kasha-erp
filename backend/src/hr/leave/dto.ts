import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export enum LeaveTypeDto {
  ANNUAL = 'ANNUAL',
  SICK = 'SICK',
  UNPAID = 'UNPAID',
  OTHER = 'OTHER',
}

export class CreateLeaveRequestDto {
  @IsString()
  employeeId: string;

  @IsEnum(LeaveTypeDto)
  type: LeaveTypeDto;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
