import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateQuoteRequestDto {
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
  cargoDescription?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateQuoteRequestDto {
  @IsOptional()
  @IsIn(['received', 'in_review', 'quoted', 'closed'])
  status?: 'received' | 'in_review' | 'quoted' | 'closed';

  @IsOptional()
  @IsString()
  notes?: string;
}

export class QuoteLineInputDto {
  @IsString()
  @MinLength(1)
  description!: string;

  @IsOptional()
  @IsString()
  chargeCode?: string;

  @Type(() => Number)
  @IsNumber()
  buyAmount!: number;

  @Type(() => Number)
  @IsNumber()
  sellAmount!: number;
}

export class CreateQuoteDto {
  @IsOptional()
  @IsString()
  quoteRequestId?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteLineInputDto)
  lines!: QuoteLineInputDto[];
}

export class PortalRfqDto {
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
  cargoDescription?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
