import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/auth.decorators';
import { AUTH_CONTEXT_KEY, type AuthContext } from '../types/auth-context';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string | undefined>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) return true;

    const request = context.switchToHttp().getRequest<{
      [AUTH_CONTEXT_KEY]?: AuthContext;
    }>();
    const auth = request[AUTH_CONTEXT_KEY];
    if (!auth?.permissions.has(required)) {
      throw new ForbiddenException('Forbidden');
    }
    return true;
  }
}
