import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePayrollRecordDto {
  @IsString()
  employeeId: string;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  grossPay: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deductions?: number;
}
