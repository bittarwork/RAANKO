import { ForbiddenException } from '@nestjs/common';
import type { AuthContext } from '../types/auth-context';

/** Tenant id from trusted server-side auth context — never from the client body. */
export function requireTenantId(auth: AuthContext): string {
  const tenantId = auth.tenant?.tenantId;
  if (!tenantId) {
    throw new ForbiddenException('Forbidden');
  }
  return tenantId;
}
