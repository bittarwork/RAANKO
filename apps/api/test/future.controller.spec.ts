import { describe, it, expect } from 'vitest';
import { ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { AuthSurface, FeatureKeys } from '@raanko/shared';
import { FutureController } from '../src/future/future.controller';
import type { AuthContext } from '../src/common/types/auth-context';

function companyAuth(entitlements: string[]): AuthContext {
  return {
    userId: 'u1',
    sessionId: 's1',
    authSurface: AuthSurface.COMPANY,
    email: 'ops@acme.test',
    permissions: new Set(),
    tenant: {
      tenantId: 'tenant-a',
      tenantSlug: 'acme',
      writeMode: 'full',
      subscriptionStatus: 'active',
      entitlements: new Set(entitlements),
      displayName: 'Acme',
    },
  };
}

describe('FutureController entitlement gate', () => {
  const controller = new FutureController();

  it('returns 403 FEATURE_NOT_ENTITLED for warehouse without entitlement', () => {
    try {
      controller.warehouse(companyAuth([]));
      expect.fail('expected forbidden');
    } catch (err) {
      expect(err).toBeInstanceOf(ForbiddenException);
      expect((err as ForbiddenException).getResponse()).toMatchObject({
        code: 'FEATURE_NOT_ENTITLED',
      });
    }
  });

  it('returns 501 FUTURE_MODULE_NOT_IMPLEMENTED when entitled', () => {
    try {
      controller.warehouse(companyAuth([FeatureKeys.WAREHOUSE]));
      expect.fail('expected not implemented');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(HttpStatus.NOT_IMPLEMENTED);
      expect((err as HttpException).getResponse()).toMatchObject({
        code: 'FUTURE_MODULE_NOT_IMPLEMENTED',
        module: 'warehouse',
      });
    }
  });
});
