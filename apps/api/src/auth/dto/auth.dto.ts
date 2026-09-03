import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  /** Optional tenant slug hint (also resolved from Host). */
  @IsOptional()
  @IsString()
  tenantSlug?: string;

  /** TOTP code when 2FA is enabled. */
  @IsOptional()
  @IsString()
  totpCode?: string;
}

export class RefreshDto {
  // Refresh uses httpOnly cookie; body unused but reserved
}

export class AcceptInvitationDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}

export class VerifyTotpDto {
  @IsString()
  code!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
