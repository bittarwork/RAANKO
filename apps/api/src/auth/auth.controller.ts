import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthSurface } from '@raanko/shared';
import { AuthService } from './auth.service';
import {
  AcceptInvitationDto,
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
  VerifyTotpDto,
} from './dto/auth.dto';
import {
  AnySurfaceAuthGuard,
  CompanyAuthGuard,
  PlatformAuthGuard,
  PortalAuthGuard,
} from '../common/guards/auth.guards';
import { CurrentAuth } from '../common/decorators/auth.decorators';
import type { AuthContext } from '../common/types/auth-context';
import { OrganizationService } from '../organization/organization.service';
import { RateLimitService } from '../common/rate-limit/rate-limit.service';
import { SwitchTenantDto } from '../phase2/dto/phase2.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
    private readonly organization: OrganizationService,
    private readonly rateLimit: RateLimitService,
  ) {}

  @Post('platform/login')
  async platformLogin(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.limitAuth(req);
    const result = await this.auth.loginPlatform(
      dto.email,
      dto.password,
      dto.totpCode,
      this.meta(req),
    );
    this.setRefreshCookie(res, result.refreshToken);
    return {
      data: {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        user: result.user,
        permissions: result.permissions,
      },
    };
  }

  @Post('company/login')
  async companyLogin(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.limitAuth(req);
    const result = await this.auth.loginCompany(
      dto.email,
      dto.password,
      dto.tenantSlug,
      this.meta(req),
    );
    this.setRefreshCookie(res, result.refreshToken);
    return {
      data: {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        user: result.user,
        permissions: result.permissions,
        tenant: result.tenant,
      },
    };
  }

  @Post('portal/login')
  async portalLogin(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.limitAuth(req);
    const result = await this.auth.loginPortal(
      dto.email,
      dto.password,
      dto.tenantSlug,
      this.meta(req),
    );
    this.setRefreshCookie(res, result.refreshToken);
    return {
      data: {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        user: result.user,
        tenant: result.tenant,
      },
    };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw = (req as Request & { cookies?: Record<string, string> }).cookies?.[
      this.auth.refreshCookieName
    ];
    const result = await this.auth.refresh(raw, this.meta(req));
    this.setRefreshCookie(res, result.refreshToken);
    return {
      data: {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        user: result.user,
        permissions: result.permissions,
        tenant: result.tenant,
      },
    };
  }

  @Post('logout')
  @UseGuards(AnySurfaceAuthGuard)
  async logout(
    @CurrentAuth() authCtx: AuthContext,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(authCtx.sessionId);
    this.clearRefreshCookie(res);
    return { data: { ok: true } };
  }

  @Post('platform/logout')
  @UseGuards(PlatformAuthGuard)
  async logoutPlatform(
    @CurrentAuth() authCtx: AuthContext,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(authCtx.sessionId);
    this.clearRefreshCookie(res);
    return { data: { ok: true } };
  }

  @Post('portal/logout')
  @UseGuards(PortalAuthGuard)
  async logoutPortal(
    @CurrentAuth() authCtx: AuthContext,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(authCtx.sessionId);
    this.clearRefreshCookie(res);
    return { data: { ok: true } };
  }

  @Get('me')
  @UseGuards(AnySurfaceAuthGuard)
  async me(
    @CurrentAuth() authCtx: AuthContext,
    @Headers('x-raanko-impersonation') impersonation?: string,
  ) {
    return this.auth.me(
      authCtx.userId,
      authCtx.authSurface,
      authCtx.membershipId,
      impersonation,
    );
  }

  @Get('platform/me')
  @UseGuards(PlatformAuthGuard)
  async mePlatform(@CurrentAuth() authCtx: AuthContext) {
    return this.auth.me(authCtx.userId, AuthSurface.PLATFORM);
  }

  @Get('portal/me')
  @UseGuards(PortalAuthGuard)
  async mePortal(@CurrentAuth() authCtx: AuthContext) {
    return this.auth.me(authCtx.userId, AuthSurface.PORTAL);
  }

  @Get('memberships')
  @UseGuards(CompanyAuthGuard)
  listMemberships(@CurrentAuth() authCtx: AuthContext) {
    return this.auth.listMemberships(authCtx.userId);
  }

  @Post('switch-tenant')
  @UseGuards(CompanyAuthGuard)
  async switchTenant(
    @CurrentAuth() authCtx: AuthContext,
    @Body() dto: SwitchTenantDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.switchTenant(
      authCtx.userId,
      authCtx.sessionId,
      dto.membershipId,
      this.meta(req),
    );
    this.setRefreshCookie(res, result.refreshToken);
    return {
      data: {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        user: result.user,
        permissions: result.permissions,
        tenant: result.tenant,
      },
    };
  }

  @Post('2fa/verify')
  @UseGuards(PlatformAuthGuard)
  async verifyTotp(
    @CurrentAuth() authCtx: AuthContext,
    @Body() dto: VerifyTotpDto,
  ) {
    const result = await this.auth.verifyTotpStub(authCtx.userId, dto.code);
    return { data: result };
  }

  @Post('invitations/accept')
  async acceptInvitation(@Body() dto: AcceptInvitationDto) {
    const result = await this.organization.acceptInvitation(dto);
    return { data: result };
  }

  /** Password reset stubs — do not enumerate accounts. */
  @Post('password/forgot')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    void dto;
    return { data: { ok: true } };
  }

  @Post('password/reset')
  resetPasswordStub(@Body() dto: ResetPasswordDto) {
    void dto;
    return { data: { ok: true } };
  }

  @Post('email/verify')
  emailVerifyStub(@Body() dto: ForgotPasswordDto) {
    void dto;
    return { data: { ok: true } };
  }

  private limitAuth(req: Request) {
    const ip = req.ip ?? 'unknown';
    this.rateLimit.consume(`auth:${ip}`, 20, 60_000);
  }

  private meta(req: Request) {
    return {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      host: req.headers.host,
    };
  }

  private setRefreshCookie(res: Response, token: string) {
    const secure = this.config.get('NODE_ENV') === 'production';
    res.cookie(this.auth.refreshCookieName, token, {
      httpOnly: true,
      secure,
      sameSite: 'lax' as const,
      path: '/api/v1/auth',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(this.auth.refreshCookieName, {
      path: '/api/v1/auth',
    });
  }
}
