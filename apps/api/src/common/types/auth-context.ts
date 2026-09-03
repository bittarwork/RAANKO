import type { AuthSurface, WriteMode } from '@raanko/shared';

/** Trusted auth context attached to each authenticated request. */
export interface AuthContext {
  userId: string;
  sessionId: string;
  authSurface: AuthSurface;
  email: string;
  platformRole?: string;
  membershipId?: string;
  roleId?: string;
  roleKey?: string;
  permissions: Set<string>;
  /** null = all branches; undefined = not company surface */
  branchIds?: string[] | null;
  customerId?: string;
  tenant?: TenantContext;
}

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  writeMode: WriteMode;
  subscriptionStatus: string;
  entitlements: Set<string>;
  displayName: string;
}

export const AUTH_CONTEXT_KEY = 'authContext';
export const REFRESH_COOKIE_NAME = 'raanko_refresh';
