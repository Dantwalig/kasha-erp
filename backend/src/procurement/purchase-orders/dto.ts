import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class OrderItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitCost?: number;
}

export class CreatePurchaseOrderDto {
  @IsString()
  supplierId: string;

  @IsOptional()
  @IsDateString()
  expectedDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

export class CreateFromRequestDto {
  @IsString()
  supplierId: string;

  @IsOptional()
  @IsDateString()
  expectedDate?: string;
}

export class ReceiveItemDto {
  @IsString()
  itemId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  locationId: string;
}
