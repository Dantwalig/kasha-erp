import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export enum StockAdjustmentReasonDto {
  DAMAGE = 'DAMAGE',
  LOSS = 'LOSS',
  COUNT_CORRECTION = 'COUNT_CORRECTION',
  RETURN = 'RETURN',
  OTHER = 'OTHER',
}

export class CreateAdjustmentDto {
  @IsString()
  productId: string;

  @IsString()
  locationId: string;

  @IsInt()
  delta: number; // positive or negative

  @IsEnum(StockAdjustmentReasonDto)
  reason: StockAdjustmentReasonDto;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateTransferDto {
  @IsString()
  productId: string;

  @IsString()
  fromLocationId: string;

  @IsString()
  toLocationId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
