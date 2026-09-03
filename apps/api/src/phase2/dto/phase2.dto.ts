import { IsArray, IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpsertCustomDomainDto {
  @IsString()
  @MinLength(3)
  hostname!: string;
}

export class UpsertEmailSenderDto {
  @IsEmail()
  fromEmail!: string;

  @IsString()
  @MinLength(1)
  fromName!: string;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}

export class CreateWebhookDto {
  @IsString()
  @MinLength(8)
  url!: string;

  @IsArray()
  @IsString({ each: true })
  events!: string[];
}

export class UpdateWebhookDto {
  @IsOptional()
  @IsString()
  @MinLength(8)
  url?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  events?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateConsolidationDto {
  @IsString()
  @MinLength(1)
  masterShipmentId!: string;

  @IsArray()
  @IsString({ each: true })
  houseShipmentIds!: string[];
}

export class ImpersonateDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SwitchTenantDto {
  @IsString()
  @MinLength(1)
  membershipId!: string;
}

export class PatchPlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateDocumentVersionDto {
  @IsOptional()
  @IsString()
  storageKey?: string;

  @IsOptional()
  @IsString()
  contentBase64?: string;
}
