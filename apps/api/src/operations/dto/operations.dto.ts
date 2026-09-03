import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { SHIPMENT_STATUSES } from '../shipment-status';

export class CreateBookingDto {
  @IsString()
  quoteId!: string;

  @IsOptional()
  @IsBoolean()
  createShipment?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CargoItemDto {
  @IsString()
  @MinLength(1)
  description!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  weightKg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  volumeCbm?: number;
}

export class ShipmentPartyDto {
  @IsIn(['shipper', 'consignee', 'notify'])
  role!: 'shipper' | 'consignee' | 'notify';

  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class ShipmentContainerDto {
  @IsOptional()
  @IsString()
  containerNo?: string;

  @IsOptional()
  @IsString()
  containerType?: string;

  @IsOptional()
  @IsString()
  sealNo?: string;
}

export class CreateShipmentDto {
  @IsOptional()
  @IsString()
  quoteId?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  origin?: string;

  @IsOptional()
  @IsString()
  destination?: string;

  @IsOptional()
  @IsString()
  mode?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CargoItemDto)
  cargoItems?: CargoItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShipmentPartyDto)
  parties?: ShipmentPartyDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShipmentContainerDto)
  containers?: ShipmentContainerDto[];
}

export class ChangeShipmentStatusDto {
  @IsIn([...SHIPMENT_STATUSES])
  status!: (typeof SHIPMENT_STATUSES)[number];
}

export class CreateTrackingEventDto {
  @IsString()
  @MinLength(1)
  status!: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsString()
  occurredAt?: string;
}
