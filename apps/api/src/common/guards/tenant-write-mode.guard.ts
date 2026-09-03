import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AUTH_CONTEXT_KEY, type AuthContext } from '../types/auth-context';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Blocks mutating verbs when tenant write mode is read_only.
 * Applied on company routes after CompanyAuthGuard.
 */
@Injectable()
export class TenantWriteModeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      method: string;
      [AUTH_CONTEXT_KEY]?: AuthContext;
    }>();

    if (!MUTATING.has(request.method.toUpperCase())) {
      return true;
    }

    const auth = request[AUTH_CONTEXT_KEY];
    if (!auth?.tenant) return true;

    if (auth.tenant.writeMode === 'read_only') {
      throw new ForbiddenException({
        message: 'Tenant is read-only',
        code: 'TENANT_READ_ONLY',
      });
    }

    if (auth.tenant.writeMode === 'blocked') {
      throw new ForbiddenException({
        message: 'Tenant access blocked',
        code: 'TENANT_ACCESS_BLOCKED',
      });
    }

    return true;
  }
}
