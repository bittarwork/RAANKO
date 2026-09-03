import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class UploadDocumentDto {
  @IsString()
  @MinLength(1)
  entityType!: string;

  @IsString()
  @MinLength(1)
  entityId!: string;

  @IsOptional()
  @IsIn(['customer', 'internal'])
  visibility?: 'customer' | 'internal';

  @IsString()
  @MinLength(1)
  filename!: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  /** Optional base64 payload for local storage in development. */
  @IsOptional()
  @IsString()
  contentBase64?: string;
}
